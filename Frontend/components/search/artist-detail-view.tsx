'use client';

import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Music, Clock, Search, Download, Shuffle, MoreHorizontal, Pause, Menu, Check, List, ChevronLeft, User, Album as AlbumIcon, ChevronRight, X } from 'lucide-react';
import { usePlayer } from '@/components/player/player-provider';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { ArtistCache } from '@/lib/cache/artist-cache';

interface ArtistDetailViewProps {
  artist: any;
  tracks: any[];
  albums: any[];
  onBack: () => void;
  onAlbumClick: (album: any) => void;
  onArtistClick?: (artist: any) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  observerRef: React.RefObject<HTMLDivElement>;
}

export function ArtistDetailView({
  artist,
  tracks,
  albums,
  onBack,
  onAlbumClick,
  onArtistClick,
  onLoadMore,
  hasMore,
  isLoading,
  observerRef
}: ArtistDetailViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState('custom');
  const [viewAs, setViewAs] = useState('list');
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [npvExpanded, setNpvExpanded] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [displayedImageIndex, setDisplayedImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageTransitioning, setImageTransitioning] = useState(false);
  const [artistImages, setArtistImages] = useState<string[]>([]);
  const [biography, setBiography] = useState<any>(null);
  const [loadingBio, setLoadingBio] = useState(false);
  const [dominantColor, setDominantColor] = useState<string>('#3b82f6');
  const [preExtractedColors, setPreExtractedColors] = useState<string[]>([]);
  const [topArtists, setTopArtists] = useState<any[]>([]);
  const [loadingTopArtists, setLoadingTopArtists] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showBioDialog, setShowBioDialog] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { playTrack, setQueue, clearQueue, toggleShuffle, shuffle, currentTrack, isPlaying } = usePlayer();

  // Generate dynamic fallback biography based on Spotify data
  const generateFallbackBio = useCallback((artistData: any, bioData?: any) => {
    const name = artistData.name || 'This artist';
    const genres = artistData.genres || [];
    const followers = artistData.followers?.total;
    const popularity = artistData.popularity; // 0-100
    
    // Try to extract country from tags or biography data
    let country = '';
    const tags = bioData?.tags || [];
    
    // Common country names to look for in tags
    const countryNames = [
      'Rwanda', 'Kenya', 'Tanzania', 'Uganda', 'Nigeria', 'Ghana', 'South Africa',
      'USA', 'UK', 'Canada', 'France', 'Germany', 'Spain', 'Italy', 'Brazil',
      'Mexico', 'Argentina', 'Colombia', 'Japan', 'Korea', 'China', 'India',
      'Australia', 'Jamaica', 'Trinidad', 'Barbados', 'Congo', 'Senegal', 'Mali',
      'Cameroon', 'Ethiopia', 'Morocco', 'Egypt', 'Algeria', 'Tunisia'
    ];
    
    // Find country in tags
    for (const tag of tags) {
      const tagLower = tag.toLowerCase();
      for (const countryName of countryNames) {
        if (tagLower === countryName.toLowerCase() || tagLower.includes(countryName.toLowerCase())) {
          country = countryName;
          break;
        }
      }
      if (country) break;
    }
    
    // Calculate popularity level
    let popularityLevel = 'emerging';
    let popularityDesc = 'steadily building a presence in the music scene';
    if (popularity >= 80) {
      popularityLevel = 'globally renowned';
      popularityDesc = 'commanding massive attention across streaming platforms worldwide';
    } else if (popularity >= 60) {
      popularityLevel = 'widely recognized';
      popularityDesc = 'establishing a major force in contemporary music';
    } else if (popularity >= 40) {
      popularityLevel = 'rising';
      popularityDesc = 'rapidly gaining recognition and expanding the audience';
    }
    
    // Format follower count
    const formatFollowers = (count: number) => {
      if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
      if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
      return count.toString();
    };
    
    // Helper function to get country adjective
    const getCountryAdjective = (countryName: string) => {
      const adjectives: { [key: string]: string } = {
        'Rwanda': 'Rwandan',
        'Kenya': 'Kenyan',
        'Tanzania': 'Tanzanian',
        'Uganda': 'Ugandan',
        'Nigeria': 'Nigerian',
        'Ghana': 'Ghanaian',
        'South Africa': 'South African',
        'USA': 'American',
        'UK': 'British',
        'Canada': 'Canadian',
        'France': 'French',
        'Germany': 'German',
        'Spain': 'Spanish',
        'Italy': 'Italian',
        'Brazil': 'Brazilian',
        'Mexico': 'Mexican',
        'Argentina': 'Argentinian',
        'Colombia': 'Colombian',
        'Japan': 'Japanese',
        'Korea': 'Korean',
        'China': 'Chinese',
        'India': 'Indian',
        'Australia': 'Australian',
        'Jamaica': 'Jamaican',
        'Congo': 'Congolese',
        'Senegal': 'Senegalese',
        'Mali': 'Malian',
        'Cameroon': 'Cameroonian',
        'Ethiopia': 'Ethiopian',
        'Morocco': 'Moroccan',
        'Egypt': 'Egyptian'
      };
      return adjectives[countryName] || `${countryName}`;
    };
    
    // Helper function to filter and clean genre names
    const getCleanGenres = (genreList: string[]) => {
      // List of obscure/weird genres to skip
      const skipGenres = [
        'bongo flava', 'bongo', 'flava', 'meme rap', 'vapor twitch', 
        'escape room', 'drift phonk', 'pixie', 'weirdcore'
      ];
      
      // Preferred common genres
      const preferredGenres = [
        'afrobeat', 'afrobeats', 'afropop', 'hip hop', 'rap', 'pop', 
        'r&b', 'rnb', 'soul', 'jazz', 'rock', 'reggae', 'dancehall',
        'electronic', 'edm', 'house', 'trap', 'drill', 'amapiano',
        'gospel', 'country', 'folk', 'indie', 'alternative', 'metal'
      ];
      
      // Filter out weird genres and normalize
      const cleanedGenres = genreList
        .filter(genre => {
          const lowerGenre = genre.toLowerCase();
          return !skipGenres.some(skip => lowerGenre.includes(skip));
        })
        .map(genre => {
          // Normalize common variations
          const lower = genre.toLowerCase();
          if (lower.includes('afro')) return 'afrobeat';
          if (lower.includes('hip hop') || lower.includes('hip-hop')) return 'hip hop';
          if (lower.includes('r&b') || lower.includes('rnb')) return 'R&B';
          return genre;
        });
      
      // If no clean genres, return generic based on country or just 'music'
      if (cleanedGenres.length === 0) {
        if (country) return ['afrobeat']; // Default for African artists
        return ['contemporary'];
      }
      
      return cleanedGenres;
    };
    
    // Choose bio variation based on available data
    if (country && followers && followers > 0) {
      // Bio Type 1: Country + followers + popularity
      const cleanGenres = getCleanGenres(genres);
      const genreList = cleanGenres.length > 0 ? cleanGenres.slice(0, 2).join(' and ') : 'contemporary';
      const countryAdj = getCountryAdjective(country);
      const estimatedListeners = formatFollowers(followers * 2); // Double for all platforms estimate
      return {
        main: `${name} is a ${popularityLevel} artist from ${country}, bringing authentic sounds and cultural richness to the global music scene. With a dedicated following of ${estimatedListeners} listeners across all platforms, this artist continues to captivate audiences with distinctive ${genreList} music. The sound bridges traditional ${countryAdj} influences with modern production, ${popularityDesc}. Each release showcases a deep connection to roots while embracing innovative sounds that resonate with fans worldwide.`,
        sub: `Explore the complete discography on 2k Music to discover how ${name} represents ${country}'s vibrant music culture on the world stage.`
      };
    } else if (country) {
      // Bio Type 2: Country only
      const cleanGenres = getCleanGenres(genres);
      const genreList = cleanGenres.length > 0 ? cleanGenres.slice(0, 2).join(' and ') : 'music';
      const countryAdj = getCountryAdjective(country);
      return {
        main: `${name} is a ${popularityLevel} artist hailing from ${country}, bringing a distinctive voice that reflects the rich musical heritage of the homeland. This work in ${genreList} showcases the vibrant sounds and cultural stories of ${country}, creating bridges between local traditions and global audiences. Through this artistry, ${name} contributes to the growing international recognition of ${countryAdj} music, demonstrating how authentic cultural expression resonates across borders.`,
        sub: `Dive into the catalog on 2k Music to experience the unique sound of ${country} through ${name}'s artistic vision.`
      };
    } else if (genres.length > 0 && followers && followers > 0) {
      // Bio Type 3: Genres + followers
      const cleanGenres = getCleanGenres(genres);
      const genreList = cleanGenres.slice(0, 3).join(', ').replace(/,([^,]*)$/, ' and$1');
      const mainGenre = cleanGenres[0] || 'contemporary';
      const estimatedListeners = formatFollowers(followers * 2); // Double for all platforms estimate
      return {
        main: `${name} is a ${popularityLevel} artist who has carved out a distinctive space in the ${genreList} scene. With a dedicated following of ${estimatedListeners} listeners across all platforms, this artist continues to captivate audiences with an innovative approach to ${mainGenre}. The music reflects a unique blend of artistic vision and contemporary sound, ${popularityDesc}. Each release showcases evolution as an artist, demonstrating both technical mastery and creative depth that keeps fans engaged and coming back for more.`,
        sub: 'Explore the complete discography on 2k Music to discover the full range of the musical journey, from early releases to latest work.'
      };
    } else if (followers && followers > 0) {
      // Bio Type 4: Followers/popularity only
      const estimatedListeners = formatFollowers(followers * 2); // Double for all platforms estimate
      return {
        main: `${name} is a ${popularityLevel} artist who has built an impressive presence in the music industry, with ${estimatedListeners} dedicated listeners across all platforms actively following this career. The ability to connect with audiences through authentic musical expression has earned a loyal fanbase that continues to grow. ${name} represents the kind of artist who understands that great music transcends trends, focusing instead on creating timeless work that speaks to the human experience.`,
        sub: 'Check out the tracks and albums on 2k Music to understand why fans keep coming back and what makes this music so compelling.'
      };
    } else {
      // Bio Type 5: Minimal fallback
      return {
        main: `${name} is an artist featured on 2k Music, offering a collection of tracks that showcase a unique musical perspective. While detailed biographical information is currently limited, the music speaks for itself, inviting listeners to discover and explore this artistic vision. Every artist has a story to tell through work, and ${name} is no exception—these songs provide a window into a creative world and musical journey.`,
        sub: 'Biography information from Last.fm is currently unavailable for this artist. Explore the available tracks and albums to form your own impression of the sound.'
      };
    }
  }, []);

  // Fetch artist images and biography
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!artist) return;

      // Reset states when artist changes
      setArtistImages([]);
      setBiography(null);
      setCurrentImageIndex(0);
      setDisplayedImageIndex(0);
      setPreExtractedColors([]);
      setDominantColor('#3b82f6');
      setLoadingBio(true);
      setTopArtists([]);
      setLoadingTopArtists(true);

      // Scroll to top when artist changes
      if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
          viewport.scrollTop = 0;
        }
      }

      // Check local cache first
      const cached = ArtistCache.get(artist.id);
      if (cached) {
        setArtistImages(cached.images || []);
        setBiography(cached.biography);
        setTopArtists(cached.topArtists || []);
        setLoadingBio(false);
        setLoadingTopArtists(false);
        return;
      }

      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

      // Variables to store fetched data for caching
      let fetchedImages: string[] = [];
      
      // Fetch artist images
      try {
        const imagesResponse = await fetch(`${API_BASE_URL}/artist-images/${encodeURIComponent(artist.name)}`, {
          headers: {
            ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
          },
        });
        if (imagesResponse.ok) {
          const data = await imagesResponse.json();
          // API returns array directly, not wrapped in data.images
          const imagesArray = Array.isArray(data) ? data : (data.images || []);
          if (imagesArray.length > 0) {
            const imageUrls = imagesArray.map((img: any) => typeof img === 'string' ? img : img.url).filter(Boolean);
            setArtistImages(imageUrls);
            fetchedImages = imageUrls;
          }
        }
      } catch (error) {
        // Silent fail
      }
      let fetchedBio: any = null;
      let fetchedTopArtists: any[] = [];

      // Fetch biography
      setLoadingBio(true);
      try {
        const bioResponse = await fetch(`${API_BASE_URL}/artist/${encodeURIComponent(artist.name)}/biography`);
        if (bioResponse.ok) {
          const data = await bioResponse.json();
          setBiography(data);
          fetchedBio = data;
        }
      } catch (error) {
        // Silent fail
      } finally {
        setLoadingBio(false);
      }

      // Fetch top artists
      setLoadingTopArtists(true);
      try {
        const topArtistsResponse = await searchApi.getTopArtists(6);
        setTopArtists(topArtistsResponse.artists || []);
        fetchedTopArtists = topArtistsResponse.artists || [];
      } catch (error) {
        // Silent fail
      } finally {
        setLoadingTopArtists(false);
      }

      // Store all fetched data in local cache
      ArtistCache.set(artist.id, {
        biography: fetchedBio,
        images: fetchedImages,
        albums: albums || [],
        topArtists: fetchedTopArtists,
      });
    };

    fetchArtistData();
  }, [artist]);

  // Extract dominant color from current artist image
  const extractDominantColor = useCallback((imageUrl: string) => {
    return new Promise<string>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const maxDim = 220;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.max(1, Math.floor(img.width * scale));
          const h = Math.max(1, Math.floor(img.height * scale));

          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve('#3b82f6');
            return;
          }
          canvas.width = w;
          canvas.height = h;
          ctx.drawImage(img, 0, 0, w, h);

          const { data } = ctx.getImageData(0, 0, w, h);

          const rgbToHsv = (r: number, g: number, b: number) => {
            r /= 255; g /= 255; b /= 255;
            const max = Math.max(r, g, b), min = Math.min(r, g, b);
            const d = max - min;
            let h = 0;
            if (d !== 0) {
              switch (max) {
                case r: h = ((g - b) / d + (g < b ? 6 : 0)); break;
                case g: h = ((b - r) / d + 2); break;
                case b: h = ((r - g) / d + 4); break;
              }
              h *= 60;
            }
            const s = max === 0 ? 0 : d / max;
            const v = max;
            return { h, s, v };
          };

          const H_BINS = 72;
          const hist = new Array(H_BINS).fill(0);
          const sum = new Array(H_BINS).fill(null).map(() => ({ r: 0, g: 0, b: 0, w: 0 }));

          const stepPx = 4;
          for (let i = 0; i < data.length; i += stepPx) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const a = data[i + 3];
            if (a < 128) continue;

            const { h, s, v } = rgbToHsv(r, g, b);

            if (s < 0.08 && v > 0.9) continue;
            if (v < 0.08) continue;

            const bin = Math.min(H_BINS - 1, Math.floor((h / 360) * H_BINS));
            const weight = Math.pow(s, 1.2) * Math.pow(v, 0.9);
            hist[bin] += weight;
            sum[bin].r += r * weight;
            sum[bin].g += g * weight;
            sum[bin].b += b * weight;
            sum[bin].w += weight;
          }

          let topBin = hist.findIndex((v) => v === Math.max(...hist));
          if (topBin < 0 || sum[topBin].w === 0) {
            resolve('#3b82f6');
            return;
          }

          const wrap = (idx: number) => (idx + H_BINS) % H_BINS;
          const neighbors = [wrap(topBin - 1), topBin, wrap(topBin + 1)];
          let R = 0, G = 0, B = 0, W = 0;
          for (const bIdx of neighbors) {
            R += sum[bIdx].r;
            G += sum[bIdx].g;
            B += sum[bIdx].b;
            W += sum[bIdx].w;
          }

          if (W === 0) {
            resolve('#3b82f6');
            return;
          }
          const rAvg = Math.round(R / W);
          const gAvg = Math.round(G / W);
          const bAvg = Math.round(B / W);

          resolve(`rgb(${rAvg}, ${gAvg}, ${bAvg})`);
        } catch (error) {
          resolve('#3b82f6');
        }
      };

      img.onerror = () => resolve('#3b82f6');
      img.src = imageUrl;
    });
  }, []);

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

  // Pre-extract dominant colors for all images when they load
  useEffect(() => {
    if (artistImages && artistImages.length > 0) {
      const extractAllColors = async () => {
        const colors: string[] = [];
        // Extract colors in batches of 3 for better performance
        for (let i = 0; i < artistImages.length; i += 3) {
          const batch = artistImages.slice(i, i + 3);
          const batchColors = await Promise.all(
            batch.map(img => extractDominantColor(img).catch(() => '#3b82f6'))
          );
          colors.push(...batchColors);
        }
        setPreExtractedColors(colors);
        // Set initial color
        if (colors[0]) {
          setDominantColor(colors[0]);
        }
      };
      extractAllColors();
    } else if (artist.images && artist.images.length > 0) {
      // Fallback: Extract color from Spotify artist image
      extractDominantColor(artist.images[0].url)
        .then(color => setDominantColor(color))
        .catch(() => setDominantColor('#3b82f6'));
    }
  }, [artistImages, artist.images, extractDominantColor]);

  // Update dominant color instantly when image index changes (using pre-extracted colors)
  useEffect(() => {
    if (preExtractedColors.length > 0 && preExtractedColors[displayedImageIndex]) {
      setDominantColor(preExtractedColors[displayedImageIndex]);
    }
  }, [displayedImageIndex, preExtractedColors]);

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
        track.artists?.some((a: any) => a.name?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        track.album?.name?.toLowerCase().includes(searchQuery.toLowerCase())
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
      case 'album':
        filtered.sort((a, b) => (a.album?.name || '').localeCompare(b.album?.name || ''));
        break;
      case 'duration':
        filtered.sort((a, b) => (b.duration_ms || 0) - (a.duration_ms || 0));
        break;
    }
    
    return filtered;
  }, [tracks, searchQuery, sortBy]);

  // Play track handler
  const handlePlayTrack = (track: any) => {
    // Ensure we have valid track data
    if (!track || !track.id || !track.name) {
      toast.error('Cannot play this track - missing data');
      return;
    }

    // Extract artist name (use first artist for YouTube search)
    const artistName = track.artists?.[0]?.name || artist?.name || '';
    
    // Create properly formatted track object
    const formattedTrack = {
      id: `spotify-${track.id}`, // Prefix to avoid conflicts
      title: track.name,
      artist: artistName,
      album: track.album?.name || '',
      albumArt: track.album?.images?.[0]?.url || track.album?.images?.[1]?.url || track.album?.images?.[2]?.url || '',
      duration: track.duration_ms ? Math.floor(track.duration_ms / 1000) : 0,
      url: track.external_urls?.spotify || '',
      genre: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (shuffle && tracks.length > 0) {
      if (currentTrack?.id !== formattedTrack.id) {
        const shuffled = [...tracks].sort(() => Math.random() - 0.5);
        const queue = shuffled.map(t => ({
          id: `spotify-${t.id}`,
          title: t.name,
          artist: t.artists?.[0]?.name || artist?.name || '',
          album: t.album?.name || '',
          albumArt: t.album?.images?.[0]?.url || t.album?.images?.[1]?.url || t.album?.images?.[2]?.url || '',
          duration: t.duration_ms ? Math.floor(t.duration_ms / 1000) : 0,
          url: t.external_urls?.spotify || '',
          genre: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }));
        setQueue(queue);
      }
    } else {
      clearQueue();
    }

    playTrack(formattedTrack);
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

  const artistImage = artist?.images?.[0]?.url;

  return (
    <div className="relative h-full">
      {/* Main Content */}
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        {/* Header */}
        <div className="pt-6 pr-6 pb-6 pl-3">
          <div className="flex items-end space-x-6">
            {/* Artist/Album Image */}
            <div className="relative group">
              {artistImage ? (
                <img
                  src={artistImage}
                  alt={artist?.name}
                  className="w-48 h-48 rounded-full object-cover shadow-2xl"
                />
              ) : (
                <div className="w-48 h-48 rounded-full flex items-center justify-center bg-[#1e293b]/30 shadow-2xl">
                  <User className="w-16 h-16 text-[#00BFFF]" />
                </div>
              )}
            </div>
            
            {/* Artist Info */}
            <div className="flex-1">
              <div className="text-sm text-white/70 mb-2">Artist</div>
              <h1 className="text-6xl font-black mb-4 text-white leading-tight break-words">
                {artist?.name}
              </h1>
              <div className="flex items-center space-x-4 text-sm text-white/90">
                <span>Popular songs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="py-6 pr-6 pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Main Play Button */}
              <button 
                onClick={() => {
                  if (filteredTracks.length > 0) {
                    handlePlayTrack(filteredTracks[0]);
                  }
                }}
                className="w-12 h-12 bg-[#00BFFF] hover:bg-[#00BFFF]/80 rounded-full flex items-center justify-center transition-colors"
              >
                <Play className="w-5 h-5 text-[#222222] ml-0.5" />
              </button>
              
              {/* Shuffle Button */}
              <button 
                onClick={toggleShuffle}
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
                title="Download playlist"
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
            
            {/* Sort Controls */}
            <div className="flex justify-end items-center h-12 space-x-2">
              
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
                    onClick={() => setSortBy('album')}
                    className="flex items-center justify-between"
                  >
                    <span className={sortBy === 'album' ? 'text-[#00BFFF]' : ''}>Album</span>
                    {sortBy === 'album' && <Check className="h-4 w-4 text-[#00BFFF]" />}
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
        <div className="pr-6 pb-6 pl-3">
          {isLoading && filteredTracks.length === 0 ? (
            /* Skeleton for loading tracks */
            <div className="space-y-1 animate-pulse">
              {[...Array(10)].map((_, index) => (
                <div key={index} className="flex items-center gap-3 p-2 rounded-md">
                  <div className="w-6 h-4 bg-gray-700 rounded"></div>
                  <div className="w-10 h-10 bg-gray-700 rounded-md"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                  </div>
                  <div className="hidden lg:block flex-1">
                    <div className="h-3 bg-gray-700 rounded w-2/3"></div>
                  </div>
                  <div className="hidden sm:block w-16">
                    <div className="h-3 bg-gray-700 rounded ml-auto w-10"></div>
                  </div>
                </div>
              ))}
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
                      className="group flex items-center gap-3 p-2 rounded-md hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      <div className="w-6 text-center text-gray-400 text-xs group-hover:hidden">
                        {index + 1}
                      </div>
                      <button className="w-6 hidden group-hover:flex items-center justify-center">
                        <Play className="w-3 h-3 text-white" />
                      </button>
                      
                      {track.album?.images?.[0]?.url && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.album?.name}
                          className="w-10 h-10 rounded-md"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{highlightMatch(track.name, searchQuery)}</p>
                        <p className="text-gray-400 text-xs truncate">
                          {highlightMatch(track.artists?.map((a: any) => a.name).join(', ') || '', searchQuery)}
                        </p>
                      </div>
                      
                      {track.album?.name && (
                        <div className="hidden lg:block flex-1 min-w-0">
                          <p className="text-gray-400 text-xs truncate">{highlightMatch(track.album.name, searchQuery)}</p>
                        </div>
                      )}
                      
                      {track.duration_ms && (
                        <div className="hidden sm:block w-16 text-right text-gray-400 text-xs">
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
                      className="group flex items-center gap-3 p-2 rounded-md hover:bg-gray-800/50 cursor-pointer transition-colors"
                    >
                      <div className="w-6 text-center text-gray-400 text-xs group-hover:hidden">
                        {index + 1}
                      </div>
                      <button className="w-6 hidden group-hover:flex items-center justify-center">
                        <Play className="w-3 h-3 text-white" />
                      </button>
                      
                      {track.album?.images?.[0]?.url && (
                        <img
                          src={track.album.images[0].url}
                          alt={track.album?.name}
                          className="w-10 h-10 rounded-md"
                        />
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{highlightMatch(track.name, searchQuery)}</p>
                        <p className="text-gray-400 text-xs truncate">
                          {highlightMatch(track.artists?.map((a: any) => a.name).join(', ') || '', searchQuery)}
                        </p>
                      </div>
                      
                      {track.album?.name && (
                        <div className="hidden lg:block flex-1 min-w-0">
                          <p className="text-gray-400 text-xs truncate">{highlightMatch(track.album.name, searchQuery)}</p>
                        </div>
                      )}
                      
                      {track.duration_ms && (
                        <div className="hidden sm:block w-16 text-right text-gray-400 text-xs">
                          {formatDuration(track.duration_ms)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Hidden observer ref - not used but kept for compatibility */}
          <div ref={observerRef} className="h-0"></div>

          {/* Popular Albums Section */}
          {loadingBio ? (
            /* Album skeletons - horizontal squares */
            <div className="mt-4 pr-6">
              <h2 className="text-lg font-semibold text-white mb-3 pl-3">Popular Albums</h2>
              <div className="flex gap-3 overflow-x-auto pb-2 pl-3">
                {[...Array(6)].map((_, index) => (
                  <div key={index} className="flex-shrink-0 w-36 animate-pulse">
                    <div className="aspect-square rounded-lg bg-gray-700 mb-3"></div>
                    <div className="h-4 bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          ) : albums && albums.length > 0 && (
            <div className="mt-4 pr-6">
              <h2 className="text-lg font-semibold text-white mb-3 pl-3">Popular Albums</h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 pl-3">
                {albums.map((album) => (
                  <div
                    key={album.id}
                    onClick={() => onAlbumClick(album)}
                    className="group cursor-pointer transition-all duration-200 hover:scale-105"
                  >
                    <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-800 mb-3">
                      {album.images && album.images[0] ? (
                        <img
                          src={album.images[0].url}
                          alt={album.name}
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
                        {album.name}
                      </h3>
                      <p className="text-gray-400 text-xs truncate">
                        {album.release_date ? new Date(album.release_date).getFullYear() : ''} • {album.album_type || 'Album'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* About Section - Merged Card with Artist Images and Bio */}
          <div className="mt-8 mb-8 pr-6">
            <h2 className="text-lg font-semibold text-white mb-4 pl-3">About the artist</h2>
            {loadingBio ? (
              /* Single skeleton covering entire About section */
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
                      alt={artist.name}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setShowImageDialog(true)}
                      onLoad={() => {
                        // Update displayed index only after image loads
                        setDisplayedImageIndex(currentImageIndex);
                        setImageTransitioning(false);
                      }}
                      onError={() => {
                        // Handle error - still update to prevent stuck state
                        setDisplayedImageIndex(currentImageIndex);
                        setImageTransitioning(false);
                      }}
                    />
                    
                    {/* Artist Name Overlay - Bottom Left */}
                    <div className="absolute bottom-0 left-2 pb-1">
                      <h3 className="text-white text-base font-bold drop-shadow-2xl">
                        {artist.name}
                      </h3>
                    </div>
                    
                    {/* Navigation Arrows */}
                    {artistImages.length > 1 && (
                      <>
                        <button
                          onClick={() => {
                            if (!imageTransitioning) {
                              setImageTransitioning(true);
                              const prevIndex = (currentImageIndex - 1 + artistImages.length) % artistImages.length;
                              setCurrentImageIndex(prevIndex);
                            }
                          }}
                          disabled={imageTransitioning}
                          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronLeft className="w-5 h-5 text-white" />
                        </button>
                        <button
                          onClick={() => {
                            if (!imageTransitioning) {
                              setImageTransitioning(true);
                              const nextIndex = (currentImageIndex + 1) % artistImages.length;
                              setCurrentImageIndex(nextIndex);
                            }
                          }}
                          disabled={imageTransitioning}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-all opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight className="w-5 h-5 text-white" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  /* Fallback to Spotify artist image when no Last.fm images */
                  artist.images && artist.images.length > 0 ? (
                    <>
                      <img
                        src={artist.images[0].url}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                      />
                      {/* Artist Name Overlay - Bottom Left */}
                      <div className="absolute bottom-0 left-2 pb-1">
                        <h3 className="text-white text-base font-bold drop-shadow-2xl">
                          {artist.name}
                        </h3>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-20 h-20 text-gray-600" />
                    </div>
                  )
                )}
              </div>

              {/* Right: Biography with Dominant Color */}
              <div 
                className="aspect-square md:rounded-r-xl rounded-b-xl md:rounded-bl-none overflow-hidden shadow-2xl relative transition-all duration-300 ease-in-out cursor-pointer"
                style={createGradientStyle(dominantColor)}
                onClick={() => setShowBioDialog(true)}
              >
                <ScrollArea className="h-full w-full pointer-events-none">
                  <div className="p-6 space-y-4 relative z-10">
                    <h3 className="text-xl font-bold text-white">{artist.name}</h3>
                    {biography ? (
                      <div className="space-y-4 text-white/90">
                        {biography.stats && (
                          <div className="flex gap-4 text-sm">
                            <div>
                              <span className="text-white/60">Listeners:</span>{' '}
                              <span className="font-semibold">{biography.stats.listeners?.toLocaleString()}</span>
                            </div>
                            <div>
                              <span className="text-white/60">Plays:</span>{' '}
                              <span className="font-semibold">{biography.stats.playcount?.toLocaleString()}</span>
                            </div>
                          </div>
                        )}
                        {biography.biography ? (
                          <p className="leading-relaxed text-base line-clamp-6">
                            {biography.biography.length > 300 
                              ? `${biography.biography.substring(0, 300)}...` 
                              : biography.biography}
                          </p>
                        ) : (
                          /* Show fallback bio when biography text is missing */
                          (() => {
                            const fallbackBio = generateFallbackBio(artist, biography);
                            return (
                              <p className="leading-relaxed text-base line-clamp-6">
                                {fallbackBio.main}
                              </p>
                            );
                          })()
                        )}
                        {biography.tags && biography.tags.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-white/70 mb-2">Tags</h4>
                            <div className="flex flex-wrap gap-2">
                              {biography.tags.slice(0, 8).map((tag: string, index: number) => (
                                <span key={index} className="px-2 py-1 bg-white/10 rounded-full text-sm text-white/80">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      (() => {
                        const fallbackBio = generateFallbackBio(artist, null);
                        return (
                          <div className="space-y-3">
                            <p className="text-base text-white/90 leading-relaxed">
                              {fallbackBio.main}
                            </p>
                            <p className="text-sm text-white/60 italic">
                              {fallbackBio.sub}
                            </p>
                          </div>
                        );
                      })()
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
                      if (onArtistClick) {
                        onArtistClick(topArtist);
                      }
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
          <DialogTitle className="sr-only">{artist.name} - Image Gallery</DialogTitle>
          
          {artistImages && artistImages.length > 0 && (
            <div className="relative group">
              <img
                src={artistImages[currentImageIndex]}
                alt={artist.name}
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
          style={createGradientStyle(dominantColor)}
        >
          
          {/* Close Button for Biography */}
          <DialogClose asChild>
            <button className="absolute top-4 right-4 p-3 bg-black/40 hover:bg-black/70 rounded-lg transition-all z-[9999]">
              <X className="w-6 h-6 text-white" />
            </button>
          </DialogClose>
          
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-3xl font-black text-white mb-2">{artist.name}</DialogTitle>
              {biography?.stats && (
                <div className="flex gap-8 mt-4">
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Listeners</span>
                    <span className="text-[#00BFFF] text-2xl font-bold mt-1">
                      {biography.stats.listeners?.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-gray-400 text-xs uppercase tracking-wide">Plays</span>
                    <span className="text-[#00BFFF] text-2xl font-bold mt-1">
                      {biography.stats.playcount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </DialogHeader>
            
            <ScrollArea className="h-[calc(90vh-250px)] pr-6">
              {biography ? (
                <div className="space-y-8">
                  {biography.biography ? (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-[#00BFFF] rounded-full"></div>
                        Biography
                      </h3>
                      <p className="leading-relaxed text-base text-gray-300 whitespace-pre-line">
                        {biography.biography}
                      </p>
                    </div>
                  ) : (
                    /* Show fallback bio in dialog when biography text is missing */
                    (() => {
                      const fallbackBio = generateFallbackBio(artist, biography);
                      return (
                        <div>
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-[#00BFFF] rounded-full"></div>
                            About
                          </h3>
                          <p className="leading-relaxed text-lg text-gray-200 mb-4">
                            {fallbackBio.main}
                          </p>
                          <p className="text-base text-gray-400 italic">
                            {fallbackBio.sub}
                          </p>
                        </div>
                      );
                    })()
                  )}
                  {biography.tags && biography.tags.length > 0 && (
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <div className="w-1 h-6 bg-[#00BFFF] rounded-full"></div>
                        Tags
                      </h3>
                      <div className="flex flex-wrap gap-3">
                        {biography.tags.map((tag: string, index: number) => (
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
                (() => {
                  const fallbackBio = generateFallbackBio(artist, null);
                  return (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                          <div className="w-1 h-6 bg-[#00BFFF] rounded-full"></div>
                          About
                        </h3>
                        <p className="leading-relaxed text-lg text-gray-200 mb-4">
                          {fallbackBio.main}
                        </p>
                        <p className="text-base text-gray-400 italic">
                          {fallbackBio.sub}
                        </p>
                      </div>
                      
                      {/* Show genres if available */}
                      {artist.genres && artist.genres.length > 0 && (
                        <div>
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-[#00BFFF] rounded-full"></div>
                            Genres
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {artist.genres.map((genre: string, index: number) => (
                              <span 
                                key={index} 
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-gray-300 transition-colors"
                              >
                                {genre}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Show stats if available */}
                      {artist.followers?.total && (
                        <div>
                          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                            <div className="w-1 h-6 bg-[#00BFFF] rounded-full"></div>
                            Statistics
                          </h3>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                              <span className="text-gray-400 text-sm uppercase tracking-wide">Followers</span>
                              <p className="text-[#00BFFF] text-3xl font-bold mt-2">
                                {artist.followers.total.toLocaleString()}
                              </p>
                            </div>
                            {artist.popularity !== undefined && (
                              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                                <span className="text-gray-400 text-sm uppercase tracking-wide">Popularity</span>
                                <p className="text-[#00BFFF] text-3xl font-bold mt-2">
                                  {artist.popularity}/100
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
