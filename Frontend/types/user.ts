export interface User {
  id: string // User ID from JWT auth system
  email: string
  name: string
  picture?: string // Profile picture URL
  profilePicture?: string // Legacy support for existing code
  emailVerified?: boolean // Email verification status
  verified?: boolean // Alternative verification field
  role?: string // User role
  selectedRole?: string // Selected role
  createdAt?: string // Optional for new users
  updatedAt?: string // Optional for new users
}
