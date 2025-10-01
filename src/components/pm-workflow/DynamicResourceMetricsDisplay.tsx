import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle2,
  Database,
  Cpu,
  HardDrive,
  Activity,
  Clock,
  Zap,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Server,
  Network
} from 'lucide-react';

interface MetricValue {
  value: any;
  unit?: string;
  limit?: number | null;
  peak?: number;
}

interface DynamicResourceMetricsDisplayProps {
  data: any;
  fileName?: string;
}

export const DynamicResourceMetricsDisplay: React.FC<DynamicResourceMetricsDisplayProps> = ({
  data,
  fileName
}) => {
  console.log('[DynamicResourceMetricsDisplay] Received data:', data);

  // Extract all metrics from various possible data shapes
  const allMetrics: Record<string, MetricValue> = useMemo(() => {
    // Path 1: Use allMetrics if available (new format)
    if (data?.allMetrics) {
      console.log('✅ Using data.allMetrics');
      return data.allMetrics;
    }

    // Path 2: Use raw array and build map
    if (data?.raw && Array.isArray(data.raw)) {
      console.log('✅ Building from data.raw array');
      const metrics: Record<string, MetricValue> = {};
      data.raw.forEach((metric: any) => {
        metrics[metric.name] = {
          value: metric.value,
          unit: metric.unit,
          limit: metric.limit,
          peak: metric.peak
        };
      });
      return metrics;
    }

    // Path 3: Try to extract from nested structures
    if (data?.metrics) {
      console.log('⚠️ Fallback: extracting from structured metrics');
      return {}; // Could extract here but prefer raw data
    }

    console.warn('❌ No metrics found in data');
    return {};
  }, [data]);

  // Categorize metrics by type for organized display
  const categorizedMetrics = useMemo(() => {
    const categories: Record<string, Record<string, MetricValue>> = {
      'CPU & Processing': {},
      'Memory & Heap': {},
      'Capacities & Licensing': {},
      'Engine Performance': {},
      'File System': {},
      'Network & Links': {},
      'Versions & System Info': {},
      'Time & Uptime': {},
      'Other': {}
    };

    Object.entries(allMetrics).forEach(([key, value]) => {
      if (key.includes('cpu')) {
        categories['CPU & Processing'][key] = value;
      } else if (key.includes('heap') || key.includes('mem.')) {
        categories['Memory & Heap'][key] = value;
      } else if (key.includes('globalCapacity') || key.includes('.count') || key.includes('component')) {
        categories['Capacities & Licensing'][key] = value;
      } else if (key.includes('engine')) {
        categories['Engine Performance'][key] = value;
      } else if (key.includes('fd.') || key.includes('file')) {
        categories['File System'][key] = value;
      } else if (key.includes('network') || key.includes('link')) {
        categories['Network & Links'][key] = value;
      } else if (key.includes('version')) {
        categories['Versions & System Info'][key] = value;
      } else if (key.includes('time')) {
        categories['Time & Uptime'][key] = value;
      } else {
        categories['Other'][key] = value;
      }
    });

    // Remove empty categories
    Object.keys(categories).forEach(cat => {
      if (Object.keys(categories[cat]).length === 0) {
        delete categories[cat];
      }
    });

    return categories;
  }, [allMetrics]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'CPU & Processing': return <Cpu className="h-4 w-4" />;
      case 'Memory & Heap': return <HardDrive className="h-4 w-4" />;
      case 'Capacities & Licensing': return <Database className="h-4 w-4" />;
      case 'Engine Performance': return <Zap className="h-4 w-4" />;
      case 'File System': return <Server className="h-4 w-4" />;
      case 'Network & Links': return <Network className="h-4 w-4" />;
      case 'Versions & System Info': return <BarChart3 className="h-4 w-4" />;
      case 'Time & Uptime': return <Clock className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const formatMetricKey = (key: string) => {
    // Convert dot-separated keys to readable format
    return key
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  const formatMetricValue = (metric: MetricValue) => {
    const { value, unit, limit, peak } = metric;

    let displayValue = value;
    
    // Format numbers with commas
    if (typeof value === 'number' && !unit?.includes('%')) {
      displayValue = value.toLocaleString();
    }

    let displayStr = `${displayValue}`;
    if (unit) {
      displayStr += ` ${unit}`;
    }

    // Add limit if present
    if (limit !== undefined && limit !== null) {
      displayStr += ` (Limit: ${limit === 0 ? 'none' : limit.toLocaleString()})`;
    }

    // Add peak if present
    if (peak !== undefined && peak !== null) {
      displayStr += ` [Peak: ${peak.toLocaleString()}]`;
    }

    return displayStr;
  };

  // Calculate percentage for capacity metrics
  const getPercentageForCapacity = (metricName: string, metric: MetricValue): number | null => {
    if (!metricName.includes('globalCapacity')) return null;
    
    // Try to parse the value if it's a string like "3,303 (Limit: 5,000)"
    if (typeof metric.value === 'string') {
      const match = metric.value.match(/([\d,]+)\s*\((?:Limit:\s*)?([\d,]+)/);
      if (match) {
        const current = parseInt(match[1].replace(/,/g, ''));
        const limit = parseInt(match[2].replace(/,/g, ''));
        return limit > 0 ? Math.round((current / limit) * 100) : null;
      }
    }
    
    return null;
  };

  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'text-red-600 bg-red-50 border-red-200';
    if (percent >= 75) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  if (Object.keys(allMetrics).length === 0) {
    return (
      <Card className="border-yellow-300 bg-yellow-50">
        <CardContent className="pt-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-600" />
          <p className="text-gray-700">No resource metrics found in the data.</p>
          <details className="mt-4 text-xs text-left max-w-2xl mx-auto">
            <summary className="cursor-pointer font-medium">Debug Info</summary>
            <pre className="mt-2 p-2 bg-white rounded overflow-auto max-h-60 text-xs">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {fileName && (
        <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Resource Export Loaded</h4>
              <p className="text-sm text-green-600">{fileName}</p>
              <p className="text-xs text-gray-600 mt-1">
                {Object.keys(allMetrics).length} metrics parsed successfully
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Categorized Metrics */}
      {Object.entries(categorizedMetrics).map(([category, metrics]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              {getCategoryIcon(category)}
              {category}
              <Badge variant="secondary" className="ml-auto">
                {Object.keys(metrics).length} metrics
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(metrics).map(([key, metric]) => {
                const percentage = getPercentageForCapacity(key, metric);
                
                return (
                  <div
                    key={key}
                    className={`p-3 border rounded-lg ${
                      percentage !== null && percentage > 0
                        ? getUsageColor(percentage)
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="text-xs font-medium text-gray-600 mb-1">
                      {formatMetricKey(key)}
                    </div>
                    <div className="text-sm font-mono font-semibold">
                      {formatMetricValue(metric)}
                    </div>
                    {percentage !== null && percentage > 0 && (
                      <div className="mt-2">
                        <Progress value={percentage} className="h-1.5" />
                        <div className="text-xs mt-1 font-medium">{percentage}% utilized</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Analysis Section */}
      {data?.analysis && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              System Health Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.analysis.healthScore !== undefined && (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">Health Score:</span>
                  <Progress value={data.analysis.healthScore} className="flex-1 h-2" />
                  <span className="text-lg font-bold">{data.analysis.healthScore}/100</span>
                </div>
              )}
              
              {data.analysis.alerts && data.analysis.alerts.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold mb-2">Alerts ({data.analysis.alerts.length})</h4>
                  <div className="space-y-2">
                    {data.analysis.alerts.map((alert: any, idx: number) => (
                      <div key={idx} className="p-2 bg-white border rounded text-xs">
                        <Badge 
                          variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                          className="mb-1"
                        >
                          {alert.severity}
                        </Badge>
                        <p className="font-medium">{alert.message || alert.category}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw Data Debug View */}
      <details className="border rounded-lg p-4 bg-gray-50">
        <summary className="cursor-pointer font-medium text-sm text-gray-700">
          View Raw JSON Data ({Object.keys(allMetrics).length} metrics)
        </summary>
        <pre className="mt-3 p-3 bg-white border rounded overflow-auto max-h-96 text-xs">
          {JSON.stringify(allMetrics, null, 2)}
        </pre>
      </details>
    </div>
  );
};
