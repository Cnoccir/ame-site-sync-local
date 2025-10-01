import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Users,
  Building2,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface SystemStats {
  totalCustomers: number;
  activeSessions: number;
  totalTechnicians: number;
  recentActivity: number;
  serviceTierBreakdown: Record<string, number>;
  systemHealth: 'healthy' | 'warning' | 'error';
}

export const SystemMetrics = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalCustomers: 0,
    activeSessions: 0,
    totalTechnicians: 0,
    recentActivity: 0,
    serviceTierBreakdown: {},
    systemHealth: 'healthy'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      // Get customer count and service tier breakdown
      const { data: customers, error: customersError } = await supabase
        .from('ame_customers')
        .select('service_tier, contract_status');

      if (customersError) throw customersError;

      // Get active PM sessions count
      const { data: sessions, error: sessionsError } = await supabase
        .from('pm_workflow_sessions')
        .select('*')
        .eq('status', 'in_progress');

      if (sessionsError) throw sessionsError;

      // Get technician count
      const { data: technicians, error: techError } = await supabase
        .from('ame_employees')
        .select('*')
        .eq('is_active', true)
        .eq('is_technician', true);

      if (techError) throw techError;

      // Calculate service tier breakdown
      const tierBreakdown: Record<string, number> = {};
      customers?.forEach(customer => {
        const tier = customer.service_tier || 'CORE';
        tierBreakdown[tier] = (tierBreakdown[tier] || 0) + 1;
      });

      // Get recent activity (sessions in last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: recentSessions, error: recentError } = await supabase
        .from('pm_workflow_sessions')
        .select('*')
        .gte('created_at', weekAgo.toISOString());

      if (recentError) throw recentError;

      // Determine system health based on active sessions and recent activity
      const systemHealth: 'healthy' | 'warning' | 'error' =
        (sessions?.length || 0) > 5 ? 'warning' :
        (customers?.length || 0) === 0 ? 'error' : 'healthy';

      setStats({
        totalCustomers: customers?.length || 0,
        activeSessions: sessions?.length || 0,
        totalTechnicians: technicians?.length || 0,
        recentActivity: recentSessions?.length || 0,
        serviceTierBreakdown: tierBreakdown,
        systemHealth
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
      setStats(prev => ({ ...prev, systemHealth: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const getHealthIcon = () => {
    switch (stats.systemHealth) {
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
  };

  const getHealthColor = () => {
    switch (stats.systemHealth) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            System Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-blue-600" />
          System Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* System Health Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2">
            {getHealthIcon()}
            <span className={`font-medium ${getHealthColor()}`}>
              {stats.systemHealth === 'healthy' ? 'System Healthy' :
               stats.systemHealth === 'warning' ? 'High Load' : 'System Issues'}
            </span>
          </div>
          <Badge variant="outline" className={getHealthColor()}>
            {stats.systemHealth.toUpperCase()}
          </Badge>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Building2 className="h-4 w-4" />
              Customers
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalCustomers}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="h-4 w-4" />
              Technicians
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {stats.totalTechnicians}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Activity className="h-4 w-4" />
              Active Sessions
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats.activeSessions}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <TrendingUp className="h-4 w-4" />
              This Week
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.recentActivity}
            </div>
          </div>
        </div>

        {/* Service Tier Breakdown */}
        {Object.keys(stats.serviceTierBreakdown).length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Database className="h-4 w-4" />
              Service Tier Distribution
            </div>
            <div className="space-y-2">
              {Object.entries(stats.serviceTierBreakdown).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className={
                        tier === 'CORE' ? 'bg-green-100 text-green-700' :
                        tier === 'ASSURE' ? 'bg-blue-100 text-blue-700' :
                        tier === 'GUARDIAN' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }
                    >
                      {tier}
                    </Badge>
                  </div>
                  <span className="font-medium text-gray-900">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* System Status Footer */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated {new Date().toLocaleTimeString()}
            </div>
            <button
              onClick={loadSystemStats}
              className="hover:text-blue-600 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};