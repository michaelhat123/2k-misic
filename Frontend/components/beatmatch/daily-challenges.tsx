"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Target,
  Clock,
  Trophy,
  Star,
  Flame,
  Zap,
  Crown,
  Award,
  CheckCircle,
  Gift,
  Calendar,
  TrendingUp,
  Music,
  Sparkles,
  Timer,
  Coins
} from 'lucide-react'

interface Challenge {
  id: string
  title: string
  description: string
  type: 'daily' | 'weekly' | 'special'
  difficulty: 'easy' | 'medium' | 'hard' | 'legendary'
  category: 'collection' | 'battle' | 'chemistry' | 'social'
  progress: number
  maxProgress: number
  rewards: {
    beatCoins: number
    xp: number
    packs?: string[]
    cards?: string[]
  }
  timeLeft: number // in hours
  isCompleted: boolean
  isNew: boolean
}

const challengeCategories = {
  collection: { label: 'Collection', icon: Sparkles, color: 'text-purple-500' },
  battle: { label: 'Battle', icon: Trophy, color: 'text-red-500' },
  chemistry: { label: 'Chemistry', icon: Zap, color: 'text-yellow-500' },
  social: { label: 'Social', icon: Award, color: 'text-blue-500' }
}

const difficultyConfig = {
  easy: { label: 'Easy', color: 'bg-green-500', multiplier: 1 },
  medium: { label: 'Medium', color: 'bg-yellow-500', multiplier: 1.5 },
  hard: { label: 'Hard', color: 'bg-red-500', multiplier: 2 },
  legendary: { label: 'Legendary', color: 'bg-purple-500', multiplier: 3 }
}

export function DailyChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [completedToday, setCompletedToday] = useState(0)

  // Mock challenges data
  useEffect(() => {
    const mockChallenges: Challenge[] = [
      {
        id: 'daily-1',
        title: 'Pack Hunter',
        description: 'Open 3 card packs of any type',
        type: 'daily',
        difficulty: 'easy',
        category: 'collection',
        progress: 1,
        maxProgress: 3,
        rewards: { beatCoins: 150, xp: 75 },
        timeLeft: 18,
        isCompleted: false,
        isNew: true
      },
      {
        id: 'daily-2',
        title: 'Chemistry Master',
        description: 'Create a playlist with 85+ chemistry',
        type: 'daily',
        difficulty: 'medium',
        category: 'chemistry',
        progress: 0,
        maxProgress: 1,
        rewards: { beatCoins: 300, xp: 150, packs: ['silver'] },
        timeLeft: 18,
        isCompleted: false,
        isNew: false
      },
      {
        id: 'daily-3',
        title: 'Victory Streak',
        description: 'Win 5 battles in a row',
        type: 'daily',
        difficulty: 'hard',
        category: 'battle',
        progress: 2,
        maxProgress: 5,
        rewards: { beatCoins: 500, xp: 250, packs: ['gold'] },
        timeLeft: 18,
        isCompleted: false,
        isNew: false
      },
      {
        id: 'weekly-1',
        title: 'Legendary Collector',
        description: 'Collect 3 legendary cards',
        type: 'weekly',
        difficulty: 'legendary',
        category: 'collection',
        progress: 1,
        maxProgress: 3,
        rewards: { beatCoins: 1000, xp: 500, packs: ['premium'], cards: ['legendary-exclusive'] },
        timeLeft: 120,
        isCompleted: false,
        isNew: false
      },
      {
        id: 'special-1',
        title: 'Weekend Warrior',
        description: 'Complete all daily challenges this weekend',
        type: 'special',
        difficulty: 'medium',
        category: 'collection',
        progress: 1,
        maxProgress: 6,
        rewards: { beatCoins: 750, xp: 375, packs: ['gold', 'silver'] },
        timeLeft: 48,
        isCompleted: false,
        isNew: true
      },
      {
        id: 'completed-1',
        title: 'Morning Grind',
        description: 'Log in during morning hours',
        type: 'daily',
        difficulty: 'easy',
        category: 'social',
        progress: 1,
        maxProgress: 1,
        rewards: { beatCoins: 100, xp: 50 },
        timeLeft: 18,
        isCompleted: true,
        isNew: false
      }
    ]
    setChallenges(mockChallenges)
    setCompletedToday(mockChallenges.filter(c => c.isCompleted && c.type === 'daily').length)
  }, [])

  const filteredChallenges = challenges.filter(challenge => 
    selectedCategory === 'all' || challenge.category === selectedCategory
  )

  const formatTimeLeft = (hours: number) => {
    if (hours < 24) {
      return `${hours}h left`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = hours % 24
    return `${days}d ${remainingHours}h left`
  }

  const handleClaimReward = (challengeId: string) => {
    setChallenges(prev => prev.map(c => 
      c.id === challengeId ? { ...c, isCompleted: true } : c
    ))
    // TODO: Add reward claiming logic
  }

  const totalDailyChallenges = challenges.filter(c => c.type === 'daily').length
  const dailyProgress = (completedToday / totalDailyChallenges) * 100

  return (
    <div className="space-y-6">
      {/* Daily Progress Overview */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold">Daily Progress</h3>
              <p className="text-muted-foreground">
                {completedToday} of {totalDailyChallenges} challenges completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black text-blue-500">{Math.round(dailyProgress)}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </div>
          </div>
          
          <Progress value={dailyProgress} className="h-3 mb-4" />
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-green-500">{completedToday}</div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
            <div>
              <div className="text-xl font-bold text-yellow-500">
                {challenges.filter(c => c.type === 'daily' && !c.isCompleted).length}
              </div>
              <div className="text-xs text-muted-foreground">Remaining</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-500">
                {challenges.filter(c => c.type === 'weekly').length}
              </div>
              <div className="text-xs text-muted-foreground">Weekly</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setSelectedCategory('all')}
        >
          All Challenges
        </Button>
        {Object.entries(challengeCategories).map(([key, config]) => (
          <Button
            key={key}
            variant={selectedCategory === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(key)}
            className="flex items-center gap-2"
          >
            <config.icon className="w-4 h-4" />
            {config.label}
          </Button>
        ))}
      </div>

      {/* Challenges List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {filteredChallenges.map((challenge, index) => {
            const categoryConfig = challengeCategories[challenge.category]
            const difficultyInfo = difficultyConfig[challenge.difficulty]
            const progressPercentage = (challenge.progress / challenge.maxProgress) * 100

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className={`relative transition-all hover:bg-accent/50 ${
                  challenge.isCompleted ? 'bg-green-500/5 border-green-500/30' : ''
                } ${challenge.isNew ? 'ring-2 ring-blue-500/50' : ''}`}>
                  <CardContent className="p-4">
                    {/* New Badge */}
                    {challenge.isNew && (
                      <Badge className="absolute top-2 right-2 bg-blue-500 text-white">
                        NEW
                      </Badge>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Challenge Icon */}
                        <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                          challenge.type === 'daily' ? 'from-blue-500 to-cyan-600' :
                          challenge.type === 'weekly' ? 'from-purple-500 to-pink-600' :
                          'from-yellow-500 to-orange-600'
                        } flex items-center justify-center`}>
                          <categoryConfig.icon className="w-6 h-6 text-white" />
                        </div>

                        {/* Challenge Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold">{challenge.title}</h4>
                            <Badge className={`${difficultyInfo.color} text-white text-xs`}>
                              {difficultyInfo.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {challenge.type}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">
                            {challenge.description}
                          </p>

                          {/* Progress Bar */}
                          {!challenge.isCompleted && (
                            <div className="space-y-1 mb-3">
                              <div className="flex items-center justify-between text-sm">
                                <span>Progress</span>
                                <span className="font-semibold">
                                  {challenge.progress} / {challenge.maxProgress}
                                </span>
                              </div>
                              <Progress value={progressPercentage} className="h-2" />
                            </div>
                          )}

                          {/* Rewards */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Coins className="w-4 h-4 text-yellow-500" />
                              <span>{challenge.rewards.beatCoins}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-blue-500" />
                              <span>{challenge.rewards.xp} XP</span>
                            </div>
                            {challenge.rewards.packs && (
                              <div className="flex items-center gap-1">
                                <Gift className="w-4 h-4 text-purple-500" />
                                <span>{challenge.rewards.packs.join(', ')} pack</span>
                              </div>
                            )}
                            {challenge.rewards.cards && (
                              <div className="flex items-center gap-1">
                                <Crown className="w-4 h-4 text-yellow-500" />
                                <span>Exclusive Card</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Button & Time */}
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                          <Timer className="w-4 h-4" />
                          <span>{formatTimeLeft(challenge.timeLeft)}</span>
                        </div>

                        {challenge.isCompleted ? (
                          <div className="flex items-center gap-2 text-green-500">
                            <CheckCircle className="w-5 h-5" />
                            <span className="font-semibold">Completed</span>
                          </div>
                        ) : challenge.progress >= challenge.maxProgress ? (
                          <Button
                            onClick={() => handleClaimReward(challenge.id)}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                          >
                            <Gift className="w-4 h-4 mr-2" />
                            Claim
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm">
                            <Target className="w-4 h-4 mr-2" />
                            Track
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </ScrollArea>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Active Challenges', 
            value: challenges.filter(c => !c.isCompleted).length,
            icon: Target,
            color: 'text-blue-500'
          },
          { 
            label: 'Completed Today', 
            value: completedToday,
            icon: CheckCircle,
            color: 'text-green-500'
          },
          { 
            label: 'Total Rewards', 
            value: challenges.reduce((acc, c) => acc + c.rewards.beatCoins, 0),
            icon: Coins,
            color: 'text-yellow-500'
          },
          { 
            label: 'Streak Days', 
            value: 7, // Mock streak
            icon: Flame,
            color: 'text-red-500'
          }
        ].map((stat, i) => (
          <Card key={stat.label}>
            <CardContent className="p-4 text-center">
              <stat.icon className={`w-6 h-6 mx-auto mb-2 ${stat.color}`} />
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
