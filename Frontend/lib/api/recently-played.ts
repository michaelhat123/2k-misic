export interface RecentlyPlayedSong {
  id: string
  spotifyId: string
  title: string
  artist: string
  album?: string
  albumArt?: string
  duration?: number
  genre?: string
  releaseYear?: number
  playCount: number
  playedAt: string
  createdAt: string
  updatedAt: string
  youtubeId?: string
}

export interface RecentlyPlayedResponse {
  success: boolean
  message: string
  data: {
    songs: RecentlyPlayedSong[]
    pagination: {
      page: number
      limit: number
      total: number
      totalPages: number
      hasNext: boolean
      hasPrev: boolean
    }
  }
}

export interface RecentlyPlayedStats {
  totalSongs: number
  totalPlays: number
}

export interface AddRecentlyPlayedDto {
  spotifyId: string
  title: string
  artist: string
  album?: string
  albumArt?: string
  duration?: number
  genre?: string
  releaseYear?: number
  youtubeId?: string
}

export interface BulkSyncDto {
  songs?: AddRecentlyPlayedDto[]
}

class RecentlyPlayedApi {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL

  private async getAuthHeaders() {
    const token = localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }

  async addRecentlyPlayed(songData: AddRecentlyPlayedDto): Promise<RecentlyPlayedSong> {
    try {
      const response = await fetch(`${this.baseUrl}/recently-played`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(songData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      throw error
    }
  }

  async getRecentlyPlayed(page = 0, limit = 20, search?: string): Promise<RecentlyPlayedResponse['data']> {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      
      if (search) {
        params.append('search', search)
      }

      const response = await fetch(`${this.baseUrl}/recently-played?${params}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: RecentlyPlayedResponse = await response.json()
      return result.data
    } catch (error) {
      throw error
    }
  }

  async clearRecentlyPlayed(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/recently-played/clear`, {
        method: 'DELETE',
        headers: await this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
    } catch (error) {
      throw error
    }
  }

  async getUserStats(): Promise<RecentlyPlayedStats> {
    try {
      const response = await fetch(`${this.baseUrl}/recently-played/stats`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      throw error
    }
  }

  async bulkSyncRecentlyPlayed(syncData: BulkSyncDto): Promise<{ synced: number; updated: number }> {
    try {
      const response = await fetch(`${this.baseUrl}/recently-played/sync`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(syncData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      return result.data
    } catch (error) {
      throw error
    }
  }
}

export const recentlyPlayedApi = new RecentlyPlayedApi()
