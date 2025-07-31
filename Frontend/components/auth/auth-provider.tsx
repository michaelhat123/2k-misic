"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User } from '@/types/user'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { userApi } from '@/lib/api/user'
import { socketService } from '@/lib/socket'
import { authApi } from "@/lib/api/auth"
import { useQueryClient } from '@tanstack/react-query'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  googleSignIn: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [redirectLoading, setRedirectLoading] = useState(false);
  const queryClient = useQueryClient()

  // 🚀 OLD CUSTOM EVENT LISTENERS REMOVED - USING SOCKET.IO NOW!

  useEffect(() => {
    console.log('🔥 AuthProvider: Setting up Firebase auth state listener...')
    
    // Listen to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('🔥 AuthProvider: Auth state changed', { 
        hasUser: !!firebaseUser, 
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        emailVerified: firebaseUser?.emailVerified 
      })
      
      try {
        if (firebaseUser) {
          console.log('👤 User is signed in, processing authentication...')
          
          // Get fresh ID token and store it
          try {
            const idToken = await firebaseUser.getIdToken(false) // Use cached token first
            console.log('✅ Firebase ID token obtained:', idToken.substring(0, 50) + '...')
            
            // Store token in localStorage for API requests
            if (typeof window !== 'undefined') {
              localStorage.setItem('firebase_token', idToken)
              console.log('✅ Token stored in localStorage')
            }
            
            // Try to get additional user data from backend
            try {
              console.log('🔗 Attempting to get profile from backend...')
              // 🚀 CRITICAL FIX: Use working /users/profile endpoint instead of broken /auth/profile
              const { userApi } = await import('@/lib/api/user')
              const profileData = await userApi.getProfile() as any
              console.log('✅ Profile data from backend:', profileData)
              console.log('🖼️ PROFILE PICTURE DEBUG:', {
                backend_profile_picture: profileData.profile_picture,
                backend_picture_property: profileData.picture,
                profileData_keys: Object.keys(profileData || {}),
                firebase_photoURL: firebaseUser.photoURL,
                will_use: profileData.profile_picture || profileData.picture || firebaseUser.photoURL || '(none)',
                profileData_full: profileData
              })
              
              const userProfile = {
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                name: profileData.display_name || profileData.name || firebaseUser.displayName || '',
                picture: profileData.profile_picture || firebaseUser.photoURL || '',
                emailVerified: profileData.emailVerified,
              }
              
              setUser(userProfile)
              console.log('✅ User state set from backend profile:', userProfile)
              console.log('🖼️ FINAL USER PICTURE:', userProfile.picture)
              
              // 🚀 CONNECT SOCKET.IO FOR REAL-TIME UPDATES
              console.log('🔌 SOCKET.IO: Connecting for user:', userProfile.uid)
              socketService.connect(userProfile.uid)
              
              // 🚀 LISTEN FOR REAL-TIME PROFILE PICTURE UPDATES
              socketService.onProfilePictureUpdate((data) => {
                console.log('🚀 SOCKET.IO: Profile picture update received:', data)
                if (data.uid === userProfile.uid) {
                  console.log('⚡ UPDATING AUTH CONTEXT: New picture:', data.profile_picture)
                  
                  // Update auth context
                  setUser(prev => {
                    const updated = prev ? { ...prev, picture: data.profile_picture } : null
                    console.log('✅ AUTH CONTEXT UPDATED:', updated)
                    return updated
                  })
                  
                  // 🚀 FORCE REACT QUERY CACHE UPDATE (NO INVALIDATION TO PRESERVE OTHER UPDATES)
                  queryClient.setQueryData(["user-profile"], (oldData: any) => ({
                    ...oldData,
                    profile_picture: data.profile_picture
                  }))
                  // ⚠️ REMOVED: queryClient.invalidateQueries - this was overwriting successful profile name updates!
                  console.log('⚡ REACT QUERY CACHE UPDATED (PRESERVING DISPLAY NAME UPDATES)')
                  
                } else {
                  console.log('⚠️ SOCKET.IO: Update for different user, ignoring')
                }
              })
              
              // 🚀 LISTEN FOR REAL-TIME PROFILE UPDATES
              socketService.onProfileUpdate((data) => {
                console.log('🚀 SOCKET.IO: Profile update received:', data)
                if (data.uid === userProfile.uid) {
                  console.log('⚡ UPDATING AUTH CONTEXT: New profile:', data.profile)
                  setUser(prev => {
                    const updated = prev ? { ...prev, ...data.profile } : null
                    console.log('✅ AUTH CONTEXT UPDATED:', updated)
                    return updated
                  })
                }
              })
              
              // 🚀 CRITICAL: Set loading to false after successful profile setup
              setLoading(false)
              console.log('✅ Auth loading complete - Socket.IO connected!')
              
            } catch (profileError: any) {
              console.warn('⚠️ Failed to get backend profile, using Firebase data:', profileError.message)
              
              // Fallback to Firebase user data
              setUser({
                uid: firebaseUser.uid,
                email: firebaseUser.email!,
                name: firebaseUser.displayName || '',
                picture: firebaseUser.photoURL || '',
                emailVerified: firebaseUser.emailVerified,
              })
              console.log('✅ User state set from Firebase data (fallback)')
              
              // 🚀 CRITICAL: Set loading to false after fallback setup
              setLoading(false)
              console.log('✅ Auth loading complete (fallback mode)')
            }
          } catch (tokenError: any) {
            console.error('❌ Failed to get Firebase token:', tokenError.message)
            // If we can't get token, user should be logged out
            setUser(null)
            if (typeof window !== 'undefined') {
              localStorage.removeItem('firebase_token')
            }
          }
        } else {
          console.log('User is signed out')
          setUser(null)
          setLoading(false) // 🔥 CRITICAL FIX: Set loading to false when signed out
          
          // Disconnect Socket.IO on logout
          console.log('SOCKET.IO disconnected on logout')
          socketService.disconnect()
          
          // Clear token from localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem('firebase_token')
            console.log('Token removed from localStorage')
          }
          
          // Check if this was an unexpected logout (token expired)
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '/'
          if (currentPath !== '/' && typeof window !== 'undefined') {
            console.log('Unexpected logout detected, token may have expired')
            // The MainLayout will automatically show AuthModal when user becomes null
          }
        }
      } catch (error: any) {
        console.error('Error in auth state change handler:', error.message)
        setUser(null)
        setLoading(false)
      }
    })

    return () => {
      console.log('🔥 AuthProvider: Cleaning up auth state listener')
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    console.log('🔐 AuthProvider: Starting login...', { email })
    
    try {
      const result = await authApi.login(email, password)
      setRedirectLoading(true); // Show loading overlay immediately after success
      // User state will be updated by the Firebase auth state listener
      // No need to manually set user here
    } catch (error: any) {
      console.error('❌ Login failed:', error.message)
      // Ensure user is cleared on login failure
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('firebase_token')
      }
      throw error
    }
  }

  const logout = async () => {
    console.log('🔐 AuthProvider: Starting logout...')
    
    try {
      await authApi.logout()
      console.log('✅ Logout successful')
      
      // User state will be updated by the Firebase auth state listener
      // No need to manually set user here
    } catch (error: any) {
      console.error('❌ Logout failed:', error.message)
      throw error
    }
  }

  const register = async (email: string, password: string, name: string) => {
    console.log('🔐 AuthProvider: Starting registration...', { email, name })
    
    try {
      const result = await authApi.register(email, password, name)
      setRedirectLoading(true); // Show loading overlay immediately after success
      // User state will be updated by the Firebase auth state listener
      // No need to manually set user here
    } catch (error: any) {
      console.error('❌ Registration failed:', error.message)
      // Ensure user is cleared on registration failure
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('firebase_token')
      }
      throw error
    }
  }

  const googleSignIn = async () => {
    console.log('🔐 AuthProvider: Starting Google sign-in...')
    
    try {
      const result = await authApi.googleSignIn()
      console.log('✅ Google sign-in successful:', result.user)
      
      // User state will be updated by the Firebase auth state listener
      // No need to manually set user here
    } catch (error: any) {
      console.error('❌ Google sign-in failed:', error.message)
      // Ensure user is cleared on Google sign-in failure
      setUser(null)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('firebase_token')
      }
      throw error
    }
  }

  const refreshProfile = async () => {
    console.log('🔄 FORCE refreshing user profile for INSTANT update...')
    try {
      const firebaseUser = auth.currentUser
      if (firebaseUser) {
        // CRITICAL: Force fresh API call with no cache
        const profileData = await authApi.getProfile() as any
        console.log('🚀 INSTANT refresh profile data:', {
          profile_picture: profileData.profile_picture,
          display_name: profileData.display_name
        })
        
        // INSTANT update - no delays!
        const newUserData = {
          uid: profileData.uid,
          email: profileData.email,
          name: profileData.display_name || profileData.name || firebaseUser.displayName || '',
          picture: profileData.profile_picture || firebaseUser.photoURL || '',
          emailVerified: profileData.emailVerified,
        }
        
        setUser(newUserData)
        
        console.log('🚀 INSTANT top navbar update complete:', {
          oldPicture: user?.picture,
          newPicture: newUserData.picture,
          oldName: user?.name,
          newName: newUserData.name
        })
      }
    } catch (error: any) {
      console.error('❌ Failed to refresh profile:', error.message)
    }
  }

  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    register,
    googleSignIn,
    refreshProfile,
  }), [user, loading, login, logout, register, googleSignIn, refreshProfile])

  console.log('🔥 AuthProvider: Rendering with state', { 
    hasUser: !!user, 
    loading, 
    userEmail: user?.email,
    hasFirebaseAuth: !!auth,
    hasToken: typeof window !== 'undefined' ? !!localStorage.getItem('firebase_token') : false
  })

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
