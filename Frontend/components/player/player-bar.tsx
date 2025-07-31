"use client"

import { useState } from "react"
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
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatTime } from "@/lib/utils"

export function PlayerBar() {
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
  } = usePlayer()

  const [isMuted, setIsMuted] = useState(false)
  const [previousVolume, setPreviousVolume] = useState(volume)

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

  if (!currentTrack) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
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
            <span className="text-xs text-muted-foreground truncate">{currentTrack.artist}</span>
          </div>
          <span
            className="ml-3 flex items-center justify-center rounded-full transition bg-transparent group-hover:bg-[#222] group-hover:opacity-100 opacity-70 w-6 h-6 cursor-pointer"
            tabIndex={0}
            role="button"
            aria-label="Add to Liked Songs"
          >
            <PlusCircle className="h-4 w-4" />
          </span>
        </div>

        {/* Player Controls (center, absolutely centered) */}
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full flex flex-col items-center justify-center w-[480px] max-w-[60vw]">
          <div className="flex items-center space-x-1 mb-[8px]">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleShuffle}
              className={cn("h-7 w-7 opacity-70 hover:opacity-100 transition-opacity", shuffle && "text-primary opacity-100")}
            >
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={previousTrack} className="h-7 w-7 opacity-70 hover:opacity-100 transition-opacity">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
  variant="default"
  size="icon"
  onClick={togglePlay}
  className="h-8 w-8 rounded-full border-none shadow-none p-0"
  style={{
    background: 'linear-gradient(90deg, #00bfff, #1e90ff)',
    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
  }}
>
              {isPlaying ? (
  <Pause className="h-4 w-4" style={{ color: '#222222' }} />
) : (
  <Play className="h-4 w-4 ml-0.5" style={{ color: '#222222' }} />
)}
            </Button>
            <Button variant="ghost" size="icon" onClick={nextTrack} className="h-7 w-7 opacity-70 hover:opacity-100 transition-opacity">
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleRepeat}
              className={cn("h-7 w-7 opacity-70 hover:opacity-100 transition-opacity", repeat !== "none" && "text-primary opacity-100")}
            >
              <Repeat className="h-4 w-4" />
            </Button>
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
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity">
            <Mic2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity">
            <List className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity">
            <Headphones className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleVolumeToggle} className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity">
            {isMuted || volume === 0 ? <VolumeX className="h-3 w-3" /> : <Volume2 className="h-3 w-3" />}
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
                className="w-full cursor-pointer"
              />
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity">
            <PictureInPicture2 className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-70 hover:opacity-100 transition-opacity">
            <Maximize2 className="h-3 w-3" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
