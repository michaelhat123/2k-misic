"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Download } from "lucide-react"
import { motion } from "framer-motion"
import Image from "next/image"

export function Navigation() {
  const pathname = usePathname()
  
  const links = [
    { href: "/", label: "Home" },
    { href: "/about", label: "About" },
    { href: "/features", label: "Features" },
    { href: "/download", label: "Download" },
    { href: "/contact", label: "Contact" },
  ]
  
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <Image src="/32.ico" alt="2K Music" width={32} height={32} className="rounded-lg" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
              2K Music
            </span>
          </Link>
          
          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all relative ${
                  pathname === link.href
                    ? "text-primary"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {link.label}
                {pathname === link.href && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-blue-500 to-purple-600"
                    layoutId="navbar-indicator"
                  />
                )}
              </Link>
            ))}
          </div>
          
          {/* CTA Button */}
          <Link
            href="/download"
            className="hidden md:flex items-center space-x-2 bg-gradient-to-r from-primary via-blue-500 to-purple-600 hover:opacity-90 text-white px-6 py-2.5 rounded-full font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Get App</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
