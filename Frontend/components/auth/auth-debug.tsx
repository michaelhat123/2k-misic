// auth-debug.tsx - Debug component to test Firebase auth
"use client"

import { useState, useEffect } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface DebugInfo {
  firebase: {
    initialized: boolean
    currentUser: {
      uid: string
      email: string | null
      emailVerified: boolean
      displayName: string | null
    } | null
    error: string | null
  }
  localStorage: {
    hasToken: boolean
    tokenPreview: string
  }
  backend: {
    accessible: boolean
    profileResponse: any
    error: string | null
  }
  environment: {
    hasApiKey: boolean
    hasAuthDomain: boolean
    hasProjectId: boolean
    apiUrl: string
  }
}

export function AuthDebug() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo>({
    firebase: {
      initialized: false,
      currentUser: null,
      error: null
    },
    localStorage: {
      hasToken: false,
      tokenPreview: 'Loading...',
    },
    backend: {
      accessible: false,
      profileResponse: null,
      error: null
    },
    environment: {
      hasApiKey: false,
      hasAuthDomain: false,
      hasProjectId: false,
      apiUrl: ''
    }
  })

  useEffect(() => {
    // Check environment variables (client-side only)
    const envCheck = {
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    }

    // Check localStorage token (browser-only)
    let tokenCheck = {
      hasToken: false,
      tokenPreview: 'No token'
    }
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('firebase_token')
      tokenCheck = {
        hasToken: !!token,
        tokenPreview: token ? token.substring(0, 50) + '...' : 'No token'
      }
    }

    // Set initial debug info
    setDebugInfo(prev => ({
      ...prev,
      environment: envCheck,
      localStorage: tokenCheck
    }))

    // Listen to Firebase auth state
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      console.log('🔍 AuthDebug: Firebase auth state changed', user)
      
      setDebugInfo(prev => ({
        ...prev,
        firebase: {
          initialized: true,
          currentUser: user ? {
            uid: user.uid,
            email: user.email,
            emailVerified: user.emailVerified,
            displayName: user.displayName
          } : null,
          error: null
        }
      }))
    })

    return () => unsubscribe()
  }, [])

  const testBackendConnection = async () => {
    console.log('🔍 AuthDebug: Testing backend connection...')
    
    try {
      if (typeof window === 'undefined') {
        throw new Error('Cannot access localStorage on server side')
      }

      const token = localStorage.getItem('firebase_token')
      if (!token) {
        throw new Error('No Firebase token found in localStorage')
      }

      const response = await fetch(`${debugInfo.environment.apiUrl}/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      
      setDebugInfo(prev => ({
        ...prev,
        backend: {
          accessible: true,
          profileResponse: data,
          error: null
        }
      }))
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Backend test failed:', error)
      setDebugInfo(prev => ({
        ...prev,
        backend: {
          accessible: false,
          profileResponse: null,
          error: errorMessage
        }
      }))
    }
  }

  const refreshToken = async () => {
    console.log('🔍 AuthDebug: Refreshing Firebase token...')
    
    try {
      if (typeof window === 'undefined') {
        throw new Error('Cannot access localStorage on server side')
      }

      if (auth.currentUser) {
        const newToken = await auth.currentUser.getIdToken(true)
        localStorage.setItem('firebase_token', newToken)
        
        setDebugInfo(prev => ({
          ...prev,
          localStorage: {
            hasToken: true,
            tokenPreview: newToken.substring(0, 50) + '...'
          }
        }))
        
        console.log('✅ Token refreshed successfully')
      } else {
        throw new Error('No current Firebase user')
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('❌ Token refresh failed:', errorMessage)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto my-4">
      <CardHeader>
        <CardTitle>🔍 Authentication Debug Panel</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Environment Variables */}
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Environment Variables</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Firebase API Key: {debugInfo.environment.hasApiKey ? '✅' : '❌'}</div>
            <div>Auth Domain: {debugInfo.environment.hasAuthDomain ? '✅' : '❌'}</div>
            <div>Project ID: {debugInfo.environment.hasProjectId ? '✅' : '❌'}</div>
            <div>API URL: {debugInfo.environment.apiUrl}</div>
          </div>
        </div>

        {/* Firebase Auth Status */}
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Firebase Authentication</h3>
          <div className="text-sm space-y-1">
            <div>Initialized: {debugInfo.firebase.initialized ? '✅' : '❌'}</div>
            <div>Current User: {debugInfo.firebase.currentUser ? '✅ Signed In' : '❌ Not Signed In'}</div>
            {debugInfo.firebase.currentUser && (
              <div className="ml-4 space-y-1">
                <div>UID: {debugInfo.firebase.currentUser.uid}</div>
                <div>Email: {debugInfo.firebase.currentUser.email || 'No email'}</div>
                <div>Verified: {debugInfo.firebase.currentUser.emailVerified ? '✅' : '❌'}</div>
                <div>Display Name: {debugInfo.firebase.currentUser.displayName || 'None'}</div>
              </div>
            )}
          </div>
        </div>

        {/* Token Storage */}
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Token Storage</h3>
          <div className="text-sm space-y-1">
            <div>Has Token: {debugInfo.localStorage.hasToken ? '✅' : '❌'}</div>
            <div>Token Preview: {debugInfo.localStorage.tokenPreview}</div>
          </div>
          <Button onClick={refreshToken} className="mt-2" size="sm">
            Refresh Token
          </Button>
        </div>

        {/* Backend Connection */}
        <div className="border rounded p-4">
          <h3 className="font-semibold mb-2">Backend Connection</h3>
          <div className="text-sm space-y-1">
            <div>Accessible: {debugInfo.backend.accessible ? '✅' : '❌'}</div>
            {debugInfo.backend.error && (
              <div className="text-red-500">Error: {debugInfo.backend.error}</div>
            )}
            {debugInfo.backend.profileResponse && (
              <div className="ml-4">
                <div>Backend UID: {debugInfo.backend.profileResponse.uid}</div>
                <div>Backend Email: {debugInfo.backend.profileResponse.email}</div>
              </div>
            )}
          </div>
          <Button onClick={testBackendConnection} className="mt-2" size="sm">
            Test Backend
          </Button>
        </div>

        {/* Quick Diagnostics */}
        <div className="border rounded p-4 bg-yellow-50">
          <h3 className="font-semibold mb-2">Quick Diagnostics</h3>
          <div className="text-sm space-y-1">
            {!debugInfo.environment.hasApiKey && (
              <div className="text-red-600">❌ Missing NEXT_PUBLIC_FIREBASE_API_KEY in .env.local</div>
            )}
            {!debugInfo.environment.hasAuthDomain && (
              <div className="text-red-600">❌ Missing NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN in .env.local</div>
            )}
            {!debugInfo.firebase.currentUser && (
              <div className="text-orange-600">⚠️ No Firebase user - try logging in</div>
            )}
            {!debugInfo.localStorage.hasToken && (
              <div className="text-orange-600">⚠️ No token in localStorage - auth may not persist</div>
            )}
            {debugInfo.firebase.currentUser && !debugInfo.firebase.currentUser.emailVerified && (
              <div className="text-orange-600">⚠️ Email not verified - check Firebase Console</div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
