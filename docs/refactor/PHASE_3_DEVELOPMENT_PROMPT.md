# PM Guidance Tool - Phase 3 Development Session Prompt

## 🎯 CONTEXT & CURRENT STATE

I'm continuing development of the **PM Guidance Tool Refactor** - a systematic 4-phase workflow application for HVAC technicians. This replaces a customer-centric approach with a professional systematic checklist that automatically generates rich PDF reports.

**Project Location**: `C:\Users\tech\Projects\ame-site-sync-local`
**Development Status**: Sessions 1-2 COMPLETE (45% overall progress)
**Current Focus**: **SESSION 3 - Phase 3 Service Activities Implementation**

## 📊 COMPLETED WORK (Sessions 1-2)

### ✅ FULLY FUNCTIONAL COMPONENTS

1. **Complete 4-Phase Architecture**
   - `src/components/pm-workflow/PMWorkflowGuide.tsx` - Main orchestrator component
   - `src/components/pm-workflow/shared/index.ts` - Shared UI components library
   - `src/types/pmWorkflow/index.ts` - Comprehensive TypeScript type system

2. **Phase 1: Site Intelligence - COMPLETE ✅**
   - `src/components/pm-workflow/phases/Phase1SiteIntelligence.tsx`
   - Features: Customer info, contact management, access procedures, safety systems
   - Auto-population from existing customer data
   - Full CRUD operations for contacts with roles and availability
   - Hazard tracking with predefined and custom options

3. **Phase 2: System Discovery - COMPLETE ✅**
   - `src/components/pm-workflow/phases/Phase2SystemDiscovery.tsx`
   - Features: BMS overview, Tridium file upload, manual inventory
   - Platform selection (Niagara, Johnson, Honeywell, etc.)
   - Drag-and-drop file upload with mock CSV processing
   - System performance metrics display

4. **Professional Navigation System ✅**
   - Tab-based phase navigation with visual progress tracking
   - Form validation preventing invalid phase advancement
   - Consistent AME Controls branding and design patterns
   - Responsive design for various screen sizes

## 🎯 SESSION 3 OBJECTIVES

### PRIMARY GOAL: Complete Phase 3 Service Activities

**File to Create**: `src/components/pm-workflow/phases/Phase3ServiceActivities.tsx`

### CORE REQUIREMENTS

1. **Service Tier Task Mapping**
   - Integrate data from `docs/SOP_Library_v22.csv` and `docs/Task_Library_v22.csv`
   - Dynamic task loading based on customer service tier:
     - **CORE**: SOPs C001-C008 (8 essential tasks)
     - **ASSURE**: +SOPs A001-A007 (additional analysis tasks)  
     - **GUARDIAN**: +SOPs G001-G006 (advanced optimization tasks)

2. **SOP Integration System**
   - Expandable task cards with SOP quick reference
   - "View Full SOP" functionality with detailed procedures
   - Task completion tracking with time estimates
   - Progress calculation for phase advancement

3. **Issues & Recommendations Capture**
   - Issue documentation with severity levels (Critical/High/Medium/Low)
   - Photo evidence attachment capability
   - Recommendation tracking with categories and priorities
   - Link issues to specific tasks or system components

4. **Task Execution Interface**
   - Checkbox completion with timestamp tracking
   - Notes and findings capture per task
   - Before/after photo documentation
   - Data collection fields for report generation

## 📁 KEY FILES TO REFERENCE

### 🔧 EXISTING ARCHITECTURE (DO NOT MODIFY)
```
src/components/pm-workflow/PMWorkflowGuide.tsx     # Main orchestrator - WORKING
src/components/pm-workflow/shared/index.ts        # Shared components - WORKING  
src/types/pmWorkflow/index.ts                     # Complete types - WORKING
src/pages/PMGuidance.tsx                          # Updated route - WORKING
```

### 📊 DATA SOURCES FOR INTEGRATION
```
docs/SOP_Library_v22.csv        # Complete SOP definitions with steps, tools, links
docs/Task_Library_v22.csv       # Task definitions with service tiers, duration, prerequisites
```

### 🎨 DESIGN PATTERNS TO FOLLOW
```
src/components/pm-workflow/phases/Phase1SiteIntelligence.tsx    # UI patterns reference
src/components/pm-workflow/phases/Phase2SystemDiscovery.tsx     # Component structure reference
```

## 🔧 TECHNICAL IMPLEMENTATION GUIDE

### 1. Component Structure Pattern
```typescript
interface Phase3ServiceActivitiesProps {
  customer: Customer;
  data: ServiceActivitiesData; // From pmWorkflow types
  onDataUpdate: (data: Partial<ServiceActivitiesData>) => void;
  onPhaseComplete: () => void;
}
```

### 2. Service Tier Task Loading
```typescript
// Use existing customer.service_tier to filter tasks
const getTasksForTier = (tier: 'CORE' | 'ASSURE' | 'GUARDIAN') => {
  // Load from SOP_Library_v22.csv based on Service_Tiers column
  // Return filtered task list with SOP references
};
```

### 3. Tab Structure (Follow Phase 1 & 2 patterns)
```
- Customer Priorities (gather reported issues, concerns)
- Service Tasks (tier-specific task execution)  
- Issues Found (document problems with photos)
- Recommendations (improvement opportunities)
```

### 4. Progress Calculation
```typescript
const calculateProgress = (): number => {
  // Based on completed tasks vs total tasks for service tier
  // Should integrate with existing PhaseHeader component
};
```

## 🎨 UI/UX REQUIREMENTS

### Design Consistency
- **Use existing shared components**: `PhaseHeader`, `SectionCard`, `TaskStatusBadge`
- **Follow established patterns**: Tab-based navigation, validation footer
- **Maintain AME Controls branding**: Professional blue/gray color scheme
- **Responsive design**: Works on laptop/tablet viewports

### Task Card Design
```
[✓] Task Name                    [SOP-C001] [⏱️ 15min]
    Quick description            [🔍 View SOP] [📸 Photos]
    Progress: ████████░░ 80%     [📝 Notes] [✅ Complete]
```

### SOP Integration
- Expandable quick reference within task cards
- Modal/panel for full SOP details with step-by-step procedures
- Link to external documentation if available
- Tool requirements and safety notes display

## 📊 DATA INTEGRATION SPECIFICS

### SOP_Library_v22.csv Structure
```
SOP_ID, Title, System_Family, Service_Tiers, Estimated_Duration_min, 
Goal, Step_List_CORE, Step_List_ASSURE, Step_List_GUARDIAN,
Tools, Safety, Hyperlinks
```

### Task_Library_v22.csv Structure  
```
Task_ID, Task_Name, Service_Tiers, Estimated_Duration_min,
SOP_Refs, Prerequisites, Tools_Required, Safety_Tags
```

### Integration Approach
1. **CSV Parsing**: Use Papa Parse (already available) to load SOP/Task data
2. **Data Processing**: Filter by service tier and create task objects
3. **State Management**: Use existing PMWorkflowData.serviceActivities structure
4. **Progress Tracking**: Calculate completion percentage for phase advancement

## 🧪 TESTING REQUIREMENTS

### Development Testing
```bash
# Start development server
cd C:\Users\tech\Projects\ame-site-sync-local
npm run dev

# Navigate to test route (server runs on port 8083)
http://localhost:8083/pm-guidance/{customer-id}

# Test Flow:
1. Complete Phase 1 (Site Intelligence) - Should work perfectly
2. Complete Phase 2 (System Discovery) - Should work perfectly  
3. Advance to Phase 3 (Service Activities) - YOUR IMPLEMENTATION
4. Test service tier task loading
5. Test SOP integration and task completion
6. Verify phase completion and advancement to Phase 4
```

### Validation Requirements
- All required tasks must be completed before phase advancement
- Issues should have severity levels and descriptions
- Recommendations should be categorized and prioritized
- Progress calculation should be accurate

## 🎯 SUCCESS CRITERIA

### Functional Requirements
- [ ] Service tier tasks load correctly (CORE/ASSURE/GUARDIAN)
- [ ] SOP quick reference displays properly
- [ ] Task completion tracking works with timestamps
- [ ] Issues can be documented with photos and severity
- [ ] Recommendations can be categorized and prioritized
- [ ] Progress calculation enables phase advancement
- [ ] Integration with existing Phase 1 & 2 workflow

### Technical Requirements
- [ ] TypeScript compilation without errors
- [ ] Follows existing component architecture patterns
- [ ] Uses shared components for consistency
- [ ] Proper data validation and error handling
- [ ] Responsive design matches existing phases

## 📋 IMMEDIATE NEXT STEPS

1. **Start Development**
   ```bash
   cd C:\Users\tech\Projects\ame-site-sync-local
   npm run dev
   ```

2. **Create Phase 3 Component**
   - File: `src/components/pm-workflow/phases/Phase3ServiceActivities.tsx`
   - Follow Phase 1 & 2 structural patterns
   - Integrate SOP_Library_v22.csv data

3. **Update Main Component**
   - Add Phase 3 import to `src/components/pm-workflow/PMWorkflowGuide.tsx`
   - Replace placeholder Phase 3 content with new component

4. **Test Integration**
   - Verify navigation from Phase 2 → Phase 3
   - Test service tier task filtering
   - Validate SOP integration

## 📞 SESSION TRACKING

**Update Progress**: Modify `PM_REFACTOR_SESSION_TRACKING.json` to reflect Phase 3 completion
**Document Changes**: Update session tracking with files created/modified
**Prepare Handoff**: Note any blockers or areas for Phase 4 focus

---

**Current Status**: Ready for Phase 3 Service Activities implementation
**Architecture**: Solid foundation with working Phase 1 & 2
**Data Sources**: SOP and Task libraries available for integration
**Design Patterns**: Established and consistent across existing phases

🚀 **Begin Phase 3 implementation following the established patterns and integrating SOP data for systematic service task execution!**