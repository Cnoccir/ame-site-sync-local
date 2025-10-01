import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, FileText, Play, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

interface PMSession {
  id: string;
  customer_data?: {
    company_name?: string;
    site_name?: string;
  };
  service_tier: string;
  status: string;
  completion_percentage: number;
  updated_at: string;
  current_phase: number;
  technician_name?: string;
}

export const RecentSessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<PMSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentSessions();
  }, []);

  const loadRecentSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('pm_workflow_sessions')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Recent PM Sessions
          </div>
          <Badge variant="outline">{sessions.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No recent sessions</p>
            <p className="text-sm">Your PM visit history will appear here</p>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                 onClick={() => navigate(`/pm-workflow/${session.id}`)}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {session.customer_data?.site_name || 'Unknown Site'}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {session.customer_data?.company_name || 'Unknown Customer'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Phase {session.current_phase} • {session.technician_name || 'Unassigned'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getTierColor(session.service_tier)} variant="secondary">
                    {session.service_tier}
                  </Badge>
                  <Badge className={getStatusColor(session.status)} variant="secondary">
                    {session.status === 'in_progress' ? 'In Progress' :
                     session.status === 'completed' ? 'Completed' : session.status}
                  </Badge>
                </div>
              </div>

              {session.status === 'in_progress' && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{session.completion_percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${session.completion_percentage}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                </span>
                
                <div className="flex gap-2">
                  {session.status === 'in_progress' ? (
                    <Button size="sm" className="gap-1" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/pm-workflow/${session.id}`);
                    }}>
                      <Play className="h-3 w-3" />
                      Resume
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1" onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Navigate to report view
                    }}>
                      <FileText className="h-3 w-3" />
                      View Report
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={() => navigate('/sessions')}>
            View All Sessions
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={loadRecentSessions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};