import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Settings } from 'lucide-react';

// Temporarily disabled due to TypeScript compatibility issues with database tables
export function GoogleDriveAdminPanel() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Google Drive Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Google Drive management functionality is temporarily disabled while database schema is being updated.
              Please check back later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}