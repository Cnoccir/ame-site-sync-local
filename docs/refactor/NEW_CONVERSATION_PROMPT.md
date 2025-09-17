I'm continuing development of the PM Guidance Tool - a systematic 4-phase workflow application for HVAC technicians. Sessions 1-2 are COMPLETE (45% overall progress). I need to implement **Phase 3: Service Activities** with SOP integration.

## 🎯 PROJECT CONTEXT

**Location**: `C:\Users\tech\Projects\ame-site-sync-local`
**Status**: Phase 1 & 2 FULLY FUNCTIONAL, need Phase 3 implementation
**Architecture**: 4-phase systematic workflow (Site Intelligence → System Discovery → Service Activities → Documentation)

## ✅ WHAT'S WORKING (Sessions 1-2 Complete)

### Fully Functional Components:
1. **Main Architecture**: `src/components/pm-workflow/PMWorkflowGuide.tsx` - Working orchestrator
2. **Shared Components**: `src/components/pm-workflow/shared/index.ts` - UI library  
3. **Type System**: `src/types/pmWorkflow/index.ts` - Complete TypeScript definitions
4. **Phase 1**: `src/components/pm-workflow/phases/Phase1SiteIntelligence.tsx` - Contact mgmt, access, safety ✅
5. **Phase 2**: `src/components/pm-workflow/phases/Phase2SystemDiscovery.tsx` - BMS overview, file upload ✅
6. **Navigation**: 4-phase progress tracking with validation ✅

### Test Instructions:
```bash
cd C:\Users\tech\Projects\ame-site-sync-local
npm run dev  # Runs on port 8083
# Navigate to: /pm-guidance/{customer-id}
# Phase 1 & 2 should work perfectly
```

## 🎯 PHASE 3 REQUIREMENTS

**File to Create**: `src/components/pm-workflow/phases/Phase3ServiceActivities.tsx`

### Core Features Needed:
1. **Service Tier Task Mapping** - Load tasks based on customer.service_tier:
   - **CORE**: SOPs C001-C008 (8 essential tasks)
   - **ASSURE**: +SOPs A001-A007 (additional analysis)  
   - **GUARDIAN**: +SOPs G001-G006 (advanced optimization)

2. **SOP Integration** - Use data from:
   - `docs/SOP_Library_v22.csv` - Complete SOP definitions with steps, tools, safety
   - `docs/Task_Library_v22.csv` - Task definitions with durations, prerequisites

3. **Task Execution Interface**:
   - Expandable task cards with SOP quick reference
   - Task completion tracking with timestamps
   - Issues documentation with severity levels
   - Recommendations capture with categories
   - Photo attachment capability

4. **Progress Calculation** - Enable phase advancement when tasks complete

## 🔧 IMPLEMENTATION PATTERN

**Follow existing patterns from Phase 1 & 2**:

```typescript
// Component structure (follow Phase1SiteIntelligence.tsx pattern)
interface Phase3ServiceActivitiesProps {
  customer: Customer;
  data: ServiceActivitiesData; // From existing pmWorkflow types
  onDataUpdate: (data: Partial<ServiceActivitiesData>) => void;
  onPhaseComplete: () => void;
}

// Tab structure:
// - Customer Priorities (gather concerns/issues)
// - Service Tasks (tier-specific SOP tasks)  
// - Issues Found (document problems)
// - Recommendations (improvement opportunities)
```

## 📊 DATA INTEGRATION

### CSV Structure to Parse:
- **SOP_Library_v22.csv**: `SOP_ID, Title, Service_Tiers, Estimated_Duration_min, Goal, Step_List_CORE, Step_List_ASSURE, Step_List_GUARDIAN, Tools, Safety`
- **Task_Library_v22.csv**: `Task_ID, Task_Name, Service_Tiers, SOP_Refs, Prerequisites, Tools_Required`

### Service Tier Filtering:
```typescript
const getTasksForTier = (tier: 'CORE' | 'ASSURE' | 'GUARDIAN') => {
  // Filter SOPs by Service_Tiers column
  // Return task list with SOP references
};
```

## 🎨 UI REQUIREMENTS

**Use existing shared components**:
- `PhaseHeader` - For phase header with progress
- `SectionCard` - For content sections  
- Follow Phase 1 & 2 tab-based navigation pattern
- Maintain AME Controls professional branding

**Task Card Design**:
```
[✓] Platform & Station Backup          [SOP-C001] [⏱️ 15min]
    Perform complete system backup      [🔍 View SOP] [📝 Notes]
    Progress: ████████░░ 80%            [📸 Photos] [✅ Complete]
```

## 🧪 TESTING

1. **Start server**: `npm run dev` (port 8083)
2. **Test route**: `/pm-guidance/{customer-id}` 
3. **Verify**: Phase 1 & 2 work → Phase 3 should load tasks based on service tier
4. **Validate**: Task completion enables phase advancement

## 📁 KEY FILES TO REFERENCE

### Pattern References:
- `src/components/pm-workflow/phases/Phase1SiteIntelligence.tsx` - UI patterns
- `src/components/pm-workflow/phases/Phase2SystemDiscovery.tsx` - Component structure

### Data Sources:
- `docs/SOP_Library_v22.csv` - SOP procedures and steps
- `docs/Task_Library_v22.csv` - Task definitions  

### Integration Point:
- `src/components/pm-workflow/PMWorkflowGuide.tsx` - Add Phase 3 import and replace placeholder

## 🎯 SUCCESS CRITERIA

- [ ] Service tier tasks load correctly (CORE/ASSURE/GUARDIAN)
- [ ] SOP quick reference displays properly
- [ ] Task completion tracking with timestamps
- [ ] Issues and recommendations capture
- [ ] Progress calculation enables phase advancement
- [ ] No TypeScript compilation errors
- [ ] Consistent with existing Phase 1 & 2 patterns

---

**Current State**: Excellent foundation with working Phase 1 & 2
**Next Goal**: Complete Phase 3 Service Activities with SOP integration
**Architecture**: Solid, extensible, ready for enhancement

Please analyze the existing codebase, understand the patterns, and implement Phase 3 Service Activities following the established architecture and design patterns.