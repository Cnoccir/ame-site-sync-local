import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info,
  Cpu,
  Network,
  Database,
  HardDrive,
  Activity,
  BarChart3,
  Server
} from 'lucide-react';
import { PlatformDataService, type TridiumSystemData } from '@/services/PlatformDataService';

interface TridiumSystemInsightsProps {
  sessionId: string;
  customerId?: string;
}

interface SystemHealth {
  overall: 'excellent' | 'good' | 'warning' | 'critical';
  score: number;
  factors: Array<{
    category: string;
    status: 'good' | 'warning' | 'critical';
    message: string;
    impact: 'high' | 'medium' | 'low';
  }>;
}

interface PerformanceMetrics {
  cpuUtilization: { current: number; threshold: number; status: 'good' | 'warning' | 'critical' };
  memoryUsage: { current: number; total: number; percentage: number; status: 'good' | 'warning' | 'critical' };
  deviceLoad: { devices: number; capacity: number; percentage: number; status: 'good' | 'warning' | 'critical' };
  networkHealth: { healthy: number; total: number; percentage: number; status: 'good' | 'warning' | 'critical' };
}

export const TridiumSystemInsights: React.FC<TridiumSystemInsightsProps> = ({
  sessionId,
  customerId
}) => {
  const [systemData, setSystemData] = useState<TridiumSystemData | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSystemData();
  }, [sessionId]);

  const loadSystemData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const result = await PlatformDataService.getTridiumSystemData(sessionId);
      if (result.error || !result.data) {
        setError('No system data available for analysis');
        return;
      }

      const data = result.data;
      setSystemData(data);

      // Generate insights
      generateSystemHealth(data);
      generatePerformanceMetrics(data);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze system data');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSystemHealth = (data: TridiumSystemData) => {
    const factors: SystemHealth['factors'] = [];
    let totalScore = 100;

    // Check device health across all JACEs
    Object.entries(data.jaces).forEach(([jaceName, jaceData]) => {
      if (jaceData.drivers.bacnet) {
        const healthyPercentage = jaceData.drivers.bacnet.summary?.healthyPercentage || 0;
        if (healthyPercentage < 80) {
          factors.push({
            category: `${jaceName} BACnet Health`,
            status: healthyPercentage < 60 ? 'critical' : 'warning',
            message: `${healthyPercentage.toFixed(1)}% of BACnet devices are healthy`,
            impact: 'high'
          });
          totalScore -= (80 - healthyPercentage) * 0.5;
        }
      }

      if (jaceData.drivers.n2) {
        const okDevices = jaceData.drivers.n2.summary?.ok || 0;
        const totalDevices = jaceData.drivers.n2.summary?.total || 1;
        const healthyPercentage = (okDevices / totalDevices) * 100;

        if (healthyPercentage < 85) {
          factors.push({
            category: `${jaceName} N2 Health`,
            status: healthyPercentage < 70 ? 'critical' : 'warning',
            message: `${healthyPercentage.toFixed(1)}% of N2 devices are online`,
            impact: 'high'
          });
          totalScore -= (85 - healthyPercentage) * 0.3;
        }
      }

      // Check resource utilization from normalized ResourceExportOutput structure
      if (jaceData.resources) {
        // Handle both old and new resource data structures
        const resourceData = (jaceData.resources as any).resources || jaceData.resources;
        
        const cpuUsage = resourceData.cpu?.usage_percent || resourceData.metrics?.cpu?.usage || 0;
        if (cpuUsage > 80) {
          factors.push({
            category: `${jaceName} CPU Usage`,
            status: cpuUsage > 90 ? 'critical' : 'warning',
            message: `CPU utilization at ${cpuUsage}%`,
            impact: 'medium'
          });
          totalScore -= (cpuUsage - 80) * 0.5;
        }
        
        // Check heap usage
        const heapPercent = resourceData.heap?.percent_used || 0;
        if (heapPercent > 75) {
          factors.push({
            category: `${jaceName} Heap Memory`,
            status: heapPercent > 90 ? 'critical' : 'warning',
            message: `Heap usage at ${heapPercent}%`,
            impact: 'medium'
          });
          totalScore -= (heapPercent - 75) * 0.3;
        }
        
        // Check device capacity
        const devicePercent = resourceData.devices?.usage_percent || 0;
        if (devicePercent > 90) {
          factors.push({
            category: `${jaceName} Device Capacity`,
            status: 'warning',
            message: `Device license usage at ${devicePercent}%`,
            impact: 'medium'
          });
          totalScore -= (devicePercent - 90) * 0.2;
        }
      }
    });

    // Overall health assessment
    let overall: SystemHealth['overall'];
    if (totalScore >= 90) overall = 'excellent';
    else if (totalScore >= 75) overall = 'good';
    else if (totalScore >= 60) overall = 'warning';
    else overall = 'critical';

    setSystemHealth({
      overall,
      score: Math.max(0, Math.min(100, totalScore)),
      factors
    });
  };

  const generatePerformanceMetrics = (data: TridiumSystemData) => {
    // Aggregate performance across all JACEs
    let totalCpu = 0;
    let totalMemoryUsed = 0;
    let totalMemoryTotal = 0;
    let totalDevices = 0;
    let totalCapacity = 0;
    let healthyDevices = 0;
    let jaceCount = 0;

    // Also check supervisor resources if available
    if (data.supervisor?.resources) {
      const supervisorResources = (data.supervisor.resources as any).resources || data.supervisor.resources;
      totalCpu += supervisorResources.cpu?.usage_percent || supervisorResources.metrics?.cpu?.usage || 0;
      totalMemoryUsed += supervisorResources.memory?.used_mb || supervisorResources.metrics?.memory?.used || 0;
      totalMemoryTotal += supervisorResources.memory?.total_mb || supervisorResources.metrics?.memory?.total || 0;
      totalCapacity += supervisorResources.devices?.licensed || supervisorResources.metrics?.capacities?.devices?.limit || 1000;
      jaceCount++;
    }

    Object.values(data.jaces).forEach(jaceData => {
      jaceCount++;

      if (jaceData.resources) {
        // Handle both old (metrics) and new (normalized) resource structures
        const resourceData = (jaceData.resources as any).resources || jaceData.resources;
        
        totalCpu += resourceData.cpu?.usage_percent || resourceData.metrics?.cpu?.usage || 0;
        totalMemoryUsed += resourceData.memory?.used_mb || resourceData.metrics?.memory?.used || 0;
        totalMemoryTotal += resourceData.memory?.total_mb || resourceData.metrics?.memory?.total || 0;
        totalCapacity += resourceData.devices?.licensed || resourceData.metrics?.capacities?.devices?.limit || 1000;
      }

      if (jaceData.drivers.bacnet) {
        const devices = jaceData.drivers.bacnet.devices?.length || 0;
        totalDevices += devices;
        healthyDevices += Math.round(devices * (jaceData.drivers.bacnet.summary?.healthyPercentage || 100) / 100);
      }

      if (jaceData.drivers.n2) {
        const devices = jaceData.drivers.n2.devices?.length || 0;
        totalDevices += devices;
        healthyDevices += jaceData.drivers.n2.summary?.ok || 0;
      }
    });

    const avgCpu = jaceCount > 0 ? totalCpu / jaceCount : 0;
    const memoryPercentage = totalMemoryTotal > 0 ? (totalMemoryUsed / totalMemoryTotal) * 100 : 0;
    const devicePercentage = totalCapacity > 0 ? (totalDevices / totalCapacity) * 100 : 0;
    const networkHealthPercentage = totalDevices > 0 ? (healthyDevices / totalDevices) * 100 : 100;

    setPerformanceMetrics({
      cpuUtilization: {
        current: avgCpu,
        threshold: 80,
        status: avgCpu > 90 ? 'critical' : avgCpu > 80 ? 'warning' : 'good'
      },
      memoryUsage: {
        current: totalMemoryUsed,
        total: totalMemoryTotal,
        percentage: memoryPercentage,
        status: memoryPercentage > 95 ? 'critical' : memoryPercentage > 85 ? 'warning' : 'good'
      },
      deviceLoad: {
        devices: totalDevices,
        capacity: totalCapacity,
        percentage: devicePercentage,
        status: devicePercentage > 90 ? 'critical' : devicePercentage > 75 ? 'warning' : 'good'
      },
      networkHealth: {
        healthy: healthyDevices,
        total: totalDevices,
        percentage: networkHealthPercentage,
        status: networkHealthPercentage < 70 ? 'critical' : networkHealthPercentage < 85 ? 'warning' : 'good'
      }
    });
  };

  const getStatusColor = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getHealthColor = (overall: SystemHealth['overall']) => {
    switch (overall) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Analyzing system data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !systemData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span>No system data available for analysis</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Import Tridium exports to see comprehensive system insights.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Health Overview */}
      <Card className="border-2 border-blue-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-6 w-6 text-blue-500" />
              <div>
                <CardTitle className="text-lg">System Health & Performance Analysis</CardTitle>
                <p className="text-sm text-gray-600">Real-time insights from {Object.keys(systemData.jaces).length} JACE(s) and {systemData.importSummary?.totalDevices || 0} devices</p>
              </div>
            </div>
            {systemHealth && (
              <div className="text-right">
                <div className={`text-3xl font-bold ${getHealthColor(systemHealth.overall)}`}>
                  {systemHealth.score.toFixed(0)}%
                </div>
                <div className={`text-sm font-medium ${getHealthColor(systemHealth.overall)}`}>
                  {systemHealth.overall.toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </CardHeader>
        {systemHealth && (
          <CardContent>
            <Progress value={systemHealth.score} className="mb-4" />
            {systemHealth.factors.length > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Issues Requiring Attention:</h4>
                {systemHealth.factors.map((factor, index) => (
                  <Alert key={index} className={`border ${getStatusColor(factor.status)}`}>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-medium">{factor.category}:</span> {factor.message}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {factor.impact} impact
                      </Badge>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            ) : (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  System is operating within optimal parameters. No critical issues detected.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        )}
      </Card>

      {/* Performance Metrics Grid */}
      {performanceMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`border-2 ${getStatusColor(performanceMetrics.cpuUtilization.status)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4" />
                  <span className="font-medium text-sm">CPU Usage</span>
                </div>
                <Badge className={`text-xs ${getStatusColor(performanceMetrics.cpuUtilization.status)}`}>
                  {performanceMetrics.cpuUtilization.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {performanceMetrics.cpuUtilization.current.toFixed(1)}%
              </div>
              <Progress value={performanceMetrics.cpuUtilization.current} className="mb-2" />
              <p className="text-xs text-gray-600">
                Avg across {Object.keys(systemData.jaces).length} JACEs
              </p>
            </CardContent>
          </Card>

          <Card className={`border-2 ${getStatusColor(performanceMetrics.memoryUsage.status)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="font-medium text-sm">Memory</span>
                </div>
                <Badge className={`text-xs ${getStatusColor(performanceMetrics.memoryUsage.status)}`}>
                  {performanceMetrics.memoryUsage.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {performanceMetrics.memoryUsage.percentage.toFixed(1)}%
              </div>
              <Progress value={performanceMetrics.memoryUsage.percentage} className="mb-2" />
              <p className="text-xs text-gray-600">
                {performanceMetrics.memoryUsage.current}MB used
              </p>
            </CardContent>
          </Card>

          <Card className={`border-2 ${getStatusColor(performanceMetrics.deviceLoad.status)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4" />
                  <span className="font-medium text-sm">Device Load</span>
                </div>
                <Badge className={`text-xs ${getStatusColor(performanceMetrics.deviceLoad.status)}`}>
                  {performanceMetrics.deviceLoad.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {performanceMetrics.deviceLoad.devices}
              </div>
              <Progress value={performanceMetrics.deviceLoad.percentage} className="mb-2" />
              <p className="text-xs text-gray-600">
                {performanceMetrics.deviceLoad.percentage.toFixed(1)}% capacity
              </p>
            </CardContent>
          </Card>

          <Card className={`border-2 ${getStatusColor(performanceMetrics.networkHealth.status)}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Network className="h-4 w-4" />
                  <span className="font-medium text-sm">Network Health</span>
                </div>
                <Badge className={`text-xs ${getStatusColor(performanceMetrics.networkHealth.status)}`}>
                  {performanceMetrics.networkHealth.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold mb-2">
                {performanceMetrics.networkHealth.percentage.toFixed(1)}%
              </div>
              <Progress value={performanceMetrics.networkHealth.percentage} className="mb-2" />
              <p className="text-xs text-gray-600">
                {performanceMetrics.networkHealth.healthy}/{performanceMetrics.networkHealth.total} healthy
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Network Topology Overview */}
      {systemData.supervisor?.network && (
        <Card className="border-2 border-purple-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center space-x-2">
              <Network className="h-5 w-5 text-purple-600" />
              <span>Network Topology</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              // Extract network data from supervisor.network (which contains the parsed NiagaraNetExport)
              const networkData = systemData.supervisor.network;
              const rows = networkData?.rows || [];
              const totalStations = rows.length;
              const onlineStations = rows.filter((r: any) => r.parsedStatus?.status === 'ok' || r.data?.isOnline).length;
              const offlineStations = totalStations - onlineStations;
              const jaceStations = rows.filter((r: any) => r.data?.isJACE || r.data?.nodeKind === 'jace').length;
              const supervisorStations = rows.filter((r: any) => r.data?.nodeKind === 'supervisor').length;
              
              return (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="text-center p-3 bg-purple-50 rounded border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">{totalStations}</div>
                      <div className="text-xs text-purple-800">Total Stations</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                      <div className="text-2xl font-bold text-green-600">{onlineStations}</div>
                      <div className="text-xs text-green-800">Online</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded border border-red-200">
                      <div className="text-2xl font-bold text-red-600">{offlineStations}</div>
                      <div className="text-xs text-red-800">Offline</div>
                    </div>
                    <div className="text-center p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">{jaceStations}</div>
                      <div className="text-xs text-blue-800">JACE Controllers</div>
                    </div>
                  </div>
                  
                  {offlineStations > 0 && (
                    <Alert className="border-yellow-300 bg-yellow-50">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <span className="font-medium">{offlineStations} station(s)</span> are currently offline. Review network connectivity and station health.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Station List Summary */}
                  <div className="mt-4">
                    <h5 className="text-sm font-medium mb-2">Network Stations:</h5>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {rows.slice(0, 10).map((row: any, idx: number) => {
                        const name = row.data?.Name || row.data?.name || `Station ${idx + 1}`;
                        const status = row.parsedStatus?.status || 'unknown';
                        const isOnline = row.data?.isOnline || status === 'ok';
                        const isJACE = row.data?.isJACE;
                        
                        return (
                          <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                            <div className="flex items-center gap-2">
                              {isJACE && <Server className="h-3 w-3 text-blue-600" />}
                              <span className="font-medium">{name}</span>
                            </div>
                            <Badge variant={isOnline ? "default" : "secondary"} className="text-xs">
                              {isOnline ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                        );
                      })}
                      {rows.length > 10 && (
                        <div className="text-xs text-gray-500 text-center py-2">
                          ... and {rows.length - 10} more stations
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* System Summary Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>System Architecture & Device Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="text-2xl font-bold text-blue-600">{Object.keys(systemData.jaces).length}</div>
              <div className="text-xs text-blue-800 font-medium">JACEs</div>
              <div className="text-xs text-gray-600">{systemData.architecture}</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-2xl font-bold text-green-600">{systemData.importSummary?.totalDevices || 0}</div>
              <div className="text-xs text-green-800 font-medium">Total Devices</div>
              <div className="text-xs text-gray-600">All protocols</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="text-2xl font-bold text-purple-600">
                {Object.values(systemData.jaces).reduce((total, jace) =>
                  total + Object.keys(jace.drivers).filter(driver => jace.drivers[driver]).length, 0)}
              </div>
              <div className="text-xs text-purple-800 font-medium">Active Drivers</div>
              <div className="text-xs text-gray-600">BACnet, N2, etc.</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600">{systemData.importSummary?.totalFiles || 0}</div>
              <div className="text-xs text-orange-800 font-medium">Import Files</div>
              <div className="text-xs text-gray-600">Processed</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Protocol Distribution */}
            <div>
              <h4 className="font-medium mb-3">Protocol Distribution</h4>
              <div className="space-y-2">
                {Object.entries(systemData.jaces).map(([jaceName, jaceData]) => (
                  <div key={jaceName} className="p-3 border rounded">
                    <div className="font-medium text-sm mb-2">{jaceName}</div>
                    <div className="flex gap-2 flex-wrap">
                      {jaceData.drivers.bacnet && (
                        <Badge variant="outline" className="text-xs">
                          BACnet: {jaceData.drivers.bacnet.devices?.length || 0}
                        </Badge>
                      )}
                      {jaceData.drivers.n2 && (
                        <Badge variant="outline" className="text-xs">
                          N2: {jaceData.drivers.n2.devices?.length || 0}
                        </Badge>
                      )}
                      {jaceData.drivers.modbus && (
                        <Badge variant="outline" className="text-xs">Modbus</Badge>
                      )}
                      {jaceData.drivers.lon && (
                        <Badge variant="outline" className="text-xs">LON</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Import Summary */}
            <div>
              <h4 className="font-medium mb-3">Import Information</h4>
              <div className="space-y-3">
                <div className="p-3 border rounded">
                  <div className="text-sm font-medium mb-1">Last Import</div>
                  <div className="text-xs text-gray-600">
                    {new Date(systemData.importedAt).toLocaleString()}
                  </div>
                </div>
                <div className="p-3 border rounded">
                  <div className="text-sm font-medium mb-1">Data Source</div>
                  <div className="text-xs text-gray-600">
                    {systemData.dataSource === 'automated_import' ? 'Tridium Export Files' : 'Manual Entry'}
                  </div>
                </div>
                {systemData.importSummary.errors && systemData.importSummary.errors.length > 0 && (
                  <div className="p-3 border rounded border-yellow-200 bg-yellow-50">
                    <div className="text-sm font-medium mb-1 text-yellow-800">Import Warnings</div>
                    <div className="text-xs text-yellow-700">
                      {systemData.importSummary.errors.length} issues during import
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};