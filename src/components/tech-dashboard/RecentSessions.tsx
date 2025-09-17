import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, ArrowRight, FileText, Play } from 'lucide-react';

export const RecentSessions = () => {
  // Mock data - in real implementation, this would come from database
  const recentSessions = [
    {
      id: 'WF-001',
      siteName: 'Downtown Office Building',
      customerName: 'Metro Properties',
      status: 'In Progress',
      progress: 85,
      lastUpdated: '2 hours ago',
      serviceTier: 'ASSURE',
      canResume: true
    },
    {
      id: 'WF-002',
      siteName: 'West Campus Facility',
      customerName: 'University Medical',
      status: 'Completed',
      progress: 100,
      lastUpdated: 'Yesterday 3:45 PM',
      serviceTier: 'CORE',
      canResume: false
    },
    {
      id: 'WF-003',
      siteName: 'Manufacturing Plant A',
      customerName: 'Industrial Solutions',
      status: 'Completed',
      progress: 100,
      lastUpdated: 'Dec 15, 2024',
      serviceTier: 'GUARDIAN',
      canResume: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Completed':
        return 'bg-green-100 text-green-800 border-green-200';
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
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Recent Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {recentSessions.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No recent sessions</p>
            <p className="text-sm">Your PM visit history will appear here</p>
          </div>
        ) : (
          recentSessions.map((session) => (
            <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {session.siteName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {session.customerName}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getTierColor(session.serviceTier)} variant="secondary">
                    {session.serviceTier}
                  </Badge>
                  <Badge className={getStatusColor(session.status)} variant="secondary">
                    {session.status}
                  </Badge>
                </div>
              </div>

              {session.status === 'In Progress' && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-medium">{session.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${session.progress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {session.lastUpdated}
                </span>
                
                <div className="flex gap-2">
                  {session.canResume ? (
                    <Button size="sm" className="gap-1">
                      <Play className="h-3 w-3" />
                      Resume
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="gap-1">
                      <FileText className="h-3 w-3" />
                      View Report
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        
        {recentSessions.length > 0 && (
          <Button variant="outline" className="w-full mt-4">
            View All Sessions
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};