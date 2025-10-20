"use client"

import Link from "next/link"
import { usePlayer } from "../player/player-provider"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useNavigation } from "./navigation-context"
import { setupRoutePreloader } from "@/lib/route-preloader"
import CreatePlaylistModal from "@/components/playlist/create-playlist-modal"
import {
  Home,
  Clock,
  Plus,
  Music,
  Radio,
  Mic2,
  TrendingUp,
  Users,
  Library,
  ListMusic,
  Heart,
  Download,
  Zap,
} from "lucide-react"

const navigationItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Radio, label: "Discover", href: "/discover" },
  { icon: Heart, label: "Liked Songs", href: "/liked-songs" },
]

const libraryItems = [
  { icon: Library, label: "Your Library", href: "/saved-songs" },
  { icon: Music, label: "Recently Played", href: "/recent" },
  { icon: ListMusic, label: "Playlists", href: "/playlists" },
  { icon: TrendingUp, label: "Trending", href: "/trending" },
  { icon: Download, label: "Local Files", href: "/downloads" },
  { icon: Zap, label: "BeatMatch", href: "/beatmatch-preview" },
]


interface SidebarProps {
  onCreatePlaylist?: () => void;
}

export default function Sidebar({ onCreatePlaylist }: SidebarProps = {}) {
  const pathname = usePathname()
  const router = useRouter()
  const { currentTrack } = usePlayer()
  const { showProfile, showDiscovery, suppressDiscovery, clearOverlays, setIsHomeActive } = useNavigation()
  const topNavHeight = 64; // px
  const playbarHeight = 64; // px
  const sidebarHeight = currentTrack
    ? `calc(100vh - ${topNavHeight}px - ${playbarHeight}px)`
    : `calc(100vh - 120px)`;
  const dynamicMargin = currentTrack ? "mb-24" : "mb-8";

  // 🚀 OPTIMIZED ROUTE PRELOADING: Delayed and throttled to avoid blocking UI
  useEffect(() => {
    // Delay preloading to avoid blocking initial render
    const timer = setTimeout(() => {
      const preloader = setupRoutePreloader(router, {
        delay: 200, // Slower preloading to avoid blocking UI
        enableLogging: false // Disable logging for performance
      })
    }, 1000) // Wait 1 second before starting preloading
    
    return () => clearTimeout(timer)
  }, [router])

  return (
    <aside
      className={`bg-card/95 backdrop-blur-sm rounded-lg ml-1 mt-0 ${dynamicMargin} flex flex-col transition-all duration-300 shadow-lg w-16 lg:w-64`}
      style={{ height: sidebarHeight }}
    >
      {/* Logo */}
      <div className="p-4 flex items-center justify-center lg:justify-start">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text hidden lg:block">2k Music</span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        {/* Unified Navigation */}
        <div className="space-y-1">
          {navigationItems.map((item) => {
            // Special handling for Home
            const isHome = item.href === "/"
            // Active when on "/" and no profile overlay and either discovery is not showing or it is suppressed (after clicking Home)
            const isActive = isHome 
              ? (pathname === item.href && !showProfile && (!showDiscovery || suppressDiscovery)) 
              : pathname === item.href

            if (isHome) {
              return (
                <Link 
                  key={item.href} 
                  href={item.href} 
                  prefetch 
                  onClick={() => {
                    // Trigger immediate content-area loader
                    window.dispatchEvent(new Event('contentNavStart'))
                    // Turn home icon blue immediately
                    setIsHomeActive(true)
                    clearOverlays()
                  }}
                  onMouseEnter={() => router.prefetch(item.href)}
                >
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className="w-full justify-center lg:justify-start h-10 px-2 lg:px-3 transition-all duration-75 active:scale-95 hover:scale-[1.02]"
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="ml-3 hidden lg:block">{item.label}</span>
                  </Button>
                </Link>
              )
            }

            return (
              <Link 
                key={item.href} 
                href={item.href} 
                prefetch
                onMouseEnter={() => router.prefetch(item.href)}
                onClick={() => {
                  window.dispatchEvent(new Event('contentNavStart'))
                }}
              >
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className="w-full justify-center lg:justify-start h-10 px-2 lg:px-3 transition-all duration-75 active:scale-95 hover:scale-[1.02]"
                >
                  <item.icon className="h-5 w-5" />
                  <span className="ml-3 hidden lg:block">{item.label}</span>
                </Button>
              </Link>
            )
          })}
          {libraryItems.map((item) => (
            <Link 
              key={item.href} 
              href={item.href} 
              prefetch
              onMouseEnter={() => router.prefetch(item.href)}
              onClick={() => {
                window.dispatchEvent(new Event('contentNavStart'))
                // Turn off home active state when navigating to library
                setIsHomeActive(false)
              }}
            >
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-center lg:justify-start h-10 px-2 lg:px-3 transition-all duration-75 active:scale-95 hover:scale-[1.02]"
              >
                <item.icon className="h-5 w-5" />
                <span className="ml-3 hidden lg:block">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>

        <Separator className="my-4" />

        {/* Create Playlist */}
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            className="w-full justify-center lg:justify-start h-10 px-2 lg:px-3 transition-all duration-75 active:scale-95 hover:scale-[1.02]"
            onClick={onCreatePlaylist}
          >
            <Plus className="h-5 w-5" />
            <span className="ml-3 hidden lg:block">Create Playlist</span>
          </Button>
        </div>
      </ScrollArea>

    </aside>
  )
}
