import React from 'react';
import { 
  Building2, MapPin, Phone, Mail, Shield, Server, FolderOpen, 
  Calendar, Clock, User, Users, AlertCircle, CheckCircle, ExternalLink,
  Edit3, Eye, Settings, FileText, Archive, Camera, Wrench, BarChart3, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';

interface EnhancedCustomerDisplayCardProps {
  customer: Customer;
  onEdit: () => void;
  onViewDetails: () => void;
  onDelete?: () => void;
  isExpanded?: boolean;
  onExpandToggle?: () => void;
}

export const EnhancedCustomerDisplayCard: React.FC<EnhancedCustomerDisplayCardProps> = ({
  customer,
  onEdit,
  onViewDetails,
  onDelete,
  isExpanded = false,
  onExpandToggle
}) => {
  const getServiceTierBadge = (tier: Customer['service_tier']) => {
    const variants = {
      CORE: 'bg-blue-100 text-blue-800 border-blue-300',
      ASSURE: 'bg-green-100 text-green-800 border-green-300',
      GUARDIAN: 'bg-purple-100 text-purple-800 border-purple-300'
    };
    
    return (
      <Badge variant="outline" className={cn('font-medium', variants[tier])}>
        {tier}
      </Badge>
    );
  };

  const getStatusBadge = (status: Customer['contract_status']) => {
    const variants = {
      Active: 'bg-green-100 text-green-800 border-green-300',
      Inactive: 'bg-gray-100 text-gray-600 border-gray-300',
      Pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      Expired: 'bg-red-100 text-red-800 border-red-300'
    };
    
    return (
      <Badge variant="outline" className={cn('font-medium', variants[status])}>
        {status}
      </Badge>
    );
  };

  const formatNextDue = (date?: string) => {
    if (!date) return { text: 'Not scheduled', variant: 'default' };
    
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `Overdue (${Math.abs(diffDays)} days)`, variant: 'destructive' };
    } else if (diffDays === 0) {
      return { text: 'Due Today', variant: 'warning' };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, variant: 'warning' };
    } else if (diffDays <= 30) {
      return { text: dueDate.toLocaleDateString(), variant: 'default' };
    } else {
      return { text: dueDate.toLocaleDateString(), variant: 'muted' };
    }
  };

  const nextDue = formatNextDue(customer.next_due);

  const InfoItem = ({ 
    icon: Icon, 
    label, 
    value, 
    href, 
    className = "" 
  }: { 
    icon: React.ElementType; 
    label: string; 
    value: string; 
    href?: string;
    className?: string;
  }) => (
    <div className={cn("flex items-center gap-2 text-sm", className)}>
      <Icon className="w-4 h-4 text-gray-500 flex-shrink-0" />
      <span className="text-gray-600 min-w-0">{label}:</span>
      {href ? (
        <a 
          href={href} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-700 font-medium truncate flex items-center gap-1"
        >
          {value}
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : (
        <span className="font-medium text-gray-900 truncate">{value}</span>
      )}
    </div>
  );

  const hasProjectFolder = customer.drive_folder_id && customer.drive_folder_url;
  const hasSystemAccess = customer.workbench_username || customer.platform_username;
  const hasRemoteAccess = customer.remote_access;

  return (
    <Card className="border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg text-gray-900 truncate">
                  {customer.company_name}
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>{customer.customer_id}</span>
                  {customer.site_name && (
                    <>
                      <span>•</span>
                      <span className="truncate">{customer.site_name}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {getServiceTierBadge(customer.service_tier)}
              {getStatusBadge(customer.contract_status)}
              
              {customer.system_type && (
                <Badge variant="outline" className="bg-gray-50 text-gray-700">
                  <Server className="w-3 h-3 mr-1" />
                  {customer.system_type}
                </Badge>
              )}
              
              <Badge variant="outline" className={cn(
                nextDue.variant === 'destructive' ? 'bg-red-50 text-red-700 border-red-200' :
                nextDue.variant === 'warning' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                'bg-gray-50 text-gray-700'
              )}>
                <Clock className="w-3 h-3 mr-1" />
                {nextDue.text}
              </Badge>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <InfoItem 
                icon={User} 
                label="Contact" 
                value={customer.primary_contact || 'N/A'} 
              />
              <InfoItem 
                icon={Phone} 
                label="Phone" 
                value={customer.contact_phone || 'N/A'} 
              />
              <InfoItem 
                icon={Mail} 
                label="Email" 
                value={customer.contact_email || 'N/A'} 
              />
              <InfoItem 
                icon={MapPin} 
                label="Location" 
                value={customer.site_address ? 
                  customer.site_address.split('\n')[0].substring(0, 30) + '...' : 
                  'N/A'
                } 
              />
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 ml-4">
            {/* Status Indicators */}
            <div className="flex flex-col gap-1">
              {hasProjectFolder && (
                <div className="flex items-center gap-1 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Drive Folder</span>
                </div>
              )}
              {hasSystemAccess && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>System Access</span>
                </div>
              )}
              {hasRemoteAccess && (
                <div className="flex items-center gap-1 text-xs text-purple-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Remote Access</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {hasProjectFolder && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  asChild
                  className="h-8 w-8 p-0"
                  title="Open Project Folder"
                >
                  <a 
                    href={customer.drive_folder_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </a>
                </Button>
              )}
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onViewDetails}
                className="h-8 w-8 p-0"
                title="View Details"
              >
                <Eye className="w-4 h-4" />
              </Button>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
                title="Edit Customer"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              
              {onDelete && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onDelete}
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                  title="Delete Customer"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Separator className="mb-4" />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Contacts
              </h4>
              <div className="space-y-2 text-sm">
                <div>
                  <div className="text-gray-600">Primary Contact</div>
                  <div className="font-medium">{customer.primary_contact || 'N/A'}</div>
                  <div className="text-gray-500">{customer.contact_phone || 'N/A'}</div>
                  <div className="text-gray-500">{customer.contact_email || 'N/A'}</div>
                </div>
                
                {customer.emergency_contact && (
                  <div>
                    <div className="text-gray-600">Emergency Contact</div>
                    <div className="font-medium">{customer.emergency_contact}</div>
                    <div className="text-gray-500">{customer.emergency_phone || 'N/A'}</div>
                  </div>
                )}
                
                {(customer as any).account_manager_name && (
                  <div>
                    <div className="text-gray-600">Account Manager</div>
                    <div className="font-medium">{(customer as any).account_manager_name}</div>
                    <div className="text-gray-500">{(customer as any).account_manager_phone || 'N/A'}</div>
                  </div>
                )}
              </div>
            </div>

            {/* System Information */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <Server className="w-4 h-4" />
                System Access
              </h4>
              <div className="space-y-2 text-sm">
                {(customer as any).primary_bas_platform && (
                  <InfoItem 
                    icon={Settings} 
                    label="BAS Platform" 
                    value={(customer as any).primary_bas_platform} 
                  />
                )}
                {customer.bms_supervisor_ip && (
                  <InfoItem 
                    icon={Server} 
                    label="Supervisor IP" 
                    value={String(customer.bms_supervisor_ip)} 
                  />
                )}
                {customer.web_supervisor_url && (
                  <InfoItem 
                    icon={ExternalLink} 
                    label="Web Supervisor" 
                    value="Access Portal"
                    href={customer.web_supervisor_url} 
                  />
                )}
                
                <div className="pt-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-gray-500" />
                    <span className="text-gray-600 text-xs">Access Available:</span>
                  </div>
                  <div className="ml-5 space-y-1">
                    {customer.workbench_username && (
                      <div className="text-xs text-green-600">✓ Workbench Access</div>
                    )}
                    {customer.platform_username && (
                      <div className="text-xs text-green-600">✓ Platform Access</div>
                    )}
                    {customer.remote_access && (
                      <div className="text-xs text-green-600">✓ Remote Access</div>
                    )}
                    {!hasSystemAccess && (
                      <div className="text-xs text-gray-500">No system access configured</div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Project Resources */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Project Resources
              </h4>
              <div className="space-y-2 text-sm">
                {hasProjectFolder ? (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                      <CheckCircle className="w-4 h-4" />
                      Project Folder Linked
                    </div>
                    <div className="space-y-1">
                      <InfoItem 
                        icon={FolderOpen} 
                        label="Main Folder" 
                        value="Open in Drive"
                        href={customer.drive_folder_url}
                        className="text-xs"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 text-yellow-800 font-medium">
                      <AlertCircle className="w-4 h-4" />
                      No Project Folder
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      Set up project folder to organize documents and resources
                    </div>
                  </div>
                )}

                {/* Service Schedule */}
                <div className="pt-2">
                  <InfoItem 
                    icon={Calendar} 
                    label="Service Frequency" 
                    value={customer.service_frequency || 'Not set'} 
                  />
                  {customer.last_service && (
                    <InfoItem 
                      icon={Clock} 
                      label="Last Service" 
                      value={new Date(customer.last_service).toLocaleDateString()} 
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <Separator className="my-4" />
          <div className="flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              <Eye className="w-4 h-4 mr-2" />
              View Full Details
            </Button>
            <Button onClick={onEdit} className="bg-blue-600 hover:bg-blue-700">
              <Edit3 className="w-4 h-4 mr-2" />
              Edit Customer
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
