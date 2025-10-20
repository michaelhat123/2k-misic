"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  Trophy,
  Target,
  ShoppingBag,
  Sparkles,
  Crown,
  Flame,
  Users,
  Wallet,
  Plus,
  TrendingUp,
  Award,
  Star,
  Medal,
  Maximize,
  Minimize,
  X,
  ListMusic
} from 'lucide-react'
import { PackShop } from '@/components/beatmatch/pack-shop'
import { CardCollection } from '@/components/beatmatch/card-collection'
import { PlaylistBuilder } from '@/components/beatmatch/playlist-builder'
import { CareerMode } from '@/components/beatmatch/career-mode'
import { DailyChallenges } from '@/components/beatmatch/daily-challenges'

export default function BeatMatchPage() {
  const [isLaunched, setIsLaunched] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [activeTab, setActiveTab] = useState('collection')
  const gameContainerRef = useRef<HTMLDivElement>(null)

  // Handle fullscreen
  const enterFullscreen = async () => {
    try {
      if (gameContainerRef.current) {
        await gameContainerRef.current.requestFullscreen()
        setIsFullscreen(true)
        setIsLaunched(true)
      }
    } catch (error) {
      // Fallback: just launch without fullscreen
      setIsLaunched(true)
    }
  }

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      setIsFullscreen(false)
    } catch (error) {
      // Silent fail
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  const handleLaunch = () => {
    enterFullscreen()
  }

  const handleClose = () => {
    exitFullscreen()
    setIsLaunched(false)
  }

  // Handle pack purchase
  const handlePurchasePack = (packType: string, cost: number) => {
    // TODO: Implement actual purchase logic with API
    // Deduct coins, open pack, etc.
  }
  
  // Mock data - will be replaced with real API calls
  const userStats = {
    beatCoins: 1250,
    level: 15,
    xp: 3450,
    nextLevelXp: 5000,
    division: 'Gold III',
    totalCards: 234,
    legendaryCards: 8,
    winRate: 68,
    rank: 1523
  }

  return (
    <div ref={gameContainerRef} className="h-full flex flex-col relative overflow-hidden">
      {/* Launch Screen */}
      <AnimatePresence>
        {!isLaunched && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.5 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 z-50 flex items-center justify-center bg-black"
          >
            {/* Animated particles background */}
            <div className="absolute inset-0 overflow-hidden">
              {[...Array(50)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-purple-500/50 rounded-full"
                  initial={{ 
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                  }}
                  animate={{
                    y: [0, -window.innerHeight],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: Math.random() * 3 + 2,
                    repeat: Infinity,
                    delay: Math.random() * 2,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10 text-center max-w-2xl px-6">
              {/* Epic Logo Animation */}
              <motion.div
                className="mb-8"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 1 }}
              >
                <motion.div
                  className="relative inline-block"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  {/* Pulsing glow */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full blur-3xl"
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0.8, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                    }}
                  />
                  <div className="relative w-32 h-32 bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl flex items-center justify-center shadow-2xl">
                    <Zap className="w-16 h-16 text-white" />
                  </div>
                </motion.div>
              </motion.div>

              {/* Title */}
              <motion.h1
                className="text-6xl font-black mb-4 bg-gradient-to-r from-purple-400 via-pink-500 to-purple-600 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                BeatMatch Challenge
              </motion.h1>

              <motion.p
                className="text-xl text-gray-400 mb-12"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Build your ultimate playlist • Battle AI opponents • Dominate the charts
              </motion.p>

              {/* Features */}
              <motion.div
                className="grid grid-cols-3 gap-6 mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
              >
                {[
                  { icon: Sparkles, label: 'Collect Cards', desc: '100+ Music Cards' },
                  { icon: Trophy, label: 'Career Mode', desc: 'Battle & Climb' },
                  { icon: Crown, label: 'Legendary Drops', desc: 'Rare Cards' },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20"
                    whileHover={{ scale: 1.05, borderColor: 'rgba(168, 85, 247, 0.5)' }}
                  >
                    <feature.icon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                    <p className="font-bold text-white mb-1">{feature.label}</p>
                    <p className="text-sm text-gray-400">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Launch Button */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, type: "spring" }}
              >
                <Button
                  size="lg"
                  className="h-16 px-12 text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 shadow-2xl shadow-purple-500/50 group"
                  onClick={handleLaunch}
                >
                  <Maximize className="w-6 h-6 mr-3 group-hover:rotate-90 transition-transform" />
                  Launch Game
                  <Sparkles className="w-6 h-6 ml-3 group-hover:scale-125 transition-transform" />
                </Button>
                <p className="text-sm text-gray-500 mt-4">
                  Press ESC anytime to exit fullscreen
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Game Interface */}
      {isLaunched && (
        <div className={`absolute inset-0 flex flex-col ${isFullscreen ? 'bg-background' : ''}`}>
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />

      {/* Header */}
      <div className="flex-shrink-0 p-6 pb-4 relative z-10 bg-background/95 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-6">
          {/* Logo & Title */}
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <motion.div
              className="relative w-16 h-16"
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl blur-lg"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              />
              <div className="relative w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-2xl">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </motion.div>
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-purple-600 bg-clip-text text-transparent">
                BeatMatch Challenge
              </h1>
              <p className="text-sm text-muted-foreground">Build • Battle • Dominate</p>
            </div>
          </motion.div>

          {/* User Stats Panel */}
          <div className="flex items-center gap-4">
            {/* BeatCoins Wallet */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Card className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30 cursor-pointer">
                <CardContent className="p-3 flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Wallet className="w-5 h-5 text-yellow-500" />
                  </motion.div>
                  <div>
                    <p className="text-xs text-muted-foreground">BeatCoins</p>
                    <p className="text-lg font-bold text-yellow-500">
                      {userStats.beatCoins.toLocaleString()}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0 ml-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>

            {/* Level & Division */}
            <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <Badge className="mb-1 bg-gradient-to-r from-purple-500 to-pink-600">
                      <Crown className="w-3 h-3 mr-1" />
                      Lv. {userStats.level}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{userStats.division}</p>
                  </div>
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* XP Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Level Progress</span>
            <span className="text-xs font-semibold">
              {userStats.xp} / {userStats.nextLevelXp} XP
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-600"
              initial={{ width: 0 }}
              animate={{ width: `${(userStats.xp / userStats.nextLevelXp) * 100}%` }}
              transition={{ duration: 1, delay: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total Cards', value: userStats.totalCards, icon: Sparkles, color: 'text-blue-500' },
            { label: 'Legendary', value: userStats.legendaryCards, icon: Star, color: 'text-yellow-500' },
            { label: 'Win Rate', value: `${userStats.winRate}%`, icon: TrendingUp, color: 'text-green-500' },
            { label: 'Global Rank', value: `#${userStats.rank}`, icon: Medal, color: 'text-purple-500' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
            >
              <Card className="hover:bg-accent/50 transition-colors">
                <CardContent className="p-3 text-center">
                  <stat.icon className={`w-5 h-5 mx-auto mb-1 ${stat.color}`} />
                  <p className="text-lg font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="flex-1 overflow-auto relative z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col px-6">
          <TabsList className="grid w-full grid-cols-6 mb-4">
            <TabsTrigger value="collection" className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              Collection
            </TabsTrigger>
            <TabsTrigger value="packs" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Packs
            </TabsTrigger>
            <TabsTrigger value="builder" className="flex items-center gap-2">
              <ListMusic className="w-4 h-4" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="career" className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Career
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Medal className="w-4 h-4" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="collection" className="mt-0">
              <CardCollection />
            </TabsContent>

            <TabsContent value="packs" className="mt-0">
              <PackShop 
                beatCoins={userStats.beatCoins}
                onPurchase={handlePurchasePack}
              />
            </TabsContent>

            <TabsContent value="builder" className="mt-0">
              <PlaylistBuilder />
            </TabsContent>

            <TabsContent value="career" className="mt-0">
              <CareerMode />
            </TabsContent>

            <TabsContent value="challenges" className="mt-0">
              <DailyChallenges />
            </TabsContent>

            <TabsContent value="leaderboard" className="mt-0">
              <Card>
                <CardContent className="p-8 text-center">
                  <Medal className="w-16 h-16 mx-auto mb-4 text-purple-500" />
                  <h3 className="text-2xl font-bold mb-2">Leaderboards</h3>
                  <p className="text-muted-foreground mb-4">
                    Compete with players worldwide and climb the ranks
                  </p>
                  <Badge variant="outline" className="text-sm">
                    Coming in Phase 22
                  </Badge>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Fullscreen Controls */}
      {isFullscreen && (
        <motion.div
          className="absolute top-4 right-4 z-50 flex gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Button
            size="sm"
            variant="secondary"
            className="bg-black/60 backdrop-blur-sm hover:bg-black/80"
            onClick={exitFullscreen}
          >
            <Minimize className="w-4 h-4 mr-2" />
            Exit Fullscreen
          </Button>
          <Button
            size="sm"
            variant="destructive"
            className="bg-red-600/60 backdrop-blur-sm hover:bg-red-700/80"
            onClick={handleClose}
          >
            <X className="w-4 h-4 mr-2" />
            Close Game
          </Button>
        </motion.div>
      )}
      </div>
      )}
    </div>
  )
}
