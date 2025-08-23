import { useState } from 'react';
import { CheckCircle, Clock, Shield, Wrench, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ToolManagement } from '@/components/ToolManagement';

interface PreVisitPhaseProps {
  customer: Customer;
  onPhaseComplete: () => void;
}

export const PreVisitPhase = ({ customer, onPhaseComplete }: PreVisitPhaseProps) => {
  const [reviewItems, setReviewItems] = useState({
    customerInfo: false,
    siteAccess: false,
    safetyRequirements: false,
    toolsChecklist: false,
    documentation: false
  });
  
  const [safetyAcknowledgment, setSafetyAcknowledgment] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const { toast } = useToast();

  const allItemsChecked = Object.values(reviewItems).every(Boolean) && safetyAcknowledgment;

  const handleItemChange = (item: keyof typeof reviewItems, checked: boolean) => {
    setReviewItems(prev => ({ ...prev, [item]: checked }));
  };

  const handleCompletePhase = () => {
    if (!allItemsChecked) {
      toast({
        title: 'Incomplete Preparation',
        description: 'Please complete all preparation items before proceeding.',
        variant: 'destructive'
      });
      return;
    }

    toast({
      title: 'Phase 1 Complete',
      description: 'Pre-visit preparation completed successfully.',
      variant: 'default'
    });
    onPhaseComplete();
  };

  const reviewItemsList = [
    {
      key: 'customerInfo' as const,
      label: 'Review customer information and service history',
      icon: FileText,
      description: 'Verify contact details, service tier, and previous visit notes'
    },
    {
      key: 'siteAccess' as const,
      label: 'Confirm site access requirements',
      icon: Shield,
      description: 'Check building access hours, badge requirements, and contact procedures'
    },
    {
      key: 'safetyRequirements' as const,
      label: 'Review safety requirements and site hazards',
      icon: Shield,
      description: 'Understand PPE requirements, site-specific safety protocols, and emergency procedures'
    },
    {
      key: 'toolsChecklist' as const,
      label: 'Verify required tools and equipment',
      icon: Wrench,
      description: 'Ensure all necessary tools and spare parts are available for service tier'
    },
    {
      key: 'documentation' as const,
      label: 'Prepare service documentation',
      icon: FileText,
      description: 'Review SOPs, previous reports, and prepare visit checklist'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Phase 1: Pre-Visit Preparation</h2>
          <p className="text-muted-foreground">Complete all preparation steps before arriving on-site</p>
        </div>
        <Badge variant={allItemsChecked ? 'default' : 'secondary'} className="px-3 py-1">
          {Object.values(reviewItems).filter(Boolean).length + (safetyAcknowledgment ? 1 : 0)} of {reviewItemsList.length + 1} Complete
        </Badge>
      </div>

      {/* Customer Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Service Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Service Tier:</span>
              <Badge className="ml-2">{customer.service_tier}</Badge>
            </div>
            <div>
              <span className="font-medium">System Type:</span>
              <span className="ml-2">{customer.system_type}</span>
            </div>
            <div>
              <span className="font-medium">Last Service:</span>
              <span className="ml-2">{customer.last_service}</span>
            </div>
            <div>
              <span className="font-medium">Next Due:</span>
              <span className="ml-2">{customer.next_due}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preparation Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preparation Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviewItemsList.map((item) => (
              <div key={item.key} className="flex items-start space-x-3 p-3 rounded-lg border border-card-border">
                <Checkbox
                  id={item.key}
                  checked={reviewItems[item.key]}
                  onCheckedChange={(checked) => handleItemChange(item.key, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <item.icon className="w-4 h-4 text-primary" />
                    <label htmlFor={item.key} className="font-medium text-foreground cursor-pointer">
                      {item.label}
                    </label>
                    {reviewItems[item.key] && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tool Management */}
      <ToolManagement onToolSelectionChange={setSelectedTools} />

      {/* Safety Acknowledgment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-orange-600">Safety Acknowledgment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <Checkbox
              id="safety-acknowledgment"
              checked={safetyAcknowledgment}
              onCheckedChange={(checked) => setSafetyAcknowledgment(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="safety-acknowledgment" className="font-medium text-orange-900 cursor-pointer">
                I acknowledge that I have reviewed all safety requirements and understand the site-specific hazards and procedures.
              </label>
              <p className="text-sm text-orange-700 mt-1">
                This includes PPE requirements, access procedures, emergency contacts, and any site-specific safety protocols.
              </p>
              {safetyAcknowledgment && (
                <div className="flex items-center space-x-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-700 font-medium">Safety acknowledgment confirmed</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Phase Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleCompletePhase}
          disabled={!allItemsChecked}
          size="lg"
          className="px-8"
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          Complete Phase 1
        </Button>
      </div>
    </div>
  );
};