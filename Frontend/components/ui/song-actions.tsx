"use client"

import React, { useState, useEffect } from 'react'
import { CirclePlus, Plus, Loader2, CheckCircle, Circle, Check, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Track } from '@/types/track'
import { userSongsApi } from '@/lib/api/user-songs'
import { AddToPlaylistButton } from '@/components/playlist/add-to-playlist-button'
import { DownloadButton } from '@/components/download/download-button'
import { useAuth } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils'

interface SongActionsProps {
  track: Track
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  showLabels?: boolean
  showDownload?: boolean
  isDownloading?: boolean
  className?: string
  onSaveChange?: (isSaved: boolean) => void
  onDownloadComplete?: () => void
}

export function SongActions({
  track,
  size = 'md',
  variant = 'ghost',
  showLabels = false,
  showDownload = false,
  isDownloading = false,
  className,
  onSaveChange,
  onDownloadComplete
}: SongActionsProps) {
  const { user } = useAuth()
  const [isSaved, setIsSaved] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Size configuration
  const config = {
    button: size === 'sm' ? 'h-7 w-7' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8',
    icon: size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
  }

  // Load initial state - ONLY when authenticated
  useEffect(() => {
    const loadInitialState = async () => {
      if (!track?.id || !user) {
        setInitialLoading(false)
        return
      }
      
      try {
        setInitialLoading(true)
        const savedStatus = await userSongsApi.isSaved(track.id)
        setIsSaved(savedStatus)
      } catch (error) {
        // Silent fail
      } finally {
        setInitialLoading(false)
      }
    }

    loadInitialState()
  }, [track?.id, user])

  const handleSave = async () => {
    if (!track || saveLoading || !user) return

    try {
      setSaveLoading(true)
      const newSavedState = await userSongsApi.toggleSave(track)
      setIsSaved(newSavedState)
      onSaveChange?.(newSavedState)
    } catch (error) {
      // Could add toast notification here
    } finally {
      setSaveLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <Button variant={variant} size="sm" disabled className={config.button}>
          <Loader2 className={cn(config.icon, "animate-spin")} />
        </Button>
        <Button variant={variant} size="sm" disabled className={config.button}>
          <Loader2 className={cn(config.icon, "animate-spin")} />
        </Button>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {/* Save Button */}
      <Button
        variant={variant}
        size="sm"
        onClick={handleSave}
        disabled={saveLoading || initialLoading}
        className={cn(
          "h-8 w-8 p-0",
          "transition-colors opacity-0 group-hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500",
          isSaved && "text-red-500 hover:text-red-600"
        )}
        title={isSaved ? "Remove from saved" : "Save song"}
      >
        {saveLoading ? (
          <Loader2 className={cn(config.icon, "animate-spin")} />
        ) : isSaved ? (
          <div className={cn("relative flex items-center justify-center", config.icon)}>
            <Circle 
              className="text-[#00BFFF] w-full h-full"
              fill="#00BFFF"
              stroke="#00BFFF"
            />
            <Check 
              className="absolute text-[#374151]"
              strokeWidth="2"
              style={{ width: '12px', height: '12px' }}
            />
          </div>
        ) : (
          <CirclePlus 
            className={cn(config.icon)} 
          />
        )}
        {showLabels && (
          <span className="ml-1">
            {isSaved ? "Saved" : "Save"}
          </span>
        )}
      </Button>

      {/* Add to Playlist Button */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
        <AddToPlaylistButton
          track={track}
          size={size}
          variant={variant}
          showLabel={showLabels}
        />

        {/* Download Button */}
        {showDownload && track.url && (
          <DownloadButton
            spotifyUrl={track.url}
            trackTitle={track.title}
            trackArtist={track.artist}
            size={size}
            variant="icon"
            onDownloadComplete={onDownloadComplete}
          />
        )}
      </div>
    </div>
  )
}

// Standalone components for specific use cases
export function LikeButton({ track, ...props }: Omit<SongActionsProps, 'onSaveChange'>) {
  return (
    <SongActions 
      {...props} 
      track={track}
      className={cn("gap-0", props.className)}
    >
      {/* Only renders the like button from SongActions */}
    </SongActions>
  )
}

export function SaveButton({ track, ...props }: Omit<SongActionsProps, 'onLikeChange'>) {
  return (
    <SongActions 
      {...props} 
      track={track}
      className={cn("gap-0", props.className)}
    >
      {/* Only renders the save button from SongActions */}
    </SongActions>
  )
}
