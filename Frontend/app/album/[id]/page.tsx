"use client"

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { AlbumDetailView } from '@/components/search/album-detail-view'
import { searchApi } from '@/lib/api/search'
import { BrandedLoader } from '@/components/ui/BrandedLoader'

export const dynamic = 'force-dynamic'

export default function AlbumPage() {
  const params = useParams()
  const router = useRouter()
  const albumId = params?.id as string
  
  const [album, setAlbum] = useState<any>(null)
  const [tracks, setTracks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const observerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchAlbumData = async () => {
      if (!albumId) return
      
      setLoading(true)
      setError(null)
      
      try {
        const tracksResponse = await searchApi.getAlbumTracks(albumId, 50, 0)
        
        // Album info is typically included in the tracks response
        // If not, we'll need to add a getAlbum method
        setAlbum({
          id: albumId,
          name: tracksResponse.album?.name || 'Unknown Album',
          images: tracksResponse.album?.images || [],
          artists: tracksResponse.album?.artists || [],
          release_date: tracksResponse.album?.release_date,
          total_tracks: tracksResponse.total
        })
        setTracks(tracksResponse.tracks || [])
      } catch (err) {
        setError('Failed to load album data')
      } finally {
        setLoading(false)
      }
    }

    fetchAlbumData()
  }, [albumId])

  const handleBack = () => {
    router.back()
  }

  // Show loader only until we have album data
  if (!album && loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <BrandedLoader size="md" showText={false} />
      </div>
    )
  }
  
  // Once we have album data, show the page (tracks will show skeletons if still loading)
  if (album) {
    return (
      <AlbumDetailView
        album={album}
        tracks={tracks}
        onBack={handleBack}
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
      <p className="text-xl text-red-500 mb-4">{error || 'Album not found'}</p>
      <button 
        onClick={handleBack}
        className="px-4 py-2 bg-[#00BFFF] text-white rounded-lg hover:bg-[#00BFFF]/80"
      >
        Go Back
      </button>
    </div>
  )
}
