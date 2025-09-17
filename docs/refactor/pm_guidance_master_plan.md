# PM Guidance Tool - Master Development Plan

## 🎯 Project Vision Summary

**Core Concept**: Create a systematic PM workflow guide that teaches technicians professional service delivery through a blank checklist approach, automatically generating rich PDF reports.

**User Journey**: Tech opens app → Follows 4-phase systematic process → Professional documentation builds automatically → Exports rich 8.5×11 PDF report

## 📋 4-Phase Workflow Architecture

### Phase 1: Site Intelligence & Setup (25%)
**Goal**: "What do I need to know about this site?"
- Core job & site information (customer, address, service tier)
- Critical contacts & access procedures
- Project handoff documentation status
- Safety/PPE requirements

### Phase 2: System Discovery & Inventory (50%) 
**Goal**: "What systems am I working with?"
- BMS/BAS system overview (platform, version, credentials location)
- Tridium Workbench export processing (ResourceExport.csv, BACnetExport.csv)
- System photography and documentation
- Manual inventory backup if exports unavailable

### Phase 3: Service Activities (75%)
**Goal**: "What work should I perform?"
- Customer priority assessment
- Service tier-specific PM tasks (CORE/ASSURE/GUARDIAN)
- SOP-guided task execution with quick reference
- Issues found and corrective actions
- Improvement opportunities identification

### Phase 4: Documentation & Reporting (100%)
**Goal**: "How do I document the value delivered?"
- Service summary with metrics
- Professional PDF report generation
- Rich visual formatting with charts and tables
- Customer delivery and signature capture

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Tailwind CSS** + **shadcn/ui** components
- **React Query** for state management
- **Recharts** for data visualization
- **jsPDF** or **react-pdf** for report generation

### Backend Integration
- **Supabase PostgreSQL** (existing database)
- **Existing services**: `ameService.ts`, `activityService.ts`
- **File processing**: Papa Parse for CSV, custom parsers

### Data Processing Pipeline
```
Tridium Exports → Parser → Data Visualization → PDF Report
     ↓              ↓            ↓               ↓
ResourceExport → Performance → Charts/Tables → Professional
BACnetExport  → Device List → Status Summary → 8.5×11 Format
N2Export      → Legacy Info → Issue Tracking → Rich Visuals
```

## 📊 Professional PDF Report Specifications

### Report Structure (8.5×11 Format)
1. **Executive Summary** (1 page)
   - Service overview with key metrics
   - System health dashboard
   - Critical findings highlight

2. **System Overview** (1-2 pages)
   - Platform details and architecture
   - Device inventory tables
   - Performance metrics with charts

3. **Work Performed** (1-2 pages)
   - Task checklist with completion status
   - Issues found and resolved
   - Before/after comparisons

4. **Recommendations** (1 page)
   - Improvement opportunities
   - Upgrade suggestions
   - Maintenance schedule updates

### Visual Design Requirements
- **Professional branding** with AME Controls styling
- **Rich data tables** with alternating row colors, borders
- **Performance charts** (gauges, bar charts, trend lines)
- **Status indicators** (green/yellow/red for system health)
- **Photo integration** for equipment and issues
- **Proper margins** and typography for printing

## 🗂️ Development Session Breakdown

### Session 1: Core Framework Setup
**Duration**: 2-3 hours
**Deliverables**: 
- `PMWorkflowGuide.tsx` main component
- 4-phase navigation system
- Basic data flow structure
- Progress tracking UI

### Session 2: Phase 1 & 2 Implementation
**Duration**: 3-4 hours  
**Deliverables**:
- Site intelligence form with smart validation
- System discovery interface
- Tridium export upload/parsing
- Customer search integration

### Session 3: Phase 3 Service Activities
**Duration**: 4-5 hours
**Deliverables**:
- Service tier task mapping (CORE/ASSURE/GUARDIAN)
- SOP integration with expandable quick reference
- Task completion tracking
- Issues and recommendations capture

### Session 4: PDF Report Engine
**Duration**: 4-6 hours
**Deliverables**:
- Professional PDF generation with charts
- Rich table formatting and layouts
- Multiple report templates
- Export and delivery controls

### Session 5: Integration & Polish
**Duration**: 2-3 hours
**Deliverables**:
- Database integration with existing backend
- Performance optimization
- Error handling and validation
- Final UI/UX polish

## 📁 File Structure Plan

```
src/
├── components/
│   ├── pm-workflow/
│   │   ├── PMWorkflowGuide.tsx           # Main orchestrator
│   │   ├── phases/
│   │   │   ├── Phase1SiteIntelligence.tsx
│   │   │   ├── Phase2SystemDiscovery.tsx
│   │   │   ├── Phase3ServiceActivities.tsx
│   │   │   └── Phase4Documentation.tsx
│   │   ├── shared/
│   │   │   ├── PhaseNavigation.tsx
│   │   │   ├── ProgressTracker.tsx
│   │   │   └── SOPQuickReference.tsx
│   │   └── report/
│   │       ├── ReportPreview.tsx
│   │       ├── PDFGenerator.tsx
│   │       └── ReportTemplates.tsx
│   └── data-processing/
│       ├── TridiumExportProcessor.tsx
│       ├── DeviceInventoryTable.tsx
│       └── PerformanceCharts.tsx
├── services/
│   ├── pmWorkflowService.ts             # New service for PM data
│   ├── tridiumExportService.ts          # CSV/file processing
│   └── reportGenerationService.ts       # PDF creation
└── types/
    ├── pmWorkflow.types.ts              # Workflow data structures
    └── tridiumExport.types.ts           # Export data types
```

## 🔧 Key Technical Challenges & Solutions

### Challenge 1: Rich PDF Generation
**Solution**: Use react-pdf with custom components for:
- Professional table layouts with proper spacing
- Chart integration using recharts → SVG → PDF
- Multi-column layouts for device inventories
- Conditional section rendering based on service tier

### Challenge 2: Tridium Export Processing
**Solution**: Create robust parsers for:
- CSV files with varying structures
- Text file platform details extraction
- Error handling for malformed exports
- Real-time preview as files are processed

### Challenge 3: Service Tier Adaptation
**Solution**: Dynamic task loading based on:
- Customer service tier from database
- SOP mapping from existing CSV data
- Progressive enhancement (CORE → ASSURE → GUARDIAN)
- Conditional UI rendering for advanced features

### Challenge 4: Professional Visuals
**Solution**: Design system with:
- AME Controls brand guidelines
- Consistent color palette and typography
- Chart templates for common metrics
- Print-optimized layouts and margins

## 📝 Data Flow Specifications

### Workflow Data Structure
```typescript
interface PMWorkflowData {
  session: {
    id: string;
    startTime: Date;
    technician: string;
    phase: 1 | 2 | 3 | 4;
    completionPercentage: number;
  };
  
  siteIntelligence: {
    customer: CustomerInfo;
    contacts: ContactInfo[];
    access: AccessInfo;
    handoffDocs: ProjectHandoffInfo;
  };
  
  systemDiscovery: {
    bmsOverview: BMSSystemInfo;
    exports: TridiumExportData;
    manualInventory: ManualInventoryData;
    photos: PhotoData[];
  };
  
  serviceActivities: {
    customerPriorities: CustomerPriorityInfo;
    tasks: TaskExecutionData[];
    issues: IssueData[];
    recommendations: RecommendationData[];
  };
  
  documentation: {
    summary: ServiceSummaryData;
    reportConfig: ReportConfigData;
    deliveryInfo: DeliveryInfo;
  };
}
```

### PDF Report Data Mapping
```typescript
interface ReportData {
  header: {
    customerName: string;
    siteAddress: string;
    serviceDate: Date;
    technician: string;
    serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  };
  
  executive: {
    systemHealthScore: number;
    tasksCompleted: number;
    issuesResolved: number;
    timeOnSite: number;
  };
  
  system: {
    platform: string;
    deviceCount: number;
    performanceMetrics: PerformanceData;
    deviceInventory: DeviceData[];
  };
  
  work: {
    completedTasks: TaskData[];
    resolvedIssues: IssueData[];
    recommendations: RecommendationData[];
  };
  
  visuals: {
    charts: ChartData[];
    photos: PhotoData[];
    diagrams: DiagramData[];
  };
}
```

## 🎨 UI/UX Design Principles

### Progressive Disclosure
- Start with essential information
- Expand complexity based on service tier
- Hide advanced features until needed
- Clear visual hierarchy and grouping

### Professional Aesthetics
- Clean, technical appearance
- Consistent spacing and typography
- Professional color scheme (blue/gray/white)
- Print-friendly layouts and contrast

### Efficiency Focus
- Smart defaults and auto-completion
- Bulk actions for repetitive tasks
- Keyboard shortcuts for power users
- Quick save and resume functionality

## 📋 Quality Assurance Checklist

### Functionality Testing
- [ ] All 4 phases navigate correctly
- [ ] Data persists between phases
- [ ] Tridium exports process without errors
- [ ] PDF generation works for all service tiers
- [ ] Customer search integration functions
- [ ] Task completion tracking accurate

### Performance Testing  
- [ ] Large export files process in <30 seconds
- [ ] PDF generation completes in <10 seconds
- [ ] UI remains responsive during processing
- [ ] Memory usage stays within bounds
- [ ] No memory leaks in long sessions

### Visual Quality Testing
- [ ] PDF reports print correctly on 8.5×11 paper
- [ ] Charts and tables format properly
- [ ] Professional branding consistent
- [ ] Mobile/tablet layout acceptable
- [ ] High DPI displays render correctly

### Data Integrity Testing
- [ ] No data loss between phases
- [ ] Export parsing handles edge cases
- [ ] Required fields properly validated
- [ ] Error messages clear and helpful
- [ ] Backup/recovery mechanisms work

## 🚀 Deployment Strategy

### Development Environment
- Local development with existing project structure
- Hot reload for rapid iteration
- Mock data for testing without real exports
- Isolated component development with Storybook

### Testing Environment  
- Real Tridium export data testing
- PDF generation with various configurations
- Cross-browser compatibility testing
- Performance benchmarking with large datasets

### Production Deployment
- Integration with existing authentication system
- Database migration for new PM workflow tables
- File storage configuration for exports and reports
- Monitoring and error tracking setup

## 📞 Next Steps & Continuation Strategy

This plan is designed for multi-session development. Each session should:

1. **Start with context**: Reference this master plan and previous session deliverables
2. **Focus on one phase**: Complete a full workflow phase before moving on
3. **Test incrementally**: Ensure each component works before building the next
4. **Document progress**: Update this plan with any architectural changes
5. **Prepare for handoff**: Clear notes for next session's starting point

### Session Handoff Template
```
Session [X] Completed:
✅ Deliverables: [List what was built]
✅ Testing: [What was verified to work]
✅ Known Issues: [Any bugs or limitations]
🎯 Next Session: [Specific starting point and goals]
📁 Files Modified: [List of changed files]
🔧 Dependencies Added: [Any new packages or tools]
```

---

**This master plan serves as the single source of truth for the PM Guidance Tool development. Reference it at the start of each session and update it as the project evolves.**