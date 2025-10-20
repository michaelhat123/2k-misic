'use client'

import React from 'react'
import { X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

// Load Google Fonts
if (typeof window !== 'undefined') {
  const link = document.createElement('link')
  link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&display=swap'
  link.rel = 'stylesheet'
  if (!document.querySelector(`link[href="${link.href}"]`)) {
    document.head.appendChild(link)
  }
}

interface DownloadToastProps {
  isVisible: boolean
  albumArt?: string
  title: string
  artist: string
  status: string
  progress: number
  onClose: () => void
}

export function DownloadToast({
  isVisible,
  albumArt,
  title,
  artist,
  status,
  progress,
  onClose
}: DownloadToastProps) {
  // Get viewport dimensions for drag constraints
  const getConstraints = () => {
    if (typeof window === 'undefined') return {}
    return {
      top: -window.innerHeight + 200,
      left: -window.innerWidth + 350,
      right: window.innerWidth - 350,
      bottom: window.innerHeight - 200
    }
  }
  
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.1}
          dragConstraints={getConstraints()}
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-20 left-6 z-[9999] w-[320px] cursor-pointer"
        >
          <div className="bg-background backdrop-blur-md border border-border rounded-xl shadow-2xl overflow-hidden">
            {/* Main Content */}
            <div className="p-4 flex gap-4">
              {/* Album Art */}
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-lg overflow-hidden shadow-lg ring-2 ring-white/10">
                  {albumArt ? (
                    <img 
                      src={albumArt} 
                      alt={title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/50" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="text-base font-bold text-white truncate mb-1" style={{ fontFamily: "'Poppins', 'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                  {title}
                </h3>
                <p className="text-sm text-white/60 truncate" style={{ fontFamily: "'Poppins', 'Inter', sans-serif", fontWeight: 500 }}>
                  {artist}
                </p>
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/60 hover:text-white self-start"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar Container with padding to align with content */}
            <div className="px-4">
              <div className="relative h-1.5 bg-white/10 overflow-hidden rounded-full">
                <motion.div 
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ background: 'linear-gradient(90deg, #00bfff, #1e90ff)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </div>
            </div>

            {/* Status Footer */}
            <div className="px-4 pt-3 pb-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Downloading
              </span>
              <span className="text-xs text-muted-foreground">
                {progress}%
              </span>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
