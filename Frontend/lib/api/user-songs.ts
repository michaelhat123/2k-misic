import { Track } from '@/types/track'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

interface SongActionData {
  spotifyId: string
  title: string
  artist: string
  album?: string
  albumArt?: string
  duration?: number
  genre?: string
  releaseYear?: number
}

interface GetSongsQuery {
  page?: number
  limit?: number
  search?: string
}

interface SongsResponse {
  songs: Array<{
    id: string
    spotifyId: string
    title: string
    artist: string
    album?: string
    albumArt?: string
    duration?: number
    genre?: string
    releaseYear?: number
    likedAt?: string
    savedAt?: string
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface SongStatus {
  spotifyId: string
  isLiked: boolean
  isSaved: boolean
}

interface AlbumActionData {
  spotifyId: string
  name: string
  artist: string
  albumArt?: string
  totalTracks?: number
  genre?: string
  releaseYear?: number
  albumType?: string
}

interface GetAlbumsQuery {
  page?: number
  limit?: number
  search?: string
}

interface AlbumsResponse {
  albums: Array<{
    id: string
    spotifyId: string
    name: string
    artist: string
    albumArt?: string
    totalTracks?: number
    genre?: string
    releaseYear?: number
    albumType?: string
    savedAt: string
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

interface UserStats {
  likedSongs: number
  savedSongs: number
  savedAlbums: number
}

class UserSongsAPI {
  private getAuthHeaders() {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }
    const result = await response.json()
    return result.data
  }

  private trackToSongData(track: Track): SongActionData {
    return {
      spotifyId: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      albumArt: track.albumArt,
      duration: track.duration,
      genre: track.genre,
    }
  }

  // LIKED SONGS
  async likeSong(track: Track) {
    const response = await fetch(`${API_BASE_URL}/user-songs/like`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(this.trackToSongData(track))
    })
    return this.handleResponse(response)
  }

  async unlikeSong(spotifyId: string) {
    const response = await fetch(`${API_BASE_URL}/user-songs/like/${spotifyId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    return this.handleResponse(response)
  }

  async getLikedSongs(query: GetSongsQuery = {}): Promise<SongsResponse> {
    const params = new URLSearchParams()
    if (query.page !== undefined) params.append('page', query.page.toString())
    if (query.limit !== undefined) params.append('limit', query.limit.toString())
    if (query.search) params.append('search', query.search)

    const response = await fetch(`${API_BASE_URL}/user-songs/liked?${params}`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<SongsResponse>(response)
  }

  async isLiked(spotifyId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/user-songs/liked/check/${spotifyId}`, {
      headers: this.getAuthHeaders()
    })
    const result = await this.handleResponse<{ isLiked: boolean }>(response)
    return result.isLiked
  }

  // SAVED SONGS
  async saveSong(track: Track) {
    const response = await fetch(`${API_BASE_URL}/user-songs/save`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(this.trackToSongData(track))
    })
    return this.handleResponse(response)
  }

  async unsaveSong(spotifyId: string) {
    const response = await fetch(`${API_BASE_URL}/user-songs/save/${spotifyId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    return this.handleResponse(response)
  }

  async getSavedSongs(query: GetSongsQuery = {}): Promise<SongsResponse> {
    const params = new URLSearchParams()
    if (query.page !== undefined) params.append('page', query.page.toString())
    if (query.limit !== undefined) params.append('limit', query.limit.toString())
    if (query.search) params.append('search', query.search)

    const response = await fetch(`${API_BASE_URL}/user-songs/saved?${params}`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<SongsResponse>(response)
  }

  async isSaved(spotifyId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/user-songs/saved/check/${spotifyId}`, {
      headers: this.getAuthHeaders()
    })
    const result = await this.handleResponse<{ isSaved: boolean }>(response)
    return result.isSaved
  }

  // BULK OPERATIONS
  async getSongStatus(spotifyIds: string[]): Promise<SongStatus[]> {
    const response = await fetch(`${API_BASE_URL}/user-songs/status`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ spotifyIds })
    })
    return this.handleResponse<SongStatus[]>(response)
  }

  // SAVED ALBUMS
  async saveAlbum(albumData: AlbumActionData) {
    const response = await fetch(`${API_BASE_URL}/user-songs/albums/save`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(albumData)
    })
    return this.handleResponse(response)
  }

  async unsaveAlbum(spotifyId: string) {
    const response = await fetch(`${API_BASE_URL}/user-songs/albums/save/${spotifyId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    })
    return this.handleResponse(response)
  }

  async getSavedAlbums(query: GetAlbumsQuery = {}): Promise<AlbumsResponse> {
    const params = new URLSearchParams()
    if (query.page !== undefined) params.append('page', query.page.toString())
    if (query.limit !== undefined) params.append('limit', query.limit.toString())
    if (query.search) params.append('search', query.search)

    const response = await fetch(`${API_BASE_URL}/user-songs/albums/saved?${params}`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<AlbumsResponse>(response)
  }

  async isAlbumSaved(spotifyId: string): Promise<boolean> {
    const response = await fetch(`${API_BASE_URL}/user-songs/albums/saved/check/${spotifyId}`, {
      headers: this.getAuthHeaders()
    })
    const result = await this.handleResponse<{ isSaved: boolean }>(response)
    return result.isSaved
  }

  // USER STATISTICS
  async getUserStats(): Promise<UserStats> {
    const response = await fetch(`${API_BASE_URL}/user-songs/stats`, {
      headers: this.getAuthHeaders()
    })
    return this.handleResponse<UserStats>(response)
  }

  // TOGGLE HELPERS
  async toggleLike(track: Track): Promise<boolean> {
    try {
      const isCurrentlyLiked = await this.isLiked(track.id)
      if (isCurrentlyLiked) {
        await this.unlikeSong(track.id)
        return false
      } else {
        await this.likeSong(track)
        return true
      }
    } catch (error) {
      throw error
    }
  }

  async toggleSave(track: Track): Promise<boolean> {
    try {
      const isCurrentlySaved = await this.isSaved(track.id)
      if (isCurrentlySaved) {
        await this.unsaveSong(track.id)
        return false
      } else {
        await this.saveSong(track)
        return true
      }
    } catch (error) {
      throw error
    }
  }

  async toggleAlbumSave(albumData: AlbumActionData): Promise<boolean> {
    try {
      const isCurrentlySaved = await this.isAlbumSaved(albumData.spotifyId)
      if (isCurrentlySaved) {
        await this.unsaveAlbum(albumData.spotifyId)
        return false
      } else {
        await this.saveAlbum(albumData)
        return true
      }
    } catch (error) {
      throw error
    }
  }
}

export const userSongsApi = new UserSongsAPI()
export type { SongActionData, GetSongsQuery, SongsResponse, SongStatus, AlbumActionData, GetAlbumsQuery, AlbumsResponse, UserStats }
