import React, { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  TrendingDown,
  Server,
  Wifi,
  Database,
  Users,
  BarChart3,
  Shield,
  Zap,
  RefreshCw
} from 'lucide-react';
import { TridiumDataset } from '@/types/tridium';
import { AggregationStorageService } from '@/services/AggregationStorageService';
import { SystemHealthAggregationService } from '@/services/SystemHealthAggregationService';
import type { 
  SiteHealthSummary, 
  StationHealthSummary, 
  SystemAlert as AggregationAlert,
  Station,
  Device
} from '@/types/aggregation';

interface NetworkHealthDashboardProps {
  datasets: TridiumDataset[];
  siteId?: string;
  onAnalysisComplete: (healthMetrics: any) => void;
}

interface AggregatedDashboardData {
  siteHealthSummary: SiteHealthSummary | null;
  stationHealthSummaries: StationHealthSummary[];
  stations: Station[];
  devices: Device[];
  alerts: AggregationAlert[];
  aggregatedStats: any;
}

export const EnhancedNetworkHealthDashboard: React.FC<NetworkHealthDashboardProps> = ({
  datasets,
  siteId = 'default_site',
  onAnalysisComplete
}) => {
  const [dashboardData, setDashboardData] = useState<AggregatedDashboardData | null>(null);
  const [analysisStarted, setAnalysisStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);

  // Run comprehensive health analysis using aggregation services
  const runComprehensiveAnalysis = async () => {
    setLoading(true);
    setError(null);
    setAnalysisStarted(true);

    try {
      // Process datasets with the aggregation service
      const ingestionJob = await SystemHealthAggregationService.processUploadedDatasets(
        datasets,
        siteId
      );

      if (ingestionJob.status === 'completed') {
        // Retrieve aggregated data
        const [
          siteHealthSummary,
          stationHealthSummaries,
          stations,
          devices,
          alerts,
          aggregatedStats
        ] = await Promise.all([
          AggregationStorageService.getLatestSiteHealthSummary(siteId),
          AggregationStorageService.getStationHealthSummariesBySite(siteId),
          AggregationStorageService.getStationsBySite(siteId),
          AggregationStorageService.getDevicesBySite(siteId),
          AggregationStorageService.getActiveAlerts(siteId),
          AggregationStorageService.getSiteAggregatedStats(siteId)
        ]);

        const aggregatedData: AggregatedDashboardData = {
          siteHealthSummary,
          stationHealthSummaries,
          stations,
          devices,
          alerts,
          aggregatedStats
        };

        setDashboardData(aggregatedData);

        // Prepare comprehensive health metrics for parent component
        const healthMetrics = generateHealthMetricsFromAggregatedData(aggregatedData);
        onAnalysisComplete(healthMetrics);
      } else {
        setError(`Analysis failed: ${ingestionJob.errors.join(', ')}`);
      }
    } catch (error) {
      setError(`Analysis error: ${error.message}`);
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate health metrics from aggregated data
  const generateHealthMetricsFromAggregatedData = (data: AggregatedDashboardData) => {
    const { siteHealthSummary, stationHealthSummaries, alerts, aggregatedStats } = data;

    return {
      siteHealth: {
        totalStations: siteHealthSummary?.total_stations || 0,
        onlineStations: siteHealthSummary?.stations_online || 0,
        totalDevices: siteHealthSummary?.total_devices || 0,
        devicesOk: siteHealthSummary?.devices_ok || 0,
        devicesDown: siteHealthSummary?.devices_down || 0,
        criticalAlerts: alerts.filter(a => a.alert_type === 'critical').length,
        warningAlerts: alerts.filter(a => a.alert_type === 'warning').length,
      },
      performance: {
        avgCpuUsage: siteHealthSummary?.avg_cpu_usage || 0,
        maxCpuUsage: siteHealthSummary?.max_cpu_usage || 0,
        avgMemoryUsage: siteHealthSummary?.avg_memory_usage || 0
      },
      capacity: {
        totalPointCount: siteHealthSummary?.total_point_count || 0,
        totalDeviceCount: siteHealthSummary?.total_device_count || 0
      },
      protocols: siteHealthSummary?.protocol_counts || {},
      versions: siteHealthSummary?.niagara_versions || {},
      alerts: alerts.slice(0, 10), // Top 10 most severe alerts
      stations: stationHealthSummaries
    };
  };

  // Health status badge component
  const HealthStatusBadge = ({ health }: { health: 'healthy' | 'warning' | 'critical' | 'offline' }) => {
    const config = {
      healthy: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      warning: { variant: 'secondary' as const, icon: AlertTriangle, color: 'text-yellow-600' },
      critical: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      offline: { variant: 'destructive' as const, icon: XCircle, color: 'text-gray-600' }
    };
    
    const { variant, icon: Icon, color } = config[health];
    
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {health.toUpperCase()}
      </Badge>
    );
  };

  // Overview Tab Content
  const OverviewContent = () => {
    if (!dashboardData?.siteHealthSummary) return null;

    const { siteHealthSummary, aggregatedStats } = dashboardData;

    return (
      <div className="space-y-6">
        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Server className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Stations</span>
            </div>
            <div className="text-2xl font-bold">{siteHealthSummary.stations_online}</div>
            <div className="text-xs text-muted-foreground">
              {siteHealthSummary.stations_online} online / {siteHealthSummary.total_stations} total
            </div>
            <Progress 
              value={(siteHealthSummary.stations_online / siteHealthSummary.total_stations) * 100} 
              className="mt-2" 
            />
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Network className="w-4 h-4 text-green-600" />
              <span className="font-medium">Devices</span>
            </div>
            <div className="text-2xl font-bold">{siteHealthSummary.devices_ok}</div>
            <div className="text-xs text-muted-foreground">
              {siteHealthSummary.devices_ok} online / {siteHealthSummary.total_devices} total
            </div>
            <Progress 
              value={(siteHealthSummary.devices_ok / siteHealthSummary.total_devices) * 100} 
              className="mt-2" 
            />
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Cpu className="w-4 h-4 text-orange-600" />
              <span className="font-medium">CPU Usage</span>
            </div>
            <div className="text-2xl font-bold">{siteHealthSummary.avg_cpu_usage.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground">
              Max: {siteHealthSummary.max_cpu_usage.toFixed(1)}%
            </div>
            <Progress value={siteHealthSummary.avg_cpu_usage} className="mt-2" />
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-purple-600" />
              <span className="font-medium">Points</span>
            </div>
            <div className="text-2xl font-bold">
              {siteHealthSummary.total_point_count.toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Total data points</div>
          </Card>
        </div>

        {/* Protocol Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Protocol Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(siteHealthSummary.protocol_counts).map(([protocol, count]) => (
              <div key={protocol} className="text-center">
                <div className="text-xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground capitalize">{protocol}</div>
              </div>
            ))}
          </div>
        </Card>

        {/* Version Compliance */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Niagara Version Compliance</h3>
          <div className="space-y-3">
            {Object.entries(siteHealthSummary.niagara_versions).map(([version, count]) => (
              <div key={version} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{version}</span>
                  {version.startsWith('3.') && (
                    <Badge variant="destructive" className="text-xs">OUTDATED</Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">{count} stations</div>
              </div>
            ))}
          </div>
          {siteHealthSummary.outdated_stations > 0 && (
            <Alert className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {siteHealthSummary.outdated_stations} stations running outdated Niagara versions
              </AlertDescription>
            </Alert>
          )}
        </Card>
      </div>
    );
  };

  // Stations Tab Content
  const StationsContent = () => {
    if (!dashboardData?.stationHealthSummaries) return null;

    return (
      <div className="space-y-4">
        <div className="grid gap-4">
          {dashboardData.stationHealthSummaries.map((station) => (
            <Card key={station.station_id} className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">{station.station_id.split('_').pop()}</h3>
                <div className="flex items-center gap-2">
                  <HealthStatusBadge health={station.overall_health} />
                  <Badge variant={station.connection_status === 'connected' ? 'default' : 'secondary'}>
                    {station.connection_status.toUpperCase()}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Devices:</span>
                  <div className="font-semibold">{station.total_devices}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">CPU:</span>
                  <div className="font-semibold">{station.cpu_usage_percent.toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Memory:</span>
                  <div className="font-semibold">{station.memory_usage_percent.toFixed(1)}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Uptime:</span>
                  <div className="font-semibold">
                    {station.uptime_hours > 24 
                      ? `${Math.floor(station.uptime_hours / 24)}d` 
                      : `${Math.floor(station.uptime_hours)}h`}
                  </div>
                </div>
              </div>

              {station.devices_down > 0 && (
                <Alert className="mt-3" variant="destructive">
                  <XCircle className="h-4 w-4" />
                  <AlertDescription>
                    {station.devices_down} devices are down
                  </AlertDescription>
                </Alert>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  };

  // Alerts Tab Content
  const AlertsContent = () => {
    if (!dashboardData?.alerts) return null;

    const sortedAlerts = [...dashboardData.alerts].sort((a, b) => b.severity_score - a.severity_score);

    return (
      <div className="space-y-4">
        {sortedAlerts.length === 0 ? (
          <Card className="p-8 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
            <h3 className="text-lg font-semibold text-green-600">All Systems Healthy</h3>
            <p className="text-muted-foreground">No active alerts detected</p>
          </Card>
        ) : (
          sortedAlerts.map((alert) => (
            <Alert 
              key={alert.id} 
              variant={alert.alert_type === 'critical' ? 'destructive' : 'default'}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{alert.title}</div>
                    <div className="text-sm mt-1">{alert.description}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Severity: {alert.severity_score}/10
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          ))
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {!analysisStarted ? (
        <div className="text-center py-8">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Enhanced System Health Analysis</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Run comprehensive analysis using advanced aggregation to identify performance issues, 
            capacity constraints, version compliance, and generate intelligent alerts across 
            your entire Tridium Niagara infrastructure.
          </p>
          <Button onClick={runComprehensiveAnalysis} size="lg" disabled={loading}>
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Activity className="w-4 h-4 mr-2" />
                Run Comprehensive Analysis
              </>
            )}
          </Button>
        </div>
      ) : error ? (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : dashboardData ? (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="stations">Stations</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts {dashboardData.alerts.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {dashboardData.alerts.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <OverviewContent />
          </TabsContent>

          <TabsContent value="stations" className="space-y-6">
            <StationsContent />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <AlertsContent />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="text-center py-8">
          <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading dashboard data...</p>
        </div>
      )}
    </div>
  );
};
