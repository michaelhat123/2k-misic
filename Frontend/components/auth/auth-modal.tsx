"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "./auth-provider"
import { motion, AnimatePresence } from "framer-motion"
import { Music, Loader2, Mail, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AnimatedBackground } from "./animated-background"
import { WindowControls } from "../layout/window-controls"
import { useRouter } from "next/navigation"
import { ScrollArea } from "../ui/scroll-area"
import { cn } from "@/lib/utils"

export function AuthModal() {
  const [isFormLoading, setIsFormLoading] = useState(false) // For form submission loading
  const [activeTab, setActiveTab] = useState("login")
  const [googleAuthLoading, setGoogleAuthLoading] = useState(false)
  const [googleAuthTimeout, setGoogleAuthTimeout] = useState(false)
  const router = useRouter()
  const { login, register, googleSignIn, verifyOtp, sendOtp } = useAuth()
  const { toast } = useToast()

  // Signup → OTP state
  const [signupEmail, setSignupEmail] = useState("")
  const [signupPassword, setSignupPassword] = useState("")
  
  // Google auth cleanup refs
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const focusListenerRef = useRef<(() => void) | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsFormLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = (formData.get("email") as string).trim()
    const password = (formData.get("password") as string)

    // Basic client-side validation for login
    const loginErrors: string[] = []
    const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/
    if (!email || !emailRegex.test(email)) loginErrors.push('Email must be valid')
    if (!password || password.length < 6) loginErrors.push('Password must be at least 6 characters long')
    if (loginErrors.length) {
      toast({
        title: 'Invalid email or password',
        className: 'bg-red-500/90 text-white border-red-600',
        icon: (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
          </div>
        )
      })
      setIsFormLoading(false)
      return
    }

    try {
      await login(email, password)
      
      // Login successful - let auth provider handle redirect naturally
      setIsFormLoading(false) // Clear form loading only
    } catch (error: any) {
      // If the backend requires verification, redirect immediately to verify page
      if (typeof error?.message === 'string' && error.message.toLowerCase().includes('verify')) {
        const normalizedEmail = email.toLowerCase()
        sessionStorage.setItem('pending_login_password', password)
        sessionStorage.setItem('pending_signup_email', normalizedEmail)
        
        // Send OTP and wait for it to start (but keep loading state)
        sendOtp(normalizedEmail, 'verification')
          .then(() => {})
          .catch(() => {
            // Continue to verify page even if send fails - user can resend manually
          })
        
        // Small delay to ensure OTP request is initiated
        setTimeout(() => {
          router.push(`/auth/verify?email=${encodeURIComponent(normalizedEmail)}`)
        }, 100)
        
        return // Exit early to prevent showing error toast and clearing loading
      } else {
        setIsFormLoading(false) // Clear form loading on error
        toast({
          title: "Invalid email or password",
          className: 'bg-red-500/90 text-white border-red-600',
          icon: (
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
            </div>
          )
        })
      }
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsFormLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = (formData.get("email") as string).trim()
    const password = (formData.get("password") as string)
    const name = (formData.get("name") as string).trim()

    try {
      // Client-side validation for signup
      const errors: string[] = []
      const emailRegex = /[^@\s]+@[^@\s]+\.[^@\s]+/
      if (!name) errors.push('Name is required')
      if (!email || !emailRegex.test(email)) errors.push('Email must be valid')
      if (!password || password.length < 6) errors.push('Password must be at least 6 characters long')
      if (errors.length) {
        toast({
          title: errors.join(' • '),
          className: 'bg-red-500/90 text-white border-red-600',
          icon: (
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
            </div>
          )
        })
        setIsFormLoading(false)
        return
      }

      const result = await register(email, password, name)

      // INSTANT redirect - happens immediately after API response
      const normalizedEmail = result.email.toLowerCase()
      
      // Persist signup info (sync operations - no delays)
      sessionStorage.setItem('pending_signup_email', normalizedEmail)
      sessionStorage.setItem('pending_signup_password', password)
      
      // Use Next.js router for instant navigation (no page reload)
      router.push(`/auth/verify?email=${encodeURIComponent(normalizedEmail)}`)
      
      // Don't clear loading - let redirect happen with loading active
    } catch (error: any) {
      setIsFormLoading(false) // Clear form loading on error

      if (error?.status === 409) {
        // Email already exists
        toast({
          title: "Email already exists",
          className: 'bg-red-500/90 text-white border-red-600',
          icon: (
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
            </div>
          )
        })
      } else {
        toast({
          title: "Registration failed",
          className: 'bg-red-500/90 text-white border-red-600',
          icon: (
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
            </div>
          )
        })
      }
    }
  }

  // Inline OTP handlers removed; verification handled on dedicated page

  const handleSocialAuth = async (provider: "spotify" | "google") => {
    if (provider === "google") {
      setGoogleAuthLoading(true)
      
      // Track completion state
      let authCheckCompleted = false
      let successHandled = false
      
      // Listen for auth completion
      const handleAuthSuccess = (event: any) => {
        if (successHandled) {
          return
        }
        successHandled = true
        
        // Immediately stop polling and timeout
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current)
          pollIntervalRef.current = null
        }
        if (focusListenerRef.current) {
          window.removeEventListener('focus', focusListenerRef.current)
          focusListenerRef.current = null
        }
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        
        setGoogleAuthLoading(false)
        
        // Wait for auth provider to set user state, then redirect
        // Auth provider will handle showing the main layout
      }
      
      const handleAuthError = (event: any) => {
        
        // Clear timeout on error
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
          timeoutRef.current = null
        }
        
        setGoogleAuthLoading(false)
        toast({
          title: "Authentication failed",
          className: 'bg-red-500/90 text-white border-red-600',
          icon: (
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
            </div>
          )
        })
      }
      
      window.addEventListener('googleSignInSuccess', handleAuthSuccess as EventListener)
      window.addEventListener('googleSignInError', handleAuthError as EventListener)
      
      // For Electron: Check for auth when window regains focus
      const isElectron = typeof window !== 'undefined' && 
                        window.navigator.userAgent.toLowerCase().includes('electron')
      
      const checkAuthStatus = async () => {
        if (authCheckCompleted) {
          return
        }
        
        try {
          
          // Check the electron-auth endpoint for pending auth
          const response = await fetch('http://localhost:3000/api/electron-auth')
          const data = await response.json()
          
          if (data.success && data.access_token) {
            authCheckCompleted = true
            
            // Store tokens in Electron app's localStorage
            localStorage.setItem('auth_token', data.access_token)
            if (data.refresh_token) {
              localStorage.setItem('refresh_token', data.refresh_token)
            }
            
            // Store a flag to show branded loader when returning to app
            localStorage.setItem('show_auth_loader', 'true')
            
            // Stop polling and timeout immediately
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current)
              pollIntervalRef.current = null
            }
            if (focusListenerRef.current) {
              window.removeEventListener('focus', focusListenerRef.current)
              focusListenerRef.current = null
            }
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
              timeoutRef.current = null
            }
            
            // Dispatch success event after a brief moment to ensure loader is shown
            setTimeout(() => {
              window.dispatchEvent(new CustomEvent('googleSignInSuccess', { 
                detail: { user: data.user, token: data.access_token } 
              }))
            }, 100)
            return
          }
          
          // Fallback: check if we already have a token
          const token = localStorage.getItem('auth_token')
          if (token) {
            const { authApi } = await import('@/lib/api/auth')
            const profile = await authApi.getProfile()
            
            if (profile) {
              authCheckCompleted = true
              
              // Stop polling and timeout immediately
              if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current)
                pollIntervalRef.current = null
              }
              if (focusListenerRef.current) {
                window.removeEventListener('focus', focusListenerRef.current)
                focusListenerRef.current = null
              }
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
              }
              
              window.dispatchEvent(new CustomEvent('googleSignInSuccess', { 
                detail: { user: profile, token } 
              }))
            }
          }
        } catch (e: any) {
          // Silent fail
        }
      }
      
      if (isElectron) {
        // Check on window focus (when user returns from browser)
        focusListenerRef.current = () => {
          checkAuthStatus()
        }
        window.addEventListener('focus', focusListenerRef.current)
        
        // Also poll every 3 seconds as backup
        pollIntervalRef.current = setInterval(checkAuthStatus, 3000)
      }
      
      // Set 5-minute timeout
      timeoutRef.current = setTimeout(() => {
        setGoogleAuthLoading(false)
        setGoogleAuthTimeout(true)
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        if (focusListenerRef.current) window.removeEventListener('focus', focusListenerRef.current)
        window.removeEventListener('googleSignInSuccess', handleAuthSuccess as EventListener)
        window.removeEventListener('googleSignInError', handleAuthError as EventListener)
      }, 300000) // 5 minutes
      
      try {
        googleSignIn() // This opens popup or external browser
      } catch (error: any) {
        setGoogleAuthLoading(false)
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
        if (focusListenerRef.current) window.removeEventListener('focus', focusListenerRef.current)
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        window.removeEventListener('googleSignInSuccess', handleAuthSuccess as EventListener)
        window.removeEventListener('googleSignInError', handleAuthError as EventListener)
        toast({
          title: "Failed to start authentication",
          className: 'bg-red-500/90 text-white border-red-600',
          icon: (
            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
            </div>
          )
        })
      }
    } else if (provider === "spotify") {
      toast({
        title: "Spotify Authentication",
        description: "Spotify authentication is coming soon!",
        variant: "default",
      })
    }
  }

  const handleMagicLink = async () => {

    setIsFormLoading(true)
    try {
      // Magic link implementation would go here
      toast({
        title: "Magic link feature",
        description: "Magic link authentication is coming soon!",
      })
    } catch (error: any) {
      toast({
        title: "Failed to send magic link",
        className: 'bg-red-500/90 text-white border-red-600',
        icon: (
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />
          </div>
        )
      })
    } finally {
      setIsFormLoading(false)
    }
  }

  return (
    <div className="h-screen flex flex-col relative">
        {/* Window Controls for Electron */}
        <div className="fixed top-4 right-4 z-50">
          <WindowControls />
        </div>
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <AnimatedBackground />
        </div>
        
        {/* Scrollable Content Area */}
        <ScrollArea className={cn("flex-1 group", (googleAuthLoading || googleAuthTimeout) && "hide-scrollbar")}>
          <div className="min-h-full flex items-start justify-center pt-14 pb-8 px-4">

        {/* Google Auth Loading/Timeout Page */}
        {googleAuthLoading ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 p-4 w-full max-w-2xl"
            >
              <div className="glass border-0 shadow-2xl backdrop-blur-xl bg-white/10 dark:bg-black/20 rounded-2xl px-12 py-20">
                <div className="text-center space-y-12">
                  {/* 2K Music Logo */}
                  <motion.div
                    className="flex items-center justify-center mx-auto"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <img 
                      src="/64.ico" 
                      alt="2K Music" 
                      className="w-16 h-16"
                    />
                  </motion.div>

                  {/* Message */}
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-3">
                      Finish signing in on your browser
                    </h3>
                    <p className="text-gray-300 text-base leading-relaxed">
                      You'll be redirected once you've signed in
                    </p>
                  </div>

                  {/* Cancel Button */}
                  <Button
                    className="bg-sky-500 hover:bg-sky-600 text-white transition-all duration-300 text-sm py-2.5 px-8 rounded-full font-medium mx-auto"
                    onClick={() => {
                      // Clean up intervals and listeners
                      if (pollIntervalRef.current) {
                        clearInterval(pollIntervalRef.current)
                        pollIntervalRef.current = null
                      }
                      if (focusListenerRef.current) {
                        window.removeEventListener('focus', focusListenerRef.current)
                        focusListenerRef.current = null
                      }
                      if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current)
                        timeoutRef.current = null
                      }
                      
                      setGoogleAuthLoading(false)
                    }}
                  >
                    CANCEL
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : googleAuthTimeout ? (
          <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative z-10 p-4 w-full max-w-2xl"
            >
              <div className="glass border-0 shadow-2xl backdrop-blur-xl bg-white/10 dark:bg-black/20 rounded-2xl px-12 py-20">
                <div className="text-center space-y-12">
                  {/* 2K Music Logo */}
                  <motion.div
                    className="flex items-center justify-center mx-auto"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <img 
                      src="/64.ico" 
                      alt="2K Music" 
                      className="w-16 h-16"
                    />
                  </motion.div>

                  {/* Timeout Message */}
                  <div>
                    <h3 className="text-2xl font-semibold text-white mb-4">
                      Your session timed out
                    </h3>
                    <p className="text-gray-300 text-base leading-relaxed">
                      Due to inactivity, we couldn't sign you in. Return to the 2k Music app to try the process again.
                    </p>
                  </div>

                  {/* Go Back Button */}
                  <Button
                    className="bg-sky-500 hover:bg-sky-600 text-white transition-all duration-300 text-sm py-2.5 px-8 rounded-full font-medium mx-auto"
                    onClick={() => {
                      setGoogleAuthTimeout(false)
                    }}
                  >
                    GO BACK
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        ) : (
          /* Main Auth Card */
          <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 p-4 w-full max-w-xl"
        >
          <Card className="glass border-0 shadow-2xl backdrop-blur-xl bg-white/10 dark:bg-black/20">
            <CardHeader className="text-center pb-6">
              <motion.div
                className="flex items-center justify-center space-x-3 mb-6"
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <motion.div
                  className="w-12 h-12 flex items-center justify-center"
                  whileHover={{ rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <img 
                    src="/64.ico" 
                    alt="2K Music" 
                    className="w-12 h-12"
                  />
                </motion.div>
                <motion.span
                  className="text-3xl font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-600 bg-clip-text text-transparent"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  2k Music
                </motion.span>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              </motion.div>
            </CardHeader>

            <CardContent className="px-6 pb-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-transparent p-0 h-auto space-x-2">
                  <TabsTrigger
                    value="login"
                    className="relative rounded-xl h-12 px-6 font-medium transition-all duration-300 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  >
                    {activeTab === "login" && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-xl"
                        layoutId="activeTab"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">Login</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="signup"
                    className="relative rounded-xl h-12 px-6 font-medium transition-all duration-300 data-[state=active]:bg-transparent data-[state=active]:text-white data-[state=active]:shadow-none bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  >
                    {activeTab === "signup" && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-primary to-blue-600 rounded-xl"
                        layoutId="activeTab"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10">Sign Up</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <motion.div
                    className="space-y-5"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Password Login Form - FIRST */}
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-sm font-medium">
                          Email Address
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email address"
                          required
                          disabled={isFormLoading}
                          className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-sm font-medium">
                          Password
                        </Label>
                        <Input
                          id="password"
                          name="password"
                          type="password"
                          placeholder="Enter your password"
                          required
                          disabled={isFormLoading}
                          className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="remember"
                            className="rounded border-border/50 text-primary focus:ring-primary/20"
                          />
                          <Label htmlFor="remember" className="text-sm text-muted-foreground">
                            Remember me
                          </Label>
                        </div>
                        <Button
                          type="button"
                          variant="link"
                          className="p-0 h-auto text-sm text-primary hover:underline font-medium"
                          onClick={() => router.push('/auth/reset-password')}
                        >
                          Forgot password?
                        </Button>
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="submit"
                          className="w-full h-12 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg transition-all duration-200"
                          disabled={isFormLoading}
                        >
                          {isFormLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Login to Your Account
                        </Button>
                      </motion.div>
                    </form>

                    {/* Divider */}
                     <div className="relative">
                       <div className="absolute inset-0 flex items-center">
                         <span className="w-full border-t border-border/50" />
                       </div>
                       <div className="relative flex justify-center text-xs uppercase">
                         <span className="px-2 text-muted-foreground">Or login with Google</span>
                       </div>
                     </div>

                     {/* Google Login Button */}
                     <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                       <Button
                         variant="outline"
                         className="w-full h-12 flex items-center justify-center space-x-3 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/20 transition-all duration-200 bg-background/50 backdrop-blur-sm"
                         disabled={isFormLoading || googleAuthLoading}
                         onClick={() => handleSocialAuth("google")}
                       >
                         <div className="w-5 h-5">
                           <svg viewBox="0 0 24 24" className="w-full h-full">
                             <path
                               fill="#4285F4"
                               d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                             />
                             <path
                               fill="#34A853"
                               d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                             />
                             <path
                               fill="#FBBC05"
                               d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                             />
                             <path
                               fill="#EA4335"
                               d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                             />
                           </svg>
                         </div>
                         <span className="font-medium">Login with Google</span>
                       </Button>
                     </motion.div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Don't have an account yet?{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary hover:underline font-medium"
                          onClick={() => setActiveTab("signup")}
                        >
                          Create your account here
                        </Button>
                      </p>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="signup">
                  <motion.div
                    className="space-y-5"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Signup form */}
          
                      <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
                          <Input id="name" name="name" type="text" placeholder="Enter your full name" required disabled={isFormLoading} className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
                          <Input id="email" name="email" type="email" placeholder="Enter your email address" required disabled={isFormLoading} className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                          <Input id="password" name="password" type="password" placeholder="Create a secure password" required disabled={isFormLoading} className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all" />
                        </div>
                        <div className="flex items-start space-x-2">
                          <input type="checkbox" id="terms" className="rounded border-border/50 text-primary focus:ring-primary/20 mt-1" required />
                          <Label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground">
                            I agree to the{" "}
                            <Button variant="link" className="p-0 h-auto text-primary hover:underline">Terms of Service</Button>{" "}
                            and{" "}
                            <Button variant="link" className="p-0 h-auto text-primary hover:underline">Privacy Policy</Button>
                          </Label>
                        </div>
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                          <Button type="submit" className="w-full h-12 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg transition-all duration-200" disabled={isFormLoading}>
                            {isFormLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Your Account
                          </Button>
                        </motion.div>
                      </form>

                    {/* Divider */}
                     <div className="relative">
                       <div className="absolute inset-0 flex items-center">
                         <span className="w-full border-t border-border/50" />
                       </div>
                       <div className="relative flex justify-center text-xs uppercase">
                         <span className="px-2 text-muted-foreground">Or sign up with Google</span>
                       </div>
                     </div>

                     {/* Google Signup Button */}
                     <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                       <Button
                         variant="outline"
                         className="w-full h-12 flex items-center justify-center space-x-3 hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/20 transition-all duration-200 bg-background/50 backdrop-blur-sm"
                         disabled={isFormLoading || googleAuthLoading}
                         onClick={() => handleSocialAuth("google")}
                       >
                         <div className="w-5 h-5">
                           <svg viewBox="0 0 24 24" className="w-full h-full">
                             <path
                               fill="#4285F4"
                               d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                             />
                             <path
                               fill="#34A853"
                               d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                             />
                             <path
                               fill="#FBBC05"
                               d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                             />
                             <path
                               fill="#EA4335"
                               d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                             />
                           </svg>
                         </div>
                         <span className="font-medium">Sign up with Google</span>
                       </Button>
                     </motion.div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Button
                          variant="link"
                          className="p-0 h-auto text-primary hover:underline font-medium"
                          onClick={() => setActiveTab("login")}
                        >
                          Login to your existing account
                        </Button>
                      </p>
                    </div>
                  </motion.div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </motion.div>
        )}
          </div>
        </ScrollArea>
      </div>
  )
}
