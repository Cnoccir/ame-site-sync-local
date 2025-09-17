/**
 * PM Workflow Types - Core data structures for the PM workflow system
 * Using simple JSON-serializable types for MVP development
 */

// ===== CORE SESSION MANAGEMENT =====

export interface PMWorkflowSession {
  id: string;
  customerId: string;
  customerName: string;
  serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  currentPhase: 1 | 2 | 3 | 4;
  startTime: Date;
  lastSaved: Date;
  status: 'Draft' | 'In Progress' | 'Completed' | 'Cancelled';
  technicianName: string;
  technicianId: string;
}

export interface PMWorkflowData {
  session: PMWorkflowSession;
  phase1: SiteIntelligenceData;
  phase2: SystemDiscoveryData;
  phase3: ServiceActivitiesData;
  phase4: DocumentationData;
}

// ===== PHASE 1: SITE INTELLIGENCE =====

export interface ContactInfo {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  isPrimary: boolean;
  isEmergency: boolean;
}

export interface AccessInfo {
  method: string;
  parkingInstructions: string;
  badgeRequired: boolean;
  escortRequired: boolean;
  bestArrivalTime: string;
  specialInstructions: string;
}

export interface SafetyInfo {
  requiredPPE: string[];
  knownHazards: string[];
  safetyContact: string;
  safetyPhone: string;
  specialNotes: string;
}

export interface ProjectHandoffInfo {
  hasSubmittals: boolean;
  submittalLocation?: string;
  hasAsBuilts: boolean;
  asBuiltLocation?: string;
  hasFloorPlans: boolean;
  floorPlanLocation?: string;
  hasSOO: boolean;
  sooLocation?: string;
  completenessScore: number; // 1-10
  notes: string;
}

export interface SiteIntelligenceData {
  customer: {
    companyName: string;
    siteName: string;
    address: string;
    serviceTier: string;
    contractNumber: string;
    accountManager: string;
  };
  contacts: ContactInfo[];
  access: AccessInfo;
  safety: SafetyInfo;
  projectHandoff: ProjectHandoffInfo;
}

// ===== PHASE 2: SYSTEM DISCOVERY =====

export interface BMSSystemInfo {
  platform: string;
  softwareVersion: string;
  supervisorLocation: string;
  supervisorIP: string;
  networkMethod: string;
  credentialsLocation: string;
  notes: string;
}

export interface TridiumExportData {
  resourceExport?: any; // CSV data as JSON
  bacnetExport?: any; // CSV data as JSON
  n2Export?: any; // CSV data as JSON
  platformDetails?: string; // Text file content
  uploadTime?: Date;
  processed: boolean;
}

export interface ManualInventoryData {
  totalDeviceCount: number;
  majorEquipment: string[];
  controllerTypes: string[];
  networkSegments: string[];
  notes: string;
}

export interface PhotoData {
  id: string;
  filename: string;
  description: string;
  category: 'Panel' | 'Supervisor' | 'Equipment' | 'Issue' | 'Other';
  timestamp: Date;
  base64?: string; // For storing image data
}

export interface SystemDiscoveryData {
  bmsSystem: BMSSystemInfo;
  tridiumExports: TridiumExportData;
  manualInventory: ManualInventoryData;
  photos: PhotoData[];
}

// ===== PHASE 3: SERVICE ACTIVITIES =====

export interface CustomerPriorityInfo {
  primaryConcerns: string[];
  energyGoals: string[];
  operationalChallenges: string[];
  timeline: string;
  budgetConstraints: string;
}

export interface TaskExecutionData {
  id: string;
  sopId: string;
  name: string;
  phase: 'Prep' | 'Health_Sweep' | 'Deep_Dive' | 'Wrap_Up';
  serviceTier: string;
  estimatedDuration: number; // minutes
  status: 'Pending' | 'In Progress' | 'Completed' | 'Skipped';
  startTime?: Date;
  completionTime?: Date;
  actualDuration?: number; // minutes
  findings: string;
  actions: string;
  issues: string[];
  recommendations: string[];
  photos: PhotoData[];
  dataCollected: Record<string, any>;
  reportSection: 'executive' | 'system' | 'work' | 'recommendations';
  reportImpact: 'foundation' | 'metrics' | 'improvements' | 'documentation';
}

export interface IssueData {
  id: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  category: 'Safety' | 'Performance' | 'Reliability' | 'Efficiency' | 'Compliance';
  title: string;
  description: string;
  location: string;
  affectedSystems: string[];
  impact: string;
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
}

export interface ServiceActivitiesData {
  customerPriorities: CustomerPriorityInfo;
  tasks: TaskExecutionData[];
  issues: IssueData[];
  recommendations: RecommendationData[];
  serviceMetrics: ServiceMetricsData;
}

// ===== PHASE 4: DOCUMENTATION =====

export interface ServiceSummaryData {
  executiveSummary: string;
  keyFindings: string[];
  valueDelivered: string[];
  systemImprovements: string[];
  nextSteps: string[];
  followupRequired: boolean;
  followupActions: string[];
}

export interface ReportConfigData {
  template: 'Customer' | 'Technical' | 'Executive';
  includeSections: {
    executiveSummary: boolean;
    systemOverview: boolean;
    workPerformed: boolean;
    issues: boolean;
    recommendations: boolean;
    appendix: boolean;
  };
  includePhotos: boolean;
  includeCharts: boolean;
  includeDataTables: boolean;
  brandingLevel: 'Full' | 'Minimal' | 'None';
  confidentiality: 'Public' | 'Confidential' | 'Restricted';
}

export interface DeliveryInfo {
  method: 'Email' | 'Print' | 'Both';
  primaryRecipient: string;
  ccRecipients: string[];
  deliveryNotes: string;
  signatureRequired: boolean;
}

export interface DocumentationData {
  serviceSummary: ServiceSummaryData;
  reportConfig: ReportConfigData;
  deliveryInfo: DeliveryInfo;
}

// ===== UI/UX STATE MANAGEMENT =====

export interface PhaseProgress {
  phase: number;
  completed: boolean;
  percentage: number;
  requiredTasks: string[];
  completedTasks: string[];
  canProceed: boolean;
  estimatedTime: number;
  actualTime: number;
}

export interface NavigationState {
  currentPhase: 1 | 2 | 3 | 4;
  canGoBack: boolean;
  canGoForward: boolean;
  unsavedChanges: boolean;
  lastSaved: Date | null;
}

export interface AutoSaveData {
  enabled: boolean;
  interval: number; // seconds
  lastSave: Date | null;
  pending: boolean;
  error: string | null;
}

export interface SessionRecovery {
  hasUnsavedWork: boolean;
  lastSession?: PMWorkflowSession;
  recoveryData?: Partial<PMWorkflowData>;
}

// ===== MOCK/DEVELOPMENT DATA =====

export interface MockDataOptions {
  generateCustomer?: boolean;
  generateTasks?: boolean;
  generateIssues?: boolean;
  generateRecommendations?: boolean;
  serviceTier?: 'CORE' | 'ASSURE' | 'GUARDIAN';
}

// ===== EXPORT ALL TYPES =====
export type {
  PMWorkflowSession,
  PMWorkflowData,
  SiteIntelligenceData,
  SystemDiscoveryData, 
  ServiceActivitiesData,
  DocumentationData,
  PhaseProgress,
  NavigationState,
  AutoSaveData,
  SessionRecovery,
  MockDataOptions
};
