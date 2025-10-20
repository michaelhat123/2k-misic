"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { Clock, Play, MoreHorizontal } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { userApi } from "@/lib/api/user"
import { usePlayer } from "../player/player-provider"
import { useAuth } from "../auth/auth-provider"

export function RecentlyPlayedSection() {
  const { playTrack } = usePlayer()
  const { user } = useAuth()

  const { data: recentTracks, isLoading } = useQuery({
    queryKey: ["recent-tracks"],
    queryFn: () => userApi.getRecentlyPlayed(),
    enabled: !!user, // Only run when user is authenticated
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5" />
            Recently Played
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-16 h-16 bg-muted rounded-lg"></div>
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
      transition={{ duration: 0.5, delay: 0.6 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5 text-primary" />
            Recently Played
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(Array.isArray(recentTracks) ? recentTracks : []).slice(0, 4).map((track: any, index: any) => (
              <motion.div
                key={track.id}
                className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => playTrack(track)}
              >
                <Avatar className="h-16 w-16 rounded-lg">
                  <AvatarImage src={track.image || track.albumArt || "/placeholder.svg"} alt={track.name || track.title} />
                  <AvatarFallback className="rounded-lg text-lg">{(track.name || track.title || 'T').charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">{track.name || track.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
                  <p className="text-xs text-muted-foreground">{track.album}</p>
                </div>
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
