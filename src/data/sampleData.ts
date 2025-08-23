import { Customer, Visit, Task, Tool, DashboardStats, ActivityItem, GOOGLE_DRIVE_CONFIG } from '@/types';

export const sampleCustomers: Customer[] = [
  {
    id: '1',
    customer_id: 'CUST_001',
    company_name: 'Metro General Hospital',
    site_name: 'Main Campus',
    site_address: '123 Health St, Anytown, USA 12345',
    service_tier: 'GUARDIAN',
    system_type: 'Niagara N4',
    contract_status: 'Active',
    building_type: 'Hospital/Healthcare',
    primary_contact: 'Facility Manager',
    contact_phone: '555-111-2222',
    contact_email: 'facility@metrogeneral.com',
    emergency_contact: 'Dr. Sarah Johnson',
    emergency_phone: '555-111-9999',
    ppe_required: true,
    badge_required: true,
    training_required: true,
    remote_access: false,
    vpn_required: false,
    last_service: '2024-01-15',
    next_due: '2024-06-15',
    technician_assigned: 'John Technician',
    drive_folder_id: GOOGLE_DRIVE_CONFIG.masterFolder,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z'
  },
  {
    id: '2',
    customer_id: 'CUST_002',
    company_name: 'Springfield High School',
    site_name: 'Main Building',
    site_address: '456 Education Ave, Springfield, USA 12346',
    service_tier: 'ASSURE',
    system_type: 'Niagara AX',
    contract_status: 'Active',
    building_type: 'Educational',
    primary_contact: 'Head of Maintenance',
    contact_phone: '555-222-6666',
    contact_email: 'maintenance@springfield.edu',
    ppe_required: false,
    badge_required: false,
    training_required: false,
    remote_access: true,
    vpn_required: false,
    last_service: '2024-02-01',
    next_due: '2024-05-20',
    technician_assigned: 'Jane Smith',
    drive_folder_id: GOOGLE_DRIVE_CONFIG.serviceToolDataFolder,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-02-01T00:00:00Z'
  },
  {
    id: '3',
    customer_id: 'CUST_003',
    company_name: 'Downtown Office Complex',
    site_name: 'Tower A',
    site_address: '789 Business Blvd, Downtown, USA 12347',
    service_tier: 'CORE',
    system_type: 'Johnson Metasys',
    contract_status: 'Active',
    building_type: 'Office Building',
    primary_contact: 'Property Manager',
    contact_phone: '555-777-4888',
    contact_email: 'property@downtownoffice.com',
    ppe_required: false,
    badge_required: false,
    training_required: false,
    remote_access: false,
    vpn_required: false,
    last_service: '2024-01-30',
    next_due: '2024-01-19',
    technician_assigned: 'Mike Wilson',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-30T00:00:00Z'
  }
];

export const sampleTasks: Task[] = [
  {
    id: '1',
    task_id: 'C001',
    task_name: 'Platform & Station Backup',
    service_tiers: ['CORE', 'ASSURE', 'GUARDIAN'],
    category: 'System Backup',
    duration: 45,
    navigation_path: 'Platform → Platform Administration → Backup/Restore',
    tools_required: ['Laptop', 'External Drive', 'Ethernet Cable'],
    quality_checks: 'Verify backup file integrity, confirm successful restore test',
    safety_notes: 'Ensure power protection during backup process',
    version: '1.0',
    last_updated: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    task_id: 'C002',
    task_name: 'Check Alarm History',
    service_tiers: ['CORE', 'ASSURE', 'GUARDIAN'],
    category: 'System Monitoring',
    duration: 30,
    navigation_path: 'Station → Alarm Console',
    tools_required: ['Laptop', 'Documentation'],
    quality_checks: 'Review critical alarms, verify resolution status',
    version: '1.0',
    last_updated: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    task_id: 'A001',
    task_name: 'Sensor Calibration Check',
    service_tiers: ['ASSURE', 'GUARDIAN'],
    category: 'Calibration',
    duration: 60,
    navigation_path: 'Station → Points → Sensors',
    tools_required: ['Multimeter', 'Calibration Tools'],
    quality_checks: 'Verify sensor accuracy within ±2% tolerance',
    safety_notes: 'Follow lockout/tagout procedures when accessing sensors',
    version: '1.0',
    last_updated: '2024-01-01T00:00:00Z'
  },
  {
    id: '4',
    task_id: 'G001',
    task_name: 'Network Security Audit',
    service_tiers: ['GUARDIAN'],
    category: 'Security',
    duration: 90,
    navigation_path: 'Platform → Security Settings',
    tools_required: ['Laptop', 'Network Scanner', 'Security Checklist'],
    quality_checks: 'Verify firewall rules, check user access permissions',
    safety_notes: 'Coordinate with IT department before security testing',
    version: '1.0',
    last_updated: '2024-01-01T00:00:00Z'
  }
];

export const sampleTools: Tool[] = [
  {
    id: '1',
    tool_id: 'T001',
    tool_name: 'Laptop with BMS Software',
    category: 'Computing',
    safety_category: 'Standard',
    is_consumable: false,
    notes: 'Required for all service visits'
  },
  {
    id: '2',
    tool_id: 'T002',
    tool_name: 'Digital Multimeter',
    category: 'Testing Equipment',
    safety_category: 'Electrical',
    is_consumable: false,
    notes: 'Calibrated annually'
  },
  {
    id: '3',
    tool_id: 'T003',
    tool_name: 'Safety Glasses',
    category: 'PPE',
    safety_category: 'Required',
    is_consumable: false,
    notes: 'Required for all field work'
  },
  {
    id: '4',
    tool_id: 'T004',
    tool_name: 'Ethernet Cable (25ft)',
    category: 'Connectivity',
    safety_category: 'Standard',
    is_consumable: false,
    notes: 'For network diagnostics'
  }
];

export const sampleVisits: Visit[] = [
  {
    id: '1',
    visit_id: 'VIS_20240119_001',
    customer_id: '1',
    visit_date: '2024-01-19',
    visit_status: 'In Progress',
    phase_1_status: 'Completed',
    phase_1_completed_at: '2024-01-19T09:00:00Z',
    phase_2_status: 'Completed',
    phase_2_completed_at: '2024-01-19T10:30:00Z',
    phase_3_status: 'In Progress',
    phase_4_status: 'Pending',
    technician_name: 'John Technician',
    created_at: '2024-01-19T08:00:00Z',
    updated_at: '2024-01-19T10:30:00Z'
  }
];

export const sampleDashboardStats: DashboardStats = {
  total_customers: 3,
  active_visits: 6,
  reports_generated: 0,
  overdue_visits: 2,
  recent_activity: [
    {
      id: '1',
      type: 'visit_started',
      description: 'Visit started for Metro General Hospital',
      timestamp: '2024-01-19T08:00:00Z',
      user: 'John Technician'
    },
    {
      id: '2',
      type: 'customer_added',
      description: 'New customer added: Downtown Office Complex',
      timestamp: '2024-01-18T14:30:00Z',
      user: 'Admin User'
    }
  ]
};

export const serviceTierConfig = {
  CORE: { name: 'CORE' as const, min_tasks: 5, max_tasks: 8, color: 'tier-core', description: 'Basic maintenance package' },
  ASSURE: { name: 'ASSURE' as const, min_tasks: 8, max_tasks: 12, color: 'tier-assure', description: 'Enhanced maintenance package' },
  GUARDIAN: { name: 'GUARDIAN' as const, min_tasks: 12, max_tasks: 20, color: 'tier-guardian', description: 'Premium maintenance package' }
};