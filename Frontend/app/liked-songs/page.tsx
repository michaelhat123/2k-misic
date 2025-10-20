"use client"

import React, { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Heart, Search, Play, MoreHorizontal, Music, Loader2, Shuffle, Download, Pause, Menu, Check, List as ListIcon } from "lucide-react"
import { usePlayer } from "@/components/player/player-provider"
import { userSongsApi, SongsResponse } from "@/lib/api/user-songs"
import { SongActions } from "@/components/ui/song-actions"
import { Track } from "@/types/track"
import { SongSkeleton } from "@/components/ui/song-skeleton"
import { SearchOverlay } from "@/components/search/search-overlay"
import { useSearch } from "@/components/layout/top-navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface LikedSong {
  id: string
  spotifyId: string
  title: string
  artist: string
  album?: string
  albumArt?: string
  duration?: number
  genre?: string
  releaseYear?: number
  likedAt: string
}

export default function LikedSongsPage() {
  const [songs, setSongs] = useState<LikedSong[]>([])
  const [allSongs, setAllSongs] = useState<LikedSong[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const searchInputRef = React.useRef<HTMLInputElement | null>(null)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [sortBy, setSortBy] = useState('recently-added')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalSongs, setTotalSongs] = useState(0)
  const [viewAs, setViewAs] = useState<'compact' | 'list'>('compact')

  const { playTrack, currentTrack, isPlaying, setQueue, clearQueue, toggleShuffle, shuffle } = usePlayer()
  const { setSearchQuery: setGlobalSearch, searchQuery: globalSearch } = useSearch()

  // Track latest request to avoid out-of-order response overriding fresh results
  const requestIdRef = React.useRef(0)

  const loadSongs = async (pageNum: number = 0, search: string = '', append: boolean = false) => {
    try {
      // Increment request id; captured below to detect staleness
      const reqId = ++requestIdRef.current
      if (pageNum === 0) setLoading(true)
      else setLoadingMore(true)

      // Use smaller initial batch for faster first load
      const limit = pageNum === 0 ? 10 : 20
      
      const response: SongsResponse = await userSongsApi.getLikedSongs({
        page: pageNum,
        limit,
        search: search || undefined
      })

      // Ignore stale responses
      if (reqId !== requestIdRef.current) return

      if (append) {
        setSongs(prev => [...prev, ...response.songs as LikedSong[]])
      } else {
        setSongs(response.songs as LikedSong[])
      }

      setHasMore(response.pagination.hasNext)
      setTotalSongs(response.pagination.total)
      setPage(pageNum)
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Debounce search input so we don't fire on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300)
    return () => clearTimeout(t)
  }, [searchQuery])

  useEffect(() => {
    // Fresh search: reset paging
    setPage(0)
    loadSongs(0, debouncedQuery)
  }, [debouncedQuery])

  // Signal component is ready on mount
  useEffect(() => {
    window.dispatchEvent(new Event('contentNavComplete'))
  }, [])

  // Preload next batch when user scrolls near bottom
  useEffect(() => {
    if (songs.length > 0 && hasMore && !loadingMore) {
      const timer = setTimeout(() => {
        loadSongs(page + 1, debouncedQuery, true)
      }, 2000) // Preload after 2 seconds
      
      return () => clearTimeout(timer)
    }
  }, [songs.length, hasMore, loadingMore, page, debouncedQuery])

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    // Also drive global search overlay like homepage
    setGlobalSearch(value)
  }

  // Clear search handler to show discovery (like homepage)
  const handleClearSearch = () => {
    setSearchQuery('')
    setGlobalSearch('')
  }

  const handleHideSearchIfEmpty = () => {
    if (!searchQuery.trim()) {
      setShowSearch(false)
    }
  }

  // Focus search input when showSearch becomes true
  useEffect(() => {
    if (showSearch && searchInputRef.current) {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus()
      }, 200) // Match animation duration
      return () => clearTimeout(timer)
    }
  }, [showSearch])

  const loadMore = () => {
    if (hasMore && !loadingMore) {
      loadSongs(page + 1, searchQuery, true)
    }
  }

  const handlePlay = (song: LikedSong) => {
    const track: Track = {
      id: song.spotifyId,
      title: song.title,
      artist: song.artist,
      album: song.album || '',
      albumArt: song.albumArt || '',
      duration: song.duration || 0,
      url: '',
      createdAt: '',
      updatedAt: '',
      genre: song.genre,
      year: song.releaseYear
    }
    playTrack(track)
  }

  const handleSongRemoved = (spotifyId: string) => {
    setSongs(prev => prev.filter(song => song.spotifyId !== spotifyId))
    setTotalSongs(prev => prev - 1)
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

  // Helper function to highlight matching letters
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="text-[#00BFFF] font-medium">
          {part}
        </span>
      ) : part
    );
  };

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
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="w-8 h-8 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Liked Songs</h1>
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
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Heart className="w-8 h-8 text-white fill-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Liked Songs</h1>
                <p className="text-muted-foreground">
                  {totalSongs} {totalSongs === 1 ? 'song' : 'songs'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1">
            {songs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <Heart className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No liked songs yet</h3>
                <p className="text-muted-foreground">
                  Songs you like will appear here
                </p>
              </div>
            ) : (
              <div className="px-6 pb-6">
                {/* Playlist-style Actions */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {/* Main Play Button */}
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
                              placeholder="Search in Liked Songs"
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

                {/* Songs List */}
                <ScrollArea className="flex-1">
                  <div className="space-y-1 px-4">
                    {songs.map((song, index) => (
                      <div
                        key={song.id}
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
                    ))}
                  </div>
                </ScrollArea>

                {/* Load More */}
                {hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button
                      variant="outline"
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
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
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
