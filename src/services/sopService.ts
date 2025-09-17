/**
 * SOP Service - Handles Standard Operating Procedure data and task management
 * Based on SOP_Library_v22.csv structure
 */

export interface SOPData {
  id: string;
  title: string;
  systemFamily: string;
  vendorFlavor: string;
  phase: string;
  serviceTiers: string[];
  estimatedDuration: number; // in minutes
  audienceLevel: number;
  prerequisites?: string;
  safety?: string;
  goal: string;
  uiNavigation?: string;
  stepListCore?: string;
  stepListAssure?: string;
  stepListGuardian?: string;
  verificationSteps?: string;
  rollbackSteps?: string;
  bestPractices?: string;
  tools?: string;
  hyperlinks?: string;
  owner?: string;
  lastUpdated?: string;
  version?: string;
}

export class SOPService {
  // Core SOP data from SOP_Library_v22.csv
  private static sopData: SOPData[] = [
    // CORE Tasks (Essential for all service tiers)
    {
      id: 'C001',
      title: 'Platform & Station Backup',
      systemFamily: 'Niagara',
      vendorFlavor: '',
      phase: 'Prep',
      serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
      estimatedDuration: 15,
      audienceLevel: 2,
      prerequisites: '',
      safety: 'Ensure system stability during backup process. Verify backup storage security',
      goal: 'Perform: Platform & Station Backup',
      uiNavigation: 'Platform → Platform Administration → Backup/Restore',
      stepListCore: `1. Open Backup Utility in Workbench
2. Connect to Platform of Niagara host
3. Select running Station and click "Backup Station"
4. Name backup with format: [CustomerName]_[YYYY-MM-DD]_PMBackup
5. Include History/Alarms if needed (check BackupService settings)
6. Click "Create" and monitor progress
7. Verify backup completed successfully
8. Copy backup to external drive and cloud storage
9. Test backup integrity by opening .dist file`,
      tools: 'Workbench, External storage drive, Cloud access',
      hyperlinks: 'Tridium Niagara 4 Platform Guide (backup concepts): https://downloads.onesight.solutions/Tridium/Niagara%204%20Documentation/docPlatform/docPlatform.pdf',
    },
    {
      id: 'C002',
      title: 'Performance Verification',
      systemFamily: 'Niagara',
      vendorFlavor: '',
      phase: 'Health_Sweep',
      serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
      estimatedDuration: 10,
      audienceLevel: 2,
      safety: 'Monitor system performance impact during diagnostics',
      goal: 'Perform: Performance Verification',
      uiNavigation: 'Diagnostics → Resource Manager (Station Summary)',
      stepListCore: `1. Right-click Station and select Views → Station Summary
2. Check CPU Usage (should be <80% sustained)
3. Check Heap Memory (should be <75% after garbage collection)
4. Verify License Capacities not exceeded
5. Check File Descriptors on JACE (if applicable)
6. Use Spy tool for Engine Hogs if performance issues
7. Check driver poll rates and cycle times
8. Review Application Director for errors`,
      tools: 'Workbench, System monitoring tools'
    },
    {
      id: 'C003',
      title: 'Active Alarm Resolution',
      systemFamily: 'Niagara',
      vendorFlavor: '',
      phase: 'Health_Sweep',
      serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
      estimatedDuration: 20,
      audienceLevel: 2,
      safety: 'Verify alarm acknowledgment doesn\'t compromise safety systems',
      goal: 'Perform: Active Alarm Resolution',
      uiNavigation: 'Alarm Console → Review/Acknowledge',
      stepListCore: `1. Open Alarm Console in Workbench
2. Sort alarms by priority (Critical first)
3. For each critical alarm:
   a) Record alarm text and time
   b) Right-click → "Go to Source"
   c) Investigate root cause
   d) Take corrective action
   e) Acknowledge alarm
4. Review HIGH priority alarms
5. Check alarm history for patterns
6. Test alarm notification system`,
      stepListAssure: '7. Update alarm recipient lists if needed',
      tools: 'Workbench, Diagnostic tools'
    },
    {
      id: 'C004',
      title: 'Schedule & Setpoint Verification',
      systemFamily: 'Niagara',
      vendorFlavor: '',
      phase: 'Prep',
      serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
      estimatedDuration: 15,
      audienceLevel: 2,
      safety: 'Ensure schedule changes don\'t compromise comfort or equipment safety',
      goal: 'Perform: Schedule & Setpoint Verification',
      uiNavigation: 'Config → Schedules → Weekly Calendar',
      stepListCore: `1. Review all active schedules
2. Verify schedule times match occupancy
3. Check holiday/exception calendars
4. Review temperature setpoints for each mode
5. Verify setback/setup temperatures
6. Check schedule priorities and overrides
7. Document any recommended changes`,
      stepListAssure: '8. Update schedules per customer request',
      tools: 'Workbench, Building occupancy schedule'
    },
    {
      id: 'C005',
      title: 'Override Point Cleanup',
      systemFamily: 'Niagara',
      vendorFlavor: '',
      phase: 'Deep_Dive',
      serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
      estimatedDuration: 10,
      audienceLevel: 2,
      safety: 'Verify override release doesn\'t impact critical systems',
      goal: 'Perform: Override Point Cleanup',
      uiNavigation: 'Point Manager → Overrides → Analysis',
      stepListCore: `1. Open Point Manager and filter for overrides
2. Document all points in override
3. Investigate reason for each override
4. Release unnecessary overrides
5. Document legitimate overrides with reason
6. Check for expired temporary overrides
7. Verify system returns to auto after override release`,
      tools: 'Workbench, Override documentation'
    },
    {
      id: 'C006',
      title: 'Critical Sensor Check',
      systemFamily: 'Niagara',
      vendorFlavor: '',
      phase: 'Prep',
      serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
      estimatedDuration: 25,
      audienceLevel: 2,
      safety: 'Use lockout/tagout procedures when working on sensor circuits',
      goal: 'Perform: Critical Sensor Check',
      uiNavigation: 'Point Manager → Analog Inputs',
      stepListCore: `1. Identify critical sensors (OAT, space temps, pressures)
2. Compare sensor readings to reference
3. Check for sensor drift or stuck values
7. Check sensor wiring and connections`,
      stepListAssure: `4. Verify sensor trends are reasonable
5. Calibrate sensors if needed
6. Document calibration offsets
8. Update sensor maintenance log`,
      tools: 'Calibrated thermometer, Multimeter, Reference instruments'
    },
    {
      id: 'C007',
      title: 'User Account Security Audit',
      systemFamily: 'Niagara',
      vendorFlavor: '',
      phase: 'Deep_Dive',
      serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
      estimatedDuration: 15,
      audienceLevel: 2,
      safety: 'Maintain system access integrity during security changes',
      goal: 'Perform: User Account Security Audit',
      uiNavigation: 'Config → Services → UserService',
      stepListCore: `3. Check roles and permissions
5. Verify strong password policies
6. Check password expiration settings`,
      stepListAssure: `1. Review all user accounts
2. Verify unique accounts (no sharing)
4. Disable dormant/default accounts
7. Test account lockout feature
8. Update security documentation`,
      tools: 'Workbench, Security checklist',
      hyperlinks: 'Niagara 4 Hardening Guide (2025): https://www.tridium.com/content/dam/tridium/en/documents/document-lists/niagara/tri-Niagara4-Hardening-Guide-en-2025.pdf'
    },
    {
      id: 'C008',
      title: 'Documentation Update',
      systemFamily: 'Niagara',
      vendorFlavor: '',
      phase: 'Wrap_Up',
      serviceTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
      estimatedDuration: 20,
      audienceLevel: 1,
      safety: 'Ensure documentation accurately reflects current system configuration',
      goal: 'Perform: Documentation Update',
      uiNavigation: 'Station → Export → File Management',
      stepListCore: `3. Document setpoint modifications
5. Record any hardware changes
7. Save all documentation to customer folder
8. Upload to cloud storage`,
      stepListAssure: `1. Export current point list
2. Update control drawings with changes
4. Update sequence of operations
6. Update contact information`,
      tools: 'Workbench, Documentation templates'
    },

    // ASSURE Tasks (Additional tasks for enhanced service)
    {
      id: 'A001',
      title: 'Device Communication Health',
      systemFamily: 'Niagara',
      vendorFlavor: '',
      phase: 'Health_Sweep',
      serviceTiers: ['ASSURE', 'GUARDIAN'],
      estimatedDuration: 20,
      audienceLevel: 2,
      prerequisites: 'C002',
      safety: 'Use proper ESD protection when handling network devices',
      goal: 'Perform: Device Communication Health',
      uiNavigation: 'Config → Drivers → [Protocol] → Device Manager',
      stepListAssure: `1. Open Device Manager for each network
2. Verify all devices show "online" status
3. For offline devices:
   a) Attempt ping/refresh
   b) Check device power
   c) Verify network wiring
   d) Check addressing
4. Review communication statistics
5. Check for high error/retry counts
6. Document offline devices
7. Create work orders for repairs`,
      tools: 'Workbench, Network tools, Multimeter'
    },
    {
      id: 'A002',
      title: 'Temperature Sensor Calibration',
      systemFamily: 'Niagara',
      vendorFlavor: '',
      phase: 'Prep',
      serviceTiers: ['ASSURE', 'GUARDIAN'],
      estimatedDuration: 30,
      audienceLevel: 2,
      prerequisites: 'C006',
      safety: 'Follow lockout/tagout procedures. Use appropriate PPE',
      goal: 'Perform: Temperature Sensor Calibration',
      uiNavigation: 'Point Override → Reference Comparison',
      stepListAssure: `1. Identify sensors for calibration
2. Obtain calibrated reference instrument
3. Compare BAS reading to reference
4. Calculate offset if needed
5. Apply calibration in Niagara
6. Verify corrected reading
7. Document calibration values
8. Schedule next calibration`,
      tools: 'NIST-traceable thermometer, Calibration log'
    },

    // GUARDIAN Tasks (Premium optimization tasks)
    {
      id: 'G001',
      title: 'PID Loop Tuning & Optimization',
      systemFamily: 'Niagara',
      vendorFlavor: '',
      phase: 'Deep_Dive',
      serviceTiers: ['GUARDIAN'],
      estimatedDuration: 60,
      audienceLevel: 2,
      prerequisites: 'A004',
      safety: 'Monitor critical parameters during tuning process',
      goal: 'Perform: PID Loop Tuning & Optimization',
      uiNavigation: 'WireSheet → PID Parameters → Tuning',
      stepListGuardian: `1. Identify loops for optimization
2. Document current parameters
3. Implement systematic tuning:
   a) Set I and D to minimum
   b) Increase P until oscillation
   c) Back off P by 50%
   d) Increase I to remove offset
   e) Add D only if needed
4. Test across operating range
5. Verify stability
6. Document final parameters`,
      tools: 'Workbench, Tuning software, Reference guides'
    }
  ];

  /**
   * Get all SOPs for a specific service tier
   */
  static getSOPsForServiceTier(serviceTier: string): SOPData[] {
    return this.sopData
      .filter(sop => sop.serviceTiers.includes(serviceTier))
      .sort((a, b) => {
        // Sort by phase order: Prep -> Health_Sweep -> Deep_Dive -> Wrap_Up
        const phaseOrder = { 'Prep': 1, 'Health_Sweep': 2, 'Deep_Dive': 3, 'Wrap_Up': 4 };
        return (phaseOrder[a.phase as keyof typeof phaseOrder] || 5) - 
               (phaseOrder[b.phase as keyof typeof phaseOrder] || 5);
      });
  }

  /**
   * Get SOP by ID
   */
  static getSOPById(sopId: string): SOPData | null {
    return this.sopData.find(sop => sop.id === sopId) || null;
  }

  /**
   * Get steps for specific service tier
   */
  static getStepsForTier(sop: SOPData, tier: string): string {
    switch (tier) {
      case 'CORE':
        return sop.stepListCore || '';
      case 'ASSURE':
        return sop.stepListAssure || sop.stepListCore || '';
      case 'GUARDIAN':
        return sop.stepListGuardian || sop.stepListAssure || sop.stepListCore || '';
      default:
        return sop.stepListCore || '';
    }
  }

  /**
   * Get task count for service tier
   */
  static getTaskCountForTier(serviceTier: string): number {
    return this.sopData.filter(sop => sop.serviceTiers.includes(serviceTier)).length;
  }

  /**
   * Get estimated total time for service tier
   */
  static getEstimatedTimeForTier(serviceTier: string): number {
    return this.sopData
      .filter(sop => sop.serviceTiers.includes(serviceTier))
      .reduce((total, sop) => total + sop.estimatedDuration, 0);
  }

  /**
   * Get SOPs by phase
   */
  static getSOPsByPhase(phase: string, serviceTier?: string): SOPData[] {
    let filtered = this.sopData.filter(sop => sop.phase === phase);
    
    if (serviceTier) {
      filtered = filtered.filter(sop => sop.serviceTiers.includes(serviceTier));
    }
    
    return filtered;
  }

  /**
   * Check if SOP has prerequisites
   */
  static hasPrerequisites(sopId: string): boolean {
    const sop = this.getSOPById(sopId);
    return !!(sop?.prerequisites && sop.prerequisites.trim().length > 0);
  }

  /**
   * Get prerequisite SOPs
   */
  static getPrerequisiteSops(sopId: string): SOPData[] {
    const sop = this.getSOPById(sopId);
    if (!sop?.prerequisites) return [];
    
    const prereqIds = sop.prerequisites.split(',').map(id => id.trim());
    return prereqIds.map(id => this.getSOPById(id)).filter(Boolean) as SOPData[];
  }

  /**
   * Format SOP for display
   */
  static formatSOPTitle(sop: SOPData): string {
    return `${sop.id}: ${sop.title}`;
  }

  /**
   * Get phase display name
   */
  static getPhaseDisplayName(phase: string): string {
    switch (phase) {
      case 'Prep': return 'Preparation';
      case 'Health_Sweep': return 'Health Assessment';
      case 'Deep_Dive': return 'Deep Analysis';
      case 'Wrap_Up': return 'Documentation';
      default: return phase;
    }
  }
}

export default SOPService;
