/**
 * Standardized Customer Options and Constants
 * This file ensures all dropdowns and selections are consistent across the application
 */

import { 
  SERVICE_TIERS, 
  CONTRACT_STATUSES, 
  SITE_EXPERIENCES,
  COMPLETION_STATUSES,
  ServiceTier,
  ContractStatus,
  SiteExperience,
  CompletionStatus
} from '@/types/customer.unified';

// Service Tier Options with metadata
export const SERVICE_TIER_OPTIONS = [
  { value: 'CORE' as ServiceTier, label: 'Core', color: 'blue', description: 'Basic maintenance service' },
  { value: 'ASSURE' as ServiceTier, label: 'Assure', color: 'green', description: 'Enhanced service with priority support' },
  { value: 'GUARDIAN' as ServiceTier, label: 'Guardian', color: 'purple', description: 'Premium service with 24/7 support' }
] as const;

// Contract Status Options
export const CONTRACT_STATUS_OPTIONS = [
  { value: 'Active' as ContractStatus, label: 'Active', color: 'green' },
  { value: 'Inactive' as ContractStatus, label: 'Inactive', color: 'gray' },
  { value: 'Pending' as ContractStatus, label: 'Pending', color: 'yellow' },
  { value: 'Expired' as ContractStatus, label: 'Expired', color: 'red' }
] as const;

// Building Types (from database)
export const BUILDING_TYPE_OPTIONS = [
  { value: 'office', label: 'Office Building' },
  { value: 'retail', label: 'Retail' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'healthcare', label: 'Healthcare Facility' },
  { value: 'education', label: 'Educational Institution' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'datacenter', label: 'Data Center' },
  { value: 'warehouse', label: 'Warehouse' },
  { value: 'mixed_use', label: 'Mixed Use' },
  { value: 'residential', label: 'Residential Complex' },
  { value: 'government', label: 'Government Building' },
  { value: 'other', label: 'Other' }
] as const;

// System Architecture Options (from database)
export const SYSTEM_ARCHITECTURE_OPTIONS = [
  { value: 'standalone', label: 'Standalone System' },
  { value: 'distributed', label: 'Distributed Architecture' },
  { value: 'centralized', label: 'Centralized System' },
  { value: 'hybrid', label: 'Hybrid Architecture' },
  { value: 'cloud_based', label: 'Cloud-Based' },
  { value: 'edge_computing', label: 'Edge Computing' },
  { value: 'master_slave', label: 'Master/Slave' },
  { value: 'peer_to_peer', label: 'Peer-to-Peer' },
  { value: 'other', label: 'Other' }
] as const;

// BAS Platform Options (from database)
export const BAS_PLATFORM_OPTIONS = [
  // Niagara Platforms
  { value: 'N4', label: 'Niagara 4', category: 'Tridium' },
  { value: 'AX', label: 'Niagara AX', category: 'Tridium' },
  { value: 'R2', label: 'Niagara R2', category: 'Tridium' },
  
  // Johnson Controls
  { value: 'FX', label: 'Facility Explorer FX', category: 'Johnson Controls' },
  { value: 'Metasys', label: 'Metasys', category: 'Johnson Controls' },
  { value: 'P2000', label: 'P2000', category: 'Johnson Controls' },
  
  // Honeywell
  { value: 'WEBs', label: 'WEBs', category: 'Honeywell' },
  { value: 'EBI-Honeywell', label: 'EBI', category: 'Honeywell' },
  { value: 'Opus', label: 'Opus', category: 'Honeywell' },
  
  // Schneider Electric
  { value: 'EcoStruxure', label: 'EcoStruxure', category: 'Schneider Electric' },
  { value: 'StruxureWare', label: 'StruxureWare', category: 'Schneider Electric' },
  { value: 'TAC-Vista', label: 'TAC Vista', category: 'Schneider Electric' },
  
  // Siemens
  { value: 'Desigo', label: 'Desigo CC', category: 'Siemens' },
  { value: 'Apogee', label: 'Apogee', category: 'Siemens' },
  { value: 'Insight', label: 'Insight', category: 'Siemens' },
  
  // Others
  { value: 'BACnet', label: 'Generic BACnet', category: 'Other' },
  { value: 'Lonworks', label: 'LonWorks', category: 'Other' },
  { value: 'Modbus', label: 'Modbus', category: 'Other' },
  { value: 'KNX', label: 'KNX', category: 'Other' },
  { value: 'Custom', label: 'Custom System', category: 'Other' },
  { value: 'Unknown', label: 'Unknown', category: 'Other' }
] as const;

// Contact Role Options (from database)
export const CONTACT_ROLE_OPTIONS = [
  { value: 'facility_manager', label: 'Facility Manager' },
  { value: 'building_engineer', label: 'Building Engineer' },
  { value: 'property_manager', label: 'Property Manager' },
  { value: 'operations_director', label: 'Operations Director' },
  { value: 'maintenance_supervisor', label: 'Maintenance Supervisor' },
  { value: 'chief_engineer', label: 'Chief Engineer' },
  { value: 'energy_manager', label: 'Energy Manager' },
  { value: 'security_manager', label: 'Security Manager' },
  { value: 'it_manager', label: 'IT Manager' },
  { value: 'general_manager', label: 'General Manager' },
  { value: 'owner', label: 'Owner' },
  { value: 'tenant_coordinator', label: 'Tenant Coordinator' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'admin_assistant', label: 'Administrative Assistant' },
  { value: 'other', label: 'Other' }
] as const;

// Access Method Options (from database)
export const ACCESS_METHOD_OPTIONS = [
  { value: 'key', label: 'Physical Key' },
  { value: 'keypad', label: 'Keypad Code' },
  { value: 'badge', label: 'Badge/Card Access' },
  { value: 'biometric', label: 'Biometric' },
  { value: 'escort', label: 'Escort Required' },
  { value: 'remote_unlock', label: 'Remote Unlock' },
  { value: 'call_ahead', label: 'Call Ahead Required' },
  { value: 'business_hours', label: 'Business Hours Only' },
  { value: '24_7', label: '24/7 Access' },
  { value: 'appointment', label: 'Appointment Required' },
  { value: 'security_desk', label: 'Check-in at Security' },
  { value: 'loading_dock', label: 'Loading Dock Access' },
  { value: 'parking_garage', label: 'Parking Garage Entry' },
  { value: 'combination', label: 'Combination Lock' },
  { value: 'other', label: 'Other' }
] as const;

// Service Frequency Options (from database)
export const SERVICE_FREQUENCY_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi_weekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'bi_monthly', label: 'Bi-Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'semi_annual', label: 'Semi-Annual' },
  { value: 'annual', label: 'Annual' },
  { value: 'as_needed', label: 'As Needed' },
  { value: 'on_call', label: 'On Call' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'other', label: 'Other' }
] as const;

// Site Experience Options
export const SITE_EXPERIENCE_OPTIONS = [
  { value: 'first_time' as SiteExperience, label: 'First Time', color: 'yellow', icon: '🆕' },
  { value: 'familiar' as SiteExperience, label: 'Familiar', color: 'blue', icon: '✓' },
  { value: 'expert' as SiteExperience, label: 'Expert', color: 'green', icon: '⭐' }
] as const;

// Completion Status Options  
export const COMPLETION_STATUS_OPTIONS = [
  { value: 'Design' as CompletionStatus, label: 'Design Phase', color: 'blue' },
  { value: 'Construction' as CompletionStatus, label: 'Under Construction', color: 'orange' },
  { value: 'Commissioning' as CompletionStatus, label: 'Commissioning', color: 'yellow' },
  { value: 'Operational' as CompletionStatus, label: 'Operational', color: 'green' },
  { value: 'Warranty' as CompletionStatus, label: 'Warranty Period', color: 'purple' }
] as const;

// Common Site Hazards Options
export const SITE_HAZARD_OPTIONS = [
  { value: 'heights', label: 'Working at Heights' },
  { value: 'electrical', label: 'Electrical Hazards' },
  { value: 'confined_space', label: 'Confined Spaces' },
  { value: 'chemicals', label: 'Chemical Exposure' },
  { value: 'asbestos', label: 'Asbestos' },
  { value: 'lead_paint', label: 'Lead Paint' },
  { value: 'hot_work', label: 'Hot Work Required' },
  { value: 'lockout_tagout', label: 'Lockout/Tagout Required' },
  { value: 'fall_hazard', label: 'Fall Hazards' },
  { value: 'noise', label: 'High Noise Levels' },
  { value: 'temperature', label: 'Extreme Temperatures' },
  { value: 'moving_equipment', label: 'Moving Equipment' },
  { value: 'water_hazard', label: 'Water/Drowning Hazard' },
  { value: 'radiation', label: 'Radiation' },
  { value: 'biological', label: 'Biological Hazards' },
  { value: 'other', label: 'Other Hazards' }
] as const;

// Common Access Issues Options
export const ACCESS_ISSUE_OPTIONS = [
  { value: 'parking', label: 'Limited Parking' },
  { value: 'security_clearance', label: 'Security Clearance Required' },
  { value: 'background_check', label: 'Background Check Required' },
  { value: 'drug_test', label: 'Drug Testing Required' },
  { value: 'training_cert', label: 'Training Certification Required' },
  { value: 'union_site', label: 'Union Site Restrictions' },
  { value: 'covid_protocol', label: 'COVID Protocols' },
  { value: 'restricted_hours', label: 'Restricted Access Hours' },
  { value: 'construction', label: 'Active Construction' },
  { value: 'tenant_occupied', label: 'Tenant Occupied Areas' },
  { value: 'sensitive_areas', label: 'Sensitive/Secure Areas' },
  { value: 'photography_restricted', label: 'No Photography Allowed' },
  { value: 'tools_restricted', label: 'Tool Restrictions' },
  { value: 'elevator_access', label: 'Limited Elevator Access' },
  { value: 'other', label: 'Other Issues' }
] as const;

// System Type Options
export const SYSTEM_TYPE_OPTIONS = [
  { value: 'hvac', label: 'HVAC Control' },
  { value: 'bas', label: 'Building Automation System' },
  { value: 'ems', label: 'Energy Management System' },
  { value: 'lighting', label: 'Lighting Control' },
  { value: 'access_control', label: 'Access Control' },
  { value: 'fire_alarm', label: 'Fire Alarm Integration' },
  { value: 'integrated', label: 'Integrated Systems' },
  { value: 'scada', label: 'SCADA' },
  { value: 'plc', label: 'PLC System' },
  { value: 'other', label: 'Other' }
] as const;

// Remote Access Type Options
export const REMOTE_ACCESS_OPTIONS = [
  { value: 'vpn', label: 'VPN Connection' },
  { value: 'teamviewer', label: 'TeamViewer' },
  { value: 'rdp', label: 'Remote Desktop (RDP)' },
  { value: 'anydesk', label: 'AnyDesk' },
  { value: 'logmein', label: 'LogMeIn' },
  { value: 'webex', label: 'WebEx' },
  { value: 'bomgar', label: 'Bomgar/BeyondTrust' },
  { value: 'screenconnect', label: 'ScreenConnect' },
  { value: 'citrix', label: 'Citrix' },
  { value: 'ssh', label: 'SSH' },
  { value: 'web_portal', label: 'Web Portal' },
  { value: 'none', label: 'No Remote Access' },
  { value: 'other', label: 'Other' }
] as const;

/**
 * Helper function to get option by value
 */
export function getOptionByValue<T extends { value: string }>(
  options: readonly T[],
  value: string | undefined | null
): T | undefined {
  if (!value) return undefined;
  return options.find(opt => opt.value === value);
}

/**
 * Helper function to get label for a value
 */
export function getOptionLabel<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string | undefined | null
): string {
  const option = getOptionByValue(options, value);
  return option?.label || value || '';
}

/**
 * Helper to get color for service tier
 */
export function getServiceTierColor(tier: ServiceTier | undefined | null): string {
  const option = getOptionByValue(SERVICE_TIER_OPTIONS, tier);
  return option?.color || 'gray';
}

/**
 * Helper to get color for contract status
 */
export function getContractStatusColor(status: ContractStatus | undefined | null): string {
  const option = getOptionByValue(CONTRACT_STATUS_OPTIONS, status);
  return option?.color || 'gray';
}
