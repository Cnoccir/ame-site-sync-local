import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AMEService } from '@/services/ameService';

interface NewCustomerWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated: () => void;
}

interface CustomerFormData {
  // Basic Information
  customer_id: string;
  company_name: string;
  site_name: string;
  site_address: string;
  service_tier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  system_type: string;
  contract_status: 'Active' | 'Inactive' | 'Pending' | 'Expired';
  building_type: string;
  
  // Contact Information
  primary_contact: string;
  contact_phone: string;
  contact_email: string;
  emergency_contact: string;
  emergency_phone: string;
  emergency_email: string;
  security_contact: string;
  security_phone: string;
  technical_contact: string;
  technical_phone: string;
  technical_email: string;
  billing_contact: string;
  billing_phone: string;
  billing_email: string;
  
  // Access & Security
  building_access_type: string;
  building_access_details: string;
  access_hours: string;
  safety_requirements: string;
  site_hazards: string;
  ppe_required: boolean;
  badge_required: boolean;
  training_required: boolean;
  
  // System Access
  web_supervisor_url: string;
  workbench_username: string;
  workbench_password: string;
  platform_username: string;
  platform_password: string;
  bms_supervisor_ip: string;
  remote_access: boolean;
  remote_access_type: string;
  vpn_required: boolean;
  vpn_details: string;
  
  // Service Information
  technician_assigned: string;
  service_frequency: string;
  next_due: string;
  last_service: string;
  special_instructions: string;
  
  // Administrative
  account_manager: string;
  escalation_contact: string;
  escalation_phone: string;
  region: string;
  district: string;
  territory: string;
  drive_folder_id: string;
  drive_folder_url: string;
}

const initialFormData: CustomerFormData = {
  customer_id: '',
  company_name: '',
  site_name: '',
  site_address: '',
  service_tier: 'CORE',
  system_type: '',
  contract_status: 'Active',
  building_type: '',
  primary_contact: '',
  contact_phone: '',
  contact_email: '',
  emergency_contact: '',
  emergency_phone: '',
  emergency_email: '',
  security_contact: '',
  security_phone: '',
  technical_contact: '',
  technical_phone: '',
  technical_email: '',
  billing_contact: '',
  billing_phone: '',
  billing_email: '',
  building_access_type: '',
  building_access_details: '',
  access_hours: '',
  safety_requirements: '',
  site_hazards: '',
  ppe_required: true,
  badge_required: false,
  training_required: false,
  web_supervisor_url: '',
  workbench_username: '',
  workbench_password: '',
  platform_username: '',
  platform_password: '',
  bms_supervisor_ip: '',
  remote_access: false,
  remote_access_type: '',
  vpn_required: false,
  vpn_details: '',
  technician_assigned: '',
  service_frequency: '',
  next_due: '',
  last_service: '',
  special_instructions: '',
  account_manager: '',
  escalation_contact: '',
  escalation_phone: '',
  region: '',
  district: '',
  territory: '',
  drive_folder_id: '',
  drive_folder_url: ''
};

export const NewCustomerWizard: React.FC<NewCustomerWizardProps> = ({
  isOpen,
  onClose,
  onCustomerCreated,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const totalSteps = 6;

  const updateFormData = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await AMEService.createCustomer(formData);
      
      toast({
        title: "Success",
        description: "Customer created successfully",
      });
      
      onCustomerCreated();
      handleClose();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "Error",
        description: "Failed to create customer",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customer_id">Customer ID *</Label>
          <Input
            id="customer_id"
            value={formData.customer_id}
            onChange={(e) => updateFormData('customer_id', e.target.value)}
            placeholder="e.g., AME001"
          />
        </div>
        <div>
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => updateFormData('company_name', e.target.value)}
            placeholder="Company Name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="site_name">Site Name *</Label>
          <Input
            id="site_name"
            value={formData.site_name}
            onChange={(e) => updateFormData('site_name', e.target.value)}
            placeholder="Building/Site Name"
          />
        </div>
        <div>
          <Label htmlFor="building_type">Building Type</Label>
          <Input
            id="building_type"
            value={formData.building_type}
            onChange={(e) => updateFormData('building_type', e.target.value)}
            placeholder="Office, Hospital, School, etc."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="site_address">Site Address *</Label>
        <Textarea
          id="site_address"
          value={formData.site_address}
          onChange={(e) => updateFormData('site_address', e.target.value)}
          placeholder="Full address including city, state, zip"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="service_tier">Service Tier *</Label>
          <Select value={formData.service_tier} onValueChange={(value) => updateFormData('service_tier', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CORE">CORE</SelectItem>
              <SelectItem value="ASSURE">ASSURE</SelectItem>
              <SelectItem value="GUARDIAN">GUARDIAN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="system_type">System Type *</Label>
          <Input
            id="system_type"
            value={formData.system_type}
            onChange={(e) => updateFormData('system_type', e.target.value)}
            placeholder="BACnet, Modbus, etc."
          />
        </div>
      </div>

      <div>
        <Label htmlFor="contract_status">Contract Status</Label>
        <Select value={formData.contract_status} onValueChange={(value) => updateFormData('contract_status', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold text-foreground mb-3">Primary Contact</h4>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="primary_contact">Contact Name *</Label>
            <Input
              id="primary_contact"
              value={formData.primary_contact}
              onChange={(e) => updateFormData('primary_contact', e.target.value)}
              placeholder="Primary contact name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contact_phone">Phone *</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => updateFormData('contact_phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => updateFormData('contact_email', e.target.value)}
                placeholder="contact@company.com"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-foreground mb-3">Emergency Contact</h4>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="emergency_contact">Emergency Contact Name</Label>
            <Input
              id="emergency_contact"
              value={formData.emergency_contact}
              onChange={(e) => updateFormData('emergency_contact', e.target.value)}
              placeholder="Emergency contact name"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="emergency_phone">Emergency Phone</Label>
              <Input
                id="emergency_phone"
                value={formData.emergency_phone}
                onChange={(e) => updateFormData('emergency_phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="emergency_email">Emergency Email</Label>
              <Input
                id="emergency_email"
                type="email"
                value={formData.emergency_email}
                onChange={(e) => updateFormData('emergency_email', e.target.value)}
                placeholder="emergency@company.com"
              />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h4 className="font-semibold text-foreground mb-3">Additional Contacts</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="security_contact">Security Contact</Label>
              <Input
                id="security_contact"
                value={formData.security_contact}
                onChange={(e) => updateFormData('security_contact', e.target.value)}
                placeholder="Security contact name"
              />
            </div>
            <div>
              <Label htmlFor="security_phone">Security Phone</Label>
              <Input
                id="security_phone"
                value={formData.security_phone}
                onChange={(e) => updateFormData('security_phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="escalation_contact">Escalation Contact</Label>
              <Input
                id="escalation_contact"
                value={formData.escalation_contact}
                onChange={(e) => updateFormData('escalation_contact', e.target.value)}
                placeholder="Escalation contact"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="building_access_type">Building Access Type</Label>
        <Select value={formData.building_access_type} onValueChange={(value) => updateFormData('building_access_type', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select access type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Key Card">Key Card</SelectItem>
            <SelectItem value="Key">Key</SelectItem>
            <SelectItem value="Code">Code</SelectItem>
            <SelectItem value="Guard Escort">Guard Escort</SelectItem>
            <SelectItem value="Badge Required">Badge Required</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="building_access_details">Building Access Details</Label>
        <Textarea
          id="building_access_details"
          value={formData.building_access_details}
          onChange={(e) => updateFormData('building_access_details', e.target.value)}
          placeholder="Detailed access instructions..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="access_hours">Access Hours</Label>
        <Input
          id="access_hours"
          value={formData.access_hours}
          onChange={(e) => updateFormData('access_hours', e.target.value)}
          placeholder="e.g., 8:00 AM - 5:00 PM, Weekdays only"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="ppe_required"
            checked={formData.ppe_required}
            onCheckedChange={(checked) => updateFormData('ppe_required', checked)}
          />
          <Label htmlFor="ppe_required">PPE Required</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="badge_required"
            checked={formData.badge_required}
            onCheckedChange={(checked) => updateFormData('badge_required', checked)}
          />
          <Label htmlFor="badge_required">Badge/ID Required</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="training_required"
            checked={formData.training_required}
            onCheckedChange={(checked) => updateFormData('training_required', checked)}
          />
          <Label htmlFor="training_required">Special Training Required</Label>
        </div>
      </div>

      <div>
        <Label htmlFor="safety_requirements">Safety Requirements</Label>
        <Textarea
          id="safety_requirements"
          value={formData.safety_requirements}
          onChange={(e) => updateFormData('safety_requirements', e.target.value)}
          placeholder="List any specific safety requirements..."
          rows={3}
        />
      </div>

      <div>
        <Label htmlFor="site_hazards">Site Hazards</Label>
        <Textarea
          id="site_hazards"
          value={formData.site_hazards}
          onChange={(e) => updateFormData('site_hazards', e.target.value)}
          placeholder="List any potential hazards at the site..."
          rows={3}
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <div>
        <Label htmlFor="web_supervisor_url">Web Supervisor URL</Label>
        <Input
          id="web_supervisor_url"
          value={formData.web_supervisor_url}
          onChange={(e) => updateFormData('web_supervisor_url', e.target.value)}
          placeholder="https://supervisor.example.com"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="workbench_username">Workbench Username</Label>
          <Input
            id="workbench_username"
            value={formData.workbench_username}
            onChange={(e) => updateFormData('workbench_username', e.target.value)}
            placeholder="Username"
          />
        </div>
        <div>
          <Label htmlFor="workbench_password">Workbench Password</Label>
          <Input
            id="workbench_password"
            type="password"
            value={formData.workbench_password}
            onChange={(e) => updateFormData('workbench_password', e.target.value)}
            placeholder="Password"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="platform_username">Platform Username</Label>
          <Input
            id="platform_username"
            value={formData.platform_username}
            onChange={(e) => updateFormData('platform_username', e.target.value)}
            placeholder="Platform username"
          />
        </div>
        <div>
          <Label htmlFor="platform_password">Platform Password</Label>
          <Input
            id="platform_password"
            type="password"
            value={formData.platform_password}
            onChange={(e) => updateFormData('platform_password', e.target.value)}
            placeholder="Platform password"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="bms_supervisor_ip">BMS Supervisor IP</Label>
        <Input
          id="bms_supervisor_ip"
          value={formData.bms_supervisor_ip}
          onChange={(e) => updateFormData('bms_supervisor_ip', e.target.value)}
          placeholder="192.168.1.100"
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="remote_access"
            checked={formData.remote_access}
            onCheckedChange={(checked) => updateFormData('remote_access', checked)}
          />
          <Label htmlFor="remote_access">Remote Access Available</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="vpn_required"
            checked={formData.vpn_required}
            onCheckedChange={(checked) => updateFormData('vpn_required', checked)}
          />
          <Label htmlFor="vpn_required">VPN Required</Label>
        </div>
      </div>

      {formData.remote_access && (
        <div>
          <Label htmlFor="remote_access_type">Remote Access Type</Label>
          <Input
            id="remote_access_type"
            value={formData.remote_access_type}
            onChange={(e) => updateFormData('remote_access_type', e.target.value)}
            placeholder="VPN, TeamViewer, etc."
          />
        </div>
      )}

      {formData.vpn_required && (
        <div>
          <Label htmlFor="vpn_details">VPN Details</Label>
          <Textarea
            id="vpn_details"
            value={formData.vpn_details}
            onChange={(e) => updateFormData('vpn_details', e.target.value)}
            placeholder="VPN connection details and instructions..."
            rows={3}
          />
        </div>
      )}
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="technician_assigned">Assigned Technician</Label>
          <Input
            id="technician_assigned"
            value={formData.technician_assigned}
            onChange={(e) => updateFormData('technician_assigned', e.target.value)}
            placeholder="Technician name"
          />
        </div>
        <div>
          <Label htmlFor="service_frequency">Service Frequency</Label>
          <Select value={formData.service_frequency} onValueChange={(value) => updateFormData('service_frequency', value)}>
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
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="last_service">Last Service Date</Label>
          <Input
            id="last_service"
            type="date"
            value={formData.last_service}
            onChange={(e) => updateFormData('last_service', e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="next_due">Next Service Due</Label>
          <Input
            id="next_due"
            type="date"
            value={formData.next_due}
            onChange={(e) => updateFormData('next_due', e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="special_instructions">Special Instructions</Label>
        <Textarea
          id="special_instructions"
          value={formData.special_instructions}
          onChange={(e) => updateFormData('special_instructions', e.target.value)}
          placeholder="Any special instructions for service visits..."
          rows={4}
        />
      </div>
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="account_manager">Account Manager</Label>
          <Input
            id="account_manager"
            value={formData.account_manager}
            onChange={(e) => updateFormData('account_manager', e.target.value)}
            placeholder="Account manager name"
          />
        </div>
        <div>
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            value={formData.region}
            onChange={(e) => updateFormData('region', e.target.value)}
            placeholder="Region"
          />
        </div>
        <div>
          <Label htmlFor="district">District</Label>
          <Input
            id="district"
            value={formData.district}
            onChange={(e) => updateFormData('district', e.target.value)}
            placeholder="District"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="territory">Territory</Label>
        <Input
          id="territory"
          value={formData.territory}
          onChange={(e) => updateFormData('territory', e.target.value)}
          placeholder="Territory"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="drive_folder_id">Drive Folder ID</Label>
          <Input
            id="drive_folder_id"
            value={formData.drive_folder_id}
            onChange={(e) => updateFormData('drive_folder_id', e.target.value)}
            placeholder="Google Drive folder ID"
          />
        </div>
        <div>
          <Label htmlFor="drive_folder_url">Drive Folder URL</Label>
          <Input
            id="drive_folder_url"
            value={formData.drive_folder_url}
            onChange={(e) => updateFormData('drive_folder_url', e.target.value)}
            placeholder="https://drive.google.com/..."
          />
        </div>
      </div>

      {/* Summary Section */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-3">Review Information</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>Company:</strong> {formData.company_name}</div>
          <div><strong>Site:</strong> {formData.site_name}</div>
          <div><strong>Service Tier:</strong> <Badge className="ml-1">{formData.service_tier}</Badge></div>
          <div><strong>System:</strong> {formData.system_type}</div>
          <div><strong>Primary Contact:</strong> {formData.primary_contact}</div>
          <div><strong>Phone:</strong> {formData.contact_phone}</div>
        </div>
      </div>
    </div>
  );

  const getStepTitle = () => {
    const titles = [
      'Basic Information',
      'Contact Information',
      'Access & Security',
      'System Access',
      'Service Information',
      'Administrative & Review'
    ];
    return titles[currentStep - 1];
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return renderStep1();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>New Customer - {getStepTitle()}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2 mt-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded ${
                  i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </div>
        </DialogHeader>

        <div className="py-6">
          {renderCurrentStep()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {currentStep < totalSteps ? (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-hover"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Customer'}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};