import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, HardDrive, Eye, Trash2, Activity, BarChart3, Cpu, Clock } from 'lucide-react';
import { ResourceExportOutput } from '@/utils/tridium/parsers/resourceExportParser';

interface ResourceExportPreviewProps {
  data: any;
  fileName: string;
  onRemove?: () => void;
  onViewAnalysis?: () => void;
}

export const ResourceExportPreview: React.FC<ResourceExportPreviewProps & { onSaveEdited?: (edited: any) => Promise<void> | void }> = ({
  data,
  fileName,
  onRemove,
  onViewAnalysis,
  onSaveEdited
}) => {
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        <HardDrive className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Resource data not available</p>
      </div>
    );
  }

  // Detect preview payload from LiveCSVPreview: { type:'resource', data:[...], mappings:[...], summary, totalRows, previewRows }
  const isPreview = (data as any)?.type === 'resource' && Array.isArray((data as any)?.data);
  const previewRows = isPreview ? (data as any).data as any[] : [];

  // Helpers for preview rows
  const rowName = (r: any) => r.metricName ?? r.name ?? r.Name ?? r.NAME ?? '';
  const rowValue = (r: any) => r.benchmarkMetricValue ?? r.metricValue ?? r.value ?? r.Value ?? r.VALUE ?? '';
  const findPreviewVal = (name: string): string => {
    const lower = name.toLowerCase();
    const r = previewRows.find(x => String(rowName(x)).toLowerCase() === lower);
    return r ? String(rowValue(r)) : '';
  };
  const parsePercent = (s: string): number => {
    if (!s) return 0;
    const n = parseFloat(String(s).replace(/[^\d.\-]/g, ''));
    return isFinite(n) ? Math.round(n) : 0;
  };
  const parseMB = (s: string): number => {
    if (!s) return 0;
    const str = String(s).replace(/,/g, '').trim();
    // Accept KB/MB/GB and KiB/MiB/GiB; also raw bytes if suffixed with B
    const m = str.match(/([\d.]+)\s*(K?i?B|KB|KiB|MB|MiB|GB|GiB|B)/i);
    if (!m) return 0;
    const val = parseFloat(m[1]);
    const unit = m[2].toUpperCase();
    if (unit === 'B') return Math.round(val / 1024 / 1024);
    if (unit === 'KB' || unit === 'KIB' || unit === 'KIB') return Math.round(val / 1024);
    if (unit === 'MB' || unit === 'MIB') return Math.round(val);
    if (unit === 'GB' || unit === 'GIB') return Math.round(val * 1024);
    return 0;
  };
  const parseCapacity = (s: string) => {
    if (!s) return { used: undefined as number|undefined, lic: undefined as number|undefined, pct: undefined as number|undefined };
    const m = String(s).match(/([\d,]+)\s*\((?:Limit:)?\s*([\d,]+|none)\)/i);
    if (!m) return { used: undefined, lic: undefined, pct: undefined };
    const used = parseInt(m[1].replace(/,/g, ''));
    const lic = m[2].toLowerCase() === 'none' ? undefined : parseInt(m[2].replace(/,/g, ''));
    const pct = lic ? Math.round((used / lic) * 100) : undefined;
    return { used, lic, pct };
  };
  const parsePeakPair = (s: string) => {
    if (!s) return { current: undefined as number|undefined, peak: undefined as number|undefined };
    const m = String(s).match(/([\d,]+)\s*\(Peak\s+([\d,]+)\)/i);
    if (m) {
      return { current: parseInt(m[1].replace(/,/g, '')), peak: parseInt(m[2].replace(/,/g, '')) };
    }
    const n = parseInt(String(s).replace(/[^\d-]/g, ''));
    return { current: isNaN(n) ? undefined : n, peak: undefined };
  };
  const parseMs = (s: string) => {
    if (!s) return undefined as number|undefined;
    const n = parseFloat(String(s).replace(/[^\d.\-]/g, ''));
    return isFinite(n) ? n : undefined;
  };
  const parseKRU = (s: string) => {
    if (!s) return undefined as number|undefined;
    const m = String(s).match(/([\d,.]+)/);
    if (!m) return undefined;
    const v = parseFloat(m[1].replace(/,/g, ''));
    return isFinite(v) ? v : undefined;
  };
  const parseUptime = (s: string) => {
    if (!s) return { days: undefined as number|undefined, hours: undefined as number|undefined, minutes: undefined as number|undefined };
    const str = String(s).trim();
    // Handles formats like "1 day 2 hours 3 minutes", "1d 2h 3m", or "DD:HH:MM:SS"
    const dMatch = str.match(/(\d+)\s*(d|day|days)/i);
    const hMatch = str.match(/(\d+)\s*(h|hr|hour|hours)/i);
    const mMatch = str.match(/(\d+)\s*(m|min|minute|minutes)/i);
    let days = dMatch ? parseInt(dMatch[1], 10) : undefined;
    let hours = hMatch ? parseInt(hMatch[1], 10) : undefined;
    let minutes = mMatch ? parseInt(mMatch[1], 10) : undefined;
    if (days === undefined && hours === undefined && minutes === undefined) {
      const parts = str.split(':').map(p => parseInt(p, 10)).filter(n => !isNaN(n));
      if (parts.length === 4) {
        // dd:hh:mm:ss
        days = parts[0]; hours = parts[1]; minutes = parts[2];
      } else if (parts.length === 3) {
        // hh:mm:ss
        days = 0; hours = parts[0]; minutes = parts[1];
      }
    }
    return { days, hours, minutes };
  };

  // Try normalized/legacy first; otherwise compute from preview rows
  const normalizedData = (data as any)?.metadata?.normalizedData as ResourceExportOutput | undefined;
  const metrics = (data as any).metrics || (data as any).performance || (data as any);
  const perf = metrics?.performance || metrics || {};
  const capacities = metrics?.capacities || metrics?.capacity || {} as any;

  // Resource Units breakdown (kRU)
  let ru: Record<string, number> = (normalizedData?.resources?.resource_units?.breakdown as any) || (metrics?.ru_breakdown || metrics?.resource_units?.breakdown) || {};
  if (isPreview && (!ru || Object.keys(ru).length === 0)) {
    ru = {} as Record<string, number>;
    previewRows.forEach(r => {
      const n = String(rowName(r)).toLowerCase();
      if (n.startsWith('resources.category.')) {
        const key = n.replace('resources.category.', '');
        const valStr = String(rowValue(r));
        const numMatch = valStr.match(/([\d,.]+)\s*kru/i);
        const num = numMatch ? parseFloat(numMatch[1].replace(/,/g, '')) : parseFloat(valStr.replace(/[^\d.\-]/g, ''));
        if (!isNaN(num)) ru[key] = num;
      }
    });
  }

  let cpuUsage = normalizedData?.resources.cpu.usage_percent ?? perf.cpuUsage ?? perf.cpu?.usage ?? 0;
  let memPct: number|undefined = normalizedData?.resources.memory.usage_percent ?? (() => {
    if (typeof perf?.memory?.usage === 'number') return perf.memory.usage;
    if (perf?.memory && perf.memory.total && perf.memory.used) {
      const pct = Math.round((perf.memory.used / perf.memory.total) * 100);
      return isFinite(pct) ? pct : undefined;
    }
    return undefined;
  })();
  let memoryUsed = normalizedData?.resources.memory.used_mb as number|undefined;
  let memoryTotal = normalizedData?.resources.memory.total_mb as number|undefined;
  let pointsUsed = normalizedData?.resources.points.used ?? metrics?.points?.used ?? metrics?.pointsUsed as number|undefined;
  let pointsLic = normalizedData?.resources.points.licensed ?? metrics?.points?.licensed ?? metrics?.pointsLicensed as number|undefined;
  let pointsPercent = normalizedData?.resources.points.usage_percent as number|undefined;
  let devicesUsed = normalizedData?.resources.devices.used ?? metrics?.devices?.used ?? metrics?.devicesUsed as number|undefined;
  let devicesLic = normalizedData?.resources.devices.licensed ?? metrics?.devices?.licensed ?? metrics?.devicesLicensed as number|undefined;
  let devicesPercent = normalizedData?.resources.devices.usage_percent as number|undefined;
  let uptimeDays = normalizedData?.resources.time.uptime_days as number|undefined;
  let uptimeHours = normalizedData?.resources.time.uptime_hours as number|undefined;
  let uptimeStr = normalizedData?.resources.time.uptime ?? perf?.uptime ?? perf?.time?.uptime ?? '—';
  let heapUsed = normalizedData?.resources.heap.used_mb as number|undefined;
  let heapMax = normalizedData?.resources.heap.max_mb as number|undefined;
  let heapTotal = (normalizedData?.resources.heap as any)?.total_mb as number|undefined;
  let heapFree = (normalizedData?.resources.heap as any)?.free_mb as number|undefined;
  let heapPercent = normalizedData?.resources.heap.percent_used as number|undefined;

  if (isPreview) {
    // CPU
    const cpuStr = findPreviewVal('cpu.usage');
    if (cpuStr) cpuUsage = parsePercent(cpuStr);
    // Memory
    const memUsedStr = findPreviewVal('mem.used');
    const memTotalStr = findPreviewVal('mem.total');
    if (memUsedStr || memTotalStr) {
      memoryUsed = parseMB(memUsedStr);
      memoryTotal = parseMB(memTotalStr);
      memPct = memoryTotal ? Math.round((memoryUsed / memoryTotal) * 100) : undefined;
    }
    // Heap (used/total/max/free)
    const heapUsedStr = findPreviewVal('heap.used');
    const heapMaxStr = findPreviewVal('heap.max');
    const heapTotalStr = findPreviewVal('heap.total');
    const heapFreeStr = findPreviewVal('heap.free');
    if (heapUsedStr) heapUsed = parseMB(heapUsedStr);
    if (heapMaxStr) heapMax = parseMB(heapMaxStr);
    if (heapTotalStr) heapTotal = parseMB(heapTotalStr);
    if (heapFreeStr) heapFree = parseMB(heapFreeStr);
    if (heapUsed !== undefined && heapMax) {
      heapPercent = Math.round((heapUsed / heapMax) * 100);
    }
    // Points/devices
    const pointsStr = findPreviewVal('globalCapacity.points');
    const devicesStr = findPreviewVal('globalCapacity.devices');
    const p = parseCapacity(pointsStr);
    const d = parseCapacity(devicesStr);
    pointsUsed = p.used ?? pointsUsed; pointsLic = p.lic ?? pointsLic; pointsPercent = p.pct ?? pointsPercent;
    devicesUsed = d.used ?? devicesUsed; devicesLic = d.lic ?? devicesLic; devicesPercent = d.pct ?? devicesPercent;
    // Uptime
    const up = findPreviewVal('time.uptime');
    if (up) {
      uptimeStr = up.trim();
      const parts = parseUptime(uptimeStr);
      if (parts.days !== undefined) uptimeDays = parts.days;
      if (parts.hours !== undefined) uptimeHours = parts.hours;
    }
  }

  // Additional key metrics from preview or normalized
  const componentsCount = (normalizedData?.resources?.components ?? parseInt(findPreviewVal('component.count') || '0')) || 0;
  const historiesCount = (normalizedData?.resources?.histories ?? parseInt(findPreviewVal('history.count') || '0')) || 0;
  const ruTotal = normalizedData?.resources?.resource_units?.total ?? parseKRU(findPreviewVal('resources.total'));
  const queuePair = parsePeakPair(findPreviewVal('engine.queue.actions'));
  const scanRecentMs = normalizedData?.resources?.engine?.scan_time_ms ?? parseMs(findPreviewVal('engine.scan.recent'));
  const scanPeakMs = parseMs(findPreviewVal('engine.scan.peak'));
  const scanPeakInterscanMs = parseMs(findPreviewVal('engine.scan.peakInterscan'));
  const scanUsagePct = parsePercent(findPreviewVal('engine.scan.usage'));

  // Build raw table
  const rawEntries: Array<[string, any]> = isPreview
    ? previewRows.map(r => [String(rowName(r)), rowValue(r)])
    : (Array.isArray((data as any).raw)
      ? (data as any).raw.map((r: any) => [r.name ?? '', r.value])
      : Object.entries(metrics || {}).filter(([_, v]) => typeof v !== 'object'));

  // Interactive edit/flag table state for raw metrics
  const initialRows = useMemo(() => rawEntries.map(([name, value]) => ({ name, value, include: false, comment: '' })), [JSON.stringify(rawEntries)]);
  const [rows, setRows] = useState(initialRows);
  const [filter, setFilter] = useState('');
  const [editMode, setEditMode] = useState(false);

  const filteredRows = useMemo(() => {
    if (!filter) return rows;
    const f = filter.toLowerCase();
    return rows.filter(r => `${r.name} ${r.value}`.toLowerCase().includes(f));
  }, [rows, filter]);

  const saveEdits = async () => {
    if (!onSaveEdited) return;
    const selected = rows.filter(r => r.include).map(r => ({ name: r.name, value: r.value, comment: r.comment }));
    const editedPayload = { ...data, review: { selectedMetrics: selected }, editedAt: new Date().toISOString() };
    await onSaveEdited(editedPayload);
    setEditMode(false);
  };

  const scrollToAnalysis = () => {
    if (onViewAnalysis) {
      onViewAnalysis();
      return;
    }
    const el = document.getElementById('system-health-analysis');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
          Saved successfully. Full resource tables are shown below for quick review.
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

      {/* Quick Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            Performance Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* CPU Usage */}
            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
              <Cpu className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-sm text-blue-700 font-medium">CPU Usage</div>
              <div className="text-3xl font-bold text-blue-800 my-2">{cpuUsage}%</div>
              <Progress value={cpuUsage} className="h-2" />
            </div>
            
            {/* Memory Usage */}
            <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
              <HardDrive className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-sm text-purple-700 font-medium">Memory Usage</div>
              <div className="text-3xl font-bold text-purple-800 my-2">{memPct !== undefined ? `${memPct}%` : '—'}</div>
              <Progress value={memPct ?? 0} className="h-2" />
              {memoryUsed !== undefined && memoryTotal !== undefined && (
                <div className="text-xs text-purple-600 mt-2">
                  {memoryUsed} MB / {memoryTotal} MB
                </div>
              )}
            </div>
            
            {/* Heap Usage */}
            {heapPercent !== undefined && (
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                <Activity className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <div className="text-sm text-green-700 font-medium">Heap Usage</div>
                <div className="text-3xl font-bold text-green-800 my-2">{heapPercent.toFixed(1)}%</div>
                <Progress value={heapPercent} className="h-2" />
                {heapUsed !== undefined && heapMax !== undefined && (
                  <div className="text-xs text-green-600 mt-2">
                    {heapUsed} MB / {heapMax} MB
                  </div>
                )}
              </div>
            )}
            
            {/* Uptime */}
            <div className="text-center p-4 bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg border border-teal-200">
              <Clock className="h-6 w-6 mx-auto mb-2 text-teal-600" />
              <div className="text-sm text-teal-700 font-medium">System Uptime</div>
              {uptimeDays !== undefined && uptimeHours !== undefined ? (
                <>
                  <div className="text-2xl font-bold text-teal-800 my-2">
                    {uptimeDays}d {uptimeHours}h
                  </div>
                  <div className="text-xs text-teal-600 mt-1">{uptimeStr}</div>
                </>
              ) : (
                <div className="text-lg font-bold text-teal-800 my-2">{uptimeStr}</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Resource Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            Key Resource Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-3 border rounded-lg text-center">
              <div className="text-xs text-gray-500">Components</div>
              <div className="text-2xl font-bold">{componentsCount.toLocaleString()}</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-xs text-gray-500">Histories</div>
              <div className="text-2xl font-bold">{historiesCount.toLocaleString()}</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-xs text-gray-500">Resource Units (total)</div>
              <div className="text-xl font-semibold">{ruTotal ? `${ruTotal.toLocaleString()} kRU` : '—'}</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-xs text-gray-500">Engine Queue</div>
              <div className="text-sm">{queuePair.current ?? '—'} (Peak {queuePair.peak ?? '—'})</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-xs text-gray-500">Scan Recent</div>
              <div className="text-sm">{scanRecentMs !== undefined ? `${scanRecentMs} ms` : '—'}</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-xs text-gray-500">Scan Peak</div>
              <div className="text-sm">{scanPeakMs !== undefined ? `${scanPeakMs} ms` : '—'}</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-xs text-gray-500">Peak Interscan</div>
              <div className="text-sm">{scanPeakInterscanMs !== undefined ? `${scanPeakInterscanMs} ms` : '—'}</div>
            </div>
            <div className="p-3 border rounded-lg text-center">
              <div className="text-xs text-gray-500">Scan Usage</div>
              <div className="text-sm">{scanUsagePct ? `${scanUsagePct}%` : '—'}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Memory & Heap Details */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Memory and Heap Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Memory committed usage */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <div className="text-sm font-medium">System Memory</div>
                <div className="text-xs text-gray-600">{(memoryUsed !== undefined && memoryTotal !== undefined) ? `${memoryUsed} MB / ${memoryTotal} MB` : '—'}</div>
              </div>
              <Progress value={memPct ?? 0} className="h-3" />
              <div className="text-xs text-gray-500 mt-1">{memPct !== undefined ? `${memPct}% used` : '—'}</div>
            </div>

            {/* Heap relations */}
            <div>
              <div className="text-sm font-medium mb-1">Java Heap</div>
              {/* Used vs Total (committed) */}
              <div className="flex items-center justify-between mb-1">
                <div className="text-xs text-gray-600">Used vs Total</div>
                <div className="text-xs text-gray-600">{(heapUsed !== undefined && heapTotal !== undefined) ? `${heapUsed} MB / ${heapTotal} MB` : '—'}</div>
              </div>
              {(() => {
                const pct = (heapUsed !== undefined && heapTotal) ? Math.max(0, Math.min(100, Math.round((heapUsed / heapTotal) * 100))) : undefined;
                return <Progress value={pct ?? 0} className="h-3" />;
              })()}
              {(() => {
                const pct = (heapUsed !== undefined && heapTotal) ? Math.round((heapUsed / heapTotal) * 100) : undefined;
                const freeCalc = (heapFree !== undefined) ? heapFree : ((heapTotal !== undefined && heapUsed !== undefined) ? Math.max(0, heapTotal - heapUsed) : undefined);
                return (
                  <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                    <span>{pct !== undefined ? `${pct}% used` : ''}</span>
                    <span>{freeCalc !== undefined ? `Free: ${freeCalc} MB` : ''}</span>
                  </div>
                );
              })()}

              {/* Total (committed) vs Max */}
              <div className="flex items-center justify-between mt-4 mb-1">
                <div className="text-xs text-gray-600">Committed (Total) vs Max</div>
                <div className="text-xs text-gray-600">{(heapTotal !== undefined && heapMax !== undefined) ? `${heapTotal} MB / ${heapMax} MB` : '—'}</div>
              </div>
              {(() => {
                const pct = (heapTotal !== undefined && heapMax !== undefined) ? Math.max(0, Math.min(100, Math.round((heapTotal / heapMax) * 100))) : undefined;
                return <Progress value={pct ?? 0} className="h-3" />;
              })()}
              {(() => {
                const headroom = (heapMax !== undefined && heapTotal !== undefined) ? Math.max(0, heapMax - heapTotal) : undefined;
                return (
                  <div className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                    <span>{(heapPercent !== undefined) ? `Used vs Max: ${heapPercent}%` : ''}</span>
                    <span>{headroom !== undefined ? `Headroom: ${headroom} MB` : ''}</span>
                  </div>
                );
              })()}

              {/* Quick badges */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 rounded border">Used: {heapUsed ?? '—'} MB</div>
                <div className="p-2 bg-gray-50 rounded border">Free: {(heapFree !== undefined) ? heapFree : (heapTotal !== undefined && heapUsed !== undefined ? Math.max(0, heapTotal - heapUsed) : '—')} MB</div>
                <div className="p-2 bg-gray-50 rounded border">Total: {heapTotal ?? '—'} MB</div>
                <div className="p-2 bg-gray-50 rounded border">Max: {heapMax ?? '—'} MB</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* License & Capacity Summary */}
      {(pointsUsed !== undefined || devicesUsed !== undefined) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-gray-600" />
              License Capacity Utilization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pointsUsed !== undefined && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Points</span>
                    <span className="text-sm font-mono">
                      {pointsUsed.toLocaleString()} / {pointsLic ? pointsLic.toLocaleString() : '∞'}
                    </span>
                  </div>
                  {pointsPercent !== undefined && pointsLic ? (
                    <>
                      <Progress 
                        value={pointsPercent} 
                        className={`h-2 ${pointsPercent > 90 ? 'bg-red-200' : pointsPercent > 75 ? 'bg-yellow-200' : 'bg-green-200'}`}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {pointsPercent.toFixed(1)}% used
                        </span>
                        {pointsPercent > 85 && (
                          <Badge variant="destructive" className="text-xs">
                            ⚠️ Approaching Limit
                          </Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-xs">Unlimited</Badge>
                  )}
                </div>
              )}
              
              {devicesUsed !== undefined && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Devices</span>
                    <span className="text-sm font-mono">
                      {devicesUsed} / {devicesLic ?? '∞'}
                    </span>
                  </div>
                  {devicesPercent !== undefined && devicesLic ? (
                    <>
                      <Progress 
                        value={devicesPercent} 
                        className={`h-2 ${devicesPercent > 90 ? 'bg-red-200' : devicesPercent > 75 ? 'bg-yellow-200' : 'bg-green-200'}`}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {devicesPercent.toFixed(1)}% used
                        </span>
                        {devicesPercent > 85 && (
                          <Badge variant="destructive" className="text-xs">
                            ⚠️ Approaching Limit
                          </Badge>
                        )}
                      </div>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-xs">Unlimited</Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* RU Breakdown / Capacities */}
      {(Object.keys(ru).length > 0 || Object.keys(capacities).length > 0) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Resource Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* RU breakdown table */}
              {Object.keys(ru).length > 0 && (
                <div>
                  <div className="font-medium text-sm mb-2">Resource Units (kRU)</div>
                  <div className="overflow-x-auto border rounded">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2">Category</th>
                          <th className="text-left p-2">kRU</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(ru).map(([k, v]) => (
                          <tr key={k} className="border-t">
                            <td className="p-2 capitalize">{k}</td>
                            <td className="p-2">{typeof v === 'number' ? v : (v as any)?.value ?? v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Capacities key/value */}
              {Object.keys(capacities).length > 0 && (
                <div>
                  <div className="font-medium text-sm mb-2">Capacities</div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries(capacities).map(([name, cap]: [string, any]) => (
                      <div key={name} className="p-2 bg-gray-50 rounded border">
                        <div className="font-medium capitalize">{name}</div>
                        <div className="text-xs text-gray-600">
                          {(cap as any).current ?? (cap as any).used ?? 0} / {(cap as any).limit ?? (cap as any).max ?? '∞'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Raw metrics table */}
      {rawEntries.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Raw Metrics (from CSV)</CardTitle>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-2 py-1 text-sm"
                  placeholder="Filter..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={() => setEditMode(!editMode)}>
                  {editMode ? 'View' : 'Edit'}
                </Button>
                <Button size="sm" onClick={saveEdits} disabled={!editMode || !onSaveEdited}>
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[26rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-2">Include</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Value</th>
                    <th className="text-left p-2">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r, idx) => (
                    <tr key={r.name} className="border-t">
                      <td className="p-2">
                        <input type="checkbox" checked={!!r.include} onChange={(e)=>{
                          const copy = [...rows];
                          copy[idx] = { ...copy[idx], include: e.target.checked };
                          setRows(copy);
                        }} />
                      </td>
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2">
                        {editMode ? (
                          <input
                            className="w-full border rounded px-1 py-0.5"
                            value={String(r.value ?? '')}
                            onChange={(e)=>{
                              const copy = [...rows];
                              copy[idx] = { ...copy[idx], value: e.target.value };
                              setRows(copy);
                            }}
                          />
                        ) : (
                          <span className="text-gray-700 break-all">{String(r.value)}</span>
                        )}
                      </td>
                      <td className="p-2">
                        {editMode ? (
                          <input
                            className="w-full border rounded px-1 py-0.5"
                            placeholder="Optional note"
                            value={r.comment}
                            onChange={(e)=>{
                              const copy = [...rows];
                              copy[idx] = { ...copy[idx], comment: e.target.value };
                              setRows(copy);
                            }}
                          />
                        ) : (
                          <span className="text-gray-500">{r.comment}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
