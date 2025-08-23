import { useState } from 'react';
import { Shield, AlertTriangle } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SafetyChecklistProps {
  value: {
    ppeAvailable: boolean;
    hazardsReviewed: boolean;
    emergencyProcedures: boolean;
    notes: string;
  };
  onChange: (value: any) => void;
}

export const SafetyChecklist = ({ value, onChange }: SafetyChecklistProps) => {
  const safetyItems = [
    {
      id: 'ppeAvailable',
      label: 'Required PPE identified and available',
      checked: value.ppeAvailable
    },
    {
      id: 'hazardsReviewed',
      label: 'Site hazards reviewed and understood',
      checked: value.hazardsReviewed
    },
    {
      id: 'emergencyProcedures',
      label: 'Emergency procedures and exits identified',
      checked: value.emergencyProcedures
    }
  ];

  const allChecked = safetyItems.every(item => item.checked);

  const handleCheckboxChange = (id: string, checked: boolean) => {
    onChange({
      ...value,
      [id]: checked
    });
  };

  const handleNotesChange = (notes: string) => {
    onChange({
      ...value,
      notes
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Shield className="w-5 h-5 text-primary" />
        <h4 className="font-medium">Safety Assessment</h4>
      </div>

      {!allChecked && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            All safety requirements must be confirmed before proceeding.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {safetyItems.map((item) => (
          <div key={item.id} className="flex items-start space-x-3">
            <Checkbox
              id={item.id}
              checked={item.checked}
              onCheckedChange={(checked) => handleCheckboxChange(item.id, !!checked)}
              className="mt-1"
            />
            <Label 
              htmlFor={item.id}
              className="text-sm leading-relaxed cursor-pointer"
            >
              {item.label}
            </Label>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="safety-notes">Safety Notes</Label>
        <Textarea
          id="safety-notes"
          placeholder="Additional safety observations or concerns..."
          value={value.notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
};