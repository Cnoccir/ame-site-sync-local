import React, { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle, Eye, ChevronDown, ChevronRight, Target, Pause, RotateCcw, AlertTriangle, Book } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { IntegratedTaskCard } from '../task-execution/IntegratedTaskCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';

interface ServiceExecutionPhaseProps {
  customer: Customer;
  onPhaseComplete: () => void;
}

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
  prerequisites?: string;
}

interface VisitTask {
  id: string;
  visit_id: string;
  task_id: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Skipped';
  started_at?: string;
  completed_at?: string;
  time_spent?: number;
  technician_notes?: string;
  created_at?: string;
}

interface SOPData {
  id: string;
  sop_id: string;
  title: string;
  goal: string | null;
  steps: any;
  best_practices: string | null;
  tools_required: any;
  hyperlinks: any;
  estimated_duration_minutes: number;
  category_id: string | null;
  version: string | null;
  last_updated: string | null;
  created_at: string | null;
}

export const ServiceExecutionPhase: React.FC<ServiceExecutionPhaseProps> = ({
  customer,
  onPhaseComplete
}) => {
  const { toast } = useToast();
  const [serviceTierTasks, setServiceTierTasks] = useState<TaskData[]>([]);
  const [visitTasks, setVisitTasks] = useState<VisitTask[]>([]);
  const [sopData, setSOPData] = useState<SOPData[]>([]);
  const [selectedTask, setSelectedTask] = useState<TaskData | null>(null);
  const [selectedSOP, setSelectedSOP] = useState<SOPData | null>(null);
  const [showSOPModal, setShowSOPModal] = useState(false);
  const [showStepViewer, setShowStepViewer] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [taskTimers, setTaskTimers] = useState<Record<string, number>>({});
  const [overallTimer, setOverallTimer] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Get current visit ID from URL params
  const visitId = new URLSearchParams(window.location.search).get('visitId');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      // Load data sequentially to avoid race conditions
      await loadServiceTierTasks();
      await loadVisitTasks();
      await loadSOPData();
      
      startOverallTimer();
    };
    
    loadData();
  }, [customer]);

  // Overall timer effect
  useEffect(() => {
    if (!timerStartTime || isPaused) return;
    
    const interval = setInterval(() => {
      setOverallTimer(Date.now() - timerStartTime);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [timerStartTime, isPaused]);

  const loadServiceTierTasks = async () => {
    try {
      // Get customer service tier
      const customerTier = customer?.service_tier || 'CORE';
      
      // Map service tier to task prefix and determine phase
      const tierMapping = {
        'CORE': { prefix: 'C', phase: 1 },
        'ASSURE': { prefix: 'A', phase: 2 },  
        'GUARDIAN': { prefix: 'G', phase: 2 }
      };
      
      const tierConfig = tierMapping[customerTier as keyof typeof tierMapping] || tierMapping.CORE;
      
      // Load tasks from the appropriate phase for this service tier
      const { data, error } = await supabase
        .from('ame_tasks_normalized')
        .select('*')
        .eq('phase', tierConfig.phase)
        .order('task_order');

      if (error) {
        throw error;
      }
      
      // Filter by customer service tier based on task_id prefix
      const filteredTasks = (data || []).filter(task => 
        task.task_id.startsWith(tierConfig.prefix)
      );
      
      setServiceTierTasks(filteredTasks);
      setLoading(false);
    } catch (error) {
      console.error('Error loading service tier tasks:', error);
      setLoading(false);
      toast({
        title: 'Error',
        description: 'Failed to load service tier tasks',
        variant: 'destructive'
      });
    }
  };

  const loadVisitTasks = async () => {
    if (!visitId) {
      return;
    }

    try {
      const { data, error } = await supabase
        .from('ame_visit_tasks')
        .select('*')
        .eq('visit_id', visitId);

      if (error) {
        throw error;
      }
      
      setVisitTasks((data || []).map(vt => ({
        ...vt,
        status: vt.status as 'Pending' | 'In Progress' | 'Completed' | 'Skipped'
      })));
    } catch (error) {
      console.error('Error loading visit tasks:', error);
    }
  };

  const loadSOPData = async () => {
    try {
      const { data, error } = await supabase
        .from('ame_sops_normalized')
        .select('*');

      if (error) {
        console.error('Error loading SOP data:', error);
        throw error;
      }
      
      
      setSOPData((data || []).map(sop => ({
        ...sop,
        steps: Array.isArray(sop.steps) ? sop.steps : [],
        tools_required: Array.isArray(sop.tools_required) ? sop.tools_required : [],
        hyperlinks: Array.isArray(sop.hyperlinks) ? sop.hyperlinks : []
      })));
    } catch (error) {
      console.error('Error loading SOP data:', error);
    }
  };

  const startOverallTimer = () => {
    setTimerStartTime(Date.now());
    setIsPaused(false);
  };

  const togglePause = () => {
    if (isPaused) {
      // Resume - adjust start time to account for pause duration
      const pausedDuration = Date.now() - (timerStartTime || 0) - overallTimer;
      setTimerStartTime((timerStartTime || 0) + pausedDuration);
    }
    setIsPaused(!isPaused);
  };

  const resetTimer = () => {
    setOverallTimer(0);
    setTimerStartTime(Date.now());
    setIsPaused(false);
    setTaskTimers({});
  };

  const getTaskStatus = (task: TaskData): string => {
    const visitTask = visitTasks.find(vt => vt.task_id === task.id);
    return visitTask?.status || 'Pending';
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const parseSteps = (stepString: string): string[] => {
    if (!stepString) return [];
    return stepString.split('|').map(step => step.trim()).filter(Boolean);
  };

  const parseQualityChecks = (checksString: string): string[] => {
    if (!checksString) return [];
    return checksString.split('|').map(check => check.trim()).filter(Boolean);
  };

  const getStatusIcon = (status: string, isRunning: boolean = false) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'In Progress':
        return <Play className={cn("w-5 h-5 text-info", isRunning && "animate-pulse")} />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />;
    }
  };

  const getTaskTimer = (task: TaskData): string => {
    const startTime = taskTimers[task.id];
    if (!startTime) return '00:00:00';
    const elapsed = isPaused ? 0 : Date.now() - startTime;
    return formatTime(elapsed);
  };

  // Show all tasks for the customer's service tier (no additional filtering)
  const filteredTasks = serviceTierTasks;

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  };

  const getTaskStats = () => {
    const total = serviceTierTasks.length;
    const completed = serviceTierTasks.filter(task => getTaskStatus(task) === 'Completed').length;
    const totalDuration = serviceTierTasks.reduce((sum, task) => sum + task.duration_minutes, 0);
    const completedDuration = serviceTierTasks
      .filter(task => getTaskStatus(task) === 'Completed')
      .reduce((sum, task) => sum + task.duration_minutes, 0);

    return {
      total,
      completed,
      totalDuration,
      completedDuration,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const handleTaskStart = async (task: any) => {
    if (!visitId) {
      console.error('❌ No visitId available');
      toast({
        title: 'Error',
        description: 'No visit ID found',
        variant: 'destructive'
      });
      return;
    }

    try {
      
      // First verify the visit exists and user has access
      const { data: visitData, error: visitError } = await supabase
        .from('ame_visits')
        .select('id, visit_id, technician_id')
        .eq('id', visitId)
        .single();

      if (visitError) {
        throw new Error('Visit not found or access denied');
      }

      if (!visitData) {
        throw new Error('Visit not found');
      }
      
      // Check if visit task exists, create if not - use task.id
      let visitTask = visitTasks.find(vt => vt.task_id === task.id);
      
      if (!visitTask) {
        const { data: newVisitTask, error: insertError } = await supabase
          .from('ame_visit_tasks')
          .insert({
            visit_id: visitId,
            task_id: task.id, // Use task.id (UUID) from ame_tasks_normalized
            status: 'In Progress',
            started_at: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          throw insertError;
        }
        
        visitTask = {
          ...newVisitTask,
          status: newVisitTask.status as 'Pending' | 'In Progress' | 'Completed' | 'Skipped'
        };
        setVisitTasks(prev => [...prev, visitTask]);
      } else {
        // Update existing task
        const { error: updateError } = await supabase
          .from('ame_visit_tasks')
          .update({
            status: 'In Progress',
            started_at: new Date().toISOString()
          })
          .eq('id', visitTask.id);

        if (updateError) {
          throw updateError;
        }
        
        setVisitTasks(prev => prev.map(vt => 
          vt.id === visitTask!.id 
            ? { ...vt, status: 'In Progress', started_at: new Date().toISOString() } 
            : vt
        ));
      }

      // Start timer
      setTaskTimers(prev => ({ ...prev, [task.id]: Date.now() }));
      
      toast({
        title: 'Task Started',
        description: `Started ${task.task_name} - Follow the step-by-step guide`
      });
    } catch (error) {
      console.error('❌ Error starting task:', error);
      let errorMessage = 'Failed to start task';
      
      if (error instanceof Error) {
        if (error.message.includes('access denied') || error.message.includes('not found')) {
          errorMessage = 'Access denied or visit not found';
        } else if (error.message.includes('row-level security')) {
          errorMessage = 'Permission denied - please check your access rights';
        }
      }
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive'
      });
    }
  };

  const handleTaskComplete = async (task: any) => {
    if (!visitId) return;

    try {
      // Find the visit task
      const visitTask = visitTasks.find(vt => vt.task_id === task.id);
      
      if (visitTask) {
        // Update task status to completed
        const { error: updateError } = await supabase
          .from('ame_visit_tasks')
          .update({
            status: 'Completed',
            completed_at: new Date().toISOString(),
            time_spent: taskTimers[task.id] ? Math.floor((Date.now() - taskTimers[task.id]) / 60000) : 0
          })
          .eq('id', visitTask.id);

        if (updateError) throw updateError;

        // Update local state
        setVisitTasks(prev => prev.map(vt => 
          vt.id === visitTask.id 
            ? { ...vt, status: 'Completed', completed_at: new Date().toISOString() } 
            : vt
        ));

        // Clear timer
        setTaskTimers(prev => ({ ...prev, [task.id]: 0 }));

        toast({
          title: 'Task Completed',
          description: `${task.task_name} marked as complete`
        });
      }

      // Check if user wants to complete phase (non-blocking)
      const stats = getTaskStats();
      if (stats.completed >= stats.total * 0.8) { // Allow completion with 80% tasks done
        setTimeout(() => {
          toast({
            title: 'Phase Available for Completion',
            description: `${stats.completed}/${stats.total} tasks completed. You can proceed to the next phase when ready.`
          });
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Error completing task:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete task',
        variant: 'destructive'
      });
    }
  };

  const handleViewSOP = (task: TaskData) => {
    // Try to find SOP by task_id first, then by matching patterns
    let sop = sopData.find(s => s.sop_id === task.task_id);
    
    // If not found, try pattern matching for similar names
    if (!sop) {
      sop = sopData.find(s => 
        s.title.toLowerCase().includes(task.task_name.toLowerCase().split(' ')[0]) ||
        task.task_name.toLowerCase().includes(s.title.toLowerCase().split(' ')[0])
      );
    }
    
    setSelectedSOP(sop || null);
    setSelectedTask(task);
    setShowSOPModal(true);
  };

  const handleStepComplete = (stepNumber: number) => {
    setCompletedSteps(prev => new Set([...prev, stepNumber]));
  };

  const handleAllStepsComplete = () => {
    if (selectedTask) {
      setShowCompletionModal(true);
      setShowStepViewer(false);
    }
  };

  const handleTaskCompletionWithNotes = (notes: string) => {
    if (selectedTask) {
      handleTaskComplete(selectedTask);
      setShowCompletionModal(false);
      setSelectedTask(null);
    }
  };

  const handleStartStepViewer = (task: TaskData) => {
    setSelectedTask(task);
    setCompletedSteps(new Set());
    setShowStepViewer(true);
    handleTaskStart(task);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading service execution tasks...</p>
        </div>
      </div>
    );
  }

  const stats = getTaskStats();

  return (
    <div className="workflow-content space-y-6">
      {/* Enhanced Service Execution Panel */}
      <div className="workflow-panel">
        <div className="panel-header border-b pb-4 mb-6">
          <div className="panel-title flex items-center gap-2 text-xl font-semibold mb-2">
            <span className="text-2xl">⚙️</span> Service Tier Execution
          </div>
          <div className="panel-description text-muted-foreground">
            Execute comprehensive maintenance tasks with integrated visual step-by-step guidance. 
            Tasks are <strong>recommended but not mandatory</strong> - complete based on site conditions and requirements.
          </div>
        </div>

        {/* Enhanced Service Header with Timer */}
        <div className="service-header bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="service-info">
              <h2 className="text-lg font-semibold mb-2">
                <Badge variant="outline" className={`mr-2 ${customer?.service_tier === 'CORE' ? 'bg-tier-core text-white' : customer?.service_tier === 'ASSURE' ? 'bg-tier-assure text-white' : 'bg-tier-guardian text-white'}`}>
                  {customer?.service_tier || 'CORE'}
                </Badge>
                Service Tasks
              </h2>
              <div className="service-progress">
                <div className="text-sm text-muted-foreground mb-2">
                  Progress: <span className="font-medium">{stats.completed}</span> of <span className="font-medium">{stats.total}</span> tasks completed
                </div>
                <div className="progress-bar bg-muted rounded-full h-2 w-64">
                  <div 
                    className="progress-fill bg-primary rounded-full h-2 transition-all duration-300" 
                    style={{ width: `${stats.percentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            <div className="overall-timer text-right">
              <div className="timer-label text-xs text-muted-foreground mb-1">Total Service Time</div>
              <div className="timer-display text-2xl font-mono font-bold text-primary mb-3">
                {formatTime(overallTimer)}
              </div>
              <div className="timer-controls flex gap-2">
                <Button 
                  size="sm" 
                  variant={isPaused ? "default" : "outline"}
                  onClick={togglePause}
                >
                  {isPaused ? <Play className="w-4 h-4 mr-1" /> : <Pause className="w-4 h-4 mr-1" />}
                  {isPaused ? 'Resume' : 'Pause'}
                </Button>
                <Button size="sm" variant="outline" onClick={resetTimer}>
                  <RotateCcw className="w-4 h-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Service Tasks List */}
        <div className="tasks-container space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-muted-foreground">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No service tasks available</p>
                <p className="text-sm">Tasks will appear here based on your customer's service tier.</p>
              </div>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const visitTask = visitTasks.find(vt => vt.task_id === task.id);
              const isExpanded = expandedTasks.has(task.id);
              const isActive = getTaskStatus(task) === 'In Progress';
              
              // Find matching SOP data and map it to IntegratedTaskCard format
              const taskSOP = sopData.find(sop => 
                sop.sop_id === task.task_id || 
                sop.title.toLowerCase().includes(task.task_name.toLowerCase().split(' ')[0])
              );

              const mappedSOP = taskSOP ? {
                id: taskSOP.id,
                sop_id: taskSOP.sop_id,
                title: taskSOP.title,
                goal: taskSOP.goal,
                steps: taskSOP.steps,
                best_practices: taskSOP.best_practices,
                tools_required: taskSOP.tools_required,
                hyperlinks: taskSOP.hyperlinks,
                estimated_duration_minutes: taskSOP.estimated_duration_minutes,
                category_id: taskSOP.category_id,
                version: taskSOP.version,
                last_updated: taskSOP.last_updated,
                created_at: taskSOP.created_at
              } : undefined;

              return (
                <IntegratedTaskCard 
                  key={task.id}
                  task={{
                    id: task.id,
                    task_name: task.task_name,
                    description: task.navigation_path || 'No description available',
                    estimated_duration: task.duration_minutes,
                    sop_steps: task.sop_steps,
                    quality_checks: task.quality_checks,
                    tools_required: task.skills_required || 'Standard tools',
                    prerequisites: task.prerequisites || 'None',
                    skills_required: task.skills_required || 'Basic',
                    category: task.category_id || 'General'
                  }}
                  visitTask={visitTask ? { 
                    ...visitTask, 
                    started_at: visitTask.started_at || null,
                    completed_at: visitTask.completed_at || null
                  } : undefined}
                  sopData={mappedSOP}
                  isExpanded={isExpanded}
                  onTaskStart={handleTaskStart}
                  onTaskComplete={handleTaskComplete}
                  onExpand={(taskId) => {
                    // Collapse all other tasks and expand this one
                    setExpandedTasks(new Set([taskId]));
                  }}
                  onCollapse={() => setExpandedTasks(new Set())}
                />
              );
            })
          )}
        </div>

        {/* Phase Completion */}
        <div className="phase-completion mt-8 p-6 bg-gradient-to-r from-success/10 to-success/5 rounded-lg border border-success/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-success mb-1">Service Execution Complete</h3>
              <p className="text-sm text-muted-foreground">
                {stats.completed} of {stats.total} tasks completed ({stats.percentage}%)
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Tasks are recommendations - proceed when site work is complete
              </p>
            </div>
            <Button 
              onClick={onPhaseComplete}
              className="bg-success hover:bg-success/90"
              disabled={stats.completed === 0}
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Phase
            </Button>
          </div>
        </div>
      </div>

      {/* All modals and step viewers are now integrated into task cards */}
    </div>
  );
};