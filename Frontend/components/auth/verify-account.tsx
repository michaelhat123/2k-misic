"use client"

import React from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnimatedBackground } from "./animated-background"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { WindowControls } from "../layout/window-controls"

interface VerifyAccountProps {
  email: string
  loading?: boolean
  onVerify: (code: string) => Promise<void> | void
  onResend?: () => Promise<void> | void
  onBack?: () => void
}

export function VerifyAccount({ email, loading = false, onVerify, onResend, onBack }: VerifyAccountProps) {
  const [code, setCode] = React.useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (code.length !== 6) return
    await onVerify(code)
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
            <CardTitle className="text-2xl font-bold">Verify your account</CardTitle>
            <CardDescription>
              Enter the 6-digit code we sent to <span className="font-medium">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <Button type="button" variant="link" className="p-0 h-auto" onClick={onResend} disabled={loading}>
                  Resend code
                </Button>
              </div>
              <div className="flex gap-3">
                {onBack && (
                  <Button type="button" variant="outline" className="h-12 flex-1" onClick={onBack} disabled={loading}>
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  className="h-12 flex-1 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg"
                  disabled={loading || code.length !== 6}
                >
                  Verify & Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
