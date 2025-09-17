// Development tool for testing different user roles
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserRole } from '@/services/userRoleService';
import { Shield, Users, Wrench, Crown } from 'lucide-react';

// This component would only be visible in development mode or with a debug flag
export function RoleTester() {
  const { role, permissions, isAdmin, isTech, isManager } = useUserRole();
  const [showDetails, setShowDetails] = useState(false);

  const getRoleIcon = (userRole: string) => {
    switch (userRole) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'tech': return <Wrench className="h-4 w-4" />;
      case 'manager': return <Users className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getRoleColor = (userRole: string) => {
    switch (userRole) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'tech': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'manager': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  // Only show in development or when debug flag is set
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <Card className="border-dashed border-orange-300 bg-orange-50 dark:bg-orange-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Shield className="h-4 w-4 text-orange-600" />
          Development: Role Testing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Current Role:</span>
            <Badge className={`${getRoleColor(role)} flex items-center gap-1`}>
              {getRoleIcon(role)}
              {role.toUpperCase()}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Type Checks:</span>
            <div className="flex gap-1">
              {isAdmin && <Badge variant="outline" className="text-xs">Admin</Badge>}
              {isTech && <Badge variant="outline" className="text-xs">Tech</Badge>}
              {isManager && <Badge variant="outline" className="text-xs">Manager</Badge>}
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs"
          >
            {showDetails ? 'Hide' : 'Show'} Permissions
          </Button>

          {showDetails && (
            <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded border">
              <p className="text-xs font-medium mb-2">Permissions ({permissions.length}):</p>
              <div className="flex flex-wrap gap-1">
                {permissions.map(permission => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {permission.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p>Navigation adapts based on user role.</p>
            <p>Techs see simplified "Service Tools" interface.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper to simulate different roles for testing (development only)
export function useRoleSimulator() {
  const simulateRole = (testRole: 'admin' | 'tech' | 'manager') => {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Role simulation only available in development');
      return;
    }
    
    // This would set a temporary override in localStorage or similar
    // The real UserRoleService would check this override in development
    localStorage.setItem('dev_role_override', testRole);
    window.location.reload();
  };

  const clearRoleOverride = () => {
    localStorage.removeItem('dev_role_override');
    window.location.reload();
  };

  return {
    simulateRole,
    clearRoleOverride,
    hasOverride: !!localStorage.getItem('dev_role_override')
  };
}
