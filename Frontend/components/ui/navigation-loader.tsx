"use client"

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface NavigationLoaderProps {
  isVisible: boolean
}

export function NavigationLoader({ isVisible }: NavigationLoaderProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-primary via-blue-500 to-purple-600"
          initial={{ scaleX: 0, transformOrigin: "left" }}
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 0, transformOrigin: "right" }}
          transition={{ duration: 0.15, ease: "easeOut" }}
        />
      )}
    </AnimatePresence>
  )
}
