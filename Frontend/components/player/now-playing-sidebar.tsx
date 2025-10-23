"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, User, Music, ExternalLink, Maximize2, Minimize2, ChevronLeft, ChevronRight, Users, Heart, Shuffle, MoreVertical, Download, Plus, Link, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { BrandedLoader } from "@/components/ui/BrandedLoader"
import { usePlayer } from "./player-provider"
import { ArtistDialog } from "../artist/artist-dialog"
import { SongActions } from "@/components/ui/song-actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DownloadButton } from "@/components/download/download-button"
import { DownloadToast } from "@/components/download/download-toast"
import { userSongsApi } from "@/lib/api/user-songs"
import { toast } from "sonner"
import { useToast } from "@/hooks/use-toast"
import { useQueryClient } from '@tanstack/react-query'
import { PlaylistSelectModal } from '@/components/playlist/add-to-playlist-button'

// Image preload cache - stores up to 100 preloaded images across all artists
const imagePreloadCache = new Map<string, HTMLImageElement>();
const MAX_IMAGE_CACHE_SIZE = 100;

// Helper function to preload image and cache it
const preloadImage = (url: string): Promise<HTMLImageElement> => {
  // Check if already cached
  if (imagePreloadCache.has(url)) {
    return Promise.resolve(imagePreloadCache.get(url)!);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // LRU eviction - remove oldest if cache is full
      if (imagePreloadCache.size >= MAX_IMAGE_CACHE_SIZE) {
        const oldestKey = imagePreloadCache.keys().next().value;
        if (oldestKey) {
          imagePreloadCache.delete(oldestKey);
        }
      }
      
      imagePreloadCache.set(url, img);
      resolve(img);
    };
    img.onerror = reject;
    img.src = url;
  });
};

// Preload images around current index (5 before, 5 after) - skips current image
const preloadSurroundingImages = (images: string[], currentIndex: number) => {
  const rangeBefore = 5;
  const rangeAfter = 5;
  
  const startIndex = Math.max(0, currentIndex - rangeBefore);
  const endIndex = Math.min(images.length - 1, currentIndex + rangeAfter);
  
  for (let i = startIndex; i <= endIndex; i++) {
    if (i === currentIndex) continue; // Skip current image (already loaded)
    
    const imageUrl = typeof images[i] === 'string' ? images[i] : (images[i] as any)?.url;
    if (imageUrl && !imagePreloadCache.has(imageUrl)) {
      preloadImage(imageUrl).catch(() => {});
    }
  }
};

// Local biography cache for NPV - stores up to 100 biographies
const npvBiographyCache = new Map<string, { data: any; timestamp: number }>();
const NPV_CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const NPV_MAX_CACHE_SIZE = 100;

// NPV Cache helper functions
const getNPVCachedBiography = (artistName: string): any | null => {
  const cached = npvBiographyCache.get(artistName.toLowerCase());
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > NPV_CACHE_DURATION) {
    npvBiographyCache.delete(artistName.toLowerCase());
    return null;
  }

  return cached.data;
};

const setNPVCachedBiography = (artistName: string, biography: any) => {
  // If cache is full, remove oldest entry
  if (npvBiographyCache.size >= NPV_MAX_CACHE_SIZE) {
    const oldestKey = npvBiographyCache.keys().next().value;
    if (oldestKey) {
      npvBiographyCache.delete(oldestKey);
    }
  }
  
  npvBiographyCache.set(artistName.toLowerCase(), {
    data: biography,
    timestamp: Date.now()
  });
};

interface QueueTrack {
  id: string
  title: string
  artist: string
  album?: string
  albumArt?: string
  duration?: number
}

interface NowPlayingSidebarProps {
  isOpen: boolean
  onClose: () => void
  isIntegrated?: boolean // When true, renders as integrated column instead of overlay
  playbackQueue?: QueueTrack[]
  currentQueueIndex?: number
  onViewQueue?: () => void
}


export function NowPlayingSidebar({ 
  isOpen, 
  onClose, 
  isIntegrated = false, 
  playbackQueue = [], 
  currentQueueIndex = 0, 
  onViewQueue 
}: NowPlayingSidebarProps) {
  const { currentTrack, isPlaying, artistImagesLoading, shuffle } = usePlayer()
  const router = useRouter()
  const { toast: authToast } = useToast()
  
  // Extract primary artist for display (removes collaborators)
  const primaryArtist = currentTrack?.artist ? currentTrack.artist.split(/[&,]|\s+feat\.?\s+|\s+ft\.?\s+/i)[0].trim() : ''
  
  const [isArtistDialogOpen, setIsArtistDialogOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [biography, setBiography] = useState<any>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageLoading, setImageLoading] = useState(false)
  const [preloadedImages, setPreloadedImages] = useState<Set<string>>(new Set())
  const [imageTransitioning, setImageTransitioning] = useState(false)
  const [showNavigationLoader, setShowNavigationLoader] = useState(false)
  const [navigationText, setNavigationText] = useState('')
  
  // Track liked/saved status
  const [isLiked, setIsLiked] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false)
  const queryClient = useQueryClient()
  const [displayedImageIndex, setDisplayedImageIndex] = useState(0)
  const [showFullBiography, setShowFullBiography] = useState(false)
  const [loadingBiography, setLoadingBiography] = useState(false)
  
  // MULTI-DOWNLOAD SUPPORT: Map of trackId -> download state
  const [activeDownloads, setActiveDownloads] = useState<Map<string, {
    trackId: string
    trackTitle: string
    trackArtist: string
    albumArt: string
    sessionId: string
    progress: number
    status: string
    showToast: boolean
  }>>(new Map())
  
  // Helper to check if current track is downloading
  const isCurrentTrackDownloading = currentTrack ? activeDownloads.has(currentTrack.id) : false
  const currentTrackDownload = currentTrack ? activeDownloads.get(currentTrack.id) : undefined

  // Track active downloads state changes
  useEffect(() => {
    // Downloads state updated
  }, [activeDownloads, isExpanded])

  // Broadcast expanded state so pages can react (e.g., hide overlays)
  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent('npv:expanded', { detail: { expanded: isExpanded } }))
    } catch {}
  }, [isExpanded])
  const [dominantColor, setDominantColor] = useState<string>('#3b82f6') // Default blue
  const [miniArtistImageLoading, setMiniArtistImageLoading] = useState(true)

  // Reset image index when track changes
  useEffect(() => {
    if (currentTrack) {
      setCurrentImageIndex(0)
    }
  }, [currentTrack?.id])

  // No hacky auto-click anymore; we render the modal directly below


  // Load liked/saved status when track changes
  useEffect(() => {
    const loadStatus = async () => {
      if (!currentTrack?.id) return
      
      setStatusLoading(true)
      try {
        const [likedStatus, savedStatus] = await Promise.all([
          userSongsApi.isLiked(currentTrack.id),
          userSongsApi.isSaved(currentTrack.id)
        ])
        setIsLiked(likedStatus)
        setIsSaved(savedStatus)
      } catch (error) {
        // Silent fail
      } finally{
        setStatusLoading(false)
      }
    }
    
    loadStatus()
  }, [currentTrack?.id])

  // Handle like/unlike
  const handleToggleLike = async () => {
    if (!currentTrack || statusLoading) {
      return
    }
    
    try {
      setStatusLoading(true)
      if (isLiked) {
        await userSongsApi.unlikeSong(currentTrack.id)
        setIsLiked(false)
        toast.success('Removed from Liked Songs')
      } else {
        await userSongsApi.likeSong(currentTrack)
        setIsLiked(true)
        toast.success('Added to Liked Songs')
      }
    } catch (error) {
      toast.error('Failed to update liked status')
    } finally {
      setStatusLoading(false)
    }
  }

  // Handle save/unsave
  const handleToggleSave = async () => {
    if (!currentTrack || statusLoading) return
    
    try {
      setStatusLoading(true)
      if (isSaved) {
        await userSongsApi.unsaveSong(currentTrack.id)
        setIsSaved(false)
        toast.success('Removed from Your Library')
      } else {
        await userSongsApi.saveSong(currentTrack)
        setIsSaved(true)
        toast.success('Added to Your Library')
      }
    } catch (error) {
      toast.error('Failed to update library status')
    } finally {
      setStatusLoading(false)
    }
  }

  // Copy Spotify link
  const handleCopySpotifyLink = () => {
    if (!currentTrack) return
    
    const spotifyUrl = currentTrack.spotifyUrl || `https://open.spotify.com/track/${currentTrack.id}`
    navigator.clipboard.writeText(spotifyUrl)
    toast.success('Spotify link copied to clipboard')
  }

  // WebSocket connection for download progress (MULTI-DOWNLOAD SUPPORT)
  useEffect(() => {
    if (activeDownloads.size === 0) return

    let socket: any = null
    
    const connectSocket = async () => {
      const { io } = await import('socket.io-client')
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      socket = io(API_BASE_URL, {
        path: '/download-progress',
        transports: ['websocket'],
      })
      
      socket.on('connect', () => {
        // Socket connected
      })
      
      socket.on('download-progress', (data: any) => {
        
        // Map backend messages to user-friendly status
        const statusMap: Record<string, string> = {
          'Navigating': 'Initializing',
          'Page loaded': 'Processing',
          'URL entered': 'Processing',
          'Checking for CAPTCHA': 'Verifying',
          'Waiting for download button': 'Preparing',
          'Clicked Generate': 'Getting audio',
          'Selecting M4A': 'Getting audio',
          'Generating download link': 'Getting audio',
          'Searching Song': 'Finding track',
          'Download link generated': 'Starting download',
          'Downloading file': 'Downloading',
          'File downloaded': 'Complete'
        }
        
        let statusText = data.status || ''
        for (const [key, value] of Object.entries(statusMap)) {
          if (statusText.includes(key)) {
            statusText = value
            break
          }
        }
        
        // Match download by sessionId
        setActiveDownloads(prev => {
          const updated = new Map(prev)
          const entries = Array.from(updated.entries())
          
          if (entries.length === 0) return updated
          
          // Find download by sessionId
          let targetEntry = entries.find(([_, download]) => download.sessionId === data.sessionId)
          
          // Fallback: if no sessionId match, update first incomplete download
          if (!targetEntry) {
            targetEntry = entries.find(([_, download]) => download.progress < 100)
          }
          
          if (targetEntry) {
            const [trackId, download] = targetEntry
            
            const newProgress = data.progress ?? download.progress
            
            updated.set(trackId, {
              ...download,
              status: statusText,
              progress: newProgress
            })
            
            // Handle completion
            if (statusText === 'Complete' && newProgress === 100) {
              toast.success(`Downloaded: ${download.trackTitle}`, {
                description: `Saved to your local music folder`,
              })
              
              // Trigger folder rescan
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent("rescanLocalFolder"))
              }, 1000)
              
              // Remove from map after 1 second
              setTimeout(() => {
                setActiveDownloads(prev => {
                  const updated = new Map(prev)
                  updated.delete(trackId)
                  return updated
                })
              }, 1000)
            }
          }
          
          return updated
        })
        
        if (data.error) {
          setActiveDownloads(prev => {
            const updated = new Map(prev)
            const entries = Array.from(updated.entries())
            
            if (entries.length > 0) {
              // Find download by sessionId
              let targetEntry = entries.find(([_, download]) => download.sessionId === data.sessionId)
              
              // Fallback: if no sessionId match, update first incomplete download
              if (!targetEntry) {
                targetEntry = entries.find(([_, download]) => download.progress < 100)
              }
              
              if (targetEntry) {
                const [trackId, download] = targetEntry
                updated.set(trackId, {
                  ...download,
                  status: `Error: ${data.error}`,
                  progress: 0
                })
                
                // Show error toast
                toast.error("Download failed", {
                  description: data.error || "Please try again",
                })
                
                // Remove after 2 seconds
                setTimeout(() => {
                  setActiveDownloads(prev => {
                    const updated = new Map(prev)
                    updated.delete(trackId)
                    return updated
                  })
                }, 2000)
              }
            }
            
            return updated
          })
        }
      })
      
      socket.on('error', (error: any) => {
        // Socket error
      })
      
      socket.on('disconnect', () => {
        // Socket disconnected
      })
    }
    
    connectSocket()
    
    return () => {
      if (socket) {
        socket.disconnect()
      }
    }
  }, [activeDownloads.size])

  // Handle download with progress animation (MULTI-DOWNLOAD SUPPORT)
  const handleDownload = async () => {
    if (!currentTrack) return
    if (currentTrack.id.startsWith('local-') || currentTrack.id.startsWith('watched-')) return
    
    const trackId = currentTrack.id
    
    // If this track is already downloading, cancel it
    if (activeDownloads.has(trackId)) {
      const download = activeDownloads.get(trackId)!
      await handleCancelDownload(trackId, download.sessionId)
      return
    }
    
    // Get local music folder from localStorage
    const localMusicFolder = localStorage.getItem("watchedMusicFolder")
    
    if (!localMusicFolder) {
      authToast({
        title: "Set your music folder in Settings first",
        className: 'bg-red-500/90 text-white border-red-600',
        icon: (
          <AlertCircle className="h-4 w-4" />
        )
      })
      return
    }
    
    // Generate unique session ID for this download
    const sessionId = `download-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Add this download to the Map
    setActiveDownloads(prev => {
      const updated = new Map(prev)
      updated.set(trackId, {
        trackId,
        trackTitle: currentTrack.title,
        trackArtist: currentTrack.artist,
        albumArt: currentTrack.albumArt || '',
        sessionId,
        progress: 0,
        status: 'Initializing',
        showToast: true
      })
      return updated
    })
    
    // Fire-and-forget: Send download request, completion handled by WebSocket
    ;(async () => {
      try {
        const { downloadApi } = await import('@/lib/api/download')
        const spotifyUrl = currentTrack.spotifyUrl || `https://open.spotify.com/track/${trackId}`
        
        const response = await downloadApi.downloadToFolder({
          spotifyUrl,
          localMusicFolder,
          quality: "m4a",
          sessionId,
        })
        
        if (!response.success) {
          throw new Error(response.error || "Download failed to start")
        }
        
        // Note: Actual completion will come via WebSocket
      } catch (error: any) {
        
        // Update with error status
        setActiveDownloads(prev => {
          const updated = new Map(prev)
          if (updated.has(trackId)) {
            updated.set(trackId, {
              ...updated.get(trackId)!,
              status: `Error: ${error.message || 'Failed to start'}`,
              progress: 0
            })
          }
          return updated
        })
        
        toast.error("Download failed to start", {
          description: error.message || "Please try again",
        })
        
        // Remove after 2 seconds
        setTimeout(() => {
          setActiveDownloads(prev => {
            const updated = new Map(prev)
            updated.delete(trackId)
            return updated
          })
        }, 2000)
      }
    })()
  }
  
  // Handle download cancellation (MULTI-DOWNLOAD SUPPORT)
  const handleCancelDownload = async (trackId: string, sessionId: string) => {
    try {
      const { downloadApi } = await import('@/lib/api/download')
      await downloadApi.cancelDownload(sessionId)
      
      toast.info('Download cancelled')
    } catch (error) {
      // Silent fail
    } finally {
      // Remove from active downloads
      setActiveDownloads(prev => {
        const updated = new Map(prev)
        updated.delete(trackId)
        return updated
      })
    }
  }


  // Handle scroll tracking for expanded mode
  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        setScrollY(scrollRef.current.scrollTop)
      }
    }

    const scrollElement = scrollRef.current
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll)
      return () => scrollElement.removeEventListener('scroll', handleScroll)
    }
  }, [isExpanded])

  if (!currentTrack) {
    return null
  }

  // Generate fallback biography from Spotify data (matching artist-detail-view logic)
  const generateFallbackBiography = (artistData: any, bioData?: any) => {
    const name = artistData.name || currentTrack?.artist || 'This artist'
    const genres = artistData.genres || []
    const followers = artistData.followers?.total || 0
    const popularity = artistData.popularity || 0
    
    // Try to extract country from tags
    let country = ''
    const tags = bioData?.tags || []
    const countryNames = [
      'Rwanda', 'Kenya', 'Tanzania', 'Uganda', 'Nigeria', 'Ghana', 'South Africa',
      'USA', 'UK', 'Canada', 'France', 'Germany', 'Spain', 'Italy', 'Brazil',
      'Mexico', 'Argentina', 'Colombia', 'Japan', 'Korea', 'China', 'India',
      'Australia', 'Jamaica', 'Trinidad', 'Barbados', 'Congo', 'Senegal', 'Mali',
      'Cameroon', 'Ethiopia', 'Morocco', 'Egypt', 'Algeria', 'Tunisia'
    ]
    
    for (const tag of tags) {
      const tagLower = tag.toLowerCase()
      for (const countryName of countryNames) {
        if (tagLower === countryName.toLowerCase() || tagLower.includes(countryName.toLowerCase())) {
          country = countryName
          break
        }
      }
      if (country) break
    }
    
    // Calculate popularity level
    let popularityLevel = 'emerging'
    let popularityDesc = 'steadily building a presence in the music scene'
    if (popularity >= 80) {
      popularityLevel = 'globally renowned'
      popularityDesc = 'commanding massive attention across streaming platforms worldwide'
    } else if (popularity >= 60) {
      popularityLevel = 'widely recognized'
      popularityDesc = 'establishing a major force in contemporary music'
    } else if (popularity >= 40) {
      popularityLevel = 'rising'
      popularityDesc = 'rapidly gaining recognition and expanding the audience'
    }
    
    // Format follower count
    const formatFollowers = (count: number) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
      if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
      return count.toString()
    }
    
    // Country adjectives
    const getCountryAdjective = (countryName: string) => {
      const adjectives: { [key: string]: string } = {
        'Rwanda': 'Rwandan', 'Kenya': 'Kenyan', 'Tanzania': 'Tanzanian',
        'Uganda': 'Ugandan', 'Nigeria': 'Nigerian', 'Ghana': 'Ghanaian',
        'South Africa': 'South African', 'USA': 'American', 'UK': 'British',
        'Jamaica': 'Jamaican', 'Congo': 'Congolese'
      }
      return adjectives[countryName] || `${countryName}`
    }
    
    // Clean genres - filter out obscure ones
    const getCleanGenres = (genreList: string[]) => {
      const skipGenres = ['bongo flava', 'bongo', 'flava', 'meme rap', 'vapor twitch']
      const cleanedGenres = genreList
        .filter(genre => !skipGenres.some(skip => genre.toLowerCase().includes(skip)))
        .map(genre => {
          const lower = genre.toLowerCase()
          if (lower.includes('afro')) return 'afrobeat'
          if (lower.includes('hip hop') || lower.includes('hip-hop')) return 'hip hop'
          if (lower.includes('r&b') || lower.includes('rnb')) return 'R&B'
          return genre
        })
      
      if (cleanedGenres.length === 0) {
        return country ? ['afrobeat'] : ['contemporary']
      }
      return cleanedGenres
    }
    
    const cleanGenres = getCleanGenres(genres)
    const estimatedListeners = formatFollowers(followers * 2) // Double for all platforms
    
    // Generate biography based on available data
    let bio = ''
    
    if (country && followers > 0) {
      const genreList = cleanGenres.slice(0, 2).join(' and ')
      const countryAdj = getCountryAdjective(country)
      bio = `${name} is a ${popularityLevel} artist from ${country}, bringing authentic sounds to the global music scene. With ${estimatedListeners} listeners across all platforms, this artist captivates audiences with distinctive ${genreList} music. The sound bridges traditional ${countryAdj} influences with modern production, ${popularityDesc}.`
    } else if (cleanGenres.length > 0 && followers > 0) {
      const genreList = cleanGenres.slice(0, 2).join(' and ')
      bio = `${name} is a ${popularityLevel} artist in the ${genreList} scene. With ${estimatedListeners} listeners across all platforms, this artist continues to captivate audiences with an innovative approach to music. ${popularityDesc.charAt(0).toUpperCase() + popularityDesc.slice(1)}.`
    } else if (followers > 0) {
      bio = `${name} is a ${popularityLevel} artist with ${estimatedListeners} dedicated listeners across all platforms. The ability to connect with audiences through authentic musical expression has earned a loyal fanbase that continues to grow.`
    } else {
      bio = `${name} is an artist making waves in the music industry. The music speaks for itself, inviting listeners to discover and explore this unique artistic vision.`
    }
    
    return {
      name,
      biography: bio,
      summary: bio.split('.')[0] + '.',
      followers: followers * 2, // Show doubled count
      popularity,
      genres: cleanGenres,
      source: 'Generated from Spotify data'
    }
  }

  // Fetch artist biography for expanded mode
  const fetchArtistBiography = async () => {
    if (!currentTrack?.artist) return
    
    // 🎯 USE SAME PRIMARY ARTIST LOGIC AS IMAGE FETCHING
    const primaryArtist = currentTrack.artist.split(/[&,]|\s+feat\.?\s+|\s+ft\.?\s+/i)[0].trim()
    
    // Check cache first using primary artist
    const cachedBio = getNPVCachedBiography(primaryArtist);
    if (cachedBio) {
      setBiography(cachedBio);
      return;
    }
    
    setLoadingBiography(true)
    
    try {
      // First try to get biography from your API using primary artist
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_BASE_URL}/artist/${encodeURIComponent(primaryArtist)}/biography`)
      
      if (response.ok) {
        const data = await response.json()
        if (data && (data.biography || data.summary)) {
          setBiography(data)
          setNPVCachedBiography(primaryArtist, data); // Cache using primary artist
          return
        }
      }
      
      // If no biography found, try to get Spotify artist data for fallback using primary artist
      const spotifyResponse = await fetch(`${API_BASE_URL}/spotify/artist-info/${encodeURIComponent(primaryArtist)}`);
      
      // Also try to get tags from Last.fm for country detection
      let bioTags = null
      try {
        const bioResponse = await fetch(`${API_BASE_URL}/artist/${encodeURIComponent(primaryArtist)}/biography`)
        if (bioResponse.ok) {
          const bioData = await bioResponse.json()
          bioTags = bioData
        }
      } catch (err) {
        // Ignore error, bioTags will stay null
      }
      
      if (spotifyResponse.ok) {
        const spotifyData = await spotifyResponse.json()
        const fallbackBio = generateFallbackBiography(spotifyData, bioTags)
        setBiography(fallbackBio)
        setNPVCachedBiography(primaryArtist, fallbackBio); // Cache using primary artist
      } else {
        // Last resort: minimal fallback using primary artist
        const minimalBio = {
          name: primaryArtist,
          biography: `${primaryArtist} is an artist making waves in the music industry. The music speaks for itself, inviting listeners to discover and explore this unique artistic vision.`,
          summary: `${primaryArtist} is an artist making waves in the music industry.`,
          source: 'Generated fallback'
        }
        setBiography(minimalBio)
        setNPVCachedBiography(primaryArtist, minimalBio); // Cache using primary artist
      }
      
    } catch (err) {
      // Minimal fallback on error using primary artist
      const errorBio = {
        name: primaryArtist,
        biography: `${primaryArtist} is an artist whose music speaks for itself. This creative work continues to resonate with listeners around the world.`,
        summary: `${primaryArtist} is an artist whose music speaks for itself.`,
        source: 'Error fallback'
      }
      setBiography(errorBio)
      setNPVCachedBiography(primaryArtist, errorBio); // Cache using primary artist
    } finally {
      setLoadingBiography(false)
    }
  }

  // Preload images in background for seamless transitions
  const preloadImage = useCallback((url: string) => {
    return new Promise<void>((resolve, reject) => {
      if (preloadedImages.has(url)) {
        resolve()
        return
      }
      
      const img = new Image()
      img.onload = () => {
        setPreloadedImages(prev => new Set([...prev, url]))
        resolve()
      }
      img.onerror = reject
      img.src = url
    })
  }, [preloadedImages])

  // Extract dominant color from track image (HSV-based for better accuracy, including sky blue)
  const extractDominantColor = useCallback((imageUrl: string) => {
    return new Promise<string>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'

      img.onload = () => {
        try {
          // Downscale for performance while keeping color distribution
          const maxDim = 220
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height))
          const w = Math.max(1, Math.floor(img.width * scale))
          const h = Math.max(1, Math.floor(img.height * scale))

          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          if (!ctx) {
            resolve('#3b82f6')
            return
          }
          canvas.width = w
          canvas.height = h
          ctx.drawImage(img, 0, 0, w, h)

          const { data } = ctx.getImageData(0, 0, w, h)

          // Helpers
          const rgbToHsv = (r: number, g: number, b: number) => {
            r /= 255; g /= 255; b /= 255
            const max = Math.max(r, g, b), min = Math.min(r, g, b)
            const d = max - min
            let h = 0
            if (d !== 0) {
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)); break
                case g: h = ((b - r) / d + 2); break
                case b: h = ((r - g) / d + 4); break
              }
              h *= 60
            }
            const s = max === 0 ? 0 : d / max
            const v = max
            return { h, s, v }
          }

          // Histogram on hue with saturation/value weighting
          const H_BINS = 72 // 5-degree bins
          const hist = new Array(H_BINS).fill(0)

          // Also keep sums to compute an averaged color around top hue
          const sum = new Array(H_BINS).fill(null).map(() => ({ r: 0, g: 0, b: 0, w: 0 }))

          const stepPx = 4 // read all pixels (already downscaled). If needed, set to 8/12 for extra perf
          for (let i = 0; i < data.length; i += stepPx) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const a = data[i + 3]
            if (a < 128) continue // transparent

            const { h, s, v } = rgbToHsv(r, g, b)

            // Ignore near-greys but keep vibrant lights (so sky blue survives)
            if (s < 0.08 && v > 0.9) continue // near white
            if (v < 0.08) continue // near black

            const bin = Math.min(H_BINS - 1, Math.floor((h / 360) * H_BINS))

            // Weighting: emphasize saturation and brightness slightly
            const weight = Math.pow(s, 1.2) * Math.pow(v, 0.9)
            hist[bin] += weight
            sum[bin].r += r * weight
            sum[bin].g += g * weight
            sum[bin].b += b * weight
            sum[bin].w += weight
          }

          // If everything filtered out, fallback
          let topBin = hist.findIndex((v) => v === Math.max(...hist))
          if (topBin < 0 || sum[topBin].w === 0) {
            resolve('#3b82f6')
            return
          }

          // Smooth by looking at neighboring bins to avoid spiky artifacts
          const wrap = (idx: number) => (idx + H_BINS) % H_BINS
          const neighbors = [wrap(topBin - 1), topBin, wrap(topBin + 1)]
          let R = 0, G = 0, B = 0, W = 0
          for (const bIdx of neighbors) {
            R += sum[bIdx].r
            G += sum[bIdx].g
            B += sum[bIdx].b
            W += sum[bIdx].w
          }

          if (W === 0) {
            resolve('#3b82f6')
            return
          }
          const rAvg = Math.round(R / W)
          const gAvg = Math.round(G / W)
          const bAvg = Math.round(B / W)

          resolve(`rgb(${rAvg}, ${gAvg}, ${bAvg})`)
        } catch (error) {
          resolve('#3b82f6')
        }
      }

      img.onerror = () => resolve('#3b82f6')
      img.src = imageUrl
    })
  }, [])

  // Update dominant color when track changes
  useEffect(() => {
    if (currentTrack?.albumArt && isExpanded) {
      extractDominantColor(currentTrack.albumArt)
        .then(color => {
          setDominantColor(color)
        })
        .catch(() => {
          setDominantColor('#3b82f6') // Fallback blue
        })
    }
  }, [currentTrack?.albumArt, isExpanded, extractDominantColor])

  // Create gradient style from dominant color
  const createGradientStyle = useCallback((dominantColor: string) => {
    // Your app's iconic dark blue from CSS variables (--card: 222.2 84% 4.9%)
    const iconicDarkBlue = '#0a0a1a' // HSL(222.2, 84%, 4.9%) converted to hex
    const mediumDarkBlue = '#1a1a2e' // Slightly lighter version
    
    // Convert RGB to lighter accent version for gradient
    const rgbMatch = dominantColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number)
      
      // Create a subtle accent version of the extracted color (much more subtle)
      const accentR = Math.floor(r * 0.4)
      const accentG = Math.floor(g * 0.4)
      const accentB = Math.floor(b * 0.4)
      
      return {
        background: `linear-gradient(135deg, 
          ${iconicDarkBlue} 0%, 
          ${mediumDarkBlue} 30%, 
          rgb(${accentR}, ${accentG}, ${accentB}) 70%, 
          ${iconicDarkBlue} 100%)`
      }
    }
    
    // Fallback gradient with your iconic dark blue
    return {
      background: `linear-gradient(135deg, ${iconicDarkBlue} 0%, ${mediumDarkBlue} 50%, ${iconicDarkBlue} 100%)`
    }
  }, [])

  // Smart preloading: Load current image FIRST, then surrounding images in background
  useEffect(() => {
    if (currentTrack?.artistImages && currentTrack.artistImages.length > 0) {
      const imageUrls = currentTrack.artistImages.map(img => 
        typeof img === 'string' ? img : img?.url
      ).filter(Boolean);
      
      const currentUrl = imageUrls[currentImageIndex];
      
      // Priority 1: Load current image immediately
      if (currentUrl && !imagePreloadCache.has(currentUrl)) {
        preloadImage(currentUrl).catch(() => {});
      }
      
      // Priority 2: Preload surrounding images in background (non-blocking)
      setTimeout(() => {
        preloadSurroundingImages(imageUrls, currentImageIndex);
      }, 100); // Small delay to not block current image
    }
  }, [currentImageIndex, currentTrack?.artistImages])

  // Minimized NPV - track when the small artist image is ready, show loader until then
  useEffect(() => {
    const url = currentTrack?.artistImages?.[currentImageIndex]?.url
    if (url) {
      setMiniArtistImageLoading(true)
      const img = new Image()
      img.onload = () => setMiniArtistImageLoading(false)
      img.onerror = () => setMiniArtistImageLoading(false)
      img.src = url
    } else {
      setMiniArtistImageLoading(false)
    }
  }, [currentTrack?.artistImages, currentImageIndex])

  // Image navigation functions with instant transitions
  const nextImage = useCallback(async () => {
    if (currentTrack?.artistImages && currentTrack.artistImages.length > 1 && !imageTransitioning) {
      setImageTransitioning(true)
      setImageLoading(true)
      
      const nextIndex = (currentImageIndex + 1) % currentTrack.artistImages.length
      const nextUrl = currentTrack.artistImages[nextIndex]?.url
      
      try {
        // Preload image if not already cached
        if (nextUrl) {
          await preloadImage(nextUrl)
        }
        
        setCurrentImageIndex(nextIndex)
        setImageLoading(false)
        setImageTransitioning(false)
      } catch (error) {
        // Even on error, change image immediately
        setCurrentImageIndex(nextIndex)
        setImageLoading(false)
        setImageTransitioning(false)
      }
    }
  }, [currentTrack?.artistImages, currentImageIndex, imageTransitioning, preloadImage])

  const prevImage = useCallback(async () => {
    if (currentTrack?.artistImages && currentTrack.artistImages.length > 1 && !imageTransitioning) {
      setImageTransitioning(true)
      setImageLoading(true)
      
      const prevIndex = (currentImageIndex - 1 + currentTrack.artistImages.length) % currentTrack.artistImages.length
      const prevUrl = currentTrack.artistImages[prevIndex]?.url
      
      try {
        // Preload image if not already cached
        if (prevUrl) {
          await preloadImage(prevUrl)
        }
        
        setCurrentImageIndex(prevIndex)
        setImageLoading(false)
        setImageTransitioning(false)
      } catch (error) {
        // Even on error, change image immediately
        setCurrentImageIndex(prevIndex)
        setImageLoading(false)
        setImageTransitioning(false)
      }
    }
  }, [currentTrack?.artistImages, currentImageIndex, imageTransitioning, preloadImage])

  // Reset to first image when track changes
  useEffect(() => {
    setCurrentImageIndex(0)
    setDisplayedImageIndex(0)
    setPreloadedImages(new Set())
    setImageLoading(false)
    setImageTransitioning(false)
  }, [currentTrack?.id])

  const toggleExpanded = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setIsExpanded(!isExpanded)
    if (!isExpanded) {
      fetchArtistBiography() // Fetch biography when expanding
    } else {
      setIsArtistDialogOpen(false) // Close dialog when minimizing
      setBiography(null) // Clear biography data
      // Keep current image index - don't reset to 0
      setShowFullBiography(false) // Close full biography dialog
    }
  }

  // Expanded fullscreen layout
  const renderExpandedLayout = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background z-[150] overflow-hidden"
    >
      {/* Background track image with parallax effect */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: currentTrack.albumArt ? `url(${currentTrack.albumArt})` : 'none',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          transform: `translateY(${scrollY * 0.5}px)`, // Parallax effect
          filter: 'blur(20px)'
        }}
      />
      
      {/* Top bar with track name and minimize button */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-background/80 to-transparent">
        <div className="flex justify-between items-center">
          <div>
            <h1 
              className="text-2xl font-bold cursor-pointer hover:text-blue-500 transition-colors"
              onClick={async (e) => {
                e.stopPropagation()
                
                // Try direct IDs first
                const albumId = (currentTrack as any).spotifyAlbumId || (currentTrack as any).albumId
                if (albumId) {
                  router.push(`/album/${albumId}`)
                  return
                }
                
                // If no ID, search for album by name and artist
                try {
                  const token = localStorage.getItem('token')
                  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                  
                  const searchQuery = `${currentTrack.album} ${primaryArtist}`
                  const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}&type=album&limit=1`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                  })
                  
                  if (response.ok) {
                    const searchData = await response.json()
                    if (searchData.albums && searchData.albums.length > 0) {
                      router.push(`/album/${searchData.albums[0].id}`)
                    }
                  }
                } catch (error) {
                  toast.error('Could not find album')
                }
              }}
              title="View album"
            >
              {currentTrack.title}
            </h1>
            <p 
              className="text-muted-foreground cursor-pointer hover:text-blue-500 transition-colors"
              onClick={async (e) => {
                e.stopPropagation()
                
                // Show BrandedLoader immediately
                setNavigationText(primaryArtist)
                setShowNavigationLoader(true)
                
                try {
                  // Try direct IDs first
                  const artistId = (currentTrack as any).spotifyArtistId || (currentTrack as any).artistId
                  if (artistId) {
                    router.push(`/artist/${artistId}`)
                    return
                  }
                  
                  // If no ID, search for artist by name
                  const token = localStorage.getItem('token')
                  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                  
                  const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(primaryArtist)}&type=artist&limit=1`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                  })
                  
                  if (response.ok) {
                    const searchData = await response.json()
                    if (searchData.artists && searchData.artists.length > 0) {
                      router.push(`/artist/${searchData.artists[0].id}`)
                    } else {
                      setShowNavigationLoader(false)
                      toast.error('Artist not found')
                    }
                  } else {
                    setShowNavigationLoader(false)
                    toast.error('Failed to search')
                  }
                } catch (error) {
                  setShowNavigationLoader(false)
                  toast.error('Could not find artist')
                }
              }}
              title="View artist"
            >
              {currentTrack.artist}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={(e) => toggleExpanded(e)}
            className="h-8 w-8 p-0 opacity-100 text-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors duration-200"
          >
            <Minimize2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Scrollable content */}
      <ScrollArea 
        className="h-full [&>div>div[style]]:!pr-0" 
        ref={scrollRef}
        style={{
          '--scrollbar-width': '0px'
        } as React.CSSProperties}
      >
        <div className="pt-24">
          {/* Centered track image */}
          <div className="flex justify-center items-center min-h-[60vh] px-6">
            <div className="relative group">
              <div className="w-80 h-80 md:w-96 md:h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl">
                {currentTrack.albumArt ? (
                  <img
                    src={currentTrack.albumArt}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Music className="w-24 h-24 text-white/50" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Artist content in horizontal layout - Two separate cards */}
          <div className="flex justify-center items-start px-6 pb-6">
            <div className={`grid ${currentTrack.artistImages && currentTrack.artistImages.length > 0 ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-8 w-full max-w-[1000px]`}>
              {/* Left Card: Artist Image - Only show if artist images are available */}
              {currentTrack.artistImages && currentTrack.artistImages.length > 0 && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-96 h-96 md:w-[450px] md:h-[450px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 shadow-2xl relative group"
                >
                  <img
                    src={(() => {
                      const imageObj = currentTrack.artistImages[displayedImageIndex]
                      let url: string
                      
                      if (typeof imageObj === 'string') {
                        url = imageObj
                      } else if (imageObj && typeof (imageObj as any).url === 'string') {
                        url = (imageObj as any).url
                      } else if (imageObj && typeof (imageObj as any).url?.url === 'string') {
                        // Handle nested url structure
                        url = (imageObj as any).url.url
                      } else {
                        url = ''
                      }
                      
                      return url
                    })()}
                    alt={currentTrack.artist}
                    className="w-full h-full object-cover transition-all duration-300 opacity-100 scale-100"
                  />
                  
                  {/* Hidden preload image for next image */}
                  {currentImageIndex !== displayedImageIndex && currentTrack.artistImages?.length > 0 && (() => {
                    const imageObj = currentTrack.artistImages[currentImageIndex]
                    if (!imageObj) return null
                    
                    let url: string
                    
                    if (typeof imageObj === 'string') {
                      url = imageObj
                    } else if (imageObj && typeof (imageObj as any).url === 'string') {
                      url = (imageObj as any).url
                    } else if (imageObj && typeof (imageObj as any).url?.url === 'string') {
                      // Handle nested url structure
                      url = (imageObj as any).url.url
                    } else {
                      url = ''
                    }
                    
                    return url ? (
                      <img
                        src={url}
                        alt={currentTrack.artist}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
                        onLoad={() => {
                          setDisplayedImageIndex(currentImageIndex);
                          setImageLoading(false);
                          setImageTransitioning(false);
                        }}
                        onError={(e) => {
                          setImageLoading(false);
                          setImageTransitioning(false);
                        }}
                      />
                    ) : null
                  })()}
                  
                  {/* Loading overlay */}
                  {(imageLoading || imageTransitioning) && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BrandedLoader size="lg" showText={false} />
                    </div>
                  )}
                  
                  {/* Navigation Arrows - only show if multiple images */}
                  {currentTrack.artistImages && currentTrack.artistImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        disabled={imageTransitioning}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                          imageTransitioning ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'
                        }`}
                      >
                        <ChevronLeft className="w-6 h-6 text-white" />
                      </button>
                      <button
                        onClick={nextImage}
                        disabled={imageTransitioning}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                          imageTransitioning ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'
                        }`}
                      >
                        <ChevronRight className="w-6 h-6 text-white" />
                      </button>
                    </>
                  )}
                </motion.div>
              )}

              {/* Right Card: Biography */}
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="w-96 h-96 md:w-[450px] md:h-[450px] rounded-2xl overflow-hidden shadow-2xl relative p-6 transition-all duration-1000 ease-in-out group"
                style={createGradientStyle(dominantColor)}
              >
                {/* Loading overlay (centered, same position as hover icon) */}
                {loadingBiography && (
                  <div className="absolute inset-0 flex items-center justify-center z-30">
                    <BrandedLoader size="md" showText={false} />
                  </div>
                )}
                {/* Hover overlay - matching artist image style */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-2xl z-20">
                  <div 
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 rounded-full p-3 pointer-events-auto cursor-pointer hover:bg-black/70"
                    onClick={async (e) => {
                      e.stopPropagation()
                      
                      // If biography doesn't exist, fetch it first
                      if (!biography) {
                        await fetchArtistBiography()
                      }
                      
                      setShowFullBiography(true)
                    }}
                  >
                    <ExternalLink className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                <div className="space-y-6 relative z-10">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">{biography?.name || currentTrack.artist}</h3>
                    {loadingBiography ? (
                      <></>
                    ) : biography ? (
                      <div className="space-y-4 text-white/90">
                        {/* Biography summary - only show for real biographies */}
                        {biography.summary && !biography.source?.includes('Generated') && !biography.source?.includes('fallback') && (
                          <div className="space-y-4">
                            <p className="leading-relaxed text-white/80">
                              {biography.summary}...
                            </p>
                          </div>
                        )}
                        
                        {/* Show full content directly for generated/fallback biographies (replace summary) */}
                        {biography.biography && (biography.source?.includes('Generated') || biography.source?.includes('fallback')) && (
                          <div className="space-y-3 text-white/80 leading-relaxed">
                            {biography.biography.split('\n\n').map((paragraph: string, index: number) => (
                              <p key={index} className="">
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        )}
                        
                      </div>
                    ) : (
                      <div className="text-center py-8 text-white/70">
                        <p>No biography available for this artist.</p>
                        <button
                          onClick={fetchArtistBiography}
                          className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </ScrollArea>
      
      {/* Full Biography Dialog - Matching card design */}
      {showFullBiography && biography && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[160] flex items-center justify-center p-4"
          onClick={() => setShowFullBiography(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-96 h-96 md:w-[450px] md:h-[450px] rounded-2xl overflow-hidden shadow-2xl relative p-6 group"
            style={createGradientStyle(dominantColor)}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button overlay */}
            <div className="absolute top-4 right-4 z-30">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFullBiography(false)}
                className="text-white hover:text-blue-400 hover:bg-transparent focus:outline-none focus:ring-0 transform hover:scale-110 transition-colors transition-transform duration-200 ease-out"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            
            {/* Content - matching card layout */}
            <ScrollArea className="relative z-10 h-full homepage-scroll [&>div>div[style]]:!pr-0 -mr-6">
              <div className="space-y-6 pr-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">{biography?.name || currentTrack.artist}</h3>
                  <div className="space-y-4 text-white/80 leading-relaxed">
                    {biography.biography.split('\n\n').map((paragraph: string, index: number) => (
                      <p key={index} className="">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </motion.div>
        </div>
      )}
    </motion.div>
  )

  // Show expanded layout if expanded - CHECK THIS FIRST!
  if (isExpanded) {
    return (
      <>
        <AnimatePresence>
          {renderExpandedLayout()}
        </AnimatePresence>
        
        {/* Download Toasts - Must be rendered here too! */}
        {Array.from(activeDownloads.entries()).map(([trackId, download]) => (
          <DownloadToast
            key={trackId}
            isVisible={download.showToast}
            albumArt={download.albumArt}
            title={download.trackTitle}
            artist={download.trackArtist}
            status={download.status}
            progress={download.progress}
            onClose={() => handleCancelDownload(trackId, download.sessionId)}
          />
        ))}
      </>
    )
  }

  const renderContent = () => (
    <>
      {/* Album Art & Song Info */}
      <div className="space-y-4 -mt-2">
        <div className="relative group">
          <div className="w-[290px] h-72 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg border border-border">
            {currentTrack.albumArt ? (
              <img
                src={currentTrack.albumArt}
                alt={currentTrack.title}
                className="w-full h-full object-cover rounded-lg"
                style={{
                  objectFit: 'cover'
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Music className="w-16 h-16 text-white/50" />
              </div>
            )}
          </div>

          {/* Canvas Animation Overlay */}
          {isPlaying && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          )}
        </div>

        <div className="space-y-1">
          <div>
            <h3 
              className="text-lg font-semibold truncate cursor-pointer hover:text-blue-500 transition-colors"
              onClick={async (e) => {
                e.stopPropagation()
                
                // Try direct IDs first
                const albumId = (currentTrack as any).spotifyAlbumId || (currentTrack as any).albumId
                if (albumId) {
                  router.push(`/album/${albumId}`)
                  return
                }
                
                // If no ID, search for album by name and artist
                try {
                  const token = localStorage.getItem('token')
                  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                  
                  const searchQuery = `${currentTrack.album} ${primaryArtist}`
                  const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(searchQuery)}&type=album&limit=1`, {
                    headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                  })
                  
                  if (response.ok) {
                    const searchData = await response.json()
                    if (searchData.albums && searchData.albums.length > 0) {
                      router.push(`/album/${searchData.albums[0].id}`)
                    }
                  }
                } catch (error) {
                  toast.error('Could not find album')
                }
              }}
              title="View album"
            >
              {currentTrack.title.length > 25 ? `${currentTrack.title.substring(0, 25)}...` : currentTrack.title}
            </h3>
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p 
                  className="text-sm text-muted-foreground truncate cursor-pointer hover:text-blue-500 transition-colors"
                  onClick={async (e) => {
                    e.stopPropagation()
                    
                    // Show BrandedLoader immediately
                    setNavigationText(primaryArtist)
                    setShowNavigationLoader(true)
                    
                    try {
                      // Try direct IDs first
                      const artistId = (currentTrack as any).spotifyArtistId || (currentTrack as any).artistId
                      if (artistId) {
                        router.push(`/artist/${artistId}`)
                        return
                      }
                      
                      // If no ID, search for artist by name
                      const token = localStorage.getItem('token')
                      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
                      
                      const response = await fetch(`${API_BASE_URL}/search?q=${encodeURIComponent(primaryArtist)}&type=artist&limit=1`, {
                        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
                      })
                      
                      if (response.ok) {
                        const searchData = await response.json()
                        if (searchData.artists && searchData.artists.length > 0) {
                          router.push(`/artist/${searchData.artists[0].id}`)
                        } else {
                          setShowNavigationLoader(false)
                          toast.error('Artist not found')
                        }
                      } else {
                        setShowNavigationLoader(false)
                        toast.error('Failed to search')
                      }
                    } catch (error) {
                      setShowNavigationLoader(false)
                      toast.error('Could not find artist')
                    }
                  }}
                  title="View artist"
                >
                  {currentTrack.artist.length > 25 ? `${currentTrack.artist.substring(0, 25)}...` : currentTrack.artist}
                </p>
              </div>
              
              {/* Like and Save Actions - Inline with artist name */}
              <div className="flex items-center ml-4 gap-1">
                {/* Download Button with Progress */}
                {!currentTrack.id.startsWith('local-') && !currentTrack.id.startsWith('watched-') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDownload}
                    disabled={isCurrentTrackDownloading}
                    className="h-8 w-8 p-0 opacity-100 text-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors duration-200"
                    title="Download"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                )}
                
                <SongActions
                  track={currentTrack}
                  size="sm"
                  variant="ghost"
                  showLabels={false}
                  isDownloading={isCurrentTrackDownloading}
                  className="opacity-100 [&_button]:opacity-100 [&_button]:text-foreground [&_button:hover]:text-blue-500 [&_button:hover]:bg-blue-500/10 [&_button]:transition-colors [&_button]:duration-200 [&>div:last-child]:opacity-100 [&_button:hover]:!bg-blue-500/10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Artist Image */}
      <div className="space-y-4">
        <div className="relative group w-[290px]">
          <button
            onClick={() => {
              setIsArtistDialogOpen(true);
            }}
            className="w-full h-72 bg-[#0a0a1a] shadow-lg cursor-pointer rounded-lg overflow-hidden relative"
          >
            {/* Show loading state when fetching artist images */}
            {artistImagesLoading ? (
              <div className="w-full h-full flex items-center justify-center">
                <BrandedLoader size="md" showText={false} />
              </div>
            ) : currentTrack.artistImages && currentTrack.artistImages.length > 0 ? (
              <>
                {(() => {
                  const imageObj = currentTrack.artistImages[displayedImageIndex]
                  let url: string
                  
                  if (typeof imageObj === 'string') {
                    url = imageObj
                  } else if (imageObj && typeof (imageObj as any).url === 'string') {
                    url = (imageObj as any).url
                  } else if (imageObj && typeof (imageObj as any).url?.url === 'string') {
                    // Handle nested url structure
                    url = (imageObj as any).url.url
                  } else {
                    url = ''
                  }
                  
                  
                  // Only render img if we have a valid URL
                  return url ? (
                    <img
                      src={url}
                      alt={currentTrack.artist}
                      className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-100"
                      style={{
                        top: '-0%',
                        left: '-0%'
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-white/50" />
                    </div>
                  )
                })()}
                
                {/* Hidden preload image for next image */}
                {currentImageIndex !== displayedImageIndex && currentTrack.artistImages?.length > 0 && (() => {
                  const imageObj = currentTrack.artistImages[currentImageIndex]
                  if (!imageObj) return null
                  
                  let url: string
                  
                  if (typeof imageObj === 'string') {
                    url = imageObj
                  } else if (imageObj && typeof (imageObj as any).url === 'string') {
                    url = (imageObj as any).url
                  } else if (imageObj && typeof (imageObj as any).url?.url === 'string') {
                    // Handle nested url structure
                    url = (imageObj as any).url.url
                  } else {
                    url = ''
                  }
                  
                  // Only render preload img if we have a valid URL
                  return url ? (
                    <img
                      src={url}
                      alt={currentTrack.artist}
                      className="absolute inset-0 w-full h-full object-cover rounded-lg opacity-0 pointer-events-none"
                      style={{
                        top: '-0%',
                        left: '-0%'
                      }}
                      onLoad={() => {
                        setDisplayedImageIndex(currentImageIndex);
                        setImageLoading(false);
                        setImageTransitioning(false);
                      }}
                      onError={() => {
                        setImageLoading(false);
                        setImageTransitioning(false);
                      }}
                    />
                  ) : null
                })()}
                
                {/* Loading overlay */}
                {(imageLoading || imageTransitioning) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <BrandedLoader size="md" showText={false} />
                  </div>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-16 h-16 text-white/50" />
              </div>
            )}
            
            {/* Text Overlay with gradient background */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none rounded-lg">
              {/* "about" text - pushed to absolute top edge */}
              <div className="absolute top-0 left-2 pt-1">
                <span className="text-white text-xs font-medium opacity-90">
                  about the artist
                </span>
              </div>
              
              {/* Artist name - pushed to absolute bottom edge */}
              <div className="absolute bottom-0 left-2 pb-1">
                <h3 className="text-white text-base font-bold drop-shadow-2xl">
                  {primaryArtist}
                </h3>
              </div>
            </div>
            
            {/* Hover overlay - moved OUTSIDE button to use parent group */}
          </button>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-lg">
            <div 
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/50 rounded-full p-3 pointer-events-auto cursor-pointer"
              onClick={() => {
                setIsArtistDialogOpen(true);
              }}
            >
              <ExternalLink className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Up Next Section - Only show when there's a queue */}
      {playbackQueue.length > 0 && (
        <div className="space-y-4">
          <div className="sticky top-0 z-10 grid grid-cols-[auto_165px_auto_1fr] items-center w-full px-0 py-1">
            <h4 className="text-sm font-semibold text-muted-foreground">Up Next</h4>
            <div aria-hidden="true" />
            {onViewQueue && (
              <button
                onClick={onViewQueue}
                className="text-xs text-[#00BFFF] hover:text-[#00BFFF]/80 transition-colors whitespace-nowrap"
              >
                View Queue
              </button>
            )}
            <div aria-hidden="true" />
          </div>
          {/* Next Song Preview */}
          {(() => {
            // Show the next song after current track in the queue
            let nextSong = null;
            
            if (currentTrack && playbackQueue.length > 0) {
              // Find current track in queue and get the next one
              const currentIndex = playbackQueue.findIndex(track => track.id === currentTrack.id);
              if (currentIndex >= 0 && currentIndex < playbackQueue.length - 1) {
                nextSong = playbackQueue[currentIndex + 1];
              } else if (currentIndex === playbackQueue.length - 1) {
                // Last song in queue - show first song (will loop back)
                nextSong = playbackQueue[0];
              }
            } else if (playbackQueue.length > 0) {
              // No current track, show first song in queue
              nextSong = playbackQueue[0];
            }
            
            if (!nextSong) return null;
            
            return (
              <div className="flex items-center space-x-3 pl-0.5 pr-3 py-3 rounded-lg bg-card/50 hover:bg-card/70 transition-colors cursor-pointer">
                <div className="w-12 h-12 rounded-md overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0">
                  {nextSong.albumArt ? (
                    <img
                      src={nextSong.albumArt}
                      alt={nextSong.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Music className="w-6 h-6 text-white/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {nextSong.title.length > 33 ? `${nextSong.title.substring(0, 33)}...` : nextSong.title}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {nextSong.artist.length > 33 ? `${nextSong.artist.substring(0, 33)}...` : nextSong.artist}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

    </>
  )

  // Render as integrated column or overlay
  if (isIntegrated) {
    return (
      <div className="h-full w-full bg-background rounded-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-2.5 pb-0">
          <h2 className="text-sm font-semibold truncate flex-1 mr-2">{currentTrack.title}</h2>
          <div className="flex items-center gap-1">
            {/* Track Options Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 opacity-100 text-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors duration-200"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background backdrop-blur-md border-border shadow-2xl space-y-1.5 p-2">
                {/* Like Song */}
                <DropdownMenuItem 
                  onSelect={(e) => {
                    e.preventDefault()
                    handleToggleLike()
                  }}
                  disabled={statusLoading}
                  className="flex items-center text-white hover:bg-accent focus:bg-accent cursor-pointer text-xs h-7 rounded-md"
                >
                  <Heart className={`h-3 w-3 mr-2 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
                  <span>{isLiked ? 'Remove from Liked Songs' : 'Add to Liked Songs'}</span>
                </DropdownMenuItem>

                {/* Save to Library */}
                <DropdownMenuItem 
                  onSelect={() => handleToggleSave()}
                  disabled={statusLoading}
                  className="flex items-center text-white hover:bg-accent focus:bg-accent cursor-pointer text-xs h-7 rounded-md"
                >
                  <Music className={`h-3 w-3 mr-2 ${isSaved ? 'text-green-500' : ''}`} />
                  <span>{isSaved ? 'Remove from Library' : 'Add to Library'}</span>
                </DropdownMenuItem>

                {/* Add to Playlist */}
                <DropdownMenuItem 
                  onClick={() => setShowAddToPlaylist(true)}
                  className="flex items-center text-white hover:bg-accent focus:bg-accent cursor-pointer text-xs h-7 rounded-md"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  <span>Add to playlist</span>
                </DropdownMenuItem>

                {/* Copy Spotify Link */}
                <DropdownMenuItem 
                  onClick={handleCopySpotifyLink}
                  className="flex items-center text-white hover:bg-accent focus:bg-accent cursor-pointer text-xs h-7 rounded-md"
                >
                  <Link className="h-3 w-3 mr-2" />
                  <span>Copy Spotify link</span>
                </DropdownMenuItem>

                {/* Download - disabled for local files */}
                <DropdownMenuItem 
                  onClick={handleDownload}
                  disabled={currentTrack.id.startsWith('local-') || currentTrack.id.startsWith('watched-')}
                  className="flex items-center text-white hover:bg-accent focus:bg-accent cursor-pointer text-xs h-7 rounded-md"
                >
                  {isCurrentTrackDownloading ? (
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                      <circle cx="12" cy="12" r="10" />
                      <rect x="9" y="9" width="6" height="6" fill="currentColor" />
                    </svg>
                  ) : (
                    <Download className="h-3 w-3 mr-2" />
                  )}
                  <span>{isCurrentTrackDownloading ? 'Stop downloading' : 'Download'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={(e) => toggleExpanded(e)}
              className="h-8 w-8 p-0 opacity-100 text-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors duration-200"
            >
              <Maximize2 className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0 opacity-100 text-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors duration-200"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1 [&>div>div[style]]:!pr-0">
          <div className="p-4 space-y-6 now-playing-scrollbar">
            {renderContent()}
          </div>
        </ScrollArea>
        
        {/* Artist Dialog for integrated mode */}
        <ArtistDialog
          isOpen={isArtistDialogOpen}
          onClose={() => {
            setIsArtistDialogOpen(false);
          }}
          artistName={primaryArtist}
          artistImages={currentTrack.artistImages?.map(img => 
            typeof img === 'string' ? img : (img?.url || '')
          ).filter(Boolean) || []}
          currentImageIndex={currentImageIndex}
          onImageIndexChange={setCurrentImageIndex}
        />

        {/* Add to Playlist - Same dialog used elsewhere */}
        {showAddToPlaylist && (
          <PlaylistSelectModal
            isOpen={showAddToPlaylist}
            onClose={() => setShowAddToPlaylist(false)}
            track={{
              id: currentTrack.id,
              title: currentTrack.title,
              artist: currentTrack.artist,
              album: currentTrack.album,
              albumArt: currentTrack.albumArt,
              duration: currentTrack.duration,
              url: currentTrack.url,
              spotifyUrl: currentTrack.spotifyUrl,
              genre: currentTrack.genre,
              year: currentTrack.year,
              createdAt: currentTrack.createdAt,
              updatedAt: currentTrack.updatedAt
            }}
          />
        )}
        
        {/* Download Toasts - Must be rendered in integrated mode too! */}
        {Array.from(activeDownloads.entries()).map(([trackId, download]) => (
          <DownloadToast
            key={trackId}
            isVisible={download.showToast}
            albumArt={download.albumArt}
            title={download.trackTitle}
            artist={download.trackArtist}
            status={download.status}
            progress={download.progress}
            onClose={() => handleCancelDownload(trackId, download.sessionId)}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-[500px] bg-background border-l border-border z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h2 className="text-sm font-semibold truncate flex-1 mr-2">{currentTrack.title}</h2>
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={(e) => toggleExpanded(e)}
                  className="h-8 w-8 p-0 opacity-100 text-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors duration-200"
                >
                  <Maximize2 className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onClose}
                  className="h-8 w-8 p-0 opacity-100 text-foreground hover:text-blue-500 hover:bg-blue-500/10 transition-colors duration-200"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1 [&>div>div[style]]:!pr-0">
              <div className="p-4 space-y-6 now-playing-scrollbar">
                {renderContent()}
              </div>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add to Playlist - Same dialog used elsewhere (overlay mode) */}
      {showAddToPlaylist && (
        <PlaylistSelectModal
          isOpen={showAddToPlaylist}
          onClose={() => setShowAddToPlaylist(false)}
          track={{
            id: currentTrack.id,
            title: currentTrack.title,
            artist: currentTrack.artist,
            album: currentTrack.album,
            albumArt: currentTrack.albumArt,
            duration: currentTrack.duration,
            url: currentTrack.url,
            spotifyUrl: currentTrack.spotifyUrl,
            genre: currentTrack.genre,
            year: currentTrack.year,
            createdAt: currentTrack.createdAt,
            updatedAt: currentTrack.updatedAt
          }}
        />
      )}
      
      {/* Artist Dialog */}
      <ArtistDialog
        isOpen={isArtistDialogOpen}
        onClose={() => {
          setIsArtistDialogOpen(false);
        }}
        artistName={currentTrack.artist.split(/[&,]|feat\.?|ft\.?/i)[0].trim()}
        artistImages={currentTrack.artistImages?.map(img => 
          typeof img === 'string' ? img : (img?.url || '')
        ).filter(Boolean) || []}
        currentImageIndex={currentImageIndex}
        onImageIndexChange={setCurrentImageIndex}
      />

      {/* Download Toasts - Render one for each active download */}
      {Array.from(activeDownloads.entries()).map(([trackId, download]) => {
          return (
            <DownloadToast
              key={trackId}
              isVisible={download.showToast}
              albumArt={download.albumArt}
              title={download.trackTitle}
              artist={download.trackArtist}
              status={download.status}
              progress={download.progress}
              onClose={() => handleCancelDownload(trackId, download.sessionId)}
            />
          )
        })
      }
      
      {/* Navigation Loader Overlay */}
      {showNavigationLoader && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex flex-col items-center justify-center">
          <BrandedLoader size="lg" showText={false} />
          <p className="text-white text-2xl font-bold mt-6">{navigationText}</p>
        </div>
      )}
    </>
  )
}
