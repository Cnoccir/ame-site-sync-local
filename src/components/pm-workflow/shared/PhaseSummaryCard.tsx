import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Target,
  Database,
  Wrench,
  FileText,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { PhaseProgress } from '@/types/pmWorkflow';

interface PhaseSummaryCardProps {
  phaseProgress: PhaseProgress[];
  currentPhase: number;
  onPhaseChange: (phase: 1 | 2 | 3 | 4) => void;
  className?: string;
}

const getPhaseIcon = (phase: number) => {
  switch (phase) {
    case 1: return <Target className="h-5 w-5" />;
    case 2: return <Database className="h-5 w-5" />;
    case 3: return <Wrench className="h-5 w-5" />;
    case 4: return <FileText className="h-5 w-5" />;
    default: return <Circle className="h-5 w-5" />;
  }
};

const getPhaseTitle = (phase: number) => {
  switch (phase) {
    case 1: return 'Site Intelligence';
    case 2: return 'System Discovery';
    case 3: return 'Service Activities';
    case 4: return 'Documentation';
    default: return 'Unknown Phase';
  }
};

const getPhaseDescription = (phase: number) => {
  switch (phase) {
    case 1: return 'Customer info, contacts, access, and safety requirements';
    case 2: return 'BMS discovery, system inventory, and documentation';
    case 3: return 'Service tasks, issues, and maintenance activities';
    case 4: return 'Report generation and documentation delivery';
    default: return '';
  }
};

export const PhaseSummaryCard: React.FC<PhaseSummaryCardProps> = ({
  phaseProgress,
  currentPhase,
  onPhaseChange,
  className = ''
}) => {
  const overallProgress = phaseProgress.reduce((acc, phase) => acc + phase.percentage, 0) / phaseProgress.length;
  const completedPhases = phaseProgress.filter(p => p.completed).length;
  const totalEstimatedTime = phaseProgress.reduce((acc, phase) => acc + phase.estimatedTime, 0);
  const totalActualTime = phaseProgress.reduce((acc, phase) => acc + phase.actualTime, 0);

  return (
    <Card className={`${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            PM Workflow Progress
          </CardTitle>
          <Badge variant={overallProgress === 100 ? 'default' : 'secondary'}>
            {Math.round(overallProgress)}% Complete
          </Badge>
        </div>
        <div className="space-y-2">
          <Progress value={overallProgress} className="h-2" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{completedPhases} of {phaseProgress.length} phases completed</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Est: {totalEstimatedTime}min
              </span>
              {totalActualTime > 0 && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Actual: {totalActualTime}min
                </span>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {phaseProgress.map((phase) => (
          <div key={phase.phase} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  phase.completed ? 'bg-green-100 text-green-600' :
                  phase.phase === currentPhase ? 'bg-blue-100 text-blue-600' :
                  phase.canProceed ? 'bg-yellow-100 text-yellow-600' :
                  'bg-gray-100 text-gray-500'
                }`}>
                  {phase.completed ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    getPhaseIcon(phase.phase)
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">Phase {phase.phase}: {getPhaseTitle(phase.phase)}</h3>
                    {phase.phase === currentPhase && (
                      <Badge variant="outline" className="text-xs">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {getPhaseDescription(phase.phase)}
                  </p>
                </div>
              </div>

              <div className="text-right">
                {phase.completed ? (
                  <Badge className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Complete
                  </Badge>
                ) : phase.canProceed ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPhaseChange(phase.phase as 1 | 2 | 3 | 4)}
                    className="gap-1"
                  >
                    Continue
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                ) : (
                  <Badge variant="secondary">
                    {phase.percentage > 0 ? `${Math.round(phase.percentage)}%` : 'Pending'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Progress bar for incomplete phases */}
            {!phase.completed && (
              <div className="space-y-2">
                <Progress value={phase.percentage} className="h-1.5" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {phase.completedTasks.length} of {phase.requiredTasks.length} tasks completed
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {phase.estimatedTime}min
                  </span>
                </div>
              </div>
            )}

            {/* Task list for current or incomplete phases */}
            {(phase.phase === currentPhase || !phase.completed) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {phase.requiredTasks.map((task, index) => {
                  const isCompleted = phase.completedTasks.includes(task);
                  return (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      {isCompleted ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400" />
                      )}
                      <span className={isCompleted ? 'text-green-700' : 'text-muted-foreground'}>
                        {task}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Show blocking message if can't proceed */}
            {!phase.canProceed && !phase.completed && phase.phase > 1 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                <AlertTriangle className="h-4 w-4" />
                <span>Complete Phase {phase.phase - 1} to unlock this phase</span>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};