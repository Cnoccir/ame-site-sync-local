// PM Guidance Tool - Core Data Types
// This defines the complete data structure for the systematic 4-phase workflow

export interface PMWorkflowSession {
  id: string;
  customerId: string;
  startTime: Date;
  technician: string;
  currentPhase: 1 | 2 | 3 | 4;
  completionPercentage: number;
  lastActivity: Date;
  status: 'active' | 'paused' | 'completed' | 'abandoned';
  expiresAt?: Date;
}

export interface PMWorkflowData {
  session: PMWorkflowSession;
  
  // Phase 1: Site Intelligence & Setup (25%)
  siteIntelligence: {
    customer: CustomerInfo;
    contacts: ContactInfo[];
    access: AccessInfo;
    handoffDocs: ProjectHandoffInfo;
    safety: SafetyInfo;
  };
  
  // Phase 2: System Discovery & Inventory (50%) 
  systemDiscovery: {
    bmsOverview: BMSSystemInfo;
    exports: TridiumExportData;
    manualInventory: ManualInventoryData;
    photos: PhotoData[];
    networkArchitecture: NetworkInfo;
  };
  
  // Phase 3: Service Activities (75%)
  serviceActivities: {
    customerPriorities: CustomerPriorityInfo;
    tasks: TaskExecutionData[];
    issues: IssueData[];
    recommendations: RecommendationData[];
    serviceMetrics: ServiceMetricsData;
  };
  
  // Phase 4: Documentation & Reporting (100%)
  documentation: {
    summary: ServiceSummaryData;
    reportConfig: ReportConfigData;
    deliveryInfo: DeliveryInfo;
    generatedReports: GeneratedReportData[];
  };
}

// Phase 1: Site Intelligence Types
export interface CustomerInfo {
  id: string;
  companyName: string;
  siteName: string;
  siteAddress: string;
  serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  contractNumber?: string;
  accountManager?: string;
}

export interface ContactInfo {
  type: 'primary' | 'secondary' | 'technical' | 'emergency' | 'security';
  name: string;
  phone: string;
  email?: string;
  role?: string;
  availableHours?: string;
  notes?: string;
}

export interface AccessInfo {
  method: string;
  parkingInstructions: string;
  specialNotes: string;
  escortRequired: boolean;
  badgeRequired: boolean;
  bestArrivalTimes: string[];
  commonIssues: string[];
}

export interface ProjectHandoffInfo {
  originalPM?: string;
  originalTech?: string;
  folderUrl?: string;
  hasSubmittals: boolean;
  hasAsBuilt: boolean;
  hasFloorPlans: boolean;
  hasSequence: boolean;
  hasNetworkDiagram: boolean;
  completionStatus: 'Design' | 'Construction' | 'Commissioning' | 'Operational' | 'Warranty';
  commissioningNotes?: string;
  documentationScore: number; // 0-100
}

export interface SafetyInfo {
  ppeRequired: boolean;
  hazards: string[];
  safetyRequirements: string[];
  emergencyContact: string;
  emergencyPhone: string;
  specialInstructions: string;
}

// Phase 2: System Discovery Types
export interface BMSSystemInfo {
  platform: 'Niagara' | 'Johnson' | 'Honeywell' | 'Schneider' | 'Other';
  version: string;
  supervisorLocation: string;
  supervisorIP: string;
  networkMethod: 'Customer LAN' | 'Dedicated VLAN' | 'Cellular' | 'VPN';
  credentialsLocation: string;
  platformNotes: string;
}

export interface TridiumExportData {
  resourceExport?: {
    cpuUsage: number;
    memoryUsage: number;
    deviceCount: number;
    pointCount: number;
    licenseCapacity: number;
    timestamp: Date;
  };
  bacnetExport?: DeviceInventoryItem[];
  n2Export?: LegacyDeviceItem[];
  platformDetails?: PlatformDetailsData;
  performanceMetrics?: PerformanceMetricsData;
}

export interface DeviceInventoryItem {
  deviceName: string;
  deviceType: string;
  networkNumber?: number;
  macAddress?: string;
  instanceNumber?: number;
  model?: string;
  vendor?: string;
  firmwareVersion?: string;
  status: 'Online' | 'Offline' | 'Warning' | 'Error';
  lastSeen: Date;
  parentJACE?: string;
}

export interface LegacyDeviceItem {
  deviceName: string;
  networkAddress: string;
  deviceType: string;
  status: 'Online' | 'Offline' | 'Warning';
  lastCommunication: Date;
}

export interface PlatformDetailsData {
  stationName: string;
  platformVersion: string;
  licenseInfo: LicenseInfo[];
  moduleInfo: ModuleInfo[];
  systemInfo: SystemInfo;
}

export interface LicenseInfo {
  type: string;
  capacity: number;
  used: number;
  expiration?: Date;
}

export interface ModuleInfo {
  name: string;
  version: string;
  status: 'Running' | 'Stopped' | 'Error';
}

export interface SystemInfo {
  hostname: string;
  operatingSystem: string;
  javaVersion: string;
  uptime: string;
  totalMemory: string;
  freeMemory: string;
}

export interface PerformanceMetricsData {
  cpuHistory: number[];
  memoryHistory: number[];
  networkTraffic: NetworkTrafficData;
  responseTime: number;
  errorCount: number;
}

export interface NetworkTrafficData {
  bytesIn: number;
  bytesOut: number;
  packetsIn: number;
  packetsOut: number;
  errors: number;
}

export interface ManualInventoryData {
  deviceCount: number;
  majorEquipment: EquipmentItem[];
  controllerTypes: ControllerTypeData[];
  networkSegments: NetworkSegmentData[];
  notes: string;
}

export interface EquipmentItem {
  name: string;
  type: string;
  location: string;
  controllerType?: string;
  status: 'Operational' | 'Issue' | 'Unknown';
  notes?: string;
}

export interface ControllerTypeData {
  type: string;
  count: number;
  locations: string[];
}

export interface NetworkSegmentData {
  name: string;
  type: 'BACnet' | 'N2' | 'Modbus' | 'LonWorks' | 'Other';
  deviceCount: number;
  status: 'Healthy' | 'Issues' | 'Down';
}

export interface PhotoData {
  id: string;
  filename: string;
  description: string;
  category: 'equipment' | 'issue' | 'documentation' | 'before' | 'after';
  location?: string;
  timestamp: Date;
  fileSize: number;
  url: string;
}

export interface NetworkInfo {
  topology: 'Star' | 'Tree' | 'Bus' | 'Mixed';
  backboneType: 'Ethernet' | 'RS-485' | 'Wireless' | 'Mixed';
  subnets: SubnetInfo[];
  switches: NetworkSwitchInfo[];
  diagrams: string[];
}

export interface SubnetInfo {
  name: string;
  range: string;
  deviceCount: number;
  purpose: string;
}

export interface NetworkSwitchInfo {
  name: string;
  location: string;
  model: string;
  ports: number;
  status: 'Operational' | 'Issues';
}

// Phase 3: Service Activities Types
export interface CustomerPriorityInfo {
  primaryConcerns: string[];
  reportedIssues: string[];
  energyGoals: string[];
  comfortIssues: string[];
  operationalChallenges: string[];
  budgetConstraints: string[];
  timeline: string;
}

export interface TaskExecutionData {
  id: string;
  sopId: string;
  name: string;
  phase: 'Prep' | 'Health_Sweep' | 'Deep_Dive' | 'Wrap_Up';
  serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  estimatedDuration: number;
  actualDuration?: number;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Skipped' | 'Failed';
  startTime?: Date;
  completionTime?: Date;
  findings: string;
  actions: string;
  issues: string[];
  recommendations: string[];
  photos: string[];
  dataCollected: any;
  reportSection: 'executive' | 'system' | 'work' | 'recommendations';
  reportImpact: 'foundation' | 'metrics' | 'improvements' | 'documentation';
}

export interface IssueData {
  id: string;
  taskId?: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'Safety' | 'Performance' | 'Reliability' | 'Efficiency' | 'Compliance';
  title: string;
  description: string;
  location: string;
  affectedSystems: string[];
  impact: string;
  rootCause?: string;
  immediateAction: string;
  photos: PhotoData[];
  discoveryTime: Date;
  status: 'Open' | 'Resolved' | 'Deferred' | 'Monitoring';
}

export interface RecommendationData {
  id: string;
  type: 'Immediate' | 'Short Term' | 'Long Term' | 'Upgrade';
  priority: 'High' | 'Medium' | 'Low';
  category: 'Performance' | 'Efficiency' | 'Reliability' | 'Upgrade' | 'Maintenance';
  title: string;
  description: string;
  justification: string;
  estimatedCost?: string;
  timeline: string;
  benefits: string[];
  requiredActions: string[];
  relatedIssues: string[];
}

export interface ServiceMetricsData {
  systemHealthScore: number; // 0-100
  performanceImprovement: number; // percentage
  energyOptimization: number; // percentage
  reliabilityEnhancement: number; // percentage
  issuesResolved: number;
  tasksCompleted: number;
  timeOnSite: number; // minutes
  customerSatisfaction?: number; // 1-5 rating
}

// Phase 4: Documentation & Reporting Types
export interface ServiceSummaryData {
  executiveSummary: string;
  keyFindings: string[];
  valueDelivered: string[];
  systemImprovements: string[];
  nextSteps: string[];
  followUpRequired: boolean;
  followUpDate?: Date;
  followUpActions: string[];
}

export interface ReportConfigData {
  template: 'customer' | 'technical' | 'executive' | 'complete';
  includeSections: ReportSection[];
  includePhotos: boolean;
  includeCharts: boolean;
  includeDataTables: boolean;
  includeRecommendations: boolean;
  brandingLevel: 'full' | 'minimal' | 'none';
  confidentialityLevel: 'public' | 'confidential' | 'restricted';
}

export interface ReportSection {
  section: 'executive' | 'system' | 'work' | 'recommendations' | 'appendix';
  include: boolean;
  customTitle?: string;
  customContent?: string;
}

export interface DeliveryInfo {
  method: 'email' | 'portal' | 'print' | 'usb';
  recipients: EmailRecipient[];
  deliveryDate: Date;
  followUpDate?: Date;
  signatureRequired: boolean;
  customerSignature?: SignatureData;
}

export interface EmailRecipient {
  name: string;
  email: string;
  role: string;
  notificationType: 'primary' | 'copy' | 'blind_copy';
}

export interface SignatureData {
  signedBy: string;
  signedAt: Date;
  role: string;
  signature: string; // base64 encoded signature image
  device: string;
  ipAddress: string;
}

export interface GeneratedReportData {
  id: string;
  template: string;
  filename: string;
  fileSize: number;
  generatedAt: Date;
  generatedBy: string;
  url: string;
  deliveryStatus: 'pending' | 'sent' | 'delivered' | 'failed';
  deliveryDate?: Date;
  downloadCount: number;
  version: number;
}

// Progress and Navigation Types
export interface PhaseProgress {
  phase: 1 | 2 | 3 | 4;
  name: string;
  description: string;
  targetPercentage: number;
  currentPercentage: number;
  status: 'pending' | 'active' | 'completed';
  startTime?: Date;
  completionTime?: Date;
  requiredTasks: string[];
  completedTasks: string[];
  canAdvance: boolean;
  blockers: string[];
}

export interface NavigationState {
  currentPhase: 1 | 2 | 3 | 4;
  canGoBack: boolean;
  canGoForward: boolean;
  unsavedChanges: boolean;
  autoSaveEnabled: boolean;
  lastSaved: Date;
}

// Auto-save and Session Management
export interface AutoSaveData {
  sessionId: string;
  data: Partial<PMWorkflowData>;
  timestamp: Date;
  checksum: string;
}

export interface SessionRecovery {
  available: boolean;
  sessionId: string;
  lastSaved: Date;
  dataSize: number;
  progress: number;
  phase: number;
}
