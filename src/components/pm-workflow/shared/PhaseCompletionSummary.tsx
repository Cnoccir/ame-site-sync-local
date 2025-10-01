import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  Target,
  Database,
  Wrench,
  FileText,
  Calendar,
  User,
  Building
} from 'lucide-react';
import { PhaseProgress, PMWorkflowSession } from '@/types/pmWorkflow';

interface PhaseCompletionSummaryProps {
  phaseProgress: PhaseProgress[];
  completedPhase: number;
  sessionInfo: PMWorkflowSession;
  onContinueToNext: () => void;
  onViewSummary?: () => void;
  className?: string;
}

const getPhaseIcon = (phase: number) => {
  switch (phase) {
    case 1: return <Target className="h-5 w-5" />;
    case 2: return <Database className="h-5 w-5" />;
    case 3: return <Wrench className="h-5 w-5" />;
    case 4: return <FileText className="h-5 w-5" />;
    default: return <CheckCircle2 className="h-5 w-5" />;
  }
};

const getPhaseTitle = (phase: number) => {
  switch (phase) {
    case 1: return 'Site Intelligence';
    case 2: return 'System Discovery';
    case 3: return 'Service Activities';
    case 4: return 'Documentation';
    default: return 'Phase Complete';
  }
};

const getCompletionMessage = (phase: number) => {
  switch (phase) {
    case 1: return 'Site intelligence gathering is complete. All customer information, contacts, access details, and safety requirements have been documented.';
    case 2: return 'System discovery is complete. BMS platform details and system inventory have been documented.';
    case 3: return 'Service activities are complete. All maintenance tasks and customer priorities have been addressed.';
    case 4: return 'Documentation is complete. Service report has been generated and is ready for delivery.';
    default: return 'Phase completed successfully.';
  }
};

export const PhaseCompletionSummary: React.FC<PhaseCompletionSummaryProps> = ({
  phaseProgress,
  completedPhase,
  sessionInfo,
  onContinueToNext,
  onViewSummary,
  className = ''
}) => {
  const currentPhaseData = phaseProgress.find(p => p.phase === completedPhase);
  const nextPhase = completedPhase < 4 ? completedPhase + 1 : null;
  const isWorkflowComplete = completedPhase === 4;

  return (
    <Card className={`border-green-200 bg-green-50 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-green-100 rounded-full">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-900">
              Phase {completedPhase} Complete: {getPhaseTitle(completedPhase)}
            </h3>
            <p className="text-sm text-green-700">
              {new Date().toLocaleDateString()} • {sessionInfo.technicianName}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="p-4 bg-white rounded-lg border border-green-200">
          <p className="text-sm text-gray-700 mb-3">
            {getCompletionMessage(completedPhase)}
          </p>

          {/* Completed tasks summary */}
          {currentPhaseData && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {currentPhaseData.completedTasks.map((task, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-green-700">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span>{task}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Session info summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Building className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              {sessionInfo.customerName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              {sessionInfo.technicianName}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-gray-600">
              {new Date(sessionInfo.startTime).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            {currentPhaseData && (
              <>
                <Badge className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  100% Complete
                </Badge>
                {currentPhaseData.actualTime > 0 && (
                  <Badge variant="outline" className="text-green-700 border-green-300">
                    <Clock className="h-3 w-3 mr-1" />
                    {currentPhaseData.actualTime}min
                  </Badge>
                )}
              </>
            )}
          </div>

          <div className="flex gap-2">
            {onViewSummary && (
              <Button variant="outline" size="sm" onClick={onViewSummary}>
                View Summary
              </Button>
            )}

            {!isWorkflowComplete && nextPhase && (
              <Button onClick={onContinueToNext} className="gap-2">
                Continue to Phase {nextPhase}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}

            {isWorkflowComplete && (
              <Button className="gap-2 bg-green-600 hover:bg-green-700">
                <FileText className="h-4 w-4" />
                View Final Report
              </Button>
            )}
          </div>
        </div>

        {/* Next phase preview */}
        {!isWorkflowComplete && nextPhase && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm">
              <div className="p-1 bg-blue-100 rounded">
                {getPhaseIcon(nextPhase)}
              </div>
              <span className="font-medium text-blue-900">
                Next: Phase {nextPhase} - {getPhaseTitle(nextPhase)}
              </span>
            </div>
            <p className="text-xs text-blue-700 mt-1">
              Ready to begin the next phase of your PM workflow.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};