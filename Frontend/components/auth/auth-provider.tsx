"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useMemo } from 'react'
import { User } from '@/types/user'
import { authApi } from "@/lib/api/auth"
import { useQueryClient } from '@tanstack/react-query'
import { socketService } from "@/lib/socket"

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
        // Check if we should show branded loader (user just returned from OAuth)
        const showLoader = localStorage.getItem('show_auth_loader');
        if (showLoader === 'true') {
          localStorage.removeItem('show_auth_loader');
          
          // Keep loading state for 1 second to show branded loader
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Check for auth params in URL (from callback redirect)
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('auth_code');
        const authState = urlParams.get('auth_state');
        const oauthSuccess = urlParams.get('oauth_success');
        
        // Handle OAuth success redirect from external browser
        if (oauthSuccess === 'true') {
          // Check for tokens in localStorage
          const token = localStorage.getItem('auth_token');
          if (token) {
            try {
              const profile = await authApi.getProfile();
              if (profile) {
                setUser(profile);
                
                // Dispatch success event
                window.dispatchEvent(new CustomEvent('googleSignInSuccess', { 
                  detail: { user: profile, token } 
                }));
                
                // Clean up URL
                window.history.replaceState({}, '', window.location.pathname);
              }
            } catch (error) {
              // Silent fail
            }
          }
          
          setLoading(false);
          return;
        }
        
        if (authCode && authState) {
          try {
            // Process the auth code
            const result = await authApi.handleGoogleRedirect();
            
            if (result && result.user) {
              setUser(result.user);
              
              // Dispatch success event for auth-modal to detect
              window.dispatchEvent(new CustomEvent('googleSignInSuccess', { 
                detail: { user: result.user, token: result.token } 
              }));
            }
            
            // Clean up URL params
            const newUrl = window.location.pathname;
            window.history.replaceState({}, '', newUrl);
          } catch (error) {
            // Silent fail
          }
        } else {
          // Skip auth validation if we're on auth pages (signup/login/verify)
          const isAuthPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/auth');
          if (isAuthPage) {
            setLoading(false);
            return;
          }

          // Check if user has a valid token
          const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
          if (token) {
            // Try to get user profile
            try {
              const profile = await authApi.getProfile();
              if (profile) {
                setUser(profile);
              } else {
                // Invalid token, clear it
                localStorage.removeItem('auth_token');
                localStorage.removeItem('refresh_token');
              }
            } catch (error) {
              // Clear invalid tokens
              localStorage.removeItem('auth_token');
              localStorage.removeItem('refresh_token');
            }
          }
        }
      } catch (error) {
        // Clear any invalid tokens on error
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('refresh_token');
        }
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure DOM is ready
    const timer = setTimeout(initAuth, 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle Google Sign-In events
  useEffect(() => {
    const handleGoogleSuccess = (event: CustomEvent) => {
      setUser(event.detail.user);
    };

    const handleGoogleError = (event: CustomEvent) => {
      // Silent fail
    };

    // Listen for custom Google Sign-In events
    window.addEventListener('googleSignInSuccess', handleGoogleSuccess as EventListener);
    window.addEventListener('googleSignInError', handleGoogleError as EventListener);

    // Listen for Electron OAuth callbacks
    if (typeof window !== 'undefined' && (window as any).electron?.onOAuthCallback) {
      (window as any).electron.onOAuthCallback(async (data: { code: string; state: string }) => {
        try {
          const result = await authApi.handleGoogleRedirect();
          if (result && result.user) {
            setUser(result.user);
            window.dispatchEvent(new CustomEvent('googleSignInSuccess', { 
              detail: { user: result.user, token: result.token } 
            }));
          }
        } catch (error) {
          window.dispatchEvent(new CustomEvent('googleSignInError', { 
            detail: { error: (error as Error).message } 
          }));
        }
      });
    }

    return () => {
      window.removeEventListener('googleSignInSuccess', handleGoogleSuccess as EventListener);
      window.removeEventListener('googleSignInError', handleGoogleError as EventListener);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const result = await authApi.login(email, password);
      setUser(result.user);
      setLoading(false); // Ensure loading is false after successful login
    } catch (error: any) {
      // Don't clear user state if it's a verification error - let the auth modal handle redirect
      const isVerificationError = typeof error?.message === 'string' && error.message.toLowerCase().includes('verify');
      if (!isVerificationError) {
        setUser(null);
        setLoading(false); // Ensure loading is false on non-verification errors
      }
      
      throw error;
    }
  }

  const register = async (email: string, password: string, name: string) => {
    try {
      // Backend returns { message, userId, email }
      const result = await authApi.register(email, password, name);
      // Do NOT set user here; account is unverified and no token is issued.
      return result;
    } catch (error: any) {
      // Do not alter user state on signup failures
      throw error;
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
      // 1. Call backend logout (invalidates tokens on server)
      await authApi.logout();
    } catch (error: any) {
      // Continue with frontend cleanup even if backend fails
    }
    
    // 2. Stop any playing music and clear player state
    if (typeof window !== 'undefined') {
      // Dispatch event to stop player
      window.dispatchEvent(new CustomEvent('forceStopPlayer'));
    }
    
    // 3. Clear user state immediately
    setUser(null);
    setLoading(false); // Ensure auth modal shows immediately
    
    // 4. Clear all React Query cache (removes all cached API data)
    queryClient.clear();
    
    // 5. Clear all localStorage data (comprehensive cleanup)
    if (typeof window !== 'undefined') {
      // Auth tokens
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      
      // User data and settings
      localStorage.removeItem('user_profile');
      localStorage.removeItem('user_settings');
      
      // Music data
      localStorage.removeItem('2k-music-recent-songs');
      localStorage.removeItem('watchedMusicFolder');
      localStorage.removeItem('watchedFolderTracks');
      
      // Auth flow data
      localStorage.removeItem('pending_signup_email');
      localStorage.removeItem('pending_signup_password');
      localStorage.removeItem('pending_login_password');
      
      // Session storage cleanup
      sessionStorage.removeItem('pending_signup_email');
      sessionStorage.removeItem('pending_signup_password');
      sessionStorage.removeItem('pending_login_password');
      sessionStorage.removeItem('oauth_state');
      sessionStorage.removeItem('redirect_after_login');
    }
  }

  const refreshProfile = async () => {
    try {
      const profile = await authApi.getProfile();
      setUser(profile);
    } catch (error) {
      // Silent fail
    }
  }

  // SOCKET.IO REAL-TIME PROFILE UPDATES
  useEffect(() => {
    if (user?.id) {
      // Connect to Socket.IO
      socketService.connect(user.id)
      
      // Listen for profile picture updates
      socketService.onProfilePictureUpdate((data) => {
        // Update the user state globally
        setUser(prevUser => {
          if (prevUser) {
            const updatedUser: User = {
              ...prevUser,
              profilePicture: data.profile_picture === null ? undefined : data.profile_picture
            }
            return updatedUser
          }
          return prevUser
        })
      })
      
      // Cleanup on unmount or user change
      return () => {
        socketService.removeAllListeners()
      }
    }
  }, [user?.id])

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
