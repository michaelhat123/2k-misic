export interface ArtistImage {
  url: string
  height: number
  width: number
}

export interface Track {
  id: string
  title: string
  artist: string
  album: string
  albumArt?: string
  artistImages?: ArtistImage[] // Array of all artist images from Spotify
  duration: number
  url: string // YouTube or other streaming URL
  spotifyUrl?: string // Spotify track URL for downloads
  spotifyId?: string // Spotify track ID for API operations
  genre?: string
  year?: number
  createdAt: string
  updatedAt: string
}
