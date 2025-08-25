import React from 'react';
import { MapPin, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RequiredField } from '@/components/ui/required-field';

interface PhysicalSystemWalkProps {
  value: {
    supervisorLocation: string;
    supervisorAccess: string;
    jaceLocations: string;
    jaceAccess: string;
    controllerDetails: string;
    controllerChallenges: string;
    buildingAccessType: string;
    buildingAccessDetails: string;
    panelsAccessible: boolean;
    wiringCondition: boolean;
    environmentalOk: boolean;
    issuesFound: string;
  };
  onChange: (value: any) => void;
  showRequired?: boolean;
}

export const PhysicalSystemWalk = ({ value, onChange, showRequired = false }: PhysicalSystemWalkProps) => {
  const updateField = (field: string, newValue: string | boolean) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const systemChecks = [
    {
      id: 'panelsAccessible',
      label: 'Control panels are accessible and properly labeled',
      checked: value.panelsAccessible
    },
    {
      id: 'wiringCondition',
      label: 'Wiring and connections are in good condition',
      checked: value.wiringCondition
    },
    {
      id: 'environmentalOk',
      label: 'Environmental conditions are within acceptable ranges',
      checked: value.environmentalOk
    }
  ];

  const allChecked = systemChecks.every(check => check.checked);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary" />
        <h4 className="font-medium">Physical System Walk</h4>
      </div>

      {!allChecked && showRequired && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
          <div className="flex items-center gap-2 text-warning">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">All system checks must be completed</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="supervisor-location">Supervisor Location</Label>
          <Input
            id="supervisor-location"
            placeholder="Main mechanical room, 2nd floor"
            value={value.supervisorLocation}
            onChange={(e) => updateField('supervisorLocation', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="supervisor-access">Supervisor Access Notes</Label>
          <Input
            id="supervisor-access"
            placeholder="Key required, escort needed, etc."
            value={value.supervisorAccess}
            onChange={(e) => updateField('supervisorAccess', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jace-locations">JACE/Controller Locations</Label>
          <Input
            id="jace-locations"
            placeholder="Locations of JACE controllers"
            value={value.jaceLocations}
            onChange={(e) => updateField('jaceLocations', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jace-access">JACE Access Notes</Label>
          <Input
            id="jace-access"
            placeholder="Access requirements for controllers"
            value={value.jaceAccess}
            onChange={(e) => updateField('jaceAccess', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="building-access-type">Building Access Type (Pre-filled)</Label>
          <Input
            id="building-access-type"
            placeholder="Badge, Key, Escort required"
            value={value.buildingAccessType}
            onChange={(e) => updateField('buildingAccessType', e.target.value)}
            className="bg-muted/50"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="building-access-details">Building Access Details (Pre-filled)</Label>
          <Input
            id="building-access-details"
            placeholder="Contact security, specific entry points"
            value={value.buildingAccessDetails}
            onChange={(e) => updateField('buildingAccessDetails', e.target.value)}
            className="bg-muted/50"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="controller-details">Controller Details</Label>
        <Textarea
          id="controller-details"
          placeholder="Controller types, versions, network configuration..."
          value={value.controllerDetails}
          onChange={(e) => updateField('controllerDetails', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="controller-challenges">Controller Access Challenges</Label>
        <Textarea
          id="controller-challenges"
          placeholder="Any difficulties accessing controllers, network issues, physical obstructions..."
          value={value.controllerChallenges}
          onChange={(e) => updateField('controllerChallenges', e.target.value)}
          rows={3}
        />
      </div>

      <div className="space-y-3">
        <Label className="text-base font-medium">System Checks</Label>
        {systemChecks.map((check) => (
          <RequiredField key={check.id} required showRequired={showRequired && !check.checked}>
            <div className="flex items-start space-x-3">
              <Checkbox
                id={check.id}
                checked={check.checked}
                onCheckedChange={(checked) => updateField(check.id, !!checked)}
                className="mt-1"
              />
              <Label 
                htmlFor={check.id}
                className="text-sm leading-relaxed cursor-pointer"
              >
                {check.label}
              </Label>
            </div>
          </RequiredField>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="issues-found">Issues Found</Label>
        <Textarea
          id="issues-found"
          placeholder="Document any issues, concerns, or maintenance needs discovered..."
          value={value.issuesFound}
          onChange={(e) => updateField('issuesFound', e.target.value)}
          rows={3}
        />
      </div>

      {allChecked && (
        <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">All system checks completed successfully</span>
          </div>
        </div>
      )}
    </div>
  );
};