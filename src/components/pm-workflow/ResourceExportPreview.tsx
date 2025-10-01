import React from 'react';
import { HardDrive } from 'lucide-react';
import { DynamicResourceMetricsDisplay } from './DynamicResourceMetricsDisplay';

export interface ResourceExportPreviewProps {
  data: any;
  fileName: string;
  onRemove?: () => void;
  onViewAnalysis?: () => void;
  onSaveEdited?: (edited: any) => Promise<void> | void;
}

export const ResourceExportPreview: React.FC<ResourceExportPreviewProps> = ({
  data,
  fileName,
  onRemove,
  onViewAnalysis
}) => {
  // Debug logging
  console.log('🔍 ResourceExportPreview received data:', data);
  console.log('🔍 Data structure:', {
    hasResources: !!data?.resources,
    hasMetadata: !!data?.metadata,
    hasNormalizedData: !!data?.metadata?.normalizedData,
    hasRows: !!data?.rows,
    hasMetrics: !!data?.metrics,
    topLevelKeys: data ? Object.keys(data) : [],
    metricsKeys: data?.metrics ? Object.keys(data.metrics) : [],
    capacitiesKeys: data?.metrics?.capacities ? Object.keys(data.metrics.capacities) : []
  });

  // Extract resource data from various possible formats
  // Try multiple paths to find the actual resource data
  let resourceData = null;
  let alerts = [];

  // Path 1: NEW NORMALIZED FORMAT - metrics-based (from TridiumParsedNormalizer)
  if (data?.metrics && typeof data.metrics === 'object') {
    // Convert metrics format to resources format for display
    const m = data.metrics;
    
    // Parse engine queue from string format "0 (Peak 29103)"
    const parseQueueCurrent = (str: string) => {
      const match = String(str || '').match(/^(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    const parseQueuePeak = (str: string) => {
      const match = String(str || '').match(/Peak\s+(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };
    
    resourceData = {
      components: m.capacities?.components || 0,
      devices: {
        used: m.capacities?.devices?.current || 0,
        licensed: m.capacities?.devices?.limit || 0,
        usage_percent: m.capacities?.devices?.percentage || 0
      },
      points: {
        used: m.capacities?.points?.current || 0,
        licensed: m.capacities?.points?.limit || 0,
        usage_percent: m.capacities?.points?.percentage || 0
      },
      histories: m.capacities?.histories?.current || 0,
      resource_units: { total: 0, breakdown: {} },
      cpu: { usage_percent: m.cpu?.usage || 0 },
      memory: {
        used_mb: m.memory?.used || 0,
        total_mb: m.memory?.total || 0,
        usage_percent: m.memory?.total > 0 ? Math.round((m.memory.used / m.memory.total) * 100) : 0
      },
      engine: {
        queue_current: parseQueueCurrent(m.engineQueue?.actions || ''),
        queue_peak: parseQueuePeak(m.engineQueue?.actions || ''),
        scan_time_ms: m.engineScan?.recent ? parseFloat(m.engineScan.recent) : 0
      },
      heap: {
        used_mb: m.heap?.used || 0,
        max_mb: m.heap?.max || 0,
        percent_used: m.heap?.max > 0 ? Math.round((m.heap.used / m.heap.max) * 100) : 0
      },
      time: {
        current: '',
        start: '',
        uptime: m.uptime || ''
      }
    };
    alerts = data.warnings || data.analysis?.alerts || [];
    console.log('✅ Using metrics-based format (normalized)');
  }
  // Path 2: TridiumDataset structure (rows[0].metadata.normalizedData.resources)
  else if (data?.rows?.[0]?.metadata?.normalizedData?.resources) {
    resourceData = data.rows[0].metadata.normalizedData.resources;
    alerts = data.rows[0].metadata.alerts || data.rows[0].metadata.normalizedData.alerts || [];
    console.log('✅ Using data.rows[0].metadata.normalizedData.resources');
  }
  // Path 3: Metadata normalized structure (from stored data)
  else if (data?.metadata?.normalizedData?.resources) {
    resourceData = data.metadata.normalizedData.resources;
    alerts = data.metadata.alerts || data.metadata.normalizedData.alerts || [];
    console.log('✅ Using data.metadata.normalizedData.resources');
  }
  // Path 4: Direct normalized data structure from parser output
  else if (data?.resources && typeof data.resources === 'object' && (data.resources.components !== undefined || data.resources.devices || data.resources.heap)) {
    resourceData = data.resources;
    alerts = data.alerts || [];
    console.log('✅ Using direct data.resources');
  }
  // Path 5: Direct top-level might be the resource data itself (legacy format)
  else if (data?.devices || data?.points || data?.heap || data?.components !== undefined) {
    resourceData = data;
    alerts = data.alerts || [];
    console.log('✅ Using data directly as resourceData');
  }

  console.log('📊 Final resourceData:', resourceData);
  console.log('⚠️ Alerts:', alerts);

  // Use dynamic display if we have raw/allMetrics data
  if (data?.allMetrics || data?.raw) {
    return <DynamicResourceMetricsDisplay data={data} fileName={fileName} />;
  }

  // Fallback for missing data
  if (!resourceData) {
    return (
      <div className="text-center py-8 text-gray-500">
        <HardDrive className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Resource data not available</p>
        <details className="mt-4 text-xs text-left max-w-2xl mx-auto">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-60">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  const scrollToAnalysis = () => {
    if (onViewAnalysis) {
      onViewAnalysis();
      return;
    }
    const el = document.getElementById('system-health-analysis');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600 bg-red-50';
    if (percent >= 75) return 'text-yellow-600 bg-yellow-50';
    return 'text-green-600 bg-green-50';
  };

  const getSeverityBadge = (severity: string) => {
    if (severity === 'critical') return 'destructive';
    if (severity === 'warning') return 'secondary';
    return 'outline';
  };

  // Legacy fallback - this should rarely be reached now
  return (
    <div className="space-y-4">
      {/* Success banner */}
      <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <div>
            <h4 className="font-medium text-green-800">Resource Export Imported</h4>
            <p className="text-sm text-green-600">{fileName}</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 mb-4">
          The data has been saved. Review the complete metrics and capacities below.
        </div>
        <div className="flex gap-3">
          <Button size="sm" className="gap-2" onClick={scrollToAnalysis}>
            <Eye className="h-4 w-4" />
            View in Analysis
          </Button>
          {onRemove && (
            <Button onClick={onRemove} variant="ghost" size="sm" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Remove File
            </Button>
          )}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Device Capacity */}
        {resourceData.devices && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="h-4 w-4 text-blue-600" />
                Device Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold">{resourceData.devices.used}</span>
                  <span className="text-sm text-gray-500">/ {resourceData.devices.licensed}</span>
                </div>
                <Progress value={resourceData.devices.usage_percent || 0} className="h-2" />
                <div className={`text-xs font-medium px-2 py-1 rounded ${getUsageColor(resourceData.devices.usage_percent || 0)}`}>
                  {resourceData.devices.usage_percent}% Used
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Point Capacity */}
        {resourceData.points && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Point Capacity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold">{resourceData.points.used}</span>
                  <span className="text-sm text-gray-500">/ {resourceData.points.licensed}</span>
                </div>
                <Progress value={resourceData.points.usage_percent || 0} className="h-2" />
                <div className={`text-xs font-medium px-2 py-1 rounded ${getUsageColor(resourceData.points.usage_percent || 0)}`}>
                  {resourceData.points.usage_percent}% Used
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Heap Memory */}
        {resourceData.heap && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="h-4 w-4 text-orange-600" />
                Heap Memory
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-2xl font-bold">{resourceData.heap.used_mb}</span>
                  <span className="text-sm text-gray-500">/ {resourceData.heap.max_mb} MB</span>
                </div>
                <Progress value={resourceData.heap.percent_used || 0} className="h-2" />
                <div className={`text-xs font-medium px-2 py-1 rounded ${getUsageColor(resourceData.heap.percent_used || 0)}`}>
                  {resourceData.heap.percent_used}% Used
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* CPU Usage */}
        {resourceData.cpu && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Cpu className="h-4 w-4 text-green-600" />
                CPU Usage
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{resourceData.cpu.usage_percent}%</div>
                <Progress value={resourceData.cpu.usage_percent || 0} className="h-2" />
                <div className={`text-xs font-medium px-2 py-1 rounded ${getUsageColor(resourceData.cpu.usage_percent || 0)}`}>
                  Current Load
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detailed Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Resource Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Components */}
            {resourceData.components !== undefined && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Components</div>
                <div className="text-xl font-bold">{resourceData.components.toLocaleString()}</div>
              </div>
            )}

            {/* Histories */}
            {resourceData.histories !== undefined && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Histories</div>
                <div className="text-xl font-bold">{resourceData.histories.toLocaleString()}</div>
              </div>
            )}

            {/* Resource Units */}
            {resourceData.resource_units && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Resource Units (kRU)</div>
                <div className="text-xl font-bold">{resourceData.resource_units.total.toFixed(2)}</div>
              </div>
            )}

            {/* Memory */}
            {resourceData.memory && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Memory Usage</div>
                <div className="text-xl font-bold">{resourceData.memory.used_mb} MB</div>
                <div className="text-xs text-gray-500">of {resourceData.memory.total_mb} MB ({resourceData.memory.usage_percent}%)</div>
              </div>
            )}

            {/* Engine Queue */}
            {resourceData.engine && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Engine Queue</div>
                <div className="text-xl font-bold">{resourceData.engine.queue_current}</div>
                <div className="text-xs text-gray-500">Peak: {resourceData.engine.queue_peak}</div>
              </div>
            )}

            {/* Scan Time */}
            {resourceData.engine && (
              <div className="p-3 border rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Scan Time</div>
                <div className="text-xl font-bold">{resourceData.engine.scan_time_ms} ms</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* License Capacity Utilization */}
      {(resourceData.points || resourceData.devices) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-5 w-5" />
              License Capacity Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resourceData.points && (
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Points</div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold">{resourceData.points.used || 0}</span>
                    <span className="text-gray-500">/ {resourceData.points.licensed || resourceData.points.limit || '∞'}</span>
                  </div>
                  {resourceData.points.licensed > 0 && (
                    <>
                      <Progress value={resourceData.points.usage_percent || 0} className="h-2 mb-2" />
                      <div className={`text-xs font-medium px-2 py-1 rounded inline-block ${getUsageColor(resourceData.points.usage_percent || 0)}`}>
                        {resourceData.points.usage_percent}% Utilized
                      </div>
                    </>
                  )}
                  {!resourceData.points.licensed && (
                    <div className="text-xs text-gray-500">Unlimited</div>
                  )}
                </div>
              )}

              {resourceData.devices && (
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">Devices</div>
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-2xl font-bold">{resourceData.devices.used || 0}</span>
                    <span className="text-gray-500">/ {resourceData.devices.licensed || resourceData.devices.limit || '∞'}</span>
                  </div>
                  {resourceData.devices.licensed > 0 && (
                    <>
                      <Progress value={resourceData.devices.usage_percent || 0} className="h-2 mb-2" />
                      <div className={`text-xs font-medium px-2 py-1 rounded inline-block ${getUsageColor(resourceData.devices.usage_percent || 0)}`}>
                        {resourceData.devices.usage_percent}% Utilized
                      </div>
                    </>
                  )}
                  {!resourceData.devices.licensed && (
                    <div className="text-xs text-gray-500">Unlimited</div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Uptime Information */}
      {resourceData.time && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-5 w-5" />
              System Uptime
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600 mb-1">Uptime</div>
                <div className="font-medium">{resourceData.time.uptime}</div>
                {resourceData.time.uptime_days !== undefined && (
                  <div className="text-xs text-gray-500 mt-1">
                    {resourceData.time.uptime_days} days, {resourceData.time.uptime_hours} hrs
                  </div>
                )}
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600 mb-1">Started</div>
                <div className="font-medium text-sm">{resourceData.time.start}</div>
              </div>
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-sm text-gray-600 mb-1">Export Time</div>
                <div className="font-medium text-sm">{resourceData.time.current}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Resource Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert: any, idx: number) => (
                <div key={idx} className="p-3 bg-white border rounded-lg">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={getSeverityBadge(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <span className="font-medium text-sm">{alert.metric}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        Value: <span className="font-medium">{alert.value}</span> | Threshold: <span className="font-medium">{alert.threshold}</span>
                      </div>
                      <div className="text-xs text-gray-500">{alert.recommendation}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
