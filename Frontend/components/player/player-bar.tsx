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
  className="h-8 w-8 rounded-full border-none shadow-none p-0"
  style={{
    background: 'linear-gradient(90deg, #00bfff, #1e90ff)',
    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.10)',
  }}
>
              {isPlaying ? (
  <Pause className="w-3 h-3" style={{ color: '#222222' }} />
) : (
  <Play className="w-3 h-3 ml-0.5" style={{ color: '#222222' }} />
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
          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-70 hover:opacity-100 hover:bg-blue-500/10 hover:text-blue-500 transition-colors duration-200">
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
  )
}
