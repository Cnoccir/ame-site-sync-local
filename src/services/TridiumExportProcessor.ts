import Papa from 'papaparse';

// Core interfaces for parsed data structures matching the specification exactly
export interface N2Device {
  name: string;
  status: string[];
  address: number;
  type: string;
  raw_type?: string; // For unknown codes
}

export interface N2ParsedData {
  devices: N2Device[];
  summary: {
    total: number;
    ok: number;
    faulty: number;
    down: number;
    alarm: number;
    unackedAlarm: number;
    byType: Record<string, number>;
  };
  analysis: {
    healthScore: number;
    alerts: Array<{ severity: 'critical' | 'warning' | 'info'; message: string; recommendation: string; }>;
    deviceInventory: {
      totalDevices: number;
      healthyDevices: number;
      faultyDevices: number;
      downDevices: number;
      devicesWithAlarms: number;
      typeDistribution: Record<string, number>;
    };
    recommendations: string[];
  };
}

export interface BACnetDevice {
  name: string;
  id: number;
  status: string[];
  vendor: string;
  model: string;
  firmwareRev: string;
  health: string;
  healthTimestamp?: Date;
  networkId: number;
  macAddress: number;
  maxAPDU: number;
  enabled: boolean;
  covEnabled: boolean;
  type?: string;
  exts?: string;
  protocolRev?: string;
  appSwVersion?: string;
  encoding?: string;
  segmentation?: string;
  useCovProperty?: boolean;
  maxCovSubscriptions?: string;
  covSubscriptions?: number;
}

export interface BACnetParsedData {
  devices: BACnetDevice[];
  summary: {
    total: number;
    ok: number;
    faulty: number;
    unackedAlarm: number;
    byVendor: Record<string, number>;
    byModel: Record<string, number>;
    healthyPercentage: number;
  };
  analysis: {
    healthScore: number;
    alerts: Array<{ severity: 'critical' | 'warning' | 'info'; message: string; recommendation: string; }>;
    deviceInventory: {
      totalDevices: number;
      healthyDevices: number;
      faultyDevices: number;
      devicesWithAlarms: number;
      vendorDistribution: Record<string, number>;
      modelDistribution: Record<string, number>;
    };
    recommendations: string[];
  };
}

export interface ResourceMetric {
  name: string;
  value: number | string;
  unit?: string;
  limit?: number | string;
  peak?: number;
  percentage?: number;
}

export interface ResourceParsedData {
  metrics: {
    cpu: { usage: number };
    heap: { used: number; max: number; free: number; total: number };
    memory: { used: number; total: number };
    capacities: {
      points: { current: number; limit: number; percentage: number };
      devices: { current: number; limit: number; percentage: number };
      networks: { current: number; limit: number };
      histories: { current: number; limit: number | null };
      links: { current: number; limit: number | null };
      schedules: { current: number; limit: number | null };
    };
    uptime: string;
    versions: {
      niagara: string;
      java: string;
      os: string;
    };
    fileDescriptors: { open: number; max: number };
    engineScan: {
      lifetime: string;
      peak: string;
      peakInterscan: string;
      recent: string;
      usage: string;
    };
    engineQueue: {
      actions: string;
      longTimers: string;
      mediumTimers: string;
      shortTimers: string;
    };
  };
  warnings: string[];
  raw: ResourceMetric[];
  // Enhanced fields for comprehensive resource analysis
  analysis?: {
    healthScore: number; // 0-100
    resourceUtilization: {
      cpu: { percentage: number; status: 'normal' | 'high' | 'critical' };
      heap: { percentage: number; status: 'normal' | 'high' | 'critical' };
      memory: { percentage: number; status: 'normal' | 'high' | 'critical' };
      fileDescriptors: { percentage: number; status: 'normal' | 'high' | 'critical' };
    };
    capacityAnalysis: {
      points: { status: 'normal' | 'approaching' | 'critical'; riskLevel: number };
      devices: { status: 'normal' | 'approaching' | 'critical'; riskLevel: number };
      histories: { status: 'normal' | 'approaching' | 'critical'; riskLevel: number };
    };
    alerts: Array<{
      severity: 'info' | 'warning' | 'critical';
      category: 'cpu' | 'memory' | 'heap' | 'capacity' | 'performance';
      message: string;
      threshold?: number;
      value?: number;
    }>;
    recommendations: string[];
    performanceInsights: {
      engineScanEfficiency: 'excellent' | 'good' | 'fair' | 'poor';
      queueBacklog: 'none' | 'low' | 'medium' | 'high';
      memoryLeaks: boolean;
      capacityProjection: {
        pointsMonthsRemaining?: number;
        devicesMonthsRemaining?: number;
      };
    };
  };
}

export interface PlatformModule {
  name: string;
  vendor: string;
  version: string;
  profiles: string[];
}

export interface PlatformLicense {
  name: string;
  vendor: string;
  version: string;
  expires: string;
}

export interface PlatformParsedData {
  summary: {
    daemonVersion: string;
    model: string;
    product: string;
    hostId: string;
    hostIdStatus: string;
    architecture: string;
    cpuCount: number;
    ramFree: number;
    ramTotal: number;
    os: string;
    java: string;
    httpsPort: number;
    foxPort: number;
    niagaraRuntime: string;
    systemHome: string;
    userHome: string;
    enabledProfiles: string[];
    platformTlsSupport: string;
    tlsProtocol: string;
    certificate: string;
  };
  modules: PlatformModule[];
  licenses: PlatformLicense[];
  certificates: PlatformLicense[];
  applications: Array<{
    name: string;
    status: string;
    autostart: boolean;
    autorestart: boolean;
    ports: Record<string, number>;
  }>;
  filesystems: Array<{
    path: string;
    free: number;
    total: number;
    files: number;
    maxFiles: number;
  }>;
  otherParts: Array<{
    name: string;
    version: string;
  }>;
  // Enhanced fields for comprehensive analysis
  analysis?: {
    healthScore: number; // 0-100
    memoryUtilization: number; // percentage
    diskUtilization?: number; // percentage for root filesystem
    alerts: Array<{
      severity: 'info' | 'warning' | 'critical';
      category: 'memory' | 'disk' | 'version' | 'certificate' | 'license';
      message: string;
      threshold?: number;
      value?: number;
    }>;
    recommendations: string[];
    platformType: 'JACE' | 'Supervisor' | 'Unknown';
    versionCompatibility: {
      isSupported: boolean;
      isLTS: boolean;
      upgradeRecommended: boolean;
      latestVersion?: string;
    };
    moduleAnalysis: {
      total: number;
      byVendor: Record<string, number>;
      thirdPartyCount: number;
      unsupportedModules: string[];
    };
    licenseStatus: {
      total: number;
      expiring: number; // within 30 days
      expired: number;
      perpetual: number;
    };
    certificateStatus: {
      total: number;
      expiring: number; // within 30 days
      expired: number;
      selfSigned: number;
    };
  };
}

export interface NiagaraNetworkNode {
  path: string;
  name: string;
  type: string;
  address: string;
  ip?: string;
  port?: number;
  hostModel: string;
  hostModelVersion?: string;
  version: string;
  status: string[];
  platformStatus: string[];
  health: string;
  healthTimestamp?: Date;
  clientConn: string;
  serverConn: string;
  enabled: boolean;
  connected: boolean;
  credentialStore: string;
  platformUser: string;
  platformPassword: string;
  securePlatform: boolean;
  platformPort: number;
  foxPort: number;
  useFoxs: boolean;
  virtualsEnabled: boolean;
  faultCause?: string;
  children?: NiagaraNetworkNode[];
}

export interface NiagaraNetworkParsedData {
  network: {
    root: string;
    nodes: NiagaraNetworkNode[];
  };
  summary: {
    total: number;
    connected: number;
    disconnected: number;
    withAlarms: number;
    byVersion: Record<string, number>;
    byModel: Record<string, number>;
    connectionMatrix: {
      clientConnected: number;
      serverConnected: number;
      bothConnected: number;
      neitherConnected: number;
    };
  };
  analysis: {
    healthScore: number;
    alerts: Array<{ severity: 'critical' | 'warning' | 'info'; message: string; recommendation: string; }>;
    networkTopology: {
      totalNodes: number;
      connectedNodes: number;
      disconnectedNodes: number;
      nodesWithAlarms: number;
      versionDistribution: Record<string, number>;
      modelDistribution: Record<string, number>;
      connectionMatrix: {
        clientConnected: number;
        serverConnected: number;
        bothConnected: number;
        neitherConnected: number;
      };
    };
    recommendations: string[];
  };
}

// Enhanced system health analysis interfaces
export interface SystemHealthAnalysis {
  overallHealth: number; // 0-100 percentage
  criticalDevices: Array<{
    name: string;
    type: 'jace' | 'bacnet' | 'n2';
    status: string[];
    issues: string[];
    location: string;
  }>;
  networkSegmentHealth: {
    bacnet?: { total: number; healthy: number; percentage: number; critical: string[] };
    n2?: { total: number; healthy: number; percentage: number; critical: string[] };
    modbus?: { total: number; healthy: number; percentage: number; critical: string[] };
    lon?: { total: number; healthy: number; percentage: number; critical: string[] };
  };
  jaceHealth: Array<{
    name: string;
    cpuUsage: number;
    memoryUsage: number;
    deviceCount: number;
    onlinePercentage: number;
    uptime: string;
    issues: string[];
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
  }>;
  alarmSummary: {
    total: number;
    unacknowledged: number;
    byType: Record<string, number>;
    criticalAlarms: Array<{
      device: string;
      message: string;
      severity: string;
      timestamp?: Date;
    }>;
  };
  performanceMetrics: {
    systemLoad: number;
    responseTime: number;
    throughput: number;
    reliability: number;
  };
}

export interface LicenseUtilization {
  platformLicenses: PlatformLicense[];
  deviceUtilization: {
    bacnet: { current: number; licensed: number; percentage: number };
    n2: { current: number; licensed: number; percentage: number };
    total: { current: number; licensed: number; percentage: number };
  };
  pointUtilization: {
    current: number;
    limit: number | null;
    percentage: number;
  };
  capacityAnalysis: {
    devices: { used: number; available: number; utilization: number };
    histories: { used: number; available: number | null; utilization: number };
    links: { used: number; available: number | null; utilization: number };
    networks: { used: number; available: number | null; utilization: number };
    schedules: { used: number; available: number | null; utilization: number };
  };
  recommendations: {
    upgradeNeeded: boolean;
    suggestedActions: string[];
    riskLevel: 'low' | 'medium' | 'high';
    costImpact: 'none' | 'low' | 'medium' | 'high';
  };
}

export interface SystemInsights {
  vendorAnalysis: {
    byVendor: Record<string, { count: number; models: string[]; health: number }>;
    dominantVendor: string;
    diversityScore: number;
  };
  networkTopology: {
    supervisorNodes: number;
    jaceNodes: number;
    totalDevices: number;
    networkSegments: Array<{
      type: string;
      nodeCount: number;
      health: number;
    }>;
  };
  systemEvolution: {
    niagaraVersions: Record<string, number>;
    hardwareModels: Record<string, number>;
    recommendedUpgrades: string[];
  };
  riskAssessment: {
    overallRisk: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: Array<{
      category: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
      recommendation: string;
    }>;
  };
}

// Main processed data type (alias for backward compatibility)
export type ProcessedTridiumData = CrossValidatedData;

// Interface for processed Tridium data returned by processFiles
export interface ProcessedTridiumData {
  processedFiles: string[];
  devices: any[];
  resources: any[];
  networks: any[];
  errors: string[];
  validationWarnings: string[];
  crossValidatedData: CrossValidatedData;
  metadata: {
    totalFiles: number;
    processedFiles: number;
    failedFiles: number;
    processingTime: number;
    architecture: string;
  };
}

// Comprehensive cross-validation interface
export interface CrossValidatedData {
  architecture: 'single-jace' | 'multi-jace' | 'supervisor';
  jaces: Record<string, {
    platform?: PlatformParsedData;
    resources?: ResourceParsedData;
    drivers: {
      bacnet?: BACnetParsedData;
      n2?: N2ParsedData;
      modbus?: any;
      lon?: any;
    };
    networkInfo?: NiagaraNetworkNode;
  }>;
  supervisor?: {
    platform?: PlatformParsedData;
    resources?: ResourceParsedData;
    network?: NiagaraNetworkParsedData;
  };
  validationWarnings: string[];
  consistencyErrors: string[];
  crossValidation: {
    versionConsistency: boolean;
    deviceCountConsistency: boolean;
    networkTopologyConsistency: boolean;
    capacityConsistency: boolean;
  };
  // Enhanced analysis
  healthAnalysis?: SystemHealthAnalysis;
  licenseUtilization?: LicenseUtilization;
  systemInsights?: SystemInsights;
}

/**
 * Comprehensive Tridium Export Processor
 * Handles all major Tridium export formats with robust parsing and validation
 * Matches the exact specification from the parsing table
 */
export class TridiumExportProcessor {

  // Enhanced file pattern definitions based on real-world Tridium exports
  private static FILE_PATTERNS = {
    platform: [
      /.*supervisor.*platform.*details.*\.txt$/i,
      /.*jace.*platform.*details.*\.txt$/i,
      /.*platform.*details.*\.txt$/i,
      /^platform.*\.txt$/i,
      /.*plat.*details.*\.txt$/i
    ],
    resource: [
      /.*supervisor.*niagara.*resource.*export.*\.csv$/i,
      /.*supervisor.*resource.*export.*\.csv$/i,
      /.*jace.*resource.*export.*\.csv$/i,
      /.*resource.*export.*\.csv$/i,
      /.*niagara.*resource.*\.csv$/i
    ],
    network: [
      /.*supervisor.*niagara.*net.*export.*\.csv$/i,
      /.*niagara.*network.*export.*\.csv$/i,
      /.*niagara.*net.*export.*\.csv$/i,
      /.*network.*export.*\.csv$/i
    ],
    bacnet: [
      /.*jace.*bacnet.*export.*\.csv$/i,
      /.*bacnet.*export.*\.csv$/i,
      /.*bacnet.*device.*\.csv$/i,
      /.*bacnet.*inventory.*\.csv$/i
    ],
    n2: [
      /.*jace\d*.*n2.*port.*\.csv$/i,
      /.*jace\d*.*n2.*export.*\.csv$/i,
      /.*n2.*export.*\.csv$/i,
      /.*n2.*port.*\.csv$/i,
      /.*n2.*device.*\.csv$/i
    ],
    modbus: [
      /.*modbus.*export.*\.csv$/i,
      /.*modbus.*device.*\.csv$/i,
      /.*modbus.*inventory.*\.csv$/i
    ],
    lon: [
      /.*lon.*export.*\.csv$/i,
      /.*lon.*device.*\.csv$/i,
      /.*lonworks.*\.csv$/i
    ]
  };

  /**
   * Enhanced file type detection with pattern matching
   */
  static detectFileTypeFromName(fileName: string): { type: string; confidence: number; patterns: string[] } {
    const lowerName = fileName.toLowerCase();

    for (const [fileType, patterns] of Object.entries(this.FILE_PATTERNS)) {
      for (const pattern of patterns) {
        if (pattern.test(lowerName)) {
          // Higher confidence for more specific patterns
          const confidence = fileName.includes('supervisor') ? 95 :
                           fileName.includes('jace') ? 90 :
                           fileName.includes(fileType) ? 85 : 70;

          return {
            type: fileType,
            confidence,
            patterns: patterns.map(p => p.toString())
          };
        }
      }
    }

    return {
      type: 'unknown',
      confidence: 0,
      patterns: []
    };
  }

  /**
   * Auto-detect file format and validate structure with enhanced pattern matching
   */
  static detectFileFormat(filename: string, content: string): {
    type: 'n2' | 'bacnet' | 'resource' | 'platform' | 'network' | 'modbus' | 'lon' | 'unknown';
    confidence: number;
    warnings: string[];
    preview: any;
  } {
    const warnings: string[] = [];

    // Check for truncated files
    if (content.length < 100) {
      warnings.push('File appears to be truncated or too small');
    }

    // First try enhanced pattern-based detection
    const nameDetection = this.detectFileTypeFromName(filename);

    if (nameDetection.confidence > 60) {
      // Validate content matches expected format
      const contentValidation = this.validateContentFormat(nameDetection.type, content);

      if (contentValidation.isValid) {
        return {
          type: nameDetection.type as any,
          confidence: Math.min(nameDetection.confidence + contentValidation.confidence, 100),
          warnings: [...warnings, ...contentValidation.warnings],
          preview: contentValidation.preview
        };
      } else {
        warnings.push(`File name suggests ${nameDetection.type} but content validation failed`);
        warnings.push(...contentValidation.warnings);
      }
    }

    // Fallback to legacy detection logic
    const fileName = filename.toLowerCase();

    // N2 Export Detection
    if (fileName.includes('n2') && fileName.includes('.csv')) {
      return this.validateN2Format(content, warnings);
    }

    // BACnet Export Detection
    if (fileName.includes('bacnet') && fileName.includes('.csv')) {
      return this.validateBACnetFormat(content, warnings);
    }

    // Resource Export Detection
    if (fileName.includes('resource') && fileName.includes('.csv')) {
      return this.validateResourceFormat(content, warnings);
    }

    // Platform Details Detection
    if (fileName.includes('platform') && fileName.includes('.txt')) {
      return this.validatePlatformFormat(content, warnings);
    }

    // Network Export Detection
    if (fileName.includes('niagara') && fileName.includes('net') && fileName.includes('.csv')) {
      return this.validateNetworkFormat(content, warnings);
    }

    // Generic CSV detection with header analysis
    if (fileName.includes('.csv')) {
      return this.detectCSVFormat(content, warnings);
    }

    return {
      type: 'unknown',
      confidence: 0,
      warnings: ['Unable to detect file format', ...warnings],
      preview: null
    };
  }

  /**
   * Validate content matches expected format for detected file type
   */
  private static validateContentFormat(fileType: string, content: string): {
    isValid: boolean;
    confidence: number;
    warnings: string[];
    preview: any;
  } {
    const warnings: string[] = [];
    let confidence = 0;
    let preview = null;

    try {
      switch (fileType) {
        case 'platform':
          if (!content.includes('Platform summary') && !content.includes('Daemon Version')) {
            warnings.push('Missing expected platform summary headers');
            return { isValid: false, confidence: 0, warnings, preview };
          }
          confidence = 80;
          preview = { type: 'platform', lines: content.split('\n').slice(0, 10) };
          break;

        case 'resource':
          const lines = content.split('\n');
          if (lines.length < 2 || !lines[0].toLowerCase().includes('name')) {
            warnings.push('Missing expected CSV headers');
            return { isValid: false, confidence: 0, warnings, preview };
          }
          // Check for resource-specific fields
          const headerLine = lines[0].toLowerCase();
          const resourceFields = ['cpu', 'heap', 'memory', 'component', 'capacity'];
          const foundFields = resourceFields.filter(field => headerLine.includes(field));
          confidence = (foundFields.length / resourceFields.length) * 90;
          if (confidence < 40) {
            warnings.push('Content does not match expected resource export format');
            return { isValid: false, confidence, warnings, preview };
          }
          preview = { type: 'resource', headers: headerLine, sampleRows: lines.slice(1, 4) };
          break;

        case 'bacnet':
          const bacnetLines = content.split('\n');
          if (bacnetLines.length < 2) {
            warnings.push('File too short for BACnet export');
            return { isValid: false, confidence: 0, warnings, preview };
          }
          const bacnetHeader = bacnetLines[0].toLowerCase();
          const bacnetFields = ['name', 'device', 'network', 'vendor', 'model'];
          const foundBacnetFields = bacnetFields.filter(field => bacnetHeader.includes(field));
          confidence = (foundBacnetFields.length / bacnetFields.length) * 85;
          if (confidence < 40) {
            warnings.push('Content does not match expected BACnet export format');
            return { isValid: false, confidence, warnings, preview };
          }
          preview = { type: 'bacnet', headers: bacnetHeader, deviceCount: bacnetLines.length - 1 };
          break;

        case 'n2':
          const n2Lines = content.split('\n');
          if (n2Lines.length < 2) {
            warnings.push('File too short for N2 export');
            return { isValid: false, confidence: 0, warnings, preview };
          }
          const n2Header = n2Lines[0].toLowerCase();
          const n2Fields = ['name', 'status', 'address', 'controller'];
          const foundN2Fields = n2Fields.filter(field => n2Header.includes(field));
          confidence = (foundN2Fields.length / n2Fields.length) * 85;
          if (confidence < 40) {
            warnings.push('Content does not match expected N2 export format');
            return { isValid: false, confidence, warnings, preview };
          }
          preview = { type: 'n2', headers: n2Header, deviceCount: n2Lines.length - 1 };
          break;

        case 'network':
          const networkLines = content.split('\n');
          if (networkLines.length < 2) {
            warnings.push('File too short for network export');
            return { isValid: false, confidence: 0, warnings, preview };
          }
          const networkHeader = networkLines[0].toLowerCase();
          const networkFields = ['path', 'name', 'address', 'type', 'status'];
          const foundNetworkFields = networkFields.filter(field => networkHeader.includes(field));
          confidence = (foundNetworkFields.length / networkFields.length) * 85;
          if (confidence < 40) {
            warnings.push('Content does not match expected network export format');
            return { isValid: false, confidence, warnings, preview };
          }
          preview = { type: 'network', headers: networkHeader, nodeCount: networkLines.length - 1 };
          break;

        case 'modbus':
        case 'lon':
          const driverLines = content.split('\n');
          if (driverLines.length < 2) {
            warnings.push(`File too short for ${fileType} export`);
            return { isValid: false, confidence: 0, warnings, preview };
          }
          confidence = 70; // Lower confidence for less common drivers
          preview = { type: fileType, headers: driverLines[0], deviceCount: driverLines.length - 1 };
          break;

        default:
          warnings.push(`Unknown file type: ${fileType}`);
          return { isValid: false, confidence: 0, warnings, preview };
      }

      return { isValid: true, confidence, warnings, preview };

    } catch (error) {
      warnings.push(`Content validation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return { isValid: false, confidence: 0, warnings, preview };
    }
  }

  /**
   * Parse N2 Export CSV
   * Specification: split Status by {}/commas; map Address to int; group by Controller Type
   * Output: { devices: [{name, status: ['ok'], address: 1, type: 'DX'}], summary: {total: 60, ok: 45, faulty: 15} }
   */
  static parseN2Export(csvContent: string): N2ParsedData {
    // Handle truncated CSVs and malformed data
    if (!csvContent || csvContent.trim().length === 0) {
      throw new Error('N2 export file is empty');
    }

    // Clean content - remove BOM and normalize line endings
    let cleanContent = csvContent.replace(/^\uFEFF/, ''); // Remove BOM
    cleanContent = cleanContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const result = Papa.parse(cleanContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string) => value.trim(),
      transformHeader: (header: string) => header.trim().replace(/"/g, ''),
      errorHandler: (error: any) => {
        console.warn('N2 CSV parsing error:', error);
      }
    });

    if (result.errors.length > 0) {
      console.warn('N2 CSV parsing errors:', result.errors);
    }

    // Validate required headers
    const requiredHeaders = ['Name', 'Status', 'Address', 'Controller Type'];
    const headers = result.meta.fields || [];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      throw new Error(`N2 export missing required headers: ${missingHeaders.join(', ')}`);
    }

    const devices: N2Device[] = result.data.map((row: any, index: number) => {
      try {
        // Parse status - handle various formats including multi-status sets
        let status: string[] = [];
        const statusStr = row.Status || '';

        if (statusStr.startsWith('{') && statusStr.endsWith('}')) {
          // Handle {ok} or {down,alarm}
          const statusContent = statusStr.slice(1, -1);
          status = statusContent.split(',').map(s => s.trim()).filter(s => s.length > 0);
        } else if (statusStr.includes('"') && (statusStr.includes('{') || statusStr.includes('}'))) {
          // Handle "{down,alarm,unackedAlarm}" - more robust parsing
          const match = statusStr.match(/["{]([^}"]+)[}"]/);
          if (match) {
            status = match[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
          } else {
            // Fallback - try to extract from quoted string
            const quotedMatch = statusStr.match(/"([^"]+)"/);
            if (quotedMatch) {
              status = quotedMatch[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
            }
          }
        } else if (statusStr.length > 0) {
          status = [statusStr];
        }

        // Normalize status values
        status = status.map(s => s.toLowerCase().replace(/[{}]/g, ''));

        // Map Address to int with validation
        let address = 0;
        const addressStr = row.Address || '';
        if (addressStr) {
          const parsedAddress = parseInt(addressStr);
          if (!isNaN(parsedAddress) && parsedAddress >= 0) {
            address = parsedAddress;
          } else {
            console.warn(`Invalid address "${addressStr}" for device ${row.Name} at row ${index + 2}`);
          }
        }

        // Handle Controller Type (including Unknown code: patterns)
        let type = row['Controller Type'] || 'Unknown';
        let raw_type: string | undefined;

        if (type.includes('Unknown code:')) {
          raw_type = type;
          type = 'Unknown';
        }

        // Clean and validate device name
        const name = (row.Name || '').toString().trim();
        if (!name || name === 'Unknown' || name === '') {
          console.warn(`Empty or invalid device name at row ${index + 2}`);
          return null;
        }

        return {
          name,
          status,
          address,
          type: type.trim(),
          raw_type
        };
      } catch (error) {
        console.error(`Error parsing N2 device at row ${index + 2}:`, error);
        return null;
      }
    }).filter((device): device is N2Device => device !== null);

    // Validate we got some devices
    if (devices.length === 0) {
      throw new Error('No valid N2 devices found in export file');
    }

    // Group by Controller Type and calculate comprehensive summary
    const summary = {
      total: devices.length,
      ok: devices.filter(d => d.status.includes('ok')).length,
      faulty: devices.filter(d =>
        d.status.includes('down') ||
        d.status.includes('alarm') ||
        d.status.includes('unackedAlarm') ||
        d.status.includes('fault') ||
        d.status.includes('error')
      ).length,
      down: devices.filter(d => d.status.includes('down')).length,
      alarm: devices.filter(d => d.status.includes('alarm')).length,
      unackedAlarm: devices.filter(d => d.status.includes('unackedalarm')).length,
      byType: devices.reduce((acc, device) => {
        const type = device.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    // Generate N2 analysis and alerts
    const n2Analysis = this.analyzeN2Health(devices, summary);

    return { devices, summary, analysis: n2Analysis };
  }

  /**
   * Parse BACnet Export CSV
   * Specification: parse Health timestamp; normalize Vendor/Model to badges; filter by Netwk
   * Output: { devices: [{name: 'AHU_2_1', id: 5010, status: ['ok'], vendor: 'JCI', model: 'MS-FEC2611-0', health: 'Ok [2025-08-19]'}], summary: {byVendor: {JCI: 40, TSI: 8}} }
   */
  static parseBACnetExport(csvContent: string): BACnetParsedData {
    // Handle truncated CSVs and malformed data
    if (!csvContent || csvContent.trim().length === 0) {
      throw new Error('BACnet export file is empty');
    }

    // Clean content - remove BOM and normalize line endings
    let cleanContent = csvContent.replace(/^\uFEFF/, ''); // Remove BOM
    cleanContent = cleanContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const result = Papa.parse(cleanContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string) => value.trim(),
      transformHeader: (header: string) => header.trim().replace(/"/g, ''),
      errorHandler: (error: any) => {
        console.warn('BACnet CSV parsing error:', error);
      }
    });

    if (result.errors.length > 0) {
      console.warn('BACnet CSV parsing errors:', result.errors);
    }

    // Validate required headers
    const requiredHeaders = ['Name', 'Device ID', 'Status', 'Vendor', 'Model'];
    const headers = result.meta.fields || [];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      console.warn(`BACnet export missing some headers: ${missingHeaders.join(', ')}`);
    }

    const devices: BACnetDevice[] = result.data.map((row: any, index: number) => {
      try {
        // Parse device ID from "device:5006" format with enhanced validation
        const deviceIdStr = row['Device ID'] || '';
        let id = 0;
        if (deviceIdStr) {
          const deviceIdMatch = deviceIdStr.match(/device:(\d+)/);
          if (deviceIdMatch) {
            id = parseInt(deviceIdMatch[1]);
          } else {
            // Try parsing as plain number
            const plainNum = parseInt(deviceIdStr);
            if (!isNaN(plainNum)) {
              id = plainNum;
            } else {
              console.warn(`Invalid device ID "${deviceIdStr}" for device ${row.Name} at row ${index + 2}`);
            }
          }
        }

        // Parse status with multi-status support (enhanced)
        let status: string[] = [];
        const statusStr = row.Status || '';

        if (statusStr.startsWith('{') && statusStr.endsWith('}')) {
          const statusContent = statusStr.slice(1, -1);
          status = statusContent.split(',').map(s => s.trim()).filter(s => s.length > 0);
        } else if (statusStr.includes('"') && (statusStr.includes('{') || statusStr.includes('}'))) {
          // Handle quoted multi-status like "{down,alarm,unackedAlarm}"
          const match = statusStr.match(/["{]([^}"]+)[}"]/);
          if (match) {
            status = match[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
          }
        } else if (statusStr.length > 0) {
          status = [statusStr];
        }

        // Normalize status values
        status = status.map(s => s.toLowerCase().replace(/[{}]/g, ''));

        // Parse Health timestamp with enhanced parsing [19-Aug-25 10:11 PM EDT]
        const healthStr = row.Health || '';
        let health = healthStr;
        let healthTimestamp: Date | undefined;

        const timestampMatch = healthStr.match(/\[(.*?)\]/);
        if (timestampMatch) {
          try {
            const dateStr = timestampMatch[1];
            const parsedDate = this.parseTridiumTimestamp(dateStr);
            if (parsedDate) {
              healthTimestamp = parsedDate;
              health = healthStr.replace(/\[.*?\]/, '').trim();
            }
          } catch (e) {
            console.warn('Failed to parse health timestamp:', timestampMatch[1]);
          }
        }

        // Normalize vendor/model to standardized badges
        const vendor = this.normalizeBACnetVendor(row.Vendor || 'Unknown');
        const model = this.normalizeBACnetModel(row.Model || 'Unknown');

        // Enhanced numeric field parsing with validation
        const parseNumericField = (value: string | number, fieldName: string): number => {
          if (typeof value === 'number') return value;
          const strValue = String(value || '0');
          const parsed = parseInt(strValue);
          if (isNaN(parsed)) {
            console.warn(`Invalid ${fieldName} "${strValue}" for device ${row.Name} at row ${index + 2}`);
            return 0;
          }
          return parsed;
        };

        // Clean and validate device name
        const name = (row.Name || '').toString().trim();
        if (!name || name === 'Unknown' || name === '') {
          console.warn(`Empty or invalid device name at row ${index + 2}`);
          return null;
        }

        return {
          name,
          id,
          status,
          vendor,
          model,
          firmwareRev: row['Firmware Rev'] || '',
          health,
          healthTimestamp,
          networkId: parseNumericField(row.Netwk, 'Network ID'),
          macAddress: parseNumericField(row['MAC Addr'], 'MAC Address'),
          maxAPDU: parseNumericField(row['Max APDU'], 'Max APDU'),
          enabled: row.Enabled === 'true',
          covEnabled: row['Use Cov'] === 'true',
          // Additional BACnet fields
          type: row.Type || '',
          exts: row.Exts || '',
          protocolRev: row['Protocol Rev'] || '',
          appSwVersion: row['App SW Version'] || '',
          encoding: row.Encoding || '',
          segmentation: row.Segmentation || '',
          useCovProperty: row['Use Cov Property'] === 'true',
          maxCovSubscriptions: row['Max Cov Subscriptions'] || '',
          covSubscriptions: parseNumericField(row['Cov Subscriptions'], 'CoV Subscriptions')
        };
      } catch (error) {
        console.error(`Error parsing BACnet device at row ${index + 2}:`, error);
        return null;
      }
    }).filter((device): device is BACnetDevice => device !== null);

    // Validate we got some devices
    if (devices.length === 0) {
      throw new Error('No valid BACnet devices found in export file');
    }

    // Calculate comprehensive summary with vendor analysis
    const summary = {
      total: devices.length,
      ok: devices.filter(d => d.status.includes('ok')).length,
      faulty: devices.filter(d =>
        d.status.includes('down') ||
        d.status.includes('alarm') ||
        d.status.includes('fault') ||
        d.status.includes('error')
      ).length,
      unackedAlarm: devices.filter(d => d.status.includes('unackedalarm')).length,
      byVendor: devices.reduce((acc, device) => {
        acc[device.vendor] = (acc[device.vendor] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byModel: devices.reduce((acc, device) => {
        acc[device.model] = (acc[device.model] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      healthyPercentage: devices.length > 0 ?
        Math.round((devices.filter(d => d.status.includes('ok')).length / devices.length) * 100) : 0
    };

    // Generate BACnet analysis and alerts
    const bacnetAnalysis = this.analyzeBACnetHealth(devices, summary);

    return { devices, summary, analysis: bacnetAnalysis };
  }

  /**
   * Parse Resource Export CSV
   * Specification: parse units (e.g., "477 MB" → {value: 477, unit: 'MB'}); categorize (heap, capacity)
   * Output: { metrics: {cpu: {usage: 5}, heap: {used: 342, max: 910}, capacities: {points: {current: 0, limit: 0}}, uptime: '26 days' }, warnings: ['Points at 66%'] }
   */
  static parseResourceExport(csvContent: string): ResourceParsedData {
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string) => value.trim()
    });

    if (result.errors.length > 0) {
      console.warn('Resource CSV parsing errors:', result.errors);
    }

    const raw: ResourceMetric[] = [];
    const warnings: string[] = [];

    // Parse each metric as key-value
    result.data.forEach((row: any) => {
      const name = row.Name || '';
      const valueStr = row.Value || '';

      const metric = this.parseResourceValue(name, valueStr);
      if (metric) {
        raw.push(metric);
      }
    });

    // Extract structured metrics with proper categorization
    const getCpuUsage = () => {
      const cpuMetric = raw.find(m => m.name === 'cpu.usage');
      return cpuMetric ? parseFloat(cpuMetric.value.toString().replace('%', '')) : 0;
    };

    const getHeapMetrics = () => {
      const used = raw.find(m => m.name === 'heap.used');
      const max = raw.find(m => m.name === 'heap.max');
      const free = raw.find(m => m.name === 'heap.free');
      const total = raw.find(m => m.name === 'heap.total');

      // Values are already parsed as numbers in MB by parseResourceValue
      const heapMetrics = {
        used: used ? (typeof used.value === 'number' ? used.value : 0) : 0,
        max: max ? (typeof max.value === 'number' ? max.value : 0) : 0,
        free: free ? (typeof free.value === 'number' ? free.value : 0) : 0,
        total: total ? (typeof total.value === 'number' ? total.value : 0) : 0
      };
      
      console.log('[TridiumExportProcessor] Parsed heap metrics:', heapMetrics);
      return heapMetrics;
    };

    const getMemoryMetrics = () => {
      const used = raw.find(m => m.name === 'mem.used');
      const total = raw.find(m => m.name === 'mem.total');

      // Values are already parsed as numbers in MB by parseResourceValue
      const memoryMetrics = {
        used: used ? (typeof used.value === 'number' ? used.value : 0) : 0,
        total: total ? (typeof total.value === 'number' ? total.value : 0) : 0
      };
      
      console.log('[TridiumExportProcessor] Parsed memory metrics:', memoryMetrics);
      return memoryMetrics;
    };

    const getCapacityMetrics = () => {
      const parseCapacity = (name: string) => {
        const metric = raw.find(m => m.name === `globalCapacity.${name}`);
        if (!metric) return { current: 0, limit: 0, percentage: 0 };

        const valueStr = metric.value.toString();
        // Handle formats like "3,303 (Limit: 5,000)" or "1,625 (Limit: none)"
        const match = valueStr.match(/([\d,]+)\s*\((?:Limit:\s*)?([\d,]+|none)\)/);

        if (match) {
          const current = parseInt(match[1].replace(/,/g, ''));
          const limitStr = match[2];
          const limit = limitStr === 'none' ? null : parseInt(limitStr.replace(/,/g, ''));
          const percentage = limit && limit > 0 ? Math.round((current / limit) * 100) : 0;

          // Add warning if over 66% (as specified in table)
          if (percentage > 66) {
            warnings.push(`${name} at ${percentage}%`);
          }

          return { current, limit: limit || 0, percentage };
        }

        return { current: 0, limit: 0, percentage: 0 };
      };

      // Get component count (not a capacity metric, but a simple count)
      const componentMetric = raw.find(m => m.name === 'component.count');
      const components = componentMetric ? parseInt(componentMetric.value.toString().replace(/,/g, '')) : 0;
      
      // Get history count
      const historyMetric = raw.find(m => m.name === 'history.count');
      const historyCount = historyMetric ? parseInt(historyMetric.value.toString().replace(/,/g, '')) : 0;
      
      return {
        components,
        points: parseCapacity('points'),
        devices: parseCapacity('devices'),
        networks: parseCapacity('networks'),
        histories: { current: historyCount, limit: null, percentage: 0 },
        links: parseCapacity('links'),
        schedules: parseCapacity('schedules')
      };
    };

    const getVersions = () => {
      const niagara = raw.find(m => m.name === 'version.niagara')?.value.toString() || '';
      const java = raw.find(m => m.name === 'version.java')?.value.toString() || '';
      const os = raw.find(m => m.name === 'version.os')?.value.toString() || '';

      return { niagara, java, os };
    };

    const getUptime = () => {
      return raw.find(m => m.name === 'time.uptime')?.value.toString() || '';
    };

    const getFileDescriptors = () => {
      const open = raw.find(m => m.name === 'fd.open');
      const max = raw.find(m => m.name === 'fd.max');
      return {
        open: open ? parseInt(open.value.toString()) : 0,
        max: max ? parseInt(max.value.toString()) : 0
      };
    };

    const getEngineScan = () => {
      return {
        lifetime: raw.find(m => m.name === 'engine.scan.lifetime')?.value.toString() || '',
        peak: raw.find(m => m.name === 'engine.scan.peak')?.value.toString() || '',
        peakInterscan: raw.find(m => m.name === 'engine.scan.peakInterscan')?.value.toString() || '',
        recent: raw.find(m => m.name === 'engine.scan.recent')?.value.toString() || '',
        usage: raw.find(m => m.name === 'engine.scan.usage')?.value.toString() || ''
      };
    };

    const getEngineQueue = () => {
      return {
        actions: raw.find(m => m.name === 'engine.queue.actions')?.value.toString() || '',
        longTimers: raw.find(m => m.name === 'engine.queue.longTimers')?.value.toString() || '',
        mediumTimers: raw.find(m => m.name === 'engine.queue.mediumTimers')?.value.toString() || '',
        shortTimers: raw.find(m => m.name === 'engine.queue.shortTimers')?.value.toString() || ''
      };
    };

    // Check for performance warnings
    const cpuUsage = getCpuUsage();
    if (cpuUsage > 70) {
      warnings.push(`High CPU usage: ${cpuUsage}%`);
    }

    const heap = getHeapMetrics();
    if (heap.max > 0 && (heap.used / heap.max) > 0.8) {
      warnings.push(`High heap usage: ${Math.round((heap.used / heap.max) * 100)}%`);
    }

    // Build metrics with ALL raw data preserved
    const metrics = {
      cpu: { usage: cpuUsage },
      heap: getHeapMetrics(),
      memory: getMemoryMetrics(),
      capacities: getCapacityMetrics(),
      uptime: getUptime(),
      versions: getVersions(),
      fileDescriptors: getFileDescriptors(),
      engineScan: getEngineScan(),
      engineQueue: getEngineQueue()
    };

    // Enhanced analysis for threshold checks and health scoring
    const analysis = this.enhanceResourceData(metrics, warnings, raw);

    // Create a flat key-value map of ALL metrics for easy display and storage
    const allMetrics: Record<string, any> = {};
    raw.forEach(metric => {
      allMetrics[metric.name] = {
        value: metric.value,
        unit: metric.unit,
        limit: metric.limit,
        peak: metric.peak
      };
    });

    console.log('[TridiumExportProcessor] Total raw metrics parsed:', raw.length);
    console.log('[TridiumExportProcessor] All metrics map:', allMetrics);

    return {
      metrics,        // Structured metrics for analytics
      warnings,
      raw,           // Complete array of all parsed metrics
      allMetrics,    // Flat key-value map for easy lookup
      analysis
    };
  }

  /**
   * Enhanced resource data analysis with comprehensive threshold checks
   */
  private static enhanceResourceData(
    metrics: ResourceParsedData['metrics'],
    warnings: string[],
    raw: ResourceMetric[]
  ): ResourceParsedData['analysis'] {
    const alerts: ResourceParsedData['analysis']['alerts'] = [];
    const recommendations: string[] = [];
    let healthScore = 100;

    // CPU Analysis
    const cpuUsage = metrics.cpu.usage;
    let cpuStatus: 'normal' | 'high' | 'critical' = 'normal';
    if (cpuUsage > 85) {
      cpuStatus = 'critical';
      alerts.push({
        severity: 'critical',
        category: 'cpu',
        message: `CPU usage at ${cpuUsage}% is critically high`,
        threshold: 85,
        value: cpuUsage
      });
      recommendations.push('Investigate high CPU processes and consider load balancing');
      healthScore -= 20;
    } else if (cpuUsage > 80) {
      cpuStatus = 'high';
      alerts.push({
        severity: 'warning',
        category: 'cpu',
        message: `CPU usage at ${cpuUsage}% is high`,
        threshold: 80,
        value: cpuUsage
      });
      recommendations.push('Monitor CPU usage trends and optimize processes');
      healthScore -= 10;
    }

    // Heap Analysis
    const heapUsage = metrics.heap.max > 0 ? Math.round((metrics.heap.used / metrics.heap.max) * 100) : 0;
    let heapStatus: 'normal' | 'high' | 'critical' = 'normal';
    if (heapUsage > 90) {
      heapStatus = 'critical';
      alerts.push({
        severity: 'critical',
        category: 'heap',
        message: `Heap usage at ${heapUsage}% is critically high`,
        threshold: 90,
        value: heapUsage
      });
      recommendations.push('Immediate heap space increase required or memory leak investigation');
      healthScore -= 25;
    } else if (heapUsage > 75) {
      heapStatus = 'high';
      alerts.push({
        severity: 'warning',
        category: 'heap',
        message: `Heap usage at ${heapUsage}% is high`,
        threshold: 75,
        value: heapUsage
      });
      recommendations.push('Consider increasing heap size or investigate memory usage');
      healthScore -= 15;
    }

    // Memory Analysis
    const memoryUsage = metrics.memory.total > 0 ? Math.round((metrics.memory.used / metrics.memory.total) * 100) : 0;
    let memoryStatus: 'normal' | 'high' | 'critical' = 'normal';
    if (memoryUsage > 85) {
      memoryStatus = 'critical';
      alerts.push({
        severity: 'critical',
        category: 'memory',
        message: `Physical memory usage at ${memoryUsage}% is critically high`,
        threshold: 85,
        value: memoryUsage
      });
      recommendations.push('Add more physical memory to the system');
      healthScore -= 18;
    } else if (memoryUsage > 75) {
      memoryStatus = 'high';
      alerts.push({
        severity: 'warning',
        category: 'memory',
        message: `Physical memory usage at ${memoryUsage}% is high`,
        threshold: 75,
        value: memoryUsage
      });
      recommendations.push('Monitor memory usage and consider memory optimization');
      healthScore -= 8;
    }

    // File Descriptors Analysis
    const fdUsage = metrics.fileDescriptors.max > 0
      ? Math.round((metrics.fileDescriptors.open / metrics.fileDescriptors.max) * 100) : 0;
    let fdStatus: 'normal' | 'high' | 'critical' = 'normal';
    if (fdUsage > 85) {
      fdStatus = 'critical';
      alerts.push({
        severity: 'critical',
        category: 'performance',
        message: `File descriptor usage at ${fdUsage}% is critically high`,
        threshold: 85,
        value: fdUsage
      });
      recommendations.push('Investigate file descriptor leaks and increase system limits');
      healthScore -= 12;
    } else if (fdUsage > 70) {
      fdStatus = 'high';
      alerts.push({
        severity: 'warning',
        category: 'performance',
        message: `File descriptor usage at ${fdUsage}% is high`,
        threshold: 70,
        value: fdUsage
      });
      recommendations.push('Monitor file descriptor usage');
      healthScore -= 5;
    }

    // Capacity Analysis
    const pointsRisk = metrics.capacities.points.percentage;
    let pointsStatus: 'normal' | 'approaching' | 'critical' = 'normal';
    if (pointsRisk > 95) {
      pointsStatus = 'critical';
      alerts.push({
        severity: 'critical',
        category: 'capacity',
        message: `Point capacity at ${pointsRisk}% - immediate license upgrade required`,
        threshold: 95,
        value: pointsRisk
      });
      recommendations.push('Upgrade point licensing immediately');
      healthScore -= 30;
    } else if (pointsRisk > 85) {
      pointsStatus = 'approaching';
      alerts.push({
        severity: 'warning',
        category: 'capacity',
        message: `Point capacity at ${pointsRisk}% - plan license upgrade`,
        threshold: 85,
        value: pointsRisk
      });
      recommendations.push('Plan point license upgrade within 30 days');
      healthScore -= 15;
    }

    const devicesRisk = metrics.capacities.devices.percentage;
    let devicesStatus: 'normal' | 'approaching' | 'critical' = 'normal';
    if (devicesRisk > 95) {
      devicesStatus = 'critical';
      alerts.push({
        severity: 'critical',
        category: 'capacity',
        message: `Device capacity at ${devicesRisk}% - immediate license upgrade required`,
        threshold: 95,
        value: devicesRisk
      });
      recommendations.push('Upgrade device licensing immediately');
      healthScore -= 25;
    } else if (devicesRisk > 85) {
      devicesStatus = 'approaching';
      alerts.push({
        severity: 'warning',
        category: 'capacity',
        message: `Device capacity at ${devicesRisk}% - plan license upgrade`,
        threshold: 85,
        value: devicesRisk
      });
      recommendations.push('Plan device license upgrade within 30 days');
      healthScore -= 12;
    }

    // History capacity analysis
    const historiesLimit = metrics.capacities.histories.limit;
    const historiesUsed = metrics.capacities.histories.current;
    let historiesStatus: 'normal' | 'approaching' | 'critical' = 'normal';
    let historiesRisk = 0;
    if (historiesLimit && historiesLimit > 0) {
      historiesRisk = Math.round((historiesUsed / historiesLimit) * 100);
      // Different thresholds for JACE vs Supervisor based on limits
      const isSupervisor = historiesLimit > 10000;
      const criticalThreshold = isSupervisor ? 95 : 90;
      const warningThreshold = isSupervisor ? 85 : 75;

      if (historiesRisk > criticalThreshold) {
        historiesStatus = 'critical';
        alerts.push({
          severity: 'critical',
          category: 'capacity',
          message: `History capacity at ${historiesRisk}% is critically high`,
          threshold: criticalThreshold,
          value: historiesRisk
        });
        recommendations.push('Clean up old historical data or increase history limits');
        healthScore -= 20;
      } else if (historiesRisk > warningThreshold) {
        historiesStatus = 'approaching';
        alerts.push({
          severity: 'warning',
          category: 'capacity',
          message: `History capacity at ${historiesRisk}% is approaching limit`,
          threshold: warningThreshold,
          value: historiesRisk
        });
        recommendations.push('Monitor historical data usage and plan cleanup');
        healthScore -= 8;
      }
    }

    // Performance Insights
    const engineScanEfficiency = this.analyzeEngineScanEfficiency(metrics.engineScan);
    const queueBacklog = this.analyzeQueueBacklog(metrics.engineQueue);
    const memoryLeaks = this.detectMemoryLeaks(metrics, raw);

    if (engineScanEfficiency === 'poor') {
      alerts.push({
        severity: 'warning',
        category: 'performance',
        message: 'Engine scan performance is poor'
      });
      recommendations.push('Optimize control programs and reduce scan complexity');
      healthScore -= 10;
    }

    if (queueBacklog === 'high') {
      alerts.push({
        severity: 'critical',
        category: 'performance',
        message: 'High engine queue backlog detected'
      });
      recommendations.push('Investigate control program performance and queue processing');
      healthScore -= 15;
    }

    if (memoryLeaks) {
      alerts.push({
        severity: 'warning',
        category: 'memory',
        message: 'Potential memory leak detected'
      });
      recommendations.push('Investigate memory usage patterns and restart if necessary');
      healthScore -= 12;
    }

    // Capacity projections
    const capacityProjection: ResourceParsedData['analysis']['performanceInsights']['capacityProjection'] = {};
    if (pointsRisk > 50) {
      const growthRate = pointsRisk / 100; // Simplified projection
      capacityProjection.pointsMonthsRemaining = Math.max(1, Math.round((100 - pointsRisk) / (growthRate * 12)));
    }
    if (devicesRisk > 50) {
      const growthRate = devicesRisk / 100;
      capacityProjection.devicesMonthsRemaining = Math.max(1, Math.round((100 - devicesRisk) / (growthRate * 12)));
    }

    // Ensure health score doesn't go below 0
    healthScore = Math.max(0, healthScore);

    return {
      healthScore,
      resourceUtilization: {
        cpu: { percentage: cpuUsage, status: cpuStatus },
        heap: { percentage: heapUsage, status: heapStatus },
        memory: { percentage: memoryUsage, status: memoryStatus },
        fileDescriptors: { percentage: fdUsage, status: fdStatus }
      },
      capacityAnalysis: {
        points: { status: pointsStatus, riskLevel: pointsRisk },
        devices: { status: devicesStatus, riskLevel: devicesRisk },
        histories: { status: historiesStatus, riskLevel: historiesRisk }
      },
      alerts,
      recommendations,
      performanceInsights: {
        engineScanEfficiency,
        queueBacklog,
        memoryLeaks,
        capacityProjection
      }
    };
  }

  private static analyzeEngineScanEfficiency(engineScan: any): 'excellent' | 'good' | 'fair' | 'poor' {
    const recentTime = engineScan.recent;
    if (!recentTime || recentTime === '') return 'good';

    // Parse scan time (e.g., "15ms", "1.2s")
    const timeValue = parseFloat(recentTime.replace(/[^\d.]/g, ''));
    const isSeconds = recentTime.includes('s') && !recentTime.includes('ms');
    const timeMs = isSeconds ? timeValue * 1000 : timeValue;

    if (timeMs < 10) return 'excellent';
    if (timeMs < 50) return 'good';
    if (timeMs < 200) return 'fair';
    return 'poor';
  }

  private static analyzeQueueBacklog(engineQueue: any): 'none' | 'low' | 'medium' | 'high' {
    const actions = parseInt(engineQueue.actions) || 0;
    const longTimers = parseInt(engineQueue.longTimers) || 0;

    const totalBacklog = actions + longTimers;

    if (totalBacklog === 0) return 'none';
    if (totalBacklog < 10) return 'low';
    if (totalBacklog < 50) return 'medium';
    return 'high';
  }

  private static detectMemoryLeaks(metrics: any, raw: ResourceMetric[]): boolean {
    // Simple heuristic: high heap usage with low heap free percentage
    const heapUsage = metrics.heap.max > 0 ? (metrics.heap.used / metrics.heap.max) : 0;
    const heapFree = metrics.heap.max > 0 ? (metrics.heap.free / metrics.heap.max) : 1;

    // Potential leak if heap usage is high but free space is very low
    return heapUsage > 0.8 && heapFree < 0.1;
  }

  /**
   * Parse Platform Details TXT file
   * Specification: Regex split by sections; JSON-ify lists
   * Output: { summary: {daemonVer: '4.12.1.16', ramFree: 350328, model: 'TITAN'}, modules: [{name: 'bacnet-rt', vendor: 'Tridium', ver: '4.12.1.16'}], licenses: [{name: 'FacExp.license', expires: 'never'}] }
   */
  static parsePlatformDetails(txtContent: string): PlatformParsedData {
    const lines = txtContent.split('\\n').map(line => line.trim()).filter(line => line.length > 0);

    const summary = this.parsePlatformSummary(lines);
    const modules = this.parsePlatformModules(lines);
    const licenses = this.parsePlatformLicenses(lines);
    const certificates = this.parsePlatformCertificates(lines);
    const applications = this.parsePlatformApplications(lines);
    const filesystems = this.parsePlatformFilesystems(lines);
    const otherParts = this.parsePlatformOtherParts(lines);

    // Enhanced: Add threshold checking and health analysis
    const enhanced = this.enhancePlatformData({
      summary,
      modules,
      licenses,
      certificates,
      applications,
      filesystems,
      otherParts
    });

    return enhanced;
  }

  /**
   * Parse Niagara Network Export CSV
   * Specification: split Status/Conn; build tree from Path (nest children)
   * Output: { network: {root: 'Supervisor', children: [{name: 'SF_NERO_FX1', ip: '192.168.1.51', status: ['ok'], connected: true}] }, summary: {connected: 6/10} }
   */
  static parseNiagaraNetworkExport(csvContent: string): NiagaraNetworkParsedData {
    const result = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transform: (value: string) => value.trim()
    });

    if (result.errors.length > 0) {
      console.warn('Niagara Network CSV parsing errors:', result.errors);
    }

    const nodes: NiagaraNetworkNode[] = result.data.map((row: any) => {
      // Parse IP address from "ip:192.168.1.51" format
      const addressStr = row.Address || '';
      const ipMatch = addressStr.match(/ip:([\\d.]+)/);
      const ip = ipMatch ? ipMatch[1] : '';

      // Split Status/Conn - parse status arrays
      const parseStatusArray = (statusStr: string): string[] => {
        if (!statusStr) return [];
        if (statusStr.startsWith('{') && statusStr.endsWith('}')) {
          const content = statusStr.slice(1, -1);
          return content.split(',').map(s => s.trim()).filter(s => s.length > 0);
        }
        if (statusStr.includes('"') && statusStr.includes('{')) {
          const match = statusStr.match(/["{]([^}"]+)[}"]/);
          if (match) {
            return match[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
          }
        }
        return statusStr ? [statusStr] : [];
      };

      const status = parseStatusArray(row.Status || '');
      const platformStatus = parseStatusArray(row['Platform Status'] || '');

      // Parse health timestamp
      const healthStr = row.Health || '';
      let health = healthStr;
      let healthTimestamp: Date | undefined;

      const timestampMatch = healthStr.match(/\\[(.*?)\\]/);
      if (timestampMatch) {
        try {
          const parsedDate = this.parseTridiumTimestamp(timestampMatch[1]);
          if (parsedDate) {
            healthTimestamp = parsedDate;
            health = healthStr.replace(/\\[.*?\\]/, '').trim();
          }
        } catch (e) {
          console.warn('Failed to parse health timestamp:', timestampMatch[1]);
        }
      }

      // Determine connection status
      const clientConn = row['Client Conn'] || '';
      const serverConn = row['Server Conn'] || '';
      const connected = clientConn === 'Connected' || serverConn === 'Connected';

      return {
        path: row.Path || '',
        name: row.Name || 'Unknown',
        type: row.Type || '',
        address: addressStr,
        ip,
        port: parseInt(row['Fox Port']) || 0,
        hostModel: row['Host Model'] || '',
        hostModelVersion: row['Host Model Version'] || '',
        version: row.Version || '',
        status,
        platformStatus,
        health,
        healthTimestamp,
        clientConn,
        serverConn,
        enabled: row.Enabled === 'true',
        connected,
        credentialStore: row['Credential Store'] || '',
        platformUser: row['Platform User'] || '',
        platformPassword: row['Platform Password'] || '',
        securePlatform: row['Secure Platform'] === 'true',
        platformPort: parseInt(row['Platform Port']) || 0,
        foxPort: parseInt(row['Fox Port']) || 0,
        useFoxs: row['Use Foxs'] === 'true',
        virtualsEnabled: row['Virtuals Enabled'] === 'true',
        faultCause: row['Fault Cause'] || ''
      };
    }).filter(node => node.name && node.name !== 'Unknown');

    // Calculate connection matrix and summary
    const summary = {
      total: nodes.length,
      connected: nodes.filter(n => n.connected).length,
      disconnected: nodes.filter(n => !n.connected).length,
      withAlarms: nodes.filter(n =>
        n.status.includes('alarm') ||
        n.status.includes('fault') ||
        n.platformStatus.includes('alarm') ||
        n.platformStatus.includes('fault')
      ).length,
      byVersion: nodes.reduce((acc, node) => {
        if (node.version) {
          acc[node.version] = (acc[node.version] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      byModel: nodes.reduce((acc, node) => {
        if (node.hostModel) {
          acc[node.hostModel] = (acc[node.hostModel] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>),
      connectionMatrix: {
        clientConnected: nodes.filter(n => n.clientConn === 'Connected').length,
        serverConnected: nodes.filter(n => n.serverConn === 'Connected').length,
        bothConnected: nodes.filter(n => n.clientConn === 'Connected' && n.serverConn === 'Connected').length,
        neitherConnected: nodes.filter(n => n.clientConn !== 'Connected' && n.serverConn !== 'Connected').length
      }
    };

    // Generate network analysis and alerts
    const networkAnalysis = this.analyzeNetworkHealth(nodes, summary);

    return {
      network: {
        root: 'Supervisor',
        nodes
      },
      summary,
      analysis: networkAnalysis
    };
  }

  /**
   * Analyze Niagara network health and generate alerts
   */
  private static analyzeNetworkHealth(nodes: NiagaraNetworkNode[], summary: any) {
    const alerts: Array<{ severity: 'critical' | 'warning' | 'info'; message: string; recommendation: string; }> = [];
    const healthScore = summary.total > 0 ? Math.round((summary.connected / summary.total) * 100) : 0;

    // Connection health analysis
    if (summary.disconnected > 0) {
      const disconnectedPercent = Math.round((summary.disconnected / summary.total) * 100);
      if (disconnectedPercent > 50) {
        alerts.push({
          severity: 'critical',
          message: `${disconnectedPercent}% of network nodes are disconnected (${summary.disconnected}/${summary.total})`,
          recommendation: 'Investigate network connectivity issues immediately. Check physical connections, network switches, and firewall settings.'
        });
      } else if (disconnectedPercent > 25) {
        alerts.push({
          severity: 'warning',
          message: `${disconnectedPercent}% of network nodes are disconnected (${summary.disconnected}/${summary.total})`,
          recommendation: 'Review network stability and consider scheduled maintenance to address connectivity issues.'
        });
      }
    }

    // Version consistency analysis
    const versions = Object.keys(summary.byVersion);
    if (versions.length > 3) {
      alerts.push({
        severity: 'warning',
        message: `Multiple Niagara versions detected: ${versions.join(', ')}`,
        recommendation: 'Consider standardizing on a single Niagara version for easier maintenance and support.'
      });
    }

    // Platform status analysis
    if (summary.withAlarms > 0) {
      const alarmPercent = Math.round((summary.withAlarms / summary.total) * 100);
      if (alarmPercent > 20) {
        alerts.push({
          severity: 'critical',
          message: `${alarmPercent}% of nodes have active alarms (${summary.withAlarms}/${summary.total})`,
          recommendation: 'Review and acknowledge alarms immediately. Investigate root causes of recurring alarms.'
        });
      } else {
        alerts.push({
          severity: 'warning',
          message: `${summary.withAlarms} nodes have active alarms`,
          recommendation: 'Review alarm conditions and ensure proper alarm management procedures are followed.'
        });
      }
    }

    // Connection type analysis
    const { connectionMatrix } = summary;
    if (connectionMatrix.neitherConnected > 0) {
      alerts.push({
        severity: 'critical',
        message: `${connectionMatrix.neitherConnected} nodes have no client or server connections`,
        recommendation: 'These nodes are completely isolated. Check network configuration and credentials.'
      });
    }

    // Security analysis
    const insecureNodes = nodes.filter(n => !n.securePlatform);
    if (insecureNodes.length > 0) {
      const insecurePercent = Math.round((insecureNodes.length / nodes.length) * 100);
      alerts.push({
        severity: 'warning',
        message: `${insecurePercent}% of nodes use unsecured platform connections`,
        recommendation: 'Enable secure platform connections (HTTPS) for better security compliance.'
      });
    }

    return {
      healthScore,
      alerts,
      networkTopology: {
        totalNodes: summary.total,
        connectedNodes: summary.connected,
        disconnectedNodes: summary.disconnected,
        nodesWithAlarms: summary.withAlarms,
        versionDistribution: summary.byVersion,
        modelDistribution: summary.byModel,
        connectionMatrix: summary.connectionMatrix
      },
      recommendations: alerts.map(alert => alert.recommendation)
    };
  }

  /**
   * Analyze BACnet device health and generate alerts
   */
  private static analyzeBACnetHealth(devices: BACnetDevice[], summary: any) {
    const alerts: Array<{ severity: 'critical' | 'warning' | 'info'; message: string; recommendation: string; }> = [];
    const healthScore = summary.healthyPercentage || 0;

    // Device status analysis
    if (summary.faulty > 0) {
      const faultyPercent = Math.round((summary.faulty / summary.total) * 100);
      if (faultyPercent > 20) {
        alerts.push({
          severity: 'critical',
          message: `${faultyPercent}% of BACnet devices are faulty (${summary.faulty}/${summary.total})`,
          recommendation: 'Investigate device communication issues, power supply, and network connectivity immediately.'
        });
      } else if (faultyPercent > 10) {
        alerts.push({
          severity: 'warning',
          message: `${faultyPercent}% of BACnet devices are faulty (${summary.faulty}/${summary.total})`,
          recommendation: 'Schedule maintenance to address device issues and prevent further degradation.'
        });
      }
    }

    // Unacknowledged alarms
    if (summary.unackedAlarm > 0) {
      alerts.push({
        severity: 'warning',
        message: `${summary.unackedAlarm} BACnet devices have unacknowledged alarms`,
        recommendation: 'Review and acknowledge alarms to maintain proper alarm management.'
      });
    }

    // Vendor diversity analysis
    const vendorCount = Object.keys(summary.byVendor || {}).length;
    if (vendorCount > 5) {
      alerts.push({
        severity: 'info',
        message: `High vendor diversity: ${vendorCount} different BACnet device vendors`,
        recommendation: 'Consider standardizing on fewer vendors to reduce maintenance complexity.'
      });
    }

    return {
      healthScore,
      alerts,
      deviceInventory: {
        totalDevices: summary.total,
        healthyDevices: summary.ok,
        faultyDevices: summary.faulty,
        devicesWithAlarms: summary.unackedAlarm,
        vendorDistribution: summary.byVendor,
        modelDistribution: summary.byModel
      },
      recommendations: alerts.map(alert => alert.recommendation)
    };
  }

  /**
   * Analyze N2 device health and generate alerts
   */
  private static analyzeN2Health(devices: N2Device[], summary: any) {
    const alerts: Array<{ severity: 'critical' | 'warning' | 'info'; message: string; recommendation: string; }> = [];
    const healthScore = summary.total > 0 ? Math.round((summary.ok / summary.total) * 100) : 0;

    // Device status analysis
    if (summary.faulty > 0) {
      const faultyPercent = Math.round((summary.faulty / summary.total) * 100);
      if (faultyPercent > 25) {
        alerts.push({
          severity: 'critical',
          message: `${faultyPercent}% of N2 devices are faulty (${summary.faulty}/${summary.total})`,
          recommendation: 'Check N2 bus wiring, termination resistors, and device power supplies immediately.'
        });
      } else if (faultyPercent > 15) {
        alerts.push({
          severity: 'warning',
          message: `${faultyPercent}% of N2 devices are faulty (${summary.faulty}/${summary.total})`,
          recommendation: 'Schedule N2 network maintenance to address communication issues.'
        });
      }
    }

    // Down devices
    if (summary.down > 0) {
      alerts.push({
        severity: 'critical',
        message: `${summary.down} N2 devices are completely down`,
        recommendation: 'Check power supply and physical connections to down devices.'
      });
    }

    // Alarm analysis
    if (summary.alarm > 0 || summary.unackedAlarm > 0) {
      const totalAlarms = summary.alarm + summary.unackedAlarm;
      alerts.push({
        severity: 'warning',
        message: `${totalAlarms} N2 devices have active alarms (${summary.unackedAlarm} unacknowledged)`,
        recommendation: 'Review N2 device alarms and ensure proper alarm management procedures.'
      });
    }

    // Device type analysis
    const deviceTypes = Object.keys(summary.byType || {});
    if (deviceTypes.length > 10) {
      alerts.push({
        severity: 'info',
        message: `High N2 device type diversity: ${deviceTypes.length} different types`,
        recommendation: 'Consider device standardization for easier maintenance and troubleshooting.'
      });
    }

    return {
      healthScore,
      alerts,
      deviceInventory: {
        totalDevices: summary.total,
        healthyDevices: summary.ok,
        faultyDevices: summary.faulty,
        downDevices: summary.down,
        devicesWithAlarms: summary.alarm + summary.unackedAlarm,
        typeDistribution: summary.byType
      },
      recommendations: alerts.map(alert => alert.recommendation)
    };
  }

  /**
   * Comprehensive system health analysis
   */
  static analyzeSystemHealth(crossValidatedData: CrossValidatedData): SystemHealthAnalysis {
    const criticalDevices: SystemHealthAnalysis['criticalDevices'] = [];
    const networkSegmentHealth: SystemHealthAnalysis['networkSegmentHealth'] = {};
    const jaceHealth: SystemHealthAnalysis['jaceHealth'] = [];
    const alarmSummary: SystemHealthAnalysis['alarmSummary'] = {
      total: 0,
      unacknowledged: 0,
      byType: {},
      criticalAlarms: []
    };

    // Analyze JACE health
    Object.entries(crossValidatedData.jaces).forEach(([jaceName, jaceData]) => {
      const issues: string[] = [];
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

      const cpuUsage = jaceData.resources?.metrics.cpu.usage || 0;
      const memoryUsage = jaceData.resources ?
        Math.round((jaceData.resources.metrics.memory.used / jaceData.resources.metrics.memory.total) * 100) : 0;

      // Calculate device counts
      const bacnetDevices = jaceData.drivers.bacnet?.devices.length || 0;
      const n2Devices = jaceData.drivers.n2?.devices.length || 0;
      const totalDevices = bacnetDevices + n2Devices;

      // Calculate online percentage
      const bacnetOnline = jaceData.drivers.bacnet?.devices.filter(d =>
        d.status.every(s => !['down', 'fault', 'alarm'].includes(s.toLowerCase()))).length || 0;
      const n2Online = jaceData.drivers.n2?.devices.filter(d =>
        d.status.every(s => !['down', 'fault', 'alarm'].includes(s.toLowerCase()))).length || 0;
      const onlinePercentage = totalDevices > 0 ? Math.round(((bacnetOnline + n2Online) / totalDevices) * 100) : 100;

      // Risk assessment
      if (cpuUsage > 80 || memoryUsage > 85) {
        issues.push('High resource utilization');
        riskLevel = 'high';
      }
      if (onlinePercentage < 80) {
        issues.push('Low device connectivity');
        riskLevel = riskLevel === 'low' ? 'medium' : 'critical';
      }

      const uptime = jaceData.resources?.metrics.uptime || 'Unknown';

      jaceHealth.push({
        name: jaceName,
        cpuUsage,
        memoryUsage,
        deviceCount: totalDevices,
        onlinePercentage,
        uptime,
        issues,
        riskLevel
      });

      // Analyze network segments for this JACE
      if (jaceData.drivers.bacnet) {
        const bacnetData = jaceData.drivers.bacnet;
        const healthy = bacnetData.devices.filter(d =>
          d.status.every(s => !['down', 'fault', 'alarm'].includes(s.toLowerCase()))).length;
        const critical = bacnetData.devices.filter(d =>
          d.status.some(s => ['down', 'fault', 'alarm'].includes(s.toLowerCase()))).map(d => d.name);

        networkSegmentHealth.bacnet = {
          total: bacnetData.devices.length,
          healthy,
          percentage: Math.round((healthy / bacnetData.devices.length) * 100),
          critical
        };

        // Add critical BACnet devices
        bacnetData.devices.forEach(device => {
          if (device.status.some(s => ['down', 'fault', 'alarm'].includes(s.toLowerCase()))) {
            criticalDevices.push({
              name: device.name,
              type: 'bacnet',
              status: device.status,
              issues: device.status.filter(s => ['down', 'fault', 'alarm'].includes(s.toLowerCase())),
              location: jaceName
            });
          }
        });

        // Count alarms
        const deviceAlarms = bacnetData.devices.filter(d => d.status.includes('unackedAlarm')).length;
        alarmSummary.total += deviceAlarms;
        alarmSummary.unacknowledged += deviceAlarms;
        alarmSummary.byType['BACnet'] = (alarmSummary.byType['BACnet'] || 0) + deviceAlarms;
      }

      if (jaceData.drivers.n2) {
        const n2Data = jaceData.drivers.n2;
        const healthy = n2Data.devices.filter(d =>
          d.status.every(s => !['down', 'fault', 'alarm'].includes(s.toLowerCase()))).length;
        const critical = n2Data.devices.filter(d =>
          d.status.some(s => ['down', 'fault', 'alarm'].includes(s.toLowerCase()))).map(d => d.name);

        networkSegmentHealth.n2 = {
          total: n2Data.devices.length,
          healthy,
          percentage: Math.round((healthy / n2Data.devices.length) * 100),
          critical
        };

        // Add critical N2 devices
        n2Data.devices.forEach(device => {
          if (device.status.some(s => ['down', 'fault', 'alarm'].includes(s.toLowerCase()))) {
            criticalDevices.push({
              name: device.name,
              type: 'n2',
              status: device.status,
              issues: device.status.filter(s => ['down', 'fault', 'alarm'].includes(s.toLowerCase())),
              location: jaceName
            });
          }
        });

        // Count alarms
        const deviceAlarms = n2Data.devices.filter(d => d.status.includes('unackedAlarm')).length;
        alarmSummary.total += deviceAlarms;
        alarmSummary.unacknowledged += deviceAlarms;
        alarmSummary.byType['N2'] = (alarmSummary.byType['N2'] || 0) + deviceAlarms;
      }
    });

    // Calculate overall health score
    const totalDevices = Object.values(networkSegmentHealth).reduce((sum, segment) => sum + segment.total, 0);
    const healthyDevices = Object.values(networkSegmentHealth).reduce((sum, segment) => sum + segment.healthy, 0);
    const deviceHealthScore = totalDevices > 0 ? (healthyDevices / totalDevices) * 100 : 100;

    const avgJaceHealth = jaceHealth.length > 0 ?
      jaceHealth.reduce((sum, jace) => sum + jace.onlinePercentage, 0) / jaceHealth.length : 100;

    const overallHealth = Math.round((deviceHealthScore + avgJaceHealth) / 2);

    // Performance metrics (simplified calculation)
    const avgCpuUsage = jaceHealth.length > 0 ?
      jaceHealth.reduce((sum, jace) => sum + jace.cpuUsage, 0) / jaceHealth.length : 0;
    const avgMemoryUsage = jaceHealth.length > 0 ?
      jaceHealth.reduce((sum, jace) => sum + jace.memoryUsage, 0) / jaceHealth.length : 0;

    return {
      overallHealth,
      criticalDevices,
      networkSegmentHealth,
      jaceHealth,
      alarmSummary,
      performanceMetrics: {
        systemLoad: Math.round((avgCpuUsage + avgMemoryUsage) / 2),
        responseTime: 100 - Math.round(avgCpuUsage / 2), // Simplified inverse relationship
        throughput: Math.round(overallHealth * 0.8), // Based on device health
        reliability: Math.round(overallHealth * 0.9) // Based on overall health
      }
    };
  }

  /**
   * Analyze license utilization and capacity
   */
  static analyzeLicenseUtilization(crossValidatedData: CrossValidatedData): LicenseUtilization {
    const platformLicenses: PlatformLicense[] = [];

    // Collect platform licenses from supervisor or first JACE
    const platformData = crossValidatedData.supervisor?.platform ||
                       Object.values(crossValidatedData.jaces)[0]?.platform;

    if (platformData) {
      platformLicenses.push(...platformData.licenses);
    }

    // Calculate device utilization
    let bacnetTotal = 0, n2Total = 0;

    Object.values(crossValidatedData.jaces).forEach(jace => {
      bacnetTotal += jace.drivers.bacnet?.devices.length || 0;
      n2Total += jace.drivers.n2?.devices.length || 0;
    });

    const totalDevices = bacnetTotal + n2Total;

    // Extract capacity limits from resource data
    const resourceData = crossValidatedData.supervisor?.resources ||
                        Object.values(crossValidatedData.jaces)[0]?.resources;

    const deviceLimit = resourceData?.metrics.capacities.devices.limit || totalDevices;
    const pointLimit = resourceData?.metrics.capacities.points.limit || null;
    const pointCurrent = resourceData?.metrics.capacities.points.current || 0;

    const deviceUtilization = {
      bacnet: {
        current: bacnetTotal,
        licensed: Math.round(deviceLimit * 0.6), // Assume 60% allocation for BACnet
        percentage: Math.round((bacnetTotal / (deviceLimit * 0.6)) * 100)
      },
      n2: {
        current: n2Total,
        licensed: Math.round(deviceLimit * 0.4), // Assume 40% allocation for N2
        percentage: Math.round((n2Total / (deviceLimit * 0.4)) * 100)
      },
      total: {
        current: totalDevices,
        licensed: deviceLimit,
        percentage: Math.round((totalDevices / deviceLimit) * 100)
      }
    };

    const pointUtilization = {
      current: pointCurrent,
      limit: pointLimit,
      percentage: pointLimit ? Math.round((pointCurrent / pointLimit) * 100) : 0
    };

    // Capacity analysis
    const capacityAnalysis = {
      devices: {
        used: totalDevices,
        available: deviceLimit - totalDevices,
        utilization: Math.round((totalDevices / deviceLimit) * 100)
      },
      histories: {
        used: resourceData?.metrics.capacities.histories.current || 0,
        available: resourceData?.metrics.capacities.histories.limit,
        utilization: resourceData?.metrics.capacities.histories.limit ?
          Math.round(((resourceData.metrics.capacities.histories.current || 0) / resourceData.metrics.capacities.histories.limit) * 100) : 0
      },
      links: {
        used: resourceData?.metrics.capacities.links.current || 0,
        available: resourceData?.metrics.capacities.links.limit,
        utilization: resourceData?.metrics.capacities.links.limit ?
          Math.round(((resourceData.metrics.capacities.links.current || 0) / resourceData.metrics.capacities.links.limit) * 100) : 0
      },
      networks: {
        used: resourceData?.metrics.capacities.networks.current || 0,
        available: resourceData?.metrics.capacities.networks.limit,
        utilization: resourceData?.metrics.capacities.networks.limit ?
          Math.round(((resourceData.metrics.capacities.networks.current || 0) / resourceData.metrics.capacities.networks.limit) * 100) : 0
      },
      schedules: {
        used: resourceData?.metrics.capacities.schedules.current || 0,
        available: resourceData?.metrics.capacities.schedules.limit,
        utilization: resourceData?.metrics.capacities.schedules.limit ?
          Math.round(((resourceData.metrics.capacities.schedules.current || 0) / resourceData.metrics.capacities.schedules.limit) * 100) : 0
      }
    };

    // Generate recommendations
    const deviceUtilizationPercent = capacityAnalysis.devices.utilization;
    const upgradeNeeded = deviceUtilizationPercent > 80;
    const suggestedActions: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    let costImpact: 'none' | 'low' | 'medium' | 'high' = 'none';

    if (deviceUtilizationPercent > 90) {
      suggestedActions.push('Immediate license upgrade required - approaching device limit');
      riskLevel = 'high';
      costImpact = 'high';
    } else if (deviceUtilizationPercent > 80) {
      suggestedActions.push('Plan license upgrade within 6 months');
      riskLevel = 'medium';
      costImpact = 'medium';
    } else if (deviceUtilizationPercent > 70) {
      suggestedActions.push('Monitor device growth - upgrade may be needed within 12 months');
      riskLevel = 'medium';
      costImpact = 'low';
    }

    if (pointUtilization.percentage > 80) {
      suggestedActions.push('Point capacity approaching limit - consider point optimization');
    }

    return {
      platformLicenses,
      deviceUtilization,
      pointUtilization,
      capacityAnalysis,
      recommendations: {
        upgradeNeeded,
        suggestedActions,
        riskLevel,
        costImpact
      }
    };
  }

  /**
   * Generate system insights and analytics
   */
  static generateSystemInsights(crossValidatedData: CrossValidatedData): SystemInsights {
    const vendorCounts: Record<string, { count: number; models: Set<string>; healthyDevices: number; totalDevices: number }> = {};
    const niagaraVersions: Record<string, number> = {};
    const hardwareModels: Record<string, number> = {};
    let totalDevices = 0;

    // Analyze devices by vendor
    Object.values(crossValidatedData.jaces).forEach(jace => {
      // Platform version tracking
      if (jace.platform?.summary.daemonVersion) {
        niagaraVersions[jace.platform.summary.daemonVersion] =
          (niagaraVersions[jace.platform.summary.daemonVersion] || 0) + 1;
      }

      if (jace.platform?.summary.model) {
        hardwareModels[jace.platform.summary.model] =
          (hardwareModels[jace.platform.summary.model] || 0) + 1;
      }

      // BACnet devices
      if (jace.drivers.bacnet) {
        jace.drivers.bacnet.devices.forEach(device => {
          totalDevices++;
          const vendor = device.vendor || 'Unknown';

          if (!vendorCounts[vendor]) {
            vendorCounts[vendor] = { count: 0, models: new Set(), healthyDevices: 0, totalDevices: 0 };
          }

          vendorCounts[vendor].count++;
          vendorCounts[vendor].totalDevices++;
          vendorCounts[vendor].models.add(device.model || 'Unknown');

          if (device.status.every(s => !['down', 'fault', 'alarm'].includes(s.toLowerCase()))) {
            vendorCounts[vendor].healthyDevices++;
          }
        });
      }

      // N2 devices (vendor info not available in N2 exports typically)
      if (jace.drivers.n2) {
        totalDevices += jace.drivers.n2.devices.length;
      }
    });

    // Convert vendor analysis
    const byVendor: Record<string, { count: number; models: string[]; health: number }> = {};
    Object.entries(vendorCounts).forEach(([vendor, data]) => {
      byVendor[vendor] = {
        count: data.count,
        models: Array.from(data.models),
        health: data.totalDevices > 0 ? Math.round((data.healthyDevices / data.totalDevices) * 100) : 100
      };
    });

    const dominantVendor = Object.entries(byVendor).reduce((max, [vendor, data]) =>
      data.count > (byVendor[max] || { count: 0 }).count ? vendor : max, 'Unknown');

    const diversityScore = Math.min(Object.keys(byVendor).length * 10, 100); // More vendors = higher diversity

    // Network topology analysis
    const jaceCount = Object.keys(crossValidatedData.jaces).length;
    const supervisorCount = crossValidatedData.supervisor ? 1 : 0;

    const networkSegments = [
      { type: 'BACnet', nodeCount: Object.values(crossValidatedData.jaces).reduce((sum, jace) =>
          sum + (jace.drivers.bacnet?.devices.length || 0), 0),
        health: Object.values(byVendor).reduce((sum, vendor) => sum + vendor.health, 0) / Object.keys(byVendor).length || 100 },
      { type: 'N2', nodeCount: Object.values(crossValidatedData.jaces).reduce((sum, jace) =>
          sum + (jace.drivers.n2?.devices.length || 0), 0),
        health: 85 } // N2 typically more stable
    ];

    // Risk assessment
    const riskFactors: SystemInsights['riskAssessment']['riskFactors'] = [];

    // Version consistency risk
    if (Object.keys(niagaraVersions).length > 1) {
      riskFactors.push({
        category: 'Version Inconsistency',
        severity: 'medium',
        description: `Multiple Niagara versions detected: ${Object.keys(niagaraVersions).join(', ')}`,
        recommendation: 'Standardize on a single Niagara version for easier maintenance'
      });
    }

    // Vendor dependency risk
    const vendorDominance = Math.max(...Object.values(byVendor).map(v => v.count)) / totalDevices;
    if (vendorDominance > 0.8) {
      riskFactors.push({
        category: 'Vendor Lock-in',
        severity: 'medium',
        description: `Over 80% of devices from single vendor (${dominantVendor})`,
        recommendation: 'Consider diversifying vendor portfolio to reduce dependency risk'
      });
    }

    // Device health risk
    const avgHealth = Object.values(byVendor).reduce((sum, vendor) => sum + vendor.health, 0) / Object.keys(byVendor).length;
    if (avgHealth < 80) {
      riskFactors.push({
        category: 'Device Health',
        severity: 'high',
        description: `Average device health below 80% (${Math.round(avgHealth)}%)`,
        recommendation: 'Investigate and resolve device communication issues'
      });
    }

    const overallRisk: 'low' | 'medium' | 'high' | 'critical' =
      riskFactors.some(r => r.severity === 'critical') ? 'critical' :
      riskFactors.some(r => r.severity === 'high') ? 'high' :
      riskFactors.some(r => r.severity === 'medium') ? 'medium' : 'low';

    // Upgrade recommendations
    const recommendedUpgrades: string[] = [];

    // Find oldest Niagara version
    const versions = Object.keys(niagaraVersions).sort();
    if (versions.length > 0 && versions[0] < '4.10') {
      recommendedUpgrades.push(`Upgrade from Niagara ${versions[0]} to latest stable version`);
    }

    // Hardware upgrade recommendations
    const oldHardware = Object.entries(hardwareModels).filter(([model]) =>
      model.includes('JACE') && !model.includes('8000')).map(([model]) => model);
    if (oldHardware.length > 0) {
      recommendedUpgrades.push(`Consider upgrading legacy hardware: ${oldHardware.join(', ')}`);
    }

    return {
      vendorAnalysis: {
        byVendor,
        dominantVendor,
        diversityScore
      },
      networkTopology: {
        supervisorNodes: supervisorCount,
        jaceNodes: jaceCount,
        totalDevices,
        networkSegments
      },
      systemEvolution: {
        niagaraVersions,
        hardwareModels,
        recommendedUpgrades
      },
      riskAssessment: {
        overallRisk,
        riskFactors
      }
    };
  }

  /**
   * Process multiple files and return structured data
   * Handles file parsing, validation, and cross-validation
   */
  static async processFiles(files: File[]): Promise<ProcessedTridiumData> {
    const parsedFiles: Record<string, any> = {};
    const errors: string[] = [];
    const processedFiles: string[] = [];
    const devices: any[] = [];
    const resources: any[] = [];
    const networks: any[] = [];
    let validationWarnings: string[] = [];

    // Process each file individually
    for (const file of files) {
      try {
        const content = await file.text();
        const fileName = file.name.toLowerCase();
        const key = `${this.detectFileTypeFromName(fileName).type}_${file.name}`;
        
        processedFiles.push(file.name);

        if (fileName.includes('n2') && fileName.includes('.csv')) {
          const parsed = this.parseN2Export(content);
          parsedFiles[key] = parsed;
          devices.push(...parsed.devices.map(d => ({ ...d, source: 'n2', protocol: 'N2' })));
          if (parsed.analysis.alerts.length > 0) {
            validationWarnings.push(...parsed.analysis.alerts.map(a => a.message));
          }
        } else if (fileName.includes('bacnet') && fileName.includes('.csv')) {
          const parsed = this.parseBACnetExport(content);
          parsedFiles[key] = parsed;
          devices.push(...parsed.devices.map(d => ({ ...d, source: 'bacnet', protocol: 'BACnet' })));
          if (parsed.analysis.alerts.length > 0) {
            validationWarnings.push(...parsed.analysis.alerts.map(a => a.message));
          }
        } else if (fileName.includes('resource') && fileName.includes('.csv')) {
          const parsed = this.parseResourceExport(content);
          parsedFiles[key] = parsed;
          resources.push({
            name: file.name,
            metrics: parsed.metrics,
            warnings: parsed.warnings,
            source: 'resource'
          });
          if (parsed.warnings.length > 0) {
            validationWarnings.push(...parsed.warnings);
          }
        } else if (fileName.includes('platform') && fileName.includes('.txt')) {
          const parsed = this.parsePlatformDetails(content);
          parsedFiles[key] = parsed;
          // Add platform data to resources for system information
          resources.push({
            name: file.name,
            platform: parsed.summary,
            modules: parsed.modules,
            source: 'platform'
          });
        } else if (fileName.includes('niagara') && fileName.includes('net') && fileName.includes('.csv')) {
          const parsed = this.parseNiagaraNetworkExport(content);
          parsedFiles[key] = parsed;
          networks.push(...parsed.network.nodes.map(n => ({ ...n, source: 'network' })));
          if (parsed.analysis.alerts.length > 0) {
            validationWarnings.push(...parsed.analysis.alerts.map(a => a.message));
          }
        } else {
          // Try generic detection and parsing
          const detected = this.detectFileFormat(file.name, content);
          if (detected.confidence > 50) {
            try {
              switch (detected.type) {
                case 'n2':
                  const n2Data = this.parseN2Export(content);
                  parsedFiles[key] = n2Data;
                  devices.push(...n2Data.devices.map(d => ({ ...d, source: 'n2', protocol: 'N2' })));
                  break;
                case 'bacnet':
                  const bacnetData = this.parseBACnetExport(content);
                  parsedFiles[key] = bacnetData;
                  devices.push(...bacnetData.devices.map(d => ({ ...d, source: 'bacnet', protocol: 'BACnet' })));
                  break;
                case 'resource':
                  const resourceData = this.parseResourceExport(content);
                  parsedFiles[key] = resourceData;
                  resources.push({ name: file.name, metrics: resourceData.metrics, source: 'resource' });
                  break;
                case 'platform':
                  const platformData = this.parsePlatformDetails(content);
                  parsedFiles[key] = platformData;
                  resources.push({ name: file.name, platform: platformData.summary, source: 'platform' });
                  break;
                case 'network':
                  const networkData = this.parseNiagaraNetworkExport(content);
                  parsedFiles[key] = networkData;
                  networks.push(...networkData.network.nodes.map(n => ({ ...n, source: 'network' })));
                  break;
              }
            } catch (parseError) {
              console.warn(`Failed to parse ${file.name} as ${detected.type}:`, parseError);
              errors.push(`Failed to parse ${file.name}: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
            }
          } else {
            errors.push(`Unable to determine file type for ${file.name} (confidence: ${detected.confidence}%)`);
          }
        }
      } catch (error) {
        console.error(`Error processing ${file.name}:`, error);
        errors.push(`Error processing ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    // Cross-validate the parsed data
    const crossValidated = this.crossValidateData(parsedFiles);
    validationWarnings.push(...crossValidated.validationWarnings);

    return {
      processedFiles,
      devices,
      resources,
      networks,
      errors,
      validationWarnings,
      crossValidatedData: crossValidated,
      metadata: {
        totalFiles: files.length,
        processedFiles: processedFiles.length,
        failedFiles: files.length - processedFiles.length,
        processingTime: Date.now(),
        architecture: crossValidated.architecture
      }
    };
  }

  /**
   * Cross-validate all parsed data for consistency
   * Specification: Match versions; link devices; validate architecture
   */
  static crossValidateData(parsedFiles: Record<string, any>): CrossValidatedData {
    const validationWarnings: string[] = [];
    const consistencyErrors: string[] = [];

    // Determine architecture
    const hasNetworkExport = parsedFiles.network !== undefined;
    const hasSupervisorFiles = Object.keys(parsedFiles).some(key => key.includes('Supervisor'));

    const architecture: 'single-jace' | 'multi-jace' | 'supervisor' =
      hasNetworkExport ? 'supervisor' :
      hasSupervisorFiles ? 'multi-jace' :
      'single-jace';

    // Cross-validate versions (e.g., Niagara 4.12.1.16 consistent?)
    const versions = new Set<string>();
    Object.values(parsedFiles).forEach((data: any) => {
      if (data?.metrics?.versions?.niagara) {
        versions.add(data.metrics.versions.niagara);
      }
      if (data?.summary?.daemonVersion) {
        versions.add(data.summary.daemonVersion);
      }
      if (data?.network?.nodes) {
        data.network.nodes.forEach((node: any) => {
          if (node.version) versions.add(node.version);
        });
      }
    });

    const versionConsistency = versions.size <= 1;
    if (!versionConsistency) {
      consistencyErrors.push(`Version mismatch: Supervisor 4.12 vs. JACE 4.7 - ${Array.from(versions).join(', ')}`);
    }

    // Validate device counts
    let deviceCountConsistency = true;
    const supervisorResources = Object.values(parsedFiles).find((data: any) => data?.metrics?.capacities?.devices);
    if (supervisorResources) {
      const reportedDevices = supervisorResources.metrics.capacities.devices.current;
      const bacnetDevices = parsedFiles.bacnet?.devices?.length || 0;
      const n2Devices = parsedFiles.n2?.devices?.length || 0;
      const totalFoundDevices = bacnetDevices + n2Devices;

      if (Math.abs(reportedDevices - totalFoundDevices) > 5) {
        deviceCountConsistency = false;
        consistencyErrors.push(`Device count mismatch: Resource export reports ${reportedDevices}, found ${totalFoundDevices} in driver exports`);
      }
    }

    // Link devices (e.g., BACnet ID to Resource capacities)
    const networkTopologyConsistency = this.validateNetworkTopology(parsedFiles);
    const capacityConsistency = this.validateCapacityConsistency(parsedFiles);

    // Build structured JACE data
    const jaces: Record<string, any> = {};

    if (architecture === 'supervisor' && parsedFiles.network) {
      // Build JACE structure from network export
      parsedFiles.network.network.nodes.forEach((node: any) => {
        jaces[node.name] = {
          networkInfo: node,
          drivers: {}
        };
      });
    } else {
      // Single JACE or inferred structure
      jaces['default'] = {
        drivers: {}
      };
    }

    // Assign parsed data to appropriate JACEs
    Object.entries(parsedFiles).forEach(([key, data]) => {
      if (key.includes('Platform') || key.includes('Resource')) {
        const jaceKey = this.extractJaceNameFromKey(key) || 'default';
        if (!jaces[jaceKey]) jaces[jaceKey] = { drivers: {} };

        if (key.includes('Platform')) {
          jaces[jaceKey].platform = data;
        } else if (key.includes('Resource')) {
          jaces[jaceKey].resources = data;
        }
      } else if (key.includes('Bacnet') || key.includes('N2') || key.includes('Modbus')) {
        const jaceKey = this.extractJaceNameFromKey(key) || 'default';
        if (!jaces[jaceKey]) jaces[jaceKey] = { drivers: {} };

        if (key.includes('Bacnet')) {
          jaces[jaceKey].drivers.bacnet = data;
        } else if (key.includes('N2')) {
          jaces[jaceKey].drivers.n2 = data;
        } else if (key.includes('Modbus')) {
          jaces[jaceKey].drivers.modbus = data;
        }
      }
    });

    const baseResult: CrossValidatedData = {
      architecture,
      jaces,
      supervisor: architecture === 'supervisor' ? {
        network: parsedFiles.network,
        platform: parsedFiles.supervisorPlatform,
        resources: parsedFiles.supervisorResources
      } : undefined,
      validationWarnings,
      consistencyErrors,
      crossValidation: {
        versionConsistency,
        deviceCountConsistency,
        networkTopologyConsistency,
        capacityConsistency
      }
    };

    // Generate enhanced analysis if data is complete enough
    try {
      if (Object.keys(jaces).length > 0) {
        baseResult.healthAnalysis = this.analyzeSystemHealth(baseResult);
        baseResult.licenseUtilization = this.analyzeLicenseUtilization(baseResult);
        baseResult.systemInsights = this.generateSystemInsights(baseResult);
      }
    } catch (error) {
      validationWarnings.push(`Enhanced analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return baseResult;
  }

  // Helper methods for parsing specific sections and values

  private static parseResourceValue(name: string, valueStr: string): ResourceMetric | null {
    if (!name || !valueStr) return null;

    // Handle percentage values
    if (valueStr.includes('%')) {
      const percentage = parseFloat(valueStr.replace('%', ''));
      return { name, value: percentage, unit: '%' };
    }

    // Handle memory values with units (e.g., "477 MB") - normalize to MB
    const memoryMatch = valueStr.match(/([\d,]+)\s*(MB|KB|GB)/);
    if (memoryMatch) {
      const rawValue = parseInt(memoryMatch[1].replace(/,/g, ''));
      const unit = memoryMatch[2];
      
      // Normalize all memory values to MB
      let valueInMB: number;
      switch (unit) {
        case 'KB': 
          valueInMB = rawValue / 1024;
          break;
        case 'GB': 
          valueInMB = rawValue * 1024;
          break;
        case 'MB':
        default:
          valueInMB = rawValue;
      }
      
      return { name, value: valueInMB, unit: 'MB' };
    }

    // Handle values with limits (e.g., "3,303 (Limit: 5,000)")
    const limitMatch = valueStr.match(/([\d,]+)\s*\((?:Limit:\s*)?([\d,]+|none)\)/);
    if (limitMatch) {
      const value = parseInt(limitMatch[1].replace(/,/g, ''));
      const limitStr = limitMatch[2];
      const limit = limitStr === 'none' ? null : parseInt(limitStr.replace(/,/g, ''));
      return { name, value, limit };
    }

    // Handle peak values (e.g., "0 (Peak 2212)")
    const peakMatch = valueStr.match(/([\d,]+)\s*\(Peak\s+([\d,]+)\)/);
    if (peakMatch) {
      const value = parseInt(peakMatch[1].replace(/,/g, ''));
      const peak = parseInt(peakMatch[2].replace(/,/g, ''));
      return { name, value, peak };
    }

    // Handle numeric values
    const numericMatch = valueStr.match(/^([\d,]+(?:\.\d+)?)$/);
    if (numericMatch) {
      const value = parseFloat(numericMatch[1].replace(/,/g, ''));
      return { name, value };
    }

    // Handle time values and other strings
    return { name, value: valueStr };
  }

  private static parseMemoryValue(valueStr: string): number {
    const match = valueStr.match(/([\d,]+)\s*(MB|KB|GB)/);
    if (!match) return 0;

    const value = parseInt(match[1].replace(/,/g, ''));
    const unit = match[2];

    switch (unit) {
      case 'KB': return value / 1024;
      case 'MB': return value;
      case 'GB': return value * 1024;
      default: return value;
    }
  }

  private static parseTridiumTimestamp(dateStr: string): Date | null {
    try {
      // Handle Tridium format: "19-Aug-25 10:11 PM EDT"
      // Convert to ISO format for parsing
      const cleanStr = dateStr.replace(/\\s+(EDT|EST|CST|PST|MST)$/, '');
      const parts = cleanStr.match(/(\\d{1,2})-(\\w{3})-(\\d{2})\\s+(\\d{1,2}):(\\d{2})\\s*(AM|PM)/);

      if (parts) {
        const [, day, month, year, hour, minute, ampm] = parts;
        const monthMap: Record<string, string> = {
          'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
        };

        const fullYear = `20${year}`;
        const monthNum = monthMap[month] || '01';
        let hourNum = parseInt(hour);

        if (ampm === 'PM' && hourNum !== 12) hourNum += 12;
        if (ampm === 'AM' && hourNum === 12) hourNum = 0;

        const isoStr = `${fullYear}-${monthNum}-${day.padStart(2, '0')}T${hourNum.toString().padStart(2, '0')}:${minute}:00`;
        return new Date(isoStr);
      }
    } catch (e) {
      console.warn('Failed to parse Tridium timestamp:', dateStr);
    }
    return null;
  }

  private static parsePlatformSummary(lines: string[]): PlatformParsedData['summary'] {
    const getValue = (pattern: RegExp): string => {
      const line = lines.find(l => pattern.test(l));
      const match = line?.match(pattern);
      return match ? match[1].trim() : '';
    };

    const getNumericValue = (pattern: RegExp): number => {
      const value = getValue(pattern);
      return parseInt(value.replace(/,/g, '')) || 0;
    };

    // Parse enabled profiles
    const enabledProfilesStr = getValue(/Enabled Runtime Profiles:\\s*(.+)/);
    const enabledProfiles = enabledProfilesStr ? enabledProfilesStr.split(',').map(p => p.trim()) : [];

    return {
      daemonVersion: getValue(/Daemon Version:\\s*(.+)/),
      model: getValue(/Model:\\s*(.+)/),
      product: getValue(/Product:\\s*(.+)/),
      hostId: getValue(/Host ID:\\s*(.+)/),
      hostIdStatus: getValue(/Host ID Status:\\s*(.+)/),
      architecture: getValue(/Architecture:\\s*(.+)/),
      cpuCount: getNumericValue(/Number of CPUs:\\s*(\\d+)/),
      ramFree: getNumericValue(/Physical RAM\\s+Free\\s+([\\d,]+)/),
      ramTotal: getNumericValue(/Physical RAM\\s+Free\\s+[\\d,]+\\s+KB\\s+([\\d,]+)/),
      os: getValue(/Operating System:\\s*(.+)/),
      java: getValue(/Java Virtual Machine:\\s*(.+)/),
      httpsPort: getNumericValue(/Daemon HTTP Port:\\s*(\\d+)/),
      foxPort: getNumericValue(/Port:\\s*(\\d+)/),
      niagaraRuntime: getValue(/Niagara Runtime:\\s*(.+)/),
      systemHome: getValue(/System Home:\\s*(.+)/),
      userHome: getValue(/User Home:\\s*(.+)/),
      enabledProfiles,
      platformTlsSupport: getValue(/Platform TLS Support:\\s*(.+)/),
      tlsProtocol: getValue(/Protocol:\\s*(.+)/),
      certificate: getValue(/Certificate:\\s*(.+)/)
    };
  }

  private static parsePlatformModules(lines: string[]): PlatformModule[] {
    const modules: PlatformModule[] = [];
    let inModulesSection = false;

    for (const line of lines) {
      if (line === 'Modules') {
        inModulesSection = true;
        continue;
      }

      if (inModulesSection && (line === 'Other Parts' || line === 'Applications' || line === 'Licenses')) {
        break;
      }

      if (inModulesSection && line.includes('(') && line.includes(')')) {
        const match = line.match(/^\\s*([^(]+)\\s*\\(([^)]+)\\s+([^)]+)\\)$/);
        if (match) {
          const [, name, vendor, version] = match;
          const profiles = this.extractModuleProfiles(name.trim());
          modules.push({
            name: name.trim(),
            vendor: vendor.trim(),
            version: version.trim(),
            profiles
          });
        }
      }
    }

    return modules;
  }

  private static extractModuleProfiles(moduleName: string): string[] {
    const profiles: string[] = [];
    if (moduleName.includes('-rt')) profiles.push('rt');
    if (moduleName.includes('-ux')) profiles.push('ux');
    if (moduleName.includes('-wb')) profiles.push('wb');
    return profiles;
  }

  private static parsePlatformLicenses(lines: string[]): PlatformLicense[] {
    const licenses: PlatformLicense[] = [];
    let inLicensesSection = false;

    for (const line of lines) {
      if (line === 'Licenses') {
        inLicensesSection = true;
        continue;
      }

      if (inLicensesSection && (line === 'Certificates' || line === 'Other Parts' || line === '')) {
        break;
      }

      if (inLicensesSection && line.includes('(') && line.includes(')')) {
        const match = line.match(/^\\s*([^(]+)\\s*\\(([^)]+)\\s+([^)]+)\\s*-\\s*(.+)\\)$/);
        if (match) {
          const [, name, vendor, version, expires] = match;
          licenses.push({
            name: name.trim(),
            vendor: vendor.trim(),
            version: version.trim(),
            expires: expires.trim()
          });
        }
      }
    }

    return licenses;
  }

  private static parsePlatformCertificates(lines: string[]): PlatformLicense[] {
    const certificates: PlatformLicense[] = [];
    let inCertificatesSection = false;

    for (const line of lines) {
      if (line === 'Certificates') {
        inCertificatesSection = true;
        continue;
      }

      if (inCertificatesSection && line === '') {
        break;
      }

      if (inCertificatesSection && line.includes('(') && line.includes(')')) {
        const match = line.match(/^\\s*([^(]+)\\s*\\(([^)]+)\\s*-\\s*(.+)\\)$/);
        if (match) {
          const [, name, vendor, expires] = match;
          certificates.push({
            name: name.trim(),
            vendor: vendor.trim(),
            version: '',
            expires: expires.trim()
          });
        }
      }
    }

    return certificates;
  }

  private static parsePlatformApplications(lines: string[]): PlatformParsedData['applications'] {
    const applications: PlatformParsedData['applications'] = [];
    let inApplicationsSection = false;

    for (const line of lines) {
      if (line === 'Applications') {
        inApplicationsSection = true;
        continue;
      }

      if (inApplicationsSection && (line === 'Lexicons' || line === 'Licenses' || line === '')) {
        break;
      }

      if (inApplicationsSection && line.includes('station')) {
        const match = line.match(/station\\s+(\\w+)\\s+(.+)/);
        if (match) {
          const [, name, configStr] = match;
          const config = this.parseApplicationConfig(configStr);
          applications.push({
            name,
            status: config.status,
            autostart: config.autostart,
            autorestart: config.autorestart,
            ports: config.ports
          });
        }
      }
    }

    return applications;
  }

  private static parsePlatformFilesystems(lines: string[]): PlatformParsedData['filesystems'] {
    const filesystems: PlatformParsedData['filesystems'] = [];
    let inFilesystemSection = false;

    for (const line of lines) {
      if (line.includes('Filesystem') && line.includes('Free') && line.includes('Total')) {
        inFilesystemSection = true;
        continue;
      }

      if (inFilesystemSection && line === '') {
        break;
      }

      if (inFilesystemSection && line.includes('KB')) {
        // Accept lines with or without file counts
        const match = line.match(/^\s*([^\s]+)\s+([\d,]+)\s*KB\s+([\d,]+)\s*KB(?:\s+(\d+)\s+(\d+))?$/);
        if (match) {
          const [, path, freeStr, totalStr, files, maxFiles] = match;
          filesystems.push({
            path: path.trim(),
            free: parseInt(freeStr.replace(/,/g, '')),
            total: parseInt(totalStr.replace(/,/g, '')),
            files: files ? parseInt(files) : 0,
            maxFiles: maxFiles ? parseInt(maxFiles) : 0
          });
        }
      }
    }

    return filesystems;
  }

  private static parsePlatformOtherParts(lines: string[]): PlatformParsedData['otherParts'] {
    const otherParts: PlatformParsedData['otherParts'] = [];
    let inOtherPartsSection = false;

    for (const line of lines) {
      if (line === 'Other Parts') {
        inOtherPartsSection = true;
        continue;
      }

      if (inOtherPartsSection && (line === 'Applications' || line === 'Licenses' || line === '')) {
        break;
      }

      if (inOtherPartsSection && line.includes('(') && line.includes(')')) {
        const match = line.match(/^\\s*([^(]+)\\s*\\(([^)]+)\\s+([^)]+)\\)$/);
        if (match) {
          const [, name, vendor, version] = match;
          otherParts.push({
            name: name.trim(),
            version: version.trim()
          });
        }
      }
    }

    return otherParts;
  }

  /**
   * Enhanced platform data analysis with threshold checks and health scoring
   */
  private static enhancePlatformData(platformData: PlatformParsedData): PlatformParsedData {
    const alerts: PlatformParsedData['analysis']['alerts'] = [];
    const recommendations: string[] = [];
    let healthScore = 100;

    // Memory analysis
    const memoryUtilization = platformData.summary.ramTotal > 0
      ? Math.round(((platformData.summary.ramTotal - platformData.summary.ramFree) / platformData.summary.ramTotal) * 100)
      : 0;

    if (memoryUtilization > 85) {
      alerts.push({
        severity: 'critical',
        category: 'memory',
        message: `RAM usage at ${memoryUtilization}% is critically high`,
        threshold: 85,
        value: memoryUtilization
      });
      recommendations.push('Consider adding more memory or reducing system load');
      healthScore -= 20;
    } else if (memoryUtilization > 75) {
      alerts.push({
        severity: 'warning',
        category: 'memory',
        message: `RAM usage at ${memoryUtilization}% is high`,
        threshold: 75,
        value: memoryUtilization
      });
      recommendations.push('Monitor memory usage trends');
      healthScore -= 10;
    }

    // Disk analysis
    let diskUtilization = 0;
    const rootFilesystem = platformData.filesystems.find(fs => fs.path === '/' || fs.path.includes('root'));
    if (rootFilesystem && rootFilesystem.total > 0) {
      diskUtilization = Math.round(((rootFilesystem.total - rootFilesystem.free) / rootFilesystem.total) * 100);

      const diskThreshold = platformData.summary.model.includes('JACE') ? 80 : 85; // JACE has lower threshold
      if (diskUtilization > diskThreshold + 10) {
        alerts.push({
          severity: 'critical',
          category: 'disk',
          message: `Disk usage at ${diskUtilization}% is critically high`,
          threshold: diskThreshold + 10,
          value: diskUtilization
        });
        recommendations.push('Free up disk space immediately');
        healthScore -= 15;
      } else if (diskUtilization > diskThreshold) {
        alerts.push({
          severity: 'warning',
          category: 'disk',
          message: `Disk usage at ${diskUtilization}% is high`,
          threshold: diskThreshold,
          value: diskUtilization
        });
        recommendations.push('Monitor disk usage and clean up unnecessary files');
        healthScore -= 8;
      }
    }

    // Platform type detection
    const platformType = platformData.summary.model.includes('JACE') ? 'JACE' :
                        platformData.summary.model.includes('Supervisor') ? 'Supervisor' : 'Unknown';

    // Version compatibility analysis
    const niagaraVersion = platformData.summary.daemonVersion;
    const versionCompatibility = this.analyzeNiagaraVersion(niagaraVersion);

    if (!versionCompatibility.isSupported) {
      alerts.push({
        severity: 'critical',
        category: 'version',
        message: `Niagara ${niagaraVersion} is no longer supported`,
        value: parseFloat(niagaraVersion.split('.')[1]) || 0
      });
      recommendations.push(`Upgrade to supported Niagara version (${versionCompatibility.latestVersion || 'latest'})`);
      healthScore -= 25;
    } else if (versionCompatibility.upgradeRecommended) {
      alerts.push({
        severity: 'warning',
        category: 'version',
        message: `Niagara ${niagaraVersion} upgrade recommended`,
        value: parseFloat(niagaraVersion.split('.')[1]) || 0
      });
      recommendations.push(`Consider upgrading to Niagara ${versionCompatibility.latestVersion || 'latest'} for latest features and security updates`);
      healthScore -= 5;
    }

    // Module analysis
    const moduleAnalysis = this.analyzeModules(platformData.modules);
    if (moduleAnalysis.unsupportedModules.length > 0) {
      alerts.push({
        severity: 'warning',
        category: 'version',
        message: `${moduleAnalysis.unsupportedModules.length} potentially unsupported modules detected`
      });
      recommendations.push(`Review modules: ${moduleAnalysis.unsupportedModules.slice(0, 3).join(', ')}${moduleAnalysis.unsupportedModules.length > 3 ? '...' : ''}`);
      healthScore -= moduleAnalysis.unsupportedModules.length * 2;
    }

    // License analysis
    const licenseStatus = this.analyzeLicenses(platformData.licenses);
    if (licenseStatus.expired > 0) {
      alerts.push({
        severity: 'critical',
        category: 'license',
        message: `${licenseStatus.expired} licenses have expired`,
        value: licenseStatus.expired
      });
      recommendations.push('Renew expired licenses immediately');
      healthScore -= licenseStatus.expired * 10;
    } else if (licenseStatus.expiring > 0) {
      alerts.push({
        severity: 'warning',
        category: 'license',
        message: `${licenseStatus.expiring} licenses expire within 30 days`,
        value: licenseStatus.expiring
      });
      recommendations.push('Renew licenses before expiration');
      healthScore -= licenseStatus.expiring * 5;
    }

    // Certificate analysis
    const certificateStatus = this.analyzeCertificates(platformData.certificates);
    if (certificateStatus.expired > 0) {
      alerts.push({
        severity: 'critical',
        category: 'certificate',
        message: `${certificateStatus.expired} certificates have expired`,
        value: certificateStatus.expired
      });
      recommendations.push('Update expired certificates for secure communications');
      healthScore -= certificateStatus.expired * 8;
    } else if (certificateStatus.expiring > 0) {
      alerts.push({
        severity: 'warning',
        category: 'certificate',
        message: `${certificateStatus.expiring} certificates expire within 30 days`,
        value: certificateStatus.expiring
      });
      recommendations.push('Renew certificates before expiration');
      healthScore -= certificateStatus.expiring * 3;
    }

    // Ensure health score doesn't go below 0
    healthScore = Math.max(0, healthScore);

    // Add analysis to platform data
    return {
      ...platformData,
      analysis: {
        healthScore,
        memoryUtilization,
        diskUtilization: diskUtilization > 0 ? diskUtilization : undefined,
        alerts,
        recommendations,
        platformType,
        versionCompatibility,
        moduleAnalysis,
        licenseStatus,
        certificateStatus
      }
    };
  }

  private static analyzeNiagaraVersion(version: string) {
    const majorMinor = version.match(/(\d+)\.(\d+)/);
    if (!majorMinor) return { isSupported: false, isLTS: false, upgradeRecommended: true };

    const major = parseInt(majorMinor[1]);
    const minor = parseInt(majorMinor[2]);

    // Niagara version support matrix (as of 2024)
    const supportedVersions = [
      { major: 4, minor: 15, isLTS: true, isSupported: true },  // Current LTS
      { major: 4, minor: 14, isLTS: false, isSupported: true },
      { major: 4, minor: 13, isLTS: false, isSupported: true },
      { major: 4, minor: 12, isLTS: false, isSupported: true },
      { major: 4, minor: 11, isLTS: false, isSupported: false },
      { major: 4, minor: 10, isLTS: false, isSupported: false }
    ];

    const currentVersion = supportedVersions.find(v => v.major === major && v.minor === minor);
    const isSupported = currentVersion?.isSupported || (major === 4 && minor >= 12);
    const isLTS = currentVersion?.isLTS || false;
    const upgradeRecommended = major < 4 || (major === 4 && minor < 14);

    return {
      isSupported,
      isLTS,
      upgradeRecommended,
      latestVersion: '4.15 LTS'
    };
  }

  private static analyzeModules(modules: PlatformModule[]) {
    const byVendor: Record<string, number> = {};
    const unsupportedModules: string[] = [];
    let thirdPartyCount = 0;

    modules.forEach(module => {
      byVendor[module.vendor] = (byVendor[module.vendor] || 0) + 1;

      if (module.vendor !== 'Tridium' && module.vendor !== 'Johnson Controls') {
        thirdPartyCount++;
      }

      // Check for potentially unsupported modules
      if (module.name.includes('legacy') || module.version.includes('deprecated') ||
          module.name.toLowerCase().includes('old')) {
        unsupportedModules.push(module.name);
      }
    });

    return {
      total: modules.length,
      byVendor,
      thirdPartyCount,
      unsupportedModules
    };
  }

  private static analyzeLicenses(licenses: PlatformLicense[]) {
    let expiring = 0;
    let expired = 0;
    let perpetual = 0;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    licenses.forEach(license => {
      if (license.expires.toLowerCase() === 'never' || license.expires.toLowerCase() === 'perpetual') {
        perpetual++;
      } else {
        try {
          const expiryDate = new Date(license.expires);
          if (expiryDate < now) {
            expired++;
          } else if (expiryDate < thirtyDaysFromNow) {
            expiring++;
          }
        } catch (e) {
          // Assume expired if we can't parse the date
          expired++;
        }
      }
    });

    return {
      total: licenses.length,
      expiring,
      expired,
      perpetual
    };
  }

  private static analyzeCertificates(certificates: PlatformLicense[]) {
    let expiring = 0;
    let expired = 0;
    let selfSigned = 0;
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    certificates.forEach(cert => {
      if (cert.name.toLowerCase().includes('self-signed') || cert.vendor === 'Self') {
        selfSigned++;
      }

      if (cert.expires.toLowerCase() !== 'never' && cert.expires.toLowerCase() !== 'perpetual') {
        try {
          const expiryDate = new Date(cert.expires);
          if (expiryDate < now) {
            expired++;
          } else if (expiryDate < thirtyDaysFromNow) {
            expiring++;
          }
        } catch (e) {
          // Assume expired if we can't parse the date
          expired++;
        }
      }
    });

    return {
      total: certificates.length,
      expiring,
      expired,
      selfSigned
    };
  }

  private static parseApplicationConfig(configStr: string): any {
    const config = {
      status: 'Unknown',
      autostart: false,
      autorestart: false,
      ports: {} as Record<string, number>
    };

    // Parse status
    const statusMatch = configStr.match(/status=([^,]+)/);
    if (statusMatch) {
      config.status = statusMatch[1];
    }

    // Parse boolean flags
    config.autostart = configStr.includes('autostart=true');
    config.autorestart = configStr.includes('autorestart=true');

    // Parse ports
    const portMatches = configStr.matchAll(/(\\w+)=(\\d+)/g);
    for (const match of portMatches) {
      const [, portName, portValue] = match;
      if (['fox', 'foxs', 'http'].includes(portName)) {
        config.ports[portName] = parseInt(portValue);
      }
    }

    return config;
  }

  private static validateNetworkTopology(parsedFiles: Record<string, any>): boolean {
    // Check if network export matches actual JACE discoveries
    const networkExport = parsedFiles.network;
    if (!networkExport) return true;

    const networkJaces = networkExport.network.nodes.map((n: any) => n.name);
    const platformFiles = Object.keys(parsedFiles).filter(k => k.includes('Platform'));

    // Basic topology validation
    return networkJaces.length === 0 || platformFiles.length > 0;
  }

  private static validateCapacityConsistency(parsedFiles: Record<string, any>): boolean {
    // Validate that reported capacities match discovered resources
    let consistent = true;

    Object.values(parsedFiles).forEach((data: any) => {
      if (data?.metrics?.capacities) {
        const capacities = data.metrics.capacities;

        // Check if capacity percentages are reasonable
        Object.values(capacities).forEach((capacity: any) => {
          if (capacity.percentage > 100) {
            consistent = false;
          }
        });
      }
    });

    return consistent;
  }

  private static extractJaceNameFromKey(key: string): string | null {
    // Extract JACE name from file keys like "Jace1_N2xport" or "SF_NERO_FX1_Bacnet"
    const patterns = [
      /^([A-Za-z0-9_]+)_(?:N2xport|Bacnet|Resource|Platform)/,
      /^([A-Za-z0-9_]+)(?:Platform|Resource)/,
      /([A-Za-z0-9_]+)Export/
    ];

    for (const pattern of patterns) {
      const match = key.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  // Vendor/Model normalization for BACnet devices
  private static normalizeBACnetVendor(vendor: string): string {
    const vendorMap: Record<string, string> = {
      'Johnson Controls International': 'JCI',
      'Johnson Controls': 'JCI',
      'JCI': 'JCI',
      'Trane': 'Trane',
      'Honeywell': 'Honeywell',
      'Schneider Electric': 'Schneider',
      'Siemens': 'Siemens',
      'Distech Controls': 'Distech',
      'Delta Controls': 'Delta',
      'KMC Controls': 'KMC',
      'Automated Logic': 'ALC',
      'TSI': 'TSI',
      'Tridium': 'Tridium'
    };

    return vendorMap[vendor] || vendor;
  }

  private static normalizeBACnetModel(model: string): string {
    // Standardize common model naming patterns
    return model
      .replace(/^MS-/, '')  // Remove MS- prefix from JCI models
      .replace(/-0$/, '')   // Remove trailing -0
      .toUpperCase();
  }

  // Format validation methods

  private static validateN2Format(content: string, warnings: string[]) {
    const lines = content.split('\\n');
    const header = lines[0]?.toLowerCase() || '';

    const expectedHeaders = ['name', 'status', 'address', 'controller type'];
    const hasValidHeaders = expectedHeaders.every(h => header.includes(h));

    let confidence = 0;
    if (hasValidHeaders) confidence += 80;
    if (header.includes('controller type')) confidence += 10;
    if (lines.length > 2) confidence += 10;

    // Check for common issues
    if (lines.length < 3) {
      warnings.push('File has very few rows - may be incomplete');
    }

    // Preview first few rows
    const preview = lines.slice(0, 6).map(line => {
      const cols = line.split(',');
      return {
        name: cols[0] || '',
        status: cols[1] || '',
        address: cols[2] || '',
        type: cols[3] || ''
      };
    });

    return {
      type: 'n2' as const,
      confidence,
      warnings,
      preview
    };
  }

  private static validateBACnetFormat(content: string, warnings: string[]) {
    const lines = content.split('\\n');
    const header = lines[0]?.toLowerCase() || '';

    const expectedHeaders = ['name', 'device id', 'status', 'vendor', 'model', 'health'];
    const hasValidHeaders = expectedHeaders.filter(h => header.includes(h)).length;

    let confidence = (hasValidHeaders / expectedHeaders.length) * 100;

    if (header.includes('bacnet')) confidence += 10;
    if (header.includes('health')) confidence += 10;

    // Check for health timestamp format
    const sampleData = lines.slice(1, 4).join('\\n');
    if (sampleData.includes('[') && sampleData.includes('EDT') || sampleData.includes('EST')) {
      confidence += 10;
    }

    if (lines.length < 3) {
      warnings.push('File has very few rows - may be incomplete');
    }

    const preview = lines.slice(0, 6).map(line => {
      const cols = line.split(',');
      return {
        name: cols[0] || '',
        deviceId: cols[3] || '',
        status: cols[4] || '',
        vendor: cols[9] || '',
        health: cols[15] || ''
      };
    });

    return {
      type: 'bacnet' as const,
      confidence: Math.min(confidence, 100),
      warnings,
      preview
    };
  }

  private static validateResourceFormat(content: string, warnings: string[]) {
    const lines = content.split('\\n');
    const header = lines[0]?.toLowerCase() || '';

    let confidence = 0;
    if (header.includes('name') && header.includes('value')) confidence += 60;
    if (content.includes('cpu.usage')) confidence += 15;
    if (content.includes('heap.')) confidence += 15;
    if (content.includes('time.uptime')) confidence += 10;

    if (lines.length < 10) {
      warnings.push('Resource file seems incomplete - expected many metrics');
    }

    const preview = lines.slice(0, 10).map(line => {
      const cols = line.split(',');
      return {
        name: cols[0] || '',
        value: cols[1] || ''
      };
    });

    return {
      type: 'resource' as const,
      confidence,
      warnings,
      preview
    };
  }

  private static validatePlatformFormat(content: string, warnings: string[]) {
    let confidence = 0;
    if (content.includes('Platform summary')) confidence += 30;
    if (content.includes('Daemon Version:')) confidence += 20;
    if (content.includes('Host ID:')) confidence += 15;
    if (content.includes('Niagara Runtime:')) confidence += 15;
    if (content.includes('Model:')) confidence += 10;
    if (content.includes('Product:')) confidence += 10;
    if (content.includes('Platform TLS Support:')) confidence += 10;
    if (content.includes('System Home:')) confidence += 5;
    if (content.includes('Modules')) confidence += 10;
    if (content.includes('Physical RAM')) confidence += 5;

    const lines = content.split('\\n');
    if (lines.length < 20) {
      warnings.push('Platform file seems incomplete - expected detailed system info');
    }

    const preview = {
      hasPlatformSummary: content.includes('Platform summary'),
      hasModulesSection: content.includes('Modules'),
      hasFilesystemInfo: content.includes('Filesystem'),
      hasHostId: content.includes('Host ID:'),
      hasNiagaraRuntime: content.includes('Niagara Runtime:'),
      hasTlsSupport: content.includes('Platform TLS Support:'),
      hasSystemPaths: content.includes('System Home:') || content.includes('User Home:'),
      lineCount: lines.length
    };

    return {
      type: 'platform' as const,
      confidence,
      warnings,
      preview
    };
  }

  private static validateNetworkFormat(content: string, warnings: string[]) {
    const lines = content.split('\\n');
    const header = lines[0]?.toLowerCase() || '';

    const expectedHeaders = ['path', 'name', 'address', 'host model', 'version', 'status'];
    const hasValidHeaders = expectedHeaders.filter(h => header.includes(h)).length;

    let confidence = (hasValidHeaders / expectedHeaders.length) * 80;

    if (header.includes('niagara')) confidence += 10;
    if (content.includes('ip:')) confidence += 10;

    if (lines.length < 3) {
      warnings.push('Network file has very few entries - may be incomplete');
    }

    const preview = lines.slice(0, 6).map(line => {
      const cols = line.split(',');
      return {
        path: cols[0] || '',
        name: cols[1] || '',
        address: cols[4] || '',
        hostModel: cols[7] || '',
        status: cols[11] || ''
      };
    });

    return {
      type: 'network' as const,
      confidence: Math.min(confidence, 100),
      warnings,
      preview
    };
  }

  private static detectCSVFormat(content: string, warnings: string[]) {
    const lines = content.split('\\n');
    const header = lines[0]?.toLowerCase() || '';

    // Try to detect based on header content
    if (header.includes('name') && header.includes('status') && header.includes('address')) {
      warnings.push('Detected as possible N2 export based on headers');
      return this.validateN2Format(content, warnings);
    }

    if (header.includes('device id') && header.includes('vendor')) {
      warnings.push('Detected as possible BACnet export based on headers');
      return this.validateBACnetFormat(content, warnings);
    }

    if (header.includes('name') && header.includes('value') && lines.length > 10) {
      warnings.push('Detected as possible Resource export based on headers');
      return this.validateResourceFormat(content, warnings);
    }

    if (header.includes('path') && header.includes('niagara')) {
      warnings.push('Detected as possible Network export based on headers');
      return this.validateNetworkFormat(content, warnings);
    }

    warnings.push('Unknown CSV format - please verify file type');
    return {
      type: 'unknown' as const,
      confidence: 0,
      warnings,
      preview: lines.slice(0, 5).map(line => ({ raw: line }))
    };
  }
}