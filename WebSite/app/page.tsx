"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Headphones, Radio, Library, Download, Heart, Zap, Shield } from "lucide-react"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Footer } from "@/components/Footer"

export default function HomePage() {
  const features = [
    {
      icon: <Headphones className="w-8 h-8" />,
      title: "High-Quality Audio",
      description: "Experience crystal-clear sound with lossless audio quality up to 320kbps."
    },
    {
      icon: <Library className="w-8 h-8" />,
      title: "Massive Library",
      description: "Access millions of songs, albums, and playlists from artists worldwide."
    },
    {
      icon: <Radio className="w-8 h-8" />,
      title: "Personalized Radio",
      description: "Discover new music tailored to your taste with our smart recommendations."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Curated Playlists",
      description: "Expertly crafted playlists for every mood, genre, and occasion."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Lightning Fast",
      description: "Instant playback with no buffering. Stream seamlessly anywhere."
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Secure & Private",
      description: "Your data is protected with end-to-end encryption and privacy controls."
    }
  ]

  return (
    <ScrollArea className="h-full group relative z-0">
      <div className="pt-16">
      {/* Hero Section */}
      <section className="relative min-h-[calc(100vh-64px)] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            {/* Logo */}
            <motion.div
              className="flex justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <div className="w-24 h-24 rounded-2xl flex items-center justify-center shadow-2xl">
                <Image src="/96.ico" alt="2K Music" width={96} height={96} className="rounded-2xl" />
              </div>
            </motion.div>

            {/* Headline */}
            <h1 className="text-5xl md:text-7xl font-bold">
              <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
                2K Music
              </span>
              <br />
              <span className="text-white">Your Ultimate Music</span>
              <br />
              <span className="text-white">Streaming Companion</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
              Stream millions of songs, create playlists, and discover new music
              All in one beautiful, fast, and intuitive app.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link
                href="/download"
                className="flex items-center space-x-2 bg-gradient-to-r from-primary via-blue-500 to-purple-600 hover:opacity-90 text-white px-8 py-4 rounded-full font-semibold transition-all text-lg shadow-lg hover:shadow-primary/50 hover:scale-105"
              >
                <Download className="w-5 h-5" />
                <span>Download Now</span>
              </Link>
              <Link
                href="/features"
                className="flex items-center space-x-2 glass hover:bg-white/10 text-white px-8 py-4 rounded-full font-semibold transition-all text-lg"
              >
                <span>Learn More</span>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto pt-12">
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary">100M+</div>
                <div className="text-gray-400 text-sm md:text-base">Songs</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary">5M+</div>
                <div className="text-gray-400 text-sm md:text-base">Users</div>
              </div>
              <div>
                <div className="text-3xl md:text-4xl font-bold text-primary">50K+</div>
                <div className="text-gray-400 text-sm md:text-base">Artists</div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Why Choose <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">2K Music</span>?
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience music like never before with our powerful features designed for audiophiles.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-8 hover:bg-white/10 transition-all group"
              >
                <div className="text-primary mb-4 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-400">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 text-center space-y-6"
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white">
              Ready to Start Listening?
            </h2>
            <p className="text-xl text-gray-300">
              Join millions of music lovers and start your journey today.
            </p>
            <Link
              href="/download"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary via-blue-500 to-purple-600 hover:opacity-90 text-white px-10 py-5 rounded-full font-semibold transition-all text-lg shadow-lg hover:shadow-primary/50 hover:scale-105"
            >
              <Download className="w-5 h-5" />
              <span>Get 2K Music Free</span>
            </Link>
          </motion.div>
        </div>
      </section>
      <Footer />
    </div>
    </ScrollArea>
  )
}
