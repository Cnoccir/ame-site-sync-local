# PM Guidance Tool - Development Session Prompts

## 🎯 Master Context Prompt
**Use this to start ANY new conversation about this project:**

---

**PM GUIDANCE TOOL DEVELOPMENT - CONTINUATION SESSION**

I'm developing a React/TypeScript PM (Preventive Maintenance) Guidance Tool for HVAC technicians. This is a systematic 4-phase workflow application that generates professional PDF reports.

**Project Location**: `C:\Users\tech\Projects\ame-site-sync-local`

**Core Vision**: Replace customer-centric approach with a "blank systematic checklist" that teaches technicians what to do on every PM visit while automatically building professional documentation.

**4-Phase Workflow**:
1. **Site Intelligence** (25%) - Customer info, contacts, access, safety
2. **System Discovery** (50%) - BMS overview, Tridium exports, device inventory  
3. **Service Activities** (75%) - Service tier tasks, SOPs, issues/recommendations
4. **Documentation** (100%) - Professional PDF report generation

**Key Technical Requirements**:
- Single-page application with phase navigation
- Service tier adaptation (CORE/ASSURE/GUARDIAN) based on existing SOP_Library_v22.csv
- Tridium Workbench export processing (CSV files → charts/tables)
- Rich PDF generation (8.5×11 format with professional visuals)
- Integration with existing Supabase backend

**Previous Development Status**: [UPDATE THIS EACH SESSION]

**Current Session Goal**: [SPECIFY THE SPECIFIC PHASE/COMPONENT TO BUILD]

Please analyze the uploaded files and continue development according to the master plan.

---

## 📋 Session-Specific Prompts

### SESSION 1: Core Framework Setup
**Prompt for Session 1:**

```
SESSION 1 GOAL: Build the core PMWorkflowGuide component framework

DELIVERABLES NEEDED:
1. PMWorkflowGuide.tsx - Main orchestrator component
2. Phase navigation system with progress tracking
3. Basic data flow structure using React state
4. UI layout with left panel (workflow) and right panel (data/preview)

SPECIFIC TASKS:
- Create single-page layout matching the 3-panel design from master plan
- Implement phase navigation (1→2→3→4) with visual progress indicator
- Set up TypeScript interfaces for PMWorkflowData structure
- Create basic routing integration with existing app structure
- Build responsive layout that works on laptop screens

TECHNICAL REQUIREMENTS:
- Use existing shadcn/ui components and Tailwind CSS
- Integrate with current authentication system
- Set up proper TypeScript typing throughout
- Create reusable components for phase transitions
- Implement auto-save functionality for workflow progress

ACCEPTANCE CRITERIA:
✅ User can navigate between all 4 phases
✅ Progress indicator shows current completion %
✅ Data persists when switching phases
✅ Layout is responsive and professional
✅ Integrates with existing app navigation
```

### SESSION 2: Phase 1 & 2 Implementation
**Prompt for Session 2:**

```
SESSION 2 GOAL: Complete Phase 1 (Site Intelligence) and Phase 2 (System Discovery)

DELIVERABLES NEEDED:
1. Phase1SiteIntelligence.tsx - Complete customer/site data collection
2. Phase2SystemDiscovery.tsx - BMS overview and Tridium export processing  
3. Customer search integration for quick-fill functionality
4. File upload system for Tridium exports
5. Basic CSV parsing for ResourceExport and BACnetExport files

PHASE 1 REQUIREMENTS:
- Customer information form with smart validation
- Contact management with multiple contacts support
- Access procedures and safety requirements capture
- Project handoff documentation checklist
- Integration with existing customer database for search/auto-fill

PHASE 2 REQUIREMENTS:  
- BMS/BAS system overview form
- Drag-and-drop file upload for Tridium exports
- CSV parsing for ResourceExport.csv → system performance metrics
- CSV parsing for BACnetExport.csv → device inventory
- Manual inventory backup if exports unavailable
- Photo upload system for equipment documentation

TECHNICAL IMPLEMENTATION:
- Use Papa Parse for CSV processing
- File validation and error handling
- Real-time preview of parsed data
- Progress indicators during file processing
- Image compression and storage for photos

ACCEPTANCE CRITERIA:
✅ Phase 1 collects all required site information
✅ Customer search works with existing database
✅ File uploads process successfully
✅ CSV data displays in tables
✅ Manual entry works as fallback
✅ Photos can be captured and stored
```

### SESSION 3: Phase 3 Service Activities  
**Prompt for Session 3:**

```
SESSION 3 GOAL: Complete Phase 3 Service Activities with SOP integration

DELIVERABLES NEEDED:
1. Phase3ServiceActivities.tsx - Service tier task management
2. SOPQuickReference.tsx - Expandable SOP display component
3. Service tier task mapping from SOP_Library_v22.csv
4. Task completion tracking with time estimates
5. Issues and recommendations capture system

SERVICE TIER TASK MAPPING:
- CORE: SOPs C001-C008 (8 essential tasks)
- ASSURE: +SOPs A001-A007 (additional analysis tasks)  
- GUARDIAN: +SOPs G001-G006 (advanced optimization tasks)

SOP INTEGRATION REQUIREMENTS:
- Read SOP_Library_v22.csv data into component
- Display task cards with expandable SOP quick reference
- Show estimated duration and prerequisite information
- Link to full SOP documentation when available
- Track task completion status and actual time spent

ISSUES/RECOMMENDATIONS SYSTEM:
- Capture issues found during service activities
- Photo evidence attachment for issues
- Recommended actions and priority levels
- Improvement opportunities identification
- Link issues to specific tasks or system components

TECHNICAL IMPLEMENTATION:
- Dynamic task loading based on customer service tier
- CSV data integration for SOP definitions
- State management for task completion
- Photo capture and attachment system
- Time tracking functionality

ACCEPTANCE CRITERIA:
✅ Tasks load correctly based on service tier
✅ SOP quick reference displays properly  
✅ Task completion can be tracked
✅ Issues can be documented with photos
✅ Recommendations can be categorized
✅ Progress updates in real-time
```

### SESSION 4: PDF Report Engine
**Prompt for Session 4:**

```
SESSION 4 GOAL: Build professional PDF report generation system

DELIVERABLES NEEDED:
1. PDFGenerator.tsx - Core PDF creation component
2. ReportTemplates.tsx - Multiple report format options
3. Professional visual design with charts and tables
4. 8.5×11 formatting with proper margins and typography
5. Data visualization components for system metrics

PDF REPORT STRUCTURE:
1. Executive Summary (1 page) - Key metrics and system health
2. System Overview (1-2 pages) - Platform details, device inventory
3. Work Performed (1-2 pages) - Tasks completed, issues resolved  
4. Recommendations (1 page) - Improvements and upgrade suggestions

VISUAL REQUIREMENTS:
- Professional AME Controls branding
- Rich data tables with alternating rows and borders
- Performance charts (gauges for CPU/memory, bar charts for devices)
- Status indicators (green/yellow/red for system health)
- Photo integration for equipment and issues
- Consistent typography and spacing throughout

TECHNICAL IMPLEMENTATION:
- Use react-pdf or jsPDF for PDF generation
- Recharts integration for data visualization  
- Custom table components with professional styling
- Image processing and compression for photos
- Multiple export options (PDF, email, print)

DATA INTEGRATION:
- Pull data from all 4 workflow phases
- Transform Tridium export data into charts
- Calculate system health metrics
- Format task completion summaries
- Include photo evidence in appropriate sections

ACCEPTANCE CRITERIA:
✅ Professional PDF generates without errors
✅ All charts and tables format correctly
✅ 8.5×11 layout prints properly
✅ Photos appear in appropriate sections
✅ Multiple report templates available
✅ Export controls work (save, email, print)
```

### SESSION 5: Integration & Polish
**Prompt for Session 5:**

```
SESSION 5 GOAL: Complete integration with existing backend and final polish

DELIVERABLES NEEDED:
1. Database integration with existing Supabase schema
2. Performance optimization and error handling
3. Final UI/UX polish and professional styling
4. Testing with real data and edge cases
5. Documentation and deployment preparation

DATABASE INTEGRATION:
- Create PM workflow tables in existing Supabase schema
- Link with existing customer and visit management
- Set up proper relationships and foreign keys
- Implement data persistence across sessions
- Add audit trail for workflow completions

PERFORMANCE OPTIMIZATION:
- Optimize file processing for large Tridium exports
- Implement lazy loading for heavy components
- Add proper loading states and error boundaries
- Optimize PDF generation speed
- Memory management for long sessions

UI/UX POLISH:
- Consistent styling across all phases
- Professional color scheme and typography
- Improved responsive design
- Better error messages and validation
- Keyboard shortcuts and accessibility improvements

TESTING & VALIDATION:
- Test with real Tridium export files
- Validate PDF generation across different browsers
- Performance testing with large datasets
- Error handling for malformed uploads
- Cross-device compatibility testing

DEPLOYMENT PREPARATION:
- Environment configuration setup
- Build optimization and bundle analysis
- Security review for file uploads
- Documentation for maintenance and updates
- User training materials

ACCEPTANCE CRITERIA:
✅ All data persists correctly in database
✅ Performance meets specified benchmarks
✅ Professional appearance matches requirements
✅ Error handling works for all edge cases  
✅ Ready for production deployment
✅ Documentation complete for handoff
```

## 🔧 Technical Context Files to Upload

**Always upload these files when starting a new session:**

1. **Master Plan** - The artifact created above with full architecture
2. **Existing codebase structure** - Screenshots or file listings of current project
3. **SOP_Library_v22.csv** - For task/SOP integration
4. **Example Tridium exports** - For data processing development
5. **Current database schema** - If working on backend integration

## 📝 Session Handoff Template

**Use this format to document what was completed:**

```
SESSION [X] COMPLETED - [Date]

DELIVERABLES COMPLETED:
✅ [Specific components built]
✅ [Features implemented]
✅ [Tests passed]

FILES CREATED/MODIFIED:
- src/components/pm-workflow/[ComponentName].tsx
- src/services/[ServiceName].ts
- src/types/[TypesName].ts

CURRENT STATUS:
- Phase [X] complete / in progress / not started
- Database integration: complete / partial / pending
- PDF generation: complete / partial / pending

KNOWN ISSUES:
- [Any bugs or limitations found]
- [Performance concerns]
- [Missing dependencies]

NEXT SESSION PRIORITIES:
1. [Highest priority item]
2. [Second priority]
3. [Third priority]

TESTING NOTES:
- [What was tested and verified]
- [Test data used]
- [Browser/device compatibility notes]
```

## 🎯 Quick Start Commands

**For immediate development start:**

1. **Navigate to project**: `cd C:\Users\tech\Projects\ame-site-sync-local`
2. **Start dev server**: `npm run dev`
3. **Open in editor**: Code . (or your preferred editor)
4. **Check current routing**: Look at existing routes in App.tsx
5. **Create new PM route**: Add `/pm-workflow` to routing system

## ⚡ Emergency Recovery Prompts

**If context is lost mid-session:**

"I'm continuing development of the PM Guidance Tool. The previous session was working on [SPECIFIC COMPONENT]. Here's what was completed: [LIST]. I need to continue with [NEXT STEP]. Please analyze the current codebase and continue where we left off."

**If starting completely fresh:**

"I need to start development of the PM Guidance Tool from the beginning. Please read the master plan artifact and begin with Session 1 tasks. This is a React/TypeScript project located at `C:\Users\tech\Projects\ame-site-sync-local`."

---

**These prompts are designed to maintain continuity across multiple development sessions and context windows. Always start with the Master Context Prompt and then use the specific session prompt for your current focus area.**