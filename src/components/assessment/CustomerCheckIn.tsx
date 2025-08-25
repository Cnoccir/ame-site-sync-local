import React from 'react';
import { User, Phone, Mail } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RequiredField } from '@/components/ui/required-field';

interface CustomerCheckInProps {
  value: {
    contactPerson: string;
    contactNumber: string;
    contactEmail: string;
    communicationPreference: string;
    onSiteContactVerified: boolean;
    specialRequests: string;
  };
  onChange: (value: any) => void;
  showRequired?: boolean;
}

export const CustomerCheckIn = ({ value, onChange, showRequired = false }: CustomerCheckInProps) => {
  const updateField = (field: string, newValue: string | boolean) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <User className="w-5 h-5 text-primary" />
        <h4 className="font-medium">Customer Check-In</h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <RequiredField required showRequired={showRequired && !value.contactPerson.trim()}>
          <div className="space-y-2">
            <Label htmlFor="contact-person">Contact Person *</Label>
            <Input
              id="contact-person"
              placeholder="John Smith"
              value={value.contactPerson}
              onChange={(e) => updateField('contactPerson', e.target.value)}
            />
          </div>
        </RequiredField>

        <RequiredField required showRequired={showRequired && !value.contactNumber.trim()}>
          <div className="space-y-2">
            <Label htmlFor="contact-number">Contact Number *</Label>
            <Input
              id="contact-number"
              placeholder="(555) 123-4567"
              value={value.contactNumber}
              onChange={(e) => updateField('contactNumber', e.target.value)}
            />
          </div>
        </RequiredField>

        <div className="space-y-2">
          <Label htmlFor="contact-email">Email Address</Label>
          <Input
            id="contact-email"
            type="email"
            placeholder="john.smith@company.com"
            value={value.contactEmail}
            onChange={(e) => updateField('contactEmail', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="communication-preference">Preferred Communication</Label>
          <Select value={value.communicationPreference} onValueChange={(val) => updateField('communicationPreference', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select preference" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Phone Call</SelectItem>
              <SelectItem value="text">Text Message</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-start space-x-3">
        <Checkbox
          id="on-site-verified"
          checked={value.onSiteContactVerified}
          onCheckedChange={(checked) => updateField('onSiteContactVerified', !!checked)}
          className="mt-1"
        />
        <Label 
          htmlFor="on-site-verified"
          className="text-sm leading-relaxed cursor-pointer"
        >
          On-site contact person verified and available during service
        </Label>
      </div>

      <div className="space-y-2">
        <Label htmlFor="special-requests">Special Requests or Instructions</Label>
        <Textarea
          id="special-requests"
          placeholder="Any special requests, access requirements, or customer concerns..."
          value={value.specialRequests}
          onChange={(e) => updateField('specialRequests', e.target.value)}
          rows={3}
        />
      </div>

      {(value.contactPerson || value.contactNumber) && (
        <div className="p-3 bg-muted rounded-lg">
          <h5 className="font-medium text-sm mb-2">Summary</h5>
          <div className="text-sm text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{value.contactPerson || 'Not specified'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>{value.contactNumber || 'Not specified'}</span>
            </div>
            {value.contactEmail && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>{value.contactEmail}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};