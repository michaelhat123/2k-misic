"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { motion } from "framer-motion"
import { Play, Shuffle } from "lucide-react"
import Image from "next/image"

export function HeroSection() {
  return (
    <motion.section
      className="relative overflow-hidden rounded-2xl"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-0 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
        <CardContent className="p-8">
          <div className="flex items-center justify-between">
            <div className="space-y-4 max-w-md">
              <motion.h1
                className="text-4xl font-bold gradient-text"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Welcome to 2k Music
              </motion.h1>
              <motion.p
                className="text-lg text-muted-foreground"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Discover millions of songs, create playlists, and connect with music lovers worldwide.
              </motion.p>
              <motion.div
                className="flex space-x-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Button size="lg" className="neomorphism">
                  <Play className="mr-2 h-5 w-5" />
                  Start Listening
                </Button>
                <Button variant="outline" size="lg">
                  <Shuffle className="mr-2 h-5 w-5" />
                  Shuffle Play
                </Button>
              </motion.div>
            </div>
            <motion.div
              className="hidden md:block"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="relative w-64 h-64">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-600 rounded-full opacity-20 animate-pulse"></div>
                <div
                  className="absolute inset-4 bg-gradient-to-br from-primary to-blue-600 rounded-full opacity-40 animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                ></div>
                <div
                  className="absolute inset-8 bg-gradient-to-br from-primary to-blue-600 rounded-full opacity-60 animate-pulse"
                  style={{ animationDelay: "1s" }}
                ></div>
                <Image
                  src="/placeholder.svg?height=200&width=200"
                  alt="Music Visualization"
                  width={200}
                  height={200}
                  className="absolute inset-12 rounded-full"
                />
              </div>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.section>
  )
}
