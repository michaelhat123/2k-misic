"use client"

import { useState } from "react"
import { Download, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { downloadApi } from "@/lib/api/download"
import { toast } from "sonner"

interface DownloadButtonProps {
  spotifyUrl: string
  trackTitle: string
  trackArtist: string
  size?: "sm" | "md" | "lg"
  variant?: "icon" | "button"
  disabled?: boolean
  externalIsDownloading?: boolean
  onDownloadComplete?: () => void
  onStopDownload?: () => void
}

export function DownloadButton({
  spotifyUrl,
  trackTitle,
  trackArtist,
  size = "md",
  variant = "icon",
  disabled = false,
  externalIsDownloading = false,
  onDownloadComplete,
  onStopDownload,
}: DownloadButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadStatus, setDownloadStatus] = useState<"idle" | "downloading" | "success" | "error">("idle")
  const [progress, setProgress] = useState(0)

  // Use external download state if provided, otherwise use internal state
  const activelyDownloading = externalIsDownloading || isDownloading

  const handleDownload = async () => {
    // If already downloading, stop it
    if (activelyDownloading) {
      if (onStopDownload) {
        onStopDownload()
      } else {
        setIsDownloading(false)
        setDownloadStatus('idle')
        setProgress(0)
      }
      toast.info('Download cancelled')
      return
    }
    
    // Get local music folder from localStorage (set in settings)
    const localMusicFolder = localStorage.getItem("watchedMusicFolder")

    if (!localMusicFolder) {
      toast.error("Please set your local music folder in Settings first", {
        description: "Go to Settings → Local Files to set your music folder"
      })
      return
    }

    setIsDownloading(true)
    setDownloadStatus("downloading")
    setProgress(0)

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev
        return prev + 10
      })
    }, 500)

    try {
      const response = await downloadApi.downloadToFolder({
        spotifyUrl,
        localMusicFolder,
        quality: "m4a",
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (response.success) {
        setDownloadStatus("success")
        toast.success(`Downloaded: ${trackTitle}`, {
          description: `Saved to your local music folder`,
        })

        // Trigger folder rescan after 1 second
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent("rescanLocalFolder"))
          onDownloadComplete?.()
        }, 1000)

        // Reset after 3 seconds
        setTimeout(() => {
          setDownloadStatus("idle")
          setIsDownloading(false)
          setProgress(0)
        }, 3000)
      } else {
        throw new Error(response.error || "Download failed")
      }
    } catch (error: any) {
      clearInterval(progressInterval)
      setDownloadStatus("error")
      setProgress(0)
      
      toast.error("Download failed", {
        description: error.message || "Please try again",
      })

      // Reset after 3 seconds
      setTimeout(() => {
        setDownloadStatus("idle")
        setIsDownloading(false)
      }, 3000)
    }
  }

  const iconSize = size === "sm" ? 16 : size === "md" ? 20 : 24
  const buttonSize = size === "sm" ? "h-8 w-8" : size === "md" ? "h-10 w-10" : "h-12 w-12"

  const getIcon = () => {
    switch (downloadStatus) {
      case "downloading":
        return <Loader2 size={iconSize} className="animate-spin" />
      case "success":
        return <CheckCircle2 size={iconSize} className="text-green-500" />
      case "error":
        return <AlertCircle size={iconSize} className="text-red-500" />
      default:
        return <Download size={iconSize} />
    }
  }

  const getButtonColor = () => {
    switch (downloadStatus) {
      case "downloading":
        return "bg-blue-500/20 hover:bg-blue-500/30 text-blue-400"
      case "success":
        return "bg-green-500/20 hover:bg-green-500/30 text-green-400"
      case "error":
        return "bg-red-500/20 hover:bg-red-500/30 text-red-400"
      default:
        return "bg-white/10 hover:bg-white/20 text-white"
    }
  }

  if (variant === "button") {
    return (
      <button
        onClick={handleDownload}
        disabled={disabled && !activelyDownloading}
        className={`
          relative flex items-center gap-2 px-4 py-2 rounded-lg
          transition-all duration-200
          ${getButtonColor()}
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={activelyDownloading ? "Stop downloading" : `Download ${trackTitle}`}
      >
        {getIcon()}
        <span className="text-sm font-medium">
          {activelyDownloading && "Stop downloading"}
          {downloadStatus === "success" && "Downloaded"}
          {downloadStatus === "error" && "Failed"}
          {downloadStatus === "idle" && "Download"}
        </span>
        
        {/* Progress bar */}
        {downloadStatus === "downloading" && (
          <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-300 rounded-b-lg"
               style={{ width: `${progress}%` }} />
        )}
      </button>
    )
  }

  return (
    <button
      onClick={handleDownload}
      disabled={disabled && !isDownloading}
      className={`
        relative ${buttonSize} rounded-full
        flex items-center justify-center
        transition-all duration-200
        ${getButtonColor()}
        disabled:opacity-50 disabled:cursor-not-allowed
      `}
      title={isDownloading ? "Stop downloading" : `Download ${trackTitle} by ${trackArtist}`}
    >
      {getIcon()}
      
      {/* Circular progress indicator */}
      {downloadStatus === "downloading" && (
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeDasharray={`${progress * 2.83} 283`}
            className="text-blue-400 transition-all duration-300"
          />
        </svg>
      )}
    </button>
  )
}
