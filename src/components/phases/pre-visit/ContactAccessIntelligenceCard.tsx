import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit2, 
  Check, 
  X,
  Phone,
  Mail,
  Clock,
  AlertTriangle,
  MapPin,
  User,
  Shield,
  CheckCircle
} from 'lucide-react';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';

interface ContactAccessIntelligenceCardProps {
  customer: Customer;
  onUpdate: (updates: Partial<Customer>) => void;
  currentTime?: Date;
  isReadOnly?: boolean;
}

export const ContactAccessIntelligenceCard = ({ 
  customer, 
  onUpdate, 
  currentTime = new Date(),
  isReadOnly = false 
}: ContactAccessIntelligenceCardProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    contact: true,
    access: true
  });
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [tempValues, setTempValues] = useState<Record<string, any>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const startEditing = (field: string, currentValue: any = '') => {
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

  const saveArrayField = (field: string) => {
    const value = tempValues[field];
    // Convert comma-separated string to array
    const arrayValue = typeof value === 'string' 
      ? value.split(',').map(item => item.trim()).filter(item => item.length > 0)
      : value;
    onUpdate({ [field]: arrayValue });
    setEditingFields(prev => ({ ...prev, [field]: false }));
    setTempValues(prev => {
      const { [field]: removed, ...rest } = prev;
      return rest;
    });
  };

  const checkAvailability = (availableHours?: string): 'available' | 'unavailable' | 'unknown' => {
    if (!availableHours) return 'unknown';
    
    const currentHour = currentTime.getHours();
    const currentDay = currentTime.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Simple availability check - you could make this more sophisticated
    if (availableHours.toLowerCase().includes('24/7') || availableHours.toLowerCase().includes('24 hours')) {
      return 'available';
    }
    
    // Basic business hours check
    if (currentDay >= 1 && currentDay <= 5 && currentHour >= 8 && currentHour < 17) {
      return 'available';
    }
    
    return 'unavailable';
  };

  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderEditableField = (
    field: string,
    currentValue: any = '',
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

  const renderArrayField = (
    field: string,
    currentValue: string[] = [],
    placeholder: string = ''
  ) => {
    const isEditing = editingFields[field];
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={tempValues[field] || ''}
            onChange={(e) => setTempValues(prev => ({ ...prev, [field]: e.target.value }))}
            placeholder={placeholder}
            className="flex-1"
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveArrayField(field)}
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
      <div className="flex items-start gap-2 group">
        <div className="flex-1">
          {currentValue && currentValue.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {currentValue.map((item, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-1"
                >
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground italic">{placeholder}</span>
          )}
        </div>
        {!isReadOnly && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => startEditing(field, currentValue?.join(', ') || '')}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const availability = checkAvailability(customer.poc_available_hours);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Contact & Access Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Primary Contact Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <User className="w-4 h-4 text-green-600" />
              Primary Contact
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('contact')}
              className="h-8 w-8 p-0"
            >
              {expandedSections.contact ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {expandedSections.contact && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Column */}
              <div className="space-y-4">
                {/* Primary Contact */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Contact Name
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'primary_contact',
                      customer.primary_contact || '',
                      'Primary contact name...'
                    )}
                  </div>
                </div>

                {/* Contact Role */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Role
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'primary_contact_role',
                      customer.primary_contact_role || '',
                      'Contact role...'
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {renderEditableField(
                      'contact_phone',
                      customer.contact_phone || '',
                      'Contact phone...'
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Email
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {renderEditableField(
                      'contact_email',
                      customer.contact_email || '',
                      'Contact email...'
                    )}
                  </div>
                </div>
              </div>

              {/* Second Column */}
              <div className="space-y-4">
                {/* Point of Contact */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Site POC
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'poc_name',
                      customer.poc_name || '',
                      'Site point of contact...'
                    )}
                  </div>
                </div>

                {/* POC Phone */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    POC Phone
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    {renderEditableField(
                      'poc_phone',
                      customer.poc_phone || '',
                      'POC phone...'
                    )}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Available Hours
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div className="flex-1">
                      {renderEditableField(
                        'poc_available_hours',
                        customer.poc_available_hours || '',
                        'Available hours...'
                      )}
                    </div>
                    <Badge
                      variant="outline"
                      className={cn("ml-2", getAvailabilityColor(availability))}
                    >
                      {availability === 'available' && <CheckCircle className="w-3 h-3 mr-1" />}
                      {availability === 'unavailable' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {availability === 'available' ? 'Available' : 
                       availability === 'unavailable' ? 'Unavailable' : 'Unknown'}
                    </Badge>
                  </div>
                </div>

                {/* Backup Contact */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Backup Contact
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'backup_contact',
                      customer.backup_contact || '',
                      'Backup contact info...'
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Access Intelligence Section */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <MapPin className="w-4 h-4 text-orange-600" />
              Access Intelligence
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('access')}
              className="h-8 w-8 p-0"
            >
              {expandedSections.access ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {expandedSections.access && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Column */}
              <div className="space-y-4">
                {/* Best Arrival Times */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Best Arrival Times
                  </label>
                  <div className="mt-1">
                    {renderArrayField(
                      'best_arrival_times',
                      customer.best_arrival_times || [],
                      'Enter times separated by commas...'
                    )}
                  </div>
                </div>

                {/* Access Procedure */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Access Procedure
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'access_procedure',
                      customer.access_procedure || '',
                      'Access procedure...',
                      true
                    )}
                  </div>
                </div>

                {/* Parking Instructions */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Parking Instructions
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'parking_instructions',
                      customer.parking_instructions || '',
                      'Parking instructions...',
                      true
                    )}
                  </div>
                </div>
              </div>

              {/* Second Column */}
              <div className="space-y-4">
                {/* Common Access Issues */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Common Issues
                  </label>
                  <div className="mt-1">
                    {renderArrayField(
                      'common_access_issues',
                      customer.common_access_issues || [],
                      'Enter issues separated by commas...'
                    )}
                  </div>
                </div>

                {/* Successful Access Approach */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Successful Approach
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'access_approach',
                      customer.access_approach || '',
                      'What works for accessing this site...',
                      true
                    )}
                  </div>
                </div>

                {/* Scheduling Notes */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Scheduling Notes
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'scheduling_notes',
                      customer.scheduling_notes || '',
                      'Scheduling coordination notes...',
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
