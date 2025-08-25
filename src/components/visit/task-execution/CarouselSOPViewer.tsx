import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  Target,
  Navigation,
  Clock,
  Camera,
  FileText,
  ExternalLink,
  Bookmark
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface RichSOPStep {
  step_number: number;
  content: string;
  references?: number[];
}

interface SOPReference {
  ref_number: number;
  url: string;
  title?: string;
  display_text?: string;
}

interface TaskStep {
  stepNumber: number;
  title: string;
  description: string;
  content?: string;
  references?: number[];
  navigationPath?: string;
  visualGuide?: string;
  specificActions?: string[];
  safetyNotes?: string;
  tip?: string;
  estimatedMinutes?: number;
  screenshotPlaceholder?: string;
}

interface CarouselSOPViewerProps {
  task: {
    id: string;
    task_id: string;
    task_name: string;
    sop_steps: string;
    navigation_path?: string;
    quality_checks: string;
    safety_notes?: string;
    duration_minutes: number;
  };
  sopData?: {
    steps?: RichSOPStep[];
    hyperlinks?: SOPReference[];
    goal?: string;
    best_practices?: string;
  };
  onStepComplete: (stepNumber: number) => void;
  onAllStepsComplete: () => void;
  completedSteps: Set<number>;
  onClose: () => void;
}

export const CarouselSOPViewer: React.FC<CarouselSOPViewerProps> = ({
  task,
  sopData,
  onStepComplete,
  onAllStepsComplete,
  completedSteps,
  onClose
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState<TaskStep[]>([]);

  useEffect(() => {
    // Parse structured SOP steps or fallback to simple steps
    const parseSteps = (stepString: string): TaskStep[] => {
      if (!stepString && !sopData?.steps) return [];
      
      // Priority 1: Use structured SOP data if available
      if (sopData?.steps && Array.isArray(sopData.steps)) {
        return sopData.steps.map((sopStep, index) => {
          const stepNumber = sopStep.step_number || index + 1;
          
          // Extract references from content
          const references = sopStep.references || extractReferences(sopStep.content || '');
          
          return {
            stepNumber,
            title: `Step ${stepNumber}`,
            description: sopStep.content || '',
            content: sopStep.content || '',
            references,
            navigationPath: task.navigation_path,
            safetyNotes: task.safety_notes,
            estimatedMinutes: Math.ceil(task.duration_minutes / sopData.steps.length),
            screenshotPlaceholder: `/lovable-uploads/faf02e95-507e-4652-aa44-00cd9ee54480.png`
          };
        });
      }
      
      // Priority 2: Parse simple pipe-separated steps
      if (!stepString) return [];
      
      const stepTexts = stepString.split('|').map(step => step.trim()).filter(Boolean);
      
      return stepTexts.map((stepText, index) => {
        // Extract step number and content
        const stepNumber = index + 1;
        let title = `Step ${stepNumber}`;
        let description = stepText;
        
        // Try to extract title from numbered steps like "1. Title - description"
        const numberedMatch = stepText.match(/^\d+\.\s*([^-|]+)(?:\s*-\s*(.*))?/);
        if (numberedMatch) {
          title = numberedMatch[1].trim();
          description = numberedMatch[2]?.trim() || numberedMatch[1].trim();
        }
        
        // Extract navigation path if it contains navigation keywords
        let navigationPath = task.navigation_path;
        const navMatch = stepText.match(/(Platform|Workbench|Station|Console|Views?|Tools?|Administration|Settings).*?(?:\||$)/i);
        if (navMatch) {
          navigationPath = navMatch[0].replace(/\|$/, '').trim();
        }
        
        // Check for safety keywords
        let safetyNotes = task.safety_notes;
        if (stepText.toLowerCase().includes('monitor') || 
            stepText.toLowerCase().includes('verify') || 
            stepText.toLowerCase().includes('check')) {
          safetyNotes = safetyNotes || 'Monitor system stability during this step';
        }
        
        // Extract specific actions
        const actionWords = ['click', 'select', 'open', 'verify', 'check', 'create', 'backup', 'copy', 'test'];
        const specificActions = actionWords.filter(action => 
          stepText.toLowerCase().includes(action)
        ).map(action => action.charAt(0).toUpperCase() + action.slice(1));
        
        return {
          stepNumber,
          title,
          description,
          navigationPath,
          specificActions: specificActions.length > 0 ? specificActions : undefined,
          safetyNotes,
          estimatedMinutes: Math.ceil(task.duration_minutes / stepTexts.length),
          screenshotPlaceholder: `/lovable-uploads/faf02e95-507e-4652-aa44-00cd9ee54480.png` // Generic placeholder
        };
      });
    };
    
    const parsedSteps = parseSteps(task.sop_steps);
    setSteps(parsedSteps);
    
    // Set current step to first incomplete step
    const firstIncomplete = parsedSteps.find(step => !completedSteps.has(step.stepNumber));
    if (firstIncomplete) {
      setCurrentStep(firstIncomplete.stepNumber);
    }
  }, [task.sop_steps, task.navigation_path, task.safety_notes, task.duration_minutes, completedSteps, sopData]);

  // Extract reference numbers from text [1], [2], etc.
  const extractReferences = (text: string): number[] => {
    const refMatches = text.match(/\[(\d+)\]/g);
    if (!refMatches) return [];
    return refMatches.map(match => parseInt(match.replace(/[\[\]]/g, '')));
  };

  // Render step content with clickable references
  const renderStepContent = (step: TaskStep) => {
    if (!step.content && !step.description) return null;

    const content = step.content || step.description;
    const refRegex = /\[(\d+)\]/g;
    
    return (
      <div className="prose prose-sm max-w-none">
        {content.split(refRegex).map((part, index) => {
          // If it's a number (reference), make it clickable
          if (index % 2 === 1) {
            const refNum = parseInt(part);
            const reference = sopData?.hyperlinks?.find(ref => ref.ref_number === refNum);
            if (reference) {
              return (
                <Button
                  key={index}
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mx-1 text-primary hover:underline inline-flex items-center gap-1"
                  onClick={() => window.open(reference.url, '_blank')}
                >
                  [{refNum}]
                  <ExternalLink className="w-3 h-3" />
                </Button>
              );
            }
            return <span key={index} className="text-muted-foreground">[{refNum}]</span>;
          }
          // Regular text content
          return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
        })}
      </div>
    );
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentStep > 1) {
        setCurrentStep(currentStep - 1);
      } else if (e.key === 'ArrowRight' && currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else if (e.key === ' ') {
        e.preventDefault();
        handleStepComplete();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, steps.length, onClose]);

  const handleStepComplete = () => {
    onStepComplete(currentStep);
    
    // Auto-advance to next step after 1 second
    setTimeout(() => {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      } else {
        // All steps completed
        onAllStepsComplete();
      }
    }, 1000);
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToNextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  const calculateProgress = () => {
    return steps.length > 0 ? (completedSteps.size / steps.length) * 100 : 0;
  };

  const getCurrentStep = () => {
    return steps.find(step => step.stepNumber === currentStep);
  };

  const currentStepData = getCurrentStep();
  const progress = calculateProgress();
  const isCurrentStepCompleted = completedSteps.has(currentStep);

  if (steps.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
            <p className="text-muted-foreground">No steps available for this task</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 h-full">
      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{task.task_name}</CardTitle>
            <Badge variant="outline" className="text-sm">
              {task.task_id}
            </Badge>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span>Step Progress</span>
              <span>{completedSteps.size} of {steps.length} steps completed</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Navigation Dots */}
      <div className="flex items-center justify-center gap-2 py-4">
        {steps.map((step) => (
          <Button
            key={step.stepNumber}
            variant="ghost"
            size="sm"
            onClick={() => goToStep(step.stepNumber)}
            className={cn(
              "w-10 h-10 rounded-full p-0 relative",
              currentStep === step.stepNumber && "ring-2 ring-primary bg-primary/10",
              completedSteps.has(step.stepNumber) && "bg-success hover:bg-success text-white"
            )}
          >
            {completedSteps.has(step.stepNumber) ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <span className="text-xs font-medium">{step.stepNumber}</span>
            )}
          </Button>
        ))}
      </div>

      {/* Current Step Display - Carousel Style */}
      {currentStepData && (
        <Card className="min-h-[600px] relative overflow-hidden">
          {/* Navigation Arrows */}
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousStep}
            disabled={currentStep === 1}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextStep}
            disabled={currentStep === steps.length}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm border shadow-lg"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>

          <CardContent className="p-6 space-y-6">
            {/* Step Header */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-sm">
                    Step {currentStepData.stepNumber} of {steps.length}
                  </Badge>
                  {currentStepData.estimatedMinutes && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {currentStepData.estimatedMinutes}m
                    </Badge>
                  )}
                </div>
                <h3 className="text-2xl font-semibold">{currentStepData.title}</h3>
              </div>
              
              <div className="flex items-center gap-2">
                {isCurrentStepCompleted ? (
                  <CheckCircle className="w-8 h-8 text-success" />
                ) : (
                  <Circle className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Visual Guide Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Screenshot Placeholder */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Visual Guide</span>
                </div>
                <div className="relative aspect-video bg-muted rounded-lg border overflow-hidden">
                  <img 
                    src={currentStepData.screenshotPlaceholder}
                    alt={`Screenshot for ${currentStepData.title}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjFmNWY5Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY0NzQ4YiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcHR1cmUgU2NyZWVuc2hvdCBIZXJlPC90ZXh0Pjwvc3ZnPg==';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="bg-background/90 backdrop-blur-sm"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Update Screenshot
                    </Button>
                  </div>
                </div>
              </div>

              {/* Step Details */}
              <div className="space-y-4">
                {/* Step Description */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Instructions</span>
                  </div>
                  {renderStepContent(currentStepData)}
                </div>
                
                {/* Navigation Path */}
                {currentStepData.navigationPath && (
                  <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Navigation className="w-5 h-5 text-info mt-0.5" />
                      <div>
                        <h4 className="font-medium text-info">Navigation Path</h4>
                        <p className="text-sm text-info/80 mt-1 font-mono">{currentStepData.navigationPath}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Specific Actions */}
                {currentStepData.specificActions && currentStepData.specificActions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Required Actions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {currentStepData.specificActions.map((action, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Safety Notes */}
                {currentStepData.safetyNotes && (
                  <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                      <div>
                        <h4 className="font-medium text-warning">Safety Note</h4>
                        <p className="text-sm text-warning/80 mt-1">{currentStepData.safetyNotes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Step Actions */}
            <div className="flex items-center justify-center gap-4 pt-6 border-t">
              <Button
                variant="outline"
                onClick={goToPreviousStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous Step
              </Button>
              
              {!isCurrentStepCompleted ? (
                <Button
                  onClick={handleStepComplete}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-primary/80 px-8"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mark Step Complete
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  disabled
                  className="flex items-center gap-2 px-8"
                >
                  <CheckCircle className="w-4 h-4" />
                  Step Completed
                </Button>
              )}
              
              <Button
                variant="outline"
                onClick={goToNextStep}
                disabled={currentStep === steps.length}
                className="flex items-center gap-2"
              >
                Next Step
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            {/* Reference Links Section */}
            {currentStepData.references && currentStepData.references.length > 0 && sopData?.hyperlinks && (
              <div className="flex items-center justify-center gap-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Bookmark className="w-4 h-4" />
                  <span>References:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {currentStepData.references.map((refNum) => {
                    const reference = sopData.hyperlinks?.find(ref => ref.ref_number === refNum);
                    if (!reference) return null;
                    return (
                      <Button
                        key={refNum}
                        variant="outline"
                        size="sm"
                        className="h-auto px-3 py-1 text-xs"
                        onClick={() => window.open(reference.url, '_blank')}
                      >
                        <span>[{refNum}]</span>
                        <span className="ml-1">{reference.title || reference.display_text || 'Reference'}</span>
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Keyboard Shortcuts */}
            <div className="text-xs text-muted-foreground text-center pt-4 border-t">
              <p>
                <strong>Keyboard shortcuts:</strong> ← → Navigate steps • Spacebar Mark complete • Esc Close
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};