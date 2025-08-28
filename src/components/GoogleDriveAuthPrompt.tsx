import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, FolderOpen, AlertCircle, CheckCircle } from 'lucide-react';
import { useGoogleDriveAuth } from '@/hooks/useGoogleDriveAuth';

interface GoogleDriveAuthPromptProps {
  title?: string;
  description?: string;
  onAuthSuccess?: () => void;
  onAuthError?: (error: string) => void;
  showCard?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const GoogleDriveAuthPrompt: React.FC<GoogleDriveAuthPromptProps> = ({
  title = "Connect to Google Drive",
  description = "To create and manage customer folders, please authenticate with Google Drive.",
  onAuthSuccess,
  onAuthError,
  showCard = true,
  size = 'md'
}) => {
  const { 
    isAuthenticated, 
    isLoading, 
    userInfo, 
    error, 
    authenticateWithPopup,
    signOut,
    checkAuthStatus
  } = useGoogleDriveAuth();

  const handleAuthenticate = async () => {
    const success = await authenticateWithPopup();
    if (success) {
      onAuthSuccess?.();
    } else if (error) {
      onAuthError?.(error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleRetryAuth = async () => {
    await checkAuthStatus();
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg'
  };

  const AuthContent = () => (
    <div className="space-y-4">
      {isLoading ? (
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
          <p className="text-sm text-gray-600">Checking authentication status...</p>
        </div>
      ) : isAuthenticated ? (
        <div className="space-y-4">
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-1">
                <div className="font-medium">✅ Connected to Google Drive</div>
                <div className="text-sm">
                  Authenticated as: <strong>{userInfo?.email || 'Unknown user'}</strong>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 justify-center">
            <Button 
              onClick={handleSignOut} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              Switch Account
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
            
            <div className="space-y-1">
              <h3 className="font-medium text-gray-900">{title}</h3>
              <p className="text-sm text-gray-600">{description}</p>
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="font-medium">Authentication Error</div>
                  <div className="text-sm">{error}</div>
                  <Button 
                    onClick={handleRetryAuth} 
                    variant="outline" 
                    size="sm"
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <Button 
              onClick={handleAuthenticate} 
              disabled={isLoading}
              className="w-full"
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  <FolderOpen className="w-4 h-4 mr-2" />
                  Connect Google Drive
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <div className="flex items-center justify-center gap-2">
                <Shield className="w-3 h-3" />
                <span>Secure OAuth 2.0 authentication</span>
              </div>
              <div className="text-center">
                Required permissions: Drive folder access
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (!showCard) {
    return <AuthContent />;
  }

  return (
    <div className={`w-full ${sizeClasses[size]} mx-auto`}>
      <Card className="border-blue-200">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-lg">Google Drive Integration</CardTitle>
          <CardDescription>
            Secure connection required for folder management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthContent />
        </CardContent>
      </Card>
    </div>
  );
};
