/**
 * Data transformation utilities for PreVisit workflow
 * Handles mapping between database records and form state
 */

import { Customer, Visit } from '@/types';

export interface PreVisitFormData {
  // Site Intelligence
  siteIntelligence: {
    nickname: string;
    siteNumber: string;
    systemPlatform: string;
    primaryTechnicianId: string;
    secondaryTechnicianId: string;
    siteExperience: 'first_time' | 'familiar' | 'expert';
    lastVisitInfo: {
      date: string;
      by: string;
      notes: string;
    };
    knownIssues: string[];
  };
  
  // Contact Information
  contactInfo: {
    primary: {
      name: string;
      phone: string;
      email: string;
    };
    secondary?: {
      name: string;
      phone: string;
      email: string;
    };
    poc: {
      name: string;
      phone: string;
      availableHours: string;
    };
    address: string;
    accessApproach: string;
    parkingInstructions: string;
  };
  
  // Access Requirements
  accessRequirements: {
    badgeRequired: boolean;
    escortRequired: boolean;
    ppeRequired: boolean;
    safetyRequirements: string;
  };
  
  // Documentation
  documentation: {
    folderUrl: string;
    availability: {
      submittals: boolean;
      floorPlans: boolean;
      asBuilt: boolean;
      sequence: boolean;
      networkDiagram: boolean;
    };
    completenessScore: number;
    originalTeam: {
      contact: string;
      role: string;
      whenToContact: string;
    };
  };
  
  // Tools
  tools: {
    selectedTools: string[];
    systemSpecificTools: string[];
    spareParts: string[];
    additionalNotes: string;
  };
  
  // Checklist
  checklist: {
    contactConfirmed: boolean;
    accessPlanReviewed: boolean;
    credentialsVerified: boolean;
    toolsLoaded: boolean;
    notesReviewed: boolean;
    safetyReviewed: boolean;
  };
}

export interface PrevisitPreparation {
  id: string;
  customer_id: string;
  visit_id?: string;
  
  // Section completion flags
  site_intelligence_complete: boolean;
  contact_verification_complete: boolean;
  documentation_review_complete: boolean;
  tools_preparation_complete: boolean;
  checklist_complete: boolean;
  
  // Documentation status
  has_submittals: boolean;
  has_floor_plans: boolean;
  has_as_built: boolean;
  has_sequence: boolean;
  has_network_diagram: boolean;
  documentation_score: number;
  
  // Tool selections (JSON)
  selected_tools: string;
  system_specific_tools: string;
  spare_parts_selected: string;
  additional_tools_notes?: string;
  
  // Checklist progress
  contact_confirmed: boolean;
  access_plan_reviewed_flag: boolean;
  credentials_verified: boolean;
  tools_loaded: boolean;
  notes_reviewed: boolean;
  safety_reviewed: boolean;
  
  // Progress tracking
  overall_progress: number;
  sections_completed: number;
  preparation_status: 'pending' | 'in_progress' | 'completed';
  
  // Session data
  auto_save_data?: any;
  last_activity: string;
  session_token?: string;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

export interface ToolCatalogItem {
  id: string;
  tool_id: string;
  tool_name: string;
  category: 'standard' | 'niagara' | 'johnson' | 'honeywell' | 'spareparts';
  subcategory?: string;
  icon_name?: string;
  is_required: boolean;
  system_platforms: string[];
  description?: string;
  display_order: number;
  is_active: boolean;
}

/**
 * Transform customer and preparation data to PreVisit form data
 */
export const transformCustomerToPreVisitForm = (
  customer: Customer, 
  preparation?: PrevisitPreparation | null
): PreVisitFormData => {
  return {
    siteIntelligence: {
      nickname: customer.site_nickname || customer.site_name || '',
      siteNumber: customer.site_number || '',
      systemPlatform: customer.system_type || customer.system_platform || '',
      primaryTechnicianId: customer.primary_technician_id || '',
      secondaryTechnicianId: customer.secondary_technician_id || '',
      siteExperience: customer.site_experience || 'first_time',
      lastVisitInfo: {
        date: customer.last_visit_date || '',
        by: customer.last_visit_by || '',
        notes: customer.handoff_notes || ''
      },
      knownIssues: customer.known_issues || []
    },
    contactInfo: {
      primary: {
        name: customer.primary_contact || '',
        phone: customer.contact_phone || '',
        email: customer.contact_email || ''
      },
      secondary: customer.secondary_contact_name ? {
        name: customer.secondary_contact_name,
        phone: customer.secondary_contact_phone || '',
        email: customer.secondary_contact_email || ''
      } : undefined,
      poc: {
        name: customer.poc_name || '',
        phone: customer.poc_phone || '',
        availableHours: customer.poc_available_hours || ''
      },
      address: customer.site_address || '',
      accessApproach: customer.access_approach || '',
      parkingInstructions: customer.parking_instructions || ''
    },
    accessRequirements: {
      badgeRequired: customer.badge_required || false,
      escortRequired: customer.escort_required || false,
      ppeRequired: customer.ppe_required || false,
      safetyRequirements: customer.safety_requirements || ''
    },
    documentation: {
      folderUrl: customer.drive_folder_url || '',
      availability: {
        submittals: preparation?.has_submittals ?? customer.has_submittals ?? false,
        floorPlans: preparation?.has_floor_plans ?? customer.has_floor_plans ?? false,
        asBuilt: preparation?.has_as_built ?? customer.has_as_built ?? false,
        sequence: preparation?.has_sequence ?? customer.has_sequence ?? false,
        networkDiagram: preparation?.has_network_diagram ?? customer.has_network_diagram ?? false
      },
      completenessScore: preparation?.documentation_score ?? customer.documentation_score ?? 0,
      originalTeam: {
        contact: customer.original_team_contact || '',
        role: customer.original_team_role || '',
        whenToContact: customer.when_to_contact_original || ''
      }
    },
    tools: {
      selectedTools: preparation?.selected_tools ? JSON.parse(preparation.selected_tools) : [],
      systemSpecificTools: preparation?.system_specific_tools ? JSON.parse(preparation.system_specific_tools) : [],
      spareParts: preparation?.spare_parts_selected ? JSON.parse(preparation.spare_parts_selected) : [],
      additionalNotes: preparation?.additional_tools_notes || ''
    },
    checklist: {
      contactConfirmed: preparation?.contact_confirmed || false,
      accessPlanReviewed: preparation?.access_plan_reviewed_flag || false,
      credentialsVerified: preparation?.credentials_verified || false,
      toolsLoaded: preparation?.tools_loaded || false,
      notesReviewed: preparation?.notes_reviewed || false,
      safetyReviewed: preparation?.safety_reviewed || false
    }
  };
};

/**
 * Transform form data back to database updates
 */
export const transformPreVisitFormToUpdates = (
  formData: PreVisitFormData, 
  customerId: string, 
  visitId?: string
) => {
  // Customer updates - core information that should be persisted to customer record
  const customerUpdates = {
    site_nickname: formData.siteIntelligence.nickname,
    site_number: formData.siteIntelligence.siteNumber,
    system_platform: formData.siteIntelligence.systemPlatform,
    primary_technician_id: formData.siteIntelligence.primaryTechnicianId || null,
    secondary_technician_id: formData.siteIntelligence.secondaryTechnicianId || null,
    site_experience: formData.siteIntelligence.siteExperience,
    handoff_notes: formData.siteIntelligence.lastVisitInfo.notes,
    known_issues: formData.siteIntelligence.knownIssues,
    
    primary_contact: formData.contactInfo.primary.name,
    contact_phone: formData.contactInfo.primary.phone,
    contact_email: formData.contactInfo.primary.email,
    secondary_contact_name: formData.contactInfo.secondary?.name || null,
    secondary_contact_phone: formData.contactInfo.secondary?.phone || null,
    secondary_contact_email: formData.contactInfo.secondary?.email || null,
    poc_name: formData.contactInfo.poc.name,
    poc_phone: formData.contactInfo.poc.phone,
    poc_available_hours: formData.contactInfo.poc.availableHours,
    access_approach: formData.contactInfo.accessApproach,
    parking_instructions: formData.contactInfo.parkingInstructions,
    
    badge_required: formData.accessRequirements.badgeRequired,
    escort_required: formData.accessRequirements.escortRequired,
    ppe_required: formData.accessRequirements.ppeRequired,
    safety_requirements: formData.accessRequirements.safetyRequirements,
    
    drive_folder_url: formData.documentation.folderUrl,
    documentation_score: formData.documentation.completenessScore,
    original_team_contact: formData.documentation.originalTeam.contact,
    original_team_role: formData.documentation.originalTeam.role,
    when_to_contact_original: formData.documentation.originalTeam.whenToContact,
    
    // Also store document flags on customer for quick access
    has_submittals: formData.documentation.availability.submittals,
    has_floor_plans: formData.documentation.availability.floorPlans,
    has_as_built: formData.documentation.availability.asBuilt,
    has_sequence: formData.documentation.availability.sequence,
    has_network_diagram: formData.documentation.availability.networkDiagram,
    
    updated_at: new Date().toISOString()
  };
  
  // Preparation-specific data
  const preparationData = {
    customer_id: customerId,
    visit_id: visitId || null,
    
    // Document availability (workflow-specific)
    has_submittals: formData.documentation.availability.submittals,
    has_floor_plans: formData.documentation.availability.floorPlans,
    has_as_built: formData.documentation.availability.asBuilt,
    has_sequence: formData.documentation.availability.sequence,
    has_network_diagram: formData.documentation.availability.networkDiagram,
    documentation_score: formData.documentation.completenessScore,
    
    // Tool selections
    selected_tools: JSON.stringify(formData.tools.selectedTools),
    system_specific_tools: JSON.stringify(formData.tools.systemSpecificTools),
    spare_parts_selected: JSON.stringify(formData.tools.spareParts),
    additional_tools_notes: formData.tools.additionalNotes || null,
    
    // Checklist progress
    contact_confirmed: formData.checklist.contactConfirmed,
    access_plan_reviewed_flag: formData.checklist.accessPlanReviewed,
    credentials_verified: formData.checklist.credentialsVerified,
    tools_loaded: formData.checklist.toolsLoaded,
    notes_reviewed: formData.checklist.notesReviewed,
    safety_reviewed: formData.checklist.safetyReviewed,
    
    // Progress will be calculated by the database function
    last_activity: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return { customerUpdates, preparationData };
};

/**
 * Calculate overall progress based on form completion
 */
export const calculateFormProgress = (formData: PreVisitFormData): number => {
  const siteIntelligenceComplete = !!(
    formData.siteIntelligence.nickname &&
    formData.siteIntelligence.systemPlatform &&
    (formData.siteIntelligence.primaryTechnicianId || formData.siteIntelligence.secondaryTechnicianId)
  );
  
  const contactComplete = !!(
    formData.contactInfo.primary.name &&
    formData.contactInfo.primary.phone &&
    formData.contactInfo.accessApproach
  );
  
  const documentationComplete = !!(
    formData.documentation.folderUrl &&
    Object.values(formData.documentation.availability).some(v => v)
  );
  
  const toolsComplete = formData.tools.selectedTools.length >= 5;
  
  const checklistComplete = Object.values(formData.checklist).filter(Boolean).length >= 4;
  
  const completedSections = [
    siteIntelligenceComplete,
    contactComplete,
    documentationComplete,
    toolsComplete,
    checklistComplete
  ].filter(Boolean).length;
  
  return Math.round((completedSections / 5) * 100);
};

/**
 * Determine preparation status based on progress
 */
export const determinePreparationStatus = (formData: PreVisitFormData): 'pending' | 'in_progress' | 'completed' => {
  const progress = calculateFormProgress(formData);
  
  if (progress === 0) return 'pending';
  if (progress === 100) return 'completed';
  return 'in_progress';
};

/**
 * Get section completion status for UI feedback
 */
export const getSectionCompletionStatus = (formData: PreVisitFormData) => {
  return {
    siteIntelligence: !!(
      formData.siteIntelligence.nickname &&
      formData.siteIntelligence.systemPlatform &&
      (formData.siteIntelligence.primaryTechnicianId || formData.siteIntelligence.secondaryTechnicianId)
    ),
    contactAccess: !!(
      formData.contactInfo.primary.name &&
      formData.contactInfo.primary.phone &&
      formData.contactInfo.accessApproach
    ),
    
    documentation: !!(
      formData.documentation.folderUrl &&
      Object.values(formData.documentation.availability).some(v => v)
    ),
    
    tools: formData.tools.selectedTools.length >= 3,
    
    checklist: Object.values(formData.checklist).filter(Boolean).length >= 4
  };
};

/**
 * Unify arbitrary Pre-Visit form shapes into canonical PreVisitFormData
 * Accepts either the canonical shape or the legacy/UI shape used by PreVisitWorkflowEnhanced
 */
export const unifyPreVisitFormShape = (input: any): PreVisitFormData => {
  if (!input) {
    return {
      siteIntelligence: {
        nickname: '',
        siteNumber: '',
        systemPlatform: '',
        primaryTechnicianId: '',
        secondaryTechnicianId: '',
        siteExperience: 'first_time',
        lastVisitInfo: { date: '', by: '', notes: '' },
        knownIssues: []
      },
      contactInfo: {
        primary: { name: '', phone: '', email: '' },
        poc: { name: '', phone: '', availableHours: '' },
        address: '',
        accessApproach: '',
        parkingInstructions: ''
      },
      accessRequirements: {
        badgeRequired: false,
        escortRequired: false,
        ppeRequired: false,
        safetyRequirements: ''
      },
      documentation: {
        folderUrl: '',
        availability: { submittals: false, floorPlans: false, asBuilt: false, sequence: false, networkDiagram: false },
        completenessScore: 0,
        originalTeam: { contact: '', role: '', whenToContact: '' }
      },
      tools: {
        selectedTools: [],
        systemSpecificTools: [],
        spareParts: [],
        additionalNotes: ''
      },
      checklist: {
        contactConfirmed: false,
        accessPlanReviewed: false,
        credentialsVerified: false,
        toolsLoaded: false,
        notesReviewed: false,
        safetyReviewed: false
      }
    };
  }

  const inSI = input.siteIntelligence || {};
  const inCA = input.contactAccess || input.contactInfo || {};
  const inDOC = input.documentation || {};
  const inTOOLS = input.toolPreparation || input.tools || {};
  const inCHECK = input.checklist || {};

  const canonical: PreVisitFormData = {
    siteIntelligence: {
      nickname: inSI.nickname ?? inSI.siteNickname ?? '',
      siteNumber: inSI.siteNumber ?? inSI.site_number ?? '',
      systemPlatform: inSI.systemPlatform ?? inSI.system_platform ?? '',
      primaryTechnicianId: inSI.primaryTechnicianId ?? inSI.primary_technician_id ?? '',
      secondaryTechnicianId: inSI.secondaryTechnicianId ?? inSI.secondary_technician_id ?? '',
      siteExperience: inSI.siteExperience ?? 'first_time',
      lastVisitInfo: {
        date: inSI.lastVisitInfo?.date ?? inSI.lastVisitDate ?? '',
        by: inSI.lastVisitInfo?.by ?? inSI.lastVisitBy ?? '',
        notes: inSI.lastVisitInfo?.notes ?? inSI.handoffNotes ?? ''
      },
      knownIssues: Array.isArray(inSI.knownIssues) ? inSI.knownIssues : (inSI.known_issues || [])
    },
    contactInfo: {
      primary: {
        name: inCA.primary?.name ?? inCA.primaryContact ?? '',
        phone: inCA.primary?.phone ?? inCA.contactPhone ?? '',
        email: inCA.primary?.email ?? inCA.contactEmail ?? ''
      },
      secondary: inCA.secondary || (inCA.secondaryContactName ? {
        name: inCA.secondaryContactName,
        phone: inCA.secondaryContactPhone || '',
        email: inCA.secondaryContactEmail || ''
      } : undefined),
      poc: {
        name: inCA.poc?.name ?? inCA.pocName ?? '',
        phone: inCA.poc?.phone ?? inCA.pocPhone ?? '',
        availableHours: inCA.poc?.availableHours ?? inCA.pocAvailableHours ?? ''
      },
      address: inCA.address ?? '',
      accessApproach: inCA.accessApproach ?? '',
      parkingInstructions: inCA.parkingInstructions ?? ''
    },
    accessRequirements: {
      badgeRequired: inCA.badgeRequired ?? false,
      escortRequired: inCA.escortRequired ?? false,
      ppeRequired: inCA.ppeRequired ?? false,
      safetyRequirements: inCA.safetyRequirements ?? ''
    },
    documentation: {
      folderUrl: inDOC.folderUrl ?? inDOC.driveFolderUrl ?? '',
      availability: {
        submittals: inDOC.availability?.submittals ?? inDOC.hasSubmittals ?? false,
        floorPlans: inDOC.availability?.floorPlans ?? inDOC.hasFloorPlans ?? false,
        asBuilt: inDOC.availability?.asBuilt ?? inDOC.hasAsBuilt ?? false,
        sequence: inDOC.availability?.sequence ?? inDOC.hasSequence ?? false,
        networkDiagram: inDOC.availability?.networkDiagram ?? inDOC.hasNetworkDiagram ?? false,
      },
      completenessScore: inDOC.completenessScore ?? inDOC.documentationScore ?? 0,
      originalTeam: {
        contact: inDOC.originalTeam?.contact ?? inDOC.originalTeamContact ?? '',
        role: inDOC.originalTeam?.role ?? inDOC.originalTeamRole ?? '',
        whenToContact: inDOC.originalTeam?.whenToContact ?? inDOC.whenToContactOriginal ?? ''
      }
    },
    tools: {
      selectedTools: inTOOLS.selectedTools ?? [],
      systemSpecificTools: inTOOLS.systemSpecificTools ?? [],
      spareParts: inTOOLS.spareParts ?? [],
      additionalNotes: inTOOLS.additionalToolsNeeded ?? inTOOLS.additionalNotes ?? ''
    },
    checklist: {
      contactConfirmed: inCHECK.contactConfirmed ?? false,
      accessPlanReviewed: inCHECK.accessPlanReviewed ?? false,
      credentialsVerified: inCHECK.credentialsVerified ?? false,
      toolsLoaded: inCHECK.toolsLoaded ?? false,
      notesReviewed: inCHECK.notesReviewed ?? false,
      safetyReviewed: inCHECK.safetyReviewed ?? false
    }
  };

  return canonical;
};

/**
 * Build DB storage sections using UI-compatible keys to avoid breaking existing UI
 */
export const buildPrevisitSectionsForStorage = (canonical: PreVisitFormData) => {
  return {
    siteIntelligence: {
      siteNickname: canonical.siteIntelligence.nickname,
      siteNumber: canonical.siteIntelligence.siteNumber,
      systemPlatform: canonical.siteIntelligence.systemPlatform,
      primaryTechnicianId: canonical.siteIntelligence.primaryTechnicianId,
      secondaryTechnicianId: canonical.siteIntelligence.secondaryTechnicianId,
      siteExperience: canonical.siteIntelligence.siteExperience,
      lastVisitDate: canonical.siteIntelligence.lastVisitInfo.date,
      lastVisitBy: canonical.siteIntelligence.lastVisitInfo.by,
      handoffNotes: canonical.siteIntelligence.lastVisitInfo.notes,
      knownIssues: canonical.siteIntelligence.knownIssues
    },
    contactAccess: {
      primaryContact: canonical.contactInfo.primary.name,
      contactPhone: canonical.contactInfo.primary.phone,
      contactEmail: canonical.contactInfo.primary.email,
      secondaryContactName: canonical.contactInfo.secondary?.name,
      secondaryContactPhone: canonical.contactInfo.secondary?.phone,
      secondaryContactEmail: canonical.contactInfo.secondary?.email,
      pocName: canonical.contactInfo.poc.name,
      pocPhone: canonical.contactInfo.poc.phone,
      pocAvailableHours: canonical.contactInfo.poc.availableHours,
      address: canonical.contactInfo.address,
      accessApproach: canonical.contactInfo.accessApproach,
      parkingInstructions: canonical.contactInfo.parkingInstructions,
      badgeRequired: canonical.accessRequirements.badgeRequired,
      escortRequired: canonical.accessRequirements.escortRequired,
      ppeRequired: canonical.accessRequirements.ppeRequired,
      safetyRequirements: canonical.accessRequirements.safetyRequirements
    },
    documentation: {
      driveFolderUrl: canonical.documentation.folderUrl,
      hasSubmittals: canonical.documentation.availability.submittals,
      hasFloorPlans: canonical.documentation.availability.floorPlans,
      hasAsBuilt: canonical.documentation.availability.asBuilt,
      hasSequence: canonical.documentation.availability.sequence,
      hasNetworkDiagram: canonical.documentation.availability.networkDiagram,
      documentationScore: canonical.documentation.completenessScore,
      originalTeamContact: canonical.documentation.originalTeam.contact,
      originalTeamRole: canonical.documentation.originalTeam.role,
      whenToContactOriginal: canonical.documentation.originalTeam.whenToContact
    },
    toolPreparation: {
      selectedTools: canonical.tools.selectedTools,
      systemSpecificTools: canonical.tools.systemSpecificTools,
      spareParts: canonical.tools.spareParts,
      additionalToolsNeeded: canonical.tools.additionalNotes
    },
    checklist: { ...canonical.checklist }
  };
};

export const filterToolsByPlatform = (tools: ToolCatalogItem[], systemPlatform?: string) => {
  if (!systemPlatform) return tools;
  
  return tools.filter(tool => 
    tool.system_platforms.includes(systemPlatform) ||
    tool.category === 'standard' ||
    tool.category === 'spareparts'
  );
};

/**
 * Get auto-selected required tools for a platform
 */
export const getAutoSelectedTools = (tools: ToolCatalogItem[], systemPlatform?: string): string[] => {
  const filteredTools = filterToolsByPlatform(tools, systemPlatform);
  return filteredTools
    .filter(tool => tool.is_required)
    .map(tool => tool.tool_id);
};

/**
 * Validate form data before submission
 */
export const validatePreVisitForm = (formData: PreVisitFormData): string[] => {
  const errors: string[] = [];
  
  // Site Intelligence validation
  if (!formData.siteIntelligence.nickname) {
    errors.push('Site nickname is required');
  }
  if (!formData.siteIntelligence.systemPlatform) {
    errors.push('System platform is required');
  }
  if (!formData.siteIntelligence.primaryTechnicianId && !formData.siteIntelligence.secondaryTechnicianId) {
    errors.push('At least one technician must be assigned');
  }
  
  // Contact validation
  if (!formData.contactInfo.primary.name) {
    errors.push('Primary contact name is required');
  }
  if (!formData.contactInfo.primary.phone) {
    errors.push('Primary contact phone is required');
  }
  if (!formData.contactInfo.accessApproach) {
    errors.push('Access approach is required');
  }
  
  // Tools validation
  if (formData.tools.selectedTools.length < 5) {
    errors.push('At least 5 tools must be selected');
  }
  
  // Checklist validation
  const checklistCompleted = Object.values(formData.checklist).filter(Boolean).length;
  if (checklistCompleted < 4) {
    errors.push('At least 4 checklist items must be completed');
  }
  
  return errors;
};
