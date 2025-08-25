import { ReactNode } from 'react';
import { ChevronDown, ChevronRight, Clock, CheckCircle2, Circle, Play, AlertTriangle, SkipForward } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProtocolStepProps {
  stepNumber: number;
  title: string;
  duration: number; // in minutes
  status: 'pending' | 'active' | 'completed' | 'skipped';
  isExpanded: boolean;
  onToggle: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onSkip?: () => void;
  children: ReactNode;
  canStart?: boolean;
  canComplete?: boolean;
  canSkip?: boolean;
}

export const ProtocolStep = ({
  stepNumber,
  title,
  duration,
  status,
  isExpanded,
  onToggle,
  onStart,
  onComplete,
  onSkip,
  children,
  canStart = true,
  canComplete = false,
  canSkip = false
}: ProtocolStepProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-success" />;
      case 'active':
        return <Play className="w-6 h-6 text-primary" />;
      case 'skipped':
        return <AlertTriangle className="w-6 h-6 text-warning" />;
      default:
        return <Circle className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      pending: 'secondary',
      active: 'default',
      completed: 'default',
      skipped: 'destructive'
    } as const;

    return (
      <Badge variant={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getStepCircle = () => {
    const baseClasses = "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium";
    
    switch (status) {
      case 'completed':
        return <div className={`${baseClasses} bg-success text-success-foreground`}>{stepNumber}</div>;
      case 'active':
        return <div className={`${baseClasses} bg-primary text-primary-foreground`}>{stepNumber}</div>;
      case 'skipped':
        return <div className={`${baseClasses} bg-warning text-warning-foreground`}>{stepNumber}</div>;
      default:
        return <div className={`${baseClasses} bg-muted text-muted-foreground`}>{stepNumber}</div>;
    }
  };

  return (
    <Card className={`transition-all duration-200 ${status === 'active' ? 'border-primary shadow-md' : status === 'skipped' ? 'border-warning bg-warning/5' : ''}`}>
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-4">
              {getStepCircle()}
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-medium">{title}</h3>
                  {getStatusBadge()}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>{duration} minutes</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Start button in header for better UX */}
                {status === 'pending' && canStart && onStart && (
                  <Button onClick={onStart} size="sm" variant="outline">
                    <Play className="w-4 h-4 mr-1" />
                    Start
                  </Button>
                )}
                {status === 'active' && canComplete && onComplete && (
                  <Button onClick={onComplete} size="sm">
                    Complete
                  </Button>
                )}
                {getStatusIcon()}
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-4 pb-4 pt-0 border-t bg-muted/30">
            <div className="py-4">
              {children}
            </div>
            
            <div className="flex gap-2 justify-end">
              {/* Always show skip option for active steps */}
              {status === 'active' && onSkip && (
                <Button onClick={onSkip} variant="outline" className="text-warning hover:text-warning">
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip Step
                </Button>
              )}
              {status === 'skipped' && onStart && (
                <Button onClick={onStart} variant="outline">
                  Return to Step
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};