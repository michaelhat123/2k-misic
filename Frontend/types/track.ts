export interface Track {
  id: string
  title: string
  artist: string
  album: string
  albumArt?: string
  duration: number
  url: string
  genre?: string
  year?: number
  createdAt: string
  updatedAt: string
}
