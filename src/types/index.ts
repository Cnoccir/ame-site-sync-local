// Google Drive Configuration
export const GOOGLE_DRIVE_CONFIG = {
  masterFolder: '17vkTZ2Szm2pADLmFGEHEMuCetigYoTna',
  serviceToolDataFolder: '1H9yPV-UUXqaxHVoOmX0s9YsKEtpVQ5cs',
  files: {
    customers: '1yO_zJx1_gyaLwhb-ZzUajksKptDaweOV',
    sopLibrary: '16ygykcrkxukqQDKsrA37u-nrhvoC2jj0',
    taskLibrary: '16rZ0_e23h7e2UmyRrwjPvJlisWXST2A3',
    toolLibrary: '11HevKmr6_YmYg54TGbFcaIpvF8Bto-CT'
  }
};

export interface Customer {
  id: string;
  customer_id: string;
  company_name: string;
  site_name: string;
  site_address: string;
  service_tier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  system_type: string;
  contract_status: 'Active' | 'Inactive' | 'Pending' | 'Expired';
  building_type?: string;
  
  // Contact Information
  primary_contact: string;
  contact_phone: string;
  contact_email: string;
  emergency_contact?: string;
  emergency_phone?: string;
  emergency_email?: string;
  security_contact?: string;
  security_phone?: string;
  
  // Access & Security
  building_access_type?: string;
  building_access_details?: string;
  access_hours?: string;
  ppe_required?: boolean;
  badge_required?: boolean;
  training_required?: boolean;
  safety_requirements?: string;
  site_hazards?: string;
  
  // System Credentials (encrypted)
  bms_supervisor_ip?: string;
  web_supervisor_url?: string;
  workbench_username?: string;
  workbench_password?: string;
  platform_username?: string;
  platform_password?: string;
  
  // Remote Access
  remote_access?: boolean;
  remote_access_type?: string;
  vpn_required?: boolean;
  vpn_details?: string;
  
  // Service tracking
  last_service?: string;
  next_due?: string;
  technician_assigned?: string;
  service_frequency?: string;
  special_instructions?: string;
  
  // Administrative
  account_manager?: string;
  region?: string;
  district?: string;
  territory?: string;
  escalation_contact?: string;
  escalation_phone?: string;
  
  // Metadata
  drive_folder_id?: string;
  drive_folder_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface Visit {
  id: string;
  visit_id: string;
  customer_id: string;
  customer?: Customer;
  visit_date: string;
  visit_status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled' | 'Abandoned';
  completion_date?: string;
  
  // Enhanced visit tracking
  current_phase?: number;
  auto_save_data?: any;
  last_activity?: string;
  total_duration?: number;
  started_at?: string;
  expires_at?: string;
  is_active?: boolean;
  customer_satisfaction?: number;
  next_service_due?: string;
  
  // Phase tracking
  phase_1_status: 'Pending' | 'In Progress' | 'Completed';
  phase_1_completed_at?: string;
  phase_2_status: 'Pending' | 'In Progress' | 'Completed';
  phase_2_completed_at?: string;
  phase_3_status: 'Pending' | 'In Progress' | 'Completed';
  phase_3_completed_at?: string;
  phase_4_status: 'Pending' | 'In Progress' | 'Completed';
  phase_4_completed_at?: string;
  
  technician_id?: string;
  technician_name?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  task_id: string;
  task_name: string;
  service_tiers: string[];
  category: string;
  duration?: number; // minutes
  navigation_path?: string;
  sop_steps?: string;
  tools_required?: string[];
  quality_checks?: string;
  prerequisites?: string;
  skills_required?: string;
  safety_notes?: string;
  version?: string;
  last_updated?: string;
}

export interface VisitTask {
  id: string;
  visit_id: string;
  task_id: string;
  task?: Task;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Skipped';
  started_at?: string;
  completed_at?: string;
  technician_notes?: string;
  issues_found?: string;
  resolution?: string;
  time_spent?: number; // actual minutes spent
  created_at?: string;
}

export interface Tool {
  id: string;
  tool_id: string;
  tool_name: string;
  category?: string;
  safety_category?: string;
  is_consumable: boolean;
  unit_of_measure?: string;
  typical_quantity?: number;
  reorder_point?: number;
  supplier?: string;
  notes?: string;
  created_at?: string;
}

export interface SOP {
  id: string;
  sop_id: string;
  sop_name: string;
  category?: string;
  system_type?: string;
  description?: string;
  procedure_steps?: any; // JSONB
  safety_requirements?: string[];
  tools_required?: string[];
  estimated_duration?: number;
  version?: string;
  last_updated?: string;
}

export interface Report {
  id: string;
  report_id: string;
  visit_id?: string;
  customer_id?: string;
  report_type?: string;
  generated_at?: string;
  generated_by?: string;
  file_url?: string;
  file_size?: number;
  metadata?: any; // JSONB
}

export interface DashboardStats {
  total_customers: number;
  active_visits: number;
  reports_generated: number;
  overdue_visits: number;
  recent_activity: ActivityItem[];
}

export interface ActivityItem {
  id: string;
  type: 'visit_started' | 'visit_completed' | 'customer_added' | 'report_generated';
  description: string;
  timestamp: string;
  user: string;
}

export interface ServiceTierConfig {
  name: 'CORE' | 'ASSURE' | 'GUARDIAN';
  min_tasks: number;
  max_tasks: number;
  color: string;
  description: string;
  includedTiers: string[];
  taskCount: number;
}