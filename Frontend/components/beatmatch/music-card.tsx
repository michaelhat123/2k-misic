"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Play,
  Star,
  Flame,
  Sparkles,
  Crown,
  Award,
  TrendingUp,
  Music
} from 'lucide-react'
import { BeatMatchColors, getRarityConfig, BeatMatchAnimations } from '@/lib/beatmatch/colors'

export type CardRarity = 'common' | 'rare' | 'epic' | 'legendary'

export interface MusicCardData {
  id: string
  title: string
  artist: string
  album?: string
  genre?: string
  year?: number
  rarity: CardRarity
  popularity: number // 0-100
  albumArt: string
  stats?: {
    energy: number
    vibe: number
    tempo: number
  }
}

interface MusicCardProps {
  card: MusicCardData
  onPlay?: (card: MusicCardData) => void
  onClick?: (card: MusicCardData) => void
  isPlaying?: boolean
  size?: 'sm' | 'md' | 'lg'
  showStats?: boolean
}

const rarityIcons = {
  common: Music,
  rare: Star,
  epic: Sparkles,
  legendary: Crown
}

export function MusicCard({ 
  card, 
  onPlay, 
  onClick, 
  isPlaying = false,
  size = 'md',
  showStats = false 
}: MusicCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)
  const config = getRarityConfig(card.rarity)
  const RarityIcon = rarityIcons[card.rarity]

  const sizeClasses = {
    sm: 'w-40',
    md: 'w-52',
    lg: 'w-64'
  }

  return (
    <motion.div
      className={`${sizeClasses[size]} relative`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05, y: -5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onClick?.(card)}
    >
      {/* Pulsing glow effect for legendary */}
      {card.rarity === 'legendary' && (
        <motion.div
          className={`absolute -inset-2 bg-gradient-to-r ${config.gradient} rounded-2xl blur-xl`}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Floating particles for epic+ */}
      {(card.rarity === 'epic' || card.rarity === 'legendary') && isHovered && (
        <>
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              initial={{ 
                x: Math.random() * 200, 
                y: Math.random() * 200,
                opacity: 0
              }}
              animate={{
                y: [0, -50, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.3,
                repeat: Infinity,
              }}
            />
          ))}
        </>
      )}

      <Card className={`relative overflow-hidden cursor-pointer border-2 ${config.border} ${config.glow} shadow-xl hover:shadow-2xl transition-all duration-300 bg-gradient-to-br ${config.bgGradient}`}>
        <CardContent className="p-0">
          {/* Rarity Badge */}
          <div className="absolute top-2 left-2 z-20">
            <Badge className={`bg-gradient-to-r ${config.gradient} text-white border-none shadow-lg`}>
              <RarityIcon className="w-3 h-3 mr-1" />
              {config.name}
            </Badge>
          </div>

          {/* Popularity Badge */}
          <div className="absolute top-2 right-2 z-20">
            <Badge variant="secondary" className="bg-black/60 backdrop-blur-sm text-white border-none">
              <TrendingUp className="w-3 h-3 mr-1" />
              {card.popularity}
            </Badge>
          </div>

          {/* Album Art */}
          <div className="relative aspect-square">
            {/* Animated shine effect */}
            {isHovered && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                initial={{ x: '-100%' }}
                animate={{ x: '200%' }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
              />
            )}

            <img
              src={card.albumArt}
              alt={card.title}
              className="w-full h-full object-cover"
            />

            {/* Overlay on hover */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: isHovered ? 1 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <motion.div
                whileHover={{ scale: 1.2, rotate: 90 }}
                whileTap={{ scale: 0.8 }}
              >
                <Button
                  size="icon"
                  className={`h-14 w-14 rounded-full bg-gradient-to-r ${config.gradient} hover:scale-110 transition-transform shadow-2xl`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onPlay?.(card)
                  }}
                >
                  <Play className="h-6 w-6 ml-0.5" />
                </Button>
              </motion.div>
            </motion.div>

            {/* Legendary crown effect */}
            {card.rarity === 'legendary' && (
              <motion.div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              >
                <Crown className="w-12 h-12 text-yellow-400 drop-shadow-lg opacity-20" />
              </motion.div>
            )}
          </div>

          {/* Card Info */}
          <div className="p-3 relative">
            {/* Gradient border top */}
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${config.gradient}`} />

            <h4 className="font-bold text-sm truncate mb-1">{card.title}</h4>
            <p className="text-xs text-muted-foreground truncate mb-2">{card.artist}</p>

            {showStats && card.stats && (
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-border/50">
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Energy</p>
                  <p className={`text-sm font-bold ${config.text}`}>{card.stats.energy}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Vibe</p>
                  <p className={`text-sm font-bold ${config.text}`}>{card.stats.vibe}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-muted-foreground">Tempo</p>
                  <p className={`text-sm font-bold ${config.text}`}>{card.stats.tempo}</p>
                </div>
              </div>
            )}

            {/* Genre & Year */}
            <div className="flex items-center justify-between mt-2 text-[10px] text-muted-foreground">
              <span>{card.genre}</span>
              <span>{card.year}</span>
            </div>
          </div>

          {/* Holographic effect for legendary */}
          {card.rarity === 'legendary' && isHovered && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-transparent to-purple-600/20 pointer-events-none"
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
              }}
              style={{ backgroundSize: '200% 200%' }}
            />
          )}
        </CardContent>
      </Card>

      {/* Playing indicator */}
      {isPlaying && (
        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <div className="flex items-center gap-0.5 bg-black/80 backdrop-blur-sm px-2 py-1 rounded-full">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className={`w-0.5 bg-gradient-to-t ${config.gradient} rounded-full`}
                animate={{
                  height: ['8px', '16px', '8px'],
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
