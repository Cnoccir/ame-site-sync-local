import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckSquare,
  Clock,
  Wrench,
  Database,
  Settings,
  FileText,
  ArrowRight,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TaskStats {
  totalTasks: number;
  sopCount: number;
  tasksByPhase: Record<string, number>;
  tasksByTier: Record<string, number>;
  avgDuration: number;
}

export const TechTasksOverview = () => {
  const [taskStats, setTaskStats] = useState<TaskStats>({
    totalTasks: 0,
    sopCount: 0,
    tasksByPhase: {},
    tasksByTier: {},
    avgDuration: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTaskStats();
  }, []);

  const loadTaskStats = async () => {
    try {
      // Get task data
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*');

      if (tasksError) throw tasksError;

      // Get SOP data
      const { data: sops, error: sopsError } = await supabase
        .from('sops')
        .select('*');

      if (sopsError) throw sopsError;

      // Calculate statistics
      const tasksByPhase: Record<string, number> = {};
      const tasksByTier: Record<string, number> = {};
      let totalDuration = 0;

      tasks?.forEach(task => {
        // Phase breakdown
        const phase = task.phase || 'Unknown';
        tasksByPhase[phase] = (tasksByPhase[phase] || 0) + 1;

        // Service tier breakdown
        const tiers = task.service_tiers ? task.service_tiers.split(',') : ['CORE'];
        tiers.forEach((tier: string) => {
          const cleanTier = tier.trim();
          tasksByTier[cleanTier] = (tasksByTier[cleanTier] || 0) + 1;
        });

        // Duration calculation
        if (task.estimated_duration_min) {
          totalDuration += task.estimated_duration_min;
        }
      });

      const avgDuration = tasks?.length ? Math.round(totalDuration / tasks.length) : 0;

      setTaskStats({
        totalTasks: tasks?.length || 0,
        sopCount: sops?.length || 0,
        tasksByPhase,
        tasksByTier,
        avgDuration
      });
    } catch (error) {
      console.error('Error loading task stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase.toLowerCase()) {
      case 'phase 1':
      case '1':
        return <Users className="h-4 w-4" />;
      case 'phase 2':
      case '2':
        return <Database className="h-4 w-4" />;
      case 'phase 3':
      case '3':
        return <Settings className="h-4 w-4" />;
      case 'phase 4':
      case '4':
        return <FileText className="h-4 w-4" />;
      default:
        return <CheckSquare className="h-4 w-4" />;
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'CORE':
        return 'bg-green-100 text-green-700';
      case 'ASSURE':
        return 'bg-blue-100 text-blue-700';
      case 'GUARDIAN':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            Technical Task Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5 text-blue-600" />
            Technical Task Overview
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            View Library
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{taskStats.totalTasks}</div>
            <div className="text-sm text-blue-700">Total Tasks</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{taskStats.sopCount}</div>
            <div className="text-sm text-green-700">SOPs</div>
          </div>

          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{taskStats.avgDuration}</div>
            <div className="text-sm text-purple-700">Avg Min</div>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <div className="flex items-center justify-center gap-1">
              <Wrench className="h-5 w-5 text-orange-600" />
            </div>
            <div className="text-sm text-orange-700">Ready</div>
          </div>
        </div>

        {/* Task Distribution */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* By Phase */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Tasks by Phase
            </h4>
            <div className="space-y-2">
              {Object.entries(taskStats.tasksByPhase).map(([phase, count]) => (
                <div key={phase} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getPhaseIcon(phase)}
                    <span className="font-medium text-gray-900">{phase}</span>
                  </div>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* By Service Tier */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Service Tier Coverage
            </h4>
            <div className="space-y-2">
              {Object.entries(taskStats.tasksByTier).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Badge className={getTierColor(tier)}>
                    {tier}
                  </Badge>
                  <span className="font-medium text-gray-900">{count} tasks</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Capabilities */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="font-medium text-gray-900 mb-4">System Capabilities</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <Database className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">BMS Analysis</div>
              <div className="text-xs text-gray-600">Automated exports</div>
            </div>

            <div className="text-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <Settings className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Task Automation</div>
              <div className="text-xs text-gray-600">SOP-guided</div>
            </div>

            <div className="text-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <FileText className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">PDF Reports</div>
              <div className="text-xs text-gray-600">Professional output</div>
            </div>

            <div className="text-center p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <CheckSquare className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-900">Quality Control</div>
              <div className="text-xs text-gray-600">Systematic</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};