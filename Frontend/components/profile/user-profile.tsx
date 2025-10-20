"use client"

import { useState, useRef, useEffect } from "react"
import { useAuth } from "../auth/auth-provider"
import { useAuthGuard } from "@/hooks/use-auth-guard"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Camera, Edit2, Save, X, Upload, Trash2 } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "sonner"
import { TopArtists } from "./top-artists"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SearchOverlay } from "../search/search-overlay"
import { useSearch } from "../layout/top-navigation"
import { userApi } from "@/lib/api/user"
import { BrandedLoader } from "../ui/BrandedLoader"

interface UserProfile {
  id: string
  email: string
  name: string
  profilePicture: string | null
  isVerified: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
  preferences?: {
    theme: string
    notifications: boolean
    privacy: {
      profile_visibility: string
      show_listening_activity: boolean
    }
  }
  stats?: {
    total_listening_time: number
    favorite_genres: string[]
    playlists_count: number
    followers_count: number
    following_count: number
  }
}

export function UserProfile() {
  const { user, refreshProfile } = useAuth()
  const { searchQuery } = useSearch()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState("")
  const [notifications, setNotifications] = useState(true)
  const [showProfileDialog, setShowProfileDialog] = useState(false)
  const [dialogDisplayName, setDialogDisplayName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  // Fetch user profile data
  const { data: profile, isLoading, error } = useQuery<UserProfile>({
    queryKey: ["user-profile"],
    queryFn: userApi.getProfile,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    enabled: !!user, // Only run when user is authenticated
  })
  
  // Debug profile data
  useEffect(() => {
    // Silent monitoring
  }, [profile, isLoading, error])

  // Update local state when profile data loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.name || "")
      setDialogDisplayName(profile.name || "")
      setNotifications(profile.preferences?.notifications ?? true)
    }
  }, [profile])

  // 🚀 SYNC WITH AUTH PROVIDER'S SOCKET.IO UPDATES
  useEffect(() => {
    if (user) {
      // Update React Query cache when auth provider's user state changes via Socket.IO
      // This includes both setting new pictures and deleting (undefined)
      queryClient.setQueryData(["user-profile"], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            profilePicture: user.profilePicture
          }
        }
        return oldData
      })
    }
  }, [user?.profilePicture, queryClient])

  // Dialog handlers
  const handleOpenProfileDialog = () => {
    setDialogDisplayName(profile?.name || user?.name || "")
    setShowProfileDialog(true)
  }

  const handleCloseProfileDialog = () => {
    setShowProfileDialog(false)
    setDialogDisplayName(profile?.name || "")
  }

  const handleSaveProfileDialog = async () => {
    if (!dialogDisplayName.trim()) {
      toast.error("Display name cannot be empty")
      return
    }
    
    const updateData = {
      name: dialogDisplayName.trim(),
      preferences: profile?.preferences || { theme: 'light', notifications: true }
    }
    
    // Use the mutation for proper loading states
    updateProfileMutation.mutate(updateData)
  }

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: userApi.updateProfile,
    onSuccess: (data) => {
      // Update React Query cache optimistically
      queryClient.setQueryData(["user-profile"], (oldData: any) => ({
        ...oldData,
        name: data.name,
        preferences: data.preferences
      }))
      
      // Update local states
      setDisplayName(data.name || displayName)
      setDialogDisplayName(data.name || displayName)
      
      // Close dialog and show success
      setShowProfileDialog(false)
      toast.success("Profile updated successfully!")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update profile")
    }
  })

  // Profile picture upload mutation
  const uploadPictureMutation = useMutation({
    mutationFn: userApi.uploadProfilePicture,
    onSuccess: async (data) => {
      // Socket.IO will handle real-time updates automatically
      // No need to manually invalidate cache - real-time updates are faster!
      toast.success("Profile picture uploading...")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to upload profile picture")
    }
  })

  // Delete profile picture mutation
  const deletePictureMutation = useMutation({
    mutationFn: userApi.deleteProfilePicture,
    onSuccess: () => {
      // Socket.IO will handle real-time updates automatically
      toast.success("Profile picture removing...")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove profile picture")
    }
  })

  const handleSaveProfile = () => {
    const updateData = {
      name: displayName.trim() || undefined,
      preferences: {
        theme: profile?.preferences?.theme || "dark",
        notifications
      }
    }
    

    
    updateProfileMutation.mutate(updateData)
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    // Upload to backend and update UI automatically
    uploadPictureMutation.mutate(file)
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getUserInitials = () => {
    const name = profile?.name || user?.name || user?.email || "U"
    return name.charAt(0).toUpperCase()
  }

  const [showLoader, setShowLoader] = useState(true);
useEffect(() => {
  let timeout: NodeJS.Timeout;
  if (isLoading) {
    setShowLoader(true);
    timeout = setTimeout(() => {
      setShowLoader(false);
    }, 1000);
  } else {
    // Wait at least 1s before hiding loader
    timeout = setTimeout(() => {
      setShowLoader(false);
    }, 1000);
  }
  return () => clearTimeout(timeout);
}, [isLoading]);

if (isLoading || showLoader) {
  return (
    <div className="min-h-[300px] flex items-center justify-center mt-32">
      <BrandedLoader size="md" />
    </div>
  );
}

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="h-[82vh] bg-background rounded-lg ml-0 mr-1.5 mt-0 mb-2 shadow-lg relative flex flex-col">
      {/* Profile Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Header Section - Spotify Style */}
        <div className="relative px-6 py-8 bg-background rounded-t-lg">
          <div className="flex items-end space-x-6">
          {/* Profile Picture */}
          <div className="relative group" style={{ outline: 'none', border: 'none' }}>
            <div 
              className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold relative shadow-2xl focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0" 
              style={{ 
                outline: 'none !important', 
                border: 'none !important', 
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                WebkitTapHighlightColor: 'transparent'
              }}
            >
              {profile?.profilePicture ? (
                <img
                  src={profile.profilePicture}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                  style={{ 
                    outline: 'none !important', 
                    border: 'none !important',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    // Silently handle image load failures
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                getUserInitials()
              )}
              
              {/* 🚀 LOADING INDICATOR OVERLAY - Keep avatar visible */}
              {(uploadPictureMutation.isPending || deletePictureMutation.isPending) && (
                <div 
                  className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ 
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    outline: 'none !important', 
                    border: 'none !important',
                    boxShadow: 'none !important',
                    WebkitTapHighlightColor: 'transparent',
                    borderRadius: '50%'
                  }}
                >
                  <BrandedLoader size="sm" />
                </div>
              )}
            </div>

            {/* Picture Upload Overlay - Hidden during loading */}
            <div className={`absolute inset-0 bg-black/50 rounded-full transition-all duration-300 flex items-center justify-center ${
              (uploadPictureMutation.isPending || deletePictureMutation.isPending) 
                ? 'opacity-0 pointer-events-none' 
                : 'opacity-0 group-hover:opacity-100'
            }`}>
              <div className="flex space-x-3">
                {/* Camera Upload Button */}
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-white/20"
                    style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadPictureMutation.isPending || deletePictureMutation.isPending}
                  >
                    <Camera className="h-4 w-4 text-white" />
                  </Button>
                </motion.div>

                {/* Delete Button - Now positioned next to camera */}
                {profile?.profilePicture && (
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8 bg-red-500/90 hover:bg-red-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:shadow-red-500/30"
                      style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                      onClick={() => deletePictureMutation.mutate()}
                      disabled={uploadPictureMutation.isPending || deletePictureMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </Button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="flex-1 min-w-0 pb-4">
            <p className="text-sm font-medium text-white/80 mb-2">Profile</p>
            
            {isEditing ? (
              <div className="space-y-4">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="text-4xl sm:text-6xl font-bold bg-transparent border-white/20 text-white placeholder:text-white/50 h-auto py-2"
                />
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    size="sm"
                    className="bg-primary hover:bg-primary/80"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button
                    onClick={() => {
                      setIsEditing(false)
                      setDisplayName(profile?.name || "")
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div>
                <h1 
                  className="text-4xl sm:text-6xl font-bold text-white mb-4 break-words cursor-pointer hover:text-blue-300 transition-colors"
                  onClick={handleOpenProfileDialog}
                >
                  {profile?.name || user?.name || "Music Lover"}
                </h1>

              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Sections */}
      <div className="px-6 pt-8 pb-4 space-y-8">
        {/* Top Artists Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">Top artists this month</h2>
          </div>
          
          <TopArtists />
        </motion.section>


      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Profile Edit Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="sm:max-w-md bg-background backdrop-blur-md border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground text-lg font-semibold">Profile details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Profile Picture Section */}
            <div className="flex items-center space-x-4">
              {/* Profile Picture */}
              <div className="relative group" style={{ outline: 'none', border: 'none' }}>
                <div 
                  className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold relative shadow-xl focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                  style={{ 
                    outline: 'none !important', 
                    border: 'none !important',
                    WebkitTapHighlightColor: 'transparent'
                  }}
                >
                  {profile?.profilePicture ? (
                    <img
                      src={profile.profilePicture}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
                      style={{ 
                        outline: 'none !important', 
                        border: 'none !important',
                        WebkitTapHighlightColor: 'transparent'
                      }}
                    />
                  ) : (
                    getUserInitials()
                  )}
                  
                  {/* 🚀 LOADING INDICATOR OVERLAY - Keep avatar visible */}
                  {(uploadPictureMutation.isPending || deletePictureMutation.isPending) && (
                    <div 
                      className="absolute inset-0 rounded-full flex items-center justify-center"
                      style={{ 
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        outline: 'none !important', 
                        border: 'none !important',
                        boxShadow: 'none !important',
                        WebkitTapHighlightColor: 'transparent',
                        borderRadius: '50%'
                      }}
                    >
                      <BrandedLoader size="sm" />
                    </div>
                  )}
                </div>

                {/* Picture Upload Overlay - Hidden during loading */}
                <div className={`absolute inset-0 bg-black/50 rounded-full transition-all duration-300 flex items-center justify-center ${
                  (uploadPictureMutation.isPending || deletePictureMutation.isPending) 
                    ? 'opacity-0 pointer-events-none' 
                    : 'opacity-0 group-hover:opacity-100'
                }`}>
                  <div className="flex space-x-3">
                    {/* Camera Upload Button */}
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 400, damping: 17 }}
                    >
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/20 hover:bg-white/30 border-white/30 hover:border-white/50 backdrop-blur-sm transition-all duration-200 hover:shadow-lg hover:shadow-white/20"
                        style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadPictureMutation.isPending || deletePictureMutation.isPending}
                      >
                        <Camera className="h-4 w-4 text-white" />
                      </Button>
                    </motion.div>

                    {/* Delete Button - Now positioned next to camera */}
                    {profile?.profilePicture && (
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 17 }}
                      >
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8 bg-red-500/90 hover:bg-red-600 shadow-lg hover:shadow-xl transition-all duration-200 hover:shadow-red-500/30"
                          style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
                          onClick={() => deletePictureMutation.mutate()}
                          disabled={uploadPictureMutation.isPending || deletePictureMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-white" />
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Name Input */}
              <div className="flex-1">
                <Input
                  value={dialogDisplayName}
                  onChange={(e) => setDialogDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-background/50 border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0 focus:border-[#00BFFF] transition-colors"
                  style={{ outline: 'none', boxShadow: 'none' }}
                />
              </div>
            </div>

            {/* Terms Text */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Uploading an image will update your profile picture across 2k Music.</p>
              <p>Make sure you own the rights to use this image.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end">
              <Button
                onClick={handleSaveProfileDialog}
                disabled={updateProfileMutation.isPending}
                className="bg-gradient-to-br from-primary to-blue-600 text-white hover:from-primary/80 hover:to-blue-600/80 rounded-full h-10 px-5 focus:outline-none focus:ring-0 transition-all disabled:from-primary/50 disabled:to-blue-600/50 disabled:text-white/70"
                style={{ outline: 'none', boxShadow: 'none' }}
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  )
}
