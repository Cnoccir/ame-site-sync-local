import React from 'react';

// Helper to generate review sections for each phase
export const generatePhaseReviewSections = (
  phase: number,
  phaseData: any,
  onSectionEdit: (section: string) => void
) => {
  switch (phase) {
    case 1:
      return [
        {
          id: 'customer',
          title: 'Customer Information',
          isValid: !!(phaseData.customer?.companyName && phaseData.customer?.siteName && phaseData.customer?.address),
          data: [
            { label: 'Company', value: phaseData.customer?.companyName },
            { label: 'Site Name', value: phaseData.customer?.siteName },
            { label: 'Address', value: phaseData.customer?.address },
            { label: 'Service Tier', value: phaseData.customer?.serviceTier },
            { label: 'Contract #', value: phaseData.customer?.contractNumber },
            { label: 'Account Manager', value: phaseData.customer?.accountManager }
          ],
          onEdit: () => onSectionEdit('customer')
        },
        {
          id: 'contacts',
          title: 'Primary Contact',
          isValid: phaseData.contacts?.length > 0 && phaseData.contacts[0]?.name && phaseData.contacts[0]?.phone,
          data: phaseData.contacts?.length > 0 ? [
            { label: 'Name', value: phaseData.contacts[0]?.name },
            { label: 'Role', value: phaseData.contacts[0]?.role },
            { label: 'Phone', value: phaseData.contacts[0]?.phone },
            { label: 'Email', value: phaseData.contacts[0]?.email },
            { label: 'Primary Contact', value: phaseData.contacts[0]?.isPrimary ? 'Yes' : 'No' },
            { label: 'Emergency Contact', value: phaseData.contacts[0]?.isEmergency ? 'Yes' : 'No' }
          ] : [
            { label: 'Status', value: 'No contacts added' }
          ],
          onEdit: () => onSectionEdit('contacts')
        },
        {
          id: 'access',
          title: 'Site Access',
          isValid: !!(phaseData.access?.method && phaseData.access?.parkingInstructions),
          data: [
            { label: 'Access Method', value: phaseData.access?.method },
            { label: 'Parking Instructions', value: phaseData.access?.parkingInstructions },
            { label: 'Best Arrival Time', value: phaseData.access?.bestArrivalTime },
            { label: 'Badge Required', value: phaseData.access?.badgeRequired ? 'Yes' : 'No' },
            { label: 'Escort Required', value: phaseData.access?.escortRequired ? 'Yes' : 'No' }
          ],
          onEdit: () => onSectionEdit('access')
        },
        {
          id: 'safety',
          title: 'Safety & PPE',
          isValid: phaseData.safety?.requiredPPE?.length > 0,
          data: [
            { label: 'Required PPE', value: phaseData.safety?.requiredPPE?.join(', ') || 'None specified' },
            { label: 'Known Hazards', value: phaseData.safety?.knownHazards?.join(', ') || 'None specified' },
            { label: 'Safety Contact', value: phaseData.safety?.safetyContact },
            { label: 'Safety Phone', value: phaseData.safety?.safetyPhone },
            { label: 'Special Notes', value: phaseData.safety?.specialNotes }
          ],
          onEdit: () => onSectionEdit('safety')
        },
        {
          id: 'team',
          title: 'Team Assignment',
          isValid: !!(phaseData.customer?.primaryTechnicianId && phaseData.customer?.primaryTechnicianName),
          data: [
            { label: 'Primary Technician', value: phaseData.customer?.primaryTechnicianName },
            { label: 'Primary Phone', value: phaseData.customer?.primaryTechnicianPhone },
            { label: 'Primary Email', value: phaseData.customer?.primaryTechnicianEmail },
            { label: 'Secondary Technician', value: phaseData.customer?.secondaryTechnicianName || 'Not assigned' },
            { label: 'Secondary Phone', value: phaseData.customer?.secondaryTechnicianPhone },
            { label: 'Secondary Email', value: phaseData.customer?.secondaryTechnicianEmail }
          ],
          onEdit: () => onSectionEdit('team')
        }
      ];

    case 2:
      return [
        {
          id: 'bms',
          title: 'BMS Platform',
          isValid: !!(phaseData.bmsSystem?.platform && phaseData.bmsSystem?.supervisorLocation),
          data: [
            { label: 'Platform', value: phaseData.bmsSystem?.platform },
            { label: 'Software Version', value: phaseData.bmsSystem?.softwareVersion },
            { label: 'Supervisor Location', value: phaseData.bmsSystem?.supervisorLocation },
            { label: 'Supervisor IP', value: phaseData.bmsSystem?.supervisorIP },
            { label: 'System Architecture', value: phaseData.bmsSystem?.systemArchitecture },
            { label: 'Credentials Location', value: phaseData.bmsSystem?.credentialsLocation }
          ],
          onEdit: () => onSectionEdit('bms')
        },
        {
          id: 'discovery',
          title: 'System Discovery',
          isValid: phaseData.tridiumExports?.processed ||
                   phaseData.manualInventory?.majorEquipment?.length > 0 ||
                   phaseData.manualInventory?.deviceCount > 0,
          data: phaseData.tridiumExports?.processed ? [
            { label: 'Data Source', value: 'Automated Tridium Export' },
            { label: 'Files Processed', value: phaseData.tridiumExports?.importSummary?.filesProcessed?.toString() },
            { label: 'Total Devices', value: phaseData.tridiumExports?.importSummary?.totalDevices?.toString() },
            { label: 'JACE Count', value: phaseData.tridiumExports?.importSummary?.jaceCount?.toString() },
            { label: 'System Architecture', value: phaseData.tridiumExports?.systemArchitecture },
            { label: 'Upload Time', value: phaseData.tridiumExports?.uploadTime?.toLocaleString() }
          ] : [
            { label: 'Data Source', value: 'Manual Entry' },
            { label: 'Device Count', value: phaseData.manualInventory?.deviceCount?.toString() },
            { label: 'Controller Count', value: phaseData.manualInventory?.controllerCount?.toString() },
            { label: 'Major Equipment', value: phaseData.manualInventory?.majorEquipment?.join(', ') },
            { label: 'Network Segments', value: phaseData.manualInventory?.networkSegments?.join(', ') },
            { label: 'Notes', value: phaseData.manualInventory?.notes }
          ],
          onEdit: () => onSectionEdit('discovery')
        },
        {
          id: 'photos',
          title: 'Documentation Photos',
          isValid: true, // Photos are optional
          data: [
            { label: 'Total Photos', value: phaseData.photos?.length?.toString() || '0' },
            { label: 'Equipment Photos', value: phaseData.photos?.filter((p: any) => p.category === 'Equipment')?.length?.toString() || '0' },
            { label: 'Screenshots', value: phaseData.photos?.filter((p: any) => p.category === 'Screenshot')?.length?.toString() || '0' }
          ],
          onEdit: () => onSectionEdit('photos')
        }
      ];

    case 3:
      return [
        {
          id: 'priorities',
          title: 'Customer Priorities',
          isValid: phaseData.customerPriorities?.primaryConcerns?.length > 0,
          data: [
            { label: 'Primary Concerns', value: phaseData.customerPriorities?.primaryConcerns?.join(', ') },
            { label: 'Energy Goals', value: phaseData.customerPriorities?.energyGoals?.join(', ') },
            { label: 'Operational Challenges', value: phaseData.customerPriorities?.operationalChallenges?.join(', ') },
            { label: 'Timeline', value: phaseData.customerPriorities?.timeline },
            { label: 'Budget Constraints', value: phaseData.customerPriorities?.budgetConstraints }
          ],
          onEdit: () => onSectionEdit('priorities')
        },
        {
          id: 'tasks',
          title: 'Service Tasks',
          isValid: phaseData.tasks?.length > 0 || phaseData.serviceMetrics?.tasksCompleted > 0,
          data: [
            { label: 'Tasks Completed', value: phaseData.serviceMetrics?.tasksCompleted?.toString() || '0' },
            { label: 'Issues Resolved', value: phaseData.serviceMetrics?.issuesResolved?.toString() || '0' },
            { label: 'Time on Site', value: `${phaseData.serviceMetrics?.timeOnSite || 0} minutes` },
            { label: 'System Health Score', value: `${phaseData.serviceMetrics?.systemHealthScore || 0}%` },
            { label: 'Performance Improvement', value: `${phaseData.serviceMetrics?.performanceImprovement || 0}%` }
          ],
          onEdit: () => onSectionEdit('tasks')
        }
      ];

    case 4:
      return [
        {
          id: 'summary',
          title: 'Service Summary',
          isValid: !!(phaseData.serviceSummary?.executiveSummary && phaseData.serviceSummary?.keyFindings?.length > 0),
          data: [
            { label: 'Executive Summary', value: phaseData.serviceSummary?.executiveSummary ? 'Completed' : 'Pending' },
            { label: 'Key Findings', value: phaseData.serviceSummary?.keyFindings?.length?.toString() || '0' },
            { label: 'Value Delivered', value: phaseData.serviceSummary?.valueDelivered?.length?.toString() || '0' },
            { label: 'System Improvements', value: phaseData.serviceSummary?.systemImprovements?.length?.toString() || '0' },
            { label: 'Next Steps', value: phaseData.serviceSummary?.nextSteps?.length?.toString() || '0' },
            { label: 'Follow-up Required', value: phaseData.serviceSummary?.followupRequired ? 'Yes' : 'No' }
          ],
          onEdit: () => onSectionEdit('summary')
        },
        {
          id: 'report',
          title: 'Report Configuration',
          isValid: !!(phaseData.reportConfig?.template),
          data: [
            { label: 'Template', value: phaseData.reportConfig?.template },
            { label: 'Include Photos', value: phaseData.reportConfig?.includePhotos ? 'Yes' : 'No' },
            { label: 'Include Charts', value: phaseData.reportConfig?.includeCharts ? 'Yes' : 'No' },
            { label: 'Branding Level', value: phaseData.reportConfig?.brandingLevel },
            { label: 'Confidentiality', value: phaseData.reportConfig?.confidentiality },
            { label: 'Delivery Method', value: phaseData.deliveryInfo?.method }
          ],
          onEdit: () => onSectionEdit('report')
        }
      ];

    default:
      return [];
  }
};