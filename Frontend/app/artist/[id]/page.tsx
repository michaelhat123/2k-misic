"use client"

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { ArtistDetailView } from '@/components/search/artist-detail-view'
import { searchApi } from '@/lib/api/search'
import { BrandedLoader } from '@/components/ui/BrandedLoader'

export const dynamic = 'force-dynamic'

// Cache for popular artists - shared across all artist pages
const popularArtistsCache = {
  data: null as any,
  timestamp: 0,
  TTL: 5 * 60 * 1000 // 5 minutes in milliseconds
}

export default function ArtistPage() {
  const params = useParams()
  const router = useRouter()
  const artistId = params?.id as string
  
  const [artist, setArtist] = useState<any>(null)
  const [tracks, setTracks] = useState<any[]>([])
  const [albums, setAlbums] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchArtistData = async () => {
      if (!artistId) return
      
      try {
        const startTime = Date.now()
        
        // First get basic artist info quickly and SET IT IMMEDIATELY
        const artistResponse = await searchApi.getArtist(artistId)
        const artistName = artistResponse?.name
        
        if (!artistName) {
          throw new Error('Artist name not found')
        }
        
        // SET ARTIST IMMEDIATELY - page will show with track skeletons
        setArtist(artistResponse)
        // Keep loading=true so track skeletons show
        
        // Get auth token for protected endpoints
        const authToken = localStorage.getItem('token')
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
        
        // Check if we have cached popular artists that are still valid
        const now = Date.now()
        const cacheValid = popularArtistsCache.data && (now - popularArtistsCache.timestamp) < popularArtistsCache.TTL
        
        let topArtistsPromise
        if (cacheValid) {
          topArtistsPromise = Promise.resolve(popularArtistsCache.data)
        } else {
          topArtistsPromise = fetch(`${API_BASE_URL}/spotify/artist/${artistId}/related-artists`, {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
          })
            .then(r => r.ok ? r.json() : { artists: [] })
            .then(result => {
              // Cache the result
              popularArtistsCache.data = result
              popularArtistsCache.timestamp = Date.now()
              return result
            })
            .catch(() => ({ artists: [] }))
        }
        
        // Now fetch EVERYTHING else in parallel in the background
        const [tracksResponse, albumsResponse, imagesResponse, bioResponse, topArtistsResponse] = await Promise.all([
          searchApi.getArtistTracks(artistId, 10, 0).catch(() => ({ tracks: [] })),
          searchApi.getArtistAlbums(artistId, 6).catch(() => ({ albums: [] })),
          fetch(`${API_BASE_URL}/artist-images/${encodeURIComponent(artistName)}`, {
            headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
          }).then(r => r.ok ? r.json() : { images: [] }).catch(() => ({ images: [] })),
          fetch(`${API_BASE_URL}/artist/${encodeURIComponent(artistName)}/biography`).then(r => r.ok ? r.json() : null).catch(() => null),
          topArtistsPromise
        ])
        
        const totalTime = Date.now() - startTime
        
        // Extract image URLs from response (handles both string arrays and object arrays)
        const imageUrls = (imagesResponse.images || []).map((img: any) => 
          typeof img === 'string' ? img : img.url
        ).filter(Boolean)
        
        // Store in ArtistCache for the component to use immediately
        const { ArtistCache } = await import('@/lib/cache/artist-cache')
        ArtistCache.set(artistId, {
          biography: bioResponse,
          images: imageUrls, // Store extracted URLs
          albums: albumsResponse.albums || [],
          topArtists: topArtistsResponse.artists || []
        })
        
        // Update tracks and albums once they arrive
        setTracks(tracksResponse.tracks || [])
        setAlbums(albumsResponse.albums || [])
        
        // Now we can stop loading - everything is here
        setLoading(false)
      } catch (err: any) {
        setLoading(false)
      }
    }

    fetchArtistData()
  }, [artistId])

  const handleBack = () => {
    router.back()
  }

  const handleAlbumClick = (album: any) => {
    router.push(`/album/${album.id}`)
  }

  const handleArtistClick = (clickedArtist: any) => {
    router.push(`/artist/${clickedArtist.id}`)
  }

  // Show loader only until we have artist data
  if (!artist && loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <BrandedLoader size="md" showText={false} />
      </div>
    )
  }
  
  // Once we have artist data, show the page (tracks will show skeletons if still loading)
  if (artist) {
    return (
      <ArtistDetailView
        artist={artist}
        tracks={tracks}
        albums={albums}
        onBack={handleBack}
        onAlbumClick={handleAlbumClick}
        onArtistClick={handleArtistClick}
        onLoadMore={() => {}}
        hasMore={false}
        isLoading={loading}
        observerRef={observerRef}
      />
    )
  }

  // Only show error if we truly have no data
  return (
    <div className="flex flex-col items-center justify-center h-full w-full">
      <p className="text-xl text-red-500 mb-4">Artist not found</p>
      <button 
        onClick={handleBack}
        className="px-4 py-2 bg-[#00BFFF] text-white rounded-lg hover:bg-[#00BFFF]/80"
      >
        Go Back
      </button>
    </div>
  )
}
