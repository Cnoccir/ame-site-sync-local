import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ServiceTierBadge } from '@/components/ui/service-tier-badge';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit2, 
  Check, 
  X, 
  Users, 
  Building, 
  Calendar,
  MessageSquare,
  Hash,
  Server
} from 'lucide-react';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';

interface EnhancedSiteIntelligenceCardProps {
  customer: Customer;
  onUpdate: (updates: Partial<Customer>) => void;
  isReadOnly?: boolean;
}

export const EnhancedSiteIntelligenceCard = ({ 
  customer, 
  onUpdate, 
  isReadOnly = false 
}: EnhancedSiteIntelligenceCardProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    identity: true,
    team: true
  });
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [tempValues, setTempValues] = useState<Record<string, string>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const startEditing = (field: string, currentValue: string = '') => {
    if (isReadOnly) return;
    setEditingFields(prev => ({ ...prev, [field]: true }));
    setTempValues(prev => ({ ...prev, [field]: currentValue }));
  };

  const cancelEditing = (field: string) => {
    setEditingFields(prev => ({ ...prev, [field]: false }));
    setTempValues(prev => {
      const { [field]: removed, ...rest } = prev;
      return rest;
    });
  };

  const saveField = (field: string) => {
    const value = tempValues[field];
    onUpdate({ [field]: value });
    setEditingFields(prev => ({ ...prev, [field]: false }));
    setTempValues(prev => {
      const { [field]: removed, ...rest } = prev;
      return rest;
    });
  };

  const getSystemPlatformColor = (platform?: string) => {
    if (!platform) return 'bg-gray-100 text-gray-800';
    const platformLower = platform.toLowerCase();
    
    if (platformLower.includes('n4') || platformLower.includes('niagara')) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    } else if (platformLower.includes('fx') || platformLower.includes('johnson')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (platformLower.includes('honeywell') || platformLower.includes('ebi')) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    } else if (platformLower.includes('mixed') || platformLower.includes('alc')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatLastVisitDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const renderEditableField = (
    field: string,
    currentValue: string = '',
    placeholder: string = '',
    multiline: boolean = false
  ) => {
    const isEditing = editingFields[field];
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          {multiline ? (
            <Textarea
              value={tempValues[field] || ''}
              onChange={(e) => setTempValues(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={placeholder}
              className="flex-1 min-h-[80px]"
              rows={3}
            />
          ) : (
            <Input
              value={tempValues[field] || ''}
              onChange={(e) => setTempValues(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={placeholder}
              className="flex-1"
            />
          )}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveField(field)}
              className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => cancelEditing(field)}
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 group">
        <span className={cn(
          "flex-1",
          !currentValue && "text-muted-foreground italic"
        )}>
          {currentValue || placeholder}
        </span>
        {!isReadOnly && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => startEditing(field, currentValue)}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Building className="w-5 h-5 text-blue-600" />
          Site Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Site Identity Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Hash className="w-4 h-4 text-blue-600" />
              Site Details
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('identity')}
              className="h-8 w-8 p-0"
            >
              {expandedSections.identity ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {expandedSections.identity && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Column */}
              <div className="space-y-4">
                {/* Site Nickname */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Site Name
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'site_nickname',
                      customer.site_nickname || '',
                      'Add a site name...'
                    )}
                  </div>
                </div>

                {/* System Platform */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    System Type
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "border",
                        getSystemPlatformColor(customer.system_platform)
                      )}
                    >
                      <Server className="w-3 h-3 mr-1" />
                      {customer.system_platform || 'Unknown'}
                    </Badge>
                  </div>
                </div>

                {/* Service Tier */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Service Level
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <ServiceTierBadge tier={customer.service_tier} />
                  </div>
                </div>
              </div>

              {/* Second Column */}
              <div className="space-y-4">
                {/* Site Number (Read-only) */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Site ID
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="font-mono">
                      {customer.site_number || 'Not Assigned'}
                    </Badge>
                  </div>
                </div>

                {/* Last Job Numbers - Condensed */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Recent Jobs
                  </label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {customer.last_job_numbers && customer.last_job_numbers.length > 0 ? (
                      customer.last_job_numbers.slice(0, 3).map((jobNumber, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80 font-mono text-xs px-2 py-1"
                        >
                          {jobNumber}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted-foreground italic text-sm">
                        None
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Team Assignment Section */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-green-600" />
              Team Info
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('team')}
              className="h-8 w-8 p-0"
            >
              {expandedSections.team ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {expandedSections.team && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Column */}
              <div className="space-y-4">
                {/* Primary Technician */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Primary Tech
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {customer.primary_technician_name || 'Not Assigned'}
                    </Badge>
                  </div>
                </div>

                {/* Secondary Technician */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Backup Tech
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      {customer.secondary_technician_name || 'Not Assigned'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Second Column */}
              <div className="space-y-4">
                {/* Last Visit Information */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Last Visit
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {customer.last_visit_by ? (
                        <>
                          <span className="font-medium">{customer.last_visit_by}</span>
                          {customer.last_visit_date && (
                            <span className="text-muted-foreground ml-2">
                              {formatLastVisitDate(customer.last_visit_date)}
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground italic">None recorded</span>
                      )}
                    </span>
                  </div>
                </div>

                {/* Handoff Notes - Full Width */}
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    Handoff Notes
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'handoff_notes',
                      customer.handoff_notes || '',
                      'Add notes from previous technician...',
                      true
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
