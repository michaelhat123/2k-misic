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
      console.log('✅ User API: Token refreshed!')
      return freshToken
    }
  } catch (error) {
    console.error('❌ User API: Token refresh failed:', error)
  }
  return null
}

export const userApi = {
  async getProfile() {
    let token = getAuthToken()
    let response = await fetch(`${API_BASE_URL}/users/profile`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    // If token expired, try to refresh and retry
    if (response.status === 401) {
      console.log('🔄 User API: Token expired, refreshing...')
      const freshToken = await refreshAuthToken()
      if (freshToken) {
        // Retry with fresh token
        response = await fetch(`${API_BASE_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${freshToken}`,
          },
        })
      }
    }

    if (!response.ok) {
      throw new Error("Failed to get user profile")
    }

    return response.json()
  },

  async updateProfile(userData: { display_name?: string; preferences?: { theme?: string; notifications?: boolean } }) {
    console.log('🚀 updateProfile called with:', userData)
    
    const token = getAuthToken()
    console.log('🔑 Auth token present:', !!token)
    
    console.log('📤 Making PUT request to:', `${API_BASE_URL}/users/profile`)
    console.log('📤 Request payload:', JSON.stringify(userData, null, 2))
    
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(userData),
    })
    
    console.log('📥 Response status:', response.status)
    console.log('📥 Response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Update error response:', errorText)
      throw new Error(`Failed to update user profile: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Update success result:', result)
    return result
  },

  async getRecentlyPlayed() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/users/recent`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get recently played tracks")
    }

    return response.json()
  },

  async uploadProfilePicture(file: File) {
    console.log('🚀 uploadProfilePicture called with:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })
    
    const token = getAuthToken()
    console.log('🔑 Auth token present:', !!token)
    
    const formData = new FormData()
    formData.append("file", file)  // ✅ FIXED: Use correct field name
    
    console.log('📤 Making PUT request to:', `${API_BASE_URL}/users/profile/picture`)

    const response = await fetch(`${API_BASE_URL}/users/profile/picture`, {
      method: "PUT",  // ✅ FIXED: Use correct HTTP method
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })
    
    console.log('📥 Response status:', response.status)
    console.log('📥 Response ok:', response.ok)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Upload error response:', errorText)
      throw new Error(`Failed to upload profile picture: ${response.status} ${errorText}`)
    }

    const result = await response.json()
    console.log('✅ Upload success result:', result)
    return result
  },

  async deleteProfilePicture() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/users/profile/picture`, {
      method: "DELETE",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to delete profile picture")
    }

    return response.json()
  },

  async deleteAccount() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "DELETE",
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to delete account")
    }

    return response.json()
  },
}
