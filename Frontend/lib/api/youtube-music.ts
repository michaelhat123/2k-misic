import { getAuthToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://twok-music-qz52.onrender.com';

export interface TrackStreamData {
  id: string;
  title: string;
  artist: string;
  streamUrl: string;
  duration: number;
  thumbnail: string;
  source: 'youtube-music';
}

export interface PlayTrackRequest {
  spotifyId: string;
  artist: string;
  title: string;
  album?: string;
}

export async function getTrackStream(track: PlayTrackRequest): Promise<TrackStreamData | null> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/youtube-music/get-stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(track),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }

    return null;
  } catch (error) {
    return null;
  }
}

export async function getBatchStreams(tracks: PlayTrackRequest[]): Promise<{ [spotifyId: string]: TrackStreamData | null }> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/youtube-music/batch-streams`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ tracks }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }

    return {};
  } catch (error) {
    return {};
  }
}

export async function searchYouTubeMusic(query: string, limit: number = 10): Promise<any[]> {
  try {
    const token = getAuthToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/youtube-music/search?query=${encodeURIComponent(query)}&limit=${limit}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }

    return [];
  } catch (error) {
    return [];
  }
}
