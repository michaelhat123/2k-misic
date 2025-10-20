'use client';

import { useState, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Upload, Music, Users, Globe, Lock } from 'lucide-react';
import { playlistsApi, CreatePlaylistRequest } from '@/lib/api/playlists';
import { toast } from 'sonner';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePlaylistModal({ isOpen, onClose }: CreatePlaylistModalProps) {
  const [formData, setFormData] = useState<CreatePlaylistRequest>({
    name: '',
    description: '',
    is_public: false,
    is_collaborative: false,
    sort_order: 'created'
  });
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const coverInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const createPlaylistMutation = useMutation({
    mutationFn: playlistsApi.createPlaylist,
    onSuccess: async (playlist) => {
      // ⚡ IMMEDIATE RESPONSE: Stop loading and show success immediately
      toast.success(`Playlist "${playlist.name}" created successfully!`);
      
      // Close modal immediately
      handleClose();
      
      // 🔄 BACKGROUND PROCESSING: Upload cover image in background if provided
      if (coverImage) {
        // 🎯 IMMEDIATE PREVIEW: Create preview URL and add playlist with preview to cache
        const previewUrl = URL.createObjectURL(coverImage);
        
        // Add the new playlist with preview image to cache immediately
        queryClient.setQueryData(['playlists'], (oldData: any) => {
          const newPlaylist = { ...playlist, cover_image: previewUrl };
          if (oldData && Array.isArray(oldData)) {
            // Check if playlist already exists, if so update it, otherwise add it
            const existingIndex = oldData.findIndex((p: any) => p.id === playlist.id);
            if (existingIndex >= 0) {
              const updated = [...oldData];
              updated[existingIndex] = newPlaylist;
              return updated;
            } else {
              return [newPlaylist, ...oldData];
            }
          } else {
            return [newPlaylist];
          }
        });
        
        // Upload in background without blocking UI
        setTimeout(async () => {
          try {
            const uploadResponse = await playlistsApi.uploadCoverImage(playlist.id, coverImage!);
            
            // 🔄 REPLACE WITH REAL URL: Update cache with the actual Supabase URL
            queryClient.setQueryData(['playlists'], (oldData: any) => {
              if (oldData) {
                return oldData.map((p: any) => 
                  p.id === playlist.id 
                    ? { ...p, cover_image: uploadResponse.cover_image }
                    : p
                );
              }
              return oldData;
            });
            
            // Clean up the preview URL to free memory
            URL.revokeObjectURL(previewUrl);
            
            toast.success('Cover image uploaded!');
          } catch (error) {
            toast.error('Failed to upload cover image');
            
            // On error, remove the preview image
            queryClient.setQueryData(['playlists'], (oldData: any) => {
              if (oldData) {
                return oldData.map((p: any) => 
                  p.id === playlist.id 
                    ? { ...p, cover_image: null }
                    : p
                );
              }
              return oldData;
            });
            URL.revokeObjectURL(previewUrl);
          }
        }, 100); // Small delay to ensure UI updates first
      } else {
        // No cover image, just invalidate cache to show the new playlist
        queryClient.invalidateQueries({ queryKey: ['playlists'] });
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create playlist');
    }
  });

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      is_public: false,
      is_collaborative: false,
      sort_order: 'created'
    });
    setCoverImage(null);
    setPreviewUrl('');
    onClose();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      
      setCoverImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Playlist name is required');
      return;
    }
    
    createPlaylistMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={handleClose}
    >
      <div 
        className="bg-background backdrop-blur-md border border-border rounded-lg w-full max-w-lg h-[90vh] max-h-[90vh] shadow-2xl flex flex-col min-h-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Music className="w-5 h-5 text-[#00BFFF]" />
              <h2 className="text-foreground text-lg font-semibold">Create Playlist</h2>
            </div>
            <button
              onClick={(e) => {
                handleClose();
                e.currentTarget.blur();
              }}
              tabIndex={-1}
              className="p-2 hover:bg-muted rounded-lg transition-colors [&:focus]:outline-none [&:focus-visible]:outline-none [&:active]:outline-none"
              style={{ 
                outline: 'none !important', 
                boxShadow: 'none !important',
                border: 'none !important',
                WebkitTapHighlightColor: 'transparent'
              }}
              onFocus={(e) => e.currentTarget.blur()}
              onMouseDown={(e) => e.preventDefault()}
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>

        <ScrollArea className="flex-1 min-h-0 h-full homepage-scroll [&>div>div[style]]:!pr-0">
          <div className="p-6 space-y-4 min-h-0">
            <form onSubmit={handleSubmit} className="space-y-4">
          {/* Cover Image */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative group">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Playlist cover"
                    className="w-32 h-32 rounded-2xl object-cover shadow-lg ring-2 ring-blue-500/20"
                  />
                </div>
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-600/20 to-purple-600/20 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-blue-500/30 group-hover:ring-blue-400/40 transition-all duration-200">
                  <Music className="w-12 h-12 text-gray-400" />
                </div>
              )}

              {/* Hover overlay: only show a square icon, no background dim */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none">
                <button
                  type="button"
                  aria-label="Upload cover image"
                  onClick={() => coverInputRef.current?.click()}
                  className="pointer-events-auto h-8 w-8 rounded-md bg-white/15 hover:bg-white/25 border border-white/20 flex items-center justify-center transition-transform duration-150 hover:scale-110 active:scale-95 focus:outline-none focus-visible:outline-none"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  <Upload className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>
            <div className="text-center">
              <p className="text-foreground font-medium mb-1">Playlist Cover</p>
              <p className="text-sm text-muted-foreground">Upload An Image</p>
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

          {/* Playlist Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Playlist Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-[#00BFFF] transition-colors"
              style={{ outline: 'none', boxShadow: 'none' }}
              maxLength={255}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 bg-background/50 border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-[#00BFFF] transition-colors resize-none"
              style={{ outline: 'none', boxShadow: 'none' }}
            />
          </div>

          {/* Privacy Settings */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                {formData.is_public ? (
                  <Globe className="w-5 h-5 text-[#00BFFF]" />
                ) : (
                  <Lock className="w-5 h-5 text-gray-500" />
                )}
                <div>
                    <p className="text-foreground font-medium">
                    {formData.is_public ? 'Public' : 'Private'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formData.is_public ? 'Anyone can see' : 'Only you can see'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_public: !formData.is_public })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.is_public ? 'bg-[#00BFFF]' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-gray-800 transition-transform ${
                    formData.is_public ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <Users className={`w-5 h-5 ${formData.is_collaborative ? 'text-[#00BFFF]' : 'text-gray-500'}`} />
                <div>
                  <p className="text-foreground font-medium">Collaborative</p>
                  <p className="text-xs text-muted-foreground">Let others add songs</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, is_collaborative: !formData.is_collaborative })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.is_collaborative ? 'bg-[#00BFFF]' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-gray-800 transition-transform ${
                    formData.is_collaborative ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={createPlaylistMutation.isPending || !formData.name.trim()}
              className="h-10 px-5 rounded-full bg-gradient-to-br from-primary to-blue-600 text-white hover:from-primary/80 hover:to-blue-600/80 transition-all disabled:bg-transparent disabled:border disabled:border-primary/30 disabled:text-transparent disabled:bg-clip-text disabled:bg-gradient-to-br disabled:from-primary disabled:to-blue-600 disabled:cursor-not-allowed"
            >
              {createPlaylistMutation.isPending ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating...</span>
                </div>
              ) : (
                'Create Playlist'
              )}
            </button>
          </div>
          </form>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
