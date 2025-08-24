import React, { useState, useEffect } from 'react';
import { 
  X, 
  Clock, 
  CheckCircle, 
  Circle, 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  ExternalLink,
  AlertTriangle,
  Target,
  Lightbulb,
  Navigation,
  Shield,
  BookOpen,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SOPData {
  id: string;
  sop_id: string;
  title: string;
  goal: string;
  steps: any[];
  best_practices: string;
  tools_required: any[];
  hyperlinks: any[];
  estimated_duration_minutes: number;
}

interface TaskData {
  id: string;
  task_id: string;
  task_name: string;
  sop_steps: string;
  quality_checks: string;
  navigation_path: string;
  safety_notes: string;
  skills_required: string;
  duration_minutes: number;
}

interface EnhancedSOPModalProps {
  sopData: SOPData | null;
  taskData: TaskData;
  onClose: () => void;
}

interface StepProgress {
  stepId: string;
  completed: boolean;
}

export const EnhancedSOPModal: React.FC<EnhancedSOPModalProps> = ({
  sopData,
  taskData,
  onClose
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    objective: true,
    steps: true,
    navigation: true,
    quality: true,
    practices: false,
    safety: true,
    tools: false,
    references: false
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

  const parseSteps = (stepString: string) => {
    if (!stepString) return [];
    return stepString.split('|').map((step, index) => ({
      id: `step-${index}`,
      number: index + 1,
      title: step.trim(),
      description: step.trim(),
      estimatedMinutes: Math.ceil(taskData.duration_minutes / stepString.split('|').length)
    }));
  };

  const parseQualityChecks = (checksString: string) => {
    if (!checksString) return [];
    return checksString.split('|').map(check => check.trim()).filter(Boolean);
  };

  const parseBestPractices = (practicesString: string) => {
    if (!practicesString) return [];
    return practicesString.split('|').map(practice => practice.trim()).filter(Boolean);
  };

  const parseHyperlinks = (links: any[]) => {
    if (!Array.isArray(links)) return [];
    return links.map(link => ({
      title: link.title || link.name || 'Documentation Link',
      url: link.url || link.href || '#',
      description: link.description || 'External documentation'
    }));
  };

  const steps = parseSteps(taskData.sop_steps);
  const qualityChecks = parseQualityChecks(taskData.quality_checks);
  const bestPractices = parseBestPractices(sopData?.best_practices || '');
  const hyperlinks = parseHyperlinks(sopData?.hyperlinks || []);

  const calculateProgress = () => {
    return steps.length > 0 ? (stepProgress.filter(sp => sp.completed).length / steps.length) * 100 : 0;
  };

  const getTotalDuration = () => {
    return sopData?.estimated_duration_minutes || taskData.duration_minutes || 30;
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const progress = calculateProgress();

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-background rounded-lg shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b p-6 z-10">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold">{taskData.task_name} - Complete SOP</h2>
              </div>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                <Badge variant="outline">{taskData.task_id}</Badge>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {getTotalDuration()} minutes
                </div>
                <div className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {steps.length} steps
                </div>
                {taskData.skills_required && (
                  <Badge variant="secondary" className="text-xs">
                    {taskData.skills_required}
                  </Badge>
                )}
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>SOP Progress</span>
                  <span>{Math.round(progress)}% complete</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </div>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-200px)]">
          <div className="p-6 space-y-6">
            
            {/* Objective/Goal */}
            {(sopData?.goal || taskData.task_name) && (
              <Card>
                <Collapsible 
                  open={expandedSections.objective} 
                  onOpenChange={() => toggleSection('objective')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center gap-2">
                        {expandedSections.objective ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <Target className="w-5 h-5 text-primary" />
                        Objective & Goal
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent>
                      <p className="text-base leading-relaxed">
                        {sopData?.goal || `Complete the ${taskData.task_name} procedure following all safety protocols and quality standards.`}
                      </p>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Navigation Path */}
            {taskData.navigation_path && (
              <Card>
                <Collapsible 
                  open={expandedSections.navigation} 
                  onOpenChange={() => toggleSection('navigation')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center gap-2">
                        {expandedSections.navigation ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <Navigation className="w-5 h-5 text-info" />
                        Navigation Path
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent>
                      <div className="bg-info/10 border border-info/20 rounded-lg p-4">
                        <p className="font-mono text-sm">{taskData.navigation_path}</p>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Complete Step-by-Step Procedure */}
            <Card>
              <Collapsible 
                open={expandedSections.steps} 
                onOpenChange={() => toggleSection('steps')}
              >
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <CardTitle className="flex items-center gap-2">
                      {expandedSections.steps ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                      <BookOpen className="w-5 h-5 text-primary" />
                      Complete Procedure Steps
                      <Badge variant="secondary">
                        {steps.length} steps
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-3">
                    {steps.map((step) => {
                      const isCompleted = isStepCompleted(step.id);
                      
                      return (
                        <Card 
                          key={step.id} 
                          className={cn(
                            "transition-all duration-200 hover:shadow-md cursor-pointer",
                            isCompleted && "bg-success/5 border-success/20"
                          )}
                          onClick={() => toggleStep(step.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 mt-1">
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-success" />
                                ) : (
                                  <Circle className="w-5 h-5 text-muted-foreground" />
                                )}
                              </div>
                              
                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    Step {step.number}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    ~{step.estimatedMinutes}m
                                  </Badge>
                                </div>
                                
                                <p className={cn(
                                  "text-sm leading-relaxed",
                                  isCompleted && "line-through text-muted-foreground"
                                )}>
                                  {step.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                    
                    {steps.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No procedure steps available</p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>

            {/* Quality Checks & Verification Points */}
            {qualityChecks.length > 0 && (
              <Card>
                <Collapsible 
                  open={expandedSections.quality} 
                  onOpenChange={() => toggleSection('quality')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center gap-2">
                        {expandedSections.quality ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <CheckCircle className="w-5 h-5 text-success" />
                        Quality Checks & Verification
                        <Badge variant="secondary">
                          {qualityChecks.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                      {qualityChecks.map((check, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-success/5 rounded-lg border border-success/20">
                          <CheckCircle className="w-5 h-5 text-success mt-0.5" />
                          <p className="text-sm">{check}</p>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Safety Requirements */}
            {taskData.safety_notes && (
              <Card>
                <Collapsible 
                  open={expandedSections.safety} 
                  onOpenChange={() => toggleSection('safety')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center gap-2">
                        {expandedSections.safety ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <Shield className="w-5 h-5 text-warning" />
                        Safety Requirements
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent>
                      <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                          <p className="text-sm">{taskData.safety_notes}</p>
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Best Practices */}
            {bestPractices.length > 0 && (
              <Card>
                <Collapsible 
                  open={expandedSections.practices} 
                  onOpenChange={() => toggleSection('practices')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center gap-2">
                        {expandedSections.practices ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <Star className="w-5 h-5 text-yellow-600" />
                        Best Practices
                        <Badge variant="secondary">
                          {bestPractices.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                      {bestPractices.map((practice, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                          <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                          <p className="text-sm">{practice}</p>
                        </div>
                      ))}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Required Tools */}
            {sopData?.tools_required && Array.isArray(sopData.tools_required) && sopData.tools_required.length > 0 && (
              <Card>
                <Collapsible 
                  open={expandedSections.tools} 
                  onOpenChange={() => toggleSection('tools')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center gap-2">
                        {expandedSections.tools ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <Target className="w-5 h-5 text-blue-600" />
                        Required Tools
                        <Badge variant="secondary">
                          {sopData.tools_required.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {sopData.tools_required.map((tool, index) => (
                          <Badge key={index} variant="outline" className="justify-start p-2">
                            {typeof tool === 'string' ? tool : tool.name || 'Tool'}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            )}

            {/* Reference Documentation Links */}
            {hyperlinks.length > 0 && (
              <Card>
                <Collapsible 
                  open={expandedSections.references} 
                  onOpenChange={() => toggleSection('references')}
                >
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                      <CardTitle className="flex items-center gap-2">
                        {expandedSections.references ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                        <ExternalLink className="w-5 h-5 text-blue-600" />
                        Reference Documentation
                        <Badge variant="secondary">
                          {hyperlinks.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="space-y-3">
                      {hyperlinks.map((link, index) => (
                        <Card key={index} className="hover:shadow-sm transition-shadow">
                          <CardContent className="flex items-center justify-between p-4">
                            <div className="space-y-1">
                              <h5 className="font-medium">{link.title}</h5>
                              <p className="text-sm text-muted-foreground">{link.description}</p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={link.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
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
              {stepProgress.filter(sp => sp.completed).length} of {steps.length} steps completed • 
              Press <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Esc</kbd> to close
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