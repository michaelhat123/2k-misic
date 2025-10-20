const { app, BrowserWindow, Menu, shell, ipcMain, dialog } = require('electron')
const path = require('path')

// FORCE development mode for testing
const isDev = true

// Keep a global reference of the window object
let mainWindow

function createWindow() {
  // Create the browser window with Spotify-like settings
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Remove default frame for integrated controls
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'hidden', // macOS style
    backgroundColor: '#0f0f23', // Dark background like Spotify
    show: false, // Don't show until ready
    icon: path.join(__dirname, '../assets/icon.png'), // App icon
    vibrancy: process.platform === 'darwin' ? 'dark' : undefined, // macOS vibrancy
    webPreferences: {
      nodeIntegration: false, // Security: disable node integration
      contextIsolation: true, // Security: enable context isolation
      enableRemoteModule: false, // Security: disable remote module
      preload: path.join(__dirname, 'preload.js'), // Preload script
      webSecurity: false // Disable web security for development
    }
  })

  // ALWAYS load from development server
  const devUrl = 'http://localhost:3000'
  
  mainWindow.loadURL(devUrl)
  mainWindow.webContents.openDevTools()

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})
