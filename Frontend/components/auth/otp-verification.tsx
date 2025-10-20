"use client"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Mail, ArrowLeft, CheckCircle2, Sparkles, Shield } from "lucide-react"
/* eslint-disable @next/next/no-img-element */

interface OTPVerificationProps {
  email: string
  onVerify: (otp: string) => Promise<void>
  onResend: () => Promise<void>
  onBack: () => void
  type?: "email" | "password-reset"
}

export function OTPVerification({ 
  email, 
  onVerify, 
  onResend, 
  onBack,
  type = "email" 
}: OTPVerificationProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""])
  const [isVerifying, setIsVerifying] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [resendTimer, setResendTimer] = useState(0)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Countdown timer for resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendTimer])

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)
    setError("")

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }

    // Auto-submit when all fields are filled
    if (newOtp.every(digit => digit !== "") && index === 5) {
      handleVerify(newOtp.join(""))
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData("text").slice(0, 6)
    if (!/^\d+$/.test(pastedData)) return

    const newOtp = [...otp]
    pastedData.split("").forEach((char, index) => {
      if (index < 6) newOtp[index] = char
    })
    setOtp(newOtp)

    // Focus last filled input
    const lastIndex = Math.min(pastedData.length - 1, 5)
    inputRefs.current[lastIndex]?.focus()

    // Auto-submit if complete
    if (pastedData.length === 6) {
      handleVerify(pastedData)
    }
  }

  const handleVerify = async (code: string) => {
    setIsVerifying(true)
    setError("")

    try {
      await onVerify(code)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || "Invalid verification code")
      setOtp(["", "", "", "", "", ""])
      inputRefs.current[0]?.focus()
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResend = async () => {
    setIsResending(true)
    setError("")

    try {
      await onResend()
      setResendTimer(60) // 60 second cooldown
    } catch (err: any) {
      setError(err.message || "Failed to resend code")
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0a0a1a] via-[#0f0f2e] to-[#0a0a1a]">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Curved Shapes */}
        <motion.div
          className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-[#00BFFF]/20 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/4 -right-40 w-[500px] h-[500px] bg-gradient-to-br from-[#3b82f6]/20 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
        />
        <motion.div
          className="absolute -bottom-40 left-1/3 w-96 h-96 bg-gradient-to-br from-[#7c3aed]/20 to-transparent rounded-full blur-3xl"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
        />

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[#00BFFF]/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        {/* Curved Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <motion.path
            d="M0,100 Q250,50 500,100 T1000,100"
            stroke="url(#gradient1)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />
          <motion.path
            d="M0,300 Q250,250 500,300 T1000,300"
            stroke="url(#gradient2)"
            strokeWidth="2"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut", delay: 0.3 }}
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#00BFFF" stopOpacity="0" />
              <stop offset="50%" stopColor="#00BFFF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#00BFFF" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
              <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          {!success ? (
            <motion.div
              key="verification"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5 }}
              className="w-full max-w-md"
            >
              {/* Back Button */}
              <motion.button
                onClick={onBack}
                className="mb-6 flex items-center gap-2 text-white/60 hover:text-white transition-colors group"
                whileHover={{ x: -5 }}
              >
                <ArrowLeft className="w-4 h-4 group-hover:animate-pulse" />
                <span>Back</span>
              </motion.button>

              {/* Card */}
              <motion.div
                className="relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl overflow-hidden"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#00BFFF]/20 to-transparent rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-[#3b82f6]/20 to-transparent rounded-full blur-2xl" />

                {/* Content */}
                <div className="relative z-10">
                  {/* Logo */}
                  <motion.div
                    className="flex justify-center mb-6"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      damping: 15,
                      delay: 0.2 
                    }}
                  >
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-[#00BFFF] to-[#3b82f6] rounded-2xl blur-xl opacity-50"
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.5, 0.8, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                      <div className="relative w-16 h-16 bg-gradient-to-br from-[#00BFFF] to-[#3b82f6] rounded-2xl flex items-center justify-center shadow-lg">
                        <img
                          src="/apple-icon-72x72.png"
                          alt="2K Music"
                          width={40}
                          height={40}
                          className="relative z-10"
                        />
                      </div>
                    </div>
                  </motion.div>

                  {/* Icon */}
                  <motion.div
                    className="flex justify-center mb-6"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 200, 
                      damping: 10,
                      delay: 0.3 
                    }}
                  >
                    <div className="relative">
                      <motion.div
                        className="absolute inset-0 bg-[#00BFFF]/30 rounded-full blur-xl"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                        }}
                      />
                      <div className="relative w-20 h-20 bg-gradient-to-br from-[#00BFFF]/20 to-[#3b82f6]/20 rounded-full flex items-center justify-center border border-[#00BFFF]/30">
                        {type === "email" ? (
                          <Mail className="w-10 h-10 text-[#00BFFF]" />
                        ) : (
                          <Shield className="w-10 h-10 text-[#00BFFF]" />
                        )}
                      </div>
                    </div>
                  </motion.div>

                  {/* Title */}
                  <motion.div
                    className="text-center mb-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                      {type === "email" ? "Verify Your Email" : "Reset Password"}
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 0.5, delay: 0.6 }}
                      >
                        <Sparkles className="w-6 h-6 text-[#00BFFF]" />
                      </motion.div>
                    </h1>
                    <p className="text-white/60 text-sm">
                      We've sent a 6-digit code to
                    </p>
                    <p className="text-[#00BFFF] font-medium mt-1">{email}</p>
                  </motion.div>

                  {/* OTP Input */}
                  <motion.div
                    className="flex justify-center gap-3 mb-6 mt-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    {otp.map((digit, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + index * 0.05 }}
                      >
                        <input
                          ref={(el) => { inputRefs.current[index] = el }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          onPaste={index === 0 ? handlePaste : undefined}
                          className={`w-12 h-14 text-center text-2xl font-bold rounded-xl bg-white/10 border-2 transition-all duration-300 focus:outline-none focus:scale-110 ${
                            digit
                              ? "border-[#00BFFF] bg-[#00BFFF]/10 text-white"
                              : error
                              ? "border-red-500 animate-shake"
                              : "border-white/20 text-white"
                          } backdrop-blur-sm`}
                          disabled={isVerifying}
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm text-center"
                      >
                        {error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Verify Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                  >
                    <Button
                      onClick={() => handleVerify(otp.join(""))}
                      disabled={otp.some(d => !d) || isVerifying}
                      className="w-full h-12 bg-gradient-to-r from-[#00BFFF] to-[#3b82f6] hover:from-[#00BFFF]/90 hover:to-[#3b82f6]/90 text-white font-semibold rounded-xl shadow-lg shadow-[#00BFFF]/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group"
                    >
                      {isVerifying ? (
                        <motion.div
                          className="flex items-center gap-2"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <motion.div
                            className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          />
                          Verifying...
                        </motion.div>
                      ) : (
                        <>
                          <span className="relative z-10">Verify Code</span>
                          <motion.div
                            className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                            initial={{ x: "-100%" }}
                            whileHover={{ x: "100%" }}
                            transition={{ duration: 0.5 }}
                          />
                        </>
                      )}
                    </Button>
                  </motion.div>

                  {/* Resend Code */}
                  <motion.div
                    className="mt-6 text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <p className="text-white/60 text-sm mb-2">
                      Didn't receive the code?
                    </p>
                    {resendTimer > 0 ? (
                      <p className="text-white/40 text-sm">
                        Resend in {resendTimer}s
                      </p>
                    ) : (
                      <button
                        onClick={handleResend}
                        disabled={isResending}
                        className="text-[#00BFFF] hover:text-[#00BFFF]/80 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isResending ? "Sending..." : "Resend Code"}
                      </button>
                    )}
                  </motion.div>
                </div>
              </motion.div>

              {/* Security Note */}
              <motion.p
                className="text-center text-white/40 text-xs mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                🔒 This code will expire in 10 minutes
              </motion.p>
            </motion.div>
          ) : (
            // Success State
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                className="relative inline-block mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 10,
                  delay: 0.2 
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-green-500/30 rounded-full blur-2xl"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
                <CheckCircle2 className="w-24 h-24 text-green-500 relative z-10" />
              </motion.div>
              <motion.h2
                className="text-3xl font-bold text-white mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Verification Successful!
              </motion.h2>
              <motion.p
                className="text-white/60"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {type === "email" 
                  ? "Your email has been verified successfully"
                  : "You can now reset your password"}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add shake animation to globals.css */}
      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}
