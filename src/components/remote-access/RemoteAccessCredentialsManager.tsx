import React, { useState, useEffect } from 'react';
import { Plus, Settings, Eye, EyeOff, TestTube, Copy, Trash2, GripVertical, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { RemoteAccessCredential, VpnConfiguration, RemoteAccessVendorType } from '@/types/remote-access';
import { RemoteAccessService } from '@/services/remoteAccessService';
import { VENDOR_CONFIGS, getVendorConfig, getVendorsByCategory } from '@/config/remote-access-vendors';
import { VendorCredentialForm } from './VendorCredentialForm';
import { VpnConfigurationForm } from './VpnConfigurationForm';
import { VendorSelector } from './VendorSelector';

interface RemoteAccessCredentialsManagerProps {
  customerId?: string;
  initialCredentials?: RemoteAccessCredential[];
  initialVpnConfig?: VpnConfiguration;
  mode?: 'view' | 'edit' | 'form';
  onChange?: (credentials: RemoteAccessCredential[], vpnConfig?: VpnConfiguration) => void;
  onCredentialsChange?: (credentials: RemoteAccessCredential[]) => void;
  disabled?: boolean;
  showVpnConfig?: boolean;
}

export const RemoteAccessCredentialsManager: React.FC<RemoteAccessCredentialsManagerProps> = ({
  customerId,
  initialCredentials = [],
  initialVpnConfig,
  mode = 'edit',
  onChange,
  onCredentialsChange,
  disabled = false,
  showVpnConfig = true
}) => {
  const [credentials, setCredentials] = useState<RemoteAccessCredential[]>(initialCredentials);
  const [vpnConfig, setVpnConfig] = useState<VpnConfiguration | undefined>(initialVpnConfig);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<RemoteAccessVendorType | null>(null);
  const [editingCredential, setEditingCredential] = useState<RemoteAccessCredential | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testingCredentials, setTestingCredentials] = useState<Set<string>>(new Set());
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showVpnForm, setShowVpnForm] = useState(false);
  
  const { toast } = useToast();
  const isReadOnly = mode === 'view';
  const isFormMode = mode === 'form';

  // Load existing credentials if customerId is provided
  useEffect(() => {
    if (customerId && !isFormMode) {
      loadCredentials();
      if (showVpnConfig) {
        loadVpnConfiguration();
      }
    }
  }, [customerId, isFormMode, showVpnConfig]);

  // Notify parent of changes
  useEffect(() => {
    if (onChange) {
      onChange(credentials, vpnConfig);
    }
    if (onCredentialsChange) {
      onCredentialsChange(credentials);
    }
  }, [credentials, vpnConfig, onChange, onCredentialsChange]);

  const loadCredentials = async () => {
    if (!customerId) return;
    
    try {
      setIsLoading(true);
      const data = await RemoteAccessService.getCustomerCredentials(customerId);
      setCredentials(data);
    } catch (error) {
      console.error('Failed to load credentials:', error);
      toast({
        title: 'Error',
        description: 'Failed to load remote access credentials',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadVpnConfiguration = async () => {
    if (!customerId) return;
    
    try {
      const data = await RemoteAccessService.getCustomerVpnConfiguration(customerId);
      setVpnConfig(data || undefined);
    } catch (error) {
      console.error('Failed to load VPN configuration:', error);
    }
  };

  const handleAddCredential = async (credentialData: Partial<RemoteAccessCredential>) => {
    try {
      const newCredential: Omit<RemoteAccessCredential, 'id' | 'created_at' | 'updated_at'> = {
        customer_id: customerId || '',
        vendor: selectedVendor!,
        display_name: credentialData.display_name || `${getVendorConfig(selectedVendor!)?.label} Access`,
        is_active: true,
        priority: credentials.length + 1,
        ...credentialData
      };

      if (isFormMode) {
        // In form mode, just add to local state
        setCredentials(prev => [...prev, { ...newCredential, id: `temp-${Date.now()}` } as RemoteAccessCredential]);
      } else if (customerId) {
        // In database mode, save to backend
        const savedCredential = await RemoteAccessService.createCredential(newCredential);
        setCredentials(prev => [...prev, savedCredential]);
        
        toast({
          title: 'Success',
          description: 'Remote access credential added successfully'
        });
      }

      setShowAddForm(false);
      setSelectedVendor(null);
    } catch (error) {
      console.error('Failed to add credential:', error);
      toast({
        title: 'Error',
        description: 'Failed to add remote access credential',
        variant: 'destructive'
      });
    }
  };

  const handleUpdateCredential = async (id: string, updates: Partial<RemoteAccessCredential>) => {
    try {
      if (isFormMode) {
        // In form mode, just update local state
        setCredentials(prev => prev.map(cred => 
          cred.id === id ? { ...cred, ...updates } : cred
        ));
      } else {
        // In database mode, save to backend
        const updatedCredential = await RemoteAccessService.updateCredential(id, updates);
        setCredentials(prev => prev.map(cred => 
          cred.id === id ? updatedCredential : cred
        ));
        
        toast({
          title: 'Success',
          description: 'Remote access credential updated successfully'
        });
      }

      setEditingCredential(null);
    } catch (error) {
      console.error('Failed to update credential:', error);
      toast({
        title: 'Error',
        description: 'Failed to update remote access credential',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteCredential = async (id: string) => {
    try {
      if (isFormMode) {
        // In form mode, just remove from local state
        setCredentials(prev => prev.filter(cred => cred.id !== id));
      } else {
        // In database mode, delete from backend
        await RemoteAccessService.deleteCredential(id);
        setCredentials(prev => prev.filter(cred => cred.id !== id));
        
        toast({
          title: 'Success',
          description: 'Remote access credential deleted successfully'
        });
      }
    } catch (error) {
      console.error('Failed to delete credential:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete remote access credential',
        variant: 'destructive'
      });
    }
  };

  const handleTestCredential = async (credential: RemoteAccessCredential) => {
    if (!credential.id || isFormMode) return;

    try {
      setTestingCredentials(prev => new Set([...prev, credential.id!]));
      const result = await RemoteAccessService.testCredential(credential.id);
      
      setTestResults(prev => ({
        ...prev,
        [credential.id!]: result
      }));

      toast({
        title: result.success ? 'Connection Successful' : 'Connection Failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Failed to test credential:', error);
      toast({
        title: 'Test Failed',
        description: 'Failed to test connection',
        variant: 'destructive'
      });
    } finally {
      setTestingCredentials(prev => {
        const newSet = new Set(prev);
        newSet.delete(credential.id!);
        return newSet;
      });
    }
  };

  const togglePasswordVisibility = (credentialId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [credentialId]: !prev[credentialId]
    }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: `${label} copied to clipboard`
      });
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const getConnectionInfo = (credential: RemoteAccessCredential): string => {
    const config = getVendorConfig(credential.vendor);
    if (!config) return 'Configuration available';

    switch (credential.vendor) {
      case RemoteAccessVendorType.TEAMVIEWER:
        return `ID: ${credential.teamviewer_id || 'Not set'}${credential.teamviewer_alias ? ` (${credential.teamviewer_alias})` : ''}`;
      
      case RemoteAccessVendorType.ANYDESK:
        return `Address: ${credential.anydesk_address || 'Not set'}`;
      
      case RemoteAccessVendorType.WINDOWS_RDP:
        return `${credential.rdp_host_address || 'Not set'}:${credential.rdp_port || 3389}${credential.rdp_username ? ` (User: ${credential.rdp_username})` : ''}`;
      
      case RemoteAccessVendorType.REALVNC:
      case RemoteAccessVendorType.VNC_OTHER:
        return `${credential.vnc_host_address || 'Not set'}:${credential.vnc_port || 5900} (Display :${credential.vnc_display_number || 0})`;
      
      case RemoteAccessVendorType.REMOTEPC:
        return `${credential.remotepc_email || 'Not set'}${credential.remotepc_computer_name ? ` (${credential.remotepc_computer_name})` : ''}`;
      
      case RemoteAccessVendorType.CHROME_REMOTE_DESKTOP:
        return `Account: ${credential.crd_google_account || 'Not set'}`;
      
      default:
        return 'Configuration available';
    }
  };

  const handleVpnConfigChange = async (config: VpnConfiguration) => {
    try {
      if (isFormMode) {
        setVpnConfig(config);
      } else if (customerId) {
        const savedConfig = await RemoteAccessService.upsertVpnConfiguration({
          ...config,
          customer_id: customerId
        });
        setVpnConfig(savedConfig);
        
        toast({
          title: 'Success',
          description: 'VPN configuration saved successfully'
        });
      }
      
      setShowVpnForm(false);
    } catch (error) {
      console.error('Failed to save VPN configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to save VPN configuration',
        variant: 'destructive'
      });
    }
  };

  const renderCredentialCard = (credential: RemoteAccessCredential, index: number) => {
    const config = getVendorConfig(credential.vendor);
    const isEditing = editingCredential?.id === credential.id;
    const isTesting = credential.id ? testingCredentials.has(credential.id) : false;
    const testResult = credential.id ? testResults[credential.id] : undefined;

    if (isEditing) {
      return (
        <Card key={credential.id} className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-lg">{config?.label || credential.vendor}</span>
              <Badge variant="outline">Editing</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <VendorCredentialForm
              vendor={credential.vendor}
              initialData={credential}
              onSave={(data) => handleUpdateCredential(credential.id!, data)}
              onCancel={() => setEditingCredential(null)}
              mode="edit"
            />
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={credential.id} className="relative group">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                {config?.icon && <span className="text-primary">📱</span>}
              </div>
              <div>
                <CardTitle className="text-base">{credential.display_name || config?.label}</CardTitle>
                <p className="text-sm text-muted-foreground">{getConnectionInfo(credential)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Badge variant={credential.is_active ? "default" : "secondary"}>
                {credential.is_active ? 'Active' : 'Inactive'}
              </Badge>
              
              {testResult && (
                <div className="flex items-center gap-1">
                  {testResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {credential.connection_notes && (
            <p className="text-sm text-muted-foreground mb-3">
              {credential.connection_notes}
            </p>
          )}

          {/* Action buttons */}
          {!isReadOnly && (
            <div className="flex items-center gap-2 mt-3">
              {!isFormMode && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleTestCredential(credential)}
                  disabled={isTesting || disabled}
                  className="flex items-center gap-1"
                >
                  {isTesting ? (
                    <>
                      <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <TestTube className="w-3 h-3" />
                      Test
                    </>
                  )}
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingCredential(credential)}
                disabled={disabled}
              >
                <Settings className="w-3 h-3" />
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDeleteCredential(credential.id!)}
                disabled={disabled}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Test result */}
          {testResult && (
            <Alert className={`mt-3 ${testResult.success ? 'border-green-200' : 'border-red-200'}`}>
              <AlertDescription className="text-sm">
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-8 h-8 border border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading remote access credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Remote Access Credentials</h3>
          <p className="text-sm text-muted-foreground">
            Manage multiple remote access methods for this customer
          </p>
        </div>
        
        {!isReadOnly && (
          <div className="flex items-center gap-2">
            {showVpnConfig && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVpnForm(true)}
                disabled={disabled}
              >
                <Wifi className="w-4 h-4 mr-2" />
                {vpnConfig ? 'Edit VPN' : 'Add VPN'}
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={() => setShowAddForm(true)}
              disabled={disabled}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Credential
            </Button>
          </div>
        )}
      </div>

      {/* VPN Configuration Status */}
      {showVpnConfig && vpnConfig && vpnConfig.vpn_required && (
        <Alert>
          <Wifi className="h-4 w-4" />
          <AlertDescription>
            <strong>VPN Required:</strong> {vpnConfig.vpn_profile_name || 'VPN connection required for remote access'}
            {vpnConfig.connection_instructions && (
              <div className="mt-1 text-xs text-muted-foreground">
                {vpnConfig.connection_instructions}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Add Credential Form */}
      {showAddForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Add Remote Access Credential</CardTitle>
          </CardHeader>
          <CardContent>
            {!selectedVendor ? (
              <VendorSelector
                onSelect={setSelectedVendor}
                onCancel={() => setShowAddForm(false)}
              />
            ) : (
              <VendorCredentialForm
                vendor={selectedVendor}
                onSave={handleAddCredential}
                onCancel={() => {
                  setShowAddForm(false);
                  setSelectedVendor(null);
                }}
                mode="create"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* VPN Configuration Form */}
      {showVpnForm && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>VPN Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <VpnConfigurationForm
              initialData={vpnConfig}
              onSave={handleVpnConfigChange}
              onCancel={() => setShowVpnForm(false)}
            />
          </CardContent>
        </Card>
      )}

      {/* Credentials List */}
      {credentials.length === 0 && !showAddForm ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
              <WifiOff className="w-6 h-6 text-muted-foreground" />
            </div>
            <h4 className="font-medium mb-1">No remote access configured</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Add remote access credentials to enable technician connectivity
            </p>
            {!isReadOnly && (
              <Button onClick={() => setShowAddForm(true)} disabled={disabled}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Credential
              </Button>
            )}
          </CardContent>
        </Card>
      ) : credentials.length > 0 ? (
        <div className="space-y-3">
          {credentials.map((credential, index) => renderCredentialCard(credential, index))}
        </div>
      ) : null}

      {/* Summary */}
      {credentials.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {credentials.length} remote access method{credentials.length !== 1 ? 's' : ''} configured
          {vpnConfig?.vpn_required && ' • VPN required'}
        </div>
      )}
    </div>
  );
};
