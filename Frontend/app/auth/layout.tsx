import type React from "react"
import { WindowControls } from "@/components/layout/window-controls"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen relative">
      {/* Window Controls for Electron */}
      <div className="absolute top-4 right-4 z-50">
        <WindowControls />
      </div>
      {children}
    </div>
  )
}
