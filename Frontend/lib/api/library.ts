const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"

const getAuthToken = (): string | null => {
  if (typeof window !== "undefined" && window.localStorage) {
    return localStorage.getItem("auth_token")
  }
  return null
}

export const libraryApi = {
  async getLibraryFolder(): Promise<string | null> {
    try {
      const token = getAuthToken()
      const res = await fetch(`${API_BASE_URL}/users/library`, {
        headers: { ...(token && { Authorization: `Bearer ${token}` }) },
      })
      if (!res.ok) return null
      const data = await res.json()
      return data?.folder || null
    } catch {
      return null
    }
  },

  async setLibraryFolder(folder: string): Promise<boolean> {
    const token = getAuthToken()
    const res = await fetch(`${API_BASE_URL}/users/library`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: JSON.stringify({ folder }),
    })
    return res.ok
  },
}
