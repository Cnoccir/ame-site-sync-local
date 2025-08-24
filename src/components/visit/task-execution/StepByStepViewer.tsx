import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  Circle, 
  AlertTriangle, 
  Lightbulb,
  Target,
  Navigation,
  Clock,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface TaskStep {
  stepNumber: number;
  title: string;
  description: string;
  navigationPath?: string;
  visualGuide?: string;
  specificActions?: string[];
  safetyNotes?: string;
  tip?: string;
  estimatedMinutes?: number;
}

interface StepByStepViewerProps {
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
  onStepComplete: (stepNumber: number) => void;
  onAllStepsComplete: () => void;
  completedSteps: Set<number>;
}

export const StepByStepViewer: React.FC<StepByStepViewerProps> = ({
  task,
  onStepComplete,
  onAllStepsComplete,
  completedSteps
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [steps, setSteps] = useState<TaskStep[]>([]);

  useEffect(() => {
    // Parse pipe-separated steps into structured step objects
    const parseSteps = (stepString: string): TaskStep[] => {
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
          estimatedMinutes: Math.ceil(task.duration_minutes / stepTexts.length)
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
  }, [task.sop_steps, task.navigation_path, task.safety_notes, task.duration_minutes, completedSteps]);

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
        // Handle escape if needed
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, steps.length]);

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
    <div className="space-y-6">
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
          
          {/* Step Dots Navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            {steps.map((step) => (
              <Button
                key={step.stepNumber}
                variant="ghost"
                size="sm"
                onClick={() => goToStep(step.stepNumber)}
                className={cn(
                  "w-8 h-8 rounded-full p-0",
                  currentStep === step.stepNumber && "ring-2 ring-primary",
                  completedSteps.has(step.stepNumber) && "bg-success hover:bg-success text-white"
                )}
              >
                {completedSteps.has(step.stepNumber) ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <span className="text-xs">{step.stepNumber}</span>
                )}
              </Button>
            ))}
          </div>
        </CardHeader>
      </Card>

      {/* Current Step Display */}
      {currentStepData && (
        <Card className="min-h-[400px]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="default" className="text-sm">
                    Step {currentStepData.stepNumber}
                  </Badge>
                  {currentStepData.estimatedMinutes && (
                    <Badge variant="outline" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {currentStepData.estimatedMinutes}m
                    </Badge>
                  )}
                </div>
                <h3 className="text-xl font-semibold">{currentStepData.title}</h3>
              </div>
              
              <div className="flex items-center gap-2">
                {isCurrentStepCompleted ? (
                  <CheckCircle className="w-6 h-6 text-success" />
                ) : (
                  <Circle className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step Description */}
            <div className="space-y-3">
              <p className="text-base leading-relaxed">{currentStepData.description}</p>
              
              {/* Navigation Path */}
              {currentStepData.navigationPath && (
                <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Navigation className="w-5 h-5 text-info mt-0.5" />
                    <div>
                      <h4 className="font-medium text-info">Navigation Path</h4>
                      <p className="text-sm text-info/80 mt-1">{currentStepData.navigationPath}</p>
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
              
              {/* Tips */}
              {currentStepData.tip && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-600">Tip</h4>
                      <p className="text-sm text-blue-600/80 mt-1">{currentStepData.tip}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Step Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={goToPreviousStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                
                <Button
                  variant="outline"
                  onClick={goToNextStep}
                  disabled={currentStep === steps.length}
                  className="flex items-center gap-2"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                {!isCurrentStepCompleted && (
                  <Button
                    onClick={handleStepComplete}
                    className="flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark Step Complete
                  </Button>
                )}
                
                {isCurrentStepCompleted && currentStep < steps.length && (
                  <Button
                    onClick={goToNextStep}
                    className="flex items-center gap-2"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            
            {/* Keyboard Shortcuts */}
            <div className="text-xs text-muted-foreground pt-4 border-t">
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