import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { GoogleOAuthService } from '@/services/googleOAuthService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Processing Google authentication...');
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    console.log('GoogleCallback mounted, search params:', searchParams.toString());
    handleOAuthCallback();
  }, []);

  const handleOAuthCallback = async () => {
    try {
      console.log('Starting OAuth callback handler');
      // Get authorization code from URL
      const authCode = searchParams.get('code');
      const error = searchParams.get('error');

      console.log('Auth code:', authCode?.substring(0, 20) + '...');
      console.log('Error:', error);

      if (error) {
        throw new Error(`OAuth error: ${error}`);
      }

      if (!authCode) {
        throw new Error('No authorization code received');
      }

      setMessage('Exchanging authorization code for tokens...');

      // Initialize OAuth service
      await GoogleOAuthService.initialize();

      // Exchange code for tokens
      const tokens = await GoogleOAuthService.handleCallback(authCode);

      setMessage('Verifying Google Drive access...');

      // Test Drive access
      const driveTest = await GoogleOAuthService.testDriveAccess();
      
      if (!driveTest.success) {
        throw new Error(driveTest.message);
      }

      // Get user info
      const userInfo = await GoogleOAuthService.getUserInfo();
      
      setStatus('success');
      setMessage('Google Drive authentication successful!');
      setUserEmail(userInfo?.email || 'Unknown');

      // Redirect back to where user came from after a short delay
      setTimeout(() => {
        const returnUrl = localStorage.getItem('google_oauth_return_url') || '/admin';
        localStorage.removeItem('google_oauth_return_url');
        navigate(returnUrl);
      }, 2000);

    } catch (error) {
      console.error('OAuth callback error:', error);
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Authentication failed');
    }
  };

  const handleRetry = () => {
    GoogleOAuthService.startAuthFlow();
  };

  const handleGoBack = () => {
    const returnUrl = localStorage.getItem('google_oauth_return_url') || '/admin';
    localStorage.removeItem('google_oauth_return_url');
    navigate(returnUrl);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'processing' && <Loader2 className="w-12 h-12 animate-spin text-blue-600" />}
            {status === 'success' && <CheckCircle className="w-12 h-12 text-green-600" />}
            {status === 'error' && <XCircle className="w-12 h-12 text-red-600" />}
          </div>
          
          <CardTitle>
            {status === 'processing' && 'Authenticating...'}
            {status === 'success' && 'Success!'}
            {status === 'error' && 'Authentication Failed'}
          </CardTitle>
          
          <CardDescription>
            Google Drive Integration Setup
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-sm text-gray-600">
            {message}
          </p>

          {status === 'success' && userEmail && (
            <div className="p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Authenticated as: <strong>{userEmail}</strong>
              </p>
              <p className="text-xs text-green-600 mt-1">
                Redirecting you back to the admin panel...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  Authentication failed. Please try again.
                </p>
              </div>
              
              <div className="flex gap-2 justify-center">
                <Button onClick={handleRetry} variant="default" size="sm">
                  Try Again
                </Button>
                <Button onClick={handleGoBack} variant="outline" size="sm">
                  Go Back
                </Button>
              </div>
            </div>
          )}

          {status === 'processing' && (
            <div className="space-y-2 text-xs text-gray-500">
              <p>🔐 Securing your Google Drive connection...</p>
              <p>📂 Verifying folder access permissions...</p>
              <p>✨ Setting up intelligent folder discovery...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
