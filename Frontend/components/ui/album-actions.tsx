"use client"

import React, { useState, useEffect } from 'react'
import { CirclePlus, Loader2, CheckCircle, Circle, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { userSongsApi, AlbumActionData } from '@/lib/api/user-songs'
import { useAuth } from '@/components/auth/auth-provider'
import { cn } from '@/lib/utils'

interface AlbumActionsProps {
  album: AlbumActionData
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'ghost' | 'outline'
  showLabels?: boolean
  className?: string
  onSaveChange?: (isSaved: boolean) => void
}

export function AlbumActions({
  album,
  size = 'md',
  variant = 'ghost',
  showLabels = false,
  className,
  onSaveChange
}: AlbumActionsProps) {
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
      if (!album?.spotifyId || !user) {
        setInitialLoading(false)
        return
      }
      
      try {
        setInitialLoading(true)
        const savedStatus = await userSongsApi.isAlbumSaved(album.spotifyId)
        setIsSaved(savedStatus)
      } catch (error) {
        // Silent fail
      } finally {
        setInitialLoading(false)
      }
    }

    loadInitialState()
  }, [album?.spotifyId, user])

  const handleSave = async () => {
    if (!album || saveLoading || !user) return

    try {
      setSaveLoading(true)
      const newSavedState = await userSongsApi.toggleAlbumSave(album)
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
        title={isSaved ? "Remove from saved albums" : "Save album"}
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
    </div>
  )
}
