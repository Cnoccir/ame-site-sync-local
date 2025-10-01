import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Eye,
  Building,
  Database,
  Wrench,
  FileText
} from 'lucide-react';

interface PhaseOverviewBarProps {
  phase: number;
  phaseTitle: string;
  isComplete: boolean;
  completionPercentage: number;
  summaryText: string;
  onViewDetails: () => void;
  className?: string;
}

const getPhaseIcon = (phase: number) => {
  switch (phase) {
    case 1: return <Building className="h-4 w-4" />;
    case 2: return <Database className="h-4 w-4" />;
    case 3: return <Wrench className="h-4 w-4" />;
    case 4: return <FileText className="h-4 w-4" />;
    default: return <CheckCircle2 className="h-4 w-4" />;
  }
};

export const PhaseOverviewBar: React.FC<PhaseOverviewBarProps> = ({
  phase,
  phaseTitle,
  isComplete,
  completionPercentage,
  summaryText,
  onViewDetails,
  className = ''
}) => {
  return (
    <Card className={`border-gray-200 hover:border-blue-300 transition-colors cursor-pointer ${className}`}>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className={`p-2 rounded-lg ${
              isComplete ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
            }`}>
              {isComplete ? <CheckCircle2 className="h-4 w-4" /> : getPhaseIcon(phase)}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-sm font-medium text-gray-900">
                  Phase {phase}: {phaseTitle}
                </h4>
                {isComplete ? (
                  <Badge className="bg-green-600 text-xs">Complete</Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    {Math.round(completionPercentage)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-gray-600 truncate">
                {summaryText}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails();
            }}
            className="gap-1 text-xs ml-3 flex-shrink-0"
          >
            <Eye className="h-3 w-3" />
            {isComplete ? 'Review' : 'View'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Helper function to generate summary text for each phase
export const generatePhaseSummary = (phase: number, phaseData: any): string => {
  switch (phase) {
    case 1:
      return `${phaseData.customer?.companyName || 'Company'} - ${phaseData.customer?.siteName || 'Site'} | Contact: ${phaseData.contacts?.[0]?.name || 'Not specified'}`;

    case 2:
      return `BMS: ${phaseData.bmsSystem?.platform || 'Not specified'} | ${
        phaseData.tridiumExports?.processed
          ? `${phaseData.tridiumExports?.importSummary?.totalDevices || 0} devices (automated)`
          : `${phaseData.manualInventory?.deviceCount || 0} devices (manual)`
      }`;

    case 3:
      return `Tasks: ${phaseData.serviceMetrics?.tasksCompleted || 0} completed | Issues: ${phaseData.serviceMetrics?.issuesResolved || 0} resolved | Health: ${phaseData.serviceMetrics?.systemHealthScore || 0}%`;

    case 4:
      return `Report: ${phaseData.reportConfig?.template || 'Not selected'} template | Delivery: ${phaseData.deliveryInfo?.method || 'Not specified'}`;

    default:
      return 'Phase information';
  }
};