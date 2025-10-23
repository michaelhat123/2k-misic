"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { PillProgressBar } from "@/components/ui/pill-progress-bar"
import { Slider } from "@/components/ui/slider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { usePlayer } from "./player-provider"
import { motion, AnimatePresence } from "framer-motion"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  RotateCcw,
  RefreshCw,
  Volume2,
  VolumeX,
  Plus,
  MoreHorizontal,
  Maximize2,
  Monitor,
  Mic2,
  List,
  PictureInPicture2,
  Cast,
  Headphones,
  PlusCircle,
  Music,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/utils"
import { NowPlayingSidebar } from "./now-playing-sidebar"
import { SongActions } from "@/components/ui/song-actions"
import { LyricsDialog } from "./lyrics-dialog"

interface PlayerBarProps {
  showNowPlaying?: boolean
  onToggleNowPlaying?: () => void
}

export function PlayerBar({ showNowPlaying = false, onToggleNowPlaying }: PlayerBarProps) {
  const {
    currentTrack,
    isPlaying,
    volume,
    currentTime,
    duration,
    shuffle,
    repeat,
    togglePlay,
    setVolume,
    seekTo,
    nextTrack,
    previousTrack,
    toggleShuffle,
    toggleRepeat,
    playbackError,
  } = usePlayer()

  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(volume)
  const [showLyrics, setShowLyrics] = useState(false)
  const [dominantColor, setDominantColor] = useState('#3b82f6')
  // Now Playing state is managed by parent component

  const handleVolumeToggle = () => {
    if (isMuted) {
      setVolume(previousVolume)
      setIsMuted(false)
    } else {
      setPreviousVolume(volume)
      setVolume(0)
      setIsMuted(true)
    }
  }

  // Extract dominant color from album art
  const extractDominantColor = useCallback(async (imageUrl: string) => {
    return new Promise<string>((resolve) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'

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

          const stepPx = 4
          for (let i = 0; i < data.length; i += stepPx) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const a = data[i + 3]
            if (a < 128) continue // transparent

            const { h, s, v } = rgbToHsv(r, g, b)

            // Ignore near-greys but keep vibrant lights
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
    if (currentTrack?.albumArt) {
      extractDominantColor(currentTrack.albumArt).then(color => {
        setDominantColor(color)
      })
    }
  }, [currentTrack?.albumArt, extractDominantColor])

  if (!currentTrack) {
    return null
  }

  return (
    <>
      <AnimatePresence>
        <motion.div
          key="player-bar"
          className="h-16 relative flex items-center px-4"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Track Info (left) */}
          <div className="flex items-center min-w-0 max-w-sm group flex-shrink-0" style={{ width: 280 }}>
            <Avatar className="h-10 w-10 rounded-md flex-shrink-0">
              <AvatarImage src={currentTrack.albumArt || "/placeholder.svg"} alt={currentTrack.title} />
              <AvatarFallback className="rounded-md">{(currentTrack.title || 'T').charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col justify-center min-w-0 ml-3">
              <span className="text-[15px] leading-tight font-medium truncate">{currentTrack.title}</span>
              {playbackError ? (
                <span className="text-xs text-amber-500 truncate">{playbackError}</span>
              ) : (
                <span className="text-xs text-muted-foreground truncate">{currentTrack.artist}</span>
              )}
            </div>
            <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity">
              <SongActions
                track={currentTrack}
                size="sm"
                variant="ghost"
                className="gap-1"
              />
            </div>
          </div>

          {/* Player Controls (center, absolutely centered) */}
          <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full flex flex-col items-center justify-center w-[480px] max-w-[60vw]">
            <div className="flex items-center space-x-1 mb-[8px]">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleShuffle}
                className={cn("h-8 w-8 opacity-70 hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-colors duration-200", shuffle && "text-primary opacity-100")}
              >
                <Shuffle className="w-3 h-3" />
              </Button>
              <Button variant="ghost" size="icon" onClick={previousTrack} className="h-8 w-8 opacity-70 hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-colors duration-200">
                <SkipBack className="w-3 h-3" />
              </Button>
              <Button
                variant="default"
                size="icon"
                onClick={togglePlay}
                className="h-8 w-8 rounded-full border-none shadow-none p-0 flex items-center justify-center"
                style={{
                  background: 'transparent',
                  boxShadow: 'none',
                }}
              >
                {isPlaying ? (
                  <img key="pause-icon" src="/pause blue.png" alt="Pause" className="w-5 h-5" />
                ) : (
                  <img key="play-icon" src="/play blue.png" alt="Play" className="w-5 h-5" />
                )}
              </Button>
              <Button variant="ghost" size="icon" onClick={nextTrack} className="h-8 w-8 opacity-70 hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-colors duration-200">
                <SkipForward className="w-3 h-3" />
              </Button>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleRepeat}
                  className={cn(
                    "h-8 w-8 transition-colors duration-200 relative hover:bg-blue-500/10 hover:text-blue-500",
                    repeat !== "none" ? "text-primary opacity-100" : "opacity-70"
                  )}
                >
                  <motion.div
                    animate={{
                      rotate: repeat !== "none" ? [0, 360] : 0,
                    }}
                    transition={{
                      duration: 0.6,
                      ease: "easeInOut",
                      times: [0, 1]
                    }}
                    key={repeat} // Re-trigger animation when repeat state changes
                  >
                    <Repeat className="w-3 h-3" />
                  </motion.div>
                  {/* Repeat One Indicator - Small dot at bottom center with animation */}
                  <AnimatePresence>
                    {repeat === "one" && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className="absolute bottom-0 left-[48%] w-1 h-1 bg-primary rounded-full"
                      ></motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-3 w-full">
              <span className="text-xs text-muted-foreground w-10 text-right text-[9px]">{formatTime(currentTime)}</span>
              <div className="flex-1 group">
                <PillProgressBar
                  value={currentTime}
                  max={duration}
                  height={3.5}
                  gradient="linear-gradient(90deg, #00bfff, #1e90ff)"
                  background="#444"
                  onChange={seekTo}
                  className="flex-1 cursor-pointer"
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-[9px]">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Volume & Additional Controls (right) */}
          <div className="flex items-center space-x-1 ml-auto">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setShowLyrics(true)}
              className={cn(
                "h-8 w-8 opacity-70 hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-colors duration-200",
                showLyrics && "text-primary opacity-100"
              )}
            >
              <Mic2 className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-colors duration-200">
              <List className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-colors duration-200">
              <Headphones className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleVolumeToggle} className="h-8 w-8 opacity-70 hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-colors duration-200">
              {isMuted || volume === 0 ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-20 flex items-center">
                <PillProgressBar
                  value={volume}
                  max={1}
                  height={3.5}
                  gradient="linear-gradient(90deg, #00bfff, #1e90ff)"
                  background="#444"
                  onChange={setVolume}
                />
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-colors duration-200">
              <PictureInPicture2 className="w-3 h-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn(
                "h-8 w-8 opacity-70 hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-colors duration-200",
                showNowPlaying && "text-primary opacity-100"
              )}
              onClick={onToggleNowPlaying}
            >
              <Music className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-colors duration-200">
              <Maximize2 className="w-3 h-3" />
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Lyrics Dialog */}
      {currentTrack && (
        <LyricsDialog
          isOpen={showLyrics}
          onClose={() => setShowLyrics(false)}
          trackTitle={currentTrack.title}
          trackArtist={currentTrack.artist}
          albumArt={currentTrack.albumArt}
          dominantColor={dominantColor}
        />
      )}
    </>
  )
}
