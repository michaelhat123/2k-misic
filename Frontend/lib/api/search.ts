const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// Helper function to safely get auth token (FIXED - correct key)
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem("auth_token")  // ✅ FIXED: Use correct token key
  }
  return null
}

// Helper function to refresh JWT token if needed
const refreshJwtToken = async (): Promise<string | null> => {
  if (typeof window === "undefined") return null
  
  try {
    const refreshToken = localStorage.getItem('refresh_token')
    if (refreshToken) {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${refreshToken}` 
        }
      })
      
      if (response.ok) {
        const { accessToken, refreshToken: newRefreshToken } = await response.json()
        localStorage.setItem('auth_token', accessToken)
        if (newRefreshToken) {
          localStorage.setItem('refresh_token', newRefreshToken)
        }
        return accessToken
      }
    }
  } catch (error) {
    // Silent fail
  }
  
  return null
}

export const searchApi = {
  async search(query: string, type = "all", limit = 20, offset = 0, signal?: AbortSignal) {
    let token = getAuthToken()
    const params = new URLSearchParams({
      q: query,
      type,
      limit: limit.toString(),
      offset: offset.toString(),
    })

    let response = await fetch(`${API_BASE_URL}/search?${params}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      signal,
    })

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      const freshToken = await refreshJwtToken()
      if (freshToken) {
        // Retry with fresh token
        response = await fetch(`${API_BASE_URL}/search?${params}`, {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
          signal,
        })
      }
    }

    if (!response.ok) {
      throw new Error(`Search failed: ${response.status}`)
    }

    return response.json()
  },

  async getPopular() {
    let token = getAuthToken()
    let response = await fetch(`${API_BASE_URL}/search/popular`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      const freshToken = await refreshJwtToken()
      if (freshToken) {
        // Retry with fresh token
        response = await fetch(`${API_BASE_URL}/search/popular`, {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
        })
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to get popular content: ${response.status}`)
    }

    return response.json()
  },

  async getArtist(artistId: string, signal?: AbortSignal) {
    let token = getAuthToken()

    let response = await fetch(`${API_BASE_URL}/spotify/artist/${artistId}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      signal,
    })

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      const freshToken = await refreshJwtToken()
      if (freshToken) {
        response = await fetch(`${API_BASE_URL}/spotify/artist/${artistId}`, {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
          signal,
        })
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to get artist: ${response.status}`)
    }

    return response.json()
  },

  async getArtistTracks(artistId: string, limit = 20, offset = 0, signal?: AbortSignal) {
    let token = getAuthToken()
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })

    let response = await fetch(`${API_BASE_URL}/spotify/artist/${artistId}/tracks?${params}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      signal,
    })

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      const freshToken = await refreshJwtToken()
      if (freshToken) {
        response = await fetch(`${API_BASE_URL}/spotify/artist/${artistId}/tracks?${params}`, {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
          signal,
        })
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to get artist tracks: ${response.status}`)
    }

    return response.json()
  },

  async getAlbumTracks(albumId: string, limit = 20, offset = 0, signal?: AbortSignal) {
    let token = getAuthToken()
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    })

    let response = await fetch(`${API_BASE_URL}/spotify/album/${albumId}/tracks?${params}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      signal,
    })

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      const freshToken = await refreshJwtToken()
      if (freshToken) {
        response = await fetch(`${API_BASE_URL}/spotify/album/${albumId}/tracks?${params}`, {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
          signal,
        })
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to get album tracks: ${response.status}`)
    }

    return response.json()
  },

  async getArtistAlbums(artistId: string, limit = 6, signal?: AbortSignal) {
    let token = getAuthToken()
    const params = new URLSearchParams({
      limit: limit.toString(),
    })

    let response = await fetch(`${API_BASE_URL}/spotify/artist/${artistId}/albums?${params}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      signal,
    })

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      const freshToken = await refreshJwtToken()
      if (freshToken) {
        response = await fetch(`${API_BASE_URL}/spotify/artist/${artistId}/albums?${params}`, {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
          signal,
        })
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to get artist albums: ${response.status}`)
    }

    return response.json()
  },

  async getTopArtists(limit = 5, signal?: AbortSignal) {
    let token = getAuthToken()
    const params = new URLSearchParams({
      limit: limit.toString(),
    })

    let response = await fetch(`${API_BASE_URL}/spotify/top-artists?${params}`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      signal,
    })

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      const freshToken = await refreshJwtToken()
      if (freshToken) {
        response = await fetch(`${API_BASE_URL}/spotify/top-artists?${params}`, {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
          signal,
        })
      }
    }

    if (!response.ok) {
      throw new Error(`Failed to get top artists: ${response.status}`)
    }

    return response.json()
  },
}
