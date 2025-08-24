import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Cpu, 
  HardDrive, 
  Network, 
  Clock,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { TridiumDataset } from '@/types/tridium';

interface NetworkHealthDashboardProps {
  datasets: TridiumDataset[];
  onAnalysisComplete: (healthMetrics: any) => void;
}

interface HealthMetric {
  name: string;
  value: number | string;
  unit?: string;
  status: 'good' | 'warning' | 'critical' | 'unknown';
  threshold?: number;
  description: string;
  trend?: 'up' | 'down' | 'stable';
}

interface SystemAlert {
  type: 'critical' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp?: Date;
}

export const NetworkHealthDashboard: React.FC<NetworkHealthDashboardProps> = ({
  datasets,
  onAnalysisComplete
}) => {
  const [healthMetrics, setHealthMetrics] = useState<HealthMetric[]>([]);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);
  const [analysisStarted, setAnalysisStarted] = useState(false);

  // Parse resource metrics from datasets
  const resourceData = useMemo(() => {
    const resourceDatasets = datasets.filter(d => d.type === 'resourceMetrics');
    const metrics: Record<string, any> = {};
    
    resourceDatasets.forEach(dataset => {
      dataset.rows.forEach(row => {
        const name = row.data.Name;
        const value = row.data.Value;
        if (name && value) {
          metrics[name] = value;
        }
      });
    });
    
    return metrics;
  }, [datasets]);

  // Parse device status from datasets
  const deviceStatus = useMemo(() => {
    const deviceDatasets = datasets.filter(d => 
      d.type === 'networkDevices' || d.type === 'bacnetDevices' || d.type === 'niagaraStations'
    );
    
    const statusCounts = {
      total: 0,
      online: 0,
      offline: 0,
      alarm: 0,
      unknown: 0
    };

    const criticalDevices: string[] = [];

    deviceDatasets.forEach(dataset => {
      dataset.rows.forEach(row => {
        statusCounts.total++;
        
        if (row.parsedStatus) {
          const status = row.parsedStatus;
          if (status.status === 'ok') {
            statusCounts.online++;
          } else if (status.status === 'down') {
            statusCounts.offline++;
            criticalDevices.push(`${row.data.Name} - OFFLINE`);
          } else if (status.status === 'alarm') {
            statusCounts.alarm++;
            criticalDevices.push(`${row.data.Name} - ALARM`);
          } else {
            statusCounts.unknown++;
          }
        }
      });
    });

    return { statusCounts, criticalDevices };
  }, [datasets]);

  const parseResourceMetric = (value: string): { numeric: number; unit?: string; type: string } => {
    if (typeof value !== 'string') return { numeric: 0, type: 'unknown' };
    
    // Handle percentages
    if (value.includes('%')) {
      return { 
        numeric: parseFloat(value.replace('%', '')), 
        unit: '%', 
        type: 'percentage' 
      };
    }
    
    // Handle memory values
    if (value.includes(' MB')) {
      return { 
        numeric: parseFloat(value.replace(' MB', '')), 
        unit: 'MB', 
        type: 'memory' 
      };
    }
    
    // Handle capacity values with limits
    if (value.includes('(Limit:')) {
      const match = value.match(/^([0-9,]+).*?\(Limit:\s*([0-9,]+|none)\)/);
      if (match) {
        const current = parseInt(match[1].replace(/,/g, ''));
        const limit = match[2] === 'none' ? null : parseInt(match[2].replace(/,/g, ''));
        return {
          numeric: limit ? (current / limit) * 100 : current,
          unit: limit ? '%' : '',
          type: 'capacity'
        };
      }
    }
    
    // Handle duration values
    if (value.includes('days') || value.includes('hours')) {
      // Convert to hours for comparison
      const days = value.match(/(\d+)\s*days?/)?.[1] || '0';
      const hours = value.match(/(\d+)\s*hours?/)?.[1] || '0';
      return {
        numeric: parseInt(days) * 24 + parseInt(hours),
        unit: 'hours',
        type: 'duration'
      };
    }
    
    // Try to parse as number
    const numericValue = parseFloat(value.replace(/[^\d.-]/g, ''));
    return {
      numeric: isNaN(numericValue) ? 0 : numericValue,
      type: 'number'
    };
  };

  const runHealthAnalysis = () => {
    setAnalysisStarted(true);
    
    const metrics: HealthMetric[] = [];
    const alerts: SystemAlert[] = [];

    // Analyze CPU usage
    if (resourceData['cpu.usage']) {
      const cpuData = parseResourceMetric(resourceData['cpu.usage']);
      const cpuUsage = cpuData.numeric;
      
      metrics.push({
        name: 'CPU Usage',
        value: cpuUsage,
        unit: '%',
        status: cpuUsage > 90 ? 'critical' : cpuUsage > 75 ? 'warning' : 'good',
        threshold: 75,
        description: 'Processor utilization of the building automation system',
        trend: cpuUsage > 85 ? 'up' : 'stable'
      });

      if (cpuUsage > 90) {
        alerts.push({
          type: 'critical',
          message: 'CRITICAL: CPU usage above 90%',
          details: 'System performance may be severely degraded. Consider restart or load reduction.',
          timestamp: new Date()
        });
      } else if (cpuUsage > 75) {
        alerts.push({
          type: 'warning',
          message: 'HIGH: CPU usage above 75%',
          details: 'Monitor system performance and consider optimization.',
          timestamp: new Date()
        });
      }
    }

    // Analyze memory usage
    if (resourceData['heap.used'] && resourceData['heap.max']) {
      const heapUsed = parseResourceMetric(resourceData['heap.used']).numeric;
      const heapMax = parseResourceMetric(resourceData['heap.max']).numeric;
      const memoryPercent = (heapUsed / heapMax) * 100;
      
      metrics.push({
        name: 'Memory Usage',
        value: memoryPercent,
        unit: '%',
        status: memoryPercent > 95 ? 'critical' : memoryPercent > 85 ? 'warning' : 'good',
        threshold: 85,
        description: `${heapUsed.toFixed(0)} MB / ${heapMax.toFixed(0)} MB heap memory utilization`,
        trend: memoryPercent > 90 ? 'up' : 'stable'
      });

      if (memoryPercent > 95) {
        alerts.push({
          type: 'critical',
          message: 'CRITICAL: Memory usage above 95%',
          details: 'System restart may be required soon to prevent crashes.',
          timestamp: new Date()
        });
      }
    }

    // Analyze system uptime
    if (resourceData['time.uptime']) {
      const uptimeData = parseResourceMetric(resourceData['time.uptime']);
      const uptimeHours = uptimeData.numeric;
      
      metrics.push({
        name: 'System Uptime',
        value: uptimeHours > 24 ? Math.round(uptimeHours / 24) : uptimeHours,
        unit: uptimeHours > 24 ? 'days' : 'hours',
        status: uptimeHours < 1 ? 'warning' : 'good',
        description: 'Time since last system restart',
        trend: 'up'
      });

      if (uptimeHours < 1) {
        alerts.push({
          type: 'warning',
          message: 'Recent system restart detected',
          details: 'System has been restarted within the last hour.',
          timestamp: new Date()
        });
      }
    }

    // Analyze device capacity
    if (resourceData['globalCapacity.devices']) {
      const deviceData = parseResourceMetric(resourceData['globalCapacity.devices']);
      const devicePercent = deviceData.numeric;
      
      metrics.push({
        name: 'Device Capacity',
        value: devicePercent,
        unit: '%',
        status: devicePercent > 90 ? 'warning' : devicePercent > 95 ? 'critical' : 'good',
        threshold: 90,
        description: 'Percentage of maximum device capacity in use',
        trend: devicePercent > 85 ? 'up' : 'stable'
      });

      if (devicePercent > 95) {
        alerts.push({
          type: 'critical',
          message: 'Device capacity near limit',
          details: 'Consider upgrading or redistributing devices across controllers.',
          timestamp: new Date()
        });
      }
    }

    // Analyze point capacity
    if (resourceData['globalCapacity.points']) {
      const pointData = parseResourceMetric(resourceData['globalCapacity.points']);
      const pointPercent = pointData.numeric;
      
      metrics.push({
        name: 'Point Capacity',
        value: pointPercent,
        unit: '%',
        status: pointPercent > 90 ? 'warning' : pointPercent > 95 ? 'critical' : 'good',
        threshold: 90,
        description: 'Percentage of maximum point capacity in use',
        trend: pointPercent > 85 ? 'up' : 'stable'
      });
    }

    // Analyze network device health
    const networkHealth = (deviceStatus.statusCounts.online / deviceStatus.statusCounts.total) * 100;
    
    metrics.push({
      name: 'Network Health',
      value: networkHealth,
      unit: '%',
      status: networkHealth < 90 ? 'critical' : networkHealth < 95 ? 'warning' : 'good',
      threshold: 95,
      description: `${deviceStatus.statusCounts.online}/${deviceStatus.statusCounts.total} devices online`,
      trend: deviceStatus.statusCounts.offline > 0 ? 'down' : 'stable'
    });

    if (deviceStatus.statusCounts.offline > 0) {
      alerts.push({
        type: deviceStatus.statusCounts.offline > 5 ? 'critical' : 'warning',
        message: `${deviceStatus.statusCounts.offline} devices offline`,
        details: 'Check network connectivity and device status.',
        timestamp: new Date()
      });
    }

    if (deviceStatus.statusCounts.alarm > 0) {
      alerts.push({
        type: 'warning',
        message: `${deviceStatus.statusCounts.alarm} devices with alarms`,
        details: 'Review and acknowledge alarms in the system.',
        timestamp: new Date()
      });
    }

    setHealthMetrics(metrics);
    setSystemAlerts(alerts);

    // Prepare data for parent component
    const healthData = {
      metrics,
      alerts,
      criticalIssues: alerts.filter(a => a.type === 'critical').map(a => a.message),
      deviceStatus: deviceStatus.statusCounts,
      resourceMetrics: resourceData
    };

    onAnalysisComplete(healthData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'critical': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-red-500" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-green-500" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6">
      {!analysisStarted ? (
        <div className="text-center py-8">
          <Activity className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Ready to Analyze System Health</h3>
          <p className="text-muted-foreground mb-6">
            Run comprehensive health analysis on uploaded system data to identify 
            performance issues, resource utilization, and potential problems.
          </p>
          <Button onClick={runHealthAnalysis} size="lg">
            <Activity className="w-4 h-4 mr-2" />
            Run Health Analysis
          </Button>
        </div>
      ) : (
        <>
          {/* System Alerts */}
          {systemAlerts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">System Alerts</h3>
              {systemAlerts.map((alert, index) => (
                <Alert key={index} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">{alert.message}</div>
                    {alert.details && (
                      <div className="text-sm mt-1">{alert.details}</div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Health Metrics Grid */}
          {healthMetrics.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {healthMetrics.map((metric, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(metric.status)}
                        <span className="font-medium">{metric.name}</span>
                        {getTrendIcon(metric.trend)}
                      </div>
                      <Badge variant={metric.status === 'good' ? 'default' : 
                                   metric.status === 'warning' ? 'secondary' : 'destructive'}>
                        {metric.status.toUpperCase()}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-2xl font-bold">
                        {typeof metric.value === 'number' ? 
                          metric.value.toFixed(metric.unit === '%' ? 1 : 0) : 
                          metric.value}
                        {metric.unit && <span className="text-sm ml-1">{metric.unit}</span>}
                      </div>
                      
                      {metric.threshold && typeof metric.value === 'number' && (
                        <Progress 
                          value={metric.value} 
                          className="w-full"
                          max={metric.unit === '%' ? 100 : metric.threshold * 1.2}
                        />
                      )}
                      
                      <p className="text-xs text-muted-foreground">
                        {metric.description}
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Device Status Summary */}
          {deviceStatus.statusCounts.total > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Network Device Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{deviceStatus.statusCounts.total}</div>
                  <div className="text-sm text-muted-foreground">Total Devices</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{deviceStatus.statusCounts.online}</div>
                  <div className="text-sm text-muted-foreground">Online</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{deviceStatus.statusCounts.offline}</div>
                  <div className="text-sm text-muted-foreground">Offline</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{deviceStatus.statusCounts.alarm}</div>
                  <div className="text-sm text-muted-foreground">Alarms</div>
                </div>
              </div>
            </Card>
          )}

          {/* Critical Devices */}
          {deviceStatus.criticalDevices.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Critical Device Issues</h3>
              <div className="space-y-2">
                {deviceStatus.criticalDevices.slice(0, 10).map((device, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                    <XCircle className="w-4 h-4 text-red-600" />
                    <span className="text-sm">{device}</span>
                  </div>
                ))}
                {deviceStatus.criticalDevices.length > 10 && (
                  <div className="text-sm text-muted-foreground">
                    ... and {deviceStatus.criticalDevices.length - 10} more critical issues
                  </div>
                )}
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};