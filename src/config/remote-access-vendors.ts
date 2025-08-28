import { VendorConfig, RemoteAccessVendorType, VncSoftwareType } from '@/types/remote-access';

// Validation helpers
const validateTeamViewerId = (value: string): string | null => {
  if (!value) return null;
  const cleaned = value.replace(/\s/g, '');
  if (!/^\d{9}$/.test(cleaned)) {
    return 'TeamViewer ID must be exactly 9 digits';
  }
  return null;
};

const validateIPAddress = (value: string): string | null => {
  if (!value) return null;
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const fqdnRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
  
  if (!ipRegex.test(value) && !fqdnRegex.test(value)) {
    return 'Must be a valid IP address or FQDN';
  }
  return null;
};

const validatePort = (value: string): string | null => {
  if (!value) return null;
  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    return 'Port must be between 1 and 65535';
  }
  return null;
};

const validateEmail = (value: string): string | null => {
  if (!value) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Must be a valid email address';
  }
  return null;
};

const validateVncPassword = (value: string): string | null => {
  if (!value) return null;
  if (value.length > 8) {
    return 'VNC passwords are limited to 8 characters';
  }
  return null;
};

const validateCrdPin = (value: string): string | null => {
  if (!value) return null;
  if (!/^\d{6}$/.test(value)) {
    return 'Chrome Remote Desktop PIN must be exactly 6 digits';
  }
  return null;
};

const formatTeamViewerId = (value: string): string => {
  const cleaned = value.replace(/\s/g, '');
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)}`;
  }
  return value;
};

export const VENDOR_CONFIGS: VendorConfig[] = [
  // Cloud-Based Solutions
  {
    vendor: RemoteAccessVendorType.TEAMVIEWER,
    label: 'TeamViewer',
    category: 'cloud',
    icon: 'Monitor',
    description: 'Popular remote desktop solution with ID-based connections',
    fields: [
      {
        key: 'teamviewer_id',
        label: 'TeamViewer ID',
        type: 'text',
        required: true,
        placeholder: '123 456 789',
        helpText: 'Found in TeamViewer → Help → About TeamViewer',
        example: '123 456 789',
        validation: validateTeamViewerId
      },
      {
        key: 'teamviewer_password',
        label: 'Password',
        type: 'password',
        required: true,
        placeholder: 'Unattended access password',
        helpText: 'Set in TeamViewer → Extras → Options → Security → Personal Password'
      },
      {
        key: 'teamviewer_alias',
        label: 'Computer Name/Alias',
        type: 'text',
        placeholder: 'Office-BMS-PC',
        helpText: 'Display name shown in TeamViewer'
      }
    ]
  },
  
  {
    vendor: RemoteAccessVendorType.ANYDESK,
    label: 'AnyDesk',
    category: 'cloud',
    icon: 'Laptop',
    description: 'Fast remote desktop with numeric IDs or custom aliases',
    fields: [
      {
        key: 'anydesk_address',
        label: 'AnyDesk Address',
        type: 'text',
        required: true,
        placeholder: '123456789 or custom-alias@ad',
        helpText: 'Found in AnyDesk main window or set as custom alias',
        example: '987654321 or bms-server@ad'
      },
      {
        key: 'anydesk_password',
        label: 'Unattended Access Password',
        type: 'password',
        required: true,
        placeholder: 'Password for unattended access',
        helpText: 'Set in AnyDesk → Settings → Security → Unlock Security Settings'
      }
    ]
  },
  
  {
    vendor: RemoteAccessVendorType.REMOTEPC,
    label: 'RemotePC',
    category: 'cloud',
    icon: 'Cloud',
    description: 'Cloud-based remote access with account management',
    fields: [
      {
        key: 'remotepc_email',
        label: 'Account Email',
        type: 'email',
        required: true,
        placeholder: 'user@company.com',
        helpText: 'RemotePC account email address',
        validation: validateEmail
      },
      {
        key: 'remotepc_computer_name',
        label: 'Computer Name',
        type: 'text',
        required: true,
        placeholder: 'BMS-Server-01',
        helpText: 'Name of the computer as shown in RemotePC'
      },
      {
        key: 'remotepc_personal_key',
        label: 'Personal Key',
        type: 'password',
        placeholder: 'Optional personal key',
        helpText: 'Additional security key if configured'
      }
    ]
  },
  
  {
    vendor: RemoteAccessVendorType.CHROME_REMOTE_DESKTOP,
    label: 'Chrome Remote Desktop',
    category: 'cloud',
    icon: 'Chrome',
    description: 'Google Chrome browser-based remote access',
    fields: [
      {
        key: 'crd_google_account',
        label: 'Google Account',
        type: 'email',
        required: true,
        placeholder: 'user@gmail.com',
        helpText: 'Google account used for Chrome Remote Desktop',
        validation: validateEmail
      },
      {
        key: 'crd_pin',
        label: 'Access PIN',
        type: 'password',
        required: true,
        placeholder: '123456',
        maxLength: 6,
        helpText: '6-digit PIN set during remote access setup',
        validation: validateCrdPin
      }
    ]
  },
  
  // Direct Connection Methods
  {
    vendor: RemoteAccessVendorType.WINDOWS_RDP,
    label: 'Windows RDP',
    category: 'direct',
    icon: 'Monitor',
    description: 'Built-in Windows Remote Desktop Protocol',
    fields: [
      {
        key: 'rdp_host_address',
        label: 'Host Address',
        type: 'text',
        required: true,
        placeholder: '192.168.1.100 or server.company.com',
        helpText: 'IP address or hostname of the computer',
        example: '192.168.1.100',
        validation: validateIPAddress
      },
      {
        key: 'rdp_port',
        label: 'Port',
        type: 'number',
        placeholder: '3389',
        helpText: 'RDP port (default: 3389)',
        validation: validatePort
      },
      {
        key: 'rdp_username',
        label: 'Username',
        type: 'text',
        required: true,
        placeholder: 'administrator',
        helpText: 'Windows username for login'
      },
      {
        key: 'rdp_password',
        label: 'Password',
        type: 'password',
        required: true,
        placeholder: 'Windows user password',
        helpText: 'Password for the Windows user account'
      },
      {
        key: 'rdp_domain',
        label: 'Domain (Optional)',
        type: 'text',
        placeholder: 'COMPANY',
        helpText: 'Windows domain if applicable'
      }
    ]
  },
  
  {
    vendor: RemoteAccessVendorType.REALVNC,
    label: 'RealVNC',
    category: 'direct',
    icon: 'Monitor',
    description: 'Professional VNC remote access solution',
    fields: [
      {
        key: 'vnc_host_address',
        label: 'Host Address',
        type: 'text',
        required: true,
        placeholder: '192.168.1.100',
        helpText: 'IP address or hostname of the VNC server',
        validation: validateIPAddress
      },
      {
        key: 'vnc_port',
        label: 'Port',
        type: 'number',
        placeholder: '5900',
        helpText: 'VNC port (default: 5900 for display :0)',
        validation: validatePort
      },
      {
        key: 'vnc_password',
        label: 'VNC Password',
        type: 'password',
        required: true,
        maxLength: 8,
        placeholder: 'VNC password (max 8 chars)',
        helpText: 'VNC authentication password',
        validation: validateVncPassword
      },
      {
        key: 'vnc_display_number',
        label: 'Display Number',
        type: 'number',
        placeholder: '0',
        helpText: 'VNC display number (usually 0)'
      }
    ]
  },
  
  {
    vendor: RemoteAccessVendorType.VNC_OTHER,
    label: 'VNC (Other)',
    category: 'direct',
    icon: 'Monitor',
    description: 'Other VNC software variants (TightVNC, UltraVNC, etc.)',
    fields: [
      {
        key: 'vnc_software',
        label: 'VNC Software',
        type: 'select',
        required: true,
        options: [
          { value: VncSoftwareType.TIGHTVNC, label: 'TightVNC' },
          { value: VncSoftwareType.ULTRAVNC, label: 'UltraVNC' },
          { value: VncSoftwareType.TIGERVNC, label: 'TigerVNC' },
          { value: VncSoftwareType.X11VNC, label: 'X11VNC' },
          { value: VncSoftwareType.OTHER, label: 'Other' }
        ],
        helpText: 'Specific VNC software in use'
      },
      {
        key: 'vnc_host_address',
        label: 'Host Address',
        type: 'text',
        required: true,
        placeholder: '192.168.1.100',
        helpText: 'IP address or hostname of the VNC server',
        validation: validateIPAddress
      },
      {
        key: 'vnc_port',
        label: 'Port',
        type: 'number',
        placeholder: '5900',
        helpText: 'VNC port (default: 5900)',
        validation: validatePort
      },
      {
        key: 'vnc_password',
        label: 'VNC Password',
        type: 'password',
        required: true,
        maxLength: 8,
        placeholder: 'VNC password (max 8 chars)',
        helpText: 'VNC authentication password',
        validation: validateVncPassword
      }
    ]
  }
];

// Helper function to get vendor config by type
export const getVendorConfig = (vendor: RemoteAccessVendorType): VendorConfig | undefined => {
  return VENDOR_CONFIGS.find(config => config.vendor === vendor);
};

// Helper function to get vendors by category
export const getVendorsByCategory = (category: 'cloud' | 'direct'): VendorConfig[] => {
  return VENDOR_CONFIGS.filter(config => config.category === category);
};

// Helper function to format field values
export const formatFieldValue = (vendor: RemoteAccessVendorType, field: string, value: string): string => {
  if (vendor === RemoteAccessVendorType.TEAMVIEWER && field === 'teamviewer_id') {
    return formatTeamViewerId(value);
  }
  return value;
};

// Helper function to get field validation
export const validateField = (vendor: RemoteAccessVendorType, field: string, value: string): string | null => {
  const config = getVendorConfig(vendor);
  if (!config) return null;
  
  const fieldConfig = config.fields.find(f => f.key === field);
  if (!fieldConfig || !fieldConfig.validation) return null;
  
  return fieldConfig.validation(value);
};
