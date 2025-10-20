"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface NavigationContextType {
  showProfile: boolean
  setShowProfile: (show: boolean) => void
  showDiscovery: boolean
  setShowDiscovery: (show: boolean) => void
  suppressDiscovery: boolean
  setSuppressDiscovery: (show: boolean) => void
  isHomeActive: boolean
  setIsHomeActive: (active: boolean) => void
  clearOverlays: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [showProfile, setShowProfile] = useState(false)
  const [showDiscovery, setShowDiscovery] = useState(false)
  const [suppressDiscovery, setSuppressDiscovery] = useState(false)
  const [isHomeActive, setIsHomeActive] = useState(false)

  const clearOverlays = () => {
    setShowProfile(false)
    setShowDiscovery(false)
    // When user clicks Home, suppress redisplaying Discovery until next search
    setSuppressDiscovery(true)
    // Activate home immediately when clearing overlays (going home)
    setIsHomeActive(true)
  }

  return (
    <NavigationContext.Provider value={{ 
      showProfile, 
      setShowProfile,
      showDiscovery,
      setShowDiscovery,
      suppressDiscovery,
      setSuppressDiscovery,
      isHomeActive,
      setIsHomeActive,
      clearOverlays 
    }}>
      {children}
    </NavigationContext.Provider>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (context === undefined) {
    throw new Error("useNavigation must be used within a NavigationProvider")
  }
  return context
}

export default NavigationProvider
