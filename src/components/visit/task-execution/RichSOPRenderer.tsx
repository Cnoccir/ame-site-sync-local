import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronRight, 
  ExternalLink, 
  CheckCircle,
  Circle,
  FileText,
  Target,
  Lightbulb,
  Shield,
  Navigation,
  Wrench
} from 'lucide-react';
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
}

interface SOPData {
  id: string;
  title: string;
  category?: string;
  goal?: string;
  steps?: RichSOPStep[];
  best_practices?: string;
  hyperlinks?: SOPReference[];
  tools_required?: string[];
  estimated_duration_minutes?: number;
}

interface StepProgress {
  stepNumber: number;
  completed: boolean;
}

interface RichSOPRendererProps {
  sopData: SOPData;
  onStepComplete?: (stepNumber: number) => void;
  completedSteps?: number[];
}

export const RichSOPRenderer: React.FC<RichSOPRendererProps> = ({
  sopData,
  onStepComplete,
  completedSteps = []
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    objective: true,
    steps: true,
    practices: false,
    tools: false,
    references: false
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleStepToggle = (stepNumber: number) => {
    if (onStepComplete) {
      onStepComplete(stepNumber);
    }
  };

  const renderStepContent = (step: RichSOPStep) => {
    if (!step.content) return null;

    // Replace reference numbers [1], [2] with clickable links
    let content = step.content;
    const refRegex = /\[(\d+)\]/g;
    
    return (
      <div className="prose prose-sm max-w-none">
        {content.split(refRegex).map((part, index) => {
          // If it's a number (reference), make it clickable
          if (index % 2 === 1) {
            const refNum = parseInt(part);
            const reference = sopData.hyperlinks?.find(ref => ref.ref_number === refNum);
            if (reference) {
              return (
                <Button
                  key={index}
                  variant="link"
                  size="sm"
                  className="h-auto p-0 mx-1 text-primary hover:underline"
                  onClick={() => window.open(reference.url, '_blank')}
                >
                  [{refNum}]
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

  const calculateProgress = () => {
    if (!sopData.steps?.length) return 0;
    return (completedSteps.length / sopData.steps.length) * 100;
  };

  return (
    <div className="space-y-4">
      {/* Header with progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{sopData.title}</h2>
          {sopData.category && (
            <Badge variant="outline">{sopData.category}</Badge>
          )}
        </div>
        
        {sopData.steps && sopData.steps.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Progress: {completedSteps.length} of {sopData.steps.length} steps</span>
              <span>{Math.round(calculateProgress())}% complete</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        )}
      </div>

      {/* Objective/Goal Section */}
      {sopData.goal && (
        <Card>
          <Collapsible open={expandedSections.objective} onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, objective: open }))}>
            <CollapsibleTrigger asChild>
              <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Objective</h3>
                  </div>
                  {expandedSections.objective ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  {sopData.goal}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Procedure Steps */}
      {sopData.steps && sopData.steps.length > 0 && (
        <Card>
          <Collapsible open={expandedSections.steps} onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, steps: open }))}>
            <CollapsibleTrigger asChild>
              <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Procedure Steps</h3>
                    <Badge variant="secondary">{sopData.steps.length}</Badge>
                  </div>
                  {expandedSections.steps ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="space-y-4">
                  {sopData.steps.map((step) => {
                    const isCompleted = completedSteps.includes(step.step_number);
                    return (
                      <div key={step.step_number} className="flex gap-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-0 h-auto"
                          onClick={() => handleStepToggle(step.step_number)}
                        >
                          {isCompleted ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-muted-foreground" />
                          )}
                        </Button>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Step {step.step_number}
                            </Badge>
                          </div>
                          <div className={cn(
                            "transition-opacity",
                            isCompleted && "opacity-60 line-through"
                          )}>
                            {renderStepContent(step)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Best Practices */}
      {sopData.best_practices && (
        <Card>
          <Collapsible open={expandedSections.practices} onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, practices: open }))}>
            <CollapsibleTrigger asChild>
              <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Best Practices</h3>
                  </div>
                  {expandedSections.practices ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="prose prose-sm max-w-none text-muted-foreground">
                  {sopData.best_practices.split('<br>').map((practice, index) => (
                    <div key={index} className="mb-2" dangerouslySetInnerHTML={{ __html: practice.trim() }} />
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Tools Required */}
      {sopData.tools_required && sopData.tools_required.length > 0 && (
        <Card>
          <Collapsible open={expandedSections.tools} onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, tools: open }))}>
            <CollapsibleTrigger asChild>
              <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Required Tools</h3>
                    <Badge variant="secondary">{sopData.tools_required.length}</Badge>
                  </div>
                  {expandedSections.tools ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="flex flex-wrap gap-2">
                  {sopData.tools_required.map((tool, index) => (
                    <Badge key={index} variant="outline">{tool}</Badge>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Reference Links */}
      {sopData.hyperlinks && sopData.hyperlinks.length > 0 && (
        <Card>
          <Collapsible open={expandedSections.references} onOpenChange={(open) => setExpandedSections(prev => ({ ...prev, references: open }))}>
            <CollapsibleTrigger asChild>
              <CardContent className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">Reference Links</h3>
                    <Badge variant="secondary">{sopData.hyperlinks.length}</Badge>
                  </div>
                  {expandedSections.references ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </CardContent>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 px-4 pb-4">
                <div className="space-y-2">
                  {sopData.hyperlinks.map((link) => (
                    <div key={link.ref_number} className="flex items-center gap-3 p-2 rounded border">
                      <Badge variant="outline" className="text-xs min-w-8 justify-center">
                        {link.ref_number}
                      </Badge>
                      <Button
                        variant="link"
                        className="h-auto p-0 text-left justify-start flex-1"
                        onClick={() => window.open(link.url, '_blank')}
                      >
                        <span className="truncate">{link.title || link.url}</span>
                        <ExternalLink className="w-3 h-3 ml-1 flex-shrink-0" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
};