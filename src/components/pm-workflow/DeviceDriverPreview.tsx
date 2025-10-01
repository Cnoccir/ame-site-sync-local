import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Database,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Wifi,
  WifiOff,
  Building,
  Gauge,
  BarChart3,
  PieChart,
  Trash2,
  Eye,
  Router
} from 'lucide-react';

interface DeviceDriverPreviewProps {
  data: any;
  fileName: string;
  driverType: 'bacnet' | 'n2' | 'modbus' | 'lon' | 'custom';
  onRemove?: () => void;
  onViewAnalysis?: () => void;
}

export const DeviceDriverPreview: React.FC<DeviceDriverPreviewProps & { onSaveEdited?: (edited: any) => Promise<void> | void }> = ({
  data,
  fileName,
  driverType,
  onRemove,
  onViewAnalysis,
  onSaveEdited
}) => {
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Device driver data not available</p>
      </div>
    );
  }

  const devices = Array.isArray(data.devices) ? data.devices : [];
  const summary = data.summary || {};
  const driverConfig = data.driverConfig || {};

  // Interactive editing/flagging state for devices
  const initialDeviceRows = useMemo(() => devices.map((d: any, i: number) => ({
    key: d.id ?? d.deviceId ?? d.address ?? `row-${i}`,
    include: false,
    note: '',
    ...d
  })), [JSON.stringify(devices)]);
  const [rows, setRows] = useState(initialDeviceRows);
  const [filter, setFilter] = useState('');
  const [editMode, setEditMode] = useState(false);

  const filteredRows = useMemo(() => {
    if (!filter) return rows;
    const f = filter.toLowerCase();
    return rows.filter(r => JSON.stringify(r).toLowerCase().includes(f));
  }, [rows, filter]);

  const saveEdits = async () => {
    if (!onSaveEdited) return;
    const selected = rows.filter(r => r.include).map(r => ({ id: r.id ?? r.deviceId ?? r.address, name: r.name ?? r.deviceName, note: r.note }));
    const editedPayload = { ...data, review: { selectedDevices: selected }, editedAt: new Date().toISOString() };
    await onSaveEdited(editedPayload);
    setEditMode(false);
  };

  const normalizeStatus = (s: any): string => {
    if (Array.isArray(s)) return s.map(x => String(x).toLowerCase()).join(',');
    if (typeof s === 'string') return s.toLowerCase();
    return '';
  };

  const onlineDevices = devices.filter((device: any) => {
    const st = normalizeStatus(device.status);
    return st.includes('online') || st.includes('ok') || device.operational === true;
  });

  const offlineDevices = devices.filter((device: any) => {
    const st = normalizeStatus(device.status);
    return st.includes('offline') || st.includes('fault') || st.includes('error') || device.operational === false;
  });

  const getDriverIcon = () => {
    switch (driverType) {
      case 'bacnet': return Building;
      case 'n2': return Router;
      case 'modbus': return Zap;
      case 'lon': return Wifi;
      default: return Database;
    }
  };

  const getDriverColor = () => {
    switch (driverType) {
      case 'bacnet': return 'blue';
      case 'n2': return 'green';
      case 'modbus': return 'purple';
      case 'lon': return 'orange';
      default: return 'gray';
    }
  };

  const getStatusColor = (device: any) => {
    const status = normalizeStatus(device.status);
    if (status.includes('online') || status.includes('ok')) return 'text-green-600 bg-green-50';
    if (status.includes('fault') || status.includes('error') || status.includes('offline')) return 'text-red-600 bg-red-50';
    if (status.includes('warning')) return 'text-yellow-600 bg-yellow-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getDeviceTypeIcon = (device: any) => {
    const type = device.deviceType?.toLowerCase() || device.type?.toLowerCase() || '';
    if (type.includes('controller')) return Router;
    if (type.includes('sensor')) return Gauge;
    if (type.includes('actuator') || type.includes('output')) return Zap;
    return Activity;
  };

  const DriverIcon = getDriverIcon();
  const color = getDriverColor();

  return (
    <div className="space-y-4">
      {/* Header with File Info */}
      <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <div>
            <h4 className="font-medium text-green-800">
              {driverType.toUpperCase()} Driver Export Processed Successfully
            </h4>
            <p className="text-sm text-green-600">{fileName}</p>
          </div>
        </div>

        {/* Driver Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className={`border-${color}-200`}>
            <CardContent className="p-4 text-center">
              <DriverIcon className={`h-6 w-6 mx-auto mb-2 text-${color}-600`} />
              <div className={`text-2xl font-bold text-${color}-600`}>{devices.length}</div>
              <div className="text-xs text-gray-600">Total Devices</div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-4 text-center">
              <Wifi className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{onlineDevices.length}</div>
              <div className="text-xs text-gray-600">Online/OK</div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="p-4 text-center">
              <WifiOff className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">{offlineDevices.length}</div>
              <div className="text-xs text-gray-600">Offline/Fault</div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">
                {devices.length ? Math.round((onlineDevices.length / devices.length) * 100) : 0}%
              </div>
              <div className="text-xs text-gray-600">Availability</div>
            </CardContent>
          </Card>
        </div>

        {/* Driver Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className={`border-${color}-200`}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DriverIcon className={`h-5 w-5 text-${color}-600`} />
                {driverType.toUpperCase()} Driver Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Protocol Version</span>
                  <Badge variant="outline">
                    {driverConfig.protocolVersion || summary.protocolVersion || 'N/A'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Network Address</span>
                  <span className="text-xs font-mono bg-white px-2 py-1 rounded">
                    {driverConfig.networkAddress || summary.networkAddress || 'N/A'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Port/Interface</span>
                  <Badge variant="secondary">
                    {driverConfig.port || driverConfig.interface || summary.port || 'Default'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Timeout (ms)</span>
                  <Badge variant="outline">
                    {driverConfig.timeout || summary.timeout || '5000'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Poll Rate</span>
                  <Badge variant="outline">
                    {driverConfig.pollRate || summary.pollRate || 'Variable'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-600" />
                Device Health Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Device Availability</span>
                    <span className="font-mono">
                      {onlineDevices.length}/{devices.length}
                    </span>
                  </div>
                  <Progress 
                    value={devices.length ? (onlineDevices.length / devices.length) * 100 : 0} 
                    className="h-3"
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {devices.length ? Math.round((onlineDevices.length / devices.length) * 100) : 0}% operational
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">{onlineDevices.length}</div>
                    <div className="text-xs text-green-800">Operational</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-bold text-red-600">{offlineDevices.length}</div>
                    <div className="text-xs text-red-800">Issues</div>
                  </div>
                </div>

                {offlineDevices.length > 0 && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2 text-xs text-yellow-800">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="font-medium">Device Issues Detected</span>
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      {offlineDevices.length} device{offlineDevices.length !== 1 ? 's' : ''} 
                      {' '}require attention
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Device Details Table */}
        {devices.length > 0 && (
          <Card className="border-gray-200 mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-5 w-5 text-gray-600" />
                  Device Inventory ({rows.length} devices)
                </CardTitle>
                <div className="flex items-center gap-2">
                  <input className="border rounded px-2 py-1 text-sm" placeholder="Filter..." value={filter} onChange={(e)=>setFilter(e.target.value)} />
                  <Button size="sm" variant="outline" onClick={() => setEditMode(!editMode)}>
                    {editMode ? 'View' : 'Edit'}
                  </Button>
                  <Button size="sm" onClick={saveEdits} disabled={!editMode || !onSaveEdited}>Save</Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 font-medium">Include</th>
                      <th className="text-left p-2 font-medium">Device Name</th>
                      <th className="text-left p-2 font-medium">Address</th>
                      <th className="text-left p-2 font-medium">Type</th>
                      <th className="text-left p-2 font-medium">Vendor</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Points</th>
                      <th className="text-left p-2 font-medium">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.slice(0, Math.min(500, filteredRows.length)).map((device: any, index: number) => {
                      const DeviceIcon = getDeviceTypeIcon(device);
                      const statusColor = getStatusColor(device);
                      
                      return (
                        <tr key={device.key ?? index} className="border-t hover:bg-gray-50">
                          <td className="p-2">
                            <input type="checkbox" checked={!!device.include} onChange={(e)=>{
                              const copy = [...rows];
                              const idx = rows.findIndex(r => (r.key ?? r.id ?? r.address) === (device.key ?? device.id ?? device.address));
                              if (idx >= 0) { copy[idx] = { ...copy[idx], include: e.target.checked }; setRows(copy); }
                            }} />
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <DeviceIcon className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">
                                {device.name || device.deviceName || `Device-${device.address || index + 1}`}
                              </span>
                            </div>
                          </td>
                          <td className="p-2">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {device.address || device.deviceAddress || device.id || 'N/A'}
                            </span>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs">
                              {device.deviceType || device.type || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge variant="secondary" className="text-xs">
                              {device.vendor || device.manufacturer || 'N/A'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge 
                              className={`text-xs ${statusColor}`}
                              variant={(normalizeStatus(device.status).includes('ok') || normalizeStatus(device.status).includes('online')) ? 'default' : 'destructive'}
                            >
                              {Array.isArray(device.status) ? device.status.join(', ') : (device.status || 'Unknown')}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <Badge variant="outline" className="text-xs">
                                {device.pointCount || device.points?.length || 0}
                              </Badge>
                              {device.pointCount > 0 && (
                                <Activity className="h-3 w-3 text-gray-400" />
                              )}
                            </div>
                          </td>
                          <td className="p-2">
                            {editMode ? (
                              <input
                                className="w-full border rounded px-1 py-0.5"
                                placeholder="Optional note"
                                value={device.note ?? ''}
                                onChange={(e)=>{
                                  const copy = [...rows];
                                  const idx = rows.findIndex(r => (r.key ?? r.id ?? r.address) === (device.key ?? device.id ?? device.address));
                                  if (idx >= 0) { copy[idx] = { ...copy[idx], note: e.target.value }; setRows(copy); }
                                }}
                              />
                            ) : (
                              <span className="text-xs text-gray-500">{device.note}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {rows.length > 500 && (
                  <div className="text-center text-sm text-gray-500 py-2 border-t">
                    Showing first 500 of {rows.length} devices
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Device Type Breakdown */}
        {devices.length > 0 && (
          <Card className="border-teal-200 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-teal-600" />
                Device Type Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(
                  devices.reduce((acc: any, device: any) => {
                    const type = device.deviceType || device.type || 'Unknown';
                    acc[type] = (acc[type] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([type, count]) => (
                  <div key={type} className="text-center p-3 bg-teal-50 border border-teal-200 rounded">
                    <div className="text-lg font-bold text-teal-600">{count as number}</div>
                    <div className="text-xs text-teal-800 capitalize">{type}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vendor Distribution */}
        {devices.length > 0 && (
          <Card className="border-cyan-200 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Building className="h-5 w-5 text-cyan-600" />
                Vendor Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set(devices.map((d: any) => d.vendor || d.manufacturer || 'Unknown')))
                  .slice(0, 8)
                  .map((vendor: any) => {
                    const count = devices.filter((d: any) => 
                      (d.vendor || d.manufacturer || 'Unknown') === vendor
                    ).length;
                    
                    return (
                      <Badge key={vendor} variant="outline" className="text-xs">
                        {vendor} ({count})
                      </Badge>
                    );
                  })
                }
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Results */}
        {(data.analysis?.alerts?.length > 0 || data.analysis?.recommendations?.length > 0) && (
          <Card className="border-yellow-200 bg-yellow-50 mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                Driver Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.analysis?.alerts?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                      Device Alerts ({data.analysis.alerts.length})
                    </h4>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {data.analysis.alerts.map((alert: any, index: number) => (
                        <div key={index} className="text-xs p-2 bg-red-50 border border-red-200 rounded">
                          {typeof alert === 'string' ? alert : (
                            <span>
                              {alert.severity ? `[${String(alert.severity).toUpperCase()}] ` : ''}
                              {alert.message || alert.metric || 'Alert'}
                              {alert.value ? `: ${alert.value}` : ''}
                              {alert.recommendation ? ` — ${alert.recommendation}` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {data.analysis?.recommendations?.length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Recommendations ({data.analysis.recommendations.length})
                    </h4>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {data.analysis.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="text-xs p-2 bg-green-50 border border-green-200 rounded">
                          {typeof rec === 'string' ? rec : (
                            <span>
                              {rec.message || rec.metric || 'Recommendation'}
                              {rec.value ? `: ${rec.value}` : ''}
                              {rec.recommendation ? ` — ${rec.recommendation}` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          {onRemove && (
            <Button
              onClick={onRemove}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Remove File
            </Button>
          )}
          {onViewAnalysis && (
            <Button
              onClick={onViewAnalysis}
              variant="default"
              size="sm"
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              View in Analysis
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};