import React from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertTriangle,
  Save,
  Wifi,
  WifiOff,
  Target,
  Database,
  Wrench,
  FileText,
  ChevronRight,
  Play
} from 'lucide-react';
import { PhaseProgress, NavigationState } from '@/types/pmWorkflow';

// Export the new components
export { PhaseSummaryCard } from './PhaseSummaryCard';
export { PhaseCompletionSummary } from './PhaseCompletionSummary';
export { PhaseDataReview } from './PhaseDataReview';
export { CompactPhaseReview } from './CompactPhaseReview';
export { generatePhaseReviewSections } from './PhaseReviewHelper';
export { SimplePhasePreview } from './SimplePhasePreview';
export { PhaseReviewModal } from './PhaseReviewModal';
export { generatePhaseModalSections, getPhaseTitle } from './PhaseModalHelper';
export { PhaseOverviewBar, generatePhaseSummary } from './PhaseOverviewBar';

// =====================================
// Phase Navigation Component
// =====================================
interface PhaseNavigationProps {
  currentPhase: 1 | 2 | 3 | 4;
  phaseProgress: PhaseProgress[];
  onPhaseChange: (phase: 1 | 2 | 3 | 4) => void;
  navigationState: NavigationState;
}

export const PhaseNavigation: React.FC<PhaseNavigationProps> = ({
  currentPhase,
  phaseProgress,
  onPhaseChange,
  navigationState
}) => {
  const getPhaseIcon = (phase: number) => {
    switch (phase) {
      case 1: return <Target className="h-4 w-4" />;
      case 2: return <Database className="h-4 w-4" />;
      case 3: return <Wrench className="h-4 w-4" />;
      case 4: return <FileText className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  const canNavigateToPhase = (targetPhase: number): boolean => {
    if (targetPhase === 1) return true;
    if (targetPhase <= currentPhase) return true; // Can go back
    
    // Can only advance if previous phase is completed
    const previousPhase = phaseProgress.find(p => p.phase === targetPhase - 1);
    return previousPhase?.status === 'completed';
  };

  const getPhaseStatus = (phase: number) => {
    const phaseData = phaseProgress.find(p => p.phase === phase);
    if (!phaseData) return 'pending';
    return phaseData.status;
  };

  return (
    <div className="flex items-center justify-between">
      <Tabs value={currentPhase.toString()} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-transparent p-0 h-auto">
          {[1, 2, 3, 4].map((phase) => {
            const phaseData = phaseProgress.find(p => p.phase === phase);
            const status = getPhaseStatus(phase);
            const canNavigate = canNavigateToPhase(phase);
            
            return (
              <TabsTrigger
                key={phase}
                value={phase.toString()}
                onClick={() => canNavigate && onPhaseChange(phase as 1 | 2 | 3 | 4)}
                disabled={!canNavigate}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-lg transition-all
                  ${currentPhase === phase 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : canNavigate 
                      ? 'hover:bg-accent hover:text-accent-foreground' 
                      : 'opacity-50 cursor-not-allowed'
                  }
                  ${status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : ''}
                `}
              >
                <div className="flex items-center gap-2">
                  {status === 'completed' ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : status === 'active' ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    getPhaseIcon(phase)
                  )}
                  
                  <div className="text-left">
                    <div className="font-medium text-sm">
                      Phase {phase}
                    </div>
                    <div className="text-xs opacity-75">
                      {phaseData?.name || 'Unknown'}
                    </div>
                  </div>
                  
                  {phaseData && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {Math.round(phaseData.currentPercentage)}%
                    </Badge>
                  )}
                </div>
                
                {phase < 4 && (
                  <ChevronRight className="h-3 w-3 opacity-50 ml-2" />
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>
    </div>
  );
};

// =====================================
// Progress Tracker Component  
// =====================================
interface ProgressTrackerProps {
  phaseProgress: PhaseProgress[];
  currentPhase: 1 | 2 | 3 | 4;
  onPhaseClick?: (phase: 1 | 2 | 3 | 4) => void;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  phaseProgress,
  currentPhase,
  onPhaseClick
}) => {
  const overallProgress = phaseProgress.reduce((acc, phase) => {
    return acc + (phase.currentPercentage * phase.targetPercentage / 100);
  }, 0);

  const completedPhases = phaseProgress.filter(p => p.status === 'completed').length;
  const totalPhases = phaseProgress.length;

  return (
    <div className="space-y-3">
      {/* Overall Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span className="font-medium">Overall Progress</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">
              Phase {currentPhase} of {totalPhases}
            </span>
            <span className="font-medium">
              {Math.round(overallProgress)}%
            </span>
          </div>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      {/* Phase Progress Indicators */}
      <div className="flex items-center justify-between">
        {phaseProgress.map((phase, index) => (
          <React.Fragment key={phase.phase}>
            <div
              className={`flex flex-col items-center cursor-pointer transition-all ${
                onPhaseClick ? 'hover:scale-105' : ''
              }`}
              onClick={() => onPhaseClick && onPhaseClick(phase.phase as 1 | 2 | 3 | 4)}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center border-2 mb-1
                ${phase.status === 'completed' 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : phase.status === 'active'
                    ? 'bg-primary border-primary text-primary-foreground'
                    : 'bg-background border-muted-foreground text-muted-foreground'
                }
              `}>
                {phase.status === 'completed' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{phase.phase}</span>
                )}
              </div>
              <span className="text-xs text-center max-w-20">
                {phase.name}
              </span>
              <span className="text-xs text-muted-foreground">
                {Math.round(phase.currentPercentage)}%
              </span>
            </div>
            
            {index < phaseProgress.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${
                phase.status === 'completed' ? 'bg-green-500' : 'bg-muted'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

// =====================================
// Auto-Save Indicator Component
// =====================================
interface AutoSaveIndicatorProps {
  enabled: boolean;
  lastSaved: Date;
  unsavedChanges: boolean;
  onToggle?: () => void;
}

export const AutoSaveIndicator: React.FC<AutoSaveIndicatorProps> = ({
  enabled,
  lastSaved,
  unsavedChanges,
  onToggle
}) => {
  const formatLastSaved = (date: Date): string => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="h-8 px-2 gap-1"
        disabled={!onToggle}
      >
        {enabled ? (
          <Wifi className="h-3 w-3 text-green-600" />
        ) : (
          <WifiOff className="h-3 w-3 text-muted-foreground" />
        )}
        <span className="text-xs">
          {enabled ? 'Auto-save' : 'Manual'}
        </span>
      </Button>
      
      <div className="text-xs text-muted-foreground">
        {unsavedChanges ? (
          <div className="flex items-center gap-1">
            <Circle className="h-2 w-2 fill-orange-500 text-orange-500" />
            <span>Unsaved changes</span>
          </div>
        ) : (
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span>Saved {formatLastSaved(lastSaved)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================
// Phase Header Component
// =====================================
interface PhaseHeaderProps {
  phase: 1 | 2 | 3 | 4;
  title: string;
  description: string;
  progress: number;
  requiredTasks?: string[];
  completedTasks?: string[];
  estimatedTime?: number;
  actualTime?: number;
  blockers?: string[];
}

export const PhaseHeader: React.FC<PhaseHeaderProps> = ({
  phase,
  title,
  description,
  progress,
  requiredTasks = [],
  completedTasks = [],
  estimatedTime,
  actualTime,
  blockers = []
}) => {
  const getPhaseIcon = () => {
    switch (phase) {
      case 1: return <Target className="h-5 w-5" />;
      case 2: return <Database className="h-5 w-5" />;
      case 3: return <Wrench className="h-5 w-5" />;
      case 4: return <FileText className="h-5 w-5" />;
    }
  };

  const completionRate = requiredTasks.length > 0 
    ? (completedTasks.length / requiredTasks.length) * 100 
    : progress;

  return (
    <div className="bg-white dark:bg-gray-950 border-b px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            {getPhaseIcon()}
          </div>
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-primary">
            {Math.round(completionRate)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {completedTasks.length} of {requiredTasks.length} complete
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <span className="text-muted-foreground">Progress:</span>
          <div className="mt-1">
            <Progress value={completionRate} className="h-2" />
          </div>
        </div>
        
        {estimatedTime && (
          <div>
            <span className="text-muted-foreground">Est. Time:</span>
            <div className="font-medium">{estimatedTime} min</div>
          </div>
        )}
        
        {actualTime && (
          <div>
            <span className="text-muted-foreground">Actual Time:</span>
            <div className="font-medium">{actualTime} min</div>
          </div>
        )}
        
        {blockers.length > 0 && (
          <div>
            <span className="text-muted-foreground">Blockers:</span>
            <div className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-orange-500" />
              <span className="text-orange-600">{blockers.length} issues</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =====================================
// Section Card Wrapper Component
// =====================================
interface SectionCardProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  progress?: number;
  required?: boolean;
  completed?: boolean;
  className?: string;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  title,
  description,
  icon,
  children,
  progress,
  required = false,
  completed = false,
  className = ''
}) => {
  return (
    <div className={`border rounded-lg overflow-hidden ${className}`}>
      <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <div>
              <h3 className="font-medium text-sm">{title}</h3>
              {description && (
                <p className="text-xs text-muted-foreground">{description}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {required && (
              <Badge variant="outline" className="text-xs">
                Required
              </Badge>
            )}
            
            {completed && (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            )}
            
            {progress !== undefined && (
              <Badge variant="secondary" className="text-xs">
                {Math.round(progress)}%
              </Badge>
            )}
          </div>
        </div>
        
        {progress !== undefined && (
          <div className="mt-2">
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        {children}
      </div>
    </div>
  );
};
