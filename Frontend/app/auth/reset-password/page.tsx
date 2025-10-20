"use client"

import React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AnimatedBackground } from '@/components/auth/animated-background'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { WindowControls } from '@/components/layout/window-controls'
import { authApi } from '@/lib/api/auth'
import { Loader2, Lock, ArrowLeft, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import { BrandedLoader } from '@/components/ui/BrandedLoader'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [email, setEmail] = React.useState('')
  const [step, setStep] = React.useState<'email' | 'code' | 'password'>('email')
  const [code, setCode] = React.useState('')
  const [newPassword, setNewPassword] = React.useState('')
  const [confirmPassword, setConfirmPassword] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [showSuccessLoader, setShowSuccessLoader] = React.useState(false)
  const [showNewPassword, setShowNewPassword] = React.useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false)
  const [passwordsMatch, setPasswordsMatch] = React.useState<boolean | null>(null)

  // On mount, check if email is in URL
  React.useEffect(() => {
    if (!searchParams) return
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(emailParam.toLowerCase())
      setStep('code') // Skip to code entry if email is provided
    }
  }, [searchParams])

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    try {
      // Fire and forget - auto-redirect to code step immediately after API call
      const promise = authApi.sendOtp(email.toLowerCase(), 'password_reset')
      
      // No toast while sending - just show button loading state
      
      // Auto-redirect immediately after starting the request
      setTimeout(() => {
        setStep('code')
        setLoading(false)
        // No toast on success - just proceed to next step
      }, 500)
      
      // Wait for response in background (don't block UI)
      await promise
    } catch (error: any) {
      setLoading(false)
      toast({
        title: 'Failed to send code',
        className: 'bg-red-500/90 text-white border-red-600',
        icon: (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
          </div>
        )
      })
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return

    setLoading(true)
    try {
      // Verify the OTP code immediately
      await authApi.verifyOtp(email, code, 'password_reset')
      // No toast - just move to next step
      setStep('password')
    } catch (error: any) {
      toast({
        title: 'Invalid code',
        className: 'bg-red-500/90 text-white border-red-600',
        icon: (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
          </div>
        )
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        className: 'bg-red-500/90 text-white border-red-600',
        icon: (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
          </div>
        )
      })
      return
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords don\'t match',
        className: 'bg-red-500/90 text-white border-red-600',
        icon: (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
          </div>
        )
      })
      return
    }

    setLoading(true)
    try {
      // Don't verify OTP again - it was already verified in step 2
      // Just reset password with the verified code
      await authApi.resetPassword(email, code, newPassword)
      
      // API finished - show loader and toast immediately
      setLoading(false)
      setShowSuccessLoader(true)
      
      // Show toast immediately (no delay)
      toast({
        title: 'Password reset successfully',
        className: 'bg-green-500/90 text-white border-green-600',
        icon: (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <Check className="w-4 h-4 text-green-600" strokeWidth={2.5} />
          </div>
        )
      })
      
      // Redirect to login after 2.5 seconds
      setTimeout(() => {
        router.replace('/')
      }, 2500)
    } catch (error: any) {
      toast({
        title: 'Password reset failed',
        className: 'bg-red-500/90 text-white border-red-600',
        icon: (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
          </div>
        )
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    setLoading(true)
    try {
      await authApi.resendOtp(email, 'password_reset')
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
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    if (step === 'code') {
      setStep('email')
      setCode('')
    } else if (step === 'password') {
      setStep('code')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordsMatch(null)
    } else {
      router.back()
    }
  }

  // Check if passwords match in real-time
  React.useEffect(() => {
    if (confirmPassword.length > 0) {
      setPasswordsMatch(newPassword === confirmPassword)
    } else {
      setPasswordsMatch(null)
    }
  }, [newPassword, confirmPassword])

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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Window Controls for Electron */}
      <div className="absolute top-4 right-4 z-50">
        <WindowControls />
      </div>
      <AnimatedBackground />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 p-4 w-full max-w-xl"
      >
        <Card className="glass border-0 shadow-2xl backdrop-blur-xl bg-white/10 dark:bg-black/20">
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Lock className="w-6 h-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold">
              {step === 'email' && 'Reset Your Password'}
              {step === 'code' && 'Enter Reset Code'}
              {step === 'password' && 'Create New Password'}
            </CardTitle>
            <CardDescription>
              {step === 'email' && 'Enter your email to receive a reset code'}
              {step === 'code' && `Enter the 6-digit code sent to ${email}`}
              {step === 'password' && 'Choose a strong password for your account'}
            </CardDescription>
          </CardHeader>

          <CardContent className="px-6 pb-6">
            {/* Step 1: Email Input */}
            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                    className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg"
                    disabled={loading || !email}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Send Reset Code
                  </Button>
                </div>
              </form>
            )}

            {/* Step 2: Code Input */}
            {step === 'code' && (
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={code} onChange={setCode} disabled={loading}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Didn't get a code?</span>
                  <Button
                    type="button"
                    variant="link"
                    className="p-0 h-auto"
                    onClick={handleResendCode}
                    disabled={loading}
                  >
                    Resend code
                  </Button>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg"
                    disabled={loading || code.length !== 6}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Verify Code
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: New Password Input */}
            {step === 'password' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">
                    New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all pr-10"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">
                    Confirm New Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all pr-10"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {passwordsMatch !== null && (
                    <p className={`text-xs ${ passwordsMatch ? 'text-green-500' : 'text-destructive' }`}>
                      {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                <div className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 6 characters long and should contain a mix of letters, numbers, and symbols for better security.
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 flex-1"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="h-12 flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg"
                    disabled={loading || !newPassword || !confirmPassword || passwordsMatch === false}
                  >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Reset Password
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
