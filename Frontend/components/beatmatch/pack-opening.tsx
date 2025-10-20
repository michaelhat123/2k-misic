"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Confetti from 'react-confetti'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Star,
  Crown,
  Music,
  Package,
  Zap,
  PartyPopper
} from 'lucide-react'
import { MusicCard, MusicCardData, CardRarity } from './music-card'

interface PackOpeningProps {
  packType: 'bronze' | 'silver' | 'gold' | 'premium'
  onComplete?: (cards: MusicCardData[]) => void
  onSkip?: () => void
}

const packConfig = {
  bronze: {
    name: 'Bronze Pack',
    cardsCount: 3,
    gradient: 'from-gray-400 to-gray-600',
    icon: Package,
    glow: 'shadow-gray-500/30'
  },
  silver: {
    name: 'Silver Pack',
    cardsCount: 5,
    gradient: 'from-blue-400 to-cyan-600',
    icon: Star,
    glow: 'shadow-blue-500/40'
  },
  gold: {
    name: 'Gold Pack',
    cardsCount: 10,
    gradient: 'from-yellow-400 to-orange-600',
    icon: Sparkles,
    glow: 'shadow-yellow-500/50'
  },
  premium: {
    name: 'Premium Pack',
    cardsCount: 15,
    gradient: 'from-purple-400 via-pink-500 to-red-600',
    icon: Crown,
    glow: 'shadow-purple-500/60'
  }
}

export function PackOpening({ packType, onComplete, onSkip }: PackOpeningProps) {
  const [stage, setStage] = useState<'closed' | 'opening' | 'revealing' | 'complete'>('closed')
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [revealedCards, setRevealedCards] = useState<MusicCardData[]>([])
  const [showConfetti, setShowConfetti] = useState(false)
  const [isFlipped, setIsFlipped] = useState(false)

  const config = packConfig[packType]
  const PackIcon = config.icon

  // Mock cards - will be replaced with real API data
  const mockCards: MusicCardData[] = Array.from({ length: config.cardsCount }, (_, i) => ({
    id: `card-${i}`,
    title: `Song ${i + 1}`,
    artist: `Artist ${i + 1}`,
    album: `Album ${i + 1}`,
    genre: 'Pop',
    year: 2024,
    rarity: ['common', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 4)] as CardRarity,
    popularity: Math.floor(Math.random() * 100),
    albumArt: `https://picsum.photos/seed/${i}/300/300`,
    stats: {
      energy: Math.floor(Math.random() * 100),
      vibe: Math.floor(Math.random() * 100),
      tempo: Math.floor(Math.random() * 100)
    }
  }))

  const handleOpenPack = () => {
    setStage('opening')
    setTimeout(() => {
      setStage('revealing')
      revealNextCard()
    }, 2000)
  }

  const revealNextCard = () => {
    if (currentCardIndex < mockCards.length) {
      const card = mockCards[currentCardIndex]
      setRevealedCards(prev => [...prev, card])
      setIsFlipped(false)
      
      // Show confetti for epic/legendary
      if (card.rarity === 'epic' || card.rarity === 'legendary') {
        setShowConfetti(true)
        setTimeout(() => setShowConfetti(false), 3000)
      }

      // Flip card after delay
      setTimeout(() => setIsFlipped(true), 500)
      
      setCurrentCardIndex(prev => prev + 1)
    } else {
      setStage('complete')
      onComplete?.(mockCards)
    }
  }

  const handleSkip = () => {
    setRevealedCards(mockCards)
    setStage('complete')
    onSkip?.()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex items-center justify-center">
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          recycle={false}
          numberOfPieces={200}
        />
      )}

      <AnimatePresence mode="wait">
        {/* Stage 1: Closed Pack */}
        {stage === 'closed' && (
          <motion.div
            key="closed"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2 }}
            className="text-center"
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {/* Pack with glow */}
              <div className="relative mb-8">
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r ${config.gradient} rounded-3xl blur-3xl`}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                />
                <div className={`relative w-64 h-80 bg-gradient-to-br ${config.gradient} rounded-3xl flex flex-col items-center justify-center shadow-2xl ${config.glow}`}>
                  <PackIcon className="w-32 h-32 text-white mb-4" />
                  <h2 className="text-3xl font-black text-white">{config.name}</h2>
                  <p className="text-white/80 mt-2">{config.cardsCount} Cards</p>
                </div>
              </div>
            </motion.div>

            <Button
              size="lg"
              className={`h-14 px-12 text-lg font-bold bg-gradient-to-r ${config.gradient} hover:scale-110 transition-transform shadow-2xl`}
              onClick={handleOpenPack}
            >
              <PartyPopper className="w-6 h-6 mr-3" />
              Open Pack
              <Sparkles className="w-6 h-6 ml-3" />
            </Button>
          </motion.div>
        )}

        {/* Stage 2: Opening Animation */}
        {stage === 'opening' && (
          <motion.div
            key="opening"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center"
          >
            <motion.div
              animate={{
                scale: [1, 1.5, 2],
                rotate: [0, 180, 360],
                opacity: [1, 0.5, 0]
              }}
              transition={{ duration: 2 }}
            >
              <div className={`w-64 h-80 bg-gradient-to-br ${config.gradient} rounded-3xl flex items-center justify-center shadow-2xl`}>
                <PackIcon className="w-32 h-32 text-white" />
              </div>
            </motion.div>

            {/* Explosion particles */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                initial={{
                  x: window.innerWidth / 2,
                  y: window.innerHeight / 2
                }}
                animate={{
                  x: window.innerWidth / 2 + (Math.random() - 0.5) * 400,
                  y: window.innerHeight / 2 + (Math.random() - 0.5) * 400,
                  scale: [1, 0],
                  opacity: [1, 0]
                }}
                transition={{ duration: 1.5 }}
              />
            ))}
          </motion.div>
        )}

        {/* Stage 3: Card Reveal */}
        {stage === 'revealing' && (
          <motion.div
            key="revealing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center relative"
          >
            {/* Progress */}
            <div className="absolute top-8 left-1/2 -translate-x-1/2">
              <Badge className="text-lg px-6 py-2">
                Card {currentCardIndex} / {config.cardsCount}
              </Badge>
            </div>

            {/* Skip button */}
            <Button
              variant="outline"
              className="absolute top-8 right-8"
              onClick={handleSkip}
            >
              Skip All
            </Button>

            {/* Card with flip animation */}
            <motion.div
              className="relative"
              style={{ perspective: 1000 }}
              initial={{ scale: 0, rotateY: 180 }}
              animate={{
                scale: 1,
                rotateY: isFlipped ? 0 : 180
              }}
              transition={{
                scale: { duration: 0.5 },
                rotateY: { duration: 0.8, delay: 0.3 }
              }}
            >
              {mockCards[currentCardIndex] && (
                <div className="relative">
                  {/* Card back (before flip) */}
                  {!isFlipped && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-64 h-96 bg-gradient-to-br ${config.gradient} rounded-2xl flex items-center justify-center shadow-2xl`}>
                        <Music className="w-32 h-32 text-white/50" />
                      </div>
                    </div>
                  )}

                  {/* Card front (after flip) */}
                  {isFlipped && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                    >
                      <MusicCard
                        card={mockCards[currentCardIndex]}
                        size="lg"
                        showStats
                      />
                    </motion.div>
                  )}
                </div>
              )}
            </motion.div>

            {/* Next button */}
            {isFlipped && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8"
              >
                <Button
                  size="lg"
                  className="h-14 px-12 text-lg font-bold bg-gradient-to-r from-purple-500 to-pink-600"
                  onClick={revealNextCard}
                >
                  {currentCardIndex < mockCards.length - 1 ? 'Next Card' : 'View All Cards'}
                  <Zap className="w-5 h-5 ml-3" />
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Stage 4: All Cards Revealed */}
        {stage === 'complete' && (
          <motion.div
            key="complete"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-6xl p-8"
          >
            <div className="text-center mb-8">
              <motion.h2
                className="text-4xl font-black mb-4 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                🎉 Pack Opened!
              </motion.h2>
              <p className="text-xl text-gray-400">
                You got {revealedCards.length} new cards!
              </p>
            </div>

            {/* Cards grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
              {revealedCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <MusicCard card={card} size="sm" />
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <Button
                size="lg"
                onClick={() => onComplete?.(revealedCards)}
                className="bg-gradient-to-r from-purple-500 to-pink-600"
              >
                Add to Collection
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
