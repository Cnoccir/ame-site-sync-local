import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Wrench, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  ArrowRight,
  Play,
  Pause,
  Square,
  Camera,
  FileText,
  Lightbulb,
  Settings,
  Target,
  Plus,
  Minus,
  Eye,
  ExternalLink,
  Timer,
  Circle
} from 'lucide-react';
import { PhaseHeader, SectionCard } from '../shared';
import SOPService, { SOPData } from '@/services/sopService';
import { logger } from '@/utils/logger';

// Import types
import type { 
  CustomerPriorityInfo,
  TaskExecutionData,
  IssueData,
  RecommendationData,
  ServiceMetricsData
} from '@/types/pmWorkflow';

interface ServiceActivitiesData {
  customerPriorities: CustomerPriorityInfo;
  tasks: TaskExecutionData[];
  issues: IssueData[];
  recommendations: RecommendationData[];
  serviceMetrics: ServiceMetricsData;
}

interface Phase3ServiceActivitiesProps {
  data: ServiceActivitiesData;
  serviceTier: string;
  onDataUpdate: (data: Partial<ServiceActivitiesData>) => void;
  onPhaseComplete: () => void;
}

export const Phase3ServiceActivities: React.FC<Phase3ServiceActivitiesProps> = ({
  data,
  serviceTier,
  onDataUpdate,
  onPhaseComplete
}) => {
  const [activeTab, setActiveTab] = useState('priorities');
  const [activeTask, setActiveTask] = useState<string | null>(null);
  const [taskTimer, setTaskTimer] = useState<{ [key: string]: number }>({});
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [newIssue, setNewIssue] = useState<Partial<IssueData>>({});
  const [newRecommendation, setNewRecommendation] = useState<Partial<RecommendationData>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get tasks for customer's service tier
  const getTasksForServiceTier = (): SOPData[] => {
    return SOPService.getSOPsForServiceTier(serviceTier);
  };

  // Initialize tasks if not already present
  useEffect(() => {
    if (data.tasks.length === 0) {
      const tasksForTier = getTasksForServiceTier();
      const initialTasks: TaskExecutionData[] = tasksForTier.map(sop => ({
        id: sop.id,
        sopId: sop.id,
        name: sop.title,
        phase: sop.phase as any,
        serviceTier: serviceTier,
        estimatedDuration: sop.estimatedDuration,
        status: 'Pending',
        findings: '',
        actions: '',
        issues: [],
        recommendations: [],
        photos: [],
        dataCollected: {},
        reportSection: getReportSection(sop.phase),
        reportImpact: getReportImpact(sop.phase)
      }));
      
      onDataUpdate({ tasks: initialTasks });
      logger.info(`Initialized ${initialTasks.length} tasks for ${serviceTier} tier`);
    }
  }, [serviceTier, data.tasks.length]);

  const getReportSection = (phase: string): 'executive' | 'system' | 'work' | 'recommendations' => {
    switch (phase) {
      case 'Prep': return 'system';
      case 'Health_Sweep': return 'executive';
      case 'Deep_Dive': return 'work';
      case 'Wrap_Up': return 'recommendations';
      default: return 'work';
    }
  };

  const getReportImpact = (phase: string): 'foundation' | 'metrics' | 'improvements' | 'documentation' => {
    switch (phase) {
      case 'Prep': return 'foundation';
      case 'Health_Sweep': return 'metrics';
      case 'Deep_Dive': return 'improvements';
      case 'Wrap_Up': return 'documentation';
      default: return 'improvements';
    }
  };

  const calculateProgress = (): number => {
    const sections = ['priorities', 'tasks', 'issues', 'recommendations'];
    const completed = sections.filter(section => validateSection(section)).length;
    return (completed / sections.length) * 100;
  };

  const validateSection = (section: string): boolean => {
    switch (section) {
      case 'priorities':
        return data.customerPriorities.primaryConcerns.length > 0;
      case 'tasks':
        return data.tasks.some(task => task.status === 'Completed');
      case 'issues':
        return true; // Issues are optional
      case 'recommendations':
        return true; // Recommendations are optional
      default:
        return false;
    }
  };

  const updateCustomerPriorities = (field: keyof CustomerPriorityInfo, value: any) => {
    onDataUpdate({
      customerPriorities: { ...data.customerPriorities, [field]: value }
    });
  };

  const updateTask = (taskId: string, updates: Partial<TaskExecutionData>) => {
    const updatedTasks = data.tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    );
    onDataUpdate({ tasks: updatedTasks });
  };

  const startTask = (taskId: string) => {
    updateTask(taskId, { 
      status: 'In Progress',
      startTime: new Date()
    });
    setActiveTask(taskId);
    
    // Start timer
    const interval = setInterval(() => {
      setTaskTimer(prev => ({
        ...prev,
        [taskId]: (prev[taskId] || 0) + 1
      }));
    }, 1000);
    setTimerInterval(interval);
  };

  const pauseTask = (taskId: string) => {
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setActiveTask(null);
  };

  const completeTask = (taskId: string) => {
    updateTask(taskId, { 
      status: 'Completed',
      completionTime: new Date(),
      actualDuration: Math.round((taskTimer[taskId] || 0) / 60) // Convert to minutes
    });
    
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setActiveTask(null);
  };

  const addConcern = (concern: string) => {
    if (concern.trim() && !data.customerPriorities.primaryConcerns.includes(concern.trim())) {
      updateCustomerPriorities('primaryConcerns', [...data.customerPriorities.primaryConcerns, concern.trim()]);
    }
  };

  const removeConcern = (concern: string) => {
    updateCustomerPriorities('primaryConcerns', 
      data.customerPriorities.primaryConcerns.filter(c => c !== concern)
    );
  };

  const addIssue = () => {
    if (newIssue.title && newIssue.description) {
      const issue: IssueData = {
        id: `ISS-${Date.now()}`,
        severity: newIssue.severity || 'Medium',
        category: newIssue.category || 'Performance',
        title: newIssue.title,
        description: newIssue.description,
        location: newIssue.location || '',
        affectedSystems: newIssue.affectedSystems || [],
        impact: newIssue.impact || '',
        immediateAction: newIssue.immediateAction || '',
        photos: [],
        discoveryTime: new Date(),
        status: 'Open'
      };
      
      onDataUpdate({
        issues: [...data.issues, issue]
      });
      
      setNewIssue({});
    }
  };

  const addRecommendation = () => {
    if (newRecommendation.title && newRecommendation.description) {
      const recommendation: RecommendationData = {
        id: `REC-${Date.now()}`,
        type: newRecommendation.type || 'Short Term',
        priority: newRecommendation.priority || 'Medium',
        category: newRecommendation.category || 'Performance',
        title: newRecommendation.title,
        description: newRecommendation.description,
        justification: newRecommendation.justification || '',
        timeline: newRecommendation.timeline || '',
        benefits: newRecommendation.benefits || [],
        requiredActions: newRecommendation.requiredActions || [],
        relatedIssues: []
      };
      
      onDataUpdate({
        recommendations: [...data.recommendations, recommendation]
      });
      
      setNewRecommendation({});
    }
  };

  const getSOPSteps = (sop: SOPData, tier: string): string => {
    return SOPService.getStepsForTier(sop, tier);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const canCompletePhase = (): boolean => {
    return ['priorities', 'tasks'].every(section => validateSection(section)) &&
           data.tasks.filter(task => task.status === 'Completed').length >= 
           Math.ceil(data.tasks.length * 0.5); // At least 50% of tasks completed
  };

  const handlePhaseComplete = () => {
    if (canCompletePhase()) {
      // Calculate service metrics
      const completedTasks = data.tasks.filter(t => t.status === 'Completed');
      const totalTime = completedTasks.reduce((acc, task) => acc + (task.actualDuration || 0), 0);
      
      const serviceMetrics: ServiceMetricsData = {
        systemHealthScore: calculateHealthScore(),
        performanceImprovement: 0, // Will be calculated from before/after data
        energyOptimization: 0, // Will be calculated from recommendations
        reliabilityEnhancement: 0, // Will be calculated from issues resolved
        issuesResolved: data.issues.filter(i => i.status === 'Resolved').length,
        tasksCompleted: completedTasks.length,
        timeOnSite: totalTime
      };
      
      onDataUpdate({ serviceMetrics });
      onPhaseComplete();
    }
  };

  const calculateHealthScore = (): number => {
    const criticalIssues = data.issues.filter(i => i.severity === 'Critical').length;
    const highIssues = data.issues.filter(i => i.severity === 'High').length;
    const completedTasks = data.tasks.filter(t => t.status === 'Completed').length;
    
    let score = 100;
    score -= criticalIssues * 20;
    score -= highIssues * 10;
    score += (completedTasks / data.tasks.length) * 20;
    
    return Math.max(0, Math.min(100, score));
  };

  const progress = calculateProgress();
  const availableTasks = getTasksForServiceTier();

  return (
    <div className="h-full flex flex-col">
      <PhaseHeader
        phase={3}
        title="Service Activities"
        description="Execute service tier tasks and document findings"
        progress={progress}
        requiredTasks={['Customer Priorities', 'Service Tasks', 'Issues', 'Recommendations']}
        completedTasks={['priorities', 'tasks', 'issues', 'recommendations'].filter(validateSection)}
        estimatedTime={availableTasks.reduce((acc, task) => acc + task.estimatedDuration, 0)}
        actualTime={data.tasks.reduce((acc, task) => acc + (task.actualDuration || 0), 0)}
      />

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="m-4 grid grid-cols-4">
            <TabsTrigger value="priorities" className="gap-2">
              <Target className="h-4 w-4" />
              Priorities
              {validateSection('priorities') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="tasks" className="gap-2">
              <Wrench className="h-4 w-4" />
              Tasks
              {validateSection('tasks') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="issues" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Issues ({data.issues.length})
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="gap-2">
              <Lightbulb className="h-4 w-4" />
              Recommendations ({data.recommendations.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Customer Priorities Tab */}
            <TabsContent value="priorities" className="mt-0">
              <SectionCard
                title="Customer Priorities & Concerns"
                description="Gather customer priorities and reported issues"
                icon={<Target className="h-4 w-4" />}
                required
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Primary Concerns</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="e.g., 3rd floor is always too hot"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addConcern((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                      />
                      <Button 
                        onClick={() => {
                          const input = document.querySelector('input[placeholder*="3rd floor"]') as HTMLInputElement;
                          if (input?.value) {
                            addConcern(input.value);
                            input.value = '';
                          }
                        }}
                        variant="outline"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      {data.customerPriorities.primaryConcerns.map((concern, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {concern}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-auto p-0 ml-1"
                            onClick={() => removeConcern(concern)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Energy Goals</Label>
                      <Textarea
                        value={data.customerPriorities.energyGoals.join('\n')}
                        onChange={(e) => updateCustomerPriorities('energyGoals', e.target.value.split('\n').filter(g => g.trim()))}
                        placeholder="Reduce energy costs by 10%..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Operational Challenges</Label>
                      <Textarea
                        value={data.customerPriorities.operationalChallenges.join('\n')}
                        onChange={(e) => updateCustomerPriorities('operationalChallenges', e.target.value.split('\n').filter(c => c.trim()))}
                        placeholder="Staff complaints about comfort..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Timeline & Budget Constraints</Label>
                    <Input
                      value={data.customerPriorities.timeline}
                      onChange={(e) => updateCustomerPriorities('timeline', e.target.value)}
                      placeholder="e.g., Must complete by end of quarter, budget $10k"
                    />
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* Service Tasks Tab */}
            <TabsContent value="tasks" className="mt-0">
              <SectionCard
                title={`${serviceTier} Service Tasks`}
                description={`Complete tasks for ${serviceTier} service tier`}
                icon={<Wrench className="h-4 w-4" />}
                required
                progress={(data.tasks.filter(t => t.status === 'Completed').length / Math.max(data.tasks.length, 1)) * 100}
              >
                <div className="space-y-4">
                  {data.tasks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wrench className="h-12 w-12 mx-auto mb-4" />
                      <p>Loading tasks for {serviceTier} tier...</p>
                    </div>
                  )}

                  {data.tasks.map((task) => {
                    const sop = availableTasks.find(s => s.id === task.sopId);
                    const isActive = activeTask === task.id;
                    const elapsed = taskTimer[task.id] || 0;
                    
                    return (
                      <Card key={task.id} className={`${task.status === 'Completed' ? 'bg-green-50 dark:bg-green-950' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                task.status === 'Completed' ? 'bg-green-500 text-white' :
                                task.status === 'In Progress' ? 'bg-blue-500 text-white' :
                                'bg-gray-200 text-gray-600'
                              }`}>
                                {task.status === 'Completed' ? 
                                  <CheckCircle2 className="h-4 w-4" /> :
                                  task.status === 'In Progress' ?
                                  <Play className="h-4 w-4" /> :
                                  <Circle className="h-4 w-4" />
                                }
                              </div>
                              <div>
                                <h4 className="font-medium">{task.name}</h4>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span>SOP-{task.sopId}</span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {task.estimatedDuration}min est.
                                  </span>
                                  <Badge variant="outline" size="sm">{task.phase}</Badge>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {isActive && (
                                <div className="text-sm font-mono bg-blue-100 px-2 py-1 rounded">
                                  {formatTime(elapsed)}
                                </div>
                              )}
                              
                              {task.status === 'Pending' && (
                                <Button size="sm" onClick={() => startTask(task.id)} className="gap-1">
                                  <Play className="h-3 w-3" />
                                  Start
                                </Button>
                              )}
                              
                              {task.status === 'In Progress' && (
                                <>
                                  <Button size="sm" variant="outline" onClick={() => pauseTask(task.id)} className="gap-1">
                                    <Pause className="h-3 w-3" />
                                    Pause
                                  </Button>
                                  <Button size="sm" onClick={() => completeTask(task.id)} className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Complete
                                  </Button>
                                </>
                              )}
                              
                              {sop && (
                                <Button size="sm" variant="outline" className="gap-1">
                                  <FileText className="h-3 w-3" />
                                  View SOP
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* SOP Quick Reference - Collapsible */}
                          {sop && task.status !== 'Pending' && (
                            <div className="border-t pt-3 mt-3">
                              <div className="text-sm space-y-2">
                                <div className="font-medium text-primary">Goal: {sop.goal}</div>
                                  <div className="space-y-1">
                                    <span className="font-medium">Steps:</span>
                                    <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs">
                                      {getSOPSteps(sop, serviceTier).split('\n').map((step, i) => (
                                        <div key={i} className="mb-1">{step}</div>
                                      ))}
                                    </div>
                                  </div>
                                {sop.tools && (
                                  <div className="text-xs">
                                    <span className="font-medium">Tools:</span> {sop.tools}
                                  </div>
                                )}
                                {sop.safety && (
                                  <div className="text-xs text-orange-600">
                                    <span className="font-medium">Safety:</span> {sop.safety}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Task Documentation */}
                          {task.status !== 'Pending' && (
                            <div className="border-t pt-3 mt-3 space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-2">
                                  <Label>Findings</Label>
                                  <Textarea
                                    value={task.findings}
                                    onChange={(e) => updateTask(task.id, { findings: e.target.value })}
                                    placeholder="What did you find?"
                                    rows={2}
                                  />
                                </div>
                                <div className="space-y-2">
                                  <Label>Actions Taken</Label>
                                  <Textarea
                                    value={task.actions}
                                    onChange={(e) => updateTask(task.id, { actions: e.target.value })}
                                    placeholder="What actions were performed?"
                                    rows={2}
                                  />
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </SectionCard>
            </TabsContent>
            {/* Issues Tab */}
            <TabsContent value="issues" className="mt-0">
              <SectionCard
                title="Issues Found"
                description="Document issues discovered during service activities"
                icon={<AlertTriangle className="h-4 w-4" />}
              >
                <div className="space-y-4">
                  {/* Add New Issue Form */}
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Report New Issue</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <div className="space-y-2">
                          <Label>Issue Title *</Label>
                          <Input
                            value={newIssue.title || ''}
                            onChange={(e) => setNewIssue({...newIssue, title: e.target.value})}
                            placeholder="Brief description of the issue"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Severity *</Label>
                          <Select
                            value={newIssue.severity || 'Medium'}
                            onValueChange={(value) => setNewIssue({...newIssue, severity: value as any})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Critical">Critical - Safety/System Down</SelectItem>
                              <SelectItem value="High">High - Major Impact</SelectItem>
                              <SelectItem value="Medium">Medium - Moderate Impact</SelectItem>
                              <SelectItem value="Low">Low - Minor Issue</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={newIssue.category || 'Performance'}
                            onValueChange={(value) => setNewIssue({...newIssue, category: value as any})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Safety">Safety</SelectItem>
                              <SelectItem value="Performance">Performance</SelectItem>
                              <SelectItem value="Reliability">Reliability</SelectItem>
                              <SelectItem value="Efficiency">Efficiency</SelectItem>
                              <SelectItem value="Compliance">Compliance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Location</Label>
                          <Input
                            value={newIssue.location || ''}
                            onChange={(e) => setNewIssue({...newIssue, location: e.target.value})}
                            placeholder="Where is the issue located?"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-3">
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Textarea
                            value={newIssue.description || ''}
                            onChange={(e) => setNewIssue({...newIssue, description: e.target.value})}
                            placeholder="Detailed description of the issue"
                            rows={3}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Impact</Label>
                          <Textarea
                            value={newIssue.impact || ''}
                            onChange={(e) => setNewIssue({...newIssue, impact: e.target.value})}
                            placeholder="How does this issue affect operations?"
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Immediate Action Taken</Label>
                          <Textarea
                            value={newIssue.immediateAction || ''}
                            onChange={(e) => setNewIssue({...newIssue, immediateAction: e.target.value})}
                            placeholder="What immediate actions were taken?"
                            rows={2}
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          onClick={addIssue}
                          disabled={!newIssue.title || !newIssue.description}
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          Add Issue
                        </Button>
                        <Button variant="outline" className="gap-2">
                          <Camera className="h-4 w-4" />
                          Add Photo
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Existing Issues */}
                  {data.issues.map((issue) => (
                    <Card key={issue.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant={
                                  issue.severity === 'Critical' ? 'destructive' :
                                  issue.severity === 'High' ? 'default' :
                                  'secondary'
                                }
                              >
                                {issue.severity}
                              </Badge>
                              <Badge variant="outline">{issue.category}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {issue.discoveryTime.toLocaleString()}
                              </span>
                            </div>
                            <h4 className="font-medium mb-1">{issue.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{issue.description}</p>
                            {issue.location && (
                              <p className="text-sm">
                                <strong>Location:</strong> {issue.location}
                              </p>
                            )}
                            {issue.impact && (
                              <p className="text-sm">
                                <strong>Impact:</strong> {issue.impact}
                              </p>
                            )}
                            {issue.immediateAction && (
                              <p className="text-sm">
                                <strong>Action Taken:</strong> {issue.immediateAction}
                              </p>
                            )}
                          </div>
                          
                          <Select
                            value={issue.status}
                            onValueChange={(value) => {
                              const updatedIssues = data.issues.map(i => 
                                i.id === issue.id ? { ...i, status: value as any } : i
                              );
                              onDataUpdate({ issues: updatedIssues });
                            }}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Open">Open</SelectItem>
                              <SelectItem value="Resolved">Resolved</SelectItem>
                              <SelectItem value="Deferred">Deferred</SelectItem>
                              <SelectItem value="Monitoring">Monitoring</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {data.issues.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
                      <p>No issues reported yet</p>
                      <p className="text-sm">Use the form above to document any issues found during service activities</p>
                    </div>
                  )}
                </div>
              </SectionCard>
            </TabsContent>

            {/* Recommendations Tab */}
            <TabsContent value="recommendations" className="mt-0">
              <SectionCard
                title="Recommendations"
                description="Provide improvement recommendations based on findings"
                icon={<Lightbulb className="h-4 w-4" />}
              >
                <div className="space-y-4">
                  {/* Add New Recommendation Form */}
                  <Card className="border-dashed">
                    <CardContent className="p-4">
                      <h4 className="font-medium mb-3">Add Recommendation</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                        <div className="space-y-2">
                          <Label>Type *</Label>
                          <Select
                            value={newRecommendation.type || 'Short Term'}
                            onValueChange={(value) => setNewRecommendation({...newRecommendation, type: value as any})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Immediate">Immediate - Do Now</SelectItem>
                              <SelectItem value="Short Term">Short Term - Within 3 months</SelectItem>
                              <SelectItem value="Long Term">Long Term - Within 1 year</SelectItem>
                              <SelectItem value="Upgrade">Upgrade - Major Investment</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Priority</Label>
                          <Select
                            value={newRecommendation.priority || 'Medium'}
                            onValueChange={(value) => setNewRecommendation({...newRecommendation, priority: value as any})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="High">High Priority</SelectItem>
                              <SelectItem value="Medium">Medium Priority</SelectItem>
                              <SelectItem value="Low">Low Priority</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Select
                            value={newRecommendation.category || 'Performance'}
                            onValueChange={(value) => setNewRecommendation({...newRecommendation, category: value as any})}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Performance">Performance</SelectItem>
                              <SelectItem value="Efficiency">Efficiency</SelectItem>
                              <SelectItem value="Reliability">Reliability</SelectItem>
                              <SelectItem value="Upgrade">Upgrade</SelectItem>
                              <SelectItem value="Maintenance">Maintenance</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-3">
                        <div className="space-y-2">
                          <Label>Title *</Label>
                          <Input
                            value={newRecommendation.title || ''}
                            onChange={(e) => setNewRecommendation({...newRecommendation, title: e.target.value})}
                            placeholder="Brief title for the recommendation"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Description *</Label>
                          <Textarea
                            value={newRecommendation.description || ''}
                            onChange={(e) => setNewRecommendation({...newRecommendation, description: e.target.value})}
                            placeholder="Detailed description of the recommendation"
                            rows={3}
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="space-y-2">
                            <Label>Justification</Label>
                            <Textarea
                              value={newRecommendation.justification || ''}
                              onChange={(e) => setNewRecommendation({...newRecommendation, justification: e.target.value})}
                              placeholder="Why is this recommendation important?"
                              rows={2}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Timeline</Label>
                            <Input
                              value={newRecommendation.timeline || ''}
                              onChange={(e) => setNewRecommendation({...newRecommendation, timeline: e.target.value})}
                              placeholder="e.g., Within 30 days, Next quarter"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        onClick={addRecommendation}
                        disabled={!newRecommendation.title || !newRecommendation.description}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Recommendation
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Existing Recommendations */}
                  {data.recommendations.map((rec) => (
                    <Card key={rec.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant={
                                  rec.type === 'Immediate' ? 'destructive' :
                                  rec.type === 'Short Term' ? 'default' :
                                  'secondary'
                                }
                              >
                                {rec.type}
                              </Badge>
                              <Badge variant="outline">{rec.category}</Badge>
                              <Badge 
                                variant={
                                  rec.priority === 'High' ? 'destructive' :
                                  rec.priority === 'Medium' ? 'default' :
                                  'secondary'
                                }
                                className="text-xs"
                              >
                                {rec.priority}
                              </Badge>
                            </div>
                            <h4 className="font-medium mb-1">{rec.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{rec.description}</p>
                            {rec.justification && (
                              <p className="text-sm mb-2">
                                <strong>Justification:</strong> {rec.justification}
                              </p>
                            )}
                            {rec.timeline && (
                              <p className="text-sm">
                                <strong>Timeline:</strong> {rec.timeline}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {data.recommendations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Lightbulb className="h-12 w-12 mx-auto mb-4" />
                      <p>No recommendations added yet</p>
                      <p className="text-sm">Use the form above to provide improvement recommendations</p>
                    </div>
                  )}
                </div>
              </SectionCard>
            </TabsContent>
          </div>

          {/* Phase Completion Footer */}
          <div className="border-t bg-white dark:bg-gray-950 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-medium">Progress: {Math.round(progress)}%</span>
                  <span className="text-muted-foreground ml-2">
                    ({data.tasks.filter(t => t.status === 'Completed').length} of {data.tasks.length} tasks completed)
                  </span>
                </div>
                
                {data.tasks.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Service Metrics:</span>
                    <span className="text-muted-foreground ml-2">
                      {data.issues.length} issues, {data.recommendations.length} recommendations
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={handlePhaseComplete}
                disabled={!canCompletePhase()}
                className="gap-2"
              >
                Complete Service Activities
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {!canCompletePhase() && (
              <Alert className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Complete customer priorities and at least 50% of service tasks to proceed to Documentation.
                  {data.customerPriorities.primaryConcerns.length === 0 && ' Add customer concerns.'}
                  {data.tasks.filter(t => t.status === 'Completed').length < Math.ceil(data.tasks.length * 0.5) && 
                   ` Complete ${Math.ceil(data.tasks.length * 0.5) - data.tasks.filter(t => t.status === 'Completed').length} more tasks.`}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};