// Remote Access System Types

export enum RemoteAccessVendorType {
  // Cloud-Based Solutions
  TEAMVIEWER = 'teamviewer',
  ANYDESK = 'anydesk',
  REMOTEPC = 'remotepc',
  SPLASHTOP = 'splashtop',
  CHROME_REMOTE_DESKTOP = 'chrome_remote_desktop',
  LOGMEIN = 'logmein',
  ZOHO_ASSIST = 'zoho_assist',
  PARSEC = 'parsec',
  
  // Direct Connection Methods
  WINDOWS_RDP = 'windows_rdp',
  REALVNC = 'realvnc',
  TIGHTVNC = 'tightvnc',
  ULTRAVNC = 'ultravnc',
  NOMACHINE = 'nomachine',
  RUSTDESK = 'rustdesk',
  
  // Generic VNC
  VNC_OTHER = 'vnc_other'
}

export enum VncSoftwareType {
  REALVNC = 'realvnc',
  TIGHTVNC = 'tightvnc',
  ULTRAVNC = 'ultravnc',
  TIGERVNC = 'tigervnc',
  X11VNC = 'x11vnc',
  OTHER = 'other'
}

export interface RemoteAccessCredential {
  id?: string;
  customer_id: string;
  vendor: RemoteAccessVendorType;
  display_name?: string;
  is_active: boolean;
  priority: number;
  
  // TeamViewer specific
  teamviewer_id?: string;
  teamviewer_password?: string;
  teamviewer_alias?: string;
  
  // AnyDesk specific
  anydesk_address?: string;
  anydesk_password?: string;
  
  // RDP specific
  rdp_host_address?: string;
  rdp_port?: number;
  rdp_username?: string;
  rdp_password?: string;
  rdp_domain?: string;
  
  // VNC specific
  vnc_host_address?: string;
  vnc_port?: number;
  vnc_password?: string;
  vnc_software?: VncSoftwareType;
  vnc_display_number?: number;
  
  // RemotePC specific
  remotepc_email?: string;
  remotepc_computer_name?: string;
  remotepc_personal_key?: string;
  
  // Chrome Remote Desktop specific
  crd_google_account?: string;
  crd_pin?: string;
  
  // LogMeIn specific
  logmein_email?: string;
  logmein_password?: string;
  logmein_computer_id?: string;
  
  // Generic cloud service fields
  cloud_account_email?: string;
  cloud_account_password?: string;
  cloud_session_id?: string;
  
  // Additional configuration
  connection_notes?: string;
  last_verified_at?: string;
  verification_notes?: string;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface VpnConfiguration {
  id?: string;
  customer_id: string;
  
  // VPN Details
  vpn_required: boolean;
  vpn_profile_name?: string;
  vpn_server_address?: string;
  vpn_username?: string;
  vpn_password?: string;
  
  // Configuration files
  vpn_config_file_url?: string;
  vpn_config_file_name?: string;
  
  // Connection instructions
  connection_instructions?: string;
  setup_notes?: string;
  network_requirements?: string;
  
  // Network context
  client_network_segment?: string;
  required_ports?: number[];
  firewall_notes?: string;
  
  // Status
  is_active: boolean;
  last_tested_at?: string;
  test_results?: string;
  
  // Metadata
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
}

export interface RemoteAccessSummary {
  customer_id: string;
  company_name: string;
  site_name: string;
  has_remote_access: boolean;
  primary_remote_access_vendor?: RemoteAccessVendorType;
  remote_access_priority: string[];
  remote_access_notes?: string;
  active_access_methods: number;
  vpn_required?: boolean;
  available_vendors: RemoteAccessVendorType[];
  updated_at?: string;
}

// Vendor configuration for form rendering
export interface VendorConfig {
  vendor: RemoteAccessVendorType;
  label: string;
  category: 'cloud' | 'direct';
  icon: string; // Lucide icon name
  description: string;
  fields: VendorFieldConfig[];
  validationRules?: ValidationRule[];
}

export interface VendorFieldConfig {
  key: string;
  label: string;
  type: 'text' | 'password' | 'email' | 'number' | 'select' | 'textarea';
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  pattern?: string;
  options?: { value: string; label: string }[];
  helpText?: string;
  example?: string;
  validation?: (value: string) => string | null;
}

export interface ValidationRule {
  field: string;
  validator: (credential: RemoteAccessCredential) => string | null;
}

// Form state for the credential manager
export interface RemoteAccessFormState {
  credentials: RemoteAccessCredential[];
  vpnConfiguration?: VpnConfiguration;
  errors: Record<string, string>;
  isDirty: boolean;
  isValid: boolean;
}
