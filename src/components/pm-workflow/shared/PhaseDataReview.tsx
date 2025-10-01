import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Edit3,
  ChevronDown,
  ChevronRight,
  User,
  Building,
  Phone,
  Mail,
  Shield,
  Key,
  Database,
  ArrowRight
} from 'lucide-react';
import { PhaseProgress } from '@/types/pmWorkflow';

interface PhaseDataReviewProps {
  phase: number;
  phaseData: any;
  isComplete: boolean;
  onEdit: () => void;
  onContinue: () => void;
  className?: string;
}

const getReviewData = (phase: number, data: any) => {
  switch (phase) {
    case 1:
      return {
        title: 'Site Intelligence Review',
        sections: [
          {
            title: 'Customer Information',
            icon: <Building className="h-4 w-4" />,
            items: [
              { label: 'Company', value: data.customer?.companyName },
              { label: 'Site', value: data.customer?.siteName },
              { label: 'Service Tier', value: data.customer?.serviceTier },
              { label: 'Contract', value: data.customer?.contractNumber }
            ]
          },
          {
            title: 'Primary Contact',
            icon: <User className="h-4 w-4" />,
            items: data.contacts?.length > 0 ? [
              { label: 'Name', value: data.contacts[0]?.name },
              { label: 'Role', value: data.contacts[0]?.role },
              { label: 'Phone', value: data.contacts[0]?.phone },
              { label: 'Email', value: data.contacts[0]?.email }
            ] : [{ label: 'No contacts added', value: null }]
          },
          {
            title: 'Access & Safety',
            icon: <Key className="h-4 w-4" />,
            items: [
              { label: 'Access Method', value: data.access?.method },
              { label: 'Required PPE', value: data.safety?.requiredPPE?.join(', ') || 'None specified' },
              { label: 'Primary Technician', value: data.customer?.primaryTechnicianName }
            ]
          }
        ]
      };

    case 2:
      return {
        title: 'System Discovery Review',
        sections: [
          {
            title: 'BMS Platform',
            icon: <Database className="h-4 w-4" />,
            items: [
              { label: 'Platform', value: data.bmsSystem?.platform },
              { label: 'Version', value: data.bmsSystem?.softwareVersion },
              { label: 'Supervisor Location', value: data.bmsSystem?.supervisorLocation },
              { label: 'Supervisor IP', value: data.bmsSystem?.supervisorIP }
            ]
          },
          {
            title: 'System Inventory',
            icon: <Shield className="h-4 w-4" />,
            items: data.tridiumExports?.processed ? [
              { label: 'Data Source', value: 'Automated Tridium Export' },
              { label: 'Files Processed', value: data.tridiumExports?.importSummary?.filesProcessed },
              { label: 'Total Devices', value: data.tridiumExports?.importSummary?.totalDevices },
              { label: 'Architecture', value: data.tridiumExports?.systemArchitecture }
            ] : [
              { label: 'Data Source', value: 'Manual Entry' },
              { label: 'Device Count', value: data.manualInventory?.deviceCount },
              { label: 'Equipment Items', value: data.manualInventory?.majorEquipment?.length },
              { label: 'Network Segments', value: data.manualInventory?.networkSegments?.length }
            ]
          }
        ]
      };

    case 3:
      return {
        title: 'Service Activities Review',
        sections: [
          {
            title: 'Customer Priorities',
            icon: <User className="h-4 w-4" />,
            items: [
              { label: 'Primary Concerns', value: data.customerPriorities?.primaryConcerns?.join(', ') },
              { label: 'Energy Goals', value: data.customerPriorities?.energyGoals?.join(', ') },
              { label: 'Timeline', value: data.customerPriorities?.timeline }
            ]
          },
          {
            title: 'Service Metrics',
            icon: <Shield className="h-4 w-4" />,
            items: [
              { label: 'Tasks Completed', value: data.serviceMetrics?.tasksCompleted },
              { label: 'Issues Resolved', value: data.serviceMetrics?.issuesResolved },
              { label: 'Time on Site', value: `${data.serviceMetrics?.timeOnSite || 0} minutes` }
            ]
          }
        ]
      };

    case 4:
      return {
        title: 'Documentation Review',
        sections: [
          {
            title: 'Service Summary',
            icon: <Building className="h-4 w-4" />,
            items: [
              { label: 'Executive Summary', value: data.serviceSummary?.executiveSummary ? 'Completed' : 'Pending' },
              { label: 'Key Findings', value: data.serviceSummary?.keyFindings?.length || 0 },
              { label: 'Recommendations', value: data.serviceSummary?.nextSteps?.length || 0 }
            ]
          },
          {
            title: 'Report Configuration',
            icon: <Database className="h-4 w-4" />,
            items: [
              { label: 'Template', value: data.reportConfig?.template },
              { label: 'Include Photos', value: data.reportConfig?.includePhotos ? 'Yes' : 'No' },
              { label: 'Delivery Method', value: data.deliveryInfo?.method }
            ]
          }
        ]
      };

    default:
      return { title: 'Phase Review', sections: [] };
  }
};

export const PhaseDataReview: React.FC<PhaseDataReviewProps> = ({
  phase,
  phaseData,
  isComplete,
  onEdit,
  onContinue,
  className = ''
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const reviewData = getReviewData(phase, phaseData);

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  if (!isComplete) return null;

  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <h4 className="font-medium text-green-900">{reviewData.title}</h4>
            <Badge className="bg-green-600 text-xs">Complete</Badge>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit} className="gap-1 text-xs">
              <Edit3 className="h-3 w-3" />
              Edit
            </Button>
            <Button size="sm" onClick={onContinue} className="gap-1 text-xs">
              Continue
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {reviewData.sections.map((section, sectionIndex) => (
            <div key={sectionIndex} className="border rounded bg-white">
              <button
                onClick={() => toggleSection(sectionIndex)}
                className="w-full flex items-center justify-between p-2 hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  {section.icon}
                  <span className="text-sm font-medium">{section.title}</span>
                </div>
                {expandedSections.has(sectionIndex) ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>

              {expandedSections.has(sectionIndex) && (
                <div className="px-2 pb-2 space-y-1">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex justify-between text-xs">
                      <span className="text-gray-600">{item.label}:</span>
                      <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">
                        {item.value || 'Not specified'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-3 text-xs text-green-700">
          Review the information above and make any necessary corrections before proceeding.
        </div>
      </CardContent>
    </Card>
  );
};