"use client"


import { useDebouncedCallback } from 'use-debounce';
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Music, User, Album, Search } from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { searchApi } from "@/lib/api/search"
import { getTrackStream } from "@/lib/api/youtube-music"
import { usePlayer } from "@/components/player/player-provider"
import { SongActions } from "@/components/ui/song-actions"
import { AlbumActions } from "@/components/ui/album-actions"
import { ArtistDetailView } from "./artist-detail-view"
import { AlbumDetailView } from "./album-detail-view"
import { AlbumActionData } from "@/lib/api/user-songs"

// Image cache for fast loading
const imageCache = new Map<string, boolean>()

// Custom hook for image preloading with persistent caching
const useImagePreloader = (imageUrl: string) => {
  // Initialize isLoaded based on cache immediately
  const [isLoaded, setIsLoaded] = useState(() => {
    if (!imageUrl) return true
    return imageCache.has(imageUrl)
  })
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!imageUrl) {
      setIsLoaded(true) // No image to load
      return
    }

    // Check cache first - if cached, set loaded immediately
    if (imageCache.has(imageUrl)) {
      setIsLoaded(true)
      return
    }

    // If not cached, start preloading
    setIsLoaded(false)
    const img = new Image()
    img.onload = () => {
      imageCache.set(imageUrl, true) // Cache the loaded image
      setIsLoaded(true)
    }
    img.onerror = () => {
      setHasError(true)
      setIsLoaded(true) // Show fallback
    }
    img.src = imageUrl
  }, [imageUrl])

  return { isLoaded, hasError }
}

// Component wrapper that only renders when image is loaded
const ImageLoadedWrapper = ({ children, imageUrl, className }: { children: React.ReactNode, imageUrl: string, className?: string }) => {
  const { isLoaded } = useImagePreloader(imageUrl)
  
  if (!isLoaded) {
    // Show skeleton/placeholder while loading
    return (
      <div className={`${className} animate-pulse bg-muted/30 rounded-lg`}>
        <div className="w-full h-full bg-muted/50 rounded-lg"></div>
      </div>
    )
  }
  
  return <>{children}</>
}


interface SearchResultsProps {
  results: any
  isLoading: boolean
  query: string
  searchQuery?: string
  onSearchQueryChange?: (query: string) => void
  type: string
}

// In-memory cache for recent search results (atomic)
const searchResultCache = new Map<string, any>();


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
  if (type === 'playlist' && item?.images?.[0]?.url) {
    return item.images[0].url
  }
  if (type === 'user' && item?.profilePicture) {
    return item.profilePicture
  }
  return ''
}

export function SearchResults({ results, query, searchQuery, onSearchQueryChange }: SearchResultsProps) {
  const router = useRouter()
  
  // Debounced query state
  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const debounceQuery = useDebouncedCallback((q: string) => setDebouncedQuery(q), 200);
  useEffect(() => {
    debounceQuery(query);
  }, [query]);

  // Atomic loader state
  const [atomicLoaded, setAtomicLoaded] = useState(false);
  const [atomicImagesLoaded, setAtomicImagesLoaded] = useState(false);
  const [atomicResults, setAtomicResults] = useState<any>(null);
  const [atomicLoading, setAtomicLoading] = useState(false);
  const lastQueryRef = useRef('');

  // Cancel token for in-flight requests
  const abortControllerRef = useRef<AbortController | null>(null);

  // Player integration
  const { playTrack, currentTrack, currentTime, duration, isPlaying } = usePlayer();
  const [playingTrack, setPlayingTrack] = useState<string | null>(null);
  const [loadingTracks, setLoadingTracks] = useState<Record<string, number>>({});

  // YouTube Music play function with properly timed loading states
  const handlePlayTrack = async (track: any) => {
    try {
      setPlayingTrack(track.id);
      
      // Set initial loading state
      setLoadingTracks(prev => ({ ...prev, [track.id]: 10 }));
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Update loading: searching for track
      setLoadingTracks(prev => ({ ...prev, [track.id]: 30 }));
      
      // Get YouTube Music stream URL
      const streamData = await getTrackStream({
        spotifyId: track.id,
        artist: track.artists?.[0]?.name || 'Unknown Artist',
        title: track.name || 'Unknown Title',
        album: track.album?.name || 'Unknown Album'
      });
      
      // Update loading: processing stream
      setLoadingTracks(prev => ({ ...prev, [track.id]: 70 }));
      await new Promise(resolve => setTimeout(resolve, 300));

      if (streamData && streamData.streamUrl) {
        // Update loading: preparing to play
        setLoadingTracks(prev => ({ ...prev, [track.id]: 90 }));
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Complete loading bar first
        setLoadingTracks(prev => ({ ...prev, [track.id]: 100 }));
        await new Promise(resolve => setTimeout(resolve, 200)); // Wait for loading bar to complete
        
        // Convert to our Track format
        const playerTrack = {
          id: track.id,
          title: track.name || 'Unknown Title',
          artist: track.artists?.[0]?.name || 'Unknown Artist',
          album: track.album?.name || 'Unknown Album',
          albumArt: track.album?.images?.[0]?.url || '',
          artistImages: track.artistImages || [], // Include artist images from backend
          duration: Math.floor((track.duration_ms || 0) / 1000),
          url: streamData.streamUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Update player bar with new track data FIRST
        await playTrack(playerTrack);
        
        // Wait 200ms BEFORE audio starts playing
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Clear loading state after playback starts
        setTimeout(() => {
          setLoadingTracks(prev => {
            const newState = { ...prev };
            delete newState[track.id];
            return newState;
          });
        }, 500);
      } else {
        alert('Sorry, this track is not available for playback.');
        setLoadingTracks(prev => {
          const newState = { ...prev };
          delete newState[track.id];
          return newState;
        });
      }
    } catch (error) {
      alert('Failed to play this track. Please try again.');
      setLoadingTracks(prev => {
        const newState = { ...prev };
        delete newState[track.id];
        return newState;
      });
    } finally {
      setPlayingTrack(null);
    }
  };

  // Watch debouncedQuery, fetch and cache results atomically
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setAtomicResults(null);
      setAtomicLoaded(false);
      setAtomicImagesLoaded(false);
      setAtomicLoading(false);
      return;
    }
    setAtomicLoading(true);
    setAtomicLoaded(false);
    setAtomicImagesLoaded(false);
    // Cancel any in-flight fetch
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    lastQueryRef.current = debouncedQuery;

    // Check cache first
    if (searchResultCache.has(debouncedQuery)) {
      const cached = searchResultCache.get(debouncedQuery);
      setAtomicResults(cached);
      setAtomicLoaded(true);
      // Preload all images for atomic
      preloadAllImagesAtomic(cached).then(() => setAtomicImagesLoaded(true));
      setAtomicLoading(false);
      return;
    }

    // 🚀 FIXED: Use single "all" search instead of separate API calls
    (async () => {
      try {
        const allResults = await searchApi.search(debouncedQuery, 'all', 30, 0, controller.signal);
        if (controller.signal.aborted || lastQueryRef.current !== debouncedQuery) return;
        
        const atomic = {
          tracks: allResults.tracks || [],
          artists: allResults.artists || [],
          albums: allResults.albums || []
        };
        
        searchResultCache.set(debouncedQuery, atomic);
        setAtomicResults(atomic);
        setAtomicLoaded(true);
        
        // Preload images in background (don't block UI)
        preloadAllImagesAtomic(atomic).then(() => setAtomicImagesLoaded(true));
        setAtomicLoading(false);
      } catch (e) {
        if (!controller.signal.aborted) {
          setAtomicResults(null);
          setAtomicLoaded(false);
          setAtomicImagesLoaded(false);
          setAtomicLoading(false);
        }
      }
    })();
    // Cleanup
    return () => { controller.abort(); };
  }, [debouncedQuery]);

  // Helper to preload all images for atomic loader
  async function preloadAllImagesAtomic(res: any) {
    const urls: string[] = [];
    if (res?.tracks) urls.push(...res.tracks.map((t: any) => getImageWithFallback(t, 'track')));
    if (res?.artists) urls.push(...res.artists.map((a: any) => getImageWithFallback(a, 'artist')));
    if (res?.albums) urls.push(...res.albums.map((a: any) => getImageWithFallback(a, 'album')));
    await Promise.all(urls.filter(Boolean).map(
      url => new Promise(resolve => {
        if (imageCache.has(url)) return resolve(true);
        const img = new window.Image();
        img.onload = () => { imageCache.set(url, true); resolve(true); };
        img.onerror = () => resolve(true);
        img.src = url;
      })
    ));
  }

  // Refs for the scrollable containers
  const songsContainerRef = useRef<HTMLDivElement>(null);
  const artistsContainerRef = useRef<HTMLDivElement>(null);
  const albumsContainerRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('all')
  const [infiniteTracks, setInfiniteTracks] = useState<any[]>([])
  const [infiniteArtists, setInfiniteArtists] = useState<any[]>([])
  const [infiniteAlbums, setInfiniteAlbums] = useState<any[]>([])
  const [tracksOffset, setTracksOffset] = useState(0)
  const [artistsOffset, setArtistsOffset] = useState(0)
  const [albumsOffset, setAlbumsOffset] = useState(0)
  const [hasMoreTracks, setHasMoreTracks] = useState(true)
  const [hasMoreArtists, setHasMoreArtists] = useState(true)
  const [hasMoreAlbums, setHasMoreAlbums] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  
  // 🔁 RETRY COUNTERS: Track consecutive failed attempts
  const [tracksRetryCount, setTracksRetryCount] = useState(0)
  const [artistsRetryCount, setArtistsRetryCount] = useState(0)
  const [albumsRetryCount, setAlbumsRetryCount] = useState(0)
  const MAX_RETRY_ATTEMPTS = 3 // Stop after 3 consecutive failures
  
  // 🔒 PROCESSING FLAGS: Use refs to avoid useEffect re-runs
  const isProcessingTracksRef = useRef(false)
  const isProcessingArtistsRef = useRef(false)
  const isProcessingAlbumsRef = useRef(false)
  const songsObserverRef = useRef<HTMLDivElement>(null)
  const artistsObserverRef = useRef<HTMLDivElement>(null)
  const albumsObserverRef = useRef<HTMLDivElement>(null)

  // 🎵 ARTIST/ALBUM TRACK VIEWING STATE
  const [viewingArtist, setViewingArtist] = useState<any | null>(null)
  const [viewingAlbum, setViewingAlbum] = useState<any | null>(null)
  const [artistTracks, setArtistTracks] = useState<any[]>([])
  const [artistAlbums, setArtistAlbums] = useState<any[]>([])
  const [albumTracks, setAlbumTracks] = useState<any[]>([])
  const [artistTracksOffset, setArtistTracksOffset] = useState(0)
  const [albumTracksOffset, setAlbumTracksOffset] = useState(0)
  const [hasMoreArtistTracks, setHasMoreArtistTracks] = useState(false)
  const [hasMoreAlbumTracks, setHasMoreAlbumTracks] = useState(false)
  const [isLoadingArtistTracks, setIsLoadingArtistTracks] = useState(false)
  const [isLoadingAlbumTracks, setIsLoadingAlbumTracks] = useState(false)
  const artistTracksObserverRef = useRef<HTMLDivElement>(null)
  const albumTracksObserverRef = useRef<HTMLDivElement>(null)
  const isProcessingArtistTracksRef = useRef(false)
  const isProcessingAlbumTracksRef = useRef(false)

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'songs', label: 'Songs' },
    { id: 'artists', label: 'Artists' },
    { id: 'albums', label: 'Albums' }
  ]

  // Get the top result (first track)
  const topResult = results?.tracks?.[0]
  const tracks = results?.tracks || []
  const artists = results?.artists || []
  const albums = results?.albums || []

  // Load more tracks (infinite scroll)
  const loadMoreTracks = useCallback(async () => {
    if (!query || isLoadingMore || !hasMoreTracks) {
      return
    }
    
    setIsLoadingMore(true)
    try {
      const response = await searchApi.search(query, 'track', 5, tracksOffset) // Load exactly 5 tracks per page
      const newTracks = response.tracks || []
      if (newTracks.length === 0) {
        // Do not set hasMoreTracks to false on zero results (could be transient)
        // Optionally, add a retry counter here to prevent infinite attempts if desired
        // Optionally: set a retry count and after N tries setHasMoreTracks(false)
      } else {
        setInfiniteTracks(prev => {
          // Deduplicate tracks by ID to avoid duplicate keys
          const existingIds = new Set(prev.map(track => track.id))
          const uniqueNewTracks = newTracks.filter((track: any) => !existingIds.has(track.id))
          
          // 🔁 RETRY MECHANISM: Only stop after multiple consecutive failures
          if (uniqueNewTracks.length === 0) {
            setTracksRetryCount(prevCount => {
              const newCount = prevCount + 1
              
              if (newCount >= MAX_RETRY_ATTEMPTS) {
                setHasMoreTracks(false)
              }
              
              return newCount
            })
            return prev // Don't add anything
          } else {
            // ✅ SUCCESS: Reset retry counter
            setTracksRetryCount(0)
          }
          
          return [...prev, ...uniqueNewTracks]
        })
        
        // Only increment offset if we actually got new unique tracks
        if (newTracks.length > 0) {
          const existingIds = new Set(infiniteTracks.map(track => track.id))
          const uniqueCount = newTracks.filter((track: any) => !existingIds.has(track.id)).length
          if (uniqueCount > 0) {
            setTracksOffset(prev => prev + 5) // Increment by 5 tracks
          }
        }
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsLoadingMore(false)
    }
  }, [query, isLoadingMore, hasMoreTracks, tracksOffset])

  // Load more artists (infinite scroll)
  const loadMoreArtists = useCallback(async () => {
    if (!query || isLoadingMore || !hasMoreArtists) {
      return
    }
    
    setIsLoadingMore(true)
    try {
      const response = await searchApi.search(query, 'artist', 12, artistsOffset) // Load exactly 12 artists per batch
      const newArtists = response.artists || []
      if (newArtists.length === 0) {
        // Do not set hasMoreArtists to false on zero results (could be transient)
        // Optionally, add a retry counter here to prevent infinite attempts if desired
        // Optionally: set a retry count and after N tries setHasMoreArtists(false)
      } else {
        setInfiniteArtists(prev => {
          // Deduplicate artists by ID to avoid duplicate keys
          const existingIds = new Set(prev.map(artist => artist.id))
          const uniqueNewArtists = newArtists.filter((artist: any) => !existingIds.has(artist.id))
          
          return [...prev, ...uniqueNewArtists]
        })
        
        // Only increment offset if we actually got new unique artists
        if (newArtists.length > 0) {
          const existingIds = new Set(infiniteArtists.map(artist => artist.id))
          const uniqueCount = newArtists.filter((artist: any) => !existingIds.has(artist.id)).length
          if (uniqueCount > 0) {
            setArtistsOffset(prev => prev + 12) // Increment by 12 artists
          }
        }
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsLoadingMore(false)
    }
  }, [query, isLoadingMore, hasMoreArtists, artistsOffset])

  // Load more albums (infinite scroll)
  const loadMoreAlbums = useCallback(async () => {
    if (!query || isLoadingMore || !hasMoreAlbums) {
      return
    }
    
    setIsLoadingMore(true)
    try {
      const response = await searchApi.search(query, 'album', 12, albumsOffset) // Load exactly 12 albums per batch
      const newAlbums = response.albums || []
      if (newAlbums.length === 0) {
        // Do not set hasMoreAlbums to false on zero results (could be transient)
        // Optionally, add a retry counter here to prevent infinite attempts if desired
        // Optionally: set a retry count and after N tries setHasMoreAlbums(false)
      } else {
        setInfiniteAlbums(prev => {
          // Deduplicate albums by ID to avoid duplicate keys
          const existingIds = new Set(prev.map(album => album.id))
          const uniqueNewAlbums = newAlbums.filter((album: any) => !existingIds.has(album.id))
          
          return [...prev, ...uniqueNewAlbums]
        })
        
        // Only increment offset if we actually got new unique albums
        if (newAlbums.length > 0) {
          const existingIds = new Set(infiniteAlbums.map(album => album.id))
          const uniqueCount = newAlbums.filter((album: any) => !existingIds.has(album.id)).length
          if (uniqueCount > 0) {
            setAlbumsOffset(prev => prev + 12) // Increment by 12 albums
          }
        }
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsLoadingMore(false)
    }
  }, [query, isLoadingMore, hasMoreAlbums, albumsOffset])

  // 🎤 Handle artist click - NAVIGATE to standalone artist page
  const handleArtistClick = useCallback((artist: any) => {
    router.push(`/artist/${artist.id}`)
  }, [router])

  // 💿 Handle album click - NAVIGATE to standalone album page
  const handleAlbumClick = useCallback((album: any) => {
    router.push(`/album/${album.id}`)
  }, [router])

  // Load more artist tracks (infinite scroll)
  const loadMoreArtistTracks = useCallback(async () => {
    if (!viewingArtist || isLoadingMore || !hasMoreArtistTracks) return
    
    setIsLoadingMore(true)
    try {
      const response = await searchApi.getArtistTracks(viewingArtist.id, 10, artistTracksOffset)
      const newTracks = response.tracks || []
      
      if (newTracks.length > 0) {
        setArtistTracks(prev => [...prev, ...newTracks])
        setArtistTracksOffset(prev => prev + 10)
        setHasMoreArtistTracks(response.next || false)
      } else {
        setHasMoreArtistTracks(false)
      }
    } catch (error) {
      // Silent fail
    } finally{
      setIsLoadingMore(false)
    }
  }, [viewingArtist, isLoadingMore, hasMoreArtistTracks, artistTracksOffset])

  // Load more album tracks (infinite scroll)
  const loadMoreAlbumTracks = useCallback(async () => {
    if (!viewingAlbum || isLoadingMore || !hasMoreAlbumTracks) return
    
    setIsLoadingMore(true)
    try {
      const response = await searchApi.getAlbumTracks(viewingAlbum.id, 10, albumTracksOffset)
      const newTracks = response.tracks || []
      
      if (newTracks.length > 0) {
        setAlbumTracks(prev => [...prev, ...newTracks])
        setAlbumTracksOffset(prev => prev + 10)
        setHasMoreAlbumTracks(response.next || false)
      } else {
        setHasMoreAlbumTracks(false)
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsLoadingMore(false)
    }
  }, [viewingAlbum, isLoadingMore, hasMoreAlbumTracks, albumTracksOffset])

  // Initialize infinite scroll data when switching to infinite scroll tabs
  useEffect(() => {
    if (activeTab === 'songs' && infiniteTracks.length === 0 && tracks.length > 0) {
      setInfiniteTracks(tracks)
      setTracksOffset(tracks.length)
      setHasMoreTracks(true)
    } else if (activeTab === 'artists' && infiniteArtists.length === 0 && artists.length > 0) {
      // 📊 WORKFLOW: Start with artists from All tab, then fetch more with same query
      setInfiniteArtists(artists)
      setArtistsOffset(artists.length) // Continue from where All tab left off
      setHasMoreArtists(true)
      // If we have less than 24 artists, fetch more to fill the page
      if (artists.length < 24) {
        loadMoreArtists()
      }
    } else if (activeTab === 'albums' && infiniteAlbums.length === 0 && albums.length > 0) {
      // 📊 WORKFLOW: Start with albums from All tab, then fetch more with same query
      setInfiniteAlbums(albums)
      setAlbumsOffset(albums.length) // Continue from where All tab left off
      setHasMoreAlbums(true)
      // If we have less than 24 albums, fetch more to fill the page
      if (albums.length < 24) {
        loadMoreAlbums()
      }
    }
  }, [activeTab, tracks, artists, albums, loadMoreArtists, loadMoreAlbums, query])

  // Removed auto-fill logic - user wants exact page sizes only (5 tracks, 12 artists)

  // Intersection observer for infinite scroll (Songs)
  useEffect(() => {
    if (activeTab !== 'songs' || !songsObserverRef.current) {
      return
    }

    const element = songsObserverRef.current
    let debounceTimeout: NodeJS.Timeout | null = null
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isProcessingTracksRef.current && !isLoadingMore && hasMoreTracks) {
          
          // 🕰️ DEBOUNCE: Prevent rapid-fire calls
          if (debounceTimeout) clearTimeout(debounceTimeout)
          debounceTimeout = setTimeout(() => {
            if (!isProcessingTracksRef.current && !isLoadingMore && hasMoreTracks) {
              isProcessingTracksRef.current = true
              loadMoreTracks().finally(() => {
                isProcessingTracksRef.current = false
              })
            }
          }, 200) // 200ms debounce
        }
      },
      { threshold: 0.1, rootMargin: '50px' } // Trigger earlier with margin
    )

    observer.observe(element)

    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout)
      observer.disconnect()
    }
  }, [activeTab, loadMoreTracks])

  // Removed auto-fill logic - user wants exact page sizes only (5 tracks, 12 artists)

  // Infinite scroll observer for Artists tab
  useEffect(() => {
    if (activeTab !== 'artists' || !artistsObserverRef.current) {
      return
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isProcessingArtistsRef.current && !isLoadingMore && hasMoreArtists) {
          isProcessingArtistsRef.current = true
          loadMoreArtists().finally(() => {
            isProcessingArtistsRef.current = false
          })
        }
      },
      { threshold: 0.1, rootMargin: '50px' } // Trigger earlier with margin
    )

    observer.observe(artistsObserverRef.current)

    return () => {
      observer.disconnect()
    }
  }, [activeTab, loadMoreArtists])

  // Infinite scroll observer for Albums tab
  useEffect(() => {
    if (activeTab !== 'albums' || !albumsObserverRef.current) {
      return
    }
    
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isProcessingAlbumsRef.current && !isLoadingMore && hasMoreAlbums) {
          isProcessingAlbumsRef.current = true
          loadMoreAlbums().finally(() => {
            isProcessingAlbumsRef.current = false
          })
        }
      },
      { threshold: 0.1, rootMargin: '50px' } // Trigger earlier with margin
    )

    observer.observe(albumsObserverRef.current)

    return () => {
      observer.disconnect()
    }
  }, [activeTab, loadMoreAlbums])

  // Intersection observer for artist tracks infinite scroll
  useEffect(() => {
    if (!viewingArtist || !artistTracksObserverRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isProcessingArtistTracksRef.current && !isLoadingMore && hasMoreArtistTracks) {
          isProcessingArtistTracksRef.current = true
          loadMoreArtistTracks().finally(() => {
            isProcessingArtistTracksRef.current = false
          })
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    observer.observe(artistTracksObserverRef.current)
    return () => observer.disconnect()
  }, [viewingArtist, loadMoreArtistTracks, hasMoreArtistTracks, isLoadingMore])

  // Intersection observer for album tracks infinite scroll
  useEffect(() => {
    if (!viewingAlbum || !albumTracksObserverRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isProcessingAlbumTracksRef.current && !isLoadingMore && hasMoreAlbumTracks) {
          isProcessingAlbumTracksRef.current = true
          loadMoreAlbumTracks().finally(() => {
            isProcessingAlbumTracksRef.current = false
          })
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    observer.observe(albumTracksObserverRef.current)
    return () => observer.disconnect()
  }, [viewingAlbum, loadMoreAlbumTracks, hasMoreAlbumTracks, isLoadingMore])

  // Reset infinite scroll data when query changes
  useEffect(() => {
    setInfiniteTracks([])
    setInfiniteArtists([])
    setInfiniteAlbums([])
    setTracksOffset(0)
    setArtistsOffset(0)
    setAlbumsOffset(0)
    setHasMoreTracks(true)
    setHasMoreArtists(true)
    setHasMoreAlbums(true)
    // NOTE: Removed artist/album viewing state reset to keep views independent of search
    // 🔄 RESET RETRY COUNTERS
    setTracksRetryCount(0)
    setArtistsRetryCount(0)
    setAlbumsRetryCount(0)
    // 🔒 RESET PROCESSING FLAGS
    isProcessingTracksRef.current = false
    isProcessingArtistsRef.current = false
    isProcessingAlbumsRef.current = false
  }, [query])

  // Note: Artist and album views now use standalone pages at /artist/[id] and /album/[id]
  // No need for embedded views anymore

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      {onSearchQueryChange && (
        <div className="relative max-w-2xl">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for songs, artists, albums, playlists..."
            value={searchQuery || ""}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="pl-12 h-12 text-lg bg-card border-border/50 focus:bg-background"
          />
        </div>
      )}
      
      {/* Global Loading Bar at Top of Page */}
      {Object.keys(loadingTracks).length > 0 && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-white/10 overflow-hidden z-50">
          <div
            className="h-1 bg-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${Math.max(...Object.values(loadingTracks))}%` }}
          />
        </div>
      )}
      
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

      {/* Atomic Loader for All Tab */}


      {/* Main Content */}
      {activeTab === 'songs' ? (
        /* Songs Tab - Infinite Scroll Only */
        <div className="space-y-4" ref={songsContainerRef} style={{ minHeight: '60vh' }}>
          <h2 className="text-2xl font-bold">Songs</h2>
          <div className="space-y-2">
            {infiniteTracks.map((track: any, index: number) => (
              <ImageLoadedWrapper 
                key={track.id || index}
                imageUrl={getImageWithFallback(track, 'track')}
                className="flex items-center space-x-3 p-3 rounded-lg"
              >
                <div className="relative flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group">
                {/* Track Artwork */}
                <div className="relative flex-shrink-0">
                  <OptimizedImage 
                    src={getImageWithFallback(track, 'track')} 
                    alt={track.name}
                    className="w-12 h-12"
                    fallbackChar={<Music className="h-4 w-4" />}
                  />
                  {/* Full-card play overlay and progress bar */}
                  <div className="absolute inset-0 flex items-center justify-center z-10">
                    {/* Play button overlay covers the whole card on hover */}
                    <Button
                      size="icon"
                      className="w-full h-full rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-3xl focus:ring-0 focus:outline-none focus:bg-black/60 hover:bg-black/60"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayTrack(track);
                      }}
                      disabled={playingTrack === track.id || loadingTracks[track.id] !== undefined}
                      aria-label={currentTrack?.id === track.id && isPlaying ? "Pause" : "Play"}
                      tabIndex={0}
                    >
                      {currentTrack?.id === track.id && isPlaying ? (
                        <Pause className="h-8 w-8 fill-current" />
                      ) : (
                        <Play className="h-8 w-8 fill-current" />
                      )}
                    </Button>
                  </div>
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

                {/* Song Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <SongActions
                    track={{
                      id: track.id,
                      title: track.name,
                      artist: track.artists?.map((artist: any) => artist.name).join(', ') || '',
                      album: track.album?.name || '',
                      albumArt: getImageWithFallback(track, 'track'),
                      duration: track.duration_ms ? Math.floor(track.duration_ms / 1000) : 0,
                      url: track.external_urls?.spotify || '',
                      genre: '',
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
              </ImageLoadedWrapper>
            ))}
          </div>
          
          {/* Loading trigger for infinite scroll */}
          <div ref={songsObserverRef} className="h-20 flex items-center justify-center">
            {isLoadingMore && (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'artists' ? (
        /* Artists Grid - Infinite Scroll */
        <div className="space-y-4" ref={artistsContainerRef} style={{ minHeight: '60vh' }}>
          <h2 className="text-2xl font-bold">Artists</h2>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {infiniteArtists.map((artist: any, index: number) => (
              <ImageLoadedWrapper
                key={artist.id || index}
                imageUrl={getImageWithFallback(artist, 'artist')}
                className="flex flex-col items-center space-y-3 cursor-pointer group"
              >
                <div className="flex flex-col items-center space-y-3 cursor-pointer group" onClick={() => handleArtistClick(artist)}>
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-transparent group-hover:border-white/20 transition-colors rounded-full overflow-hidden">
                    <OptimizedImage 
                      src={getImageWithFallback(artist, 'artist')} 
                      alt={artist.name}
                      className="w-full h-full"
                      fallbackChar={<User className="h-8 w-8" />}
                      isArtist={true}
                    />
                  </div>
                  <Button
                    size="icon"
                    className="absolute bottom-2 right-2 rounded-full bg-green-500 hover:bg-green-600 text-black shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </Button>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white truncate max-w-[128px]">
                    {artist.name}
                  </p>
                  <p className="text-xs text-muted-foreground">Artist</p>
                </div>
                </div>
              </ImageLoadedWrapper>
            ))}
          </div>
          
          {/* Loading trigger for infinite scroll */}
          <div ref={artistsObserverRef} className="h-20 flex items-center justify-center">
            {isLoadingMore && (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            )}
          </div>
        </div>
      ) : activeTab === 'albums' ? (
        /* Albums Grid - Infinite Scroll */
        <div className="space-y-4" ref={albumsContainerRef} style={{ minHeight: '60vh' }}>
          <h2 className="text-2xl font-bold">Albums</h2>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
            {infiniteAlbums.map((album: any, index: number) => (
              <ImageLoadedWrapper
                key={album.id || index}
                imageUrl={getImageWithFallback(album, 'album')}
                className="flex flex-col items-center space-y-3 cursor-pointer group"
              >
                <div className="flex flex-col items-center space-y-3 cursor-pointer group">
                <div className="relative" onClick={() => handleAlbumClick(album)}>
                  <OptimizedImage 
                    src={getImageWithFallback(album, 'album')} 
                    alt={album.name}
                    className="w-32 h-32"
                    fallbackChar={<Album className="h-8 w-8" />}
                  />
                  <Button
                    size="icon"
                    className="absolute bottom-2 right-2 rounded-full bg-green-500 hover:bg-green-600 text-black shadow-lg opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0"
                  >
                    <Play className="h-4 w-4 fill-current" />
                  </Button>
                </div>
                <div className="text-center" onClick={() => handleAlbumClick(album)}>
                  <p className="text-sm font-medium text-white truncate max-w-[128px]">
                    {album.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {album.artists?.map((artist: any) => artist.name).join(', ') || 'Album'}
                  </p>
                </div>
                
                {/* Album Actions */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <AlbumActions
                    album={{
                      spotifyId: album.id,
                      name: album.name,
                      artist: album.artists?.map((artist: any) => artist.name).join(', ') || '',
                      albumArt: getImageWithFallback(album, 'album'),
                      totalTracks: album.total_tracks,
                      genre: album.genres?.[0],
                      releaseYear: album.release_date ? new Date(album.release_date).getFullYear() : undefined,
                      albumType: album.album_type
                    }}
                    size="sm"
                    variant="ghost"
                    showLabels={false}
                  />
                </div>
                </div>
              </ImageLoadedWrapper>
            ))}
          </div>
          
          {/* Loading trigger for infinite scroll */}
          <div ref={albumsObserverRef} className="h-20 flex items-center justify-center">
            {isLoadingMore && (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* All Tab - Default Layout */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Result Section (Left) */}
          {topResult && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Top result</h2>
              <div className="bg-card/50 hover:bg-card/80 transition-colors rounded-lg p-5 cursor-pointer group">
                <div className="space-y-4">
                  {/* Album Artwork */}
                  <div className="relative">
                    {/* Album Artwork (no overlay here) */}
<div className="relative">
  <OptimizedImage 
    src={getImageWithFallback(topResult, 'track')}
    alt={topResult.name}
    className="w-24 h-24 shadow-lg"
    fallbackChar={<Music className="h-8 w-8" />}
  />
</div>
{/* Info/content area overlay (covers only under-image area) */}
<div className="relative mt-4">
  {/* Overlay absolutely covers info/content only, does not affect layout */}
  <div className="absolute inset-0 rounded-lg bg-background/95 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
  {/* Play button at deep bottom right corner, absolutely positioned, does not affect layout */}
  <Button
    size="icon"
    className="absolute bottom-1 right-1 rounded-full bg-[#00BFFF] hover:bg-[#00BFFF]/90 shadow-lg opacity-0 group-hover:opacity-100 transition-all pointer-events-auto w-10 h-10 flex items-center justify-center"
    onClick={e => {
      e.stopPropagation();
      handlePlayTrack(topResult);
    }}
    disabled={playingTrack === topResult.id || loadingTracks[topResult.id] !== undefined}
    aria-label={currentTrack?.id === topResult.id && isPlaying ? "Pause" : "Play"}
    tabIndex={0}
    style={{ boxShadow: '0 4px 16px 0 rgba(0,0,0,0.10)' }}
  >
    {/* Custom filled triangle for play */}
    {currentTrack?.id === topResult.id && isPlaying ? (
      <Pause className="h-6 w-6" style={{ color: '#333333' }} />
    ) : (
      <svg viewBox="0 0 24 24" fill="#333333" width="24" height="24" className="h-6 w-6">
        <polygon points="5,3 19,12 5,21" />
      </svg>
    )}
  </Button>
  {/* Info area content (text, etc.) remains above overlay */}
</div>
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
                    className="relative flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
                  >
                    {/* Track Artwork */}
                    <div className="relative flex-shrink-0">
                      <OptimizedImage 
                        src={getImageWithFallback(track, 'track')} 
                        alt={track.name}
                        className="w-12 h-12"
                        fallbackChar={<Music className="h-4 w-4" />}
                      />
                      {/* Full-card play overlay and progress bar */}
                      <div className="absolute inset-0 flex items-center justify-center z-10">
                        <Button
                          size="icon"
                          className="w-full h-full rounded-lg bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center focus:ring-0 focus:outline-none focus:bg-black/60 hover:bg-black/60"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePlayTrack(track);
                          }}
                          disabled={playingTrack === track.id || loadingTracks[track.id] !== undefined}
                          aria-label={currentTrack?.id === track.id && isPlaying ? "Pause" : "Play"}
                          tabIndex={0}
                        >
                          {currentTrack?.id === track.id && isPlaying ? (
                            <Pause className="h-4 w-4 fill-current" />
                          ) : (
                            <Play className="h-4 w-4 fill-current" />
                          )}
                        </Button>
                        
                      </div>
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

                    {/* Song Actions */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <SongActions
                        track={{
                          id: track.id,
                          title: track.name,
                          artist: track.artists?.map((artist: any) => artist.name).join(', ') || '',
                          album: track.album?.name || '',
                          albumArt: getImageWithFallback(track, 'track'),
                          duration: track.duration_ms ? Math.floor(track.duration_ms / 1000) : 0,
                          url: '',
                          genre: '',
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
            </div>
          )}
        </div>
      )}

      {/* Artists Section (for All tab, atomic loaded) */}
      {activeTab === 'all' && atomicLoaded && atomicResults?.artists?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Artists</h2>
          <div className="flex space-x-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {artists.slice(0, 9).map((artist: any, index: number) => (
              <div
                key={artist.id || index}
                className="flex-shrink-0 cursor-pointer group"
              >
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-transparent group-hover:border-white/20 transition-colors rounded-full overflow-hidden">
                    <OptimizedImage 
                      src={getImageWithFallback(artist, 'artist')} 
                      alt={artist.name}
                      className="w-full h-full"
                      fallbackChar={<User className="h-8 w-8" />}
                      isArtist={true}
                    />
                  </div>
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

      {/* Albums Section (for All tab, atomic loaded) */}
      {activeTab === 'all' && atomicLoaded && atomicImagesLoaded && atomicResults?.albums?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Albums</h2>
          <div className="flex space-x-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {albums.slice(0, 8).map((album: any, index: number) => (
              <div
                key={album.id || index}
                className="flex-shrink-0 cursor-pointer group w-40"
              >
                <div className="relative">
                  <OptimizedImage 
                    src={getImageWithFallback(album, 'album')} 
                    alt={album.name}
                    className="w-full h-32 mb-3"
                    fallbackChar={<Album className="h-8 w-8" />}
                  />
                  <Button
                    size="icon"
                    className="absolute bottom-1 right-1 rounded-full bg-green-500 hover:bg-green-600 text-black shadow-lg opacity-0 group-hover:opacity-100 transition-all w-8 h-8"
                  >
                    <Play className="h-3 w-3 fill-current" />
                  </Button>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white truncate">
                    {album.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {album.artists?.map((artist: any) => artist.name).join(', ') || 'Album'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
