import React, { useState, useEffect } from 'react';
import { GoogleOAuthService } from '@/services/googleOAuthService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, RefreshCw, ExternalLink, User, HardDrive } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface TokenInfo {
  access_token: string;
  expires_at: string;
  user_info?: {
    id: string;
    email: string;
    name: string;
    picture?: string;
    verified_email: boolean;
  };
}

interface DriveTestResult {
  success: boolean;
  message: string;
  folders_found?: number;
  user_email?: string;
}

export const GoogleOAuthTestPanel: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [authStatus, setAuthStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  const [driveTestResult, setDriveTestResult] = useState<DriveTestResult | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    initializeService();
  }, []);

  const initializeService = async () => {
    try {
      await GoogleOAuthService.initialize();
      setIsInitialized(true);
      await checkAuthStatus();
    } catch (error) {
      console.error('Failed to initialize OAuth service:', error);
      setAuthStatus('unauthenticated');
    }
  };

  const checkAuthStatus = async () => {
    try {
      const isAuth = await GoogleOAuthService.isAuthenticated();
      if (isAuth) {
        const tokens = await GoogleOAuthService['getValidTokens']();
        const userInfo = await GoogleOAuthService.getUserInfo();
        if (tokens) {
          setTokenInfo({
            access_token: tokens.access_token.substring(0, 20) + '...',
            expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
            user_info: userInfo || undefined,
          });
        }
        setAuthStatus('authenticated');
      } else {
        setAuthStatus('unauthenticated');
        setTokenInfo(null);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthStatus('unauthenticated');
      setTokenInfo(null);
    }
  };

  const handleAuthenticate = async () => {
    try {
      localStorage.setItem('google_oauth_return_url', window.location.pathname);
      await GoogleOAuthService.startAuthFlow();
    } catch (error) {
      console.error('Failed to start auth flow:', error);
    }
  };

  const handleRefreshToken = async () => {
    setIsRefreshing(true);
    try {
      // Re-check auth status to get fresh tokens
      await checkAuthStatus();
    } catch (error) {
      console.error('Failed to refresh token:', error);
      setAuthStatus('unauthenticated');
      setTokenInfo(null);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTestDriveAccess = async () => {
    setIsTesting(true);
    try {
      const result = await GoogleOAuthService.testDriveAccess();
      setDriveTestResult(result);
    } catch (error) {
      console.error('Drive test failed:', error);
      setDriveTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await GoogleOAuthService.signOut();
      setAuthStatus('unauthenticated');
      setTokenInfo(null);
      setDriveTestResult(null);
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  };

  const getTokenExpirationStatus = () => {
    if (!tokenInfo?.expires_at) return null;
    
    const expiresAt = new Date(tokenInfo.expires_at);
    const now = new Date();
    const diffMinutes = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 0) {
      return { status: 'expired', color: 'destructive', text: 'Expired' };
    } else if (diffMinutes < 5) {
      return { status: 'expiring', color: 'secondary', text: `Expires in ${diffMinutes}m` };
    } else if (diffMinutes < 60) {
      return { status: 'valid', color: 'default', text: `Expires in ${diffMinutes}m` };
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return { status: 'valid', color: 'default', text: `Expires in ${diffHours}h` };
    }
  };

  if (!isInitialized) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Initializing Google OAuth service...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Google OAuth Status
          </CardTitle>
          <CardDescription>
            Test and manage Google Drive authentication for intelligent folder discovery
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Authentication Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {authStatus === 'loading' && <Loader2 className="w-4 h-4 animate-spin" />}
              {authStatus === 'authenticated' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {authStatus === 'unauthenticated' && <XCircle className="w-4 h-4 text-red-500" />}
              
              <span className="font-medium">
                {authStatus === 'loading' && 'Checking...'}
                {authStatus === 'authenticated' && 'Authenticated'}
                {authStatus === 'unauthenticated' && 'Not Authenticated'}
              </span>
            </div>

            {authStatus === 'unauthenticated' && (
              <Button onClick={handleAuthenticate} size="sm">
                Authenticate with Google
              </Button>
            )}

            {authStatus === 'authenticated' && (
              <div className="flex gap-2">
                <Button 
                  onClick={handleRefreshToken} 
                  size="sm" 
                  variant="outline"
                  disabled={isRefreshing}
                >
                  {isRefreshing ? (
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="w-3 h-3 mr-1" />
                  )}
                  Refresh
                </Button>
                <Button onClick={handleSignOut} size="sm" variant="destructive">
                  Sign Out
                </Button>
              </div>
            )}
          </div>

          {/* User Information */}
          {tokenInfo?.user_info && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                {tokenInfo.user_info.picture ? (
                  <img 
                    src={tokenInfo.user_info.picture} 
                    alt="Profile" 
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <User className="w-8 h-8 text-gray-400" />
                )}
                
                <div className="flex-1">
                  <div className="font-medium">{tokenInfo.user_info.name}</div>
                  <div className="text-sm text-gray-500">{tokenInfo.user_info.email}</div>
                </div>
                
                {tokenInfo.user_info.verified_email && (
                  <Badge variant="default" className="text-xs">
                    Verified
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Token Information */}
          {tokenInfo && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Access Token:</span>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {tokenInfo.access_token}
                </code>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span>Expires:</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">
                    {new Date(tokenInfo.expires_at).toLocaleString()}
                  </span>
                  {(() => {
                    const status = getTokenExpirationStatus();
                    return status ? (
                      <Badge variant={status.color as any} className="text-xs">
                        {status.text}
                      </Badge>
                    ) : null;
                  })()}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Google Drive Test */}
      {authStatus === 'authenticated' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="w-5 h-5" />
              Google Drive Access Test
            </CardTitle>
            <CardDescription>
              Verify that your Google account can access the required folders
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <Button 
              onClick={handleTestDriveAccess} 
              disabled={isTesting}
              className="w-full"
            >
              {isTesting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <HardDrive className="w-4 h-4 mr-2" />
              )}
              Test Drive Access
            </Button>

            {driveTestResult && (
              <Alert>
                <div className="flex items-start gap-2">
                  {driveTestResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <AlertDescription>
                      <strong>
                        {driveTestResult.success ? 'Success!' : 'Failed:'}
                      </strong>
                      <br />
                      {driveTestResult.message}
                      
                      {driveTestResult.success && driveTestResult.user_email && (
                        <div className="mt-2 text-sm">
                          <strong>Drive User:</strong> {driveTestResult.user_email}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
