import React, { useState } from 'react';
import { Clock, CheckCircle, Play, AlertCircle, ChevronDown, ChevronRight, Target, Trophy } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

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

interface ModernTaskListProps {
  tasks: ServiceTierTask[];
  visitTasks: VisitTask[];
  stats: TaskStats;
  onTaskSelect: (task: ServiceTierTask) => void;
  onTaskStart: (task: ServiceTierTask) => void;
  onTaskComplete: (task: ServiceTierTask) => void;
  onViewSOP: (task: ServiceTierTask) => void;
  selectedTaskId?: string;
  taskTimers: Record<string, number>;
}

export const ModernTaskList: React.FC<ModernTaskListProps> = ({
  tasks,
  visitTasks,
  stats,
  onTaskSelect,
  onTaskStart,
  onTaskComplete,
  onViewSOP,
  selectedTaskId,
  taskTimers
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const getTaskStatus = (task: ServiceTierTask): string => {
    const visitTask = visitTasks.find(vt => vt.task_id === task.id);
    return visitTask?.status || 'not_started';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in_progress':
        return <Play className="w-5 h-5 text-blue-600" />;
      case 'skipped':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'in_progress':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'skipped':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
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

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Service Tasks
            </CardTitle>
            <Badge variant="outline" className="text-sm">
              {stats.completed}/{stats.total} Complete
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Overall Progress</span>
              <span className="text-muted-foreground">{stats.percentage}%</span>
            </div>
            <Progress value={stats.percentage} className="h-3" />
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Est. Duration</span>
              <div className="font-medium">
                {Math.floor(stats.totalDuration / 60)}h {stats.totalDuration % 60}m
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Completed</span>
              <div className="font-medium text-green-600">
                {Math.floor(stats.completedDuration / 60)}h {stats.completedDuration % 60}m
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Categories */}
      <div className="space-y-3">
        {Object.entries(tasksByCategory).map(([category, categoryTasks]) => {
          const categoryCompleted = categoryTasks.filter(task => getTaskStatus(task) === 'completed').length;
          const categoryTotal = categoryTasks.length;
          const categoryProgress = categoryTotal > 0 ? (categoryCompleted / categoryTotal) * 100 : 0;
          const isExpanded = expandedCategories[category] ?? true;

          return (
            <Card key={category} className="overflow-hidden">
              <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category)}>
                <CollapsibleTrigger asChild>
                  <div className="p-4 hover:bg-muted/50 cursor-pointer border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                        <h3 className="font-medium">{category}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {categoryCompleted}/{categoryTotal}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {Math.round(categoryProgress)}%
                      </div>
                    </div>
                    <div className="mt-2 ml-7">
                      <Progress value={categoryProgress} className="h-1.5" />
                    </div>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="space-y-0">
                    {categoryTasks.map((task) => {
                      const status = getTaskStatus(task);
                      const isSelected = selectedTaskId === task.id;
                      const isRunning = taskTimers[task.id];
                      
                      return (
                        <div
                          key={task.id}
                          onClick={() => onTaskSelect(task)}
                          className={cn(
                            'p-4 border-b last:border-b-0 cursor-pointer transition-all duration-200',
                            'hover:bg-muted/30',
                            isSelected && 'bg-primary/5 border-l-4 border-l-primary',
                            status === 'completed' && 'bg-green-50/50'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {getStatusIcon(status)}
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2">
                                <span 
                                  className={cn(
                                    "font-medium text-sm",
                                    status === 'completed' && 'line-through text-muted-foreground'
                                  )}
                                >
                                  {task.task_name}
                                </span>
                                {isRunning && (
                                  <Badge variant="secondary" className="text-xs animate-pulse">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Running
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <Badge 
                                  variant="outline" 
                                  className={cn('text-xs', getStatusColor(status))}
                                >
                                  {status.replace('_', ' ')}
                                </Badge>
                                <span>{task.estimated_duration}m</span>
                                {task.is_required && (
                                  <span className="text-red-600">Required</span>
                                )}
                              </div>

                              {/* Quick Actions for Selected Task */}
                              {isSelected && (
                                <div className="flex gap-2 pt-2">
                                  {status === 'not_started' && (
                                    <Button 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onTaskStart(task);
                                      }}
                                    >
                                      <Play className="w-3 h-3 mr-1" />
                                      Start
                                    </Button>
                                  )}
                                  
                                  {status === 'in_progress' && (
                                    <Button 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onTaskComplete(task);
                                      }}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Complete
                                    </Button>
                                  )}
                                  
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onViewSOP(task);
                                    }}
                                  >
                                    View SOP
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}
      </div>

      {/* Completion Celebration */}
      {stats.percentage === 100 && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="flex items-center gap-3 p-4">
            <Trophy className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-medium text-green-800">All Tasks Complete!</h3>
              <p className="text-sm text-green-600">Ready to proceed to the next phase</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};