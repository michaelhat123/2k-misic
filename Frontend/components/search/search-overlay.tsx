"use client"

import { motion, AnimatePresence } from "framer-motion"
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SearchResults } from "./search-results"
import { useSearch } from "../layout/top-navigation"
import { Loader2, Search, Music } from "lucide-react"

export function SearchOverlay() {
  const { searchQuery, searchResults, isSearching, clearSearch } = useSearch()

  if (!searchQuery.trim()) {
    return null
  }

  return (
    <AnimatePresence>
      <SimpleBar className="absolute inset-0 bg-background z-50 rounded-lg" style={{ maxHeight: '100%' }} autoHide={false}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
        <div className="container mx-auto px-6 py-6">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Loading Animation - Three animated dots - Vertically centered */}
            {isSearching && (
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            )}

            {/* Search Results - Show instantly */}
            {!isSearching && searchResults && (
              <SearchResults 
                results={searchResults} 
                isLoading={false} 
                query={searchQuery} 
                type="all" 
              />
            )}

            {/* No Results - Only show if not searching and no results */}
            {!isSearching && searchResults && 
             (!searchResults.tracks?.length && 
              !searchResults.artists?.length && 
              !searchResults.albums?.length && 
              !searchResults.users?.length && 
              !searchResults.playlists?.length) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Music className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Try searching with different keywords, check your spelling, or search for artists, songs, or albums.
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>
      </SimpleBar>
     </AnimatePresence>
  )
}
