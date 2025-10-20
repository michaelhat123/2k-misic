/**
 * Comprehensive Electron API interface matching preload.js exactly
 * This is the single source of truth for electronAPI types
 */
declare global {
  interface Window {
    electronAPI?: {
      // Window controls
      minimizeWindow: () => Promise<void>
      maximizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
      isWindowMaximized: () => Promise<boolean>
      
      // App info
      getVersion: () => string
      getPlatform: () => string
      
      // Settings and preferences
      onOpenSettings: (callback: () => void) => void
      
      // Updates
      checkForUpdates: () => Promise<void>
      
      // Notifications
      showNotification: (title: string, body: string) => void
      
      // File system access
      selectFile: () => Promise<string | null>
      
      // Music folder management
      selectFolder: () => Promise<any>
      scanMusicFolder: (folderPath: string) => Promise<any[]>
      extractMetadata: (filePath: string) => Promise<any>

      // Library settings persistence (Electron settings)
      getSavedFolder: () => Promise<string | null>
      setSavedFolder: (dir: string) => Promise<{ ok: boolean; error?: string }>

      // Real-time library watch controls
      startFolderWatch: (dir: string) => Promise<{ ok: boolean; error?: string }>
      stopFolderWatch: () => Promise<{ ok: boolean; error?: string }>
      
      // Event listeners
      removeAllListeners: (channel: string) => void
    }
  }
}

export {}
