# Phase 2 Site Intelligence Enhancement

This document describes the enhanced Site Intelligence System implementation that addresses team feedback and provides comprehensive pre-visit preparation capabilities.

## Overview

The Phase 2 enhancement transforms the basic Site Intelligence system into a comprehensive solution that provides:

1. **Enhanced Team Context** - Track technician assignments, site experience, and handoff notes
2. **Access Intelligence** - Optimal timing, contact information, and access patterns
3. **Project Status Tracking** - Completion status, documentation scores, and original team contacts
4. **Intelligent Tool Recommendations** - System-specific and site-specific tool suggestions

## Database Schema Changes

### Enhanced Fields Added to `ame_customers`

```sql
-- Enhanced Team Context fields
ALTER TABLE public.ame_customers ADD COLUMN last_visit_by VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN last_visit_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.ame_customers ADD COLUMN site_experience VARCHAR(20);
ALTER TABLE public.ame_customers ADD COLUMN handoff_notes TEXT;

-- Enhanced Access Intelligence fields  
ALTER TABLE public.ame_customers ADD COLUMN best_arrival_times TEXT[];
ALTER TABLE public.ame_customers ADD COLUMN poc_name VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN poc_phone VARCHAR(20);
ALTER TABLE public.ame_customers ADD COLUMN poc_available_hours VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN backup_contact VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN access_approach TEXT;
ALTER TABLE public.ame_customers ADD COLUMN common_access_issues TEXT[];
ALTER TABLE public.ame_customers ADD COLUMN scheduling_notes TEXT;

-- Enhanced Project Status fields
ALTER TABLE public.ame_customers ADD COLUMN completion_status VARCHAR(20);
ALTER TABLE public.ame_customers ADD COLUMN commissioning_notes TEXT;
ALTER TABLE public.ame_customers ADD COLUMN known_issues TEXT[];
ALTER TABLE public.ame_customers ADD COLUMN documentation_score INTEGER;
ALTER TABLE public.ame_customers ADD COLUMN original_team_contact VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN original_team_role VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN original_team_info TEXT;
ALTER TABLE public.ame_customers ADD COLUMN when_to_contact_original TEXT;
```

## Key Components

### 1. Enhanced Site Intelligence Card (`EnhancedSiteIntelligenceCard.tsx`)

A comprehensive card component that displays:

- **Site Identity**: Nickname, site number, system platform, service tier
- **Team Context**: Primary/secondary technicians, last visit info, site experience, handoff notes
- **Access Intelligence**: POC info, arrival times, access patterns, scheduling constraints
- **Project Status**: Completion status, commissioning notes, known issues, documentation score
- **Intelligent Tool Recommendations**: Platform-specific and site-specific tool suggestions

### 2. Enhanced SiteIntelligenceService

Extended the service with new methods:

- `getSiteIntelligenceData()` - Fetch comprehensive site intelligence using DB function
- `generateToolRecommendations()` - Generate intelligent tool suggestions
- `updateTeamContext()` - Update team-related information
- `updateAccessIntelligence()` - Update access-related information
- `updateProjectStatus()` - Update project status information

### 3. Database Functions

#### `get_site_intelligence(customer_id_param UUID)`

Returns structured JSON with all site intelligence data:

```json
{
  \"siteIdentity\": {
    \"nickname\": \"...\",
    \"siteNumber\": \"...\",
    \"legacyJobNumbers\": [...],
    \"systemPlatform\": \"...\",
    \"serviceTier\": \"...\"
  },
  \"teamContext\": {
    \"primaryTech\": \"...\",
    \"secondaryTech\": \"...\",
    \"lastVisitBy\": \"...\",
    \"lastVisitDate\": \"...\",
    \"siteExperience\": \"...\",
    \"handoffNotes\": \"...\"
  },
  \"accessIntelligence\": {
    \"bestArrivalTimes\": [...],
    \"pocAvailability\": {...},
    \"accessPatterns\": {...}
  },
  \"projectStatus\": {
    \"completionStatus\": \"...\",
    \"commissioningNotes\": \"...\",
    \"knownIssues\": [...],
    \"documentationScore\": 85,
    \"originalTeamContact\": {...}
  }
}
```

## Sample Data Populated

For the test customer (`AME-2025-003`), realistic sample data has been added:

- **Team Context**: Mike Johnson as last visit technician, site marked as 'familiar'
- **Access Intelligence**: POC Sarah Mitchell, optimal arrival times, backup contacts
- **Project Status**: Operational status, 85% documentation score, David Kim as original contact
- **Known Issues**: AHU-3 damper actuator calibration needs, BAS integration pending

## Intelligent Tool Recommendations

The system generates tool recommendations based on:

1. **System Platform**: N4 requires Workbench laptop, WEBs needs modern browser, etc.
2. **Service Tier**: Guardian tier gets advanced diagnostic tools
3. **Known Issues**: Actuator problems trigger calibration kit recommendations
4. **Access Patterns**: Badge issues suggest bringing temporary access forms
5. **Safety Requirements**: Always includes basic PPE and tools

## Next Steps

To apply this enhancement:

1. **Run the database migration**: Execute `supabase/migrations/20250127000000_enhanced_site_intelligence.sql`
2. **Verify data**: The sample data should populate automatically for `AME-2025-003`
3. **Test the interface**: The PreVisitPhase now uses the enhanced Site Intelligence card
4. **Update other customers**: Use the SiteIntelligenceService methods to update additional customer data

## Benefits

This enhancement addresses key team feedback:

- **Rob's nickname/reference needs**: Clear site nicknames and numbers
- **John's system platform tracking**: Prominent platform badges and tool recommendations  
- **Team handoff improvements**: Comprehensive notes and technician assignments
- **Access coordination**: Contact info, timing, and approach documentation
- **Project continuity**: Original team contacts and project status tracking

The enhanced system provides technicians with all the context they need for successful site visits while maintaining the simplicity of the original workflow.
