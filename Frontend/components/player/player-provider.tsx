"use client"

import type React from "react"

import { createContext, useContext, useEffect, useReducer, useRef, useState, useCallback } from "react"
import type { Track } from "@/types/track"
import { playerApi } from "@/lib/api/player"
import HiddenYouTubePlayer from "./hidden-youtube-player"
import { nativeEqualizer } from "@/lib/audio/native-equalizer"

interface PlayerState {
  currentTrack: Track | null
  isPlaying: boolean
  volume: number
  currentTime: number
  duration: number
  queue: Track[]
  shuffle: boolean
  repeat: "none" | "one" | "all"
  loading: boolean
  artistImagesLoading: boolean
}

type PlayerAction =
  | { type: "SET_TRACK"; payload: Track | null }
  | { type: "TOGGLE_PLAY" }
  | { type: "SET_PLAYING"; payload: boolean }
  | { type: "SET_VOLUME"; payload: number }
  | { type: "SET_TIME"; payload: number }
  | { type: "SET_DURATION"; payload: number }
  | { type: "SET_QUEUE"; payload: Track[] }
  | { type: "TOGGLE_SHUFFLE" }
  | { type: "TOGGLE_REPEAT" }
  | { type: "SET_REPEAT"; payload: "none" | "one" | "all" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ARTIST_IMAGES_LOADING"; payload: boolean }

const initialState: PlayerState = {
  currentTrack: null,
  isPlaying: false,
  volume: 0.8,
  currentTime: 0,
  duration: 0,
  queue: [],
  shuffle: false,
  repeat: "none",
  loading: false,
  artistImagesLoading: false,
}

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case "SET_TRACK":
      return { ...state, currentTrack: action.payload }
    case "TOGGLE_PLAY":
      return { ...state, isPlaying: !state.isPlaying }
    case "SET_PLAYING":
      return { ...state, isPlaying: action.payload }
    case "SET_VOLUME":
      return { ...state, volume: action.payload }
    case "SET_TIME":
      return { ...state, currentTime: action.payload }
    case "SET_DURATION":
      return { ...state, duration: action.payload }
    case "SET_QUEUE":
      return { ...state, queue: action.payload }
    case "TOGGLE_SHUFFLE":
      return { ...state, shuffle: !state.shuffle }
    case "TOGGLE_REPEAT":
      const newRepeat = state.repeat === "none" ? "all" : state.repeat === "all" ? "one" : "none"
      
      // Save to sessionStorage to survive re-mounts
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem('player_repeat_state', newRepeat)
        } catch (e) {
          // Silent fail
        }
      }
      
      return {
        ...state,
        repeat: newRepeat,
      }
    case "SET_REPEAT":
      return { ...state, repeat: action.payload }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_ARTIST_IMAGES_LOADING":
      return { ...state, artistImagesLoading: action.payload }
    default:
      return state
  }
}

interface PlayerContextType extends PlayerState {
  playTrack: (track: Track) => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  seekTo: (time: number) => void
  nextTrack: () => void
  previousTrack: () => void
  addToQueue: (track: Track) => void
  setQueue: (tracks: Track[]) => void
  clearQueue: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  refreshArtistImages: () => void
  playbackError: string | null
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState)

  // 🚀 YOUTUBE VIDEO CACHE - Save quota by caching video IDs
  const videoCache = useRef<Map<string, string>>(new Map())
  
  // 🎨 ARTIST IMAGES CACHE - Cache artist images for instant loading
  const artistImagesCache = useRef<Map<string, string[]>>(new Map())
  const ongoingImageRequests = useRef<Map<string, Promise<string[]>>>(new Map())
  
  // Get cache key for a track
  const getCacheKey = (track: Track) => `${track.title}-${track.artist}`.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  // Get cached video ID
  const getCachedVideoId = (track: Track): string | null => {
    const key = getCacheKey(track)
    const cached = videoCache.current.get(key)
    if (cached) {
      return cached
    }
    return null
  }
  
  // Cache video ID
  const cacheVideoId = (track: Track, videoId: string) => {
    const key = getCacheKey(track)
    videoCache.current.set(key, videoId)
    
    // Also store in localStorage for persistence across sessions
    try {
      const persistentCache = JSON.parse(localStorage.getItem('youtube-video-cache') || '{}')
      persistentCache[key] = {
        videoId,
        timestamp: Date.now(),
        track: { title: track.title, artist: track.artist }
      }
      // Keep only last 100 entries
      const entries = Object.entries(persistentCache)
      if (entries.length > 100) {
        const sorted = entries.sort((a: any, b: any) => b[1].timestamp - a[1].timestamp)
        const trimmed = Object.fromEntries(sorted.slice(0, 100))
        localStorage.setItem('youtube-video-cache', JSON.stringify(trimmed))
      } else {
        localStorage.setItem('youtube-video-cache', JSON.stringify(persistentCache))
      }
    } catch (error) {
      // Silent fail
    }
  }
  
  // 🎨 ARTIST IMAGES CACHE FUNCTIONS
  const getCachedArtistImages = (artistName: string): string[] | null => {
    const cached = artistImagesCache.current.get(artistName.toLowerCase())
    if (cached) {
      return cached
    }
    return null
  }
  
  const cacheArtistImages = (artistName: string, images: string[]) => {
    artistImagesCache.current.set(artistName.toLowerCase(), images)
    
    // Persist to localStorage
    try {
      const persistentCache = JSON.parse(localStorage.getItem('artist-images-cache') || '{}')
      persistentCache[artistName.toLowerCase()] = {
        images,
        timestamp: Date.now()
      }
      // Keep only last 50 artists
      const entries = Object.entries(persistentCache)
      if (entries.length > 50) {
        const sorted = entries.sort((a: any, b: any) => b[1].timestamp - a[1].timestamp)
        const trimmed = Object.fromEntries(sorted.slice(0, 50))
        localStorage.setItem('artist-images-cache', JSON.stringify(trimmed))
      } else {
        localStorage.setItem('artist-images-cache', JSON.stringify(persistentCache))
      }
    } catch (error) {
      // Silent fail
    }
  }
  
  // 🛡️ IMAGE URL VALIDATION - Check if image URL is accessible
  const validateImageUrl = async (url: string): Promise<boolean> => {
    try {
      // Basic URL format validation
      if (!url || typeof url !== 'string') return false
      if (!url.startsWith('http://') && !url.startsWith('https://')) return false
      
      // Check for common invalid patterns
      const invalidPatterns = [
        'placeholder',
        'default',
        'missing',
        'not-found',
        '404',
        'error'
      ]
      
      const lowerUrl = url.toLowerCase()
      if (invalidPatterns.some(pattern => lowerUrl.includes(pattern))) {
        return false
      }
      
      // Quick HEAD request to check if image exists
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
      
      const response = await fetch(url, { 
        method: 'HEAD',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      const contentType = response.headers.get('content-type')
      return response.ok && (contentType?.startsWith('image/') || false)
      
    } catch (error) {
      return false
    }
  }

  const fetchArtistImagesOptimized = async (artistName: string, spotifyArtistId?: string, forceRefresh: boolean = false): Promise<string[]> => {
    // Extract primary artist in case full artist string with collaborators is passed
    const primaryArtist = artistName.split(/[&,]|\s+feat\.?\s+|\s+ft\.?\s+/i)[0].trim()
    
    // SPOTIFY-ONLY ARTISTS - Skip Last.fm for these artists AND force fresh fetch
    const spotifyOnlyArtists = [
      'kenny k shot',
      'bulldogg',
      'bulldog'
    ]
    
    // Normalize artist name (remove hyphens, underscores, extra spaces)
    const normalizedArtistName = primaryArtist.toLowerCase().trim().replace(/[-_\s]+/g, ' ')
    const useSpotifyOnly = spotifyOnlyArtists.some(artist => 
      normalizedArtistName.includes(artist.toLowerCase().trim().replace(/[-_\s]+/g, ' '))
    )
    
    // Force refresh or Spotify-only artists bypass cache
    if (useSpotifyOnly || forceRefresh) {
      // Clear any existing cache for this artist
      artistImagesCache.current.delete(primaryArtist.toLowerCase())
      
      try {
        const persistentCache = JSON.parse(localStorage.getItem('artist-images-cache') || '{}')
        delete persistentCache[primaryArtist.toLowerCase()]
        localStorage.setItem('artist-images-cache', JSON.stringify(persistentCache))
      } catch (error) {
        // Silent fail
      }
    } else {
      // Check cache first (only for non-forced artists)
      const cached = getCachedArtistImages(primaryArtist)
      if (cached) {
        return cached
      }
    }
    
    // Check if request is already ongoing
    if (ongoingImageRequests.current.has(primaryArtist.toLowerCase())) {
      return ongoingImageRequests.current.get(primaryArtist.toLowerCase())!
    }
    
    // Create request - Last.fm first (unless Spotify-only), then Spotify as fallback
    const requestPromise = (async () => {
      let allImages: string[] = []
      
      try {
        // 1. Try Last.fm images first (unless artist is in Spotify-only list)
        if (!useSpotifyOnly) {
          const lastfmResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/artist-images/${encodeURIComponent(primaryArtist)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        })
        
        if (lastfmResponse.ok) {
          const lastfmData = await lastfmResponse.json()
          // Backend returns {images: Array} not a direct array
          const lastfmImages = lastfmData.images || lastfmData
          
          if (lastfmImages && Array.isArray(lastfmImages) && lastfmImages.length > 0) {
            // Extract just the URLs from the image objects
            const imageUrls = lastfmImages.map(img => typeof img === 'string' ? img : img.url).filter(Boolean)
            allImages.push(...imageUrls)
          }
        }
        }
        
        // 2. Use Spotify ONLY if no Last.fm images OR if artist is Spotify-only
        if (allImages.length === 0 || useSpotifyOnly) {

          let actualSpotifyArtistId = spotifyArtistId
          
          // If no Spotify ID provided, search for the artist
          if (!actualSpotifyArtistId) {
            const artistInfoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spotify/artist-info/${encodeURIComponent(primaryArtist)}`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              },
            })
            
            if (artistInfoResponse.ok) {
              const artistInfo = await artistInfoResponse.json()
              if (artistInfo && artistInfo.id) {
                actualSpotifyArtistId = artistInfo.id
                
                // Use only the highest quality image from the search result
                if (artistInfo.images && artistInfo.images.length > 0) {
                  // Spotify images are ordered by size (largest first), so take the first one
                  const highestQualityImage = artistInfo.images[0].url
                  allImages.push(highestQualityImage)
                }
              }
            }
          } else {
            // Use the provided Spotify ID to get images
            const spotifyResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spotify/artist/${actualSpotifyArtistId}/images`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
              },
            })
            
            if (spotifyResponse.ok) {
              const spotifyImages = await spotifyResponse.json()
              if (spotifyImages && spotifyImages.length > 0) {
                // Only use the highest quality image (first one)
                allImages.push(spotifyImages[0])
              }
            }
          }
        }
        
        // Cache the results
        if (allImages.length > 0) {
          cacheArtistImages(primaryArtist, allImages)
        }
        
        return allImages
        
      } catch (error) {
        return allImages // Return whatever we got so far
      }
    })().finally(() => {
      // Clean up ongoing request
      ongoingImageRequests.current.delete(primaryArtist.toLowerCase())
    })
    
    // Store ongoing request
    ongoingImageRequests.current.set(primaryArtist.toLowerCase(), requestPromise)
    
    return requestPromise
  }
  
  // Load persistent cache on mount
  useEffect(() => {
    try {
      // Load video cache
      const persistentCache = JSON.parse(localStorage.getItem('youtube-video-cache') || '{}')
      Object.entries(persistentCache).forEach(([key, data]: [string, any]) => {
        if (data.videoId && data.timestamp > Date.now() - 7 * 24 * 60 * 60 * 1000) { // 7 days
          videoCache.current.set(key, data.videoId)
        }
      })
      
      // Load artist images cache
      const artistImagesCache_persistent = JSON.parse(localStorage.getItem('artist-images-cache') || '{}')
      Object.entries(artistImagesCache_persistent).forEach(([artist, data]: [string, any]) => {
        if (data.images && data.timestamp > Date.now() - 3 * 24 * 60 * 60 * 1000) { // 3 days
          artistImagesCache.current.set(artist, data.images)
        }
      })
    } catch (error) {
      // Silent fail
    }
  }, [])

  // Restore repeat state from sessionStorage on every mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('player_repeat_state')
        if (saved && ['none', 'one', 'all'].includes(saved) && saved !== state.repeat) {
          dispatch({ type: "SET_REPEAT", payload: saved as "none" | "one" | "all" })
        }
      } catch (e) {
        // Silent fail
      }
    }
  }, []) // Run only on mount

  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  // Initialize HTML5 audio element for local file playback
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.preload = 'metadata'
      
      // Add event listeners for local file playback
      audioRef.current.addEventListener('loadedmetadata', () => {
        // Metadata loaded
      })
      
      audioRef.current.addEventListener('ended', () => {
        // Check repeat state directly
        if (state.repeat === "one") {
          if (audioRef.current) {
            audioRef.current.currentTime = 0
            audioRef.current.play().catch(() => {})
          }
        } else {
          // Trigger next track using ref to get latest function
          if (nextTrackRef.current) {
            nextTrackRef.current()
          }
        }
      })
      
      audioRef.current.addEventListener('error', () => {
        dispatch({ type: "SET_PLAYING", payload: false })
      })
      
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          dispatch({ type: "SET_TIME", payload: audioRef.current.currentTime })
        }
      })
      
      return () => {
        if (audioRef.current) {
          audioRef.current.pause()
          audioRef.current.src = ''
        }
      }
    }
  }, [])
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null)
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null)
  const [reloadTrigger, setReloadTrigger] = useState<number>(0) // 🚀 Force reload for same video ID
  const [autoAdvanceTrigger, setAutoAdvanceTrigger] = useState<number>(0) // 🚀 NEW: Trigger auto-advance
  const [playbackError, setPlaybackError] = useState<string | null>(null) // Friendly playback error message
  const endTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const nextTrackRef = useRef<(() => void) | null>(null) // Store latest nextTrack function

  // Track ongoing requests to prevent duplicates
  const ongoingRequests = useRef<Map<string, Promise<any>>>(new Map())
  
  const playTrack = async (track: Track, useCache: boolean = true) => {
    if (!track || !track.id || !track.title) {
      return
    }
    
    setPlaybackError(null) // Clear any previous errors
    dispatch({ type: "SET_LOADING", payload: true })
    let videoId: string | null = null // Declare at function scope
    
    // Check if this is a local file - skip YouTube API entirely
    const isLocal = track.id.startsWith('local-') || track.id.startsWith('watched-')
    
    // 🛡️ ROBUST AUDIO CLEANUP - Prevent conflicts between local and streaming
    const cleanupAudio = async () => {
      if (audioRef.current) {
        try {
          // Stop any ongoing playback gracefully
          if (!audioRef.current.paused) {
            audioRef.current.pause()
          }
          
          // Reset position
          audioRef.current.currentTime = 0
          
          // Remove event listeners to prevent memory leaks
          const oldTimeHandler = (audioRef.current as any)._timeUpdateHandler
          const oldMetadataHandler = (audioRef.current as any)._metadataHandler
          
          if (oldTimeHandler) {
            audioRef.current.removeEventListener('timeupdate', oldTimeHandler)
            ;(audioRef.current as any)._timeUpdateHandler = null
          }
          if (oldMetadataHandler) {
            audioRef.current.removeEventListener('loadedmetadata', oldMetadataHandler)
            ;(audioRef.current as any)._metadataHandler = null
          }
          
          // Clear source for streaming tracks to free resources
          if (!isLocal) {
            // Create a fresh audio element to completely remove all listeners
            audioRef.current = new Audio()
          }
          
          // Small delay to ensure cleanup completes
          await new Promise(resolve => setTimeout(resolve, 50))
          
        } catch (error: any) {
          // Silent fail
        }
      }
    }
    
    // Clean up before starting new track
    await cleanupAudio()
    
    if (isLocal) {
      // For local files, just set the track and play state
      dispatch({ type: "SET_TRACK", payload: track })
      dispatch({ type: "SET_PLAYING", payload: true })
      dispatch({ type: "SET_TIME", payload: 0 })
      dispatch({ type: "SET_DURATION", payload: track.duration || 0 })
      dispatch({ type: "SET_LOADING", payload: false })
      
      // Dispatch event for recently played tracking
      window.dispatchEvent(new CustomEvent('trackPlayed', { detail: track }))
      
      // Handle multiple artists for local files too
      const primaryArtist = track.artist.split(/[&,]|\s+feat\.?\s+|\s+ft\.?\s+/i)[0].trim()
      
      // Try to fetch artist images for local files (non-blocking)
      const spotifyArtistId = (track as any).spotifyArtistId || (track as any).artistId
      
      dispatch({ type: "SET_ARTIST_IMAGES_LOADING", payload: true })
      
      fetchArtistImagesOptimized(primaryArtist, spotifyArtistId).then(artistImages => {
        if (artistImages && artistImages.length > 0) {
          const artistImageObjects = artistImages.map(url => ({ 
            url, 
            height: 770, 
            width: 770 
          }))
          const trackWithImages = { ...track, artistImages: artistImageObjects }
          dispatch({ type: "SET_TRACK", payload: trackWithImages })
        }
      }).catch(() => {
        // Silent fail
      }).finally(() => {
        dispatch({ type: "SET_ARTIST_IMAGES_LOADING", payload: false })
      })
      
      // For local files, use HTML5 audio instead of YouTube player
      setYoutubeVideoId(null)
      
      // Set up HTML5 audio for local file playback
      const localTrack = track as any
      if ((localTrack.filePath || localTrack.fileUrl) && audioRef.current) {
        try {
          // Stop any previous audio
          audioRef.current.pause()
          audioRef.current.currentTime = 0
          
          // Try different approaches for local file access in Electron
          let audioSrc = localTrack.filePath
          
          // Method 1: Use file path directly (might work in Electron)
          
          // Method 2: If direct path fails, try file URL
          if (!audioSrc && localTrack.fileUrl) {
            audioSrc = localTrack.fileUrl
          }
          
          // Method 3: Create proper file URL from path
          if (audioSrc && !audioSrc.startsWith('file://') && !audioSrc.startsWith('http')) {
            const originalSrc = audioSrc
            // For Windows paths, convert to file URL
            if (audioSrc.includes('\\') || audioSrc.match(/^[A-Z]:/)) {
              audioSrc = 'file:///' + audioSrc.replace(/\\/g, '/').replace(/^([A-Z]):/, (match: string) => match.toLowerCase())
            }
          }
          
          // Remove ALL existing event listeners to prevent duplicates
          const audioElement = audioRef.current
          
          // Remove all possible event listeners
          const oldTimeHandler = (audioElement as any)._timeUpdateHandler
          const oldMetadataHandler = (audioElement as any)._metadataHandler
          
          if (oldTimeHandler) {
            audioElement.removeEventListener('timeupdate', oldTimeHandler)
          }
          if (oldMetadataHandler) {
            audioElement.removeEventListener('loadedmetadata', oldMetadataHandler)
          }
          
          // Clear the source first
          audioElement.src = ''
          audioElement.load()
          
          // Create new event handlers for this track
          const timeUpdateHandler = () => {
            if (audioRef.current) {
              dispatch({ type: "SET_TIME", payload: audioRef.current.currentTime })
            }
          }
          
          const metadataHandler = () => {
            if (audioRef.current && audioRef.current.duration) {
              // Only update the duration in player state, don't touch the track
              // This preserves artist images that may have been added asynchronously
              dispatch({ type: "SET_DURATION", payload: audioRef.current.duration })
            }
          }
          
          // Store handlers on the audio element for cleanup
          ;(audioElement as any)._timeUpdateHandler = timeUpdateHandler
          ;(audioElement as any)._metadataHandler = metadataHandler
          
          // Add the new event listeners
          audioElement.addEventListener('timeupdate', timeUpdateHandler)
          audioElement.addEventListener('loadedmetadata', metadataHandler)
          
          audioElement.addEventListener('error', () => {
            // Silent fail
          }, { once: true })
          
          // NOW set the audio source after event listeners are ready
          audioElement.src = audioSrc
          
          // Initialize native equalizer for local files
          if (nativeEqualizer.isAvailable()) {
            try {
              await nativeEqualizer.initialize(44100)
            } catch (error) {
              // Silent fail
            }
          }
          
          // Load the audio
          audioElement.load()
          
          // 🎵 ROBUST LOCAL FILE PLAYBACK
          const playLocalFile = async () => {
            try {
              if (!audioRef.current) {
                throw new Error('Audio element not available')
              }
              
              // Wait for audio to be ready
              if (audioRef.current.readyState < 2) {
                await new Promise((resolve, reject) => {
                  const timeout = setTimeout(() => reject(new Error('Audio load timeout')), 10000)
                  
                  const onCanPlay = () => {
                    clearTimeout(timeout)
                    audioRef.current?.removeEventListener('canplay', onCanPlay)
                    audioRef.current?.removeEventListener('error', onError)
                    resolve(void 0)
                  }
                  
                  const onError = (e: Event) => {
                    clearTimeout(timeout)
                    audioRef.current?.removeEventListener('canplay', onCanPlay)
                    audioRef.current?.removeEventListener('error', onError)
                    reject(new Error(`Audio load error: ${(e.target as HTMLAudioElement)?.error?.message || 'Unknown error'}`))
                  }
                  
                  audioRef.current?.addEventListener('canplay', onCanPlay, { once: true })
                  audioRef.current?.addEventListener('error', onError, { once: true })
                })
              }
              
              // Attempt to play
              await audioRef.current.play()
              
            } catch (error: any) {
              // Handle specific error types gracefully
              if (error.name === 'AbortError') {
                // Play interrupted - normal when switching tracks quickly
              }
              
              // Only set playing to false for actual errors, not interruptions
              if (error.name !== 'AbortError') {
                dispatch({ type: "SET_PLAYING", payload: false })
              }
            }
          }
          
          // Start playback
          playLocalFile()
        } catch (error) {
          dispatch({ type: "SET_PLAYING", payload: false })
        }
      } else {
        dispatch({ type: "SET_PLAYING", payload: false })
      }
      
      return
    }
    
    // Create unique key for this track
    const trackKey = `${track.title}-${track.artist}`.toLowerCase().replace(/[^a-z0-9]/g, '')
    
    try {
      // 🚀 CHECK CACHE FIRST - Save quota!
      
      if (useCache) {
        videoId = getCachedVideoId(track)
        if (videoId) {
          // Skip backend, use cached video ID
          // Set track immediately for instant UI feedback
          dispatch({ type: "SET_TRACK", payload: track })
          
          // Queue is managed by the playlist page, don't modify it here

          // 🎵 TRACK RECENTLY PLAYED - Dispatch event for recently played tracking
          window.dispatchEvent(new CustomEvent('trackPlayed', { detail: track }))
          
          // Always try to fetch artist images (cache-first, non-blocking)
          // Extract Spotify artist ID from track if available
          const spotifyArtistId = (track as any).spotifyArtistId || (track as any).artistId
          
          // Set loading state
          dispatch({ type: "SET_ARTIST_IMAGES_LOADING", payload: true })
          
          // Handle multiple artists - use only the first artist for image fetching
          const primaryArtist = track.artist.split(/[&,]|\s+feat\.?\s+|\s+ft\.?\s+/i)[0].trim()
          
          fetchArtistImagesOptimized(primaryArtist, spotifyArtistId).then(artistImages => {
            if (artistImages.length > 0) {
              // Convert string URLs to ArtistImage objects with default dimensions
              const artistImageObjects = artistImages.map(url => ({ 
                url, 
                height: 770, 
                width: 770 
              }))
              const trackWithImages = { ...track, artistImages: artistImageObjects }
              dispatch({ type: "SET_TRACK", payload: trackWithImages })
            }
          }).catch(error => {
            // Image fetch failed
          }).finally(() => {
            // Clear loading state
            dispatch({ type: "SET_ARTIST_IMAGES_LOADING", payload: false })
          })
          
          setYoutubeVideoId(videoId)
          // Force reload - Increment trigger even for same video ID
          setReloadTrigger(prev => prev + 1)
          
          // 🎵 SPOTIFY-LIKE UX: Instant progress reset + stable play state
          dispatch({ type: "SET_TIME", payload: 0 }) // ⚡ Instant progress reset
          // Set duration from track metadata with robust validation
          const trackDuration = (track.duration && typeof track.duration === 'number' && !isNaN(track.duration) && track.duration > 0) ? track.duration : 0
          dispatch({ type: "SET_DURATION", payload: trackDuration })
          dispatch({ type: "SET_PLAYING", payload: true })
          dispatch({ type: "SET_LOADING", payload: false })
          
          return
        }
      }
      
      // Check if there's already an ongoing request for this track
      if (ongoingRequests.current.has(trackKey)) {
        const ongoingRequest = ongoingRequests.current.get(trackKey)!
        const streamData = await ongoingRequest
        videoId = streamData.data?.id
      } else {
        // Get YouTube video ID for hidden player (only if not cached)
        // Handle multiple artists - use only the first artist for API calls
        const primaryArtist = track.artist.split(/[&,]|feat\.?|ft\.?/i)[0].trim()
        
        // Get fresh token if needed
        let token = localStorage.getItem('auth_token')
        
        // Add timeout to prevent hanging requests
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout
        
        // Create the request promise and store it
        const requestPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL}/youtube-music/get-stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: track.title,
            artist: primaryArtist, // Use primary artist only
            duration: track.duration,
            albumArt: track.albumArt
          }),
          signal: controller.signal
        }).then(async (response) => {
          clearTimeout(timeoutId)
          
          // Handle token refresh if needed
          if (response.status === 401) {
            // Token expired, refreshing...
          }
          
          if (!response.ok) {
            throw new Error(`Failed to get stream: ${response.status}`)
          }
          
          return response.json()
        }).finally(() => {
          // Clean up the ongoing request
          ongoingRequests.current.delete(trackKey)
        })
        
        // Store the ongoing request
        ongoingRequests.current.set(trackKey, requestPromise)
        
        // Wait for the request to complete
        const streamData = await requestPromise
        videoId = streamData.data?.id
      }
      
      if (!videoId) {
        throw new Error(`No YouTube video ID returned for: ${track.title} by ${track.artist}`)
      }
      
      // 🚀 CACHE THE VIDEO ID - Save for future use!
      if (videoId) {
        cacheVideoId(track, videoId)
      }

      // Stop any previous audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      
      // Set current track immediately for instant UI feedback
      dispatch({ type: "SET_TRACK", payload: track })
      dispatch({ type: "SET_TIME", payload: 0 }) // Reset time to 0
      // Set duration from track metadata with robust validation
      const trackDuration = (track.duration && typeof track.duration === 'number' && !isNaN(track.duration) && track.duration > 0) ? track.duration : 0
      dispatch({ type: "SET_DURATION", payload: trackDuration })
      
      // Always try to fetch artist images (cache-first, non-blocking)
      // Extract Spotify artist ID from track if available
      const spotifyArtistId = (track as any).spotifyArtistId || (track as any).artistId
      
      // Set loading state
      dispatch({ type: "SET_ARTIST_IMAGES_LOADING", payload: true })
      
      fetchArtistImagesOptimized(track.artist, spotifyArtistId).then(artistImages => {
        if (artistImages.length > 0) {
          // Convert string URLs to ArtistImage objects with default dimensions
          const artistImageObjects = artistImages.map(url => ({ 
            url, 
            height: 770, 
            width: 770 
          }))
          const trackWithImages = { ...track, artistImages: artistImageObjects }
          dispatch({ type: "SET_TRACK", payload: trackWithImages })
        }
      }).catch(error => {
        // Image fetch failed
      }).finally(() => {
        // Clear loading state
        dispatch({ type: "SET_ARTIST_IMAGES_LOADING", payload: false })
      })

      // 🎵 TRACK RECENTLY PLAYED - Dispatch event for recently played tracking
      window.dispatchEvent(new CustomEvent('trackPlayed', { detail: track }))
      
      // Queue is managed by the playlist page, don't modify it here
      
      // Set YouTube video ID for hidden player
      setYoutubeVideoId(videoId)
      
    } catch (error) {
      // Silent fail
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const togglePlay = async () => {
    try {
      const id = state.currentTrack?.id || ''
      const isLocal = id.startsWith('local-') || id.startsWith('watched-')
      const newIsPlaying = !state.isPlaying
      
      // Update app state FIRST
      dispatch({ type: "TOGGLE_PLAY" })
      
      if (isLocal && audioRef.current) {
        // 🎵 ROBUST LOCAL AUDIO CONTROL
        try {
          if (newIsPlaying) {
            // Ensure audio is ready before playing
            if (audioRef.current.readyState >= 2) {
              await audioRef.current.play()
            } else {
              // Wait for audio to be ready, then play
              audioRef.current.addEventListener('canplay', async () => {
                try {
                  await audioRef.current?.play()
                } catch (error: any) {
                  if (error.name !== 'AbortError') {
                    dispatch({ type: "SET_PLAYING", payload: false })
                  }
                }
              }, { once: true })
            }
          } else {
            audioRef.current.pause()
          }
        } catch (error: any) {
          if (error.name === 'AbortError') {
            // Play/pause interrupted - normal when switching quickly
          } else {
            dispatch({ type: "SET_PLAYING", payload: false })
          }
        }
      } else if (youtubePlayer) {
        // Handle YouTube player
        if (newIsPlaying) {
          youtubePlayer.playVideo()
        } else {
          youtubePlayer.pauseVideo()
        }
        
        // Update backend state (non-blocking) for non-local tracks
        if (!isLocal) {
          playerApi.updateState({
            trackId: id,
            isPlaying: newIsPlaying,
          }).catch(() => {})
        }
      }
    } catch (error) {
      // Silent fail
    }
  }

  const setVolume = (volume: number) => {
    const id = state.currentTrack?.id || ''
    const isLocal = id.startsWith('local-') || id.startsWith('watched-')
    
    if (isLocal && audioRef.current) {
      // Update HTML5 audio volume (0-1 range)
      audioRef.current.volume = volume
    } else if (youtubePlayer) {
      // Update YouTube player volume (0-100 range)
      youtubePlayer.setVolume(volume * 100)
    }
    dispatch({ type: "SET_VOLUME", payload: volume })
  }

  const seekTo = (time: number) => {
    const id = state.currentTrack?.id || ''
    const isLocal = id.startsWith('local-') || id.startsWith('watched-')
    
    if (isLocal && audioRef.current) {
      // Seek HTML5 audio
      audioRef.current.currentTime = time
    } else if (youtubePlayer) {
      // Seek YouTube player
      youtubePlayer.seekTo(time, true)
    }
    dispatch({ type: "SET_TIME", payload: time })
  }

  // 🚀 SMART AUTO-ADVANCE: Handle track progression with fresh state
  useEffect(() => {
    if (autoAdvanceTrigger === 0) return // Skip initial render
    
    // Use setTimeout to break the render cycle and prevent infinite loops
    setTimeout(() => {
      // PRIORITY: Shuffle > Repeat > Stop
      if (state.shuffle && state.queue.length > 0) {
        const currentIndex = state.queue.findIndex((track) => track.id === state.currentTrack?.id)
        
        if (currentIndex >= 0 && currentIndex < state.queue.length - 1) {
          // Play next in shuffled queue
          playTrack(state.queue[currentIndex + 1])
        } else {
          // Pick random different track
          const availableTracks = state.queue.filter((track) => track.id !== state.currentTrack?.id)
          if (availableTracks.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableTracks.length)
            playTrack(availableTracks[randomIndex])
          } else if (state.queue.length > 0) {
            playTrack(state.queue[0])
          }
        }
        return
      }
      
      // Handle repeat modes
      if (state.repeat === "one" && state.currentTrack) {
        playTrack(state.currentTrack, true) // Use cache
        return
      }
      
      if (state.repeat === "all" && state.queue.length > 0) {
        const currentIndex = state.queue.findIndex((track) => track.id === state.currentTrack?.id)
        if (currentIndex < state.queue.length - 1) {
          playTrack(state.queue[currentIndex + 1])
        } else {
          playTrack(state.queue[0]) // Loop back to start
        }
        return
      }
      
      // No repeat - just stop
      dispatch({ type: "SET_TIME", payload: 0 })
    }, 0) // Execute on next tick to break render cycle
    
  }, [autoAdvanceTrigger]) // Only depend on the trigger, not on state values

  // YouTube player callbacks
  const handleYouTubeReady = (player: any) => {
    setYoutubePlayer(player)
    
    // Store player reference more persistently
    if (player && typeof player.getPlayerState === 'function') {
      // Keep player alive by preventing garbage collection
      player._persistentRef = true
    }
    
    // Set initial volume
    player.setVolume(state.volume * 100)
    
    // ALWAYS auto-play if we have a track loaded (user clicked a song)
    if (state.currentTrack) {
      try {
        // Force play with error handling
        const playPromise = player.playVideo()
        
        // Check if browser allows autoplay
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {})
        }
        
      } catch (error) {
        // Silent fail
      }
      
      // Update both local state and backend when playback actually starts
      if (!state.isPlaying) {
        dispatch({ type: "TOGGLE_PLAY" })
        
        // Now update backend to match actual playing state (skip for local)
        const startupId = state.currentTrack.id
        const startupIsLocal = startupId.startsWith('local-') || startupId.startsWith('watched-')
        if (!startupIsLocal) {
          playerApi.updateState({ 
            trackId: startupId, 
            isPlaying: true 
          }).catch(() => {})
        }
      }
    }
  }

  const handleYouTubeProgress = (currentTime: number, duration: number) => {
    // Validate values from YouTube player to prevent NaN
    const validCurrentTime = (typeof currentTime === 'number' && !isNaN(currentTime) && currentTime >= 0) ? currentTime : 0
    const validDuration = (typeof duration === 'number' && !isNaN(duration) && duration > 0) ? duration : 0
    
    dispatch({ type: "SET_TIME", payload: validCurrentTime })
    dispatch({ type: "SET_DURATION", payload: validDuration })
  }

  const handleYouTubeStateChange = (event: any) => {
    const playerState = event.data
    
    // Ensure player reference persists after state changes
    if (event.target && typeof event.target.getPlayerState === 'function') {
      // Always keep the player reference updated and alive
      if (!youtubePlayer || youtubePlayer !== event.target) {
        setYoutubePlayer(event.target)
      }
    }
    
    // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    
    // Sync play/pause state to prevent desync issues
    if (playerState === 1 && !state.isPlaying) { // Playing but app thinks it's paused
      dispatch({ type: "SET_PLAYING", payload: true })
    } else if (playerState === 2 && state.isPlaying) { // Paused but app thinks it's playing
      dispatch({ type: "SET_PLAYING", payload: false })
    }
    
    // Handle video end with delay to avoid race conditions and double execution
    if (playerState === 0) { // Ended
      
      // Prevent double execution - Clear any existing timeout
      if (endTimeoutRef.current) {
        clearTimeout(endTimeoutRef.current)
      }
      
      // Single delayed execution to prevent race condition
      endTimeoutRef.current = setTimeout(() => {
        endTimeoutRef.current = null // Clear reference
        handleYouTubeEnd() // Use proper repeat logic after delay
      }, 100) // Shorter delay since we handle end detection better now
      return
    }
  }

  const handleYouTubeEnd = () => {
    
    // Set playing to false first
    dispatch({ type: "SET_PLAYING", payload: false })
    
    // 🚀 TRIGGER SMART AUTO-ADVANCE with fresh state
    setTimeout(() => {
      setAutoAdvanceTrigger(prev => prev + 1)
    }, 200) // Small delay for clean transition
  }

  const nextTrack = useCallback(() => {
    if (state.queue.length === 0) {
      return
    }
    
    // Repeat one - Always replay current track, regardless of shuffle
    if (state.repeat === "one" && state.currentTrack) {
      playTrack(state.currentTrack)
      return
    }
    
    const currentIndex = state.queue.findIndex((track) => track.id === state.currentTrack?.id)
    
    if (state.shuffle) {
      // In shuffle mode, play next song in the pre-shuffled queue order
      if (currentIndex >= 0 && currentIndex < state.queue.length - 1) {
        playTrack(state.queue[currentIndex + 1])
      } else if (currentIndex === state.queue.length - 1) {
        // Last song in shuffle mode - pick a random different song
        const availableTracks = state.queue.filter((track) => track.id !== state.currentTrack?.id)
        if (availableTracks.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableTracks.length)
          const selectedTrack = availableTracks[randomIndex]
          if (selectedTrack) {
            playTrack(selectedTrack)
          }
        } else {
          // Only one song in queue, restart it
          if (state.queue.length > 0) {
            playTrack(state.queue[0])
          }
        }
      } else if (currentIndex === -1) {
        // Current track not found in queue - play random song
        if (state.queue.length > 0) {
          const randomIndex = Math.floor(Math.random() * state.queue.length)
          playTrack(state.queue[randomIndex])
        }
      }
    } else {
      // Play next track in order
      if (currentIndex < state.queue.length - 1) {
        const nextTrack = state.queue[currentIndex + 1]
        playTrack(nextTrack)
      } else if (state.repeat === "all") {
        // Restart from beginning when repeat all is enabled
        playTrack(state.queue[0])
      }
    }
  }, [state.shuffle, state.queue, state.currentTrack, state.repeat, playTrack])

  // Keep nextTrackRef updated with latest nextTrack function
  useEffect(() => {
    nextTrackRef.current = nextTrack
  }, [nextTrack])

  const previousTrack = useCallback(() => {
    if (state.queue.length === 0) {
      return
    }
    
    const currentIndex = state.queue.findIndex((track) => track.id === state.currentTrack?.id)
    
    if (state.shuffle) {
      // In shuffle mode, go to a random previous track
      const availableTracks = state.queue.filter((track) => track.id !== state.currentTrack?.id)
      if (availableTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTracks.length)
        playTrack(availableTracks[randomIndex])
      }
    } else {
      // Play previous track in order
      if (currentIndex > 0) {
        playTrack(state.queue[currentIndex - 1])
      } else if (state.repeat === "all" && state.queue.length > 0) {
        // Go to last track if repeat all is enabled
        playTrack(state.queue[state.queue.length - 1])
      }
    }
  }, [state.shuffle, state.queue, state.currentTrack, state.repeat, playTrack])

  const addToQueue = (track: Track) => {
    dispatch({ type: "SET_QUEUE", payload: [...state.queue, track] })
  }

  const setQueue = (tracks: Track[]) => {
    dispatch({ type: "SET_QUEUE", payload: tracks })
  }

  const clearQueue = () => {
    dispatch({ type: "SET_QUEUE", payload: [] })
  }

  const toggleShuffle = () => {
    dispatch({ type: "TOGGLE_SHUFFLE" })
  }

  const toggleRepeat = () => {
    dispatch({ type: "TOGGLE_REPEAT" })
  }

  // Force refresh artist images (bypass cache)
  const refreshArtistImages = useCallback(() => {
    if (!state.currentTrack) {
      return
    }
    
    dispatch({ type: "SET_ARTIST_IMAGES_LOADING", payload: true })
    
    const primaryArtist = state.currentTrack.artist.split(/[&,]|\s+feat\.?\s+|\s+ft\.?\s+/i)[0].trim()
    const spotifyArtistId = (state.currentTrack as any).spotifyArtistId || (state.currentTrack as any).artistId
    
    // Force refresh with forceRefresh=true (this will clear cache and fetch fresh)
    fetchArtistImagesOptimized(primaryArtist, spotifyArtistId, true).then(artistImages => {
      
      if (state.currentTrack) {
        const updatedTrack = {
          ...state.currentTrack,
          artistImages: artistImages.map(url => ({ url, height: 0, width: 0 }))
        }
        dispatch({ type: "SET_TRACK", payload: updatedTrack })
      }
      
      dispatch({ type: "SET_ARTIST_IMAGES_LOADING", payload: false })
    }).catch(() => {
      dispatch({ type: "SET_ARTIST_IMAGES_LOADING", payload: false })
    })
  }, [state.currentTrack])
  
  // Expose refresh function globally for console access
  useEffect(() => {
    (window as any).refreshArtistImages = refreshArtistImages
    
    return () => {
      delete (window as any).refreshArtistImages
    }
  }, [refreshArtistImages])

  // Media Session API - Show rich media controls on lock screen
  useEffect(() => {
    if (!('mediaSession' in navigator)) {
      return
    }

    if (!state.currentTrack) {
      navigator.mediaSession.metadata = null
      return
    }

    const updateMediaSession = () => {

      // Set metadata with album art
      navigator.mediaSession.metadata = new MediaMetadata({
        title: state.currentTrack!.title,
        artist: state.currentTrack!.artist,
        album: state.currentTrack!.album || '2k Music',
        artwork: [
          {
            src: state.currentTrack!.albumArt || '/placeholder-album.png',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      })

      // Set playback state
      navigator.mediaSession.playbackState = state.isPlaying ? 'playing' : 'paused'
    }

    // Update immediately
    updateMediaSession()

    // Set up action handlers (only once)
    navigator.mediaSession.setActionHandler('play', () => {
      togglePlay()
    })

    navigator.mediaSession.setActionHandler('pause', () => {
      togglePlay()
    })

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      previousTrack()
    })

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      nextTrack()
    })

    // Override YouTube's media session every second
    const interval = setInterval(updateMediaSession, 1000)

    return () => {
      clearInterval(interval)
    }

  }, [state.currentTrack, state.isPlaying])

  // Force stop player - Listen for logout events
  useEffect(() => {
    const handleForceStop = () => {
      
      // Stop playback immediately
      dispatch({ type: "SET_PLAYING", payload: false })
      dispatch({ type: "SET_TRACK", payload: null })
      dispatch({ type: "SET_QUEUE", payload: [] })
      
      // Stop audio elements
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current.currentTime = 0
      }
      
      // Clear YouTube player
      setYoutubeVideoId(null)
      
      // Clear caches
      videoCache.current.clear()
      artistImagesCache.current.clear()
    }
    
    window.addEventListener('forceStopPlayer', handleForceStop)
    
    return () => {
      window.removeEventListener('forceStopPlayer', handleForceStop)
    }
  }, [])

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        playTrack,
        togglePlay,
        setVolume,
        seekTo,
        nextTrack,
        previousTrack,
        addToQueue,
        setQueue,
        clearQueue,
        toggleShuffle,
        toggleRepeat,
        refreshArtistImages,
        playbackError,
      }}
    >
      {children}
      <HiddenYouTubePlayer
        videoId={youtubeVideoId}
        isPlaying={state.isPlaying}
        currentTime={state.currentTime}
        volume={state.volume}
        reloadTrigger={reloadTrigger}
        onReady={handleYouTubeReady}
        onStateChange={handleYouTubeStateChange}
        onProgress={handleYouTubeProgress}
        onEnd={handleYouTubeEnd}
        onError={(message) => setPlaybackError(message)}
      />
    </PlayerContext.Provider>
  )
}

export const usePlayer = () => {
  const context = useContext(PlayerContext)
  if (context === undefined) {
    throw new Error("usePlayer must be used within a PlayerProvider")
  }
  return context
}
