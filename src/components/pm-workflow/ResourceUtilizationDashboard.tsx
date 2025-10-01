import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Cpu,
  HardDrive,
  Database,
  Activity,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Server,
  MemoryStick
} from 'lucide-react';

interface ResourceData {
  cpu: { usage: number };
  heap: { used: number; max: number; free: number; total: number };
  memory: { used: number; total: number };
  capacities: {
    points: { current: number; limit: number; percentage: number };
    devices: { current: number; limit: number; percentage: number };
    networks: { current: number; limit: number };
    histories: { current: number; limit: number | null };
    links: { current: number; limit: number | null };
    schedules: { current: number; limit: number | null };
  };
  uptime: string;
  versions: {
    niagara: string;
    java: string;
    os: string;
  };
  fileDescriptors: { open: number; max: number };
  engineScan: {
    lifetime: string;
    peak: string;
    peakInterscan: string;
    recent: string;
    usage: string;
  };
  engineQueue: {
    actions: string;
    longTimers: string;
    mediumTimers: string;
    shortTimers: string;
  };
}

interface ResourceUtilizationDashboardProps {
  resourceData: ResourceData;
  platformData?: {
    model: string;
    product: string;
    architecture: string;
    cpuCount: number;
    ramTotal: number;
    ramFree: number;
  };
}

export const ResourceUtilizationDashboard: React.FC<ResourceUtilizationDashboardProps> = ({
  resourceData,
  platformData
}) => {
  // Helper functions
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getUtilizationColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const getUtilizationStatus = (percentage: number): { icon: React.ReactNode; label: string; color: string } => {
    if (percentage >= 90) return { icon: <AlertTriangle className="w-4 h-4" />, label: 'Critical', color: 'text-red-600' };
    if (percentage >= 75) return { icon: <TrendingUp className="w-4 h-4" />, label: 'High', color: 'text-yellow-600' };
    if (percentage >= 50) return { icon: <Activity className="w-4 h-4" />, label: 'Medium', color: 'text-blue-600' };
    return { icon: <CheckCircle className="w-4 h-4" />, label: 'Low', color: 'text-green-600' };
  };

  // Calculate percentages
  const memoryPercentage = resourceData.memory ? (resourceData.memory.used / resourceData.memory.total) * 100 : 0;
  const heapPercentage = resourceData.heap ? (resourceData.heap.used / resourceData.heap.max) * 100 : 0;
  const fdPercentage = resourceData.fileDescriptors ? (resourceData.fileDescriptors.open / resourceData.fileDescriptors.max) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{resourceData.cpu?.usage || 0}%</div>
            <Progress
              value={resourceData.cpu?.usage || 0}
              className={`w-full mt-2 ${getUtilizationColor(resourceData.cpu?.usage || 0)}`}
            />
            <div className={`flex items-center gap-1 mt-2 ${getUtilizationStatus(resourceData.cpu?.usage || 0).color}`}>
              {getUtilizationStatus(resourceData.cpu?.usage || 0).icon}
              <span className="text-xs">{getUtilizationStatus(resourceData.cpu?.usage || 0).label}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(memoryPercentage)}%</div>
            <Progress
              value={memoryPercentage}
              className={`w-full mt-2 ${getUtilizationColor(memoryPercentage)}`}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {formatBytes((resourceData.memory?.used || 0) * 1024 * 1024)} / {formatBytes((resourceData.memory?.total || 0) * 1024 * 1024)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Heap Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(heapPercentage)}%</div>
            <Progress
              value={heapPercentage}
              className={`w-full mt-2 ${getUtilizationColor(heapPercentage)}`}
            />
            <p className="text-xs text-muted-foreground mt-2">
              {formatBytes((resourceData.heap?.used || 0) * 1024 * 1024)} / {formatBytes((resourceData.heap?.max || 0) * 1024 * 1024)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{resourceData.uptime || 'Unknown'}</div>
            <div className="flex items-center gap-1 mt-2 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">System Stable</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Capacity Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Points</span>
                <Badge variant={resourceData.capacities?.points?.percentage > 80 ? 'destructive' : 'secondary'}>
                  {resourceData.capacities?.points?.percentage || 0}%
                </Badge>
              </div>
              <Progress value={resourceData.capacities?.points?.percentage || 0} />
              <p className="text-xs text-muted-foreground">
                {resourceData.capacities?.points?.current?.toLocaleString() || 0} / {resourceData.capacities?.points?.limit?.toLocaleString() || 0}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Devices</span>
                <Badge variant={resourceData.capacities?.devices?.percentage > 80 ? 'destructive' : 'secondary'}>
                  {resourceData.capacities?.devices?.percentage || 0}%
                </Badge>
              </div>
              <Progress value={resourceData.capacities?.devices?.percentage || 0} />
              <p className="text-xs text-muted-foreground">
                {resourceData.capacities?.devices?.current || 0} / {resourceData.capacities?.devices?.limit || 0}
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Networks</span>
                <Badge variant="secondary">{resourceData.capacities?.networks?.current || 0}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {resourceData.capacities?.networks?.current || 0} networks configured
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Histories</span>
                <Badge variant="secondary">{(resourceData.capacities?.histories?.current || 0).toLocaleString()}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {resourceData.capacities?.histories?.limit ?
                  `${(resourceData.capacities.histories.current || 0).toLocaleString()} / ${resourceData.capacities.histories.limit.toLocaleString()}` :
                  `${(resourceData.capacities?.histories?.current || 0).toLocaleString()} (unlimited)`
                }
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Links</span>
                <Badge variant="secondary">{(resourceData.capacities?.links?.current || 0).toLocaleString()}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {resourceData.capacities?.links?.limit ?
                  `${(resourceData.capacities.links.current || 0).toLocaleString()} / ${resourceData.capacities.links.limit.toLocaleString()}` :
                  `${(resourceData.capacities?.links?.current || 0).toLocaleString()} (unlimited)`
                }
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Schedules</span>
                <Badge variant="secondary">{resourceData.capacities?.schedules?.current || 0}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {resourceData.capacities?.schedules?.limit ?
                  `${resourceData.capacities.schedules.current || 0} / ${resourceData.capacities.schedules.limit}` :
                  `${resourceData.capacities?.schedules?.current || 0} (unlimited)`
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Engine Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              Engine Scan Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Current Usage:</span>
                <Badge variant="outline">{resourceData.engineScan?.usage || '0%'}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Recent Scan:</span>
                <span className="text-sm font-mono">{resourceData.engineScan?.recent || '0.000 ms'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Lifetime Average:</span>
                <span className="text-sm font-mono">{resourceData.engineScan?.lifetime || '0.000 ms'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Peak Time:</span>
                <span className="text-sm font-mono">{resourceData.engineScan?.peak || '0.000 ms'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Engine Queue Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Actions:</span>
                <Badge variant="outline">{resourceData.engineQueue?.actions || '0'}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Long Timers:</span>
                <Badge variant="outline">{resourceData.engineQueue?.longTimers || '0'}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Medium Timers:</span>
                <Badge variant="outline">{resourceData.engineQueue?.mediumTimers || '0'}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Short Timers:</span>
                <Badge variant="outline">{resourceData.engineQueue?.shortTimers || '0'}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Information */}
      {platformData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Platform Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Model:</span>
                <p className="font-medium">{platformData.model}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Product:</span>
                <p className="font-medium">{platformData.product}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Architecture:</span>
                <p className="font-medium">{platformData.architecture}</p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">CPU Cores:</span>
                <p className="font-medium">{platformData.cpuCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Versions */}
      <Card>
        <CardHeader>
          <CardTitle>System Versions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Niagara:</span>
              <p className="font-mono text-sm">{resourceData.versions?.niagara || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Java:</span>
              <p className="font-mono text-sm">{resourceData.versions?.java || 'Unknown'}</p>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">OS:</span>
              <p className="font-mono text-sm">{resourceData.versions?.os || 'Unknown'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};