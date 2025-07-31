export interface User {
  uid: string // Firebase UID
  email: string
  name: string
  picture?: string // Profile picture URL
  profilePicture?: string // Legacy support for existing code
  emailVerified?: boolean // Firebase email verification status
  createdAt?: string // Optional for new users
  updatedAt?: string // Optional for new users
}
