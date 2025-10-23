"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SearchResults } from "./search-results"
import { useSearch } from "../layout/top-navigation"
import { Loader2, Search, Music } from "lucide-react"
import { BrandedLoader } from "@/components/ui/BrandedLoader"
import { useState, useEffect } from "react"

export function SearchOverlay() {
  const { searchQuery, searchResults, isSearching, clearSearch } = useSearch()
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  // Listen for Now Playing Sidebar expansion
  useEffect(() => {
    const handleSidebarExpand = (e: any) => {
      setIsSidebarExpanded(e.detail.expanded)
    }
    window.addEventListener('npv:expanded', handleSidebarExpand)
    return () => window.removeEventListener('npv:expanded', handleSidebarExpand)
  }, [])

  if (!searchQuery.trim()) {
    return null
  }

  return (
    <div 
      className="absolute bg-background z-[100] rounded-lg pointer-events-auto overflow-hidden"
      style={{
        top: 0,
        left: 0,
        bottom: 0,
        right: isSidebarExpanded ? '500px' : '0',
        transition: 'right 0.3s ease-in-out'
      }}
    >
      {/* Loading State - Fixed Position for Centering */}
      {isSearching && (
        <div className="absolute inset-0 flex items-center justify-center">
          <BrandedLoader size="md" showText={false} />
        </div>
      )}
      
      <ScrollArea className="h-full w-full" style={{ touchAction: 'pan-y' }}>
        <div className="px-6 py-6" style={{ touchAction: 'auto' }}>

        {/* Search Results */}
        {!isSearching && searchResults && (
          <SearchResults 
            results={searchResults} 
            isLoading={false} 
            query={searchQuery} 
            type="all" 
          />
        )}

        {/* No Results */}
        {!isSearching && searchResults && 
         (!searchResults.tracks?.length && 
          !searchResults.artists?.length && 
          !searchResults.albums?.length && 
          !searchResults.users?.length && 
          !searchResults.playlists?.length) && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Music className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground max-w-md">
              Try searching with different keywords, check your spelling, or search for artists, songs, or albums.
            </p>
          </div>
        )}
        </div>
      </ScrollArea>
    </div>
  )
}
