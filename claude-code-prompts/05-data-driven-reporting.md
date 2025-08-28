# Prompt 5: Data-Driven Reporting System - Eliminate Hallucinated Content

## Objective
Completely revamp the Post-Visit reporting system to eliminate "hallucinated content" and create data-driven, contextual reports that focus on actual work performed, findings, and customer value. Transform reports into living documentation that supports technician handoffs.

## Context
- Current issue: "halicinated content in the post vist that is not releavnt"
- Need: "living documetn and reproting system used to update customers on our efforts, and handoff information between techs"
- Reports should be data-driven based on actual assessment findings, tasks completed, and system status
- Focus on customer value and technician knowledge transfer

## Current Code to Transform
- `src/components/visit/phases/PostVisitPhase.tsx` - Complete overhaul
- Create new report generation services
- Database schema for structured report data
- Report templates based on actual visit data

## Requirements

### 1. Structured Report Data Schema
```sql
-- Create structured report data tables
CREATE TABLE visit_report_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES ame_visits(id),
  customer_id UUID REFERENCES customers(id),
  
  -- System Status Summary (from actual assessment)
  system_health_score INTEGER, -- 0-100 based on actual metrics
  devices_online INTEGER,
  devices_total INTEGER,
  critical_alarms INTEGER,
  active_alarms INTEGER,
  performance_issues TEXT[],
  
  -- Work Performed Summary (from actual completed tasks)
  tasks_completed INTEGER,
  tasks_total INTEGER,
  sops_executed TEXT[],
  time_spent_minutes INTEGER,
  
  -- Findings and Issues (from actual assessment data)
  issues_found JSONB,
  issues_resolved JSONB,
  recommendations JSONB,
  
  -- Customer Value Delivered
  preventive_actions TEXT[],
  performance_improvements TEXT[],
  cost_savings_identified TEXT[],
  
  -- Technical Handoff Data
  site_notes TEXT,
  troubleshooting_tips TEXT,
  next_visit_focus TEXT[],
  special_considerations TEXT,
  
  -- Report Metadata
  generated_at TIMESTAMP DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  report_version VARCHAR(10),
  template_used VARCHAR(50)
);

-- Create issue resolution tracking
CREATE TABLE issue_resolutions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES ame_visits(id),
  issue_type VARCHAR(50),
  severity VARCHAR(20),
  description TEXT,
  root_cause TEXT,
  resolution_action TEXT,
  status VARCHAR(20), -- 'resolved', 'in_progress', 'escalated'
  time_to_resolve INTEGER, -- minutes
  parts_used TEXT[],
  follow_up_required BOOLEAN,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create performance improvements tracking
CREATE TABLE performance_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES ame_visits(id),
  improvement_type VARCHAR(50), -- 'efficiency', 'reliability', 'energy', 'comfort'
  baseline_value DECIMAL,
  improved_value DECIMAL,
  metric_unit VARCHAR(20),
  description TEXT,
  implementation_method TEXT,
  estimated_savings DECIMAL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Data-Driven Report Generation Service
Create `src/services/reportGenerationService.ts`:
```typescript
export class ReportGenerationService {
  // Generate complete visit report from actual data
  static async generateVisitReport(visitId: string): Promise<VisitReport> {
    // 1. Gather actual visit data
    const visitData = await this.getVisitData(visitId);
    const assessmentData = await this.getAssessmentData(visitId);
    const completedTasks = await this.getCompletedTasks(visitId);
    const issuesFound = await this.getIssuesAndResolutions(visitId);
    const performanceData = await this.getPerformanceMetrics(visitId);
    
    // 2. Generate data-driven sections
    return {
      executiveSummary: await this.generateExecutiveSummary(visitData, assessmentData, completedTasks),
      systemStatus: await this.generateSystemStatusReport(assessmentData, performanceData),
      workPerformed: await this.generateWorkPerformedSection(completedTasks, issuesFound),
      findingsAndRecommendations: await this.generateFindingsSection(issuesFound, assessmentData),
      customerValue: await this.generateCustomerValueSection(completedTasks, performanceData, issuesFound),
      technicianHandoff: await this.generateHandoffSection(visitData, issuesFound, assessmentData),
      nextSteps: await this.generateNextStepsSection(issuesFound, assessmentData, visitData.customer.service_tier)
    };
  }
  
  // Generate executive summary from actual data
  private static async generateExecutiveSummary(
    visitData: any,
    assessmentData: any,
    completedTasks: any[]
  ): Promise<ExecutiveSummary> {
    const systemHealthScore = this.calculateSystemHealthScore(assessmentData);
    const issuesSummary = await this.summarizeIssues(visitData.visit_id);
    
    return {
      serviceDate: visitData.visit_date,
      technicianName: visitData.technician_name,
      serviceType: visitData.customer.service_tier,
      systemHealth: this.getHealthStatusText(systemHealthScore),
      keyAccomplishments: this.extractKeyAccomplishments(completedTasks),
      criticalFindings: issuesSummary.critical,
      recommendedActions: issuesSummary.recommendations,
      nextServiceDue: this.calculateNextServiceDate(visitData.customer)
    };
  }
  
  // Generate system status from actual assessment data
  private static async generateSystemStatusReport(
    assessmentData: any,
    performanceData: any
  ): Promise<SystemStatusReport> {
    return {
      platformInfo: {
        type: assessmentData.platformResult?.primaryPlatform || 'Unknown',
        version: assessmentData.platformResult?.platformVersion,
        confidence: assessmentData.platformResult?.confidenceScore
      },
      deviceStatus: {
        totalDevices: assessmentData.deviceInventory?.length || 0,
        onlineDevices: assessmentData.deviceInventory?.filter(d => d.status === 'online').length || 0,
        communicationIssues: assessmentData.deviceInventory?.filter(d => d.status === 'offline') || []
      },
      performanceMetrics: {
        cpuUtilization: performanceData.cpuUsage,
        memoryUtilization: performanceData.memoryUsage,
        alarmCounts: performanceData.alarmCounts,
        responseTime: performanceData.averageResponseTime
      },
      networkHealth: {
        protocolDistribution: assessmentData.protocolAnalysis,
        communicationErrors: assessmentData.errorCounts,
        bandwidthUtilization: assessmentData.bandwidthUsage
      }
    };
  }
  
  // Generate work performed section from completed tasks
  private static async generateWorkPerformedSection(
    completedTasks: any[],
    issuesFound: any[]
  ): Promise<WorkPerformedSection> {
    return {
      plannedTasks: completedTasks.map(task => ({
        name: task.task_name,
        duration: task.actual_duration || task.estimated_duration,
        outcome: task.completion_status,
        notes: task.technician_notes
      })),
      unplannedWork: issuesFound.filter(issue => issue.status === 'resolved').map(issue => ({
        description: issue.description,
        action: issue.resolution_action,
        timeSpent: issue.time_to_resolve
      })),
      sopCompliance: completedTasks.map(task => ({
        sopId: task.sop_id,
        stepsCompleted: task.completed_steps?.length || 0,
        totalSteps: task.total_steps || 0,
        complianceRate: ((task.completed_steps?.length || 0) / (task.total_steps || 1)) * 100
      })),
      timeBreakdown: this.calculateTimeBreakdown(completedTasks, issuesFound)
    };
  }
}

interface VisitReport {
  executiveSummary: ExecutiveSummary;
  systemStatus: SystemStatusReport;
  workPerformed: WorkPerformedSection;
  findingsAndRecommendations: FindingsSection;
  customerValue: CustomerValueSection;
  technicianHandoff: TechnicianHandoffSection;
  nextSteps: NextStepsSection;
}
```

### 3. Enhanced Post-Visit Phase Component
Completely rewrite `PostVisitPhase.tsx`:
```typescript
export const PostVisitPhase = ({ customer, visitId, onPhaseComplete }: Props) => {
  const [reportData, setReportData] = useState<VisitReportData | null>(null);
  const [reportGenerated, setReportGenerated] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  
  useEffect(() => {
    loadVisitDataForReport();
  }, [visitId]);
  
  const loadVisitDataForReport = async () => {
    try {
      // Load all actual visit data
      const visitData = await AMEService.getVisitData(visitId);
      const assessmentData = await AMEService.getAssessmentResults(visitId);
      const completedTasks = await AMEService.getCompletedTasks(visitId);
      const issuesData = await AMEService.getVisitIssues(visitId);
      
      setReportData({
        visitData,
        assessmentData,
        completedTasks,
        issuesData,
        systemMetrics: assessmentData.systemMetrics || {}
      });
    } catch (error) {
      console.error('Failed to load visit data:', error);
    }
  };
  
  const generateReport = async () => {
    setGeneratingReport(true);
    try {
      const report = await ReportGenerationService.generateVisitReport(visitId);
      setGeneratedReport(report);
      setReportGenerated(true);
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: 'Report Generation Failed',
        description: 'Unable to generate visit report. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setGeneratingReport(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Phase 4: Visit Completion & Reporting</h2>
          <p className="text-muted-foreground">Generate comprehensive service report and documentation</p>
        </div>
        <Badge variant="outline">Visit ID: {visitId}</Badge>
      </div>
      
      {/* Visit Data Summary */}
      {reportData && (
        <Card>
          <CardHeader>
            <CardTitle>Visit Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-2xl font-bold text-primary">
                  {reportData.completedTasks.filter(t => t.status === 'Completed').length}
                </div>
                <div className="text-sm text-muted-foreground">Tasks Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {reportData.issuesData.length}
                </div>
                <div className="text-sm text-muted-foreground">Issues Found</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(reportData.systemMetrics.healthScore || 0)}%
                </div>
                <div className="text-sm text-muted-foreground">System Health</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Data-Driven Report Sections */}
      <Tabs defaultValue="findings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="findings">Findings & Issues</TabsTrigger>
          <TabsTrigger value="work">Work Performed</TabsTrigger>
          <TabsTrigger value="handoff">Technician Handoff</TabsTrigger>
          <TabsTrigger value="customer">Customer Value</TabsTrigger>
          <TabsTrigger value="report">Final Report</TabsTrigger>
        </TabsList>
        
        <TabsContent value="findings" className="space-y-4">
          <FindingsAndIssuesSection 
            assessmentData={reportData?.assessmentData}
            issuesData={reportData?.issuesData}
            onUpdateFindings={handleFindingsUpdate}
          />
        </TabsContent>
        
        <TabsContent value="work" className="space-y-4">
          <WorkPerformedSection
            completedTasks={reportData?.completedTasks}
            timeSpent={reportData?.totalTimeSpent}
            onUpdateWork={handleWorkUpdate}
          />
        </TabsContent>
        
        <TabsContent value="handoff" className="space-y-4">
          <TechnicianHandoffSection
            siteIntelligence={reportData?.siteIntelligence}
            troubleshootingTips=""
            specialConsiderations=""
            onUpdateHandoff={handleHandoffUpdate}
          />
        </TabsContent>
        
        <TabsContent value="customer" className="space-y-4">
          <CustomerValueSection
            performanceImprovements={reportData?.performanceImprovements}
            preventiveActions={reportData?.preventiveActions}
            costSavings={reportData?.costSavings}
            onUpdateValue={handleValueUpdate}
          />
        </TabsContent>
        
        <TabsContent value="report" className="space-y-4">
          <FinalReportSection
            reportGenerated={reportGenerated}
            generatingReport={generatingReport}
            onGenerateReport={generateReport}
            onCompletePhase={onPhaseComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

### 4. Data-Driven Report Sections
Create focused components for each section:

#### Findings & Issues Section
```typescript
// src/components/visit/reporting/FindingsAndIssuesSection.tsx
export const FindingsAndIssuesSection = ({ assessmentData, issuesData, onUpdateFindings }: Props) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>System Assessment Findings</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Display actual assessment findings */}
          <SystemFindings data={assessmentData} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Issues Found & Resolutions</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Display actual issues from visit */}
          <IssueResolutionList issues={issuesData} />
        </CardContent>
      </Card>
      
      {/* Only show recommendations based on actual findings */}
      <Card>
        <CardHeader>
          <CardTitle>Data-Driven Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <RecommendationsFromData 
            assessmentData={assessmentData}
            issuesData={issuesData}
          />
        </CardContent>
      </Card>
    </div>
  );
};
```

#### Work Performed Section
```typescript
// src/components/visit/reporting/WorkPerformedSection.tsx
export const WorkPerformedSection = ({ completedTasks, timeSpent, onUpdateWork }: Props) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tasks Completed</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Show actual completed tasks with real data */}
          <CompletedTasksList tasks={completedTasks} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>SOP Compliance</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Show actual SOP compliance data */}
          <SOPComplianceReport tasks={completedTasks} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Time Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Show actual time breakdown */}
          <TimeBreakdownChart timeData={timeSpent} />
        </CardContent>
      </Card>
    </div>
  );
};
```

### 5. Report Templates
Create structured report templates:
```typescript
// src/services/reportTemplates.ts
export class ReportTemplates {
  static generateCustomerReport(reportData: VisitReport): string {
    return `
# Service Visit Report - ${reportData.executiveSummary.serviceDate}

## Executive Summary
- **System Health**: ${reportData.executiveSummary.systemHealth}
- **Tasks Completed**: ${reportData.workPerformed.plannedTasks.length}
- **Issues Addressed**: ${reportData.findingsAndRecommendations.issuesResolved.length}

## System Status
${this.formatSystemStatus(reportData.systemStatus)}

## Work Performed
${this.formatWorkPerformed(reportData.workPerformed)}

## Findings & Recommendations
${this.formatFindings(reportData.findingsAndRecommendations)}

## Next Steps
${this.formatNextSteps(reportData.nextSteps)}
    `;
  }
  
  static generateTechnicianHandoffReport(reportData: VisitReport): string {
    return `
# Technician Handoff - Site: ${reportData.siteInfo.nickname}

## Site Context
- **Platform**: ${reportData.systemStatus.platformInfo.type}
- **Last Visit**: ${reportData.executiveSummary.serviceDate}
- **Service Tier**: ${reportData.executiveSummary.serviceType}

## Key Site Knowledge
${reportData.technicianHandoff.siteNotes}

## Troubleshooting Tips
${reportData.technicianHandoff.troubleshootingTips}

## Special Considerations
${reportData.technicianHandoff.specialConsiderations}

## Unresolved Issues
${reportData.findingsAndRecommendations.openIssues}
    `;
  }
}
```

## Success Criteria
1. Zero "hallucinated" or generic content in reports
2. All report content is derived from actual visit data
3. Customer reports focus on value delivered and system improvements
4. Technician handoff reports contain actionable site knowledge
5. Report generation is fast and consistent
6. Reports serve as living documentation that improves over time

## Testing Requirements
1. Verify all report content comes from actual visit data
2. Test report generation with minimal data scenarios
3. Ensure report quality improves with more complete assessments
4. Validate customer and technician report variants
5. Test report export and sharing functionality

## Integration Notes
- Integrates with all previous enhancements to provide comprehensive data
- Uses actual assessment results for system status reporting
- Leverages completed task data for work performed sections
- Creates foundation for continuous improvement and knowledge accumulation
- Supports both customer communication and technician knowledge transfer