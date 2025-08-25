import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, CheckCircle, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichSOPStep {
  step_number: number;
  content: string;
  references: number[];
  html_content?: string;
}

interface SOPReference {
  ref_number: number;
  url: string;
  title: string;
  display_text?: string;
}

interface RichSOPContentProps {
  steps: RichSOPStep[];
  references: SOPReference[];
  onStepComplete?: (stepNumber: number) => void;
  completedSteps?: Set<number>;
  className?: string;
}

export const RichSOPContent: React.FC<RichSOPContentProps> = ({
  steps,
  references,
  onStepComplete,
  completedSteps = new Set(),
  className
}) => {
  const [expandedRefs, setExpandedRefs] = useState<Set<number>>(new Set());

  const toggleReference = (refNumber: number) => {
    setExpandedRefs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(refNumber)) {
        newSet.delete(refNumber);
      } else {
        newSet.add(refNumber);
      }
      return newSet;
    });
  };

  const renderStepContent = (step: RichSOPStep) => {
    if (!step.content) return null;

    // Convert newlines to <br> tags for proper display, then split by reference markers
    const contentWithBr = step.content.replace(/\n/g, '<br>');
    const parts = contentWithBr.split(/(\[\d+\])/g);
    
    return (
      <div className="space-y-2">
        <div className="text-sm text-foreground leading-relaxed">
          {parts.map((part, index) => {
            const refMatch = part.match(/\[(\d+)\]/);
            if (refMatch) {
              const refNumber = parseInt(refMatch[1]);
              const reference = references.find(ref => ref.ref_number === refNumber);
              
              if (reference) {
                return (
                  <button
                    key={index}
                    onClick={() => toggleReference(refNumber)}
                    className="inline-flex items-center gap-1 text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                    title={reference.title}
                  >
                    [{refNumber}]
                  </button>
                );
              }
            }
            
            // Regular text content with enhanced HTML parsing
            return (
              <span key={index} 
                    dangerouslySetInnerHTML={{ 
                      __html: part
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/→/g, '→') // Preserve arrow characters
                        .replace(/–/g, '–') // Preserve en-dash
                    }} 
              />
            );
          })}
        </div>

        {/* Show expanded reference details */}
        {step.references.map(refNumber => {
          if (!expandedRefs.has(refNumber)) return null;
          
          const reference = references.find(ref => ref.ref_number === refNumber);
          if (!reference) return null;

          return (
            <div key={refNumber} className="mt-2 p-3 bg-muted rounded-lg border-l-4 border-primary">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h5 className="font-medium text-sm text-foreground">
                    Reference {refNumber}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-1 break-all">
                    {reference.title}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(reference.url, '_blank')}
                  className="shrink-0 h-8 px-2"
                >
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => {
        const isCompleted = completedSteps.has(step.step_number);
        
        return (
          <div
            key={step.step_number}
            className={cn(
              "p-4 rounded-lg border transition-all duration-200",
              isCompleted 
                ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800" 
                : "bg-card border-border hover:border-primary/50"
            )}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => onStepComplete?.(step.step_number)}
                className={cn(
                  "mt-1 p-1 rounded-full transition-colors",
                  isCompleted 
                    ? "text-green-600 hover:text-green-700" 
                    : "text-muted-foreground hover:text-primary"
                )}
                disabled={!onStepComplete}
              >
                {isCompleted ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <Circle className="w-5 h-5" />
                )}
              </button>

              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    Step {step.step_number}
                  </Badge>
                  {isCompleted && (
                    <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                      Complete
                    </Badge>
                  )}
                </div>

                {renderStepContent(step)}
              </div>
            </div>
          </div>
        );
      })}

      {/* Reference Legend */}
      {references.length > 0 && (
        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Reference Links
          </h4>
          <div className="grid gap-2">
            {references.map(ref => (
              <div key={ref.ref_number} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  [{ref.ref_number}] {ref.display_text || ref.title}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(ref.url, '_blank')}
                  className="h-6 px-2 text-xs"
                >
                  Open <ExternalLink className="w-3 h-3 ml-1" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};