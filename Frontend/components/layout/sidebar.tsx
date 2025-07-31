"use client"

import Link from "next/link"
import { usePlayer } from "../player/player-provider"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { useNavigation } from "./navigation-context"
import {
  Home,
  Library,
  Heart,
  Clock,
  Plus,
  Music,
  Radio,
  Mic2,
  TrendingUp,
  Users,
} from "lucide-react"

const navigationItems = [
  { icon: Home, label: "Home", href: "/" },
  { icon: Library, label: "Your Library", href: "/library" },
]

const libraryItems = [
  { icon: Heart, label: "Liked Songs", href: "/liked" },
  { icon: Music, label: "Recently Played", href: "/recent" },
  { icon: Radio, label: "Radio", href: "/radio" },
  { icon: Mic2, label: "Podcasts", href: "/podcasts" },
  { icon: TrendingUp, label: "Trending", href: "/trending" },
  { icon: Users, label: "Following", href: "/following" },
]


export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { showProfile, setShowProfile, clearOverlays } = useNavigation()

  const { currentTrack } = usePlayer();
  const topNavHeight = 64; // px
  const playbarHeight = 64; // px
  const sidebarHeight = currentTrack
    ? `calc(100vh - ${topNavHeight}px - ${playbarHeight}px)`
    : `calc(100vh - 120px)`;
  const dynamicMargin = currentTrack ? "mb-24" : "mb-8";

  return (
    <aside
      className={`bg-card/95 backdrop-blur-sm rounded-lg ml-2 mr-1.5 mt-0 ${dynamicMargin} flex flex-col transition-all duration-300 shadow-lg w-16 lg:w-64`}
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
            // Special handling for Home - don't highlight when overlays are shown
            const isActive = item.href === "/" ? (pathname === item.href && !showProfile) : pathname === item.href
            
            return (
              <Button
                key={item.href}
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-center lg:justify-start h-10 px-2 lg:px-3"
                onClick={() => {
                  if (item.href === "/") {
                    // Clear all overlays when going home - NO REFRESH
                    clearOverlays()
                    // Don't navigate if already on homepage
                    if (pathname !== "/") {
                      router.push("/")
                    }
                  } else {
                    // Navigate to other pages normally
                    router.push(item.href)
                  }
                }}
              >
                <item.icon className="h-5 w-5" />
                <span className="ml-3 hidden lg:block">{item.label}</span>
              </Button>
            )
          })}
          {libraryItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={pathname === item.href ? "secondary" : "ghost"}
                className="w-full justify-center lg:justify-start h-10 px-2 lg:px-3"
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
          <Button variant="ghost" className="w-full justify-center lg:justify-start h-10 px-2 lg:px-3">
            <Plus className="h-5 w-5" />
            <span className="ml-3 hidden lg:block">Create Playlist</span>
          </Button>
        </div>
      </ScrollArea>
    </aside>
  )
}
