import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface LyricsResponse {
  found: boolean;
  message?: string;
  trackInfo?: {
    id: number;
    name: string;
    artist: string;
    album: string;
    rating: number;
  };
  lyrics?: string;
  language?: string;
  trackingUrl?: string;
  restricted?: boolean;
  copyright?: string;
  fullResponse?: any;
}

class LyricsAPI {
  private socket: Socket | null = null;

  /**
   * Connect to lyrics WebSocket
   */
  connectSocket(onProgress: (step: string) => void): Promise<string> {
    return new Promise((resolve) => {
      if (this.socket?.connected) {
        this.socket.disconnect();
      }

      this.socket = io(`${API_URL}/lyrics`, {
        transports: ['websocket'],
        reconnection: true,
      });

      this.socket.on('connect', () => {
        resolve(this.socket?.id || '');
      });

      this.socket.on('lyrics-progress', (data: { step: string }) => {
        onProgress(data.step);
      });
    });
  }

  /**
   * Disconnect WebSocket
   */
  disconnectSocket() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Search for lyrics by title and artist
   */
  async searchLyrics(title: string, artist: string, clientId?: string): Promise<LyricsResponse> {
    try {
      const response = await axios.get(`${API_URL}/lyrics/search`, {
        params: {
          title,
          artist,
          clientId
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch lyrics:', error);
      throw error;
    }
  }

  /**
   * Get lyrics by track ID
   */
  async getLyricsByTrackId(trackId: number): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/lyrics/track/${trackId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch lyrics by ID:', error);
      throw error;
    }
  }

  /**
   * Search tracks
   */
  async searchTracks(query: string, limit: number = 10): Promise<any> {
    try {
      const response = await axios.get(`${API_URL}/lyrics/search/tracks`, {
        params: { q: query, limit }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to search tracks:', error);
      throw error;
    }
  }
}

export const lyricsApi = new LyricsAPI();
