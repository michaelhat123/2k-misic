// google-oauth.ts - Custom Google Sign-In with JavaScript SDK
declare global {
  interface Window {
    google: any;
    handleGoogleSignIn: (response: any) => void;
  }
}

export class GoogleOAuth {
  private clientId: string;
  private isInitialized: boolean = false;

  constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

    // Throw error if client ID is missing
    if (!this.clientId) {
      throw new Error('❌ NEXT_PUBLIC_GOOGLE_CLIENT_ID is required but not set in environment variables');
    }

    this.loadGoogleScript();
  }

  // Load Google Identity Services script
  private loadGoogleScript(): void {
    if (typeof window === 'undefined') return;

    // Check if script is already loaded
    if (document.querySelector('script[src*="accounts.google.com"]')) {
      this.initializeGoogleSignIn();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.initializeGoogleSignIn();
    };
    document.head.appendChild(script);
  }

  // Initialize Google Sign-In
  private initializeGoogleSignIn(): void {
    if (typeof window === 'undefined' || !window.google) return;

    try {
      window.google.accounts.id.initialize({
        client_id: this.clientId,
        callback: this.handleCredentialResponse.bind(this),
        auto_select: false,
        cancel_on_tap_outside: true,
        use_fedcm_for_prompt: false, // Disable FedCM to avoid the error
        itp_support: true,
      });

      this.isInitialized = true;
    } catch (error) {
      // Fallback to OAuth redirect if GSI fails
      this.initializeFallbackOAuth();
    }
  }

  // Fallback OAuth implementation
  private initializeFallbackOAuth(): void {
    this.isInitialized = true; // Mark as initialized to allow fallback
  }

  // Handle the credential response from Google
  private async handleCredentialResponse(response: any): Promise<void> {
    try {
      // Send the credential to your backend
      const apiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/auth/google-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          credential: response.credential 
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.message || 'Google sign-in failed');
      }
      
      const { access_token, refresh_token, user } = await apiResponse.json();
      
      // Store tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('auth_token', access_token);
        if (refresh_token) {
          localStorage.setItem('refresh_token', refresh_token);
        }
      }

      // Trigger custom event for auth provider to pick up
      window.dispatchEvent(new CustomEvent('googleSignInSuccess', { 
        detail: { user, token: access_token } 
      }));

    } catch (error: any) {
      window.dispatchEvent(new CustomEvent('googleSignInError', { 
        detail: { error: error?.message || 'Unknown error' } 
      }));
    }
  }

  // Render Google Sign-In button
  renderButton(elementId: string, options: any = {}): void {
    if (!this.isInitialized || typeof window === 'undefined' || !window.google) {
      return;
    }

    const defaultOptions = {
      type: 'standard',
      shape: 'rectangular',
      theme: 'outline',
      text: 'signin_with',
      size: 'large',
      logo_alignment: 'left',
      width: '100%',
      ...options
    };

    try {
      window.google.accounts.id.renderButton(
        document.getElementById(elementId),
        defaultOptions
      );
    } catch (error) {
      // Silent fail
    }
  }

  // Prompt for One Tap sign-in
  promptOneTap(): void {
    if (!this.isInitialized || typeof window === 'undefined' || !window.google) {
      return;
    }

    try {
      window.google.accounts.id.prompt();
    } catch (error) {
      // Silent fail
    }
  }

  // Manual sign-in trigger - using popup mode
  signIn(redirectTo?: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      // Store where to redirect after successful auth
      const targetUrl = redirectTo || window.location.pathname + window.location.search;
      sessionStorage.setItem('redirect_after_login', targetUrl);
      
      // Check if we're in Electron
      const isElectron = (typeof window !== 'undefined' && 
                         (window as any).electron !== undefined);
      
      if (isElectron) {
        this.openExternalBrowser();
      } else {
        // Use popup mode for web
        this.openPopupAuth();
      }
    } catch (error) {
      // Silent fail
    }
  }

  // Open external browser for Electron
  private openExternalBrowser(): void {
    const authUrl = this.generateOAuthUrl();
    
    // Create a hidden link and click it - Electron's will-navigate will intercept
    const link = document.createElement('a');
    link.href = authUrl;
    link.target = '_blank';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // Open popup for OAuth
  private openPopupAuth(): void {
    const authUrl = this.generateOAuthUrl();
    
    // Open popup window
    const popup = window.open(
      authUrl,
      'google-auth',
      'width=500,height=600,scrollbars=yes,resizable=yes,status=yes,location=yes,toolbar=no,menubar=no'
    );

    if (!popup) {
      window.location.href = authUrl;
      return;
    }

    // Listen for popup completion
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkClosed);
        // Trigger a check for authentication success
        window.dispatchEvent(new CustomEvent('googleAuthPopupClosed'));
      }
    }, 1000);

    // Listen for messages from popup
    const messageListener = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', messageListener);
        
        // Trigger success event
        window.dispatchEvent(new CustomEvent('googleSignInSuccess', { 
          detail: event.data.payload 
        }));
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        clearInterval(checkClosed);
        popup.close();
        window.removeEventListener('message', messageListener);
      }
    };

    window.addEventListener('message', messageListener);
  }

  // Generate OAuth URL for fallback
  private generateOAuthUrl(): string {
    // Always use localhost/web callback URL - Google doesn't accept custom protocols
    // For Electron, the callback page will handle communication back to the app
    const redirectUri = `${window.location.origin}/auth/callback`;
    
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
      state: this.generateState()
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  // Generate CSRF state token
  private generateState(): string {
    const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('oauth_state', state);
      // Also store in localStorage for Electron to access
      localStorage.setItem('pending_oauth_state', state);
    }
    return state;
  }
}

// Export singleton instance
export const googleOAuth = new GoogleOAuth();
