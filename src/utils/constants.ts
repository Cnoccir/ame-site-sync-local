/**
 * Application constants and configuration
 */

// Service tier definitions
export const SERVICE_TIERS = {
  CORE: 'CORE',
  ASSURE: 'ASSURE',
  GUARDIAN: 'GUARDIAN'
} as const;

// Visit phases
export const VISIT_PHASES = {
  PRE_VISIT: 1,
  ASSESSMENT: 2,
  SERVICE_EXECUTION: 3,
  POST_VISIT: 4
} as const;

// Visit statuses
export const VISIT_STATUS = {
  SCHEDULED: 'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  ABANDONED: 'Abandoned'
} as const;

// Phase statuses
export const PHASE_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed'
} as const;

// Task statuses
export const TASK_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  SKIPPED: 'Skipped'
} as const;

// Google Drive configuration
export const GOOGLE_DRIVE_CONFIG = {
  masterFolder: '17vkTZ2Szm2pADLmFGEHEMuCetigYoTna',
  serviceToolDataFolder: '1H9yPV-UUXqaxHVoOmX0s9YsKEtpVQ5cs',
  files: {
    customers: '1yO_zJx1_gyaLwhb-ZzUajksKptDaweOV',
    sopLibrary: '16ygykcrkxukqQDKsrA37u-nrhvoC2jj0',
    taskLibrary: '16rZ0_e23h7e2UmyRrwjPvJlisWXST2A3',
    toolLibrary: '11HevKmr6_YmYg54TGbFcaIpvF8Bto-CT'
  }
};

// Assessment timer configuration
export const ASSESSMENT_CONFIG = {
  DURATION_MINUTES: 30,
  WARNING_THRESHOLD_MINUTES: 25,
  AUTO_SAVE_INTERVAL_MS: 30000
};

// API configuration
export const API_CONFIG = {
  REFRESH_INTERVAL_MS: 30000,
  MAX_RETRY_ATTEMPTS: 3,
  REQUEST_TIMEOUT_MS: 10000
};