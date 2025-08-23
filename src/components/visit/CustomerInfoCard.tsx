import { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, Mail, MapPin, Building, Shield, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';

interface CustomerInfoCardProps {
  customer: Customer;
}

export const CustomerInfoCard = ({ customer }: CustomerInfoCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getServiceTierColor = (tier: string) => {
    switch (tier?.toUpperCase()) {
      case 'CORE':
        return 'bg-red-500 text-white';
      case 'ASSURE':
        return 'bg-orange-500 text-white';
      case 'GUARDIAN':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <Card className="border-card-border shadow-sm">
      <CardContent className="p-0">
        {/* Collapsed Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Building className="w-5 h-5 text-primary" />
              <div className="text-left">
                <h2 className="font-semibold text-foreground">{customer.company_name}</h2>
                <p className="text-sm text-muted-foreground">{customer.site_name}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Phone className="w-3 h-3" />
                <span>{customer.contact_phone}</span>
              </div>
              
              <Badge className={cn('text-xs font-medium', getServiceTierColor(customer.service_tier))}>
                {customer.service_tier}
              </Badge>
              
              <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span>Last: {customer.last_service}</span>
              </div>
            </div>
          </div>
          
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </button>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="border-t border-card-border p-4 bg-muted/20">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Contact Information */}
              <div>
                <h4 className="font-medium text-foreground mb-2">Primary Contact</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{customer.primary_contact}</p>
                  <div className="flex items-center space-x-1">
                    <Phone className="w-3 h-3" />
                    <span>{customer.contact_phone}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Mail className="w-3 h-3" />
                    <span>{customer.contact_email}</span>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h4 className="font-medium text-foreground mb-2">Location</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-start space-x-1">
                    <MapPin className="w-3 h-3 mt-0.5" />
                    <span>{customer.site_address}</span>
                  </div>
                  <p>Type: {customer.building_type || 'Not specified'}</p>
                  <p>Access: {customer.access_hours || 'Standard hours'}</p>
                </div>
              </div>

              {/* System Information */}
              <div>
                <h4 className="font-medium text-foreground mb-2">System Details</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>Type: {customer.system_type}</p>
                  <p>Technician: {customer.technician_assigned || 'Unassigned'}</p>
                  <p>Contract: {customer.contract_status}</p>
                </div>
              </div>

              {/* Safety Requirements */}
              <div>
                <h4 className="font-medium text-foreground mb-2">Safety & Access</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-3 h-3" />
                    <span className={customer.ppe_required ? 'text-orange-600' : 'text-green-600'}>
                      PPE {customer.ppe_required ? 'Required' : 'Not Required'}
                    </span>
                  </div>
                  <p className={`text-sm ${customer.badge_required ? 'text-orange-600' : 'text-muted-foreground'}`}>
                    Badge {customer.badge_required ? 'Required' : 'Not Required'}
                  </p>
                  <p className={`text-sm ${customer.training_required ? 'text-orange-600' : 'text-muted-foreground'}`}>
                    Training {customer.training_required ? 'Required' : 'Not Required'}
                  </p>
                </div>
              </div>
            </div>

            {/* Service Schedule */}
            <div className="mt-4 pt-4 border-t border-card-border">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Last Service: {customer.last_service}</span>
                </div>
                <div className="flex items-center space-x-1 text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  <span>Next Due: {customer.next_due}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {customer.service_tier} TIER
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};