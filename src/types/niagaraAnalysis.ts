/**
 * Unified Niagara Analysis JSON Output Schema
 * This schema defines the normalized output structure for all Niagara export parsers
 * supporting preventative maintenance reporting and system baselining.
 */

// Platform Identity Information
export interface PlatformIdentity {
  hostId: string;
  serialNumber?: string;
  model: string;
  product: string;
  stationName?: string;
  ipAddress?: string;
  niagaraVersion: string;
  operatingSystem: string;
  architecture: string;
  cpuCount: number;
  cpuType?: string;
  ram: {
    free: number;    // KB
    total: number;   // KB
    percentage: number;
  };
  disk?: {
    free: number;    // KB
    total: number;   // KB
    percentage: number;
  };
  jvmVersion: string;
  uptime?: string;
  lastBootTime?: Date;
}

// Resource Utilization Information
export interface ResourceUtilization {
  components: {
    count: number;
    limit?: number;
  };
  devices: {
    used: number;
    licensed: number;
    unlimited: boolean;
  };
  points: {
    used: number;
    licensed: number;
    unlimited: boolean;
  };
  histories: {
    count: number;
    limit?: number;
  };
  resourceUnits: {
    total: number;
    byCategory: {
      alarm?: number;
      component?: number;
      device?: number;
      history?: number;
      network?: number;
      program?: number;
      proxyExt?: number;
    };
    unit: 'kRU' | 'RU';
  };
  engine: {
    queues: {
      actions: { current: number; peak: number };
      longTimers: { current: number; peak: number };
      mediumTimers: { current: number; peak: number };
      shortTimers: { current: number; peak: number };
    };
    scanTimes: {
      lifetime: number;   // ms
      recent: number;     // ms
      peak: number;       // ms
      peakTime?: Date;
    };
    usage: number; // percentage
  };
  memory: {
    heap: {
      used: number;    // MB
      free: number;    // MB
      total: number;   // MB
      max: number;     // MB
    };
    physical: {
      used: number;    // MB
      total: number;   // MB
      percentage: number;
    };
  };
  cpu: {
    usage: number; // percentage
  };
}

// Network Inventory and Device Information
export interface NetworkInventory {
  totalDevices: number;
  devicesByProtocol: {
    bacnet: DeviceInfo[];
    n2: DeviceInfo[];
    modbus?: DeviceInfo[];
    niagara?: DeviceInfo[];
  };
  networkHierarchy: NetworkNode[];
  protocolStatistics: {
    bacnet?: ProtocolStats;
    n2?: ProtocolStats;
    modbus?: ProtocolStats;
  };
}

export interface DeviceInfo {
  name: string;
  deviceId: string;
  type: string;
  status: 'ok' | 'down' | 'alarm' | 'fault' | 'unknown';
  vendor: string;
  model: string;
  firmwareVersion?: string;
  softwareVersion?: string;
  addressing: {
    network?: string;
    ip?: string;
    macAddress?: string;
    address?: number | string;
  };
  protocolDetails: {
    protocol: 'BACnet' | 'N2' | 'Modbus' | 'Niagara';
    version?: string;
    maxApdu?: number;
    segmentation?: string;
    encoding?: string;
  };
  communications: {
    useCoV?: boolean;
    pollingInterval?: number;
    maxCovSubscriptions?: number;
    covSubscriptions?: number;
  };
  health: {
    lastSeen?: Date;
    responseTime?: number;
    errorCount?: number;
    timeoutCount?: number;
  };
  pointCount?: number;
  enabled: boolean;
}

export interface NetworkNode {
  id: string;
  name: string;
  type: 'supervisor' | 'jace' | 'device' | 'network';
  path?: string;
  status: 'running' | 'idle' | 'stopped' | 'unknown';
  children: NetworkNode[];
  metadata: {
    foxPort?: number;
    httpPort?: number;
    httpsPort?: number;
    autostart?: boolean;
    autorestart?: boolean;
    clientConnections?: number;
    serverConnections?: number;
    platformStatus?: string;
  };
}

export interface ProtocolStats {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  alarmedDevices: number;
  faultedDevices: number;
  averageResponseTime?: number;
  totalPoints?: number;
  networksCount?: number;
}

// License Information
export interface LicenseInfo {
  licenses: LicenseDetails[];
  deviceCapacity: {
    used: number;
    limit: number;
    unlimited: boolean;
  };
  pointCapacity: {
    used: number;
    limit: number;
    unlimited: boolean;
  };
  expirationWarnings: string[];
}

export interface LicenseDetails {
  name: string;
  vendor: string;
  version: string;
  expiryDate?: Date;
  neverExpires: boolean;
  type: string;
}

// Driver-Specific Information
export interface DriverInfo {
  bacnet?: BacnetDriverInfo;
  n2?: N2DriverInfo;
  modbus?: ModbusDriverInfo;
}

export interface BacnetDriverInfo {
  networkCount: number;
  deviceCount: number;
  pointCount: number;
  protocolRevision: string;
  maxApduLength: number;
  segmentationSupport: string;
  covEnabled: boolean;
  averagePollingRate?: number;
  vendorBreakdown: Record<string, number>;
}

export interface N2DriverInfo {
  networkCount: number;
  deviceCount: number;
  controllerTypes: Record<string, number>;
  addressRange: { min: number; max: number };
  offlineDevices: string[];
  unknownControllers: string[];
}

export interface ModbusDriverInfo {
  slaveCount: number;
  registerCount: number;
  coilCount: number;
  connectionType: 'TCP' | 'RTU' | 'ASCII';
  pollingRate: number;
  timeoutCount: number;
  errorCount: number;
}

// Alert and Threshold Information
export interface AlertInfo {
  alerts: Alert[];
  thresholdViolations: ThresholdViolation[];
  recommendations: string[];
}

export interface Alert {
  id: string;
  timestamp: Date;
  severity: 'info' | 'warning' | 'critical';
  category: 'performance' | 'capacity' | 'security' | 'maintenance';
  metric: string;
  value: number | string;
  threshold?: number | string;
  message: string;
  recommendation: string;
}

export interface ThresholdViolation {
  metric: string;
  value: number;
  threshold: number;
  severity: 'warning' | 'critical';
  description: string;
}

// Modules and Certificates
export interface ModuleInfo {
  enabled: ModuleDetails[];
  thirdParty: ModuleDetails[];
  vendorBreakdown: Record<string, ModuleDetails[]>;
}

export interface ModuleDetails {
  name: string;
  vendor: string;
  version: string;
  type: 'rt' | 'ux' | 'wb' | 'se' | 'doc';
  signed?: boolean;
  compatible: boolean;
}

export interface CertificateInfo {
  certificates: CertificateDetails[];
  expiring: CertificateDetails[];
  expired: CertificateDetails[];
}

export interface CertificateDetails {
  name: string;
  vendor: string;
  expiryDate?: Date;
  neverExpires: boolean;
  daysUntilExpiry?: number;
  status: 'valid' | 'expiring' | 'expired';
}

// Main Unified Output Schema
export interface NiagaraSystemAnalysis {
  // Metadata
  metadata: {
    analysisDate: Date;
    analysisVersion: string;
    filesProcessed: string[];
    processingTime: number;
    confidence: number;
  };

  // Core Data Sections
  platform_identity: PlatformIdentity;
  resources: ResourceUtilization;
  inventory: NetworkInventory;
  licenses: LicenseInfo;
  drivers: DriverInfo;
  modules: ModuleInfo;
  certificates: CertificateInfo;
  alerts: AlertInfo;

  // Summary Statistics
  summary: {
    systemType: 'JACE' | 'Supervisor' | 'Workstation';
    totalDevices: number;
    healthScore: number; // 0-100
    criticalIssues: number;
    warningIssues: number;
    capacityUtilization: number; // percentage
    recommendedActions: string[];
  };
}

// Predefined Thresholds for Alert Generation
export const SYSTEM_THRESHOLDS = {
  cpu: {
    warning: 75,
    critical: 85
  },
  memory: {
    warning: 75,
    critical: 85
  },
  heap: {
    warning: 75,
    critical: 90
  },
  capacity: {
    devices: {
      warning: 85,
      critical: 95
    },
    points: {
      warning: 85,
      critical: 95
    },
    histories: {
      jace: 6000,
      supervisor: 50000
    }
  },
  disk: {
    jace: {
      warning: 80,
      critical: 90
    },
    supervisor: {
      warning: 85,
      critical: 95
    }
  },
  certificates: {
    expiringDays: 30
  },
  niagara: {
    currentLTS: '4.15'
  }
} as const;

// Version Compatibility Matrix
export const VERSION_COMPATIBILITY = {
  niagara: {
    supported: ['4.12', '4.13', '4.14', '4.15'],
    lts: '4.15',
    deprecated: ['4.8', '4.9', '4.10', '4.11']
  },
  vendors: {
    'Johnson Controls': ['14.12', '15.0'],
    'Honeywell': ['1.4'],
    'Tridium': ['4.12', '4.13', '4.14', '4.15'],
    'Community': ['20.3', '19.12'],
    'BASSG': ['4.9', '4.0'],
    'VYKON': ['4.12']
  }
} as const;