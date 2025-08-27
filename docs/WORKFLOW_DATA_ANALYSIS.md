# AME Site-Sync Workflow Data Analysis & Reporting Refactor Plan

## Executive Summary

This document provides a comprehensive analysis of data fields and storage patterns across the 4 main workflow phases in the AME Site-Sync application. The analysis reveals complex data structures currently stored in JSONB fields and normalized tables, presenting opportunities for optimization to support robust reporting capabilities.

## Current Workflow Structure

The application follows a 4-phase visit workflow:

1. **Phase 1: Pre-Visit Preparation**
2. **Phase 2: Initial Assessment** 
3. **Phase 3: Service Execution**
4. **Phase 4: Post-Visit Activities & Reporting**

## Phase 1: Pre-Visit Preparation Data Fields

### Data Structure Analysis
**Location**: `src/components/visit/phases/PreVisitPhase.tsx`

```typescript
// Main state objects
reviewItems: {
  customerInfo: boolean,        // Customer info review completed
  siteAccess: boolean,         // Site access requirements confirmed  
  safetyRequirements: boolean, // Safety requirements reviewed
  toolsChecklist: boolean,     // Tools verified and ready
  documentation: boolean       // Service documentation prepared
}

safetyAcknowledgment: boolean  // Safety protocol acknowledgment

selectedTools: string[]        // Array of selected tool IDs

customer: Customer            // Full customer object with service tier
```

### Current Storage Pattern
- **Primary Storage**: `ame_visit_sessions.auto_save_data.preVisitPhase`
- **Secondary Storage**: `ame_visits.auto_save_data` 
- **Tools Reference**: `ame_tools_normalized` table via tool IDs

### Reporting Implications
- **Completion Metrics**: Track prep checklist completion rates
- **Tool Usage**: Analyze tool selection patterns by service tier
- **Safety Compliance**: Monitor safety acknowledgment rates
- **Time Tracking**: Currently missing - phase timing not captured

## Phase 2: Initial Assessment Data Fields

### Data Structure Analysis
**Location**: `src/components/visit/phases/AssessmentPhase.tsx`

This is the most complex phase with 6 distinct steps:

```typescript
// Step tracking
currentStep: number                    // Active step (1-6)
expandedStep: number                   // UI state for expanded step
stepStatuses: Record<number, Status>   // Status per step (pending/active/completed/skipped)
skippedSteps: number[]                 // Array of skipped step numbers

// Step 1: Customer Check-In
step1Data: {
  contactPerson: string,
  contactNumber: string,
  contactEmail: string,
  communicationPreference: 'call'|'email'|'text',
  onSiteContactVerified: boolean,
  specialRequests: string
}

// Step 2: Safety Assessment
step2Data: {
  ppeAvailable: boolean,
  hazardsReviewed: boolean,
  emergencyProcedures: boolean,
  safetyRequirements: string,
  siteHazards: string,
  notes: string
}

// Step 3: Physical System Walk
step3Data: {
  supervisorLocation: string,
  supervisorAccess: string,
  jaceLocations: string,
  jaceAccess: string,
  controllerDetails: string,
  controllerChallenges: string,
  buildingAccessType: string,
  buildingAccessDetails: string,
  panelsAccessible: boolean,
  wiringCondition: boolean,
  environmentalOk: boolean,
  issuesFound: string
}

// Step 4: System Access Test
step4Data: {
  supervisorIp: string,
  supervisorUsername: string,
  supervisorPassword: string,  // Encrypted storage needed
  supervisorStatus: 'not_tested'|'testing'|'success'|'failed',
  workbenchUsername: string,
  workbenchPassword: string,   // Encrypted storage needed
  workbenchStatus: 'not_tested'|'testing'|'success'|'failed',
  platformUsername: string,
  platformPassword: string,    // Encrypted storage needed
  webSupervisorUrl: string,
  vpnRequired: boolean,
  vpnDetails: string,
  systemVersion: string,
  connectionNotes: string,
  remoteAccessResults: object
}

// Step 5: Network Inventory Analysis
step5Data: {
  uploadedFiles: File[],           // Tridium CSV files
  analysisData: object,            // Parsed network data
  manualStationCount: string,
  manualComponents: string,
  manualProtocols: string,
  analysisMode: 'upload'|'manual',
  tridiumAnalysis: string,
  generatedSummary: string
}

// Step 6: Initial System Status
step6Data: {
  activeAlarms: string,
  criticalAlarms: string,
  cpuUsage: string,
  memoryUsage: string,
  criticalIssues: string
}

// Additional assessment data
priorityData: {
  comfortIssues: string,
  equipmentProblems: string,
  energyConcerns: string,
  operationalRequests: string
}

systemStatusData: {
  activeAlarms: number,
  commHealth: number,
  overridePoints: number,
  performance: number
}
```

### Current Storage Pattern
- **Primary Storage**: `ame_visit_sessions.auto_save_data.assessmentPhase`
- **Step Tracking**: `assessment_steps` table with `step_number`, `status`, `form_data`
- **Network Analysis**: `network_inventory` table for parsed CSV data
- **Device Data**: `device_inventory` table for individual devices
- **Skipped Steps**: `ame_visits.skipped_steps` array field

### Reporting Implications
- **Step Completion Analytics**: Track completion rates per step
- **Assessment Quality**: Identify commonly skipped steps
- **Network Health Trends**: Aggregate device status over time
- **Connection Success Rates**: Track system access test results
- **Performance Baselines**: Historical system performance data

## Phase 3: Service Execution Data Fields

### Data Structure Analysis
**Location**: `src/components/visit/phases/ServiceExecutionPhase.tsx`

```typescript
// Task management
serviceTierTasks: TaskData[]        // Tasks for customer's service tier
visitTasks: VisitTask[]            // Task instances for this visit
sopData: SOPData[]                 // Standard Operating Procedures

// Task execution tracking
taskTimers: Record<string, number>  // Individual task start times
overallTimer: number               // Total phase execution time
timerStartTime: number             // Phase start timestamp
isPaused: boolean                  // Timer pause state

// UI state management
selectedTask: TaskData
expandedTasks: Set<string>         // Currently expanded task IDs
loading: boolean

// Task completion data structure
TaskData: {
  id: string,                      // UUID from ame_tasks_normalized
  task_id: string,                 // Human-readable task ID (C001, A001, etc.)
  task_name: string,
  category_id: UUID,
  duration_minutes: number,        // Estimated duration
  navigation_path: string,         // Instructions/location
  sop_steps: string,              // Step-by-step instructions
  quality_checks: string,         // Quality validation steps
  prerequisites: string,
  skills_required: string,
  phase: number,                  // Workflow phase (1-4)
  task_order: number,             // Sequence within phase
  is_mandatory: boolean
}

// Visit-specific task instances
VisitTask: {
  id: string,                     // UUID
  visit_id: string,              // Foreign key to visit
  task_id: string,               // Foreign key to TaskData.id
  status: 'Pending'|'In Progress'|'Completed'|'Skipped',
  started_at: timestamp,
  completed_at: timestamp,
  time_spent: number,            // Minutes
  issues_found: string,
  resolution: string,
  technician_notes: string
}
```

### Current Storage Pattern
- **Task Library**: `ame_tasks_normalized` table with normalized task data
- **Task Instances**: `ame_visit_tasks` table linking visits to tasks
- **SOPs**: `ame_sops_normalized` table with rich JSONB step data
- **Service Tiers**: Filtered by task_id prefix (C=CORE, A=ASSURE, G=GUARDIAN)
- **Task Progress**: `ame_visit_progress` table for detailed tracking

### Reporting Implications
- **Task Performance**: Average completion times vs estimates
- **Service Tier Analysis**: Compare task completion across tiers
- **Technician Efficiency**: Individual and team performance metrics
- **Common Issues**: Analyze frequently reported problems
- **SOP Effectiveness**: Track successful task completion rates

## Phase 4: Post-Visit Activities & Reporting Data Fields

### Data Structure Analysis
**Location**: `src/components/visit/phases/PostVisitPhase.tsx`

```typescript
// Post-visit checklist
ChecklistItem: {
  id: string,
  title: string,
  required: boolean,
  completed: boolean,
  description?: string
}
checklist: ChecklistItem[]

// Issues tracking
Issue: {
  id: string,
  issue_type: string,              // Category of issue
  severity: 'Critical'|'High'|'Medium'|'Low',
  description: string,
  action_taken: string
}
issues: Issue[]

// Recommendations by category
Recommendations: {
  performance: string,             // Performance optimization suggestions
  maintenance: string,            // Preventive maintenance recommendations  
  upgrade: string                 // System upgrade recommendations
}

// Customer feedback
CustomerFeedback: {
  contact_name: string,
  satisfaction_rating: number,     // 1-5 star rating
  comments: string,
  follow_up_required: boolean,
  follow_up_reason: string
}

// Visit summary data
visitSummary: string              // Overall visit summary
nextVisitNotes: string           // Notes for next service visit

// Calculated visit statistics
visitStats: {
  totalTime: string,              // "2h 45m" format
  tasksCompleted: string,         // "8/10" format
  issuesFound: number
}
```

### Current Storage Pattern
- **Issues**: `visit_issues` table with categorized problem tracking
- **Recommendations**: `visit_recommendations` table by type
- **Feedback**: `customer_feedback` table with satisfaction scores
- **Final Report**: `visit_reports` table with complete visit data
- **Visit Updates**: `ame_visits` table status and completion tracking

### Reporting Implications
- **Customer Satisfaction**: Track ratings and trends over time
- **Issue Categories**: Identify most common problem areas
- **Visit Efficiency**: Analyze completion rates and duration
- **Follow-up Requirements**: Track and schedule necessary returns
- **Recommendation Implementation**: Monitor suggestion adoption

## Current Data Storage Architecture

### Primary Tables
1. **`ame_visits`** - Main visit record with JSONB auto_save_data
2. **`ame_visit_sessions`** - Session management with JSONB auto_save_data  
3. **`ame_customers`** - Customer master data
4. **`ame_tasks_normalized`** - Task library and definitions
5. **`ame_visit_tasks`** - Visit-specific task instances
6. **`ame_sops_normalized`** - Standard operating procedures
7. **`assessment_steps`** - Assessment phase step tracking
8. **`device_inventory`** - Network device catalog per visit
9. **`network_inventory`** - Network analysis results
10. **`visit_issues`** - Problem tracking
11. **`visit_recommendations`** - Improvement suggestions
12. **`customer_feedback`** - Satisfaction and feedback
13. **`visit_reports`** - Final comprehensive reports

### Storage Pattern Analysis

#### JSONB Usage
- **Benefits**: Flexible schema, fast development, complex nested data
- **Drawbacks**: Difficult to query for reporting, no referential integrity, harder to aggregate

#### Normalized Tables
- **Benefits**: ACID compliance, referential integrity, optimized queries
- **Drawbacks**: More complex schema changes, additional tables

### Current Issues for Reporting

1. **Data Fragmentation**: Critical data spread across JSONB and normalized tables
2. **Inconsistent Patterns**: Some data in JSONB, similar data in normalized tables
3. **Query Complexity**: Reporting requires expensive JSONB extractions
4. **Performance**: No optimized indexes for common reporting patterns
5. **Data Integrity**: JSONB fields lack constraints and validation
6. **Historical Analysis**: Difficult to track changes over time

## Recommended Refactor Architecture

### Phase 1: Normalize Critical Reporting Data

#### New Tables Structure

```sql
-- Phase tracking with proper normalization
CREATE TABLE visit_phase_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES ame_visits(id),
    phase_number INTEGER NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',
    time_spent_minutes INTEGER DEFAULT 0,
    auto_save_data JSONB DEFAULT '{}',  -- Keep for non-critical UI state
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment steps with proper tracking
CREATE TABLE visit_assessment_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES ame_visits(id),
    step_number INTEGER NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'pending',
    is_skipped BOOLEAN DEFAULT FALSE,
    validation_data JSONB DEFAULT '{}',  -- Store validation results
    form_data JSONB DEFAULT '{}',       -- Keep complex form state
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(visit_id, step_number)
);

-- Customer contact tracking per visit
CREATE TABLE visit_customer_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES ame_visits(id),
    contact_person VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50),
    contact_email VARCHAR(255),
    communication_preference VARCHAR(20) DEFAULT 'call',
    is_on_site_verified BOOLEAN DEFAULT FALSE,
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safety assessment tracking
CREATE TABLE visit_safety_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES ame_visits(id),
    ppe_available BOOLEAN DEFAULT FALSE,
    hazards_reviewed BOOLEAN DEFAULT FALSE,
    emergency_procedures_reviewed BOOLEAN DEFAULT FALSE,
    safety_requirements TEXT,
    site_hazards TEXT,
    safety_notes TEXT,
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System access test results
CREATE TABLE visit_system_access_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES ame_visits(id),
    test_type VARCHAR(50) NOT NULL,  -- 'supervisor', 'workbench', 'platform'
    connection_status VARCHAR(20) NOT NULL,  -- 'not_tested', 'testing', 'success', 'failed'
    username VARCHAR(255),
    connection_url VARCHAR(500),
    vpn_required BOOLEAN DEFAULT FALSE,
    system_version VARCHAR(100),
    test_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- Network analysis summary
CREATE TABLE visit_network_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES ame_visits(id),
    analysis_mode VARCHAR(20) NOT NULL,  -- 'upload', 'manual'
    total_devices INTEGER DEFAULT 0,
    online_devices INTEGER DEFAULT 0,
    offline_devices INTEGER DEFAULT 0,
    critical_devices INTEGER DEFAULT 0,
    protocols_found TEXT[],
    files_processed TEXT[],
    analysis_summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System performance baseline
CREATE TABLE visit_system_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES ame_visits(id),
    active_alarms INTEGER DEFAULT 0,
    critical_alarms INTEGER DEFAULT 0,
    cpu_usage_percent DECIMAL(5,2),
    memory_usage_percent DECIMAL(5,2),
    communication_health_percent DECIMAL(5,2) DEFAULT 100,
    override_points INTEGER DEFAULT 0,
    performance_score DECIMAL(5,2),
    critical_issues TEXT,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tool usage tracking
CREATE TABLE visit_tool_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    visit_id UUID REFERENCES ame_visits(id),
    tool_id UUID REFERENCES ame_tools_normalized(id),
    phase_number INTEGER,
    task_id UUID REFERENCES ame_tasks_normalized(id),
    is_selected BOOLEAN DEFAULT TRUE,
    actual_usage_minutes INTEGER,
    effectiveness_rating INTEGER,  -- 1-5 scale
    usage_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Phase 2: Reporting Data Marts

#### Aggregation Tables for Performance

```sql
-- Daily visit summary for fast dashboard queries
CREATE TABLE visit_daily_summary (
    summary_date DATE NOT NULL,
    total_visits INTEGER DEFAULT 0,
    completed_visits INTEGER DEFAULT 0,
    average_duration_minutes INTEGER DEFAULT 0,
    customer_satisfaction_avg DECIMAL(3,2),
    total_issues INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (summary_date)
);

-- Technician performance metrics
CREATE TABLE technician_performance_summary (
    technician_id UUID NOT NULL,
    summary_month DATE NOT NULL,  -- First day of month
    visits_completed INTEGER DEFAULT 0,
    average_visit_duration_minutes INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    average_task_duration_minutes INTEGER DEFAULT 0,
    customer_satisfaction_avg DECIMAL(3,2),
    issues_found INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (technician_id, summary_month)
);

-- Customer site health trends
CREATE TABLE customer_health_trends (
    customer_id UUID NOT NULL,
    visit_date DATE NOT NULL,
    devices_online_percent DECIMAL(5,2),
    system_performance_score DECIMAL(5,2),
    active_alarms INTEGER DEFAULT 0,
    critical_issues INTEGER DEFAULT 0,
    satisfaction_rating INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (customer_id, visit_date)
);
```

### Phase 3: API Design for Reporting

#### Reporting Service Interface

```typescript
interface ReportingService {
  // Visit Analytics
  getVisitSummary(visitId: string): Promise<VisitSummaryReport>;
  getVisitComparison(visitIds: string[]): Promise<VisitComparisonReport>;
  
  // Performance Analytics
  getTechnicianPerformance(technicianId: string, period: DateRange): Promise<TechnicianPerformanceReport>;
  getCustomerHealthTrend(customerId: string, period: DateRange): Promise<CustomerHealthReport>;
  
  // Operational Analytics
  getTaskPerformanceMetrics(filters: TaskFilters): Promise<TaskPerformanceReport>;
  getSystemHealthOverview(filters: CustomerFilters): Promise<SystemHealthReport>;
  
  // Dashboard Data
  getDashboardMetrics(period: DateRange): Promise<DashboardMetrics>;
  getKPISummary(): Promise<KPIMetrics>;
}

interface VisitSummaryReport {
  visitId: string;
  customerName: string;
  serviceTier: string;
  visitDate: Date;
  phases: PhaseMetrics[];
  tasks: TaskMetrics[];
  issues: IssueMetrics[];
  performance: PerformanceMetrics;
  satisfaction: number;
  duration: number;
  recommendations: string[];
}
```

## Migration Strategy

### Phase 1: Parallel Data Storage (Weeks 1-2)
1. Create new normalized tables alongside existing JSONB storage
2. Implement dual-write pattern for new visits
3. Build data transformation utilities
4. Create validation tools to ensure data consistency

### Phase 2: Historical Data Migration (Weeks 3-4)
1. Extract data from existing JSONB fields
2. Transform and validate data integrity
3. Populate new normalized tables
4. Verify migration accuracy with sample reports

### Phase 3: Reporting Implementation (Weeks 5-6)
1. Build new reporting APIs using normalized data
2. Create aggregation jobs for performance tables
3. Implement caching layer for dashboard queries
4. Build initial report templates

### Phase 4: System Cutover (Weeks 7-8)
1. Switch reads to new normalized tables
2. Maintain JSONB writes for rollback capability
3. Monitor performance and data consistency
4. Remove JSONB dependencies after validation period

## Performance Optimization

### Indexing Strategy
```sql
-- Visit phase tracking indexes
CREATE INDEX idx_visit_phase_progress_visit_phase ON visit_phase_progress(visit_id, phase_number);
CREATE INDEX idx_visit_phase_progress_status ON visit_phase_progress(status, completed_at);

-- Assessment step indexes
CREATE INDEX idx_visit_assessment_steps_visit ON visit_assessment_steps(visit_id, step_number);
CREATE INDEX idx_visit_assessment_steps_status ON visit_assessment_steps(status, is_skipped);

-- Performance data indexes
CREATE INDEX idx_visit_system_performance_visit_date ON visit_system_performance(visit_id, recorded_at);
CREATE INDEX idx_visit_system_performance_health ON visit_system_performance(communication_health_percent, performance_score);

-- Reporting aggregation indexes
CREATE INDEX idx_daily_summary_date ON visit_daily_summary(summary_date DESC);
CREATE INDEX idx_technician_performance_date ON technician_performance_summary(technician_id, summary_month DESC);
```

### Query Optimization
- Implement materialized views for complex aggregations
- Use appropriate JSONB indexes for remaining flexible data
- Implement read replicas for reporting queries
- Add query result caching for frequently accessed reports

## Expected Benefits

### Performance Improvements
- 50-75% faster report generation
- Reduced database load through optimized queries
- Better concurrent user support
- Scalable architecture for growing data volumes

### Reporting Capabilities
- Real-time dashboard updates
- Historical trend analysis
- Comparative performance metrics
- Automated KPI calculations
- Custom report generation

### Data Quality
- Referential integrity enforcement
- Structured validation rules
- Consistent data types and formats
- Audit trail for changes
- Better error handling and recovery

### Development Velocity
- Cleaner separation of concerns
- Type-safe reporting interfaces
- Easier testing and validation
- Reduced technical debt
- Better maintainability

## Implementation Timeline

### Week 1: Foundation
- [ ] Create new database schema
- [ ] Implement dual-write data layer
- [ ] Build data validation utilities

### Week 2: Data Migration Tools
- [ ] Extract JSONB transformation logic
- [ ] Create migration scripts
- [ ] Implement rollback procedures

### Week 3: Historical Migration
- [ ] Migrate Phase 1 (Pre-Visit) data
- [ ] Migrate Phase 2 (Assessment) data
- [ ] Validate data integrity

### Week 4: Complete Migration
- [ ] Migrate Phase 3 (Execution) data
- [ ] Migrate Phase 4 (Reporting) data  
- [ ] Create aggregation tables

### Week 5: Reporting APIs
- [ ] Build core reporting services
- [ ] Implement caching layer
- [ ] Create API documentation

### Week 6: Dashboard Integration
- [ ] Connect new APIs to frontend
- [ ] Build report templates
- [ ] Implement real-time updates

### Week 7: Performance Testing
- [ ] Load testing and optimization
- [ ] Query performance tuning
- [ ] Monitoring implementation

### Week 8: Production Cutover
- [ ] Switch to new reporting system
- [ ] Monitor system performance
- [ ] Complete JSONB deprecation

## Risk Mitigation

### Data Loss Prevention
- Maintain JSONB fields during migration period
- Implement comprehensive backup strategy
- Create rollback procedures for each phase
- Validate data integrity at each step

### Performance Risks
- Test with production-scale data
- Implement gradual rollout strategy
- Monitor query performance continuously
- Have rollback plan for performance issues

### Business Continuity  
- Maintain existing reporting during migration
- Implement feature flags for new functionality
- Ensure zero-downtime deployment
- Provide user training for new reports

This refactor will provide a solid foundation for advanced reporting capabilities while maintaining system performance and data integrity. The phased approach ensures minimal disruption to current operations while providing clear milestones for progress tracking.
