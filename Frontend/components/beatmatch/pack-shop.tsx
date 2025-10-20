"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Package,
  Star,
  Sparkles,
  Crown,
  ShoppingCart,
  Wallet,
  Zap,
  TrendingUp,
  Info
} from 'lucide-react'
import { PackOpening } from './pack-opening'
import { MusicCardData } from './music-card'

interface Pack {
  id: string
  type: 'bronze' | 'silver' | 'gold' | 'premium'
  name: string
  description: string
  cardsCount: number
  price: number
  icon: any
  gradient: string
  features: string[]
  popular?: boolean
  bestValue?: boolean
}

const packs: Pack[] = [
  {
    id: 'bronze',
    type: 'bronze',
    name: 'Bronze Pack',
    description: 'Perfect for starters',
    cardsCount: 3,
    price: 100,
    icon: Package,
    gradient: 'from-gray-400 to-gray-600',
    features: [
      '3 Random Cards',
      '1 Rare Guaranteed',
      'Common/Rare Mix'
    ]
  },
  {
    id: 'silver',
    type: 'silver',
    name: 'Silver Pack',
    description: 'Balanced value',
    cardsCount: 5,
    price: 300,
    icon: Star,
    gradient: 'from-blue-400 to-cyan-600',
    features: [
      '5 Random Cards',
      '2 Rares Guaranteed',
      'Chance of Epic'
    ],
    popular: true
  },
  {
    id: 'gold',
    type: 'gold',
    name: 'Gold Pack',
    description: 'Premium selection',
    cardsCount: 10,
    price: 750,
    icon: Sparkles,
    gradient: 'from-yellow-400 to-orange-600',
    features: [
      '10 Random Cards',
      '3 Epics Guaranteed',
      'High Legendary Chance'
    ],
    bestValue: true
  },
  {
    id: 'premium',
    type: 'premium',
    name: 'Premium Pack',
    description: 'Ultimate collection',
    cardsCount: 15,
    price: 2000,
    icon: Crown,
    gradient: 'from-purple-400 via-pink-500 to-red-600',
    features: [
      '15 Random Cards',
      '5 Epics + 1 Legendary',
      'Exclusive Cards'
    ]
  }
]

interface PackShopProps {
  beatCoins: number
  onPurchase?: (packType: string, cost: number) => void
}

export function PackShop({ beatCoins, onPurchase }: PackShopProps) {
  const [openingPack, setOpeningPack] = useState<'bronze' | 'silver' | 'gold' | 'premium' | null>(null)
  const [showInsufficient, setShowInsufficient] = useState(false)

  const handleBuyPack = (pack: Pack) => {
    if (beatCoins >= pack.price) {
      onPurchase?.(pack.type, pack.price)
      setOpeningPack(pack.type)
    } else {
      setShowInsufficient(true)
      setTimeout(() => setShowInsufficient(false), 2000)
    }
  }

  const handlePackComplete = (cards: MusicCardData[]) => {
    setOpeningPack(null)
    // TODO: Add cards to user collection via API
  }

  return (
    <>
      <div className="space-y-6">
        {/* BeatCoins Display */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Wallet className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-sm text-muted-foreground">Your Balance</p>
                    <p className="text-3xl font-black text-yellow-500">
                      {beatCoins.toLocaleString()}
                      <span className="text-sm ml-2">BeatCoins</span>
                    </p>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Buy More
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Insufficient Funds Alert */}
        {showInsufficient && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center"
          >
            <p className="text-red-500 font-semibold">
              ❌ Insufficient BeatCoins! Buy more to continue.
            </p>
          </motion.div>
        )}

        {/* Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {packs.map((pack, index) => (
            <motion.div
              key={pack.id}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05, y: -10 }}
            >
              <Card className={`relative overflow-hidden border-2 hover:border-opacity-100 transition-all ${
                pack.popular ? 'border-blue-500/50' : pack.bestValue ? 'border-yellow-500/50' : 'border-transparent'
              }`}>
                {/* Popular/Best Value Badge */}
                {(pack.popular || pack.bestValue) && (
                  <div className="absolute top-3 right-3 z-10">
                    <Badge className={`${
                      pack.popular ? 'bg-blue-500' : 'bg-yellow-500'
                    } text-white font-bold`}>
                      {pack.popular ? '🔥 Popular' : '💎 Best Value'}
                    </Badge>
                  </div>
                )}

                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${pack.gradient} opacity-10`} />

                <CardContent className="p-6 relative">
                  {/* Pack Icon with Glow */}
                  <motion.div
                    className="relative mb-4"
                    whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                  >
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${pack.gradient} rounded-full blur-2xl`}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <div className={`relative w-24 h-24 bg-gradient-to-br ${pack.gradient} rounded-2xl flex items-center justify-center mx-auto shadow-2xl`}>
                      <pack.icon className="w-12 h-12 text-white" />
                    </div>
                  </motion.div>

                  {/* Pack Info */}
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-black mb-1">{pack.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {pack.description}
                    </p>
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Badge variant="outline" className="text-xs">
                        {pack.cardsCount} Cards
                      </Badge>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {pack.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${pack.gradient}`} />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Price & Buy Button */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-2">
                      <Wallet className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold">{pack.price.toLocaleString()}</span>
                      <span className="text-sm text-muted-foreground">Coins</span>
                    </div>

                    <Button
                      className={`w-full h-12 font-bold bg-gradient-to-r ${pack.gradient} hover:scale-105 transition-transform shadow-lg`}
                      onClick={() => handleBuyPack(pack)}
                      disabled={beatCoins < pack.price}
                    >
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      {beatCoins >= pack.price ? 'Buy Pack' : 'Insufficient Coins'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Info Section */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-purple-400 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-bold text-lg mb-2">How Pack Opening Works</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Each pack contains random music cards with different rarities</li>
                  <li>• Higher-tier packs have better chances for rare cards</li>
                  <li>• Legendary cards can only be found in Gold and Premium packs</li>
                  <li>• All cards are added to your permanent collection</li>
                  <li>• Use cards to build playlists and compete in battles</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pack Opening Overlay */}
      {openingPack && (
        <PackOpening
          packType={openingPack}
          onComplete={handlePackComplete}
          onSkip={() => setOpeningPack(null)}
        />
      )}
    </>
  )
}
