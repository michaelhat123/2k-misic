"use client"

import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bookmark, Search, Play, MoreHorizontal, Music, Loader2, Plus, Heart, X, Shuffle, Download, Pause, Menu, Check, List as ListIcon, Trash2 } from "lucide-react"
import { SongSkeleton } from "@/components/ui/song-skeleton"
import { usePlayer } from "@/components/player/player-provider"
import { userSongsApi, SongsResponse, AlbumsResponse, AlbumActionData } from "@/lib/api/user-songs"
import { SongActions } from "@/components/ui/song-actions"
import { Track } from "@/types/track"
import { SearchOverlay } from "@/components/search/search-overlay"
import { useSearch } from "@/components/layout/top-navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface SavedSong {
  id: string
  spotifyId: string
  title: string
  artist: string
  album?: string
  albumArt?: string
  duration?: number
  genre?: string
  releaseYear?: number
  savedAt: string
}

interface SavedAlbum {
  id: string
  spotifyId: string
  name: string
  artist: string
  albumArt?: string
  totalTracks?: number
  genre?: string
  releaseYear?: number
  albumType?: string
  savedAt: string
}

export default function SavedSongsPage() {
  const [activeTab, setActiveTab] = useState<'songs' | 'albums'>('songs')
  
  // Songs state
  const [songs, setSongs] = useState<SavedSong[]>([])
  const [allSongs, setAllSongs] = useState<SavedSong[]>([]) // Store all songs for instant filtering
  const [songsLoading, setSongsLoading] = useState(true)
  const [songsPage, setSongsPage] = useState(0)
  const [songsHasMore, setSongsHasMore] = useState(true)
  const [songsLoadingMore, setSongsLoadingMore] = useState(false)
  const [totalSongs, setTotalSongs] = useState(0)
  
  // Albums state
  const [albums, setAlbums] = useState<SavedAlbum[]>([])
  const [allAlbums, setAllAlbums] = useState<SavedAlbum[]>([]) // Store all albums for instant filtering
  const [albumsLoading, setAlbumsLoading] = useState(true)
  const [albumsPage, setAlbumsPage] = useState(0)
  const [albumsHasMore, setAlbumsHasMore] = useState(true)
  const [albumsLoadingMore, setAlbumsLoadingMore] = useState(false)
  const [totalAlbums, setTotalAlbums] = useState(0)
  
  // Shared state
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = React.useRef<HTMLInputElement | null>(null)
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null)
  const [likedSongs, setLikedSongs] = useState<Set<string>>(new Set())
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('recently-added')
  const [viewAs, setViewAs] = useState<'compact' | 'list'>('compact')
  
  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [albumToDelete, setAlbumToDelete] = useState<SavedAlbum | null>(null)

  const { playTrack, currentTrack, isPlaying, setQueue, clearQueue, toggleShuffle, shuffle } = usePlayer()
  const { setSearchQuery: setGlobalSearch, searchQuery: globalSearch } = useSearch()
  const router = useRouter()
  const requestIdRef = React.useRef(0)

  const loadSongs = async (pageNum: number = 0, search: string = '', append: boolean = false) => {
    try {
      const reqId = ++requestIdRef.current
      if (pageNum === 0) setSongsLoading(true)
      else setSongsLoadingMore(true)

      // Use smaller initial batch for faster first load
      const limit = pageNum === 0 ? 10 : 20
      
      const response: SongsResponse = await userSongsApi.getSavedSongs({
        page: pageNum,
        limit,
        search: search || undefined
      })

      if (reqId !== requestIdRef.current) return

      if (append) {
        setSongs(prev => [...prev, ...response.songs as SavedSong[]])
        setAllSongs(prev => [...prev, ...response.songs as SavedSong[]])
      } else {
        setSongs(response.songs as SavedSong[])
        setAllSongs(response.songs as SavedSong[])
      }

      setSongsHasMore(response.pagination.hasNext)
      setTotalSongs(response.pagination.total)
      setSongsPage(pageNum)
    } catch (error) {
      // Silent fail
    } finally {
      setSongsLoading(false)
      setSongsLoadingMore(false)
    }
  }

  const loadAlbums = async (pageNum: number = 0, search: string = '', append: boolean = false) => {
    try {
      const reqId = ++requestIdRef.current
      if (pageNum === 0) setAlbumsLoading(true)
      else setAlbumsLoadingMore(true)

      // Use smaller initial batch for faster first load
      const limit = pageNum === 0 ? 10 : 20
      
      const response: AlbumsResponse = await userSongsApi.getSavedAlbums({
        page: pageNum,
        limit,
        search: search || undefined
      })

      if (reqId !== requestIdRef.current) return

      if (append) {
        setAlbums(prev => [...prev, ...response.albums as SavedAlbum[]])
        setAllAlbums(prev => [...prev, ...response.albums as SavedAlbum[]])
      } else {
        setAlbums(response.albums as SavedAlbum[])
        setAllAlbums(response.albums as SavedAlbum[])
      }

      setAlbumsHasMore(response.pagination.hasNext)
      setTotalAlbums(response.pagination.total)
      setAlbumsPage(pageNum)
    } catch (error) {
      // Silent fail
    } finally {
      setAlbumsLoading(false)
      setAlbumsLoadingMore(false)
    }
  }

  // Initial load only - no debouncing for instant search
  useEffect(() => {
    if (activeTab === 'songs') {
      loadSongs(0, '', false) // Load all songs initially
    } else {
      loadAlbums(0, '', false) // Load all albums initially
    }
    // Signal that page component is ready
    window.dispatchEvent(new Event('contentNavComplete'))
  }, [activeTab])

  // Preload next batch for better UX
  useEffect(() => {
    if (activeTab === 'songs' && allSongs.length > 0 && songsHasMore && !songsLoadingMore && !searchQuery.trim()) {
      const timer = setTimeout(() => {
        loadSongs(songsPage + 1, '', true)
      }, 1500) // Preload after 1.5 seconds
      
      return () => clearTimeout(timer)
    }
  }, [activeTab, allSongs.length, songsHasMore, songsLoadingMore, songsPage, searchQuery])

  useEffect(() => {
    if (activeTab === 'albums' && allAlbums.length > 0 && albumsHasMore && !albumsLoadingMore && !searchQuery.trim()) {
      const timer = setTimeout(() => {
        loadAlbums(albumsPage + 1, '', true)
      }, 1500) // Preload after 1.5 seconds
      
      return () => clearTimeout(timer)
    }
  }, [activeTab, allAlbums.length, albumsHasMore, albumsLoadingMore, albumsPage, searchQuery])

  // Note: We no longer couple local search to global search; no cleanup needed here.

  // Instant filtering based on search query
  const filteredSongs = React.useMemo(() => {
    if (!searchQuery.trim()) return allSongs
    
    const query = searchQuery.toLowerCase()
    return allSongs.filter(song => 
      song.title.toLowerCase().includes(query) ||
      song.artist.toLowerCase().includes(query) ||
      song.album?.toLowerCase().includes(query)
    )
  }, [allSongs, searchQuery])

  const filteredAlbums = React.useMemo(() => {
    if (!searchQuery.trim()) return allAlbums
    
    const query = searchQuery.toLowerCase()
    return allAlbums.filter(album => 
      album.name.toLowerCase().includes(query) ||
      album.artist.toLowerCase().includes(query)
    )
  }, [allAlbums, searchQuery])

  const handleSearch = (value: string) => {
    // Local filtering only; do not update global/top search
    setSearchQuery(value)
  }

  // Focus input whenever it becomes visible
  useEffect(() => {
    if (showSearch) {
      // Slight delay ensures element is in DOM
      setTimeout(() => searchInputRef.current?.focus(), 0)
    }
  }, [showSearch])

  const handleHideSearchIfEmpty = () => {
    if (!searchQuery.trim()) {
      setShowSearch(false)
    }
  }

  // Clear local search only
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

  const loadMore = () => {
    if (activeTab === 'songs' && songsHasMore && !songsLoadingMore) {
      loadSongs(songsPage + 1, searchQuery, true)
    } else if (activeTab === 'albums' && albumsHasMore && !albumsLoadingMore) {
      loadAlbums(albumsPage + 1, searchQuery, true)
    }
  }

  const handlePlay = async (song: SavedSong) => {
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
        createdAt: song.savedAt,
        updatedAt: song.savedAt
      }
      
      await playTrack(track)
    } catch (error) {
      // Silent fail
    } finally {
      setLoadingTrack(null)
    }
  }

  const handleSongRemoved = (spotifyId: string) => {
    setSongs(prev => prev.filter(song => song.spotifyId !== spotifyId))
    setAllSongs(prev => prev.filter(song => song.spotifyId !== spotifyId))
    setTotalSongs(prev => prev - 1)
  }

  const handleAlbumRemoved = (spotifyId: string) => {
    setAlbums(prev => prev.filter(album => album.spotifyId !== spotifyId))
    setAllAlbums(prev => prev.filter(album => album.spotifyId !== spotifyId))
    setTotalAlbums(prev => prev - 1)
  }

  const handleLike = async (song: SavedSong) => {
    try {
      setActionLoading(song.spotifyId)
      const isLiked = likedSongs.has(song.spotifyId)
      
      if (isLiked) {
        await userSongsApi.unlikeSong(song.spotifyId)
        setLikedSongs(prev => {
          const newSet = new Set(prev)
          newSet.delete(song.spotifyId)
          return newSet
        })
      } else {
        const track: Track = {
          id: song.spotifyId,
          title: song.title,
          artist: song.artist,
          album: song.album || 'Unknown Album',
          albumArt: song.albumArt || '',
          duration: song.duration || 0,
          url: '',
          createdAt: song.savedAt,
          updatedAt: song.savedAt
        }
        await userSongsApi.likeSong(track)
        setLikedSongs(prev => new Set(prev).add(song.spotifyId))
      }
    } catch (error) {
      // Silent fail
    } finally {
      setActionLoading(null)
    }
  }

  const handleRemove = async (song: SavedSong) => {
    try {
      setActionLoading(song.spotifyId)
      await userSongsApi.unsaveSong(song.spotifyId)
      handleSongRemoved(song.spotifyId)
    } catch (error) {
      // Silent fail
    } finally {
      setActionLoading(null)
    }
  }

  const handleAlbumRemove = async (album: SavedAlbum) => {
    try {
      setActionLoading(album.spotifyId)
      await userSongsApi.unsaveAlbum(album.spotifyId)
      handleAlbumRemoved(album.spotifyId)
    } catch (error) {
      // Silent fail
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteAlbum = (album: SavedAlbum) => {
    setAlbumToDelete(album)
    setShowDeleteDialog(true)
  }

  const confirmDeleteAlbum = async () => {
    if (!albumToDelete) return
    
    try {
      setActionLoading(albumToDelete.spotifyId)
      await userSongsApi.unsaveAlbum(albumToDelete.spotifyId)
      handleAlbumRemoved(albumToDelete.spotifyId)
      setShowDeleteDialog(false)
      setAlbumToDelete(null)
    } catch (error) {
      // Silent fail
    } finally {
      setActionLoading(null)
    }
  }

  const cancelDeleteAlbum = () => {
    setShowDeleteDialog(false)
    setAlbumToDelete(null)
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const loading = activeTab === 'songs' ? songsLoading : albumsLoading
  const currentItems = activeTab === 'songs' ? filteredSongs : filteredAlbums
  const totalItems = activeTab === 'songs' ? totalSongs : totalAlbums
  const hasMoreItems = activeTab === 'songs' ? songsHasMore : albumsHasMore
  const loadingMoreItems = activeTab === 'songs' ? songsLoadingMore : albumsLoadingMore

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
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                <Plus className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Saved Songs</h1>
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
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
            <Plus className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Your Library</h1>
            <p className="text-muted-foreground">
              {totalItems} {activeTab === 'songs' ? (totalItems === 1 ? 'song' : 'songs') : (totalItems === 1 ? 'album' : 'albums')}
            </p>
        </div>
        </div>
        
        {/* Pills Tabs */}
        <div className="mb-4">
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => setActiveTab('songs')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === 'songs'
                  ? 'bg-[#00BFFF] text-white shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              Songs
            </button>
            <button
              onClick={() => setActiveTab('albums')}
              className={`inline-flex items-center justify-center whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                activeTab === 'albums'
                  ? 'bg-[#00BFFF] text-white shadow-lg'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
            >
              Albums
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        {currentItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <Plus className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              No saved {activeTab === 'songs' ? 'songs' : 'albums'} yet
            </h3>
            <p className="text-muted-foreground">
              Start saving {activeTab === 'songs' ? 'songs' : 'albums'} to see them here
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
                if (activeTab === 'songs' && songs.length > 0) {
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
                    createdAt: song.savedAt,
                    updatedAt: song.savedAt
                  }))
                  setQueue(tracksToPlay)
                  playTrack(tracksToPlay[0])
                }
                // TODO: Handle album play - would need to fetch album tracks
              }}
              disabled={currentItems.length === 0}
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
                    // Prevent the button from receiving focus (which can show a square border)
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
                    placeholder={`Search in Saved ${activeTab === 'songs' ? 'Songs' : 'Albums'}`}
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
                onClick={() => setSortBy('recently-added')}
                className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
              >
                <span className={sortBy === 'recently-added' ? 'text-[#00BFFF]' : ''}>Recently added</span>
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

            {/* Content List */}
            <ScrollArea className="flex-1">
            <div className="space-y-1 px-4">
              {activeTab === 'songs' ? (
                // Songs List
                filteredSongs.map((song, index) => (
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
                        style={{
                          imageRendering: 'auto',
                          backfaceVisibility: 'hidden',
                          transform: 'translateZ(0)'
                        }}
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
                  <div className="hidden lg:block flex-1 min-w-0 text-xs text-muted-foreground">
                    <p className="truncate text-left">{song.album || 'Unknown Album'}</p>
                  </div>

                  {/* Duration */}
                  <div className="hidden sm:block w-16 text-xs text-muted-foreground text-right">
                    {song.duration ? `${Math.floor(song.duration / 60)}:${(Math.floor(song.duration) % 60).toString().padStart(2, '0')}` : '-:--'}
                  </div>
                </div>
                ))
              ) : (
                // Albums List
                filteredAlbums.map((album, index) => (
                  <div
                    key={`${album.id}-${index}`}
                    className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 group cursor-pointer transition-colors"
                    onClick={() => router.push(`/album/${album.spotifyId}`)}
                    style={{ minHeight: '60px' }}
                  >
                    {/* Index */}
                    <div className="w-6 text-center text-muted-foreground text-xs">
                      <span className="group-hover:hidden">{index + 1}</span>
                      <Play className="w-3 h-3 hidden group-hover:block mx-auto" />
                    </div>

                    {/* Album Art */}
                    <div className="h-10 w-10 rounded-md flex-shrink-0 relative overflow-hidden bg-muted rounded-md">
                      {album.albumArt ? (
                        <img
                          src={album.albumArt}
                          alt={album.name}
                          loading="eager"
                          decoding="async"
                          width={40}
                          height={40}
                          className="absolute inset-0 object-cover w-10 h-10 opacity-100"
                          style={{
                            imageRendering: 'auto',
                            backfaceVisibility: 'hidden',
                            transform: 'translateZ(0)'
                          }}
                        />
                      ) : (
                        <div className="rounded-md bg-muted flex items-center justify-center w-10 h-10">
                          <Music className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Album Info */}
                    <div className="min-w-0 w-80 lg:w-[420px]">
                      <p className="font-medium truncate text-sm">
                        {highlightMatch(album.name, searchQuery)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {highlightMatch(album.artist, searchQuery)} • {album.totalTracks || 0} tracks
                      </p>
                    </div>

                    {/* Album Type */}
                    <div className="hidden lg:block flex-1 min-w-0 text-xs text-muted-foreground">
                      <p className="truncate text-left">{album.albumType || 'Album'}</p>
                    </div>

                    {/* Release Year */}
                    <div className="hidden sm:block w-16 text-xs text-muted-foreground text-right">
                      {album.releaseYear || '-'}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                            title="More options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-48 bg-background backdrop-blur-md border-border shadow-2xl" align="end" forceMount>
                          <DropdownMenuItem 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteAlbum(album)
                            }}
                            className="flex items-center text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer text-sm h-9 rounded-md"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Remove from library</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Load More Button - Only show when not searching */}
            {hasMoreItems && !searchQuery.trim() && (
              <div className="flex justify-center mt-6">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMoreItems}
                >
                  {loadingMoreItems ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </Button>
              </div>
            )}
            </ScrollArea>
          </div>
        )}
      </div>
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md bg-background backdrop-blur-md border-border">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-semibold flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span>Remove Album</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Album Info */}
            <div className="flex items-center space-x-3">
              {albumToDelete?.albumArt ? (
                <img
                  src={albumToDelete.albumArt}
                  alt={albumToDelete.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="text-white font-medium">{albumToDelete?.name}</h3>
                <p className="text-sm text-gray-400">
                  {albumToDelete?.artist} • {albumToDelete?.totalTracks || 0} tracks
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-200 text-sm">
                This album will be removed from your library. You can always save it again later.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                onClick={cancelDeleteAlbum}
                variant="ghost"
                className="rounded-full h-10 px-5"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeleteAlbum}
                disabled={actionLoading === albumToDelete?.spotifyId}
                className="bg-red-600 text-white hover:bg-red-700 rounded-full h-10 px-5"
              >
                {actionLoading === albumToDelete?.spotifyId ? 'Removing...' : 'Remove Album'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
