import React, { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle, Eye, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskListPanel } from '../task-execution/TaskListPanel';
import { TaskDetailsPanel } from '../task-execution/TaskDetailsPanel';
import { SOPModal } from '../task-execution/SOPModal';
import { TaskTimer } from '../task-execution/TaskTimer';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Customer } from '@/types';

interface ServiceExecutionPhaseProps {
  customer: Customer;
  onPhaseComplete: () => void;
}

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
  created_at?: string;
  updated_at?: string;
}

interface TaskProcedure {
  id: string;
  task_id: string;
  procedure_title: string;
  procedure_category: string;
  procedure_steps: any;
  visual_guides: any;
  additional_resources: any;
  created_at?: string;
  updated_at?: string;
}

export const ServiceExecutionPhase: React.FC<ServiceExecutionPhaseProps> = ({
  customer,
  onPhaseComplete
}) => {
  const { toast } = useToast();
  const [serviceTierTasks, setServiceTierTasks] = useState<ServiceTierTask[]>([]);
  const [visitTasks, setVisitTasks] = useState<VisitTask[]>([]);
  const [taskProcedures, setTaskProcedures] = useState<TaskProcedure[]>([]);
  const [selectedTask, setSelectedTask] = useState<ServiceTierTask | null>(null);
  const [selectedProcedure, setSelectedProcedure] = useState<TaskProcedure | null>(null);
  const [showSOPModal, setShowSOPModal] = useState(false);
  const [taskTimers, setTaskTimers] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  // Get current visit ID from URL params
  const visitId = new URLSearchParams(window.location.search).get('visitId');

  useEffect(() => {
    loadServiceTierTasks();
    loadVisitTasks();
    loadTaskProcedures();
  }, []);

  const loadServiceTierTasks = async () => {
    try {
      // Use the proper relationship tables to get tasks by service tier
      const { data, error } = await supabase
        .from('ame_tasks_normalized')
        .select(`
          *,
          task_service_tiers!inner(
            service_tier_id,
            service_tiers!inner(tier_code)
          )
        `)
        .eq('task_service_tiers.service_tiers.tier_code', customer?.service_tier || 'CORE')
        .order('task_id');

      if (error) throw error;
      
      // Transform the data to match expected interface
      const transformedTasks = (data || []).map(task => ({
        id: task.id,
        task_id: task.task_id,
        service_tier: customer?.service_tier || 'CORE',
        category: task.category_id || 'General',
        task_name: task.task_name,
        description: task.sop_steps || 'No description available',
        estimated_duration: task.duration_minutes || 30,
        is_required: task.is_mandatory || true,
        prerequisites: task.prerequisites ? [task.prerequisites] : [],
        tools_required: [], // Will be populated from relationship table
        sort_order: task.task_order || 1
      }));
      
      setServiceTierTasks(transformedTasks);
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

  const loadTaskProcedures = async () => {
    try {
      const { data, error } = await supabase
        .from('task_procedures')
        .select('*');

      if (error) throw error;
      setTaskProcedures((data || []).map(proc => ({
        ...proc,
        procedure_steps: Array.isArray(proc.procedure_steps) ? proc.procedure_steps : [],
        visual_guides: Array.isArray(proc.visual_guides) ? proc.visual_guides : [],
        additional_resources: Array.isArray(proc.additional_resources) ? proc.additional_resources : []
      })));
    } catch (error) {
      console.error('Error loading task procedures:', error);
    }
  };

  const getTaskStatus = (task: ServiceTierTask): string => {
    const visitTask = visitTasks.find(vt => vt.task_id === task.id);
    return visitTask?.status || 'not_started';
  };

  const getTaskStats = () => {
    const total = serviceTierTasks.length;
    const completed = serviceTierTasks.filter(task => getTaskStatus(task) === 'completed').length;
    const totalDuration = serviceTierTasks.reduce((sum, task) => sum + task.estimated_duration, 0);
    const completedDuration = serviceTierTasks
      .filter(task => getTaskStatus(task) === 'completed')
      .reduce((sum, task) => sum + task.estimated_duration, 0);

    return {
      total,
      completed,
      totalDuration,
      completedDuration,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const handleTaskStart = async (task: ServiceTierTask) => {
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

  const handleTaskComplete = async (task: ServiceTierTask) => {
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

  const handleViewSOP = (task: ServiceTierTask) => {
    const procedure = taskProcedures.find(tp => tp.task_id === task.id);
    if (procedure) {
      setSelectedProcedure(procedure);
      setShowSOPModal(true);
    } else {
      toast({
        title: 'SOP Not Available',
        description: 'No Standard Operating Procedure found for this task',
        variant: 'destructive'
      });
    }
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

      {/* Split Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
        {/* Left Panel - Task List */}
        <div className="lg:col-span-1">
          <TaskListPanel
            tasks={serviceTierTasks}
            visitTasks={visitTasks}
            stats={stats}
            onTaskSelect={setSelectedTask}
            selectedTaskId={selectedTask?.id}
            taskTimers={taskTimers}
          />
        </div>

        {/* Right Panel - Task Details */}
        <div className="lg:col-span-2">
          <TaskDetailsPanel
            task={selectedTask}
            taskStatus={selectedTask ? getTaskStatus(selectedTask) : 'not_started'}
            onTaskStart={handleTaskStart}
            onTaskComplete={handleTaskComplete}
            onViewSOP={handleViewSOP}
            timer={selectedTask ? taskTimers[selectedTask.id] : undefined}
          />
        </div>
      </div>

      {/* SOP Modal */}
      {showSOPModal && selectedProcedure && (
        <SOPModal
          procedure={selectedProcedure}
          onClose={() => {
            setShowSOPModal(false);
            setSelectedProcedure(null);
          }}
        />
      )}
    </div>
  );
};