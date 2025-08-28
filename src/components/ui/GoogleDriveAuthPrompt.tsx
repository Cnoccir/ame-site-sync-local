import React from 'react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { GoogleDriveIcon, ShieldCheck, Lock, Zap } from 'lucide-react';
import { EnhancedGoogleDriveService } from '@/services/enhancedGoogleDriveService';

interface GoogleDriveAuthPromptProps {
  title?: string;
  message?: string;
  onAuthenticate?: () => void;
  onCancel?: () => void;
  showBenefits?: boolean;
}

export const GoogleDriveAuthPrompt: React.FC<GoogleDriveAuthPromptProps> = ({
  title = "Google Drive Authentication Required",
  message = "To search existing folders and create new project folders, please authenticate with Google Drive.",
  onAuthenticate,
  onCancel,
  showBenefits = true
}) => {

  const handleAuthenticate = async () => {
    try {
      if (onAuthenticate) {
        onAuthenticate();
      } else {
        await EnhancedGoogleDriveService.promptAuthentication();
      }
    } catch (error) {
      console.error('Authentication failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 p-3 bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center">
          <GoogleDriveIcon className="w-8 h-8 text-blue-600" />
        </div>
        
        <CardTitle className="text-xl font-semibold text-gray-900">
          {title}
        </CardTitle>
        
        <CardDescription className="text-gray-600">
          {message}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {showBenefits && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-sm text-gray-900 mb-2">With Google Drive access, you can:</h4>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Zap className="w-4 h-4 text-green-500" />
                <span>Search existing customer folders across all AME locations</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <ShieldCheck className="w-4 h-4 text-green-500" />
                <span>Create structured project folders automatically</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Lock className="w-4 h-4 text-green-500" />
                <span>Link existing folders to customer records</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <Button 
            onClick={handleAuthenticate}
            className="flex-1"
          >
            <GoogleDriveIcon className="w-4 h-4 mr-2" />
            Authenticate with Google Drive
          </Button>
          
          {onCancel && (
            <Button 
              variant="outline" 
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="text-xs text-gray-500 text-center">
          <p>You'll be redirected to Google to sign in securely.</p>
          <p className="mt-1">We only access your Google Drive folders for project management.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleDriveAuthPrompt;
