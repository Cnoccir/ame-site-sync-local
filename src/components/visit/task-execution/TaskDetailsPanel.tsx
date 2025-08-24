import React from 'react';
import { Clock, Play, CheckCircle, Eye, Wrench, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TaskTimer } from './TaskTimer';

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

interface TaskDetailsPanelProps {
  task: ServiceTierTask | null;
  taskStatus: string;
  onTaskStart: (task: ServiceTierTask) => void;
  onTaskComplete: (task: ServiceTierTask) => void;
  onViewSOP: (task: ServiceTierTask) => void;
  timer?: number;
}

export const TaskDetailsPanel: React.FC<TaskDetailsPanelProps> = ({
  task,
  taskStatus,
  onTaskStart,
  onTaskComplete,
  onViewSOP,
  timer
}) => {
  if (!task) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Select a Task</h3>
            <p className="text-muted-foreground">
              Choose a task from the list to view details and procedures
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'skipped':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">{task.task_name}</CardTitle>
          <Badge className={getStatusBadgeColor(taskStatus)}>
            {taskStatus.replace('_', ' ')}
          </Badge>
        </div>
        <p className="text-muted-foreground">{task.description}</p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Duration and Timer */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Estimated: {task.estimated_duration} minutes
            </span>
          </div>
          {timer && taskStatus === 'in_progress' && (
            <TaskTimer 
              startTime={timer} 
              estimatedDuration={task.estimated_duration}
            />
          )}
        </div>

        {/* Prerequisites */}
        {task.prerequisites && task.prerequisites.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Prerequisites</h4>
            <ul className="space-y-1">
              {task.prerequisites.map((prereq, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {prereq}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Required Tools */}
        {task.tools_required && task.tools_required.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Required Tools
            </h4>
            <div className="flex flex-wrap gap-2">
              {task.tools_required.map((tool, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Navigation Path (placeholder) */}
        <div>
          <h4 className="font-medium mb-2">Navigation Path</h4>
          <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
            System Interface → {task.category} → {task.task_name}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          {taskStatus === 'not_started' && (
            <Button onClick={() => onTaskStart(task)} className="flex-1">
              <Play className="w-4 h-4 mr-2" />
              Start Task
            </Button>
          )}
          
          {taskStatus === 'in_progress' && (
            <Button onClick={() => onTaskComplete(task)} className="flex-1">
              <CheckCircle className="w-4 h-4 mr-2" />
              Complete Task
            </Button>
          )}
          
          {taskStatus === 'completed' && (
            <Badge variant="outline" className="flex-1 justify-center py-2 text-green-600">
              <CheckCircle className="w-4 h-4 mr-2" />
              Task Completed
            </Badge>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => onViewSOP(task)}
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            View SOP
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};