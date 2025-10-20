"use client"

import { useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'

export function useAuthGuard() {
  const { user, loading } = useAuth()

  useEffect(() => {
    // Only check after loading is complete
    if (!loading) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
      
      // If no user and no token, force redirect to auth
      if (!user && !token) {
        // The MainLayout will automatically show AuthModal when user is null
        return
      }

      // If token exists but user is null (token might be invalid)
      if (token && !user) {
        // Remove invalid token to trigger auth flow
        localStorage.removeItem('auth_token')
        
        // Trigger storage event to notify MainLayout immediately
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'auth_token',
          oldValue: token,
          newValue: null,
          storageArea: localStorage
        }))
      }
    }
  }, [user, loading])

  return {
    isAuthenticated: !!user,
    isLoading: loading,
    hasValidToken: typeof window !== 'undefined' ? !!localStorage.getItem('auth_token') && !!user : false
  }
}
