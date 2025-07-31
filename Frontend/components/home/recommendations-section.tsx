"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion } from "framer-motion"
import { Sparkles, Play, Heart, Plus } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { recommendationsApi } from "@/lib/api/recommendations"
import { usePlayer } from "../player/player-provider"

export function RecommendationsSection() {
  const { playTrack } = usePlayer()

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => recommendationsApi.getRecommendations(),
  })

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5" />
            Made for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2 animate-pulse">
                <div className="aspect-square bg-muted rounded-lg"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
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
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5 text-primary" />
            Made for You
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {(Array.isArray(recommendations) ? recommendations : []).slice(0, 6).map((track: any, index: any) => (
              <motion.div
                key={track.id}
                className="group cursor-pointer"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => playTrack(track)}
              >
                <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                  <Avatar className="w-full h-full rounded-lg">
                    <AvatarImage
                      src={track.image || track.albumArt || "/placeholder.svg"}
                      alt={track.name || track.title}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-lg text-2xl">{(track.name || track.title || 'T').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button size="icon" className="rounded-full">
                      <Play className="h-5 w-5" />
                    </Button>
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 bg-black/50 hover:bg-black/70">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="font-medium truncate">{track.name || track.title}</h3>
                <p className="text-sm text-muted-foreground truncate">{track.artist}</p>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
