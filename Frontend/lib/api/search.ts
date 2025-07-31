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
      console.log('✅ Search API: Token refreshed!')
      return freshToken
    }
  } catch (error) {
    console.error('❌ Search API: Token refresh failed:', error)
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
      console.log('🔄 Search API: Token expired, refreshing...')
      const freshToken = await refreshAuthToken()
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
      console.log('🔄 Search API: Token expired, refreshing...')
      const freshToken = await refreshAuthToken()
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
}
