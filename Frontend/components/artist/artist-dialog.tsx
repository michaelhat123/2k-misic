import React, { useState, useEffect } from 'react';
import { X, Users, Play, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BrandedLoader } from '@/components/ui/BrandedLoader';

// Local biography cache - stores up to 100 biographies
const biographyCache = new Map<string, { data: ArtistBiography; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100;

// Cache helper functions
const getCachedBiography = (artistName: string): ArtistBiography | null => {
  const cached = biographyCache.get(artistName.toLowerCase());
  if (!cached) return null;
  
  // Check if cache is still valid
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    biographyCache.delete(artistName.toLowerCase());
    return null;
  }
  
  return cached.data;
};

const setCachedBiography = (artistName: string, biography: ArtistBiography) => {
  // If cache is full, remove oldest entry
  if (biographyCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = biographyCache.keys().next().value;
    if (oldestKey) {
      biographyCache.delete(oldestKey);
    }
  }
  
  biographyCache.set(artistName.toLowerCase(), {
    data: biography,
    timestamp: Date.now()
  });
};

interface ArtistBiography {
  name: string;
  biography: string;
  summary: string;
  url: string;
  images: string[];
  stats: {
    listeners: number;
    playcount: number;
  };
  tags: string[];
  similarArtists: Array<{
    name: string;
    image: string;
  }>;
}

interface ArtistDialogProps {
  isOpen: boolean;
  onClose: () => void;
  artistName: string;
  artistImages?: string[];
  currentImageIndex?: number;
  onImageIndexChange?: (index: number) => void;
}

export const ArtistDialog: React.FC<ArtistDialogProps> = ({
  isOpen,
  onClose,
  artistName,
  artistImages = [],
  currentImageIndex = 0,
  onImageIndexChange
}) => {
  const [biography, setBiography] = useState<ArtistBiography | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageTransitioning, setImageTransitioning] = useState(false);
  const [displayedImageIndex, setDisplayedImageIndex] = useState(currentImageIndex);
  
  // Use the current image index from props, sync with parent
  const localImageIndex = currentImageIndex;

  // Extract URLs from ArtistImage objects and filter out empty ones
  const uniqueImages = artistImages
    .map(img => {
      if (typeof img === 'string') {
        return img;
      } else if (img && typeof (img as any).url === 'string') {
        return (img as any).url;
      } else if (img && typeof (img as any).url?.url === 'string') {
        // Handle nested url structure
        return (img as any).url.url;
      }
      return '';
    })
    .filter(url => url && url.trim() !== ''); // Show all images (no limit)

  useEffect(() => {
    if (isOpen && artistName) {
      fetchArtistBiography();
    }
  }, [isOpen, artistName]); // Removed artistImages from dependencies to prevent infinite loop

  // Smart preloading: Load 5 images before and 5 after current index
  useEffect(() => {
    if (uniqueImages.length > 0 && isOpen) {
      const rangeBefore = 5;
      const rangeAfter = 5;
      
      const startIndex = Math.max(0, localImageIndex - rangeBefore);
      const endIndex = Math.min(uniqueImages.length - 1, localImageIndex + rangeAfter);
      
      // Preload surrounding images in background
      for (let i = startIndex; i <= endIndex; i++) {
        const img = new Image();
        img.src = uniqueImages[i];
      }
    }
  }, [localImageIndex, uniqueImages, isOpen])


  // Generate fallback biography from Spotify data
  const generateFallbackBiography = (artistData: any) => {
    const name = artistData.name || artistName
    const genres = artistData.genres || []
    const followers = artistData.followers?.total || 0
    const popularity = artistData.popularity || 0
    
    // Try to infer nationality from genres
    const inferNationality = (genres: string[]) => {
      const genreMap: { [key: string]: string } = {
        'uk': 'British',
        'british': 'British', 
        'latin': 'Latin American',
        'k-pop': 'South Korean',
        'j-pop': 'Japanese',
        'afrobeat': 'African',
        'reggaeton': 'Latin American',
        'french': 'French',
        'german': 'German',
        'italian': 'Italian',
        'spanish': 'Spanish'
      }
      
      for (const genre of genres) {
        for (const [key, nationality] of Object.entries(genreMap)) {
          if (genre.toLowerCase().includes(key)) {
            return nationality
          }
        }
      }
      return null
    }
    
    const nationality = inferNationality(genres)
    const primaryGenre = genres[0] || 'music'
    const popularityLevel = popularity > 80 ? 'highly popular' : popularity > 60 ? 'popular' : popularity > 40 ? 'emerging' : 'rising'
    
    // Generate biography
    let bio = `${name} is ${nationality ? `a ${nationality} ` : 'an '}artist`
    
    if (genres.length > 0) {
      bio += ` known for their work in ${primaryGenre}`
      if (genres.length > 1) {
        bio += ` and ${genres.slice(1, 3).join(', ')}`
      }
      bio += '.'
    } else {
      bio += ' making waves in the music industry.'
    }
    
    bio += ` With ${followers.toLocaleString()} followers on Spotify, ${name} has established themselves as a ${popularityLevel} force in contemporary music.`
    
    if (genres.length > 0) {
      bio += ` Their sound blends elements of ${genres.slice(0, 2).join(' and ')}, creating a distinctive musical identity that resonates with fans worldwide.`
    }
    
    return {
      name,
      biography: bio,
      summary: bio.split('.')[0] + '.',
      url: '',
      images: [],
      stats: {
        listeners: followers,
        playcount: 0
      },
      tags: genres,
      similarArtists: []
    }
  }

  const fetchArtistBiography = async () => {
    if (!artistName) return;
    
    // Check cache first
    const cachedBio = getCachedBiography(artistName);
    if (cachedBio) {
      setBiography(cachedBio);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      
      // First try to get biography from your API
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const response = await fetch(`${API_BASE_URL}/artist/${encodeURIComponent(artistName)}/biography`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && (data.biography || data.summary)) {
          setBiography(data);
          setCachedBiography(artistName, data); // Cache the result
          return;
        }
      }
      
      // If no biography found, try to get Spotify artist data for fallback
      const spotifyResponse = await fetch(`${API_BASE_URL}/spotify/artist-info/${encodeURIComponent(artistName)}`);
      
      if (spotifyResponse.ok) {
        const spotifyData = await spotifyResponse.json();
        const fallbackBio = generateFallbackBiography(spotifyData);
        setBiography(fallbackBio);
        setCachedBiography(artistName, fallbackBio); // Cache fallback bio
      } else {
        // Last resort: minimal fallback
        const minimalBio = {
          name: artistName,
          biography: `${artistName} is a talented artist making their mark in the music industry. Known for their unique sound and creative approach to music, they continue to captivate audiences with their artistic vision.`,
          summary: `${artistName} is a talented artist making their mark in the music industry.`,
          url: '',
          images: [],
          stats: {
            listeners: 0,
            playcount: 0
          },
          tags: [],
          similarArtists: []
        };
        setBiography(minimalBio);
        setCachedBiography(artistName, minimalBio); // Cache minimal bio
      }
      
    } catch (err) {
      // Minimal fallback on error
      const errorBio = {
        name: artistName,
        biography: `${artistName} is an artist whose music speaks for itself. Their creative work continues to resonate with listeners around the world.`,
        summary: `${artistName} is an artist whose music speaks for itself.`,
        url: '',
        images: [],
        stats: {
          listeners: 0,
          playcount: 0
        },
        tags: [],
        similarArtists: []
      };
      setBiography(errorBio);
      setCachedBiography(artistName, errorBio); // Cache error fallback
    } finally {
      setLoading(false);
    }
  };

  const nextImage = async () => {
    if (uniqueImages.length > 1 && !imageTransitioning && onImageIndexChange) {
      setImageTransitioning(true);
      setImageLoading(true);
      
      // Update image index immediately
      const nextIndex = (localImageIndex + 1) % uniqueImages.length;
      onImageIndexChange(nextIndex);
      
      // Loading state will be cleared by onLoad/onError handlers
    }
  };

  const prevImage = async () => {
    if (uniqueImages.length > 1 && !imageTransitioning && onImageIndexChange) {
      setImageTransitioning(true);
      setImageLoading(true);
      
      // Update image index immediately
      const prevIndex = (localImageIndex - 1 + uniqueImages.length) % uniqueImages.length;
      onImageIndexChange(prevIndex);
      
      // Loading state will be cleared by onLoad/onError handlers
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-slate-900/30 backdrop-blur-md border border-blue-500/10 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header with close button only */}
        <div className="flex justify-end p-0">
          <button
            onClick={onClose}
            className="p-2 hover:bg-blue-500/20 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Give ScrollArea an explicit height so the viewport renders and can scroll */}
        <ScrollArea className="h-[calc(80vh-80px)] homepage-scroll [&>div>div[style]]:!pr-0">
          {loading ? (
            <div className="flex items-center justify-center py-48 px-6">
              <BrandedLoader size="lg" showText={false} />
            </div>
          ) : error ? (
            <div className="p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchArtistBiography}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="px-8 pb-8 space-y-6">
              {/* Centered Artist Image with Navigation */}
              <div className="flex justify-center relative">
                <div className="w-96 h-96 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-xl relative group">
                  {uniqueImages.length > 0 ? (
                    <div className="relative w-full h-full">
                      <img
                        src={uniqueImages[displayedImageIndex]}
                        alt={biography?.name || artistName}
                        className="w-full h-full object-cover transition-all duration-300 opacity-100 scale-100"
                      />
                      
                      {/* Hidden preload image for next image */}
                      {localImageIndex !== displayedImageIndex && (
                        <img
                          src={uniqueImages[localImageIndex]}
                          alt={biography?.name || artistName}
                          className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
                          onLoad={() => {
                            setDisplayedImageIndex(localImageIndex);
                            setImageLoading(false);
                            setImageTransitioning(false);
                          }}
                          onError={(e) => {
                            setImageLoading(false);
                            setImageTransitioning(false);
                          }}
                        />
                      )}
                      
                      {/* Loading overlay - always show when transitioning */}
                      {(imageLoading || imageTransitioning) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <BrandedLoader size="lg" showText={false} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
                      <Users className="w-24 h-24 text-white/50" />
                    </div>
                  )}
                  
                  {/* Navigation Arrows - only show if multiple images */}
                  {uniqueImages.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        disabled={imageTransitioning}
                        className={`absolute left-3 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                          imageTransitioning ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'
                        }`}
                      >
                        <ChevronLeft className="w-6 h-6 text-white" />
                      </button>
                      <button
                        onClick={nextImage}
                        disabled={imageTransitioning}
                        className={`absolute right-3 top-1/2 -translate-y-1/2 p-3 bg-black/60 hover:bg-black/80 rounded-full transition-all opacity-0 group-hover:opacity-100 ${
                          imageTransitioning ? 'cursor-not-allowed opacity-50' : 'hover:scale-110'
                        }`}
                      >
                        <ChevronRight className="w-6 h-6 text-white" />
                      </button>
                      
                    </>
                  )}
                </div>
              </div>

              {/* Biography Description */}
              <div className="text-center space-y-4">
                {biography?.biography && (
                  <div className="max-w-2xl mx-auto">
                    <div className="text-zinc-300 leading-relaxed text-center space-y-4">
                      {biography.biography.split('\n\n').map((paragraph: string, index: number) => (
                        <p key={index} className="">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
};
