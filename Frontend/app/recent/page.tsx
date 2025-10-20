"use client"

import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
 
import { Clock, Search, Play, MoreHorizontal, Music, Loader2, Plus, Heart, X, Shuffle, Download, Pause, Menu, Check, List as ListIcon } from "lucide-react"
import { SongSkeleton } from "@/components/ui/song-skeleton"
import { usePlayer } from "@/components/player/player-provider"
import { SongActions } from "@/components/ui/song-actions"
import { Track } from "@/types/track"
import { SearchOverlay } from "@/components/search/search-overlay"
import { useSearch } from "@/components/layout/top-navigation"
import { useAuth } from "@/components/auth/auth-provider"
import { recentlyPlayedApi, type AddRecentlyPlayedDto, type RecentlyPlayedSong as ApiRecentlyPlayedSong } from "@/lib/api/recently-played"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
  isLocal?: boolean // Flag to indicate if this is from local cache
}

// Local storage key for recently played songs
const RECENT_SONGS_KEY = '2k-music-recent-songs'
const MAX_RECENT_SONGS = 100

// Hybrid local + backend service for recently played songs
class HybridRecentSongsService {
  // Local cache methods
  static getLocalRecentSongs(): RecentlyPlayedSong[] {
    try {
      const stored = localStorage.getItem(RECENT_SONGS_KEY)
      const songs = stored ? JSON.parse(stored) : []
      return songs.map((song: RecentlyPlayedSong) => ({ ...song, isLocal: true }))
    } catch (error) {
      return []
    }

  }

  static addLocalRecentSong(track: Track): void {
    try {
      const recentSongs = this.getLocalRecentSongs().map(s => {
        const { isLocal, ...songWithoutIsLocal } = s
        return songWithoutIsLocal
      })
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
          playCount: existingSong.playCount + 1
        })
      } else {
        // Add new song to top
        const newSong = {
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
    } catch (error) {
      // Silent fail
    }
  }

  

  static clearLocalRecentSongs(): void {
    try {
      localStorage.removeItem(RECENT_SONGS_KEY)
    } catch (error) {
      // Silent fail
    }
  }

  // Backend sync methods
  static async syncToBackend(track: Track): Promise<void> {
    try {
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

  static async getBackendRecentSongs(page = 0, limit = 50): Promise<RecentlyPlayedSong[]> {
    try {
      const response = await recentlyPlayedApi.getRecentlyPlayed(page, limit)
      return response.songs.map(song => ({
        id: song.id,
        spotifyId: song.spotifyId,
        title: song.title,
        artist: song.artist,
        album: song.album,
        albumArt: song.albumArt,
        duration: song.duration,
        genre: song.genre,
        releaseYear: song.releaseYear,
        playedAt: song.playedAt,
        playCount: song.playCount,
        isLocal: false
      }))
    } catch (error) {
      return []
    }
  }

  static async clearBackendRecentSongs(): Promise<void> {
    try {
      await recentlyPlayedApi.clearRecentlyPlayed()
    } catch (error) {
      throw error
    }
  }

  // Hybrid methods that combine local + backend
  static async getHybridRecentSongs(): Promise<RecentlyPlayedSong[]> {
    const localSongs = this.getLocalRecentSongs()
    const backendSongs = await this.getBackendRecentSongs()
    
    // Merge and deduplicate by spotifyId, prioritizing most recent playedAt
    const songMap = new Map<string, RecentlyPlayedSong>()
    
    // Add backend songs first
    backendSongs.forEach(song => {
      songMap.set(song.spotifyId, song)
    })
    
    // Add local songs, updating if they're more recent
    localSongs.forEach(localSong => {
      const existing = songMap.get(localSong.spotifyId)
      if (!existing || new Date(localSong.playedAt) > new Date(existing.playedAt)) {
        songMap.set(localSong.spotifyId, localSong)
      }
    })
    
    // Sort by playedAt descending and return
    return Array.from(songMap.values())
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
      .slice(0, MAX_RECENT_SONGS)
  }

  static async addRecentSong(track: Track): Promise<void> {
    // Add to local cache immediately for instant feedback
    this.addLocalRecentSong(track)
    
    // Sync to backend in background
    this.syncToBackend(track).catch(() => {})
  }

  static async clearAllRecentSongs(): Promise<void> {
    // Clear local cache immediately
    this.clearLocalRecentSongs()
    
    // Clear backend
    try {
      await this.clearBackendRecentSongs()
    } catch (error) {
      // Don't throw - local clear succeeded
    }
  }
}

export default function RecentlyPlayedPage() {
  const [songs, setSongs] = useState<RecentlyPlayedSong[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = React.useRef<HTMLInputElement | null>(null)
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null)
  const [hiddenSongs, setHiddenSongs] = useState<Set<string>>(new Set()) // Track hidden songs by spotifyId
  const [sortBy, setSortBy] = useState('recently-added')
  const [viewAs, setViewAs] = useState<'compact' | 'list'>('compact')

  const { playTrack, currentTrack, isPlaying, setQueue, clearQueue, toggleShuffle, shuffle } = usePlayer()
  const { setSearchQuery: setGlobalSearch, searchQuery: globalSearch } = useSearch()
  const { user } = useAuth()

  // Load recent songs from hybrid source (local + backend)
  useEffect(() => {
    const loadRecentSongs = async () => {
      setLoading(true)
      try {
        if (user) {
          // User is logged in - use hybrid approach
          const hybridSongs = await HybridRecentSongsService.getHybridRecentSongs()
          setSongs(hybridSongs)
        } else {
          // User not logged in - use local cache only
          const localSongs = HybridRecentSongsService.getLocalRecentSongs()
          setSongs(localSongs)
        }
      } catch (error) {
        // Fallback to local cache
        const localSongs = HybridRecentSongsService.getLocalRecentSongs()
        setSongs(localSongs)
      } finally {
        setLoading(false)
      }
    }

    loadRecentSongs()
    // Signal that page component is ready
    window.dispatchEvent(new Event('contentNavComplete'))
  }, [user])

  // Listen for recently played updates from the global tracker
  useEffect(() => {
    const handleRecentlyPlayedUpdate = async () => {
      // Refresh the list when the global tracker adds a song
      try {
        if (user) {
          const hybridSongs = await HybridRecentSongsService.getHybridRecentSongs()
          setSongs(hybridSongs)
        } else {
          const localSongs = HybridRecentSongsService.getLocalRecentSongs()
          setSongs(localSongs)
        }
      } catch (error) {
        // Silent fail
      }
    }

    // Listen for storage changes (when global tracker updates localStorage)
    window.addEventListener('storage', handleRecentlyPlayedUpdate)
    
    // Also listen for a custom event we can dispatch from the global tracker
    window.addEventListener('recentlyPlayedUpdated', handleRecentlyPlayedUpdate)
    
    return () => {
      window.removeEventListener('storage', handleRecentlyPlayedUpdate)
      window.removeEventListener('recentlyPlayedUpdated', handleRecentlyPlayedUpdate)
    }
  }, [user])

  // Instant filtering based on search query and hidden songs
  const filteredSongs = React.useMemo(() => {
    // First filter out hidden songs
    const visibleSongs = songs.filter(song => !hiddenSongs.has(song.spotifyId))
    
    if (!searchQuery.trim()) return visibleSongs
    
    const query = searchQuery.toLowerCase()
    return visibleSongs.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.album?.toLowerCase().includes(query)
    )
  }, [songs, searchQuery, hiddenSongs])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  // Focus input whenever it becomes visible
  useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }, [showSearch])

  const handleHideSearchIfEmpty = () => {
    if (!searchQuery.trim()) {
      setShowSearch(false)
    }
  }

  const handleClearSearch = () => {
    setSearchQuery('')
  }

  // Helper function to highlight matching letters
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="text-[#00BFFF] font-medium">
          {part}
        </span>
      ) : part
    )
  }

  const handlePlay = async (song: RecentlyPlayedSong) => {
    try {
      setLoadingTrack(song.spotifyId)
      
      const track: Track = {
        id: song.spotifyId,
        title: song.title,
        artist: song.artist,
        album: song.album || 'Unknown Album',
        albumArt: song.albumArt || '',
        duration: song.duration || 0,
        url: '',
        createdAt: song.playedAt,
        updatedAt: song.playedAt,
        genre: song.genre,
        year: song.releaseYear
      }
      
      await playTrack(track)
    } catch (error) {
      // Silent fail
    } finally {
      setLoadingTrack(null)
    }
  }

  const handleHideSong = (song: RecentlyPlayedSong) => {
    // Add song to hidden set (removes from display but keeps in cache)
    setHiddenSongs(prev => new Set(prev).add(song.spotifyId))
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const renderDuration = (d: any) => {
    if (d == null) return '-:--'
    let secs: number | null = null
    if (typeof d === 'number') {
      secs = d > 10000 ? Math.floor(d / 1000) : Math.floor(d)
    } else if (typeof d === 'string') {
      const m = d.match(/^\s*(\d+):(\d{1,2})\s*$/)
      if (m) {
        secs = parseInt(m[1], 10) * 60 + parseInt(m[2], 10)
      } else {
        const n = Number(d)
        if (!Number.isNaN(n)) secs = n > 10000 ? Math.floor(n / 1000) : Math.floor(n)
      }
    }
    if (secs == null || secs < 0) return '-:--'
    const mm = Math.floor(secs / 60)
    const ss = (secs % 60).toString().padStart(2, '0')
    return `${mm}:${ss}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) {
      return 'Just now'
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else if (diffDays < 7) {
      return `${diffDays}d ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    }
  }

  return (
    <>
      {/* If global search is active, show the same overlay used on the homepage and hide page content */}
      {globalSearch?.trim() ? (
        <SearchOverlay />
      ) : loading ? (
        <div className="h-full flex flex-col">
          {/* Header Skeleton */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Recently Played</h1>
                <div className="w-20 h-4 bg-muted rounded animate-pulse mt-1"></div>
              </div>
            </div>
            <div className="flex justify-end items-center h-12">
              <div className="w-10 h-10 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          {/* Songs Skeleton */}
          <div className="flex-1 px-6">
            <SongSkeleton count={10} />
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Recently Played</h1>
                <p className="text-muted-foreground">
                  {songs.length} {songs.length === 1 ? 'song' : 'songs'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1">
            {songs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <Clock className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No recently played songs</h3>
                <p className="text-muted-foreground">
                  Songs you play will appear here
                </p>
              </div>
            ) : (
              <div className="px-6 pb-6">
                {/* Playlist-style Actions */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                {/* Play Button */}
                <button 
                  onClick={() => {
                    if (songs.length > 0) {
                      clearQueue()
                      const tracksToPlay = songs.map(song => ({
                        id: song.spotifyId,
                        title: song.title,
                        artist: song.artist,
                        album: song.album || '',
                        albumArt: song.albumArt,
                        duration: song.duration || 0,
                        url: '',
                        genre: song.genre,
                        year: song.releaseYear,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      }))
                      setQueue(tracksToPlay)
                      playTrack(tracksToPlay[0])
                    }
                  }}
                  disabled={songs.length === 0}
                  className="w-12 h-12 bg-[#00BFFF] hover:bg-[#00BFFF]/80 rounded-full flex items-center justify-center transition-colors disabled:bg-[#00BFFF]/50 disabled:cursor-not-allowed"
                >
                  <Play className="w-5 h-5 text-[#222222] ml-0.5" />
                </button>
                
                {/* Shuffle Button */}
                <button 
                  onClick={toggleShuffle}
                  className={`p-2 transition-colors ${
                    shuffle 
                      ? 'text-[#00BFFF] hover:text-[#00BFFF]/80' 
                      : 'text-gray-400 hover:text-white'
                  }`}
                  title={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
                >
                  <Shuffle className="w-5 h-5" />
                </button>
              </div>

              {/* Search and Sort Controls */}
              <div className="flex justify-end items-center h-12 space-x-2">
                {/* Search (fixed-size overlay to avoid layout flashes) */}
                <div className="relative w-[256px] h-12">
                  <AnimatePresence initial={false} mode="sync">
                  {!showSearch ? (
                    <motion.div
                      key="search-icon"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute right-0 top-0 h-12 flex items-center"
                      style={{ background: 'transparent', border: 'none', outline: 'none', willChange: 'opacity, transform' }}
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Search"
                        type="button"
                        tabIndex={-1}
                        onMouseDown={(e) => {
                          e.preventDefault()
                        }}
                        onClick={() => setShowSearch(true)}
                        className="group h-10 w-10 focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none focus:shadow-none focus-visible:shadow-none ring-0 ring-offset-0 ring-transparent focus:ring-transparent focus-visible:ring-transparent hover:bg-transparent active:bg-transparent border-0"
                        style={{ 
                          WebkitTapHighlightColor: 'transparent',
                          outline: 'none !important',
                          border: 'none !important',
                          boxShadow: 'none !important'
                        }}
                        title="Search"
                      >
                        <Search className="h-5 w-5 text-muted-foreground group-hover:text-[#00BFFF] transition-colors" />
                      </Button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="search-input"
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      exit={{ opacity: 0, scaleX: 0 }}
                      transition={{ duration: 0.12, ease: 'easeOut' }}
                      className="absolute inset-0 flex items-center focus-within:outline-none focus-within:ring-0 focus-within:ring-offset-0 focus-within:shadow-none"
                      style={{ overflow: 'hidden', willChange: 'opacity, transform', background: 'transparent', transformOrigin: 'right center' }}
                    >
                      <div className="relative w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          ref={searchInputRef}
                          placeholder="Search Recently Played"
                          value={searchQuery}
                          onChange={(e) => handleSearch(e.target.value)}
                          onBlur={handleHideSearchIfEmpty}
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              if (!searchQuery.trim()) setShowSearch(false);
                            }
                          }}
                          className="pl-12 pr-4 h-12 rounded-full bg-background/60 border border-[#1f2937] focus:border-[#1f2937] focus-visible:border-[#1f2937] hover:bg-background/80 transition-colors outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 ring-transparent focus:ring-transparent focus-visible:ring-transparent shadow-none focus:shadow-none"
                          style={{ boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
                        />
                      </div>
                    </motion.div>
                  )}
                  </AnimatePresence>
                </div>

                {/* Sort Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="group h-10 w-10 hover:scale-105 transition-transform focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none focus:shadow-none focus-visible:shadow-none ring-0 ring-offset-0 ring-transparent focus:ring-transparent focus-visible:ring-transparent hover:bg-transparent active:bg-transparent"
                      style={{ WebkitTapHighlightColor: 'transparent' }}
                      title="Sort options"
                    >
                      <Menu className="h-5 w-5 text-muted-foreground group-hover:text-[#00BFFF] transition-colors" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background backdrop-blur-md border-border">
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Sort by</div>
                    <DropdownMenuItem 
                      onClick={() => setSortBy('title')}
                      className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                    >
                      <span className={sortBy === 'title' ? 'text-[#00BFFF]' : ''}>Title</span>
                      {sortBy === 'title' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSortBy('artist')}
                      className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                    >
                      <span className={sortBy === 'artist' ? 'text-[#00BFFF]' : ''}>Artist</span>
                      {sortBy === 'artist' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSortBy('album')}
                      className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                    >
                      <span className={sortBy === 'album' ? 'text-[#00BFFF]' : ''}>Album</span>
                      {sortBy === 'album' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSortBy('duration')}
                      className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                    >
                      <span className={sortBy === 'duration' ? 'text-[#00BFFF]' : ''}>Duration</span>
                      {sortBy === 'duration' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setSortBy('recently-added')}
                      className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                    >
                      <span className={sortBy === 'recently-added' ? 'text-[#00BFFF]' : ''}>Recently played</span>
                      {sortBy === 'recently-added' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator className="bg-border" />
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">View as</div>
                    <DropdownMenuItem 
                      onClick={() => setViewAs('compact')}
                      className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                    >
                      <div className="flex items-center">
                        <Menu className="h-4 w-4 mr-2" />
                        <span className={viewAs === 'compact' ? 'text-[#00BFFF]' : ''}>Compact</span>
                      </div>
                      {viewAs === 'compact' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setViewAs('list')}
                      className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                    >
                      <div className="flex items-center">
                        <ListIcon className="h-4 w-4 mr-2" />
                        <span className={viewAs === 'list' ? 'text-[#00BFFF]' : ''}>List</span>
                      </div>
                      {viewAs === 'list' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              </div>

                {/* Songs List */}
                <ScrollAreaPrimitive.Root className="h-[calc(100vh-350px)] relative">
                  <ScrollAreaPrimitive.Viewport className="h-full w-full rounded-[inherit]" style={{ paddingBottom: '80px' }}>
                    <div className="space-y-1 px-4">
                      {filteredSongs.map((song, index) => (
                      <div
                        key={`${song.id}-${index}`}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 group cursor-pointer transition-colors"
                        onClick={() => handlePlay(song)}
                        style={{ minHeight: '60px' }}
                      >
                        {/* Index */}
                        <div className="w-6 text-center text-muted-foreground text-xs">
                          <span className="group-hover:hidden">{index + 1}</span>
                          {currentTrack?.id === song.spotifyId && isPlaying ? (
                            <Pause className="w-3 h-3 hidden group-hover:block mx-auto" />
                          ) : (
                            <Play className="w-3 h-3 hidden group-hover:block mx-auto" />
                          )}
                        </div>

                        {/* Album Art */}
                        <div className="h-10 w-10 rounded-md flex-shrink-0 relative overflow-hidden bg-muted rounded-md">
                          {song.albumArt ? (
                            <img
                              src={song.albumArt}
                              alt={song.title}
                              loading="eager"
                              decoding="async"
                              width={40}
                              height={40}
                              className="absolute inset-0 object-cover w-10 h-10 opacity-100"
                              style={{ imageRendering: 'auto', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}
                            />
                          ) : (
                            <div className="rounded-md bg-muted flex items-center justify-center w-10 h-10">
                              <Music className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>

                        {/* Song Info */}
                        <div className="min-w-0 w-80 lg:w-[420px]">
                          <p className={`font-medium truncate text-sm ${currentTrack?.id === song.spotifyId ? 'text-[#00BFFF]' : ''}`}>
                            {highlightMatch(song.title, searchQuery)}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{highlightMatch(song.artist, searchQuery)}</p>
                        </div>

                        {/* Album */}
                        <div className="hidden lg:block flex-1 lg:max-w-[35%] min-w-0 text-xs text-muted-foreground">
                          <p className="truncate text-left">{song.album || 'Unknown Album'}</p>
                        </div>

                        {/* Duration */}
                        <div className="w-20 flex-shrink-0 pr-4 text-xs text-muted-foreground text-right">
                          {renderDuration(song.duration)}
                        </div>
                      </div>
                    ))}
                    </div>
                  </ScrollAreaPrimitive.Viewport>
                  <ScrollBar />
                  <ScrollAreaPrimitive.Corner />
                </ScrollAreaPrimitive.Root>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
