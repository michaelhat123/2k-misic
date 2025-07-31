"use client"

import { useState, useEffect, useRef } from "react"
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useQuery } from "@tanstack/react-query"
import { Music, Play, Album, Headphones } from "lucide-react"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import { recommendationsApi } from "@/lib/api/recommendations"
import { SearchOverlay } from "../search/search-overlay"
import { useSearch } from "../layout/top-navigation"
import { ProfileOverlay } from "../profile/profile-overlay"
import { useNavigation } from "../layout/navigation-context"
import { motion } from "framer-motion"
import { OptimizedImage, batchPreloadImages } from "@/components/ui/OptimizedImage"



type ContentType = "all" | "music" | "podcasts" | "albums"

interface Track {
  id?: string
  title?: string
  name?: string
  artist?: string
  album?: string
  albumArt?: string
  image?: string
  duration?: number
  publisher?: string
  description?: string
  total_episodes?: number
  external_url?: string
  explicit?: boolean
  languages?: string[]
}

// Image fallback helper
const getImageWithFallback = (item: Track, type: 'track' | 'album' | 'podcast' = 'track') => {
  const image = item.image || item.albumArt
  if (image && image !== '' && !image.includes('placeholder')) {
    return image
  }
  
  // Return appropriate fallback based on content type
  const fallbacks = {
    track: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center',
    album: 'https://images.unsplash.com/photo-1484755560615-676c22522047?w=300&h=300&fit=crop&crop=center', 
    podcast: 'https://images.unsplash.com/photo-1478737270239-2f02b77fc618?w=300&h=300&fit=crop&crop=center'
  }
  
  return fallbacks[type]
}

export function SpotifyHomepage() {
  const [activeTab, setActiveTab] = useState<ContentType>("all")
  const { isAuthenticated, hasValidToken } = useAuthGuard()
  const { searchQuery } = useSearch()
  const { showProfile } = useNavigation()
  


  // 🚀 PERFORMANCE BOOST: Single bulk API call instead of 16+ individual calls!
  // This reduces HTTP requests from 16+ to 1 for massive speed improvement
  const { data: bulkData, isLoading: bulkLoading, error: bulkError } = useQuery({
    queryKey: ['bulk-all-data'],
    queryFn: recommendationsApi.getBulkData,
    enabled: isAuthenticated && hasValidToken,
    staleTime: 1000 * 60 * 30, // 30 minutes - aggressive caching
    gcTime: 1000 * 60 * 60, // 1 hour - keep in memory longer (updated from cacheTime)
    retry: 5, // More retries for production reliability
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Don't refetch on mount if data exists
    refetchOnReconnect: false, // Don't refetch on reconnect
  })

  // Extract data from bulk response with proper type safety
  const homepage = (bulkData as any)?.homepage || {}
  const music = (bulkData as any)?.music || {}
  
  // All tab data
  const trendingTracks = homepage.trendingTracks || []
  const recommendations = homepage.trendingTracks || [] // Use trending as fallback for recommendations
  const rwandanTracks = music.rwandan || []
  const trendingAlbums = homepage.trendingAlbums || []
  const trendingPodcasts = homepage.trendingPodcasts || []
  const trendingArtists = homepage.trendingArtists || []
  
  // Music tab data (all genres)
  const popTracks = music.pop || []
  const rockTracks = music.rock || []
  const hipHopTracks = music.hiphop || []
  const rnbTracks = music.rnb || []
  const afrobeatsTracks = music.afrobeats || []
  const edmTracks = music.edm || []
  const classicalTracks = music.classical || []
  const countryTracks = music.country || []
  const reggeeTracks = music.reggae || []
  const latinTracks = music.latin || []

  // Unified loading states
  const allTabLoading = bulkLoading
  const musicTabLoading = bulkLoading
  const trendingLoading = bulkLoading
  const recommendationsLoading = bulkLoading
  const rwandaLoading = bulkLoading
  const albumsLoading = bulkLoading
  const podcastsLoading = bulkLoading
  const artistsLoading = bulkLoading

  const tabs = [
    { id: "all", label: "All", icon: Music },
    { id: "music", label: "Music", icon: Music },
    { id: "podcasts", label: "Podcasts", icon: Headphones },
    { id: "albums", label: "Albums", icon: Album },
  ]

  const renderContent = () => {
    const tracks: Track[] = Array.isArray(trendingTracks) ? trendingTracks : []
    const recs: Track[] = Array.isArray(recommendations) ? recommendations : []
    const albums: Track[] = Array.isArray(trendingAlbums) ? trendingAlbums : []
    const podcasts: Track[] = Array.isArray(trendingPodcasts) ? trendingPodcasts : []
    const allContent: Track[] = [...tracks, ...recs];

    // Show loading states for different tabs
    const isLoading = {
      all: allTabLoading, // Atomic loading - wait for all sections
      music: musicTabLoading, // Atomic loading - wait for all genres
      albums: albumsLoading,
      podcasts: podcastsLoading,
    };

    if (isLoading[activeTab]) {
      return (
        <div className="space-y-6">
          {/* Loading placeholders for horizontal scrollable sections */}
          {Array.from({ length: activeTab === 'music' ? 11 : 4 }).map((_, sectionIndex) => (
            <div key={sectionIndex}>
              <div className="h-7 bg-muted rounded w-32 mb-4 animate-pulse"></div>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <Card key={index} className="animate-pulse flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="w-full h-32 bg-muted rounded-lg mb-3"></div>
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted/70 rounded w-2/3"></div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    switch (activeTab) {
      case "all":
        return (
          <div className="space-y-6">
            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Most Played</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {allContent.length > 0 ? allContent.slice(0, 20).map((track: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(track, 'track')} 
                            alt={track.title || track.name || 'Track'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={(track.title || track.name || 'T').charAt(0)}
                            priority={index < 4}
                          />
                          <Button 
                            size="icon" 
                            className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black"
                          >
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No recently played tracks found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Made for You (Rwandan tracks) */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Made for you</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {(() => {
                    if (Array.isArray(rwandanTracks) && rwandanTracks.length > 0) {
                      rwandanTracks.slice(0, 20).forEach((track: any, idx: number) => {
                      });
                    }
                    return Array.isArray(rwandanTracks) && rwandanTracks.length > 0 ? rwandanTracks.slice(0, 20).map((track: Track, index: number) => (
                      <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                        <CardContent className="p-3">
                          <div className="relative">
                            <OptimizedImage 
                              src={getImageWithFallback(track, 'track')} 
                              alt={track.title || track.name || 'Track'}
                              className="w-full h-32 rounded-lg mb-3"
                              fallbackChar={(track.title || track.name || 'T').charAt(0)}
                              priority={index < 4} // Prioritize first 4 images
                            />
                            <Button 
                              size="icon" 
                              className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black"
                            >
                              <Play className="h-3 w-3 fill-current" />
                            </Button>
                          </div>
                          <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                        </CardContent>
                      </Card>
                    )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No famous Rwandan tracks found.</div>
                  );
                  })()
                  }
                </div>
              </div>
            </div>

            {/* Podcasts Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Popular podcasts</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(trendingPodcasts) && trendingPodcasts.length > 0 ? trendingPodcasts.slice(0, 20).map((podcast: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(podcast, 'podcast')} 
                            alt={podcast.title || podcast.name || 'Podcast'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={<Headphones className="h-6 w-6" />} 
                            priority={index < 4}
                          />
                          <Button 
                            size="icon" 
                            className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black"
                          >
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{podcast.title || podcast.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{podcast.publisher || podcast.artist || 'Podcast'}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No podcasts found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Albums Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Popular albums</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(trendingAlbums) && trendingAlbums.length > 0 ? trendingAlbums.slice(0, 20).map((album: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(album, 'album')} 
                            alt={album.name || album.title || 'Album'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={<Album className="h-6 w-6" />} 
                            priority={index < 4}
                          />
                          <Button 
                            size="icon" 
                            className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black"
                          >
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{album.name || album.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No albums found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* Artists Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Popular artists</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(trendingArtists) && trendingArtists.length > 0 ? trendingArtists.slice(0, 30).map((artist: any, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={artist.image || `https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop&crop=center`} 
                            alt={artist.name || 'Artist'}
                            className="w-full h-32 mb-3"
                            fallbackChar={artist.name ? artist.name.charAt(0) : 'A'}
                            priority={index < 6}
                            isArtist={true}
                          />
                          <Button 
                            size="icon" 
                            className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black"
                          >
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight text-center">{artist.name}</h4>
                        <p className="text-xs text-muted-foreground truncate text-center">Artist</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No artists found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      
      case "music":
        return (
          <div className="space-y-6">
            {/* 🎤 Pop Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🎤 Pop</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(popTracks) && popTracks.length > 0 ? popTracks.slice(0, 30).map((track: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(track, 'track')} 
                            alt={track.title || track.name || 'Track'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={(track.title || track.name || 'T').charAt(0)}
                            priority={index < 4}
                          />
                          <Button size="icon" className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black">
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No Pop tracks found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 🎸 Rock Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🎸 Rock</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(rockTracks) && rockTracks.length > 0 ? rockTracks.slice(0, 30).map((track: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(track, 'track')} 
                            alt={track.title || track.name || 'Track'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={(track.title || track.name || 'T').charAt(0)}
                            priority={index < 4}
                          />
                          <Button size="icon" className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black">
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No Rock tracks found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 🎧 Hip-Hop Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🎧 Hip-Hop / Rap</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(hipHopTracks) && hipHopTracks.length > 0 ? hipHopTracks.slice(0, 30).map((track: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(track, 'track')} 
                            alt={track.title || track.name || 'Track'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={(track.title || track.name || 'T').charAt(0)}
                            priority={index < 4}
                          />
                          <Button size="icon" className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black">
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No Hip-Hop tracks found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 🎶 R&B Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🎶 R&B / Soul</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(rnbTracks) && rnbTracks.length > 0 ? rnbTracks.slice(0, 30).map((track: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(track, 'track')} 
                            alt={track.title || track.name || 'Track'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={(track.title || track.name || 'T').charAt(0)}
                            priority={index < 4}
                          />
                          <Button size="icon" className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black">
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No R&B tracks found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 🎵 Afrobeats Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🎵 Afrobeats</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(afrobeatsTracks) && afrobeatsTracks.length > 0 ? afrobeatsTracks.slice(0, 30).map((track: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(track, 'track')} 
                            alt={track.title || track.name || 'Track'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={(track.title || track.name || 'T').charAt(0)}
                            priority={index < 4}
                          />
                          <Button size="icon" className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black">
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No Afrobeats tracks found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 🕺 Dance/EDM Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🕺 Dance / EDM</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(edmTracks) && edmTracks.length > 0 ? edmTracks.slice(0, 30).map((track: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(track, 'track')} 
                            alt={track.title || track.name || 'Track'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={(track.title || track.name || 'T').charAt(0)}
                            priority={index < 4}
                          />
                          <Button size="icon" className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black">
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No EDM tracks found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 🎻 Classical Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🎻 Classical</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(classicalTracks) && classicalTracks.length > 0 ? classicalTracks.slice(0, 30).map((track: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(track, 'track')} 
                            alt={track.title || track.name || 'Track'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={(track.title || track.name || 'T').charAt(0)}
                            priority={index < 4}
                          />
                          <Button size="icon" className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black">
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No Classical tracks found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 🤠 Country Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🤠 Country</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(countryTracks) && countryTracks.length > 0 ? countryTracks.slice(0, 30).map((track: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(track, 'track')} 
                            alt={track.title || track.name || 'Track'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={(track.title || track.name || 'T').charAt(0)}
                            priority={index < 4}
                          />
                          <Button size="icon" className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black">
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No Country tracks found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 🌍 Reggae/Dancehall Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🌍 Reggae / Dancehall</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(reggeeTracks) && reggeeTracks.length > 0 ? reggeeTracks.slice(0, 30).map((track: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(track, 'track')} 
                            alt={track.title || track.name || 'Track'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={(track.title || track.name || 'T').charAt(0)}
                            priority={index < 4}
                          />
                          <Button size="icon" className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black">
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No Reggae tracks found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 💿 Latin/Reggaeton Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">💿 Latin / Reggaeton</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(latinTracks) && latinTracks.length > 0 ? latinTracks.slice(0, 30).map((track: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(track, 'track')} 
                            alt={track.title || track.name || 'Track'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={(track.title || track.name || 'T').charAt(0)}
                            priority={index < 4}
                          />
                          <Button size="icon" className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black">
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No Latin tracks found.</div>
                  )}
                </div>
              </div>
            </div>

            {/* 🇷🇼 Rwandan Section (Last as requested) */}
            <div>
              <h3 className="text-lg font-semibold mb-4">🇷🇼 Rwandan</h3>
              <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <div className="flex space-x-4 pb-4">
                  {Array.isArray(rwandanTracks) && rwandanTracks.length > 0 ? rwandanTracks.slice(0, 30).map((track: Track, index: number) => (
                    <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95 flex-shrink-0 w-40">
                      <CardContent className="p-3">
                        <div className="relative">
                          <OptimizedImage 
                            src={getImageWithFallback(track, 'track')} 
                            alt={track.title || track.name || 'Track'}
                            className="w-full h-32 rounded-lg mb-3"
                            fallbackChar={(track.title || track.name || 'T').charAt(0)}
                            priority={index < 4}
                          />
                          <Button size="icon" className="absolute bottom-1 right-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 bg-green-500 hover:bg-green-600 text-black">
                            <Play className="h-3 w-3 fill-current" />
                          </Button>
                        </div>
                        <h4 className="font-medium text-sm mb-1 truncate leading-tight">{track.title || track.name}</h4>
                        <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
                      </CardContent>
                    </Card>
                  )) : (
                    <div className="text-muted-foreground text-sm flex-shrink-0">No Rwandan tracks found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      
      case "podcasts":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Popular podcasts</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {podcasts.slice(0, 10).map((podcast: Track, index: number) => (
                  <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95">
                    <CardContent className="p-3 sm:p-4">
                      <div className="relative">
                        <OptimizedImage 
                          src={getImageWithFallback(podcast, 'podcast')} 
                          alt={podcast.name || podcast.title || 'Podcast'}
                          className="w-full h-28 sm:h-32 rounded-lg mb-2 sm:mb-3"
                          fallbackChar={<Headphones className="h-6 w-6 sm:h-8 sm:w-8" />}
                          priority={index < 4}
                        />
                        <Button 
                          size="icon" 
                          className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 sm:w-10 sm:h-10"
                        >
                          <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      <h4 className="font-medium text-xs sm:text-sm mb-1 truncate leading-tight">{podcast.title || podcast.name}</h4>
                      <p className="text-xs text-muted-foreground truncate">{podcast.publisher || podcast.artist || 'Podcast'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )
      
      case "albums":
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Popular albums</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
                {albums.slice(0, 10).map((album: Track, index: number) => (
                  <Card key={index} className="group cursor-pointer hover:bg-accent/50 transition-colors active:scale-95">
                    <CardContent className="p-3 sm:p-4">
                      <div className="relative">
                        <OptimizedImage 
                          src={getImageWithFallback(album, 'album')} 
                          alt={album.name || album.title || 'Album'}
                          className="w-full h-28 sm:h-32 rounded-lg mb-2 sm:mb-3"
                          fallbackChar={<Album className="h-6 w-6 sm:h-8 sm:w-8" />}
                          priority={index < 4}
                        />
                        <Button 
                          size="icon" 
                          className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg w-8 h-8 sm:w-10 sm:h-10"
                        >
                          <Play className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                      <h4 className="font-medium text-xs sm:text-sm mb-1 truncate leading-tight">{album.name || album.title}</h4>
                      <p className="text-xs text-muted-foreground truncate">{album.artist}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="bg-card/95 backdrop-blur-sm rounded-lg ml-0 mr-1.5 mt-0 mb-2 shadow-lg h-[calc(100vh-120px)] flex flex-col relative">
      {/* Search Overlay - Shows when user is searching */}
      {searchQuery && <SearchOverlay />}
      
      {/* Profile Overlay - Shows when user navigates to profile */}
      <ProfileOverlay isVisible={showProfile} />
      
      {/* Homepage Content - Hide when overlays are shown */}
      {!searchQuery && !showProfile && (
        <SimpleBar className="p-4 sm:p-6 space-y-6 flex-1 rounded-lg" style={{ maxHeight: '100%', height: '100%' }} autoHide={false}>
        {/* Tab Navigation */}
        <div className="flex space-x-2 relative mb-5">
          {tabs.map((tab) => {
            const isHiddenOnMobile = tab.id === "podcasts"
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ContentType)}
                className={`px-5 py-1.5 rounded-full text-sm font-semibold focus:outline-none transition-colors duration-150 ${isActive ? 'bg-gradient-to-br from-primary to-blue-600 text-white' : 'bg-secondary text-white'} ${isHiddenOnMobile ? 'hidden sm:inline-block' : ''}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
          {renderContent()}
          </motion.div>
        </SimpleBar>
  
      )}
      

    </div>
  )
}
