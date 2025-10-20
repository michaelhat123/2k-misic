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

// Helper to fetch artist image from Spotify API
const fetchSpotifyArtistImage = async (spotifyId: string): Promise<string> => {
  try {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spotify/artist/${spotifyId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })

    if (response.ok) {
      const artistData = await response.json()
      return artistData.images?.[0]?.url || ''
    }
  } catch (error) {
    // Silent fail
  }
  return ''
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
  const [enrichedArtists, setEnrichedArtists] = useState<Artist[]>([])

  // 🎵 FETCH REAL SPOTIFY ARTISTS DATA with robust error handling
  const { data: artistsData, isLoading, error, refetch } = useQuery({
    queryKey: ["spotify-top-artists"],
    queryFn: async () => {
      try {
        // Fetch trending artists from backend
        const trendingArtists = await recommendationsApi.getTrendingArtists()
        
        if (!Array.isArray(trendingArtists)) {
          throw new Error('Invalid response format: expected array')
        }
        
        const artists = trendingArtists.slice(0, 6)
        return artists
      } catch (error: any) {
        return [] as Artist[]
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

  // Fill with fallback artists if we don't have enough (with proper Spotify IDs)
  const fallbackArtists: Artist[] = [
    { id: "3TVXtAsR1Inumwj472S9r4", name: "Drake", type: "Artist" },
    { id: "1Xyo4u8uXC1ZmMpatF05PJ", name: "The Weeknd", type: "Artist" },
    { id: "06HL4z0CvFAxyc27GXpf02", name: "Taylor Swift", type: "Artist" },
    { id: "6qqNVTkY8uBg9cP3Jd7DAH", name: "Billie Eilish", type: "Artist" },
    { id: "6eUKZXaKkcviH0Ku9w2n3V", name: "Ed Sheeran", type: "Artist" },
    { id: "53XhwfbYqKCa1cC15pYq2q", name: "Imagine Dragons", type: "Artist" },
  ]

  // Only use fallbacks if we have a complete error (no data at all)
  const baseArtists = artists.length === 0 && error ? fallbackArtists.slice(0, 6) : artists
  while (baseArtists.length < 6 && artists.length > 0) {
    const fallback = fallbackArtists[baseArtists.length]
    if (fallback) {
      baseArtists.push(fallback)
    } else {
      break
    }
  }

  // Enrich artists with Spotify images if they don't have them
  useEffect(() => {
    const enrichArtists = async () => {
      const enriched = await Promise.all(
        baseArtists.map(async (artist) => {
          // If artist has no image but has a valid Spotify ID, fetch it
          if (!artist.image && artist.id && !artist.id.startsWith('fallback-')) {
            const spotifyImage = await fetchSpotifyArtistImage(artist.id)
            return { ...artist, image: spotifyImage }
          }
          return artist
        })
      )
      setEnrichedArtists(enriched)
    }

    if (baseArtists.length > 0) {
      enrichArtists()
    }
  }, [baseArtists.length, JSON.stringify(baseArtists)])

  // Use enriched artists for final display
  const finalArtists = enrichedArtists.length > 0 ? enrichedArtists : baseArtists

  // Atomic loading: wait for data AND images to be loaded
  useEffect(() => {
    if (!isLoading && finalArtists.length > 0) {
      setAtomicLoaded(true)
      setImageLoadError(false)
      
      // Extract all image URLs for batch preloading
      const imageUrls = finalArtists.map(artist => getArtistImage(artist)).filter(Boolean)
      
      // Batch preload all images with error handling
      if (imageUrls.length > 0) {
        batchPreloadImages(imageUrls)
          .then(() => {
            setAtomicImagesLoaded(true)
          })
          .catch(error => {
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
