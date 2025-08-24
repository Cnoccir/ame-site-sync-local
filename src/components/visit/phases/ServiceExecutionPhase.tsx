import React, { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle, Eye, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EnhancedTaskList } from '../task-execution/EnhancedTaskList';
import { StepByStepViewer } from '../task-execution/StepByStepViewer';
import { EnhancedSOPModal } from '../task-execution/EnhancedSOPModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types';

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
  created_at?: string;
  updated_at?: string;
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
  const [taskTimers, setTaskTimers] = useState<Record<string, number>>({});
  const [overallTimer, setOverallTimer] = useState(0);
  const [timerStartTime, setTimerStartTime] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  // Get current visit ID from URL params
  const visitId = new URLSearchParams(window.location.search).get('visitId');

  useEffect(() => {
    loadServiceTierTasks();
    loadVisitTasks();
    loadSOPData();
    startOverallTimer();
  }, []);

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
      console.log('Loading service tier tasks for phase 2...');
      
      // Load tasks directly from ame_tasks_normalized filtered by phase (Service Execution = phase 2)
      const { data, error } = await supabase
        .from('ame_tasks_normalized')
        .select('*')
        .eq('phase', 2) // Service execution phase
        .order('task_order');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Raw tasks loaded:', data?.length || 0);
      
      // For debugging - show what tier we're looking for
      const customerTier = customer?.service_tier || 'CORE';
      console.log('Customer service tier:', customerTier);
      
      // Filter by customer service tier based on task_id prefix
      const tierPrefix = customerTier === 'CORE' ? 'C' : 
                        customerTier === 'ASSURE' ? 'A' : 
                        customerTier === 'GUARDIAN' ? 'G' : 'C';
      
      console.log('Looking for tasks with prefix:', tierPrefix);
      
      // Show available task_ids for debugging
      console.log('Available task_ids:', data?.map(t => t.task_id) || []);
      
      const filteredTasks = (data || []).filter(task => 
        task.task_id.startsWith(tierPrefix)
      );
      
      console.log('Filtered tasks count:', filteredTasks.length);
      console.log('Filtered task_ids:', filteredTasks.map(t => t.task_id));
      
      setServiceTierTasks(filteredTasks);
    } catch (error) {
      console.error('Error loading service tier tasks:', error);
      toast({
        title: 'Error',
        description: 'Failed to load service tier tasks',
        variant: 'destructive'
      });
    }
  };

  const loadVisitTasks = async () => {
    if (!visitId) return;

    try {
      const { data, error } = await supabase
        .from('visit_tasks')
        .select('*')
        .eq('visit_id', visitId);

      if (error) throw error;
      setVisitTasks(data || []);
    } catch (error) {
      console.error('Error loading visit tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSOPData = async () => {
    try {
      const { data, error } = await supabase
        .from('ame_sops_normalized')
        .select('*');

      if (error) throw error;
      setSOPData((data || []).map(sop => ({
        ...sop,
        steps: Array.isArray(sop.steps) ? sop.steps : [],
        tools_required: Array.isArray(sop.tools_required) ? sop.tools_required : [],
        hyperlinks: Array.isArray(sop.hyperlinks) ? sop.hyperlinks : []
      })));
    } catch (error) {
      console.error('Error loading SOP data:', error);
    } finally {
      setLoading(false);
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
    return visitTask?.status || 'not_started';
  };

  const getTaskStats = () => {
    const total = serviceTierTasks.length;
    const completed = serviceTierTasks.filter(task => getTaskStatus(task) === 'completed').length;
    const totalDuration = serviceTierTasks.reduce((sum, task) => sum + task.duration_minutes, 0);
    const completedDuration = serviceTierTasks
      .filter(task => getTaskStatus(task) === 'completed')
      .reduce((sum, task) => sum + task.duration_minutes, 0);

    return {
      total,
      completed,
      totalDuration,
      completedDuration,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const handleTaskStart = async (task: TaskData) => {
    if (!visitId) return;

    try {
      // Check if visit task exists, create if not
      let visitTask = visitTasks.find(vt => vt.task_id === task.id);
      
      if (!visitTask) {
        const { data: newVisitTask, error: insertError } = await supabase
          .from('visit_tasks')
          .insert({
            visit_id: visitId,
            task_id: task.id,
            status: 'in_progress',
            start_time: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) throw insertError;
        visitTask = newVisitTask;
        setVisitTasks(prev => [...prev, newVisitTask as VisitTask]);
      } else {
        // Update existing task
        const { error: updateError } = await supabase
          .from('visit_tasks')
          .update({
            status: 'in_progress',
            start_time: new Date().toISOString()
          })
          .eq('id', visitTask.id);

        if (updateError) throw updateError;
        
        setVisitTasks(prev => prev.map(vt => 
          vt.id === visitTask!.id 
            ? { ...vt, status: 'in_progress', start_time: new Date().toISOString() } as VisitTask
            : vt
        ));
      }

      // Start timer
      setTaskTimers(prev => ({ ...prev, [task.id]: Date.now() }));
      
      toast({
        title: 'Task Started',
        description: `Started ${task.task_name}`
      });
    } catch (error) {
      console.error('Error starting task:', error);
      toast({
        title: 'Error',
        description: 'Failed to start task',
        variant: 'destructive'
      });
    }
  };

  const handleTaskComplete = async (task: TaskData) => {
    if (!visitId) return;

    try {
      const visitTask = visitTasks.find(vt => vt.task_id === task.id);
      if (!visitTask) return;

      const startTime = taskTimers[task.id];
      const actualDuration = startTime ? Math.round((Date.now() - startTime) / (1000 * 60)) : null;

      const { error } = await supabase
        .from('visit_tasks')
        .update({
          status: 'completed',
          completion_time: new Date().toISOString(),
          actual_duration: actualDuration
        })
        .eq('id', visitTask.id);

      if (error) throw error;

      setVisitTasks(prev => prev.map(vt => 
        vt.id === visitTask.id 
          ? { 
              ...vt, 
              status: 'completed', 
              completion_time: new Date().toISOString(),
              actual_duration: actualDuration 
            } as VisitTask
          : vt
      ));

      // Stop timer
      setTaskTimers(prev => {
        const updated = { ...prev };
        delete updated[task.id];
        return updated;
      });

      toast({
        title: 'Task Completed',
        description: `Completed ${task.task_name}`
      });

      // Check if all required tasks are completed
      const stats = getTaskStats();
      if (stats.completed === stats.total) {
        setTimeout(() => {
          toast({
            title: 'Phase Complete',
            description: 'All service execution tasks completed!'
          });
          onPhaseComplete();
        }, 1000);
      }
    } catch (error) {
      console.error('Error completing task:', error);
      toast({
        title: 'Error',
        description: 'Failed to complete task',
        variant: 'destructive'
      });
    }
  };

  const handleViewSOP = (task: TaskData) => {
    const sop = sopData.find(s => s.sop_id === task.task_id);
    setSelectedSOP(sop || null);
    setSelectedTask(task);
    setShowSOPModal(true);
  };

  const handleStepComplete = (stepNumber: number) => {
    setCompletedSteps(prev => new Set([...prev, stepNumber]));
  };

  const handleAllStepsComplete = () => {
    if (selectedTask) {
      handleTaskComplete(selectedTask);
      setShowStepViewer(false);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Service Execution</h2>
          <p className="text-muted-foreground">
            Execute {customer?.service_tier || 'CORE'} tier maintenance tasks
          </p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {customer?.service_tier || 'CORE'} Service Tier
        </Badge>
      </div>

      {/* Enhanced Task Management Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enhanced Task List */}
        <div className="lg:col-span-2">
          <EnhancedTaskList
            tasks={serviceTierTasks}
            visitTasks={visitTasks}
            stats={stats}
            serviceTier={customer?.service_tier || 'CORE'}
            onTaskSelect={setSelectedTask}
            onTaskStart={handleStartStepViewer}
            onTaskComplete={handleTaskComplete}
            onViewSOP={handleViewSOP}
            selectedTaskId={selectedTask?.id}
            taskTimers={taskTimers}
            overallTimer={overallTimer}
            isPaused={isPaused}
            onPauseToggle={togglePause}
            onTimerReset={resetTimer}
          />
        </div>

        {/* Step-by-Step Viewer */}
        <div className="lg:col-span-1">
          {selectedTask && showStepViewer ? (
            <StepByStepViewer
              task={selectedTask}
              onStepComplete={handleStepComplete}
              onAllStepsComplete={handleAllStepsComplete}
              completedSteps={completedSteps}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Play className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Select a task to begin step-by-step guidance
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Enhanced SOP Modal */}
      {showSOPModal && selectedTask && (
        <EnhancedSOPModal
          sopData={selectedSOP}
          taskData={selectedTask}
          onClose={() => {
            setShowSOPModal(false);
            setSelectedSOP(null);
          }}
        />
      )}
    </div>
  );
};