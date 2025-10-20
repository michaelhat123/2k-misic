import { apiClient } from './client';

export interface Playlist {
  id: number;
  public_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  cover_image?: string;
  track_count: number;
  total_duration: number;
  sort_order: string;
  is_collaborative: boolean;
  collaborators: string[];
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  tracks?: PlaylistTrack[];
}

export interface PlaylistTrack {
  id: number;
  playlist_id: number;
  spotify_track_id: string;
  title: string;
  artist: string;
  album?: string;
  album_art?: string;
  duration?: number;
  genre?: string;
  release_year?: number;
  position: number;
  added_by: string;
  added_at: string;
  local_file_path?: string; // For local songs
  is_local?: boolean; // Flag to identify local songs
}

export interface CreatePlaylistRequest {
  name: string;
  description?: string;
  is_public?: boolean;
  cover_image?: string;
  sort_order?: string;
  is_collaborative?: boolean;
  collaborators?: string[];
}

export interface UpdatePlaylistRequest {
  name?: string;
  description?: string;
  is_public?: boolean;
  sort_order?: string;
  is_collaborative?: boolean;
  collaborators?: string[];
}

export interface AddTrackRequest {
  spotify_track_id: string;
  title: string;
  artist: string;
  album?: string;
  album_art?: string;
  duration?: number;
  genre?: string;
  release_year?: number;
  position?: number;
  local_file_path?: string; // For local songs
  is_local?: boolean; // Flag to identify local songs
}

export interface AddMultipleTracksRequest {
  tracks: AddTrackRequest[];
}
export interface ReorderTracksRequest {
  track_ids: number[];
}

export const playlistsApi = {
  // Get all playlists for the current user
  getPlaylists: async (): Promise<Playlist[]> => {
    const response = await apiClient.get('/playlists');
    return response.data;
  },

  // Get specific playlist by ID (numeric for owner access, string for public access)
  getPlaylist: async (id: string | number): Promise<Playlist> => {
    const response = await apiClient.get(`/playlists/${id}`);
    return response.data;
  },

  // Create new playlist
  createPlaylist: async (data: CreatePlaylistRequest): Promise<Playlist> => {
    const response = await apiClient.post('/playlists', data);
    return response.data;
  },

  // Update playlist
  updatePlaylist: async (id: string | number, data: UpdatePlaylistRequest): Promise<Playlist> => {
    const response = await apiClient.put(`/playlists/${id}`, data);
    return response.data;
  },

  // Delete playlist
  deletePlaylist: async (id: string | number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/playlists/${id}`);
    return response.data;
  },

  // Upload playlist cover image
  uploadCoverImage: async (id: string | number, file: File): Promise<{ message: string; cover_image: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.put(`/playlists/${id}/cover`, formData);
    return response.data;
  },

  // Delete playlist cover image
  deleteCoverImage: async (id: string | number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/playlists/${id}/cover`);
    return response.data;
  },

  // Add single track to playlist
  addTrack: async (playlistId: string | number, track: AddTrackRequest): Promise<PlaylistTrack> => {
    const response = await apiClient.post(`/playlists/${playlistId}/tracks`, track);
    return response.data;
  },

  // Add multiple tracks to playlist
  addMultipleTracks: async (playlistId: string | number, data: AddMultipleTracksRequest): Promise<PlaylistTrack[]> => {
    const response = await apiClient.post(`/playlists/${playlistId}/tracks/bulk`, data);
    return response.data;
  },

  // Reorder tracks in playlist
  reorderTracks: async (playlistId: string | number, data: ReorderTracksRequest): Promise<{ message: string }> => {
    const response = await apiClient.put(`/playlists/${playlistId}/tracks/reorder`, data);
    return response.data;
  },

  // Remove track from playlist
  removeTrack: async (playlistId: string | number, trackId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/playlists/${playlistId}/tracks/${trackId}`);
    return response.data;
  },
};

// Utility functions
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Helper to detect and prepare local songs for playlist
export const prepareTrackForPlaylist = (track: any): AddTrackRequest => {
  const isLocal = track.id?.startsWith('local-') || track.id?.startsWith('watched-');
  
  return {
    spotify_track_id: track.spotifyId || track.id || '',
    title: track.title || '',
    artist: track.artist || '',
    album: track.album,
    album_art: track.albumArt,
    duration: track.duration,
    genre: track.genre,
    release_year: track.releaseYear,
    is_local: isLocal,
    local_file_path: isLocal ? (track.filePath || track.fileUrl) : undefined
  };
};

// Helper to load local song from watched folder
export const loadLocalSongFromWatchedFolder = (trackId: string): any | null => {
  try {
    const watchedTracks = localStorage.getItem('watchedFolderTracks');
    if (!watchedTracks) return null;
    
    const tracks = JSON.parse(watchedTracks);
    const localTrack = tracks.find((t: any) => t.id === trackId);
    
    return localTrack || null;
  } catch (error) {
    return null;
  }
};

export const getPlaylistDuration = (tracks: PlaylistTrack[]): number => {
  return tracks.reduce((total, track) => total + (track.duration || 0), 0);
};

export const sortTracksByPosition = (tracks: PlaylistTrack[]): PlaylistTrack[] => {
  return [...tracks].sort((a, b) => a.position - b.position);
};
