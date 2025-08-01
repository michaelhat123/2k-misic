"use client"

import { useState, useEffect, createContext, useContext } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "../auth/auth-provider"
import { Search, Bell, Settings, User, LogOut, ChevronLeft, ChevronRight, Home, UserCog, HelpCircle } from "lucide-react"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { useQuery } from "@tanstack/react-query"
import { searchApi } from "@/lib/api/search"
import { debounce } from "@/lib/utils"
import Link from "next/link"
import { useNavigation } from "./navigation-context"

// Search Context for real-time search state
interface SearchContextType {
  searchQuery: string
  setSearchQuery: (query: string) => void
  searchResults: any
  isSearching: boolean
  clearSearch: () => void
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export const useSearch = () => {
  const context = useContext(SearchContext)
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider')
  }
  return context
}

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")

  const debouncedSearch = debounce((value: string) => {
    setDebouncedQuery(value)
  }, 800)

  useEffect(() => {
    debouncedSearch(searchQuery)
  }, [searchQuery, debouncedSearch])

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["live-search", debouncedQuery],
    queryFn: () => searchApi.search(debouncedQuery, "all", 30),
    enabled: debouncedQuery.length > 0,
    staleTime: 1000 * 30, // 30 seconds
  })

  const clearSearch = () => {
    setSearchQuery("")
    setDebouncedQuery("")
  }

  return (
    <SearchContext.Provider value={{
      searchQuery,
      setSearchQuery,
      searchResults,
      isSearching,
      clearSearch
    }}>
      {children}
    </SearchContext.Provider>
  )
}

export function TopNavigation() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const { searchQuery, setSearchQuery, searchResults, isSearching, clearSearch } = useSearch()
  const { showProfile, setShowProfile, clearOverlays } = useNavigation()

  // Debug top nav user data
  useEffect(() => {

  }, [user])
  
  // 🚀 OLD CUSTOM EVENT LISTENERS REMOVED - USING SOCKET.IO NOW!
  // The auth context now handles real-time updates via Socket.IO

  return (
    <motion.header
      className="h-16 flex items-center justify-between px-6"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Navigation Controls */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            clearOverlays() // Clear all overlays when navigating
            clearSearch()
          }}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-muted-foreground hover:text-foreground"
          onClick={() => {
            clearOverlays() // Clear all overlays when navigating  
            clearSearch()
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Home Icon + Search Bar */}
      <div className="flex items-center space-x-3 flex-1 max-w-md mx-8">
        {/* Home Icon - Highlighted when on homepage AND no overlays */}
        <button
          onClick={() => {
            clearOverlays();
            clearSearch();
          }}
          className={`h-10 w-10 rounded-full flex items-center justify-center transition-colors duration-150 focus:outline-none border-none p-0 ${(pathname === "/" && !showProfile && !searchQuery) ? 'bg-gradient-to-br from-primary to-blue-600' : 'bg-secondary'} `}
        >
          <Home className="h-5 w-5 text-white" />
        </button>
        
        {/* Rounded Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="What do you want to play?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-4 h-12 rounded-full bg-background/50 border-border/50 focus:bg-background hover:bg-background/80 transition-colors"
          />
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center space-x-2">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">3</Badge>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage 
                  src={(() => {
                    const finalSrc = user?.picture || user?.profilePicture || undefined
                    console.log('🖼️ TOP NAVBAR DEBUG:', {
                      user: user,
                      userPicture: user?.picture,
                      userProfilePicture: user?.profilePicture,
                      finalSrc: finalSrc
                    })
                    return finalSrc
                  })()} 
                  alt={user?.name || user?.email || 'User'} 
                  className="object-cover"
                  onLoad={() => console.log('✅ TOP NAVBAR: Avatar loaded successfully:', user?.picture)}
                  onError={() => console.log('❌ TOP NAVBAR: Avatar failed to load:', user?.picture)}
                />
                <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white font-semibold">
                  {(user?.name || user?.email || 'U').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40" align="end" forceMount>
            <DropdownMenuItem>
              <UserCog className="mr-2 h-4 w-4" />
              <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem 
              className="cursor-pointer"
              onClick={() => {
                clearSearch() // Clear search when showing profile
                clearOverlays()
                setShowProfile(true)
              }}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Support</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
