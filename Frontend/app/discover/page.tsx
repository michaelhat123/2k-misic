"use client"

import { MusicDiscovery } from "@/components/discovery/music-discovery"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Radio } from "lucide-react"

export default function DiscoverPage() {
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
          <MusicDiscovery onCategorySelect={() => {}} />
        </div>
      </ScrollArea>
    </div>
  )
}
