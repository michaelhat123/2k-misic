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
import { GradientDotLoader } from "@/components/ui/GradientDotLoader"

interface UserProfile {
  uid: string
  email: string
  display_name: string | null
  profile_picture: string | null
  preferences: {
    theme: string
    notifications: boolean
  }
  created_at: string
  updated_at: string
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
  })
  
  // Debug profile data
  useEffect(() => {
    console.log('🔍 Profile data changed:', {
      profile_picture: profile?.profile_picture,
      display_name: profile?.display_name,
      isLoading,
      error
    })
  }, [profile, isLoading, error])

  // Update local state when profile data loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "")
      setDialogDisplayName(profile.display_name || "")
      setNotifications(profile.preferences?.notifications ?? true)
    }
  }, [profile])

  // Dialog handlers
  const handleOpenProfileDialog = () => {
    setDialogDisplayName(profile?.display_name || user?.name || "")
    setShowProfileDialog(true)
  }

  const handleCloseProfileDialog = () => {
    setShowProfileDialog(false)
    setDialogDisplayName(profile?.display_name || "")
  }

  const handleSaveProfileDialog = async () => {
    if (!dialogDisplayName.trim()) {
      toast.error("Display name cannot be empty")
      return
    }
    
    const updateData = {
      display_name: dialogDisplayName.trim(),
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
        display_name: data.display_name,
        preferences: data.preferences
      }))
      
      // Update local states
      setDisplayName(data.display_name || data.name || displayName)
      setDialogDisplayName(data.display_name || data.name || displayName)
      
      // Close dialog and show success
      setShowProfileDialog(false)
      toast.success("Profile updated successfully!")
    },
    onError: (error: any) => {
      console.error('❌ Profile update error:', error)
      toast.error(error.message || "Failed to update profile")
    }
  })

  // 🚀 PROFESSIONAL SOCKET.IO UPLOAD - NO OPTIMISTIC UPDATES!
  const uploadPictureMutation = useMutation({
    mutationFn: userApi.uploadProfilePicture,
    onSuccess: async (data) => {
      console.log('✅ PROFESSIONAL: Profile picture uploaded successfully!')
      console.log('🚀 Socket.IO will handle real-time UI updates automatically')
      
      toast.success("Profile picture updated!")
      
      // UI will be updated automatically via Socket.IO real-time event
      // No manual state updates needed - this is the professional approach!
    },
    onError: (error: any) => {
      console.error('❌ Profile picture upload failed:', error)
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      toast.error(`Upload failed: ${error.message}`)
    }
  })

  // Delete profile picture mutation
  const deletePictureMutation = useMutation({
    mutationFn: userApi.deleteProfilePicture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-profile"] })
      toast.success("Profile picture removed!")
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove profile picture")
    }
  })

  const handleSaveProfile = () => {
    const updateData = {
      display_name: displayName.trim() || undefined,
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

    console.log('🚀 PROFESSIONAL: Starting profile picture upload...', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    })

    // 🚀 SIMPLE APPROACH: Upload to backend, Socket.IO handles UI updates
    uploadPictureMutation.mutate(file)
    
    console.log('🚀 Upload started - Socket.IO will update UI automatically when complete!')
  }

  // Reset file input
  if (fileInputRef.current) {
    fileInputRef.current.value = ''
  }

  const getUserInitials = () => {
    const name = profile?.display_name || user?.name || user?.email || "U"
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
      <GradientDotLoader size={8} />
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
      {/* Search Overlay - Shows when user is searching */}
      {searchQuery && <SearchOverlay />}
      
      {/* Profile Content - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        {/* Header Section - Spotify Style */}
        <div className="relative px-6 py-8 bg-background rounded-t-lg">
          <div className="flex items-end space-x-6">
          {/* Profile Picture */}
          <div className="relative group">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-4xl font-bold relative shadow-2xl">
              {profile?.profile_picture ? (
                <img
                  src={profile.profile_picture}
                  alt="Profile"
                  className="w-full h-full object-cover rounded-full"
                  onLoad={() => console.log('✅ DEBUG: Avatar image loaded successfully:', profile.profile_picture)}
                  onError={(e) => {
                    console.error('❌ DEBUG: Avatar image failed to load:', profile.profile_picture)
                    console.error('Error event:', e)
                  }}
                />
              ) : (
                getUserInitials()
              )}
              
              {/* 🚀 LOADING INDICATOR OVERLAY */}
              {uploadPictureMutation.isPending && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              )}
            </div>

            {/* Picture Upload Overlay */}
            <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadPictureMutation.isPending}
                >
                  <Camera className="h-4 w-4" />
                </Button>
                {profile?.profile_picture && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deletePictureMutation.mutate()}
                    disabled={deletePictureMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                      setDisplayName(profile?.display_name || "")
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
                  {profile?.display_name || user?.name || "Music Lover"}
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
        <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur border-blue-500/20">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-semibold">Profile details</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Profile Picture Section */}
            <div className="flex items-center space-x-4">
              {/* Profile Picture */}
              <div className="relative group">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold relative shadow-xl">
                  {profile?.profile_picture ? (
                    <img
                      src={profile.profile_picture}
                      alt="Profile"
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    getUserInitials()
                  )}
                  
                  {/* Loading Indicator */}
                  {uploadPictureMutation.isPending && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                </div>

                {/* Picture Upload Overlay */}
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="flex space-x-1">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadPictureMutation.isPending}
                    >
                      <Camera className="h-3 w-3" />
                    </Button>
                    {profile?.profile_picture && (
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => deletePictureMutation.mutate()}
                        disabled={deletePictureMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
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
                  className="bg-slate-800/50 border-blue-500/30 text-white placeholder:text-slate-400 focus:border-blue-400"
                />
              </div>
            </div>

            {/* Terms Text */}
            <div className="text-xs text-slate-400 space-y-1">
              <p>By proceeding, you agree to give 2k Music access to the image you choose to upload.</p>
              <p>Please make sure you have the right to upload the image.</p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={handleCloseProfileDialog}
                className="border-blue-500/30 text-slate-300 hover:bg-slate-800/50"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfileDialog}
                disabled={updateProfileMutation.isPending}
                className="bg-blue-600 text-white hover:bg-blue-700"
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
