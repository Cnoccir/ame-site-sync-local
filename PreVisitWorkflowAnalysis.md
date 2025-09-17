# PreVisitWorkflowEnhanced Analysis & Database Design

## Executive Summary

This document provides a comprehensive analysis of the PreVisitWorkflowEnhanced.tsx component and proposes database improvements for seamless data loading, storage, and CRUD operations. The solution includes field mapping, data transformation logic, and a new dedicated table for PreVisit data.

## Current Component Analysis

### Form Structure Overview

The PreVisitWorkflowEnhanced component contains 5 main sections:

1. **Site Intelligence Review** - Core site identification and team assignment
2. **Contact & Access Planning** - Contact verification and access coordination  
3. **Project Documentation Review** - Document availability and project context
4. **Tool Preparation** - System-specific tool selection and preparation
5. **Pre-Visit Checklist** - Final verification steps

### Key State Management

- **formData**: Main form state extending Customer type
- **checklist**: Boolean flags for preparation steps
- **documentAvailability**: Document availability flags
- **selectedTools**: Array of selected tool IDs
- **expandedSections**: UI state for section visibility

## Database Field Mapping Analysis

### 1. Site Intelligence Section

#### Direct Mapping (Available in ame_customers)
| Form Field | Database Field | Type | Notes |
|------------|---------------|------|-------|
| `site_nickname` | `site_nickname` | varchar | Quick reference name |
| `system_platform` | `system_type` | varchar | System platform type |
| `site_number` | `site_number` | varchar | Unique site identifier |
| `primary_technician_id` | `primary_technician_id` | uuid | Foreign key to auth.users |
| `secondary_technician_id` | `secondary_technician_id` | uuid | Foreign key to auth.users |
| `primary_technician_name` | `primary_technician_name` | varchar | Cached technician name |
| `secondary_technician_name` | `secondary_technician_name` | varchar | Cached technician name |
| `site_experience` | `site_experience` | varchar | Enum: first_time/familiar/expert |
| `last_visit_date` | `last_visit_date` | timestamptz | Last visit timestamp |
| `last_visit_by` | `last_visit_by` | varchar | Last technician name |
| `handoff_notes` | `handoff_notes` | text | Previous visit notes |
| `known_issues` | `known_issues` | text[] | Array of known issues |

#### Missing Fields (Need to add to ame_customers)
- `address` - Currently only have `site_address` 
- `escort_required` - Missing boolean field
- `has_submittals`, `has_floor_plans`, `has_as_built`, etc. - Document flags

### 2. Contact & Access Planning Section

#### Direct Mapping (Available in ame_customers)
| Form Field | Database Field | Type | Notes |
|------------|---------------|------|-------|
| `primary_contact` | `primary_contact` | varchar | Primary contact name |
| `contact_phone` | `contact_phone` | varchar | Primary phone |
| `contact_email` | `contact_email` | varchar | Primary email |
| `secondary_contact_name` | `secondary_contact_name` | varchar | Secondary contact |
| `secondary_contact_phone` | `secondary_contact_phone` | varchar | Secondary phone |
| `poc_name` | `poc_name` | varchar | Point of contact |
| `poc_phone` | `poc_phone` | varchar | POC phone |
| `poc_available_hours` | `poc_available_hours` | varchar | Availability schedule |
| `best_arrival_times` | `best_arrival_times` | text[] | Optimal arrival times |
| `address` | `site_address` | text | Site address |
| `access_approach` | `access_approach` | text | Access instructions |
| `parking_instructions` | `parking_instructions` | text | Parking details |
| `badge_required` | `badge_required` | boolean | Badge requirement |
| `ppe_required` | `ppe_required` | boolean | PPE requirement |
| `safety_requirements` | `safety_requirements` | text | Safety notes |

#### Missing Fields
- `escort_required` - Boolean field for escort requirement

### 3. Documentation Section

#### Partial Mapping
| Form Field | Database Field | Type | Notes |
|------------|---------------|------|-------|
| `drive_folder_url` | `drive_folder_url` | text | Project folder URL |
| `documentation_score` | `documentation_score` | integer | Completeness score |
| `original_team_contact` | `original_team_contact` | varchar | Original team contact |
| `original_team_role` | `original_team_role` | varchar | Contact role |
| `when_to_contact_original` | `when_to_contact_original` | text | Contact guidance |

#### Missing Fields
- Document availability flags: `has_submittals`, `has_floor_plans`, `has_as_built`, `has_sequence`, `has_network_diagram`

### 4. Tool Preparation Section

#### Missing Completely
- No current storage for selected tools
- No mapping between customers and tool selections
- Tool catalog exists in component but not in database

### 5. Checklist Section

#### Missing Completely
- No storage for checklist completion states
- No tracking of preparation progress

## Proposed Database Schema Changes

### 1. Add Missing Fields to ame_customers

```sql
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS escort_required BOOLEAN DEFAULT false;
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS has_submittals BOOLEAN DEFAULT false;
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS has_floor_plans BOOLEAN DEFAULT false;
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS has_as_built BOOLEAN DEFAULT false;
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS has_sequence BOOLEAN DEFAULT false;
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS has_network_diagram BOOLEAN DEFAULT false;
```

### 2. Create New previsit_preparations Table

```sql
CREATE TABLE previsit_preparations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES ame_customers(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES ame_visits(id) ON DELETE CASCADE,
    
    -- Site Intelligence Data
    site_intelligence_complete BOOLEAN DEFAULT false,
    system_platform_verified BOOLEAN DEFAULT false,
    technician_assignment_complete BOOLEAN DEFAULT false,
    site_experience_level VARCHAR(20) CHECK (site_experience_level IN ('first_time', 'familiar', 'expert')),
    
    -- Contact & Access Data
    contact_verification_complete BOOLEAN DEFAULT false,
    primary_contact_confirmed BOOLEAN DEFAULT false,
    access_plan_reviewed BOOLEAN DEFAULT false,
    security_requirements_verified BOOLEAN DEFAULT false,
    
    -- Documentation Status
    documentation_review_complete BOOLEAN DEFAULT false,
    has_submittals BOOLEAN DEFAULT false,
    has_floor_plans BOOLEAN DEFAULT false,
    has_as_built BOOLEAN DEFAULT false,
    has_sequence BOOLEAN DEFAULT false,
    has_network_diagram BOOLEAN DEFAULT false,
    documentation_score INTEGER DEFAULT 0 CHECK (documentation_score >= 0 AND documentation_score <= 100),
    
    -- Tool Selection
    tools_preparation_complete BOOLEAN DEFAULT false,
    selected_tools JSONB DEFAULT '[]'::jsonb,
    system_specific_tools JSONB DEFAULT '[]'::jsonb,
    spare_parts_selected JSONB DEFAULT '[]'::jsonb,
    additional_tools_notes TEXT,
    
    -- Checklist Progress
    checklist_complete BOOLEAN DEFAULT false,
    contact_confirmed BOOLEAN DEFAULT false,
    access_plan_reviewed_flag BOOLEAN DEFAULT false,
    credentials_verified BOOLEAN DEFAULT false,
    tools_loaded BOOLEAN DEFAULT false,
    notes_reviewed BOOLEAN DEFAULT false,
    safety_reviewed BOOLEAN DEFAULT false,
    
    -- Progress Tracking
    overall_progress INTEGER DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
    sections_completed INTEGER DEFAULT 0,
    total_sections INTEGER DEFAULT 5,
    preparation_status VARCHAR(20) DEFAULT 'pending' CHECK (preparation_status IN ('pending', 'in_progress', 'completed')),
    
    -- Auto-save and Session Data
    auto_save_data JSONB DEFAULT '{}'::jsonb,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    session_token TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),
    
    -- Constraints
    UNIQUE(customer_id, visit_id),  -- One preparation per customer per visit
    INDEX (customer_id),
    INDEX (visit_id),
    INDEX (preparation_status),
    INDEX (last_activity)
);
```

### 3. Create Tools Catalog Table

```sql
CREATE TABLE ame_tool_catalog (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tool_id VARCHAR(100) UNIQUE NOT NULL,
    tool_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'standard', 'niagara', 'johnson', 'honeywell', 'spareparts'
    subcategory VARCHAR(100),
    icon_name VARCHAR(100),
    is_required BOOLEAN DEFAULT false,
    system_platforms TEXT[], -- Array of compatible platforms
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### 4. Create Visit-Tool Junction Table

```sql
CREATE TABLE previsit_tool_selections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    previsit_preparation_id UUID NOT NULL REFERENCES previsit_preparations(id) ON DELETE CASCADE,
    tool_id UUID NOT NULL REFERENCES ame_tool_catalog(id),
    is_selected BOOLEAN DEFAULT true,
    selection_reason VARCHAR(100), -- 'required', 'recommended', 'optional', 'user_added'
    quantity INTEGER DEFAULT 1,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    
    UNIQUE(previsit_preparation_id, tool_id)
);
```

## Data Transformation Logic

### 1. Loading Data for PreVisit Form

```typescript
interface PreVisitFormData {
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

// Transformation function from database to form
const transformCustomerToPreVisitForm = (customer: Customer, preparation?: PrevisitPreparation): PreVisitFormData => {
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
        submittals: preparation?.has_submittals || customer.has_submittals || false,
        floorPlans: preparation?.has_floor_plans || customer.has_floor_plans || false,
        asBuilt: preparation?.has_as_built || customer.has_as_built || false,
        sequence: preparation?.has_sequence || customer.has_sequence || false,
        networkDiagram: preparation?.has_network_diagram || customer.has_network_diagram || false
      },
      completenessScore: preparation?.documentation_score || customer.documentation_score || 0,
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
```

### 2. Saving Data Back to Database

```typescript
const savePreVisitData = async (formData: PreVisitFormData, customerId: string, visitId?: string) => {
  // Update customer record with basic info that changed
  const customerUpdates = {
    site_nickname: formData.siteIntelligence.nickname,
    site_number: formData.siteIntelligence.siteNumber,
    system_platform: formData.siteIntelligence.systemPlatform,
    primary_technician_id: formData.siteIntelligence.primaryTechnicianId,
    secondary_technician_id: formData.siteIntelligence.secondaryTechnicianId,
    site_experience: formData.siteIntelligence.siteExperience,
    handoff_notes: formData.siteIntelligence.lastVisitInfo.notes,
    known_issues: formData.siteIntelligence.knownIssues,
    
    primary_contact: formData.contactInfo.primary.name,
    contact_phone: formData.contactInfo.primary.phone,
    contact_email: formData.contactInfo.primary.email,
    secondary_contact_name: formData.contactInfo.secondary?.name,
    secondary_contact_phone: formData.contactInfo.secondary?.phone,
    secondary_contact_email: formData.contactInfo.secondary?.email,
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
    
    updated_at: new Date().toISOString()
  };
  
  // Upsert previsit preparation record
  const preparationData = {
    customer_id: customerId,
    visit_id: visitId,
    
    // Document availability
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
    additional_tools_notes: formData.tools.additionalNotes,
    
    // Checklist progress
    contact_confirmed: formData.checklist.contactConfirmed,
    access_plan_reviewed_flag: formData.checklist.accessPlanReviewed,
    credentials_verified: formData.checklist.credentialsVerified,
    tools_loaded: formData.checklist.toolsLoaded,
    notes_reviewed: formData.checklist.notesReviewed,
    safety_reviewed: formData.checklist.safetyReviewed,
    
    // Progress calculation
    overall_progress: calculateOverallProgress(formData),
    sections_completed: calculateCompletedSections(formData),
    preparation_status: determinePreparationStatus(formData),
    
    last_activity: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  return { customerUpdates, preparationData };
};
```

## CRUD Operations Design

### 1. Read Operations

```typescript
// Load customer and preparation data
const loadPreVisitData = async (customerId: string, visitId?: string) => {
  const { data: customer } = await supabase
    .from('ame_customers')
    .select('*')
    .eq('id', customerId)
    .single();
    
  const { data: preparation } = await supabase
    .from('previsit_preparations')
    .select('*')
    .eq('customer_id', customerId)
    .eq('visit_id', visitId || null)
    .single();
    
  return transformCustomerToPreVisitForm(customer, preparation);
};

// Load tool catalog
const loadToolCatalog = async (systemPlatform?: string) => {
  let query = supabase
    .from('ame_tool_catalog')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
    
  if (systemPlatform) {
    query = query.contains('system_platforms', [systemPlatform]);
  }
  
  const { data: tools } = await query;
  return tools;
};
```

### 2. Create/Update Operations

```typescript
// Auto-save functionality
const autoSavePreVisitData = debounce(async (formData: Partial<PreVisitFormData>, customerId: string, visitId?: string) => {
  const { customerUpdates, preparationData } = await savePreVisitData(formData, customerId, visitId);
  
  // Update customer record
  await supabase
    .from('ame_customers')
    .update(customerUpdates)
    .eq('id', customerId);
    
  // Upsert preparation record
  await supabase
    .from('previsit_preparations')
    .upsert(preparationData, {
      onConflict: 'customer_id,visit_id'
    });
}, 1000);

// Complete preparation
const completePreVisitPreparation = async (customerId: string, visitId?: string) => {
  await supabase
    .from('previsit_preparations')
    .update({
      preparation_status: 'completed',
      overall_progress: 100,
      sections_completed: 5,
      updated_at: new Date().toISOString()
    })
    .eq('customer_id', customerId)
    .eq('visit_id', visitId || null);
    
  // Update visit phase if applicable
  if (visitId) {
    await supabase
      .from('ame_visits')
      .update({
        phase_1_status: 'Completed',
        phase_1_completed_at: new Date().toISOString(),
        current_phase: 2
      })
      .eq('id', visitId);
  }
};
```

### 3. Helper Functions

```typescript
// Calculate overall progress based on completed sections
const calculateOverallProgress = (formData: PreVisitFormData): number => {
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

// Determine preparation status
const determinePreparationStatus = (formData: PreVisitFormData): 'pending' | 'in_progress' | 'completed' => {
  const progress = calculateOverallProgress(formData);
  
  if (progress === 0) return 'pending';
  if (progress === 100) return 'completed';
  return 'in_progress';
};
```

## Implementation Roadmap

### Phase 1: Database Schema Updates
1. Add missing fields to ame_customers table
2. Create previsit_preparations table
3. Create tool catalog and selection tables
4. Add appropriate indexes and constraints

### Phase 2: Data Layer Implementation
1. Create transformation functions
2. Implement CRUD operations with MCP tools
3. Add auto-save functionality
4. Create data validation logic

### Phase 3: Component Integration
1. Integrate new data loading logic
2. Update form state management
3. Implement progress tracking
4. Add error handling and recovery

### Phase 4: Testing & Optimization
1. Test data consistency and integrity
2. Optimize query performance
3. Test auto-save functionality
4. Validate progress calculations

This design ensures:
- ✅ Seamless data loading from existing customer data
- ✅ Robust auto-save and data persistence
- ✅ Comprehensive progress tracking
- ✅ Scalable tool management system
- ✅ Data integrity and consistency
- ✅ Forward compatibility with reporting systems
