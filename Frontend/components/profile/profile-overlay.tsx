"use client"

import { motion, AnimatePresence } from "framer-motion"
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'
import { UserProfile } from "./user-profile"

interface ProfileOverlayProps {
  isVisible: boolean
  onClose?: () => void
}

export function ProfileOverlay({ isVisible, onClose }: ProfileOverlayProps) {
  if (!isVisible) {
    return null
  }

  return (
    <AnimatePresence>
      <SimpleBar className="absolute inset-0 bg-background z-50 rounded-lg" style={{ maxHeight: '100%' }} autoHide={false}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <UserProfile />
        </motion.div>
      </SimpleBar>
    </AnimatePresence>
  )
}

export default ProfileOverlay
