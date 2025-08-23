import { useState } from 'react';
import { CheckCircle, MapPin, AlertCircle, User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface AssessmentPhaseProps {
  onPhaseComplete: () => void;
}

export const AssessmentPhase = ({ onPhaseComplete }: AssessmentPhaseProps) => {
  const [walkthroughItems, setWalkthroughItems] = useState({
    siteEntry: false,
    equipmentLocation: false,
    accessPoints: false,
    emergencyProcedures: false,
    workArea: false
  });

  const [customerPriorities, setCustomerPriorities] = useState({
    comfort: '',
    equipment: '',
    energy: '',
    operational: ''
  });

  const [equipmentStatus, setEquipmentStatus] = useState({
    systemOperational: false,
    noAlarms: false,
    accessGranted: false,
    documentationAvailable: false
  });

  const { toast } = useToast();

  const allWalkthroughComplete = Object.values(walkthroughItems).every(Boolean);
  const allStatusChecked = Object.values(equipmentStatus).every(Boolean);
  const hasCustomerInput = Object.values(customerPriorities).some(value => value.trim().length > 0);
  const canComplete = allWalkthroughComplete && allStatusChecked && hasCustomerInput;

  const handleWalkthroughChange = (item: keyof typeof walkthroughItems, checked: boolean) => {
    setWalkthroughItems(prev => ({ ...prev, [item]: checked }));
  };

  const handleStatusChange = (item: keyof typeof equipmentStatus, checked: boolean) => {
    setEquipmentStatus(prev => ({ ...prev, [item]: checked }));
  };

  const handlePriorityChange = (type: keyof typeof customerPriorities, value: string) => {
    setCustomerPriorities(prev => ({ ...prev, [type]: value }));
  };

  const handleCompletePhase = () => {
    if (!canComplete) {
      toast({
        title: 'Assessment Incomplete',
        description: 'Please complete all assessment requirements before proceeding.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Phase 2 Complete',
      description: 'Initial assessment completed successfully.',
      variant: 'default'
    });
    onPhaseComplete();
  };

  const walkthroughChecklist = [
    { key: 'siteEntry' as const, label: 'Site entry and check-in completed', icon: MapPin },
    { key: 'equipmentLocation' as const, label: 'Equipment room location confirmed', icon: MapPin },
    { key: 'accessPoints' as const, label: 'All access points identified', icon: MapPin },
    { key: 'emergencyProcedures' as const, label: 'Emergency procedures reviewed with contact', icon: AlertCircle },
    { key: 'workArea' as const, label: 'Work area prepared and secured', icon: MapPin }
  ];

  const statusChecklist = [
    { key: 'systemOperational' as const, label: 'Building automation system operational' },
    { key: 'noAlarms' as const, label: 'No active critical alarms present' },
    { key: 'accessGranted' as const, label: 'System access credentials verified' },
    { key: 'documentationAvailable' as const, label: 'System documentation accessible' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Phase 2: Initial Assessment</h2>
          <p className="text-muted-foreground">Evaluate site conditions and gather customer priorities</p>
        </div>
        <Badge variant={canComplete ? 'default' : 'secondary'} className="px-3 py-1">
          Assessment {canComplete ? 'Complete' : 'In Progress'}
        </Badge>
      </div>

      {/* Site Walkthrough */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-primary" />
            <span>Site Walkthrough Checklist</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {walkthroughChecklist.map((item) => (
              <div key={item.key} className="flex items-center space-x-3 p-2 rounded">
                <Checkbox
                  id={item.key}
                  checked={walkthroughItems[item.key]}
                  onCheckedChange={(checked) => handleWalkthroughChange(item.key, checked as boolean)}
                />
                <div className="flex items-center space-x-2 flex-1">
                  <item.icon className="w-4 h-4 text-muted-foreground" />
                  <label htmlFor={item.key} className="text-sm font-medium cursor-pointer">
                    {item.label}
                  </label>
                  {walkthroughItems[item.key] && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Priorities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <User className="w-5 h-5 text-primary" />
            <span>Customer Priorities Assessment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Comfort Issues</label>
              <Textarea
                placeholder="Temperature complaints, air quality concerns, noise issues..."
                value={customerPriorities.comfort}
                onChange={(e) => handlePriorityChange('comfort', e.target.value)}
                className="min-h-20"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Equipment Problems</label>
              <Textarea
                placeholder="Equipment failures, performance issues, maintenance concerns..."
                value={customerPriorities.equipment}
                onChange={(e) => handlePriorityChange('equipment', e.target.value)}
                className="min-h-20"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Energy Concerns</label>
              <Textarea
                placeholder="High utility bills, efficiency improvements, scheduling issues..."
                value={customerPriorities.energy}
                onChange={(e) => handlePriorityChange('energy', e.target.value)}
                className="min-h-20"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Operational Requests</label>
              <Textarea
                placeholder="System modifications, new features, training needs..."
                value={customerPriorities.operational}
                onChange={(e) => handlePriorityChange('operational', e.target.value)}
                className="min-h-20"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Status Check */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Equipment Status Verification</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {statusChecklist.map((item) => (
              <div key={item.key} className="flex items-center space-x-3 p-2 rounded">
                <Checkbox
                  id={item.key}
                  checked={equipmentStatus[item.key]}
                  onCheckedChange={(checked) => handleStatusChange(item.key, checked as boolean)}
                />
                <div className="flex items-center space-x-2 flex-1">
                  <label htmlFor={item.key} className="text-sm font-medium cursor-pointer">
                    {item.label}
                  </label>
                  {equipmentStatus[item.key] && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Complete Phase Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleCompletePhase}
          disabled={!canComplete}
          size="lg"
          className="px-8"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Complete Phase 2
        </Button>
      </div>
    </div>
  );
};