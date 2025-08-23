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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => (
        <Card key={stat.title} className="border-card-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
              <stat.icon className="w-5 h-5" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {stat.title}
              </p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};