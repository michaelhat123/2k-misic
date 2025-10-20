"use client"

import { motion } from "framer-motion"
import { Music, Users, Globe, Award, Sparkles, Handshake } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Footer } from "@/components/Footer"

export default function AboutPage() {
  const stats = [
    { icon: <Users className="w-8 h-8" />, value: "5M+", label: "Active Users" },
    { icon: <Music className="w-8 h-8" />, value: "100M+", label: "Songs" },
    { icon: <Globe className="w-8 h-8" />, value: "180+", label: "Countries" },
    { icon: <Award className="w-8 h-8" />, value: "50K+", label: "Artists" },
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
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            About <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">2K Music</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            We're on a mission to bring the world's music to everyone, everywhere. 
            Experience unlimited streaming, discover new artists, and enjoy your favorite songs anytime, anywhere.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-20"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="glass rounded-2xl p-6 text-center hover:bg-white/10 transition-all"
            >
              <div className="text-primary mb-3 flex justify-center">{stat.icon}</div>
              <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-gray-400 text-sm">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-3xl p-8 md:p-12 mb-12 space-y-6"
        >
          <h2 className="text-3xl font-bold text-white mb-6">Our Story</h2>
          <p className="text-gray-300 leading-relaxed text-lg">
            Founded in 2020, 2K Music began with a simple idea: make music accessible to everyone. 
            We believed that great music should be easy to discover, stream, and share, without compromising on quality or user experience.
          </p>
          <p className="text-gray-300 leading-relaxed text-lg">
            What started as a small team of music enthusiasts has grown into a global platform serving millions of users worldwide. 
            We've built partnerships with major and independent labels, ensuring our catalog includes everything from chart-topping hits to emerging artists.
          </p>
          <p className="text-gray-300 leading-relaxed text-lg">
            Today, 2K Music continues to innovate, bringing new features and improvements that enhance how you discover and enjoy music. 
            Our commitment remains the same: deliver the best possible music streaming experience to our users.
          </p>
        </motion.div>

        {/* Mission & Vision */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="glass rounded-3xl p-8 md:p-10"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Our Mission</h2>
            <p className="text-gray-300 leading-relaxed">
              To democratize music streaming by providing universal access to high-quality audio content, 
              empowering artists, and creating meaningful connections between music and listeners worldwide.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-3xl p-8 md:p-10"
          >
            <h2 className="text-2xl font-bold text-white mb-4">Our Vision</h2>
            <p className="text-gray-300 leading-relaxed">
              To become the world's most beloved music platform, where every listener finds their soundtrack 
              and every artist reaches their audience, powered by innovation and passion for music.
            </p>
          </motion.div>
        </div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass rounded-3xl p-8 md:p-12"
        >
          <h2 className="text-3xl font-bold text-white mb-8 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 flex items-center justify-center">
                  <Music className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Music First</h3>
              <p className="text-gray-300">
                Every decision we make prioritizes the music and the artists who create it.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Innovation</h3>
              <p className="text-gray-300">
                We continuously push boundaries to deliver cutting-edge features and experiences.
              </p>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center">
                  <Handshake className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-primary mb-2">Community</h3>
              <p className="text-gray-300">
                We build connections between fans, artists, and music lovers around the world.
              </p>
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
