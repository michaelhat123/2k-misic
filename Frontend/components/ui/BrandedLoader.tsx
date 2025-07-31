"use client"

import { motion } from "framer-motion"

interface BrandedLoaderProps {
  size?: "sm" | "md" | "lg" | "xl"
  showText?: boolean
  className?: string
}

export function BrandedLoader({ 
  size = "md", 
  showText = true, 
  className = "" 
}: BrandedLoaderProps) {
  
  // Size configurations
  const sizeConfig = {
    sm: {
      iconContainer: "w-8 h-8",
      icon: "w-4 h-4",
      text: "text-sm",
      spacing: "space-y-2"
    },
    md: {
      iconContainer: "w-12 h-12",
      icon: "w-6 h-6", 
      text: "text-base",
      spacing: "space-y-3"
    },
    lg: {
      iconContainer: "w-16 h-16",
      icon: "w-8 h-8",
      text: "text-2xl",
      spacing: "space-y-4"
    },
    xl: {
      iconContainer: "w-20 h-20",
      icon: "w-10 h-10", 
      text: "text-3xl",
      spacing: "space-y-6"
    }
  }

  const config = sizeConfig[size]

  return (
    <motion.div 
      className={`flex flex-col items-center ${config.spacing} ${className}`}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Rotating Music Icon */}
      <motion.div
        className={`${config.iconContainer} bg-gradient-to-br from-primary via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg`}
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div className={`${config.icon} text-white`}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Inline version for tight spaces (just the rotating icon)
export function BrandedSpinner({ 
  size = "md",
  className = ""
}: Pick<BrandedLoaderProps, "size" | "className">) {
  
  const sizeConfig = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  }

  return (
    <motion.div
      className={`${sizeConfig[size]} bg-gradient-to-br from-primary via-blue-500 to-purple-600 rounded-lg flex items-center justify-center ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    >
      <div className="w-1/2 h-1/2 text-white">
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
        </svg>
      </div>
    </motion.div>
  )
}
