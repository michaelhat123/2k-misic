"use client"

import { OTPVerification } from "@/components/auth/otp-verification"
import { useState } from "react"
import { useRouter } from "next/navigation"

export default function OTPPreviewPage() {
  const router = useRouter()
  const [showSuccess, setShowSuccess] = useState(false)

  const handleVerify = async (otp: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // For demo: accept "123456" as valid OTP
    if (otp === "123456") {
      // Success will be shown by the component
    } else {
      throw new Error("Invalid code. Try 123456 for demo")
    }
  }

  const handleResend = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
  }

  const handleBack = () => {
    router.push("/")
  }

  return (
    <div>
      <OTPVerification
        email="demo@2kmusic.com"
        type="email"
        onVerify={handleVerify}
        onResend={handleResend}
        onBack={handleBack}
      />
      
      {/* Demo Instructions */}
      <div className="fixed bottom-4 right-4 bg-black/80 backdrop-blur-sm text-white p-4 rounded-lg border border-white/20 max-w-xs z-50">
        <h3 className="font-bold mb-2 text-sm">🎨 Demo Instructions:</h3>
        <ul className="text-xs space-y-1 text-white/80">
          <li>• Enter code: <span className="text-[#00BFFF] font-mono">123456</span></li>
          <li>• Try paste: Ctrl+V</li>
          <li>• Wrong code = shake animation</li>
          <li>• Resend has 60s cooldown</li>
          <li>• Auto-submit when complete</li>
        </ul>
      </div>
    </div>
  )
}
