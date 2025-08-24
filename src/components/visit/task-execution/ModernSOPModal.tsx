import React, { useState } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle, 
  Circle, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Image as ImageIcon, 
  ExternalLink,
  AlertTriangle,
  Target,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TaskProcedure {
  id: string;
  task_id: string;
  procedure_title: string;
  procedure_category: string;
  procedure_steps: any[];
  visual_guides: any[];
  additional_resources: any[];
}

interface ModernSOPModalProps {
  procedure: TaskProcedure;
  onClose: () => void;
}

interface StepProgress {
  stepId: string;
  completed: boolean;
}

export const ModernSOPModal: React.FC<ModernSOPModalProps> = ({
  procedure,
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    steps: true,
    guides: false,
    resources: false
  });
  const [stepProgress, setStepProgress] = useState<StepProgress[]>([]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleStep = (stepId: string) => {
    setStepProgress(prev => {
      const existing = prev.find(sp => sp.stepId === stepId);
      if (existing) {
        return prev.map(sp => 
          sp.stepId === stepId 
            ? { ...sp, completed: !sp.completed }
            : sp
        );
      } else {
        return [...prev, { stepId, completed: true }];
      }
    });
  };

  const isStepCompleted = (stepId: string) => {
    return stepProgress.find(sp => sp.stepId === stepId)?.completed || false;
  };

  const calculateProgress = () => {
    const totalSteps = procedure.procedure_steps?.length || 0;
    if (totalSteps === 0) return 0;
    const completedSteps = stepProgress.filter(sp => sp.completed).length;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  const getTotalDuration = () => {
    if (!procedure.procedure_steps || !Array.isArray(procedure.procedure_steps)) return 0;
    return procedure.procedure_steps.reduce((total, step) => {
      return total + (step.estimated_minutes || 5);
    }, 0);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">{procedure.procedure_title}</h2>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <Badge variant="outline">{procedure.procedure_category}</Badge>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {getTotalDuration()} minutes
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {procedure.procedure_steps?.length || 0} steps
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span>{calculateProgress()}%</span>
                </div>
                <Progress value={calculateProgress()} className="h-2" />
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="p-6 space-y-6">
            
            {/* Procedure Steps */}
            <Card>
              <Collapsible 
                open={expandedSections.steps} 
                onOpenChange={() => toggleSection('steps')}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {expandedSections.steps ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        Procedure Steps
                        <Badge variant="secondary">
                          {procedure.procedure_steps?.length || 0}
                        </Badge>
                      </CardTitle>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-3">
                    {procedure.procedure_steps && Array.isArray(procedure.procedure_steps) && 
                      procedure.procedure_steps.map((step, index) => {
                        const stepId = `step-${index}`;
                        const isCompleted = isStepCompleted(stepId);
                        
                        return (
                          <Card 
                            key={stepId} 
                            className={cn(
                              "transition-all duration-200 hover:shadow-md cursor-pointer",
                              isCompleted && "bg-green-50 border-green-200"
                            )}
                            onClick={() => toggleStep(stepId)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 mt-1">
                                  {isCompleted ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-gray-400" />
                                  )}
                                </div>
                                
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm text-primary">
                                      Step {index + 1}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {step.estimated_minutes || 5}m
                                    </Badge>
                                  </div>
                                  
                                  <h4 className={cn(
                                    "font-medium",
                                    isCompleted && "line-through text-muted-foreground"
                                  )}>
                                    {step.title || step.step_title || `Step ${index + 1}`}
                                  </h4>
                                  
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {step.description || step.step_description || 'No description available'}
                                  </p>
                                  
                                  {step.warning && (
                                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
                                      <p className="text-sm text-yellow-800">{step.warning}</p>
                                    </div>
                                  )}
                                  
                                  {step.tip && (
                                    <div className="flex items-start gap-2 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
                                      <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                                      <p className="text-sm text-blue-800">{step.tip}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
                    }
                    
                    {(!procedure.procedure_steps || !Array.isArray(procedure.procedure_steps) || procedure.procedure_steps.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No procedure steps available</p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Visual Guides */}
            {procedure.visual_guides && Array.isArray(procedure.visual_guides) && procedure.visual_guides.length > 0 && (
              <Card>
                <Collapsible 
                  open={expandedSections.guides} 
                  onOpenChange={() => toggleSection('guides')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {expandedSections.guides ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                          <ImageIcon className="w-5 h-5" />
                          Visual Guides
                          <Badge variant="secondary">
                            {procedure.visual_guides.length}
                          </Badge>
                        </CardTitle>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {procedure.visual_guides.map((guide, index) => (
                          <Card key={index} className="overflow-hidden">
                            <CardContent className="p-0">
                              {guide.image_url && (
                                <img 
                                  src={guide.image_url} 
                                  alt={guide.title || `Visual guide ${index + 1}`}
                                  className="w-full h-48 object-cover"
                                />
                              )}
                              <div className="p-4">
                                <h5 className="font-medium mb-2">
                                  {guide.title || `Visual Guide ${index + 1}`}
                                </h5>
                                <p className="text-sm text-muted-foreground">
                                  {guide.description || 'No description available'}
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Additional Resources */}
            {procedure.additional_resources && Array.isArray(procedure.additional_resources) && procedure.additional_resources.length > 0 && (
              <Card>
                <Collapsible 
                  open={expandedSections.resources} 
                  onOpenChange={() => toggleSection('resources')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          {expandedSections.resources ? (
                            <ChevronDown className="w-5 h-5" />
                          ) : (
                            <ChevronRight className="w-5 h-5" />
                          )}
                          <ExternalLink className="w-5 h-5" />
                          Additional Resources
                          <Badge variant="secondary">
                            {procedure.additional_resources.length}
                          </Badge>
                        </CardTitle>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                      {procedure.additional_resources.map((resource, index) => (
                        <Card key={index} className="hover:shadow-sm transition-shadow">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="space-y-1">
                              <h5 className="font-medium">
                                {resource.title || `Resource ${index + 1}`}
                              </h5>
                              <p className="text-sm text-muted-foreground">
                                {resource.description || 'No description available'}
                              </p>
                            </div>
                            {resource.url && (
                              <Button variant="outline" size="sm" asChild>
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {stepProgress.filter(sp => sp.completed).length} of {procedure.procedure_steps?.length || 0} steps completed
            </div>
            <Button onClick={onClose}>
              Close SOP
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};