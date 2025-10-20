import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import "@/styles/electron.css"
import "@/styles/settings.css"
import { Providers } from "@/components/providers"
import { MainLayout } from "@/components/layout/main-layout"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "2k Music - Your Ultimate Music Streaming Experience",
  description: "Discover, stream, and share music with 2k Music - the next generation music platform",
  keywords: "music, streaming, playlist, discover, social music",
  generator: 'v0.dev',
  icons: {
    icon: [
      { url: '/16.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/32.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/48.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/64.ico', sizes: '64x64', type: 'image/x-icon' },
      { url: '/72.ico', sizes: '72x72', type: 'image/x-icon' },
      { url: '/96.ico', sizes: '96x96', type: 'image/x-icon' },
      { url: '/128.ico', sizes: '128x128', type: 'image/x-icon' },
      { url: '/256.ico', sizes: '256x256', type: 'image/x-icon' }
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/128.ico', sizes: '128x128', type: 'image/x-icon' },
      { url: '/256.ico', sizes: '256x256', type: 'image/x-icon' }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark electron" suppressHydrationWarning>
      <body className={`${inter.className} electron`}>
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}
