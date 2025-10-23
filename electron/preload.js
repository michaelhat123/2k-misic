const { contextBridge, ipcRenderer, shell } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  // Shell API for opening external links
  shell: {
    openExternal: (url) => shell.openExternal(url)
  },
  
  // OAuth callback handler
  onOAuthCallback: (callback) => {
    ipcRenderer.on('oauth-callback', (_event, data) => callback(data))
  }
})

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls (Discord-like titlebar)
  minimizeWindow: () => ipcRenderer.invoke('window-minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window-maximize'),
  closeWindow: () => ipcRenderer.invoke('window-close'),
  isWindowMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  
  // App info
  getVersion: () => process.versions.electron,
  getPlatform: () => process.platform,
  
  // Settings and preferences
  onOpenSettings: (callback) => {
    ipcRenderer.on('open-settings', callback)
  },
  
  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  
  // Notifications (for future use)
  showNotification: (title, body) => {
    new Notification(title, { body })
  },
  
  // File system access (secure)
  selectFile: () => ipcRenderer.invoke('select-file'),
  
  // Music folder management
  selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
  scanMusicFolder: (folderPath) => ipcRenderer.invoke('fs:scanMusicFolder', folderPath),
  extractMetadata: (filePath) => ipcRenderer.invoke('fs:extractMetadata', filePath),
  readImageAsDataURL: (filePath) => ipcRenderer.invoke('fs:readImageAsDataURL', filePath),
  
  // Library settings persistence
  getSavedFolder: () => ipcRenderer.invoke('library:getFolder'),
  setSavedFolder: (dir) => ipcRenderer.invoke('library:setFolder', dir),

  // Real-time library watch controls
  startFolderWatch: (dir) => ipcRenderer.invoke('library:startWatch', dir),
  stopFolderWatch: () => ipcRenderer.invoke('library:stopWatch'),
  
  // Remove listeners
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel)
  },
  
  // Native module access
  loadNativeModule: () => {
    const path = require('path')
    // Return the path to the native module
    return path.resolve(__dirname, '..', 'native', 'build', 'Release', 'audio_equalizer.node')
  },
  
  // Equalizer functions
  equalizerIsAvailable: () => ipcRenderer.invoke('equalizer:isAvailable'),
  equalizerInitialize: () => ipcRenderer.invoke('equalizer:initialize'),
  equalizerSetBandGain: (bandIndex, gain) => ipcRenderer.invoke('equalizer:setBandGain', bandIndex, gain),
  equalizerGetBandGain: (bandIndex) => ipcRenderer.invoke('equalizer:getBandGain', bandIndex),
  equalizerApplyPreset: (presetName) => ipcRenderer.invoke('equalizer:applyPreset', presetName),
  equalizerSetEnabled: (enabled) => ipcRenderer.invoke('equalizer:setEnabled', enabled),

  // System Equalizer functions
  systemEqualizerIsAvailable: () => ipcRenderer.invoke('systemEqualizer:isAvailable'),
  systemEqualizerInitialize: () => ipcRenderer.invoke('systemEqualizer:initialize'),
  systemEqualizerStartCapture: () => ipcRenderer.invoke('systemEqualizer:startCapture'),
  systemEqualizerStopCapture: () => ipcRenderer.invoke('systemEqualizer:stopCapture'),
  systemEqualizerIsCapturing: () => ipcRenderer.invoke('systemEqualizer:isCapturing'),
  systemEqualizerSetBandGain: (bandIndex, gain) => ipcRenderer.invoke('systemEqualizer:setBandGain', bandIndex, gain),
  systemEqualizerGetBandGain: (bandIndex) => ipcRenderer.invoke('systemEqualizer:getBandGain', bandIndex),
  systemEqualizerApplyPreset: (presetName) => ipcRenderer.invoke('systemEqualizer:applyPreset', presetName),
  systemEqualizerSetEnabled: (enabled) => ipcRenderer.invoke('systemEqualizer:setEnabled', enabled),

  // APO System Equalizer functions
  apoDetectInstallation: () => ipcRenderer.invoke('apo:detectInstallation'),
  apoInstall: () => ipcRenderer.invoke('apo:install'),
  apoReadConfig: () => ipcRenderer.invoke('apo:readConfig'),
  apoWriteConfig: (configContent) => ipcRenderer.invoke('apo:writeConfig', configContent),

  // Media controls for taskbar thumbnail buttons
  sendPlayerState: (state) => ipcRenderer.send('player:state-changed', state),
  sendTrackChange: (track) => ipcRenderer.send('player:track-changed', track),
  onMediaControl: (callback) => {
    // CRITICAL: Remove ALL previous listeners to prevent accumulation
    ipcRenderer.removeAllListeners('media-control')
    ipcRenderer.on('media-control', (_event, action) => callback(action))
  },
})

// Security: Remove any Node.js APIs from the window object
delete window.require
delete window.module

// Add some helpful development info
if (process.env.NODE_ENV === 'development') {
  // Development mode active
}

// Forward batched library changes as individual events the renderer already handles
ipcRenderer.on('library:changed', (_event, batch) => {
  try {
    const { added = [], removed = [], changed = [] } = batch || {}
    for (const filePath of added) {
      window.dispatchEvent(new CustomEvent('folderChange', { detail: { type: 'add', filePath } }))
    }
    for (const filePath of removed) {
      window.dispatchEvent(new CustomEvent('folderChange', { detail: { type: 'unlink', filePath } }))
    }
    for (const filePath of changed) {
      window.dispatchEvent(new CustomEvent('folderChange', { detail: { type: 'change', filePath } }))
    }
  } catch (e) {
    // Silent fail
  }
})
