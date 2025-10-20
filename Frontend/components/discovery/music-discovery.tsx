"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OptimizedImage } from "@/components/ui/OptimizedImage"
import { motion } from "framer-motion"
import { Music, Headphones, Mic2, Guitar, Piano, Drum, Volume2, Home, Star, Waves, Zap } from "lucide-react"

// 50 Music Categories with Representative Artists and Spotify IDs
const musicCategories = [
  // Pop & Mainstream
  { id: 1, name: "Pop Hits", artist: "Taylor Swift", spotifyId: "06HL4z0CvFAxyc27GXpf02", color: "from-pink-500 to-purple-600", icon: Music },
  { id: 2, name: "Dance Pop", artist: "Dua Lipa", spotifyId: "6M2wZ9GZgrQXHCFfjv46we", color: "from-blue-500 to-cyan-500", icon: Volume2 },
  { id: 3, name: "Teen Pop", artist: "Olivia Rodrigo", spotifyId: "1McMsnEElThX1knmY4oliG", color: "from-purple-400 to-pink-500", icon: Mic2 },
  { id: 4, name: "Electropop", artist: "The Weeknd", spotifyId: "1Xyo4u8uXC1ZmMpatF05PJ", color: "from-indigo-500 to-purple-600", icon: Volume2 },
  
  // Hip-Hop & Rap
  { id: 5, name: "Hip-Hop", artist: "Drake", spotifyId: "3TVXtAsR1Inumwj472S9r4", color: "from-yellow-500 to-orange-600", icon: Mic2 },
  { id: 6, name: "Trap", artist: "Travis Scott", spotifyId: "0Y5tJX1MQlPlqiwlOH1tJY", color: "from-red-500 to-pink-600", icon: Mic2 },
  { id: 7, name: "Conscious Rap", artist: "Kendrick Lamar", spotifyId: "2YZyLoL8N0Wb9xBt1NhZWg", color: "from-green-600 to-blue-600", icon: Mic2 },
  { id: 8, name: "Old School Hip-Hop", artist: "Eminem", spotifyId: "7dGJo4pcD2V6oG8kP0tJRR", color: "from-gray-600 to-red-600", icon: Mic2 },
  
  // R&B & Soul
  { id: 9, name: "Contemporary R&B", artist: "The Weeknd", spotifyId: "1Xyo4u8uXC1ZmMpatF05PJ", color: "from-purple-600 to-red-500", icon: Headphones },
  { id: 10, name: "Neo Soul", artist: "SZA", spotifyId: "7tYKF4w9nC0nq9CsPZTHyP", color: "from-orange-500 to-red-600", icon: Headphones },
  { id: 11, name: "Classic Soul", artist: "Stevie Wonder", spotifyId: "7guDJrEfX3qb6FEbdPA5qi", color: "from-yellow-600 to-orange-700", icon: Piano },
  
  // Rock & Alternative
  { id: 12, name: "Pop Rock", artist: "Imagine Dragons", spotifyId: "53XhwfbYqKCa1cC15pYq2q", color: "from-red-600 to-gray-800", icon: Guitar },
  { id: 13, name: "Alternative Rock", artist: "Arctic Monkeys", spotifyId: "7Ln80lUS6He07XvHI8qqHH", color: "from-gray-700 to-blue-600", icon: Guitar },
  { id: 14, name: "Indie Rock", artist: "Tame Impala", spotifyId: "5INjqkS1o8h1imAzPqGZBb", color: "from-teal-500 to-green-600", icon: Guitar },
  { id: 15, name: "Classic Rock", artist: "Queen", spotifyId: "1dfeR4HaWDbWqFHLkxsg1d", color: "from-yellow-500 to-red-600", icon: Guitar },
  
  // Electronic & Dance
  { id: 16, name: "EDM", artist: "Calvin Harris", spotifyId: "7CajNmpbOovFoOoasH2HaY", color: "from-cyan-400 to-blue-600", icon: Volume2 },
  { id: 17, name: "House", artist: "David Guetta", spotifyId: "1Cs0zKBU1kc0i8ypK3B9ai", color: "from-blue-500 to-purple-600", icon: Volume2 },
  { id: 18, name: "Techno", artist: "Deadmau5", spotifyId: "2CIMQHirSU0MQqyYHq0eOx", color: "from-purple-600 to-pink-500", icon: Volume2 },
  { id: 19, name: "Dubstep", artist: "Skrillex", spotifyId: "5he5w2lnU9x7JFhnwcekXX", color: "from-green-500 to-cyan-500", icon: Volume2 },
  
  // Latin & World
  { id: 20, name: "Reggaeton", artist: "Bad Bunny", spotifyId: "4q3ewBCX7sLwd24euuV69X", color: "from-red-500 to-yellow-500", icon: Drum },
  { id: 21, name: "Latin Pop", artist: "Shakira", spotifyId: "0EmeFodog0BfCgMzAIvKQp", color: "from-orange-500 to-red-500", icon: Music },
  { id: 22, name: "Salsa", artist: "Marc Anthony", spotifyId: "5LHRHt1k9lMyONurDHEdrp", color: "from-red-600 to-orange-600", icon: Drum },
  { id: 23, name: "Bossa Nova", artist: "Stan Getz", spotifyId: "3q7HBObVc0L8jNeTe5Gofh", color: "from-yellow-400 to-orange-500", icon: Guitar },
  
  // Country & Folk
  { id: 24, name: "Country Pop", artist: "Taylor Swift", spotifyId: "06HL4z0CvFAxyc27GXpf02", color: "from-yellow-600 to-brown-600", icon: Guitar },
  { id: 25, name: "Folk", artist: "Bob Dylan", spotifyId: "74ASZWbe4lXaubB36ztrGX", color: "from-green-400 to-blue-500", icon: Guitar },
  { id: 26, name: "Indie Folk", artist: "Bon Iver", spotifyId: "4LEiUm1SRbFMgfqnQTwUbQ", color: "from-green-600 to-brown-500", icon: Guitar },
  
  // Jazz & Blues
  { id: 27, name: "Contemporary Jazz", artist: "Norah Jones", spotifyId: "2Kx7MNY7cI1ENniW7vT30N", color: "from-blue-600 to-purple-600", icon: Piano },
  { id: 28, name: "Smooth Jazz", artist: "Miles Davis", spotifyId: "0kbYTNQb4Pb1rPbbaF0pT4", color: "from-blue-400 to-purple-500", icon: Music },
  { id: 29, name: "Blues", artist: "Eric Clapton", spotifyId: "6PAt558ZEZl0DmdXlnjMgD", color: "from-blue-600 to-indigo-700", icon: Guitar },
  
  // Afrobeats & African
  { id: 30, name: "Afrobeats", artist: "Burna Boy", spotifyId: "3wcj11K77LjEY1PkEazffa", color: "from-green-500 to-yellow-500", icon: Drum },
  { id: 31, name: "Amapiano", artist: "DJ Maphorisa", spotifyId: "2kCcBybjl3SAtIcwdWpUe3", color: "from-orange-500 to-yellow-500", icon: Music },
  { id: 32, name: "Highlife", artist: "Fela Kuti", spotifyId: "4Ww5mwS7BWYjoZTUIrMHfC", color: "from-yellow-500 to-green-600", icon: Music },
  
  // Asian Pop
  { id: 33, name: "K-Pop", artist: "BTS", spotifyId: "3Nrfpe0tUJi4K4DXYWgMUX", color: "from-pink-500 to-purple-500", icon: Music },
  { id: 34, name: "J-Pop", artist: "Yui", spotifyId: "2dIgFjalVxs4ThymZ67YCE", color: "from-pink-400 to-red-500", icon: Star },
  { id: 35, name: "Bollywood", artist: "Arijit Singh", spotifyId: "4YRxDV8wJFPHPTeXepOstw", color: "from-orange-600 to-red-600", icon: Mic2 },
  
  // Reggae & Caribbean
  { id: 36, name: "Reggae", artist: "Bob Marley", spotifyId: "2QsynagSdAqZj3U9HgDzjD", color: "from-green-600 to-yellow-500", icon: Guitar },
  { id: 37, name: "Dancehall", artist: "Sean Paul", spotifyId: "3Isy6kedDrgPYoTS1dazA9", color: "from-yellow-500 to-red-500", icon: Mic2 },
  
  // Metal & Hard Rock
  { id: 38, name: "Heavy Metal", artist: "Metallica", spotifyId: "2ye2Wgw4gimLv2eAKyk1NB", color: "from-gray-800 to-red-600", icon: Guitar },
  { id: 39, name: "Alternative Metal", artist: "Linkin Park", spotifyId: "6XyY86QOPPrYVGvF9ch6wz", color: "from-red-600 to-black", icon: Guitar },
  
  // Ambient & Chill
  { id: 40, name: "Ambient", artist: "Brian Eno", spotifyId: "7MSUfLeTdDEoZiJPDSBXgi", color: "from-blue-400 to-teal-500", icon: Headphones },
  { id: 41, name: "Lo-Fi Hip Hop", artist: "Nujabes", spotifyId: "3Rq3YOF9YG9YfCWD4D56RZ", color: "from-purple-400 to-pink-400", icon: Headphones },
  { id: 42, name: "Chillwave", artist: "MGMT", spotifyId: "0SwO7SWeDHJijQ3XNS7xEE", color: "from-teal-400 to-blue-500", icon: Waves },
  
  // Classical & Orchestral
  { id: 43, name: "Classical", artist: "Ludwig van Beethoven", spotifyId: "2wOqMjp9TyABvtHdOSOTUS", color: "from-purple-500 to-pink-500", icon: Piano },
  { id: 44, name: "Film Scores", artist: "Hans Zimmer", spotifyId: "0YC192cP3KPCRWx8zr8MfZ", color: "from-purple-600 to-blue-700", icon: Piano },
  
  // Punk & Hardcore
  { id: 45, name: "Punk Rock", artist: "Green Day", spotifyId: "7oPftvlwr6VrsViSDV7fJY", color: "from-green-600 to-black", icon: Guitar },
  { id: 46, name: "Pop Punk", artist: "Paramore", spotifyId: "74XFHRwlV6OrjEM0A2NCMF", color: "from-orange-500 to-red-500", icon: Guitar },
  
  // Experimental & Indie
  { id: 47, name: "Art Pop", artist: "Björk", spotifyId: "7w29UYBi0qsHi5RTcv3lmA", color: "from-purple-500 to-pink-600", icon: Music },
  { id: 48, name: "Shoegaze", artist: "Radiohead", spotifyId: "4Z8W4fKeB5YxbusRsdQVPb", color: "from-gray-500 to-purple-500", icon: Guitar },
  
  // Phonk & Underground
  { id: 49, name: "Aura Phonk", artist: "Ogryzek", spotifyId: "1Sdc6ySbIvzO0X9vbyHzWm", color: "from-gray-800 to-purple-600", icon: Volume2 },
  { id: 50, name: "Cloud Phonk", artist: "Scythermane", spotifyId: "5dDNNq04RjKXFOADdHd6VX", color: "from-red-600 to-black", icon: Zap },
  { id: 51, name: "Ambient Phonk", artist: "trapeia", spotifyId: "3Mp6p8ztSdDRvf4qg9cqbD", color: "from-purple-700 to-red-500", icon: Volume2 },
  { id: 52, name: "Brazilian Phonk", artist: "APHRO", spotifyId: "4kI3rUrQjNTJNfBU2cqEwS", color: "from-black to-red-600", icon: Music },
  
  // Seasonal & Mood
  { id: 53, name: "Summer Vibes", artist: "Dua Lipa", spotifyId: "6M2wZ9GZgrQXHCFfjv46we", color: "from-yellow-400 to-orange-500", icon: Music },
  { id: 54, name: "Chill Vibes", artist: "Billie Eilish", spotifyId: "6qqNVTkY8uBg9cP3Jd7DAH", color: "from-green-400 to-blue-500", icon: Headphones },
]

interface MusicDiscoveryProps {
  onCategorySelect: (category: string, artist: string) => void
  onClose?: () => void
}

export function MusicDiscovery({ onCategorySelect, onClose }: MusicDiscoveryProps) {
  const [artistImages, setArtistImages] = useState<Record<string, string>>({})
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({})

  // Cache for artist images
  const imageCache = new Map<string, string>()

  const fetchArtistImage = async (spotifyId: string, artistName: string) => {
    // Check cache first
    if (imageCache.has(spotifyId)) {
      return imageCache.get(spotifyId)!
    }

    try {
      setLoadingImages(prev => ({ ...prev, [spotifyId]: true }))
      
      const token = localStorage.getItem('auth_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/spotify/artist/${spotifyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const text = await response.text()
        if (!text.trim()) {
          return ''
        }
        
        try {
          const artistData = JSON.parse(text)
          const imageUrl = artistData.images?.[0]?.url || ''
          
          // Cache the image
          imageCache.set(spotifyId, imageUrl)
          
          setArtistImages(prev => ({ ...prev, [spotifyId]: imageUrl }))
          return imageUrl
        } catch (parseError) {
          return ''
        }
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoadingImages(prev => ({ ...prev, [spotifyId]: false }))
    }
    
    return ''
  }

  // Load images for visible categories
  useEffect(() => {
    const loadImages = async () => {
      // Load first 20 images immediately, then load rest progressively
      const priorityCategories = musicCategories.slice(0, 20)
      const remainingCategories = musicCategories.slice(20)

      // Load priority images
      await Promise.all(
        priorityCategories.map(category => 
          fetchArtistImage(category.spotifyId, category.artist)
        )
      )

      // Load remaining images with delay
      setTimeout(() => {
        remainingCategories.forEach((category, index) => {
          setTimeout(() => {
            fetchArtistImage(category.spotifyId, category.artist)
          }, index * 100) // Stagger requests
        })
      }, 1000)
    }

    loadImages()
  }, [])

  const handleCategoryClick = (category: typeof musicCategories[0]) => {
    onCategorySelect(category.name, category.artist)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Category Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {musicCategories.map((category, index) => {
          const IconComponent = category.icon
          const imageUrl = artistImages[category.spotifyId]
          const isLoading = loadingImages[category.spotifyId]

          return (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card 
                className="group cursor-pointer overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => handleCategoryClick(category)}
              >
                <CardContent className="p-0 relative h-40 overflow-hidden">
                  {/* Dynamic Background with Musical Pattern */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-85`} />
                  
                  {/* Musical Pattern Overlay */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(255,255,255,0.3)_2px,transparent_2px)] bg-[length:20px_20px]" />
                    <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[length:15px_15px]" />
                  </div>
                  
                  {/* Artist Image */}
                  {imageUrl ? (
                    <OptimizedImage
                      src={imageUrl}
                      alt={category.artist}
                      className="absolute inset-0 w-full h-full object-cover mix-blend-soft-light group-hover:scale-105 transition-transform duration-700 ease-out"
                      fallbackChar={category.artist.charAt(0)}
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      {isLoading ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-10 h-10 border-3 border-white/40 border-t-white rounded-full"
                        />
                      ) : (
                        <motion.div
                          whileHover={{ scale: 1.2, rotate: 15 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="relative"
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-full blur-xl" />
                          <IconComponent className="relative w-16 h-16 text-white drop-shadow-lg" />
                        </motion.div>
                      )}
                    </div>
                  )}
                  
                  {/* Glassmorphism Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent group-hover:from-black/70 transition-all duration-500" />
                  
                  {/* Genre Title - Centered and Stylish */}
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="text-center transform group-hover:scale-105 transition-transform duration-300">
                      <motion.h3 
                        className="font-black text-lg leading-tight text-white drop-shadow-2xl tracking-wide"
                        style={{ 
                          textShadow: '0 0 20px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.9)'
                        }}
                      >
                        {category.name.toUpperCase()}
                      </motion.h3>
                      <div className="w-12 h-0.5 bg-white/60 mx-auto mt-2 group-hover:w-16 transition-all duration-300" />
                    </div>
                  </div>
                  
                  {/* Musical Note Animation on Hover */}
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      whileHover={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/40 shadow-xl"
                    >
                      <Music className="w-5 h-5 text-white" />
                    </motion.div>
                  </div>
                  
                  {/* Corner Accent */}
                  <div className="absolute bottom-0 left-0 w-0 h-0 border-l-[20px] border-b-[20px] border-l-transparent border-b-white/20 group-hover:border-b-white/30 transition-colors duration-300" />
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
