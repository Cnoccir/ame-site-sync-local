// Export format types based on actual Tridium exports
export type TridiumExportFormat = 
  | 'N2Export'           // N2 network device exports
  | 'BACnetExport'       // BACnet device inventory
  | 'ResourceExport'     // System resource metrics  
  | 'NiagaraNetExport'   // Niagara station network
  | 'PlatformDetails'    // Platform information text files
  | 'Unknown';

// Export format specifications
export interface TridiumFormatSpec {
  format: TridiumExportFormat;
  displayName: string;
  description: string;
  fileTypes: string[];
  requiredColumns: string[];
  optionalColumns: string[];
  identifierColumns: string[];  // Columns that uniquely identify this format
  keyColumn: string;            // Primary identifier column
  statusColumn?: string;        // Status/health column if present
  valueColumn?: string;         // Value column for metrics
}

// Data type categories for processing
export type TridiumDataCategory = 
  | 'networkDevices'     // Device inventories (N2, BACnet, etc.)
  | 'systemMetrics'      // Resource and platform metrics
  | 'networkTopology'    // Niagara network connections
  | 'platformInfo'       // Platform details and specifications
  | 'unknown';

export interface TridiumDataTypes {
  networkDevices: {
    formats: ['N2Export', 'BACnetExport'];
    requiredColumns: ['Name', 'Status'];
    optionalColumns: ['Address', 'Controller Type', 'Device ID', 'Vendor', 'Model', 'Health'];
  };
  systemMetrics: {
    formats: ['ResourceExport'];
    requiredColumns: ['Name', 'Value'];
    optionalColumns: [];
  };
  networkTopology: {
    formats: ['NiagaraNetExport'];
    requiredColumns: ['Name', 'Type', 'Address'];
    optionalColumns: ['Path', 'Fox Port', 'Platform Status', 'Client Conn', 'Server Conn'];
  };
  platformInfo: {
    formats: ['PlatformDetails'];
    requiredColumns: [];
    optionalColumns: [];
  };
  unknown: {
    formats: ['Unknown'];
    requiredColumns: [];
    optionalColumns: [];
  };
}

export interface ParsedStatus {
  status: 'ok' | 'down' | 'alarm' | 'fault' | 'unknown';
  severity: 'normal' | 'warning' | 'critical';
  details: string[];
  badge: {
    text: string;
    variant: 'default' | 'success' | 'warning' | 'destructive';
  };
}

export interface ParsedValue {
  value: number | string;
  unit?: string;
  formatted: string;
  type: 'percentage' | 'memory' | 'count' | 'timestamp' | 'duration' | 'text';
  metadata?: Record<string, any>;
}

export interface CSVColumn {
  key: string;
  label: string;
  type: 'text' | 'number' | 'status' | 'value' | 'date';
  visible: boolean;
  sortable: boolean;
  width?: number;
}

export interface TridiumDataRow {
  id: string;
  selected: boolean;
  data: Record<string, any>;
  parsedStatus?: ParsedStatus;
  parsedValues?: Record<string, ParsedValue>;
}

export interface TridiumDataset {
  id: string;
  filename: string;
  format: TridiumExportFormat;
  category: TridiumDataCategory;
  columns: CSVColumn[];
  rows: TridiumDataRow[];
  summary: DatasetSummary;
  formatSpec: TridiumFormatSpec;
  metadata: {
    totalRows: number;
    totalColumns: number;
    parseErrors: string[];
    parseWarnings: string[];
    uploadedAt: Date;
    fileSize: number;
    processingTime: number;
    isValid: boolean;
    confidence: number;  // 0-100, confidence in format detection
  };
  rawContent?: string;  // Store original content for re-parsing
}

export interface DatasetSummary {
  totalDevices: number;
  statusBreakdown: {
    ok: number;
    down: number;
    alarm: number;
    fault: number;
    unknown: number;
  };
  typeBreakdown: Record<string, number>;
  criticalFindings: string[];
  recommendations: string[];
}

export interface SelectionState {
  selectedRows: Set<string>;
  selectedColumns: Set<string>;
  filters: {
    status: string[];
    type: string[];
    custom: string;
  };
  presets: {
    name: string;
    rowFilter: (row: TridiumDataRow) => boolean;
    columnFilter: (column: CSVColumn) => boolean;
  }[];
}

export interface GeneratedSummary {
  title: string;
  overview: string;
  deviceBreakdown: string;
  criticalFindings: string[];
  recommendations: string[];
  detailedData: {
    headers: string[];
    rows: string[][];
  };
}

export interface TridiumAnalysisResult {
  datasets: TridiumDataset[];
  combinedSummary: GeneratedSummary;
  selection: SelectionState;
  exportData: {
    csvData: string;
    reportSection: string;
    charts: any[];
  };
}

// Enhanced interfaces for health monitoring and network topology
export interface DeviceHealth {
  deviceId: string;
  deviceName: string;
  protocol: 'N2' | 'BACnet' | 'Niagara' | 'System' | 'Unknown';
  status: ParsedStatus;
  healthScore: number; // 0-100
  lastSeen?: Date;
  diagnostics: {
    connectivity: 'online' | 'offline' | 'intermittent';
    performance: 'good' | 'fair' | 'poor' | 'unknown';
    errors: string[];
    warnings: string[];
  };
  metadata: Record<string, any>;
}

export interface SystemResourceMetrics {
  stationId: string;
  stationName: string;
  platform: 'JACE' | 'Supervisor' | 'Workstation';
  model?: string;
  version?: string;
  resources: {
    cpu: {
      usage: number; // percentage
      load?: number;
    };
    memory: {
      used: number; // MB
      total: number; // MB
      percentage: number;
    };
    storage?: {
      used: number; // MB
      total: number; // MB
      percentage: number;
    };
    network?: {
      connections: number;
      throughput?: number;
    };
  };
  licensing: {
    points: { used: number; limit: number };
    histories?: { used: number; limit: number };
    devices?: { used: number; limit: number };
    kru?: { used: number; limit?: number }; // Kilo Resource Units
  };
  uptime?: string;
  timestamp: Date;
}

export interface NetworkTopology {
  rootNode: NetworkNode;
  totalDevices: number;
  protocolBreakdown: Record<string, number>;
  healthSummary: {
    healthy: number;
    degraded: number;
    offline: number;
    unknown: number;
  };
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'supervisor' | 'jace' | 'device' | 'network';
  protocol?: string;
  address?: string;
  status: ParsedStatus;
  children: NetworkNode[];
  parent?: NetworkNode;
  metadata: {
    model?: string;
    version?: string;
    vendor?: string;
    location?: string;
    [key: string]: any;
  };
}

// Service tier aligned health dashboard configuration
export interface HealthDashboardConfig {
  serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  enabledMetrics: {
    deviceStatus: boolean;
    resourceMonitoring: boolean;
    networkTopology: boolean;
    alerting: boolean;
    historicalTrends: boolean;
    predictiveAnalytics: boolean;
  };
  alertThresholds: {
    cpu: number;
    memory: number;
    deviceOffline: number; // minutes
    criticalAlarms: boolean;
  };
  refreshInterval: number; // seconds
}

// Enhanced dataset with health and topology information
export interface EnhancedTridiumDataset extends TridiumDataset {
  healthMetrics?: DeviceHealth[];
  resourceMetrics?: SystemResourceMetrics;
  networkTopology?: NetworkTopology;
  dashboardConfig?: HealthDashboardConfig;
}
