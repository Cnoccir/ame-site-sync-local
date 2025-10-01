import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Database,
  Network,
  HardDrive,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Server,
  Settings,
  TrendingUp,
  Users,
  Zap
} from 'lucide-react';

interface ImportDataVisualizationProps {
  systemData: any;
  className?: string;
}

export const ImportDataVisualization: React.FC<ImportDataVisualizationProps> = ({
  systemData,
  className = ""
}) => {
  if (!systemData) {
    return null;
  }

  const renderPlatformDataCard = (data: any, title: string = "Platform Details") => {
    if (!data || (!data.summary && !data.modules)) return null;

    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cpu className="h-4 w-4 text-blue-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.summary && (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Model:</span>
                  <p className="text-gray-600">{data.summary.model || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Version:</span>
                  <p className="text-gray-600">{data.summary.daemonVersion || 'N/A'}</p>
                </div>
                <div>
                  <span className="font-medium">Host ID:</span>
                  <p className="text-gray-600 truncate" title={data.summary.hostId}>
                    {data.summary.hostId || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-medium">Architecture:</span>
                  <p className="text-gray-600">{data.summary.architecture || 'N/A'}</p>
                </div>
              </div>
            )}
            
            {data.modules && data.modules.length > 0 && (
              <div>
                <span className="text-sm font-medium">Modules ({data.modules.length}):</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {data.modules.slice(0, 5).map((module: any, idx: number) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      {module.name || `Module ${idx + 1}`}
                    </Badge>
                  ))}
                  {data.modules.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{data.modules.length - 5} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {data.licenses && data.licenses.length > 0 && (
              <div>
                <span className="text-sm font-medium">Licenses ({data.licenses.length}):</span>
                <div className="mt-1 space-y-1">
                  {data.licenses.slice(0, 3).map((license: any, idx: number) => (
                    <div key={idx} className="text-xs text-gray-600 flex justify-between">
                      <span>{license.name}</span>
                      <span>{license.expires}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResourceDataCard = (data: any, title: string = "Resource Metrics") => {
    if (!data) return null;

    const metrics = data.metrics || data;
    const performance = metrics.performance || metrics;
    const capacities = metrics.capacities || metrics;

    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HardDrive className="h-4 w-4 text-orange-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Performance Metrics */}
            {performance && (
              <div>
                <h4 className="text-sm font-medium mb-2">Performance</h4>
                <div className="space-y-2">
                  {performance.cpuUsage !== undefined && (
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>CPU Usage</span>
                        <span>{performance.cpuUsage}%</span>
                      </div>
                      <Progress value={performance.cpuUsage} className="h-2" />
                    </div>
                  )}
                  
                  {performance.memoryUsage !== undefined && (
                    <div>
                      <div className="flex justify-between text-sm">
                        <span>Memory Usage</span>
                        <span>{performance.memoryUsage}%</span>
                      </div>
                      <Progress value={performance.memoryUsage} className="h-2" />
                    </div>
                  )}
                  
                  {performance.uptime && (
                    <div className="text-sm">
                      <span className="font-medium">Uptime:</span>
                      <span className="ml-2 text-gray-600">{performance.uptime}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Capacity Information */}
            {capacities && (
              <div>
                <h4 className="text-sm font-medium mb-2">Capacity</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {capacities.devices && (
                    <div>
                      <span className="font-medium">Devices:</span>
                      <p>{capacities.devices.current}/{capacities.devices.limit || '∞'}</p>
                    </div>
                  )}
                  {capacities.points && (
                    <div>
                      <span className="font-medium">Points:</span>
                      <p>{capacities.points.current}/{capacities.points.limit || '∞'}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDeviceDataCard = (data: any, title: string, driverType: 'bacnet' | 'n2' | 'modbus' | 'lon') => {
    if (!data || !data.devices) return null;

    const devices = Array.isArray(data.devices) ? data.devices : [];
    const onlineDevices = devices.filter((d: any) => d.status === 'ok' || d.status === 'online').length;
    const healthPercentage = devices.length > 0 ? Math.round((onlineDevices / devices.length) * 100) : 0;

    const getDriverIcon = () => {
      switch (driverType) {
        case 'bacnet': return <Database className="h-4 w-4 text-purple-600" />;
        case 'n2': return <Network className="h-4 w-4 text-green-600" />;
        case 'modbus': return <Zap className="h-4 w-4 text-yellow-600" />;
        case 'lon': return <Users className="h-4 w-4 text-indigo-600" />;
        default: return <Database className="h-4 w-4 text-gray-600" />;
      }
    };

    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            {getDriverIcon()}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Device Summary */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xl font-bold">{devices.length}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">{onlineDevices}</p>
                <p className="text-xs text-gray-600">Online</p>
              </div>
              <div>
                <p className="text-xl font-bold text-red-600">{devices.length - onlineDevices}</p>
                <p className="text-xs text-gray-600">Offline</p>
              </div>
            </div>

            {/* Health Indicator */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Network Health</span>
                <span>{healthPercentage}%</span>
              </div>
              <Progress 
                value={healthPercentage} 
                className={`h-2 ${healthPercentage >= 90 ? 'text-green-600' : healthPercentage >= 70 ? 'text-yellow-600' : 'text-red-600'}`}
              />
            </div>

            {/* Device Types/Vendors */}
            {driverType === 'bacnet' && data.summary?.vendors && (
              <div>
                <span className="text-sm font-medium">Top Vendors:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data.summary.vendors.slice(0, 3).map((vendor: any, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {vendor.name} ({vendor.count})
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderNetworkDataCard = (data: any, title: string = "Network Topology") => {
    if (!data || !data.network) return null;

    const networkNodes = data.network.nodes || [];
    const onlineNodes = networkNodes.filter((node: any) => 
      node.status === 'ok' || node.status === 'online'
    ).length;

    return (
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Network className="h-4 w-4 text-blue-600" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Network Summary */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Total Stations:</span>
                <p className="text-xl font-bold">{networkNodes.length}</p>
              </div>
              <div>
                <span className="font-medium">Online:</span>
                <p className="text-xl font-bold text-green-600">{onlineNodes}</p>
              </div>
            </div>

            {/* Network Nodes Preview */}
            {networkNodes.length > 0 && (
              <div>
                <span className="text-sm font-medium">Network Stations:</span>
                <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                  {networkNodes.slice(0, 5).map((node: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-1 bg-gray-50 rounded">
                      <span className="truncate flex-1" title={node.name}>
                        {node.name}
                      </span>
                      <div className="flex items-center gap-1">
                        {node.address && (
                          <span className="text-gray-500">{node.address}</span>
                        )}
                        <div className={`w-2 h-2 rounded-full ${
                          node.status === 'ok' || node.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                      </div>
                    </div>
                  ))}
                  {networkNodes.length > 5 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{networkNodes.length - 5} more stations
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSystemSummary = () => {
    const fileCount = systemData.uploadedFiles?.length || 0;
    const lastUpdate = systemData.lastUpdated ? new Date(systemData.lastUpdated).toLocaleString() : 'N/A';
    
    // Calculate total devices across all JACEs and drivers
    let totalDevices = 0;
    Object.values(systemData.jaces || {}).forEach((jace: any) => {
      if (jace.drivers) {
        Object.values(jace.drivers).forEach((driver: any) => {
          if (driver.devices && Array.isArray(driver.devices)) {
            totalDevices += driver.devices.length;
          }
        });
      }
    });

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            System Import Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{fileCount}</p>
              <p className="text-sm text-gray-600">Files Processed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{Object.keys(systemData.jaces || {}).length}</p>
              <p className="text-sm text-gray-600">JACE Controllers</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{totalDevices}</p>
              <p className="text-sm text-gray-600">Total Devices</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {systemData.supervisor ? '1' : '0'}
              </p>
              <p className="text-sm text-gray-600">Supervisor</p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last Updated: {lastUpdate}</span>
              <Badge variant="default">
                {systemData.systemType === 'supervisor' ? 'Multi-JACE System' : 'Single JACE System'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* System Summary */}
      {renderSystemSummary()}

      {/* Supervisor Data */}
      {systemData.supervisor && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Server className="h-5 w-5" />
            Supervisor System
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {systemData.supervisor.platform && renderPlatformDataCard(systemData.supervisor.platform, "Supervisor Platform")}
            {systemData.supervisor.resources && renderResourceDataCard(systemData.supervisor.resources, "Supervisor Resources")}
            {systemData.supervisor.niagara_network && renderNetworkDataCard(systemData.supervisor.niagara_network, "Network Topology")}
          </div>
        </div>
      )}

      {/* JACE Data */}
      {systemData.jaces && Object.keys(systemData.jaces).length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            JACE Controllers ({Object.keys(systemData.jaces).length})
          </h3>
          <div className="space-y-6">
            {Object.entries(systemData.jaces).map(([jaceName, jaceData]: [string, any]) => (
              <div key={jaceName} className="border rounded-lg p-4">
                <h4 className="font-medium mb-4 flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  {jaceName}
                  {jaceData.networkInfo && (
                    <Badge variant="outline" className="ml-2">
                      {jaceData.networkInfo.address}
                    </Badge>
                  )}
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  {/* Platform and Resources */}
                  {jaceData.platform && renderPlatformDataCard(jaceData.platform, "Platform")}
                  {jaceData.resources && renderResourceDataCard(jaceData.resources, "Resources")}
                  
                  {/* Drivers */}
                  {jaceData.drivers && Object.entries(jaceData.drivers).map(([driverType, driverData]: [string, any]) => {
                    if (driverType === 'bacnet') {
                      return renderDeviceDataCard(driverData, "BACnet Devices", 'bacnet');
                    } else if (driverType === 'n2') {
                      return renderDeviceDataCard(driverData, "N2 Devices", 'n2');
                    } else if (driverType === 'modbus') {
                      return renderDeviceDataCard(driverData, "Modbus Devices", 'modbus');
                    } else if (driverType === 'lon') {
                      return renderDeviceDataCard(driverData, "LON Devices", 'lon');
                    }
                    return null;
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Alert */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <span>Data import and visualization complete</span>
            <Badge variant="default">Ready for Analysis</Badge>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default ImportDataVisualization;