import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Search,
  Database,
  Users,
  Settings,
  FileText,
  Upload,
  BarChart3
} from 'lucide-react';

export const QuickActions = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: <Plus className="h-4 w-4" />,
      label: 'New Customer',
      description: 'Add customer site',
      action: () => navigate('/customers/new'),
      className: 'bg-blue-600 hover:bg-blue-700 text-white'
    },
    {
      icon: <Search className="h-4 w-4" />,
      label: 'Find Customer',
      description: 'Search database',
      action: () => navigate('/customers'),
      className: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
    },
    {
      icon: <Database className="h-4 w-4" />,
      label: 'System Analysis',
      description: 'Import Tridium exports',
      action: () => navigate('/system-analysis'),
      className: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
    },
    {
      icon: <FileText className="h-4 w-4" />,
      label: 'Task Library',
      description: 'SOPs & procedures',
      action: () => navigate('/task-library'),
      className: 'bg-white hover:bg-gray-50 text-gray-900 border border-gray-300'
    }
  ];

  const systemActions = [
    {
      icon: <BarChart3 className="h-4 w-4" />,
      label: 'Reports',
      count: 'View'
    },
    {
      icon: <Users className="h-4 w-4" />,
      label: 'Technicians',
      count: '116'
    },
    {
      icon: <Settings className="h-4 w-4" />,
      label: 'Settings',
      count: 'Config'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Primary Actions */}
        <div className="space-y-2">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              onClick={action.action}
              className={`w-full justify-start gap-2 h-auto p-3 ${action.className}`}
              variant="outline"
            >
              <div className="flex items-start gap-2 w-full">
                {action.icon}
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">{action.label}</div>
                  <div className="text-xs opacity-75">{action.description}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>

        <div className="border-t border-gray-200 pt-4">
          <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">
            System
          </div>
          <div className="space-y-2">
            {systemActions.map((action, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  {action.icon}
                  <span className="text-sm text-gray-700">{action.label}</span>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {action.count}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Status */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Database Status</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-green-600 font-medium">Connected</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-gray-500">Last Backup</span>
            <span className="text-gray-600">2 hours ago</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};