# Prompt 4: Smart Task Selection & Enhanced SOP Integration

## Objective
Enhance the Service Execution phase with intelligent task recommendations based on system assessment, service tier, and site context. Better leverage the comprehensive SOP_Library_v22.csv and Task_Library_v22.csv for guided, context-aware service delivery.

## Context
- Current task selection is basic service tier filtering
- SOP library is comprehensive but underutilized
- Task library contains detailed phase/tier information not fully leveraged
- Need context-aware recommendations based on assessment findings
- System should guide technicians from novice to expert-level service

## Current Code to Enhance
- `src/components/visit/phases/ServiceExecutionPhase.tsx` - Core task execution
- `src/services/` - Create smart recommendation services
- Task and SOP data integration from CSV libraries
- Assessment phase integration for context-aware recommendations

## Requirements

### 1. Smart Task Recommendation Database Schema
```sql
-- Create task recommendation tracking
CREATE TABLE task_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES ame_visits(id),
  customer_id UUID REFERENCES customers(id),
  recommended_task_id VARCHAR(20),
  recommendation_reason VARCHAR(100), -- 'mandatory', 'assessment_finding', 'performance_issue', 'preventive'
  priority_level VARCHAR(20), -- 'critical', 'high', 'normal', 'optional'
  context_data JSONB, -- Assessment data that triggered recommendation
  accepted BOOLEAN DEFAULT FALSE,
  completed BOOLEAN DEFAULT FALSE,
  estimated_duration INTEGER, -- minutes
  actual_duration INTEGER,
  technician_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create SOP usage tracking
CREATE TABLE sop_usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES ame_visits(id),
  sop_id VARCHAR(20),
  task_id VARCHAR(20),
  step_completions JSONB, -- Track which steps were completed
  time_spent INTEGER, -- minutes spent on SOP
  difficulty_rating INTEGER, -- 1-5 technician rating
  effectiveness_rating INTEGER, -- 1-5 technician rating
  technician_feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. Enhanced Task and SOP Types
Update types to match your CSV structure:
```typescript
// Based on your SOP_Library_v22.csv structure
interface EnhancedSOP {
  sop_id: string;
  title: string;
  system_family: string; // 'Niagara'
  vendor_flavor: string; // '', specific vendor variants
  phase: 'Prep' | 'Health_Sweep' | 'Deep_Dive' | 'Wrap_Up';
  service_tiers: ('CORE' | 'ASSURE' | 'GUARDIAN')[];
  estimated_duration_min: number;
  audience_level: 1 | 2 | 3; // Skill level required
  prerequisites: string;
  safety: string;
  goal: string;
  ui_navigation: string;
  step_list_core: string[];
  step_list_assure: string[];
  step_list_guardian: string[];
  verification_steps: string[];
  rollback_steps: string[];
  best_practices: string;
  tools: string[];
  hyperlinks: string[];
  owner: string;
  version: string;
}

// Based on your Task_Library_v22.csv structure  
interface EnhancedTask {
  task_id: string;
  task_name: string;
  system_family: string;
  vendor_flavor: string;
  phase: string;
  service_tiers: string[];
  frequency: string; // 'Monthly', 'Quarterly', 'Annually'
  estimated_duration_min: number;
  audience_level: number;
  initial_steps: string[];
  sop_refs: string[]; // References to related SOPs
  acceptance_criteria: string;
  artifacts: string; // Expected deliverables
  prerequisites: string;
  tools_required: string[];
  safety_tags: string;
  reference_links: string[];
  notes: string;
}

interface TaskRecommendation {
  task: EnhancedTask;
  reason: 'mandatory' | 'assessment_finding' | 'performance_issue' | 'preventive' | 'opportunity';
  priority: 'critical' | 'high' | 'normal' | 'optional';
  contextData: any; // Data from assessment that triggered this
  estimatedImpact: 'high' | 'medium' | 'low';
  reasoning: string;
}
```

### 3. Smart Task Recommendation Service
Create `src/services/smartTaskRecommendationService.ts`:
```typescript
export class SmartTaskRecommendationService {
  // Generate context-aware task recommendations
  static async generateTaskRecommendations(
    customerId: string,
    serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN',
    assessmentData: any,
    platformResult: PlatformDetectionResult,
    timeAvailable: number
  ): Promise<TaskRecommendation[]> {
    const recommendations: TaskRecommendation[] = [];
    
    // 1. Mandatory tasks based on service tier
    const mandatoryTasks = await this.getMandatoryTasks(serviceTier, platformResult.primaryPlatform);
    recommendations.push(...mandatoryTasks.map(task => ({
      task,
      reason: 'mandatory' as const,
      priority: 'critical' as const,
      contextData: { serviceTier },
      estimatedImpact: 'high' as const,
      reasoning: `Required for ${serviceTier} service tier`
    })));
    
    // 2. Assessment-driven recommendations
    const assessmentTasks = await this.getAssessmentDrivenTasks(assessmentData);
    recommendations.push(...assessmentTasks);
    
    // 3. Performance-based recommendations
    if (assessmentData.systemHealth) {
      const performanceTasks = await this.getPerformanceTasks(assessmentData.systemHealth);
      recommendations.push(...performanceTasks);
    }
    
    // 4. Preventive maintenance opportunities
    const preventiveTasks = await this.getPreventiveTasks(customerId, serviceTier, timeAvailable);
    recommendations.push(...preventiveTasks);
    
    // 5. Sort by priority and time constraints
    return this.optimizeTaskSequence(recommendations, timeAvailable);
  }
  
  // Get related SOPs for a task
  static async getRelatedSOPs(taskId: string, serviceTier: string): Promise<EnhancedSOP[]>;
  
  // Get platform-specific task variants
  static async getPlatformSpecificTasks(
    baseTasks: EnhancedTask[],
    platform: SystemPlatform
  ): Promise<EnhancedTask[]>;
  
  // Optimize task sequence based on dependencies and time
  private static async optimizeTaskSequence(
    recommendations: TaskRecommendation[],
    timeAvailable: number
  ): Promise<TaskRecommendation[]>;
}
```

### 4. Enhanced SOP Integration Service
Create `src/services/sopIntegrationService.ts`:
```typescript
export class SOPIntegrationService {
  // Get contextual SOP steps based on service tier
  static getSOPSteps(
    sop: EnhancedSOP,
    serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN',
    systemContext?: any
  ): SOPStep[] {
    // Return appropriate step list based on tier
    const stepList = serviceTier === 'CORE' ? sop.step_list_core :
                    serviceTier === 'ASSURE' ? sop.step_list_assure :
                    sop.step_list_guardian;
                    
    return stepList.map((step, index) => ({
      id: index + 1,
      description: step,
      completed: false,
      notes: '',
      timeSpent: 0
    }));
  }
  
  // Get SOP verification steps
  static getVerificationSteps(sop: EnhancedSOP): VerificationStep[];
  
  // Get rollback procedures if something goes wrong
  static getRollbackSteps(sop: EnhancedSOP): RollbackStep[];
  
  // Track SOP usage and effectiveness
  static async trackSOPUsage(
    visitId: string,
    sopId: string,
    taskId: string,
    stepCompletions: any,
    timeSpent: number,
    ratings: { difficulty: number; effectiveness: number },
    feedback?: string
  ): Promise<void>;
}
```

### 5. Enhanced Service Execution Component
Update `ServiceExecutionPhase.tsx` with smart recommendations:
```typescript
export const ServiceExecutionPhase = ({ customer, onPhaseComplete }: Props) => {
  const [taskRecommendations, setTaskRecommendations] = useState<TaskRecommendation[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [currentTaskContext, setCurrentTaskContext] = useState<any>(null);
  
  useEffect(() => {
    loadSmartRecommendations();
  }, [customer, assessmentData]);
  
  const loadSmartRecommendations = async () => {
    try {
      const recommendations = await SmartTaskRecommendationService.generateTaskRecommendations(
        customer.id,
        customer.service_tier,
        assessmentData,
        platformResult,
        availableTime
      );
      setTaskRecommendations(recommendations);
    } catch (error) {
      console.error('Failed to load task recommendations:', error);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Smart Task Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Recommended Service Tasks
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Based on {customer.service_tier} tier, system assessment, and site context
          </p>
        </CardHeader>
        <CardContent>
          <TaskRecommendationGrid
            recommendations={taskRecommendations}
            onTaskSelect={handleTaskSelection}
            selectedTasks={selectedTasks}
          />
        </CardContent>
      </Card>
      
      {/* Active Task Execution */}
      {currentTask && (
        <Card>
          <CardHeader>
            <CardTitle>Currently Executing: {currentTask.task_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <EnhancedTaskExecutionCard
              task={currentTask}
              relatedSOPs={currentSOPs}
              onTaskComplete={handleTaskComplete}
              onSOPStepComplete={handleSOPStepComplete}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
```

### 6. Task Recommendation Grid Component
Create `src/components/task-execution/TaskRecommendationGrid.tsx`:
```typescript
export const TaskRecommendationGrid = ({ recommendations, onTaskSelect, selectedTasks }: Props) => {
  return (
    <div className="grid gap-4">
      {recommendations.map(recommendation => (
        <TaskRecommendationCard
          key={recommendation.task.task_id}
          recommendation={recommendation}
          isSelected={selectedTasks.includes(recommendation.task.task_id)}
          onSelect={() => onTaskSelect(recommendation.task.task_id)}
        />
      ))}
    </div>
  );
};

const TaskRecommendationCard = ({ recommendation, isSelected, onSelect }: Props) => {
  const { task, reason, priority, reasoning } = recommendation;
  
  return (
    <div className={cn(
      "border rounded-lg p-4 cursor-pointer transition-colors",
      isSelected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
    )} onClick={onSelect}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium">{task.task_name}</h4>
            <Badge variant={getPriorityVariant(priority)}>{priority}</Badge>
            <Badge variant="outline">{reason}</Badge>
          </div>
          
          <p className="text-sm text-muted-foreground mb-2">{reasoning}</p>
          
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {task.estimated_duration_min}min
            </span>
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              Level {task.audience_level}
            </span>
            {task.tools_required.length > 0 && (
              <span className="flex items-center gap-1">
                <Wrench className="w-3 h-3" />
                {task.tools_required.length} tools
              </span>
            )}
          </div>
        </div>
        
        <Checkbox checked={isSelected} />
      </div>
    </div>
  );
};
```

### 7. Enhanced Task Execution Card
Update `IntegratedTaskCard.tsx` to show SOP integration:
```typescript
export const EnhancedTaskExecutionCard = ({ task, relatedSOPs, onTaskComplete, onSOPStepComplete }: Props) => {
  return (
    <div className="space-y-4">
      {/* Task Overview */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">{task.task_name}</h3>
          <p className="text-sm text-muted-foreground">{task.goal}</p>
        </div>
        <Badge variant="secondary">{task.service_tiers.join(', ')}</Badge>
      </div>
      
      {/* Prerequisites & Safety */}
      {task.prerequisites && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Prerequisites</AlertTitle>
          <AlertDescription>{task.prerequisites}</AlertDescription>
        </Alert>
      )}
      
      {task.safety_tags && (
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertTitle>Safety Requirements</AlertTitle>
          <AlertDescription>{task.safety_tags}</AlertDescription>
        </Alert>
      )}
      
      {/* Related SOPs */}
      <Tabs defaultValue="execution">
        <TabsList>
          <TabsTrigger value="execution">Task Execution</TabsTrigger>
          <TabsTrigger value="sops">SOPs ({relatedSOPs.length})</TabsTrigger>
          <TabsTrigger value="verification">Verification</TabsTrigger>
        </TabsList>
        
        <TabsContent value="execution">
          <TaskExecutionSteps
            initialSteps={task.initial_steps}
            onStepComplete={onSOPStepComplete}
          />
        </TabsContent>
        
        <TabsContent value="sops">
          <SOPIntegrationPanel
            sops={relatedSOPs}
            serviceTier={task.service_tiers[0]}
            onSOPStepComplete={onSOPStepComplete}
          />
        </TabsContent>
        
        <TabsContent value="verification">
          <TaskVerificationPanel
            acceptanceCriteria={task.acceptance_criteria}
            artifacts={task.artifacts}
            onVerificationComplete={onTaskComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

## Success Criteria
1. Task recommendations are context-aware and relevant to assessment findings
2. Service tier-appropriate tasks are automatically selected
3. SOP integration provides step-by-step guidance
4. Tool requirements are clearly communicated before task start
5. Task sequence is optimized for efficiency and dependencies
6. Technician feedback is captured to improve recommendations

## Testing Requirements
1. Test recommendation accuracy across different service tiers
2. Verify SOP integration works for all task types
3. Test task sequencing optimization
4. Ensure safety requirements are prominently displayed
5. Validate tool requirements match task needs

## Integration Notes
- Leverages comprehensive SOP and Task CSV libraries
- Integrates with platform detection results from previous prompt
- Provides foundation for performance tracking and improvement
- Supports technician skill development through guided SOPs
- Creates data for continuous improvement of recommendations