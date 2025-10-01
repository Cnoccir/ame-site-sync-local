// Feature Flag Demo Component - Shows current feature flags and system status
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { FEATURE_FLAGS, FeatureFlagService } from '@/config/featureFlags';
import { useFeatureFlag } from '@/components/shared/FeatureGate';
import { useUserRole } from '@/services/userRoleService';

export const FeatureFlagStatus: React.FC = () => {
  const { role, isTech, isAdmin } = useUserRole();
  
  // Key feature flags to show
  const keyFlags = [
    { key: 'TECH_MODE', label: 'Tech Mode', description: 'Tech-focused interface' },
    { key: 'HIDE_ADMIN_LOGIN_BY_DEFAULT', label: 'Hide Admin Login', description: 'Admin login hidden by default' },
    { key: 'PM_WORKFLOW_V2', label: 'PM Workflow', description: '4-phase PM system' },
    { key: 'GOOGLE_DRIVE_INTEGRATION', label: 'Google Drive', description: 'Project folder integration' },
    { key: 'SIMPRO_INTEGRATION', label: 'Simpro Integration', description: 'Customer lookup' },
    { key: 'NETWORK_ANALYSIS', label: 'Network Analysis', description: 'Tridium export processing' }
  ] as const;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Info className="w-5 h-5 text-blue-600" />
            <span>AME Inc System Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* User Information */}
            <div>
              <h3 className="font-semibold mb-2">Current User</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Role:</span>
                  <Badge variant={isTech ? 'default' : isAdmin ? 'destructive' : 'secondary'}>
                    {role.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Tech Mode:</span>
                  {isTech ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>

            {/* System Environment */}
            <div>
              <h3 className="font-semibold mb-2">Environment</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span>Mode:</span>
                  <Badge variant="outline">
                    {process.env.NODE_ENV || 'development'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Build:</span>
                  <Badge variant="outline">
                    Tech-Focused
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Flags Status */}
      <Card>
        <CardHeader>
          <CardTitle>Key Feature Flags</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyFlags.map((flag) => {
              const isEnabled = FeatureFlagService.isEnabled(flag.key as keyof typeof FEATURE_FLAGS);
              return (
                <div key={flag.key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-medium">{flag.label}</div>
                    <div className="text-sm text-gray-600">{flag.description}</div>
                  </div>
                  {isEnabled ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* System Capabilities */}
      <Card>
        <CardHeader>
          <CardTitle>Available Capabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Tech-Focused Interface:</strong> Clean PM workflow designed for field technicians
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Preserved Features:</strong> Google Drive, Simpro lookup, tech assignments, and network analysis all available
              </AlertDescription>
            </Alert>
            
            <Alert className="bg-purple-50 border-purple-200">
              <Info className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                <strong>Professional Reports:</strong> Automated PDF generation with AME Inc branding
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
