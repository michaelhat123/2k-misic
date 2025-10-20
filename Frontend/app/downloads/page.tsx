"use client"

import React, { useState, useRef, useCallback } from 'react'
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { FixedSizeList as List } from 'react-window'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Download, Search, Play, MoreHorizontal, Music, Loader2, FolderOpen, Upload, Pause, Shuffle, Menu, Check, List as ListIcon } from "lucide-react"
import { usePlayer } from "@/components/player/player-provider"
import { Track } from "@/types/track"
import { SearchOverlay } from "@/components/search/search-overlay"
import { useSearch } from "@/components/layout/top-navigation"
import { useSettings } from "@/contexts/settings-context"
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'

// Module-scoped cache so it persists across navigations/mounts
const albumArtLoadedCache: Map<string, boolean> = new Map()
// Global image cache for performance
const globalImageCache: Map<string, boolean> = new Map()

// App-level track cache - only loads once per app session
let appTrackCache: LocalTrack[] | null = null
let isCacheLoaded = false

// Global image cache check function
const isImageInBrowserCache = (url: string): boolean => {
  try {
    // Skip cache check for file:// URLs as browsers can't access them
    if (!url || url.startsWith('file://')) {
      return false
    }
    
    // Check our global cache first
    if (globalImageCache.has(url)) {
      return globalImageCache.get(url)!
    }
    
    // Only check cache for data URLs and HTTP URLs
    if (url.startsWith('data:') || url.startsWith('http')) {
      const img = new Image()
      img.src = url
      const isCached = !!img.complete
      globalImageCache.set(url, isCached)
      return isCached
    }
    return false
  } catch {
    return false
  }
}

interface LocalTrack {
  id: string
  title: string
  artist: string
  album?: string
  albumArt?: string
  duration?: number
  filePath: string
  fileUrl: string
  format: 'mp3' | 'm4a'
  size: number
  addedAt: string
}

// Row component - OUTSIDE main component to prevent recreation on parent re-renders
const TrackRow = React.memo(function TrackRow(props: any) {
  const { index, style, data } = props
  if (!data || !data.tracks || !data.tracks[index]) {
    return null
  }
  const track = data.tracks[index] as LocalTrack
  const { onPlay, highlight, getCurrentTrackId, getIsPlaying, searchQuery, loadedImages } = data
  const url = track.albumArt || ''
  const isLoaded = url && (!!loadedImages?.get(url) || isImageInBrowserCache(url))
  
  const currentTrackId = getCurrentTrackId?.() 
  const playing = getIsPlaying?.() || false
  
  const handleImageLoad = React.useCallback(() => {
    if (url && loadedImages && !loadedImages.has(url)) {
      loadedImages.set(url, true)
    }
  }, [url, loadedImages])

  return (
    <div style={style}>
      <div
        className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/50 group cursor-pointer transition-colors mx-2"
        onClick={() => onPlay(track)}
        style={{ minHeight: '60px' }}
      >
        <div className="w-6 text-center text-muted-foreground text-xs">
          <span className="group-hover:hidden">{index + 1}</span>
          {currentTrackId === track.id && playing ? (
            <Pause className="w-3 h-3 hidden group-hover:block mx-auto" />
          ) : (
            <Play className="w-3 h-3 hidden group-hover:block mx-auto" />
          )}
        </div>

        <div className="h-10 w-10 rounded-md flex-shrink-0 relative overflow-hidden bg-muted rounded-md">
          {url && !url.startsWith('file://') && (url.startsWith('data:') || url.startsWith('http')) ? (
            <img
              src={url}
              alt={track.title}
              loading="eager"
              decoding="async"
              width={40}
              height={40}
              onLoad={handleImageLoad}
              onError={() => {}}
              className="absolute inset-0 object-cover w-10 h-10 opacity-100"
              style={{
                imageRendering: 'auto',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)'
              }}
            />
          ) : (
            <div className="rounded-md bg-muted flex items-center justify-center w-10 h-10">
              <Music className="h-4 w-4 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0 w-80 lg:w-[420px]">
          <p className={`font-medium truncate text-sm ${currentTrackId === track.id ? 'text-[#00BFFF]' : ''}`}>
            {highlight(track.title, searchQuery)}
          </p>
          <p className="text-xs text-muted-foreground truncate">{highlight(track.artist, searchQuery)}</p>
        </div>

        <div className="hidden lg:block flex-1 min-w-0 text-xs text-muted-foreground">
          <p className="truncate text-left">{track.album || 'Unknown Album'}</p>
        </div>
        <div className="hidden sm:block w-16 text-xs text-muted-foreground text-right">
          {track.duration ? `${Math.floor(track.duration / 60)}:${(Math.floor(track.duration) % 60).toString().padStart(2, '0')}` : '-:--'}
        </div>
      </div>
    </div>
  )
})

// VirtualizedTrackList - OUTSIDE to prevent recreation
const VirtualizedTrackList = React.memo(({ 
  tracks, 
  itemData
}: { 
  tracks: LocalTrack[], 
  itemData: any
}) => {
  return (
    <div className="h-[calc(100vh-250px)]">
      <List
        height={window.innerHeight - 250}
        width="100%"
        itemCount={tracks.length}
        itemSize={60}
        itemData={itemData}
        className="downloads-scroll"
        outerElementType={VirtualizedOuter}
        overscanCount={5}
      >
        {TrackRow}
      </List>
    </div>
  )
}, (prevProps, nextProps) => {
  return prevProps.tracks === nextProps.tracks && 
         prevProps.itemData === nextProps.itemData
})

// Custom outer element for react-window that uses ScrollArea styling  
const VirtualizedOuter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, children, ...props }, ref) => {
    const { overflow, overflowX, overflowY, ...filteredStyle } = style || {}

    return (
      <ScrollAreaPrimitive.Root className="h-full relative">
        <ScrollAreaPrimitive.Viewport
          ref={ref}
          className={`h-full w-full rounded-[inherit] ${className || ''}`}
          style={{ ...filteredStyle, scrollbarGutter: 'stable', paddingBottom: '80px' }}
          {...props}
        >
          {children}
        </ScrollAreaPrimitive.Viewport>
        <ScrollBar className="ml-[150px]" />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    )
  }
)

export default function DownloadsPage() {
  
  const [tracks, setTracks] = useState<LocalTrack[]>(appTrackCache || [])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [importing, setImporting] = useState(!isCacheLoaded)
  const [viewAs, setViewAs] = useState<'compact' | 'list'>('compact')
  const [importProgress, setImportProgress] = useState(0)
  const [importTotal, setImportTotal] = useState(0)
  const [sortBy, setSortBy] = useState('recently-added')
  const [watchedFolder, setWatchedFolder] = useState<string | null>(null)
  const [isWatching, setIsWatching] = useState(false)
  const [jsMediaTagsLoaded, setJsMediaTagsLoaded] = useState(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const folderInputRef = useRef<HTMLInputElement | null>(null)

  const { playTrack, currentTrack, isPlaying, setQueue, clearQueue, toggleShuffle, shuffle, queue } = usePlayer()
  
  
  const { setSearchQuery: setGlobalSearch, searchQuery: globalSearch } = useSearch()
  const settingsContext = useSettings()
  // Persist loaded state of album arts across virtualization mounts (backed by module cache)
  const loadedImagesRef = React.useRef<Map<string, boolean>>(albumArtLoadedCache)

  // Shuffle function using Fisher-Yates algorithm
  const shuffleArray = (array: LocalTrack[]) => {
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
      if (tracks && tracks.length > 0) {
        const shuffledTracks = shuffleArray(tracks);
        
        const globalQueue = shuffledTracks.map(t => {
          const track: any = {
            id: t.id,
            title: t.title,
            artist: t.artist,
            album: t.album || '',
            albumArt: t.albumArt || '',
            duration: t.duration || 0,
            url: t.fileUrl,
            createdAt: t.addedAt,
            updatedAt: t.addedAt,
            genre: '',
            year: undefined
          };
          
          // Add local file properties for playback
          track.filePath = t.filePath;
          track.fileUrl = t.fileUrl;
          
          return track;
        });
        
        setQueue(globalQueue);
      }
    } else {
      // Turning shuffle OFF - clear the queue entirely
      clearQueue();
    }
    
    // Toggle the player's shuffle state
    toggleShuffle();
  };

  // Load jsmediatags library
  React.useEffect(() => {
    const loadJsMediaTags = () => {
      if ((window as any).jsmediatags) {
        setJsMediaTagsLoaded(true)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jsmediatags/3.9.5/jsmediatags.min.js'
      script.onload = () => {
        setJsMediaTagsLoaded(true)
      }
      script.onerror = () => {
        setJsMediaTagsLoaded(false)
      }
    }

    loadJsMediaTags()
  }, [])

  // Preload first 100 album art images only for better performance
  React.useEffect(() => {
    if (!tracks || tracks.length === 0) return;

    const preloadCount = Math.min(100, tracks.length);
    
    const preloadImage = (url: string) => {
      return new Promise((resolve) => {
        if (!url || url.startsWith('file://') || (!url.startsWith('data:') && !url.startsWith('http'))) {
          resolve(null);
          return;
        }

        if (globalImageCache.has(url)) {
          resolve(url);
          return;
        }

        const img = new Image();
        img.onload = () => {
          globalImageCache.set(url, true);
          loadedImagesRef.current.set(url, true);
          resolve(url);
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    };

    // Preload first 100 images in smaller batches
    const batchSize = 10;
    const preloadBatch = async (startIndex: number) => {
      if (startIndex >= preloadCount) {
        return;
      }
      
      const batch = tracks
        .slice(startIndex, Math.min(startIndex + batchSize, preloadCount))
        .filter(track => track.albumArt)
        .map(track => preloadImage(track.albumArt!));
      
      await Promise.all(batch);
      setTimeout(() => preloadBatch(startIndex + batchSize), 100);
    };

    preloadBatch(0);
  }, [tracks]);

  // Filter and sort tracks based on search query and sort option
  const filteredTracks = React.useMemo(() => {
    if (!tracks || tracks.length === 0) return [];
    
    let filtered = [...tracks];
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(track => 
        track.title.toLowerCase().includes(query) ||
        track.artist.toLowerCase().includes(query) ||
        (track.album && track.album.toLowerCase().includes(query))
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'artist':
        filtered.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
      case 'album':
        filtered.sort((a, b) => (a.album || '').localeCompare(b.album || ''));
        break;
      case 'duration':
        filtered.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case 'recently-added':
      default:
        filtered.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        break;
    }
    
    return filtered;
  }, [tracks, searchQuery, sortBy])

  // Search functionality
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleHideSearchIfEmpty = () => {
    if (!searchQuery.trim()) {
      setShowSearch(false);
    }
  };
  // Focus input whenever it becomes visible
  React.useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [showSearch]);

  // Helper function to highlight matching letters
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

  // Suppress WebSocket errors during file processing
  React.useEffect(() => {
    const originalConsoleError = (() => {}) as any;
    const handleConsoleError = (...args: any[]) => {
      // Suppress Socket.IO/WebSocket errors during import
      if (importing && args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('websocket error') || arg.includes('socket.io'))
      )) {
        return; // Suppress these errors during import
      }
      originalConsoleError.apply(console, args);
    };

    return () => {};
  }, [importing]);

  // Load persistent watched folder on mount
  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Prefer backend DB-saved folder
        let folderPath: string | null = null
        try {
          const mod = await import('@/lib/api/library')
          folderPath = await mod.libraryApi.getLibraryFolder()
        } catch (e) {
          // Silent fail
        }

        // Fallback to Electron saved folder if backend not set
        if (!folderPath && typeof window !== 'undefined' && (window as any).electronAPI?.getSavedFolder) {
          try {
            folderPath = await (window as any).electronAPI.getSavedFolder()
          } catch (e) {
            // Silent fail
          }
        }

        if (!folderPath) {
          // No configured folder; stop importing state so empty-state can show
          setImporting(false)
          return
        }

        if (cancelled) return
        setWatchedFolder(folderPath)

        // Check if we already have tracks loaded in app cache
        if (isCacheLoaded && appTrackCache && appTrackCache.length > 0) {
          // Cache already loaded - tracks set in initial state
          
          // Start folder watching for real-time updates
          if ((window as any).electronAPI?.startFolderWatch) {
            try {
              await (window as any).electronAPI.startFolderWatch(folderPath)
              if (!cancelled) {
                setIsWatching(true)
              }
            } catch (e) {
              // Silent fail
            }
          }
          return // Exit early - no scan needed
        }
        
        // Do initial scan only if no app cache exists
        if (!isCacheLoaded && typeof window !== 'undefined' && (window as any).electronAPI?.scanMusicFolder) {
          try {
            // Show progress bar immediately when starting scan
            setImporting(true)
            setImportProgress(0)
            setImportTotal(0) // Will update when we know file count
            
            const files = await (window as any).electronAPI.scanMusicFolder(folderPath)
            if (cancelled) return
            
            if (Array.isArray(files) && files.length) {
              // Update total now that we know file count
              setImportTotal(files.length)
              
              const processed: LocalTrack[] = []
              
              for (let i = 0; i < files.length; i++) {
                if (cancelled) return
                const f = files[i]
                
                // Update progress for every file to show accurate counter
                setImportProgress(i + 1)
                
                // Create mock File object for metadata extraction
                const mockFile = new File([], f.name, {
                  type: f.name.endsWith('.mp3') ? 'audio/mpeg' : 'audio/mp4',
                  lastModified: f.lastModified || Date.now()
                })
                ;(mockFile as any).filePath = f.path
                ;(mockFile as any).fileSize = f.size
                
                // Extract FULL metadata (ID3 tags, album art, etc.)
                let metadata
                try {
                  metadata = await extractMetadata(mockFile)
                } catch (error) {
                  // Use fallback metadata
                  metadata = {
                    title: f.name.replace(/\.(mp3|m4a|wav|flac|aac|ogg)$/i, ''),
                    artist: 'Unknown Artist',
                    album: 'Unknown Album',
                    duration: 0
                  }
                }
                
                const track: LocalTrack = {
                  id: `watched-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  title: metadata.title || f.name.replace(/\.(mp3|m4a|wav|flac|aac|ogg)$/i, ''),
                  artist: metadata.artist || 'Unknown Artist',
                  album: metadata.album || 'Unknown Album',
                  albumArt: metadata.albumArt || undefined,
                  filePath: f.path,
                  fileUrl: `file://${f.path}`,
                  duration: metadata.duration || 0,
                  size: f.size || 0,
                  addedAt: new Date().toISOString(),
                  format: (f.name?.split('.')?.pop()?.toLowerCase()) || 'mp3',
                }
                
                processed.push(track)
              }
              
              // Only show tracks after ALL metadata is extracted
              setTracks(processed)
              setImporting(false)
              setImportProgress(0)
              setImportTotal(0)
              
              // Update app cache for future page visits
              appTrackCache = processed
              isCacheLoaded = true
            } else {
              // No files found, hide progress bar
              setImporting(false)
              setImportProgress(0)
              setImportTotal(0)
            }
          } catch (e) {
            setImporting(false)
            setImportProgress(0)
            setImportTotal(0)
          }
        }

        // Start OS-level watch for real-time updates (always start, regardless of cache)
        if ((window as any).electronAPI?.startFolderWatch) {
          try {
            await (window as any).electronAPI.startFolderWatch(folderPath)
            if (!cancelled) {
              setIsWatching(true)
            }
          } catch (e) {
            // Silent fail
          }
        }
      } catch (e) {
        // Silent fail
      }
    })()
    return () => { cancelled = true }
  }, []);

  // Start folder watching
  const startFolderWatching = async (folderPath: string) => {
    if (!window.electronAPI || !('startFolderWatch' in window.electronAPI)) {
      return;
    }

    try {
      setIsWatching(true);
      
      // Start watching for file changes (if available)
      if (typeof window.electronAPI.startFolderWatch === 'function') {
        await window.electronAPI.startFolderWatch(folderPath);
      }
      
      // Always do initial scan when starting fresh watching
      await scanWatchedFolder(folderPath);
    } catch (error) {
      setIsWatching(false);
    }
  };

  // Stop folder watching
  const stopFolderWatching = async () => {
    if (!window.electronAPI || !('stopFolderWatch' in window.electronAPI)) return;

    try {
      setIsWatching(false);
      if (typeof window.electronAPI.stopFolderWatch === 'function') {
        await window.electronAPI.stopFolderWatch();
      }
    } catch (error) {
      // Silent fail
    }
  };

  // Scan watched folder
  const scanWatchedFolder = async (folderPath: string) => {
    if (!window.electronAPI || !('scanMusicFolder' in window.electronAPI)) return;

    try {
      setImporting(true);
      
      const files = typeof window.electronAPI.scanMusicFolder === 'function' 
        ? await window.electronAPI.scanMusicFolder(folderPath)
        : [];

      if (files.length > 0) {
        setImportTotal(files.length);
        const processedTracks: LocalTrack[] = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setImportProgress(i + 1);

          try {
            const metadata = extractBasicMetadataFromFilename(file.name);
            const track: LocalTrack = {
              id: `watched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: metadata.title || 'Unknown Title',
              artist: metadata.artist || 'Unknown Artist',
              album: metadata.album || 'Unknown Album',
              filePath: file.path,
              fileUrl: `file://${file.path}`,
              duration: 0,
              size: file.size || 0,
              addedAt: new Date().toISOString(),
              format: file.name.split('.').pop()?.toLowerCase() || 'mp3'
            };

            processedTracks.push(track);
          } catch (error) {
            // Silent fail
          }
        }

        setTracks(processedTracks);
        
        // Skip localStorage to avoid quota issues with album art data URLs
        
        toast.success(`Loaded ${processedTracks.length} tracks from watched folder`);
      }
    } catch (error) {
      toast.error('Failed to scan watched folder');
    } finally {
      setImporting(false);
      setImportProgress(0);
      setImportTotal(0);
    }
  };

  // Handle folder changes
  const handleFolderChange = React.useCallback(async (event: any) => {
    const { type, filePath } = event.detail;

    if (!watchedFolder) return;

    switch (type) {
      case 'add':
        // New file added
        if (filePath.match(/\.(mp3|m4a|wav|flac)$/i)) {
          try {
            const fileName = filePath.split(/[/\\]/).pop() || '';
            const mockFile = new File([], fileName, {
              type: fileName.endsWith('.mp3') ? 'audio/mpeg' : 'audio/mp4',
              lastModified: Date.now()
            })
            ;(mockFile as any).filePath = filePath
            
            // Extract FULL metadata (ID3 tags, album art, etc.)
            const metadata = await extractMetadata(mockFile)
            
            const newTrack: LocalTrack = {
              id: `watched-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              title: metadata.title || fileName.replace(/\.(mp3|m4a|wav|flac|aac|ogg)$/i, ''),
              artist: metadata.artist || 'Unknown Artist',
              album: metadata.album || 'Unknown Album',
              albumArt: metadata.albumArt || undefined,
              filePath: filePath,
              fileUrl: `file://${filePath}`,
              duration: metadata.duration || 0,
              size: 0,
              addedAt: new Date().toISOString(),
              format: fileName.split('.').pop()?.toLowerCase() || 'mp3'
            };

            setTracks(prev => {
              const updated = [...prev, newTrack];
              // Update app cache
              appTrackCache = updated
              return updated;
            });

            toast.success(`Added: ${metadata.title || fileName}`);
          } catch (error) {
            // Silent fail
          }
        }
        break;

      case 'unlink':
        // File deleted
        setTracks(prev => {
          const updated = prev.filter(track => track.filePath !== filePath);
          // Update app cache
          appTrackCache = updated
          
          const deletedTrack = prev.find(track => track.filePath === filePath);
          if (deletedTrack) {
            toast.info(`Removed: ${deletedTrack.title}`);
          }
          
          return updated;
        });
        break;

      case 'change':
        // File modified (renamed)
        // Could implement rename detection here
        break;
    }
  }, [watchedFolder]);

  // Set up folder change listener
  React.useEffect(() => {
    if (isWatching) {
      window.addEventListener('folderChange', handleFolderChange);
      return () => {
        window.removeEventListener('folderChange', handleFolderChange);
      };
    }
  }, [isWatching, handleFolderChange]);

  // Function to set new watched folder
  const setNewWatchedFolder = async (folderPath: string) => {
    // Stop watching current folder
    if (isWatching) {
      await stopFolderWatching();
    }

    // Clear current tracks
    setTracks([]);
    
    // Save new folder path
    localStorage.setItem('watchedMusicFolder', folderPath);
    setWatchedFolder(folderPath);
    
    // Start watching new folder
    await startFolderWatching(folderPath);
    
    toast.success(`Now watching: ${folderPath}`);
  };

  // Function to stop watching and clear
  const clearWatchedFolder = async () => {
    await stopFolderWatching();
    
    localStorage.removeItem('watchedMusicFolder');
    localStorage.removeItem('watchedFolderTracks');
    
    setWatchedFolder(null);
    setTracks([]);
    
    toast.info('Stopped watching folder');
  };

  // Listen for folder scan events from Settings page
  React.useEffect(() => {
    // Check for pending scans in localStorage
    const pendingScan = localStorage.getItem('pendingMusicScan')
    
    if (pendingScan) {
      try {
        const scanData = JSON.parse(pendingScan)
        
        // Check if scan is recent (within 5 minutes)
        const scanAge = Date.now() - scanData.timestamp
        const maxAge = 5 * 60 * 1000 // 5 minutes
        
        if (scanAge > maxAge) {
          localStorage.removeItem('pendingMusicScan')
          return
        }
        
        // Process the pending scan
        if (scanData.files && scanData.files.length > 0) {
          if (scanData.isElectron) {
            // Handle Electron scanned files
            
            // Convert Electron file data to File objects
            Promise.all(scanData.files.map(async (fileData: any) => {
              try {
                const mockFile = new File([], fileData.name, {
                  type: fileData.extension === '.mp3' ? 'audio/mpeg' : 'audio/mp4',
                  lastModified: fileData.lastModified
                })
                
                ;(mockFile as any).filePath = fileData.path
                ;(mockFile as any).fileSize = fileData.size
                
                return mockFile
              } catch (error) {
                return null
              }
            })).then(fileObjects => {
              const validFiles = fileObjects.filter(f => f !== null) as File[]
              if (validFiles.length > 0) {
                // Create a proper FileList-like object with indexed properties
                const fileList = Object.assign(validFiles, {
                  length: validFiles.length,
                  item: (index: number) => validFiles[index],
                  [Symbol.iterator]: function* () {
                    for (let i = 0; i < validFiles.length; i++) {
                      yield validFiles[i]
                    }
                  }
                }) as FileList
                
                // Process files directly since handleFileImport isn't available yet
                const processFiles = async () => {
                  setImporting(true)
                  setImportTotal(fileList.length)
                  setImportProgress(0)
                  try {
                    const processedTracks: LocalTrack[] = []
                    
                    for (let i = 0; i < fileList.length; i++) {
                      const file = fileList[i]
                      if (!file) {
                        continue
                      }
                      
                      const metadata = await extractMetadata(file)
                      const fileExtension = file.name.split('.').pop()?.toLowerCase()
                      const track: LocalTrack = {
                        id: `local-${Date.now()}-${i}`,
                        title: metadata.title || file.name.replace(/\.[^/.]+$/, ''),
                        artist: metadata.artist || 'Unknown Artist',
                        album: metadata.album || 'Unknown Album',
                        duration: metadata.duration || 0,
                        albumArt: metadata.albumArt,
                        filePath: (file as any).filePath || '',
                        fileUrl: (file as any).filePath ? `file://${(file as any).filePath}` : URL.createObjectURL(file),
                        size: file.size,
                        format: (fileExtension === 'mp3' || fileExtension === 'm4a') ? fileExtension : 'mp3',
                        addedAt: new Date().toISOString()
                      }
                      processedTracks.push(track)
                      
                      // Update progress only (don't update tracks until all done)
                      setImportProgress(i + 1)
                    }
                    
                    // Update all tracks at once after extraction completes
                    setTracks(prev => [...prev, ...processedTracks])
                    toast.success(`Imported ${validFiles.length} songs from pending scan!`)
                  } catch (error) {
                    toast.error('Failed to process scanned files')
                  } finally {
                    setImporting(false)
                    setImportProgress(0)
                    setImportTotal(0)
                  }
                }
                processFiles()
              }
            })
          }
        }
        
        // Clear the pending scan
        localStorage.removeItem('pendingMusicScan')
      } catch (error) {
        localStorage.removeItem('pendingMusicScan')
      }
    }
    

    const handleFolderScanned = async (event: any) => {
      const { files, folderPath } = event.detail
      
      if (files && files.length > 0) {
        
        // If this is a new folder selection, set it as watched folder
        if (folderPath && folderPath !== watchedFolder) {
          await setNewWatchedFolder(folderPath);
          return; // The folder watching will handle the import
        }
        
        // Legacy handling for manual imports (non-watched folders)
        if (window.electronAPI && files[0].path) {
          // Handle Electron scanned files
          
          // Create a proper FileList-like object for Electron files
          const validFiles = files.filter((file: any) => 
            file.name.match(/\.(mp3|m4a|wav|flac)$/i)
          )
          
          if (validFiles.length > 0) {
            const fileList = Object.assign(validFiles, {
              length: validFiles.length,
              item: (index: number) => validFiles[index],
              [Symbol.iterator]: function* () {
                for (let i = 0; i < validFiles.length; i++) {
                  yield validFiles[i]
                }
              }
            } as FileList)
            
            await handleFileImport(fileList)
            toast.success(`Imported ${validFiles.length} songs from folder scan!`)
          }
        } else {
          // Handle browser File API scanned files
          await handleFileImport(files)
          toast.success(`Imported ${files.length} songs from folder scan!`)
        }
      }
    }

    // Add event listener for folder scans
    window.addEventListener('folderScanned', handleFolderScanned)
    
    // Add test event listener
    const handleTestEvent = (event: Event) => {
      const customEvent = event as CustomEvent
    }
    window.addEventListener('test-event', handleTestEvent)
    
    // Cleanup
    return () => {
      window.removeEventListener('folderScanned', handleFolderScanned)
      window.removeEventListener('test-event', handleTestEvent)
    }
  }, [settingsContext.enableLocalFiles])

  // Extract basic metadata from filename for Electron files
  const extractBasicMetadataFromFilename = (filename: string): Partial<LocalTrack> => {
    // Remove file extension
    const nameWithoutExt = filename.replace(/\.(mp3|m4a|wav|flac|aac|ogg)$/i, '')
    
    // Try to parse common filename patterns
    // Pattern 1: "Artist - Title"
    if (nameWithoutExt.includes(' - ')) {
      const parts = nameWithoutExt.split(' - ')
      if (parts.length >= 2) {
        return {
          artist: parts[0].trim(),
          title: parts.slice(1).join(' - ').trim(),
          album: 'Unknown Album'
        }
      }
    }
    
    // Pattern 2: "Title-Artist" or "Title feat Artist"
    if (nameWithoutExt.includes(' feat ') || nameWithoutExt.includes(' ft ')) {
      const featMatch = nameWithoutExt.match(/^(.+?)\s+(feat|ft)\s+(.+)$/i)
      if (featMatch) {
        return {
          title: featMatch[1].trim(),
          artist: featMatch[3].trim(),
          album: 'Unknown Album'
        }
      }
    }
    
    // Pattern 3: Just use the filename as title
    return {
      title: nameWithoutExt.trim(),
      artist: 'Unknown Artist',
      album: 'Unknown Album'
    }
  }

  // Extract metadata from audio file using jsmediatags
  const extractMetadata = async (file: File): Promise<Partial<LocalTrack>> => {
    return new Promise(async (resolve) => {
      // Check if this is an Electron file with a file path
      const isElectronFile = (file as any).filePath
      
      // For Electron files, use real metadata extraction via IPC
      if (isElectronFile) {
        try {
          if (typeof window !== 'undefined' && (window as any).electronAPI?.extractMetadata) {
            const realMetadata = await (window as any).electronAPI.extractMetadata((file as any).filePath)
            
            // Album art should already be a data URL from the backend
            if (realMetadata.albumArt && realMetadata.albumArt.startsWith('file://')) {
              realMetadata.albumArt = undefined
            }
            
            resolve(realMetadata)
            return
          }
        } catch (error) {
          // Fallback to filename parsing
        }
        
        // Fallback to filename parsing
        const basicMetadata = extractBasicMetadataFromFilename(file.name)
        resolve(basicMetadata)
        return
      }
      
      const url = URL.createObjectURL(file)
      
      // Try to use jsmediatags if available, otherwise fall back to basic extraction
      if (typeof window !== 'undefined' && (window as any).jsmediatags) {
        ;(window as any).jsmediatags.read(file, {
          onSuccess: async (tag: any) => {
            const tags = tag.tags
            let albumArt: string | undefined = undefined
            
            // Extract album artwork if available
            if (tags.picture) {
              const { data, format } = tags.picture
              const byteArray = new Uint8Array(data)
              const blob = new Blob([byteArray], { type: format })
              try {
                // Use persistent data URL to avoid changing blob URLs across sessions
                albumArt = await blobToDataURL(blob)
              } catch {
                // Fallback to object URL if conversion fails (less stable)
                albumArt = URL.createObjectURL(blob)
              }
            }
            
            // Create audio element to get duration
            const audio = new Audio()
            audio.addEventListener('loadedmetadata', () => {
              const metadata: Partial<LocalTrack> = {
                title: tags.title || file.name.replace(/\.(mp3|m4a)$/i, ''),
                artist: tags.artist || 'Unknown Artist',
                album: tags.album || 'Unknown Album',
                albumArt: albumArt,
                duration: Math.floor(audio.duration),
                format: file.name.toLowerCase().endsWith('.mp3') ? 'mp3' : 'm4a',
                size: file.size,
                filePath: file.name,
                fileUrl: url
              }
              resolve(metadata)
            })
            
            audio.addEventListener('error', () => {
              const metadata: Partial<LocalTrack> = {
                title: tags.title || file.name.replace(/\.(mp3|m4a)$/i, ''),
                artist: tags.artist || 'Unknown Artist',
                album: tags.album || 'Unknown Album',
                albumArt: albumArt,
                format: file.name.toLowerCase().endsWith('.mp3') ? 'mp3' : 'm4a',
                size: file.size,
                filePath: file.name,
                fileUrl: url
              }
              resolve(metadata)
            })
            
            audio.src = url
          },
          onError: (error: any) => {
            // Fallback to basic extraction
            basicMetadataExtraction(file, url, resolve)
          }
        })
      } else {
        // Fallback to basic extraction if jsmediatags is not available
        basicMetadataExtraction(file, url, resolve)
      }
    })
  }

  // Fallback basic metadata extraction
  const basicMetadataExtraction = (file: File, url: string, resolve: (value: Partial<LocalTrack>) => void) => {
    const audio = new Audio()
    
    audio.addEventListener('loadedmetadata', () => {
      const metadata: Partial<LocalTrack> = {
        title: file.name.replace(/\.(mp3|m4a)$/i, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        duration: Math.floor(audio.duration),
        format: file.name.toLowerCase().endsWith('.mp3') ? 'mp3' : 'm4a',
        size: file.size,
        filePath: file.name,
        fileUrl: url
      }
      resolve(metadata)
    })

    audio.addEventListener('error', () => {
      resolve({
        title: file.name.replace(/\.(mp3|m4a)$/i, ''),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        format: file.name.toLowerCase().endsWith('.mp3') ? 'mp3' : 'm4a',
        size: file.size,
        filePath: file.name,
        fileUrl: url
      })
    })

    audio.src = url
  }

  const handleFileImport = React.useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    setImporting(true)
    const audioFiles = Array.from(files).filter(file => 
      file.type.includes('audio') || 
      file.name.toLowerCase().endsWith('.mp3') || 
      file.name.toLowerCase().endsWith('.m4a')
    )

    if (audioFiles.length === 0) {
      toast.error('No audio files found. Please select MP3 or M4A files.')
      setImporting(false)
      return
    }

    setImportTotal(audioFiles.length)
    setImportProgress(0)

    try {
      const newTracks: LocalTrack[] = []
      
      for (let i = 0; i < audioFiles.length; i++) {
        const file = audioFiles[i]
        const metadata = await extractMetadata(file)
        const track: LocalTrack = {
          id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: metadata.title || file.name,
          artist: metadata.artist || 'Unknown Artist',
          album: metadata.album,
          albumArt: metadata.albumArt,
          duration: metadata.duration,
          filePath: metadata.filePath || file.name,
          fileUrl: metadata.fileUrl || URL.createObjectURL(file),
          format: metadata.format || 'mp3',
          size: file.size,
          addedAt: new Date().toISOString()
        }
        newTracks.push(track)
        
        // Update progress
        setImportProgress(i + 1)
      }

      setTracks(prev => [...prev, ...newTracks])
      toast.success(`Imported ${newTracks.length} audio file${newTracks.length !== 1 ? 's' : ''}`)
    } catch (error) {
      toast.error('Failed to import some files')
    } finally {
      setImporting(false)
      setImportProgress(0)
      setImportTotal(0)
    }
  }, []) // useCallback dependencies

  const handleFolderImport = () => {
    folderInputRef.current?.click()
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handlePlay = (track: LocalTrack) => {
    const playerTrack: Track = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      albumArt: track.albumArt || '',
      duration: track.duration || 0,
      url: track.fileUrl,
      createdAt: track.addedAt,
      updatedAt: track.addedAt,
      genre: '',
      year: undefined
    }
    
    // Add local file properties for the player
    ;(playerTrack as any).filePath = track.filePath
    ;(playerTrack as any).fileUrl = track.fileUrl
    
    playTrack(playerTrack)
  }

  const formatDuration = (seconds: number) => {
    const totalSeconds = Math.floor(seconds) // Convert decimal to whole seconds
    const mins = Math.floor(totalSeconds / 60)
    const secs = totalSeconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)} MB`
  }

  // Convert a Blob to a persistent data URL (base64)
  const blobToDataURL = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }

  // Memoize itemData - ONLY update when tracks or search changes
  // Use stable reference for currentTrack/isPlaying to prevent re-renders
  const itemData = React.useMemo(() => ({
    tracks: filteredTracks,
    onPlay: handlePlay,
    highlight: highlightMatch,
    searchQuery: searchQuery,
    loadedImages: loadedImagesRef.current,
    getCurrentTrackId: () => currentTrack?.id,
    getIsPlaying: () => isPlaying
  }), [filteredTracks, searchQuery])

  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp3,.m4a,audio/*"
        onChange={(e) => handleFileImport(e.target.files)}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        {...({ webkitdirectory: "" } as any)}
        onChange={(e) => handleFileImport(e.target.files)}
        className="hidden"
      />

      {/* If global search is active, show the same overlay used on the homepage and hide page content */}
      {globalSearch?.trim() ? (
        <SearchOverlay />
      ) : (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                <Download className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Local Files</h1>
                <p className="text-muted-foreground">
                  {tracks.length} {tracks.length === 1 ? 'file' : 'files'}
                </p>
              </div>
            </div>

          </div>

          <div className="flex-1">
            {tracks.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                {importing ? (
                  // Show file progress when importing
                  <p className="text-sm text-muted-foreground">
                    {importTotal > 0 ? (
                      `Processing ${importProgress}/${importTotal} files`
                    ) : (
                      <>
                        Processing
                        <span className="inline-block animate-pulse">.</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                        <span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                      </>
                    )}
                  </p>
                ) : (
                  // Default state when not importing
                  <>
                    <Download className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No local files yet</h3>
                    <p className="text-muted-foreground mb-6">
                      Your Local Files And Downloads Will Appear Here
                    </p>
                  </>
                )}
              </div>
            ) : importing ? (
              // Show loading state during metadata extraction to prevent flickering
              <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <p className="text-sm text-muted-foreground mb-4">
                  {importTotal > 0 ? (
                    `Processing ${importProgress}/${importTotal} files`
                  ) : (
                    <>
                      Processing
                      <span className="inline-block animate-pulse">.</span>
                      <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
                      <span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
                    </>
                  )}
                </p>
                {importTotal > 0 && (
                  <div className="w-64">
                    <Progress value={(importProgress / importTotal) * 100} className="h-2" />
                    <p className="text-xs text-muted-foreground mt-2">
                      {importProgress} / {importTotal} files
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-6 pb-6">
                {/* Playlist-style Actions */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    {/* Main Play Button */}
                    <button 
                      onClick={() => {
                        if (filteredTracks.length > 0) {
                          // Create queue with all tracks
                          const globalQueue = filteredTracks.map(t => {
                            const track: any = {
                              id: t.id,
                              title: t.title,
                              artist: t.artist,
                              album: t.album || '',
                              albumArt: t.albumArt || '',
                              duration: t.duration || 0,
                              url: t.fileUrl,
                              createdAt: t.addedAt,
                              updatedAt: t.addedAt,
                              genre: '',
                              year: undefined
                            };
                            track.filePath = t.filePath;
                            track.fileUrl = t.fileUrl;
                            return track;
                          });
                          
                          setQueue(globalQueue);
                          handlePlay(filteredTracks[0]);
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
                  </div>

                  {/* Search and Sort Controls */}
                  <div className="flex justify-end items-center h-12 space-x-2">
                    {/* Search (fixed-size overlay to avoid layout flashes) */}
                    <div className="relative w-[256px] h-12">
                      <AnimatePresence initial={false} mode="sync">
                      {!showSearch ? (
                        <motion.div
                          key="search-icon"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.12, ease: 'easeOut' }}
                          className="absolute right-0 top-0 h-12 flex items-center"
                          style={{ background: 'transparent', border: 'none', outline: 'none', willChange: 'opacity, transform' }}
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label="Search"
                            type="button"
                            tabIndex={-1}
                            onMouseDown={(e) => {
                              // Prevent the button from receiving focus (which can show a square border)
                              e.preventDefault()
                            }}
                            onClick={() => setShowSearch(true)}
                            className="group h-10 w-10 focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none focus:shadow-none focus-visible:shadow-none ring-0 ring-offset-0 ring-transparent focus:ring-transparent focus-visible:ring-transparent hover:bg-transparent active:bg-transparent border-0"
                            style={{ 
                              WebkitTapHighlightColor: 'transparent',
                              outline: 'none !important',
                              border: 'none !important',
                              boxShadow: 'none !important'
                            }}
                            title="Search"
                          >
                            <Search className="h-5 w-5 text-muted-foreground group-hover:text-[#00BFFF]" />
                          </Button>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="search-input"
                          initial={{ opacity: 0, scaleX: 0 }}
                          animate={{ opacity: 1, scaleX: 1 }}
                          exit={{ opacity: 0, scaleX: 0 }}
                          transition={{ duration: 0.12, ease: 'easeOut' }}
                          className="absolute inset-0 flex items-center focus-within:outline-none focus-within:ring-0 focus-within:ring-offset-0 focus-within:shadow-none"
                          style={{ overflow: 'hidden', willChange: 'opacity, transform', background: 'transparent', transformOrigin: 'right center' }}
                        >
                          <div className="relative w-full">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              ref={searchInputRef}
                              placeholder="Search in downloads"
                              value={searchQuery}
                              onChange={(e) => handleSearch(e.target.value)}
                              onBlur={handleHideSearchIfEmpty}
                              onKeyDown={(e) => {
                                if (e.key === 'Escape') {
                                  if (!searchQuery.trim()) setShowSearch(false);
                                }
                              }}
                              className="pl-12 pr-4 h-12 rounded-full bg-background/60 border border-[#1f2937] focus:border-[#1f2937] focus-visible:border-[#1f2937] hover:bg-background/80 transition-colors outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 ring-transparent focus:ring-transparent focus-visible:ring-transparent shadow-none focus:shadow-none"
                              style={{ boxShadow: 'none', WebkitTapHighlightColor: 'transparent' }}
                            />
                          </div>
                        </motion.div>
                      )}
                      </AnimatePresence>
                    </div>

                    {/* Sort Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="group h-10 w-10 hover:scale-105 transition-transform focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none focus:shadow-none focus-visible:shadow-none ring-0 ring-offset-0 ring-transparent focus:ring-transparent focus-visible:ring-transparent hover:bg-transparent active:bg-transparent"
                          style={{ WebkitTapHighlightColor: 'transparent' }}
                          title="Sort and view options"
                        >
                          <Menu className="h-5 w-5 text-muted-foreground group-hover:text-[#00BFFF] transition-colors" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56 bg-background backdrop-blur-md border-border">
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Sort by</div>
                        <DropdownMenuItem 
                          onClick={() => setSortBy('title')}
                          className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                        >
                          <span className={sortBy === 'title' ? 'text-[#00BFFF]' : ''}>Title</span>
                          {sortBy === 'title' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setSortBy('artist')}
                          className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                        >
                          <span className={sortBy === 'artist' ? 'text-[#00BFFF]' : ''}>Artist</span>
                          {sortBy === 'artist' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setSortBy('album')}
                          className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                        >
                          <span className={sortBy === 'album' ? 'text-[#00BFFF]' : ''}>Album</span>
                          {sortBy === 'album' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setSortBy('duration')}
                          className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                        >
                          <span className={sortBy === 'duration' ? 'text-[#00BFFF]' : ''}>Duration</span>
                          {sortBy === 'duration' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setSortBy('recently-added')}
                          className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                        >
                          <span className={sortBy === 'recently-added' ? 'text-[#00BFFF]' : ''}>Recently added</span>
                          {sortBy === 'recently-added' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator className="bg-border" />
                        
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">View as</div>
                        <DropdownMenuItem 
                          onClick={() => setViewAs('compact')}
                          className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                        >
                          <div className="flex items-center">
                            <Menu className="h-4 w-4 mr-2" />
                            <span className={viewAs === 'compact' ? 'text-[#00BFFF]' : ''}>Compact</span>
                          </div>
                          {viewAs === 'compact' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => setViewAs('list')}
                          className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                        >
                          <div className="flex items-center">
                            <ListIcon className="h-4 w-4 mr-2" />
                            <span className={viewAs === 'list' ? 'text-[#00BFFF]' : ''}>List</span>
                          </div>
                          {viewAs === 'list' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Tracks List - Conditional virtualization */}
                {filteredTracks.length === 0 ? (
                  <div className="text-center py-8">
                    <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No tracks match your search</p>
                  </div>
                ) : filteredTracks.length <= 50 ? (
                  // Non-virtualized list for small collections - all images load immediately
                  <div className="space-y-1 px-4">
                    {filteredTracks.map((track, index) => (
                      <TrackRow key={track.id} index={index} style={{}} data={itemData} />
                    ))}
                  </div>
                ) : (
                  // Virtualized list for large collections
                  <VirtualizedTrackList tracks={filteredTracks} itemData={itemData} />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
