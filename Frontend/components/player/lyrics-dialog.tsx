"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { lyricsApi, LyricsResponse } from '@/lib/api/lyrics'
import { VisuallyHidden } from '@/components/ui/visually-hidden'

interface LyricsDialogProps {
  isOpen: boolean
  onClose: () => void
  trackTitle: string
  trackArtist: string
  albumArt?: string
  dominantColor?: string
}

export function LyricsDialog({
  isOpen,
  onClose,
  trackTitle,
  trackArtist,
  albumArt,
  dominantColor = '#3b82f6'
}: LyricsDialogProps) {
  const [lyrics, setLyrics] = useState<LyricsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progressStep, setProgressStep] = useState<string>('Searching')
  const lastFetchedTrack = useRef<string>('')
  const clientIdRef = useRef<string>('')

  // Create gradient style from dominant color (same as artist-detail-view)
  const createGradientStyle = useCallback((dominantColor: string) => {
    const iconicDarkBlue = '#0a0a1a';
    const mediumDarkBlue = '#1a1a2e';
    
    const rgbMatch = dominantColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      const accentR = Math.floor(r * 0.4);
      const accentG = Math.floor(g * 0.4);
      const accentB = Math.floor(b * 0.4);
      
      return {
        background: `linear-gradient(135deg, 
          ${iconicDarkBlue} 0%, 
          ${mediumDarkBlue} 30%, 
          rgb(${accentR}, ${accentG}, ${accentB}) 70%, 
          ${iconicDarkBlue} 100%)`
      };
    }
    
    return {
      background: `linear-gradient(135deg, ${iconicDarkBlue} 0%, ${mediumDarkBlue} 50%, ${iconicDarkBlue} 100%)`
    };
  }, [])

  useEffect(() => {
    const trackKey = `${trackTitle}|${trackArtist}`
    
    if (isOpen && trackTitle && trackArtist && lastFetchedTrack.current !== trackKey) {
      lastFetchedTrack.current = trackKey
      
      setIsLoading(true)
      setError(null)
      setProgressStep('Searching')

      // Connect WebSocket for progress updates
      lyricsApi.connectSocket((step: string) => {
        setProgressStep(step)
      }).then((clientId) => {
        clientIdRef.current = clientId

        // Make request with connected socket ID
        lyricsApi.searchLyrics(trackTitle, trackArtist, clientId)
          .then(data => {
            setLyrics(data)
            setIsLoading(false)
            setProgressStep('Complete')
            lyricsApi.disconnectSocket()
          })
          .catch(err => {
            setError(err.response?.data?.message || 'Failed to fetch lyrics')
            setIsLoading(false)
            setProgressStep('Error')
            lyricsApi.disconnectSocket()
          })
      })
    }

    if (!isOpen) {
      lastFetchedTrack.current = ''
      setLyrics(null)
      setError(null)
      setProgressStep('Searching')
      lyricsApi.disconnectSocket()
    }
  }, [isOpen, trackTitle, trackArtist])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl h-[80vh] p-0 gap-0 backdrop-blur-md rounded-2xl shadow-2xl"
        style={{
          ...createGradientStyle(dominantColor),
          borderColor: `${dominantColor}40`,
          borderWidth: '1px'
        }}
      >
        <VisuallyHidden>
          <DialogTitle>Lyrics for {trackTitle}</DialogTitle>
          <DialogDescription>
            View the lyrics for {trackTitle} by {trackArtist}
          </DialogDescription>
        </VisuallyHidden>
        <div className="relative h-full flex flex-col pt-12">

          {/* Content */}
          <ScrollArea className="h-[calc(80vh-80px)] homepage-scroll [&>div>div[style]]:!pr-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-48 px-6 gap-4">
                <div className="text-white/90 text-xl font-medium">
                  {progressStep}<span className="animate-pulse">...</span>
                </div>
              </div>
            ) : error ? (
              <div className="p-6 text-center">
                <AlertCircle className="h-10 w-10 text-red-400 mb-4 mx-auto" />
                <p className="text-white/70 mb-4">{error}</p>
                <button
                  onClick={() => {
                    lastFetchedTrack.current = ''
                    setError(null)
                    setLyrics(null)
                  }}
                  className="px-4 py-2 rounded-lg transition-colors"
                  style={{ 
                    backgroundColor: dominantColor,
                    color: 'white'
                  }}
                >
                  Try Again
                </button>
              </div>
            ) : (
              <div className="px-8 pb-8 space-y-8">
                {/* Track Header - Left aligned */}
                <div className="flex items-center gap-4 pt-4 pb-4">
                  {albumArt && (
                    <img 
                      src={albumArt} 
                      alt="Album art" 
                      className="w-16 h-16 rounded-lg object-cover shadow-lg"
                      style={{
                        borderColor: `${dominantColor}60`,
                        borderWidth: '2px'
                      }}
                    />
                  )}
                  <div>
                    <h2 className="text-2xl font-bold text-white">{trackTitle}</h2>
                    <p className="text-white/70">{trackArtist}</p>
                  </div>
                </div>

                {lyrics?.found === false && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-10 w-10 text-yellow-400 mb-4" />
                    <p className="text-white/70 text-center">
                      {lyrics.message || 'Lyrics not found for this track'}
                    </p>
                  </div>
                )}

                {lyrics?.restricted && (
                  <div className="flex flex-col items-center justify-center py-12 px-8">
                    <AlertCircle className="h-10 w-10 text-orange-400 mb-4" />
                    <p className="text-white/90 text-center text-lg font-semibold mb-2">
                      Lyrics Not Available
                    </p>
                    <p className="text-white/70 text-center">
                      {lyrics.copyright || 'These lyrics are restricted due to copyright.'}
                    </p>
                    <p className="text-white/50 text-center text-sm mt-4">
                      Try searching for a different song or check Musixmatch directly.
                    </p>
                  </div>
                )}

                {lyrics?.found && !lyrics?.restricted && lyrics?.lyrics && (
                  <div className="space-y-6">
                    <div className="text-zinc-300 leading-[2] text-center px-4">
                      {lyrics.lyrics.split('\n\n').map((verse, verseIndex) => (
                        <div key={verseIndex} className="mb-8">
                          {verse.split('\n').map((line, lineIndex) => (
                            <div key={lineIndex} className="text-lg">
                              {line}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
