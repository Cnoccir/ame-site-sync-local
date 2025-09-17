import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Save, X, Edit3, Eye, Key, Shield, Users, Monitor, Wifi } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AMEService } from '@/services/ameService';
import { AMEContactService } from '@/services/ameContactService';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { RemoteAccessCredentialsManager } from '@/components/remote-access/RemoteAccessCredentialsManager';
import { SystemCredentialsManager } from '@/components/system-access/SystemCredentialsManager';
import { Customer } from '@/types';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onCustomerUpdated: () => void;
  mode: 'view' | 'edit';
}

export const CustomerDetailsModalEnhanced: React.FC<CustomerDetailsModalProps> = ({
  isOpen,
  onClose,
  customer,
  onCustomerUpdated,
  mode: initialMode,
}) => {
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [formData, setFormData] = useState<Customer | null>(customer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [technicianOptions, setTechnicianOptions] = useState<any[]>([]);
  const [accountManagerOptions, setAccountManagerOptions] = useState<any[]>([]);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setFormData(customer);
    setMode(initialMode);
  }, [customer, initialMode]);

  // Load technicians and account managers for dropdowns
  useEffect(() => {
    if (isOpen && mode === 'edit') {
      loadDropdownData();
    }
  }, [isOpen, mode]);

  const loadDropdownData = async () => {
    try {
      setIsLoadingDropdowns(true);
      const [technicians, accountManagers] = await Promise.all([
        AMEContactService.getTechnicians(),
        AMEContactService.getAccountManagers()
      ]);
      
      // Format technicians for SearchableCombobox
      const formattedTechnicians = technicians.map(tech => ({
        id: tech.id,
        name: tech.name,
        description: `${tech.phone ? `📱 ${tech.phone}` : ''}${tech.email ? ` 📧 ${tech.email}` : ''}`.trim(),
        subtitle: tech.role || 'Technician',
        phone: tech.phone,
        email: tech.email
      }));
      setTechnicianOptions(formattedTechnicians);
      
      // Format account managers for SearchableCombobox
      const formattedAccountManagers = accountManagers.map(mgr => ({
        id: mgr.id,
        name: mgr.name,
        description: `${mgr.phone ? `📱 ${mgr.phone}` : ''}${mgr.email ? ` 📧 ${mgr.email}` : ''}`.trim(),
        subtitle: mgr.role || 'Account Manager',
        phone: mgr.phone,
        email: mgr.email
      }));
      setAccountManagerOptions(formattedAccountManagers);
    } catch (error) {
      console.error('Error loading dropdown data:', error);
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  const updateFormData = (field: keyof Customer, value: any) => {
    if (!formData) return;
    setFormData(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleSave = async () => {
    if (!formData) return;

    try {
      setIsSubmitting(true);
      
      // Prepare the data for update
      const updateData = { ...formData };
      
      // Ensure credentials are properly serialized
      if (updateData.access_credentials) {
        updateData.access_credentials = JSON.stringify(updateData.access_credentials);
      }
      if (updateData.system_credentials) {
        updateData.system_credentials = JSON.stringify(updateData.system_credentials);
      }
      if (updateData.windows_credentials) {
        updateData.windows_credentials = JSON.stringify(updateData.windows_credentials);
      }
      if (updateData.service_credentials) {
        updateData.service_credentials = JSON.stringify(updateData.service_credentials);
      }
      
      await AMEService.updateCustomer(formData.id, updateData);
      
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      
      onCustomerUpdated();
      setMode('view');
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: "Error",
        description: "Failed to update customer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(customer);
    setMode('view');
  };

  if (!formData) return null;

  const isEditing = mode === 'edit';

  const InputField = ({ 
    label, 
    field, 
    type = 'text', 
    placeholder = '', 
    rows = 3 
  }: { 
    label: string;
    field: keyof Customer;
    type?: string;
    placeholder?: string;
    rows?: number;
  }) => (
    <div>
      <Label>{label}</Label>
      {type === 'textarea' ? (
        <Textarea
          value={String(formData[field] || '')}
          onChange={(e) => updateFormData(field, e.target.value)}
          disabled={!isEditing}
          placeholder={placeholder}
          rows={rows}
        />
      ) : (
        <Input
          type={type}
          value={String(formData[field] || '')}
          onChange={(e) => updateFormData(field, e.target.value)}
          disabled={!isEditing}
          placeholder={placeholder}
        />
      )}
    </div>
  );

  const SelectField = ({ 
    label, 
    field, 
    options 
  }: { 
    label: string;
    field: keyof Customer;
    options: { value: string; label: string }[];
  }) => (
    <div>
      <Label>{label}</Label>
      <Select 
        value={String(formData[field] || '')} 
        onValueChange={(value) => updateFormData(field, value)}
        disabled={!isEditing}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const CheckboxField = ({ 
    label, 
    field 
  }: { 
    label: string;
    field: keyof Customer;
  }) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        checked={!!formData[field]}
        onCheckedChange={(checked) => updateFormData(field, checked)}
        disabled={!isEditing}
      />
      <Label>{label}</Label>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto" aria-describedby="customer-details-desc">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <DialogTitle className="text-xl">
                {formData.company_name} - {formData.site_name}
              </DialogTitle>
              <Badge>{formData.service_tier}</Badge>
              <Badge variant="outline">{formData.contract_status}</Badge>
              
              {/* Credential Status Indicators */}
              <div className="flex items-center space-x-2">
                {(formData as any)?.has_bms_credentials && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                    <Key className="w-3 h-3 mr-1" />
                    BMS
                  </Badge>
                )}
                {(formData as any)?.has_windows_credentials && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                    <Monitor className="w-3 h-3 mr-1" />
                    Windows
                  </Badge>
                )}
                {(formData as any)?.has_service_credentials && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300">
                    <Shield className="w-3 h-3 mr-1" />
                    Services
                  </Badge>
                )}
                {(formData as any)?.has_remote_access_credentials && (
                  <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                    <Wifi className="w-3 h-3 mr-1" />
                    Remote
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {mode === 'view' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMode('edit')}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSubmitting}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save'}
                  </Button>
                </>
              )}
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <p id="customer-details-desc" className="sr-only">
          Customer details and edit form for {formData.company_name} - {formData.site_name}
        </p>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="access">Access & Security</TabsTrigger>
            <TabsTrigger value="remote-creds">Remote Access</TabsTrigger>
            <TabsTrigger value="system-creds">System Credentials</TabsTrigger>
            <TabsTrigger value="service">Service Info</TabsTrigger>
            <TabsTrigger value="contract">Contract</TabsTrigger>
            <TabsTrigger value="admin">Administrative</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Customer ID" field="customer_id" />
                  <InputField label="Company Name" field="company_name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Site Name" field="site_name" />
                  <InputField label="Site Nickname" field="site_nickname" placeholder="e.g., 23-1220-300NJ" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Building Type" field="building_type" />
                  <InputField label="System Architecture" field="system_architecture" />
                </div>
                <InputField label="Site Address" field="site_address" type="textarea" />
                
                {/* Service Address Different Checkbox */}
                <CheckboxField label="Service Address is Different from Site Address" field="service_address_different" />
                {(formData as any)?.service_address_different && (
                  <InputField label="Service Address" field="service_address" type="textarea" placeholder="Enter different service address..." />
                )}
                
                <div className="grid grid-cols-3 gap-4">
                  <SelectField 
                    label="Service Tier" 
                    field="service_tier"
                    options={[
                      { value: 'CORE', label: 'CORE' },
                      { value: 'ASSURE', label: 'ASSURE' },
                      { value: 'GUARDIAN', label: 'GUARDIAN' }
                    ]}
                  />
                  <InputField label="System Type" field="system_type" />
                  <InputField label="Primary BAS Platform" field="primary_bas_platform" />
                </div>
                <SelectField 
                  label="Contract Status" 
                  field="contract_status"
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'Inactive', label: 'Inactive' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Expired', label: 'Expired' }
                  ]}
                />
              </CardContent>
            </Card>
            
            {/* Mailing Address */}
            <Card>
              <CardHeader>
                <CardTitle>Mailing Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputField label="Mailing Address" field="mailing_address" type="textarea" placeholder="Mailing address if different from site address..." />
                <div className="grid grid-cols-3 gap-4">
                  <InputField label="Mailing City" field="mailing_city" />
                  <InputField label="Mailing State" field="mailing_state" />
                  <InputField label="Mailing ZIP" field="mailing_zip" />
                </div>
              </CardContent>
            </Card>
            
            {/* Equipment Information */}
            <Card>
              <CardHeader>
                <CardTitle>Equipment & Procedures</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Equipment Locations (JSON)</Label>
                  <Textarea
                    value={String((formData as any)?.equipment_locations ? JSON.stringify((formData as any).equipment_locations, null, 2) : '')}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value || '[]');
                        updateFormData('equipment_locations' as keyof Customer, parsed);
                      } catch {
                        // Invalid JSON - store as string for now
                        updateFormData('equipment_locations' as keyof Customer, e.target.value);
                      }
                    }}
                    disabled={!isEditing}
                    placeholder='[{"name": "Server Room", "location": "2nd Floor", "access": "Key card required"}]'
                    rows={4}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    JSON array of equipment locations with details
                  </div>
                </div>
                <InputField 
                  label="Equipment Specific Procedures" 
                  field="equipment_specific_procedures" 
                  type="textarea" 
                  placeholder="Special procedures for equipment access, maintenance, etc..."
                  rows={3}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contacts" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Primary Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputField label="Contact Name" field="primary_contact" />
                  <InputField label="Primary Contact Name" field="primary_contact_name" />
                  <InputField label="Phone" field="contact_phone" />
                  <InputField label="Email" field="contact_email" type="email" />
                  <InputField label="Role" field="primary_contact_role" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Secondary Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputField label="Secondary Contact Name" field="secondary_contact_name" />
                  <InputField label="Secondary Phone" field="secondary_contact_phone" />
                  <InputField label="Secondary Email" field="secondary_contact_email" type="email" />
                  <InputField label="Secondary Role" field="secondary_contact_role" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Emergency Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputField label="Emergency Contact Name" field="emergency_contact" />
                  <InputField label="Emergency Phone" field="emergency_phone" />
                  <InputField label="Emergency Email" field="emergency_email" type="email" />
                  <InputField label="Emergency Contact Role" field="emergency_contact_role" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputField label="Security Contact Name" field="security_contact_name" />
                  <InputField label="Security Phone" field="security_contact_phone" />
                  <InputField label="Security Email" field="security_contact_email" type="email" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputField label="Technical Contact Name" field="technical_contact_name" />
                  <InputField label="Technical Phone" field="technical_contact_phone" />
                  <InputField label="Technical Email" field="technical_contact_email" type="email" />
                  <InputField label="Technical Role" field="technical_contact_role" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <InputField label="Billing Contact Name" field="billing_contact_name" />
                  <InputField label="Billing Phone" field="billing_contact_phone" />
                  <InputField label="Billing Email" field="billing_contact_email" type="email" />
                  <InputField label="Billing Role" field="billing_contact_role" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Access & Security Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Building Access Type" field="building_access_type" />
                  <InputField label="Access Hours" field="access_hours" />
                </div>
                <InputField label="Building Access Details" field="building_access_details" type="textarea" />
                <InputField label="Access Procedure" field="access_procedure" type="textarea" />
                <InputField label="Parking Instructions" field="parking_instructions" type="textarea" />
                
                <div className="grid grid-cols-3 gap-4">
                  <CheckboxField label="PPE Required" field="ppe_required" />
                  <CheckboxField label="Badge Required" field="badge_required" />
                  <CheckboxField label="Training Required" field="training_required" />
                </div>

                <InputField label="Safety Requirements" field="safety_requirements" type="textarea" />
                <InputField label="Site Hazards" field="site_hazards_legacy" type="textarea" />
                <InputField label="Equipment Access Notes" field="equipment_access_notes" type="textarea" />
                <InputField label="Safety Notes" field="safety_notes" type="textarea" />
                <InputField label="Other Hazards Notes" field="other_hazards_notes" type="textarea" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="remote-creds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Remote Access Credentials</CardTitle>
              </CardHeader>
              <CardContent>
                {mode === 'edit' ? (
                  <RemoteAccessCredentialsManager
                    initialCredentials={formData.access_credentials || []}
                    initialVpnConfig={formData.vpn_required ? {
                      customer_id: formData.id,
                      vpn_required: formData.vpn_required,
                      vpn_profile_name: formData.remote_access_type || '',
                      connection_instructions: formData.vpn_details || '',
                      is_active: true
                    } : undefined}
                    onChange={(credentials, vpnConfig) => {
                      updateFormData('access_credentials', credentials);
                      if (vpnConfig) {
                        updateFormData('vpn_required', vpnConfig.vpn_required || false);
                        updateFormData('vpn_details', vpnConfig.connection_instructions || '');
                        updateFormData('remote_access', vpnConfig.vpn_required || false);
                        updateFormData('remote_access_type', vpnConfig.vpn_profile_name || 'VPN');
                      }
                    }}
                    mode="form"
                    showVpnConfig={true}
                  />
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Remote Access</Label>
                        <div className="text-sm">{formData.remote_access ? 'Available' : 'Not Available'}</div>
                      </div>
                      <div>
                        <Label>VPN Required</Label>
                        <div className="text-sm">{formData.vpn_required ? 'Yes' : 'No'}</div>
                      </div>
                    </div>
                    {formData.remote_access_type && (
                      <div>
                        <Label>Remote Access Type</Label>
                        <div className="text-sm">{formData.remote_access_type}</div>
                      </div>
                    )}
                    {formData.vpn_details && (
                      <div>
                        <Label>VPN Details</Label>
                        <div className="text-sm whitespace-pre-wrap">{formData.vpn_details}</div>
                      </div>
                    )}
                    {formData.access_credentials && formData.access_credentials.length > 0 && (
                      <div>
                        <Label>Credentials Count</Label>
                        <div className="text-sm">{formData.access_credentials.length} credential(s) configured</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system-creds" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Access Credentials</CardTitle>
              </CardHeader>
              <CardContent>
                {mode === 'edit' ? (
                  <SystemCredentialsManager
                    initialBmsCredentials={formData.system_credentials}
                    initialWindowsCredentials={formData.windows_credentials}
                    initialServiceCredentials={formData.service_credentials}
                    onChange={(data) => {
                      updateFormData('system_credentials', data.bms);
                      updateFormData('windows_credentials', data.windows);
                      updateFormData('service_credentials', data.services);
                      
                      // Update legacy fields for backward compatibility
                      if (data.bms) {
                        updateFormData('bms_supervisor_ip', data.bms.platform_host || '');
                        updateFormData('platform_username', data.bms.platform_username || '');
                        updateFormData('platform_password', data.bms.platform_password || '');
                        updateFormData('workbench_username', data.bms.station_username || '');
                        updateFormData('workbench_password', data.bms.station_password || '');
                      }
                      if (data.windows) {
                        updateFormData('pc_username', data.windows.local_admin_username || '');
                        updateFormData('pc_password', data.windows.local_admin_password || '');
                      }
                    }}
                    mode="form"
                  />
                ) : (
                  <div className="space-y-4">
                    {formData.bms_supervisor_ip && (
                      <div>
                        <Label>BMS Supervisor IP</Label>
                        <div className="text-sm">{formData.bms_supervisor_ip}</div>
                      </div>
                    )}
                    {formData.web_supervisor_url && (
                      <div>
                        <Label>Web Supervisor URL</Label>
                        <div className="text-sm">{formData.web_supervisor_url}</div>
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-4">
                      {formData.has_bms_credentials && (
                        <div>
                          <Badge variant="outline" className="mt-1">
                            <Key className="w-3 h-3 mr-1" />
                            BMS Configured
                          </Badge>
                        </div>
                      )}
                      {formData.has_windows_credentials && (
                        <div>
                          <Badge variant="outline" className="mt-1">
                            <Monitor className="w-3 h-3 mr-1" />
                            Windows Configured
                          </Badge>
                        </div>
                      )}
                      {formData.has_service_credentials && (
                        <div>
                          <Badge variant="outline" className="mt-1">
                            <Shield className="w-3 h-3 mr-1" />
                            Services Configured
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="service" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Service Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Primary Technician</Label>
                    {isEditing ? (
                      <SearchableCombobox
                        options={technicianOptions}
                        value={formData.primary_technician_id || ''}
                        onValueChange={(value) => {
                          const selectedTech = technicianOptions.find(tech => tech.id === value);
                          if (selectedTech) {
                            updateFormData('primary_technician_id', value);
                            updateFormData('primary_technician_name', selectedTech.name);
                            updateFormData('primary_technician_phone', selectedTech.phone || '');
                            updateFormData('primary_technician_email', selectedTech.email || '');
                          }
                        }}
                        placeholder="Select primary technician"
                        searchPlaceholder="Search technicians..."
                        emptyText="No technicians found"
                        loading={isLoadingDropdowns}
                      />
                    ) : (
                      <div className="text-sm">
                        {formData.primary_technician_name || 'Not assigned'}
                        {formData.primary_technician_phone && (
                          <div className="text-xs text-muted-foreground">📱 {formData.primary_technician_phone}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Secondary Technician</Label>
                    {isEditing ? (
                      <SearchableCombobox
                        options={technicianOptions}
                        value={formData.secondary_technician_id || ''}
                        onValueChange={(value) => {
                          const selectedTech = technicianOptions.find(tech => tech.id === value);
                          if (selectedTech) {
                            updateFormData('secondary_technician_id', value);
                            updateFormData('secondary_technician_name', selectedTech.name);
                            updateFormData('secondary_technician_phone', selectedTech.phone || '');
                            updateFormData('secondary_technician_email', selectedTech.email || '');
                          }
                        }}
                        placeholder="Select secondary technician"
                        searchPlaceholder="Search technicians..."
                        emptyText="No technicians found"
                        loading={isLoadingDropdowns}
                      />
                    ) : (
                      <div className="text-sm">
                        {formData.secondary_technician_name || 'Not assigned'}
                        {formData.secondary_technician_phone && (
                          <div className="text-xs text-muted-foreground">📱 {formData.secondary_technician_phone}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Service Frequency</Label>
                    {isEditing ? (
                      <Select value={formData.service_frequency || ''} onValueChange={(value) => updateFormData('service_frequency', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Monthly">Monthly</SelectItem>
                          <SelectItem value="Quarterly">Quarterly</SelectItem>
                          <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                          <SelectItem value="Annual">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input value={String(formData.service_frequency || '')} disabled />
                    )}
                  </div>
                  <InputField label="Legacy Assigned Tech" field="technician_assigned" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Last Service Date" field="last_service" type="date" />
                  <InputField label="Next Service Due" field="next_due" type="date" />
                </div>

                <div>
                  <Label>Special Instructions</Label>
                  <Textarea
                    value={String(formData.special_instructions || '')}
                    onChange={(e) => updateFormData('special_instructions', e.target.value)}
                    disabled={!isEditing}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contract" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Contract Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Contract Number" field="contract_number" />
                  <InputField label="Contract Name" field="contract_name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Contract Value" field="contract_value" type="number" />
                  <SelectField 
                    label="Contract Status" 
                    field="contract_status"
                    options={[
                      { value: 'Active', label: 'Active' },
                      { value: 'Inactive', label: 'Inactive' },
                      { value: 'Pending', label: 'Pending' },
                      { value: 'Expired', label: 'Expired' }
                    ]}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Contract Start Date" field="contract_start_date" type="date" />
                  <InputField label="Contract End Date" field="contract_end_date" type="date" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Administrative Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Account Manager</Label>
                    {isEditing ? (
                      <SearchableCombobox
                        options={accountManagerOptions}
                        value={formData.account_manager_id || ''}
                        onValueChange={(value) => {
                          const selectedMgr = accountManagerOptions.find(mgr => mgr.id === value);
                          if (selectedMgr) {
                            updateFormData('account_manager_id', value);
                            updateFormData('account_manager_name', selectedMgr.name);
                            updateFormData('account_manager_phone', selectedMgr.phone || '');
                            updateFormData('account_manager_email', selectedMgr.email || '');
                            updateFormData('account_manager', selectedMgr.name); // Legacy field
                          }
                        }}
                        placeholder="Select account manager"
                        searchPlaceholder="Search account managers..."
                        emptyText="No account managers found"
                        loading={isLoadingDropdowns}
                      />
                    ) : (
                      <div className="text-sm">
                        {formData.account_manager_name || formData.account_manager || 'Not assigned'}
                        {formData.account_manager_phone && (
                          <div className="text-xs text-muted-foreground">📱 {formData.account_manager_phone}</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <Label>Escalation Contact</Label>
                    <Input
                      value={String(formData.escalation_contact || '')}
                      onChange={(e) => updateFormData('escalation_contact', e.target.value)}
                      disabled={!isEditing}
                      placeholder="Escalation contact name"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Escalation Phone" field="escalation_phone" />
                  <InputField label="Region" field="region" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="District" field="district" />
                  <InputField label="Territory" field="territory" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Drive Folder ID" field="drive_folder_id" />
                  <InputField label="Drive Folder URL" field="drive_folder_url" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
