"use client"

import { useEffect } from 'react'
import { useAuth } from "@/components/auth/auth-provider"
import { recentlyPlayedApi, type AddRecentlyPlayedDto } from "@/lib/api/recently-played"
import type { Track } from "@/types/track"

// Local storage key for recently played songs
const RECENT_SONGS_KEY = '2k-music-recent-songs'
const MAX_RECENT_SONGS = 100

interface RecentlyPlayedSong {
  id: string
  spotifyId: string
  title: string
  artist: string
  album?: string
  albumArt?: string
  duration?: number
  genre?: string
  releaseYear?: number
  playedAt: string
  playCount: number
  createdAt: string
  updatedAt: string
}

// Global service for tracking recently played songs
class GlobalRecentSongsService {
  // Local cache methods
  static getLocalRecentSongs(): RecentlyPlayedSong[] {
    try {
      const stored = localStorage.getItem(RECENT_SONGS_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      return []
    }
  }

  static addLocalRecentSong(track: Track): void {
    try {
      const recentSongs = this.getLocalRecentSongs()
      const now = new Date().toISOString()
      
      // Check if song already exists
      const existingIndex = recentSongs.findIndex(song => song.spotifyId === track.id)
      
      if (existingIndex >= 0) {
        // Update existing song - move to top and increment play count
        const existingSong = recentSongs[existingIndex]
        recentSongs.splice(existingIndex, 1)
        recentSongs.unshift({
          ...existingSong,
          playedAt: now,
          playCount: existingSong.playCount + 1,
          updatedAt: now
        })
      } else {
        // Add new song to top
        const newSong: RecentlyPlayedSong = {
          id: `recent_${track.id}_${Date.now()}`,
          spotifyId: track.id,
          title: track.title,
          artist: track.artist,
          album: track.album,
          albumArt: track.albumArt,
          duration: track.duration,
          genre: track.genre,
          releaseYear: track.year,
          playedAt: now,
          playCount: 1,
          createdAt: now,
          updatedAt: now
        }
        recentSongs.unshift(newSong)
      }

      // Keep only the most recent 100 songs
      const trimmedSongs = recentSongs.slice(0, MAX_RECENT_SONGS)
      localStorage.setItem(RECENT_SONGS_KEY, JSON.stringify(trimmedSongs))
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent('recentlyPlayedUpdated', { 
        detail: { song: track, totalCount: trimmedSongs.length } 
      }))
    } catch (error) {
      // Silent fail
    }
  }

  // Backend sync method
  static async syncToBackend(track: Track): Promise<void> {
    try {
      // Skip backend sync for local files (no valid Spotify ID on backend)
      const id = track?.id || ""
      const isLocal = id.startsWith('local-') || id.startsWith('watched-')
      if (isLocal) {
        return
      }

      const songData: AddRecentlyPlayedDto = {
        spotifyId: track.id,
        title: track.title,
        artist: track.artist,
        album: track.album,
        albumArt: track.albumArt,
        duration: track.duration,
        genre: track.genre,
        releaseYear: track.year
      }
      
      await recentlyPlayedApi.addRecentlyPlayed(songData)
    } catch (error) {
      // Don't throw - local cache should still work
    }
  }

  // Main method to add a recently played song
  static async addRecentSong(track: Track, isLoggedIn: boolean = false): Promise<void> {
    // Always add to local cache immediately for instant feedback
    this.addLocalRecentSong(track)
    
    // Sync to backend in background if user is logged in
    if (isLoggedIn) {
      this.syncToBackend(track).catch(() => {})
    }
  }
}

/**
 * Global Recently Played Tracker Component
 * 
 * This component should be placed at the app root level to track
 * recently played songs globally, regardless of which page the user is on.
 * 
 * It listens for 'trackPlayed' events dispatched by the PlayerProvider
 * and automatically adds songs to both local storage and backend (if logged in).
 */
export function GlobalRecentlyPlayedTracker() {
  const { user } = useAuth()

  useEffect(() => {
    const handleTrackPlay = async (event: CustomEvent) => {
      const track = event.detail as Track
      
      if (!track || !track.id) {
        return
      }

      try {
        // Add to recently played (local + backend if logged in)
        await GlobalRecentSongsService.addRecentSong(track, !!user)
      } catch (error) {
        // Silent fail
      }
    }

    // Listen for track played events globally
    window.addEventListener('trackPlayed', handleTrackPlay as unknown as EventListener)
    
    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('trackPlayed', handleTrackPlay as unknown as EventListener)
    }
  }, [user]) // Re-setup listener when user login state changes

  // This component doesn't render anything visible
  return null
}

// Export the service for use in other components if needed
export { GlobalRecentSongsService }
