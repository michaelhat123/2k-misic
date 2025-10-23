'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Music, Clock, Search, Download, Shuffle, MoreHorizontal, Pause, Menu, Check, List, ChevronLeft, Album as AlbumIcon, User, ChevronRight, X } from 'lucide-react';
import { usePlayer } from '@/components/player/player-provider';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { extractDominantColor, rgbToCss, darkenColor } from '@/lib/utils/color-extractor';
import { searchApi } from '@/lib/api/search';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { SongActions } from '@/components/ui/song-actions';

interface AlbumDetailViewProps {
  album: any;
  tracks: any[];
  onBack: () => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  observerRef: React.RefObject<HTMLDivElement>;
}

export function AlbumDetailView({
  album,
  tracks,
  onBack,
  onLoadMore,
  hasMore,
  isLoading,
  observerRef
}: AlbumDetailViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState('custom');
  const [viewAs, setViewAs] = useState('list');
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [npvExpanded, setNpvExpanded] = useState(false);
  const [dominantColor, setDominantColor] = useState<number[]>([30, 30, 30]);
  const [artistDominantColor, setArtistDominantColor] = useState<string>('#3b82f6');
  const [artistAlbums, setArtistAlbums] = useState<any[]>([]);
  const [artistBiography, setArtistBiography] = useState<any>(null);
  const [artistImages, setArtistImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageTransitioning, setImageTransitioning] = useState(false);
  const [loadingArtistData, setLoadingArtistData] = useState(false);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [loadingTopArtists, setLoadingTopArtists] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showBioDialog, setShowBioDialog] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { playTrack, setQueue, clearQueue, toggleShuffle, shuffle, currentTrack, isPlaying } = usePlayer();

  // Format duration
  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Filtered and sorted tracks
  const filteredTracks = useMemo(() => {
    let filtered = [...tracks];
    
    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(track =>
        track.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artists?.some((a: any) => a.name?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'artist':
        filtered.sort((a, b) => {
          const aArtist = a.artists?.[0]?.name || '';
          const bArtist = b.artists?.[0]?.name || '';
          return aArtist.localeCompare(bArtist);
        });
        break;
      case 'duration':
        filtered.sort((a, b) => (b.duration_ms || 0) - (a.duration_ms || 0));
        break;
    }
    
    return filtered;
  }, [tracks, searchQuery, sortBy]);

  // Shuffle function using Fisher-Yates algorithm
  const shuffleArray = (array: any[]) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Handle shuffle toggle
  const handleShuffleToggle = () => {
    if (!shuffle) {
      // Turning shuffle ON - shuffle the current queue
      if (filteredTracks && filteredTracks.length > 0) {
        const shuffledTracks = shuffleArray(filteredTracks);
        
        const globalQueue = shuffledTracks.map(t => ({
          id: t.id,
          title: t.name,
          artist: t.artists?.map((a: any) => a.name).join(', ') || '',
          album: album.name || '',
          albumArt: album.images?.[0]?.url || '',
          duration: t.duration_ms ? Math.floor(t.duration_ms / 1000) : 0,
          url: t.external_urls?.spotify || '',
          spotifyId: t.id,
          genre: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        
        setQueue(globalQueue);
      }
    } else {
      // Turning shuffle OFF - clear the queue entirely
      clearQueue();
    }
    
    // Toggle the player's shuffle state
    toggleShuffle();
  };

  // Play track handler
  const handlePlayTrack = (track: any) => {
    playTrack({
      id: track.id,
      title: track.name,
      artist: track.artists?.map((a: any) => a.name).join(', ') || '',
      album: album.name || '',
      albumArt: album.images?.[0]?.url || '',
      duration: track.duration_ms ? Math.floor(track.duration_ms / 1000) : 0,
      url: track.external_urls?.spotify || '',
      spotifyId: track.id,
      genre: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  };

  // Search handlers
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleHideSearchIfEmpty = () => {
    if (!searchQuery.trim()) {
      setShowSearch(false);
    }
  };

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="text-[#00BFFF] font-medium">
          {part}
        </span>
      ) : part
    );
  };

  // Focus input when search opens
  React.useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [showSearch]);

  // Scroll detection for sticky header
  React.useEffect(() => {
    const computeOpacity = () => {
      let scrollTop = 0;
      const root = scrollAreaRef.current;
      const viewport = root?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      
      if (viewport) {
        scrollTop = viewport.scrollTop;
      }

      const startFade = 80;
      const fullOpacity = 160;
      let opacity = 0;
      
      if (scrollTop > startFade) {
        opacity = Math.min((scrollTop - startFade) / (fullOpacity - startFade), 1);
      }

      setHeaderOpacity(opacity);
    };

    const root = scrollAreaRef.current;
    let viewport: HTMLElement | null = null;

    const tryAttachToViewport = () => {
      viewport = (root?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement) || null;
      if (viewport) {
        viewport.addEventListener('scroll', computeOpacity, { passive: true } as AddEventListenerOptions);
        computeOpacity();
      }
    };

    tryAttachToViewport();
    const t1 = setTimeout(tryAttachToViewport, 100);
    const t2 = setTimeout(tryAttachToViewport, 400);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      if (viewport) viewport.removeEventListener('scroll', computeOpacity);
    };
  }, []);

  // Extract album data
  const albumImage = album?.images?.[0]?.url;
  const albumArtist = album?.artists?.[0]?.name || 'Unknown Artist';
  const releaseYear = album?.release_date ? new Date(album.release_date).getFullYear() : null;

  // Create gradient style from dominant color
  const createGradientStyle = useCallback((dominantColor: string) => {
    const iconicDarkBlue = '#0a0a1a';
    const mediumDarkBlue = '#1a1a2e';
    
    const rgbMatch = dominantColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);
      const accentR = Math.floor(r * 0.4);
      const accentG = Math.floor(g * 0.4);
      const accentB = Math.floor(b * 0.4);
      
      return {
        background: `linear-gradient(135deg, 
          ${iconicDarkBlue} 0%, 
          ${mediumDarkBlue} 30%, 
          rgb(${accentR}, ${accentG}, ${accentB}) 70%, 
          ${iconicDarkBlue} 100%)`
      };
    }
    
    return {
      background: `linear-gradient(135deg, ${iconicDarkBlue} 0%, ${mediumDarkBlue} 50%, ${iconicDarkBlue} 100%)`
    };
  }, []);

  // Extract dominant color from album art
  useEffect(() => {
    const albumImg = album?.images?.[0]?.url || album?.images?.[0];
    if (albumImg) {
      extractDominantColor(albumImg)
        .then((color) => {
          setDominantColor(color);
        })
        .catch(() => {
          setDominantColor([30, 30, 30]); // Fallback to dark
        });
    }
  }, [album]);

  // Fetch artist albums and biography
  useEffect(() => {
    const fetchArtistData = async () => {
      const artistName = album?.artists?.[0]?.name || 'Unknown Artist';
      if (!artistName || artistName === 'Unknown Artist') return;

      setLoadingArtistData(true);
      setLoadingTopArtists(true);
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      try {
        // Fetch artist images (scraper endpoint)
        try {
          const imagesResponse = await fetch(`${API_BASE_URL}/artist-images/${encodeURIComponent(artistName)}`);
          if (imagesResponse.ok) {
            const imagesData = await imagesResponse.json();
            const imagesArray = Array.isArray(imagesData) ? imagesData : (imagesData.images || []);
            if (imagesArray.length > 0) {
              const imageUrls = imagesArray.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean);
              setArtistImages(imageUrls);
            }
          }
        } catch (error) {
          // Silent fail
        }

        // Fetch artist albums using artist ID
        const artistId = album?.artists?.[0]?.id;
        if (artistId) {
          const albumsResponse = await fetch(`${API_BASE_URL}/artists/${artistId}/albums?limit=6`);
          if (albumsResponse.ok) {
            const albumsData = await albumsResponse.json();
            setArtistAlbums(albumsData.items || albumsData.albums || []);
          }
        }

        // Fetch artist biography
        const bioResponse = await fetch(`${API_BASE_URL}/artist/${encodeURIComponent(artistName)}/biography`);
        if (bioResponse.ok) {
          const bioData = await bioResponse.json();
          setArtistBiography(bioData);
        }

        // Fetch top artists
        try {
          const topArtistsResponse = await searchApi.getTopArtists(6);
          setTopArtists(topArtistsResponse.artists || []);
        } catch (error) {
          // Silent fail
        } finally {
          setLoadingTopArtists(false);
        }
      } catch (error) {
        // Silent fail
      } finally {
        setLoadingArtistData(false);
      }
    };

    fetchArtistData();
  }, [album]);

  // Extract dominant color from artist image for biography background
  useEffect(() => {
    if (artistImages && artistImages.length > 0) {
      const currentArtistImage = artistImages[currentImageIndex];
      if (currentArtistImage) {
        extractDominantColor(currentArtistImage)
          .then((color) => {
            const rgbString = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
            setArtistDominantColor(rgbString);
          })
          .catch(() => {
            setArtistDominantColor('#3b82f6');
          });
      }
    }
  }, [artistImages, currentImageIndex]);

  // Detect Now Playing View expanded
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkExpanded = () => {
      const expandedEl = document.querySelector('.fixed.inset-0.z-50');
      setNpvExpanded(!!expandedEl);
    };

    checkExpanded();
    const observer = new MutationObserver(() => checkExpanded());
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative h-full">
      {/* Floating Header Overlay */}
      <div
        className="absolute left-0 right-0 top-0 backdrop-blur-md border-b border-white/10 z-[70] px-4 py-2 transition-all duration-200 shadow-lg"
        style={{ 
          opacity: npvExpanded ? 0 : headerOpacity,
          pointerEvents: npvExpanded ? 'none' : (headerOpacity > 0 ? 'auto' : 'none'),
          background: `linear-gradient(to right, ${rgbToCss(dominantColor, 0.95)}, ${rgbToCss(dominantColor, 0.9)})`
        }}
      >
        <div className="flex items-center space-x-3">
          {/* Play Button */}
          <button
            onClick={() => {
              if (filteredTracks.length > 0) {
                // Create queue with all tracks
                const globalQueue = filteredTracks.map(t => ({
                  id: t.id,
                  title: t.name,
                  artist: t.artists?.map((a: any) => a.name).join(', ') || '',
                  album: album.name || '',
                  albumArt: album.images?.[0]?.url || '',
                  duration: t.duration_ms ? Math.floor(t.duration_ms / 1000) : 0,
                  url: t.external_urls?.spotify || '',
                  spotifyId: t.id,
                  genre: '',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                }));
                
                setQueue(globalQueue);
                handlePlayTrack(filteredTracks[0]);
              }
            }}
            disabled={filteredTracks.length === 0}
            className="w-10 h-10 rounded-full bg-[#00BFFF] hover:bg-[#0099CC] transition-colors flex items-center justify-center group disabled:bg-[#00BFFF]/50 disabled:cursor-not-allowed"
          >
            <Play className="w-4 h-4 text-[#222222] ml-0.5" />
          </button>
          
          {/* Album Name */}
          <h2 className="text-white text-lg font-semibold truncate">
            {album?.name}
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        {/* Header */}
        <div className="p-6">
          <div className="flex items-end space-x-6">
            {/* Album Image */}
            <div className="relative group">
              {albumImage ? (
                <img
                  src={albumImage}
                  alt={album?.name}
                  className="w-48 h-48 rounded-lg object-cover shadow-2xl"
                />
              ) : (
                <div className="w-48 h-48 rounded-lg flex items-center justify-center bg-[#1e293b]/30 shadow-2xl">
                  <AlbumIcon className="w-16 h-16 text-[#00BFFF]" />
                </div>
              )}
            </div>
            
            {/* Album Info */}
            <div className="flex-1">
              <div className="text-sm text-white/70 mb-2">Album</div>
              <h1 className="text-6xl font-black mb-4 text-white leading-tight break-words">
                {album?.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-white/90">
                <span>{albumArtist}</span>
                {releaseYear && (
                  <>
                    <span>•</span>
                    <span>{releaseYear}</span>
                  </>
                )}
                <span>•</span>
                <span>{tracks.length} songs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Main Play Button */}
              <button 
                onClick={() => {
                  if (filteredTracks.length > 0) {
                    // Create queue with all tracks
                    const globalQueue = filteredTracks.map(t => ({
                      id: t.id,
                      title: t.name,
                      artist: t.artists?.map((a: any) => a.name).join(', ') || '',
                      album: album.name || '',
                      albumArt: album.images?.[0]?.url || '',
                      duration: t.duration_ms ? Math.floor(t.duration_ms / 1000) : 0,
                      url: t.external_urls?.spotify || '',
                      spotifyId: t.id,
                      genre: '',
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    }));
                    
                    setQueue(globalQueue);
                    handlePlayTrack(filteredTracks[0]);
                  }
                }}
                disabled={filteredTracks.length === 0}
                className="w-12 h-12 bg-[#00BFFF] hover:bg-[#00BFFF]/80 rounded-full flex items-center justify-center transition-colors disabled:bg-[#00BFFF]/50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5 text-[#222222] ml-0.5" />
              </button>
              
              {/* Shuffle Button */}
              <button 
                onClick={handleShuffleToggle}
                className={`p-2 transition-colors ${
                  shuffle 
                    ? 'text-[#00BFFF] hover:text-[#00BFFF]/80' 
                    : 'text-gray-400 hover:text-white'
                }`}
                title={shuffle ? 'Disable shuffle' : 'Enable shuffle'}
              >
                <Shuffle className="w-5 h-5" />
              </button>
              
              {/* Download Button */}
              <button 
                className="p-2 text-gray-400 hover:text-white transition-colors"
                title="Download album"
              >
                <Download className="w-5 h-5" />
              </button>
              
              {/* More Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48 bg-background backdrop-blur-md border-border shadow-2xl space-y-1.5 p-2">
                  <DropdownMenuItem 
                    onClick={() => {
                      if (tracks.length > 0) {
                        const queue = tracks.map(t => ({
                          id: t.id,
                          title: t.name,
                          artist: t.artists?.map((a: any) => a.name).join(', ') || '',
                          album: t.album?.name || '',
                          albumArt: t.album?.images?.[0]?.url || '',
                          duration: t.duration_ms ? Math.floor(t.duration_ms / 1000) : 0,
                          url: t.external_urls?.spotify || '',
                          genre: '',
                          createdAt: new Date().toISOString(),
                          updatedAt: new Date().toISOString()
                        }));
                        setQueue(queue);
                        toast.success(`Added ${tracks.length} songs to queue`);
                      }
                    }}
                    className="flex items-center text-white hover:bg-accent focus:bg-accent cursor-pointer text-xs h-7 rounded-md"
                  >
                    <List className="h-3 w-3 mr-2" />
                    <span>Add to queue</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            {/* Search and Sort Controls */}
            <div className="flex justify-end items-center h-12 space-x-2">
              {/* Search - animated */}
              <AnimatePresence initial={false}>
                {!showSearch ? (
                  <motion.div
                    key="search-icon"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: 'easeOut' }}
                    className="h-12 flex items-center"
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSearch(true)}
                      className="group h-10 w-10 focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none hover:bg-transparent"
                      title="Search"
                    >
                      <Search className="h-5 w-5 text-muted-foreground group-hover:text-[#00BFFF] transition-colors" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="search-input"
                    initial={{ width: 44, opacity: 0, x: 8 }}
                    animate={{ width: 256, opacity: 1, x: 0 }}
                    exit={{ width: 44, opacity: 0, x: 8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="relative h-12 flex items-center"
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="relative w-[256px]">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Search in tracks"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onBlur={handleHideSearchIfEmpty}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape' && !searchQuery.trim()) {
                            setShowSearch(false);
                          }
                        }}
                        className="pl-12 pr-4 h-12 rounded-full bg-background/60 border border-[#1f2937] focus:border-[#1f2937] hover:bg-background/80 transition-colors"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Sort/View Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="group h-10 w-10 hover:scale-105 transition-transform hover:bg-transparent"
                    title="Sort and view options"
                  >
                    <Menu className="h-5 w-5 text-muted-foreground group-hover:text-[#00BFFF] transition-colors" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-background backdrop-blur-md border-border">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Sort by</div>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('custom')}
                    className="flex items-center justify-between"
                  >
                    <span className={sortBy === 'custom' ? 'text-[#00BFFF]' : ''}>Custom order</span>
                    {sortBy === 'custom' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('title')}
                    className="flex items-center justify-between"
                  >
                    <span className={sortBy === 'title' ? 'text-[#00BFFF]' : ''}>Title</span>
                    {sortBy === 'title' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('artist')}
                    className="flex items-center justify-between"
                  >
                    <span className={sortBy === 'artist' ? 'text-[#00BFFF]' : ''}>Artist</span>
                    {sortBy === 'artist' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setSortBy('duration')}
                    className="flex items-center justify-between"
                  >
                    <span className={sortBy === 'duration' ? 'text-[#00BFFF]' : ''}>Duration</span>
                    {sortBy === 'duration' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator className="bg-border" />
                  
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">View as</div>
                  <DropdownMenuItem 
                    onClick={() => setViewAs('compact')}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <Menu className="h-4 w-4 mr-2" />
                      <span className={viewAs === 'compact' ? 'text-[#00BFFF]' : ''}>Compact</span>
                    </div>
                    {viewAs === 'compact' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setViewAs('list')}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <List className="h-4 w-4 mr-2" />
                      <span className={viewAs === 'list' ? 'text-[#00BFFF]' : ''}>List</span>
                    </div>
                    {viewAs === 'list' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Track List */}
        <div className="px-6">
          {isLoading && filteredTracks.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#00BFFF] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#00BFFF] rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-[#00BFFF] rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            </div>
          ) : filteredTracks.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchQuery ? 'No tracks match your search' : 'No tracks found'}
                </p>
              </div>
            </div>
          ) : (
            <div>
              {viewAs === 'compact' ? (
                // Compact View
                <div className="space-y-1">
                  {filteredTracks.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      onClick={() => handlePlayTrack(track)}
                      className="group flex items-center p-2 rounded hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      <div className="w-6 text-center text-gray-400 text-sm group-hover:hidden">
                        {index + 1}
                      </div>
                      <button className="w-6 hidden group-hover:flex items-center justify-center">
                        <Play className="w-3 h-3 text-white" />
                      </button>
                      
                      {track.album?.images?.[0]?.url && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.album?.name}
                          className="w-8 h-8 rounded ml-3"
                        />
                      )}
                      
                      <div className="flex-1 ml-3 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-white text-sm font-medium truncate">{highlightMatch(track.name, searchQuery)}</p>
                          <span className="text-gray-500">•</span>
                          <p className="text-gray-400 text-sm truncate">
                            {highlightMatch(track.artists?.map((a: any) => a.name).join(', ') || '', searchQuery)}
                          </p>
                        </div>
                      </div>
                      
                      {track.duration_ms && (
                        <div className="w-12 text-right text-gray-400 text-xs">
                          {formatDuration(track.duration_ms)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                // List View (Default)
                <div className="space-y-1">
                  {filteredTracks.map((track, index) => (
                    <div
                      key={`${track.id}-${index}`}
                      onClick={() => handlePlayTrack(track)}
                      className="group flex items-center p-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      <div className="w-8 text-center text-gray-400 group-hover:hidden">
                        {index + 1}
                      </div>
                      <button className="w-8 hidden group-hover:flex items-center justify-center">
                        <Play className="w-4 h-4 text-white" />
                      </button>
                      
                      {track.album?.images?.[0]?.url && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.album?.name}
                          className="w-10 h-10 rounded ml-4"
                        />
                      )}
                      
                      <div className="flex-1 ml-4 min-w-0">
                        <p className="text-white font-medium truncate">{highlightMatch(track.name, searchQuery)}</p>
                        <p className="text-gray-400 text-sm truncate">
                          {highlightMatch(track.artists?.map((a: any) => a.name).join(', ') || '', searchQuery)}
                        </p>
                      </div>
                      
                      {track.duration_ms && (
                        <div className="w-16 text-right text-gray-400 text-sm">
                          {formatDuration(track.duration_ms)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Infinite Scroll Trigger */}
          <div ref={observerRef} className="h-4 flex items-center justify-center">
            {isLoading && (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
              </div>
            )}
          </div>

          {/* More from Artist Section */}
          {loadingArtistData ? (
            <div className="mt-8 pr-6">
              <h2 className="text-lg font-semibold text-white mb-3 pl-3">More from {albumArtist}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pl-3">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="aspect-square rounded-lg bg-gray-700 mb-3"></div>
                    <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : artistAlbums && artistAlbums.length > 0 && (
            <div className="mt-8 pr-6">
              <h2 className="text-lg font-semibold text-white mb-3 pl-3">More from {albumArtist}</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pl-3">
                {artistAlbums.slice(0, 6).map((artistAlbum) => (
                  <div
                    key={artistAlbum.id}
                    onClick={() => {
                      // Navigate to album page
                      window.location.href = `/album/${artistAlbum.id}`;
                    }}
                    className="group cursor-pointer transition-all duration-200 hover:scale-105"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 mb-3">
                      {artistAlbum.images && artistAlbum.images[0] ? (
                        <img
                          src={artistAlbum.images[0].url}
                          alt={artistAlbum.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <AlbumIcon className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-[#00BFFF] rounded-full flex items-center justify-center transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <Play className="w-5 h-5 text-black ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="px-1">
                      <h3 className="text-white text-sm font-medium truncate mb-1">
                        {artistAlbum.name}
                      </h3>
                      <p className="text-gray-400 text-xs truncate">
                        {artistAlbum.release_date ? new Date(artistAlbum.release_date).getFullYear() : ''} • {artistAlbum.album_type || 'Album'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About Section */}
          <div className="mt-8 mb-8 pr-6">
            <h2 className="text-lg font-semibold text-white mb-4 pl-3">About the artist</h2>
            {loadingArtistData || artistImages.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 pl-3">
                <div className="relative aspect-square md:rounded-l-xl rounded-t-xl md:rounded-tr-none overflow-hidden bg-gradient-to-br from-gray-800/50 via-gray-900/70 to-gray-800/50 animate-pulse"></div>
                <div className="relative aspect-square md:rounded-r-xl rounded-b-xl md:rounded-bl-none overflow-hidden bg-gradient-to-br from-gray-800/50 via-gray-900/70 to-gray-800/50 animate-pulse"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-0 pl-3">
                {/* Left: Artist Images Carousel */}
                <div className="relative aspect-square md:rounded-l-xl rounded-t-xl md:rounded-tr-none overflow-hidden bg-gray-800 group">
                  {artistImages && artistImages.length > 0 ? (
                  <>
                    <img
                      src={artistImages[currentImageIndex]}
                      alt={albumArtist}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setShowImageDialog(true)}
                    />
                    
                    {/* Artist Name Overlay - Bottom Left */}
                    <div className="absolute bottom-0 left-2 pb-1">
                      <h3 className="text-white text-base font-bold drop-shadow-2xl">
                        {albumArtist}
                      </h3>
                    </div>
                    
                    {/* Navigation Arrows */}
                    {artistImages.length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            const prevIndex = (currentImageIndex - 1 + artistImages.length) % artistImages.length;
                            setCurrentImageIndex(prevIndex);
                          }}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={() => {
                            const nextIndex = (currentImageIndex + 1) % artistImages.length;
                            setCurrentImageIndex(nextIndex);
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-20 h-20 text-gray-600" />
                  </div>
                )}
              </div>

              {/* Right: Biography */}
              <div 
                className="aspect-square md:rounded-r-xl rounded-b-xl md:rounded-bl-none overflow-hidden shadow-2xl relative transition-all duration-300 ease-in-out cursor-pointer"
                style={createGradientStyle(artistDominantColor)}
                onClick={() => setShowBioDialog(true)}
              >
                <ScrollArea className="h-full w-full">
                  <div className="p-6 space-y-4 relative z-10">
                    <h3 className="text-xl font-bold text-white">{albumArtist}</h3>
                    {artistBiography ? (
                      <div className="space-y-4 text-white/90">
                        {artistBiography.stats && (
                          <div className="flex gap-4 text-sm">
                            <div>
                              <span className="text-white/60">Listeners:</span>{' '}
                              <span className="font-semibold">{artistBiography.stats.listeners?.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-white/60">Plays:</span>{' '}
                              <span className="font-semibold">{artistBiography.stats.playcount?.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                        {artistBiography.biography && (
                          <p className="leading-relaxed text-base line-clamp-6">
                            {artistBiography.biography.length > 300 
                              ? `${artistBiography.biography.substring(0, 300)}...` 
                              : artistBiography.biography}
                          </p>
                        )}
                        {artistBiography.tags && artistBiography.tags.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-white/70 mb-2">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {artistBiography.tags.slice(0, 8).map((tag: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-white/10 rounded-full text-sm text-white/80">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-base text-white/60">No biography available</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
              </div>
            )}
          </div>

          {/* Other Artists Section */}
          <div className="mt-8 pr-6">
            <h2 className="text-lg font-semibold text-white mb-4 pl-3">Other Artists</h2>
            {loadingTopArtists ? (
              /* Skeleton for loading artists - matches exact structure */
              <div className="grid grid-cols-6 gap-3 pl-3">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="cursor-default">
                    <div className="relative aspect-square rounded-full overflow-hidden bg-gray-700 mb-3">
                      <div className="w-full h-full animate-pulse bg-gray-700"></div>
                    </div>
                    <div className="px-1 text-center">
                      <div className="h-4 bg-gray-700 rounded mx-auto w-3/4 mb-1 animate-pulse"></div>
                      <div className="h-3 bg-gray-700 rounded mx-auto w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : topArtists.length > 0 ? (
              <div className="grid grid-cols-6 gap-3 pl-3">
                {topArtists.map((topArtist) => (
                  <div
                    key={topArtist.id}
                    onClick={() => {
                      window.location.href = `/artist/${topArtist.id}`;
                    }}
                    className="group cursor-pointer transition-all duration-200 hover:scale-105"
                  >
                    <div className="relative aspect-square rounded-full overflow-hidden bg-gray-800 mb-3">
                      {topArtist.images && topArtist.images[0] ? (
                        <img
                          src={topArtist.images[0].url}
                          alt={topArtist.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-12 h-12 text-gray-600" />
                        </div>
                      )}
                      {/* Play button overlay */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 bg-[#00BFFF] rounded-full flex items-center justify-center transform translate-y-2 group-hover:translate-y-0 transition-transform">
                          <Play className="w-5 h-5 text-black ml-0.5" />
                        </div>
                      </div>
                    </div>
                    <div className="px-1 text-center">
                      <h3 className="text-white text-sm font-medium truncate mb-1">
                        {topArtist.name}
                      </h3>
                      <p className="text-gray-400 text-xs truncate">Artist</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/60 pl-3">No artists available</p>
            )}
          </div>

        </div>
      </ScrollArea>

      {/* Image Full-View Dialog */}
      <Dialog open={showImageDialog} onOpenChange={setShowImageDialog}>
        <DialogContent className="max-w-fit max-h-fit w-auto h-auto p-0 bg-transparent border-none shadow-none [&>button]:hidden [&>button]:pointer-events-none">
          <DialogTitle className="sr-only">{albumArtist} - Image Gallery</DialogTitle>
          
          {artistImages && artistImages.length > 0 && (
            <div className="relative group">
              <img
                src={artistImages[currentImageIndex]}
                alt={albumArtist}
                className="w-[770px] max-w-[90vw] h-auto rounded-lg"
              />
              
              {/* Navigation Arrows - On Image */}
              {artistImages.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!imageTransitioning) {
                        setImageTransitioning(true);
                        const prevIndex = (currentImageIndex - 1 + artistImages.length) % artistImages.length;
                        setCurrentImageIndex(prevIndex);
                      }
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/70 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-8 h-8 text-white" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!imageTransitioning) {
                        setImageTransitioning(true);
                        const nextIndex = (currentImageIndex + 1) % artistImages.length;
                        setCurrentImageIndex(nextIndex);
                      }
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-black/70 rounded-full transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-8 h-8 text-white" />
                  </button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Biography Full-View Dialog */}
      <Dialog open={showBioDialog} onOpenChange={setShowBioDialog}>
        <DialogContent 
          className="max-w-4xl w-[90vw] max-h-[90vh] p-0 border-none [&>button]:hidden [&>button]:pointer-events-none"
          style={createGradientStyle(artistDominantColor)}
        >
          
          {/* Close Button for Biography */}
          <DialogClose asChild>
            <button className="absolute top-4 right-4 p-3 bg-black/40 hover:bg-black/70 rounded-lg transition-all z-[9999]">
              <X className="w-6 h-6 text-white" />
            </button>
          </DialogClose>
          
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-black text-white mb-2">{albumArtist}</DialogTitle>
              {artistBiography?.stats && (
                <div className="flex gap-8 mt-4">
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Listeners</span>
                    <span className="text-[#00BFFF] text-2xl font-bold mt-1">
                      {artistBiography.stats.listeners?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Plays</span>
                    <span className="text-[#00BFFF] text-2xl font-bold mt-1">
                      {artistBiography.stats.playcount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </DialogHeader>
            
            <ScrollArea className="h-[calc(90vh-250px)] pr-6">
              {artistBiography ? (
                <div className="space-y-8">
                  {artistBiography.biography && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-[#00BFFF] rounded-full"></div>
                        Biography
                      </h3>
                      <p className="leading-relaxed text-base text-gray-300 whitespace-pre-line">
                        {artistBiography.biography}
                      </p>
                    </div>
                  )}
                  {artistBiography.tags && artistBiography.tags.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-[#00BFFF] rounded-full"></div>
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {artistBiography.tags.map((tag: string, index: number) => (
                          <span 
                            key={index} 
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-gray-300 transition-colors"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No biography available</p>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
