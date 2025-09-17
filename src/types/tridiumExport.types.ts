// Tridium Export Data Types
// These types define the structure of parsed Tridium CSV exports

export interface ResourceExportData {
  // System Performance
  cpuUsage: number;
  memoryUsage: number;
  heapUsed: number;
  heapMax: number;
  uptime: string;
  
  // Capacity Information
  deviceCount: number;
  deviceLimit: number;
  pointCount: number;
  pointLimit: number;
  historyCount: number;
  
  // Engine Performance
  engineUsage: number;
  scanLifetime: number;
  scanPeak: number;
  componentCount: number;
  
  // License Information
  licenseUsage: string;
  
  // Raw data for detailed analysis
  rawMetrics: Record<string, string>;
}

export interface BACnetDeviceData {
  name: string;
  type: string;
  deviceId: string;
  status: 'ok' | 'unackedAlarm' | 'down' | 'fault';
  network: string;
  macAddress: string;
  vendor: string;
  model: string;
  firmwareVersion: string;
  health: string;
  enabled: boolean;
  lastSeen?: string;
}

export interface N2DeviceData {
  name: string;
  status: 'ok' | 'down' | 'unackedAlarm' | 'fault';
  address: number;
  controllerType: string;
}

export interface ProcessedTridiumExports {
  // File processing status
  processed: boolean;
  uploadTime: Date;
  filesProcessed: string[];
  
  // Parsed data
  resourceData?: ResourceExportData;
  bacnetDevices: BACnetDeviceData[];
  n2Devices: N2DeviceData[];
  
  // Summary statistics
  summary: {
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    devicesWithAlarms: number;
    systemHealthScore: number; // 0-100
    primaryVendors: Array<{ vendor: string; count: number }>;
    deviceTypes: Array<{ type: string; count: number }>;
  };
}

export interface TridiumFileUpload {
  file: File;
  type: 'resource' | 'bacnet' | 'n2' | 'platform' | 'unknown';
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
  data?: any;
}

// Parsing configuration options
export interface ParseOptions {
  skipEmptyLines: boolean;
  trimHeaders: boolean;
  dynamicTyping: boolean;
  delimiter?: string;
}

// Export file type detection patterns
export const FILE_TYPE_PATTERNS = {
  resource: /resource.*export/i,
  bacnet: /bacnet.*export/i,
  n2: /n2.*export/i,
  platform: /platform.*details/i,
  niagaranet: /niagaranet.*export/i
} as const;

export type ExportFileType = keyof typeof FILE_TYPE_PATTERNS;

// Status color mappings for UI display
export const STATUS_COLORS = {
  ok: 'green',
  unackedAlarm: 'orange',
  down: 'red',
  fault: 'red'
} as const;

// Device type categorization for grouping
export const DEVICE_CATEGORIES = {
  'AHU': 'Air Handling Units',
  'VAV': 'VAV Boxes',
  'CHWR': 'Chillers',
  'BOILER': 'Boilers',
  'FAN': 'Fans',
  'PUMP': 'Pumps',
  'TSI': 'Sensors',
  'SVAV': 'Special VAV',
  'UNT': 'Unit Controllers',
  'VMA': 'VMA Controllers',
  'VND': 'VND Controllers',
  'DX': 'DX Controllers'
} as const;
