"use client"

import { motion } from "framer-motion"
import { Download, Smartphone, Monitor, Apple, Chrome } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Footer } from "@/components/Footer"

export default function DownloadPage() {
  const platforms = [
    {
      icon: <Monitor className="w-12 h-12" />,
      name: "Windows",
      description: "Windows 10 or later",
      downloadUrl: "#",
      size: "85 MB"
    },
    {
      icon: <Apple className="w-12 h-12" />,
      name: "macOS",
      description: "macOS 10.15 or later",
      downloadUrl: "#",
      size: "92 MB"
    },
    {
      icon: <Smartphone className="w-12 h-12" />,
      name: "iOS",
      description: "iOS 13 or later",
      downloadUrl: "#",
      size: "78 MB"
    },
    {
      icon: <Smartphone className="w-12 h-12" />,
      name: "Android",
      description: "Android 8.0 or later",
      downloadUrl: "#",
      size: "72 MB"
    },
    {
      icon: <Chrome className="w-12 h-12" />,
      name: "Web Player",
      description: "Any modern browser",
      downloadUrl: "#",
      size: "No install"
    }
  ]

  return (
    <ScrollArea className="h-full group relative z-0">
    <div className="pt-16 pb-0 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-primary via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
              <Download className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Download <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">2K Music</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Get the 2K Music app on all your devices. Stream millions of songs, 
            create playlists, and enjoy music offline, anytime, anywhere.
          </p>
        </motion.div>

        {/* Platforms */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16"
        >
          {platforms.map((platform, index) => (
            <motion.div
              key={platform.name}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="glass rounded-2xl p-8 hover:bg-white/10 transition-all group"
            >
              <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
                {platform.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{platform.name}</h3>
              <p className="text-gray-400 mb-1">{platform.description}</p>
              <p className="text-sm text-gray-500 mb-6">Size: {platform.size}</p>
              <a
                href={platform.downloadUrl}
                className="flex items-center justify-center space-x-2 bg-gradient-to-r from-primary via-blue-500 to-purple-600 hover:opacity-90 text-white px-6 py-3 rounded-full font-semibold transition-all w-full"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </a>
            </motion.div>
          ))}
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-3xl p-8 md:p-12 mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">What's Included</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Offline Downloads</h3>
                  <p className="text-gray-400">Download your favorite songs and listen without internet</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">High-Quality Audio</h3>
                  <p className="text-gray-400">Stream in up to 320kbps for crystal-clear sound</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Cross-Platform Sync</h3>
                  <p className="text-gray-400">Your playlists and library sync across all devices</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Smart Recommendations</h3>
                  <p className="text-gray-400">Discover new music based on your listening habits</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Unlimited Playlists</h3>
                  <p className="text-gray-400">Create and organize unlimited playlists</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center mt-1">
                  <span className="text-primary font-bold">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">Lyrics Support</h3>
                  <p className="text-gray-400">Read along with synchronized lyrics</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Requirements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-3xl p-8 md:p-12"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">System Requirements</h2>
          <div className="grid md:grid-cols-2 gap-8 text-gray-300">
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">Minimum</h3>
              <ul className="space-y-2">
                <li>• 4GB RAM</li>
                <li>• 500MB free storage</li>
                <li>• Internet connection (for streaming)</li>
                <li>• Audio output device</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-primary mb-4">Recommended</h3>
              <ul className="space-y-2">
                <li>• 8GB RAM or more</li>
                <li>• 2GB free storage (for offline downloads)</li>
                <li>• Broadband internet (5Mbps+)</li>
                <li>• High-quality headphones or speakers</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
      <div className="mb-20"></div>
      <Footer />
    </div>
    </ScrollArea>
  )
}
