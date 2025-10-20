import type { Metadata } from "next"
import "./globals.css"
import { AnimatedBackground } from "@/components/AnimatedBackground"
import { Navigation } from "@/components/Navigation"
import { Footer } from "@/components/Footer"

export const metadata: Metadata = {
  title: "2K Music - Your Ultimate Music Streaming Companion",
  description: "Stream, discover, and enjoy millions of songs with 2K Music. Your ultimate music streaming companion.",
  keywords: ["music", "streaming", "2K Music", "songs", "audio"],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0a0a0f] text-white antialiased overflow-hidden">
        <AnimatedBackground />
        <Navigation />
        <main className="relative h-screen">
          {children}
        </main>
      </body>
    </html>
  )
}
