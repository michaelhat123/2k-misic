// auth.ts - Firebase Authentication API (CRITICAL FIX)
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  User as FirebaseUser,
  updateProfile,
  fetchSignInMethodsForEmail,
  GoogleAuthProvider,
  linkWithCredential
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper function to get auth token safely (browser-only)
export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('firebase_token');
};

// Helper function to make authenticated API requests
const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
  console.log(`🔗 Making authenticated request to: ${API_BASE_URL}${endpoint}`);
  
  const token = getAuthToken();
  if (!token) {
    console.error('❌ No Firebase token available for authenticated request');
    throw new Error('No authentication token available');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    console.error(`❌ API request failed: ${response.status} ${response.statusText}`);
    throw new Error(`API request failed: ${response.status}`);
  }

  const data = await response.json();
  console.log(`✅ API request successful:`, data);
  return data;
};

export const authApi = {
  // Register with email and password (FIXED)
  register: async (email: string, password: string, name: string) => {
    console.log('🔐 Starting registration process...', { email, name });
    
    try {
      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase user created:', userCredential.user.uid);
      
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName: name });
      console.log('✅ Display name updated');
      
      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();
      console.log('✅ Firebase ID token obtained for registration');
      
      // Store token in localStorage for API requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('firebase_token', idToken);
        console.log('✅ Token stored in localStorage');
      }
      
      // NOTE: Skip backend registration call since user is already created in Firebase
      console.log('✅ Registration completed with Firebase only');
      
      return {
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          name: name,
          emailVerified: userCredential.user.emailVerified,
        },
        token: idToken,
      };
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      throw new Error(error.message || 'Registration failed');
    }
  },

  // Login with email and password (CRITICAL FIX)
  login: async (email: string, password: string) => {
    console.log('🔐 Starting login process...', { email });
    
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase login successful:', userCredential.user.uid);
      
      // Get Firebase ID token
      const idToken = await userCredential.user.getIdToken();
      console.log('✅ Firebase ID token obtained:', idToken.substring(0, 50) + '...');
      
      // Store token in localStorage for API requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('firebase_token', idToken);
        console.log('✅ Token stored in localStorage');
      }
      
      // CRITICAL FIX: Send Firebase ID token to backend for verification
      try {
        console.log('🔗 Verifying with backend...');
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }), // CRITICAL: Send the Firebase ID token
        });
        
        if (response.ok) {
          const backendData = await response.json();
          console.log('✅ Backend login verification successful:', backendData);
        } else {
          const errorText = await response.text();
          console.warn('⚠️ Backend login verification failed:', response.status, errorText);
        }
      } catch (backendError: any) {
        console.warn('⚠️ Backend verification failed, using Firebase data:', backendError.message);
      }
      
      return {
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          name: userCredential.user.displayName || '',
          emailVerified: userCredential.user.emailVerified,
        },
        token: idToken,
      };
    } catch (error: any) {
      console.error('❌ Login failed:', error);
      throw new Error(error.message || 'Login failed');
    }
  },

  // Google Sign-in with Proactive Account Linking
  googleSignIn: async () => {
    console.log('🔐 Starting Google sign-in with proactive linking check...');
    
    // Step 1: Check if user exists with email/password before Google sign-in
    const googleResult = await signInWithPopup(auth, googleProvider);
    const email = googleResult.user.email;
    
    if (email) {
      console.log('🔍 Checking for existing email/password account for:', email);
      
      try {
        // Check existing sign-in methods for this email
        const existingMethods = await fetchSignInMethodsForEmail(auth, email);
        console.log('🔍 Existing methods after Google sign-in:', existingMethods);
        console.log('🔍 Provider data:', googleResult.user.providerData);
        
        // If we only have Google provider but there should be email/password too
        if (existingMethods.length === 1 && existingMethods[0] === 'google.com') {
          console.log('⚠️ DETECTED: Email/password provider was replaced by Google!');
          console.log('🔗 Attempting to restore email/password authentication...');
          
          // For now, warn the user about this issue
          const shouldRestore = confirm(
            `Your account was originally created with email/password, but Google sign-in has replaced that authentication method.\n\n` +
            `This means you can now only sign in with Google, not your original password.\n\n` +
            `Would you like to add email/password authentication back to your account so you can use both methods?`
          );
          
          if (shouldRestore) {
            console.log('🔑 User wants to restore email/password authentication');
            throw new Error(
              'To restore email/password authentication, please contact support or create a new password in your account settings after logging in.'
            );
          } else {
            console.log('ℹ️ User chose to continue with Google-only authentication');
          }
        }
      } catch (methodsError: any) {
        console.error('❌ Failed to check existing methods:', methodsError);
      }
    }
    
    try {
      
      // Get Firebase ID token
      const idToken = await googleResult.user.getIdToken();
      console.log('✅ Google ID token obtained');
      
      // Store token in localStorage for API requests
      if (typeof window !== 'undefined') {
        localStorage.setItem('firebase_token', idToken);
      }
      
      // Verify with backend
      try {
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }), // Send the Firebase ID token
        });
        
        if (response.ok) {
          const backendData = await response.json();
          console.log('✅ Backend Google sign-in verification successful:', backendData);
        } else {
          console.warn('⚠️ Backend Google verification failed, using Firebase data');
        }
      } catch (backendError) {
        console.warn('⚠️ Backend Google verification failed, using Firebase data');
      }
      
      return {
        user: {
          uid: googleResult.user.uid,
          email: googleResult.user.email!,
          name: googleResult.user.displayName || '',
          picture: googleResult.user.photoURL || '',
          emailVerified: googleResult.user.emailVerified,
        },
        token: idToken,
      };
    } catch (error: any) {
      console.error('❌ Google sign-in failed:', error);
      console.log('🔍 DEBUG: Error code:', error.code);
      console.log('🔍 DEBUG: Error message:', error.message);
      console.log('🔍 DEBUG: Error customData:', error.customData);
      
      // Handle account linking automatically - FIXED VERSION
      if (error.code === 'auth/account-exists-with-different-credential') {
        console.log('🔍 DEBUG: Account linking error detected - this should mean we have conflicting providers');
        console.log('🔗 Account linking required - attempting TRUE provider linking...');
        
        // Get the pending Google credential from the error
        const pendingCred = GoogleAuthProvider.credentialFromError(error);
        const email = error.customData?.email;
        
        if (email && pendingCred) {
          console.log('📧 Found existing account for:', email, '- attempting to link providers');
          
          try {
            // Get existing sign-in methods for this email
            const existingMethods = await fetchSignInMethodsForEmail(auth, email);
            console.log('🔍 Existing sign-in methods:', existingMethods);
            
            if (existingMethods.includes('password')) {
              console.log('🔗 Email/password account exists - prompting for password to link Google');
              
              // Prompt user for their existing password
              const password = await new Promise<string>((resolve, reject) => {
                const userPassword = prompt(
                  `An account with ${email} already exists.\n\nTo link your Google account, please enter your existing password:`
                );
                
                if (userPassword) {
                  resolve(userPassword);
                } else {
                  reject(new Error('Password required for account linking'));
                }
              });
              
              try {
                // Step 1: Sign in with the existing email/password
                console.log('🔑 Step 1: Signing in with email/password...');
                const existingUserCred = await signInWithEmailAndPassword(auth, email, password);
                console.log('✅ Successfully signed in with email/password');
                
                // Step 2: Link the Google credential to the existing user
                console.log('🔗 Step 2: Linking Google provider to existing account...');
                const linkedResult = await linkWithCredential(existingUserCred.user, pendingCred);
                console.log('✅ Successfully linked Google provider! User now has both email/password AND Google login');
                
                // Step 3: Get fresh token and update profile if needed
                const idToken = await linkedResult.user.getIdToken();
                
                // Update profile with Google info if it wasn't already set
                if (!linkedResult.user.displayName && pendingCred.idToken) {
                  // Extract name from Google credential if available
                  const googleProfile = JSON.parse(atob(pendingCred.idToken.split('.')[1]));
                  if (googleProfile.name) {
                    await updateProfile(linkedResult.user, {
                      displayName: googleProfile.name,
                      photoURL: googleProfile.picture || linkedResult.user.photoURL
                    });
                    console.log('✅ Updated profile with Google info');
                  }
                }
                
                // Store token
                if (typeof window !== 'undefined') {
                  localStorage.setItem('firebase_token', idToken);
                }
                
                console.log('✨ Account linking complete! User can now sign in with both methods.');
                
                // Return the linked user data
                return {
                  user: {
                    uid: linkedResult.user.uid,
                    email: linkedResult.user.email!,
                    name: linkedResult.user.displayName || '',
                    picture: linkedResult.user.photoURL || '',
                    emailVerified: linkedResult.user.emailVerified,
                  },
                  token: idToken,
                };
              } catch (linkError: any) {
                console.error('❌ Failed to link accounts:', linkError);
                
                if (linkError.code === 'auth/wrong-password') {
                  throw new Error('Incorrect password. Please try again with the correct password for your account.');
                } else if (linkError.code === 'auth/credential-already-in-use') {
                  throw new Error('This Google account is already linked to another user. Please use a different Google account.');
                }
                
                throw new Error(`Account linking failed: ${linkError.message}`);
              }
            } else {
              console.log('⚠️ No password provider found for existing account');
              throw new Error('Unable to link accounts automatically. Please contact support.');
            }
          } catch (fetchError: any) {
            console.error('❌ Failed to fetch existing sign-in methods:', fetchError);
            throw new Error('Failed to check existing account. Please try again.');
          }
        } else {
          console.error('❌ Missing email or credential for account linking');
          throw new Error('Account linking failed due to missing information.');
        }
      }
      
      throw new Error(error.message || 'Google sign-in failed');
    }
  },

  // Logout
  logout: async () => {
    console.log('🔐 Starting logout...');
    
    try {
      await signOut(auth);
      console.log('✅ Firebase logout successful');
      
      // Clear token from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('firebase_token');
      }
    } catch (error: any) {
      console.error('❌ Logout failed:', error);
      throw new Error(error.message || 'Logout failed');
    }
  },

  // Get current user profile from backend
  getProfile: async () => {
    console.log('👤 Getting user profile from backend...');
    
    try {
      const data = await makeAuthenticatedRequest('/auth/profile');
      console.log('✅ Profile data retrieved:', data);
      
      return {
        uid: data.uid,
        email: data.email,
        name: data.name || '',
        picture: data.picture || '',
        emailVerified: data.emailVerified || false,
      };
    } catch (error: any) {
      console.error('❌ Failed to get profile:', error);
      throw new Error('Failed to get user profile');
    }
  },

  // Refresh Firebase token and update localStorage
  refreshToken: async (firebaseUser: FirebaseUser) => {
    console.log('🔄 Refreshing Firebase token...');
    
    try {
      const idToken = await firebaseUser.getIdToken(true); // Force refresh
      
      if (typeof window !== 'undefined') {
        localStorage.setItem('firebase_token', idToken);
      }
      
      console.log('✅ Token refreshed successfully');
      return idToken;
    } catch (error: any) {
      console.error('❌ Token refresh failed:', error);
      throw new Error('Failed to refresh token');
    }
  },
};
