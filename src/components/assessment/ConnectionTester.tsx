import { useState } from 'react';
import { Wifi, User, Lock, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ConnectionTesterProps {
  value: {
    supervisorIp: string;
    supervisorUsername: string;
    supervisorPassword: string;
    supervisorStatus: 'not_tested' | 'testing' | 'success' | 'failed';
    workbenchUsername: string;
    workbenchPassword: string;
    workbenchStatus: 'not_tested' | 'testing' | 'success' | 'failed';
    systemVersion: string;
    connectionNotes: string;
  };
  onChange: (value: any) => void;
}

export const ConnectionTester = ({ value, onChange }: ConnectionTesterProps) => {
  const updateField = (field: string, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const testSupervisorConnection = async () => {
    updateField('supervisorStatus', 'testing');
    
    // Simulate connection test
    setTimeout(() => {
      // Randomly succeed or fail for demo
      const success = Math.random() > 0.3;
      updateField('supervisorStatus', success ? 'success' : 'failed');
    }, 2000);
  };

  const testWorkbenchLogin = async () => {
    updateField('workbenchStatus', 'testing');
    
    // Simulate login test
    setTimeout(() => {
      // Randomly succeed or fail for demo
      const success = Math.random() > 0.3;
      updateField('workbenchStatus', success ? 'success' : 'failed');
    }, 1500);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'testing':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return <AlertCircle className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      not_tested: 'secondary',
      testing: 'default',
      success: 'default',
      failed: 'destructive'
    } as const;

    const labels = {
      not_tested: 'Not Tested',
      testing: 'Testing...',
      success: 'Success',
      failed: 'Failed'
    };

    return (
      <Badge variant={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Wifi className="w-5 h-5 text-primary" />
        <h4 className="font-medium">System Access Testing</h4>
      </div>

      {/* Supervisor System Access */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium">Supervisor System Access</h5>
          <div className="flex items-center gap-2">
            {getStatusIcon(value.supervisorStatus)}
            {getStatusBadge(value.supervisorStatus)}
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="supervisor-ip">IP Address</Label>
              <Input
                id="supervisor-ip"
                placeholder="192.168.1.100"
                value={value.supervisorIp}
                onChange={(e) => updateField('supervisorIp', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supervisor-username">Username</Label>
              <Input
                id="supervisor-username"
                placeholder="admin"
                value={value.supervisorUsername}
                onChange={(e) => updateField('supervisorUsername', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="supervisor-password">Password</Label>
              <Input
                id="supervisor-password"
                type="password"
                placeholder="********"
                value={value.supervisorPassword}
                onChange={(e) => updateField('supervisorPassword', e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={testSupervisorConnection}
            disabled={value.supervisorStatus === 'testing' || !value.supervisorIp}
            className="w-full md:w-auto"
          >
            {value.supervisorStatus === 'testing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              'Test Connection'
            )}
          </Button>

          {value.supervisorStatus === 'failed' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Connection failed. Check IP address, credentials, and network connectivity.
              </AlertDescription>
            </Alert>
          )}

          {value.supervisorStatus === 'success' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Connection successful! Supervisor system is accessible.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* Workbench Login Test */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h5 className="font-medium">Workbench Login Test</h5>
          <div className="flex items-center gap-2">
            {getStatusIcon(value.workbenchStatus)}
            {getStatusBadge(value.workbenchStatus)}
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="workbench-username">Username</Label>
              <Input
                id="workbench-username"
                placeholder="workbench_user"
                value={value.workbenchUsername}
                onChange={(e) => updateField('workbenchUsername', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="workbench-password">Password</Label>
              <Input
                id="workbench-password"
                type="password"
                placeholder="********"
                value={value.workbenchPassword}
                onChange={(e) => updateField('workbenchPassword', e.target.value)}
              />
            </div>
          </div>

          <Button 
            onClick={testWorkbenchLogin}
            disabled={value.workbenchStatus === 'testing' || !value.workbenchUsername}
            className="w-full md:w-auto"
          >
            {value.workbenchStatus === 'testing' ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Testing Login...
              </>
            ) : (
              'Test Login'
            )}
          </Button>

          {value.workbenchStatus === 'failed' && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                Login failed. Verify username and password credentials.
              </AlertDescription>
            </Alert>
          )}

          {value.workbenchStatus === 'success' && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Login successful! Workbench access confirmed.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </Card>

      {/* System Version and Notes */}
      <Card className="p-4">
        <div className="space-y-3">
          <div>
            <Label htmlFor="system-version">System Version</Label>
            <Input
              id="system-version"
              placeholder="e.g., Niagara 4.8, Johnson Metasys 12.0"
              value={value.systemVersion}
              onChange={(e) => updateField('systemVersion', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="connection-notes">Connection Notes</Label>
            <Textarea
              id="connection-notes"
              placeholder="Additional notes about system access, performance, or issues..."
              value={value.connectionNotes}
              onChange={(e) => updateField('connectionNotes', e.target.value)}
              rows={3}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};