"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { recommendationsApi } from "@/lib/api/recommendations"
import { Card, CardContent } from "@/components/ui/card"
import { OptimizedImage, batchPreloadImages } from "@/components/ui/OptimizedImage"

interface Artist {
  id: string
  name: string
  image?: string
  type?: string
}

// Helper to get real artist image or meaningful fallback
const getArtistImage = (artist: Artist) => {
  // 🎵 PRIORITY: Use real Spotify image if available
  if (artist.image && artist.image !== '' && !artist.image.includes('placeholder')) {
    return artist.image
  }
  
  // 🎵 FALLBACK: Use artist initials avatar instead of random images
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=6366f1&color=fff&size=200`
}

export function TopArtists() {
  // Atomic loading states
  const [atomicLoaded, setAtomicLoaded] = useState(false)
  const [atomicImagesLoaded, setAtomicImagesLoaded] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [imageLoadError, setImageLoadError] = useState(false)

  // 🎵 FETCH REAL SPOTIFY ARTISTS DATA with robust error handling
  const { data: artistsData, isLoading, error, refetch } = useQuery({
    queryKey: ["spotify-top-artists"],
    queryFn: async () => {
      try {
        console.log('🎵 Fetching trending artists...')
        // Fetch trending artists from backend
        const trendingArtists = await recommendationsApi.getTrendingArtists()
        
        if (!Array.isArray(trendingArtists)) {
          throw new Error('Invalid response format: expected array')
        }
        
        const artists = trendingArtists.slice(0, 6)
        console.log(`✅ Successfully fetched ${artists.length} trending artists`)
        return artists
      } catch (error: any) {
        console.error('❌ Failed to fetch trending artists:', {
          message: error.message,
          status: error.response?.status,
          stack: error.stack
        })
        
        // Increment retry count for user feedback
        setRetryCount(prev => prev + 1)
        
        // Re-throw to trigger React Query's retry mechanism
        throw error
      }
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60, // 1 hour
    retry: 3, // Increased retries
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  })

  // 🎵 Use the processed artists data from the query
  const artists: Artist[] = Array.isArray(artistsData) ? artistsData : []

  // Fill with fallback artists if we don't have enough
  const fallbackArtists = [
    { id: "fallback-1", name: "SXID", type: "Artist" },
    { id: "fallback-2", name: "The Weeknd", type: "Artist" },
    { id: "fallback-3", name: "Taylor Swift", type: "Artist" },
    { id: "fallback-4", name: "Drake", type: "Artist" },
    { id: "fallback-5", name: "Billie Eilish", type: "Artist" },
    { id: "fallback-6", name: "Ed Sheeran", type: "Artist" },
  ]

  // Only use fallbacks if we have a complete error (no data at all)
  const finalArtists = artists.length === 0 && error ? fallbackArtists.slice(0, 6) : artists
  while (finalArtists.length < 6 && artists.length > 0) {
    const fallback = fallbackArtists[finalArtists.length]
    if (fallback) {
      finalArtists.push(fallback)
    } else {
      break
    }
  }

  // Atomic loading: wait for data AND images to be loaded
  useEffect(() => {
    if (!isLoading && finalArtists.length > 0) {
      setAtomicLoaded(true)
      setImageLoadError(false)
      
      // Extract all image URLs for batch preloading
      const imageUrls = finalArtists.map(artist => getArtistImage(artist)).filter(Boolean)
      
      // Batch preload all images with error handling
      if (imageUrls.length > 0) {
        console.log(`🖼️ Preloading ${imageUrls.length} artist images...`)
        batchPreloadImages(imageUrls)
          .then(() => {
            console.log('✅ All artist images preloaded successfully')
            setAtomicImagesLoaded(true)
          })
          .catch(error => {
            console.warn('⚠️ Some artist images failed to preload:', error)
            setImageLoadError(true)
            // Still show content even if some images fail
            setAtomicImagesLoaded(true)
          })
      } else {
        setAtomicImagesLoaded(true)
      }
    }
  }, [isLoading, finalArtists])

  // Show loading state until both data and images are ready
  const showContent = atomicLoaded && atomicImagesLoaded

  // Manual retry function
  const handleRetry = () => {
    setAtomicLoaded(false)
    setAtomicImagesLoaded(false)
    setRetryCount(0)
    setImageLoadError(false)
    refetch()
  }

  // Show error state if all retries failed
  if (error && !isLoading && retryCount >= 3) {
    return (
      <div className="grid grid-cols-1 gap-4">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="p-4 text-center">
            <div className="text-destructive mb-2">❌ Failed to load artists</div>
            <p className="text-sm text-muted-foreground mb-3">
              {error.message || 'Unable to fetch trending artists. Please check your connection.'}
            </p>
            <button 
              onClick={handleRetry}
              className="text-sm bg-primary text-primary-foreground px-3 py-1 rounded hover:bg-primary/90 transition-colors"
            >
              🔄 Try Again
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show loading state until atomic loading is complete
  if (!showContent) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="bg-card/40 backdrop-blur border-white/10">
            <CardContent className="p-4">
              <div className="aspect-square rounded-full bg-muted/50 mb-3 animate-pulse"></div>
              <div className="h-4 bg-muted/50 rounded mb-2 animate-pulse"></div>
              <div className="h-3 bg-muted/30 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }



  return (
    <div className="space-y-2">
      {imageLoadError && (
        <div className="text-xs text-yellow-500 mb-2">
          ⚠️ Some images may load slowly
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {finalArtists.map((artist, index) => (
          <Card key={artist.id} className="bg-card/40 backdrop-blur border-white/10 hover:bg-card/60 transition-colors cursor-pointer">
            <CardContent className="p-4">
              <OptimizedImage 
                src={getArtistImage(artist)} 
                alt={artist.name} 
                className="aspect-square mb-3"
                fallbackChar={artist.name.charAt(0)}
                isArtist={true}
                priority={index < 3}
              />
              <h3 className="font-semibold text-sm text-white truncate">{artist.name}</h3>
              <p className="text-xs text-muted-foreground">{artist.type || "Artist"}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
