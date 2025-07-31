"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "./auth-provider"
import { motion, AnimatePresence } from "framer-motion"
import { Music, Loader2, Mail } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { AnimatedBackground } from "./animated-background"
import { ForgotPasswordModal } from "./forgot-password-modal"

export function AuthModal() {
  const [isFormLoading, setIsFormLoading] = useState(false) // For form submission loading
  const [isSuccessLoading, setIsSuccessLoading] = useState(false) // For branded splash screen on success
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [activeTab, setActiveTab] = useState("login")
  const { login, register, googleSignIn } = useAuth()
  const { toast } = useToast()

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsFormLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string



    try {
      await login(email, password)
  
      setIsFormLoading(false) // Clear form loading
      setIsSuccessLoading(true) // Show branded splash screen
      
      // Ensure splash screen shows for at least 1 second for better UX
      setTimeout(() => {
        console.log('✨ AuthModal: Minimum splash duration complete, allowing redirect')
        // The redirect will happen naturally via auth state changes
      }, 1000)
      
      // Keep success loading active for smooth transition - don't clear
    } catch (error: any) {
      console.error('❌ AuthModal: Login failed:', error)
      setIsFormLoading(false) // Clear form loading on error
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      })
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    setIsFormLoading(true)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const name = formData.get("name") as string



    try {
      await register(email, password, name)
  
      setIsFormLoading(false) // Clear form loading
      setIsSuccessLoading(true) // Show branded splash screen
      
      // Ensure splash screen shows for at least 1 second for better UX
      setTimeout(() => {
        console.log('✨ AuthModal: Minimum splash duration complete, allowing redirect')
        // The redirect will happen naturally via auth state changes
      }, 1000)
      
      // Keep success loading active for smooth transition - don't clear
    } catch (error: any) {
      console.error('❌ AuthModal: Registration failed:', error)
      setIsFormLoading(false) // Clear form loading on error
      toast({
        title: "Registration failed",
        description: error.message || "Please try again with different credentials.",
        variant: "destructive",
      })
    }
  }

  const handleSocialAuth = async (provider: "spotify" | "google") => {
    console.log('🔐 AuthModal: Starting social auth with provider:', provider)
    setIsFormLoading(true)
    
    try {
      if (provider === "google") {
        console.log('🔐 AuthModal: Initiating Google sign-in...')
        
        // Call Google sign-in immediately (synchronously) to avoid popup blocking
        const result = await googleSignIn()
        console.log('✅ AuthModal: Google sign-in successful', result)
        
        // Keep loading state active for smooth transition
      } else if (provider === "spotify") {
        console.log('⚠️ AuthModal: Spotify auth not implemented yet')
        toast({
          title: "Spotify Authentication",
          description: "Spotify authentication is coming soon!",
          variant: "default",
        })
      }
    } catch (error: any) {
      console.error('❌ AuthModal: Social auth failed:', error)
      toast({
        title: "Authentication failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsFormLoading(false)
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
      console.error('❌ AuthModal: Magic link failed:', error)
      toast({
        title: "Failed to send magic link",
        description: "Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsFormLoading(false)
    }
  }

  return (
    <>
      {isSuccessLoading && (
        <div className="fixed inset-0 z-50 min-h-screen flex items-center justify-center relative overflow-hidden">
          <AnimatedBackground />
          <motion.div 
            className="relative z-10 flex flex-col items-center space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Logo and App Name */}
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div
                className="w-16 h-16 bg-gradient-to-br from-primary via-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <div className="w-8 h-8 text-white">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
                  </svg>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
              </motion.div>
            </motion.div>
            
            {/* Loading Message */}
            <motion.div 
              className="text-center space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
            </motion.div>
          </motion.div>
        </div>
      )}
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated Background */}
        <AnimatedBackground />

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary/30 rounded-full"
              initial={{
                x: typeof window !== "undefined" ? Math.random() * window.innerWidth : 0,
                y: typeof window !== "undefined" ? Math.random() * window.innerHeight : 0,
              }}
              animate={{
                x: typeof window !== "undefined" ? Math.random() * window.innerWidth : 0,
                y: typeof window !== "undefined" ? Math.random() * window.innerHeight : 0,
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>

        {/* Main Auth Card */}
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
                  className="w-12 h-12 bg-gradient-to-br from-primary via-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Music className="w-7 h-7 text-white" />
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
                          onClick={() => setShowForgotPassword(true)}
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
                         disabled={isFormLoading}
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
                    {/* Password Signup Form - FIRST */}
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-sm font-medium">
                          Full Name
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          type="text"
                          placeholder="Enter your full name"
                          required
                          disabled={isFormLoading}
                          className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all"
                        />
                      </div>
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
                          placeholder="Create a secure password"
                          required
                          disabled={isFormLoading}
                          className="h-12 bg-background/50 backdrop-blur-sm border-border/50 focus:bg-background focus:border-primary transition-all"
                        />
                      </div>
                      <div className="flex items-start space-x-2">
                        <input
                          type="checkbox"
                          id="terms"
                          className="rounded border-border/50 text-primary focus:ring-primary/20 mt-1"
                          required
                        />
                        <Label htmlFor="terms" className="text-sm leading-relaxed text-muted-foreground">
                          I agree to the{" "}
                          <Button variant="link" className="p-0 h-auto text-primary hover:underline">
                            Terms of Service
                          </Button>{" "}
                          and{" "}
                          <Button variant="link" className="p-0 h-auto text-primary hover:underline">
                            Privacy Policy
                          </Button>
                        </Label>
                      </div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Button
                          type="submit"
                          className="w-full h-12 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium shadow-lg transition-all duration-200"
                          disabled={isFormLoading}
                        >
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
                         disabled={isFormLoading}
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
      </div>

      {/* Forgot Password Modal */}
      <AnimatePresence>
        {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
      </AnimatePresence>
    </>
  )
}
