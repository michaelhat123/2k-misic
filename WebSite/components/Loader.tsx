"use client"

import { motion } from "framer-motion"
import Image from "next/image"

export function Loader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]">
      <div className="text-center">
        <motion.div
          className="w-20 h-20 rounded-xl flex items-center justify-center mx-auto mb-4"
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <Image src="/64.ico" alt="2K Music" width={64} height={64} className="rounded-xl" />
        </motion.div>
        <motion.h2
          className="text-2xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          2K Music
        </motion.h2>
        <p className="text-gray-400 text-sm mt-2">Loading...</p>
      </div>
    </div>
  )
}
