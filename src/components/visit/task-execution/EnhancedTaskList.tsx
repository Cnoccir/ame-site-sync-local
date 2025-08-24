import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  Play, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight, 
  Target, 
  Trophy,
  Pause,
  RotateCcw,
  Eye,
  Filter,
  Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface TaskData {
  id: string;
  task_id: string;
  task_name: string;
  category_id: string;
  duration_minutes: number;
  navigation_path: string;
  sop_steps: string;
  quality_checks: string;
  skills_required: string;
  safety_notes: string;
  is_mandatory: boolean;
  phase: number;
  task_order: number;
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

interface EnhancedTaskListProps {
  tasks: TaskData[];
  visitTasks: VisitTask[];
  stats: TaskStats;
  serviceTier: string;
  onTaskSelect: (task: TaskData) => void;
  onTaskStart: (task: TaskData) => void;
  onTaskComplete: (task: TaskData) => void;
  onViewSOP: (task: TaskData) => void;
  selectedTaskId?: string;
  taskTimers: Record<string, number>;
  overallTimer: number;
  isPaused: boolean;
  onPauseToggle: () => void;
  onTimerReset: () => void;
}

export const EnhancedTaskList: React.FC<EnhancedTaskListProps> = ({
  tasks,
  visitTasks,
  stats,
  serviceTier,
  onTaskSelect,
  onTaskStart,
  onTaskComplete,
  onViewSOP,
  selectedTaskId,
  taskTimers,
  overallTimer,
  isPaused,
  onPauseToggle,
  onTimerReset
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update current time every second for timers
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const getTaskStatus = (task: TaskData): string => {
    const visitTask = visitTasks.find(vt => vt.task_id === task.id);
    return visitTask?.status || 'not_started';
  };

  const getStatusIcon = (status: string, isRunning: boolean = false) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'in_progress':
        return <Play className={cn("w-5 h-5 text-info", isRunning && "animate-pulse")} />;
      case 'skipped':
        return <AlertTriangle className="w-5 h-5 text-warning" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-success bg-success/10 border-success/20';
      case 'in_progress':
        return 'text-info bg-info/10 border-info/20';
      case 'skipped':
        return 'text-warning bg-warning/10 border-warning/20';
      default:
        return 'text-muted-foreground bg-muted/50 border-muted';
    }
  };

  const getServiceTierBadge = (tier: string) => {
    const colors = {
      'CORE': 'bg-tier-core text-white',
      'ASSURE': 'bg-tier-assure text-white', 
      'GUARDIAN': 'bg-tier-guardian text-white'
    };
    return colors[tier as keyof typeof colors] || 'bg-muted text-muted-foreground';
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTaskTimer = (task: TaskData): string => {
    const startTime = taskTimers[task.id];
    if (!startTime) return '00:00:00';
    const elapsed = isPaused ? 0 : currentTime - startTime;
    return formatTime(elapsed);
  };

  const parseSteps = (stepString: string): string[] => {
    if (!stepString) return [];
    return stepString.split('|').map(step => step.trim()).filter(Boolean);
  };

  const parseQualityChecks = (checksString: string): string[] => {
    if (!checksString) return [];
    return checksString.split('|').map(check => check.trim()).filter(Boolean);
  };

  // Filter tasks by tier
  const filteredTasks = tierFilter === 'all' 
    ? tasks 
    : tasks.filter(task => task.task_id.startsWith(tierFilter));

  // Group tasks by category
  const tasksByCategory = filteredTasks.reduce((acc, task) => {
    const category = task.category_id || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(task);
    return acc;
  }, {} as Record<string, TaskData[]>);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Timer Header */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-primary" />
              <div>
                <h3 className="font-semibold text-lg">Service Timer</h3>
                <div className="text-2xl font-mono font-bold text-primary">
                  {formatTime(overallTimer)}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onPauseToggle}
                className={cn(isPaused && "bg-warning/10 border-warning text-warning")}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              <Button variant="outline" size="sm" onClick={onTimerReset}>
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tier Filter & Progress Overview */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5" />
              Service Tasks
            </CardTitle>
            <Badge 
              variant="outline" 
              className={cn("text-sm", getServiceTierBadge(serviceTier))}
            >
              {serviceTier} Tier
            </Badge>
          </div>
          
          {/* Tier Filter Buttons */}
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <div className="flex gap-1">
              {['all', 'C', 'A', 'G'].map((tier) => (
                <Button
                  key={tier}
                  variant={tierFilter === tier ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTierFilter(tier)}
                  className="h-8"
                >
                  {tier === 'all' ? 'ALL' : 
                   tier === 'C' ? 'CORE' : 
                   tier === 'A' ? 'ASSURE' : 'GUARDIAN'}
                </Button>
              ))}
            </div>
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
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="space-y-1">
              <span className="text-muted-foreground">Total Tasks</span>
              <div className="font-medium text-lg">{stats.total}</div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Completed</span>
              <div className="font-medium text-lg text-success">{stats.completed}</div>
            </div>
            <div className="space-y-1">
              <span className="text-muted-foreground">Est. Duration</span>
              <div className="font-medium text-lg">
                {Math.floor(stats.totalDuration / 60)}h {stats.totalDuration % 60}m
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
                      const isRunning = !!taskTimers[task.id];
                      const steps = parseSteps(task.sop_steps);
                      const qualityChecks = parseQualityChecks(task.quality_checks);
                      
                      return (
                        <div
                          key={task.id}
                          onClick={() => onTaskSelect(task)}
                          className={cn(
                            'p-4 border-b last:border-b-0 cursor-pointer transition-all duration-200',
                            'hover:bg-muted/30',
                            isSelected && 'bg-primary/5 border-l-4 border-l-primary',
                            status === 'completed' && 'bg-success/5'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                              {getStatusIcon(status, isRunning)}
                            </div>
                            
                            <div className="flex-1 min-w-0 space-y-2">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span 
                                  className={cn(
                                    "font-medium text-sm",
                                    status === 'completed' && 'line-through text-muted-foreground'
                                  )}
                                >
                                  {task.task_name}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {task.task_id}
                                </Badge>
                                {task.is_mandatory && (
                                  <Badge variant="destructive" className="text-xs">
                                    MANDATORY
                                  </Badge>
                                )}
                                {isRunning && (
                                  <Badge variant="secondary" className="text-xs animate-pulse">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {getTaskTimer(task)}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                                <Badge 
                                  variant="outline" 
                                  className={cn('text-xs', getStatusColor(status))}
                                >
                                  {status.replace('_', ' ')}
                                </Badge>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {task.duration_minutes}m
                                </span>
                                <span className="flex items-center gap-1">
                                  <Target className="w-3 h-3" />
                                  {steps.length} steps
                                </span>
                                {task.skills_required && (
                                  <span>{task.skills_required}</span>
                                )}
                              </div>

                              {task.navigation_path && (
                                <div className="text-xs text-info bg-info/10 px-2 py-1 rounded">
                                  <strong>Path:</strong> {task.navigation_path}
                                </div>
                              )}

                              {task.safety_notes && (
                                <div className="text-xs text-warning bg-warning/10 px-2 py-1 rounded border-l-2 border-warning">
                                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                                  <strong>Safety:</strong> {task.safety_notes}
                                </div>
                              )}

                              {/* Quick Actions for Selected Task */}
                              {isSelected && (
                                <div className="flex gap-2 pt-2 flex-wrap">
                                  {status === 'not_started' && (
                                    <Button 
                                      size="sm" 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onTaskStart(task);
                                      }}
                                    >
                                      <Play className="w-3 h-3 mr-1" />
                                      Start Task
                                    </Button>
                                  )}
                                  
                                  {status === 'in_progress' && (
                                    <Button 
                                      size="sm" 
                                      variant="default"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onTaskComplete(task);
                                      }}
                                    >
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Mark Complete
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
                                    <Eye className="w-3 h-3 mr-1" />
                                    View Full SOP
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
        <Card className="bg-gradient-to-r from-success/10 to-success/5 border-success/20">
          <CardContent className="flex items-center gap-3 p-6">
            <Trophy className="w-8 h-8 text-success" />
            <div>
              <h3 className="font-semibold text-lg text-success">All Tasks Complete!</h3>
              <p className="text-sm text-success/80">
                🎉 Excellent work! Ready to proceed to the next phase.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};