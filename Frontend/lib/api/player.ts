const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

// Helper function to safely get auth token
const getAuthToken = (): string | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem("firebase_token")
  }
  return null
}

export const playerApi = {
  async updateState(state: { trackId?: string; isPlaying?: boolean; currentTime?: number }) {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/player/state`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify(state),
    })

    if (!response.ok) {
      throw new Error("Failed to update player state")
    }

    return response.json()
  },

  async getState() {
    const token = getAuthToken()
    const response = await fetch(`${API_BASE_URL}/player/state`, {
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error("Failed to get player state")
    }

    return response.json()
  },
}
