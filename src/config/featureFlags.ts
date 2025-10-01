// Feature Flag Configuration for AME Inc PM Management System
// Allows clean separation between tech-focused features and legacy/admin features

export const FEATURE_FLAGS = {
  // Core system mode flags
  TECH_MODE: true,                      // Main switch for tech-focused experience
  LEGACY_CRM: false,                    // Old customer management features (suppress for now)
  ADMIN_FEATURES: true,                 // Admin features (but hidden by default)
  
  // Existing valuable features to preserve and enhance
  GOOGLE_DRIVE_INTEGRATION: true,       // Project folder detection and document search
  SIMPRO_INTEGRATION: true,             // Customer search and auto-fill
  TECH_ASSIGNMENT: true,                // Primary/secondary tech assignment
  REMOTE_ACCESS_MANAGER: true,          // System credentials and access methods
  
  // PM workflow features
  PM_WORKFLOW_V2: true,                 // Enhanced 4-phase PM workflow
  FOUNDATION_DISCOVERY: false,          // DISABLED: Use UnifiedSystemDiscovery with JACE auto-discovery fixes
  NETWORK_ANALYSIS: true,               // Tridium export processing and device analysis
  SOP_INTEGRATION: true,                // SOP library and task guidance
  PDF_REPORTING: true,                  // Professional report generation
  
  // UI/UX enhancement flags
  TECH_DASHBOARD: true,                 // Tech-focused dashboard
  CUSTOMER_QUICK_FILL: true,            // Enhanced customer search and auto-populate
  
  // Authentication experience flags
  HIDE_ADMIN_LOGIN_BY_DEFAULT: true,    // Hide admin login unless specifically requested
  TECH_FIRST_AUTH: true,                // Tech-focused authentication flow
  
  // Development and debug flags
  SHOW_DEBUG_INFO: false,               // Debug information in UI
  MOCK_DATA: true,                      // Use mock data for development
  
  // Legacy suppression flags (to eliminate build errors)
  NEW_CUSTOMER_WIZARD_LEGACY: false,    // Old complex customer wizard
  LEGACY_WORKFLOW_DASHBOARD: false,     // Old workflow management
  LEGACY_VISIT_MANAGEMENT: false        // Old visit tracking system
} as const;

// Type for feature flag keys
export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;

// Utility functions for feature flags
export class FeatureFlagService {
  
  // Check if a feature is enabled
  static isEnabled(flag: FeatureFlagKey): boolean {
    return FEATURE_FLAGS[flag] === true;
  }
  
  // Check if multiple features are enabled (AND logic)
  static areAllEnabled(flags: FeatureFlagKey[]): boolean {
    return flags.every(flag => this.isEnabled(flag));
  }
  
  // Check if any of the features are enabled (OR logic)
  static isAnyEnabled(flags: FeatureFlagKey[]): boolean {
    return flags.some(flag => this.isEnabled(flag));
  }
  
  // Get environment-specific overrides
  static getEnvironmentOverrides(): Partial<typeof FEATURE_FLAGS> {
    if (process.env.NODE_ENV === 'development') {
      return {
        SHOW_DEBUG_INFO: true,
        MOCK_DATA: true
      };
    }
    
    if (process.env.NODE_ENV === 'production') {
      return {
        SHOW_DEBUG_INFO: false,
        MOCK_DATA: false
      };
    }
    
    return {};
  }
  
  // Get effective feature flags (with environment overrides)
  static getEffectiveFlags(): typeof FEATURE_FLAGS {
    const overrides = this.getEnvironmentOverrides();
    return { ...FEATURE_FLAGS, ...overrides };
  }
}

// Conditional import helper (for eliminating build errors)
export const conditionalImport = async <T>(
  flag: FeatureFlagKey, 
  importFn: () => Promise<T>
): Promise<T | null> => {
  if (FeatureFlagService.isEnabled(flag)) {
    try {
      return await importFn();
    } catch (error) {
      console.error(`Failed to load conditional import for flag ${flag}:`, error);
      return null;
    }
  }
  return null;
};
