"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User } from '@/types/user'
import { authApi } from "@/lib/api/auth"
import { useQueryClient } from '@tanstack/react-query'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  // Returns backend signup payload { message, userId, email }
  register: (email: string, password: string, name: string) => Promise<{ message: string; userId: string; email: string }>
  // OTP helpers
  sendOtp: (email: string, type?: 'verification' | 'password_reset') => Promise<any>
  resendOtp: (email: string, type?: 'verification' | 'password_reset') => Promise<any>
  verifyOtp: (email: string, otpCode: string, type?: 'verification' | 'password_reset') => Promise<any>
  resetPassword: (email: string, code: string, newPassword: string) => Promise<any>
  googleSignIn: (redirectTo?: string) => void
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  // Check for existing auth token on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user has a valid token
        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
        if (token) {
          // Try to get user profile
          const profile = await authApi.getProfile();
          if (profile) {
            setUser(profile);
          } else {
            // Invalid token, clear it
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
          }
        }
      } catch (error) {
        // Clear invalid tokens
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Handle Google redirect results on mount
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        const result = await authApi.handleGoogleRedirect();
        if (result) {
          setUser(result.user);
        }
      } catch (error) {
        // Silent fail
      }
    };
    
    handleRedirectResult();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await authApi.login(email, password);
      setUser(result.user);
    } catch (error: any) {
      setUser(null);
      throw error;
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      // Backend returns { message, userId, email } and sends OTP; no token/user yet
      const result = await authApi.register(email, password, name)
      return result
    } catch (error: any) {
      // Do not alter user state on signup failures
      throw error
    }
  }

  const googleSignIn = (redirectTo?: string) => {
    authApi.startGoogleSignIn(redirectTo);
  }

  // OTP helpers
  const sendOtp = async (email: string, type: 'verification' | 'password_reset' = 'verification') => {
    return authApi.sendOtp(email, type)
  }

  const resendOtp = async (email: string, type: 'verification' | 'password_reset' = 'verification') => {
    return authApi.resendOtp(email, type)
  }

  const verifyOtp = async (email: string, otpCode: string, type: 'verification' | 'password_reset' = 'verification') => {
    return authApi.verifyOtp(email, otpCode, type)
  }

  const resetPassword = async (email: string, code: string, newPassword: string) => {
    return authApi.resetPassword(email, code, newPassword)
  }

  const logout = async () => {
    try {
      await authApi.logout();
      
      // Stop any playing music
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('forceStopPlayer'));
      }
      
      setUser(null);
      
      // Clear query cache
      queryClient.clear();
      
    } catch (error) {
      // Still clear user state even if backend logout fails
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('forceStopPlayer'));
      }
      setUser(null);
      queryClient.clear();
    }
  }

  const refreshProfile = async () => {
    try {
      const profile = await authApi.getProfile();
      if (profile) {
        setUser(profile);
      }
    } catch (error) {
      // Silent fail
    }
  }

  const contextValue = useMemo(() => ({
    user,
    loading,
    login,
    logout,
    register,
    sendOtp,
    resendOtp,
    verifyOtp,
    resetPassword,
    googleSignIn,
    refreshProfile,
  }), [user, loading]);

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
