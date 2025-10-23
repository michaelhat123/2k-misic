const { app, BrowserWindow, Menu, shell, ipcMain, dialog, Tray } = require('electron')
const path = require('path')
const fs = require('fs')
let chokidar = null
let tray = null
try {
  chokidar = require('chokidar')
} catch (_) {
  // Silent fail - will use fs.watch
}

// Better development detection
const isDev = process.env.NODE_ENV === 'development' ||
  process.env.ELECTRON_IS_DEV === '1' ||
  !app.isPackaged

// Keep a global reference of the window object
let mainWindow

// Track current playback state for taskbar buttons
// This is the CACHE of renderer state, NOT the source of truth
let currentPlaybackState = {
  isPlaying: false,
  hasTrack: false
}

// Instant updates - no throttling needed

// Native module loading
let nativeEqualizer = null
function loadNativeEqualizer() {
  try {
    const modulePath = path.resolve(__dirname, '..', 'native', 'build', 'Release', 'audio_equalizer.node')
    if (fs.existsSync(modulePath)) {
      nativeEqualizer = require(modulePath)
      return true
    } else {
      return false
    }
  } catch (error) {
    return false
  }
}

// Library watcher state
let libraryWatcher = null
let libraryWatchDir = null
let batchTimer = null
let pendingBatch = { added: [], removed: [], changed: [] }
const BATCH_DELAY_MS = 600

function enqueueLibraryChange(type, filePath) {
  if (!mainWindow || !filePath) return
  const ext = path.extname(filePath).toLowerCase()
  const supported = ['.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg']
  if (!supported.includes(ext)) return

  // Deduplicate within batch
  const lists = pendingBatch
  // Remove from other lists if present to avoid conflicts
  lists.added = lists.added.filter(p => p !== filePath)
  lists.removed = lists.removed.filter(p => p !== filePath)
  lists.changed = lists.changed.filter(p => p !== filePath)

  if (type === 'add') lists.added.push(filePath)
  else if (type === 'unlink') lists.removed.push(filePath)
  else lists.changed.push(filePath)

  if (batchTimer) clearTimeout(batchTimer)
  batchTimer = setTimeout(() => {
    if (lists.added.length || lists.removed.length || lists.changed.length) {
      mainWindow.webContents.send('library:changed', { ...lists })
    }
    pendingBatch = { added: [], removed: [], changed: [] }
    batchTimer = null
  }, BATCH_DELAY_MS)
}

// ===== Settings persistence for library folder =====
const settingsFile = () => path.join(app.getPath('userData'), 'settings.json')

function getSavedSettings() {
  try {
    const p = settingsFile()
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8')
      return JSON.parse(raw)
    }
  } catch (e) {
    // Silent fail
  }
  return {}
}

function saveSettings(next) {
  try {
    const p = settingsFile()
    fs.mkdirSync(path.dirname(p), { recursive: true })
    fs.writeFileSync(p, JSON.stringify(next, null, 2))
  } catch (e) {
    // Silent fail
  }
}

ipcMain.handle('library:getFolder', async () => {
  const s = getSavedSettings()
  return s.libraryFolder || null
})

ipcMain.handle('library:setFolder', async (_event, dir) => {
  try {
    if (!dir || !fs.existsSync(dir)) throw new Error('Invalid directory')
    const current = getSavedSettings()
    const next = { ...current, libraryFolder: dir }
    saveSettings(next)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
})

// Library watch controls (Spotify-like real-time updates)
ipcMain.handle('library:startWatch', async (_event, dir) => {
  try {
    if (!dir || !fs.existsSync(dir)) throw new Error('Invalid directory')
    await startLibraryWatch(dir)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
})

ipcMain.handle('library:stopWatch', async () => {
  try {
    await stopLibraryWatch()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
})

async function startLibraryWatch(dir) {
  await stopLibraryWatch()
  libraryWatchDir = dir

  if (chokidar) {
    libraryWatcher = chokidar.watch(dir, {
      ignored: /(^|[\/\\])\../, // ignore dotfiles
      ignoreInitial: true,
      persistent: true,
      depth: 5,
    })
    libraryWatcher
      .on('add', (p) => enqueueLibraryChange('add', p))
      .on('unlink', (p) => enqueueLibraryChange('unlink', p))
      .on('change', (p) => enqueueLibraryChange('change', p))
  } else {
    // Fallback: fs.watch (non-recursive on some platforms)
    libraryWatcher = fs.watch(dir, { recursive: true }, (eventType, filename) => {
      if (!filename) return
      const full = path.join(dir, filename)
      if (eventType === 'rename') {
        // Could be add or unlink; stat to decide
        try {
          if (fs.existsSync(full)) enqueueLibraryChange('add', full)
          else enqueueLibraryChange('unlink', full)
        } catch (_) { }
      } else {
        enqueueLibraryChange('change', full)
      }
    })
  }
}

async function stopLibraryWatch() {
  if (libraryWatcher) {
    try {
      if (typeof libraryWatcher.close === 'function') {
        await libraryWatcher.close()
      } else if (typeof libraryWatcher === 'object' && libraryWatcher.removeAllListeners) {
        libraryWatcher.removeAllListeners()
      }
    } catch (e) {
      // Silent fail
    }
  }
  libraryWatcher = null
  libraryWatchDir = null
  if (batchTimer) {
    clearTimeout(batchTimer)
    batchTimer = null
  }
  pendingBatch = { added: [], removed: [], changed: [] }
}

function createWindow() {
  // Always create full-size window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Remove default frame for integrated controls
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden', // macOS style
    backgroundColor: '#0f0f23', // Dark background like Spotify
    show: false, // Don't show until ready
    icon: path.join(__dirname, '../Frontend/public/256.ico'), // App icon - using new 256px ICO
    vibrancy: process.platform === 'darwin' ? 'dark' : undefined, // macOS vibrancy
    webPreferences: {
      nodeIntegration: false, // Security: disable node integration
      contextIsolation: true, // Security: enable context isolation
      enableRemoteModule: false, // Security: disable remote module
      preload: path.join(__dirname, 'preload.js'), // Preload script
      webSecurity: !isDev // Disable web security in dev mode only
    }
  })

  // Load the app
  if (isDev) {
    // Development: load from Next.js dev server
    const devUrl = 'http://localhost:3000'

    mainWindow.webContents.on('did-fail-load', () => {
      // Try to reload after a delay
      setTimeout(() => {
        mainWindow.loadURL(devUrl)
      }, 3000)
    })

    // Load the URL
    mainWindow.loadURL(devUrl)

    // Open DevTools in development
    mainWindow.webContents.openDevTools()
  } else {
    // Production: load from built files
    const prodPath = path.join(__dirname, '../Frontend/out/index.html')
    mainWindow.loadFile(prodPath)
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()

    // Focus the window
    if (isDev) {
      mainWindow.focus()
    }

    // Setup thumbnail toolbar buttons (Windows only)
    setTimeout(() => {
      setupThumbarButtons()
    }, 1000)
  })

  // Intercept close event to hide to tray instead
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault()
      mainWindow.hide()
      return false
    }
  })

  // Re-register thumbbar buttons when window is shown (e.g., from tray)
  mainWindow.on('show', () => {
    setupThumbarButtons()
  })
  
  mainWindow.on('restore', () => {
    setupThumbarButtons()
  })

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Handle external links - open in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Prevent navigation to external sites (including OAuth)
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001'
    ]

    // Allow navigation to local dev servers only
    if (!allowedOrigins.includes(parsedUrl.origin)) {
      event.preventDefault()
      shell.openExternal(navigationUrl)
    }
  })
}

// Instant Windows taskbar button updates
function setupThumbarButtons() {
  if (process.platform !== 'win32' || !mainWindow) return
  
  const iconPath = path.join(__dirname, '../Frontend/public')
  mainWindow.setThumbarButtons([
    {
      tooltip: 'Previous',
      icon: path.join(iconPath, 'skipback.png'),
      flags: currentPlaybackState.hasTrack ? [] : ['disabled'],
      click: () => mainWindow.webContents.send('media-control', 'previous')
    },
    {
      tooltip: currentPlaybackState.isPlaying ? 'Pause' : 'Play',
      icon: path.join(iconPath, currentPlaybackState.isPlaying ? 'pause.png' : 'play.png'),
      flags: currentPlaybackState.hasTrack ? [] : ['disabled'],
      click: () => mainWindow.webContents.send('media-control', 'play-pause')
    },
    {
      tooltip: 'Next',
      icon: path.join(iconPath, 'skipfwd.png'),
      flags: currentPlaybackState.hasTrack ? [] : ['disabled'],
      click: () => mainWindow.webContents.send('media-control', 'next')
    }
  ])
}

function createTray() {

  // Use 32x32 PNG for tray
  const trayIconPath = path.join(__dirname, '../Frontend/public/32.ico')

  try {
    tray = new Tray(trayIconPath)

    const contextMenu = Menu.buildFromTemplate([
      {
        label: '2k Music',
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Show App',
        click: () => {
          if (mainWindow) {
            mainWindow.show()
            mainWindow.focus()
          }
        }
      },
      {
        label: 'Hide to Tray',
        click: () => {
          if (mainWindow) {
            mainWindow.hide()
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true
          app.quit()
        }
      }
    ])

    tray.setToolTip('2k Music')
    tray.setContextMenu(contextMenu)

    // Single click to show the app
    tray.on('click', () => {
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
      }
    })

    // Double click also shows the app (for consistency)
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show()
        mainWindow.focus()
      }
    })

  } catch (error) {
    // Silent fail
  }
}

// Native Equalizer IPC Handlers
ipcMain.handle('equalizer:initialize', async (event) => {
  try {
    if (!nativeEqualizer) {
      const loaded = loadNativeEqualizer()
      if (!loaded) return false
    }

    // Initialize with default sample rate
    const success = nativeEqualizer.initialize(44100)
    return success
  } catch (error) {
    return false
  }
})

ipcMain.handle('equalizer:setBandGain', async (event, bandIndex, gain) => {
  try {
    if (!nativeEqualizer) return false
    nativeEqualizer.setBandGain(bandIndex, gain)
    return true
  } catch (error) {
    return false
  }
})

ipcMain.handle('equalizer:getBandGain', async (event, bandIndex) => {
  try {
    if (!nativeEqualizer) return 0
    return nativeEqualizer.getBandGain(bandIndex)
  } catch (error) {
    return 0
  }
})

ipcMain.handle('equalizer:applyPreset', async (event, presetName) => {
  try {
    if (!nativeEqualizer) return false
    nativeEqualizer.applyPreset(presetName)
    return true
  } catch (error) {
    return false
  }
})

ipcMain.handle('equalizer:setEnabled', async (event, enabled) => {
  try {
    if (!nativeEqualizer) return false
    nativeEqualizer.setEnabled(enabled)
    return true
  } catch (error) {
    return false
  }
})

ipcMain.handle('equalizer:isAvailable', async (event) => {
  return nativeEqualizer !== null
})

// System Equalizer IPC Handlers
ipcMain.handle('systemEqualizer:initialize', async (event) => {
  try {
    if (!nativeEqualizer) {
      const loaded = loadNativeEqualizer()
      if (!loaded) return false
    }

    // Initialize system audio hook
    const success = nativeEqualizer.initializeSystemHook()
    return success
  } catch (error) {
    return false
  }
})

ipcMain.handle('systemEqualizer:startCapture', async (event) => {
  try {
    if (!nativeEqualizer) return false
    const success = nativeEqualizer.startSystemCapture()
    return success
  } catch (error) {
    return false
  }
})

ipcMain.handle('systemEqualizer:stopCapture', async (event) => {
  try {
    if (!nativeEqualizer) return false
    const success = nativeEqualizer.stopSystemCapture()
    return success
  } catch (error) {
    return false
  }
})

ipcMain.handle('systemEqualizer:isCapturing', async (event) => {
  try {
    if (!nativeEqualizer) return false
    return nativeEqualizer.isSystemCapturing()
  } catch (error) {
    return false
  }
})

ipcMain.handle('systemEqualizer:setBandGain', async (event, bandIndex, gain) => {
  try {
    if (!nativeEqualizer) return false
    nativeEqualizer.setSystemEQBandGain(bandIndex, gain)
    return true
  } catch (error) {
    return false
  }
})

ipcMain.handle('systemEqualizer:getBandGain', async (event, bandIndex) => {
  try {
    if (!nativeEqualizer) return 0
    return nativeEqualizer.getSystemEQBandGain(bandIndex)
  } catch (error) {
    return 0
  }
})

ipcMain.handle('systemEqualizer:applyPreset', async (event, presetName) => {
  try {
    if (!nativeEqualizer) return false
    nativeEqualizer.applySystemEQPreset(presetName)
    return true
  } catch (error) {
    return false
  }
})

ipcMain.handle('systemEqualizer:setEnabled', async (event, enabled) => {
  try {
    if (!nativeEqualizer) return false
    nativeEqualizer.setSystemEQEnabled(enabled)
    return true
  } catch (error) {
    return false
  }
})

ipcMain.handle('systemEqualizer:isAvailable', async (event) => {
  try {
    if (!nativeEqualizer) return false
    // Check if system audio functions are available
    return typeof nativeEqualizer.initializeSystemHook === 'function'
  } catch (error) {
    return false
  }
})

// Instant taskbar sync with renderer state - only update if changed
ipcMain.on('player:state-changed', (event, state) => {
  if (process.platform !== 'win32') return
  
  const oldIsPlaying = currentPlaybackState.isPlaying
  const oldHasTrack = currentPlaybackState.hasTrack
  
  currentPlaybackState.isPlaying = state.isPlaying
  currentPlaybackState.hasTrack = !!state.currentTrack
  
  // Only update if something actually changed
  if (oldIsPlaying !== currentPlaybackState.isPlaying || oldHasTrack !== currentPlaybackState.hasTrack) {
    setupThumbarButtons()
  }
})

ipcMain.on('player:track-changed', (event, track) => {
  if (process.platform !== 'win32') return
  
  const oldHasTrack = currentPlaybackState.hasTrack
  currentPlaybackState.hasTrack = !!track
  
  // Only update if changed
  if (oldHasTrack !== currentPlaybackState.hasTrack) {
    setupThumbarButtons()
  }
})

// APO System Equalizer IPC Handlers
ipcMain.handle('apo:detectInstallation', async (event) => {
  try {
    const apoPath = path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'EqualizerAPO')
    const configPath = path.join(apoPath, 'config', '2k-music-eq.txt')

    // Check for Editor.exe (the main APO executable) instead of EqualizerAPO.exe
    const editorPath = path.join(apoPath, 'Editor.exe')
    const configDir = path.join(apoPath, 'config')

    const available = fs.existsSync(editorPath) && fs.existsSync(configDir)

    return {
      available,
      apoPath: available ? apoPath : '',
      configPath: available ? configPath : ''
    }
  } catch (error) {
    return { available: false, apoPath: '', configPath: '' }
  }
})

ipcMain.handle('apo:install', async (event) => {
  try {
    // In production, you would:
    // 1. Extract bundled APO installer
    // 2. Run silent installation
    // 3. Configure for 2K Music branding

    // For now, return false to indicate manual installation needed
    return false
  } catch (error) {
    return false
  }
})

ipcMain.handle('apo:readConfig', async (event) => {
  try {
    const apoPath = path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'EqualizerAPO')
    const configPath = path.join(apoPath, 'config', '2k-music-eq.txt')

    if (!fs.existsSync(configPath)) {
      // Create default config
      const defaultConfig = `# 2K Music System Equalizer Configuration
# Generated automatically - do not edit manually

# Equalizer disabled by default
`
      fs.mkdirSync(path.dirname(configPath), { recursive: true })
      fs.writeFileSync(configPath, defaultConfig, 'utf8')

      return {
        enabled: false,
        bands: Array(10).fill(0).map((_, i) => ({
          frequency: [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000][i],
          gain: 0,
          q: 1.0
        }))
      }
    }

    const configContent = fs.readFileSync(configPath, 'utf8')
    const enabled = !configContent.includes('# Equalizer disabled')

    // Parse gains from config
    const bands = []
    const frequencies = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]

    frequencies.forEach(freq => {
      const regex = new RegExp(`Filter: ON PK Fc ${freq} Hz Gain ([+-]?\\d+\\.?\\d*) dB`)
      const match = configContent.match(regex)
      const gain = match ? parseFloat(match[1]) : 0

      bands.push({
        frequency: freq,
        gain: gain,
        q: 1.0
      })
    })

    return { enabled, bands }

  } catch (error) {
    return { enabled: false, bands: [] }
  }
})

ipcMain.handle('apo:writeConfig', async (event, configContent) => {
  try {
    const apoPath = path.join(process.env.PROGRAMFILES || 'C:\\Program Files', 'EqualizerAPO')
    const configPath = path.join(apoPath, 'config', '2k-music-eq.txt')

    // Ensure config directory exists
    fs.mkdirSync(path.dirname(configPath), { recursive: true })

    // Write config file
    fs.writeFileSync(configPath, configContent, 'utf8')

    // Also update the main APO config to include our file
    const mainConfigPath = path.join(apoPath, 'config', 'config.txt')
    if (fs.existsSync(mainConfigPath)) {
      let mainConfig = fs.readFileSync(mainConfigPath, 'utf8')

      // Add include line if not present
      const includeLine = 'Include: 2k-music-eq.txt'
      if (!mainConfig.includes(includeLine)) {
        mainConfig += `\n# 2K Music System Equalizer\n${includeLine}\n`
        fs.writeFileSync(mainConfigPath, mainConfig, 'utf8')
      }
    }

    return true

  } catch (error) {
    return false
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(async () => {
  // Create window first
  createWindow()

  // Create application menu
  createMenu()

  // Create system tray
  createTray()

  // Load native equalizer in background (non-blocking)
  setTimeout(() => {
    loadNativeEqualizer()
  }, 1000)

  // Attempt to auto-load saved library folder and start watch
  try {
    const saved = getSavedSettings()
    if (saved?.libraryFolder && fs.existsSync(saved.libraryFolder)) {
      await startLibraryWatch(saved.libraryFolder)
      // Optionally, send an initial scan request result to renderer if needed
    }
  } catch (e) {
    // Silent fail
  }
})

// Register custom protocol for OAuth deep linking
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient('2kmusic', process.execPath, [path.resolve(process.argv[1])])
  }
} else {
  app.setAsDefaultProtocolClient('2kmusic')
}

// Handle OAuth callback deep links
app.on('open-url', (event, url) => {
  event.preventDefault()

  // Parse the OAuth callback URL
  const urlObj = new URL(url)
  if (urlObj.protocol === '2kmusic:' && urlObj.pathname.includes('auth/callback')) {
    const code = urlObj.searchParams.get('code')
    const state = urlObj.searchParams.get('state')

    if (code && state && mainWindow) {
      mainWindow.webContents.send('oauth-callback', { code, state })
    }
  }
})

// Windows/Linux: Handle protocol on second instance
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }

    // Check if the second instance was launched with a protocol URL
    const url = commandLine.find(arg => arg.startsWith('2kmusic://'))
    if (url) {
      const urlObj = new URL(url)
      if (urlObj.pathname.includes('auth/callback')) {
        const code = urlObj.searchParams.get('code')
        const state = urlObj.searchParams.get('state')

        if (code && state && mainWindow) {
          mainWindow.webContents.send('oauth-callback', { code, state })
        }
      }
    }
  })
}

app.on('activate', () => {
  // On macOS, re-create window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('window-all-closed', () => {
  // Don't quit the app when all windows are closed (we have system tray)
  // Only quit when explicitly requested via tray menu
  // Note: macOS apps typically stay running, Windows apps now do too with tray
})

app.on('before-quit', () => {
  app.isQuitting = true
  if (tray) {
    tray.destroy()
  }
})

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault()
    shell.openExternal(navigationUrl)
  })
})

// IPC handlers for window controls (Discord-like)
ipcMain.handle('window-minimize', () => {
  if (mainWindow) mainWindow.minimize()
})

ipcMain.handle('window-maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  }
})

ipcMain.handle('window-close', () => {
  if (mainWindow) mainWindow.close()
})

ipcMain.handle('window-is-maximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false
})


// Create application menu
function createMenu() {
  const template = [
    {
      label: '2k Music',
      submenu: [
        {
          label: 'About 2k Music',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About 2k Music',
              message: '2k Music Desktop',
              detail: 'Your personal music streaming platform\nBuilt with Next.js and Electron'
            })
          }
        },
        { type: 'separator' },
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            // Send message to renderer to open settings
            mainWindow.webContents.send('open-settings')
          }
        },
        { type: 'separator' },
        {
          label: 'Quit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

// Handle app updates (for future implementation)
ipcMain.handle('check-for-updates', async () => {
  // TODO: Implement auto-updater
  return { hasUpdate: false }
})

// Handle folder selection for music library
ipcMain.handle('dialog:openDirectory', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Select Music Folder',
      buttonLabel: 'Select Folder'
    })
    return result
  } catch (error) {
    throw error
  }
})

// Handle music folder scanning
ipcMain.handle('fs:scanMusicFolder', async (event, folderPath) => {
  try {
    if (!fs.existsSync(folderPath)) {
      throw new Error('Folder does not exist')
    }

    const audioFiles = []
    const supportedExtensions = ['.mp3', '.m4a', '.wav', '.flac', '.aac', '.ogg']

    // Read directory contents
    const files = fs.readdirSync(folderPath)

    files.forEach(file => {
      try {
        const filePath = path.join(folderPath, file)
        const stats = fs.statSync(filePath)

        // Check if it's a file and has supported extension
        if (stats.isFile()) {
          const ext = path.extname(file).toLowerCase()
          if (supportedExtensions.includes(ext)) {
            audioFiles.push({
              name: file,
              path: filePath,
              size: stats.size,
              lastModified: stats.mtime.getTime(),
              extension: ext
            })
          }
        }
      } catch (fileError) {
        // Silent fail for individual files
      }
    })

    return audioFiles
  } catch (error) {
    throw error
  }
})

// Handle metadata extraction for audio files
ipcMain.handle('fs:extractMetadata', async (event, filePath) => {
  if (!fs.existsSync(filePath)) {
    return getFallbackMetadata(filePath)
  }

  try {
    const mm = require('music-metadata')
    const metadata = await mm.parseFile(filePath)

    let albumArt = undefined
    if (metadata.common.picture && metadata.common.picture.length > 0) {
      const picture = metadata.common.picture[0]

      try {
        // Convert directly to data URL instead of saving to temp file
        // Ensure picture.data is a Buffer
        let imageBuffer = Buffer.isBuffer(picture.data) ? picture.data : Buffer.from(picture.data)

        // Optimize large images by resizing them (keep all images, just make them smaller)
        if (imageBuffer.length > 500000) { // If larger than 500KB, resize it
          try {
            const sharp = require('sharp')
            // Resize to max 300x300 while maintaining aspect ratio and quality
            imageBuffer = await sharp(imageBuffer)
              .resize(300, 300, {
                fit: 'inside',
                withoutEnlargement: true
              })
              .jpeg({ quality: 85 }) // Good quality but smaller size
              .toBuffer()
          } catch (resizeError) {
            // If sharp fails, use original image anyway
          }
        }

        const base64 = imageBuffer.toString('base64')
        const mimeType = picture.format || 'image/jpeg'
        albumArt = `data:${mimeType};base64,${base64}`

        // Only skip if data is clearly corrupted (very small), but keep all valid images
        if (base64.length < 50) {
          albumArt = undefined
        }
      } catch (artError) {
        albumArt = undefined
      }
    }

    return {
      title: metadata.common.title || path.basename(filePath, path.extname(filePath)),
      artist: metadata.common.artist || 'Unknown Artist',
      album: metadata.common.album || 'Unknown Album',
      duration: Math.round(metadata.format.duration || 0),
      albumArt: albumArt
    }

  } catch (error) {
    return getFallbackMetadata(filePath)
  }
})

// Handle storing track metadata to file
ipcMain.handle('fs:saveTrackMetadata', async (event, tracks) => {
  try {
    const os = require('os')
    const metadataDir = path.join(os.tmpdir(), '2k-music-cache')

    // Create cache directory if it doesn't exist
    if (!fs.existsSync(metadataDir)) {
      fs.mkdirSync(metadataDir, { recursive: true })
    }

    const metadataFile = path.join(metadataDir, 'track-metadata.json')

    // Save tracks without album art data URLs to avoid large files
    const tracksForStorage = tracks.map(track => ({
      ...track,
      albumArt: track.albumArt?.startsWith('data:') ? undefined : track.albumArt
    }))

    fs.writeFileSync(metadataFile, JSON.stringify(tracksForStorage, null, 2))
    return true
  } catch (error) {
    return false
  }
})

// Handle loading track metadata from file
ipcMain.handle('fs:loadTrackMetadata', async (event) => {
  try {
    const os = require('os')
    const metadataFile = path.join(os.tmpdir(), '2k-music-cache', 'track-metadata.json')

    if (!fs.existsSync(metadataFile)) {
      return null
    }

    const data = fs.readFileSync(metadataFile, 'utf8')
    const tracks = JSON.parse(data)
    return tracks
  } catch (error) {
    return null
  }
})

// Handle clearing track metadata file
ipcMain.handle('fs:clearTrackMetadata', async (event) => {
  try {
    const os = require('os')
    const metadataFile = path.join(os.tmpdir(), '2k-music-cache', 'track-metadata.json')

    if (fs.existsSync(metadataFile)) {
      fs.unlinkSync(metadataFile)
    }
    return true
  } catch (error) {
    return false
  }
})

// Handle reading image files as data URLs
ipcMain.handle('fs:readImageAsDataURL', async (event, filePath) => {
  try {
    // Remove file:// prefix if present
    const cleanPath = filePath.replace('file://', '')

    if (!fs.existsSync(cleanPath)) {
      throw new Error('Image file does not exist')
    }

    // Read the image file
    const imageBuffer = fs.readFileSync(cleanPath)

    // Get file extension to determine MIME type
    const ext = path.extname(cleanPath).toLowerCase()
    let mimeType = 'image/jpeg' // default

    if (ext === '.png') mimeType = 'image/png'
    else if (ext === '.gif') mimeType = 'image/gif'
    else if (ext === '.webp') mimeType = 'image/webp'
    else if (ext === '.bmp') mimeType = 'image/bmp'

    // Convert to base64 data URL
    const base64 = imageBuffer.toString('base64')
    const dataURL = `data:${mimeType};base64,${base64}`

    return dataURL

  } catch (error) {
    throw error
  }
})

function getFallbackMetadata(filePath) {
  const filename = path.basename(filePath, path.extname(filePath))
  let title = filename
  let artist = 'Unknown Artist'

  if (filename.includes(' - ')) {
    const parts = filename.split(' - ')
    if (parts.length >= 2) {
      artist = parts[0].trim()
      title = parts.slice(1).join(' - ').trim()
    }
  }

  return {
    title: title,
    artist: artist,
    album: 'Unknown Album',
    duration: 0,
    albumArt: undefined
  }
}