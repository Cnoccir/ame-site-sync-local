import React from 'react';
import { Building, User, Key, Shield, Database, Settings, FileText, Phone, Mail } from 'lucide-react';

export const generatePhaseModalSections = (phase: number, phaseData: any) => {
  switch (phase) {
    case 1:
      return [
        {
          id: 'customer',
          title: 'Customer Information',
          icon: <Building className="h-4 w-4" />,
          fields: [
            {
              key: 'companyName',
              label: 'Company Name',
              value: phaseData.customer?.companyName,
              type: 'text' as const,
              required: true
            },
            {
              key: 'siteName',
              label: 'Site Name',
              value: phaseData.customer?.siteName,
              type: 'text' as const,
              required: true
            },
            {
              key: 'address',
              label: 'Site Address',
              value: phaseData.customer?.address,
              type: 'textarea' as const,
              required: true
            },
            {
              key: 'serviceTier',
              label: 'Service Tier',
              value: phaseData.customer?.serviceTier,
              type: 'select' as const,
              options: ['CORE', 'ASSURE', 'GUARDIAN'],
              required: true
            },
            {
              key: 'contractNumber',
              label: 'Contract Number',
              value: phaseData.customer?.contractNumber,
              type: 'text' as const
            },
            {
              key: 'accountManager',
              label: 'Account Manager',
              value: phaseData.customer?.accountManager,
              type: 'text' as const
            }
          ]
        },
        {
          id: 'contact',
          title: 'Primary Contact',
          icon: <User className="h-4 w-4" />,
          fields: [
            {
              key: 'name',
              label: 'Contact Name',
              value: phaseData.contacts?.[0]?.name,
              type: 'text' as const,
              required: true
            },
            {
              key: 'role',
              label: 'Role/Title',
              value: phaseData.contacts?.[0]?.role,
              type: 'text' as const,
              required: true
            },
            {
              key: 'phone',
              label: 'Phone Number',
              value: phaseData.contacts?.[0]?.phone,
              type: 'text' as const,
              required: true
            },
            {
              key: 'email',
              label: 'Email Address',
              value: phaseData.contacts?.[0]?.email,
              type: 'text' as const,
              required: true
            }
          ]
        },
        {
          id: 'access',
          title: 'Site Access & Logistics',
          icon: <Key className="h-4 w-4" />,
          fields: [
            {
              key: 'method',
              label: 'Access Method',
              value: phaseData.access?.method,
              type: 'select' as const,
              options: ['front-desk', 'keycard', 'escort', 'call-contact', 'self-access', 'other'],
              required: true
            },
            {
              key: 'parkingInstructions',
              label: 'Parking Instructions',
              value: phaseData.access?.parkingInstructions,
              type: 'textarea' as const,
              required: true
            },
            {
              key: 'bestArrivalTime',
              label: 'Best Arrival Time',
              value: phaseData.access?.bestArrivalTime,
              type: 'text' as const
            },
            {
              key: 'specialInstructions',
              label: 'Special Instructions',
              value: phaseData.access?.specialInstructions,
              type: 'textarea' as const
            }
          ]
        },
        {
          id: 'safety',
          title: 'Safety & PPE Requirements',
          icon: <Shield className="h-4 w-4" />,
          fields: [
            {
              key: 'requiredPPE',
              label: 'Required PPE',
              value: phaseData.safety?.requiredPPE?.join(', '),
              type: 'text' as const,
              required: true
            },
            {
              key: 'knownHazards',
              label: 'Known Hazards',
              value: phaseData.safety?.knownHazards?.join(', '),
              type: 'text' as const
            },
            {
              key: 'safetyContact',
              label: 'Safety Contact Name',
              value: phaseData.safety?.safetyContact,
              type: 'text' as const
            },
            {
              key: 'safetyPhone',
              label: 'Safety Contact Phone',
              value: phaseData.safety?.safetyPhone,
              type: 'text' as const
            },
            {
              key: 'specialNotes',
              label: 'Special Safety Notes',
              value: phaseData.safety?.specialNotes,
              type: 'textarea' as const
            }
          ]
        },
        {
          id: 'team',
          title: 'Team Assignment',
          icon: <User className="h-4 w-4" />,
          fields: [
            {
              key: 'primaryTechnicianName',
              label: 'Primary Technician',
              value: phaseData.customer?.primaryTechnicianName,
              type: 'text' as const,
              required: true
            },
            {
              key: 'primaryTechnicianPhone',
              label: 'Primary Tech Phone',
              value: phaseData.customer?.primaryTechnicianPhone,
              type: 'text' as const
            },
            {
              key: 'secondaryTechnicianName',
              label: 'Secondary Technician',
              value: phaseData.customer?.secondaryTechnicianName,
              type: 'text' as const
            },
            {
              key: 'secondaryTechnicianPhone',
              label: 'Secondary Tech Phone',
              value: phaseData.customer?.secondaryTechnicianPhone,
              type: 'text' as const
            }
          ]
        }
      ];

    case 2:
      return [
        {
          id: 'bms',
          title: 'BMS Platform Information',
          icon: <Database className="h-4 w-4" />,
          fields: [
            {
              key: 'platform',
              label: 'Primary Platform',
              value: phaseData.bmsSystem?.platform,
              type: 'select' as const,
              options: ['Niagara', 'JCI', 'Honeywell', 'Schneider', 'Siemens', 'Delta', 'Mixed', 'Other'],
              required: true
            },
            {
              key: 'softwareVersion',
              label: 'Software Version',
              value: phaseData.bmsSystem?.softwareVersion,
              type: 'text' as const
            },
            {
              key: 'supervisorLocation',
              label: 'Supervisor Location',
              value: phaseData.bmsSystem?.supervisorLocation,
              type: 'text' as const,
              required: true
            },
            {
              key: 'supervisorIP',
              label: 'Supervisor IP/Hostname',
              value: phaseData.bmsSystem?.supervisorIP,
              type: 'text' as const
            },
            {
              key: 'systemArchitecture',
              label: 'System Architecture',
              value: phaseData.bmsSystem?.systemArchitecture,
              type: 'text' as const
            },
            {
              key: 'credentialsLocation',
              label: 'Credentials Location',
              value: phaseData.bmsSystem?.credentialsLocation,
              type: 'text' as const
            }
          ]
        },
        {
          id: 'discovery',
          title: 'System Discovery Results',
          icon: <Settings className="h-4 w-4" />,
          fields: phaseData.tridiumExports?.processed ? [
            {
              key: 'dataSource',
              label: 'Data Source',
              value: 'Automated Tridium Export',
              type: 'text' as const
            },
            {
              key: 'filesProcessed',
              label: 'Files Processed',
              value: phaseData.tridiumExports?.importSummary?.filesProcessed?.toString(),
              type: 'text' as const
            },
            {
              key: 'totalDevices',
              label: 'Total Devices',
              value: phaseData.tridiumExports?.importSummary?.totalDevices?.toString(),
              type: 'text' as const
            },
            {
              key: 'jaceCount',
              label: 'JACE Count',
              value: phaseData.tridiumExports?.importSummary?.jaceCount?.toString(),
              type: 'text' as const
            }
          ] : [
            {
              key: 'dataSource',
              label: 'Data Source',
              value: 'Manual Entry',
              type: 'text' as const
            },
            {
              key: 'deviceCount',
              label: 'Estimated Device Count',
              value: phaseData.manualInventory?.deviceCount?.toString(),
              type: 'text' as const
            },
            {
              key: 'controllerCount',
              label: 'Controller Count',
              value: phaseData.manualInventory?.controllerCount?.toString(),
              type: 'text' as const
            },
            {
              key: 'majorEquipment',
              label: 'Major Equipment',
              value: phaseData.manualInventory?.majorEquipment?.join(', '),
              type: 'textarea' as const
            },
            {
              key: 'networkSegments',
              label: 'Network Segments',
              value: phaseData.manualInventory?.networkSegments?.join(', '),
              type: 'textarea' as const
            }
          ]
        }
      ];

    case 3:
      return [
        {
          id: 'priorities',
          title: 'Customer Priorities',
          icon: <User className="h-4 w-4" />,
          fields: [
            {
              key: 'primaryConcerns',
              label: 'Primary Concerns',
              value: phaseData.customerPriorities?.primaryConcerns?.join(', '),
              type: 'textarea' as const,
              required: true
            },
            {
              key: 'energyGoals',
              label: 'Energy Goals',
              value: phaseData.customerPriorities?.energyGoals?.join(', '),
              type: 'textarea' as const
            },
            {
              key: 'operationalChallenges',
              label: 'Operational Challenges',
              value: phaseData.customerPriorities?.operationalChallenges?.join(', '),
              type: 'textarea' as const
            },
            {
              key: 'timeline',
              label: 'Timeline',
              value: phaseData.customerPriorities?.timeline,
              type: 'text' as const
            }
          ]
        },
        {
          id: 'metrics',
          title: 'Service Metrics',
          icon: <Settings className="h-4 w-4" />,
          fields: [
            {
              key: 'tasksCompleted',
              label: 'Tasks Completed',
              value: phaseData.serviceMetrics?.tasksCompleted?.toString(),
              type: 'text' as const
            },
            {
              key: 'issuesResolved',
              label: 'Issues Resolved',
              value: phaseData.serviceMetrics?.issuesResolved?.toString(),
              type: 'text' as const
            },
            {
              key: 'timeOnSite',
              label: 'Time on Site (minutes)',
              value: phaseData.serviceMetrics?.timeOnSite?.toString(),
              type: 'text' as const
            },
            {
              key: 'systemHealthScore',
              label: 'System Health Score (%)',
              value: phaseData.serviceMetrics?.systemHealthScore?.toString(),
              type: 'text' as const
            }
          ]
        }
      ];

    case 4:
      return [
        {
          id: 'summary',
          title: 'Service Summary',
          icon: <FileText className="h-4 w-4" />,
          fields: [
            {
              key: 'executiveSummary',
              label: 'Executive Summary',
              value: phaseData.serviceSummary?.executiveSummary,
              type: 'textarea' as const,
              required: true
            },
            {
              key: 'keyFindings',
              label: 'Key Findings',
              value: phaseData.serviceSummary?.keyFindings?.join('\n'),
              type: 'textarea' as const
            },
            {
              key: 'valueDelivered',
              label: 'Value Delivered',
              value: phaseData.serviceSummary?.valueDelivered?.join('\n'),
              type: 'textarea' as const
            },
            {
              key: 'nextSteps',
              label: 'Next Steps',
              value: phaseData.serviceSummary?.nextSteps?.join('\n'),
              type: 'textarea' as const
            }
          ]
        },
        {
          id: 'report',
          title: 'Report Configuration',
          icon: <Settings className="h-4 w-4" />,
          fields: [
            {
              key: 'template',
              label: 'Report Template',
              value: phaseData.reportConfig?.template,
              type: 'select' as const,
              options: ['Customer', 'Technical', 'Executive'],
              required: true
            },
            {
              key: 'includePhotos',
              label: 'Include Photos',
              value: phaseData.reportConfig?.includePhotos ? 'Yes' : 'No',
              type: 'select' as const,
              options: ['Yes', 'No']
            },
            {
              key: 'brandingLevel',
              label: 'Branding Level',
              value: phaseData.reportConfig?.brandingLevel,
              type: 'select' as const,
              options: ['Full', 'Minimal', 'None']
            },
            {
              key: 'deliveryMethod',
              label: 'Delivery Method',
              value: phaseData.deliveryInfo?.method,
              type: 'select' as const,
              options: ['Email', 'Portal', 'Print']
            }
          ]
        }
      ];

    default:
      return [];
  }
};

export const getPhaseTitle = (phase: number): string => {
  switch (phase) {
    case 1: return 'Site Intelligence & Setup';
    case 2: return 'System Discovery & Inventory';
    case 3: return 'Service Activities';
    case 4: return 'Documentation & Reporting';
    default: return 'Phase Review';
  }
};