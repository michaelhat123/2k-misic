"use client"

import React from 'react'

interface SongSkeletonProps {
  count?: number
}

export function SongSkeleton({ count = 5 }: SongSkeletonProps) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 p-3 rounded-lg animate-pulse"
        >
          {/* Index */}
          <div className="w-8 h-4 bg-muted rounded"></div>

          {/* Album Art */}
          <div className="h-12 w-12 bg-muted rounded-md"></div>

          {/* Song Info */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted/70 rounded w-1/2"></div>
          </div>

          {/* Album */}
          <div className="hidden md:block w-48">
            <div className="h-3 bg-muted/70 rounded w-2/3"></div>
          </div>

          {/* Date */}
          <div className="hidden lg:block w-32">
            <div className="h-3 bg-muted/70 rounded w-1/2"></div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-muted rounded"></div>
            <div className="w-12 h-3 bg-muted/70 rounded"></div>
            <div className="w-8 h-8 bg-muted rounded"></div>
          </div>
        </div>
      ))}
    </div>
  )
}
