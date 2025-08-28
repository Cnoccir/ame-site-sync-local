import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Upload } from 'lucide-react';

// Temporarily disabled due to TypeScript compatibility issues with database tables
export const DataImportInterface: React.FC = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Customer & Contract Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Upload className="h-4 w-4" />
            <AlertDescription>
              Data import functionality is temporarily disabled while database schema is being updated.
              Please check back later.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};