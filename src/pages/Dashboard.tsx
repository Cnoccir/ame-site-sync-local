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
    <div className="p-8">
      {/* Welcome Section - exact original styling */}
      <div className="ame-welcome-section">
        <h1 className="ame-welcome-title">Welcome to AME Maintenance System</h1>
        <p className="ame-welcome-subtitle">Professional building automation maintenance management</p>
        <div className="flex items-center space-x-6 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full" style={{ background: 'rgb(var(--ame-success))' }}></div>
            <span>System Status: ONLINE</span>
          </div>
          <div className="text-white/60">|</div>
          <div className="flex items-center space-x-2">
            <span>Development Mode</span>
          </div>
        </div>
      </div>

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