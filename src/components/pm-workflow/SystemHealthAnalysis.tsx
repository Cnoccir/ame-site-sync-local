/**
 * System Health Analysis Component
 * Displays analyzed discovery data with health scores, alerts, and recommendations
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Cpu,
  HardDrive,
  Info,
  MemoryStick,
  Server,
  TrendingUp,
  TrendingDown,
  Download,
  FileText,
  Shield,
  Clock,
  Database,
  Gauge
} from 'lucide-react';

import { SystemTreeData } from '@/services/DiscoveryAPI';

interface SystemHealthAnalysisProps {
  systemData: SystemTreeData;
  onExportPDF?: () => void;
}

export const SystemHealthAnalysis: React.FC<SystemHealthAnalysisProps> = ({
  systemData,
  onExportPDF
}) => {
  const [selectedEntity, setSelectedEntity] = useState<'supervisor' | string>('supervisor');
  const [activeMetricTab, setActiveMetricTab] = useState<'overview' | 'platform' | 'resources' | 'network'>('overview');

  // Get current entity data
  const currentEntity = useMemo(() => {
    if (selectedEntity === 'supervisor') {
      return systemData.supervisor;
    }
    return systemData.jaces.find(j => j.id === selectedEntity);
  }, [selectedEntity, systemData]);

  // Calculate overall system health
  const overallHealth = useMemo(() => {
    const scores: number[] = [];
    
    if (systemData.supervisor?.health_score) {
      scores.push(systemData.supervisor.health_score);
    }
    
    systemData.jaces.forEach(jace => {
      if (jace.health_score) scores.push(jace.health_score);
    });
    
    if (scores.length === 0) return 85; // Default
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  }, [systemData]);

  // Collect all alerts
  const allAlerts = useMemo(() => {
    const alerts: Array<{
      source: string;
      severity: 'critical' | 'warning' | 'info';
      category: string;
      message: string;
    }> = [];
    
    if (systemData.supervisor?.analysis?.alerts) {
      systemData.supervisor.analysis.alerts.forEach((alert: any) => {
        alerts.push({ ...alert, source: 'Supervisor' });
      });
    }
    
    systemData.jaces.forEach(jace => {
      if (jace.analysis?.alerts) {
        jace.analysis.alerts.forEach((alert: any) => {
          alerts.push({ ...alert, source: jace.name });
        });
      }
    });
    
    return alerts;
  }, [systemData]);

  // Group alerts by severity
  const alertsBySeverity = useMemo(() => {
    return {
      critical: allAlerts.filter(a => a.severity === 'critical'),
      warning: allAlerts.filter(a => a.severity === 'warning'),
      info: allAlerts.filter(a => a.severity === 'info')
    };
  }, [allAlerts]);

  // Render metric card
  const renderMetricCard = (
    icon: React.ReactNode,
    label: string,
    value: any,
    unit?: string,
    trend?: 'up' | 'down' | 'neutral',
    color?: string
  ) => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-sm text-gray-600">{label}</span>
          </div>
          {trend && (
            trend === 'up' ? <TrendingUp className="h-4 w-4 text-green-500" /> :
            trend === 'down' ? <TrendingDown className="h-4 w-4 text-red-500" /> :
            null
          )}
        </div>
        <div className="mt-2">
          <span className={`text-2xl font-bold ${color || ''}`}>
            {value !== null && value !== undefined ? value : 'N/A'}
          </span>
          {unit && <span className="text-sm text-gray-500 ml-1">{unit}</span>}
        </div>
      </CardContent>
    </Card>
  );

  // Render alert item
  const renderAlert = (alert: any) => {
    const icon = alert.severity === 'critical' ? 
      <AlertTriangle className="h-4 w-4" /> :
      alert.severity === 'warning' ? 
      <AlertTriangle className="h-4 w-4" /> :
      <Info className="h-4 w-4" />;

    const variant = alert.severity === 'critical' ? 
      'destructive' : 
      alert.severity === 'warning' ? 
      'default' : 
      'secondary';

    return (
      <Alert key={`${alert.source}-${alert.message}`} variant={variant as any} className="mb-2">
        <div className="flex items-start gap-2">
          {icon}
          <div className="flex-1">
            <AlertTitle className="text-sm">
              {alert.source} - {alert.category}
            </AlertTitle>
            <AlertDescription className="text-xs mt-1">
              {alert.message}
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  };

  // Render entity details
  const renderEntityDetails = () => {
    if (!currentEntity) {
      return (
        <Alert>
          <AlertDescription>No data available for this entity</AlertDescription>
        </Alert>
      );
    }

    const platform = currentEntity.platform;
    const resources = currentEntity.resources;
    const analysis = currentEntity.analysis;

    return (
      <Tabs value={activeMetricTab} onValueChange={(v) => setActiveMetricTab(v as any)}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Health Score */}
          <Card>
            <CardHeader>
              <CardTitle>Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="relative w-32 h-32">
                  <svg className="transform -rotate-90 w-32 h-32">
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      className="text-gray-200"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="none"
                      strokeDasharray={`${(analysis?.health_score || 0) * 3.51} 351.86`}
                      className={
                        (analysis?.health_score || 0) > 80 ? 'text-green-500' :
                        (analysis?.health_score || 0) > 60 ? 'text-yellow-500' :
                        'text-red-500'
                      }
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-3xl font-bold">{analysis?.health_score || 0}%</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-2">System Status</h4>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{alertsBySeverity.critical.length}</Badge>
                      <span className="text-sm">Critical Issues</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge>{alertsBySeverity.warning.length}</Badge>
                      <span className="text-sm">Warnings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{alertsBySeverity.info.length}</Badge>
                      <span className="text-sm">Information</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {renderMetricCard(
              <Cpu className="h-4 w-4 text-blue-500" />,
              'CPU Cores',
              platform?.system?.cpu_count
            )}
            {renderMetricCard(
              <MemoryStick className="h-4 w-4 text-purple-500" />,
              'Memory',
              platform?.memory?.total_gb,
              'GB'
            )}
            {renderMetricCard(
              <HardDrive className="h-4 w-4 text-green-500" />,
              'Storage Used',
              platform?.storage?.[0]?.used_pct,
              '%'
            )}
            {renderMetricCard(
              <Clock className="h-4 w-4 text-orange-500" />,
              'Uptime',
              platform?.time?.uptime_days,
              'days'
            )}
          </div>

          {/* Alerts */}
          {analysis?.alerts && analysis.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  {analysis.alerts.map((alert: any, idx: number) => (
                    <div key={idx}>{renderAlert(alert)}</div>
                  ))}
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="platform" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Platform Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* System Info */}
              <div>
                <h4 className="font-semibold mb-2">System</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Niagara Version:</div>
                  <div className="font-medium">{platform?.system?.niagara_version || 'Unknown'}</div>
                  <div>Operating System:</div>
                  <div className="font-medium">{platform?.system?.os || 'Unknown'}</div>
                  <div>Architecture:</div>
                  <div className="font-medium">{platform?.system?.arch || 'Unknown'}</div>
                  <div>Runtime:</div>
                  <div className="font-medium">{platform?.system?.runtime || 'Unknown'}</div>
                </div>
              </div>

              {/* Identity */}
              <div>
                <h4 className="font-semibold mb-2">Identity</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Host ID:</div>
                  <div className="font-medium">{platform?.identity?.host_id || 'Unknown'}</div>
                  <div>Model:</div>
                  <div className="font-medium">{platform?.identity?.model || 'Unknown'}</div>
                  <div>Product:</div>
                  <div className="font-medium">{platform?.identity?.product || 'Unknown'}</div>
                </div>
              </div>

              {/* Storage */}
              {platform?.storage && platform.storage.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Storage</h4>
                  {platform.storage.map((disk: any, idx: number) => (
                    <div key={idx} className="mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{disk.mount}</span>
                        <span className="text-sm">{disk.free_gb}GB free of {disk.total_gb}GB</span>
                      </div>
                      <Progress value={disk.used_pct || 0} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resource Usage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* License Usage */}
              <div>
                <h4 className="font-semibold mb-2">License Usage</h4>
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Devices</span>
                      <span className="text-sm">
                        {resources?.devices?.used || 0} / {resources?.devices?.licensed || 0}
                      </span>
                    </div>
                    <Progress 
                      value={
                        resources?.devices?.licensed ? 
                        (resources.devices.used / resources.devices.licensed) * 100 : 0
                      } 
                      className="h-2" 
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm">Points</span>
                      <span className="text-sm">
                        {resources?.points?.used || 0} / {resources?.points?.licensed || 0}
                      </span>
                    </div>
                    <Progress 
                      value={
                        resources?.points?.licensed ? 
                        (resources.points.used / resources.points.licensed) * 100 : 0
                      } 
                      className="h-2" 
                    />
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              <div>
                <h4 className="font-semibold mb-2">Heap Memory</h4>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm">Used</span>
                  <span className="text-sm">
                    {resources?.heap_used_mb || 0}MB / {resources?.heap_max_mb || 0}MB
                  </span>
                </div>
                <Progress 
                  value={resources?.heap_used_pct || 0} 
                  className="h-2" 
                />
              </div>

              {/* Other Metrics */}
              <div className="grid grid-cols-2 gap-4">
                {renderMetricCard(
                  <Database className="h-4 w-4 text-blue-500" />,
                  'Histories',
                  resources?.histories
                )}
                {renderMetricCard(
                  <Gauge className="h-4 w-4 text-purple-500" />,
                  'Heap Usage',
                  resources?.heap_used_pct,
                  '%'
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Network & Drivers</CardTitle>
            </CardHeader>
            <CardContent>
              {'drivers' in currentEntity ? (
                <div className="space-y-4">
                  {Object.entries((currentEntity as any).drivers).map(([type, driver]: [string, any]) => (
                    <div key={type}>
                      <h4 className="font-semibold mb-2 capitalize">{type} Driver</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Total Devices:</div>
                        <div className="font-medium">{driver?.devices?.length || 0}</div>
                        {driver?.summary && (
                          <>
                            <div>Status:</div>
                            <div className="font-medium">
                              {driver.summary.online || 0} Online / {driver.summary.total || 0} Total
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertDescription>No driver information available</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    );
  };

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>System Health Analysis</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={overallHealth > 80 ? 'default' : overallHealth > 60 ? 'secondary' : 'destructive'}>
                Overall Health: {overallHealth}%
              </Badge>
              {onExportPDF && (
                <Button variant="outline" size="sm" onClick={onExportPDF}>
                  <FileText className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {renderMetricCard(
              <Server className="h-4 w-4 text-blue-500" />,
              'Systems',
              systemData.supervisor ? 1 : 0
            )}
            {renderMetricCard(
              <HardDrive className="h-4 w-4 text-green-500" />,
              'JACEs',
              systemData.jaces.length
            )}
            {renderMetricCard(
              <AlertTriangle className="h-4 w-4 text-red-500" />,
              'Total Alerts',
              allAlerts.length
            )}
          </div>
        </CardContent>
      </Card>

      {/* Entity Selector and Details */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {systemData.supervisor && (
                <Button
                  variant={selectedEntity === 'supervisor' ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedEntity('supervisor')}
                >
                  <Server className="h-4 w-4 mr-2" />
                  Supervisor
                  {systemData.supervisor.health_score && (
                    <Badge className="ml-auto" variant={systemData.supervisor.health_score > 80 ? 'default' : 'destructive'}>
                      {systemData.supervisor.health_score}%
                    </Badge>
                  )}
                </Button>
              )}
              {systemData.jaces.map(jace => (
                <Button
                  key={jace.id}
                  variant={selectedEntity === jace.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedEntity(jace.id)}
                >
                  <HardDrive className="h-4 w-4 mr-2" />
                  {jace.name}
                  {jace.health_score && (
                    <Badge className="ml-auto" variant={jace.health_score > 80 ? 'default' : 'destructive'}>
                      {jace.health_score}%
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="md:col-span-3">
          {renderEntityDetails()}
        </div>
      </div>
    </div>
  );
};