// PM Tasks data structure based on SOP_Library_v22.csv and Task_Library_v22.csv

export interface PMTask {
  id: string;
  name: string;
  sopRef: string;
  phase: 'preparation' | 'assessment' | 'optimization';
  serviceTiers: ('CORE' | 'ASSURE' | 'GUARDIAN')[];
  duration?: number; // in minutes
  steps?: string[];
  safety?: string;
  tools?: string[];
  prerequisites?: string[];
  acceptanceCriteria?: string;
}

// Core Tasks (CORE tier)
const coreTasks: PMTask[] = [
  {
    id: 'C001',
    name: 'Platform & Station Backup',
    sopRef: 'SOP_C001',
    phase: 'preparation',
    serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
    duration: 30,
    steps: [
      'Open Backup Utility in Workbench',
      'Connect to Platform of Niagara host',
      'Select running Station and click "Backup Station"',
      'Name backup with format: [CustomerName]_[YYYY-MM-DD]_PMBackup'
    ],
    safety: 'Ensure system stability during backup process',
    tools: ['Workbench', 'External storage drive', 'Cloud access']
  },
  {
    id: 'C002',
    name: 'Performance Verification',
    sopRef: 'SOP_C002',
    phase: 'assessment',
    serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
    duration: 20,
    steps: [
      'Right-click Station and select Views → Station Summary',
      'Check CPU Usage (should be <80% sustained)',
      'Check Heap Memory (should be <75% after garbage collection)',
      'Verify License Capacities not exceeded'
    ],
    safety: 'Monitor system performance impact during diagnostics',
    tools: ['Workbench', 'System monitoring tools']
  },
  {
    id: 'C003',
    name: 'Active Alarm Resolution',
    sopRef: 'SOP_C003',
    phase: 'assessment',
    serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
    duration: 30,
    steps: [
      'Open Alarm Console in Workbench',
      'Sort alarms by priority (Critical first)',
      'Investigate and resolve each critical alarm',
      'Document alarm resolutions'
    ],
    safety: 'Verify alarm acknowledgment doesn\'t compromise safety systems',
    tools: ['Workbench', 'Diagnostic tools']
  },
  {
    id: 'C004',
    name: 'Schedule & Setpoint Verification',
    sopRef: 'SOP_C004',
    phase: 'preparation',
    serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
    duration: 25,
    steps: [
      'Review all active schedules',
      'Verify schedule times match occupancy',
      'Check holiday/exception calendars',
      'Review temperature setpoints for each mode'
    ],
    safety: 'Ensure schedule changes don\'t compromise comfort or equipment safety',
    tools: ['Workbench', 'Building occupancy schedule']
  },
  {
    id: 'C005',
    name: 'Override Point Cleanup',
    sopRef: 'SOP_C005',
    phase: 'assessment',
    serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
    duration: 20,
    steps: [
      'Open Point Manager and filter for overrides',
      'Document all points in override',
      'Investigate reason for each override',
      'Release unnecessary overrides'
    ],
    safety: 'Verify override release doesn\'t impact critical systems',
    tools: ['Workbench', 'Override documentation']
  },
  {
    id: 'C006',
    name: 'Critical Sensor Check',
    sopRef: 'SOP_C006',
    phase: 'preparation',
    serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
    duration: 30,
    steps: [
      'Identify critical sensors (OAT, space temps, pressures)',
      'Compare sensor readings to reference',
      'Check for sensor drift or stuck values',
      'Check sensor wiring and connections'
    ],
    safety: 'Use lockout/tagout procedures when working on sensor circuits',
    tools: ['Calibrated thermometer', 'Multimeter', 'Reference instruments']
  },
  {
    id: 'C007',
    name: 'User Account Security Audit',
    sopRef: 'SOP_C007',
    phase: 'optimization',
    serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
    duration: 15,
    steps: [
      'Review all user accounts',
      'Check roles and permissions',
      'Verify strong password policies',
      'Check password expiration settings'
    ],
    safety: 'Maintain system access integrity during security changes',
    tools: ['Workbench', 'Security checklist']
  },
  {
    id: 'C008',
    name: 'Documentation Update',
    sopRef: 'SOP_C008',
    phase: 'optimization',
    serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
    duration: 20,
    steps: [
      'Export current point list',
      'Document setpoint modifications',
      'Record any hardware changes',
      'Save all documentation to customer folder'
    ],
    safety: 'Ensure documentation accurately reflects current system configuration',
    tools: ['Workbench', 'Documentation templates']
  }
];

// ASSURE Tasks (Additional for ASSURE tier)
const assureTasks: PMTask[] = [
  {
    id: 'A001',
    name: 'Device Communication Health',
    sopRef: 'SOP_A001',
    phase: 'assessment',
    serviceTiers: ['ASSURE', 'GUARDIAN'],
    duration: 25,
    steps: [
      'Open Device Manager for each network',
      'Verify all devices show "online" status',
      'For offline devices, attempt ping/refresh',
      'Check device power and network wiring'
    ],
    safety: 'Use proper ESD protection when handling network devices',
    tools: ['Workbench', 'Network tools', 'Multimeter']
  },
  {
    id: 'A002',
    name: 'Temperature Sensor Calibration',
    sopRef: 'SOP_A002',
    phase: 'preparation',
    serviceTiers: ['ASSURE', 'GUARDIAN'],
    duration: 35,
    steps: [
      'Identify sensors for calibration',
      'Obtain calibrated reference instrument',
      'Compare BAS reading to reference',
      'Apply calibration offset if needed'
    ],
    safety: 'Follow lockout/tagout procedures, Use appropriate PPE',
    tools: ['NIST-traceable thermometer', 'Calibration log']
  },
  {
    id: 'A003',
    name: 'Valve & Actuator Testing',
    sopRef: 'SOP_A003',
    phase: 'preparation',
    serviceTiers: ['ASSURE', 'GUARDIAN'],
    duration: 40,
    steps: [
      'Plan testing to minimize disruption',
      'Override output to 0% (closed)',
      'Verify physical closure',
      'Test full range of motion'
    ],
    safety: 'Coordinate with facility personnel, Verify fail-safe operation',
    tools: ['Workbench', 'Radio/phone for coordination']
  },
  {
    id: 'A004',
    name: 'Control Loop Performance',
    sopRef: 'SOP_A004',
    phase: 'assessment',
    serviceTiers: ['ASSURE', 'GUARDIAN'],
    duration: 30,
    steps: [
      'Identify critical control loops',
      'Review current PID settings',
      'Check for oscillation or offset',
      'Adjust tuning if needed'
    ],
    safety: 'Monitor system stability during tuning changes',
    tools: ['Workbench', 'Trending tools', 'Tuning guide']
  },
  {
    id: 'A005',
    name: 'History Database Maintenance',
    sopRef: 'SOP_A005',
    phase: 'optimization',
    serviceTiers: ['ASSURE', 'GUARDIAN'],
    duration: 20,
    steps: [
      'Check history database size',
      'Review retention policies',
      'Export critical history data',
      'Clear old records per policy'
    ],
    safety: 'Verify critical history data is backed up before purging',
    tools: ['Workbench', 'External storage']
  },
  {
    id: 'A006',
    name: 'Security Certificate Check',
    sopRef: 'SOP_A006',
    phase: 'optimization',
    serviceTiers: ['ASSURE', 'GUARDIAN'],
    duration: 15,
    steps: [
      'Open Certificate Manager',
      'Check certificate expiration dates',
      'Renew expiring certificates',
      'Test secure connections'
    ],
    safety: 'Maintain secure communications during certificate updates',
    tools: ['Workbench', 'Certificate documentation']
  },
  {
    id: 'A007',
    name: 'Energy Trend Analysis',
    sopRef: 'SOP_A007',
    phase: 'assessment',
    serviceTiers: ['ASSURE', 'GUARDIAN'],
    duration: 25,
    steps: [
      'Generate energy consumption trends',
      'Compare to previous periods',
      'Identify unusual patterns',
      'Review setback effectiveness'
    ],
    safety: 'Consider building occupancy when analyzing energy patterns',
    tools: ['Workbench', 'Spreadsheet software']
  }
];

// GUARDIAN Tasks (Additional for GUARDIAN tier)
const guardianTasks: PMTask[] = [
  {
    id: 'G001',
    name: 'PID Loop Tuning & Optimization',
    sopRef: 'SOP_G001',
    phase: 'optimization',
    serviceTiers: ['GUARDIAN'],
    duration: 45,
    steps: [
      'Identify loops for optimization',
      'Document current parameters',
      'Implement systematic tuning',
      'Test across operating range'
    ],
    safety: 'Monitor critical parameters during tuning process',
    tools: ['Workbench', 'Tuning software', 'Reference guides']
  },
  {
    id: 'G002',
    name: 'Advanced Analytics Configuration',
    sopRef: 'SOP_G002',
    phase: 'optimization',
    serviceTiers: ['GUARDIAN'],
    duration: 30,
    steps: [
      'Review existing analytics rules',
      'Check rule performance/accuracy',
      'Add new FDD rules',
      'Configure notifications'
    ],
    safety: 'Verify analytics rules don\'t create false alarms',
    tools: ['Workbench', 'Analytics module']
  },
  {
    id: 'G003',
    name: 'Security Vulnerability Assessment',
    sopRef: 'SOP_G003',
    phase: 'optimization',
    serviceTiers: ['GUARDIAN'],
    duration: 40,
    steps: [
      'Run security assessment tool',
      'Review vulnerability report',
      'Check for default passwords',
      'Create remediation plan'
    ],
    safety: 'Maintain system integrity during security assessment',
    tools: ['Security scanner', 'Vulnerability checklist']
  },
  {
    id: 'G004',
    name: 'Network Performance Optimization',
    sopRef: 'SOP_G004',
    phase: 'optimization',
    serviceTiers: ['GUARDIAN'],
    duration: 35,
    steps: [
      'Analyze network traffic patterns',
      'Check bandwidth utilization',
      'Identify bottlenecks',
      'Implement COV where possible'
    ],
    safety: 'Maintain network stability during optimization',
    tools: ['Network analyzer', 'Performance monitor']
  },
  {
    id: 'G005',
    name: 'Graphics & HMI Enhancement',
    sopRef: 'SOP_G005',
    phase: 'optimization',
    serviceTiers: ['GUARDIAN'],
    duration: 30,
    steps: [
      'Review existing graphics',
      'Identify enhancement needs',
      'Update graphics for clarity',
      'Implement mobile compatibility'
    ],
    safety: 'Ensure critical system information remains easily accessible',
    tools: ['Px Editor', 'Graphics tools']
  },
  {
    id: 'G006',
    name: 'Preventive Maintenance Scheduling',
    sopRef: 'SOP_G006',
    phase: 'optimization',
    serviceTiers: ['GUARDIAN'],
    duration: 25,
    steps: [
      'Review equipment maintenance needs',
      'Create PM schedules in BAS',
      'Configure maintenance alarms',
      'Set up runtime tracking'
    ],
    safety: 'Ensure maintenance schedules don\'t compromise system reliability',
    tools: ['Workbench', 'Maintenance templates']
  }
];

// Combine all tasks
export const sopTaskData: PMTask[] = [...coreTasks, ...assureTasks, ...guardianTasks];

// Helper functions
export const getTasksForTier = (tier: string): PMTask[] => {
  switch (tier) {
    case 'CORE':
      return sopTaskData.filter(task => task.serviceTiers.includes('CORE'));
    case 'ASSURE':
      return sopTaskData.filter(task => 
        task.serviceTiers.includes('CORE') || task.serviceTiers.includes('ASSURE')
      );
    case 'GUARDIAN':
      return sopTaskData; // All tasks
    default:
      return sopTaskData.filter(task => task.serviceTiers.includes('CORE'));
  }
};

export const tasksByPhase = (tasks: PMTask[]) => {
  return tasks.reduce((acc, task) => {
    if (!acc[task.phase]) {
      acc[task.phase] = [];
    }
    acc[task.phase].push(task);
    return acc;
  }, {} as Record<string, PMTask[]>);
};

export const getTaskById = (taskId: string): PMTask | undefined => {
  return sopTaskData.find(task => task.id === taskId);
};

export const getSOPReference = (sopRef: string): PMTask | undefined => {
  return sopTaskData.find(task => task.sopRef === sopRef);
};
