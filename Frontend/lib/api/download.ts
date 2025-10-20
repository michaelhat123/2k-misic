import { apiClient } from './client'

export interface DownloadTrackRequest {
  spotifyUrl: string
  localMusicFolder: string
  quality?: 'm4a' | 'mp3'
  sessionId?: string
}

export interface DownloadTrackResponse {
  success: boolean
  message?: string
  sessionId?: string
  filePath?: string
  filename?: string
  trackInfo?: {
    title: string
    artist: string
    album: string
    thumbnail: string
  }
  fileSize?: number
  error?: string
}

export const downloadApi = {
  /**
   * Download a track to the user's local music folder
   */
  downloadToFolder: async (data: DownloadTrackRequest): Promise<DownloadTrackResponse> => {
    const response = await apiClient.post('/puppeteer/download-to-folder', data)
    return response.data
  },

  /**
   * Get download link only (without saving)
   */
  getDownloadLink: async (spotifyUrl: string, quality: 'm4a' | 'mp3' = 'm4a', sessionId?: string) => {
    const response = await apiClient.post('/puppeteer/download-link', {
      spotifyUrl,
      quality,
      sessionId,
    })
    return response.data
  },

  /**
   * Cancel an active download
   */
  cancelDownload: async (sessionId: string) => {
    const response = await apiClient.post('/puppeteer/cancel-download', {
      sessionId,
    })
    return response.data
  },
}
