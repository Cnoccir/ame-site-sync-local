import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, CheckCircle, Clock, Edit3, Save, X, 
  ArrowLeft, ArrowRight, Eye, EyeOff 
} from 'lucide-react';
import { Customer } from '@/types';
import { NewCustomerWizard } from './NewCustomerWizard';
import { useToast } from '@/hooks/use-toast';
import { AMEService } from '@/services/ameService';
import { CustomerDataViewer } from './CustomerDataViewer';

interface UnifiedCustomerEditorProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer;
  onCustomerUpdated: (updatedCustomer: Customer) => void;
  mode: 'view' | 'edit';
}

interface CustomerChange {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
  type: 'added' | 'modified' | 'removed';
}

export const UnifiedCustomerEditor: React.FC<UnifiedCustomerEditorProps> = ({
  isOpen,
  onClose,
  customer,
  onCustomerUpdated,
  mode: initialMode
}) => {
  const [mode, setMode] = useState(initialMode);
  const [showChanges, setShowChanges] = useState(false);
  const [changes, setChanges] = useState<CustomerChange[]>([]);
  const [originalCustomer, setOriginalCustomer] = useState<Customer>(customer);
  const [modifiedCustomer, setModifiedCustomer] = useState<Customer | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      setOriginalCustomer(customer);
      setModifiedCustomer(null);
      setChanges([]);
      setMode(initialMode);
      setShowChanges(false);
    }
  }, [isOpen, customer, initialMode]);

  const detectChanges = (original: Customer, modified: Customer): CustomerChange[] => {
    const changes: CustomerChange[] = [];
    
    // Field labels for better UX
    const fieldLabels: Record<string, string> = {
      company_name: 'Company Name',
      site_name: 'Site Name',
      site_nickname: 'Site Nickname',
      site_address: 'Site Address',
      customer_id: 'Customer ID',
      service_tier: 'Service Tier',
      contract_status: 'Contract Status',
      system_type: 'System Type',
      building_type: 'Building Type',
      primary_contact: 'Primary Contact',
      contact_phone: 'Contact Phone',
      contact_email: 'Contact Email',
      emergency_contact: 'Emergency Contact',
      emergency_phone: 'Emergency Phone',
      emergency_email: 'Emergency Email',
      secondary_contact_name: 'Secondary Contact Name',
      secondary_contact_phone: 'Secondary Contact Phone',
      secondary_contact_email: 'Secondary Contact Email',
      account_manager_name: 'Account Manager',
      account_manager_phone: 'Account Manager Phone',
      account_manager_email: 'Account Manager Email',
      primary_bas_platform: 'Primary BAS Platform',
      bms_supervisor_ip: 'BMS Supervisor IP',
      web_supervisor_url: 'Web Supervisor URL',
      workbench_username: 'Workbench Username',
      workbench_password: 'Workbench Password',
      platform_username: 'Platform Username',
      platform_password: 'Platform Password',
      pc_username: 'PC Username',
      pc_password: 'PC Password',
      remote_access: 'Remote Access Available',
      vpn_required: 'VPN Required',
      remote_access_type: 'Remote Access Type',
      vpn_details: 'VPN Details',
      building_access_type: 'Building Access Type',
      access_hours: 'Access Hours',
      building_access_details: 'Building Access Details',
      service_frequency: 'Service Frequency',
      last_service: 'Last Service Date',
      next_due: 'Next Due Date',
      special_instructions: 'Special Instructions',
      drive_folder_id: 'Drive Folder ID',
      drive_folder_url: 'Drive Folder URL',
      primary_technician_name: 'Primary Technician',
      primary_technician_phone: 'Primary Technician Phone',
      primary_technician_email: 'Primary Technician Email'
    };

    // Compare all relevant fields
    Object.keys(fieldLabels).forEach(field => {
      const oldVal = original[field as keyof Customer];
      const newVal = modified[field as keyof Customer];
      
      // Handle different value types
      const oldValue = oldVal === null || oldVal === undefined ? '' : String(oldVal);
      const newValue = newVal === null || newVal === undefined ? '' : String(newVal);
      
      if (oldValue !== newValue) {
        let changeType: 'added' | 'modified' | 'removed' = 'modified';
        
        if (!oldValue && newValue) {
          changeType = 'added';
        } else if (oldValue && !newValue) {
          changeType = 'removed';
        }
        
        changes.push({
          field,
          label: fieldLabels[field] || field,
          oldValue: oldValue || '(empty)',
          newValue: newValue || '(empty)',
          type: changeType
        });
      }
    });

    return changes;
  };

  const handleWizardComplete = (customerData: any) => {
    const updatedCustomer = {
      ...customer,
      ...customerData,
      updated_at: new Date().toISOString()
    } as Customer;

    setModifiedCustomer(updatedCustomer);
    const detectedChanges = detectChanges(originalCustomer, updatedCustomer);
    setChanges(detectedChanges);
    
    if (detectedChanges.length > 0) {
      setShowChanges(true);
    } else {
      toast({
        title: 'No Changes Detected',
        description: 'No modifications were made to the customer record.',
        variant: 'default'
      });
    }
  };

  const handleApproveChanges = async () => {
    if (!modifiedCustomer || changes.length === 0) return;

    try {
      setIsSubmitting(true);
      
      // Create an object with only the changed fields
      const changedFields: Partial<Customer> = {};
      
      changes.forEach(change => {
        const fieldKey = change.field as keyof Customer;
        (changedFields as any)[fieldKey] = modifiedCustomer[fieldKey];
      });
      
      // Always include updated_at
      changedFields.updated_at = new Date().toISOString();
      
      console.log('Sending optimized update with only changed fields:', {
        customerId: modifiedCustomer.id,
        changedFieldsCount: Object.keys(changedFields).length,
        changedFields: Object.keys(changedFields)
      });
      
      // Call the API to update only the changed fields
      const updatedCustomer = await AMEService.updateCustomer(modifiedCustomer.id!, changedFields);
      
      onCustomerUpdated(updatedCustomer);
      
      toast({
        title: 'Customer Updated Successfully',
        description: `${changes.length} changes have been applied to ${modifiedCustomer.company_name}.`,
      });
      
      onClose();
    } catch (error) {
      console.error('Error updating customer:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update customer. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectChanges = () => {
    setModifiedCustomer(null);
    setChanges([]);
    setShowChanges(false);
    setMode('edit'); // Return to edit mode
  };

  const renderChangesSummary = () => (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-blue-600" />
          Review Changes ({changes.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {changes.map((change, index) => (
            <div key={index} className="p-3 bg-white border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium text-sm">{change.label}</div>
                <Badge 
                  variant="outline" 
                  className={
                    change.type === 'added' ? 'bg-green-50 text-green-700 border-green-300' :
                    change.type === 'removed' ? 'bg-red-50 text-red-700 border-red-300' :
                    'bg-blue-50 text-blue-700 border-blue-300'
                  }
                >
                  {change.type}
                </Badge>
              </div>
              
              <div className="text-sm space-y-1">
                {change.type !== 'added' && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-12">From:</span>
                    <span className="text-red-600 line-through bg-red-50 px-2 py-1 rounded">
                      {change.oldValue}
                    </span>
                  </div>
                )}
                {change.type !== 'removed' && (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 w-12">To:</span>
                    <span className="text-green-600 bg-green-50 px-2 py-1 rounded font-medium">
                      {change.newValue}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={handleRejectChanges}
            disabled={isSubmitting}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Edit
          </Button>

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveChanges}
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Apply Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!isOpen) return null;

  if (showChanges) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Review Changes - {customer.company_name}</DialogTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {customer.customer_id}
              </Badge>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                {changes.length} changes pending
              </Badge>
            </div>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {renderChangesSummary()}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (mode === 'edit') {
    return (
      <NewCustomerWizard
        isOpen={isOpen}
        onClose={onClose}
        onComplete={handleWizardComplete}
        editMode={{
          isEdit: true,
          initialData: customer,
          title: `Edit ${customer.company_name}`
        }}
      />
    );
  }

  // View mode
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Customer Details - {customer.company_name}</DialogTitle>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {customer.customer_id}
                </Badge>
                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                  {customer.service_tier}
                </Badge>
              </div>
            </div>
            <Button 
              onClick={() => setMode('edit')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Customer
            </Button>
          </div>
        </DialogHeader>
        <div className="overflow-y-auto">
          <CustomerDataViewer customer={customer} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
