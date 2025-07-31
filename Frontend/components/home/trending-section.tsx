"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { Play, MoreHorizontal, TrendingUp } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { usePlayer } from "../player/player-provider"
import { useAuthGuard } from "@/hooks/use-auth-guard"

export function TrendingSection() {
  const { playTrack } = usePlayer()
  const { isAuthenticated, hasValidToken } = useAuthGuard()

  const { data: trendingTracks, isLoading } = useQuery({
    queryKey: ["trending"],
    enabled: isAuthenticated && hasValidToken, // Only run query when properly authenticated
    queryFn: async () => {
      try {
        // Call the recommendations trending endpoint instead of search popular
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/recommendations/trending`, {
          headers: {
            ...(localStorage.getItem("firebase_token") && { 
              Authorization: `Bearer ${localStorage.getItem("firebase_token")}` 
            }),
          },
        });

        if (!response.ok) {
          console.error('❌ Trending API failed:', response.status);
          return []; // Return empty array to prevent crashes
        }

        const data = await response.json();
        
        // Debug: Log the actual data structure

        if (Array.isArray(data) && data.length > 0) {
  
        }
        
        // Ensure we return an array to prevent .slice() crashes
        if (!Array.isArray(data)) {
          console.error('❌ Trending API returned non-array:', typeof data);
          return [];
        }

        return data;
      } catch (error) {
        console.error('❌ Error fetching trending tracks:', error);
        return []; // Return empty array on error to prevent crashes
      }
    },
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Trending Now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-md"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Trending Now
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(Array.isArray(trendingTracks) ? trendingTracks : []).slice(0, 10).map((track: any, index: any) => (
              <motion.div
                key={track.id}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => playTrack(track)}
              >
                <div className="flex items-center justify-center w-6 text-sm font-medium text-muted-foreground">
                  {index + 1}
                </div>
                <Avatar className="h-12 w-12 rounded-md">
                  <AvatarImage src={track.image || track.albumArt || "/placeholder.svg"} alt={track.name || track.title} />
                  <AvatarFallback className="rounded-md">{(track.name || track.title || track.artist || 'T').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{track.name || track.title}</p>
                  <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                </div>
                <div className="text-sm text-muted-foreground">{track.duration}</div>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
