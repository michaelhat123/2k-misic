"use client"

import { useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'

export function useAuthGuard() {
  const { user, loading } = useAuth()

  useEffect(() => {
    // Only check after loading is complete
    if (!loading) {
      const token = typeof window !== 'undefined' ? localStorage.getItem('firebase_token') : null
      
      // If no user and no token, force redirect to auth
      if (!user && !token) {
        console.log('🔒 Auth Guard: No user or token found, redirecting to auth...')
        // The MainLayout will automatically show AuthModal when user is null
        return
      }

      // If token exists but user is null (token might be invalid)
      if (token && !user) {
        console.log('🔒 Auth Guard: Token exists but user is null, possible invalid token')
        // Remove invalid token to trigger auth flow
        localStorage.removeItem('firebase_token')
        console.log('🗑️ Auth Guard: Removed invalid token from localStorage')
        
        // Trigger storage event to notify MainLayout immediately
        window.dispatchEvent(new StorageEvent('storage', {
          key: 'firebase_token',
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
    hasValidToken: typeof window !== 'undefined' ? !!localStorage.getItem('firebase_token') && !!user : false
  }
}
