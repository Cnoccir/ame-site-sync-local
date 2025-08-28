import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Phone, Mail, MapPin, Building, Shield, Calendar, Users, Hash, Settings, Edit } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Customer, SiteContext } from '@/types';
import { cn } from '@/lib/utils';
import { SiteIntelligenceService } from '@/services/siteIntelligenceService';

interface CustomerInfoCardProps {
  customer: Customer;
  onEditSiteIntelligence?: () => void;
}

export const CustomerInfoCard = ({ customer, onEditSiteIntelligence }: CustomerInfoCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [siteContext, setSiteContext] = useState<SiteContext | null>(null);
  const [loading, setLoading] = useState(false);

  // Load site intelligence context when expanded
  useEffect(() => {
    if (isExpanded && !siteContext && customer.id) {
      setLoading(true);
      SiteIntelligenceService.getSiteContext(customer.id)
        .then(setSiteContext)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [isExpanded, customer.id, siteContext]);

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
                <h2 className="font-semibold text-foreground">
                  {customer.site_nickname || customer.company_name}
                </h2>
                <div className="space-y-0.5">
                  {customer.site_nickname && (
                    <p className="text-xs text-muted-foreground">{customer.company_name}</p>
                  )}
                  <p className="text-sm text-muted-foreground">{customer.site_name}</p>
                  {customer.site_number && (
                    <p className="text-xs font-mono text-primary">{customer.site_number}</p>
                  )}
                </div>
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
            {/* Site Intelligence System */}
            <div className="mb-6 p-4 bg-primary/5 border border-primary/10 rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <Hash className="w-4 h-4 text-primary" />
                  <h3 className="font-medium text-foreground">Site Intelligence</h3>
                </div>
                {onEditSiteIntelligence && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditSiteIntelligence();
                    }}
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Site Nickname</div>
                  <div className="text-sm font-medium text-primary">
                    {customer.site_nickname || 'Not set'}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Site Number</div>
                  <div className="text-sm font-mono text-foreground">
                    {customer.site_number || 'Generating...'}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Platform</div>
                  <div className="text-sm">
                    {customer.system_platform ? (
                      <Badge variant="secondary" className="text-xs">
                        {customer.system_platform}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </div>
                </div>
                
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Primary Tech</div>
                  <div className="text-sm">
                    {customer.primary_technician_name ? (
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{customer.primary_technician_name}</span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                </div>
              </div>
              
              {loading && (
                <div className="mt-3 text-xs text-muted-foreground">
                  Loading site context...
                </div>
              )}
              
              {siteContext && (
                <div className="mt-3 pt-3 border-t border-primary/10">
                  <div className="grid grid-cols-2 gap-4">
                    {siteContext.secondaryTech && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Secondary Tech</div>
                        <div className="text-sm flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{siteContext.secondaryTech}</span>
                        </div>
                      </div>
                    )}
                    
                    {siteContext.lastVisit && (
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Last Visit</div>
                        <div className="text-sm">
                          <div>{siteContext.lastVisit.technicianName}</div>
                          <div className="text-xs text-muted-foreground">
                            {siteContext.lastVisit.date.toLocaleDateString()} (Phase {siteContext.lastVisit.phase})
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {siteContext.jobNumberHistory.length > 0 && (
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground mb-1">Recent Job Numbers</div>
                      <div className="flex flex-wrap gap-1">
                        {siteContext.jobNumberHistory.slice(-3).map((jobNumber, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {jobNumber}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
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