import { useState, useEffect, useCallback } from 'react';
import { GoogleOAuthService } from '@/services/googleOAuthService';
import { toast } from '@/hooks/use-toast';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userInfo: any | null;
  error: string | null;
}

interface UseGoogleDriveAuthResult extends AuthState {
  authenticateWithPopup: () => Promise<boolean>;
  signOut: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

export const useGoogleDriveAuth = (): UseGoogleDriveAuthResult => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    userInfo: null,
    error: null
  });

  // Check authentication status on mount and when requested
  const checkAuthStatus = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await GoogleOAuthService.initialize();
      const isAuth = await GoogleOAuthService.isAuthenticated();
      
      if (isAuth) {
        const userInfo = await GoogleOAuthService.getUserInfo();
        setAuthState({
          isAuthenticated: true,
          isLoading: false,
          userInfo,
          error: null
        });
      } else {
        setAuthState({
          isAuthenticated: false,
          isLoading: false,
          userInfo: null,
          error: null
        });
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        userInfo: null,
        error: error instanceof Error ? error.message : 'Authentication check failed'
      });
    }
  }, []);

  // Authenticate using popup flow
  const authenticateWithPopup = useCallback(async (): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      await GoogleOAuthService.initialize();
      
      return new Promise((resolve) => {
        // Listen for popup messages
        const messageListener = (event: MessageEvent) => {
          // Verify origin for security
          if (event.origin !== window.location.origin) {
            return;
          }

          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            window.removeEventListener('message', messageListener);
            
            // Update auth state
            setAuthState({
              isAuthenticated: true,
              isLoading: false,
              userInfo: event.data.userInfo,
              error: null
            });

            toast({
              title: "Authentication Successful",
              description: `Connected to Google Drive as ${event.data.userInfo?.email}`,
            });

            resolve(true);
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            window.removeEventListener('message', messageListener);
            
            setAuthState(prev => ({
              ...prev,
              isLoading: false,
              error: event.data.error
            }));

            toast({
              title: "Authentication Failed",
              description: event.data.error,
              variant: "destructive"
            });

            resolve(false);
          }
        };

        window.addEventListener('message', messageListener);

        // Start popup auth flow
        GoogleOAuthService.startPopupAuthFlow().catch((error) => {
          window.removeEventListener('message', messageListener);
          
          setAuthState(prev => ({
            ...prev,
            isLoading: false,
            error: error.message
          }));

          toast({
            title: "Authentication Error",
            description: error.message,
            variant: "destructive"
          });

          resolve(false);
        });
      });
    } catch (error) {
      console.error('Popup authentication error:', error);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));

      toast({
        title: "Authentication Error",
        description: error instanceof Error ? error.message : 'Authentication failed',
        variant: "destructive"
      });

      return false;
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));
      
      await GoogleOAuthService.signOut();
      
      setAuthState({
        isAuthenticated: false,
        isLoading: false,
        userInfo: null,
        error: null
      });

      toast({
        title: "Signed Out",
        description: "You have been signed out of Google Drive",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Sign out failed'
      }));

      toast({
        title: "Sign Out Error",
        description: error instanceof Error ? error.message : 'Sign out failed',
        variant: "destructive"
      });
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  return {
    ...authState,
    authenticateWithPopup,
    signOut,
    checkAuthStatus
  };
};
