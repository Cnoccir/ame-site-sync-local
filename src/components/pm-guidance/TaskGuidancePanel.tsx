import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Customer } from '@/types';
import { sopTaskData, tasksByPhase, getTasksForTier } from '@/data/pm-tasks';
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Wrench
} from 'lucide-react';

interface TaskGuidancePanelProps {
  customer: Customer;
  completedTasks: string[];
  selectedTask: string | null;
  onTaskComplete: (taskId: string) => void;
  onTaskSelect: (taskId: string) => void;
}

export const TaskGuidancePanel = ({
  customer,
  completedTasks,
  selectedTask,
  onTaskComplete,
  onTaskSelect
}: TaskGuidancePanelProps) => {
  const [expandedPhases, setExpandedPhases] = useState<string[]>(['preparation']);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);

  // Get tasks based on customer's service tier
  const availableTasks = getTasksForTier(customer.service_tier);
  const phases = tasksByPhase(availableTasks);

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev =>
      prev.includes(phase)
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(t => t !== taskId)
        : [...prev, taskId]
    );
    onTaskSelect(taskId);
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'preparation': return <Wrench className="h-4 w-4" />;
      case 'assessment': return <AlertCircle className="h-4 w-4" />;
      case 'optimization': return <CheckCircle2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'preparation': return 'Preparation Tasks';
      case 'assessment': return 'System Assessment';
      case 'optimization': return 'Optimization & Documentation';
      default: return phase;
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">PM Task Guidance</h2>
        <p className="text-sm text-muted-foreground">
          Complete tasks systematically based on {customer.service_tier} tier requirements
        </p>
      </div>

      {Object.entries(phases).map(([phase, tasks]) => (
        <Card key={phase} className="overflow-hidden">
          <CardHeader className="p-0">
            <Collapsible
              open={expandedPhases.includes(phase)}
              onOpenChange={() => togglePhase(phase)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto"
                >
                  <div className="flex items-center gap-3">
                    {getPhaseIcon(phase)}
                    <span className="font-medium">{getPhaseLabel(phase)}</span>
                    <Badge variant="outline" className="ml-2">
                      {tasks.filter(t => completedTasks.includes(t.id)).length}/{tasks.length}
                    </Badge>
                  </div>
                  {expandedPhases.includes(phase) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-0">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      isCompleted={completedTasks.includes(task.id)}
                      isExpanded={expandedTasks.includes(task.id)}
                      isSelected={selectedTask === task.id}
                      onToggle={() => toggleTask(task.id)}
                      onComplete={() => onTaskComplete(task.id)}
                    />
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

// TaskCard Component
interface TaskCardProps {
  task: any;
  isCompleted: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onComplete: () => void;
}

const TaskCard = ({
  task,
  isCompleted,
  isExpanded,
  isSelected,
  onToggle,
  onComplete
}: TaskCardProps) => {
  return (
    <div
      className={`border-b last:border-b-0 ${
        isSelected ? 'bg-accent/50' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={onComplete}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-left p-0 h-auto"
              onClick={onToggle}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                    {task.name}
                  </span>
                  {task.sopRef && (
                    <Badge variant="secondary" className="text-xs">
                      {task.sopRef}
                    </Badge>
                  )}
                </div>
                {task.duration && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{task.duration} min</span>
                  </div>
                )}
              </div>
            </Button>

            {isExpanded && (
              <div className="mt-3 space-y-3 pl-2">
                {task.steps && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Quick Steps:</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {task.steps.slice(0, 3).map((step: string, idx: number) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {task.safety && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-xs">
                    <span className="font-medium text-amber-700 dark:text-amber-400">Safety: </span>
                    <span className="text-amber-600 dark:text-amber-300">{task.safety}</span>
                  </div>
                )}

                {task.sopRef && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Open SOP modal/viewer
                      console.log('View SOP:', task.sopRef);
                    }}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View Full SOP
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
