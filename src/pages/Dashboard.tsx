import { useEffect, useState } from 'react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { KeyLinks } from '@/components/dashboard/KeyLinks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { sampleDashboardStats } from '@/data/sampleData';
import { DashboardStats as StatsType } from '@/types';

export const Dashboard = () => {
  const [stats, setStats] = useState<StatsType>(sampleDashboardStats);

  useEffect(() => {
    // In a real app, this would fetch from an API
    setStats(sampleDashboardStats);
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Banner - exact original styling */}
      <Card className="bg-gradient-to-r from-ame-blue to-ame-blue-dark text-white border-0 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl font-bold">Welcome to AME Maintenance System</CardTitle>
          <CardDescription className="text-white/80">
            Professional building automation maintenance management
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span>System Status: ONLINE</span>
            </div>
            <div className="text-white/60">|</div>
            <div className="flex items-center space-x-2">
              <span>Development Mode</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid - exact original layout */}
      <DashboardStats stats={stats} />

      {/* Content Grid - exact original layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity activities={stats.recent_activity} />
        <KeyLinks />
      </div>
    </div>
  );
};