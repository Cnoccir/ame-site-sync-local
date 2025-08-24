import React from 'react';
import { Clock, CheckCircle, Play, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface ServiceTierTask {
  id: string;
  service_tier: string;
  category: string;
  task_name: string;
  description: string;
  estimated_duration: number;
  is_required: boolean;
  prerequisites: string[];
  tools_required: string[];
  sort_order: number;
}

interface VisitTask {
  id: string;
  visit_id: string;
  task_id: string;
  status: string;
  start_time?: string;
  completion_time?: string;
  actual_duration?: number;
  notes?: string;
}

interface TaskStats {
  total: number;
  completed: number;
  totalDuration: number;
  completedDuration: number;
  percentage: number;
}

interface TaskListPanelProps {
  tasks: ServiceTierTask[];
  visitTasks: VisitTask[];
  stats: TaskStats;
  onTaskSelect: (task: ServiceTierTask) => void;
  selectedTaskId?: string;
  taskTimers: Record<string, number>;
}

export const TaskListPanel: React.FC<TaskListPanelProps> = ({
  tasks,
  visitTasks,
  stats,
  onTaskSelect,
  selectedTaskId,
  taskTimers
}) => {
  const getTaskStatus = (task: ServiceTierTask): string => {
    const visitTask = visitTasks.find(vt => vt.task_id === task.id);
    return visitTask?.status || 'not_started';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Play className="w-4 h-4 text-blue-600" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-yellow-600" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'skipped':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Group tasks by category
  const tasksByCategory = tasks.reduce((acc, task) => {
    if (!acc[task.category]) {
      acc[task.category] = [];
    }
    acc[task.category].push(task);
    return acc;
  }, {} as Record<string, ServiceTierTask[]>);

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Service Tasks</CardTitle>
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span>Progress: {stats.completed} of {stats.total} tasks</span>
            <span>{stats.percentage}%</span>
          </div>
          <Progress value={stats.percentage} className="h-2" />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Est. Duration: {Math.round(stats.totalDuration / 60)}h {stats.totalDuration % 60}m</span>
            <span>Completed: {Math.round(stats.completedDuration / 60)}h {stats.completedDuration % 60}m</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          {Object.entries(tasksByCategory).map(([category, categoryTasks]) => (
            <div key={category} className="border-b last:border-b-0">
              <div className="p-4 bg-muted/30 border-b">
                <h4 className="font-medium text-sm">{category}</h4>
                <p className="text-xs text-muted-foreground">
                  {categoryTasks.length} task{categoryTasks.length !== 1 ? 's' : ''}
                </p>
              </div>
              
              <div className="space-y-0">
                {categoryTasks.map((task) => {
                  const status = getTaskStatus(task);
                  const isSelected = selectedTaskId === task.id;
                  const isRunning = taskTimers[task.id];
                  
                  return (
                    <button
                      key={task.id}
                      onClick={() => onTaskSelect(task)}
                      className={cn(
                        'w-full p-3 text-left border-b last:border-b-0 hover:bg-muted/50 transition-colors',
                        isSelected && 'bg-muted border-l-4 border-l-primary',
                        status === 'completed' && 'opacity-75'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-1">
                          {getStatusIcon(status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {task.task_name}
                            </span>
                            {isRunning && (
                              <Badge variant="secondary" className="text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                Running
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={cn('text-xs', getStatusColor(status))}
                            >
                              {status.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {task.estimated_duration}m
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};