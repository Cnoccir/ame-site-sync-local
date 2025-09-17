// Import constants from centralized location
import { GOOGLE_DRIVE_CONFIG } from '@/utils/constants';
export { GOOGLE_DRIVE_CONFIG };

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
  
  // Enhanced Basic Information
  system_architecture?: string;
  primary_bas_platform?: string;
  
  // Enhanced Contact Information
  primary_technician_phone?: string;
  primary_technician_email?: string;
  secondary_technician_phone?: string;
  secondary_technician_email?: string;
  
  // Enhanced Access Information
  access_method?: string;
  parking_instructions?: string;
  special_access_notes?: string;
  
  // Site Intelligence System fields
  site_nickname?: string;           // Quick reference name
  site_number?: string;            // Persistent unique identifier (AME-YYYY-###)
  primary_technician_id?: string;  // Primary technician UUID
  secondary_technician_id?: string; // Secondary technician UUID
  primary_technician_name?: string;  // Derived from user lookup
  secondary_technician_name?: string; // Derived from user lookup
  last_job_numbers?: string[];     // Historical job numbers
  system_platform?: 'N4' | 'FX' | 'WEBs' | 'Mixed-ALC' | 'EBI-Honeywell' | 'Other';
  
  // Enhanced Team Context fields
  last_visit_by?: string;          // Last technician name
  last_visit_date?: string;        // ISO date string
  site_experience?: 'first_time' | 'familiar' | 'expert';
  handoff_notes?: string;          // From previous technician
  
  // Enhanced Access Intelligence fields
  best_arrival_times?: string[];   // Optimal arrival windows
  poc_name?: string;               // Point of contact name
  poc_phone?: string;              // Point of contact phone
  poc_available_hours?: string;    // Availability schedule
  backup_contact?: string;         // Secondary contact
  access_approach?: string;        // Successful approach notes
  common_access_issues?: string[]; // Known access problems
  scheduling_notes?: string;       // Coordination notes
  
  // Enhanced Project Status fields
  completion_status?: 'Design' | 'Construction' | 'Commissioning' | 'Operational' | 'Warranty';
  commissioning_notes?: string;    // Project commissioning status
  known_issues?: string[];         // Site-specific problems
  documentation_score?: number;    // 0-100 completeness rating
  original_team_contact?: string;  // Original installation team contact
  original_team_role?: string;     // Role of original team contact
  original_team_info?: string;     // Contact information
  when_to_contact_original?: string; // Guidance on when to reach out
  
  // Contact Information
  primary_contact: string;
  primary_contact_name?: string;  // Alternative primary contact name field
  contact_phone: string;
  contact_email: string;
  primary_contact_role?: string;
  
  // Secondary Contact (Optional)
  secondary_contact_name?: string;
  secondary_contact_phone?: string;
  secondary_contact_email?: string;
  secondary_contact_role?: string;
  
  // Site Access & Logistics
  access_procedure?: string;
  equipment_access_notes?: string;
  
  // Safety & PPE Requirements
  other_hazards_notes?: string;
  safety_notes?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  emergency_email?: string;
  security_contact?: string;
  security_phone?: string;
  
  // Additional Contact Information
  technical_contact?: string;
  technical_phone?: string;
  technical_email?: string;
  billing_contact?: string;
  billing_phone?: string;
  billing_email?: string;
  
  // Access & Security
  building_access_type?: string;
  building_access_details?: string;
  access_hours?: string;
  ppe_required?: boolean;
  badge_required?: boolean;
  training_required?: boolean;
  safety_requirements?: string;
  site_hazards?: string[];
  site_hazards_legacy?: string;
  
  // System Credentials (encrypted) - legacy fields
  bms_supervisor_ip?: string;
  web_supervisor_url?: string;
  workbench_username?: string;
  workbench_password?: string;
  platform_username?: string;
  platform_password?: string;
  pc_username?: string;
  pc_password?: string;
  different_platform_station_creds?: boolean;
  
  // Enhanced credentials system
  access_credentials?: any[];
  system_credentials?: any;
  windows_credentials?: any;
  service_credentials?: any;
  
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
  account_manager_id?: string;
  account_manager_name?: string;
  account_manager_phone?: string;
  account_manager_email?: string;
  account_manager?: string;
  region?: string;
  district?: string;
  territory?: string;
  escalation_contact?: string;
  escalation_phone?: string;
  
  // Contract Information
  contract_number?: string;
  contract_value?: number;
  contract_name?: string;
  contract_start_date?: string;
  contract_end_date?: string;
  
  // Enhanced Schema Fields from database migration
  equipment_locations?: any; // JSONB field for equipment tracking
  equipment_specific_procedures?: string;
  
  // Mailing Address Fields
  mailing_address?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip?: string;
  service_address?: string; // Different service address if needed
  service_address_different?: boolean;
  
  // Enhanced Contact Fields (matching new schema)
  emergency_contact_role?: string;
  security_contact_name?: string;
  security_contact_phone?: string;
  security_contact_email?: string;
  technical_contact_name?: string;
  technical_contact_phone?: string;
  technical_contact_email?: string;
  technical_contact_role?: string;
  billing_contact_name?: string;
  billing_contact_phone?: string;
  billing_contact_email?: string;
  billing_contact_role?: string;
  
  // Credential Status Fields (from customer_management_view)
  has_bms_credentials?: boolean;
  has_windows_credentials?: boolean;
  has_service_credentials?: boolean;
  has_remote_access_credentials?: boolean;
  total_credentials?: number;
  
  // New fields added for PreVisit workflow
  escort_required?: boolean;
  has_submittals?: boolean;
  has_floor_plans?: boolean;
  has_as_built?: boolean;
  has_sequence?: boolean;
  has_network_diagram?: boolean;
  
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

// Enhanced Pre-Visit Phase Interfaces
export interface SiteIntelligence {
  siteIdentity: {
    nickname: string;
    siteNumber: string;
    systemType: 'N4' | 'FX' | 'Mixed-ALC' | 'EBI-Honeywell' | 'Other';
    serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  };
  teamAssignment: {
    primaryTech: string;
    secondaryTech?: string;
    lastVisitBy: string;
    lastVisitDate: Date;
    siteExperience: 'first_time' | 'familiar' | 'expert';
  };
  documentation: {
    projectFolderUrl?: string;
    submittalsAvailable: boolean;
    asBuiltDrawings: boolean;
    floorPlans: boolean;
    sequenceOfOperations: boolean;
    lastDocumentUpdate?: Date;
    documentationScore: number; // 0-100 completeness score
  };
}

export interface ToolRecommendation {
  toolId: string;
  toolName: string;
  reason: 'required_for_system' | 'service_tier' | 'common_issue' | 'site_specific';
  priority: 'essential' | 'recommended' | 'optional';
  reasoning: string;
  isPreSelected: boolean;
}

export interface DocumentStatus {
  type: 'submittals' | 'as_built' | 'floor_plans' | 'sop' | 'project_folder';
  available: boolean;
  url?: string;
  lastUpdated?: Date;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'missing';
}

export interface TeamContext {
  primaryTechnician: {
    id: string;
    name: string;
    experience: string;
  };
  secondaryTechnician?: {
    id: string;
    name: string;
    experience: string;
  };
  lastVisit: {
    technicianId: string;
    technicianName: string;
    date: Date;
    notes?: string;
  };
  siteExperience: 'first_time' | 'familiar' | 'expert';
}

// Enhanced Site Intelligence System types
export interface SiteIntelligence {
  siteIdentity: {
    nickname: string;              // Rob's "quick reference" request
    siteNumber: string;            // Unique persistent ID across contracts
    legacyJobNumbers: string[];    // Track changing job numbers
    systemPlatform: 'N4' | 'FX' | 'WEBs' | 'Mixed-ALC' | 'EBI-Honeywell' | 'Other'; // John's system type request
    serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  };
  teamContext: {
    primaryTech: string;           // From Rob's spreadsheet reference
    secondaryTech?: string;
    lastVisitBy: string;
    lastVisitDate: Date;
    siteExperience: 'first_time' | 'familiar' | 'expert';
    handoffNotes: string;          // From previous technician
  };
  accessIntelligence: {
    bestArrivalTimes: string[];    // Rob's "timing" feedback
    pocAvailability: {
      name: string;
      phone: string;
      availableHours: string;
      backupContact?: string;
    };
    accessPatterns: {
      successfulApproach: string;
      commonIssues: string[];
      schedulingNotes: string;
    };
  };
  projectStatus: {
    completionStatus: 'Design' | 'Construction' | 'Commissioning' | 'Operational' | 'Warranty';
    commissioningNotes?: string;
    knownIssues: string[];
    documentationScore: number; // 0-100 completeness score
    originalTeamContact?: {
      name: string;
      role: string;
      contactInfo: string;
      whenToContact: string; // Rob's "complex site" feedback
    };
  };
}

export interface SiteContext {
  nickname: string;
  siteNumber: string;
  systemPlatform?: string;
  primaryTech?: string;
  secondaryTech?: string;
  lastVisit?: {
    technicianName: string;
    technicianId: string;
    date: Date;
    phase: number;
    notes?: string;
  };
  jobNumberHistory: string[];
}

export interface TechnicianInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  experience?: string;
}

// PreVisit workflow interfaces
export interface PreVisitFormData {
  // Site Intelligence
  siteIntelligence: {
    nickname: string;
    siteNumber: string;
    systemPlatform: string;
    primaryTechnicianId: string;
    secondaryTechnicianId: string;
    siteExperience: 'first_time' | 'familiar' | 'expert';
    lastVisitInfo: {
      date: string;
      by: string;
      notes: string;
    };
    knownIssues: string[];
  };
  
  // Contact Information
  contactInfo: {
    primary: {
      name: string;
      phone: string;
      email: string;
    };
    secondary?: {
      name: string;
      phone: string;
      email: string;
    };
    poc: {
      name: string;
      phone: string;
      availableHours: string;
    };
    address: string;
    accessApproach: string;
    parkingInstructions: string;
  };
  
  // Access Requirements
  accessRequirements: {
    badgeRequired: boolean;
    escortRequired: boolean;
    ppeRequired: boolean;
    safetyRequirements: string;
  };
  
  // Documentation
  documentation: {
    folderUrl: string;
    availability: {
      submittals: boolean;
      floorPlans: boolean;
      asBuilt: boolean;
      sequence: boolean;
      networkDiagram: boolean;
    };
    completenessScore: number;
    originalTeam: {
      contact: string;
      role: string;
      whenToContact: string;
    };
  };
  
  // Tools
  tools: {
    selectedTools: string[];
    systemSpecificTools: string[];
    spareParts: string[];
    additionalNotes: string;
  };
  
  // Checklist
  checklist: {
    contactConfirmed: boolean;
    accessPlanReviewed: boolean;
    credentialsVerified: boolean;
    toolsLoaded: boolean;
    notesReviewed: boolean;
    safetyReviewed: boolean;
  };
}

export interface PrevisitPreparation {
  id: string;
  customer_id: string;
  visit_id?: string;
  
  // Section completion flags
  site_intelligence_complete: boolean;
  contact_verification_complete: boolean;
  documentation_review_complete: boolean;
  tools_preparation_complete: boolean;
  checklist_complete: boolean;
  
  // Documentation status
  has_submittals: boolean;
  has_floor_plans: boolean;
  has_as_built: boolean;
  has_sequence: boolean;
  has_network_diagram: boolean;
  documentation_score: number;
  
  // Tool selections (JSON)
  selected_tools: string;
  system_specific_tools: string;
  spare_parts_selected: string;
  additional_tools_notes?: string;
  
  // Checklist progress
  contact_confirmed: boolean;
  access_plan_reviewed_flag: boolean;
  credentials_verified: boolean;
  tools_loaded: boolean;
  notes_reviewed: boolean;
  safety_reviewed: boolean;
  
  // Progress tracking
  overall_progress: number;
  sections_completed: number;
  preparation_status: 'pending' | 'in_progress' | 'completed';
  
  // Session data
  auto_save_data?: any;
  last_activity: string;
  session_token?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface ToolCatalogItem {
  id: string;
  tool_id: string;
  tool_name: string;
  category: 'standard' | 'niagara' | 'johnson' | 'honeywell' | 'spareparts';
  subcategory?: string;
  icon_name?: string;
  is_required: boolean;
  system_platforms: string[];
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface PreVisitData {
  customer: Customer;
  preparation?: PrevisitPreparation;
  tools: ToolCatalogItem[];
  formData: PreVisitFormData;
}

// Service tier types are now centralized in serviceTiers.ts
export type { ServiceTierConfig } from './serviceTiers';
