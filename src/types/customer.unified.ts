/**
 * Unified Customer Type Definitions
 * This file serves as the single source of truth for customer data types
 * matching the ame_customers table structure exactly
 */

// Service Tier values - must match database CHECK constraint
export const SERVICE_TIERS = ['CORE', 'ASSURE', 'GUARDIAN'] as const;
export type ServiceTier = typeof SERVICE_TIERS[number];

// Contract Status values - must match database CHECK constraint  
export const CONTRACT_STATUSES = ['Active', 'Inactive', 'Pending', 'Expired'] as const;
export type ContractStatus = typeof CONTRACT_STATUSES[number];

// Site Experience values - must match database CHECK constraint
export const SITE_EXPERIENCES = ['first_time', 'familiar', 'expert'] as const;
export type SiteExperience = typeof SITE_EXPERIENCES[number];

// Completion Status values - must match database CHECK constraint
export const COMPLETION_STATUSES = ['Design', 'Construction', 'Commissioning', 'Operational', 'Warranty'] as const;
export type CompletionStatus = typeof COMPLETION_STATUSES[number];

/**
 * Core customer interface matching ame_customers table structure
 * All fields must align with database columns and types
 */
export interface UnifiedCustomer {
  // Primary identifiers
  id: string; // UUID in database
  customer_id: string; // Unique identifier (e.g., AME001)
  site_number?: string; // Unique site identifier (AME-YYYY-###)
  
  // Company and Site Information
  company_name: string;
  site_name: string;
  site_nickname?: string;
  site_address: string;
  
  // Service Information
  service_tier: ServiceTier;
  system_type: string;
  contract_status: ContractStatus;
  building_type?: string;
  system_architecture?: string;
  primary_bas_platform?: string;
  
  // Primary Contact
  primary_contact: string;
  contact_phone: string;
  contact_email: string;
  primary_contact_role?: string;
  
  // Secondary Contact (all optional)
  secondary_contact_name?: string;
  secondary_contact_phone?: string;
  secondary_contact_email?: string;
  secondary_contact_role?: string;
  
  // Emergency Contact
  emergency_contact?: string;
  emergency_phone?: string;
  emergency_email?: string;
  emergency_contact_role?: string;
  
  // Security Contact
  security_contact?: string;
  security_contact_name?: string;
  security_phone?: string;
  security_contact_phone?: string;
  security_contact_email?: string;
  
  // Billing Contact
  billing_contact?: string;
  billing_contact_name?: string;
  billing_phone?: string;
  billing_contact_phone?: string;
  billing_email?: string;
  billing_contact_email?: string;
  billing_contact_role?: string;
  
  // Technical Contact
  technical_contact?: string;
  technical_contact_name?: string;
  technical_phone?: string;
  technical_contact_phone?: string;
  technical_email?: string;
  technical_contact_email?: string;
  technical_contact_role?: string;
  
  // Technician Assignment (UUID references to users)
  primary_technician_id?: string;
  primary_technician_name?: string;
  primary_technician_phone?: string;
  primary_technician_email?: string;
  secondary_technician_id?: string;
  secondary_technician_name?: string;
  secondary_technician_phone?: string;
  secondary_technician_email?: string;
  
  // Account Management
  account_manager?: string;
  account_manager_id?: string;
  account_manager_name?: string;
  account_manager_phone?: string;
  account_manager_email?: string;
  escalation_contact?: string;
  escalation_phone?: string;
  
  // Access & Security
  building_access_type?: string;
  building_access_details?: string;
  access_hours?: string;
  access_procedure?: string;
  parking_instructions?: string;
  equipment_access_notes?: string;
  safety_requirements?: string;
  ppe_required: boolean;
  badge_required: boolean;
  training_required: boolean;
  
  // Site Hazards (array in database)
  site_hazards?: string | string[];
  other_hazards_notes?: string;
  safety_notes?: string;
  
  // System Access Credentials (legacy - kept for compatibility)
  bms_supervisor_ip?: string; // inet type in database
  web_supervisor_url?: string;
  workbench_username?: string;
  workbench_password?: string;
  platform_username?: string;
  platform_password?: string;
  pc_username?: string;
  pc_password?: string;
  remote_access: boolean;
  remote_access_type?: string;
  vpn_required: boolean;
  vpn_details?: string;
  different_platform_station_creds: boolean;
  
  // Service Schedule
  technician_assigned?: string;
  service_frequency?: string;
  next_due?: string | Date;
  last_service?: string | Date;
  special_instructions?: string;
  
  // Contract Information
  contract_start_date?: string | Date;
  contract_end_date?: string | Date;
  annual_contract_value?: number;
  payment_terms?: string;
  
  // Google Drive Integration
  drive_folder_id?: string;
  drive_folder_url?: string;
  
  // Mailing Address (if different)
  service_address?: string;
  service_address_different?: boolean;
  mailing_address?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip?: string;
  
  // Equipment & Location (JSONB in database)
  equipment_list?: any[] | any;
  equipment_locations?: any[] | any;
  equipment_specific_procedures?: string;
  
  // Site Intelligence
  region?: string;
  district?: string;
  territory?: string;
  site_timezone?: string;
  coordinates?: string; // point type in database
  
  // Historical Data
  last_job_numbers?: string[];
  last_visit_by?: string;
  last_visit_date?: string | Date;
  
  // Experience & Knowledge
  site_experience?: SiteExperience;
  handoff_notes?: string;
  best_arrival_time?: string;
  best_arrival_times?: string[];
  poc_name?: string;
  poc_phone?: string;
  poc_available_hours?: string;
  backup_contact?: string;
  access_approach?: string;
  common_access_issues?: string[];
  scheduling_notes?: string;
  
  // Project Status
  completion_status?: CompletionStatus;
  commissioning_notes?: string;
  known_issues?: string[];
  documentation_score?: number; // 0-100
  original_team_contact?: string;
  original_team_role?: string;
  original_team_info?: string;
  when_to_contact_original?: string;
  
  // System fields
  created_at?: string | Date;
  updated_at?: string | Date;
  created_by?: string;
  updated_by?: string;
  
  // Computed fields from views (not in base table)
  has_active_contracts?: boolean;
  total_contract_value?: number;
  has_bms_credentials?: boolean;
  has_windows_credentials?: boolean;
  has_service_credentials?: boolean;
  has_remote_access_credentials?: boolean;
  
  // Document availability flags (for workflow)
  has_submittals?: boolean;
  has_floor_plans?: boolean;
  has_as_built?: boolean;
  has_sequence?: boolean;
  has_network_diagram?: boolean;
}

/**
 * Form data interface for creating/editing customers
 * Extends UnifiedCustomer with additional UI-specific fields
 */
export interface CustomerFormData extends UnifiedCustomer {
  // Enhanced credentials (stored separately in customer_system_credentials)
  access_credentials?: any[];
  system_credentials?: any;
  windows_credentials?: any;
  service_credentials?: any;
}

/**
 * Helper to ensure site_hazards is always an array
 */
export function normalizeSiteHazards(hazards: string | string[] | undefined | null): string[] {
  if (!hazards) return [];
  if (Array.isArray(hazards)) return hazards;
  return [hazards];
}

/**
 * Helper to format date fields consistently
 */
export function normalizeDate(date: string | Date | undefined | null): string | null {
  if (!date) return null;
  if (typeof date === 'string') return date;
  return date.toISOString().split('T')[0];
}

/**
 * Helper to prepare customer data for database operations
 */
export function prepareCustomerForDatabase(customer: Partial<CustomerFormData>): Partial<UnifiedCustomer> {
  const cleaned = { ...customer };
  
  // Ensure site_hazards is properly formatted
  if (cleaned.site_hazards) {
    cleaned.site_hazards = normalizeSiteHazards(cleaned.site_hazards);
  }
  
  // Normalize date fields
  cleaned.next_due = normalizeDate(cleaned.next_due);
  cleaned.last_service = normalizeDate(cleaned.last_service);
  cleaned.contract_start_date = normalizeDate(cleaned.contract_start_date);
  cleaned.contract_end_date = normalizeDate(cleaned.contract_end_date);
  cleaned.last_visit_date = normalizeDate(cleaned.last_visit_date);
  
  // Ensure boolean fields have defaults
  cleaned.ppe_required = cleaned.ppe_required ?? true;
  cleaned.badge_required = cleaned.badge_required ?? false;
  cleaned.training_required = cleaned.training_required ?? false;
  cleaned.remote_access = cleaned.remote_access ?? false;
  cleaned.vpn_required = cleaned.vpn_required ?? false;
  cleaned.different_platform_station_creds = cleaned.different_platform_station_creds ?? false;
  cleaned.service_address_different = cleaned.service_address_different ?? false;
  
  // Ensure service_tier has a default
  if (!cleaned.service_tier) {
    cleaned.service_tier = 'CORE';
  }
  
  // Ensure contract_status has a default
  if (!cleaned.contract_status) {
    cleaned.contract_status = 'Active';
  }
  
  // Remove UI-only fields
  delete (cleaned as any).access_credentials;
  delete (cleaned as any).system_credentials;
  delete (cleaned as any).windows_credentials;
  delete (cleaned as any).service_credentials;
  
  // Remove computed fields
  delete cleaned.has_active_contracts;
  delete cleaned.total_contract_value;
  delete cleaned.has_bms_credentials;
  delete cleaned.has_windows_credentials;
  delete cleaned.has_service_credentials;
  delete cleaned.has_remote_access_credentials;
  
  return cleaned;
}

/**
 * Type guard to check if a value is a valid ServiceTier
 */
export function isServiceTier(value: any): value is ServiceTier {
  return SERVICE_TIERS.includes(value);
}

/**
 * Type guard to check if a value is a valid ContractStatus
 */
export function isContractStatus(value: any): value is ContractStatus {
  return CONTRACT_STATUSES.includes(value);
}
