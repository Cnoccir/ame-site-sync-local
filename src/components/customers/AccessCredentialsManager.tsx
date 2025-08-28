import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  PlusCircle,
  Trash2,
  Upload,
  FileText,
  Monitor,
  Globe,
  Shield,
  Terminal,
  Smartphone,
  Settings,
  Eye,
  EyeOff,
  Copy,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AccessCredential, CredentialTemplate, AccessCredentialsService } from '@/services/accessCredentialsService';

// Types for the access credentials system
type SystemAccessType = AccessCredential['system_type'];

interface AccessCredentialsManagerProps {
  customerId?: string;
  initialCredentials?: AccessCredential[];
  onChange?: (credentials: AccessCredential[]) => void;
  mode?: 'form' | 'standalone'; // form mode for wizard, standalone for editing existing
}

const SYSTEM_TYPE_ICONS = {
  computer_pc: Monitor,
  web_portal: Globe,
  vpn_client: Shield,
  remote_desktop: Monitor,
  ssh_terminal: Terminal,
  mobile_app: Smartphone,
  custom_software: Settings
};

const SYSTEM_TYPE_LABELS = {
  computer_pc: 'Local Computer/PC Login',
  web_portal: 'Web Portal Access',
  vpn_client: 'VPN Client Connection',
  remote_desktop: 'Remote Desktop (RDP)',
  ssh_terminal: 'SSH Terminal Access',
  mobile_app: 'Mobile App',
  custom_software: 'Custom Software'
};

export const AccessCredentialsManager: React.FC<AccessCredentialsManagerProps> = ({
  customerId,
  initialCredentials = [],
  onChange,
  mode = 'form'
}) => {
  const [credentials, setCredentials] = useState<AccessCredential[]>(initialCredentials);
  const [templates, setTemplates] = useState<CredentialTemplate[]>([]);
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [activeTab, setActiveTab] = useState<'computer_pc' | 'web_portal' | 'remote_desktop'>('computer_pc');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Initialize with simplified default credentials if empty
  const initializeDefaultCredentials = () => {
    const defaultCredentials: AccessCredential[] = [
      {
        access_name: 'Main Computer/PC Login',
        system_type: 'computer_pc',
        description: 'Primary workstation/PC login for on-site access',
        username: '',
        password_encrypted: '',
        requires_2fa: false,
        requires_vpn: false,
        has_attachment: false,
        access_level: 'standard',
        is_active: true,
        connection_instructions: 'Power on the computer and log in with these credentials at the Windows/Mac login screen.'
      },
      {
        access_name: 'BMS/Supervisor System',
        system_type: 'web_portal',
        description: 'Building Management System or supervisor interface',
        username: '',
        password_encrypted: '',
        host_address: '',
        port_number: 80,
        requires_2fa: false,
        requires_vpn: false,
        has_attachment: false,
        access_level: 'standard',
        is_active: true,
        connection_instructions: 'Access the BMS interface through a web browser. Enter the IP address and login credentials.'
      },
      {
        access_name: 'Remote Access',
        system_type: 'remote_desktop',
        description: 'Remote desktop or VPN access for off-site support',
        username: '',
        password_encrypted: '',
        host_address: '',
        port_number: 3389,
        requires_2fa: false,
        requires_vpn: true,
        has_attachment: false,
        access_level: 'standard',
        is_active: true,
        connection_instructions: 'Connect via Remote Desktop Connection (RDP) or similar remote access tool. VPN may be required.'
      }
    ];
    setCredentials(defaultCredentials);
  };

  useEffect(() => {
    if (credentials.length === 0) {
      initializeDefaultCredentials();
    }
  }, []);

  // Call onChange when credentials change
  useEffect(() => {
    if (onChange) {
      onChange(credentials);
    }
  }, [credentials, onChange]);

  const loadCredentialTemplates = async () => {
    try {
      const templateData = await AccessCredentialsService.getTemplates();
      setTemplates(templateData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast({
        title: 'Error Loading Templates',
        description: 'Could not load credential templates. Using defaults.',
        variant: 'destructive'
      });
    }
  };

  const addDefaultCredential = () => {
    initializeDefaultCredentials();
  };

  // Helper function to get credential by system type
  const getCredentialByType = (systemType: 'computer_pc' | 'web_portal' | 'remote_desktop'): AccessCredential | null => {
    return credentials.find(cred => cred.system_type === systemType) || null;
  };

  // Helper function to get the index of a credential by system type
  const getCredentialIndexByType = (systemType: 'computer_pc' | 'web_portal' | 'remote_desktop'): number => {
    return credentials.findIndex(cred => cred.system_type === systemType);
  };

  // Helper function to switch to a tab (creates credential if it doesn't exist)
  const switchToTab = (systemType: 'computer_pc' | 'web_portal' | 'remote_desktop') => {
    setActiveTab(systemType);
    
    // If credential doesn't exist for this type, create it
    if (!getCredentialByType(systemType)) {
      const template = templates.find(t => t.system_type === systemType);
      
      const newCredential: AccessCredential = {
        access_name: systemType === 'computer_pc' ? 'Main Computer/PC Login' :
                    systemType === 'web_portal' ? 'BMS/Supervisor System' : 'Remote Access',
        system_type: systemType,
        description: systemType === 'computer_pc' ? 'Primary workstation/PC login for on-site access' :
                    systemType === 'web_portal' ? 'Building Management System or supervisor interface' :
                    'Remote desktop or VPN access for off-site support',
        username: '',
        password_encrypted: '',
        host_address: systemType !== 'computer_pc' ? '' : undefined,
        port_number: systemType === 'web_portal' ? 80 : systemType === 'remote_desktop' ? 3389 : undefined,
        requires_2fa: false,
        requires_vpn: systemType === 'remote_desktop',
        has_attachment: false,
        access_level: 'standard',
        is_active: true,
        connection_instructions: systemType === 'computer_pc' ? 
          'Power on the computer and log in with these credentials at the Windows/Mac login screen.' :
          systemType === 'web_portal' ? 
          'Access the BMS interface through a web browser. Enter the IP address and login credentials.' :
          'Connect via Remote Desktop Connection (RDP) or similar remote access tool. VPN may be required.',
        protocol: template?.default_protocol || undefined
      };

      setCredentials([...credentials, newCredential]);
    }
  };

  const updateCredential = (index: number, updates: Partial<AccessCredential>) => {
    const updated = [...credentials];
    updated[index] = { ...updated[index], ...updates };
    
    // Auto-update instructions when system type changes
    if (updates.system_type) {
      const template = templates.find(t => t.system_type === updates.system_type);
      if (template) {
        updated[index].connection_instructions = template.instruction_template;
        updated[index].port_number = template.default_port || undefined;
        updated[index].protocol = template.default_protocol || undefined;
      }
    }
    
    setCredentials(updated);
  };

  const removeCredential = (index: number) => {
    const updated = credentials.filter((_, i) => i !== index);
    setCredentials(updated);
  };

  const togglePasswordVisibility = (index: number) => {
    setShowPasswords(prev => ({
      ...prev,
      [index]: !prev[index]
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

  const renderCredentialCard = (credential: AccessCredential, index: number) => {
    const SystemIcon = SYSTEM_TYPE_ICONS[credential.system_type];
    const isPasswordVisible = showPasswords[index];

    return (
      <Card key={index} className="relative">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SystemIcon className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-base">{credential.access_name}</CardTitle>
              <Badge variant={credential.is_active ? 'default' : 'secondary'}>
                {credential.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeCredential(index)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          {credential.description && (
            <CardDescription>{credential.description}</CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Basic Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`access_name_${index}`}>Access Name *</Label>
              <Input
                id={`access_name_${index}`}
                value={credential.access_name}
                onChange={(e) => updateCredential(index, { access_name: e.target.value })}
                placeholder="e.g., Main BMS Workstation"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`system_type_${index}`}>System Type *</Label>
              <Select 
                value={credential.system_type}
                onValueChange={(value) => updateCredential(index, { system_type: value as SystemAccessType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(SYSTEM_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      <div className="flex items-center gap-2">
                        {React.createElement(SYSTEM_TYPE_ICONS[value as SystemAccessType], { className: "w-4 h-4" })}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`description_${index}`}>Description</Label>
            <Input
              id={`description_${index}`}
              value={credential.description || ''}
              onChange={(e) => updateCredential(index, { description: e.target.value })}
              placeholder="Brief description of this access method"
            />
          </div>

          {/* Connection Details */}
          {(credential.system_type === 'web_portal' || credential.system_type === 'remote_desktop' || credential.system_type === 'ssh_terminal') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`host_address_${index}`}>Host Address/URL *</Label>
                <Input
                  id={`host_address_${index}`}
                  value={credential.host_address || ''}
                  onChange={(e) => updateCredential(index, { host_address: e.target.value })}
                  placeholder={credential.system_type === 'web_portal' ? 'https://bms.site.com' : '192.168.1.100'}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`port_${index}`}>Port</Label>
                <Input
                  id={`port_${index}`}
                  type="number"
                  value={credential.port_number || ''}
                  onChange={(e) => updateCredential(index, { port_number: parseInt(e.target.value) || undefined })}
                  placeholder="3389"
                />
              </div>
            </div>
          )}

          {/* Authentication */}
          <Separator />
          <div className="space-y-4">
            <h4 className="font-medium text-sm">Authentication</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`username_${index}`}>Username</Label>
                <div className="flex">
                  <Input
                    id={`username_${index}`}
                    value={credential.username || ''}
                    onChange={(e) => updateCredential(index, { username: e.target.value })}
                    placeholder="Username"
                  />
                  {credential.username && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => copyToClipboard(credential.username!, 'Username')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`password_${index}`}>Password</Label>
                <div className="flex">
                  <Input
                    id={`password_${index}`}
                    type={isPasswordVisible ? 'text' : 'password'}
                    value={credential.password_encrypted || ''}
                    onChange={(e) => updateCredential(index, { password_encrypted: e.target.value })}
                    placeholder="Password"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => togglePasswordVisibility(index)}
                  >
                    {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  {credential.password_encrypted && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() => copyToClipboard(credential.password_encrypted!, 'Password')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Auth Options */}
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`2fa_${index}`}
                  checked={credential.requires_2fa}
                  onCheckedChange={(checked) => updateCredential(index, { requires_2fa: !!checked })}
                />
                <Label htmlFor={`2fa_${index}`} className="text-sm">Requires 2FA</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`vpn_${index}`}
                  checked={credential.requires_vpn}
                  onCheckedChange={(checked) => updateCredential(index, { requires_vpn: !!checked })}
                />
                <Label htmlFor={`vpn_${index}`} className="text-sm">Requires VPN</Label>
              </div>
            </div>

            {credential.requires_2fa && (
              <div className="space-y-2">
                <Label htmlFor={`auth_details_${index}`}>2FA Setup Details</Label>
                <Textarea
                  id={`auth_details_${index}`}
                  value={credential.additional_auth_details || ''}
                  onChange={(e) => updateCredential(index, { additional_auth_details: e.target.value })}
                  placeholder="Details about 2FA setup, app names, backup codes, etc."
                  rows={2}
                />
              </div>
            )}

            {credential.requires_vpn && (
              <div className="space-y-2">
                <Label htmlFor={`vpn_config_${index}`}>VPN Configuration</Label>
                <Input
                  id={`vpn_config_${index}`}
                  value={credential.vpn_config_name || ''}
                  onChange={(e) => updateCredential(index, { vpn_config_name: e.target.value })}
                  placeholder="VPN profile name or configuration file"
                />
              </div>
            )}
          </div>

          {/* Connection Instructions */}
          <Separator />
          <div className="space-y-2">
            <Label htmlFor={`instructions_${index}`}>Connection Instructions</Label>
            <Textarea
              id={`instructions_${index}`}
              value={credential.connection_instructions || ''}
              onChange={(e) => updateCredential(index, { connection_instructions: e.target.value })}
              placeholder="Step-by-step instructions for connecting..."
              rows={4}
              className="font-mono text-sm"
            />
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <Label>Supporting Documents</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Upload PDFs, Word docs, or images with additional setup information
              </p>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                multiple
                className="hidden"
                id={`file_upload_${index}`}
              />
              <Button variant="outline" size="sm" onClick={() => {
                document.getElementById(`file_upload_${index}`)?.click();
              }}>
                <FileText className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Get the currently active credential for rendering
  const activeCredential = getCredentialByType(activeTab);
  const activeIndex = getCredentialIndexByType(activeTab);

  // Render credential form for the active tab
  const renderActiveCredentialForm = () => {
    if (!activeCredential) return null;

    const isPasswordVisible = showPasswords[activeIndex];
    const SystemIcon = SYSTEM_TYPE_ICONS[activeCredential.system_type];

    return (
      <div className="space-y-4">
        {/* Basic Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`access_name`}>Access Name *</Label>
            <Input
              id={`access_name`}
              value={activeCredential.access_name}
              onChange={(e) => updateCredential(activeIndex, { access_name: e.target.value })}
              placeholder="e.g., Main BMS Workstation"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={`description`}>Description</Label>
            <Input
              id={`description`}
              value={activeCredential.description || ''}
              onChange={(e) => updateCredential(activeIndex, { description: e.target.value })}
              placeholder="Brief description of this access method"
            />
          </div>
        </div>

        {/* Connection Details */}
        {(activeCredential.system_type === 'web_portal' || activeCredential.system_type === 'remote_desktop') && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`host_address`}>Host Address/URL *</Label>
              <Input
                id={`host_address`}
                value={activeCredential.host_address || ''}
                onChange={(e) => updateCredential(activeIndex, { host_address: e.target.value })}
                placeholder={activeCredential.system_type === 'web_portal' ? 'https://bms.site.com' : '192.168.1.100'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={`port`}>Port</Label>
              <Input
                id={`port`}
                type="number"
                value={activeCredential.port_number || ''}
                onChange={(e) => updateCredential(activeIndex, { port_number: parseInt(e.target.value) || undefined })}
                placeholder={activeCredential.system_type === 'web_portal' ? '80' : '3389'}
              />
            </div>
          </div>
        )}

        {/* Authentication */}
        <Separator />
        <div className="space-y-4">
          <h4 className="font-medium text-sm">Authentication</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`username`}>Username</Label>
              <div className="flex">
                <Input
                  id={`username`}
                  value={activeCredential.username || ''}
                  onChange={(e) => updateCredential(activeIndex, { username: e.target.value })}
                  placeholder="Username"
                />
                {activeCredential.username && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => copyToClipboard(activeCredential.username!, 'Username')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`password`}>Password</Label>
              <div className="flex">
                <Input
                  id={`password`}
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={activeCredential.password_encrypted || ''}
                  onChange={(e) => updateCredential(activeIndex, { password_encrypted: e.target.value })}
                  placeholder="Password"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => togglePasswordVisibility(activeIndex)}
                >
                  {isPasswordVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                {activeCredential.password_encrypted && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={() => copyToClipboard(activeCredential.password_encrypted!, 'Password')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Additional Auth Options */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`2fa`}
                checked={activeCredential.requires_2fa}
                onCheckedChange={(checked) => updateCredential(activeIndex, { requires_2fa: !!checked })}
              />
              <Label htmlFor={`2fa`} className="text-sm">Requires 2FA</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id={`vpn`}
                checked={activeCredential.requires_vpn}
                onCheckedChange={(checked) => updateCredential(activeIndex, { requires_vpn: !!checked })}
              />
              <Label htmlFor={`vpn`} className="text-sm">Requires VPN</Label>
            </div>
          </div>

          {activeCredential.requires_2fa && (
            <div className="space-y-2">
              <Label htmlFor={`auth_details`}>2FA Setup Details</Label>
              <Textarea
                id={`auth_details`}
                value={activeCredential.additional_auth_details || ''}
                onChange={(e) => updateCredential(activeIndex, { additional_auth_details: e.target.value })}
                placeholder="Details about 2FA setup, app names, backup codes, etc."
                rows={2}
              />
            </div>
          )}

          {activeCredential.requires_vpn && (
            <div className="space-y-2">
              <Label htmlFor={`vpn_config`}>VPN Configuration</Label>
              <Input
                id={`vpn_config`}
                value={activeCredential.vpn_config_name || ''}
                onChange={(e) => updateCredential(activeIndex, { vpn_config_name: e.target.value })}
                placeholder="VPN profile name or configuration file"
              />
            </div>
          )}
        </div>

        {/* Connection Instructions */}
        <Separator />
        <div className="space-y-2">
          <Label htmlFor={`instructions`}>Connection Instructions</Label>
          <Textarea
            id={`instructions`}
            value={activeCredential.connection_instructions || ''}
            onChange={(e) => updateCredential(activeIndex, { connection_instructions: e.target.value })}
            placeholder="Step-by-step instructions for connecting..."
            rows={4}
            className="font-mono text-sm"
          />
        </div>

        {/* Document Upload */}
        <div className="space-y-2">
          <Label>Supporting Documents</Label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Upload PDFs, Word docs, or images with additional setup information
            </p>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
              multiple
              className="hidden"
              id={`file_upload`}
            />
            <Button variant="outline" size="sm" onClick={() => {
              document.getElementById(`file_upload`)?.click();
            }}>
              <FileText className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Access Credentials & System Login
          </CardTitle>
          <CardDescription>
            Simplified credential management focusing on the three main categories: PC Login, BMS/Supervisor System, and Remote Access.
            Each category supports 2FA and VPN requirements as needed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Access Credentials</h3>
              <p className="text-gray-600 mb-4">
                Get started with the three main access categories: PC Login, BMS/Supervisor System, and Remote Access.
              </p>
              <Button onClick={() => addDefaultCredential()}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Add Default Categories
              </Button>
            </div>
          ) : (
            <>
              {/* Tab Navigation */}
              <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
                <Button
                  variant={activeTab === 'computer_pc' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => switchToTab('computer_pc')}
                  className="flex items-center gap-2 flex-1"
                >
                  <Monitor className="w-4 h-4" />
                  PC Login
                  {getCredentialByType('computer_pc') && (
                    <Badge variant="secondary" className="ml-1">✓</Badge>
                  )}
                </Button>
                <Button
                  variant={activeTab === 'web_portal' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => switchToTab('web_portal')}
                  className="flex items-center gap-2 flex-1"
                >
                  <Globe className="w-4 h-4" />
                  BMS/Supervisor
                  {getCredentialByType('web_portal') && (
                    <Badge variant="secondary" className="ml-1">✓</Badge>
                  )}
                </Button>
                <Button
                  variant={activeTab === 'remote_desktop' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => switchToTab('remote_desktop')}
                  className="flex items-center gap-2 flex-1"
                >
                  <Shield className="w-4 h-4" />
                  Remote Access
                  {getCredentialByType('remote_desktop') && (
                    <Badge variant="secondary" className="ml-1">✓</Badge>
                  )}
                </Button>
              </div>

              {/* Active Credential Form */}
              {renderActiveCredentialForm()}
            </>
          )}

          {/* Security Notice */}
          {credentials.length > 0 && (
            <Alert className="mt-6">
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Note:</strong> Passwords are encrypted before storage. 
                For sensitive systems, consider using document attachments for additional setup details 
                and ensure proper access controls are in place.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
