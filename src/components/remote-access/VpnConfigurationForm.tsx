import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Wifi, AlertCircle, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { VpnConfiguration } from '@/types/remote-access';

interface VpnConfigurationFormProps {
  initialData?: VpnConfiguration;
  onSave: (data: VpnConfiguration) => void;
  onCancel: () => void;
}

export const VpnConfigurationForm: React.FC<VpnConfigurationFormProps> = ({
  initialData,
  onSave,
  onCancel
}) => {
  const [formData, setFormData] = useState<Partial<VpnConfiguration>>({
    vpn_required: false,
    vpn_profile_name: '',
    vpn_server_address: '',
    vpn_username: '',
    vpn_password: '',
    vpn_config_file_url: '',
    vpn_config_file_name: '',
    connection_instructions: '',
    setup_notes: '',
    network_requirements: '',
    client_network_segment: '',
    required_ports: [],
    firewall_notes: '',
    is_active: true,
    ...initialData
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [requiredPortsText, setRequiredPortsText] = useState('');
  const { toast } = useToast();

  // Initialize ports text from array
  useEffect(() => {
    if (formData.required_ports && Array.isArray(formData.required_ports)) {
      setRequiredPortsText(formData.required_ports.join(', '));
    }
  }, [formData.required_ports]);

  const updateField = (field: keyof VpnConfiguration, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handlePortsChange = (value: string) => {
    setRequiredPortsText(value);
    
    // Parse comma-separated ports
    const ports = value
      .split(',')
      .map(p => p.trim())
      .filter(p => p !== '')
      .map(p => parseInt(p, 10))
      .filter(p => !isNaN(p) && p > 0 && p <= 65535);
    
    updateField('required_ports', ports);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.vpn_required) {
      if (!formData.vpn_profile_name?.trim()) {
        newErrors.vpn_profile_name = 'VPN profile name is required when VPN is enabled';
      }

      if (!formData.connection_instructions?.trim()) {
        newErrors.connection_instructions = 'Connection instructions are required when VPN is enabled';
      }

      // Validate server address format if provided
      if (formData.vpn_server_address) {
        const serverRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.?[a-zA-Z0-9]*$/;
        if (!serverRegex.test(formData.vpn_server_address)) {
          newErrors.vpn_server_address = 'Invalid server address format';
        }
      }

      // Validate network segment format if provided
      if (formData.client_network_segment) {
        const networkRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/;
        if (!networkRegex.test(formData.client_network_segment)) {
          newErrors.client_network_segment = 'Network segment must be in CIDR format (e.g., 192.168.1.0/24)';
        }
      }

      // Validate ports
      if (requiredPortsText) {
        const invalidPorts = requiredPortsText
          .split(',')
          .map(p => p.trim())
          .filter(p => p !== '')
          .filter(p => {
            const port = parseInt(p, 10);
            return isNaN(port) || port < 1 || port > 65535;
          });
        
        if (invalidPorts.length > 0) {
          newErrors.required_ports = `Invalid ports: ${invalidPorts.join(', ')}. Ports must be between 1-65535`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving',
        variant: 'destructive'
      });
      return;
    }

    // Prepare data for saving
    const saveData: VpnConfiguration = {
      customer_id: formData.customer_id || '',
      vpn_required: formData.vpn_required || false,
      vpn_profile_name: formData.vpn_profile_name?.trim() || undefined,
      vpn_server_address: formData.vpn_server_address?.trim() || undefined,
      vpn_username: formData.vpn_username?.trim() || undefined,
      vpn_password: formData.vpn_password || undefined,
      vpn_config_file_url: formData.vpn_config_file_url?.trim() || undefined,
      vpn_config_file_name: formData.vpn_config_file_name?.trim() || undefined,
      connection_instructions: formData.connection_instructions?.trim() || undefined,
      setup_notes: formData.setup_notes?.trim() || undefined,
      network_requirements: formData.network_requirements?.trim() || undefined,
      client_network_segment: formData.client_network_segment?.trim() || undefined,
      required_ports: formData.required_ports || [],
      firewall_notes: formData.firewall_notes?.trim() || undefined,
      is_active: formData.is_active ?? true,
      id: formData.id,
      created_at: formData.created_at,
      updated_at: formData.updated_at,
      created_by: formData.created_by,
      updated_by: formData.updated_by
    };

    onSave(saveData);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // In a real implementation, you would upload the file to storage
    // For now, we'll just store the file name
    updateField('vpn_config_file_name', file.name);
    toast({
      title: 'File Selected',
      description: `${file.name} selected. Note: File upload is not implemented yet.`
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Wifi className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-lg">VPN Configuration</h3>
          <p className="text-sm text-muted-foreground">
            Configure VPN access requirements for remote connections
          </p>
        </div>
      </div>

      {/* VPN Required Toggle */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="vpn_required"
            checked={formData.vpn_required}
            onCheckedChange={(checked) => updateField('vpn_required', !!checked)}
          />
          <Label htmlFor="vpn_required" className="font-medium">
            VPN connection required for remote access
          </Label>
        </div>

        {!formData.vpn_required && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No VPN required. Remote access credentials will work directly over the internet.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* VPN Configuration Fields */}
      {formData.vpn_required && (
        <div className="space-y-6">
          {/* Basic VPN Info */}
          <div className="space-y-4">
            <h4 className="font-medium text-base flex items-center gap-2">
              Basic VPN Information
              <Badge variant="secondary">Required</Badge>
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vpn_profile_name">
                  VPN Profile Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="vpn_profile_name"
                  value={formData.vpn_profile_name}
                  onChange={(e) => updateField('vpn_profile_name', e.target.value)}
                  placeholder="e.g., Corporate VPN, Customer-VPN"
                  className={errors.vpn_profile_name ? 'border-destructive' : ''}
                />
                {errors.vpn_profile_name && (
                  <p className="text-sm text-destructive">{errors.vpn_profile_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vpn_server_address">VPN Server Address</Label>
                <Input
                  id="vpn_server_address"
                  value={formData.vpn_server_address}
                  onChange={(e) => updateField('vpn_server_address', e.target.value)}
                  placeholder="vpn.company.com or 10.0.0.1"
                  className={errors.vpn_server_address ? 'border-destructive' : ''}
                />
                {errors.vpn_server_address && (
                  <p className="text-sm text-destructive">{errors.vpn_server_address}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="vpn_username">VPN Username</Label>
                <Input
                  id="vpn_username"
                  value={formData.vpn_username}
                  onChange={(e) => updateField('vpn_username', e.target.value)}
                  placeholder="Username for VPN connection"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vpn_password">VPN Password</Label>
                <Input
                  id="vpn_password"
                  type="password"
                  value={formData.vpn_password}
                  onChange={(e) => updateField('vpn_password', e.target.value)}
                  placeholder="Password for VPN connection"
                />
              </div>
            </div>
          </div>

          {/* Connection Instructions */}
          <div className="space-y-2">
            <Label htmlFor="connection_instructions">
              Connection Instructions <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="connection_instructions"
              value={formData.connection_instructions}
              onChange={(e) => updateField('connection_instructions', e.target.value)}
              placeholder="Step-by-step instructions for establishing VPN connection..."
              className={errors.connection_instructions ? 'border-destructive' : ''}
              rows={4}
            />
            {errors.connection_instructions && (
              <p className="text-sm text-destructive">{errors.connection_instructions}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Include specific steps technicians need to follow to connect to the VPN
            </p>
          </div>

          {/* Configuration File */}
          <div className="space-y-4">
            <h4 className="font-medium text-base">Configuration File</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vpn_config_file_name">Configuration File</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="vpn_config_file_name"
                    value={formData.vpn_config_file_name || ''}
                    onChange={(e) => updateField('vpn_config_file_name', e.target.value)}
                    placeholder="client-config.ovpn"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('vpn-file-input')?.click()}>
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
                <input
                  id="vpn-file-input"
                  type="file"
                  accept=".ovpn,.conf,.p12,.pfx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <p className="text-xs text-muted-foreground">
                  OpenVPN config (.ovpn), certificates, or other VPN files
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="vpn_config_file_url">Configuration File URL</Label>
                <Input
                  id="vpn_config_file_url"
                  value={formData.vpn_config_file_url}
                  onChange={(e) => updateField('vpn_config_file_url', e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                />
                <p className="text-xs text-muted-foreground">
                  Link to VPN configuration file in cloud storage
                </p>
              </div>
            </div>
          </div>

          {/* Network Configuration */}
          <div className="space-y-4">
            <h4 className="font-medium text-base">Network Configuration</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="client_network_segment">Client Network Segment</Label>
                  <div className="group relative">
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md border invisible group-hover:visible z-10 w-48">
                      CIDR notation for the network range accessible through VPN
                    </div>
                  </div>
                </div>
                <Input
                  id="client_network_segment"
                  value={formData.client_network_segment}
                  onChange={(e) => updateField('client_network_segment', e.target.value)}
                  placeholder="192.168.1.0/24"
                  className={errors.client_network_segment ? 'border-destructive' : ''}
                />
                {errors.client_network_segment && (
                  <p className="text-sm text-destructive">{errors.client_network_segment}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="required_ports">Required Ports</Label>
                <Input
                  id="required_ports"
                  value={requiredPortsText}
                  onChange={(e) => handlePortsChange(e.target.value)}
                  placeholder="3389, 22, 80, 443"
                  className={errors.required_ports ? 'border-destructive' : ''}
                />
                {errors.required_ports && (
                  <p className="text-sm text-destructive">{errors.required_ports}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  Comma-separated list of port numbers
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="network_requirements">Network Requirements</Label>
              <Textarea
                id="network_requirements"
                value={formData.network_requirements}
                onChange={(e) => updateField('network_requirements', e.target.value)}
                placeholder="Specific network access requirements, routing rules, etc."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="firewall_notes">Firewall Notes</Label>
              <Textarea
                id="firewall_notes"
                value={formData.firewall_notes}
                onChange={(e) => updateField('firewall_notes', e.target.value)}
                placeholder="Firewall rules, port forwarding, or security considerations"
                rows={2}
              />
            </div>
          </div>

          {/* Setup Notes */}
          <div className="space-y-2">
            <Label htmlFor="setup_notes">Setup Notes</Label>
            <Textarea
              id="setup_notes"
              value={formData.setup_notes}
              onChange={(e) => updateField('setup_notes', e.target.value)}
              placeholder="Additional setup information, troubleshooting notes, etc."
              rows={3}
            />
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Save VPN Configuration
        </Button>
      </div>
    </form>
  );
};
