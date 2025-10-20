"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Trophy,
  Crown,
  Star,
  Zap,
  Target,
  Users,
  TrendingUp,
  Award,
  Flame,
  Shield,
  Swords,
  Medal,
  ChevronRight,
  Play,
  Volume2
} from 'lucide-react'
import { MusicCardData } from './music-card'

interface AIOpponent {
  id: string
  name: string
  avatar: string
  difficulty: 'bronze' | 'silver' | 'gold' | 'legendary'
  division: string
  winRate: number
  speciality: string
  description: string
  chemistry: number
  playlistSize: number
  rewards: {
    beatCoins: number
    xp: number
    packs?: string[]
  }
  isUnlocked: boolean
  isBoss?: boolean
}

interface Division {
  id: string
  name: string
  tier: number
  color: string
  icon: any
  description: string
  opponents: AIOpponent[]
  unlocked: boolean
}

interface BattleResult {
  won: boolean
  playerScore: number
  opponentScore: number
  breakdown: {
    chemistry: number
    popularity: number
    flow: number
    creativity: number
  }
}

const divisions: Division[] = [
  {
    id: 'bronze',
    name: 'Bronze League',
    tier: 1,
    color: 'from-amber-600 to-amber-800',
    icon: Medal,
    description: 'Learn the basics of playlist building',
    unlocked: true,
    opponents: [
      {
        id: 'rookie-dj',
        name: 'DJ Rookie',
        avatar: '🎧',
        difficulty: 'bronze',
        division: 'Bronze V',
        winRate: 45,
        speciality: 'Pop Hits',
        description: 'Just starting out, loves mainstream hits',
        chemistry: 65,
        playlistSize: 8,
        rewards: { beatCoins: 100, xp: 50 },
        isUnlocked: true
      },
      {
        id: 'beat-beginner',
        name: 'Beat Beginner',
        avatar: '🎵',
        difficulty: 'bronze',
        division: 'Bronze IV',
        winRate: 52,
        speciality: 'Easy Listening',
        description: 'Focuses on smooth, accessible tracks',
        chemistry: 70,
        playlistSize: 10,
        rewards: { beatCoins: 150, xp: 75 },
        isUnlocked: true
      },
      {
        id: 'bronze-boss',
        name: 'Captain Bronze',
        avatar: '🥉',
        difficulty: 'bronze',
        division: 'Bronze I',
        winRate: 68,
        speciality: 'Balanced Mix',
        description: 'Bronze division champion with solid fundamentals',
        chemistry: 78,
        playlistSize: 12,
        rewards: { beatCoins: 300, xp: 150, packs: ['bronze'] },
        isUnlocked: true,
        isBoss: true
      }
    ]
  },
  {
    id: 'silver',
    name: 'Silver League',
    tier: 2,
    color: 'from-slate-400 to-slate-600',
    icon: Star,
    description: 'Intermediate competition with genre specialists',
    unlocked: false,
    opponents: [
      {
        id: 'genre-master',
        name: 'Genre Master',
        avatar: '🎼',
        difficulty: 'silver',
        division: 'Silver III',
        winRate: 72,
        speciality: 'Genre Synergy',
        description: 'Expert at matching genres for maximum chemistry',
        chemistry: 82,
        playlistSize: 12,
        rewards: { beatCoins: 250, xp: 125 },
        isUnlocked: false
      },
      {
        id: 'tempo-king',
        name: 'Tempo King',
        avatar: '⚡',
        difficulty: 'silver',
        division: 'Silver II',
        winRate: 75,
        speciality: 'Flow Control',
        description: 'Masters the art of tempo transitions',
        chemistry: 85,
        playlistSize: 14,
        rewards: { beatCoins: 350, xp: 175 },
        isUnlocked: false
      },
      {
        id: 'silver-boss',
        name: 'Silver Sage',
        avatar: '🥈',
        difficulty: 'silver',
        division: 'Silver I',
        winRate: 80,
        speciality: 'Strategic Building',
        description: 'Silver champion known for tactical playlist construction',
        chemistry: 88,
        playlistSize: 15,
        rewards: { beatCoins: 500, xp: 250, packs: ['silver'] },
        isUnlocked: false,
        isBoss: true
      }
    ]
  },
  {
    id: 'gold',
    name: 'Gold League',
    tier: 3,
    color: 'from-yellow-400 to-yellow-600',
    icon: Crown,
    description: 'Elite competition with legendary opponents',
    unlocked: false,
    opponents: [
      {
        id: 'vibe-virtuoso',
        name: 'Vibe Virtuoso',
        avatar: '✨',
        difficulty: 'gold',
        division: 'Gold II',
        winRate: 85,
        speciality: 'Emotional Journey',
        description: 'Creates playlists that tell emotional stories',
        chemistry: 92,
        playlistSize: 16,
        rewards: { beatCoins: 600, xp: 300 },
        isUnlocked: false
      },
      {
        id: 'gold-boss',
        name: 'Golden Maestro',
        avatar: '🥇',
        difficulty: 'gold',
        division: 'Gold I',
        winRate: 88,
        speciality: 'Perfect Harmony',
        description: 'Gold division legend with near-perfect chemistry',
        chemistry: 95,
        playlistSize: 18,
        rewards: { beatCoins: 1000, xp: 500, packs: ['gold'] },
        isUnlocked: false,
        isBoss: true
      }
    ]
  },
  {
    id: 'legendary',
    name: 'Legendary League',
    tier: 4,
    color: 'from-purple-500 to-pink-600',
    icon: Trophy,
    description: 'The ultimate challenge - face the music gods',
    unlocked: false,
    opponents: [
      {
        id: 'beat-god',
        name: 'The Beat God',
        avatar: '👑',
        difficulty: 'legendary',
        division: 'Legendary',
        winRate: 95,
        speciality: 'Divine Composition',
        description: 'The ultimate AI opponent with godlike playlist skills',
        chemistry: 99,
        playlistSize: 20,
        rewards: { beatCoins: 2000, xp: 1000, packs: ['premium'] },
        isUnlocked: false,
        isBoss: true
      }
    ]
  }
]

export function CareerMode() {
  const [selectedDivision, setSelectedDivision] = useState(divisions[0])
  const [battleResult, setBattleResult] = useState<BattleResult | null>(null)
  const [isInBattle, setIsInBattle] = useState(false)
  const [selectedOpponent, setSelectedOpponent] = useState<AIOpponent | null>(null)

  // Mock user progress
  const userProgress = {
    currentDivision: 'Bronze III',
    wins: 12,
    losses: 3,
    winRate: 80,
    totalBattles: 15,
    highestChemistry: 89
  }

  const handleBattle = (opponent: AIOpponent) => {
    if (!opponent.isUnlocked) return
    
    setSelectedOpponent(opponent)
    setIsInBattle(true)
    
    // Simulate battle (replace with real logic)
    setTimeout(() => {
      const playerScore = Math.floor(Math.random() * 100) + 50
      const opponentScore = opponent.chemistry + Math.floor(Math.random() * 20) - 10
      
      const result: BattleResult = {
        won: playerScore > opponentScore,
        playerScore,
        opponentScore,
        breakdown: {
          chemistry: Math.floor(Math.random() * 30) + 70,
          popularity: Math.floor(Math.random() * 30) + 60,
          flow: Math.floor(Math.random() * 30) + 65,
          creativity: Math.floor(Math.random() * 30) + 55
        }
      }
      
      setBattleResult(result)
      setIsInBattle(false)
    }, 3000)
  }

  const closeBattleResult = () => {
    setBattleResult(null)
    setSelectedOpponent(null)
  }

  return (
    <div className="space-y-6">
      {/* User Progress Overview */}
      <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">Career Progress</h3>
              <p className="text-muted-foreground">Current Division: {userProgress.currentDivision}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-purple-500">{userProgress.winRate}%</div>
              <div className="text-sm text-muted-foreground">Win Rate</div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-xl font-bold text-green-500">{userProgress.wins}</div>
              <div className="text-xs text-muted-foreground">Wins</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-red-500">{userProgress.losses}</div>
              <div className="text-xs text-muted-foreground">Losses</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold">{userProgress.totalBattles}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-yellow-500">{userProgress.highestChemistry}</div>
              <div className="text-xs text-muted-foreground">Best Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Division Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {divisions.map((division) => (
          <motion.div
            key={division.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card 
              className={`cursor-pointer transition-all ${
                selectedDivision.id === division.id 
                  ? 'ring-2 ring-purple-500 bg-accent' 
                  : division.unlocked 
                    ? 'hover:bg-accent/50' 
                    : 'opacity-50 cursor-not-allowed'
              }`}
              onClick={() => division.unlocked && setSelectedDivision(division)}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-r ${division.color} flex items-center justify-center`}>
                  <division.icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-semibold text-sm">{division.name}</h4>
                <p className="text-xs text-muted-foreground">Tier {division.tier}</p>
                {!division.unlocked && (
                  <Badge variant="secondary" className="mt-2 text-xs">Locked</Badge>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Opponents List */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">{selectedDivision.name}</h3>
            <Badge variant="outline">{selectedDivision.description}</Badge>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {selectedDivision.opponents.map((opponent, index) => (
                <motion.div
                  key={opponent.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`transition-all ${
                    opponent.isUnlocked 
                      ? 'hover:bg-accent/50 cursor-pointer' 
                      : 'opacity-50 cursor-not-allowed'
                  } ${opponent.isBoss ? 'border-yellow-500/50 bg-yellow-500/5' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {/* Avatar */}
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl">
                            {opponent.avatar}
                          </div>

                          {/* Info */}
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold">{opponent.name}</h4>
                              {opponent.isBoss && (
                                <Crown className="w-4 h-4 text-yellow-500" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{opponent.description}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {opponent.division}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {opponent.winRate}% Win Rate
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Stats & Battle */}
                        <div className="text-right">
                          <div className="flex items-center gap-2 mb-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <span className="font-bold">{opponent.chemistry}</span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-3">
                            {opponent.playlistSize} cards • {opponent.speciality}
                          </div>
                          
                          <Button
                            size="sm"
                            onClick={() => handleBattle(opponent)}
                            disabled={!opponent.isUnlocked || isInBattle}
                            className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700"
                          >
                            {isInBattle && selectedOpponent?.id === opponent.id ? (
                              <>
                                <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
                                Battling...
                              </>
                            ) : (
                              <>
                                <Swords className="w-4 h-4 mr-2" />
                                Battle
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Rewards */}
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Rewards:</span>
                          <div className="flex items-center gap-3">
                            <span className="text-yellow-500">💰 {opponent.rewards.beatCoins}</span>
                            <span className="text-blue-500">⭐ {opponent.rewards.xp} XP</span>
                            {opponent.rewards.packs && (
                              <span className="text-purple-500">📦 {opponent.rewards.packs[0]} pack</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Battle Result Modal */}
      <AnimatePresence>
        {battleResult && selectedOpponent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-background rounded-2xl p-8 max-w-md w-full"
            >
              <div className="text-center mb-6">
                <div className={`w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  battleResult.won 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                    : 'bg-gradient-to-r from-red-500 to-rose-600'
                }`}>
                  {battleResult.won ? (
                    <Trophy className="w-10 h-10 text-white" />
                  ) : (
                    <Shield className="w-10 h-10 text-white" />
                  )}
                </div>
                
                <h2 className={`text-3xl font-black mb-2 ${
                  battleResult.won ? 'text-green-500' : 'text-red-500'
                }`}>
                  {battleResult.won ? 'Victory!' : 'Defeat'}
                </h2>
                
                <p className="text-muted-foreground">
                  vs {selectedOpponent.name}
                </p>
              </div>

              {/* Score Comparison */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <span>Your Score</span>
                  <span className="text-2xl font-bold text-blue-500">{battleResult.playerScore}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Opponent Score</span>
                  <span className="text-2xl font-bold text-red-500">{battleResult.opponentScore}</span>
                </div>
              </div>

              {/* Breakdown */}
              <div className="space-y-2 mb-6">
                <h4 className="font-semibold">Score Breakdown:</h4>
                {Object.entries(battleResult.breakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="capitalize">{key}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={value} className="w-20 h-2" />
                      <span className="w-8 text-right">{value}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Rewards */}
              {battleResult.won && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mb-6">
                  <h4 className="font-semibold text-green-500 mb-2">Rewards Earned:</h4>
                  <div className="flex items-center justify-center gap-4 text-sm">
                    <span className="text-yellow-500">💰 +{selectedOpponent.rewards.beatCoins}</span>
                    <span className="text-blue-500">⭐ +{selectedOpponent.rewards.xp} XP</span>
                    {selectedOpponent.rewards.packs && (
                      <span className="text-purple-500">📦 {selectedOpponent.rewards.packs[0]} pack</span>
                    )}
                  </div>
                </div>
              )}

              <Button 
                onClick={closeBattleResult}
                className="w-full"
              >
                Continue
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
