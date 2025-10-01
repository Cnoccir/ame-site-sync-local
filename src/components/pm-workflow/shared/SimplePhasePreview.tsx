import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, ArrowRight, X } from 'lucide-react';

interface SimplePhasePreviewProps {
  phase: number;
  phaseData: any;
  onContinue: () => void;
  onDismiss: () => void;
  className?: string;
}

const getPhasePreview = (phase: number, data: any) => {
  switch (phase) {
    case 1:
      return {
        title: 'Site Intelligence Complete',
        summary: [
          `${data.customer?.companyName || 'Unknown Company'} - ${data.customer?.siteName || 'Unknown Site'}`,
          `Service Tier: ${data.customer?.serviceTier || 'Not specified'}`,
          `Primary Contact: ${data.contacts?.[0]?.name || 'Not specified'} (${data.contacts?.[0]?.phone || 'No phone'})`,
          `Access: ${data.access?.method || 'Not specified'}`,
          `PPE Required: ${data.safety?.requiredPPE?.join(', ') || 'None specified'}`,
          `Primary Technician: ${data.customer?.primaryTechnicianName || 'Not assigned'}`
        ]
      };

    case 2:
      return {
        title: 'System Discovery Complete',
        summary: [
          `BMS Platform: ${data.bmsSystem?.platform || 'Not specified'}`,
          `Supervisor: ${data.bmsSystem?.supervisorLocation || 'Not specified'}`,
          data.tridiumExports?.processed
            ? `System Data: ${data.tridiumExports?.importSummary?.totalDevices || 0} devices from automated export`
            : `Manual Inventory: ${data.manualInventory?.deviceCount || 0} devices, ${data.manualInventory?.majorEquipment?.length || 0} equipment items`,
          `Photos Captured: ${data.photos?.length || 0}`
        ]
      };

    case 3:
      return {
        title: 'Service Activities Complete',
        summary: [
          `Customer Priorities: ${data.customerPriorities?.primaryConcerns?.join(', ') || 'Not specified'}`,
          `Tasks Completed: ${data.serviceMetrics?.tasksCompleted || 0}`,
          `Issues Resolved: ${data.serviceMetrics?.issuesResolved || 0}`,
          `Time on Site: ${data.serviceMetrics?.timeOnSite || 0} minutes`,
          `System Health Score: ${data.serviceMetrics?.systemHealthScore || 0}%`
        ]
      };

    case 4:
      return {
        title: 'Documentation Complete',
        summary: [
          `Executive Summary: ${data.serviceSummary?.executiveSummary ? 'Complete' : 'Pending'}`,
          `Key Findings: ${data.serviceSummary?.keyFindings?.length || 0} items`,
          `Report Template: ${data.reportConfig?.template || 'Not selected'}`,
          `Delivery Method: ${data.deliveryInfo?.method || 'Not specified'}`
        ]
      };

    default:
      return { title: 'Phase Complete', summary: [] };
  }
};

export const SimplePhasePreview: React.FC<SimplePhasePreviewProps> = ({
  phase,
  phaseData,
  onContinue,
  onDismiss,
  className = ''
}) => {
  const preview = getPhasePreview(phase, phaseData);

  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <div className="flex items-start justify-between p-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
            <h4 className="text-sm font-medium text-green-900">{preview.title}</h4>
            <Badge className="bg-green-600 text-xs">Phase {phase}</Badge>
          </div>

          <div className="text-xs text-green-800 space-y-1">
            {preview.summary.map((item, index) => (
              <div key={index} className="truncate">• {item}</div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-1 ml-3 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
          >
            <X className="h-3 w-3" />
          </Button>
          <Button
            onClick={onContinue}
            size="sm"
            className="gap-1 text-xs h-6 px-2"
          >
            Next Phase
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Card>
  );
};