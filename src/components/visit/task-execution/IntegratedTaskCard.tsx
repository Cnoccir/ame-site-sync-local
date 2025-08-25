import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Play, 
  Pause, 
  Square, 
  CheckCircle, 
  Clock, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Video,
  ExternalLink,
  AlertTriangle,
  Target,
  Lightbulb,
  Wrench
} from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { TaskTimer } from './TaskTimer';

interface TaskStep {
  id: number;
  title: string;
  description: string;
  navigationPath?: string;
  safetyNotes?: string[];
  estimatedTime?: number;
  specificActions?: string[];
}

interface TaskData {
  id: string;
  task_name: string;
  description: string;
  estimated_duration: number;
  sop_steps: string;
  quality_checks: string;
  tools_required: string;
  prerequisites: string;
  skills_required: string;
  category: string;
}

interface VisitTask {
  id: string;
  visit_id: string;
  task_id: string;
  status: string;
  started_at?: string | null;
  completed_at?: string | null;
  notes?: string | null;
}

interface SOPData {
  id: string;
  sop_id: string;
  title: string;
  goal: string | null;
  steps: any;
  best_practices: string | null;
  tools_required: any;
  hyperlinks: any;
  estimated_duration_minutes: number;
  category_id: string | null;
  version: string | null;
  last_updated: string | null;
  created_at: string | null;
}

interface IntegratedTaskCardProps {
  task: TaskData;
  visitTask?: VisitTask;
  sopData?: SOPData;
  isExpanded: boolean;
  isActive: boolean;
  completedSteps: Set<number>;
  onTaskStart: (task: TaskData) => void;
  onTaskComplete: (task: TaskData) => void;
  onStepComplete: (stepNumber: number) => void;
  onExpand: (taskId: string) => void;
  onCollapse: () => void;
}

export const IntegratedTaskCard: React.FC<IntegratedTaskCardProps> = ({
  task,
  visitTask,
  sopData,
  isExpanded,
  isActive,
  completedSteps,
  onTaskStart,
  onTaskComplete,
  onStepComplete,
  onExpand,
  onCollapse
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState<TaskStep[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  const status = visitTask?.status || 'not_started';
  const isRunning = status === 'in_progress';
  const isCompleted = status === 'completed';

  // Parse steps from sop_steps
  useEffect(() => {
    if (task.sop_steps) {
      try {
        const parsedSteps = parseStepsFromContent(task.sop_steps);
        setSteps(parsedSteps);
        // Set current step to first incomplete
        const firstIncomplete = parsedSteps.findIndex((_, index) => !completedSteps.has(index + 1));
        if (firstIncomplete !== -1) {
          setCurrentStep(firstIncomplete + 1);
        }
      } catch (error) {
        console.error('Error parsing steps:', error);
      }
    }
  }, [task.sop_steps, completedSteps]);

  const parseStepsFromContent = (content: string): TaskStep[] => {
    const lines = content.split('\n').filter(line => line.trim());
    const steps: TaskStep[] = [];
    let currentStep: Partial<TaskStep> = {};
    let stepCounter = 1;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('Step ') || trimmedLine.match(/^\d+\./)) {
        if (currentStep.title) {
          steps.push({ ...currentStep, id: stepCounter++ } as TaskStep);
        }
        currentStep = { title: trimmedLine, description: '' };
      } else if (trimmedLine.startsWith('Safety:') || trimmedLine.startsWith('SAFETY:')) {
        currentStep.safetyNotes = [trimmedLine.replace(/^Safety:/i, '').trim()];
      } else if (trimmedLine.startsWith('Navigate:') || trimmedLine.startsWith('NAVIGATE:')) {
        currentStep.navigationPath = trimmedLine.replace(/^Navigate:/i, '').trim();
      } else if (trimmedLine.startsWith('Action:') || trimmedLine.startsWith('ACTION:')) {
        if (!currentStep.specificActions) currentStep.specificActions = [];
        currentStep.specificActions.push(trimmedLine.replace(/^Action:/i, '').trim());
      } else if (trimmedLine && currentStep.title) {
        currentStep.description = (currentStep.description || '') + ' ' + trimmedLine;
      }
    }

    if (currentStep.title) {
      steps.push({ ...currentStep, id: stepCounter } as TaskStep);
    }

    return steps;
  };

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (isRunning) return <Play className="w-5 h-5 text-blue-500" />;
    return <Clock className="w-5 h-5 text-gray-400" />;
  };

  const getStatusColor = () => {
    if (isCompleted) return 'bg-green-100 text-green-800';
    if (isRunning) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-600';
  };

  const handleTaskStart = () => {
    onTaskStart(task);
    setActiveTab('steps');
    onExpand(task.id);
  };

  const handleStepComplete = (stepNumber: number) => {
    onStepComplete(stepNumber);
    // Auto advance to next step
    if (stepNumber < steps.length) {
      setCurrentStep(stepNumber + 1);
    }
  };

  const completedStepsCount = Array.from(completedSteps).filter(step => step <= steps.length).length;
  const progressPercentage = steps.length > 0 ? (completedStepsCount / steps.length) * 100 : 0;

  const formatToolsList = (taskTools?: string, sopTools?: any) => {
    const allTools = new Set<string>();
    
    // Add tools from task (just tool IDs/names)
    if (taskTools) {
      taskTools.split(',').forEach(tool => {
        const trimmed = tool.trim();
        if (trimmed) allTools.add(trimmed);
      });
    }
    
    // Add tools from SOP
    if (sopTools && Array.isArray(sopTools)) {
      sopTools.forEach(tool => {
        if (typeof tool === 'string') {
          allTools.add(tool.trim());
        } else if (tool && tool.name) {
          allTools.add(tool.name.trim());
        }
      });
    }
    
    if (allTools.size === 0) {
      return <span className="text-muted-foreground italic">Standard tools</span>;
    }
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {Array.from(allTools).map((tool, index) => (
          <Badge 
            key={index} 
            variant="outline" 
            className="text-xs cursor-help" 
            title={`Tool: ${tool}`}
          >
            <Wrench className="w-3 h-3 mr-1" />
            {tool.replace(/^TOOL_/, '').replace(/_/g, ' ')}
          </Badge>
        ))}
      </div>
    );
  };

  const formatStepsList = (stepsString: string) => {
    if (!stepsString) return [];
    
    // First try to parse as JSON array (from database)
    try {
      const parsed = JSON.parse(stepsString);
      if (Array.isArray(parsed)) {
        return parsed.map((step, index) => ({
          id: index + 1,
          text: typeof step === 'string' ? step : step.description || step.text || `Step ${index + 1}`
        }));
      }
    } catch {}
    
    // Handle pipe-delimited or line-separated format
    const steps = stepsString
      .split(/[\|\n]/) // Split by pipe or newline
      .map(step => step.trim())
      .filter(Boolean)
      .map((step, index) => {
        // Remove existing numbering if present
        const cleanStep = step.replace(/^\d+\.?\s*/, '');
        return {
          id: index + 1,
          text: cleanStep
        };
      });
    
    return steps;
  };

  const renderHyperlinksList = (hyperlinks: any) => {
    if (!hyperlinks) return null;
    
    let links = [];
    if (Array.isArray(hyperlinks)) {
      links = hyperlinks;
    } else if (typeof hyperlinks === 'string') {
      try {
        links = JSON.parse(hyperlinks);
      } catch {
        links = hyperlinks.split(',').map((url: string) => ({ 
          url: url.trim(), 
          title: `Reference ${links.length + 1}` 
        }));
      }
    }
    
    if (!Array.isArray(links) || links.length === 0) return null;
    
    return (
      <div className="space-y-2">
        {links.map((link: any, index: number) => (
          <a 
            key={index}
            href={link.url || link}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {link.title || link.name || `Reference ${index + 1}`}
          </a>
        ))}
      </div>
    );
  };

  const parseRichHTMLContent = (content: string) => {
    if (!content) return { steps: [], references: {} };
    
    // Extract reference links
    const references: { [key: string]: string } = {};
    const linkMatches = content.match(/\d+\.\s+https?:\/\/[^\s<]+/g);
    if (linkMatches) {
      linkMatches.forEach(match => {
        const [num, url] = match.split('. ');
        references[num] = url;
      });
    }
    
    // Split content by <br> tags and process steps
    const stepTexts = content.split('<br>').filter(text => text.trim());
    const steps = stepTexts.map((stepText, index) => {
      // Convert numbered references [1], [2] to clickable links
      const processedText = stepText.replace(/\[(\d+)(?:,\s*(\d+))*\]/g, (match, ...nums) => {
        const numbers = match.match(/\d+/g) || [];
        return numbers.map(num => `<a href="#ref-${num}" class="text-blue-600 underline">[${num}]</a>`).join(', ');
      });
      
      return {
        id: index + 1,
        title: index === 0 ? 'Performance Verification' : `Step ${index + 1}`,
        content: processedText.trim(),
        references: stepText.match(/\[(\d+)\]/g)?.map(ref => ref.replace(/[\[\]]/g, '')) || []
      };
    });
    
    return { steps, references };
  };

  const renderSOPStepsCarousel = (steps: any, hyperlinks: any) => {
    if (!steps) return null;
    
    let stepsList = [];
    let references = {};
    
    if (Array.isArray(steps)) {
      stepsList = steps.map((step, index) => ({
        id: index + 1,
        title: step.title || `Step ${index + 1}`,
        content: step.description || step.content || step,
        references: []
      }));
    } else if (typeof steps === 'string') {
      try {
        // Try parsing as JSON first
        const parsed = JSON.parse(steps);
        if (Array.isArray(parsed)) {
          stepsList = parsed.map((step, index) => ({
            id: index + 1,
            title: step.title || `Step ${index + 1}`,
            content: step.description || step.content || step,
            references: []
          }));
        }
      } catch {
        // Parse as rich HTML content with references
        const { steps: parsedSteps, references: parsedRefs } = parseRichHTMLContent(steps);
        stepsList = parsedSteps;
        references = parsedRefs;
      }
    }
    
    if (!Array.isArray(stepsList) || stepsList.length === 0) return null;
    
    return (
      <div className="space-y-4">
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between">
          <h4 className="font-medium">SOP Steps</h4>
          <span className="text-sm text-muted-foreground">
            {stepsList.length} steps total
          </span>
        </div>
        
        <Carousel className="w-full">
          <CarouselContent>
            {stepsList.map((step: any, index: number) => (
              <CarouselItem key={index}>
                <Card className="p-6">
                  <div className="space-y-4">
                    {/* Step Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="font-semibold text-primary">{index + 1}</span>
                      </div>
                      <div>
                        <h5 className="font-medium text-lg">{step.title}</h5>
                        <span className="text-sm text-muted-foreground">Step {index + 1} of {stepsList.length}</span>
                      </div>
                    </div>
                    
                    {/* Step Content */}
                    <div className="prose prose-sm max-w-none">
                      <div 
                        className="text-sm leading-relaxed"
                        dangerouslySetInnerHTML={{ 
                          __html: step.content?.replace(/\[(\d+)\]/g, '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-medium">[$1]</span>') || ''
                        }}
                      />
                    </div>
                    
                    {/* Reference Links for this step */}
                    {step.references && step.references.length > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <h6 className="font-medium text-sm mb-2">References for this step:</h6>
                        <div className="space-y-1">
                          {step.references.map((refNum: string) => (
                            <div key={refNum} className="text-xs">
                              <span className="font-medium">[{refNum}]</span>
                              {references[refNum] && (
                                <a 
                                  href={references[refNum]} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                >
                                  {references[refNum]}
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Placeholder for screenshots */}
                    <div className="mt-4 h-40 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-sm text-muted-foreground">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5" />
                        <span>Step Reference Image</span>
                      </div>
                      <span className="text-xs">Upload screenshot for step {index + 1}</span>
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
        
        {/* Complete Reference List */}
        {Object.keys(references).length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h5 className="font-medium mb-3">Complete Reference List</h5>
            <div className="space-y-2 text-sm">
              {Object.entries(references).map(([num, url]) => (
                <div key={num} className="flex gap-2">
                  <span className="font-medium min-w-[2rem]">[{num}]</span>
                  <a 
                    href={String(url)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline break-all"
                  >
                    {String(url)}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

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
                      {steps.length > 0 ? (
                        <>
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">Task Progress</h4>
                            <span className="text-sm text-muted-foreground">
                              {completedStepsCount} of {steps.length} steps
                            </span>
                          </div>
                          <Progress value={progressPercentage} className="w-full" />
                          
                          <div className="space-y-3">
                            {steps.map((step, index) => {
                              const stepNumber = index + 1;
                              const isCurrentStep = stepNumber === currentStep;
                              const isStepCompleted = completedSteps.has(stepNumber);
                              
                              return (
                                <Card 
                                  key={step.id} 
                                  className={`p-4 ${isCurrentStep ? 'border-blue-500 bg-blue-50' : ''} ${isStepCompleted ? 'border-green-500 bg-green-50' : ''}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                                      isStepCompleted ? 'bg-green-500 text-white' : 
                                      isCurrentStep ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'
                                    }`}>
                                      {isStepCompleted ? <CheckCircle className="w-4 h-4" /> : stepNumber}
                                    </div>
                                    <div className="flex-1">
                                      <h5 className="font-medium">{step.title}</h5>
                                      <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                                      
                                      {step.navigationPath && (
                                        <div className="mt-2 p-2 bg-blue-100 rounded text-sm">
                                          <strong>Navigate:</strong> {step.navigationPath}
                                        </div>
                                      )}
                                      
                                      {step.specificActions && step.specificActions.length > 0 && (
                                        <div className="mt-2">
                                          <strong className="text-sm">Actions:</strong>
                                          <ul className="list-disc list-inside text-sm text-muted-foreground">
                                            {step.specificActions.map((action, actionIndex) => (
                                              <li key={actionIndex}>{action}</li>
                                            ))}
                                          </ul>
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
                                      
                                      {isCurrentStep && !isStepCompleted && (
                                        <Button 
                                          size="sm" 
                                          className="mt-3"
                                          onClick={() => handleStepComplete(stepNumber)}
                                        >
                                          Mark Step Complete
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </>
                      ) : (
                        // Fallback: Format steps from task.sop_steps as a simple list
                        <div className="space-y-4">
                          <h4 className="font-medium">Task Steps</h4>
                          <div className="space-y-3">
                            {formatStepsList(task.sop_steps || '').length > 0 ? (
                              <ol className="space-y-3">
                                {formatStepsList(task.sop_steps || '').map((step, index) => (
                                  <li key={step.id} className="flex items-start gap-3 p-3 border rounded-lg bg-gray-50">
                                    <div className="w-7 h-7 bg-blue-500 text-white rounded-full flex items-center justify-center flex-shrink-0 font-medium text-sm">
                                      {step.id}
                                    </div>
                                    <div className="flex-1">
                                      <div 
                                        className="text-sm leading-relaxed"
                                        dangerouslySetInnerHTML={{ 
                                          __html: step.text.replace(/\[(\d+)\]/g, '<span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-800 font-medium">[$1]</span>')
                                        }}
                                      />
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <p className="text-sm text-muted-foreground italic">No specific steps defined for this task.</p>
                            )}
                          </div>
                        </div>
                      )}
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
                          {sopData.goal && (
                            <div className="bg-blue-50 rounded-lg p-4">
                              <h5 className="font-medium mb-2 flex items-center gap-2 text-blue-800">
                                <Target className="w-4 h-4" />
                                Objective
                              </h5>
                              <p className="text-sm text-blue-700">{sopData.goal}</p>
                            </div>
                          )}

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
                              {renderSOPStepsCarousel(sopData.steps, sopData.hyperlinks)}
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

                          {/* Hyperlinks */}
                          {sopData.hyperlinks && (
                            <div>
                              <h5 className="font-medium mb-3 flex items-center gap-2">
                                <ExternalLink className="w-4 h-4" />
                                Reference Links
                              </h5>
                              {renderHyperlinksList(sopData.hyperlinks)}
                            </div>
                          )}
                          
                          {sopData.hyperlinks && Array.isArray(sopData.hyperlinks) && sopData.hyperlinks.length > 0 && (
                            <div>
                              <h5 className="font-medium mb-2">External References</h5>
                              {sopData.hyperlinks.map((link, index) => (
                                <a 
                                  key={index}
                                  href={typeof link === 'string' ? link : link.url || '#'} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  {typeof link === 'string' ? link : link.title || link.url || 'External Link'}
                                </a>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>No SOP data available for this task</p>
                          <p className="text-sm mt-1">SOP content will be loaded when available</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="quality" className="mt-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Quality Checks</h4>
                      <div className="space-y-3">
                        {task.quality_checks ? (
                          task.quality_checks.split('|').map((check, index) => (
                            <Card key={index} className="p-3">
                              <div className="flex items-start gap-3">
                                <input 
                                  type="checkbox" 
                                  className="rounded mt-1" 
                                  id={`quality-check-${index}`}
                                />
                                <label 
                                  htmlFor={`quality-check-${index}`}
                                  className="text-sm flex-1 cursor-pointer"
                                >
                                  {check.trim()}
                                </label>
                              </div>
                            </Card>
                          ))
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No quality checks defined for this task</p>
                            <p className="text-sm mt-1">Quality checks will appear here when available</p>
                          </div>
                        )}
                      </div>
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