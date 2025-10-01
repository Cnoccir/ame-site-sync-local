import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Network,
  Server,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Globe,
  Router,
  MapPin,
  Clock,
  Activity,
  Trash2,
  Eye,
  Plus,
  Link
} from 'lucide-react';

interface NetworkExportPreviewProps {
  data: any;
  fileName: string;
  onRemove?: () => void;
  onViewAnalysis?: () => void;
  onJACEsDiscovered?: (jaces: any[]) => void;
  onSaveEdited?: (edited: any) => Promise<void> | void;
}

export const NetworkExportPreview: React.FC<NetworkExportPreviewProps> = ({
  data,
  fileName,
  onRemove,
  onViewAnalysis,
  onJACEsDiscovered,
  onSaveEdited
}) => {
  if (!data) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Network className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Network data not available</p>
      </div>
    );
  }

  const network = data.network || {};
  const nodes = network.nodes || [];
  const summary = data.summary || {};
  
  // Extract nodes from dataset rows (new parser format)
  const datasetRows = (data as any)?.rows || [];
  const parsedNodes = datasetRows.map((row: any) => ({
    ...(row?.data || row),
    isJACE: row?.data?.isJACE ?? row?.isJACE,
    isOnline: row?.data?.isOnline ?? row?.isOnline,
    parsedStatus: row?.parsedStatus
  }));

  // Preview mode (LiveCSVPreview) provides a flat data array
  const previewNodes = Array.isArray((data as any)?.data) ? (data as any).data : [];
  
  // Use parsed nodes if available, otherwise fall back to network.nodes, then preview data
  const actualNodes = parsedNodes.length > 0 ? parsedNodes : (nodes.length > 0 ? nodes : previewNodes);
  
  // Filter JACEs from network nodes - STRICT: Type must be "Niagara Station"
  const jaceNodes = actualNodes.filter((node: any) => {
    const typeStr = (node.type || node.Type || node.deviceType || '').toString();
    // Exact match for "Niagara Station" (case-insensitive)
    return typeStr.toLowerCase() === 'niagara station';
  });

  const connectedJACEs = jaceNodes.filter((jace: any) => jace.isOnline || jace.connected || (String(jace.status||'').toLowerCase().includes('online')));
  const disconnectedJACEs = jaceNodes.filter((jace: any) => !(jace.isOnline || jace.connected || (String(jace.status||'').toLowerCase().includes('online'))));

  // Interactive table state for all network stations
  const getProp = (obj: any, candidates: string[]): any => {
    for (const c of candidates) {
      if (obj[c] !== undefined) return obj[c];
      const direct = Object.keys(obj).find(k => k.toLowerCase() === c.toLowerCase());
      if (direct) return obj[direct];
      const norm = c.toLowerCase().replace(/\s+|_/g, '');
      const key = Object.keys(obj).find(k => k.toLowerCase().replace(/\s+|_/g, '') === norm);
      if (key) return obj[key];
    }
    return undefined;
  };

  const extractIP = (n: any): string => {
    const addr = getProp(n, ['ip', 'address', 'ADDRESS', 'Address']);
    if (typeof addr === 'string') {
      const m = addr.match(/ip:([\d.]+)/i);
      return m ? m[1] : addr;
    }
    return addr || '';
  };

  const initialStationRows = useMemo(() => 
    actualNodes.map((n: any, i: number) => ({
      key: getProp(n, ['Name','name']) || extractIP(n) || `station-${i}`,
      include: false,
      comment: '',
      name: getProp(n, ['Name','name']),
      ip: extractIP(n),
      type: getProp(n, ['Type','type','deviceType']),
      model: getProp(n, ['Host Model','HOST MODEL','hostModel','model']),
      version: getProp(n, ['Version','VERSION','version','softwareVersion']),
      status: getProp(n, ['status']) || n.parsedStatus?.status,
      isOnline: getProp(n, ['isOnline','connected']) || false,
      isJACE: n.isJACE,
      connected: getProp(n, ['connected'])
    }))
  , [JSON.stringify(actualNodes)]);
  const [stationRows, setStationRows] = useState(initialStationRows);
  const [stationFilter, setStationFilter] = useState('');
  const [stationEditMode, setStationEditMode] = useState(false);

  const filteredStations = useMemo(() => {
    if (!stationFilter) return stationRows;
    const f = stationFilter.toLowerCase();
    return stationRows.filter(r => JSON.stringify(r).toLowerCase().includes(f));
  }, [stationRows, stationFilter]);

  const saveEdits = async () => {
    if (!onSaveEdited) return;
    const selectedStations = stationRows.filter(r => r.include).map(r => ({
      name: r.name,
      ip: r.ip,
      type: r.type,
      model: r.model,
      version: r.version,
      status: r.status,
      comment: r.comment
    }));
    
    const editedPayload = {
      ...data,
      review: {
        selectedStations
      },
      editedAt: new Date().toISOString()
    };
    await onSaveEdited(editedPayload);
    setStationEditMode(false);
  };

  // Trigger JACE discovery callback
  React.useEffect(() => {
    if (jaceNodes.length > 0 && onJACEsDiscovered) {
      onJACEsDiscovered(jaceNodes);
    }
  }, [jaceNodes.length, onJACEsDiscovered]);

  const getConnectionStatus = (node: any) => {
    if (node.connected || node.status?.includes('online')) {
      return { status: 'connected', color: 'text-green-600 bg-green-50', icon: CheckCircle2 };
    }
    return { status: 'disconnected', color: 'text-red-600 bg-red-50', icon: AlertTriangle };
  };

  return (
    <div className="space-y-4">
      {/* Header with File Info */}
      <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <div>
            <h4 className="font-medium text-green-800">
              Network Export Processed Successfully
            </h4>
            <p className="text-sm text-green-600">{fileName}</p>
          </div>
        </div>

        {/* Network Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="border-blue-200">
            <CardContent className="p-4 text-center">
              <Network className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">{actualNodes.length || 0}</div>
              <div className="text-xs text-gray-600">Total Stations</div>
            </CardContent>
          </Card>

          <Card className="border-green-200">
            <CardContent className="p-4 text-center">
              <Server className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">{connectedJACEs.length}</div>
              <div className="text-xs text-gray-600">Connected JACEs</div>
            </CardContent>
          </Card>

          <Card className="border-red-200">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <div className="text-2xl font-bold text-red-600">{disconnectedJACEs.length}</div>
              <div className="text-xs text-gray-600">Offline JACEs</div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardContent className="p-4 text-center">
              <Globe className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">{jaceNodes.length}</div>
              <div className="text-xs text-gray-600">Total JACEs</div>
            </CardContent>
          </Card>
        </div>

        {/* JACE Discovery Alert */}
        {jaceNodes.length > 0 && (
          <Card className="border-blue-200 bg-blue-50 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="h-5 w-5 text-blue-600" />
                JACE Stations Discovered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-blue-800">
                  Found {jaceNodes.length} JACE controller{jaceNodes.length !== 1 ? 's' : ''} in the network export. 
                  These will be automatically added to your system tree for individual file uploads.
                </p>
                <Badge variant="default" className="bg-blue-600">
                  Auto-Discovery
                </Badge>
              </div>
              <div className="text-xs text-blue-600">
                ✓ Tree nodes will be created for each JACE
                <br />
                ✓ Upload slots prepared for platform details, resources, and drivers
                <br />
                ✓ Connection status monitored
              </div>
            </CardContent>
          </Card>
        )}

        {/* Discovered JACEs Table */}
        {jaceNodes.length > 0 && (
          <Card className="border-gray-200 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Server className="h-5 w-5 text-gray-600" />
                Discovered JACE Controllers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-2 font-medium">JACE Name</th>
                      <th className="text-left p-2 font-medium">IP Address</th>
                      <th className="text-left p-2 font-medium">Model</th>
                      <th className="text-left p-2 font-medium">Version</th>
                      <th className="text-left p-2 font-medium">Status</th>
                      <th className="text-left p-2 font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jaceNodes.map((jace: any, index: number) => {
                      const connStatus = getConnectionStatus(jace);
                      const StatusIcon = connStatus.icon;
                      
                      return (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <Cpu className="h-4 w-4 text-blue-500" />
                              <span className="font-medium">{jace.name || `JACE-${index + 1}`}</span>
                            </div>
                          </td>
                          <td className="p-2">
                            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                              {jace.ip || jace.address || 'N/A'}
                            </span>
                          </td>
                          <td className="p-2">
                            <Badge variant="outline" className="text-xs">
                              {jace.hostModel || jace.model || 'JACE'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge variant="secondary" className="text-xs">
                              {jace.version || jace.softwareVersion || 'N/A'}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <StatusIcon className="h-3 w-3" />
                              <Badge 
                                variant={connStatus.status === 'connected' ? 'default' : 'destructive'} 
                                className="text-xs"
                              >
                                {connStatus.status === 'connected' ? 'Online' : 'Offline'}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <MapPin className="h-3 w-3" />
                              {jace.location || jace.description || 'Not specified'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Network Topology Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="border-teal-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Router className="h-5 w-5 text-teal-600" />
                Network Topology
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-2 bg-teal-50 rounded">
                  <span className="text-sm font-medium">Network Segments</span>
                  <Badge variant="outline">
                    {summary.segments || 'Multiple'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Protocol</span>
                  <Badge variant="secondary">
                    {summary.protocol || 'Niagara Network'}
                  </Badge>
                </div>
                
                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Discovery Method</span>
                  <Badge variant="outline">
                    {summary.discoveryMethod || 'Network Scan'}
                  </Badge>
                </div>

                <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="text-sm font-medium">Last Updated</span>
                  <div className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {summary.lastUpdated || 'Recently'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-indigo-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-600" />
                Connection Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Connected Stations</span>
                    <span className="font-mono">
                      {connectedJACEs.length}/{jaceNodes.length}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${jaceNodes.length ? (connectedJACEs.length / jaceNodes.length) * 100 : 0}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {jaceNodes.length ? Math.round((connectedJACEs.length / jaceNodes.length) * 100) : 0}% connectivity
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-4">
                  <div className="text-center p-2 bg-green-50 rounded">
                    <div className="text-lg font-bold text-green-600">{connectedJACEs.length}</div>
                    <div className="text-xs text-green-800">Online</div>
                  </div>
                  <div className="text-center p-2 bg-red-50 rounded">
                    <div className="text-lg font-bold text-red-600">{disconnectedJACEs.length}</div>
                    <div className="text-xs text-red-800">Offline</div>
                  </div>
                </div>

                {disconnectedJACEs.length > 0 && (
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-center gap-2 text-xs text-yellow-800">
                      <AlertTriangle className="h-3 w-3" />
                      <span className="font-medium">Connection Issues Detected</span>
                    </div>
                    <div className="text-xs text-yellow-700 mt-1">
                      {disconnectedJACEs.length} JACE{disconnectedJACEs.length !== 1 ? 's' : ''} 
                      {' '}currently offline or unreachable
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* All Network Nodes (if there are non-JACE nodes) */}
        {nodes.length > jaceNodes.length && (
          <Card className="border-gray-200 mb-6">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-5 w-5 text-gray-600" />
                All Network Stations ({nodes.length - jaceNodes.length} other devices)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-48 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {nodes.filter((node: any) => !jaceNodes.includes(node)).slice(0, 10).map((node: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <div className="flex items-center gap-2">
                        <Link className="h-3 w-3 text-gray-500" />
                        <span className="font-medium">{node.name || `Device-${index + 1}`}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {node.type || node.deviceType || 'Device'}
                      </Badge>
                    </div>
                  ))}
                </div>
                {nodes.length - jaceNodes.length > 10 && (
                  <div className="text-center text-sm text-gray-500 py-2">
                    +{nodes.length - jaceNodes.length - 10} more network devices
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Interactive All Network Stations Table */}
        <Card className="border-gray-200 mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Network className="h-5 w-5 text-gray-600" />
                All Network Stations ({nodes.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-2 py-1 text-sm"
                  placeholder="Filter stations..."
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={() => setStationEditMode(!stationEditMode)}>
                  {stationEditMode ? 'View' : 'Edit'}
                </Button>
                <Button size="sm" onClick={saveEdits} disabled={!stationEditMode || !onSaveEdited}>
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[26rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Include</th>
                    <th className="text-left p-2">Station Name</th>
                    <th className="text-left p-2">IP Address</th>
                    <th className="text-left p-2">Type/Model</th>
                    <th className="text-left p-2">Version</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredStations.map((r) => {
                    // Use the new isJACE flag if available (from parser)
                    const isJACE = r.isJACE ?? (r.type?.toLowerCase().includes('jace') || r.model?.toLowerCase().includes('jace'));
                    const statusStr = typeof r.status === 'string' ? r.status.toLowerCase() : String(r.status || '').toLowerCase();
                    const isOnline = r.isOnline ?? (r.connected || statusStr.includes('ok') || statusStr.includes('online'));
                    
                    return (
                      <tr key={r.key} className={`border-t ${isJACE ? 'bg-blue-50' : ''}`}>
                        <td className="p-2">
                          <input 
                            type="checkbox" 
                            checked={!!r.include} 
                            onChange={(e) => {
                              const copy = [...stationRows];
                              const actualIdx = stationRows.findIndex(x => x.key === r.key);
                              copy[actualIdx] = { ...copy[actualIdx], include: e.target.checked };
                              setStationRows(copy);
                            }} 
                          />
                        </td>
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {isJACE && <Cpu className="h-4 w-4 text-blue-500" />}
                            <span className="font-medium">{r.name}</span>
                          </div>
                        </td>
                        <td className="p-2">
                          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {r.ip || 'N/A'}
                          </span>
                        </td>
                        <td className="p-2">
                          <Badge variant="outline" className="text-xs">
                            {r.model || r.type || 'Unknown'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge variant="secondary" className="text-xs">
                            {r.version || 'N/A'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Badge 
                            variant={isOnline ? 'default' : 'destructive'} 
                            className="text-xs"
                          >
                            {isOnline ? 'Online' : 'Offline'}
                          </Badge>
                        </td>
                        <td className="p-2">
                          {stationEditMode ? (
                            <input
                              className="w-full border rounded px-1 py-0.5"
                              placeholder="Optional note"
                              value={r.comment}
                              onChange={(e) => {
                                const copy = [...stationRows];
                                const actualIdx = stationRows.findIndex(x => x.key === r.key);
                                copy[actualIdx] = { ...copy[actualIdx], comment: e.target.value };
                                setStationRows(copy);
                              }}
                            />
                          ) : (
                            <span className="text-gray-600 text-xs">{r.comment || '—'}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {jaceNodes.length > 0 && (
              <div className="mt-3 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                💡 Rows highlighted in blue are JACE controllers that will be auto-added to your system tree
              </div>
            )}
          </CardContent>
        </Card>

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
          {jaceNodes.length > 0 && (
            <Button
              onClick={() => {
                // This will be handled by the parent component to build the tree
                console.log('Building JACE tree for', jaceNodes.length, 'JACEs');
              }}
              variant="default"
              size="sm"
              className="gap-2 bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Build JACE Tree ({jaceNodes.length})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
