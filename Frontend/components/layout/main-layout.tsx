"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Music } from "lucide-react"
import { FixedSizeList as List } from 'react-window'
import * as ScrollAreaPrimitive from "@radix-ui/react-scroll-area"
import { ScrollBar } from "@/components/ui/scroll-area"
import { useAuth } from "@/components/auth/auth-provider"
import { usePlayer } from "../player/player-provider"
import { TopNavigation, useSearch } from "./top-navigation"
import Sidebar from "./sidebar"
import { PlayerBar } from "../player/player-bar"
import { NowPlayingSidebar } from "../player/now-playing-sidebar"
import { NavigationProvider } from "./navigation-context"
import { SearchProvider } from "./top-navigation"
import { AnimatedBackground } from "../auth/animated-background"
import { AuthModal } from "../auth/auth-modal"
import { NavigationLoader } from "../ui/navigation-loader"
import { useRouter, usePathname } from "next/navigation"
import { setupRoutePreloader } from "@/lib/route-preloader"
import { BrandedLoader } from "../ui/BrandedLoader"
import CreatePlaylistModal from "../playlist/create-playlist-modal"
import { SearchOverlay } from "../search/search-overlay"

// Queue Row component - OUTSIDE to prevent recreation
const QueueRow = React.memo(function QueueRow(props: any) {
  const { index, style, data } = props
  if (!data || !data[index]) return null
  
  const track = data[index]
  
  return (
    <div style={style} className="pr-2">
      <div className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
        <div className="w-8 h-8 rounded bg-gradient-to-br from-purple-500 to-pink-500 flex-shrink-0 flex items-center justify-center">
          {track.albumArt ? (
            <img src={track.albumArt} alt={track.title} className="w-full h-full object-cover rounded" loading="lazy" />
          ) : (
            <Music className="w-4 h-4 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{track.title}</p>
          <p className="text-xs text-muted-foreground truncate">{track.artist}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          {index + 1}
        </div>
      </div>
    </div>
  )
})

// Component to clear search on navigation - must be inside SearchProvider
function SearchClearer() {
  const pathname = usePathname()
  const { clearSearch, searchQuery } = useSearch()
  const prevPathnameRef = React.useRef<string | null>(null)
  
  React.useEffect(() => {
    // Only clear if pathname actually changed (not on typing/mount)
    if (prevPathnameRef.current !== null && prevPathnameRef.current !== pathname) {
      // Clear search when navigating away from search page
      if (pathname && !pathname.startsWith('/search') && searchQuery) {
        clearSearch()
      }
    }
    prevPathnameRef.current = pathname
  }, [pathname]) // Remove clearSearch and searchQuery from deps to prevent constant clearing
  
  return null
}

// Custom outer element for ScrollArea
const QueueOuterElement = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ style, ...props }, ref) => {
    const { overflow, overflowX, overflowY, ...filteredStyle } = style || {}
    return (
      <ScrollAreaPrimitive.Root className="h-full relative">
        <ScrollAreaPrimitive.Viewport
          ref={ref}
          className="h-full w-full"
          style={filteredStyle}
          {...props}
        />
        <ScrollBar />
        <ScrollAreaPrimitive.Corner />
      </ScrollAreaPrimitive.Root>
    )
  }
)

// VirtualizedQueueList - OUTSIDE to prevent recreation
const VirtualizedQueueList = React.memo(({ 
  queue
}: { 
  queue: any[]
}) => {
  return (
    <List
      height={Math.min(window.innerHeight * 0.8 - 100, queue.length * 56)}
      width="100%"
      itemCount={queue.length}
      itemSize={56}
      itemData={queue}
      className="px-4"
      overscanCount={5}
      outerElementType={QueueOuterElement}
    >
      {QueueRow}
    </List>
  )
}, (prevProps, nextProps) => {
  return prevProps.queue === nextProps.queue
})

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname() // Next.js hook - automatically updates on route change
  const [isAuthenticating, setIsAuthenticating] = React.useState(false)
  const [showInitialLoader, setShowInitialLoader] = React.useState(true)
  const [showNowPlaying, setShowNowPlaying] = React.useState(false)
  const [showQueueModal, setShowQueueModal] = React.useState(false)
  const [showCreatePlaylistModal, setShowCreatePlaylistModal] = React.useState(false)
  const [isNavigating, setIsNavigating] = React.useState(false)
  const [isPageLoading, setIsPageLoading] = React.useState(false)
  const { currentTrack, isPlaying, queue } = usePlayer();
  
  // Check if we're on an auth page - bypass main layout
  // This will automatically update when pathname changes
  const isAuthPage = pathname?.startsWith('/auth') ?? false
  
  // Route change tracking
  React.useEffect(() => {
    // Route changed
  }, [pathname, isAuthPage])

  // Listen for navigation start events to show immediate feedback
  React.useEffect(() => {
    const handleNavStart = () => {
      setIsNavigating(true)
      setIsPageLoading(true)
      // Clear navigation state after a short delay
      setTimeout(() => setIsNavigating(false), 150)
      // Clear page loading after component should be loaded - extended duration
      setTimeout(() => setIsPageLoading(false), 1000)
    }

    const handleNavComplete = () => {
      // Add small delay to ensure skeleton is ready
      setTimeout(() => setIsPageLoading(false), 100)
    }

    window.addEventListener('contentNavStart', handleNavStart)
    window.addEventListener('contentNavComplete', handleNavComplete)
    return () => {
      window.removeEventListener('contentNavStart', handleNavStart)
      window.removeEventListener('contentNavComplete', handleNavComplete)
    }
  }, [])


  // 🚀 OPTIMIZED ROUTE PRELOADING: Delayed to avoid blocking initial render
  React.useEffect(() => {
    // Delay preloading to avoid blocking UI responsiveness
    const timer = setTimeout(() => {
      setupRoutePreloader(router, {
        delay: 300, // Much slower to avoid blocking UI
        enableLogging: false // Disable logging for performance
      })
    }, 2000) // Wait 2 seconds before starting preloading
    
    return () => clearTimeout(timer)
  }, [router])

  // Auto-open NPV when a new song starts playing
  React.useEffect(() => {
    if (currentTrack && isPlaying) {
      setShowNowPlaying(true);
    }
  }, [currentTrack?.id, isPlaying]); // Trigger when song changes or play state changes

  // Show loader for 1 second on initial app load
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowInitialLoader(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Listen for Google sign-in success to show loader again
  React.useEffect(() => {
    const handleGoogleSignInSuccess = () => {
      setShowInitialLoader(true)
      
      // Hide loader after 1 second
      setTimeout(() => {
        setShowInitialLoader(false)
      }, 1000)
    }

    window.addEventListener('googleSignInSuccess', handleGoogleSignInSuccess)
    
    return () => {
      window.removeEventListener('googleSignInSuccess', handleGoogleSignInSuccess)
    }
  }, [])
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
      // When user is authenticated, immediately show main layout
      setIsAuthenticating(false)
    } else if (!user && !loading) {
      // When user is null and not loading, clear authenticating state to show AuthModal
      setIsAuthenticating(false)
    }
  }, [user, loading])

  // Always show initial loader for 1 second, then show auth loading if needed
  if (showInitialLoader) {
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
          </motion.div>
          
          {/* Loading Message */}
          <motion.div 
            className="text-center space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Show loading during auth check or active authentication ONLY when no user is present
  // Avoid showing a full-page loader during normal in-app navigation when user is authenticated
  if (!user && (loading || isAuthenticating)) {
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

  // If on auth page, render children without main layout (after all hooks are called)
  if (isAuthPage) {
    return <>{children}</>
  }

  // Only show AuthModal if truly not authenticated and not in the middle of authenticating
  if (!user && !isAuthenticating) {
    return <AuthModal />
  }

  return (
    <NavigationProvider>
      <SearchProvider>
        {/* Auto-clear search on navigation */}
        <SearchClearer />
        
        <div className="h-screen bg-gradient-to-br from-background via-background to-muted/20 flex flex-col overflow-hidden">
          {/* Animated Background for all internal pages */}
          <AnimatedBackground />

          {/* Top Navigation */}
          <div className="relative z-10">
            <TopNavigation />
          </div>

          <div className="flex flex-1 overflow-hidden relative z-10">
            {/* Left Sidebar - Fixed Width */}
            <div className="flex-shrink-0">
              <Sidebar onCreatePlaylist={() => setShowCreatePlaylistModal(true)} />
            </div>
            
            {/* Spacer between sidebar and main content */}
            <div className="w-1 flex-shrink-0"></div>

            {/* Main Content - Simplified animations for better performance */}
            <main
              className="overflow-hidden rounded-lg mb-16 bg-card/95 content flex-1 transition-opacity duration-100 relative"
              style={{ height: mainContentHeight }}
            >
              {/* Show branded loader during initial page component loading */}
              {isPageLoading && (
                <div className="absolute inset-0 bg-background z-50 flex items-center justify-center">
                  <BrandedLoader size="md" showText={false} />
                </div>
              )}
              
              {/* Page Content */}
              {children}
              
              {/* Global Search Overlay - appears over any page when searching */}
              <SearchOverlay />
            </main>

            {/* Spacer between main content and NPV */}
            {showNowPlaying && currentTrack && (
              <div className="w-1 flex-shrink-0"></div>
            )}

            {/* Now Playing Sidebar - Third Column */}
            <AnimatePresence>
              {showNowPlaying && currentTrack && (
                <motion.div
                  className="w-[320px] overflow-hidden rounded-lg mb-16 bg-card/95 flex-shrink-0"
                  style={{ height: mainContentHeight }}
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ 
                    opacity: 1, 
                    width: 320
                  }}
                  exit={{ 
                    opacity: 0, 
                    width: 0
                  }}
                  transition={{ 
                    duration: 0.15, 
                    ease: "easeInOut",
                    opacity: { duration: 0.1, delay: 0.05 }
                  }}
                >
                  <NowPlayingSidebar 
                    isOpen={true} 
                    onClose={() => setShowNowPlaying(false)}
                    isIntegrated={true}
                    playbackQueue={queue.map(track => ({
                      id: track.id,
                      title: track.title,
                      artist: track.artist,
                      album: track.album,
                      albumArt: track.albumArt,
                      duration: track.duration
                    }))}
                    currentQueueIndex={0} // TODO: Add currentQueueIndex to player state
                    onViewQueue={() => setShowQueueModal(true)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Right Spacer - Always present to maintain 4px margin */}
            <div className="w-1 flex-shrink-0"></div>
          </div>

          {/* Player Bar */}
          <div className="relative z-10">
            <PlayerBar 
              showNowPlaying={showNowPlaying}
              onToggleNowPlaying={() => {
                // Dispatch event BEFORE state change for instant sync
                window.dispatchEvent(new CustomEvent('npvToggle', { 
                  detail: { isOpen: !showNowPlaying } 
                }))
                setShowNowPlaying(!showNowPlaying)
              }}
            />
          </div>
        </div>
      </SearchProvider>

      {/* Queue Modal */}
      <AnimatePresence>
        {showQueueModal && (
          <motion.div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setShowQueueModal(false)}
          >
            <motion.div 
              className="bg-background rounded-lg w-full max-w-md max-h-[80vh] flex flex-col"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={(e) => e.stopPropagation()}
            >
            {/* Header */}
            <div className="flex items-center justify-between p-4">
              <h2 className="text-lg font-semibold">Queue</h2>
              <button 
                onClick={() => setShowQueueModal(false)}
                className="p-2 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Queue List */}
            <div className="flex-1 overflow-hidden">
              {queue.length > 0 ? (
                <VirtualizedQueueList queue={queue} />
              ) : (
                <div className="text-center py-8 p-4">
                  <Music className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No songs in queue</p>
                </div>
              )}
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Playlist Modal - Rendered at root level */}
      <CreatePlaylistModal
        isOpen={showCreatePlaylistModal}
        onClose={() => setShowCreatePlaylistModal(false)}
      />
    </NavigationProvider>
  )
}
