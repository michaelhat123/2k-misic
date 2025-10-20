'use client';

import React, { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, Music, Clock, Users, Plus, Search, Camera, Globe, Lock, Edit2, Save, X, Menu, Check, List, Grid3X3, Download, Shuffle, MoreHorizontal, Pause, Trash2 } from 'lucide-react';
import { playlistsApi, PlaylistTrack, sortTracksByPosition } from '@/lib/api/playlists';
import { usePlayer } from '@/components/player/player-provider';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { BulkAddToPlaylistModal } from '@/components/playlist/add-to-playlist-button';

export default function PlaylistPage() {
  const params = useParams();
  const playlistId = params?.id as string;
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sortBy, setSortBy] = useState('custom');
  const [viewAs, setViewAs] = useState('list');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddToPlaylistDialog, setShowAddToPlaylistDialog] = useState(false);
  const [editFormData, setEditFormData] = useState({ name: '', description: '' });
  const [headerOpacity, setHeaderOpacity] = useState(0);
  const [npvExpanded, setNpvExpanded] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { playTrack, setQueue, clearQueue, toggleShuffle, shuffle, queue } = usePlayer();
  const queryClient = useQueryClient();

  // Determine if this is numeric ID (owner access) or public ID (public access)
  const isNumericId = /^\d+$/.test(playlistId || '');
  const isOwnerAccess = isNumericId;

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => playlistsApi.getPlaylist(playlistId),
    enabled: !!playlistId,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent refetch on window focus
    refetchOnWindowFocus: false, // Don't refetch when tab regains focus
  });

  // Copy public link function
  const copyPublicLink = async () => {
    if (!playlist?.public_id) return;
    
    const publicUrl = `${window.location.origin}/playlists/${playlist.public_id}`;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setShowCopySuccess(true);
      toast.success('Public link copied to clipboard!');
      setTimeout(() => setShowCopySuccess(false), 2000);
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  // Update playlist mutation (only for owners)
  const updatePlaylistMutation = useMutation({
    mutationFn: async (data: { id: string | number; data: { name?: string; description?: string; is_public?: boolean; skipToast?: boolean } }) => {
      return playlistsApi.updatePlaylist(data.id, data.data);
    },
    onSuccess: (updatedPlaylist, variables) => {
      // Update the playlist cache with the complete updated data
      queryClient.setQueryData(['playlist', playlistId], (oldData: any) => {
        if (!oldData) return updatedPlaylist;
        
        // Merge the updated playlist data while preserving tracks and other properties
        return {
          ...oldData,
          ...updatedPlaylist,
          // Ensure tracks are preserved if they exist in old data but not in response
          tracks: updatedPlaylist.tracks || oldData.tracks
        };
      });
      
      // Also update the playlists list cache
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      
      // Only show generic toast if not a privacy change (privacy has custom toasts)
      if (!variables.data.hasOwnProperty('is_public')) {
        toast.success('Playlist updated successfully!');
        setShowEditDialog(false);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update playlist');
    }
  });

  // Delete playlist mutation (only for owners)
  const deletePlaylistMutation = useMutation({
    mutationFn: async (id: string | number) => {
      return playlistsApi.deletePlaylist(id);
    },
    onSuccess: () => {
      // Invalidate playlists cache
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist deleted successfully!');
      // Navigate back to playlists or home
      window.location.href = '/library/playlists';
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete playlist');
    }
  });

  // Handle delete playlist
  const handleDeletePlaylist = async () => {
    if (!playlist) return;
    
    try {
      await deletePlaylistMutation.mutateAsync(playlist.id);
    } catch (error) {
      // Silent fail
    }
  };

  // Shuffle function using Fisher-Yates algorithm
  const shuffleArray = (array: PlaylistTrack[]) => {
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
      if (playlist?.tracks && playlist.tracks.length > 0) {
        // If there's no current track, shuffle all tracks
        // If there is a current track, shuffle all tracks except the current one
        const tracksToShuffle = [...playlist.tracks];
        const shuffledTracks = shuffleArray(tracksToShuffle);
        
        const globalQueue = shuffledTracks.map(t => ({
          id: t.spotify_track_id,
          title: t.title,
          artist: t.artist,
          album: t.album || '',
          albumArt: t.album_art || '',
          duration: t.duration || 0,
          url: '', // Required by Track interface
          createdAt: t.added_at,
          updatedAt: t.added_at
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

  // Create shuffled queue starting from a specific track
  const createShuffledQueue = (startingTrack: PlaylistTrack, allTracks: PlaylistTrack[]) => {
    // Remove the starting track from the list
    const remainingTracks = allTracks.filter(track => track.id !== startingTrack.id);
    // Shuffle the remaining tracks
    const shuffledRemaining = shuffleArray(remainingTracks);
    // Return queue with starting track first, then shuffled remaining
    return [startingTrack, ...shuffledRemaining];
  };

  const filteredTracks = useMemo(() => {
    if (!playlist?.tracks) return [];
    
    let tracks = [...playlist.tracks];
    
    // Apply sorting (shuffle doesn't affect display order)
    switch (sortBy) {
      case 'title':
        tracks.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'artist':
        tracks.sort((a, b) => a.artist.localeCompare(b.artist));
        break;
      case 'album':
        tracks.sort((a, b) => (a.album || '').localeCompare(b.album || ''));
        break;
      case 'recently-added':
        tracks.sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime());
        break;
      case 'duration':
        tracks.sort((a, b) => (b.duration || 0) - (a.duration || 0));
        break;
      case 'custom':
      default:
        tracks = sortTracksByPosition(tracks);
        break;
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      tracks = tracks.filter(track =>
        track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        track.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (track.album && track.album.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return tracks;
  }, [playlist?.tracks, sortBy, searchQuery]);

  const handlePlayTrack = (track: PlaylistTrack) => {
    // Only create queue if shuffle is enabled, otherwise just play the song
    if (shuffle && playlist?.tracks) {
      // Shuffle is ON - if no queue exists yet, create a shuffled one
      // If queue already exists (from shuffle toggle), keep it as-is
      if (queue.length === 0) {
        // No queue exists, create shuffled queue
        const shuffledTracks = shuffleArray([...playlist.tracks]);
        const globalQueue = shuffledTracks.map(t => ({
          id: t.spotify_track_id,
          title: t.title,
          artist: t.artist,
          album: t.album || '',
          albumArt: t.album_art || '',
          duration: t.duration || 0,
          url: '', // Required by Track interface
          createdAt: t.added_at,
          updatedAt: t.added_at
        }));
        setQueue(globalQueue);
      }
      // If queue already exists, don't overwrite it
    } else {
      // Shuffle is OFF - clear any existing queue, just play single song
      clearQueue();
    }

    // Play the selected track
    playTrack({
      id: track.spotify_track_id,
      title: track.title,
      artist: track.artist,
      album: track.album || '',
      albumArt: track.album_art || '',
      duration: track.duration || 0,
      url: '', // Required by Track interface
      createdAt: track.added_at,
      updatedAt: track.added_at
    });
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    // Clean up previous preview URL if it exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // 🚀 IMMEDIATE UI UPDATE: Show preview instantly
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Update cache immediately with preview URL for instant feedback
    queryClient.setQueryData(['playlist', playlistId], (oldData: any) => ({
      ...oldData,
      cover_image: url // Use preview URL temporarily
    }));
    
    // Also update playlists list cache for consistency
    queryClient.setQueryData(['playlists'], (oldData: any) => {
      if (oldData) {
        return oldData.map((p: any) => 
          p.id === playlistId 
            ? { ...p, cover_image: url }
            : p
        );
      }
      return oldData;
    });

    // 📤 BACKGROUND PROCESSING: Upload and optimize in background
    setTimeout(async () => {
      try {
        const uploadResponse = await playlistsApi.uploadCoverImage(playlistId, file);
        
        // 🔄 REPLACE WITH REAL URL: Update cache with the actual optimized URL
        queryClient.setQueryData(['playlist', playlistId], (oldData: any) => ({
          ...oldData,
          cover_image: uploadResponse.cover_image
        }));
        
        queryClient.setQueryData(['playlists'], (oldData: any) => {
          if (oldData) {
            return oldData.map((p: any) => 
              p.id === playlistId 
                ? { ...p, cover_image: uploadResponse.cover_image }
                : p
            );
          }
          return oldData;
        });
        
        // Clean up the preview URL to free memory
        URL.revokeObjectURL(url);
        setPreviewUrl('');
        
        toast.success('Cover image uploaded and optimized!');
      } catch (error) {
        toast.error('Failed to upload cover image');
        
        // On error, revert to original image
        queryClient.setQueryData(['playlist', playlistId], (oldData: any) => ({
          ...oldData,
          cover_image: playlist?.cover_image || null
        }));
        
        queryClient.setQueryData(['playlists'], (oldData: any) => {
          if (oldData) {
            return oldData.map((p: any) => 
              p.id === playlistId 
                ? { ...p, cover_image: playlist?.cover_image || null }
                : p
            );
          }
          return oldData;
        });
        
        URL.revokeObjectURL(url);
        setPreviewUrl('');
      }
    }, 100); // Small delay to ensure UI updates first

    // Reset file input
    if (coverInputRef.current) {
      coverInputRef.current.value = '';
    }
  };

  // Dialog handlers
  const handleOpenEditDialog = () => {
    setEditFormData({
      name: playlist?.name || '',
      description: playlist?.description || ''
    });
    setShowEditDialog(true);
  };

  const handleCloseEditDialog = () => {
    setShowEditDialog(false);
    setEditFormData({ name: '', description: '' });
  };

  const handleSavePlaylist = () => {
    if (!editFormData.name.trim()) {
      toast.error('Playlist name cannot be empty');
      return;
    }
    
    const updateData = {
      name: editFormData.name.trim(),
      description: editFormData.description.trim() || undefined
    };
    
    updatePlaylistMutation.mutate({
      id: playlistId,
      data: updateData
    });
  };

  // Search functionality
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  // Focus input whenever it becomes visible
  React.useEffect(() => {
    if (showSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 0);
    }
  }, [showSearch]);

  const handleHideSearchIfEmpty = () => {
    if (!searchQuery.trim()) {
      setShowSearch(false);
    }
  };

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

  // Scroll detection for sticky header opacity
  React.useEffect(() => {
    const computeOpacity = () => {
      let scrollTop = 0;

      const root = scrollAreaRef.current;
      const viewport = root?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
      if (viewport) {
        scrollTop = viewport.scrollTop;
      } else {
        // Fallback to window scroll if viewport not found
        scrollTop = typeof window !== 'undefined' ? window.scrollY || document.documentElement.scrollTop : 0;
      }

      const startFade = 80; // Start fading in earlier
      const fullOpacity = 160; // Fully visible sooner

      let opacity = 0;
      if (scrollTop > startFade) {
        opacity = Math.min((scrollTop - startFade) / (fullOpacity - startFade), 1);
      }

      setHeaderOpacity(opacity);
    };

    // Attach listeners
    const root = scrollAreaRef.current;
    let viewport: HTMLElement | null = null;

    const tryAttachToViewport = () => {
      viewport = (root?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement) || null;
      if (viewport) {
        viewport.addEventListener('scroll', computeOpacity, { passive: true } as AddEventListenerOptions);
        computeOpacity();
      }
    };

    // Try immediately and after short delays (in case Radix mounts later)
    tryAttachToViewport();
    const t1 = setTimeout(tryAttachToViewport, 100);
    const t2 = setTimeout(tryAttachToViewport, 400);

    // Also listen to window as a safety net
    window.addEventListener('scroll', computeOpacity, { passive: true });

    // Initial compute so header can show on refresh if already scrolled
    computeOpacity();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('scroll', computeOpacity);
      if (viewport) viewport.removeEventListener('scroll', computeOpacity);
    };
  }, []);

  // Cleanup preview URL on unmount (separate from scroll logic)
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Detect Now Playing View (NPV) expanded fullscreen and hide overlay when it is open
  React.useEffect(() => {
    if (typeof window === 'undefined') return;

    const checkExpanded = () => {
      // NPV expanded uses a fullscreen container: fixed inset-0 z-50
      const expandedEl = document.querySelector('.fixed.inset-0.z-50');
      setNpvExpanded(!!expandedEl);
    };

    // Initial check
    checkExpanded();

    const observer = new MutationObserver(() => checkExpanded());
    observer.observe(document.body, { childList: true, subtree: true });

    // Also listen to window resize as a fallback
    window.addEventListener('resize', checkExpanded);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', checkExpanded);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex-1 p-6">
        <div className="space-y-6">
          {/* Header skeleton */}
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-4"></div>
            <div className="h-6 bg-muted/70 rounded w-32 mb-6"></div>
          </div>
          
          {/* Track list skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardContent className="p-3">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded-lg flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted/70 rounded w-2/3"></div>
                    </div>
                    <div className="w-16 text-right">
                      <div className="h-3 bg-muted/70 rounded w-12 ml-auto"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!playlist || playlistId === '') {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white">Playlist not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Floating Header Overlay - Over main content area (not window) */}
      <div
        className="absolute left-0 right-0 top-0 bg-card/95 backdrop-blur-sm border-b border-blue-500/20 z-[70] px-6 py-3 transition-opacity duration-200 shadow-sm"
        style={{ 
          opacity: npvExpanded ? 0 : headerOpacity,
          pointerEvents: npvExpanded ? 'none' : (headerOpacity > 0 ? 'auto' : 'none')
        }}
      >
        <div className="flex items-center space-x-4">
          {/* Play Button */}
          <button
            onClick={() => {
              if (filteredTracks.length > 0) {
                handlePlayTrack(filteredTracks[0]);
              }
            }}
            className="w-12 h-12 rounded-full bg-[#00BFFF] hover:bg-[#0099CC] transition-colors flex items-center justify-center group"
          >
            <Play className="w-6 h-6 text-[#222222] ml-0.5 group-hover:scale-110 transition-transform" />
          </button>
          
          {/* Playlist Name */}
          <h2 className="text-white text-xl font-bold truncate">
            {playlist?.name}
          </h2>
        </div>
      </div>

      {/* Main Content - Header floats over this */}
      <ScrollArea className="h-full" ref={scrollAreaRef}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-end space-x-6">
          <div className="relative group">
            {previewUrl || playlist.cover_image ? (
              <img
                src={previewUrl || playlist.cover_image}
                alt={playlist.name}
                className="w-48 h-48 rounded-lg object-cover"
              />
            ) : (
              <div className="w-48 h-48 rounded-lg flex items-center justify-center bg-[#1e293b]/30">
                <Music className="w-16 h-16 text-[#00BFFF]" />
              </div>
            )}

            {/* Hover overlay - always available since upload is in background */}
            <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <button
                type="button"
                className="h-10 w-10 rounded-md bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                onClick={() => coverInputRef.current?.click()}
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* Hidden file input */}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>
          
          <div className="flex-1">
            <h1 
              className="text-6xl font-black mb-4 text-white leading-tight cursor-pointer hover:text-blue-300 transition-colors break-words"
              onClick={handleOpenEditDialog}
            >
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-white/90 mb-4 text-lg">{playlist.description}</p>
            )}
            <div className="flex items-center space-x-4 text-sm">
              {playlist.user?.name && (
                <>
                  <span>{playlist.user.name}</span>
                  <span>•</span>
                </>
              )}
              <span>{playlist.track_count} songs</span>
              {playlist.is_collaborative && (
                <>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4" />
                    <span>Collaborative</span>
                  </div>
                </>
              )}
              <span>•</span>
              <div className="flex items-center space-x-1">
                {playlist.is_public ? (
                  <>
                    <Globe className="w-4 h-4" />
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Private</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* Main Play Button */}
            <button className="w-12 h-12 bg-[#00BFFF] hover:bg-[#00BFFF]/80 rounded-full flex items-center justify-center transition-colors">
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
                {/* Copy Link - only show for owners of public playlists */}
                {isOwnerAccess && playlist?.is_public && (
                  <DropdownMenuItem 
                    onClick={copyPublicLink}
                    className="flex items-center text-white hover:bg-accent focus:bg-accent cursor-pointer text-xs h-7 rounded-md"
                  >
                    <Globe className="h-3 w-3 mr-2" />
                    <span>Copy public link</span>
                  </DropdownMenuItem>
                )}
                
                {/* Edit Playlist - only for owners */}
                {isOwnerAccess && (
                  <DropdownMenuItem 
                    onClick={() => {
                      setEditFormData({
                        name: playlist?.name || '',
                        description: playlist?.description || ''
                      });
                      setShowEditDialog(true);
                    }}
                    className="flex items-center text-white hover:bg-accent focus:bg-accent cursor-pointer text-xs h-7 rounded-md"
                  >
                    <Edit2 className="h-3 w-3 mr-2" />
                    <span>Edit details</span>
                  </DropdownMenuItem>
                )}

                {/* Make Private/Public - only for owners */}
                {isOwnerAccess && (
                  <DropdownMenuItem 
                    onClick={async () => {
                      if (!playlist) return;
                      
                      try {
                        const newPrivacy = !playlist.is_public;
                        
                        toast.info(newPrivacy ? 'Making playlist public...' : 'Making playlist private...');
                        
                        const result = await updatePlaylistMutation.mutateAsync({
                          id: playlist.id,
                          data: { is_public: newPrivacy }
                        });
                        
                        // Immediately update the local playlist state to reflect the change
                        queryClient.setQueryData(['playlist', playlistId], (oldData: any) => {
                          if (!oldData) return oldData;
                          return {
                            ...oldData,
                            is_public: newPrivacy
                          };
                        });
                        
                        toast.success(newPrivacy ? 'Playlist is now public!' : 'Playlist is now private!');
                      } catch (error) {
                        toast.error('Failed to update playlist privacy');
                      }
                    }}
                    className="flex items-center text-white hover:bg-accent focus:bg-accent cursor-pointer text-xs h-7 rounded-md"
                  >
                    {playlist?.is_public ? (
                      <>
                        <Lock className="h-3 w-3 mr-2" />
                        <span>Make private</span>
                      </>
                    ) : (
                      <>
                        <Globe className="h-3 w-3 mr-2" />
                        <span>Make public</span>
                      </>
                    )}
                  </DropdownMenuItem>
                )}

                {/* Invite Collaborators - only for owners and only if public */}
                {isOwnerAccess && playlist?.is_public && (
                  <DropdownMenuItem 
                    onClick={() => {
                      // TODO: Implement invite collaborators
                      toast.info('Opening collaborator invite...');
                    }}
                    className="flex items-center text-white hover:bg-accent focus:bg-accent cursor-pointer text-xs h-7 rounded-md"
                  >
                    <Users className="h-3 w-3 mr-2" />
                    <span>Invite collaborators</span>
                  </DropdownMenuItem>
                )}

                {/* Invite Collaborators - blurred out for private playlists */}
                {isOwnerAccess && !playlist?.is_public && (
                  <DropdownMenuItem 
                    disabled
                    className="flex items-center text-white/30 cursor-not-allowed opacity-50 text-xs h-7 rounded-md"
                  >
                    <Users className="h-3 w-3 mr-2" />
                    <span>Invite collaborators</span>
                  </DropdownMenuItem>
                )}

                {/* Add to Other Playlists */}
                <DropdownMenuItem 
                  onClick={() => {
                    if (!playlist?.tracks || playlist.tracks.length === 0) {
                      toast.error('No songs to add to other playlists');
                      return;
                    }
                    setShowAddToPlaylistDialog(true);
                  }}
                  className="flex items-center text-white hover:bg-accent focus:bg-accent cursor-pointer text-xs h-7 rounded-md"
                >
                  <Plus className="h-3 w-3 mr-2" />
                  <span>Add to other playlists</span>
                </DropdownMenuItem>

                {/* Add to Queue */}
                <DropdownMenuItem 
                  onClick={() => {
                    if (playlist?.tracks && playlist.tracks.length > 0) {
                      const tracks = sortTracksByPosition(playlist.tracks).map(track => ({
                        id: track.spotify_track_id,
                        title: track.title,
                        artist: track.artist,
                        album: track.album || '',
                        albumArt: track.album_art || '',
                        duration: track.duration || 0,
                        url: '',
                        genre: track.genre,
                        year: track.release_year,
                        createdAt: track.added_at,
                        updatedAt: track.added_at
                      }));
                      setQueue(tracks);
                      toast.success(`Added ${tracks.length} songs to queue`);
                    } else {
                      toast.error('No songs to add to queue');
                    }
                  }}
                  className="flex items-center text-white hover:bg-accent focus:bg-accent cursor-pointer text-xs h-7 rounded-md"
                >
                  <List className="h-3 w-3 mr-2" />
                  <span>Add to queue</span>
                </DropdownMenuItem>

                {/* Delete Playlist - only for owners */}
                {isOwnerAccess && (
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="flex items-center text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 cursor-pointer text-xs h-7 rounded-md"
                  >
                    <Trash2 className="h-3 w-3 mr-2" />
                    <span>Delete playlist</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Search and Sort Controls */}
          <div className="flex justify-end items-center h-12 space-x-2">
            {/* Search - animated like saved songs */}
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
                  className="relative h-12 flex items-center focus-within:outline-none focus-within:ring-0 focus-within:ring-offset-0 focus-within:shadow-none"
                  style={{ overflow: 'hidden' }}
                >
                  <div className="relative w-[256px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      ref={searchInputRef}
                      placeholder="Search in playlist"
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
            
            {/* Sort/View Menu */}
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
                  onClick={() => setSortBy('custom')}
                  className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                >
                  <span className={sortBy === 'custom' ? 'text-[#00BFFF]' : ''}>Custom order</span>
                  {sortBy === 'custom' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                </DropdownMenuItem>
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
                  onClick={() => setSortBy('recently-added')}
                  className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                >
                  <span className={sortBy === 'recently-added' ? 'text-[#00BFFF]' : ''}>Recently added</span>
                  {sortBy === 'recently-added' && <Check className="h-4 w-4 text-[#00BFFF]" />}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy('duration')}
                  className="flex items-center justify-between text-foreground hover:bg-accent focus:bg-accent focus:outline-none focus:ring-0 focus-visible:outline-none"
                >
                  <span className={sortBy === 'duration' ? 'text-[#00BFFF]' : ''}>Duration</span>
                  {sortBy === 'duration' && <Check className="h-4 w-4 text-[#00BFFF]" />}
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
      <div className="px-6 pb-6">
        {filteredTracks.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Music className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {searchQuery ? 'No tracks match your search' : 'No tracks in this playlist'}
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
                    key={track.id}
                    onClick={() => handlePlayTrack(track)}
                    className="group flex items-center p-2 rounded hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <div className="w-6 text-center text-gray-400 text-sm group-hover:hidden">
                      {index + 1}
                    </div>
                    <button className="w-6 hidden group-hover:flex items-center justify-center">
                      <Play className="w-3 h-3 text-white" />
                    </button>
                    
                    {track.album_art && (
                      <img
                        src={track.album_art}
                        alt={track.album}
                        className="w-8 h-8 rounded ml-3"
                      />
                    )}
                    
                    <div className="flex-1 ml-3 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-white text-sm font-medium truncate">{highlightMatch(track.title, searchQuery)}</p>
                        <span className="text-gray-500">•</span>
                        <p className="text-gray-400 text-sm truncate">{highlightMatch(track.artist, searchQuery)}</p>
                      </div>
                    </div>
                    
                    {track.album && (
                      <div className="w-[45%] px-2">
                        <p className="text-gray-400 text-xs truncate">{highlightMatch(track.album, searchQuery)}</p>
                      </div>
                    )}
                    
                    {track.duration && (
                      <div className="w-12 text-right text-gray-400 text-xs">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
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
                    key={track.id}
                    onClick={() => handlePlayTrack(track)}
                    className="group flex items-center p-2 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <div className="w-8 text-center text-gray-400 group-hover:hidden">
                      {index + 1}
                    </div>
                    <button className="w-8 hidden group-hover:flex items-center justify-center">
                      <Play className="w-4 h-4 text-white" />
                    </button>
                    
                    {track.album_art && (
                      <img
                        src={track.album_art}
                        alt={track.album}
                        className="w-10 h-10 rounded ml-4"
                      />
                    )}
                    
                    <div className="flex-1 ml-4 min-w-0">
                      <p className="text-white font-medium truncate">{highlightMatch(track.title, searchQuery)}</p>
                      <p className="text-gray-400 text-sm truncate">{highlightMatch(track.artist, searchQuery)}</p>
                    </div>
                    
                    {track.album && (
                      <div className="w-[45%] px-3">
                        <p className="text-gray-400 text-sm truncate">{highlightMatch(track.album, searchQuery)}</p>
                      </div>
                    )}
                    
                    {track.duration && (
                      <div className="w-16 text-right text-gray-400 text-sm">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      </ScrollArea>

      {/* Edit Playlist Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
      <DialogContent className="sm:max-w-lg bg-background backdrop-blur-md border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground text-lg font-semibold flex items-center space-x-2">
            <span>Playlist details</span>
          </DialogTitle>
        </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Playlist Cover Section */}
            <div className="flex items-start space-x-6">
              {/* Playlist Cover */}
              <div className="relative group flex-shrink-0">
                <div className="w-40 h-48 rounded-lg overflow-hidden">
                  {previewUrl || playlist?.cover_image ? (
                    <img
                      src={previewUrl || playlist.cover_image}
                      alt={playlist?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/30 flex items-center justify-center">
                      <Music className="w-8 h-8 text-[#00BFFF]" />
                    </div>
                  )}
                </div>

                {/* Hover overlay for cover upload */}
                <div className="absolute inset-0 bg-black/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button
                    type="button"
                    className="h-8 w-8 rounded-md bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/50 backdrop-blur-sm flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </button>
                </div>
              </div>

              {/* Name and Description Inputs */}
              <div className="flex-1 space-y-4 min-w-0">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Playlist Name
                  </label>
                  <Input
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    placeholder="Enter playlist name"
                    className="bg-background/50 border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-[#00BFFF] text-sm"
                    style={{ outline: 'none', boxShadow: 'none' }}
                    maxLength={255}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <Textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    placeholder="Describe your playlist..."
                    rows={3}
                    className="bg-background/50 border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-[#00BFFF] resize-none text-sm"
                    style={{ outline: 'none', boxShadow: 'none' }}
                  />
                </div>
              </div>
            </div>

            {/* Terms Text */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Uploading an image will update your playlist cover across 2k Music</p>
              <p>Make sure you own the rights to use this image</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end">
              <Button
                onClick={handleSavePlaylist}
                disabled={updatePlaylistMutation.isPending || !editFormData.name.trim()}
                className="h-10 px-5 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white hover:from-primary/80 hover:to-blue-600/80 transition-all disabled:from-primary/50 disabled:to-blue-600/50 disabled:text-white/70 disabled:cursor-not-allowed"
                style={{ outline: 'none', boxShadow: 'none' }}
              >
                {updatePlaylistMutation.isPending ? (
                  'Saving...'
                ) : (
                  'Save'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Same as playlists page */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md bg-background backdrop-blur-md border-border">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-semibold flex items-center space-x-2">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span>Delete Playlist</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Playlist Info */}
            <div className="flex items-center space-x-3">
              {playlist?.cover_image ? (
                <img
                  src={playlist.cover_image}
                  alt={playlist.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="text-white font-medium">{playlist?.name}</h3>
                <p className="text-sm text-gray-400">
                  {playlist?.track_count} songs
                </p>
              </div>
            </div>

            {/* Warning Message */}
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-200 text-sm">
                This Action Cannot Be Undone. The Playlist And All Its Saved Songs Will Be Permanently Deleted.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end">
              <Button
                onClick={handleDeletePlaylist}
                disabled={deletePlaylistMutation.isPending}
                className="bg-red-600 text-white hover:bg-red-700 rounded-full h-10 px-5"
              >
                {deletePlaylistMutation.isPending ? 'Deleting...' : 'Delete Playlist'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Other Playlists - Using existing AddToPlaylistButton component */}
      {showAddToPlaylistDialog && playlist?.tracks && playlist.tracks.length > 0 && (
        <BulkAddToPlaylistModal 
          isOpen={showAddToPlaylistDialog}
          onClose={() => setShowAddToPlaylistDialog(false)}
          tracks={sortTracksByPosition(playlist.tracks).map(t => ({
            id: t.spotify_track_id,
            title: t.title,
            artist: t.artist,
            album: t.album || '',
            albumArt: t.album_art,
            duration: t.duration || 0,
            url: '',
            genre: t.genre,
            year: t.release_year,
            createdAt: '',
            updatedAt: ''
          }))}
          currentPlaylistId={playlist.id}
          playlistName={playlist.name}
        />
      )}

    </div>
  );
}
