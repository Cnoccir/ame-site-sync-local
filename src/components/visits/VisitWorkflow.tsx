import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { AMEService } from '@/services/ameService';
import { Visit, Customer, Task, VisitTask } from '@/types';
import { CheckCircle, Clock, AlertCircle, FileText, Camera, Wrench, ClipboardCheck } from 'lucide-react';

interface VisitWorkflowProps {
  visit: Visit;
  customer: Customer;
  onVisitUpdate: (visit: Visit) => void;
}

export const VisitWorkflow = ({ visit, customer, onVisitUpdate }: VisitWorkflowProps) => {
  const [visitTasks, setVisitTasks] = useState<VisitTask[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentPhase, setCurrentPhase] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadVisitData();
    determineCurrentPhase();
  }, [visit.id]);

  const loadVisitData = async () => {
    try {
      const [visitTasksData, tasksData] = await Promise.all([
        AMEService.getVisitTasks(visit.id),
        AMEService.getTasksByServiceTier(customer.service_tier)
      ]);
      
      setVisitTasks(visitTasksData);
      setTasks(tasksData);
    } catch (error) {
      console.error('Error loading visit data:', error);
      toast({
        title: "Error",
        description: "Failed to load visit data",
        variant: "destructive",
      });
    }
  };

  const determineCurrentPhase = () => {
    if (visit.phase_4_completed_at) setCurrentPhase(4);
    else if (visit.phase_3_completed_at) setCurrentPhase(4);
    else if (visit.phase_2_completed_at) setCurrentPhase(3);
    else if (visit.phase_1_completed_at) setCurrentPhase(2);
    else setCurrentPhase(1);
  };

  const getPhaseProgress = () => {
    let completed = 0;
    if (visit.phase_1_completed_at) completed++;
    if (visit.phase_2_completed_at) completed++;
    if (visit.phase_3_completed_at) completed++;
    if (visit.phase_4_completed_at) completed++;
    return (completed / 4) * 100;
  };

  const completePhase = async (phaseNumber: number) => {
    try {
      setLoading(true);
      const updates: any = {};
      const now = new Date().toISOString();

      switch (phaseNumber) {
        case 1:
          updates.phase_1_completed_at = now;
          updates.phase_1_status = 'Completed';
          break;
        case 2:
          updates.phase_2_completed_at = now;
          updates.phase_2_status = 'Completed';
          break;
        case 3:
          updates.phase_3_completed_at = now;
          updates.phase_3_status = 'Completed';
          break;
        case 4:
          updates.phase_4_completed_at = now;
          updates.phase_4_status = 'Completed';
          updates.completion_date = now;
          updates.visit_status = 'Completed';
          break;
      }

      const updatedVisit = await AMEService.updateVisit(visit.id, updates);
      onVisitUpdate(updatedVisit);
      
      toast({
        title: "Phase Completed",
        description: `Phase ${phaseNumber} has been marked as completed`,
      });

      setCurrentPhase(Math.min(phaseNumber + 1, 4));
      
    } catch (error) {
      console.error('Error completing phase:', error);
      toast({
        title: "Error",
        description: "Failed to complete phase",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: string, notes?: string) => {
    try {
      const updates: any = { status };
      if (notes) updates.technician_notes = notes;
      if (status === 'Completed') {
        updates.completed_at = new Date().toISOString();
      }

      await AMEService.updateVisitTask(taskId, updates);
      await loadVisitData(); // Refresh data
      
      toast({
        title: "Task Updated",
        description: "Task status has been updated",
      });
    } catch (error) {
      console.error('Error updating task:', error);
      toast({
        title: "Error",
        description: "Failed to update task",
        variant: "destructive",
      });
    }
  };

  const phases = [
    {
      number: 1,
      title: "Pre-Visit Documentation",
      icon: FileText,
      description: "Review customer data, access requirements, and prepare documentation",
      status: visit.phase_1_status,
      completed: !!visit.phase_1_completed_at,
    },
    {
      number: 2,
      title: "On-Site Assessment",
      icon: Camera,
      description: "Conduct site assessment, document current state, identify issues",
      status: visit.phase_2_status,
      completed: !!visit.phase_2_completed_at,
    },
    {
      number: 3,
      title: "Maintenance Execution",
      icon: Wrench,
      description: "Perform maintenance tasks, repairs, and system optimization",
      status: visit.phase_3_status,
      completed: !!visit.phase_3_completed_at,
    },
    {
      number: 4,
      title: "Completion & Reporting",
      icon: ClipboardCheck,
      description: "Generate reports, collect signatures, and finalize documentation",
      status: visit.phase_4_status,
      completed: !!visit.phase_4_completed_at,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Visit Progress</span>
            <Badge variant={visit.visit_status === 'Completed' ? 'default' : 'secondary'}>
              {visit.visit_status}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={getPhaseProgress()} className="h-2" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {phases.map((phase) => {
                const Icon = phase.icon;
                return (
                  <div
                    key={phase.number}
                    className={`p-3 rounded-lg border ${
                      phase.completed 
                        ? 'bg-green-50 border-green-200' 
                        : phase.number === currentPhase
                        ? 'bg-blue-50 border-blue-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-4 w-4 ${
                        phase.completed ? 'text-green-600' : 'text-gray-400'
                      }`} />
                      <span className="text-sm font-medium">Phase {phase.number}</span>
                      {phase.completed && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{phase.title}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Details */}
      <Tabs value={`phase-${currentPhase}`} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          {phases.map((phase) => (
            <TabsTrigger 
              key={phase.number} 
              value={`phase-${phase.number}`}
              disabled={phase.number > currentPhase && !phase.completed}
            >
              Phase {phase.number}
            </TabsTrigger>
          ))}
        </TabsList>

        {phases.map((phase) => (
          <TabsContent key={phase.number} value={`phase-${phase.number}`}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <phase.icon className="h-5 w-5" />
                  <span>{phase.title}</span>
                  <Badge variant={phase.completed ? 'default' : 'secondary'}>
                    {phase.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">{phase.description}</p>
                
                {/* Phase-specific tasks */}
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">Tasks</h3>
                  {tasks
                    .filter(task => task.category.includes(`Phase ${phase.number}`))
                    .map(task => {
                      const visitTask = visitTasks.find(vt => vt.task_id === task.id);
                      return (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <div className="font-medium">{task.task_name}</div>
                            <div className="text-sm text-muted-foreground">
                              {task.duration ? `${task.duration} minutes` : 'Duration varies'}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={
                              visitTask?.status === 'Completed' ? 'default' :
                              visitTask?.status === 'In Progress' ? 'secondary' : 'outline'
                            }>
                              {visitTask?.status || 'Pending'}
                            </Badge>
                            {visitTask && visitTask.status !== 'Completed' && (
                              <Button
                                size="sm"
                                onClick={() => updateTaskStatus(visitTask.id, 'Completed')}
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Phase completion button */}
                {!phase.completed && phase.number === currentPhase && (
                  <Button
                    onClick={() => completePhase(phase.number)}
                    disabled={loading}
                    className="w-full"
                  >
                    Complete Phase {phase.number}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};