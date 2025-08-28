import { supabase } from '@/integrations/supabase/client';

/**
 * Google OAuth Service for Web Applications
 * Handles Google Drive authentication directly in the browser
 */

interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
  scopes: string[];
}

interface AuthTokens {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

export class GoogleOAuthService {
  private static config: GoogleOAuthConfig;
  
  /**
   * Initialize the OAuth service with configuration
   */
  static async initialize(): Promise<void> {
    // Use environment variables for OAuth configuration
    const clientId = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID || '735781069629-s0jv1cpbcdrpm9qjip0bmjgsh8f4s7tb.apps.googleusercontent.com';
    const redirectUri = import.meta.env.VITE_GOOGLE_OAUTH_REDIRECT_URI || `${window.location.origin}/google/callback`;
    
    this.config = {
      clientId,
      redirectUri,
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ]
    };
  }

  /**
   * Start the OAuth flow by redirecting to Google
   */
  static startAuthFlow(): void {
    if (!this.config) {
      throw new Error('OAuth service not initialized. Call initialize() first.');
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', this.config.clientId);
    authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', this.config.scopes.join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent select_account');
    authUrl.searchParams.append('login_hint', 'raymond@ame-inc.com');

    // Save current location to redirect back after auth
    localStorage.setItem('google_oauth_return_url', window.location.pathname);
    
    // Redirect to Google OAuth
    window.location.href = authUrl.toString();
  }

  /**
   * Start OAuth flow in a popup window (better UX - doesn't lose form data)
   */
  static async startPopupAuthFlow(): Promise<AuthTokens> {
    if (!this.config) {
      throw new Error('OAuth service not initialized. Call initialize() first.');
    }

    return new Promise((resolve, reject) => {
      const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
      authUrl.searchParams.append('client_id', this.config.clientId);
      authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', this.config.scopes.join(' '));
      authUrl.searchParams.append('access_type', 'offline');
      authUrl.searchParams.append('prompt', 'consent select_account');
      authUrl.searchParams.append('login_hint', 'raymond@ame-inc.com');

      // Open popup window
      const popup = window.open(
        authUrl.toString(),
        'google-oauth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!popup) {
        reject(new Error('Popup blocked. Please allow popups and try again.'));
        return;
      }

      // Monitor the popup for completion
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          reject(new Error('Authentication cancelled by user'));
        }
      }, 1000);

      // Listen for messages from the popup
      const messageListener = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS' && event.data.authCode) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();

          try {
            const tokens = await this.handleCallback(event.data.authCode);
            resolve(tokens);
          } catch (error) {
            reject(error);
          }
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageListener);
          popup.close();
          reject(new Error(event.data.error || 'Authentication failed'));
        }
      };

      window.addEventListener('message', messageListener);

      // Timeout after 10 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageListener);
        if (!popup.closed) {
          popup.close();
        }
        reject(new Error('Authentication timeout'));
      }, 10 * 60 * 1000);
    });
  }

  /**
   * Handle the OAuth callback and exchange code for tokens
   */
  static async handleCallback(authCode: string): Promise<AuthTokens> {
    if (!this.config) {
      throw new Error('OAuth service not initialized');
    }

    try {
      // Exchange authorization code for tokens via our Edge Function
      const { data, error } = await supabase.functions.invoke('google-oauth-exchange', {
        body: {
          authorizationCode: authCode
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Token exchange failed');
      }

      // Extract tokens from edge function response
      const tokens: AuthTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        expires_in: 3600, // 1 hour
        scope: 'drive.readonly userinfo.profile userinfo.email',
        token_type: 'Bearer'
      };

      return tokens;

    } catch (error) {
      console.error('OAuth callback error:', error);
      throw error;
    }
  }

  /**
   * Check if user is currently authenticated with Google Drive
   */
  static async isAuthenticated(): Promise<boolean> {
    try {
      const tokens = await this.getStoredTokens();
      
      if (!tokens) {
        return false;
      }

      // Check if access token is still valid
      return await this.validateAccessToken(tokens.access_token);

    } catch (error) {
      console.error('Auth check error:', error);
      return false;
    }
  }

  /**
   * Get current user's Google Drive info
   */
  static async getUserInfo(): Promise<{ id: string; email: string; name: string; picture?: string; verified_email: boolean } | null> {
    try {
      // First try to get from stored user metadata
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.user_metadata?.google_oauth?.google_user_info) {
        return user.user_metadata.google_oauth.google_user_info;
      }

      // Fallback to API call with current tokens
      const tokens = await this.getValidTokens();
      
      if (!tokens) {
        return null;
      }

      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to get user info');
      }

      const userInfo = await response.json();
      return {
        id: userInfo.id,
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        verified_email: userInfo.verified_email
      };

    } catch (error) {
      console.error('Get user info error:', error);
      return null;
    }
  }

  /**
   * Test Google Drive API access
   */
  static async testDriveAccess(): Promise<{ success: boolean; message: string; userEmail?: string }> {
    try {
      const tokens = await this.getValidTokens();
      
      if (!tokens) {
        return {
          success: false,
          message: 'Not authenticated with Google Drive'
        };
      }

      // Test by calling Drive API
      const response = await fetch('https://www.googleapis.com/drive/v3/about?fields=user', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Drive API error: ${response.status}`);
      }

      const data = await response.json();
      const userEmail = data.user?.emailAddress;

      return {
        success: true,
        message: 'Google Drive access confirmed',
        userEmail
      };

    } catch (error) {
      console.error('Drive access test error:', error);
      return {
        success: false,
        message: `Drive access test failed: ${error.message}`
      };
    }
  }

  /**
   * Revoke Google OAuth tokens and sign out
   */
  static async signOut(): Promise<void> {
    try {
      const tokens = await this.getStoredTokens();
      
      if (tokens?.access_token) {
        // Revoke the token with Google
        await fetch(`https://oauth2.googleapis.com/revoke?token=${tokens.access_token}`, {
          method: 'POST'
        });
      }

      // Clear stored tokens
      await this.clearStoredTokens();

    } catch (error) {
      console.error('Sign out error:', error);
      // Clear tokens anyway
      await this.clearStoredTokens();
    }
  }

  /**
   * Get valid tokens, refreshing if necessary
   */
  private static async getValidTokens(): Promise<AuthTokens | null> {
    let tokens = await this.getStoredTokens();
    
    if (!tokens) {
      return null;
    }

    // Check if access token needs refresh
    if (await this.needsRefresh(tokens)) {
      tokens = await this.refreshAccessToken(tokens);
    }

    return tokens;
  }

  /**
   * Check if access token needs to be refreshed
   */
  private static async needsRefresh(tokens: AuthTokens): Promise<boolean> {
    if (!tokens.access_token) {
      return true;
    }

    // Simple validation - try to use the token
    const isValid = await this.validateAccessToken(tokens.access_token);
    return !isValid;
  }

  /**
   * Validate access token by making a test API call
   */
  private static async validateAccessToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Refresh the access token using refresh token
   */
  private static async refreshAccessToken(tokens: AuthTokens): Promise<AuthTokens> {
    if (!tokens.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      // Use our Edge Function to refresh the token
      const { data, error } = await supabase.functions.invoke('google-oauth-refresh', {
        body: {
          refreshToken: tokens.refresh_token,
          clientId: this.config.clientId
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || 'Token refresh failed');
      }

      const newTokens: AuthTokens = {
        ...tokens,
        ...data.tokens
      };

      // Store the refreshed tokens
      await this.storeTokens(newTokens);

      return newTokens;

    } catch (error) {
      console.error('Token refresh error:', error);
      // If refresh fails, clear tokens to force re-auth
      await this.clearStoredTokens();
      throw error;
    }
  }

  /**
   * Store OAuth tokens securely
   */
  private static async storeTokens(tokens: AuthTokens): Promise<void> {
    try {
      // Store in Supabase user metadata for persistence across devices
      const { error } = await supabase.auth.updateUser({
        data: {
          google_oauth_tokens: {
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expires_in,
            expires_at: Date.now() + (tokens.expires_in * 1000),
            scope: tokens.scope,
            token_type: tokens.token_type
          }
        }
      });

      if (error) {
        console.error('Error storing tokens in Supabase:', error);
        // Fallback to localStorage
        localStorage.setItem('google_oauth_tokens', JSON.stringify(tokens));
      }

    } catch (error) {
      console.error('Token storage error:', error);
      // Fallback to localStorage
      localStorage.setItem('google_oauth_tokens', JSON.stringify(tokens));
    }
  }

  /**
   * Retrieve stored OAuth tokens
   */
  private static async getStoredTokens(): Promise<AuthTokens | null> {
    try {
      // Try to get from Supabase user metadata first
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user?.user_metadata?.google_oauth_tokens) {
        const oauthData = user.user_metadata.google_oauth_tokens;
        return {
          access_token: oauthData.access_token,
          refresh_token: oauthData.refresh_token,
          expires_in: oauthData.expires_in || 3600, // Default to 1 hour
          scope: oauthData.scope || 'drive.readonly userinfo.profile userinfo.email',
          token_type: 'Bearer'
        };
      }
      
      // Fallback: check the old key format (google_oauth) for compatibility
      if (user?.user_metadata?.google_oauth) {
        const oauthData = user.user_metadata.google_oauth;
        return {
          access_token: oauthData.access_token,
          refresh_token: oauthData.refresh_token,
          expires_in: 3600, // Default to 1 hour
          scope: oauthData.scope || 'drive.readonly userinfo.profile userinfo.email',
          token_type: 'Bearer'
        };
      }

      // Fallback to localStorage
      const storedTokens = localStorage.getItem('google_oauth_tokens');
      if (storedTokens) {
        return JSON.parse(storedTokens);
      }

      return null;

    } catch (error) {
      console.error('Token retrieval error:', error);
      return null;
    }
  }

  /**
   * Clear stored OAuth tokens
   */
  private static async clearStoredTokens(): Promise<void> {
    try {
      // Clear from Supabase user metadata
      await supabase.auth.updateUser({
        data: {
          google_oauth_tokens: null
        }
      });

      // Clear from localStorage
      localStorage.removeItem('google_oauth_tokens');

    } catch (error) {
      console.error('Token clearing error:', error);
      // Clear localStorage anyway
      localStorage.removeItem('google_oauth_tokens');
    }
  }
}
