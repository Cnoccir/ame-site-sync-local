import { useEffect, useState } from 'react';
import { DashboardStats } from '@/components/dashboard/DashboardStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { KeyLinks } from '@/components/dashboard/KeyLinks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats as StatsType } from '@/types';
import { AMEService } from '@/services/ameService';

export const Dashboard = () => {
  const [stats, setStats] = useState<StatsType>({
    total_customers: 0,
    active_visits: 0,
    reports_generated: 0,
    overdue_visits: 0,
    recent_activity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const [customers, visits] = await Promise.all([
          AMEService.getCustomers(),
          AMEService.getActiveVisits()
        ]);

        const now = new Date();
        const overdueCustomers = customers.filter(customer => {
          if (!customer.next_due) return false;
          return new Date(customer.next_due) < now;
        });

        setStats({
          total_customers: customers.length,
          active_visits: visits.length,
          reports_generated: 0, // This would come from reports table
          overdue_visits: overdueCustomers.length,
          recent_activity: [] // This would come from activity logs
        });
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8">
        <div className="ame-welcome-section">
          <h1 className="ame-welcome-title">Welcome to AME Maintenance System</h1>
          <p className="ame-welcome-subtitle">Professional building automation maintenance management</p>
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'rgb(var(--ame-success))' }}></div>
              <span>Loading System Data...</span>
            </div>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 animate-spin border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

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
            <span>Production Mode</span>
          </div>
        </div>
      </div>

      {/* Stats Grid - exact original layout */}
      <DashboardStats stats={stats} />

      {/* Content Grid - exact original layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity />
        <KeyLinks />
      </div>
    </div>
  );
};