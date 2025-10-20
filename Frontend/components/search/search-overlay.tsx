"use client"

import { motion, AnimatePresence } from "framer-motion"
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchResults } from "./search-results"
import { useSearch } from "../layout/top-navigation"
import { Loader2, Search, Music } from "lucide-react"
import { BrandedLoader } from "@/components/ui/BrandedLoader"

export function SearchOverlay() {
  const { searchQuery, searchResults, isSearching, clearSearch } = useSearch()

  if (!searchQuery.trim()) {
    return null
  }

  return (
    <div className="absolute inset-0 bg-background z-[100] rounded-lg pointer-events-auto overflow-auto">
      <div className="w-full h-full px-6 py-6">
        {/* Loading State */}
        {isSearching && (
          <div className="flex items-center justify-center h-full">
            <BrandedLoader size="md" showText={false} />
          </div>
        )}

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
    </div>
  )
}
