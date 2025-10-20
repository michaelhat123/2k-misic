"use client"

import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from "@/components/auth/auth-provider"
import { usePlayer } from "@/components/player/player-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { 
  Settings, 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Volume2, 
  Globe, 
  Trash2, 
  Camera, 
  ArrowLeft,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Download,
  Headphones,
  FolderOpen
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { userApi } from "@/lib/api/user"
import { toast } from 'sonner'
import { SearchOverlay } from "@/components/search/search-overlay"
import { useSearch } from "@/components/layout/top-navigation"
import { useSettings } from "@/contexts/settings-context"
import Link from 'next/link'
import { libraryApi } from "@/lib/api/library"
import { SystemEqualizerSettings } from "@/components/settings/system-equalizer-settings"
import { AudioOverview } from "@/components/settings/audio-overview"

interface UserProfile {
  id: string
  email: string
  name: string
  profilePicture: string | null
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  preferences?: {
    theme: 'light' | 'dark' | 'auto'
    notifications: boolean
    audioQuality: 'high' | 'medium' | 'low'
    crossfade: number
    volumeNormalization: boolean
    gaplessPlayback: boolean
    autoPlay: boolean
    language: string
    privacy: {
      profile_visibility: 'public' | 'friends' | 'private'
      show_listening_activity: boolean
      show_recently_played: boolean
      allow_friend_requests: boolean
    }
    notifications_settings: {
      desktop: boolean
      email: boolean
      new_music: boolean
      friend_activity: boolean
      marketing: boolean
    }
  }
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { searchQuery } = useSearch()
  const settingsContext = useSettings()
  const { currentTrack, isPlaying } = usePlayer()
  const [activeSection, setActiveSection] = useState('account')
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()
  const [isNowPlayingVisible, setIsNowPlayingVisible] = useState(false)

  // Instant Now Playing Sidebar detection - perfectly synchronized
  useEffect(() => {
    // Listen for custom events from player bar toggle - INSTANT
    const handleNPVToggle = (e: CustomEvent) => {
      setIsNowPlayingVisible(e.detail.isOpen && currentTrack !== null)
    }
    
    // Initial check
    const nowPlayingSidebar = document.querySelector('.w-\\[320px\\]')
    setIsNowPlayingVisible(!!nowPlayingSidebar && currentTrack !== null)
    
    window.addEventListener('npvToggle', handleNPVToggle as EventListener)
    
    return () => {
      window.removeEventListener('npvToggle', handleNPVToggle as EventListener)
    }
  }, [currentTrack])

  // Fetch user profile data - ONLY when authenticated
  const { data: profile, isLoading } = useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: userApi.getProfile,
    staleTime: 1000 * 60 * 5,
    enabled: !!user, // Only run when user is authenticated
  })

  // Fetch library folder from database - ONLY when authenticated
  const { data: libraryFolder } = useQuery<string | null>({
    queryKey: ["library-folder"],
    queryFn: libraryApi.getLibraryFolder,
    staleTime: 1000 * 60 * 5,
    enabled: !!user, // Only run when user is authenticated
  })

  // Local state for settings
  const [settings, setSettings] = useState({
    name: '',
    notifications: true,
    audioQuality: 'high' as 'high' | 'medium' | 'low',
    crossfade: 0,
    volumeNormalization: true,
    gaplessPlayback: true,
    autoPlay: false,
    language: 'en',
    zoomLevel: 100,
    showNowPlayingBar: true,
    compactMode: false,
    showAlbumArt: true,
    animatedBackgrounds: true,
    showLyrics: true,
    equalizerEnabled: false,
    privacy: {
      profile_visibility: 'public' as 'public' | 'friends' | 'private',
      show_listening_activity: true,
      show_recently_played: true,
      allow_friend_requests: true,
    },
    notifications_settings: {
      desktop: true,
      email: true,
      new_music: true,
      friend_activity: true,
      marketing: false,
    }
  })

  // Load EQ state from localStorage on mount
  useEffect(() => {
    try {
      const savedEqState = localStorage.getItem('eq-state')
      if (savedEqState) {
        const { enabled } = JSON.parse(savedEqState)
        if (enabled !== undefined) {
          setSettings(prev => ({ ...prev, equalizerEnabled: enabled }))
        }
      }
    } catch (error) {
      // Silent fail
    }
  }, [])

  // Update local state when profile loads
  useEffect(() => {
    if (profile) {
      // Load EQ state from localStorage, not from profile
      let eqEnabled = false
      try {
        const savedEqState = localStorage.getItem('eq-state')
        if (savedEqState) {
          const { enabled } = JSON.parse(savedEqState)
          eqEnabled = enabled ?? false
        }
      } catch (error) {
        // Silent fail
      }

      setSettings({
        name: profile.name || '',
        notifications: profile.preferences?.notifications ?? true,
        audioQuality: profile.preferences?.audioQuality || 'high',
        crossfade: profile.preferences?.crossfade || 0,
        volumeNormalization: profile.preferences?.volumeNormalization ?? true,
        gaplessPlayback: profile.preferences?.gaplessPlayback ?? true,
        autoPlay: profile.preferences?.autoPlay ?? false,
        language: profile.preferences?.language || 'en',
        zoomLevel: (profile.preferences as any)?.zoomLevel || 100,
        showNowPlayingBar: (profile.preferences as any)?.showNowPlayingBar ?? true,
        compactMode: (profile.preferences as any)?.compactMode ?? false,
        showAlbumArt: (profile.preferences as any)?.showAlbumArt ?? true,
        animatedBackgrounds: (profile.preferences as any)?.animatedBackgrounds ?? true,
        showLyrics: (profile.preferences as any)?.showLyrics ?? true,
        equalizerEnabled: eqEnabled,
        privacy: {
          profile_visibility: profile.preferences?.privacy?.profile_visibility || 'public',
          show_listening_activity: profile.preferences?.privacy?.show_listening_activity ?? true,
          show_recently_played: profile.preferences?.privacy?.show_recently_played ?? true,
          allow_friend_requests: profile.preferences?.privacy?.allow_friend_requests ?? true,
        },
        notifications_settings: {
          desktop: profile.preferences?.notifications_settings?.desktop ?? true,
          email: profile.preferences?.notifications_settings?.email ?? true,
          new_music: profile.preferences?.notifications_settings?.new_music ?? true,
          friend_activity: profile.preferences?.notifications_settings?.friend_activity ?? true,
          marketing: profile.preferences?.notifications_settings?.marketing ?? false,
        }
      })
    }
  }, [profile])

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      toast.success("Settings saved successfully!")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to save settings")
    }
  })

  // Profile picture upload mutation
  const uploadPictureMutation = useMutation({
    mutationFn: userApi.uploadProfilePicture,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      toast.success("Profile picture updated!")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload profile picture")
    }
  })

  // Auto-save settings when they change
  useEffect(() => {
    if (!profile) return // Don't save until profile is loaded
    
    const updateData = {
      name: settings.name.trim(),
      preferences: {
        notifications: settings.notifications,
        audioQuality: settings.audioQuality,
        crossfade: settings.crossfade,
        volumeNormalization: settings.volumeNormalization,
        gaplessPlayback: settings.gaplessPlayback,
        autoPlay: settings.autoPlay,
        language: settings.language,
        zoomLevel: settings.zoomLevel,
        showNowPlayingBar: settings.showNowPlayingBar,
        compactMode: settings.compactMode,
        showAlbumArt: settings.showAlbumArt,
        animatedBackgrounds: settings.animatedBackgrounds,
        showLyrics: settings.showLyrics,
        privacy: settings.privacy,
        notifications_settings: settings.notifications_settings
      }
    }
    
    // Debounce auto-save to avoid too many API calls
    const timeoutId = setTimeout(() => {
      updateProfileMutation.mutate(updateData)
    }, 1000) // Save 1 second after user stops changing settings
    
    return () => clearTimeout(timeoutId)
  }, [settings, profile]) // Auto-save when settings change

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      uploadPictureMutation.mutate(file)
    }
  }

  const handleFolderSelect = async () => {
    try {
      // Check if we're in Electron environment
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const result = await (window as any).electronAPI.selectFolder()
        
        if (result && !result.canceled && result.filePaths.length > 0) {
          const folderPath = result.filePaths[0]
          
          settingsContext.updateSettings({ 
            defaultMusicFolder: folderPath
          })
          
          // Save to localStorage for download functionality
          localStorage.setItem('watchedMusicFolder', folderPath)
          
          // Save selected folder to backend DB (authoritative)
          try {
            const ok = await libraryApi.setLibraryFolder(folderPath)
            if (ok) {
              // Refresh the library folder query to show the new path
              queryClient.invalidateQueries({ queryKey: ["library-folder"] })
            }
          } catch (e) {
            // Silent fail
          }

          // Persist in Electron app settings for auto-load on app start
          try {
            await (window as any).electronAPI.setSavedFolder?.(folderPath)
          } catch (e) {
            // Silent fail
          }

          toast.success(`Default music folder set to: ${folderPath}`)
          
          // Trigger initial scan and start watcher so Downloads updates immediately
          try {
            const api = (window as any).electronAPI
            if (api?.scanMusicFolder) {
              const audioFiles = await api.scanMusicFolder(folderPath)
              // Notify Downloads page to process and display
              window.dispatchEvent(new CustomEvent('folderScanned', {
                detail: { files: audioFiles, isElectron: true, folderPath }
              }))
            }
            if ((window as any).electronAPI?.startFolderWatch) {
              await (window as any).electronAPI.startFolderWatch(folderPath)
            }
          } catch (e) {
            // Silent fail
          }
        }
      } else if ('showDirectoryPicker' in window) {
        const dirHandle = await (window as any).showDirectoryPicker()
        const folderPath = dirHandle.name
        
        settingsContext.updateSettings({ 
          defaultMusicFolder: folderPath,
          folderHandle: dirHandle
        })
        
        toast.success(`Default music folder set to: ${folderPath}`)
        
        // If auto-scan is enabled, trigger scan immediately
        if (settingsContext.autoScanFolder) {
          handleScanFolder(dirHandle)
        }
      } else {
        toast.error('Folder selection not supported in this environment')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage !== 'AbortError') {
        toast.error(`Failed to select folder: ${errorMessage}`)
      }
    }
  }

  const handleElectronScan = async (folderPath: string) => {
    try {
      setImporting(true)
      
      // Use Electron API to scan folder
      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const audioFiles = await (window as any).electronAPI.scanMusicFolder(folderPath)
        
        if (audioFiles.length === 0) {
          toast.info('No audio files found in the selected folder')
          return
        }
        
        // Trigger event with file paths for Downloads page
        const event = new CustomEvent('folderScanned', { 
          detail: { 
            files: audioFiles, 
            isElectron: true,
            folderPath 
          } 
        })
        window.dispatchEvent(event)
        // Store files in localStorage as backup
        localStorage.setItem('pendingMusicScan', JSON.stringify({
          files: audioFiles,
          isElectron: true,
          folderPath,
          timestamp: Date.now()
        }))
        
        toast.success(`Found ${audioFiles.length} audio files. Processing...`)
        
        // Delay event dispatch to ensure Downloads page is ready
        setTimeout(() => {
          // Dispatch a simple test event
          const testEvent = new CustomEvent('test-event', { detail: { message: 'Hello from Settings!' } })
          window.dispatchEvent(testEvent)
          
          // Re-dispatch the main event after delay
          const delayedEvent = new CustomEvent('folderScanned', { 
            detail: { 
              files: audioFiles, 
              isElectron: true,
              folderPath 
            } 
          })
          window.dispatchEvent(delayedEvent)
        }, 2000)
        
        // Don't auto-clear localStorage - let Downloads page clear it when processed
        
      } else {
        toast.error('Electron API not available')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to scan folder: ${errorMessage}`)
    } finally {
      setImporting(false)
    }
  }

  const handleScanFolder = async (dirHandle?: any) => {
    try {
      setImporting(true)
      
      // Get the directory handle (either passed or from context)
      const handle = dirHandle || (settingsContext as any).folderHandle
      if (!handle) {
        toast.error('No folder selected. Please select a folder first.')
        return
      }

      const audioFiles: File[] = []
      
      // Recursively scan the directory
      for await (const [name, fileHandle] of handle.entries()) {
        if (fileHandle.kind === 'file') {
          const file = await fileHandle.getFile()
          if (file.name.toLowerCase().endsWith('.mp3') || file.name.toLowerCase().endsWith('.m4a')) {
            audioFiles.push(file)
          }
        }
      }

      if (audioFiles.length === 0) {
        toast.info('No audio files found in the selected folder')
        return
      }

      // Instead of using localStorage, let's directly process the files
      
      // Create a FileList-like object
      const fileList = {
        length: audioFiles.length,
        item: (index: number) => audioFiles[index],
        [Symbol.iterator]: function* () {
          for (let i = 0; i < audioFiles.length; i++) {
            yield audioFiles[i]
          }
        }
      } as FileList

      // Trigger a custom event to notify Downloads page
      const event = new CustomEvent('folderScanned', { 
        detail: { files: audioFiles, fileList } 
      })
      window.dispatchEvent(event)
      
      toast.success(`Found ${audioFiles.length} audio files. Processing...`)
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      toast.error(`Failed to scan folder: ${errorMessage}`)
    } finally {
      setImporting(false)
    }
  }

  const settingsSections = [
    { id: 'account', label: 'Account & Profile', icon: User },
    { id: 'audio', label: 'Audio & Playback', icon: Headphones },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'local', label: 'Local Music', icon: Download },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'advanced', label: 'Advanced', icon: Settings },
  ]

  if (searchQuery?.trim()) {
    return <SearchOverlay />
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-6 pb-4">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex gap-[4px] min-h-0 px-6 pb-6">
        {/* Sidebar Card - Minimizes when Now Playing Sidebar is shown */}
        <Card className={`flex-shrink-0 h-full transition-all duration-150 ease-in-out ${
          isNowPlayingVisible ? 'w-16' : 'w-64'
        }`}>
          <CardContent className="p-4 h-full">
            <nav className="space-y-2">
              {settingsSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeSection === section.id
                      ? 'bg-secondary text-secondary-foreground'
                      : 'hover:bg-accent/50'
                  } ${isNowPlayingVisible ? 'justify-center' : ''}`}
                  title={isNowPlayingVisible ? section.label : undefined}
                >
                  <section.icon className="h-4 w-4 flex-shrink-0" />
                  {!isNowPlayingVisible && (
                    <span>{section.label}</span>
                  )}
                </button>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Content Card */}
        <Card className="flex-1 min-h-0">
          <ScrollArea className="h-full w-full">
            <div className="p-6">
            {/* Account & Profile */}
            {activeSection === 'account' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Account & Profile</h2>
                
                <div className="space-y-6">
                  {/* Profile Picture */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Profile Picture</CardTitle>
                      <CardDescription>Update your profile picture</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={profile?.profilePicture || undefined} />
                          <AvatarFallback>
                            <User className="h-8 w-8" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <Button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadPictureMutation.isPending}
                          >
                            <Camera className="h-4 w-4 mr-2" />
                            {uploadPictureMutation.isPending ? 'Uploading...' : 'Change Picture'}
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            JPG, PNG or GIF. Max size 5MB.
                          </p>
                        </div>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureUpload}
                        className="hidden"
                      />
                    </CardContent>
                  </Card>

                  {/* Display Name */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Display Name</CardTitle>
                      <CardDescription>This is how your name appears to others</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Name</Label>
                        <Input
                          id="displayName"
                          value={settings.name}
                          onChange={(e) => setSettings(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Enter your display name"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Email */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Email Address</CardTitle>
                      <CardDescription>Your account email address</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Input value={profile?.email || ''} disabled />
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Audio & Playback */}
            {activeSection === 'audio' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Audio & Playback</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Audio Quality</CardTitle>
                    <CardDescription>Choose your preferred audio quality</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={settings.audioQuality}
                      onValueChange={(value: 'high' | 'medium' | 'low') => 
                        setSettings(prev => ({ ...prev, audioQuality: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">High (320 kbps)</SelectItem>
                        <SelectItem value="medium">Medium (160 kbps)</SelectItem>
                        <SelectItem value="low">Low (96 kbps)</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Playback Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Volume Normalization</Label>
                        <p className="text-sm text-muted-foreground">Normalize volume across all tracks</p>
                      </div>
                      <Switch
                        checked={settings.volumeNormalization}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, volumeNormalization: checked }))
                        }
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Gapless Playback</Label>
                        <p className="text-sm text-muted-foreground">Seamless transitions between tracks</p>
                      </div>
                      <Switch
                        checked={settings.gaplessPlayback}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, gaplessPlayback: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Auto-play Similar Songs</Label>
                        <p className="text-sm text-muted-foreground">Continue playing similar music when queue ends</p>
                      </div>
                      <Switch
                        checked={settings.autoPlay}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, autoPlay: checked }))
                        }
                      />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>System Equalizer</Label>
                        <p className="text-sm text-muted-foreground">Enable system-wide audio equalization</p>
                      </div>
                      <Switch
                        checked={settings.equalizerEnabled || false}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ ...prev, equalizerEnabled: checked }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* 2K Music System Equalizer (APO-based) */}
                <SystemEqualizerSettings 
                  externalEnabled={settings.equalizerEnabled}
                  onExternalToggle={(checked) => 
                    setSettings(prev => ({ ...prev, equalizerEnabled: checked }))
                  }
                />
              </div>
            )}

            {/* Appearance */}
            {activeSection === 'appearance' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Appearance & Interface</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Zoom Level</CardTitle>
                    <CardDescription>Adjust the interface size</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>75%</span>
                        <span className="font-medium">{settingsContext.zoomLevel}%</span>
                        <span>125%</span>
                      </div>
                      <input
                        type="range"
                        min="75"
                        max="125"
                        step="5"
                        value={settingsContext.zoomLevel}
                        onChange={(e) => settingsContext.updateSettings({ zoomLevel: parseInt(e.target.value) })}
                        className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Interface Options</CardTitle>
                    <CardDescription>Customize your music experience</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Now Playing Bar</Label>
                        <p className="text-sm text-muted-foreground">Display the bottom music player bar</p>
                      </div>
                      <Switch
                        checked={settingsContext.showNowPlayingBar}
                        onCheckedChange={(checked) => 
                          settingsContext.updateSettings({ showNowPlayingBar: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Compact Mode</Label>
                        <p className="text-sm text-muted-foreground">Use smaller spacing and elements</p>
                      </div>
                      <Switch
                        checked={settingsContext.compactMode}
                        onCheckedChange={(checked) => 
                          settingsContext.updateSettings({ compactMode: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Album Art</Label>
                        <p className="text-sm text-muted-foreground">Display album artwork throughout the app</p>
                      </div>
                      <Switch
                        checked={settingsContext.showAlbumArt}
                        onCheckedChange={(checked) => 
                          settingsContext.updateSettings({ showAlbumArt: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Animated Backgrounds</Label>
                        <p className="text-sm text-muted-foreground">Enable animated visual effects</p>
                      </div>
                      <Switch
                        checked={settingsContext.animatedBackgrounds}
                        onCheckedChange={(checked) => 
                          settingsContext.updateSettings({ animatedBackgrounds: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Lyrics</Label>
                        <p className="text-sm text-muted-foreground">Display song lyrics when available</p>
                      </div>
                      <Switch
                        checked={settingsContext.showLyrics}
                        onCheckedChange={(checked) => 
                          settingsContext.updateSettings({ showLyrics: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Local Music */}
            {activeSection === 'local' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Local Music</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Enable Local Files</CardTitle>
                    <CardDescription>Allow importing and playing local music files</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Enable Local Music</Label>
                        <p className="text-sm text-muted-foreground">Import MP3 and M4A files from your computer</p>
                      </div>
                      <Switch
                        checked={settingsContext.enableLocalFiles}
                        onCheckedChange={(checked) => 
                          settingsContext.updateSettings({ enableLocalFiles: checked })
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {settingsContext.enableLocalFiles && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle>Default Music Folder</CardTitle>
                        <CardDescription>Set a default folder to automatically scan for music files</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>Music Folder Path</Label>
                          <div className="flex gap-2">
                            <Input
                              value={libraryFolder || settingsContext.defaultMusicFolder || 'No folder selected'}
                              readOnly
                              disabled
                              className="flex-1 cursor-not-allowed text-muted-foreground"
                              placeholder="Select a folder..."
                            />
                            <Button onClick={handleFolderSelect} variant="outline">
                              <FolderOpen className="h-4 w-4 mr-2" />
                              Browse
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Choose a folder where your music files are stored. The app will automatically scan this folder for new songs.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Notifications</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Notification Preferences</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Desktop Notifications</Label>
                        <p className="text-sm text-muted-foreground">Show notifications on your desktop</p>
                      </div>
                      <Switch
                        checked={settings.notifications_settings.desktop}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            notifications_settings: { ...prev.notifications_settings, desktop: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Email Notifications</Label>
                        <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                      </div>
                      <Switch
                        checked={settings.notifications_settings.email}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            notifications_settings: { ...prev.notifications_settings, email: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>New Music Alerts</Label>
                        <p className="text-sm text-muted-foreground">Get notified about new releases</p>
                      </div>
                      <Switch
                        checked={settings.notifications_settings.new_music}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            notifications_settings: { ...prev.notifications_settings, new_music: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Friend Activity</Label>
                        <p className="text-sm text-muted-foreground">Notifications about friend activity</p>
                      </div>
                      <Switch
                        checked={settings.notifications_settings.friend_activity}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            notifications_settings: { ...prev.notifications_settings, friend_activity: checked }
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Privacy & Security */}
            {activeSection === 'privacy' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Privacy & Security</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Profile Visibility</CardTitle>
                    <CardDescription>Control who can see your profile</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={settings.privacy.profile_visibility}
                      onValueChange={(value: 'public' | 'friends' | 'private') => 
                        setSettings(prev => ({ 
                          ...prev, 
                          privacy: { ...prev.privacy, profile_visibility: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="friends">Friends Only</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Listening Activity</Label>
                        <p className="text-sm text-muted-foreground">Let others see what you're listening to</p>
                      </div>
                      <Switch
                        checked={settings.privacy.show_listening_activity}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            privacy: { ...prev.privacy, show_listening_activity: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Show Recently Played</Label>
                        <p className="text-sm text-muted-foreground">Display your recently played tracks</p>
                      </div>
                      <Switch
                        checked={settings.privacy.show_recently_played}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            privacy: { ...prev.privacy, show_recently_played: checked }
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label>Allow Friend Requests</Label>
                        <p className="text-sm text-muted-foreground">Let others send you friend requests</p>
                      </div>
                      <Switch
                        checked={settings.privacy.allow_friend_requests}
                        onCheckedChange={(checked) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            privacy: { ...prev.privacy, allow_friend_requests: checked }
                          }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Advanced */}
            {activeSection === 'advanced' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold mb-4">Advanced Settings</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Language</CardTitle>
                    <CardDescription>Choose your preferred language</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={settings.language}
                      onValueChange={(value) => setSettings(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="fr">Français</SelectItem>
                        <SelectItem value="de">Deutsch</SelectItem>
                        <SelectItem value="it">Italiano</SelectItem>
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>

                <Card className="border-destructive">
                  <CardHeader>
                    <CardTitle className="text-destructive">Danger Zone</CardTitle>
                    <CardDescription>These actions cannot be undone</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}
