"use client"

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { useToast } from '@/hooks/use-toast'
import { VerifyAccount } from '@/components/auth/verify-account'
import { AlertCircle, Check } from 'lucide-react'
import { BrandedLoader } from '@/components/ui/BrandedLoader'
import { AnimatedBackground } from '@/components/auth/animated-background'

export default function VerifyPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { verifyOtp, resendOtp, login } = useAuth()
  const { toast } = useToast()

  const [email, setEmail] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [showSuccessLoader, setShowSuccessLoader] = React.useState(false)

  // On mount, resolve email from query or sessionStorage
  React.useEffect(() => {
    if (!searchParams) return
    const sp = searchParams
    const qEmail = sp.get('email') || ''
    const ssEmail = typeof window !== 'undefined' ? (sessionStorage.getItem('pending_signup_email') || '') : ''
    const resolved = (qEmail || ssEmail).trim()
    if (!resolved) {
      if (typeof window !== 'undefined') {
        window.location.assign('/')
      }
      return
    }
    setEmail(resolved.toLowerCase())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleVerify = async (rawCode: string) => {
    if (!email) return
    const code = (rawCode || '').replace(/\D/g, '')
    if (code.length !== 6) return
    setLoading(true)
    try {
      await verifyOtp(email, code, 'verification')
      
      // CRITICAL: Wait 150ms for backend cache invalidation to propagate
      // This prevents auto-login from using stale cached user with isVerified: false
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Auto-login if we have the stored password
      const password = sessionStorage.getItem('pending_signup_password') || sessionStorage.getItem('pending_login_password')
      if (password) {
        await login(email, password)
      }
      // Cleanup
      sessionStorage.removeItem('pending_signup_email')
      sessionStorage.removeItem('pending_signup_password')
      sessionStorage.removeItem('pending_login_password')
      
      // Show success loader and toast
      setLoading(false)
      setShowSuccessLoader(true)
      
      toast({
        title: 'Account verified successfully',
        className: 'bg-green-500/90 text-white border-green-600',
        icon: (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-green-600" strokeWidth={2.5} />
          </div>
        )
      })
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.replace('/')
      }, 2000)
    } catch (error: any) {
      setLoading(false)
      toast({
        title: 'Invalid or expired code',
        className: 'bg-red-500/90 text-white border-red-600',
        icon: (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
          </div>
        )
      })
    }
  }

  const handleResend = async () => {
    if (!email) return
    try {
      // Use resendOtp instead of sendOtp for better backend handling
      await resendOtp(email, 'verification')
      toast({
        title: 'Code resent',
        className: 'bg-green-500/90 text-white border-green-600',
        icon: (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-green-600" strokeWidth={2.5} />
          </div>
        )
      })
    } catch (error: any) {
      toast({
        title: 'Failed to resend code',
        className: 'bg-red-500/90 text-white border-red-600',
        icon: (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
          </div>
        )
      })
    }
  }

  const handleBack = () => {
    router.back()
  }

  if (!email) return null

  // Show success loader with toast
  if (showSuccessLoader) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <AnimatedBackground />
        <div className="relative z-[1] flex flex-col items-center space-y-6">
          <BrandedLoader size="md" showText={false} />
        </div>
      </div>
    )
  }

  return (
    <VerifyAccount
      email={email}
      loading={loading}
      onVerify={handleVerify}
      onResend={handleResend}
      onBack={handleBack}
    />
  )
}
