# PM Guidance Tool - Project Continuation Guide

## 🎯 Quick Start Checklist

**Before Starting ANY Development Session:**

1. ✅ **Upload Master Documents** to new conversation:
   - Master Development Plan (artifact from this conversation)
   - Development Session Prompts (artifact from this conversation)  
   - Visual Design Specifications (artifact from this conversation)
   - This Project Continuation Guide

2. ✅ **Use Master Context Prompt**:
   ```
   "I'm continuing development of the PM Guidance Tool from the Master Development Plan. 
   Current status: [SESSION X] - [CURRENT COMPONENT]. 
   Please analyze the uploaded plans and continue development."
   ```

3. ✅ **Specify Current Session Goal**:
   - Session 1: Core framework and phase navigation
   - Session 2: Phase 1 & 2 implementation  
   - Session 3: Phase 3 service activities with SOPs
   - Session 4: PDF report engine
   - Session 5: Integration and polish

## 📊 Project Status Tracker

### Development Progress Matrix

| Phase | Component | Status | Files Created | Session | Notes |
|-------|-----------|--------|---------------|---------|--------|
| **Framework** | PMWorkflowGuide.tsx | ⏳ Pending | - | Session 1 | Main orchestrator component |
| | Phase Navigation | ⏳ Pending | - | Session 1 | Progress tracker, phase switching |
| | Data Structure | ⏳ Pending | - | Session 1 | TypeScript interfaces |
| **Phase 1** | Site Intelligence | ⏳ Pending | - | Session 2 | Customer info, contacts, access |
| | Customer Search | ⏳ Pending | - | Session 2 | Quick-fill integration |
| **Phase 2** | System Discovery | ⏳ Pending | - | Session 2 | BMS overview, file uploads |
| | Tridium Processing | ⏳ Pending | - | Session 2 | CSV parsing, data visualization |
| **Phase 3** | Service Activities | ⏳ Pending | - | Session 3 | Task management, SOP integration |
| | SOP Quick Reference | ⏳ Pending | - | Session 3 | Expandable task cards |
| **Phase 4** | PDF Generator | ⏳ Pending | - | Session 4 | Professional report creation |
| | Report Templates | ⏳ Pending | - | Session 4 | Multiple format options |
| **Integration** | Database Layer | ⏳ Pending | - | Session 5 | Supabase integration |
| | Performance Optimization | ⏳ Pending | - | Session 5 | Speed, memory, error handling |

### Status Legend
- ⏳ **Pending** - Not started
- 🟡 **In Progress** - Currently being developed
- ✅ **Complete** - Finished and tested
- ❌ **Blocked** - Issue preventing progress
- 🔄 **Needs Revision** - Completed but needs changes

### Current Session: **NOT STARTED**
**Next Priority**: Session 1 - Core Framework Setup

## 🗂️ File Organization Strategy

### Project Structure (Target)
```
src/
├── components/
│   ├── pm-workflow/                    # New PM workflow components
│   │   ├── PMWorkflowGuide.tsx         # Session 1 - Main component
│   │   ├── phases/                     # Session 2-3 - Phase components
│   │   │   ├── Phase1SiteIntelligence.tsx
│   │   │   ├── Phase2SystemDiscovery.tsx
│   │   │   ├── Phase3ServiceActivities.tsx
│   │   │   └── Phase4Documentation.tsx
│   │   ├── shared/                     # Session 1 - Shared components
│   │   │   ├── PhaseNavigation.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   └── SOPQuickReference.tsx   # Session 3
│   │   └── report/                     # Session 4 - PDF generation
│   │       ├── ReportPreview.tsx
│   │       ├── PDFGenerator.tsx
│   │       └── ReportTemplates.tsx
│   ├── data-processing/                # Session 2 - Tridium integration
│   │   ├── TridiumExportProcessor.tsx
│   │   ├── DeviceInventoryTable.tsx
│   │   └── PerformanceCharts.tsx
│   └── ui/                            # Existing shadcn/ui components
│       └── [existing components]
├── services/
│   ├── pmWorkflowService.ts           # Session 5 - New service
│   ├── tridiumExportService.ts        # Session 2 - File processing
│   ├── reportGenerationService.ts     # Session 4 - PDF creation
│   └── [existing services]
├── types/
│   ├── pmWorkflow.types.ts           # Session 1 - Workflow data
│   ├── tridiumExport.types.ts        # Session 2 - Export data
│   └── [existing types]
└── pages/
    ├── PMWorkflow.tsx                # Session 1 - New route
    └── [existing pages]
```

### Naming Conventions
- **Components**: PascalCase with descriptive names
- **Files**: camelCase with type suffix (.types.ts, .service.ts)
- **Folders**: kebab-case for multi-word names
- **CSS Classes**: BEM methodology or Tailwind utilities

## 🔄 Session Handoff Protocol

### At End of Each Session
**Developer MUST document:**

```markdown
## SESSION [X] HANDOFF - [DATE]

### COMPLETED THIS SESSION
✅ [Specific files created/modified]
✅ [Features implemented and tested]  
✅ [Database changes made]

### CURRENT PROJECT STATUS
- Framework: [Complete/Partial/Pending]
- Phase 1-2: [Complete/Partial/Pending]  
- Phase 3: [Complete/Partial/Pending]
- Phase 4: [Complete/Partial/Pending]
- Integration: [Complete/Partial/Pending]

### FILES MODIFIED
```
src/components/pm-workflow/[files]
src/services/[files]  
src/types/[files]
```

### IMMEDIATE NEXT STEPS
1. [Highest priority for next session]
2. [Second priority]
3. [Third priority]

### KNOWN ISSUES/BLOCKERS
- [Any bugs found]
- [Missing dependencies]
- [Performance concerns]

### TESTING COMPLETED
- [What was verified to work]
- [Test cases run]
- [Browser compatibility checked]

### CODE QUALITY NOTES
- [TypeScript errors resolved: Y/N]
- [Linting issues resolved: Y/N]  
- [Performance benchmarks met: Y/N]
```

### At Start of Each Session
**Developer MUST:**

1. **Review previous handoff** - Understand exactly what was completed
2. **Verify current codebase** - Ensure all previous changes are present
3. **Test existing functionality** - Make sure nothing is broken
4. **Plan session scope** - Define specific deliverables for this session
5. **Set up development environment** - Ensure all tools are working

## 📋 Development Standards & Quality Gates

### Code Quality Requirements
- **TypeScript**: 100% typed, no `any` types without justification
- **Linting**: ESLint errors must be resolved before commit
- **Formatting**: Prettier formatting enforced
- **Performance**: Components must render in <100ms
- **Accessibility**: All interactive elements must be keyboard accessible

### Testing Requirements
- **Unit Tests**: Critical business logic must be tested
- **Integration Tests**: API calls and data processing must be tested
- **Manual Testing**: Each feature must be manually verified
- **Cross-Browser**: Test in Chrome, Firefox, Safari, Edge
- **Mobile**: Test responsive design on tablet/mobile viewports

### Documentation Requirements
- **Code Comments**: Complex logic must be documented
- **Component Documentation**: Props and usage examples required
- **API Documentation**: All service functions must be documented
- **User Documentation**: End-user features must have usage notes

## 🚨 Common Pitfalls & Solutions

### Problem: Context Window Limitations
**Solution**: Break complex components into smaller, focused pieces. Each session should complete a full functional unit.

### Problem: Lost Development Context
**Solution**: Always start sessions by reviewing previous handoff notes and testing existing functionality.

### Problem: Inconsistent Styling
**Solution**: Reference Visual Design Specifications artifact for all styling decisions.

### Problem: Data Structure Changes
**Solution**: Update TypeScript interfaces first, then implement components to match the types.

### Problem: Performance Issues
**Solution**: Implement proper React optimization patterns (memo, useMemo, useCallback) from the start.

## 🎯 Success Metrics & Acceptance Criteria

### Session 1 Success Criteria
✅ User can navigate between all 4 phases
✅ Progress indicator shows correct completion percentage
✅ Data persists when switching between phases
✅ Layout is responsive and professional
✅ TypeScript compilation has no errors

### Session 2 Success Criteria
✅ Phase 1 form validation works correctly
✅ Customer search returns and populates results
✅ Tridium export files upload and parse successfully
✅ Parsed data displays in readable format
✅ Manual entry works as backup option

### Session 3 Success Criteria
✅ Tasks load correctly based on service tier
✅ SOP quick reference expands/collapses properly
✅ Task completion tracking updates progress
✅ Issues can be documented with photo attachments
✅ Recommendations are properly categorized

### Session 4 Success Criteria
✅ PDF generates without errors for all service tiers
✅ Charts and tables format correctly in PDF
✅ 8.5×11 layout prints properly on paper
✅ Professional branding appears consistently
✅ Export controls (save/email/print) function

### Session 5 Success Criteria
✅ Data persists correctly in Supabase database
✅ Performance meets benchmarks (<3sec PDF generation)
✅ Error handling works for all edge cases
✅ Professional appearance matches design specs
✅ Ready for production deployment

## 📞 Emergency Recovery Procedures

### If Development Gets Stuck
1. **Stop and assess** - Don't continue with broken code
2. **Review the Master Plan** - Ensure you're following the architecture
3. **Simplify the scope** - Break down complex features into smaller pieces
4. **Ask for help** - Use specific error messages and code examples
5. **Document the blocker** - Add to handoff notes for next session

### If Previous Work is Lost
1. **Check version control** - Ensure all changes were committed
2. **Review handoff notes** - Understand what was supposed to be completed
3. **Rebuild incrementally** - Start with basic structure, add complexity
4. **Test frequently** - Verify each piece works before moving on
5. **Update status tracker** - Reflect actual current state

### If Requirements Change
1. **Stop current development** - Don't build obsolete features
2. **Update Master Plan** - Revise architecture as needed
3. **Reassess timeline** - Adjust session priorities
4. **Communicate changes** - Document what changed and why
5. **Resume with new direction** - Follow updated specifications

## 🎉 Project Completion Checklist

### Final Delivery Requirements
- [ ] All 4 phases function correctly
- [ ] PDF generation works for all service tiers
- [ ] Professional branding consistent throughout
- [ ] Database integration complete and tested
- [ ] Performance meets all benchmarks
- [ ] Error handling covers edge cases
- [ ] Documentation complete for maintenance
- [ ] Code quality standards met
- [ ] Cross-browser compatibility verified
- [ ] User training materials created

### Deployment Preparation
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] Build process optimized
- [ ] Security review completed
- [ ] Monitoring and logging set up
- [ ] Backup and recovery procedures documented
- [ ] User access permissions configured
- [ ] Launch plan created and approved

---

**This guide ensures continuity across all development sessions and provides clear success criteria for project completion. Update this document as the project evolves to maintain accurate project status.**