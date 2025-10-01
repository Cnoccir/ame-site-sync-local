import { TridiumFormatSpec, TridiumExportFormat } from '@/types/tridium';

/**
 * Format specifications for all supported Tridium export types
 * Based on analysis of actual export files
 */
export const TRIDIUM_FORMAT_SPECS: Record<TridiumExportFormat, TridiumFormatSpec> = {
  'N2Export': {
    format: 'N2Export',
    displayName: 'N2 Network Device Export',
    description: 'Johnson Controls N2 network device inventory with controller information',
    fileTypes: ['.csv'],
    requiredColumns: ['Name', 'Status', 'Address', 'Controller Type'],
    optionalColumns: ['Network', 'Zone', 'Location'],
    identifierColumns: ['Controller Type'],  // Unique identifier for N2 exports
    keyColumn: 'Name',
    statusColumn: 'Status'
  },

  'BACnetExport': {
    format: 'BACnetExport',
    displayName: 'BACnet Device Export',
    description: 'BACnet device inventory with vendor, model, and health information',
    fileTypes: ['.csv'],
    requiredColumns: ['Name', 'Type', 'Device ID', 'Status'],
    optionalColumns: [
      'Exts', 'Netwk', 'MAC Addr', 'Max APDU', 'Segmentation', 
      'Vendor', 'Model', 'Protocol Rev', 'Firmware Rev', 'App SW Version',
      'Encoding', 'Health', 'Enabled', 'Use Cov', 'Use Cov Property',
      'Max Cov Subscriptions', 'Cov Subscriptions'
    ],
    identifierColumns: ['Device ID', 'Vendor'],  // BACnet specific identifiers
    keyColumn: 'Name',
    statusColumn: 'Status'
  },

  'ResourceExport': {
    format: 'ResourceExport',
    displayName: 'System Resource Export',
    description: 'System resource metrics including CPU, memory, licensing, and capacity information',
    fileTypes: ['.csv'],
    requiredColumns: ['Name', 'Value'],
    optionalColumns: [],  // Resource exports are strict: exactly Name and Value
    identifierColumns: [],  // No unique identifiers - detected by exact column match
    keyColumn: 'Name',
    valueColumn: 'Value'
  },

  'NiagaraNetExport': {
    format: 'NiagaraNetExport',
    displayName: 'Niagara Network Export',
    description: 'Niagara station network topology with connection and platform status',
    fileTypes: ['.csv'],
    requiredColumns: ['Name', 'Type', 'Address', 'Status'],
    optionalColumns: [
      'Path', 'Exts', 'Fox Port', 'Use Foxs', 'Host Model', 'Host Model Version',
      'Version', 'Credential Store', 'Enabled', 'Health', 'Fault Cause',
      'Client Conn', 'Server Conn', 'Virtuals Enabled', 'Platform Status',
      'Platform User', 'Platform Password', 'Secure Platform', 'Platform Port'
    ],
    identifierColumns: ['Fox Port', 'Path', 'Platform Status'],  // Niagara specific
    keyColumn: 'Name',
    statusColumn: 'Status'
  },

  'PlatformDetails': {
    format: 'PlatformDetails',
    displayName: 'Platform Details',
    description: 'Platform information including modules, applications, and system specifications',
    fileTypes: ['.txt'],
    requiredColumns: [],  // Text file format - no columns
    optionalColumns: [],
    identifierColumns: ['Platform summary'],  // Text content identifier
    keyColumn: '',
    valueColumn: ''
  },

  'ModbusExport': {
    format: 'ModbusExport',
    displayName: 'Modbus Device Export',
    description: 'Modbus device inventory with slave addressing, polling configuration, and error statistics',
    fileTypes: ['.csv'],
    requiredColumns: ['Name', 'Address'],
    optionalColumns: [
      'Status', 'Slave ID', 'Connection Type', 'Register Count', 'Coil Count',
      'Polling Rate', 'Timeout', 'Error Count', 'Enabled', 'Type', 'Vendor', 'Model'
    ],
    identifierColumns: ['Slave ID', 'Connection Type'],  // Modbus specific identifiers
    keyColumn: 'Name',
    statusColumn: 'Status'
  },

  'Unknown': {
    format: 'Unknown',
    displayName: 'Unknown Format',
    description: 'Unrecognized file format',
    fileTypes: [],
    requiredColumns: [],
    optionalColumns: [],
    identifierColumns: [],
    keyColumn: '',
    statusColumn: ''
  }
};

/**
 * Get format specification by format type
 */
export function getFormatSpec(format: TridiumExportFormat): TridiumFormatSpec {
  return TRIDIUM_FORMAT_SPECS[format];
}

/**
 * Get all supported format specifications
 */
export function getAllFormatSpecs(): TridiumFormatSpec[] {
  return Object.values(TRIDIUM_FORMAT_SPECS).filter(spec => spec.format !== 'Unknown');
}

/**
 * Get format specifications by file type
 */
export function getFormatSpecsByFileType(fileType: string): TridiumFormatSpec[] {
  const lowerFileType = fileType.toLowerCase();
  return getAllFormatSpecs().filter(spec => 
    spec.fileTypes.some(type => type.toLowerCase() === lowerFileType)
  );
}
