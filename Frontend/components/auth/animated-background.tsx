"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function AnimatedBackground() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Set mounted to true after hydration
    setMounted(true)
    
    // Only access window in browser environment
    if (typeof window === "undefined") return

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [])

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-600/5" />

      {/* Animated Gradient Orbs */}
      <motion.div
        className="absolute w-96 h-96 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full blur-3xl"
        animate={{
          x: mousePosition.x * 0.02,
          y: mousePosition.y * 0.02,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
        style={{
          left: "10%",
          top: "20%",
        }}
      />

      <motion.div
        className="absolute w-80 h-80 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl"
        animate={{
          x: mousePosition.x * -0.015,
          y: mousePosition.y * -0.015,
        }}
        transition={{ type: "spring", stiffness: 50, damping: 30 }}
        style={{
          right: "10%",
          bottom: "20%",
        }}
      />

      {/* Floating Sparkle Stars */}
      {mounted && Array.from({ length: 50 }).map((_, i) => {
        // Generate consistent random values only on client side
        const randomX = Math.random() * (typeof window !== "undefined" ? window.innerWidth : 800)
        const randomY = Math.random() * (typeof window !== "undefined" ? window.innerHeight : 600)
        const randomScale = Math.random() * 0.5 + 0.5
        const randomDuration = Math.random() * 3 + 2
        const randomEndY = Math.random() * (typeof window !== "undefined" ? window.innerHeight : 600)
        const randomEndScale = Math.random() * 0.5 + 0.5
        
        return (
          <motion.div
            key={i}
            className="absolute"
            initial={{
              x: randomX,
              y: randomY,
              scale: randomScale,
            }}
            animate={{
              y: [null, randomEndY],
              opacity: [0.8, 0.3, 0.8],
              scale: [null, randomEndScale],
              rotate: [0, 360],
            }}
            transition={{
              duration: randomDuration,
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" className="drop-shadow-[0_0_6px_rgba(255,255,255,0.8)]">
            <path
              d="M12 0L14.09 8.26L22 6L14.09 15.74L12 24L9.91 15.74L2 18L9.91 8.26L12 0Z"
              fill="white"
              className="animate-pulse"
            />
          </svg>
        </motion.div>
        )
      })}

      {/* Animated Lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.5" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {mounted && Array.from({ length: 5 }).map((_, i) => {
          // Generate consistent random values only on client side
          const randomX1 = Math.random() * 100
          const randomY1 = Math.random() * 100
          const randomX2 = Math.random() * 100
          const randomY2 = Math.random() * 100
          const randomDuration = Math.random() * 2 + 1
          
          return (
            <motion.line
              key={i}
              x1={randomX1 + "%"}
              y1={randomY1 + "%"}
              x2={randomX2 + "%"}
              y2={randomY2 + "%"}
              stroke="url(#lineGradient)"
              strokeWidth="1"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{
                duration: randomDuration,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
                delay: i * 0.2,
              }}
            />
          )
        })}
      </svg>

      {/* Pulsing Lights */}
      {mounted && Array.from({ length: 8 }).map((_, i) => {
        // Generate consistent random values only on client side
        const randomX = Math.random() * (typeof window !== "undefined" ? window.innerWidth : 800)
        const randomY = Math.random() * (typeof window !== "undefined" ? window.innerHeight : 600)
        const randomDuration = Math.random() * 2 + 1
        
        return (
          <motion.div
            key={i}
            className="absolute w-4 h-4 bg-primary/30 rounded-full blur-sm"
            initial={{
              x: randomX,
              y: randomY,
            }}
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: randomDuration,
              repeat: Number.POSITIVE_INFINITY,
              delay: i * 0.3,
            }}
          />
        )
      })}
    </div>
  )
}
