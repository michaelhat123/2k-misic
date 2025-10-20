"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Minus, Square, X } from "lucide-react"

// Types are defined in @/types/electron.d.ts

interface WindowControlsProps {
  className?: string
}

export function WindowControls({ className = "" }: WindowControlsProps) {
  const [isMaximized, setIsMaximized] = useState(false)
  const [isElectron, setIsElectron] = useState(false)

  useEffect(() => {
    // Check if running in Electron
    const hasElectronAPI = typeof window !== 'undefined' && !!window.electronAPI
    setIsElectron(hasElectronAPI)
    
    if (hasElectronAPI && window.electronAPI) {
      // Check initial maximized state
      window.electronAPI.isWindowMaximized()
        .then(setIsMaximized)
        .catch(() => {})
    }
  }, [])

  const handleMinimize = async () => {
    try {
      await window.electronAPI?.minimizeWindow()
    } catch (error) {
      // Silent fail
    }
  }

  const handleMaximize = async () => {
    try {
      await window.electronAPI?.maximizeWindow()
      if (window.electronAPI) {
        const maximized = await window.electronAPI.isWindowMaximized()
        setIsMaximized(maximized)
      }
    } catch (error) {
      // Silent fail
    }
  }

  const handleClose = async () => {
    try {
      await window.electronAPI?.closeWindow()
    } catch (error) {
      // Silent fail
    }
  }

  // Don't render if not in Electron or on macOS
  if (!isElectron) {
    return null
  }
  
  // Check platform safely
  try {
    if (window.electronAPI?.getPlatform() === 'darwin') {
      return null
    }
  } catch (error) {
    // Silent fail
  }

  return (
    <div className={`flex items-center space-x-1 no-drag ${className}`}>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-gray-700/50 rounded text-white hover:text-white"
        onClick={handleMinimize}
      >
        <Minus className="w-4 h-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-gray-700/50 rounded text-white hover:text-white"
        onClick={handleMaximize}
      >
        <Square className={`w-3 h-3 ${isMaximized ? 'opacity-60' : ''}`} />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0 hover:bg-red-600 rounded text-white hover:text-white"
        onClick={handleClose}
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  )
}
