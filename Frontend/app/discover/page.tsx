"use client"

import { useState } from "react"
import { MusicDiscovery } from "@/components/discovery/music-discovery"
import { GenreDetailView } from "@/components/discovery/genre-detail-view"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Radio } from "lucide-react"

export default function DiscoverPage() {
  const [selectedGenre, setSelectedGenre] = useState<{
    name: string
    artist: string
    spotifyId: string
  } | null>(null)

  const handleCategorySelect = (genreName: string, artistName: string, spotifyId: string) => {
    setSelectedGenre({ name: genreName, artist: artistName, spotifyId })
  }

  const handleBack = () => {
    setSelectedGenre(null)
  }

  // Show genre detail view if a genre is selected
  if (selectedGenre) {
    return (
      <div className="flex flex-col h-full">
        <GenreDetailView
          genreName={selectedGenre.name}
          artistName={selectedGenre.artist}
          spotifyId={selectedGenre.spotifyId}
          onBack={handleBack}
        />
      </div>
    )
  }

  // Show main discovery page
  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1">
        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center">
              <Radio className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">Discover Music</h1>
              <p className="text-gray-400">Explore new genres and artists</p>
            </div>
          </div>
        </div>

        {/* Music Discovery Content */}
        <div className="px-6 pb-6">
          <MusicDiscovery onCategorySelect={handleCategorySelect} />
        </div>
      </ScrollArea>
    </div>
  )
}
