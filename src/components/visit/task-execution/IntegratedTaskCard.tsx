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
  AlertTriangle
} from 'lucide-react';
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
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
}

interface SOPData {
  id: string;
  task_id: string;
  title: string;
  content: string;
  hyperlinks: string;
  videos: string;
  images: string;
  pdfs: string;
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

  const renderMediaContent = (urls: string, type: 'video' | 'image' | 'pdf') => {
    if (!urls) return null;
    
    const urlList = urls.split(',').map(url => url.trim()).filter(Boolean);
    
    return urlList.map((url, index) => {
      if (type === 'video') {
        return (
          <div key={index} className="mb-4">
            <video controls className="w-full rounded-lg">
              <source src={url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
        );
      } else if (type === 'image') {
        return (
          <img 
            key={index} 
            src={url} 
            alt={`Reference ${index + 1}`}
            className="w-full rounded-lg mb-4"
          />
        );
      } else if (type === 'pdf') {
        return (
          <a 
            key={index}
            href={url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2"
          >
            <FileText className="w-4 h-4" />
            PDF Reference {index + 1}
            <ExternalLink className="w-3 h-3" />
          </a>
        );
      }
    });
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
                          <p className="text-muted-foreground">{task.tools_required || 'Standard tools'}</p>
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
                      {steps.length > 0 && (
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
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="sop" className="mt-4">
                    <div className="space-y-4">
                      {sopData ? (
                        <>
                          <div>
                            <h4 className="font-medium mb-2">SOP: {sopData.title}</h4>
                            <div className="prose prose-sm max-w-none">
                              <div dangerouslySetInnerHTML={{ __html: sopData.content }} />
                            </div>
                          </div>
                          
                          {sopData.videos && (
                            <div>
                              <h5 className="font-medium mb-2 flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                Reference Videos
                              </h5>
                              {renderMediaContent(sopData.videos, 'video')}
                            </div>
                          )}
                          
                          {sopData.images && (
                            <div>
                              <h5 className="font-medium mb-2">Reference Images</h5>
                              {renderMediaContent(sopData.images, 'image')}
                            </div>
                          )}
                          
                          {sopData.pdfs && (
                            <div>
                              <h5 className="font-medium mb-2">Reference Documents</h5>
                              {renderMediaContent(sopData.pdfs, 'pdf')}
                            </div>
                          )}
                          
                          {sopData.hyperlinks && (
                            <div>
                              <h5 className="font-medium mb-2">External References</h5>
                              {sopData.hyperlinks.split(',').map((link, index) => (
                                <a 
                                  key={index}
                                  href={link.trim()} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 mb-2"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                  {link.trim()}
                                </a>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-muted-foreground">No SOP data available for this task.</p>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="quality" className="mt-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Quality Checks</h4>
                      {task.quality_checks ? (
                        <div className="prose prose-sm max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: task.quality_checks.replace(/\n/g, '<br>') }} />
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No quality checks defined for this task.</p>
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