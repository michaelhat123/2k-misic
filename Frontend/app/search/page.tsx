"use client";

import { useState, useEffect } from "react"
import { MainLayout } from "@/components/layout/main-layout"
import { SearchResults } from "@/components/search/search-results"
import { SearchFilters } from "@/components/search/search-filters"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Search, TrendingUp, Clock } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { searchApi } from "@/lib/api/search"
import { debounce } from "@/lib/utils"
import { motion } from "framer-motion"

// Force dynamic rendering to prevent static generation
export const dynamic = 'force-dynamic'

export default function SearchPage() {
  const [query, setQuery] = useState("")
  const [searchType, setSearchType] = useState("all")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  const debouncedSearch = debounce((value: string) => {
    setDebouncedQuery(value)
  }, 300)

  useEffect(() => {
    debouncedSearch(query)
  }, [query, debouncedSearch])

  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["search", debouncedQuery, searchType],
    queryFn: () => searchApi.search(debouncedQuery, searchType),
    enabled: debouncedQuery.length > 0,
  })

  const { data: popularSearches } = useQuery({
    queryKey: ["popular-searches"],
    queryFn: () => searchApi.getPopular(),
    enabled: !debouncedQuery,
  })

  return (
    <MainLayout>
      <div className="space-y-6">
        <SearchResults 
          results={searchResults} 
          isLoading={isLoading} 
          query={debouncedQuery} 
          type={searchType}
          searchQuery={query}
          onSearchQueryChange={setQuery}
        />
        
        {!debouncedQuery && (
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {/* Trending Searches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="mr-2 h-5 w-5 text-primary" />
                  Trending Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {popularSearches?.popularSearches?.slice(0, 10).map((term: any, index: any) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setQuery(term)}
                      className="rounded-full"
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Recent Searches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Your recent searches will appear here</p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </MainLayout>
  )
}
