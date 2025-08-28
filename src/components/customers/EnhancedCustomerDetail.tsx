import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Edit3, Save, X, FolderOpen, Plus, Link, ExternalLink, Shield, Server, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AMEService } from '@/services/ameService';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';

// Import components from the wizard for reusability
import { SimpleAccessCredentials } from './SimpleAccessCredentials';
import { EnhancedGoogleDriveFolderSearch } from './EnhancedGoogleDriveFolderSearch';

interface EnhancedCustomerDetailProps {
  customer: Customer;
  onCustomerUpdated: () => void;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
}

export const EnhancedCustomerDetail: React.FC<EnhancedCustomerDetailProps> = ({ 
  customer, 
  onCustomerUpdated,
  isExpanded: externalIsExpanded,
  onExpandToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(externalIsExpanded ?? false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Customer>(customer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const { toast } = useToast();

  useEffect(() => {
    setFormData(customer);
  }, [customer]);

  useEffect(() => {
    if (externalIsExpanded !== undefined) {
      setIsExpanded(externalIsExpanded);
    }
  }, [externalIsExpanded]);

  const updateFormData = (field: keyof Customer | string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);
      await AMEService.updateCustomer(formData.id, formData);
      
      toast({
        title: "Success",
        description: "Customer updated successfully",
      });
      
      onCustomerUpdated();
      setIsEditing(false);
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
    setIsEditing(false);
  };

  const handleExpandToggle = () => {
    if (onExpandToggle) {
      onExpandToggle();
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  const getServiceTierBadge = (tier: Customer['service_tier']) => {
    const variants = {
      CORE: 'bg-tier-core text-white',
      ASSURE: 'bg-tier-assure text-white',
      GUARDIAN: 'bg-tier-guardian text-white'
    };
    
    return (
      <Badge className={cn('font-medium', variants[tier])}>
        {tier}
      </Badge>
    );
  };

  const getStatusBadge = (status: Customer['contract_status']) => {
    const variants = {
      Active: 'bg-success text-success-foreground',
      Inactive: 'bg-muted text-muted-foreground',
      Pending: 'bg-warning text-warning-foreground',
      Expired: 'bg-danger text-danger-foreground'
    };
    
    return (
      <Badge variant="outline" className={cn(variants[status])}>
        {status}
      </Badge>
    );
  };

  const formatNextDue = (date?: string) => {
    if (!date) return 'Not scheduled';
    
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="text-danger font-medium">Overdue</span>;
    } else if (diffDays === 0) {
      return <span className="text-warning font-medium">Due Today</span>;
    } else if (diffDays <= 7) {
      return <span className="text-warning font-medium">Due in {diffDays} days</span>;
    } else {
      return dueDate.toLocaleDateString();
    }
  };

  const InputField = ({ 
    label, 
    field, 
    type = 'text', 
    placeholder = '', 
    rows = 3 
  }: { 
    label: string;
    field: keyof Customer | string;
    type?: string;
    placeholder?: string;
    rows?: number;
  }) => (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      {type === 'textarea' ? (
        <Textarea
          value={String(formData[field] || '')}
          onChange={(e) => updateFormData(field, e.target.value)}
          disabled={!isEditing}
          placeholder={placeholder}
          rows={rows}
          className="text-sm"
        />
      ) : (
        <Input
          type={type}
          value={String(formData[field] || '')}
          onChange={(e) => updateFormData(field, e.target.value)}
          disabled={!isEditing}
          placeholder={placeholder}
          className="text-sm"
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
    field: keyof Customer | string;
    options: { value: string; label: string }[];
  }) => (
    <div className="space-y-1">
      <Label className="text-sm font-medium">{label}</Label>
      <Select 
        value={String(formData[field] || '')} 
        onValueChange={(value) => updateFormData(field, value)}
        disabled={!isEditing}
      >
        <SelectTrigger className="text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background border border-border shadow-lg">
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
    field: keyof Customer | string;
  }) => (
    <div className="flex items-center space-x-2">
      <Checkbox
        checked={!!formData[field]}
        onCheckedChange={(checked) => updateFormData(field, checked)}
        disabled={!isEditing}
      />
      <Label className="text-sm">{label}</Label>
    </div>
  );

  return (
    <Card className="border-card-border shadow-sm hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-lg text-foreground">
                  {customer.company_name}
                </h3>
                {getServiceTierBadge(customer.service_tier)}
                {getStatusBadge(customer.contract_status)}
              </div>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>{customer.site_name}</span>
                <span>•</span>
                <span>{customer.customer_id}</span>
                <span>•</span>
                <span>{customer.system_type || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isExpanded && (
              <>
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary-hover"
                    >
                      <Save className="w-4 h-4 mr-1" />
                      {isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                )}
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpandToggle}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Summary row when collapsed */}
        {!isExpanded && (
          <div className="flex items-center justify-between pt-2 text-sm">
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-muted-foreground">Contact: </span>
                <span className="font-medium">{customer.primary_contact || 'N/A'}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone: </span>
                <span>{customer.contact_phone || 'N/A'}</span>
              </div>
              {customer.drive_folder_url && (
                <a 
                  href={customer.drive_folder_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-700"
                >
                  <FolderOpen className="w-3 h-3 mr-1" />
                  Drive Folder
                </a>
              )}
            </div>
            <div>
              <span className="text-muted-foreground">Next Due: </span>
              {formatNextDue(customer.next_due)}
            </div>
          </div>
        )}
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="access">Access</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="credentials">Credentials</TabsTrigger>
              <TabsTrigger value="folders">Folders</TabsTrigger>
              <TabsTrigger value="service">Service</TabsTrigger>
              <TabsTrigger value="admin">Admin</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Customer ID" field="customer_id" />
                <InputField label="Company Name" field="company_name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Site Name" field="site_name" />
                <InputField label="Site Nickname" field="site_nickname" placeholder="e.g., 23-1220-300NJ" />
              </div>
              <InputField label="Site Address" field="site_address" type="textarea" />
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
                <InputField label="Building Type" field="building_type" />
                <InputField label="System Architecture" field="system_architecture" />
              </div>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Primary Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InputField label="Name" field="primary_contact" />
                    <InputField label="Primary Contact Name" field="primary_contact_name" />
                    <InputField label="Phone" field="contact_phone" />
                    <InputField label="Email" field="contact_email" type="email" />
                    <InputField label="Role" field="primary_contact_role" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Secondary Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InputField label="Name" field="secondary_contact_name" />
                    <InputField label="Phone" field="secondary_contact_phone" />
                    <InputField label="Email" field="secondary_contact_email" type="email" />
                    <InputField label="Role" field="secondary_contact_role" />
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InputField label="Name" field="emergency_contact" />
                    <InputField label="Phone" field="emergency_phone" />
                    <InputField label="Email" field="emergency_email" type="email" />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium">Security Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <InputField label="Name" field="security_contact" />
                    <InputField label="Phone" field="security_phone" />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Account Management</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <InputField label="Account Manager" field="account_manager_name" />
                  <InputField label="Manager Phone" field="account_manager_phone" />
                  <InputField label="Manager Email" field="account_manager_email" type="email" />
                  <InputField label="Escalation Contact" field="escalation_contact" />
                  <InputField label="Escalation Phone" field="escalation_phone" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="access" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Building Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Access Type" field="building_access_type" />
                    <InputField label="Access Hours" field="access_hours" />
                  </div>
                  <InputField label="Access Details" field="building_access_details" type="textarea" />
                  <InputField label="Access Procedure" field="access_procedure" type="textarea" />
                  <InputField label="Parking Instructions" field="parking_instructions" type="textarea" />
                  <InputField label="Equipment Access Notes" field="equipment_access_notes" type="textarea" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Safety Requirements</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <CheckboxField label="PPE Required" field="ppe_required" />
                    <CheckboxField label="Badge Required" field="badge_required" />
                    <CheckboxField label="Training Required" field="training_required" />
                  </div>
                  <InputField label="Safety Requirements" field="safety_requirements" type="textarea" />
                  <InputField label="Site Hazards" field="site_hazards" type="textarea" />
                  <InputField label="Other Hazards Notes" field="other_hazards_notes" type="textarea" />
                  <InputField label="Safety Notes" field="safety_notes" type="textarea" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">BAS Platform</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Primary BAS Platform" field="primary_bas_platform" />
                    <InputField label="BMS Supervisor IP" field="bms_supervisor_ip" />
                  </div>
                  <InputField label="Web Supervisor URL" field="web_supervisor_url" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">System Credentials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Workbench Username" field="workbench_username" />
                    <InputField label="Workbench Password" field="workbench_password" type={isEditing ? "text" : "password"} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Platform Username" field="platform_username" />
                    <InputField label="Platform Password" field="platform_password" type={isEditing ? "text" : "password"} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="PC Username" field="pc_username" />
                    <InputField label="PC Password" field="pc_password" type={isEditing ? "text" : "password"} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Remote Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <CheckboxField label="Remote Access Available" field="remote_access" />
                    <CheckboxField label="VPN Required" field="vpn_required" />
                  </div>
                  <InputField label="Remote Access Type" field="remote_access_type" />
                  <InputField label="VPN Details" field="vpn_details" type="textarea" />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="credentials" className="mt-4">
              <SimpleAccessCredentials 
                credentials={formData.access_credentials || []}
                onChange={(creds) => updateFormData('access_credentials', creds)}
                disabled={!isEditing}
              />
            </TabsContent>

            <TabsContent value="folders" className="mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center">
                      <FolderOpen className="w-4 h-4 mr-2" />
                      Google Drive Integration
                    </span>
                    {customer.drive_folder_url && (
                      <a 
                        href={customer.drive_folder_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                      >
                        Open Folder
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {customer.drive_folder_id ? (
                    <div className="space-y-3">
                      <div className="p-3 bg-muted rounded-lg">
                        <div className="text-sm">
                          <p className="font-medium">Main Project Folder</p>
                          <p className="text-muted-foreground mt-1">ID: {customer.drive_folder_id}</p>
                        </div>
                      </div>
                      {isEditing && (
                        <EnhancedGoogleDriveFolderSearch
                          customerData={{
                            company_name: customer.company_name,
                            site_name: customer.site_name,
                            site_nickname: customer.site_nickname,
                            site_address: customer.site_address,
                            customer_id: customer.id,
                            service_tier: customer.service_tier,
                            contact_name: customer.contact_name,
                            phone: customer.phone
                          }}
                          onFolderSelected={(folderId, folderUrl) => {
                            updateFormData('drive_folder_id', folderId);
                            updateFormData('drive_folder_url', folderUrl);
                          }}
                          initialFolderId={customer.drive_folder_id}
                          initialFolderUrl={customer.drive_folder_url}
                        />
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground">No folder linked yet</p>
                      {isEditing && (
                        <EnhancedGoogleDriveFolderSearch
                          customerData={{
                            company_name: customer.company_name,
                            site_name: customer.site_name,
                            site_nickname: customer.site_nickname,
                            site_address: customer.site_address,
                            customer_id: customer.id,
                            service_tier: customer.service_tier,
                            contact_name: customer.contact_name,
                            phone: customer.phone
                          }}
                          onFolderSelected={(folderId, folderUrl) => {
                            updateFormData('drive_folder_id', folderId);
                            updateFormData('drive_folder_url', folderUrl);
                          }}
                        />
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="service" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Service Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <InputField label="Service Frequency" field="service_frequency" />
                    <InputField label="Last Service" field="last_service" type="date" />
                    <InputField label="Next Due" field="next_due" type="date" />
                  </div>
                  <InputField label="Special Instructions" field="special_instructions" type="textarea" rows={4} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Assigned Technicians</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <InputField label="Primary Technician" field="primary_technician_name" />
                      <InputField label="Phone" field="primary_technician_phone" />
                      <InputField label="Email" field="primary_technician_email" type="email" />
                    </div>
                    <div className="space-y-3">
                      <InputField label="Secondary Technician" field="secondary_technician_name" />
                      <InputField label="Phone" field="secondary_technician_phone" />
                      <InputField label="Email" field="secondary_technician_email" type="email" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="admin" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Administrative Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Contract Number" field="contract_number" />
                    <InputField label="Contract Value" field="contract_value" type="number" />
                  </div>
                  <InputField label="Contract Name" field="contract_name" />
                  <div className="grid grid-cols-2 gap-4">
                    <InputField label="Contract Start Date" field="contract_start_date" type="date" />
                    <InputField label="Contract End Date" field="contract_end_date" type="date" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">System Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-muted-foreground">Created</Label>
                      <p>{customer.created_at ? new Date(customer.created_at).toLocaleString() : 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Updated</Label>
                      <p>{customer.updated_at ? new Date(customer.updated_at).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
};
