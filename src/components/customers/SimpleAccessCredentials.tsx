import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  FileText,
  Monitor,
  Globe,
  Shield,
  Eye,
  EyeOff,
  Copy,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SimpleAccessCredentialsProps {
  onChange?: (data: any) => void;
  initialData?: any;
}

interface CredentialData {
  // PC Login
  pc_username: string;
  pc_password: string;
  pc_requires_vpn: boolean;
  pc_vpn_details: string;
  
  // BMS/Supervisor System  
  supervisor_ip: string;
  supervisor_username: string;
  supervisor_password: string;
  supervisor_requires_2fa: boolean;
  supervisor_2fa_details: string;
  
  // Remote Access
  remote_access_available: boolean;
  remote_access_type: string;
  remote_access_username: string;
  remote_access_password: string;
  remote_access_details: string;
}

export const SimpleAccessCredentials: React.FC<SimpleAccessCredentialsProps> = ({
  onChange,
  initialData = {}
}) => {
  const [data, setData] = useState<CredentialData>({
    pc_username: '',
    pc_password: '',
    pc_requires_vpn: false,
    pc_vpn_details: '',
    supervisor_ip: '',
    supervisor_username: '',
    supervisor_password: '',
    supervisor_requires_2fa: false,
    supervisor_2fa_details: '',
    remote_access_available: false,
    remote_access_type: '',
    remote_access_username: '',
    remote_access_password: '',
    remote_access_details: '',
    ...initialData
  });

  const [showPasswords, setShowPasswords] = useState({
    pc: false,
    supervisor: false,
    remote: false
  });

  const { toast } = useToast();

  // Auto-generate web URL when IP changes
  const supervisorWebUrl = data.supervisor_ip ? `https://${data.supervisor_ip}/login` : '';

  useEffect(() => {
    if (onChange) {
      onChange(data);
    }
  }, [data, onChange]);

  const updateData = (field: keyof CredentialData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (section: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied!',
        description: `${label} copied to clipboard`,
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
    showPassword: boolean,
    onToggleVisibility: () => void,
    placeholder: string = 'Password'
  ) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onToggleVisibility}
        >
          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            System Access Credentials
          </CardTitle>
          <CardDescription>
            Simplified credential management for technicians. Always include PC login for on-site access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          
          {/* PC Login Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Monitor className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-lg">PC/Computer Login</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pc_username">Username</Label>
                <div className="flex gap-2">
                  <Input
                    id="pc_username"
                    value={data.pc_username}
                    onChange={(e) => updateData('pc_username', e.target.value)}
                    placeholder="Windows username"
                    className="flex-1"
                  />
                  {data.pc_username && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(data.pc_username, 'Username')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {renderPasswordField(
                'pc_password',
                'Password',
                data.pc_password,
                (value) => updateData('pc_password', value),
                showPasswords.pc,
                () => togglePasswordVisibility('pc'),
                'Windows password'
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="pc_requires_vpn"
                checked={data.pc_requires_vpn}
                onCheckedChange={(checked) => updateData('pc_requires_vpn', !!checked)}
              />
              <Label htmlFor="pc_requires_vpn">Requires VPN for remote PC access</Label>
            </div>

            {data.pc_requires_vpn && (
              <div className="space-y-2">
                <Label htmlFor="pc_vpn_details">VPN Details</Label>
                <Textarea
                  id="pc_vpn_details"
                  value={data.pc_vpn_details}
                  onChange={(e) => updateData('pc_vpn_details', e.target.value)}
                  placeholder="VPN configuration name, server details, etc."
                  rows={2}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* BMS/Supervisor System Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Globe className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-lg">BMS/Supervisor System</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="supervisor_ip">Main Supervisor IP Address</Label>
                <Input
                  id="supervisor_ip"
                  value={data.supervisor_ip}
                  onChange={(e) => updateData('supervisor_ip', e.target.value)}
                  placeholder="192.168.1.100"
                />
                {supervisorWebUrl && (
                  <div className="text-sm text-muted-foreground">
                    Web URL: <code className="bg-muted px-1 rounded">{supervisorWebUrl}</code>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="ml-2 h-6 px-2"
                      onClick={() => copyToClipboard(supervisorWebUrl, 'Web URL')}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="supervisor_username">Username</Label>
                  <div className="flex gap-2">
                    <Input
                      id="supervisor_username"
                      value={data.supervisor_username}
                      onChange={(e) => updateData('supervisor_username', e.target.value)}
                      placeholder="BMS username"
                      className="flex-1"
                    />
                    {data.supervisor_username && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(data.supervisor_username, 'Username')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                {renderPasswordField(
                  'supervisor_password',
                  'Password',
                  data.supervisor_password,
                  (value) => updateData('supervisor_password', value),
                  showPasswords.supervisor,
                  () => togglePasswordVisibility('supervisor'),
                  'BMS password'
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="supervisor_requires_2fa"
                  checked={data.supervisor_requires_2fa}
                  onCheckedChange={(checked) => updateData('supervisor_requires_2fa', !!checked)}
                />
                <Label htmlFor="supervisor_requires_2fa">Requires 2FA</Label>
              </div>

              {data.supervisor_requires_2fa && (
                <div className="space-y-2">
                  <Label htmlFor="supervisor_2fa_details">2FA Setup Details</Label>
                  <Textarea
                    id="supervisor_2fa_details"
                    value={data.supervisor_2fa_details}
                    onChange={(e) => updateData('supervisor_2fa_details', e.target.value)}
                    placeholder="App name, backup codes location, etc."
                    rows={2}
                  />
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Remote Access Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Shield className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-lg">Remote Access</h3>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="remote_access_available"
                checked={data.remote_access_available}
                onCheckedChange={(checked) => updateData('remote_access_available', !!checked)}
              />
              <Label htmlFor="remote_access_available">Remote access available</Label>
            </div>

            {data.remote_access_available && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="remote_access_type">Remote Access Method</Label>
                  <Input
                    id="remote_access_type"
                    value={data.remote_access_type}
                    onChange={(e) => updateData('remote_access_type', e.target.value)}
                    placeholder="TeamViewer, VPN, RDP, etc."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="remote_access_username">Username (if applicable)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="remote_access_username"
                        value={data.remote_access_username}
                        onChange={(e) => updateData('remote_access_username', e.target.value)}
                        placeholder="Remote access username"
                        className="flex-1"
                      />
                      {data.remote_access_username && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyToClipboard(data.remote_access_username, 'Username')}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {renderPasswordField(
                    'remote_access_password',
                    'Password (if applicable)',
                    data.remote_access_password,
                    (value) => updateData('remote_access_password', value),
                    showPasswords.remote,
                    () => togglePasswordVisibility('remote'),
                    'Remote access password'
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="remote_access_details">Connection Details</Label>
                  <Textarea
                    id="remote_access_details"
                    value={data.remote_access_details}
                    onChange={(e) => updateData('remote_access_details', e.target.value)}
                    placeholder="Step-by-step connection instructions, server addresses, port numbers, etc."
                    rows={4}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Document Upload Section */}
          <Separator />
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Supporting Documents</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Upload PDFs, Word docs, or images with additional setup information
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                multiple
                className="hidden"
                id="credential_file_upload"
              />
              <Button 
                type="button"
                variant="outline" 
                size="sm" 
                onClick={() => document.getElementById('credential_file_upload')?.click()}
              >
                <FileText className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>For Technicians:</strong> PC Login is for on-site computer access. 
              BMS/Supervisor is for the building automation system login. 
              Remote Access is for connecting from outside the building network.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};
