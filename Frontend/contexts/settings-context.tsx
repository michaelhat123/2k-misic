"use client"

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { userApi } from '@/lib/api/user'
import { useAuth } from '@/components/auth/auth-provider'

interface SettingsContextType {
  zoomLevel: number
  showNowPlayingBar: boolean
  compactMode: boolean
  showAlbumArt: boolean
  animatedBackgrounds: boolean
  showLyrics: boolean
  audioQuality: 'high' | 'medium' | 'low'
  volumeNormalization: boolean
  gaplessPlayback: boolean
  autoPlay: boolean
  enableLocalFiles: boolean
  defaultMusicFolder: string
  autoScanFolder: boolean
  folderHandle?: any
  updateSettings: (newSettings: Partial<SettingsContextType>) => void
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined)

export const useSettings = () => {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth() // Get auth state
  
  const [settings, setSettings] = useState<SettingsContextType>({
    zoomLevel: 100,
    showNowPlayingBar: true,
    compactMode: false,
    showAlbumArt: true,
    animatedBackgrounds: true,
    showLyrics: true,
    audioQuality: 'high',
    volumeNormalization: true,
    gaplessPlayback: true,
    autoPlay: false,
    enableLocalFiles: true,
    defaultMusicFolder: '',
    autoScanFolder: true,
    folderHandle: undefined,
    updateSettings: () => {}
  })

  // Fetch user profile to get settings - ONLY when authenticated
  const { data: profile } = useQuery({
    queryKey: ["user-profile"],
    queryFn: userApi.getProfile,
    staleTime: 1000 * 60 * 5,
    enabled: !!user, // Only run when user is authenticated
  })

  // Update settings when profile loads
  useEffect(() => {
    if (profile?.preferences) {
      const prefs = profile.preferences as any
      setSettings(prev => ({
        ...prev,
        zoomLevel: prefs.zoomLevel || 100,
        showNowPlayingBar: prefs.showNowPlayingBar ?? true,
        compactMode: prefs.compactMode ?? false,
        showAlbumArt: prefs.showAlbumArt ?? true,
        animatedBackgrounds: prefs.animatedBackgrounds ?? true,
        showLyrics: prefs.showLyrics ?? true,
        audioQuality: prefs.audioQuality || 'high',
        volumeNormalization: prefs.volumeNormalization ?? true,
        gaplessPlayback: prefs.gaplessPlayback ?? true,
        autoPlay: prefs.autoPlay ?? false,
        enableLocalFiles: prefs.enableLocalFiles ?? true,
        defaultMusicFolder: prefs.defaultMusicFolder || '',
        autoScanFolder: prefs.autoScanFolder ?? true,
      }))
    }
  }, [profile])

  // Apply zoom level to document
  useEffect(() => {
    document.documentElement.style.fontSize = `${(settings.zoomLevel / 100) * 16}px`
  }, [settings.zoomLevel])

  // Apply compact mode class
  useEffect(() => {
    if (settings.compactMode) {
      document.documentElement.classList.add('compact-mode')
    } else {
      document.documentElement.classList.remove('compact-mode')
    }
  }, [settings.compactMode])

  // Apply animated backgrounds class
  useEffect(() => {
    if (settings.animatedBackgrounds) {
      document.documentElement.classList.add('animated-backgrounds')
    } else {
      document.documentElement.classList.remove('animated-backgrounds')
    }
  }, [settings.animatedBackgrounds])

  const updateSettings = (newSettings: Partial<SettingsContextType>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }

  const contextValue = {
    ...settings,
    updateSettings
  }

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  )
}
