"use client"

import React, { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Play,
  Plus,
  X,
  Zap,
  Target,
  TrendingUp,
  Music,
  Sparkles,
  Crown,
  Star,
  GripVertical,
  Save,
  Shuffle,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Volume2,
  Info
} from 'lucide-react'
import { MusicCard, MusicCardData } from './music-card'
import { CardCollection } from './card-collection'
import { BeatMatchColors, getRarityConfig } from '@/lib/beatmatch/colors'

interface PlaylistBuilderProps {
  onSave?: (playlist: PlaylistData) => void
}

interface PlaylistData {
  id: string
  name: string
  cards: MusicCardData[]
  chemistry: number
  formation: string
}

interface ChemistryStats {
  overall: number
  energy: number
  vibe: number
  tempo: number
  genre: number
  era: number
}

// Formation templates (like FIFA formations)
const formations = [
  { id: '4-4-2', name: '4-4-2 Classic', slots: 10, description: 'Balanced energy distribution' },
  { id: '3-5-2', name: '3-5-2 Flow', slots: 10, description: 'Strong middle vibe section' },
  { id: '4-3-3', name: '4-3-3 Attack', slots: 10, description: 'High energy finish' },
  { id: '5-3-2', name: '5-3-2 Defense', slots: 10, description: 'Steady buildup' },
  { id: 'freestyle', name: 'Freestyle', slots: 15, description: 'No restrictions' }
]

function SortablePlaylistCard({ card, index, onRemove, onPlayPreview, isPlaying }: { 
  card: MusicCardData
  index: number
  onRemove: () => void
  onPlayPreview?: (cardId: string) => void
  isPlaying?: boolean
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="mb-2 hover:bg-accent/50 transition-colors">
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Drag Handle */}
            <div {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            {/* Position */}
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold">
              {index + 1}
            </div>

            {/* Card Image */}
            <img
              src={card.albumArt}
              alt={card.title}
              className="w-10 h-10 rounded-lg object-cover"
            />

            {/* Card Info */}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold truncate text-sm">{card.title}</h4>
              <p className="text-xs text-muted-foreground truncate">{card.artist}</p>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-2 text-xs">
              <Badge variant="outline" className="text-xs">
                E: {card.stats?.energy || 0}
              </Badge>
              <Badge variant="outline" className="text-xs">
                V: {card.stats?.vibe || 0}
              </Badge>
            </div>

            {/* Rarity */}
            <Badge className={`text-xs ${
              card.rarity === 'legendary' ? 'bg-yellow-500' :
              card.rarity === 'epic' ? 'bg-purple-500' :
              card.rarity === 'rare' ? 'bg-blue-500' : 'bg-gray-500'
            }`}>
              {card.rarity}
            </Badge>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Preview Button */}
              {onPlayPreview && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onPlayPreview(card.id)}
                  className="h-6 w-6 p-0 hover:bg-blue-500/20"
                  title={isPlaying ? "Stop preview" : "Play 30s preview"}
                >
                  {isPlaying ? (
                    <Volume2 className="w-3 h-3 text-blue-500" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </Button>
              )}
              
              {/* Remove Button */}
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemove}
                className="h-6 w-6 p-0 hover:bg-red-500/20"
                title="Remove from playlist"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function PlaylistBuilder({ onSave }: PlaylistBuilderProps) {
  const [selectedFormation, setSelectedFormation] = useState(formations[0])
  const [playlistCards, setPlaylistCards] = useState<MusicCardData[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showCollection, setShowCollection] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [playingPreview, setPlayingPreview] = useState<string | null>(null)

  // Calculate chemistry based on card synergy
  const calculateChemistry = useCallback((cards: MusicCardData[]): ChemistryStats => {
    if (cards.length === 0) {
      return { overall: 0, energy: 0, vibe: 0, tempo: 0, genre: 0, era: 0 }
    }

    // Energy chemistry - how well energy levels flow
    const energyLevels = cards.map(c => c.stats?.energy || 0)
    const energyVariance = energyLevels.reduce((acc, val, i, arr) => {
      if (i === 0) return acc
      const prevVal = arr[i - 1]
      if (prevVal === undefined) return acc
      return acc + Math.abs(val - prevVal)
    }, 0) / Math.max(1, energyLevels.length - 1)
    const energyScore = Math.max(0, 100 - energyVariance)

    // Vibe chemistry - similar vibes work better together
    const vibeLevels = cards.map(c => c.stats?.vibe || 0)
    const avgVibe = vibeLevels.reduce((a, b) => a + b, 0) / vibeLevels.length
    const vibeConsistency = vibeLevels.reduce((acc, val) => acc + Math.abs(val - avgVibe), 0) / vibeLevels.length
    const vibeScore = Math.max(0, 100 - vibeConsistency * 2)

    // Tempo chemistry - gradual tempo changes are better
    const tempoLevels = cards.map(c => c.stats?.tempo || 0)
    const tempoVariance = tempoLevels.reduce((acc, val, i, arr) => {
      if (i === 0) return acc
      const prevVal = arr[i - 1]
      if (prevVal === undefined) return acc
      return acc + Math.abs(val - prevVal)
    }, 0) / Math.max(1, tempoLevels.length - 1)
    const tempoScore = Math.max(0, 100 - tempoVariance)

    // Genre chemistry - same genres get bonus
    const genres = cards.map(c => c.genre).filter(Boolean) as string[]
    const genreMap = genres.reduce((acc, genre) => {
      if (genre) {
        acc[genre] = (acc[genre] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    const genreBonus = Object.values(genreMap).reduce((acc, count) => acc + (count > 1 ? count * 10 : 0), 0)
    const genreScore = Math.min(100, 50 + genreBonus)

    // Era chemistry - similar years work well
    const years = cards.map(c => c.year).filter(Boolean) as number[]
    const avgYear = years.length > 0 ? years.reduce((a, b) => a + b, 0) / years.length : 0
    const yearSpread = years.length > 0 ? years.reduce((acc, year) => acc + Math.abs(year - avgYear), 0) / years.length : 0
    const eraScore = Math.max(0, 100 - yearSpread * 5)

    // Overall chemistry
    const overall = (energyScore + vibeScore + tempoScore + genreScore + eraScore) / 5

    return {
      overall: Math.round(overall),
      energy: Math.round(energyScore),
      vibe: Math.round(vibeScore),
      tempo: Math.round(tempoScore),
      genre: Math.round(genreScore),
      era: Math.round(eraScore)
    }
  }, [])

  const chemistry = calculateChemistry(playlistCards)

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      setPlaylistCards(cards => {
        const oldIndex = cards.findIndex(card => card.id === active.id)
        const newIndex = cards.findIndex(card => card.id === over.id)
        return arrayMove(cards, oldIndex, newIndex)
      })
    }
  }

  // Auto-save functionality
  useEffect(() => {
    const autoSave = setTimeout(() => {
      if (playlistCards.length > 0) {
        localStorage.setItem('beatmatch-playlist-draft', JSON.stringify({
          formation: selectedFormation.id,
          cards: playlistCards,
          timestamp: Date.now()
        }))
      }
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSave)
  }, [playlistCards, selectedFormation])

  // Load draft on mount
  useEffect(() => {
    try {
      const draft = localStorage.getItem('beatmatch-playlist-draft')
      if (draft) {
        const parsed = JSON.parse(draft)
        const formation = formations.find(f => f.id === parsed.formation)
        if (formation && parsed.cards) {
          setSelectedFormation(formation)
          setPlaylistCards(parsed.cards)
          toast.success('Draft playlist restored!')
        }
      }
    } catch (error) {
      // Silent fail
    }
  }, [])

  const handleCardSelect = (card: MusicCardData) => {
    try {
      if (playlistCards.length >= selectedFormation.slots) {
        toast.error(`Formation is full! Maximum ${selectedFormation.slots} cards allowed.`)
        return
      }

      if (!playlistCards.find(c => c.id === card.id)) {
        setPlaylistCards(prev => [...prev, card])
        toast.success(`Added "${card.title}" to playlist`)
        
        // Play sound effect (placeholder)
        // playSound('card-add')
      } else {
        toast.info('Card already in playlist')
      }
    } catch (error) {
      setError('Failed to add card to playlist')
      toast.error('Failed to add card')
    }
  }

  const handleRemoveCard = (cardId: string) => {
    try {
      const card = playlistCards.find(c => c.id === cardId)
      setPlaylistCards(prev => prev.filter(c => c.id !== cardId))
      if (card) {
        toast.success(`Removed "${card.title}" from playlist`)
      }
    } catch (error) {
      setError('Failed to remove card')
      toast.error('Failed to remove card')
    }
  }

  const handleSavePlaylist = async () => {
    if (playlistCards.length === 0) {
      toast.error('Cannot save empty playlist')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const playlist: PlaylistData = {
        id: `playlist-${Date.now()}`,
        name: `${selectedFormation.name} Playlist`,
        cards: playlistCards,
        chemistry: chemistry.overall,
        formation: selectedFormation.id
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      onSave?.(playlist)
      setLastSaved(new Date())
      localStorage.removeItem('beatmatch-playlist-draft') // Clear draft
      
      toast.success(`Playlist saved! Chemistry: ${chemistry.overall}`)
      
      // Play success sound
      // playSound('playlist-saved')
      
    } catch (error) {
      setError('Failed to save playlist')
      toast.error('Failed to save playlist')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClearPlaylist = () => {
    if (playlistCards.length === 0) return
    
    setPlaylistCards([])
    localStorage.removeItem('beatmatch-playlist-draft')
    toast.success('Playlist cleared')
  }

  const handlePlayPreview = (cardId: string) => {
    if (playingPreview === cardId) {
      setPlayingPreview(null)
      toast.info('Preview stopped')
    } else {
      setPlayingPreview(cardId)
      toast.info('Playing 30s preview...')
      
      // Auto-stop after 30 seconds
      setTimeout(() => {
        setPlayingPreview(null)
      }, 30000)
    }
  }

  const activeCard = playlistCards.find(card => card.id === activeId)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Left Panel - Collection */}
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Your Collection</h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCollection(!showCollection)}
          >
            {showCollection ? 'Hide' : 'Show'} Collection
          </Button>
        </div>

        {showCollection && (
          <div className="h-[600px]">
            <CardCollection
              onCardSelect={handleCardSelect}
              selectedCards={playlistCards.map(c => c.id)}
            />
          </div>
        )}
      </div>

      {/* Right Panel - Playlist Builder */}
      <div className="space-y-6">
        {/* Formation Selector */}
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-3">Formation</h4>
            <div className="space-y-2">
              {formations.map(formation => (
                <Button
                  key={formation.id}
                  variant={selectedFormation.id === formation.id ? 'default' : 'outline'}
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setSelectedFormation(formation)}
                >
                  <Target className="w-4 h-4 mr-2" />
                  {formation.name}
                  <Badge variant="secondary" className="ml-auto">
                    {formation.slots}
                  </Badge>
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedFormation.description}
            </p>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-red-500">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setError(null)}
                  className="ml-auto h-6 w-6 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Chemistry Display */}
        <Card className="relative">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">Chemistry</h4>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              </div>
              <div className="flex items-center gap-2">
                <Zap className={`w-5 h-5 ${
                  chemistry.overall >= 80 ? 'text-green-500' :
                  chemistry.overall >= 60 ? 'text-yellow-500' : 'text-red-500'
                }`} />
                <span className="text-2xl font-bold">{chemistry.overall}</span>
                {chemistry.overall >= 90 && (
                  <Badge className="bg-green-500 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Perfect!
                  </Badge>
                )}
              </div>
            </div>

            {/* Chemistry Tips */}
            {chemistry.overall < 50 && playlistCards.length > 2 && (
              <div className="mb-3 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <div className="flex items-center gap-2 text-yellow-600">
                  <Info className="w-4 h-4" />
                  <span className="text-xs">
                    Try adding cards from the same genre or era to improve chemistry!
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {[
                { label: 'Energy Flow', value: chemistry.energy, icon: TrendingUp },
                { label: 'Vibe Match', value: chemistry.vibe, icon: Sparkles },
                { label: 'Tempo Sync', value: chemistry.tempo, icon: Music },
                { label: 'Genre Bonus', value: chemistry.genre, icon: Star },
                { label: 'Era Cohesion', value: chemistry.era, icon: Crown }
              ].map(stat => (
                <div key={stat.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <stat.icon className="w-3 h-3" />
                      <span>{stat.label}</span>
                    </div>
                    <span className="font-semibold">{stat.value}</span>
                  </div>
                  <Progress value={stat.value} className="h-1" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Playlist */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold">
                  Playlist ({playlistCards.length}/{selectedFormation.slots})
                </h4>
                {lastSaved && (
                  <Badge variant="outline" className="text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Saved {new Date(lastSaved).toLocaleTimeString()}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearPlaylist}
                  disabled={playlistCards.length === 0 || isSaving}
                  title="Clear all cards"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePlaylist}
                  disabled={playlistCards.length === 0 || isSaving}
                  className="relative"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Progress indicator */}
            <div className="mb-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Formation Progress</span>
                <span>{Math.round((playlistCards.length / selectedFormation.slots) * 100)}%</span>
              </div>
              <Progress 
                value={(playlistCards.length / selectedFormation.slots) * 100} 
                className="h-2"
              />
            </div>

            <ScrollArea className="h-[400px]">
              <DndContext
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={playlistCards.map(c => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <AnimatePresence>
                    {playlistCards.map((card, index) => (
                      <motion.div
                        key={card.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <SortablePlaylistCard
                          card={card}
                          index={index}
                          onRemove={() => handleRemoveCard(card.id)}
                          onPlayPreview={handlePlayPreview}
                          isPlaying={playingPreview === card.id}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </SortableContext>

                <DragOverlay>
                  {activeCard && (
                    <Card className="opacity-90 rotate-3 shadow-2xl">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={activeCard.albumArt}
                            alt={activeCard.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <h4 className="font-semibold text-sm">{activeCard.title}</h4>
                            <p className="text-xs text-muted-foreground">{activeCard.artist}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </DragOverlay>
              </DndContext>

              {/* Empty State */}
              {playlistCards.length === 0 && (
                <div className="text-center py-8">
                  <Plus className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Select cards from your collection to build your playlist
                  </p>
                </div>
              )}

              {/* Formation Slots Remaining */}
              {playlistCards.length < selectedFormation.slots && (
                <div className="mt-4 p-3 border-2 border-dashed border-muted rounded-lg text-center">
                  <p className="text-sm text-muted-foreground">
                    {selectedFormation.slots - playlistCards.length} more slots available
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
