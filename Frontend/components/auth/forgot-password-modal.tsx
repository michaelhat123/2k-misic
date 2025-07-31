"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { authApi } from "@/lib/api/auth"

interface ForgotPasswordModalProps {
  onClose: () => void
}

type Step = "email" | "sent" | "reset"

export function ForgotPasswordModal({ onClose }: ForgotPasswordModalProps) {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState("")
  const [resetCode, setResetCode] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await authApi.sendPasswordResetEmail(email)
      setStep("sent")
      toast({
        title: "Reset email sent!",
        description: "Check your inbox for password reset instructions.",
      })
    } catch (error) {
      toast({
        title: "Failed to send reset email",
        description: "Please check your email address and try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      await authApi.resetPassword(resetCode, newPassword)
      toast({
        title: "Password reset successful!",
        description: "You can now sign in with your new password.",
      })
      onClose()
    } catch (error) {
      toast({
        title: "Password reset failed",
        description: "Invalid reset code or expired link. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setIsLoading(true)
    try {
      await authApi.sendPasswordResetEmail(email)
      toast({
        title: "Email resent!",
        description: "Check your inbox for the new reset link.",
      })
    } catch (error) {
      toast({
        title: "Failed to resend email",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.5 }}
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="glass border-0 shadow-2xl backdrop-blur-xl bg-white/10 dark:bg-black/20">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 hover:bg-muted/50">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <CardTitle className="text-xl">
                  {step === "email" && "Reset Your Password"}
                  {step === "sent" && "Check Your Email"}
                  {step === "reset" && "Create New Password"}
                </CardTitle>
              </div>
            </div>
            <CardDescription>
              {step === "email" && "Enter your email address and we'll send you a reset link"}
              {step === "sent" && "We've sent password reset instructions to your email"}
              {step === "reset" && "Enter the code from your email and create a new password"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <AnimatePresence mode="wait">
              {step === "email" && (
                <motion.form
                  key="email-form"
                  onSubmit={handleSendResetEmail}
                  className="space-y-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all"
                    />
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium"
                      disabled={isLoading || !email}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <Mail className="mr-2 h-4 w-4" />
                      Send Reset Link
                    </Button>
                  </motion.div>
                </motion.form>
              )}

              {step === "sent" && (
                <motion.div
                  key="sent-step"
                  className="space-y-6 text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  >
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                  </motion.div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold">Email Sent Successfully!</h3>
                    <p className="text-sm text-muted-foreground">We've sent password reset instructions to:</p>
                    <p className="text-sm font-medium text-primary">{email}</p>
                  </div>

                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-muted-foreground text-left">
                        <p className="mb-1">Didn't receive the email? Check your spam folder.</p>
                        <p>The reset link will expire in 15 minutes for security.</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Button
                      onClick={() => setStep("reset")}
                      className="w-full h-12 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium"
                    >
                      I Have the Reset Code
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleResendEmail}
                      disabled={isLoading}
                      className="w-full h-12 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Resend Email
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === "reset" && (
                <motion.form
                  key="reset-form"
                  onSubmit={handleResetPassword}
                  className="space-y-4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="reset-code" className="text-sm font-medium">
                      Reset Code
                    </Label>
                    <Input
                      id="reset-code"
                      type="text"
                      placeholder="Enter the 6-digit code from your email"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all text-center text-lg tracking-widest"
                      maxLength={6}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium">
                      New Password
                    </Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="Enter your new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all"
                      minLength={8}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all"
                      minLength={8}
                    />
                  </div>

                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters long and contain a mix of letters, numbers, and symbols.
                    </p>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      className="w-full h-12 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium"
                      disabled={isLoading || !resetCode || !newPassword || !confirmPassword}
                    >
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Reset Password
                    </Button>
                  </motion.div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("sent")}
                    className="w-full h-12 bg-background/50 backdrop-blur-sm hover:bg-background/80"
                  >
                    Back to Email Step
                  </Button>
                </motion.form>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
