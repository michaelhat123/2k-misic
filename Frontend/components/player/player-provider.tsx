"use client"

import type React from "react"

import { createContext, useContext, useEffect, useReducer, useRef, useState } from "react"
import type { Track } from "@/types/track"
import { playerApi } from "@/lib/api/player"
import HiddenYouTubePlayer from "./hidden-youtube-player"

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
          console.log('🔄 PERSISTENCE: Saved repeat state to sessionStorage:', newRepeat)
        } catch (e) {
          console.warn('Could not save repeat state to sessionStorage:', e)
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
  toggleShuffle: () => void
  toggleRepeat: () => void
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined)

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState)

  // 🚀 YOUTUBE VIDEO CACHE - Save quota by caching video IDs
  const videoCache = useRef<Map<string, string>>(new Map())
  
  // Get cache key for a track
  const getCacheKey = (track: Track) => `${track.title}-${track.artist}`.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  // Get cached video ID
  const getCachedVideoId = (track: Track): string | null => {
    const key = getCacheKey(track)
    const cached = videoCache.current.get(key)
    if (cached) {
      console.log('💾 CACHE HIT: Using cached video ID for:', track.title, 'ID:', cached)
      return cached
    }
    return null
  }
  
  // Cache video ID
  const cacheVideoId = (track: Track, videoId: string) => {
    const key = getCacheKey(track)
    videoCache.current.set(key, videoId)
    console.log('💾 CACHED: Video ID for', track.title, 'ID:', videoId)
  }

  // Restore repeat state from sessionStorage on every mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('player_repeat_state')
        if (saved && ['none', 'one', 'all'].includes(saved) && saved !== state.repeat) {
          console.log('🔄 PERSISTENCE: Restoring repeat state from sessionStorage:', saved)
          dispatch({ type: "SET_REPEAT", payload: saved as "none" | "one" | "all" })
        }
      } catch (e) {
        console.warn('Could not restore repeat state from sessionStorage:', e)
      }
    }
  }, []) // Run only on mount

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null)
  const [youtubePlayer, setYoutubePlayer] = useState<any>(null)
  const [reloadTrigger, setReloadTrigger] = useState<number>(0) // 🚀 Force reload for same video ID
  const endTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const playTrack = async (track: Track, useCache: boolean = true) => {
    dispatch({ type: "SET_LOADING", payload: true })
    let videoId: string | null = null // Declare at function scope
    
    try {
      // 🚀 CHECK CACHE FIRST - Save quota!
      
      if (useCache) {
        videoId = getCachedVideoId(track)
        if (videoId) {
          console.log('💾 USING CACHED VIDEO - No backend call needed!')
          // Skip backend, use cached video ID
          dispatch({ type: "SET_TRACK", payload: track })
          
          if (!state.queue.find(t => t.id === track.id)) {
            dispatch({ type: "SET_QUEUE", payload: [...state.queue, track] })
          }
          
          // 🚀 EXTENSIVE DEBUG - Track video ID state changes
          console.log('📊 PRE-SET DEBUG - Current youtubeVideoId:', youtubeVideoId)
          console.log('📊 PRE-SET DEBUG - New videoId to set:', videoId)
          console.log('📊 PRE-SET DEBUG - Are they different?', youtubeVideoId !== videoId)
          
          setYoutubeVideoId(videoId)
          // 🚀 FORCE RELOAD - Increment trigger even for same video ID
          setReloadTrigger(prev => prev + 1)
          console.log('📺 Hidden YouTube player will load cached video:', videoId)
          console.log('✅ setYoutubeVideoId() called successfully')
          console.log('🔄 RELOAD TRIGGER incremented to force restart')
          
          // 🎵 SPOTIFY-LIKE UX: Instant progress reset + stable play state
          dispatch({ type: "SET_TIME", payload: 0 }) // ⚡ Instant progress reset
          dispatch({ type: "SET_PLAYING", payload: true }) // 🚀 Stable play state (no toggle flicker)
          dispatch({ type: "SET_LOADING", payload: false })
          console.log('⚡ SPOTIFY UX: Progress reset to 0, play state stabilized')
          
          console.log('▶️ CACHED VIDEO: Auto-play state set - waiting for YouTube player...')
          console.log('📊 CACHED VIDEO DEBUG - Current youtubePlayer:', !!youtubePlayer)
          console.log('📊 CACHED VIDEO DEBUG - VideoId being set:', videoId)
          
          // 🚀 VERIFY STATE AFTER SET
          setTimeout(() => {
            console.log('📊 POST-SET DEBUG - youtubeVideoId after 100ms:', youtubeVideoId)
          }, 100)
          
          return
        }
      }
      
      // Get YouTube video ID for hidden player (only if not cached)
      console.log('🎵 Fetching YouTube video ID for:', track.title, 'by', track.artist)
      
      // Get fresh token if needed
      let token = localStorage.getItem('firebase_token')
      
      let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/youtube-music/get-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: track.title,
          artist: track.artist,
          duration: track.duration
        }),
      })

      // If token expired, try to refresh and retry
      if (response.status === 401) {
        console.log('🔄 Token expired, refreshing...')
        try {
          // Try to refresh Firebase token
          const { getAuth } = await import('firebase/auth')
          const auth = getAuth()
          if (auth.currentUser) {
            const freshToken = await auth.currentUser.getIdToken(true) // Force refresh
            localStorage.setItem('firebase_token', freshToken)
            console.log('✅ Token refreshed!')
            
            // Retry the request with fresh token
            response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/youtube-music/get-stream`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${freshToken}`,
              },
              body: JSON.stringify({
                title: track.title,
                artist: track.artist,
                duration: track.duration
              }),
            })
          }
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError)
        }
      }

      if (!response.ok) {
        throw new Error(`Failed to get stream: ${response.status}`)
      }

      const streamData = await response.json()
      console.log('🎯 Backend response:', streamData)
      
      // Extract YouTube video ID from response (it's in the data.id field)
      const fetchedVideoId = streamData.data?.id
      console.log('🎯 YouTube Video ID:', fetchedVideoId)
      
      if (!streamData || !fetchedVideoId) {
        console.error('❌ Backend returned:', streamData)
        throw new Error(`No YouTube video ID returned. Backend response: ${JSON.stringify(streamData)}`)
      }

      // Assign to function-scoped variable
      videoId = fetchedVideoId
      
      // 🚀 CACHE THE VIDEO ID - Save for future use!
      if (videoId) {
        cacheVideoId(track, videoId)
      }

      // Stop any previous audio
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      
      // Set current track and ensure it's in queue
      dispatch({ type: "SET_TRACK", payload: track })
      
      // Always add current track to queue if it's not there
      if (!state.queue.find(t => t.id === track.id)) {
        dispatch({ type: "SET_QUEUE", payload: [...state.queue, track] })
        console.log('🎵 Added track to queue for repeat functionality')
      }
      console.log('🎵 Player bar updated with track info')
      
      // Set YouTube video ID for hidden player
      setYoutubeVideoId(videoId)
      console.log('📺 Hidden YouTube player will load video:', videoId)
      
      // Wait 200ms before starting playback
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // DON'T set playing state yet - let YouTube player ready callback handle it
      console.log('⏳ Waiting for YouTube player to be ready for auto-play')
      
      // DON'T update backend state yet - wait for actual playback to start
      console.log('🚫 Skipping premature backend state update to avoid conflicts')
      
    } catch (error) {
      console.error("❌ Failed to play track:", error)
    } finally {
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }

  const togglePlay = async () => {
    try {
      console.log('🎮 Toggle play requested - current state:', state.isPlaying)
      
      if (youtubePlayer) {
        const newIsPlaying = !state.isPlaying
        
        // Update app state FIRST
        dispatch({ type: "TOGGLE_PLAY" })
        
        // Then control YouTube player
        if (newIsPlaying) {
          youtubePlayer.playVideo()
          console.log('▶️ Playing YouTube player')
        } else {
          youtubePlayer.pauseVideo()
          console.log('⏸️ Pausing YouTube player')
        }
        
        // Update backend state
        await playerApi.updateState({
          trackId: state.currentTrack?.id,
          isPlaying: newIsPlaying,
        })
      } else {
        console.warn('⚠️ YouTube player not ready yet')
      }
    } catch (error) {
      console.error("Failed to toggle play:", error)
    }
  }

  const setVolume = (volume: number) => {
    // Update YouTube player volume
    if (youtubePlayer) {
      youtubePlayer.setVolume(volume * 100) // YouTube expects 0-100, we use 0-1
    }
    dispatch({ type: "SET_VOLUME", payload: volume })
  }

  const seekTo = (time: number) => {
    if (youtubePlayer) {
      youtubePlayer.seekTo(time, true)
    }
    dispatch({ type: "SET_TIME", payload: time })
  }

  // YouTube player callbacks
  const handleYouTubeReady = (player: any) => {
    setYoutubePlayer(player)
    console.log('🎬 YouTube player ready!')
    
    // 🚀 ENSURE PLAYER REFERENCE PERSISTS
    // Store player reference more persistently
    if (player && typeof player.getPlayerState === 'function') {
      console.log('✅ YouTube player reference is valid and persistent')
      // Keep player alive by preventing garbage collection
      player._persistentRef = true
    }
    
    // Set initial volume
    player.setVolume(state.volume * 100)
    
    // ALWAYS auto-play if we have a track loaded (user clicked a song)
    if (state.currentTrack) {
      console.log('🎵 Auto-playing track when ready:', state.currentTrack.title)
      
      try {
        // Force play with error handling
        const playPromise = player.playVideo()
        console.log('▶️ playVideo() called, result:', playPromise)
        
        // Check if browser allows autoplay
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch((error: any) => {
            console.error('🚫 Browser blocked autoplay:', error)
            console.log('📱 User interaction may be required for playback')
          })
        }
        
      } catch (error) {
        console.error('⚠️ Error calling playVideo():', error)
      }
      
      // Update both local state and backend when playback actually starts
      if (!state.isPlaying) {
        dispatch({ type: "TOGGLE_PLAY" })
        
        // Now update backend to match actual playing state
        playerApi.updateState({ 
          trackId: state.currentTrack.id, 
          isPlaying: true 
        }).catch(err => console.warn('Backend update failed:', err))
      }
    }
  }

  const handleYouTubeProgress = (currentTime: number, duration: number) => {
    dispatch({ type: "SET_TIME", payload: currentTime })
    dispatch({ type: "SET_DURATION", payload: duration })
  }

  const handleYouTubeStateChange = (event: any) => {
    const playerState = event.data
    console.log('🎬 YouTube state change:', playerState, 'Current app state playing:', state.isPlaying)
    
    // 🚀 ENSURE PLAYER REFERENCE PERSISTS AFTER STATE CHANGES
    if (event.target && typeof event.target.getPlayerState === 'function') {
      // Always keep the player reference updated and alive
      if (!youtubePlayer || youtubePlayer !== event.target) {
        console.log('🔄 Refreshing YouTube player reference from state change')
        setYoutubePlayer(event.target)
      }
    }
    
    // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (cued)
    
    // Handle video end with delay to avoid race conditions and double execution
    if (playerState === 0) { // Ended
      console.log('🔚 YouTube video ended')
      
      // 🚀 PREVENT DOUBLE EXECUTION - Clear any existing timeout
      if (endTimeoutRef.current) {
        clearTimeout(endTimeoutRef.current)
        console.log('🗑️ Cleared previous end timeout to prevent double execution')
      }
      
      // 🚀 SINGLE DELAYED EXECUTION to prevent race condition
      endTimeoutRef.current = setTimeout(() => {
        console.log('🕰️ Repeat logic delay complete - processing end (single execution)')
        endTimeoutRef.current = null // Clear reference
        handleYouTubeEnd() // Use proper repeat logic after delay
      }, 300) // 300ms delay to ensure video has fully ended
      return
    }
    
    // DISABLE state syncing to prevent button flicker
    // The togglePlay() function now handles all state changes directly
    console.log('🚫 State sync disabled - togglePlay handles all control')
  }

  const handleYouTubeEnd = () => {
    console.log('🔁 YouTube video ended')
    console.log('📊 DEBUG - Current repeat state:', state.repeat)
    console.log('📊 DEBUG - Current track:', state.currentTrack?.title)
    console.log('📊 DEBUG - YouTube player exists:', !!youtubePlayer)
    console.log('📊 DEBUG - youtubeVideoId available:', !!youtubeVideoId)
    
    if (state.repeat === "one") {
      console.log('🔁 Repeat ONE mode - using cached video for instant restart')
      if (state.currentTrack) {
        // 🚀 ALWAYS use cached video for repeat ONE (avoids DOM detachment issues)
        console.log('💾 INSTANT REPEAT ONE: Using cached video (no backend call!)')
        playTrack(state.currentTrack, true) // Use cache
      }
      return
    }
    
    console.log('👉 Repeat mode is:', state.repeat, '- proceeding with normal end logic')
    
    if (state.isPlaying) {
      dispatch({ type: "TOGGLE_PLAY" })
    }
    
    // Move to next track or repeat all
    if (state.repeat === "all") {
      console.log('📊 DEBUG REPEAT - Queue length:', state.queue.length, 'YouTubeVideoId:', youtubeVideoId)
      if (state.queue.length > 0) {
        const currentIndex = state.queue.findIndex((track) => track.id === state.currentTrack?.id)
        if (currentIndex === state.queue.length - 1) {
          // End of queue, restart from beginning
          console.log('🔁 End of queue - restarting from beginning')
          
          // Check if it's the same track for instant repeat
          if (state.queue[0].id === state.currentTrack?.id) {
            console.log('🔄 Same track repeat - using cached video for instant restart')
            // 🚀 ALWAYS use cached video for repeat (avoids DOM detachment issues)
            console.log('💾 INSTANT REPEAT: Using cached video (no backend call!)')
            playTrack(state.queue[0], true) // Use cache
            return
          }
        }
      } else if (state.currentTrack) {
        // No queue - use cached video for instant repeat
        console.log('🔁 Repeat all with single track - using cached video for instant restart')
        // 🚀 ALWAYS use cached video for repeat (avoids DOM detachment issues)
        console.log('💾 INSTANT REPEAT ALL: Using cached video (no backend call!)')
        playTrack(state.currentTrack, true) // Use cache
        return
      }
    }
    
    console.log('👉 Calling nextTrack()')
    nextTrack()
  }

  const nextTrack = () => {
    if (state.queue.length === 0) {
      console.log('❌ No tracks in queue')
      return
    }
    
    const currentIndex = state.queue.findIndex((track) => track.id === state.currentTrack?.id)
    
    if (state.shuffle) {
      // Play random track (excluding current)
      const availableTracks = state.queue.filter((track) => track.id !== state.currentTrack?.id)
      if (availableTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTracks.length)
        console.log('🔀 Playing random track')
        playTrack(availableTracks[randomIndex])
      }
    } else {
      // Play next track in order
      if (currentIndex < state.queue.length - 1) {
        console.log('⏭️ Playing next track')
        playTrack(state.queue[currentIndex + 1])
      } else {
        console.log('📜 End of queue reached')
      }
    }
  }

  const previousTrack = () => {
    if (state.queue.length === 0) {
      console.log('❌ No tracks in queue')
      return
    }
    
    const currentIndex = state.queue.findIndex((track) => track.id === state.currentTrack?.id)
    
    if (state.shuffle) {
      // In shuffle mode, go to a random previous track
      const availableTracks = state.queue.filter((track) => track.id !== state.currentTrack?.id)
      if (availableTracks.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableTracks.length)
        console.log('🔀 Playing random previous track')
        playTrack(availableTracks[randomIndex])
      }
    } else {
      // Play previous track in order
      if (currentIndex > 0) {
        console.log('⏮️ Playing previous track')
        playTrack(state.queue[currentIndex - 1])
      } else if (state.repeat === "all" && state.queue.length > 0) {
        // Go to last track if repeat all is enabled
        console.log('🔁 Going to last track (repeat all)')
        playTrack(state.queue[state.queue.length - 1])
      } else {
        console.log('📜 Beginning of queue reached')
      }
    }
  }

  const addToQueue = (track: Track) => {
    dispatch({ type: "SET_QUEUE", payload: [...state.queue, track] })
  }

  const toggleShuffle = () => {
    dispatch({ type: "TOGGLE_SHUFFLE" })
  }

  const toggleRepeat = () => {
    console.log('🔁 REPEAT BUTTON CLICKED! Current state:', state.repeat)
    dispatch({ type: "TOGGLE_REPEAT" })
    
    // Log new state after a short delay
    setTimeout(() => {
      console.log('🔁 REPEAT BUTTON - New state should be:', 
        state.repeat === "none" ? "all" : 
        state.repeat === "all" ? "one" : "none"
      )
    }, 100)
  }

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
        toggleShuffle,
        toggleRepeat,
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
