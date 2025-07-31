"use client"

import React from "react"

import { Sidebar } from "./sidebar"
import { usePlayer } from "../player/player-provider"
import { TopNavigation, SearchProvider } from "./top-navigation"
import { PlayerBar } from "../player/player-bar"
import { NavigationProvider } from "./navigation-context"
import { useAuth } from "../auth/auth-provider"
import { AuthModal } from "../auth/auth-modal"
import { motion } from "framer-motion"
import { AnimatedBackground } from "../auth/animated-background"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth()
  const [isAuthenticating, setIsAuthenticating] = React.useState(false)
  const { currentTrack } = usePlayer();
  const topNavHeight = 64; // px
  const playbarHeight = 64; // px
  const mainContentHeight = currentTrack
    ? `calc(100vh - ${topNavHeight}px - ${playbarHeight}px)`
    : `calc(100vh - 120px)`;
  
  // Debug logging


  // Listen for authentication events to prevent modal flash
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'firebase_token') {
        if (e.newValue) {
          // Token was just added, user is authenticating
          setIsAuthenticating(true)
          // Clear authenticating state after a longer delay for smoother transition
          setTimeout(() => setIsAuthenticating(false), 3000)
        } else {
          // Token was removed, clear authenticating state immediately to show AuthModal
    
          setIsAuthenticating(false)
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Extended loading state for smoother user experience
  React.useEffect(() => {
    if (user && !loading) {
      // When user is authenticated, show loading for a brief moment
      // to allow dashboard to initialize properly
      const timer = setTimeout(() => {
        setIsAuthenticating(false)
      }, 1000)
      
      return () => clearTimeout(timer)
    } else if (!user && !loading) {
      // When user is null and not loading, clear authenticating state to show AuthModal
      console.log('🔒 MainLayout: User is null, clearing authenticating state for AuthModal')
      setIsAuthenticating(false)
    }
  }, [user, loading])

  // Show loading during initial auth check or active authentication
  if (loading || isAuthenticating) {
    console.log('🔄 MainLayout: Showing loading screen:', { loading, isAuthenticating })
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <motion.div 
          className="relative z-10 flex flex-col items-center space-y-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Logo and App Name */}
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <motion.div
              className="w-16 h-16 bg-gradient-to-br from-primary via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <div className="w-8 h-8 text-white">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                </svg>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
            </motion.div>
          </motion.div>
          
          {/* Loading Message */}
          <motion.div 
            className="text-center space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Only show AuthModal if truly not authenticated and not in the middle of authenticating
  if (!user && !isAuthenticating) {
    console.log('🔒 MainLayout: Showing AuthModal - no user and not authenticating')
    return <AuthModal />
  }

  return (
    <NavigationProvider>
      <SearchProvider>
        <div className="h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
          {/* Animated Background for all internal pages */}
          <AnimatedBackground />

          {/* Top Navigation */}
          <div className="relative z-10">
            <TopNavigation />
          </div>

          <div className="flex flex-1 overflow-hidden relative z-10">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            {/* Main Content */}
            <motion.main
              className="flex-1 overflow-hidden rounded-lg mb-16 bg-card/95 mr-1"
              style={{ height: mainContentHeight }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.main>
          </div>

          {/* Player Bar */}
          <div className="relative z-10">
            <PlayerBar />
          </div>
        </div>
      </SearchProvider>
    </NavigationProvider>
  )
}
