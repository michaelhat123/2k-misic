'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Plus, Music, Clock, Users, Globe, Lock, MoreVertical, Trash2, Play, Loader2, MoreHorizontal } from 'lucide-react';
import { playlistsApi, Playlist, formatDuration } from '@/lib/api/playlists';
import CreatePlaylistModal from '@/components/playlist/create-playlist-modal';
import { useAuth } from '@/components/auth/auth-provider';
import { toast } from 'sonner';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchOverlay } from '@/components/search/search-overlay';
import { useSearch } from '@/components/layout/top-navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';


export default function PlaylistsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<Playlist | null>(null);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const { setSearchQuery: setGlobalSearch, searchQuery: globalSearch } = useSearch();

  const { data: playlists = [], isLoading, error, refetch } = useQuery({
    queryKey: ['playlists'],
    queryFn: playlistsApi.getPlaylists,
    enabled: !!user, // Only run when user is authenticated
  });

  // Debug playlists data
  useEffect(() => {
    // Silent monitoring
  }, [playlists]);

  // Filter playlists based on search query - use useMemo to prevent infinite re-renders
  const filteredPlaylistsMemo = useMemo(() => {
    if (!searchQuery.trim()) {
      return playlists;
    } else {
      const query = searchQuery.toLowerCase();
      return playlists.filter(playlist =>
        playlist.name.toLowerCase().includes(query) ||
        playlist.description?.toLowerCase().includes(query)
      );
    }
  }, [playlists, searchQuery]);

  // Use the memoized filtered playlists directly

  const handleDeletePlaylist = (playlist: Playlist) => {
    setPlaylistToDelete(playlist);
    setShowDeleteDialog(true);
  };

  const confirmDeletePlaylist = async () => {
    if (!playlistToDelete) return;
    
    try {
      await playlistsApi.deletePlaylist(playlistToDelete.id);
      toast.success('Playlist deleted successfully');
      refetch();
      setShowDeleteDialog(false);
      setPlaylistToDelete(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete playlist');
    }
  };

  const cancelDeletePlaylist = () => {
    setShowDeleteDialog(false);
    setPlaylistToDelete(null);
  };

  // Search functionality
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  // Focus input whenever it becomes visible
  useEffect(() => {
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <Music className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Failed to load playlists</h2>
          <p className="text-gray-400 mb-4">Something went wrong while fetching your playlists.</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* If global search is active, show the same overlay used on the homepage and hide page content */}
      {globalSearch?.trim() ? (
        <SearchOverlay />
      ) : isLoading ? (
        <div className="h-full flex flex-col">
          {/* Header Skeleton */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Music className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Your Playlists</h1>
                <div className="w-20 h-4 bg-muted rounded animate-pulse mt-1"></div>
              </div>
            </div>
            <div className="flex justify-between items-center h-12">
              <div className="w-32 h-10 bg-muted rounded animate-pulse"></div>
              <div className="w-10 h-10 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
          {/* Playlists Skeleton */}
          <div className="flex-1 px-6">
            <div className="space-y-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2 rounded-lg">
                  <div className="w-8 h-8 bg-muted rounded animate-pulse"></div>
                  <div className="w-12 h-12 bg-muted rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded animate-pulse mb-1"></div>
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
                  </div>
                  <div className="w-16 h-3 bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Music className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Your Playlists</h1>
                <p className="text-muted-foreground">
                  {playlists.length} {playlists.length === 1 ? 'playlist' : 'playlists'}
                </p>
              </div>
            </div>

            {/* Create Button and Search */}
            <div className="flex justify-between items-center h-12">
              {/* Create Playlist Button */}
              <Button
                onClick={() => setShowCreateModal(true)}
                variant="ghost"
                size="icon"
                title="Create Playlist"
                aria-label="Create Playlist"
                className="group h-11 w-11 sm:h-12 sm:w-12 hover:scale-110 active:scale-95 transition-transform duration-150 focus:ring-0 focus-visible:ring-0 focus:outline-none focus-visible:outline-none focus:shadow-none focus-visible:shadow-none ring-0 ring-offset-0 ring-transparent focus:ring-transparent focus-visible:ring-transparent hover:bg-transparent active:bg-transparent"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <Plus className="h-6 w-6 sm:h-7 sm:w-7 text-muted-foreground group-hover:text-[#00BFFF] transition-colors" />
              </Button>
              
              {/* Search */}
              <div className="flex-1 flex justify-end">
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
                          placeholder="Search playlists"
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
            </div>
          </div>

          {/* Playlists List */}
          <ScrollArea className="flex-1 px-6">
            {filteredPlaylistsMemo.length === 0 ? (
              <div className="text-center py-12">
                <Music className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchQuery ? 'No playlists found' : 'No playlists yet'}
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? 'Try adjusting your search terms' 
                    : 'Create your first playlist to get started'
                  }
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    className="mt-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full h-10 px-5 transition-all duration-150 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Create Your First Playlist
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredPlaylistsMemo.map((playlist, index) => (
                  <div
                    key={playlist.id}
                    className="group flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors border border-border/50"
                  >
                    {/* Index Number */}
                    <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                      <span className="text-sm text-muted-foreground">
                        {index + 1}
                      </span>
                    </div>

                    {/* Playlist Cover */}
                    <Link href={`/playlists/${playlist.id}`} className="flex-shrink-0">
                      <div className="w-12 h-12">
                        {playlist.cover_image ? (
                          <img
                            src={playlist.cover_image}
                            alt={playlist.name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded flex items-center justify-center">
                            <Music className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Playlist Info */}
                    <Link href={`/playlists/${playlist.id}`} className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium truncate">{highlightMatch(playlist.name, searchQuery)}</h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {playlist.track_count} songs
                        {playlist.description && ` • ${playlist.description}`}
                      </p>
                    </Link>


                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Delete Confirmation Dialog */}
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
              {playlistToDelete?.cover_image ? (
                <img
                  src={playlistToDelete.cover_image}
                  alt={playlistToDelete.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div>
                <h3 className="text-white font-medium">{playlistToDelete?.name}</h3>
                <p className="text-sm text-gray-400">
                  {playlistToDelete?.track_count} songs
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
                onClick={confirmDeletePlaylist}
                className="bg-red-600 text-white hover:bg-red-700 rounded-full h-10 px-5"
              >
                Delete Playlist
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
