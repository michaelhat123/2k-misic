"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface NavigationContextType {
  showProfile: boolean
  setShowProfile: (show: boolean) => void
  clearOverlays: () => void
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [showProfile, setShowProfile] = useState(false)

  const clearOverlays = () => {
    setShowProfile(false)
  }

  return (
    <NavigationContext.Provider value={{ 
      showProfile, 
      setShowProfile, 
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
