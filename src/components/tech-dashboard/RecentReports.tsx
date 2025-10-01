import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  FileText,
  Download,
  Eye,
  Clock,
  Building,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { PMWorkflowPersistenceService, PMWorkflowSession } from '@/services/pmWorkflowPersistenceService';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

export const RecentReports = () => {
  const { toast } = useToast();
  const [completedSessions, setCompletedSessions] = useState<PMWorkflowSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCompletedSessions();
  }, []);

  const loadCompletedSessions = async (isRefresh = false) => {
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

      // Filter for completed sessions in the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentCompleted = allSessions
        .filter(session => {
          const isCompleted = session.status === 'Completed' || session.status === 'completed';
          const completedDate = session.completed_at || session.updated_at;
          const isRecent = completedDate ? new Date(completedDate) > thirtyDaysAgo : false;

          return isCompleted && isRecent;
        })
        .sort((a, b) => {
          const dateA = new Date(b.completed_at || b.updated_at || '').getTime();
          const dateB = new Date(a.completed_at || a.updated_at || '').getTime();
          return dateA - dateB;
        })
        .slice(0, 10); // Show max 10 recent reports

      setCompletedSessions(recentCompleted);
    } catch (error) {
      console.error('Error loading completed sessions:', error);

      // Check if this is a network/database connectivity issue
      const isNetworkError = error instanceof Error &&
        (error.message.includes('Failed to fetch') ||
         error.message.includes('Network timeout') ||
         error.message.includes('connection timeout'));

      if (isNetworkError) {
        // Don't show fake data - just empty state with connectivity message
        setCompletedSessions([]);
        // Don't show toast - let the component handle the empty state gracefully
        console.warn('Database connectivity issue - showing empty state');
      } else {
        setCompletedSessions([]);
        toast({
          title: 'Error',
          description: 'Failed to load recent reports',
          variant: 'destructive'
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleViewReport = (sessionId: string) => {
    // TODO: Navigate to report view - using placeholder for now
    toast({
      title: 'Report Viewer',
      description: 'Report viewing functionality coming soon',
    });
  };

  const handleDownloadReport = async (session: PMWorkflowSession) => {
    try {
      // TODO: Implement PDF download - using placeholder for now
      toast({
        title: 'Download Started',
        description: `Downloading report for "${session.session_name || 'Untitled Session'}"`,
      });
    } catch (error) {
      toast({
        title: 'Download Failed',
        description: 'Could not download the report',
        variant: 'destructive'
      });
    }
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-green-600" />
            Recent Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="border rounded-lg p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
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
            <FileText className="w-5 h-5 text-green-600" />
            Recent Reports
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {completedSessions.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => loadCompletedSessions(true)}
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {completedSessions.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
              <FileText className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="font-medium text-gray-900 mb-2">No recent reports</h3>
            <p className="text-sm text-gray-600 mb-4">
              Complete PM sessions to generate reports
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
            {completedSessions.map((session) => (
              <div
                key={session.id}
                className="border rounded-lg p-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
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
                        Completed {
                          session.completed_at
                            ? formatDistanceToNow(new Date(session.completed_at), { addSuffix: true })
                            : 'recently'
                        }
                      </span>
                    </div>

                    {/* Report status */}
                    <div className="flex items-center gap-2">
                      {session.report_generated ? (
                        <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                          <FileText className="w-3 h-3 mr-1" />
                          PDF Ready
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-700 border-yellow-200 bg-yellow-50">
                          <Clock className="w-3 h-3 mr-1" />
                          Generating
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewReport(session.id)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    {session.report_generated && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadReport(session)}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        PDF
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* View all reports link */}
            {completedSessions.length > 0 && (
              <div className="pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    // TODO: Navigate to reports page
                    toast({
                      title: 'Reports Page',
                      description: 'Full reports page coming soon',
                    });
                  }}
                >
                  View All Reports
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};