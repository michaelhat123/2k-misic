"use client"

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Search,
  Filter,
  Grid3X3,
  List,
  Star,
  Sparkles,
  Crown,
  Music,
  TrendingUp,
  Calendar,
  Award,
  Target
} from 'lucide-react'
import { MusicCard, MusicCardData, CardRarity } from './music-card'

interface CardCollectionProps {
  cards?: MusicCardData[]
  onCardSelect?: (card: MusicCardData) => void
  selectedCards?: string[]
  multiSelect?: boolean
}

const rarityOrder: Record<CardRarity, number> = {
  legendary: 4,
  epic: 3,
  rare: 2,
  common: 1
}

const rarityConfig = {
  common: { label: 'Common', color: 'text-gray-400', count: 0 },
  rare: { label: 'Rare', color: 'text-blue-400', count: 0 },
  epic: { label: 'Epic', color: 'text-purple-400', count: 0 },
  legendary: { label: 'Legendary', color: 'text-yellow-400', count: 0 }
}

export function CardCollection({ 
  cards = [], 
  onCardSelect, 
  selectedCards = [], 
  multiSelect = false 
}: CardCollectionProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [rarityFilter, setRarityFilter] = useState<CardRarity | 'all'>('all')
  const [genreFilter, setGenreFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'rarity' | 'popularity' | 'name'>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Mock data if no cards provided
  const mockCards: MusicCardData[] = useMemo(() => {
    if (cards.length > 0) return cards
    
    return Array.from({ length: 48 }, (_, i) => ({
      id: `card-${i}`,
      title: `Song ${i + 1}`,
      artist: `Artist ${Math.floor(i / 4) + 1}`,
      album: `Album ${Math.floor(i / 8) + 1}`,
      genre: ['Pop', 'Rock', 'Hip-Hop', 'Electronic', 'R&B'][Math.floor(Math.random() * 5)],
      year: 2020 + Math.floor(Math.random() * 5),
      rarity: ['common', 'common', 'rare', 'rare', 'epic', 'legendary'][Math.floor(Math.random() * 6)] as CardRarity,
      popularity: Math.floor(Math.random() * 100),
      albumArt: `https://picsum.photos/seed/${i}/300/300`,
      stats: {
        energy: Math.floor(Math.random() * 100),
        vibe: Math.floor(Math.random() * 100),
        tempo: Math.floor(Math.random() * 100)
      }
    }))
  }, [cards])

  // Calculate rarity counts
  const rarityCounts = useMemo(() => {
    const counts = { ...rarityConfig }
    mockCards.forEach(card => {
      counts[card.rarity].count++
    })
    return counts
  }, [mockCards])

  // Get unique genres
  const genres = useMemo(() => {
    const uniqueGenres = [...new Set(mockCards.map(card => card.genre).filter(Boolean))] as string[]
    return uniqueGenres.sort()
  }, [mockCards])

  // Filter and sort cards
  const filteredCards = useMemo(() => {
    let filtered = mockCards.filter(card => {
      const matchesSearch = searchQuery === '' || 
        card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.artist.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesRarity = rarityFilter === 'all' || card.rarity === rarityFilter
      const matchesGenre = genreFilter === 'all' || card.genre === genreFilter

      return matchesSearch && matchesRarity && matchesGenre
    })

    // Sort cards
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rarity':
          return rarityOrder[b.rarity] - rarityOrder[a.rarity]
        case 'popularity':
          return b.popularity - a.popularity
        case 'name':
          return a.title.localeCompare(b.title)
        case 'newest':
        default:
          return parseInt(b.id.split('-')[1]) - parseInt(a.id.split('-')[1])
      }
    })

    return filtered
  }, [mockCards, searchQuery, rarityFilter, genreFilter, sortBy])

  const handleCardClick = (card: MusicCardData) => {
    onCardSelect?.(card)
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{mockCards.length}</div>
            <div className="text-sm text-muted-foreground">Total Cards</div>
          </CardContent>
        </Card>
        
        {Object.entries(rarityCounts).map(([rarity, config]) => (
          <Card key={rarity} className="hover:bg-accent/50 transition-colors">
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${config.color}`}>
                {config.count}
              </div>
              <div className="text-sm text-muted-foreground">{config.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search cards by name or artist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Rarity Filter */}
        <Select value={rarityFilter} onValueChange={(value) => setRarityFilter(value as CardRarity | 'all')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Rarity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Rarities</SelectItem>
            <SelectItem value="legendary">🏆 Legendary</SelectItem>
            <SelectItem value="epic">💜 Epic</SelectItem>
            <SelectItem value="rare">💙 Rare</SelectItem>
            <SelectItem value="common">⚪ Common</SelectItem>
          </SelectContent>
        </Select>

        {/* Genre Filter */}
        <Select value={genreFilter} onValueChange={setGenreFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Genre" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Genres</SelectItem>
            {genres.map(genre => (
              <SelectItem key={genre} value={genre}>{genre}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">🆕 Newest</SelectItem>
            <SelectItem value="rarity">⭐ Rarity</SelectItem>
            <SelectItem value="popularity">📈 Popularity</SelectItem>
            <SelectItem value="name">🔤 Name</SelectItem>
          </SelectContent>
        </Select>

        {/* View Mode */}
        <div className="flex border rounded-lg">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="rounded-r-none"
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="rounded-l-none"
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Results Info */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredCards.length} of {mockCards.length} cards
        </div>
        
        {multiSelect && selectedCards.length > 0 && (
          <Badge variant="secondary">
            {selectedCards.length} selected
          </Badge>
        )}
      </div>

      {/* Cards Grid/List */}
      <ScrollArea className="h-[600px]">
        <AnimatePresence mode="wait">
          {filteredCards.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16"
            >
              <Target className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No cards found</h3>
              <p className="text-muted-foreground text-center max-w-md">
                Try adjusting your search or filters to find the cards you're looking for.
              </p>
            </motion.div>
          ) : (
            <motion.div
              key={`${viewMode}-${filteredCards.length}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4'
                  : 'space-y-2'
              }
            >
              {filteredCards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative ${
                    selectedCards.includes(card.id) ? 'ring-2 ring-purple-500 rounded-lg' : ''
                  }`}
                >
                  {viewMode === 'grid' ? (
                    <div onClick={() => handleCardClick(card)}>
                      <MusicCard 
                        card={card} 
                        size="sm"
                        showStats={false}
                      />
                    </div>
                  ) : (
                    <Card 
                      className="hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleCardClick(card)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={card.albumArt}
                            alt={card.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{card.title}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {card.artist}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              className={`${
                                card.rarity === 'legendary' ? 'bg-yellow-500' :
                                card.rarity === 'epic' ? 'bg-purple-500' :
                                card.rarity === 'rare' ? 'bg-blue-500' : 'bg-gray-500'
                              } text-white`}
                            >
                              {rarityCounts[card.rarity].label}
                            </Badge>
                            <div className="text-sm text-muted-foreground">
                              {card.popularity}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  {/* Selection indicator */}
                  {multiSelect && selectedCards.includes(card.id) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center z-10"
                    >
                      <Award className="w-4 h-4 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </ScrollArea>
    </div>
  )
}
