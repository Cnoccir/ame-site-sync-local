import React, { useState, useEffect } from 'react';
import { Clock, Play, CheckCircle, Eye, ChevronDown, ChevronRight, Target, Pause, RotateCcw, AlertTriangle, Book } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { StepByStepViewer } from '../task-execution/StepByStepViewer';
import { EnhancedSOPModal } from '../task-execution/EnhancedSOPModal';
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
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  // Get current visit ID from URL params
  const visitId = new URLSearchParams(window.location.search).get('visitId');

  useEffect(() => {
    const loadData = async () => {
      console.log('🚀 Starting data load sequence...');
      setLoading(true);
      
      // Load data sequentially to avoid race conditions
      await loadServiceTierTasks();
      await loadVisitTasks();
      await loadSOPData();
      
      console.log('✅ All data loaded, starting timer');
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
      console.log('Loading service tier tasks...');
      
      // Get customer service tier
      const customerTier = customer?.service_tier || 'CORE';
      console.log('Customer service tier:', customerTier);
      
      // Map service tier to task prefix and determine phase
      const tierMapping = {
        'CORE': { prefix: 'C', phase: 1 }, // CORE tasks are in phase 1
        'ASSURE': { prefix: 'A', phase: 2 }, // ASSURE tasks are in phase 2  
        'GUARDIAN': { prefix: 'G', phase: 2 } // GUARDIAN tasks are in phase 2
      };
      
      const tierConfig = tierMapping[customerTier as keyof typeof tierMapping] || tierMapping.CORE;
      console.log('Using tier config:', tierConfig);
      
      // Load tasks from the appropriate phase for this service tier
      const { data, error } = await supabase
        .from('ame_tasks_normalized')
        .select('*')
        .eq('phase', tierConfig.phase)
        .order('task_order');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }
      
      console.log('Raw tasks loaded:', data?.length || 0);
      console.log('Raw task data:', data);
      
      // Filter by customer service tier based on task_id prefix
      const filteredTasks = (data || []).filter(task => 
        task.task_id.startsWith(tierConfig.prefix)
      );
      
      console.log('Filtered tasks count:', filteredTasks.length);
      console.log('Filtered task_ids:', filteredTasks.map(t => t.task_id));
      
      setServiceTierTasks(filteredTasks);
      
      // Mark loading as complete
      setLoading(false);
      
      console.log('✅ Service tier tasks loaded successfully');
    } catch (error) {
      console.error('❌ Error loading service tier tasks:', error);
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
      console.log('⚠️ No visitId provided, skipping visit tasks load');
      return;
    }

    try {
      console.log('Loading visit tasks for visitId:', visitId);
      const { data, error } = await supabase
        .from('visit_tasks')
        .select('*')
        .eq('visit_id', visitId);

      if (error) {
        console.error('Error loading visit tasks:', error);
        throw error;
      }
      
      console.log('Visit tasks loaded:', data?.length || 0);
      setVisitTasks(data || []);
    } catch (error) {
      console.error('Error loading visit tasks:', error);
    }
  };

  const loadSOPData = async () => {
    try {
      console.log('Loading SOP data...');
      const { data, error } = await supabase
        .from('ame_sops_normalized')
        .select('*');

      if (error) {
        console.error('Error loading SOP data:', error);
        throw error;
      }
      
      console.log('SOP data loaded:', data?.length || 0);
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
    const visitTask = visitTasks.find(vt => vt.task_id === task.task_id);
    return visitTask?.status || 'not_started';
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
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-success" />;
      case 'in_progress':
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
      console.log('🚀 Starting task:', task.task_name, 'task_id:', task.task_id);
      
      // Check if visit task exists, create if not - use task.task_id instead of task.id
      let visitTask = visitTasks.find(vt => vt.task_id === task.task_id);
      
      if (!visitTask) {
        console.log('📝 Creating new visit task entry');
        const { data: newVisitTask, error: insertError } = await supabase
          .from('visit_tasks')
          .insert({
            visit_id: visitId,
            task_id: task.task_id, // Use task.task_id (string) not task.id (uuid)
            status: 'in_progress',
            start_time: new Date().toISOString()
          })
          .select()
          .single();

        if (insertError) {
          console.error('❌ Insert error:', insertError);
          throw insertError;
        }
        
        visitTask = newVisitTask;
        setVisitTasks(prev => [...prev, newVisitTask as VisitTask]);
        console.log('✅ New visit task created');
      } else {
        console.log('📝 Updating existing visit task');
        // Update existing task
        const { error: updateError } = await supabase
          .from('visit_tasks')
          .update({
            status: 'in_progress',
            start_time: new Date().toISOString()
          })
          .eq('id', visitTask.id);

        if (updateError) {
          console.error('❌ Update error:', updateError);
          throw updateError;
        }
        
        setVisitTasks(prev => prev.map(vt => 
          vt.id === visitTask!.id 
            ? { ...vt, status: 'in_progress', start_time: new Date().toISOString() } as VisitTask
            : vt
        ));
        console.log('✅ Visit task updated');
      }

      // Start timer
      setTaskTimers(prev => ({ ...prev, [task.id]: Date.now() }));
      
      toast({
        title: 'Task Started',
        description: `Started ${task.task_name} - Follow the step-by-step guide`
      });
      
      console.log('✅ Task started successfully');
    } catch (error) {
      console.error('❌ Error starting task:', error);
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
      console.log('🎯 Completing task:', task.task_name, 'task_id:', task.task_id);
      
      const visitTask = visitTasks.find(vt => vt.task_id === task.task_id);
      if (!visitTask) {
        console.error('❌ Visit task not found for task_id:', task.task_id);
        return;
      }

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

      if (error) {
        console.error('❌ Update error:', error);
        throw error;
      }

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

      // Close step viewer
      setShowStepViewer(false);

      toast({
        title: 'Task Completed',
        description: `Completed ${task.task_name}`
      });

      console.log('✅ Task completed successfully');

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
      console.error('❌ Error completing task:', error);
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
    <div className="workflow-content space-y-6">
      {/* Enhanced Service Execution Panel */}
      <div className="workflow-panel">
        <div className="panel-header border-b pb-4 mb-6">
          <div className="panel-title flex items-center gap-2 text-xl font-semibold mb-2">
            <span className="text-2xl">⚙️</span> Service Tier Execution
          </div>
          <div className="panel-description text-muted-foreground">
            Execute comprehensive maintenance tasks with integrated visual step-by-step guidance. 
            Each task includes detailed SOPs, quality checks, and safety protocols.
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
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Service Tier Filter - Only show customer's tier */}
        <div className="tier-filter mb-6 flex gap-3 items-center">
          <span className="font-semibold text-muted-foreground">Current Service Tier:</span>
          <Badge 
            variant="default"
            className={`${customer?.service_tier === 'CORE' ? 'bg-tier-core text-white' : 
                       customer?.service_tier === 'ASSURE' ? 'bg-tier-assure text-white' : 
                       'bg-tier-guardian text-white'}`}
          >
            {customer?.service_tier || 'CORE'}
          </Badge>
          <div className="text-sm text-muted-foreground">
            Showing {filteredTasks.length} tasks for this tier
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  Service Tasks
                </CardTitle>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant="outline"
                    className={`text-sm font-medium ${
                      customer?.service_tier === 'CORE' ? 'bg-tier-core text-white border-tier-core' : 
                      customer?.service_tier === 'ASSURE' ? 'bg-tier-assure text-white border-tier-assure' : 
                      'bg-tier-guardian text-white border-tier-guardian'
                    }`}
                  >
                    {customer?.service_tier || 'CORE'} Tier
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {stats.completed}/{stats.total} completed
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Overall Progress</span>
                  <span className="font-medium">{stats.percentage}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-primary rounded-full h-2 transition-all duration-500" 
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No tasks found for {customer?.service_tier || 'CORE'} tier</p>
                  <p className="text-sm">Check customer service tier configuration</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTasks.map((task) => {
                    const status = getTaskStatus(task);
                    const isExpanded = expandedTasks.has(task.id);
                    const isRunning = !!taskTimers[task.id];
                    const steps = parseSteps(task.sop_steps);
                    const qualityChecks = parseQualityChecks(task.quality_checks);
                    
                    return (
                      <Card
                        key={task.id}
                        className={cn(
                          'transition-all duration-200 border',
                          status === 'completed' && 'bg-success/5 border-success/20',
                          status === 'in_progress' && 'bg-info/5 border-info/20',
                          isExpanded && 'shadow-md'
                        )}
                      >
                        <Collapsible open={isExpanded} onOpenChange={() => toggleTaskExpansion(task.id)}>
                          <CollapsibleTrigger asChild>
                            <div className="p-4 cursor-pointer hover:bg-muted/30 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0">
                                  {getStatusIcon(status, isRunning)}
                                </div>
                                
                                <div className="flex-1 space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <h3 className={cn(
                                        "font-semibold text-base",
                                        status === 'completed' && 'line-through text-muted-foreground'
                                      )}>
                                        {task.task_name}
                                      </h3>
                                      <Badge variant="outline" className="text-xs">
                                        {task.task_id}
                                      </Badge>
                                      {task.is_mandatory && (
                                        <Badge variant="destructive" className="text-xs">
                                          MANDATORY
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {isRunning && (
                                        <Badge variant="secondary" className="animate-pulse text-xs">
                                          <Clock className="w-3 h-3 mr-1" />
                                          {getTaskTimer(task)}
                                        </Badge>
                                      )}
                                      {isExpanded ? (
                                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                      ) : (
                                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      {task.duration_minutes}min
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Target className="w-4 h-4" />
                                      {steps.length} steps
                                    </span>
                                    {task.skills_required && (
                                      <span className="bg-muted px-2 py-1 rounded text-xs">
                                        {task.skills_required}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="border-t bg-muted/20">
                            <div className="p-4 space-y-4">
                              {/* Navigation Path */}
                              {task.navigation_path && (
                                <div className="bg-info/10 border border-info/20 rounded-lg p-3">
                                  <div className="flex items-start gap-2">
                                    <Target className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium text-info text-sm">Navigation Path</p>
                                      <p className="text-sm text-info/80">{task.navigation_path}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Safety Notes */}
                              {task.safety_notes && (
                                <div className="bg-warning/10 border border-warning/20 rounded-lg p-3">
                                  <div className="flex items-start gap-2">
                                    <AlertTriangle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="font-medium text-warning text-sm">Safety Requirements</p>
                                      <p className="text-sm text-warning/80">{task.safety_notes}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Quality Checks */}
                              {qualityChecks.length > 0 && (
                                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                                  <p className="font-medium text-primary text-sm mb-2">Quality Checks</p>
                                  <ul className="space-y-1">
                                    {qualityChecks.map((check, index) => (
                                      <li key={index} className="text-sm text-primary/80 flex items-start gap-2">
                                        <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                        {check}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex gap-3 pt-2">
                                {status === 'not_started' && (
                                  <Button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleStartStepViewer(task);
                                    }}
                                    className="flex-1"
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Task
                                  </Button>
                                )}
                                
                                {status === 'in_progress' && (
                                  <Button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleTaskComplete(task);
                                    }}
                                    className="flex-1"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Mark Complete
                                  </Button>
                                )}
                                
                                <Button 
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleViewSOP(task);
                                  }}
                                  className="flex-1"
                                >
                                  <Book className="w-4 h-4 mr-2" />
                                  View Full SOP
                                </Button>
                              </div>

                              {/* Step-by-Step Viewer for In-Progress Tasks */}
                              {status === 'in_progress' && selectedTask?.id === task.id && showStepViewer && (
                                <div className="border-t pt-4 mt-4">
                                  <StepByStepViewer
                                    task={selectedTask}
                                    onStepComplete={handleStepComplete}
                                    onAllStepsComplete={handleAllStepsComplete}
                                    completedSteps={completedSteps}
                                  />
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
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