import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Activity, 
  AlertTriangle, 
  Cpu, 
  Database, 
  Network, 
  Server, 
  Wifi,
  WifiOff,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { 
  NetworkTopology, 
  NetworkNode, 
  SystemResourceMetrics, 
  DeviceHealth,
  HealthDashboardConfig,
  EnhancedTridiumDataset
} from '@/types/tridium';
import { NetworkTopologyService } from '@/services/networkTopologyService';
import { validateTierAccess } from '@/types/serviceTiers';

interface NetworkHealthDashboardProps {
  datasets: EnhancedTridiumDataset[];
  serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  onRefresh?: () => void;
  className?: string;
}

export const NetworkHealthDashboard: React.FC<NetworkHealthDashboardProps> = ({
  datasets,
  serviceTier,
  onRefresh,
  className
}) => {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Build network topology from datasets
  const topology = useMemo(() => {
    return NetworkTopologyService.buildTopology(datasets);
  }, [datasets]);

  // Get topology statistics
  const topologyStats = useMemo(() => {
    return NetworkTopologyService.getTopologyStats(topology);
  }, [topology]);

  // Service tier configuration
  const dashboardConfig: HealthDashboardConfig = useMemo(() => {
    return {
      serviceTier,
      enabledMetrics: {
        deviceStatus: true,
        resourceMonitoring: validateTierAccess(['ASSURE'], serviceTier),
        networkTopology: validateTierAccess(['ASSURE'], serviceTier),
        alerting: validateTierAccess(['CORE'], serviceTier),
        historicalTrends: validateTierAccess(['GUARDIAN'], serviceTier),
        predictiveAnalytics: validateTierAccess(['GUARDIAN'], serviceTier)
      },
      alertThresholds: {
        cpu: serviceTier === 'GUARDIAN' ? 70 : 80,
        memory: serviceTier === 'GUARDIAN' ? 75 : 85,
        deviceOffline: serviceTier === 'GUARDIAN' ? 5 : 15,
        criticalAlarms: true
      },
      refreshInterval: serviceTier === 'GUARDIAN' ? 30 : serviceTier === 'ASSURE' ? 60 : 300
    };
  }, [serviceTier]);

  // Extract resource metrics from datasets
  const resourceMetrics = useMemo(() => {
    return datasets
      .filter(dataset => dataset.resourceMetrics)
      .map(dataset => dataset.resourceMetrics!)
      .filter(Boolean);
  }, [datasets]);

  // Extract device health data
  const deviceHealth = useMemo(() => {
    const allHealth: DeviceHealth[] = [];
    datasets.forEach(dataset => {
      if (dataset.healthMetrics) {
        allHealth.push(...dataset.healthMetrics);
      }
    });
    return allHealth;
  }, [datasets]);

  // Handle refresh
  const handleRefresh = async () => {
    if (onRefresh) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
      }
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && dashboardConfig.refreshInterval > 0) {
      const interval = setInterval(handleRefresh, dashboardConfig.refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, dashboardConfig.refreshInterval]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with service tier indicator */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Network Health Monitor</h2>
          <p className="text-gray-600">
            Real-time system monitoring and diagnostics
            <Badge variant="outline" className="ml-2">
              {serviceTier} Service
            </Badge>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={autoRefresh ? 'bg-green-50 border-green-200' : ''}
          >
            <Activity className={`w-4 h-4 mr-1 ${autoRefresh ? 'text-green-600' : ''}`} />
            Auto-refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SystemOverviewCard
          title="Total Devices"
          value={topology.totalDevices}
          icon={<Network className="w-5 h-5" />}
          trend={topology.healthSummary.healthy > topology.healthSummary.offline ? 'up' : 'down'}
        />
        <SystemOverviewCard
          title="Online Devices"
          value={topology.healthSummary.healthy}
          icon={<Wifi className="w-5 h-5 text-green-600" />}
          trend="up"
        />
        <SystemOverviewCard
          title="Offline Devices"
          value={topology.healthSummary.offline}
          icon={<WifiOff className="w-5 h-5 text-red-600" />}
          trend="down"
          alert={topology.healthSummary.offline > 0}
        />
        <SystemOverviewCard
          title="Active Alarms"
          value={topology.healthSummary.degraded}
          icon={<AlertTriangle className="w-5 h-5 text-yellow-600" />}
          trend="down"
          alert={topology.healthSummary.degraded > 0}
        />
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger 
            value="topology" 
            disabled={!dashboardConfig.enabledMetrics.networkTopology}
          >
            Network Topology
          </TabsTrigger>
          <TabsTrigger 
            value="resources"
            disabled={!dashboardConfig.enabledMetrics.resourceMonitoring}
          >
            System Resources
          </TabsTrigger>
          <TabsTrigger 
            value="alerts"
            disabled={!dashboardConfig.enabledMetrics.alerting}
          >
            Alerts & Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab 
            topology={topology}
            resourceMetrics={resourceMetrics}
            dashboardConfig={dashboardConfig}
          />
        </TabsContent>

        <TabsContent value="topology" className="space-y-4">
          <NetworkTopologyTab 
            topology={topology}
            selectedNode={selectedNode}
            onNodeSelect={setSelectedNode}
            stats={topologyStats}
          />
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <SystemResourcesTab 
            resourceMetrics={resourceMetrics}
            thresholds={dashboardConfig.alertThresholds}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertsHealthTab 
            topology={topology}
            deviceHealth={deviceHealth}
            config={dashboardConfig}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// System Overview Card Component
interface SystemOverviewCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  alert?: boolean;
}

const SystemOverviewCard: React.FC<SystemOverviewCardProps> = ({
  title,
  value,
  icon,
  trend,
  alert
}) => {
  return (
    <Card className={alert ? 'border-red-200 bg-red-50' : ''}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {trend && (
                trend === 'up' ? 
                  <TrendingUp className="w-4 h-4 text-green-600" /> :
                  <TrendingDown className="w-4 h-4 text-red-600" />
              )}
            </div>
          </div>
          <div className={`p-2 rounded-lg ${alert ? 'bg-red-100' : 'bg-gray-100'}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Overview Tab Component
interface OverviewTabProps {
  topology: NetworkTopology;
  resourceMetrics: SystemResourceMetrics[];
  dashboardConfig: HealthDashboardConfig;
}

const OverviewTab: React.FC<OverviewTabProps> = ({
  topology,
  resourceMetrics,
  dashboardConfig
}) => {
  const protocolData = Object.entries(topology.protocolBreakdown);
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Protocol Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5" />
            Protocol Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {protocolData.map(([protocol, count]) => (
              <div key={protocol} className="flex items-center justify-between">
                <span className="text-sm font-medium">{protocol}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">{count} devices</span>
                  <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${(count / topology.totalDevices) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Health Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            System Health Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <HealthMetric
              label="Healthy Devices"
              value={topology.healthSummary.healthy}
              total={topology.totalDevices}
              color="green"
            />
            <HealthMetric
              label="Devices with Alarms"
              value={topology.healthSummary.degraded}
              total={topology.totalDevices}
              color="yellow"
            />
            <HealthMetric
              label="Offline Devices"
              value={topology.healthSummary.offline}
              total={topology.totalDevices}
              color="red"
            />
            <HealthMetric
              label="Unknown Status"
              value={topology.healthSummary.unknown}
              total={topology.totalDevices}
              color="gray"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Health Metric Component
interface HealthMetricProps {
  label: string;
  value: number;
  total: number;
  color: 'green' | 'yellow' | 'red' | 'gray';
}

const HealthMetric: React.FC<HealthMetricProps> = ({ label, value, total, color }) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  
  const colorClasses = {
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    gray: 'bg-gray-400'
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-gray-600">{value} ({percentage.toFixed(1)}%)</span>
      </div>
      <Progress 
        value={percentage} 
        className="h-2"
        // Note: You might need to add custom color support to Progress component
      />
    </div>
  );
};

// Network Topology Tab (placeholder - would need tree visualization)
interface NetworkTopologyTabProps {
  topology: NetworkTopology;
  selectedNode: NetworkNode | null;
  onNodeSelect: (node: NetworkNode | null) => void;
  stats: any;
}

const NetworkTopologyTab: React.FC<NetworkTopologyTabProps> = ({
  topology,
  selectedNode,
  onNodeSelect,
  stats
}) => {
  return (
    <div className="text-center py-8">
      <Server className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">Network Topology View</h3>
      <p className="text-gray-600 mb-4">
        Interactive network topology visualization would be implemented here
      </p>
      <div className="text-sm text-gray-500">
        Total Nodes: {stats.totalNodes} | Max Depth: {stats.maxDepth}
      </div>
    </div>
  );
};

// System Resources Tab
interface SystemResourcesTabProps {
  resourceMetrics: SystemResourceMetrics[];
  thresholds: HealthDashboardConfig['alertThresholds'];
}

const SystemResourcesTab: React.FC<SystemResourcesTabProps> = ({
  resourceMetrics,
  thresholds
}) => {
  if (resourceMetrics.length === 0) {
    return (
      <div className="text-center py-8">
        <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Resource Data</h3>
        <p className="text-gray-600">
          Resource metrics will appear here when available
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {resourceMetrics.map((metrics, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5" />
              {metrics.stationName}
            </CardTitle>
            <CardDescription>
              {metrics.platform} - {metrics.model} - v{metrics.version}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResourceMetric
                label="CPU Usage"
                value={metrics.resources.cpu.usage}
                unit="%"
                threshold={thresholds.cpu}
              />
              <ResourceMetric
                label="Memory Usage"
                value={metrics.resources.memory.percentage}
                unit="%"
                threshold={thresholds.memory}
                details={`${metrics.resources.memory.used}MB / ${metrics.resources.memory.total}MB`}
              />
              <div className="text-xs text-gray-500 mt-2">
                Last updated: {new Date(metrics.timestamp).toLocaleString()}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Resource Metric Component
interface ResourceMetricProps {
  label: string;
  value: number;
  unit: string;
  threshold: number;
  details?: string;
}

const ResourceMetric: React.FC<ResourceMetricProps> = ({
  label,
  value,
  unit,
  threshold,
  details
}) => {
  const isAlert = value >= threshold;
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-1">
          <span className={`text-sm ${isAlert ? 'text-red-600' : 'text-gray-600'}`}>
            {value.toFixed(1)}{unit}
          </span>
          {isAlert && <AlertTriangle className="w-4 h-4 text-red-600" />}
        </div>
      </div>
      <Progress 
        value={Math.min(value, 100)} 
        className="h-2"
      />
      {details && (
        <div className="text-xs text-gray-500">{details}</div>
      )}
    </div>
  );
};

// Alerts & Health Tab
interface AlertsHealthTabProps {
  topology: NetworkTopology;
  deviceHealth: DeviceHealth[];
  config: HealthDashboardConfig;
}

const AlertsHealthTab: React.FC<AlertsHealthTabProps> = ({
  topology,
  deviceHealth,
  config
}) => {
  const criticalDevices = NetworkTopologyService.getNodesByType(topology, 'device')
    .filter(node => node.status.severity === 'critical');
  
  const warningDevices = NetworkTopologyService.getNodesByType(topology, 'device')
    .filter(node => node.status.severity === 'warning');

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {criticalDevices.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Critical Issues Detected</AlertTitle>
          <AlertDescription>
            {criticalDevices.length} devices require immediate attention
          </AlertDescription>
        </Alert>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Active Alerts</h3>
        
        {criticalDevices.map(device => (
          <Alert key={device.id} variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{device.name}</AlertTitle>
            <AlertDescription>
              {device.status.details.join(', ')}
            </AlertDescription>
          </Alert>
        ))}

        {warningDevices.map(device => (
          <Alert key={device.id}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{device.name}</AlertTitle>
            <AlertDescription>
              {device.status.details.join(', ')}
            </AlertDescription>
          </Alert>
        ))}

        {criticalDevices.length === 0 && warningDevices.length === 0 && (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">All Systems Healthy</h3>
            <p className="text-gray-600">No active alerts or issues detected</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkHealthDashboard;
