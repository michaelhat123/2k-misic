"use client"

import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { recommendationsApi } from '@/lib/api/recommendations'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  TrendingUp, 
  Play, 
  Pause,
  Music, 
  Flame,
  Sparkles,
  Zap,
  Star,
  Crown,
  Award,
  TrendingDown,
  ChevronRight,
  Album,
  Mic2
} from 'lucide-react'
import { usePlayer } from '@/components/player/player-provider'
import { getTrackStream } from '@/lib/api/youtube-music'
import { SearchOverlay } from '@/components/search/search-overlay'
import { useSearch } from '@/components/layout/top-navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface Track {
  id: string
  title?: string
  name?: string
  artist?: string
  album?: string
  image?: string
  albumArt?: string
  duration?: number
  playCount?: number
}

const categories = [
  { id: 'trending', label: 'Hot Right Now', icon: Flame, color: 'from-orange-500 to-red-600' },
  { id: 'albums', label: 'Trending Albums', icon: Album, color: 'from-purple-500 to-pink-600' },
  { id: 'artists', label: 'Rising Artists', icon: Mic2, color: 'from-blue-500 to-cyan-600' },
]

// Animated background particles
const FloatingParticle = ({ delay = 0 }: { delay?: number }) => (
  <motion.div
    className="absolute w-2 h-2 bg-orange-500/30 rounded-full blur-sm"
    initial={{ x: Math.random() * 100, y: Math.random() * 100, scale: 0 }}
    animate={{
      x: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
      y: [Math.random() * 100, Math.random() * 100, Math.random() * 100],
      scale: [0, 1, 0],
    }}
    transition={{
      duration: 10,
      delay,
      repeat: Infinity,
      ease: "linear"
    }}
  />
)

export default function TrendingPage() {
  const [activeCategory, setActiveCategory] = useState('trending')
  const { playTrack, currentTrack, isPlaying } = usePlayer()
  const { searchQuery } = useSearch()
  const [loadingTrack, setLoadingTrack] = useState<string | null>(null)
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null)
  const [particles, setParticles] = useState<number[]>([])

  // Generate particles on mount
  useEffect(() => {
    setParticles(Array.from({ length: 20 }, (_, i) => i))
  }, [])

  // Fetch trending data
  const { data: trendingTracks, isLoading: loadingTracks } = useQuery({
    queryKey: ['trending-tracks'],
    queryFn: recommendationsApi.getTrending,
  })

  const { data: trendingAlbums, isLoading: loadingAlbums } = useQuery({
    queryKey: ['trending-albums'],
    queryFn: recommendationsApi.getTrendingAlbums,
  })

  const { data: trendingArtists, isLoading: loadingArtists } = useQuery({
    queryKey: ['trending-artists'],
    queryFn: recommendationsApi.getTrendingArtists,
  })

  const handlePlayTrack = async (track: Track) => {
    try {
      setLoadingTrack(track.id)
      
      const streamData = await getTrackStream({
        spotifyId: track.id,
        title: track.title || track.name || 'Unknown',
        artist: track.artist || 'Unknown',
        album: track.album || 'Unknown'
      })

      if (streamData?.streamUrl) {
        const playerTrack = {
          id: track.id,
          title: track.title || track.name || 'Unknown',
          artist: track.artist || 'Unknown',
          album: track.album || 'Unknown',
          albumArt: track.image || track.albumArt || '',
          duration: track.duration || 0,
          url: streamData.streamUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await playTrack(playerTrack)
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoadingTrack(null)
    }
  }

  if (searchQuery?.trim()) {
    return <SearchOverlay />
  }

  const tracks = trendingTracks || []
  const albums = trendingAlbums || []
  const artists = trendingArtists || []

  // Get featured track (first trending track)
  const featuredTrack = tracks[0]

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        {particles.map((i) => (
          <FloatingParticle key={i} delay={i * 0.5} />
        ))}
      </div>

      {/* Animated Gradient Background */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(239, 68, 68, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 80%, rgba(249, 115, 22, 0.1) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Header with Epic Animated Icon */}
      <div className="flex-shrink-0 p-6 pb-4 relative z-10">
        <motion.div
          className="flex items-center gap-4 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            className="relative w-16 h-16"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {/* Pulsing glow effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg blur-xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            {/* Main icon container */}
            <div className="relative w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-2xl">
              <motion.div
                animate={{
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Flame className="w-8 h-8 text-white drop-shadow-lg" />
              </motion.div>
            </div>
            {/* Sparkles around icon */}
            <motion.div
              className="absolute -top-1 -right-1"
              animate={{
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Sparkles className="w-4 h-4 text-yellow-400" />
            </motion.div>
          </motion.div>
          <div>
            <motion.h1
              className="text-3xl font-black bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              Trending Now
            </motion.h1>
            <motion.p
              className="text-muted-foreground flex items-center gap-2 mt-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Zap className="w-4 h-4 text-orange-500 animate-pulse" />
              What's hot right now • Updated every hour
            </motion.p>
          </div>
        </motion.div>
      </div>

      {/* Futuristic Category Pills */}
      <div className="flex-shrink-0 px-6 pb-4 relative z-10">
        <div className="flex gap-3">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Button
                variant="ghost"
                size="lg"
                onClick={() => setActiveCategory(cat.id)}
                className={`relative overflow-hidden group transition-all duration-300 ${
                  activeCategory === cat.id
                    ? 'bg-gradient-to-r ' + cat.color + ' text-white shadow-lg scale-105'
                    : 'hover:bg-accent/50'
                }`}
              >
                {/* Animated background for active state */}
                {activeCategory === cat.id && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                    animate={{
                      x: ['-100%', '100%'],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  />
                )}
                <cat.icon className={`h-5 w-5 mr-2 ${activeCategory === cat.id ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                <span className="font-semibold relative z-10">{cat.label}</span>
                {activeCategory === cat.id && (
                  <motion.div
                    className="ml-2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <Star className="w-4 h-4" />
                  </motion.div>
                )}
              </Button>
            </motion.div>
          ))}
        </div>
      </div>

      <ScrollArea className="flex-1 px-6 pb-6 relative z-10">
        {/* Epic Featured Spotlight with 3D Effects */}
        <AnimatePresence mode="wait">
          {activeCategory === 'trending' && featuredTrack && (
            <motion.div
              key="featured"
              initial={{ opacity: 0, scale: 0.9, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -50 }}
              transition={{ duration: 0.6, type: "spring" }}
              className="mb-8"
            >
              <motion.div
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Card className="relative overflow-hidden border-2 border-orange-500/30 shadow-2xl">
                  {/* Animated gradient background */}
                  <motion.div
                    className="absolute inset-0"
                    animate={{
                      background: [
                        'linear-gradient(135deg, rgba(249, 115, 22, 0.15) 0%, rgba(239, 68, 68, 0.15) 100%)',
                        'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(249, 115, 22, 0.15) 100%)',
                      ],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      repeatType: "reverse",
                    }}
                  />
                  
                  <CardContent className="p-6 relative z-10">
                    {/* Crown badge with animation */}
                    <motion.div
                      className="flex items-center gap-2 mb-4"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <motion.div
                        animate={{
                          rotate: [0, -10, 10, 0],
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: "easeInOut",
                        }}
                      >
                        <Crown className="h-5 w-5 text-yellow-500 drop-shadow-lg" />
                      </motion.div>
                      <h2 className="text-lg font-black bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                        🔥 HOTTEST TRACK RIGHT NOW
                      </h2>
                    </motion.div>
                    
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* 3D Album Art with hover effects */}
                      <motion.div
                        className="flex-shrink-0"
                        whileHover={{ scale: 1.05, rotateY: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        style={{ perspective: 1000 }}
                      >
                        <div className="relative w-48 h-48 rounded-xl overflow-hidden group shadow-2xl">
                          {/* Pulsing glow behind image */}
                          <motion.div
                            className="absolute -inset-4 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl blur-2xl"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                            }}
                          />
                          <img
                            src={featuredTrack.image || featuredTrack.albumArt || ''}
                            alt={featuredTrack.title || featuredTrack.name}
                            className="relative w-full h-full object-cover"
                          />
                          {/* Animated overlay on hover */}
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                            whileHover={{ backdropFilter: "blur(4px)" }}
                          >
                            <motion.div
                              whileHover={{ scale: 1.2, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <Button
                                size="icon"
                                className="h-14 w-14 rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-2xl"
                                onClick={() => handlePlayTrack(featuredTrack)}
                                disabled={loadingTrack === featuredTrack.id}
                              >
                                {loadingTrack === featuredTrack.id ? (
                                  <motion.div
                                    className="h-8 w-8 border-3 border-white border-t-transparent rounded-full"
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  />
                                ) : currentTrack?.id === featuredTrack.id && isPlaying ? (
                                  <Pause className="h-6 w-6" />
                                ) : (
                                  <Play className="h-6 w-6 ml-0.5" />
                                )}
                              </Button>
                            </motion.div>
                          </motion.div>
                          {/* Floating particles around image */}
                          <motion.div
                            className="absolute top-2 right-2"
                            animate={{
                              y: [-5, 5, -5],
                              rotate: [0, 360],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          >
                            <Sparkles className="w-6 h-6 text-yellow-400" />
                          </motion.div>
                        </div>
                      </motion.div>
                      
                      {/* Track Info with staggered animations */}
                      <div className="flex-1 flex flex-col justify-center space-y-4">
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 }}
                        >
                          <Badge className="w-fit px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 shadow-lg text-base">
                            <Award className="h-4 w-4 mr-2" />
                            #1 Trending
                          </Badge>
                        </motion.div>
                        
                        <motion.h3
                          className="text-3xl font-black leading-tight"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.5 }}
                        >
                          {featuredTrack.title || featuredTrack.name}
                        </motion.h3>
                        
                        <motion.p
                          className="text-xl text-muted-foreground font-semibold"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 }}
                        >
                          {featuredTrack.artist}
                        </motion.p>
                        
                        <motion.p
                          className="text-sm text-muted-foreground"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.7 }}
                        >
                          {featuredTrack.album}
                        </motion.p>

                        {/* Animated stats */}
                        <motion.div
                          className="flex gap-4 mt-4"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 }}
                        >
                          <div className="flex items-center gap-2">
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            >
                              <Flame className="w-5 h-5 text-orange-500" />
                            </motion.div>
                            <span className="text-sm font-semibold">Hot</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-500" />
                            <span className="text-sm font-semibold">Rising Fast</span>
                          </div>
                        </motion.div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Trending Tracks Grid */}
        {activeCategory === 'trending' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <Flame className="h-6 w-6 text-orange-500" />
                Top Trending Tracks
              </h2>
            </div>

            {loadingTracks ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(10)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex gap-3">
                          <Skeleton className="h-20 w-20 rounded-xl flex-shrink-0" />
                          <div className="flex-1 space-y-3">
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tracks.slice(1).map((track: Track, index: number) => {
                  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying
                  const isLoading = loadingTrack === track.id
                  const isHovered = hoveredTrack === track.id

                  return (
                    <motion.div
                      key={track.id}
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ 
                        delay: index * 0.05,
                        type: "spring",
                        stiffness: 300,
                        damping: 20
                      }}
                      whileHover={{ scale: 1.03, y: -5 }}
                      onHoverStart={() => setHoveredTrack(track.id)}
                      onHoverEnd={() => setHoveredTrack(null)}
                    >
                      <Card className="group relative overflow-hidden cursor-pointer border border-transparent hover:border-orange-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-orange-500/20">
                        {/* Animated gradient background on hover */}
                        {isHovered && (
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-orange-500/10"
                            animate={{
                              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            style={{ backgroundSize: '200% 200%' }}
                          />
                        )}
                        
                        <CardContent className="p-4 relative z-10">
                          <div className="flex items-center gap-3">
                            {/* Animated Rank Badge with 3D effect */}
                            <motion.div
                              className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm shadow-lg"
                              whileHover={{ 
                                scale: 1.2, 
                                rotate: [0, -10, 10, -10, 0],
                                boxShadow: '0 10px 30px rgba(249, 115, 22, 0.5)'
                              }}
                              transition={{ type: "spring", stiffness: 400 }}
                            >
                              <motion.span
                                animate={isHovered ? { scale: [1, 1.2, 1] } : {}}
                                transition={{ duration: 0.3 }}
                              >
                                #{index + 2}
                              </motion.span>
                            </motion.div>

                            {/* 3D Album Art with glow */}
                            <motion.div
                              className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 shadow-lg"
                              whileHover={{ 
                                scale: 1.1,
                                rotateY: 10,
                                rotateX: 5,
                              }}
                              transition={{ type: "spring", stiffness: 300 }}
                              style={{ perspective: 1000 }}
                            >
                              {/* Glow effect behind image */}
                              {isHovered && (
                                <motion.div
                                  className="absolute -inset-2 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl blur-lg"
                                  animate={{
                                    opacity: [0.3, 0.6, 0.3],
                                  }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                  }}
                                />
                              )}
                              
                              <img
                                src={track.image || track.albumArt || ''}
                                alt={track.title || track.name}
                                className="relative w-full h-full object-cover"
                              />
                              
                              {/* Animated play button overlay */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isHovered ? 1 : 0 }}
                                transition={{ duration: 0.2 }}
                              >
                                <motion.div
                                  whileHover={{ scale: 1.2, rotate: 90 }}
                                  whileTap={{ scale: 0.8 }}
                                >
                                  <Button
                                    size="icon"
                                    className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handlePlayTrack(track)
                                    }}
                                    disabled={isLoading}
                                  >
                                    {isLoading ? (
                                      <motion.div
                                        className="h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                      />
                                    ) : isCurrentlyPlaying ? (
                                      <Pause className="h-4 w-4" />
                                    ) : (
                                      <Play className="h-4 w-4 ml-0.5" />
                                    )}
                                  </Button>
                                </motion.div>
                              </motion.div>
                            </motion.div>

                            {/* Track Info with animations */}
                            <div className="flex-1 min-w-0">
                              <motion.h4
                                className={`font-bold text-base truncate ${isCurrentlyPlaying ? 'text-orange-500' : ''}`}
                                animate={isCurrentlyPlaying ? { 
                                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                } : {}}
                              >
                                {track.title || track.name}
                              </motion.h4>
                              <p className="text-sm text-muted-foreground truncate mt-1">
                                {track.artist}
                              </p>
                            </div>

                            {/* Epic music bars animation when playing */}
                            {isCurrentlyPlaying && (
                              <motion.div
                                className="flex items-center gap-1 h-6"
                                initial={{ opacity: 0, scale: 0 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ type: "spring" }}
                              >
                                {[0, 150, 300, 450].map((delay, i) => (
                                  <motion.div
                                    key={i}
                                    className="w-1 bg-gradient-to-t from-orange-500 to-red-500 rounded-full"
                                    animate={{
                                      height: ['12px', '24px', '12px'],
                                    }}
                                    transition={{
                                      duration: 0.6 + (i * 0.1),
                                      repeat: Infinity,
                                      ease: "easeInOut",
                                      delay: delay / 1000,
                                    }}
                                  />
                                ))}
                              </motion.div>
                            )}

                            {/* Trending indicator for top 5 */}
                            {index < 4 && (
                              <motion.div
                                animate={{ 
                                  y: [-2, 2, -2],
                                  rotate: [0, 5, -5, 0],
                                }}
                                transition={{
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut",
                                }}
                              >
                                <TrendingUp className="w-5 h-5 text-green-500" />
                              </motion.div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Trending Albums */}
        {activeCategory === 'albums' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Album className="h-6 w-6 text-orange-500" />
              Trending Albums
            </h2>

            {loadingAlbums ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {[...Array(10)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="aspect-square w-full rounded-md mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {albums.map((album: any, index: number) => (
                  <motion.div
                    key={album.id || index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group hover:bg-accent/50 transition-all hover:scale-105 cursor-pointer">
                      <CardContent className="p-4">
                        <div className="relative aspect-square rounded-md overflow-hidden mb-3">
                          <img
                            src={album.image || album.albumArt || ''}
                            alt={album.name || album.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                              size="icon"
                              className="h-10 w-10 rounded-full bg-orange-500 hover:bg-orange-600"
                            >
                              <Play className="h-5 w-5 ml-0.5" />
                            </Button>
                          </div>
                        </div>
                        <h4 className="font-semibold truncate mb-1">
                          {album.name || album.title}
                        </h4>
                        <p className="text-sm text-muted-foreground truncate">
                          {album.artist || album.artists}
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Trending Artists */}
        {activeCategory === 'artists' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Mic2 className="h-6 w-6 text-orange-500" />
              Rising Artists
            </h2>

            {loadingArtists ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4 text-center">
                      <Skeleton className="aspect-square w-full rounded-full mb-3" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-3 w-2/3 mx-auto" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {artists.map((artist: any, index: number) => (
                  <motion.div
                    key={artist.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="group hover:bg-accent/50 transition-all hover:scale-105 cursor-pointer">
                      <CardContent className="p-4 text-center">
                        <div className="relative aspect-square rounded-full overflow-hidden mb-3">
                          <img
                            src={artist.image || artist.profilePicture || ''}
                            alt={artist.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h4 className="font-semibold truncate mb-1">
                          {artist.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Artist
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
