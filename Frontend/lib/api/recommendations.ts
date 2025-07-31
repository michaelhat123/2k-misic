const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// Helper function to safely get auth token (FIXED - correct key)
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem("firebase_token")  // ✅ FIXED: Use correct token key
  }
  return null
}

// Helper function to refresh Firebase token
const refreshAuthToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null
  
  try {
    const { getAuth } = await import('firebase/auth')
    const auth = getAuth()
    if (auth.currentUser) {
      const freshToken = await auth.currentUser.getIdToken(true) // Force refresh
      localStorage.setItem('firebase_token', freshToken)
      console.log('✅ Recommendations API: Token refreshed!')
      return freshToken
    }
  } catch (error) {
    console.error('❌ Recommendations API: Token refresh failed:', error)
  }
  return null
}

export const recommendationsApi = {
  async getRecommendations() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get recommendations")
    }

    return response.json()
  },

  async getTrending() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/trending`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get trending tracks")
    }

    return response.json()
  },

  async getTrendingAlbums() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/albums`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get trending albums")
    }

    return response.json()
  },

  async getRwandanTracks() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/rwanda`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) {
      throw new Error("Failed to get Rwandan tracks")
    }
    // Map backend fields to frontend Track type
    const data = await response.json()
    return Array.isArray(data)
      ? data.map((t: any) => ({
          id: t.id || t.spotify_track_id || '',
          title: t.name || t.title || '',
          artist: t.artist || t.artists || '',
          album: t.album || '',
          albumArt: t.image || t.albumArt || '',
          duration: t.duration || t.duration_ms || 0,
          url: t.url || '',
          genre: t.genre || '',
          year: t.year || undefined,
          createdAt: t.createdAt || '',
          updatedAt: t.updatedAt || '',
        }))
      : []
  },

  async getTrendingArtists() {
    let token = getAuthToken()
    let response = await fetch(`${API_BASE_URL}/recommendations/artists`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      console.log('🔄 Recommendations API: Token expired, refreshing...')
      const freshToken = await refreshAuthToken()
      if (freshToken) {
        // Retry with fresh token
        response = await fetch(`${API_BASE_URL}/recommendations/artists`, {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
        })
      }
    }

    if (!response.ok) {
      throw new Error("Failed to get trending artists")
    }
    return response.json()
  },

  async getTrendingPodcasts() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/podcasts`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get trending podcasts")
    }

    return response.json()
  },

  // Genre-specific track methods
  async getPopTracks() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/genres/pop`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error("Failed to get Pop tracks")
    return response.json()
  },

  async getRockTracks() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/genres/rock`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error("Failed to get Rock tracks")
    return response.json()
  },

  async getHipHopTracks() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/genres/hiphop`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error("Failed to get Hip-Hop tracks")
    return response.json()
  },

  async getRnBTracks() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/genres/rnb`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error("Failed to get R&B tracks")
    return response.json()
  },

  async getAfrobeatsTracks() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/genres/afrobeats`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error("Failed to get Afrobeats tracks")
    return response.json()
  },

  async getEDMTracks() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/genres/edm`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error("Failed to get EDM tracks")
    return response.json()
  },

  async getClassicalTracks() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/genres/classical`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error("Failed to get Classical tracks")
    return response.json()
  },

  async getCountryTracks() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/genres/country`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error("Failed to get Country tracks")
    return response.json()
  },

  async getReggeeTracks() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/genres/reggae`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error("Failed to get Reggae tracks")
    return response.json()
  },

  async getLatinTracks() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/recommendations/genres/latin`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })
    if (!response.ok) throw new Error("Failed to get Latin tracks")
    return response.json()
  },

  // 🚀 PERFORMANCE: Single bulk API call instead of 16+ individual calls!
  async getBulkData() {
    let token = getAuthToken()
    let response = await fetch(`${API_BASE_URL}/recommendations/bulk/all`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      console.log('🔄 Recommendations API: Token expired, refreshing...')
      const freshToken = await refreshAuthToken()
      if (freshToken) {
        // Retry with fresh token
        response = await fetch(`${API_BASE_URL}/recommendations/bulk/all`, {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
        })
      }
    }

    if (!response.ok) throw new Error("Failed to get bulk data")
    return response.json()
  },
}
