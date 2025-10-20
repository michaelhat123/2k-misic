import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function AuthCallback() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    // Set mounted to true after hydration
    setMounted(true);
  }, []);
  
  useEffect(() => {
    
    // Check if we're in a popup window
    const isPopup = window.opener && window.opener !== window;
    
    if (isPopup) {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');
      
      if (error) {
        // Send error to parent window
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error
        }, window.location.origin);
        window.close();
      } else if (code && state) {
        // Process auth and send success to parent window
        handlePopupAuth(code, state);
      } else {
        // No auth data
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: 'No authorization code received'
        }, window.location.origin);
        window.close();
      }
    } else {
      // Regular redirect mode (fallback)
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      // Check if we're in external browser (not Electron)
      const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');
      const isExternalBrowser = !isElectron && code && state;
      
      if (isExternalBrowser) {
        // We're in external browser after OAuth - process auth and show success page
        handleExternalBrowserAuth(code!, state!);
      } else if (code && state) {
        // We're in Electron app - redirect with auth params
        const redirectUrl = sessionStorage.getItem('redirect_after_login') || '/';
        sessionStorage.removeItem('redirect_after_login');
        const separator = redirectUrl.includes('?') ? '&' : '?';
        const finalUrl = `${redirectUrl}${separator}auth_code=${code}&auth_state=${state}`;
        window.location.replace(finalUrl);
      } else {
        const redirectUrl = sessionStorage.getItem('redirect_after_login') || '/';
        sessionStorage.removeItem('redirect_after_login');
        window.location.replace(redirectUrl);
      }
    }
  }, []);

  // Handle authentication in external browser (for Electron)
  const handleExternalBrowserAuth = async (code: string, state: string) => {
    try {
      // Call your auth API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code,
          redirectUri: `${window.location.origin}/auth/callback`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }));
        throw new Error(errorData.message || 'Google sign-in failed');
      }
      
      const { access_token, refresh_token, user } = await response.json();
      
      // Store tokens in localStorage for this browser
      localStorage.setItem('auth_token', access_token);
      if (refresh_token) {
        localStorage.setItem('refresh_token', refresh_token);
      }
      
      // Try to send tokens to Electron app via fetch (will only work if Electron is running)
      try {
        // This will fail in regular browser but succeed if called from Electron's context
        await fetch('http://localhost:3000/api/electron-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            access_token, 
            refresh_token, 
            user,
            source: 'external_browser'
          })
        }).catch(() => {});
      } catch (e) {
        // Expected to fail in web browser
      }
    } catch (error: any) {
      localStorage.setItem('oauth_error', error.message);
    }
  };

  // Handle authentication in popup mode
  const handlePopupAuth = async (code: string, state: string) => {
    try {
      // Call your auth API
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          code,
          redirectUri: `${window.location.origin}/auth/callback`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Authentication failed' }));
        throw new Error(errorData.message || 'Google sign-in failed');
      }
      
      const { access_token, refresh_token, user } = await response.json();
      
      // Store tokens in parent window
      if (window.opener) {
        window.opener.localStorage.setItem('auth_token', access_token);
        if (refresh_token) {
          window.opener.localStorage.setItem('refresh_token', refresh_token);
        }
        
        // Send success message to parent
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_SUCCESS',
          payload: { user, token: access_token }
        }, window.location.origin);
      }
      
      window.close();
    } catch (error: any) {
      if (window.opener) {
        window.opener.postMessage({
          type: 'GOOGLE_AUTH_ERROR',
          error: error.message
        }, window.location.origin);
      }
      
      window.close();
    }
  };

  // Return EXACT same loader as MainLayout - gorgeous purple/sky blue with spinning music icon
  return (
    <div className="dark min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* EXACT Animated Background from app */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-purple-500/5 to-blue-600/5" />

        {/* Static Gradient Orbs */}
        <div
          className="absolute w-96 h-96 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-full blur-3xl"
          style={{
            left: "10%",
            top: "20%",
          }}
        />

        <div
          className="absolute w-80 h-80 bg-gradient-to-r from-purple-500/15 to-pink-500/15 rounded-full blur-3xl"
          style={{
            right: "10%",
            bottom: "20%",
          }}
        />

        {/* Animated Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
              <stop offset="50%" stopColor="currentColor" stopOpacity="0.5" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          {mounted && Array.from({ length: 5 }).map((_, i) => {
            // Generate consistent random values only on client side
            const randomX1 = Math.random() * 100
            const randomY1 = Math.random() * 100
            const randomX2 = Math.random() * 100
            const randomY2 = Math.random() * 100
            const randomDuration = Math.random() * 2 + 1
            
            return (
              <motion.line
                key={i}
                x1={randomX1 + "%"}
                y1={randomY1 + "%"}
                x2={randomX2 + "%"}
                y2={randomY2 + "%"}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.3 }}
                transition={{
                  duration: randomDuration,
                  repeat: Number.POSITIVE_INFINITY,
                  repeatType: "reverse",
                  delay: i * 0.2,
                }}
              />
            )
          })}
        </svg>

        {/* Pulsing Lights */}
        {mounted && Array.from({ length: 8 }).map((_, i) => {
          // Generate consistent random values only on client side
          const randomX = Math.random() * (typeof window !== "undefined" ? window.innerWidth : 800)
          const randomY = Math.random() * (typeof window !== "undefined" ? window.innerHeight : 600)
          const randomDuration = Math.random() * 2 + 1
          
          return (
            <motion.div
              key={i}
              className="absolute w-4 h-4 bg-primary/30 rounded-full blur-sm"
              initial={{
                x: randomX,
                y: randomY,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: randomDuration,
                repeat: Number.POSITIVE_INFINITY,
                delay: i * 0.3,
              }}
            />
          )
        })}
      </div>

      {/* Centered success message - EA style */}
      <div className="relative z-10" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        paddingBottom: '240px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* Logo */}
          <img 
            src="/128.png" 
            alt="2K Music" 
            style={{
              width: '80px',
              height: '80px'
            }}
          />
          
          {/* Success text */}
          <div style={{
            textAlign: 'center',
            maxWidth: '500px',
            padding: '0 20px'
          }}>
            <h1 className="gradient-heading">
              You're all set
            </h1>
            <p style={{
              color: '#94a3b8',
              fontSize: '18px',
              lineHeight: '1.6',
              fontWeight: '400',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              marginBottom: '8px'
            }}>
              You can now close this window and head back to the
            </p>
            <p style={{
              color: '#94a3b8',
              fontSize: '18px',
              lineHeight: '1.6',
              fontWeight: '400',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              marginTop: '0'
            }}>
              2k Music app
            </p>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        * {
          box-sizing: border-box;
        }
        
        /* Dark mode theme variables */
        :root {
          --background: 222.2 84% 4.9%;
          --primary: 195 100% 50%;
        }
        
        /* Dark mode background matching app */
        html, body, #__next {
          background-color: hsl(222.2, 84%, 4.9%) !important;
          margin: 0 !important;
          padding: 0 !important;
          min-height: 100vh !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        /* Tailwind-like utility classes */
        .from-primary\/5 {
          --tw-gradient-from: hsl(195 100% 50% / 0.05);
          --tw-gradient-to: hsl(195 100% 50% / 0);
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
        }
        .via-purple-500\/5 {
          --tw-gradient-to: hsl(266 91% 65% / 0);
          --tw-gradient-stops: var(--tw-gradient-from), hsl(266 91% 65% / 0.05), var(--tw-gradient-to);
        }
        .to-blue-600\/5 {
          --tw-gradient-to: hsl(221 83% 53% / 0.05);
        }
        .bg-gradient-to-br {
          background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
        }
        .from-primary\/20 {
          --tw-gradient-from: hsl(195 100% 50% / 0.2);
          --tw-gradient-to: hsl(195 100% 50% / 0);
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
        }
        .to-blue-500\/20 {
          --tw-gradient-to: hsl(217 91% 60% / 0.2);
        }
        .from-purple-500\/15 {
          --tw-gradient-from: hsl(266 91% 65% / 0.15);
          --tw-gradient-to: hsl(266 91% 65% / 0);
          --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to);
        }
        .to-pink-500\/15 {
          --tw-gradient-to: hsl(330 81% 60% / 0.15);
        }
        .bg-gradient-to-r {
          background-image: linear-gradient(to right, var(--tw-gradient-stops));
        }
        .bg-primary\/30 {
          background-color: hsl(195 100% 50% / 0.3);
        }
        .blur-3xl {
          filter: blur(64px);
        }
        .blur-sm {
          filter: blur(4px);
        }
        
        .gradient-heading {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 24px;
          letter-spacing: -1px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background: linear-gradient(135deg, #00bfff, #3b82f6, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
        .gradient-app-name {
          font-weight: 700;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #00bfff, #3b82f6, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
        .gradient-shortcut {
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 1px;
          margin: 0;
          line-height: 1.4;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          background: linear-gradient(135deg, #00bfff, #3b82f6, #7c3aed);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-fill-color: transparent;
        }
      `}</style>
    </div>
  );
}
