"use client"

import { useEffect, useRef } from 'react';
import { googleOAuth } from '@/lib/google-oauth';

interface GoogleSignInButtonProps {
  onSuccess?: (user: any) => void;
  onError?: (error: string) => void;
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  width?: string;
  className?: string;
}

export default function GoogleSignInButton({
  onSuccess,
  onError,
  theme = 'outline',
  size = 'large',
  text = 'signin_with',
  shape = 'rectangular',
  width = '100%',
  className = ''
}: GoogleSignInButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const buttonId = `google-signin-${Math.random().toString(36).substring(7)}`;

  useEffect(() => {
    // Set the ID on the button element
    if (buttonRef.current) {
      buttonRef.current.id = buttonId;
    }

    // Listen for Google Sign-In events
    const handleSuccess = (event: CustomEvent) => {
      onSuccess?.(event.detail);
    };

    const handleError = (event: CustomEvent) => {
      onError?.(event.detail.error);
    };

    window.addEventListener('googleSignInSuccess', handleSuccess as EventListener);
    window.addEventListener('googleSignInError', handleError as EventListener);

    // Render the Google button after a short delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        googleOAuth.renderButton(buttonId, {
          type: 'standard',
          shape,
          theme,
          text,
          size,
          logo_alignment: 'left',
          width
        });
      } catch (error) {
        // Silent fail
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('googleSignInSuccess', handleSuccess as EventListener);
      window.removeEventListener('googleSignInError', handleError as EventListener);
    };
  }, [buttonId, theme, size, text, shape, width, onSuccess, onError]);

  return (
    <div className={className}>
      <div 
        ref={buttonRef}
        id={buttonId}
        style={{ 
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}
      />
    </div>
  );
}

// Custom styled Google Sign-In button (alternative)
export function CustomGoogleSignInButton({
  onClick,
  disabled = false,
  className = ''
}: {
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const handleClick = () => {
    if (!disabled) {
      onClick?.();
      googleOAuth.signIn();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        flex items-center justify-center w-full px-4 py-3 
        border border-gray-300 rounded-lg shadow-sm bg-white 
        hover:bg-gray-50 focus:outline-none focus:ring-2 
        focus:ring-offset-2 focus:ring-blue-500 transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <svg
        className="w-5 h-5 mr-3"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      <span className="text-sm font-medium text-gray-700">
        Continue with Google
      </span>
    </button>
  );
}
