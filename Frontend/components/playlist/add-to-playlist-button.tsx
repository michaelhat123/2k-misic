'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, Music, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { playlistsApi, Playlist, AddTrackRequest, prepareTrackForPlaylist } from '@/lib/api/playlists';
import { Track } from '@/types/track';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { createPortal } from 'react-dom';

interface AddToPlaylistButtonProps {
  track: Track;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showLabel?: boolean;
  className?: string;
}

export interface PlaylistSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track;
}

export function PlaylistSelectModal({ isOpen, onClose, track }: PlaylistSelectModalProps) {
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<number>>(new Set());
  const [mounted, setMounted] = useState(false);
  const queryClient = useQueryClient();

  // Ensure component is mounted before rendering portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: playlistsApi.getPlaylists,
    enabled: isOpen,
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, trackData }: { playlistId: number; trackData: AddTrackRequest }) => {
      return playlistsApi.addTrack(playlistId, trackData);
    },
    onSuccess: (_, { playlistId }) => {
      const playlist = playlists.find(p => p.id === playlistId);
      toast.success(`Added to "${playlist?.name}"`);
      
      // Invalidate cache to refetch data
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      
      // Force refetch the specific playlist
      queryClient.refetchQueries({ queryKey: ['playlist', playlistId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add to playlist');
    }
  });

  const handleAddToPlaylists = async () => {
    if (selectedPlaylists.size === 0) {
      toast.error('Please select at least one playlist');
      return;
    }

    // Use helper to automatically detect and prepare local songs
    const trackData = prepareTrackForPlaylist(track);

    try {
      // Add to all selected playlists
      await Promise.all(
        Array.from(selectedPlaylists).map(playlistId =>
          addToPlaylistMutation.mutateAsync({ playlistId, trackData })
        )
      );
      
      onClose();
      setSelectedPlaylists(new Set());
    } catch (error) {
      // Error handling is done in mutation
    }
  };

  const togglePlaylist = (playlistId: number) => {
    const newSelected = new Set(selectedPlaylists);
    if (newSelected.has(playlistId)) {
      newSelected.delete(playlistId);
    } else {
      newSelected.add(playlistId);
    }
    setSelectedPlaylists(newSelected);
  };

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
      onClick={onClose}
      style={{ 
        animation: 'fadeIn 0.2s ease-out',
        pointerEvents: 'auto'
      }}
    >
      <div 
        className="bg-background border border-border rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-border relative">
          <h2 className="text-xl font-bold text-foreground mb-6">Add to Playlist</h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors focus:outline-none focus:ring-0"
            style={{ outline: 'none', boxShadow: 'none' }}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex items-center space-x-3">
            {track.albumArt && (
              <img
                src={track.albumArt}
                alt={track.album}
                className="w-10 h-10 rounded"
              />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-foreground font-medium truncate">{track.title}</p>
              <p className="text-muted-foreground text-sm truncate">{track.artist}</p>
            </div>
          </div>
        </div>

        {/* Playlist List */}
        <div className="flex-1 overflow-y-auto max-h-[400px] overscroll-contain" style={{ willChange: 'scroll-position' }}>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <Music className="w-12 h-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No playlists found</p>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
              >
                Create Your First Playlist
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-2">
              {playlists.map((playlist) => {
                const isSelected = selectedPlaylists.has(playlist.id);
                return (
                  <button
                    key={playlist.id}
                    onClick={() => togglePlaylist(playlist.id)}
                    className={cn(
                      "w-full flex items-center space-x-3 p-3 rounded-lg transition-all duration-150 text-left",
                      isSelected
                        ? "bg-primary/20 border border-primary/50"
                        : "hover:bg-muted/50 border border-transparent"
                    )}
                    style={{ willChange: 'background-color, border-color' }}
                  >
                    <div className="flex-shrink-0">
                      {playlist.cover_image ? (
                        <img
                          src={playlist.cover_image}
                          alt={playlist.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                          <Music className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-medium truncate">{playlist.name}</p>
                      <p className="text-muted-foreground text-sm">
                        {playlist.track_count} songs
                      </p>
                    </div>
                    
                    <div className="flex-shrink-0">
                      {isSelected ? (
                        <Check className="w-5 h-5 text-primary" />
                      ) : (
                        <Plus className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border">
          <Button
            onClick={handleAddToPlaylists}
            disabled={selectedPlaylists.size === 0 || addToPlaylistMutation.isPending}
            className="w-full bg-gradient-to-br from-primary to-blue-600 text-white hover:from-primary/80 hover:to-blue-600/80 transition-all disabled:bg-transparent disabled:border disabled:border-primary/30 disabled:text-transparent disabled:bg-clip-text disabled:bg-gradient-to-br disabled:from-primary disabled:to-blue-600"
          >
            {addToPlaylistMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              `Add to ${selectedPlaylists.size} playlist${selectedPlaylists.size !== 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  // Render in portal to prevent parent re-renders
  return typeof window !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

export function AddToPlaylistButton({ track, size = 'md', variant = 'ghost', showLabel = false, className }: AddToPlaylistButtonProps) {
  const [showModal, setShowModal] = useState(false);

  // Size configurations
  const sizeConfig = {
    sm: { icon: 'w-3 h-3', button: 'h-7 px-2 text-xs' },
    md: { icon: 'w-4 h-4', button: 'h-8 px-3 text-sm' },
    lg: { icon: 'w-5 h-5', button: 'h-9 px-4 text-base' }
  };

  const config = sizeConfig[size];

  return (
    <>
      <Button
        variant={variant}
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setShowModal(true);
        }}
        className={cn(
          "h-8 w-8 p-0",
          'transition-colors hover:bg-blue-500/10 hover:text-blue-500',
          className
        )}
        title="Add to playlist"
      >
        <Plus className={cn(config.icon, showLabel && 'mr-2')} />
        {showLabel && 'Add to Playlist'}
      </Button>

      <PlaylistSelectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        track={track}
      />
    </>
  );
}

// Bulk Add to Playlist Modal for multiple tracks
interface BulkAddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  currentPlaylistId?: number;
  playlistName?: string;
}

export function BulkAddToPlaylistModal({ isOpen, onClose, tracks, currentPlaylistId, playlistName }: BulkAddToPlaylistModalProps) {
  const [selectedPlaylists, setSelectedPlaylists] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  const { data: playlists = [], isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: playlistsApi.getPlaylists,
    enabled: isOpen,
  });

  // Filter out the current playlist
  const availablePlaylists = playlists.filter(p => p.id !== currentPlaylistId);

  const addToPlaylistMutation = useMutation({
    mutationFn: async ({ playlistId, tracksData }: { playlistId: number; tracksData: AddTrackRequest[] }) => {
      return playlistsApi.addMultipleTracks(playlistId, { tracks: tracksData });
    },
    onSuccess: (_, { playlistId }) => {
      const playlist = playlists.find(p => p.id === playlistId);
      toast.success(`Added ${tracks.length} songs to "${playlist?.name}"`);
      
      // Invalidate cache to refetch data
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add to playlist');
    }
  });

  const handleAddToPlaylists = async () => {
    if (selectedPlaylists.size === 0) {
      toast.error('Please select at least one playlist');
      return;
    }

    // Use helper to automatically detect and prepare local songs
    const tracksData = tracks.map(track => prepareTrackForPlaylist(track));

    try {
      // Add to all selected playlists
      await Promise.all(
        Array.from(selectedPlaylists).map(playlistId =>
          addToPlaylistMutation.mutateAsync({ playlistId, tracksData })
        )
      );
      
      onClose();
      setSelectedPlaylists(new Set());
    } catch (error) {
      // Error handling is done in mutation
    }
  };

  const togglePlaylist = (playlistId: number) => {
    const newSelected = new Set(selectedPlaylists);
    if (newSelected.has(playlistId)) {
      newSelected.delete(playlistId);
    } else {
      newSelected.add(playlistId);
    }
    setSelectedPlaylists(newSelected);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-background backdrop-blur-md border border-border rounded-2xl w-full max-w-md max-h-[70vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Add to Other Playlists</h3>
            <p className="text-sm text-muted-foreground">
              Add {tracks.length} songs from {playlistName} to other playlists
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : availablePlaylists.length === 0 ? (
            <div className="text-center py-8">
              <Music className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No other playlists available</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availablePlaylists.map((playlist) => (
                <div
                  key={playlist.id}
                  className={cn(
                    "flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors",
                    selectedPlaylists.has(playlist.id)
                      ? "bg-[#00BFFF]/10 border border-[#00BFFF]/30"
                      : "hover:bg-muted border border-transparent"
                  )}
                  onClick={() => togglePlaylist(playlist.id)}
                >
                  <div className="flex-shrink-0">
                    {playlist.cover_image ? (
                      <img
                        src={playlist.cover_image}
                        alt={playlist.name}
                        className="w-10 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                        <Music className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{playlist.name}</p>
                    <p className="text-sm text-muted-foreground">{playlist.track_count} songs</p>
                  </div>
                  <div className="flex-shrink-0">
                    {selectedPlaylists.has(playlist.id) ? (
                      <Check className="w-5 h-5 text-[#00BFFF]" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-muted-foreground rounded" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {availablePlaylists.length > 0 && (
          <div className="flex items-center justify-between p-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {selectedPlaylists.size} playlist{selectedPlaylists.size !== 1 ? 's' : ''} selected
            </p>
            <Button
              onClick={handleAddToPlaylists}
              disabled={selectedPlaylists.size === 0 || addToPlaylistMutation.isPending}
              className="h-10 px-5 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white hover:from-primary/80 hover:to-blue-600/80 transition-all disabled:from-primary/50 disabled:to-blue-600/50 disabled:text-white/70 disabled:cursor-not-allowed"
              style={{ outline: 'none', boxShadow: 'none' }}
            >
              {addToPlaylistMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                `Add to ${selectedPlaylists.size} playlist${selectedPlaylists.size !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AddToPlaylistButton;
