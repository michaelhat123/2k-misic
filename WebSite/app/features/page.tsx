"use client"

import { motion } from "framer-motion"
import { Headphones, Radio, Library, Download, Heart, Zap, Shield, Users, Globe, Sparkles, Music, Cloud } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Footer } from "@/components/Footer"

export default function FeaturesPage() {
  const mainFeatures = [
    {
      icon: <Headphones className="w-12 h-12" />,
      title: "High-Quality Audio",
      description: "Stream in crystal-clear quality up to 320kbps. Experience music the way artists intended.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: <Download className="w-12 h-12" />,
      title: "Offline Downloads",
      description: "Download your favorite tracks and listen without internet. Perfect for travel.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <Radio className="w-12 h-12" />,
      title: "Personalized Radio",
      description: "AI-powered stations that learn your taste and introduce you to new music you'll love.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: <Library className="w-12 h-12" />,
      title: "Massive Library",
      description: "Access over 100 million songs, from mainstream hits to indie gems.",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: <Heart className="w-12 h-12" />,
      title: "Curated Playlists",
      description: "Expertly crafted playlists for every mood, activity, and genre.",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: <Zap className="w-12 h-12" />,
      title: "Lightning Fast",
      description: "Instant playback with no buffering. Start listening in milliseconds.",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: <Shield className="w-12 h-12" />,
      title: "Secure & Private",
      description: "Your data protected with end-to-end encryption. Your listening is your business.",
      color: "from-indigo-500 to-purple-500"
    },
    {
      icon: <Users className="w-12 h-12" />,
      title: "Social Features",
      description: "Share playlists, see what friends are listening to, and discover together.",
      color: "from-teal-500 to-cyan-500"
    },
    {
      icon: <Globe className="w-12 h-12" />,
      title: "Cross-Platform",
      description: "Seamlessly sync across all your devices. Start on mobile, finish on desktop.",
      color: "from-blue-500 to-indigo-500"
    },
    {
      icon: <Sparkles className="w-12 h-12" />,
      title: "Smart Recommendations",
      description: "Discover new music tailored to your unique taste with ML-powered suggestions.",
      color: "from-violet-500 to-purple-500"
    },
    {
      icon: <Music className="w-12 h-12" />,
      title: "Live Lyrics",
      description: "Sing along with real-time, synchronized lyrics for millions of songs.",
      color: "from-pink-500 to-red-500"
    },
    {
      icon: <Cloud className="w-12 h-12" />,
      title: "Cloud Library",
      description: "Your music, playlists, and preferences backed up and synced automatically.",
      color: "from-cyan-500 to-blue-500"
    }
  ]

  return (
    <ScrollArea className="h-full group relative z-0">
    <div className="pt-16 pb-0 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Powerful <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">Features</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Experience music streaming like never before with features designed for the ultimate listening experience.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mainFeatures.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="glass rounded-2xl p-8 hover:bg-white/10 transition-all group"
            >
              <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-20 glass rounded-3xl p-12 text-center"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Experience the Best?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Start your free trial today and discover why millions love 2K Music.
          </p>
          <a
            href="/download"
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary via-blue-500 to-purple-600 hover:opacity-90 text-white px-10 py-5 rounded-full font-semibold transition-all text-lg shadow-lg hover:shadow-primary/50 hover:scale-105"
          >
            <Download className="w-5 h-5" />
            <span>Get Started Free</span>
          </a>
        </motion.div>
      </div>
      <div className="mb-20"></div>
      <Footer />
    </div>
    </ScrollArea>
  )
}
