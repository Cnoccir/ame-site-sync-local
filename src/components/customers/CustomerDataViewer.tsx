import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Customer } from '@/types';
import { 
  Building, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Shield, 
  Server, 
  Calendar,
  FileText,
  ExternalLink,
  Wrench,
  AlertTriangle
} from 'lucide-react';

interface CustomerDataViewerProps {
  customer: Customer;
}

export const CustomerDataViewer: React.FC<CustomerDataViewerProps> = ({ customer }) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatBoolean = (value: boolean | null | undefined) => {
    if (value === null || value === undefined) return 'Not specified';
    return value ? 'Yes' : 'No';
  };

  const InfoSection = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Icon className="w-5 h-5 text-blue-600" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  );

  const InfoRow = ({ label, value }: { label: string; value: string | number | null | undefined }) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100 last:border-b-0">
      <dt className="font-medium text-gray-700">{label}:</dt>
      <dd className="col-span-2 text-gray-900">{value || 'Not provided'}</dd>
    </div>
  );

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto">
      {/* Basic Information */}
      <InfoSection title="Basic Information" icon={Building}>
        <dl className="space-y-2">
          <InfoRow label="Customer ID" value={customer.customer_id} />
          <InfoRow label="Company Name" value={customer.company_name} />
          <InfoRow label="Site Name" value={customer.site_name} />
          <InfoRow label="Site Nickname" value={customer.site_nickname} />
          <InfoRow label="Building Type" value={customer.building_type} />
          <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
            <dt className="font-medium text-gray-700">Service Tier:</dt>
            <dd className="col-span-2">
              <Badge variant="outline" className={
                customer.service_tier === 'GUARDIAN' ? 'bg-green-50 text-green-700 border-green-300' :
                customer.service_tier === 'ASSURE' ? 'bg-blue-50 text-blue-700 border-blue-300' :
                'bg-gray-50 text-gray-700 border-gray-300'
              }>
                {customer.service_tier}
              </Badge>
            </dd>
          </div>
          <div className="grid grid-cols-3 gap-4 py-2">
            <dt className="font-medium text-gray-700">Contract Status:</dt>
            <dd className="col-span-2">
              <Badge variant="outline" className={
                customer.contract_status === 'Active' ? 'bg-green-50 text-green-700 border-green-300' :
                customer.contract_status === 'Expired' ? 'bg-red-50 text-red-700 border-red-300' :
                'bg-yellow-50 text-yellow-700 border-yellow-300'
              }>
                {customer.contract_status}
              </Badge>
            </dd>
          </div>
        </dl>
      </InfoSection>

      {/* Location */}
      <InfoSection title="Location" icon={MapPin}>
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-gray-900">{customer.site_address || 'Address not provided'}</p>
        </div>
      </InfoSection>

      {/* System Information */}
      <InfoSection title="System Information" icon={Server}>
        <dl className="space-y-2">
          <InfoRow label="Primary BAS Platform" value={customer.primary_bas_platform} />
          <InfoRow label="System Version" value={customer.system_type} />
          <InfoRow label="System Architecture" value={customer.system_architecture} />
          <InfoRow label="BMS Supervisor IP" value={customer.bms_supervisor_ip} />
          <InfoRow label="Web Supervisor URL" value={customer.web_supervisor_url} />
        </dl>
      </InfoSection>

      {/* Contact Information */}
      <InfoSection title="Contact Information" icon={User}>
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-800 mb-2">Primary Contact</h4>
            <dl className="space-y-2">
              <InfoRow label="Name" value={customer.primary_contact} />
              <InfoRow label="Phone" value={customer.contact_phone} />
              <InfoRow label="Email" value={customer.contact_email} />
            </dl>
          </div>
          
          {(customer.secondary_contact_name || customer.secondary_contact_phone || customer.secondary_contact_email) && (
            <div className="pt-2 border-t">
              <h4 className="font-semibold text-gray-800 mb-2">Secondary Contact</h4>
              <dl className="space-y-2">
                <InfoRow label="Name" value={customer.secondary_contact_name} />
                <InfoRow label="Phone" value={customer.secondary_contact_phone} />
                <InfoRow label="Email" value={customer.secondary_contact_email} />
              </dl>
            </div>
          )}
        </div>
      </InfoSection>

      {/* Access & Security */}
      <InfoSection title="Access & Security" icon={Shield}>
        <dl className="space-y-2">
          <InfoRow label="Building Access Type" value={customer.building_access_type} />
          <InfoRow label="Access Hours" value={customer.access_hours} />
          <InfoRow label="Building Access Details" value={customer.building_access_details} />
          <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
            <dt className="font-medium text-gray-700">Remote Access:</dt>
            <dd className="col-span-2">{formatBoolean(customer.remote_access)}</dd>
          </div>
          <InfoRow label="Remote Access Type" value={customer.remote_access_type} />
          <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
            <dt className="font-medium text-gray-700">VPN Required:</dt>
            <dd className="col-span-2">{formatBoolean(customer.vpn_required)}</dd>
          </div>
          <InfoRow label="VPN Details" value={customer.vpn_details} />
        </dl>
      </InfoSection>

      {/* System Credentials */}
      <InfoSection title="System Credentials" icon={Server}>
        <dl className="space-y-2">
          <InfoRow label="Workbench Username" value={customer.workbench_username} />
          <InfoRow label="Platform Username" value={customer.platform_username} />
          <InfoRow label="PC Username" value={customer.pc_username} />
          {customer.workbench_password && (
            <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100">
              <dt className="font-medium text-gray-700">Passwords:</dt>
              <dd className="col-span-2 text-sm text-gray-600">••••••••• (Hidden for security)</dd>
            </div>
          )}
        </dl>
      </InfoSection>

      {/* Service Information */}
      <InfoSection title="Service Information" icon={Wrench}>
        <dl className="space-y-2">
          <InfoRow label="Service Frequency" value={customer.service_frequency} />
          <InfoRow label="Last Service" value={formatDate(customer.last_service)} />
          <InfoRow label="Next Due" value={formatDate(customer.next_due)} />
          <InfoRow label="Primary Technician" value={customer.primary_technician_name} />
          <InfoRow label="Primary Tech Phone" value={customer.primary_technician_phone} />
          <InfoRow label="Primary Tech Email" value={customer.primary_technician_email} />
          {customer.secondary_technician_name && (
            <>
              <InfoRow label="Secondary Technician" value={customer.secondary_technician_name} />
              <InfoRow label="Secondary Tech Phone" value={customer.secondary_technician_phone} />
              <InfoRow label="Secondary Tech Email" value={customer.secondary_technician_email} />
            </>
          )}
        </dl>
      </InfoSection>

      {/* Account Management */}
      <InfoSection title="Account Management" icon={User}>
        <dl className="space-y-2">
          <InfoRow label="Account Manager" value={customer.account_manager_name} />
          <InfoRow label="Account Manager Phone" value={customer.account_manager_phone} />
          <InfoRow label="Account Manager Email" value={customer.account_manager_email} />
          <InfoRow label="Escalation Contact" value={customer.escalation_contact} />
          <InfoRow label="Escalation Phone" value={customer.escalation_phone} />
        </dl>
      </InfoSection>

      {/* Project Files */}
      {(customer.drive_folder_id || customer.drive_folder_url) && (
        <InfoSection title="Project Files" icon={FileText}>
          <dl className="space-y-2">
            <InfoRow label="Drive Folder ID" value={customer.drive_folder_id} />
            {customer.drive_folder_url && (
              <div className="grid grid-cols-3 gap-4 py-2">
                <dt className="font-medium text-gray-700">Drive Folder:</dt>
                <dd className="col-span-2">
                  <a 
                    href={customer.drive_folder_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                  >
                    Open Project Folder <ExternalLink className="w-3 h-3" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </InfoSection>
      )}

      {/* Special Instructions */}
      {customer.special_instructions && (
        <InfoSection title="Special Instructions" icon={AlertTriangle}>
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <p className="text-gray-900 whitespace-pre-wrap">{customer.special_instructions}</p>
          </div>
        </InfoSection>
      )}

      {/* Metadata */}
      <InfoSection title="Record Information" icon={Calendar}>
        <dl className="space-y-2">
          <InfoRow label="Created" value={formatDate(customer.created_at)} />
          <InfoRow label="Last Updated" value={formatDate(customer.updated_at)} />
        </dl>
      </InfoSection>
    </div>
  );
};
