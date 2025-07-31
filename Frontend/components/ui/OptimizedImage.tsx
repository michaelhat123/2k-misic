"use client"

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface OptimizedImageProps {
  src: string
  alt: string
  className?: string
  fallbackChar?: React.ReactNode
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
  isArtist?: boolean
}

// Image cache for instant loading
const imageCache = new Map<string, boolean>()

// Image preloader function
const preloadImage = (src: string): Promise<void> => {
  if (imageCache.has(src)) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      imageCache.set(src, true)
      resolve()
    }
    img.onerror = reject
    img.src = src
  })
}

// Optimized image component with lazy loading and caching
export function OptimizedImage({ 
  src, 
  alt, 
  className = "", 
  fallbackChar = "?",
  priority = false,
  onLoad,
  onError,
  isArtist = false
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(imageCache.has(src))
  const [isInView, setIsInView] = useState(priority)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || isInView) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before coming into view
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority, isInView])

  // Preload image when in view
  useEffect(() => {
    if (!isInView || isLoaded) return

    preloadImage(src)
      .then(() => {
        setIsLoaded(true)
        onLoad?.()
      })
      .catch(() => {
        setHasError(true)
        onError?.()
      })
  }, [isInView, src, isLoaded, onLoad, onError])

  return (
    <div ref={imgRef} className={className}>
      {isLoaded && !hasError ? (
        <div className={`w-full h-full overflow-hidden ${isArtist ? 'rounded-full' : 'rounded-lg'}`}>
          <img 
            src={src} 
            alt={alt}
            className="w-full h-full object-cover"
            loading={priority ? "eager" : "lazy"}
          />
        </div>
      ) : (
        <div className={`w-full h-full bg-muted flex items-center justify-center animate-pulse ${isArtist ? 'rounded-full' : 'rounded-lg'}`}>
          <span className="text-muted-foreground text-xl">{fallbackChar}</span>
        </div>
      )}
    </div>
  )
}

// Batch image preloader for homepage sections
export const batchPreloadImages = async (imageSrcs: string[], batchSize = 5): Promise<void> => {
  const batches = []
  for (let i = 0; i < imageSrcs.length; i += batchSize) {
    batches.push(imageSrcs.slice(i, i + batchSize))
  }

  for (const batch of batches) {
    await Promise.allSettled(batch.map(src => preloadImage(src)))
    // Small delay between batches to prevent browser overload
    await new Promise(resolve => setTimeout(resolve, 50))
  }
}
