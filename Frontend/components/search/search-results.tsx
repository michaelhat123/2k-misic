"use client"


import { useDebouncedCallback } from 'use-debounce';
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Music, User, Album } from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { searchApi } from "@/lib/api/search"
import { getTrackStream } from "@/lib/api/youtube-music"
import { usePlayer } from "@/components/player/player-provider"

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

export function SearchResults({ results, query }: SearchResultsProps) {
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
          duration: Math.floor((track.duration_ms || 0) / 1000),
          url: streamData.streamUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Update player bar with new track data FIRST
        await playTrack(playerTrack);
        console.log('🎵 Player bar updated:', playerTrack.title, 'by', playerTrack.artist);
        
        // Wait 200ms BEFORE audio starts playing
        await new Promise(resolve => setTimeout(resolve, 200));
        console.log('🎧 Audio starting...');
        
        // Clear loading state after playback starts
        setTimeout(() => {
          setLoadingTracks(prev => {
            const newState = { ...prev };
            delete newState[track.id];
            return newState;
          });
        }, 500);
      } else {
        console.error('❌ Failed to get YouTube Music stream for:', track.name);
        alert('Sorry, this track is not available for playback.');
        setLoadingTracks(prev => {
          const newState = { ...prev };
          delete newState[track.id];
          return newState;
        });
      }
    } catch (error) {
      console.error('❌ Error playing track:', error);
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

    // Fetch all sections in parallel
    (async () => {
      try {
        const [tracksRes, artistsRes, albumsRes] = await Promise.all([
          searchApi.search(debouncedQuery, 'track', 5, 0, controller.signal),
          searchApi.search(debouncedQuery, 'artist', 12, 0, controller.signal),
          searchApi.search(debouncedQuery, 'album', 12, 0, controller.signal)
        ]);
        if (controller.signal.aborted || lastQueryRef.current !== debouncedQuery) return;
        const atomic = {
          tracks: tracksRes.tracks || [],
          artists: artistsRes.artists || [],
          albums: albumsRes.albums || []
        };
        searchResultCache.set(debouncedQuery, atomic);
        setAtomicResults(atomic);
        setAtomicLoaded(true);
        // Preload all images for atomic
        await preloadAllImagesAtomic(atomic);
        setAtomicImagesLoaded(true);
      } catch (e) {
        if (controller.signal.aborted) return;
        setAtomicResults(null);
        setAtomicLoaded(false);
        setAtomicImagesLoaded(false);
      } finally {
        setAtomicLoading(false);
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
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [hasMoreTracks, setHasMoreTracks] = useState(true)
  const [hasMoreArtists, setHasMoreArtists] = useState(true)
  const [hasMoreAlbums, setHasMoreAlbums] = useState(true)
  const songsObserverRef = useRef<HTMLDivElement>(null)
  const artistsObserverRef = useRef<HTMLDivElement>(null)
  const albumsObserverRef = useRef<HTMLDivElement>(null)

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
    console.log('🔄 loadMoreTracks called - query:', query, 'isLoadingMore:', isLoadingMore, 'hasMoreTracks:', hasMoreTracks, 'tracksOffset:', tracksOffset)
    if (!query || isLoadingMore || !hasMoreTracks) {
      console.log('❌ loadMoreTracks aborted - conditions not met')
      return
    }
    
    setIsLoadingMore(true)
    try {
      console.log('🔍 Fetching more tracks with offset:', tracksOffset)
      const response = await searchApi.search(query, 'track', 5, tracksOffset) // Load exactly 5 tracks per page
      const newTracks = response.tracks || []
      console.log('📦 Received', newTracks.length, 'new tracks')
      if (newTracks.length === 0) {
        // Do not set hasMoreTracks to false on zero results (could be transient)
        // Optionally, add a retry counter here to prevent infinite attempts if desired
        console.log('⚠️ Zero new tracks returned - will allow retry on next scroll')
        // Optionally: set a retry count and after N tries setHasMoreTracks(false)
      } else {
        setInfiniteTracks(prev => {
          console.log('📝 Adding', newTracks.length, 'tracks to existing', prev.length, 'tracks')
          // Deduplicate tracks by ID to avoid duplicate keys
          const existingIds = new Set(prev.map(track => track.id))
          const uniqueNewTracks = newTracks.filter((track: any) => !existingIds.has(track.id))
          console.log('✅ After deduplication:', uniqueNewTracks.length, 'unique new tracks')
          return [...prev, ...uniqueNewTracks]
        })
        setTracksOffset(prev => prev + 5) // Increment by 5 tracks
      }
    } catch (error) {
      console.error('❌ Error loading more tracks:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [query, isLoadingMore, hasMoreTracks, tracksOffset])

  // Load more artists (infinite scroll)
  const loadMoreArtists = useCallback(async () => {
    console.log('🔄 loadMoreArtists called - query:', query, 'isLoadingMore:', isLoadingMore, 'hasMoreArtists:', hasMoreArtists, 'artistsOffset:', artistsOffset)
    if (!query || isLoadingMore || !hasMoreArtists) {
      console.log('❌ loadMoreArtists aborted - conditions not met')
      return
    }
    
    setIsLoadingMore(true)
    try {
      console.log('🔍 Fetching more artists with offset:', artistsOffset)
      const response = await searchApi.search(query, 'artist', 12, artistsOffset) // Load exactly 12 artists per page (2 rows of 6)
      const newArtists = response.artists || []
      console.log('📦 Received', newArtists.length, 'new artists')
      if (newArtists.length === 0) {
        // Do not set hasMoreArtists to false on zero results (could be transient)
        // Optionally, add a retry counter here to prevent infinite attempts if desired
        console.log('⚠️ Zero new artists returned - will allow retry on next scroll')
        // Optionally: set a retry count and after N tries setHasMoreArtists(false)
      } else {
        setInfiniteArtists(prev => {
          console.log('📝 Adding', newArtists.length, 'artists to existing', prev.length, 'artists')
          // Deduplicate artists by ID to avoid duplicate keys
          const existingIds = new Set(prev.map(artist => artist.id))
          const uniqueNewArtists = newArtists.filter((artist: any) => !existingIds.has(artist.id))

          return [...prev, ...uniqueNewArtists]
        })
        setArtistsOffset(prev => prev + 12) // Increment by 12 artists
      }
    } catch (error) {
      console.error('❌ Error loading more artists:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [query, isLoadingMore, hasMoreArtists, artistsOffset])

  // Load more albums (infinite scroll)
  const loadMoreAlbums = useCallback(async () => {
    console.log('🔄 loadMoreAlbums called - query:', query, 'isLoadingMore:', isLoadingMore, 'hasMoreAlbums:', hasMoreAlbums, 'albumsOffset:', albumsOffset)
    if (!query || isLoadingMore || !hasMoreAlbums) {
      console.log('❌ loadMoreAlbums aborted - conditions not met')
      return
    }
    
    setIsLoadingMore(true)
    try {
      console.log('🔍 Fetching more albums with offset:', albumsOffset)
      const response = await searchApi.search(query, 'album', 12, albumsOffset) // Load exactly 12 albums per page (2 rows of 6)
      const newAlbums = response.albums || []
      console.log('📦 Received', newAlbums.length, 'new albums')
      if (newAlbums.length === 0) {
        // Do not set hasMoreAlbums to false on zero results (could be transient)
        // Optionally, add a retry counter here to prevent infinite attempts if desired
        console.log('⚠️ Zero new albums returned - will allow retry on next scroll')
        // Optionally: set a retry count and after N tries setHasMoreAlbums(false)
      } else {
        setInfiniteAlbums(prev => {
          console.log('📝 Adding', newAlbums.length, 'albums to existing', prev.length, 'albums')
          // Deduplicate albums by ID to avoid duplicate keys
          const existingIds = new Set(prev.map(album => album.id))
          const uniqueNewAlbums = newAlbums.filter((album: any) => !existingIds.has(album.id))
          console.log('✅ After deduplication:', uniqueNewAlbums.length, 'unique new albums')
          return [...prev, ...uniqueNewAlbums]
        })
        setAlbumsOffset(prev => prev + 12) // Increment by 12 albums
      }
    } catch (error) {
      console.error('❌ Error loading more albums:', error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [query, isLoadingMore, hasMoreAlbums, albumsOffset])

  // Initialize infinite scroll data when switching to infinite scroll tabs
  useEffect(() => {
    if (activeTab === 'songs' && infiniteTracks.length === 0 && tracks.length > 0) {
      console.log('🎵 Initializing Songs infinite scroll with', tracks.length, 'tracks')
      setInfiniteTracks(tracks)
      setTracksOffset(tracks.length)
      setHasMoreTracks(true)
    } else if (activeTab === 'artists' && infiniteArtists.length === 0 && artists.length > 0) {
      console.log('🎤 Initializing Artists infinite scroll with', artists.length, 'artists')
      setInfiniteArtists(artists)
      setArtistsOffset(artists.length)
      setHasMoreArtists(true)
    } else if (activeTab === 'albums' && infiniteAlbums.length === 0 && albums.length > 0) {
      console.log('💿 Initializing Albums infinite scroll with', albums.length, 'albums')
      setInfiniteAlbums(albums)
      setAlbumsOffset(albums.length)
      setHasMoreAlbums(true)
    }
  }, [activeTab, tracks, artists, albums])

  // Removed auto-fill logic - user wants exact page sizes only (5 tracks, 12 artists)

  // Infinite scroll observer for Songs tab
  useEffect(() => {
    if (activeTab !== 'songs' || !songsObserverRef.current) {
      console.log('⚠️ Songs observer not set up - activeTab:', activeTab, 'observerRef:', !!songsObserverRef.current)
      return
    }

    console.log('🔄 Setting up Songs intersection observer')
    const observer = new IntersectionObserver(
      (entries) => {
        console.log('👀 Songs intersection observer triggered - isIntersecting:', entries[0].isIntersecting)
        if (entries[0].isIntersecting) {
          console.log('✅ Songs observer intersecting - calling loadMoreTracks')
          loadMoreTracks()
        }
      },
      { threshold: 0.1 } // Trigger when user scrolls to 100% bottom
    )

    observer.observe(songsObserverRef.current)
    console.log('📍 Songs observer attached to element')

    return () => {
      console.log('🗑️ Songs observer cleanup')
      observer.disconnect()
    }
  }, [activeTab, loadMoreTracks])

  // Removed auto-fill logic - user wants exact page sizes only (5 tracks, 12 artists)

  // Infinite scroll observer for Artists tab
  useEffect(() => {
    if (activeTab !== 'artists' || !artistsObserverRef.current) {
      console.log('⚠️ Artists observer not set up - activeTab:', activeTab, 'observerRef:', !!artistsObserverRef.current)
      return
    }

    console.log('🔄 Setting up Artists intersection observer')
    const observer = new IntersectionObserver(
      (entries) => {
        console.log('👀 Artists intersection observer triggered - isIntersecting:', entries[0].isIntersecting)
        if (entries[0].isIntersecting) {
          console.log('✅ Artists observer intersecting - calling loadMoreArtists')
          loadMoreArtists()
        }
      },
      { threshold: 0.1 } // Trigger when user scrolls to 100% bottom
    )

    observer.observe(artistsObserverRef.current)
    console.log('📍 Artists observer attached to element')

    return () => {
      console.log('🗑️ Artists observer cleanup')
      observer.disconnect()
    }
  }, [activeTab, loadMoreArtists])

  // Infinite scroll observer for Albums tab
  useEffect(() => {
    if (activeTab !== 'albums' || !albumsObserverRef.current) {
      console.log('⚠️ Albums observer not set up - activeTab:', activeTab, 'observerRef:', !!albumsObserverRef.current)
      return
    }

    console.log('🔄 Setting up Albums intersection observer')
    const observer = new IntersectionObserver(
      (entries) => {
        console.log('👀 Albums intersection observer triggered - isIntersecting:', entries[0].isIntersecting)
        if (entries[0].isIntersecting) {
          console.log('✅ Albums observer intersecting - calling loadMoreAlbums')
          loadMoreAlbums()
        }
      },
      { threshold: 0.1 } // Trigger when user scrolls to 100% bottom
    )

    observer.observe(albumsObserverRef.current)
    console.log('📍 Albums observer attached to element')

    return () => {
      console.log('🗑️ Albums observer cleanup')
      observer.disconnect()
    }
  }, [activeTab, loadMoreAlbums])

  // Reset infinite scroll when query changes
  useEffect(() => {
    if (query) {
      setInfiniteTracks([])
      setInfiniteArtists([])
      setInfiniteAlbums([])
      setTracksOffset(0)
      setArtistsOffset(0)
      setAlbumsOffset(0)
      setHasMoreTracks(true)
      setHasMoreArtists(true)
      setHasMoreAlbums(true)
      setIsLoadingMore(false)
    }
  }, [query])

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
                
                {/* Loading bar at bottom of entire song card */}
                {loadingTracks[track.id] !== undefined && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden rounded-b-lg">
                    <div
                      className="h-0.5 bg-blue-500 transition-all duration-500 ease-out"
                      style={{ width: `${loadingTracks[track.id] || 0}%` }}
                    />
                  </div>
                )}
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
        /* Artists Tab - Infinite Scroll */
        <div className="space-y-4" ref={artistsContainerRef} style={{ minHeight: '60vh' }}>
          <h2 className="text-2xl font-bold">Artists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {infiniteArtists.map((artist: any, index: number) => (
              <ImageLoadedWrapper
                key={artist.id || index}
                imageUrl={getImageWithFallback(artist, 'artist')}
                className="flex flex-col items-center space-y-3 cursor-pointer group"
              >
                <div className="flex flex-col items-center space-y-3 cursor-pointer group">
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
        /* Albums Tab - Infinite Scroll */
        <div className="space-y-4" ref={albumsContainerRef} style={{ minHeight: '60vh' }}>
          <h2 className="text-2xl font-bold">Albums</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {infiniteAlbums.map((album: any, index: number) => (
              <ImageLoadedWrapper
                key={album.id || index}
                imageUrl={getImageWithFallback(album, 'album')}
                className="flex flex-col items-center space-y-3 cursor-pointer group"
              >
                <div className="flex flex-col items-center space-y-3 cursor-pointer group">
                <div className="relative">
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
                <div className="text-center">
                  <p className="text-sm font-medium text-white truncate max-w-[128px]">
                    {album.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {album.artists?.map((artist: any) => artist.name).join(', ') || 'Album'}
                  </p>
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
  {/* Loading bar at bottom of entire card */}
  {loadingTracks[topResult.id] !== undefined && (
    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden rounded-b-lg">
      <div
        className="h-0.5 bg-blue-500 transition-all duration-500 ease-out"
        style={{ width: `${loadingTracks[topResult.id] || 0}%` }}
      />
    </div>
  )}
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
                    
                    {/* Loading bar at bottom of entire song card */}
                    {loadingTracks[track.id] !== undefined && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10 overflow-hidden rounded-b-lg">
                        <div
                          className="h-0.5 bg-blue-500 transition-all duration-500 ease-out"
                          style={{ width: `${loadingTracks[track.id] || 0}%` }}
                        />
                      </div>
                    )}

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
      )}

      {/* Artists Section (for All tab, atomic loaded) */}
      {activeTab === 'all' && atomicLoaded && atomicImagesLoaded && atomicResults?.artists?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Artists</h2>
          <div className="flex space-x-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {artists.slice(0, 8).map((artist: any, index: number) => (
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
