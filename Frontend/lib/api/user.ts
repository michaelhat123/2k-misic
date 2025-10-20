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
      const token = await refreshJwtToken()
      if (token) {
        // Retry with fresh token
        response = await fetch(`${API_BASE_URL}/users/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
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
    const token = getAuthToken()
    
    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to update user profile: ${response.status} ${errorText}`)
    }

    const result = await response.json()
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
    const token = getAuthToken()
    
    const formData = new FormData()
    formData.append("file", file)  // ✅ FIXED: Use correct field name

    const response = await fetch(`${API_BASE_URL}/users/profile/picture`, {
      method: "PUT",  // ✅ FIXED: Use correct HTTP method
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to upload profile picture: ${response.status} ${errorText}`)
    }

    const result = await response.json()
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
