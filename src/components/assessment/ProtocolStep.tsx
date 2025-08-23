import { ReactNode } from 'react';
import { ChevronDown, ChevronRight, Clock, CheckCircle2, Circle, Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ProtocolStepProps {
  stepNumber: number;
  title: string;
  duration: number; // in minutes
  status: 'pending' | 'active' | 'completed';
  isExpanded: boolean;
  onToggle: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  children: ReactNode;
  canStart?: boolean;
  canComplete?: boolean;
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
  children,
  canStart = true,
  canComplete = false
}: ProtocolStepProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-success" />;
      case 'active':
        return <Play className="w-6 h-6 text-primary" />;
      default:
        return <Circle className="w-6 h-6 text-muted-foreground" />;
    }
  };

  const getStatusBadge = () => {
    const variants = {
      pending: 'secondary',
      active: 'default',
      completed: 'default'
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
      default:
        return <div className={`${baseClasses} bg-muted text-muted-foreground`}>{stepNumber}</div>;
    }
  };

  return (
    <Card className={`transition-all duration-200 ${status === 'active' ? 'border-primary shadow-md' : ''}`}>
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
              {status === 'pending' && canStart && onStart && (
                <Button onClick={onStart} variant="outline">
                  Start Step
                </Button>
              )}
              {status === 'active' && canComplete && onComplete && (
                <Button onClick={onComplete}>
                  Complete Step
                </Button>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};