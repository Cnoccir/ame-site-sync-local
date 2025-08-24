import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Edit3, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AMEService } from '@/services/ameService';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';

interface CustomerCardProps {
  customer: Customer;
  onCustomerUpdated: () => void;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ 
  customer, 
  onCustomerUpdated 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Customer>(customer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    setFormData(customer);
  }, [customer]);

  const updateFormData = (field: keyof Customer, value: any) => {
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
    field: keyof Customer;
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
    field: keyof Customer;
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
    field: keyof Customer;
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
                <span>{customer.system_type}</span>
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
              onClick={() => setIsExpanded(!isExpanded)}
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
                <span className="font-medium">{customer.primary_contact}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Phone: </span>
                <span>{customer.contact_phone}</span>
              </div>
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
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="access">Access</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
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
                <InputField label="Building Type" field="building_type" />
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
            </TabsContent>

            <TabsContent value="contacts" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Primary Contact</h4>
                  <InputField label="Contact Name" field="primary_contact" />
                  <InputField label="Phone" field="contact_phone" />
                  <InputField label="Email" field="contact_email" type="email" />
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Emergency Contact</h4>
                  <InputField label="Emergency Contact" field="emergency_contact" />
                  <InputField label="Emergency Phone" field="emergency_phone" />
                  <InputField label="Emergency Email" field="emergency_email" type="email" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Security</h4>
                  <InputField label="Security Contact" field="security_contact" />
                  <InputField label="Security Phone" field="security_phone" />
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-sm">Technical</h4>
                  <InputField label="Assigned Technician" field="technician_assigned" />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="access" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Building Access Type" field="building_access_type" />
                <InputField label="Access Hours" field="access_hours" />
              </div>
              <InputField label="Building Access Details" field="building_access_details" type="textarea" />
              
              <div className="grid grid-cols-3 gap-4">
                <CheckboxField label="PPE Required" field="ppe_required" />
                <CheckboxField label="Badge Required" field="badge_required" />
                <CheckboxField label="Training Required" field="training_required" />
              </div>

              <InputField label="Safety Requirements" field="safety_requirements" type="textarea" />
              <InputField label="Site Hazards" field="site_hazards" type="textarea" />
            </TabsContent>

            <TabsContent value="system" className="space-y-4 mt-4">
              <InputField label="Web Supervisor URL" field="web_supervisor_url" />
              <InputField label="BMS Supervisor IP" field="bms_supervisor_ip" />
              
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Workbench Username" field="workbench_username" />
                <InputField label="Workbench Password" field="workbench_password" type="password" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Platform Username" field="platform_username" />
                <InputField label="Platform Password" field="platform_password" type="password" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <CheckboxField label="Remote Access Available" field="remote_access" />
                <CheckboxField label="VPN Required" field="vpn_required" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputField label="Remote Access Type" field="remote_access_type" />
                <InputField label="VPN Details" field="vpn_details" type="textarea" />
              </div>
            </TabsContent>

            <TabsContent value="service" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Last Service Date" field="last_service" type="date" />
                <InputField label="Next Service Due" field="next_due" type="date" />
              </div>
              <InputField label="Special Instructions" field="special_instructions" type="textarea" />
            </TabsContent>

            <TabsContent value="admin" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-4">
                <InputField label="Region" field="region" />
                <InputField label="District" field="district" />
                <InputField label="Territory" field="territory" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <InputField label="Drive Folder ID" field="drive_folder_id" />
                <InputField label="Drive Folder URL" field="drive_folder_url" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
};