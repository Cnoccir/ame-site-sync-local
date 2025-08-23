import { Users, Activity, FileText, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardStats as StatsType } from '@/types';

interface DashboardStatsProps {
  stats: StatsType;
}

export const DashboardStats = ({ stats }: DashboardStatsProps) => {
  const statCards = [
    {
      title: 'TOTAL CUSTOMERS',
      value: stats.total_customers,
      icon: Users,
      color: 'text-ame-blue',
      description: 'Active customer projects'
    },
    {
      title: 'ACTIVE VISITS',
      value: stats.active_visits,
      icon: Activity,
      color: 'text-success',
      description: 'Currently in progress'
    },
    {
      title: 'REPORTS GENERATED',
      value: stats.reports_generated,
      icon: FileText,
      color: 'text-primary',
      description: 'Past 30 days'
    },
    {
      title: 'OVERDUE VISITS',
      value: stats.overdue_visits,
      icon: AlertTriangle,
      color: 'text-warning',
      description: 'Require attention'
    }
  ];

  return (
    <div className="ame-stats-grid">
      {statCards.map((stat) => (
        <div key={stat.title} className="ame-stat-card">
          <div className="ame-stat-icon">
            <stat.icon />
          </div>
          <div className="ame-stat-label">{stat.title}</div>
          <div className="ame-stat-value">{stat.value}</div>
          <div className="ame-stat-description">{stat.description}</div>
        </div>
      ))}
    </div>
  );
};