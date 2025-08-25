import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, CarouselApi } from '@/components/ui/carousel';
import { 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  XCircle,
  ChevronRight,
  ChevronDown,
  Target,
  Wrench,
  FileText,
  Lightbulb,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { TaskTimer } from './TaskTimer';
import { CarouselSOPViewer } from './CarouselSOPViewer';
import { toast } from 'sonner';

interface Task {
  id: string;
  task_name: string;
  description?: string;
  estimated_duration: number;
  prerequisites?: string;
  sop_steps?: string;
  skills_required?: string;
  tools_required?: string[] | string;
  category?: string;
  navigation_path?: string;
  quality_checks?: string;
  safety_notes?: string;
}

interface VisitTask {
  id: string;
  task_id: string;
  visit_id: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Skipped';
  started_at?: string;
  completed_at?: string;
  time_spent?: number;
  technician_notes?: string;
  issues_found?: string;
  resolution?: string;
}

interface SOPData {
  id: string;
  sop_id: string;
  title: string;
  version?: string;
  estimated_duration_minutes?: number;
  last_updated?: string;
  goal?: string;
  category?: string;
  rich_content?: string;
  tools_required?: any;
  steps?: any;
  best_practices?: string;
  hyperlinks?: any;
}

interface ParsedSOPStep {
  id: number;
  text: string;
  area?: string;
  detail?: string;
  references?: number[];
}

interface ParsedReference {
  id: number;
  url: string;
  title?: string;
}

interface IntegratedTaskCardProps {
  task: Task;
  visitTask?: VisitTask;
  onTaskStart: (taskId: string) => void;
  onTaskComplete: (task: Task) => void;
  isExpanded: boolean;
  onExpand: (taskId: string) => void;
  onCollapse: () => void;
  sopData?: SOPData;
}

export const IntegratedTaskCard: React.FC<IntegratedTaskCardProps> = ({
  task,
  visitTask,
  onTaskStart,
  onTaskComplete,
  isExpanded,
  onExpand,
  onCollapse,
  sopData
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [currentStep, setCurrentStep] = useState(1);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentCarouselStep, setCurrentCarouselStep] = useState(0);

  // Track carousel step changes
  useEffect(() => {
    if (!carouselApi) return;

    const updateStep = () => {
      setCurrentCarouselStep(carouselApi.selectedScrollSnap());
    };

    carouselApi.on("select", updateStep);
    updateStep(); // Set initial step

    return () => {
      carouselApi.off("select", updateStep);
    };
  }, [carouselApi]);

  const status = visitTask?.status || 'Pending';
  const isCompleted = status === 'Completed';
  const isRunning = status === 'In Progress';
  const isActive = isExpanded && isRunning;

  const handleTaskStart = () => {
    if (!isRunning && !isCompleted) {
      onTaskStart(task.id);
      setActiveTab('steps');
      if (!isExpanded) {
        onExpand(task.id);
      }
    }
  };

  const handleStepComplete = (stepNumber: number) => {
    setCompletedSteps(prev => new Set([...prev, stepNumber]));
    if (stepNumber < steps.length) {
      setCurrentStep(stepNumber + 1);
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'In Progress':
        return <PlayCircle className="w-5 h-5 text-blue-500" />;
      case 'Skipped':
        return <XCircle className="w-5 h-5 text-gray-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Skipped':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  // Enhanced step parsing for task library steps (from sop_steps column)
  const formatTaskSteps = (stepInput: any): Array<{id: number, text: string}> => {
    if (!stepInput) return [];
    
    let stepText = String(stepInput).trim();
    
    // Handle JSON array format
    try {
      if (stepText.startsWith('[') && stepText.endsWith(']')) {
        const parsed = JSON.parse(stepText);
        if (Array.isArray(parsed)) {
          return parsed.map((step, index) => ({
            id: index + 1,
            text: String(step).trim()
          })).filter(step => step.text.length > 0);
        }
      }
    } catch (e) {
      // Continue with string parsing
    }
    
    // Split on numbered patterns first (most common format)
    let steps: string[] = [];
    
    if (/^\d+\.\s/.test(stepText)) {
      // Split on numbered patterns like "1.", "2.", etc.
      steps = stepText.split(/(?=\d+\.\s)/).filter(s => s && s.trim().length > 0);
    } else {
      // Try other delimiters
      const delimiters = ['\n', '|'];
      for (const delimiter of delimiters) {
        if (stepText.includes(delimiter)) {
          steps = stepText.split(delimiter);
          break;
        }
      }
    }
    
    // If no delimiters found, treat as single step
    if (steps.length === 0) {
      steps = [stepText];
    }
    
    return steps
      .map(step => step.trim())
      .filter(step => step.length > 0)
      .map((step, index) => ({
        id: index + 1,
        text: step
      }));
  };

  // Enhanced tools formatting with tooltips
  const formatToolsList = (taskTools?: string[] | string, sopTools?: any) => {
    const allTools: string[] = [];
    
    // Add tools from task
    if (taskTools) {
      if (Array.isArray(taskTools)) {
        allTools.push(...taskTools);
      } else if (typeof taskTools === 'string') {
        try {
          const parsed = JSON.parse(taskTools);
          if (Array.isArray(parsed)) {
            allTools.push(...parsed);
          } else {
            allTools.push(taskTools);
          }
        } catch {
          allTools.push(taskTools);
        }
      }
    }
    
    // Add tools from SOP
    if (sopTools) {
      if (Array.isArray(sopTools)) {
        allTools.push(...sopTools.map(tool => typeof tool === 'string' ? tool : tool.tool_name || tool.name || String(tool)));
      } else if (typeof sopTools === 'string') {
        try {
          const parsed = JSON.parse(sopTools);
          if (Array.isArray(parsed)) {
            allTools.push(...parsed.map(tool => typeof tool === 'string' ? tool : tool.tool_name || tool.name || String(tool)));
          } else {
            allTools.push(sopTools);
          }
        } catch {
          allTools.push(sopTools);
        }
      }
    }
    
    const uniqueTools = [...new Set(allTools)].filter(Boolean);
    
    if (uniqueTools.length === 0) {
      return <span className="text-muted-foreground italic">No specific tools required</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-2">
        {uniqueTools.map((tool, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="text-xs hover:bg-primary/10 transition-colors cursor-default"
            title={`Tool: ${tool}`}
          >
            🔧 {tool}
          </Badge>
        ))}
      </div>
    );
  };

  // Parse SOP data with enhanced structure
  const parseSOPSteps = (sopSteps: any): ParsedSOPStep[] => {
    if (!sopSteps) return [];
    
    if (Array.isArray(sopSteps)) {
      return sopSteps.map((step, index) => ({
        id: index + 1,
        text: typeof step === 'string' ? step : String(step),
        references: extractReferences(typeof step === 'string' ? step : String(step))
      }));
    }
    
    if (typeof sopSteps === 'string') {
      const steps = formatTaskSteps(sopSteps);
      return steps.map(step => ({
        ...step,
        references: extractReferences(step.text)
      }));
    }
    
    return [];
  };

  // Extract reference numbers from text [1], [2], etc.
  const extractReferences = (text: string): number[] => {
    const refMatches = text.match(/\[(\d+)\]/g);
    if (!refMatches) return [];
    return refMatches.map(match => parseInt(match.replace(/[\[\]]/g, '')));
  };

  // Parse hyperlinks from SOP data
  const parseHyperlinks = (hyperlinks: any): ParsedReference[] => {
    if (!hyperlinks) return [];
    
    if (Array.isArray(hyperlinks)) {
      return hyperlinks.map((link, index) => ({
        id: index + 1,
        url: typeof link === 'string' ? link : link.url || String(link),
        title: typeof link === 'object' ? link.title : undefined
      }));
    }
    
    if (typeof hyperlinks === 'string') {
      try {
        const parsed = JSON.parse(hyperlinks);
        if (Array.isArray(parsed)) {
          return parsed.map((link, index) => ({
            id: index + 1,
            url: typeof link === 'string' ? link : link.url || String(link),
            title: typeof link === 'object' ? link.title : undefined
          }));
        }
      } catch (e) {
        // Single URL string
        return [{ id: 1, url: hyperlinks }];
      }
    }
    
    return [];
  };

  // Parse steps from task library (simple format for tasks)
  const taskSteps = useMemo(() => {
    if (!task.sop_steps) return [];
    
    const parsedSteps = formatTaskSteps(task.sop_steps);
    return parsedSteps.map((step) => ({
      id: step.id,
      title: `Step ${step.id}`,
      description: step.text,
      navigationPath: task.navigation_path,
      specificActions: [],
      safetyNotes: task.safety_notes ? [task.safety_notes] : []
    }));
  }, [task]);

  // Use taskSteps for the steps variable (these are the Task Library steps)
  const steps = taskSteps;

  // Memoized SOP parsing
  const sopSteps = useMemo(() => parseSOPSteps(sopData?.steps), [sopData?.steps]);
  const sopReferences = useMemo(() => parseHyperlinks(sopData?.hyperlinks), [sopData?.hyperlinks]);
  const sopGoal = sopData?.goal || 'No specific goal defined for this procedure';

  const completedStepsCount = completedSteps.size;
  const progressPercentage = steps.length > 0 ? (completedStepsCount / steps.length) * 100 : 0;


  return (
    <Card className={`transition-all duration-300 ${isActive ? 'border-blue-500 shadow-lg' : ''} ${isExpanded ? '' : 'hover:shadow-md'}`}>
      <CardHeader className="pb-3">
        <Collapsible open={isExpanded} onOpenChange={() => isExpanded ? onCollapse() : onExpand(task.id)}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon()}
                <div className="text-left">
                  <h3 className="font-semibold text-lg">{task.task_name}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="secondary" className={getStatusColor()}>
                      {status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <span>•</span>
                    <span>{task.estimated_duration} min</span>
                    {isRunning && visitTask?.started_at && (
                      <>
                        <span>•</span>
                        <TaskTimer 
                          startTime={new Date(visitTask.started_at).getTime()}
                          estimatedDuration={task.estimated_duration}
                        />
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!isExpanded && !isCompleted && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTaskStart();
                    }}
                    disabled={isRunning}
                  >
                    {isRunning ? 'In Progress' : 'Start Task'}
                  </Button>
                )}
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent className="mt-4">
            <CardContent className="pt-0">
              {isExpanded && (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="steps">Steps</TabsTrigger>
                    <TabsTrigger value="sop">SOP</TabsTrigger>
                    <TabsTrigger value="quality">Quality</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-4">
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <strong>Prerequisites:</strong>
                          <p className="text-muted-foreground">{task.prerequisites || 'None'}</p>
                        </div>
                        <div>
                          <strong>Tools Required:</strong>
                          <div className="text-muted-foreground">
                            {formatToolsList(task.tools_required, sopData?.tools_required)}
                          </div>
                        </div>
                        <div>
                          <strong>Skills Required:</strong>
                          <p className="text-muted-foreground">{task.skills_required || 'Basic'}</p>
                        </div>
                        <div>
                          <strong>Category:</strong>
                          <Badge variant="outline">{task.category}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleTaskStart} disabled={isRunning || isCompleted}>
                          {isRunning ? 'In Progress' : isCompleted ? 'Completed' : 'Start Task'}
                        </Button>
                        {isRunning && (
                          <Button onClick={() => onTaskComplete(task)} variant="outline">
                            Complete Task
                          </Button>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="steps" className="mt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Task Steps</h4>
                        <span className="text-sm text-muted-foreground">
                          {completedStepsCount} of {steps.length} completed
                        </span>
                      </div>
                      <Progress value={progressPercentage} className="w-full" />
                      
                      <div className="space-y-3">
                        {steps.length > 0 ? (
                          steps.map((step, index) => {
                            const stepNumber = index + 1;
                            const isStepCompleted = completedSteps.has(stepNumber);
                            
                            return (
                              <Card 
                                key={step.id} 
                                className={`p-4 border transition-all ${isStepCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isStepCompleted}
                                      onChange={() => {
                                        if (isStepCompleted) {
                                          setCompletedSteps(prev => {
                                            const newSet = new Set(prev);
                                            newSet.delete(stepNumber);
                                            return newSet;
                                          });
                                        } else {
                                          handleStepComplete(stepNumber);
                                        }
                                      }}
                                      className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                      isStepCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {isStepCompleted ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <h5 className="font-medium">{step.title}</h5>
                                    <div 
                                      className="text-sm text-muted-foreground mt-1"
                                      dangerouslySetInnerHTML={{ __html: step.description }}
                                    />
                                    
                                    {step.navigationPath && (
                                      <div className="mt-2 p-2 bg-blue-100 rounded text-sm">
                                        <strong>Navigate:</strong> {step.navigationPath}
                                      </div>
                                    )}
                                    
                                    {step.safetyNotes && step.safetyNotes.length > 0 && (
                                      <div className="mt-2 p-2 bg-yellow-100 rounded text-sm flex items-start gap-2">
                                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                          <strong>Safety:</strong>
                                          <ul className="list-disc list-inside">
                                            {step.safetyNotes.map((note, noteIndex) => (
                                              <li key={noteIndex}>{note}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })
                        ) : (
                          <div className="space-y-3">
                            {formatTaskSteps(task.sop_steps || task.description || '').map((step, index) => {
                              const stepNumber = index + 1;
                              const isStepCompleted = completedSteps.has(stepNumber);
                              
                              return (
                                <Card key={step.id} className={`p-4 border transition-all ${isStepCompleted ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                                  <div className="flex items-start gap-3">
                                    <div className="flex items-center gap-3">
                                      <input
                                        type="checkbox"
                                        checked={isStepCompleted}
                                        onChange={() => {
                                          if (isStepCompleted) {
                                            setCompletedSteps(prev => {
                                              const newSet = new Set(prev);
                                              newSet.delete(stepNumber);
                                              return newSet;
                                            });
                                          } else {
                                            handleStepComplete(stepNumber);
                                          }
                                        }}
                                        className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                      />
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                        isStepCompleted ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                                      }`}>
                                        {isStepCompleted ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                                      </div>
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-medium">Step {stepNumber}</h5>
                                      <div 
                                        className="text-sm text-muted-foreground mt-1"
                                        dangerouslySetInnerHTML={{ 
                                          __html: step.text.replace(/\[(\d+)\]/g, '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-medium">[$1]</span>')
                                        }}
                                      />
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="sop" className="mt-4">
                    <div className="space-y-6">
                      {sopData ? (
                        <>
                          {/* SOP Header */}
                          <div className="border-b pb-4">
                            <h4 className="font-semibold text-lg mb-2">{sopData.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span>Version: {sopData.version || '1.0'}</span>
                              <span>•</span>
                              <span>Duration: {sopData.estimated_duration_minutes} min</span>
                              {sopData.last_updated && (
                                <>
                                  <span>•</span>
                                  <span>Updated: {new Date(sopData.last_updated).toLocaleDateString()}</span>
                                </>
                              )}
                            </div>
                          </div>

                           {/* Goal Section */}
                           <div className="bg-blue-50 rounded-lg p-4">
                             <h5 className="font-medium mb-2 flex items-center gap-2 text-blue-800">
                               <Target className="w-4 h-4" />
                               Objective
                             </h5>
                             <p className="text-sm text-blue-700 leading-relaxed">
                               {sopGoal}
                             </p>
                           </div>

                          {/* Tools Required */}
                          {sopData.tools_required && (
                            <div>
                              <h5 className="font-medium mb-3 flex items-center gap-2">
                                <Wrench className="w-4 h-4" />
                                Required Tools & Equipment
                              </h5>
                              {formatToolsList(undefined, sopData.tools_required)}
                            </div>
                          )}

                           {/* SOP Steps Carousel */}
                           {sopData.steps && (
                             <div>
                               <h5 className="font-medium mb-3">Step-by-Step Procedure</h5>
                               <CarouselSOPViewer
                                 task={{
                                   id: task.id,
                                   task_id: task.id,
                                   task_name: task.task_name,
                                   sop_steps: task.sop_steps || '',
                                   navigation_path: task.navigation_path,
                                   quality_checks: task.quality_checks || '',
                                   safety_notes: task.safety_notes,
                                   duration_minutes: task.estimated_duration
                                 }}
                                 onStepComplete={handleStepComplete}
                                 onAllStepsComplete={() => {
                                   onTaskComplete(task);
                                   toast.success('All steps completed!');
                                 }}
                                 completedSteps={completedSteps}
                                 onClose={() => {}}
                               />
                             </div>
                           )}

                          {/* Best Practices */}
                          {sopData.best_practices && (
                            <div className="bg-green-50 rounded-lg p-4">
                              <h5 className="font-medium mb-2 flex items-center gap-2 text-green-800">
                                <Lightbulb className="w-4 h-4" />
                                Best Practices
                              </h5>
                              <div className="text-sm text-green-700 whitespace-pre-line">
                                {sopData.best_practices}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                          <p className="text-muted-foreground">No detailed SOP available for this task</p>
                          <p className="text-sm text-muted-foreground mt-1">Check the Steps tab for basic task guidance</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="quality" className="mt-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Quality Checks</h4>
                      <div className="p-4 border rounded-lg bg-gray-50">
                        <p className="text-sm text-muted-foreground">
                          {task.quality_checks || 'No specific quality checks defined for this task.'}
                        </p>
                      </div>
                      
                      {task.safety_notes && (
                        <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <h5 className="font-medium text-yellow-800 mb-1">Safety Notes</h5>
                              <p className="text-sm text-yellow-700">{task.safety_notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </CardHeader>
    </Card>
  );
};