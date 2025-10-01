import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Clock,
  User,
  Building,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { PMWorkflowPersistenceService, PMWorkflowSession } from '@/services/pmWorkflowPersistenceService';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export const ResumeWork = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [sessions, setSessions] = useState<PMWorkflowSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadInProgressSessions();
  }, []);

  const loadInProgressSessions = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Add timeout protection for network calls
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Network timeout after 3 seconds')), 3000);
      });

      const sessionPromise = PMWorkflowPersistenceService.getAllSessions();
      const allSessions = await Promise.race([sessionPromise, timeoutPromise]);

      // Filter for in-progress sessions only
      const inProgressSessions = allSessions
        .filter(session =>
          session.status === 'Draft' ||
          session.status === 'In Progress' ||
          session.status === 'in_progress'
        )
        .sort((a, b) =>
          new Date(b.updated_at || b.created_at || '').getTime() -
          new Date(a.updated_at || a.created_at || '').getTime()
        )
        .slice(0, 5); // Show max 5 recent sessions

      setSessions(inProgressSessions);
    } catch (error) {
      console.error('Error loading in-progress sessions:', error);

      // Check if this is a network/database connectivity issue
      const isNetworkError = error instanceof Error &&
        (error.message.includes('Failed to fetch') ||
         error.message.includes('Network timeout') ||
         error.message.includes('connection timeout'));

      if (isNetworkError) {
        // Don't show fake data - just empty state with connectivity message
        setSessions([]);
        // Don't show toast - let the component handle the empty state gracefully
        console.warn('Database connectivity issue - showing empty state');
      } else {
        setSessions([]);
        toast({
          title: 'Error',
          description: 'Failed to load in-progress sessions',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleResumeSession = (sessionId: string) => {
    navigate(`/pm-workflow/${sessionId}`);
  };

  const getServiceTierColor = (tier: string) => {
    switch (tier) {
      case 'CORE':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'ASSURE':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'GUARDIAN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPhaseProgress = (currentPhase: number) => {
    return Math.round((currentPhase / 4) * 100);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            Resume Work
          </CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-blue-600" />
            Resume Work
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {sessions.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadInProgressSessions(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <Play className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">No sessions in progress</h3>
            <p className="text-sm text-gray-600 mb-4">
              Start your first PM session to begin
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.querySelector<HTMLButtonElement>('[data-pm-cta-button]')?.click()}
            >
              Start PM Session
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:bg-gray-50/50 transition-colors cursor-pointer"
                onClick={() => handleResumeSession(session.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-900 truncate">
                        {session.session_name || 'Untitled Session'}
                      </h4>
                      <Badge className={getServiceTierColor(session.service_tier)}>
                        {session.service_tier}
                      </Badge>
                    </div>

                    {session.customer_data?.companyName && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                        <Building className="w-3 h-3" />
                        <span className="truncate">{session.customer_data.companyName}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                      <Clock className="w-3 h-3" />
                      <span>
                        {session.updated_at
                          ? formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })
                          : 'Recently updated'
                        }
                      </span>
                    </div>

                    {/* Phase progress */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-gray-500">Phase {session.current_phase || 1} of 4</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${getPhaseProgress(session.current_phase || 1)}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {getPhaseProgress(session.current_phase || 1)}%
                      </span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="ml-4 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleResumeSession(session.id);
                    }}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Resume
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};