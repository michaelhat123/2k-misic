"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-purple-500/10 to-blue-600/10" />

      {/* Static Gradient Orbs */}
      <div
        className="absolute w-96 h-96 bg-gradient-to-r from-primary/30 to-blue-500/30 rounded-full blur-3xl"
        style={{
          left: "10%",
          top: "20%",
        }}
      />

      <div
        className="absolute w-80 h-80 bg-gradient-to-r from-purple-500/25 to-pink-500/25 rounded-full blur-3xl"
        style={{
          right: "10%",
          bottom: "20%",
        }}
      />

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
                repeat: Infinity,
                repeatType: "reverse",
                delay: i * 0.2,
              }}
            />
          )
        })}
      </svg>

      {/* Pulsing Lights */}
      {mounted && Array.from({ length: 8 }).map((_, i) => {
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
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        )
      })}
    </div>
  )
}
