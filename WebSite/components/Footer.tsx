"use client"

import Link from "next/link"
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react"
import Image from "next/image"

export function Footer() {
  const currentYear = new Date().getFullYear()
  
  return (
    <footer className="relative glass border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                <Image src="/32.ico" alt="2K Music" width={32} height={32} className="rounded-lg" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent">
                2K Music
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              Your ultimate music streaming companion. Stream, discover, and enjoy millions of songs.
            </p>
            {/* Social Links */}
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Youtube className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          {/* Product */}
          <div>
            <h3 className="font-semibold text-white mb-4">Product</h3>
            <ul className="space-y-2">
              <li><Link href="/features" className="text-gray-400 hover:text-primary transition-colors text-sm">Features</Link></li>
              <li><Link href="/download" className="text-gray-400 hover:text-primary transition-colors text-sm">Download</Link></li>
              <li><Link href="/pricing" className="text-gray-400 hover:text-primary transition-colors text-sm">Pricing</Link></li>
            </ul>
          </div>
          
          {/* Company */}
          <div>
            <h3 className="font-semibold text-white mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link href="/about" className="text-gray-400 hover:text-primary transition-colors text-sm">About Us</Link></li>
              <li><Link href="/contact" className="text-gray-400 hover:text-primary transition-colors text-sm">Contact</Link></li>
              <li><Link href="/careers" className="text-gray-400 hover:text-primary transition-colors text-sm">Careers</Link></li>
            </ul>
          </div>
          
          {/* Legal */}
          <div>
            <h3 className="font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-gray-400 hover:text-primary transition-colors text-sm">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-400 hover:text-primary transition-colors text-sm">Terms of Service</Link></li>
              <li><Link href="/cookies" className="text-gray-400 hover:text-primary transition-colors text-sm">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>
        
        {/* Bottom */}
        <div className="mt-12 pt-8 border-t border-white/10 text-center text-gray-400 text-sm">
          <p>&copy; {currentYear} 2K Music. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
