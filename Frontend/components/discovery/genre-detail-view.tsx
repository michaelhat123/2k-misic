"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { ChevronLeft, Play, Pause, Music, Shuffle, Download, MoreHorizontal } from "lucide-react"
import { usePlayer } from "@/components/player/player-provider"
import { SongActions } from "@/components/ui/song-actions"
import { getTrackStream } from "@/lib/api/youtube-music"

interface GenreDetailViewProps {
  genreName: string
  artistName: string
  spotifyId: string
  onBack: () => void
}

export function GenreDetailView({ genreName, artistName, spotifyId, onBack }: GenreDetailViewProps) {
  const [tracks, setTracks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [scrollY, setScrollY] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const { playTrack, currentTrack, isPlaying } = usePlayer()
  const [playingTrack, setPlayingTrack] = useState<string | null>(null)

  useEffect(() => {
    fetchGenreTracks()
  }, [genreName, artistName])

  const fetchGenreTracks = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('auth_token')
      
      // Search for tracks by artist or genre
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/search?q=${encodeURIComponent(artistName)}&type=track&limit=50`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setTracks(data.tracks?.items || [])
      }
    } catch (error) {
      console.error('Failed to fetch tracks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayTrack = async (track: any) => {
    try {
      setPlayingTrack(track.id)
      
      const streamData = await getTrackStream({
        spotifyId: track.id,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        title: track.name || 'Unknown Title',
        album: track.album?.name || 'Unknown Album'
      })

      if (streamData && streamData.streamUrl) {
        playTrack({
          id: track.id,
          title: track.name,
          artist: track.artists?.map((artist: any) => artist.name).join(', ') || '',
          album: track.album?.name || '',
          albumArt: track.album?.images?.[0]?.url || '',
          duration: track.duration_ms ? Math.floor(track.duration_ms / 1000) : 0,
          url: streamData.streamUrl,
          genre: genreName,
          year: track.album?.release_date ? new Date(track.album.release_date).getFullYear() : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
      }
      setPlayingTrack(null)
    } catch (error) {
      console.error('Error playing track:', error)
      setPlayingTrack(null)
    }
  }

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  // Scroll detection
  useEffect(() => {
    const scrollElement = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]')
    if (!scrollElement) return

    const handleScroll = () => {
      setScrollY(scrollElement.scrollTop)
    }

    scrollElement.addEventListener('scroll', handleScroll)
    return () => scrollElement.removeEventListener('scroll', handleScroll)
  }, [])

  const headerOpacity = Math.min(scrollY / 160, 1)
  const showFloatingHeader = scrollY > 80

  return (
    <div className="relative h-full">
      <ScrollArea className="h-full" ref={scrollRef}>
        {/* Header */}
        <div className="pt-6 pr-6 pb-6 pl-3">
          <div className="flex items-end space-x-6">
            {/* Back Button */}
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-white/70 hover:text-white transition-colors mb-4"
            >
              <ChevronLeft className="h-6 w-6" />
              <span>Back</span>
            </button>
          </div>

          <div className="flex items-end space-x-6 mt-4">
            <div className="relative group">
              <div className="w-48 h-48 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                <Music className="w-24 h-24 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <div className="text-sm text-white/70 mb-2">Genre</div>
              <h1 className="text-6xl font-black text-white mb-4 leading-tight">
                {genreName}
              </h1>
              <div className="text-sm text-white/70">
                {tracks.length} songs • Featuring {artistName}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-4 mt-6">
            <button
              onClick={() => tracks.length > 0 && handlePlayTrack(tracks[0])}
              className="w-12 h-12 bg-[#00BFFF] hover:bg-[#00BFFF]/80 rounded-full flex items-center justify-center transition-colors"
            >
              <Play className="w-5 h-5 text-[#222222] ml-0.5" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Shuffle className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Download className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tracks List */}
        <div className="px-6 pb-6">
          {loading ? (
            <div className="space-y-1 animate-pulse">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-md">
                  <div className="w-6 h-4 bg-gray-700 rounded"></div>
                  <div className="w-10 h-10 bg-gray-700 rounded-md"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-1">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-800/50 transition-colors cursor-pointer group"
                  onClick={() => handlePlayTrack(track)}
                >
                  {/* Track Number */}
                  <div className="w-6 text-center text-sm text-gray-400 group-hover:hidden">
                    {index + 1}
                  </div>
                  <div className="w-6 flex items-center justify-center hidden group-hover:flex">
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Pause className="h-4 w-4 text-white" />
                    ) : (
                      <Play className="h-4 w-4 text-white" />
                    )}
                  </div>

                  {/* Album Art */}
                  <OptimizedImage
                    src={track.album?.images?.[0]?.url || ''}
                    alt={track.name}
                    className="w-10 h-10 rounded-md"
                    fallbackChar={<Music className="h-4 w-4" />}
                  />

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-white truncate">
                      {track.name}
                    </div>
                    <div className="text-xs text-gray-400 truncate">
                      {track.artists?.map((artist: any) => artist.name).join(', ')}
                    </div>
                  </div>

                  {/* Album Name */}
                  <div className="hidden lg:block flex-1 min-w-0">
                    <div className="text-sm text-gray-400 truncate">
                      {track.album?.name}
                    </div>
                  </div>

                  {/* Duration */}
                  <div className="text-sm text-gray-400 w-16 text-right">
                    {formatDuration(track.duration_ms)}
                  </div>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100">
                    <SongActions
                      track={{
                        id: track.id,
                        title: track.name,
                        artist: track.artists?.map((artist: any) => artist.name).join(', ') || '',
                        album: track.album?.name || '',
                        albumArt: track.album?.images?.[0]?.url || '',
                        duration: track.duration_ms ? Math.floor(track.duration_ms / 1000) : 0,
                        url: '',
                        genre: genreName,
                        year: track.album?.release_date ? new Date(track.album.release_date).getFullYear() : undefined,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      }}
                      size="sm"
                      variant="ghost"
                      showLabels={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Floating Header */}
      {showFloatingHeader && (
        <div
          className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-card/95 backdrop-blur-md border-b border-border transition-opacity duration-300"
          style={{ opacity: headerOpacity }}
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-bold">{genreName}</h2>
          </div>
        </div>
      )}
    </div>
  )
}
