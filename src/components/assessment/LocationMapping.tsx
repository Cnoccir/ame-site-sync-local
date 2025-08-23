import { MapPin, Server, Cpu } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface LocationMappingProps {
  value: {
    supervisorLocation: string;
    supervisorAccess: string;
    jaceLocations: string;
    jaceAccess: string;
    controllerDetails: string;
    controllerChallenges: string;
    panelsAccessible: boolean;
    wiringCondition: boolean;
    environmentalOk: boolean;
    issuesFound: string;
  };
  onChange: (value: any) => void;
}

export const LocationMapping = ({ value, onChange }: LocationMappingProps) => {
  const updateField = (field: string, newValue: string | boolean) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const inspectionItems = [
    {
      id: 'panelsAccessible',
      label: 'Control panels are accessible and clearly labeled',
      checked: value.panelsAccessible
    },
    {
      id: 'wiringCondition',
      label: 'Wiring and connections appear in good condition',
      checked: value.wiringCondition
    },
    {
      id: 'environmentalOk',
      label: 'Environmental conditions (temp, humidity) are appropriate',
      checked: value.environmentalOk
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary" />
        <h4 className="font-medium">Physical System Walkthrough</h4>
      </div>

      {/* Main Supervisor Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Server className="w-4 h-4 text-primary" />
          <h5 className="font-medium">Main Supervisor/Workstation Location</h5>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="supervisor-location">Location</Label>
            <Input
              id="supervisor-location"
              placeholder="e.g., Building A, Room 101, Main IT Room"
              value={value.supervisorLocation}
              onChange={(e) => updateField('supervisorLocation', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="supervisor-access">Access Restrictions</Label>
            <Textarea
              id="supervisor-access"
              placeholder="Key card requirements, security procedures, contact info..."
              value={value.supervisorAccess}
              onChange={(e) => updateField('supervisorAccess', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* JACE Controllers Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-primary" />
          <h5 className="font-medium">JACE and Main Supervisory Controllers</h5>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="jace-locations">Controller Locations</Label>
            <Textarea
              id="jace-locations"
              placeholder="List locations of JACE controllers, main supervisory units..."
              value={value.jaceLocations}
              onChange={(e) => updateField('jaceLocations', e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="jace-access">Panel Access Notes</Label>
            <Textarea
              id="jace-access"
              placeholder="Access procedures, panel conditions, special requirements..."
              value={value.jaceAccess}
              onChange={(e) => updateField('jaceAccess', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Critical Controllers Section */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Cpu className="w-4 h-4 text-primary" />
          <h5 className="font-medium">Critical System Controllers</h5>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="controller-details">Controller Details</Label>
            <Textarea
              id="controller-details"
              placeholder="AHU controllers, boiler controls, chiller controllers, etc..."
              value={value.controllerDetails}
              onChange={(e) => updateField('controllerDetails', e.target.value)}
              rows={3}
            />
          </div>
          <div>
            <Label htmlFor="controller-challenges">Access Challenges</Label>
            <Textarea
              id="controller-challenges"
              placeholder="Difficult access, height restrictions, coordination needed..."
              value={value.controllerChallenges}
              onChange={(e) => updateField('controllerChallenges', e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </Card>

      {/* Physical Inspection Checklist */}
      <Card className="p-4">
        <h5 className="font-medium mb-3">Physical Inspection Checklist</h5>
        <div className="space-y-3">
          {inspectionItems.map((item) => (
            <div key={item.id} className="flex items-start space-x-3">
              <Checkbox
                id={item.id}
                checked={item.checked}
                onCheckedChange={(checked) => updateField(item.id, !!checked)}
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
        
        <div className="mt-4">
          <Label htmlFor="issues-found">Issues Found</Label>
          <Textarea
            id="issues-found"
            placeholder="Document any issues, concerns, or observations..."
            value={value.issuesFound}
            onChange={(e) => updateField('issuesFound', e.target.value)}
            rows={3}
          />
        </div>
      </Card>
    </div>
  );
};