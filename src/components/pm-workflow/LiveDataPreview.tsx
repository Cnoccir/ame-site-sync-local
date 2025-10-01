import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  Server,
  Cpu,
  HardDrive,
  Network,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Database,
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  Eye,
  Activity
} from 'lucide-react';
import type {
  CrossValidatedData,
  N2ParsedData,
  BACnetParsedData,
  ResourceParsedData,
  PlatformParsedData,
  NiagaraNetworkParsedData
} from '../../services/TridiumExportProcessor';

interface LiveDataPreviewProps {
  crossValidatedData: CrossValidatedData;
  className?: string;
}

// Static-friendly colors for PDF export
const COLORS = {
  primary: '#2563eb',
  success: '#16a34a',
  warning: '#d97706',
  danger: '#dc2626',
  info: '#0891b2',
  muted: '#6b7280'
};

const CHART_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.info, COLORS.muted];

export const LiveDataPreview: React.FC<LiveDataPreviewProps> = ({
  crossValidatedData,
  className = ''
}) => {
  // Compute overview metrics for baseline findings
  const overviewMetrics = useMemo(() => {
    const { jaces, supervisor, architecture } = crossValidatedData;

    // System overview
    const totalJaces = Object.keys(jaces).length;
    const connectedJaces = Object.values(jaces).filter(j => j.networkInfo?.connected).length;

    // Aggregate device counts
    let totalDevices = 0;
    let onlineDevices = 0;
    let faultyDevices = 0;
    let devicesByType: Record<string, number> = {};
    let devicesByVendor: Record<string, number> = {};

    Object.values(jaces).forEach(jace => {
      if (jace.drivers.bacnet) {
        const bacnet = jace.drivers.bacnet as BACnetParsedData;
        totalDevices += bacnet.summary.total;
        onlineDevices += bacnet.summary.ok;
        faultyDevices += bacnet.summary.faulty + bacnet.summary.unackedAlarm;

        Object.entries(bacnet.summary.byVendor).forEach(([vendor, count]) => {
          devicesByVendor[vendor] = (devicesByVendor[vendor] || 0) + count;
        });
      }

      if (jace.drivers.n2) {
        const n2 = jace.drivers.n2 as N2ParsedData;
        totalDevices += n2.summary.total;
        onlineDevices += n2.summary.ok;
        faultyDevices += n2.summary.faulty;

        Object.entries(n2.summary.byType).forEach(([type, count]) => {
          devicesByType[type] = (devicesByType[type] || 0) + count;
        });
      }
    });

    // Aggregate performance metrics
    const performanceData = Object.values(jaces)
      .map(jace => jace.resources as ResourceParsedData)
      .filter(Boolean);

    const avgCpuUsage = performanceData.length > 0
      ? Math.round(performanceData.reduce((sum, r) => sum + r.metrics.cpu.usage, 0) / performanceData.length)
      : 0;

    const avgMemoryUsage = performanceData.length > 0
      ? Math.round(performanceData.reduce((sum, r) => {
          const usage = r.metrics.heap.max > 0 ? (r.metrics.heap.used / r.metrics.heap.max) * 100 : 0;
          return sum + usage;
        }, 0) / performanceData.length)
      : 0;

    // Capacity analysis
    const capacityWarnings: string[] = [];
    performanceData.forEach((resource, index) => {
      const { capacities } = resource.metrics;
      if (capacities.points.percentage > 80) {
        capacityWarnings.push(`JACE ${index + 1}: Points at ${capacities.points.percentage}%`);
      }
      if (capacities.devices.percentage > 80) {
        capacityWarnings.push(`JACE ${index + 1}: Devices at ${capacities.devices.percentage}%`);
      }
    });

    // Health percentage
    const healthPercentage = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

    return {
      system: {
        architecture,
        totalJaces,
        connectedJaces,
        connectionHealth: totalJaces > 0 ? Math.round((connectedJaces / totalJaces) * 100) : 0
      },
      devices: {
        total: totalDevices,
        online: onlineDevices,
        faulty: faultyDevices,
        healthPercentage,
        byType: devicesByType,
        byVendor: devicesByVendor
      },
      performance: {
        avgCpuUsage,
        avgMemoryUsage,
        capacityWarnings
      },
      compliance: {
        versionConsistency: crossValidatedData.crossValidation.versionConsistency,
        deviceCountConsistency: crossValidatedData.crossValidation.deviceCountConsistency,
        networkTopologyConsistency: crossValidatedData.crossValidation.networkTopologyConsistency
      }
    };
  }, [crossValidatedData]);

  // Prepare chart data
  const deviceStatusChart = useMemo(() => [
    { name: 'Online', value: overviewMetrics.devices.online, color: COLORS.success },
    { name: 'Faulty', value: overviewMetrics.devices.faulty, color: COLORS.danger },
    { name: 'Other', value: overviewMetrics.devices.total - overviewMetrics.devices.online - overviewMetrics.devices.faulty, color: COLORS.muted }
  ].filter(item => item.value > 0), [overviewMetrics]);

  const vendorChart = useMemo(() =>
    Object.entries(overviewMetrics.devices.byVendor)
      .map(([vendor, count], index) => ({
        name: vendor,
        value: count,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6), // Top 6 vendors for readability
  [overviewMetrics]);

  const performanceData = useMemo(() =>
    Object.entries(crossValidatedData.jaces).map(([jaceName, jace], index) => {
      const resources = jace.resources as ResourceParsedData;
      return {
        name: jaceName === 'default' ? `JACE ${index + 1}` : jaceName,
        cpu: resources?.metrics.cpu.usage || 0,
        memory: resources?.metrics.heap.max > 0
          ? Math.round((resources.metrics.heap.used / resources.metrics.heap.max) * 100)
          : 0,
        devices: resources?.metrics.capacities.devices.percentage || 0,
        points: resources?.metrics.capacities.points.percentage || 0
      };
    }),
  [crossValidatedData]);

  const getHealthIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (percentage >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getHealthColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTrendIcon = (value: number, threshold: number) => {
    if (value > threshold) return <TrendingUp className="h-4 w-4 text-red-600" />;
    if (value > threshold * 0.7) return <Minus className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-green-600" />;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with key findings */}
      <div className="border-b pb-4">
        <div className="flex items-center gap-3 mb-2">
          <Eye className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold">Live Data Preview & Baseline Findings</h2>
        </div>
        <p className="text-sm text-gray-600">
          Real-time visualization of parsed Tridium data for immediate insights and baseline assessment
        </p>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Health</p>
                <p className={`text-2xl font-bold ${getHealthColor(overviewMetrics.devices.healthPercentage)}`}>
                  {overviewMetrics.devices.healthPercentage}%
                </p>
              </div>
              {getHealthIcon(overviewMetrics.devices.healthPercentage)}
            </div>
            <div className="mt-2">
              <Progress
                value={overviewMetrics.devices.healthPercentage}
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {overviewMetrics.devices.online}/{overviewMetrics.devices.total} devices online
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Network Connectivity</p>
                <p className={`text-2xl font-bold ${getHealthColor(overviewMetrics.system.connectionHealth)}`}>
                  {overviewMetrics.system.connectionHealth}%
                </p>
              </div>
              <Network className="h-5 w-5 text-blue-600" />
            </div>
            <div className="mt-2">
              <Progress
                value={overviewMetrics.system.connectionHealth}
                className="h-2"
              />
              <p className="text-xs text-gray-500 mt-1">
                {overviewMetrics.system.connectedJaces}/{overviewMetrics.system.totalJaces} JACEs connected
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg CPU Usage</p>
                <p className="text-2xl font-bold">{overviewMetrics.performance.avgCpuUsage}%</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(overviewMetrics.performance.avgCpuUsage, 70)}
                <Cpu className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <div className="mt-2">
              <Progress
                value={overviewMetrics.performance.avgCpuUsage}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Memory Usage</p>
                <p className="text-2xl font-bold">{overviewMetrics.performance.avgMemoryUsage}%</p>
              </div>
              <div className="flex items-center gap-1">
                {getTrendIcon(overviewMetrics.performance.avgMemoryUsage, 80)}
                <HardDrive className="h-5 w-5 text-gray-600" />
              </div>
            </div>
            <div className="mt-2">
              <Progress
                value={overviewMetrics.performance.avgMemoryUsage}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings and Issues */}
      {(crossValidatedData.consistencyErrors.length > 0 ||
        crossValidatedData.validationWarnings.length > 0 ||
        overviewMetrics.performance.capacityWarnings.length > 0) && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="h-5 w-5" />
              Issues Requiring Attention
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {crossValidatedData.consistencyErrors.map((error, index) => (
              <Alert key={index} variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ))}
            {crossValidatedData.validationWarnings.map((warning, index) => (
              <Alert key={index}>
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
            {overviewMetrics.performance.capacityWarnings.map((warning, index) => (
              <Alert key={index}>
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="devices" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="devices">Device Analysis</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="network">Network Topology</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Device Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceStatusChart}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {deviceStatusChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Vendor Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Vendors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={vendorChart} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill={COLORS.primary} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Device Summary Table */}
          <Card>
            <CardHeader>
              <CardTitle>Device Summary by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {Object.entries(overviewMetrics.devices.byType).map(([type, count]) => (
                  <div key={type} className="text-center p-3 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{count}</div>
                    <div className="text-sm text-gray-600">{type}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                JACE Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: 'Usage %', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Bar dataKey="cpu" name="CPU %" fill={COLORS.primary} />
                  <Bar dataKey="memory" name="Memory %" fill={COLORS.success} />
                  <Bar dataKey="devices" name="Device Capacity %" fill={COLORS.warning} />
                  <Bar dataKey="points" name="Points Capacity %" fill={COLORS.danger} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Performance Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Object.entries(crossValidatedData.jaces).map(([jaceName, jace], index) => {
              const resources = jace.resources as ResourceParsedData;
              if (!resources) return null;

              return (
                <Card key={jaceName}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Server className="h-5 w-5" />
                      {jaceName === 'default' ? `JACE ${index + 1}` : jaceName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Uptime</div>
                        <div className="text-gray-600">{resources.metrics.uptime}</div>
                      </div>
                      <div>
                        <div className="font-medium">Niagara Version</div>
                        <div className="text-gray-600">{resources.metrics.versions.niagara}</div>
                      </div>
                      <div>
                        <div className="font-medium">Heap Used</div>
                        <div className="text-gray-600">{resources.metrics.heap.used} MB</div>
                      </div>
                      <div>
                        <div className="font-medium">Points</div>
                        <div className="text-gray-600">
                          {resources.metrics.capacities.points.current}/{resources.metrics.capacities.points.limit}
                        </div>
                      </div>
                    </div>

                    {resources.warnings.length > 0 && (
                      <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                        <div className="text-xs font-medium text-yellow-800 mb-1">Warnings:</div>
                        {resources.warnings.map((warning, idx) => (
                          <div key={idx} className="text-xs text-yellow-700">{warning}</div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="network" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Network Topology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Architecture Summary */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Architecture Type</span>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {overviewMetrics.system.architecture.replace('-', ' ')}
                  </Badge>
                </div>

                {/* JACE Status List */}
                <div className="space-y-2">
                  {Object.entries(crossValidatedData.jaces).map(([jaceName, jace]) => (
                    <div key={jaceName} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Cpu className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">
                          {jaceName === 'default' ? 'Primary JACE' : jaceName}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {jace.networkInfo?.connected !== undefined && (
                          <Badge variant={jace.networkInfo.connected ? 'default' : 'destructive'}>
                            {jace.networkInfo.connected ? 'Connected' : 'Disconnected'}
                          </Badge>
                        )}
                        {jace.networkInfo?.ip && (
                          <span className="text-sm text-gray-600 font-mono">{jace.networkInfo.ip}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  System Consistency
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Version Consistency</span>
                  <Badge variant={overviewMetrics.compliance.versionConsistency ? 'default' : 'destructive'}>
                    {overviewMetrics.compliance.versionConsistency ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Device Count Consistency</span>
                  <Badge variant={overviewMetrics.compliance.deviceCountConsistency ? 'default' : 'destructive'}>
                    {overviewMetrics.compliance.deviceCountConsistency ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Network Topology</span>
                  <Badge variant={overviewMetrics.compliance.networkTopologyConsistency ? 'default' : 'destructive'}>
                    {overviewMetrics.compliance.networkTopologyConsistency ? 'Pass' : 'Fail'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Quality
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Total Files Processed</span>
                  <Badge variant="outline">
                    {Object.keys(crossValidatedData.jaces).length + (crossValidatedData.supervisor ? 1 : 0)}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Consistency Errors</span>
                  <Badge variant={crossValidatedData.consistencyErrors.length === 0 ? 'default' : 'destructive'}>
                    {crossValidatedData.consistencyErrors.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Validation Warnings</span>
                  <Badge variant={crossValidatedData.validationWarnings.length === 0 ? 'default' : 'secondary'}>
                    {crossValidatedData.validationWarnings.length}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};