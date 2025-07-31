"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Play, Music, User, Album, Heart, MoreHorizontal } from "lucide-react"
import { useState } from "react"

interface SearchResultsProps {
  results: any
  isLoading: boolean
  query: string
  type: string
}

// Helper function to format duration from ms to mm:ss
const formatDuration = (durationMs: number): string => {
  const minutes = Math.floor(durationMs / 60000)
  const seconds = Math.floor((durationMs % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

// Helper function to get image with fallback
const getImageWithFallback = (item: any, type: string) => {
  if (type === 'track' && item?.album?.images?.[0]?.url) {
    return item.album.images[0].url
  }
  if (type === 'artist' && item?.images?.[0]?.url) {
    return item.images[0].url
  }
  if (type === 'album' && item?.images?.[0]?.url) {
    return item.images[0].url
  }
  return ''
}

export function SearchResults({ results, isLoading, query, type }: SearchResultsProps) {
  const [activeTab, setActiveTab] = useState('all')

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'songs', label: 'Songs' },
    { id: 'artists', label: 'Artists' },
    { id: 'albums', label: 'Albums' },
    { id: 'playlists', label: 'Playlists' },
    { id: 'genres', label: 'Genres & Moods' },
    { id: 'podcasts', label: 'Podcasts & Shows' },
    { id: 'profiles', label: 'Profiles' }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Searching...</div>
      </div>
    )
  }

  // Get the top result (first track)
  const topResult = results?.tracks?.[0]
  const tracks = results?.tracks || []
  const artists = results?.artists || []

  return (
    <div className="space-y-6">
      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 overflow-x-auto">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveTab(tab.id)}
            className="whitespace-nowrap text-sm font-medium px-4 py-2 rounded-full"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Result Section (Left) */}
        {topResult && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Top result</h2>
            <div className="bg-card/50 hover:bg-card/80 transition-colors rounded-lg p-5 cursor-pointer group">
              <div className="space-y-4">
                {/* Album Artwork */}
                <div className="relative">
                  <Avatar className="w-24 h-24 rounded-lg shadow-lg">
                    <AvatarImage 
                      src={getImageWithFallback(topResult, 'track')} 
                      alt={topResult.name}
                      className="rounded-lg object-cover"
                    />
                    <AvatarFallback className="rounded-lg bg-muted">
                      <Music className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute -bottom-2 -right-2 rounded-full bg-green-500 hover:bg-green-600 text-black shadow-lg opacity-0 group-hover:opacity-100 transition-all transform scale-105 hover:scale-110"
                  >
                    <Play className="h-5 w-5 fill-current" />
                  </Button>
                </div>
                
                {/* Track Info */}
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-white leading-tight line-clamp-2">
                    {topResult.name}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Music className="h-4 w-4" />
                    <span>Song</span>
                    <span>•</span>
                    <span>{topResult.artists?.map((artist: any) => artist.name).join(', ')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Songs List Section (Right) */}
        {tracks.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Songs</h2>
            <div className="space-y-2">
              {tracks.slice(0, 4).map((track: any, index: number) => (
                <div
                  key={track.id || index}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                >
                  {/* Track Artwork */}
                  <div className="relative flex-shrink-0">
                    <Avatar className="w-12 h-12 rounded">
                      <AvatarImage 
                        src={getImageWithFallback(track, 'track')} 
                        alt={track.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-muted">
                        <Music className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                    <Button
                      size="icon"
                      className="absolute inset-0 rounded bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Play className="h-4 w-4 fill-current" />
                    </Button>
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-white truncate">
                        {track.name}
                      </p>
                      {track.explicit && (
                        <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                          E
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {track.artists?.map((artist: any) => artist.name).join(', ')}
                    </p>
                  </div>

                  {/* Duration */}
                  <div className="text-xs text-muted-foreground">
                    {track.duration_ms ? formatDuration(track.duration_ms) : '0:00'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Artists Section */}
      {artists.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Artists</h2>
          <div className="flex space-x-4 overflow-x-auto pb-4">
            {artists.slice(0, 8).map((artist: any, index: number) => (
              <div
                key={artist.id || index}
                className="flex-shrink-0 cursor-pointer group"
              >
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-transparent group-hover:border-white/20 transition-colors">
                    <AvatarImage 
                      src={getImageWithFallback(artist, 'artist')} 
                      alt={artist.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-muted">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    className="absolute bottom-2 right-2 rounded-full bg-green-500 hover:bg-green-600 text-black shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </Button>
                </div>
                <div className="mt-3 text-center">
                  <p className="text-sm font-medium text-white truncate max-w-[128px]">
                    {artist.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Artist</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
