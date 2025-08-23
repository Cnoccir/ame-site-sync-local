export interface Customer {
  id: string;
  customer_id: string;
  company_name: string;
  site_name: string;
  site_address: string;
  service_tier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  system_type: string;
  contract_status: 'Active' | 'Inactive' | 'Pending' | 'Expired';
  building_type: string;
  
  // Contact Information
  primary_contact: string;
  contact_phone: string;
  contact_email: string;
  emergency_contact?: string;
  emergency_phone?: string;
  
  // Service tracking
  last_service?: string;
  next_due?: string;
  technician_assigned?: string;
  
  created_at: string;
  updated_at: string;
}

export interface Visit {
  id: string;
  visit_id: string;
  customer_id: string;
  customer?: Customer;
  visit_date: string;
  visit_status: 'Scheduled' | 'In Progress' | 'Completed' | 'Cancelled';
  
  // Phase tracking
  phase_1_status: 'Pending' | 'In Progress' | 'Complete';
  phase_1_completed_at?: string;
  phase_2_status: 'Pending' | 'In Progress' | 'Complete';
  phase_2_completed_at?: string;
  phase_3_status: 'Pending' | 'In Progress' | 'Complete';
  phase_3_completed_at?: string;
  phase_4_status: 'Pending' | 'In Progress' | 'Complete';
  phase_4_completed_at?: string;
  
  technician_id?: string;
  technician_name?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
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
  safety_notes?: string;
  version: string;
  last_updated: string;
}

export interface VisitTask {
  id: string;
  visit_id: string;
  task_id: string;
  task?: Task;
  status: 'Pending' | 'In Progress' | 'Complete' | 'Skipped';
  started_at?: string;
  completed_at?: string;
  technician_notes?: string;
  issues_found?: string;
  resolution?: string;
  time_spent?: number; // actual minutes spent
  created_at: string;
}

export interface Tool {
  id: string;
  tool_id: string;
  tool_name: string;
  category: string;
  safety_category?: string;
  is_consumable: boolean;
  unit_of_measure?: string;
  typical_quantity?: number;
  notes?: string;
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
}