import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Monitor, 
  Settings, 
  Server, 
  Database,
  Mail,
  Eye,
  EyeOff,
  Copy,
  HelpCircle,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface BMSCredentials {
  system_type: 'tridium_n4' | 'johnson_fx' | 'honeywell_webs' | 'siemens_desigo' | 'schneider_ecostruxure' | 'other';
  platform_host: string;
  platform_port: number;
  platform_username: string;
  platform_password: string;
  station_name?: string;
  station_username?: string;
  station_password?: string;
  same_credentials: boolean;
  database_name?: string;
  ssl_enabled?: boolean;
  connection_notes?: string;
}

export interface WindowsCredentials {
  computer_name: string;
  local_admin_username: string;
  local_admin_password: string;
  domain?: string;
  alt_username?: string;
  alt_password?: string;
  alt_account_notes?: string;
}

export interface ServiceCredentials {
  db_server?: string;
  db_username?: string;
  db_password?: string;
  smtp_server?: string;
  email_account?: string;
  email_password?: string;
  custom_services: Array<{
    service_name: string;
    username: string;
    password: string;
    notes?: string;
  }>;
}

interface SystemCredentialsManagerProps {
  initialBmsCredentials?: BMSCredentials;
  initialWindowsCredentials?: WindowsCredentials;
  initialServiceCredentials?: ServiceCredentials;
  onChange?: (data: { bms: BMSCredentials; windows: WindowsCredentials; services: ServiceCredentials }) => void;
  mode?: 'form' | 'standalone';
}

const BMS_SYSTEMS = [
  { value: 'tridium_n4', label: 'Tridium Niagara N4', defaultPort: 4911, description: 'Platform/Station access' },
  { value: 'johnson_fx', label: 'Johnson Controls FX Supervisor', defaultPort: 80, description: 'Web-based supervisor' },
  { value: 'honeywell_webs', label: 'Honeywell WEBs Supervisor', defaultPort: 443, description: 'HTTPS supervisor' },
  { value: 'siemens_desigo', label: 'Siemens Desigo CC', defaultPort: 80, description: 'Central control platform' },
  { value: 'schneider_ecostruxure', label: 'Schneider EcoStruxure', defaultPort: 443, description: 'Cloud/on-premise platform' },
  { value: 'other', label: 'Other BAS Platform', defaultPort: 80, description: 'Custom or unlisted system' }
];

export const SystemCredentialsManager: React.FC<SystemCredentialsManagerProps> = ({
  initialBmsCredentials,
  initialWindowsCredentials,
  initialServiceCredentials,
  onChange,
  mode = 'form'
}) => {
  const [bmsCredentials, setBmsCredentials] = useState<BMSCredentials>({
    system_type: 'tridium_n4',
    platform_host: '',
    platform_port: 4911,
    platform_username: '',
    platform_password: '',
    station_name: '',
    station_username: '',
    station_password: '',
    same_credentials: true,
    ssl_enabled: false,
    connection_notes: '',
    ...initialBmsCredentials
  });

  const [windowsCredentials, setWindowsCredentials] = useState<WindowsCredentials>({
    computer_name: '',
    local_admin_username: '',
    local_admin_password: '',
    domain: '',
    alt_username: '',
    alt_password: '',
    alt_account_notes: '',
    ...initialWindowsCredentials
  });

  const [serviceCredentials, setServiceCredentials] = useState<ServiceCredentials>({
    custom_services: [],
    ...initialServiceCredentials
  });

  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const { toast } = useToast();

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange({
        bms: bmsCredentials,
        windows: windowsCredentials,
        services: serviceCredentials
      });
    }
  }, [bmsCredentials, windowsCredentials, serviceCredentials, onChange]);

  // Auto-update port when system type changes
  useEffect(() => {
    const system = BMS_SYSTEMS.find(s => s.value === bmsCredentials.system_type);
    if (system && bmsCredentials.platform_port !== system.defaultPort) {
      setBmsCredentials(prev => ({ ...prev, platform_port: system.defaultPort }));
    }
  }, [bmsCredentials.system_type]);

  // Auto-sync station credentials when same_credentials is enabled
  useEffect(() => {
    if (bmsCredentials.same_credentials) {
      setBmsCredentials(prev => ({
        ...prev,
        station_username: prev.platform_username,
        station_password: prev.platform_password
      }));
    }
  }, [bmsCredentials.same_credentials, bmsCredentials.platform_username, bmsCredentials.platform_password]);

  const updateBmsField = (field: keyof BMSCredentials, value: any) => {
    setBmsCredentials(prev => ({ ...prev, [field]: value }));
  };

  const updateWindowsField = (field: keyof WindowsCredentials, value: any) => {
    setWindowsCredentials(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`
      });
    } catch (error) {
      toast({
        title: 'Copy Failed',
        description: 'Could not copy to clipboard',
        variant: 'destructive'
      });
    }
  };

  const renderPasswordField = (
    id: string,
    label: string,
    value: string,
    onChange: (value: string) => void,
    placeholder: string = 'Password'
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type={showPasswords[id] ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => togglePasswordVisibility(id)}
        >
          {showPasswords[id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(value, label)}
          >
            <Copy className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );

  const selectedSystem = BMS_SYSTEMS.find(s => s.value === bmsCredentials.system_type);
  const isTridium = bmsCredentials.system_type === 'tridium_n4';

  return (
    <div className="space-y-6">
      {/* BMS Platform Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-600" />
            Primary System Credentials
          </CardTitle>
          <CardDescription>
            Main credentials for accessing the building management system or control platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="system_type">BAS Platform Type</Label>
            <Select 
              value={bmsCredentials.system_type} 
              onValueChange={(value) => updateBmsField('system_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BMS_SYSTEMS.map((system) => (
                  <SelectItem key={system.value} value={system.value}>
                    <div className="flex flex-col">
                      <span>{system.label}</span>
                      <span className="text-xs text-muted-foreground">{system.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedSystem && (
              <p className="text-xs text-muted-foreground">
                Default port: {selectedSystem.defaultPort} • {selectedSystem.description}
              </p>
            )}
          </div>

          {/* Platform Connection */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm flex items-center gap-2">
              Platform Access
              {isTridium && <Badge variant="secondary" className="text-xs">Niagara Fox</Badge>}
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform_host">Platform Host/IP</Label>
                <Input
                  id="platform_host"
                  value={bmsCredentials.platform_host}
                  onChange={(e) => updateBmsField('platform_host', e.target.value)}
                  placeholder={isTridium ? "192.168.1.100 or supervisor.local" : "IP address or hostname"}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="platform_port">Port</Label>
                <Input
                  id="platform_port"
                  type="number"
                  value={bmsCredentials.platform_port}
                  onChange={(e) => updateBmsField('platform_port', parseInt(e.target.value) || 0)}
                  placeholder={selectedSystem?.defaultPort.toString()}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform_username">Platform Username</Label>
                <div className="flex gap-2">
                  <Input
                    id="platform_username"
                    value={bmsCredentials.platform_username}
                    onChange={(e) => updateBmsField('platform_username', e.target.value)}
                    placeholder={isTridium ? "admin, niagara, supervisor" : "username"}
                  />
                  {bmsCredentials.platform_username && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(bmsCredentials.platform_username, 'Username')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {renderPasswordField(
                'platform_password',
                'Platform Password',
                bmsCredentials.platform_password,
                (value) => updateBmsField('platform_password', value),
                'Platform password'
              )}
            </div>
          </div>

          {/* Station Access (Tridium specific) */}
          {isTridium && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Station Access</h4>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="same_credentials"
                      checked={bmsCredentials.same_credentials}
                      onCheckedChange={(checked) => updateBmsField('same_credentials', !!checked)}
                    />
                    <Label htmlFor="same_credentials" className="text-sm">Use same credentials as Platform</Label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="station_name">Station Name</Label>
                    <Input
                      id="station_name"
                      value={bmsCredentials.station_name}
                      onChange={(e) => updateBmsField('station_name', e.target.value)}
                      placeholder="MainStation, BMS-Station, FieldServer"
                    />
                  </div>
                </div>

                {!bmsCredentials.same_credentials && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="station_username">Station Username</Label>
                      <Input
                        id="station_username"
                        value={bmsCredentials.station_username}
                        onChange={(e) => updateBmsField('station_username', e.target.value)}
                        placeholder="Station-specific username"
                      />
                    </div>

                    {renderPasswordField(
                      'station_password',
                      'Station Password',
                      bmsCredentials.station_password || '',
                      (value) => updateBmsField('station_password', value),
                      'Station password'
                    )}
                  </div>
                )}

                {bmsCredentials.same_credentials && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Station will use the same username and password as the Platform
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </>
          )}

          {/* Advanced BMS Options */}
          <div className="space-y-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-muted-foreground"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>

            {showAdvanced && (
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="database_name">Database/Instance Name</Label>
                    <Input
                      id="database_name"
                      value={bmsCredentials.database_name || ''}
                      onChange={(e) => updateBmsField('database_name', e.target.value)}
                      placeholder="Optional database name"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-6">
                    <Checkbox
                      id="ssl_enabled"
                      checked={bmsCredentials.ssl_enabled}
                      onCheckedChange={(checked) => updateBmsField('ssl_enabled', !!checked)}
                    />
                    <Label htmlFor="ssl_enabled" className="text-sm">SSL/HTTPS enabled</Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="connection_notes">Connection Notes</Label>
                  <Input
                    id="connection_notes"
                    value={bmsCredentials.connection_notes || ''}
                    onChange={(e) => updateBmsField('connection_notes', e.target.value)}
                    placeholder="Special connection requirements or notes"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Windows System Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5 text-green-600" />
            Windows System Access
          </CardTitle>
          <CardDescription>
            Local Windows administrator credentials for system-level access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="computer_name">Computer Name/IP</Label>
            <Input
              id="computer_name"
              value={windowsCredentials.computer_name}
              onChange={(e) => updateWindowsField('computer_name', e.target.value)}
              placeholder="HVAC-SERVER-01, BMS-PC, or 192.168.1.50"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="local_admin_username">Local Admin Username</Label>
              <div className="flex gap-2">
                <Input
                  id="local_admin_username"
                  value={windowsCredentials.local_admin_username}
                  onChange={(e) => updateWindowsField('local_admin_username', e.target.value)}
                  placeholder="Administrator, localadmin, hvacuser"
                />
                {windowsCredentials.local_admin_username && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(windowsCredentials.local_admin_username, 'Username')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {renderPasswordField(
              'local_admin_password',
              'Local Admin Password',
              windowsCredentials.local_admin_password,
              (value) => updateWindowsField('local_admin_password', value),
              'Windows password'
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain">Domain (Optional)</Label>
            <Input
              id="domain"
              value={windowsCredentials.domain || ''}
              onChange={(e) => updateWindowsField('domain', e.target.value)}
              placeholder="COMPANY.LOCAL or leave blank for workgroup"
            />
          </div>

          {/* Alternative Account */}
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">Alternative Account (Optional)</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="alt_username">Alt Username</Label>
                <Input
                  id="alt_username"
                  value={windowsCredentials.alt_username || ''}
                  onChange={(e) => updateWindowsField('alt_username', e.target.value)}
                  placeholder="Backup admin account"
                />
              </div>

              {windowsCredentials.alt_username && renderPasswordField(
                'alt_password',
                'Alt Password',
                windowsCredentials.alt_password || '',
                (value) => updateWindowsField('alt_password', value),
                'Alternative password'
              )}
            </div>

            {windowsCredentials.alt_username && (
              <div className="space-y-2">
                <Label htmlFor="alt_account_notes">When to Use This Account</Label>
                <Input
                  id="alt_account_notes"
                  value={windowsCredentials.alt_account_notes || ''}
                  onChange={(e) => updateWindowsField('alt_account_notes', e.target.value)}
                  placeholder="Emergency access, service account, etc."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Validation Summary */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              {bmsCredentials.platform_host && bmsCredentials.platform_username ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
              <span>BMS Platform: {bmsCredentials.platform_host && bmsCredentials.platform_username ? 'Configured' : 'Incomplete'}</span>
            </div>
            
            <span className="text-muted-foreground">•</span>
            
            <div className="flex items-center gap-1">
              {windowsCredentials.computer_name && windowsCredentials.local_admin_username ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              )}
              <span>Windows Access: {windowsCredentials.computer_name && windowsCredentials.local_admin_username ? 'Configured' : 'Incomplete'}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Alert>
        <HelpCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>For Technicians:</strong> The Platform credentials access the main BAS system. 
          {isTridium && " Station credentials access individual Niagara stations. "}
          Windows credentials provide system-level access for diagnostics and maintenance.
        </AlertDescription>
      </Alert>
    </div>
  );
};
