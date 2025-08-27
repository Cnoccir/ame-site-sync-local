import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NetworkNode } from '@/types/tridium';
import { 
  Activity, 
  Info, 
  Database, 
  Cpu, 
  HardDrive, 
  Network, 
  Clock,
  Monitor,
  Settings,
  FileText,
  Gauge
} from 'lucide-react';

interface DeviceDetailsPanelProps {
  node: NetworkNode | null;
  onClose?: () => void;
}

interface DataField {
  label: string;
  value: any;
  icon?: React.ReactNode;
  format?: 'text' | 'number' | 'percentage' | 'memory' | 'timestamp' | 'status';
}

export const DeviceDetailsPanel: React.FC<DeviceDetailsPanelProps> = ({ 
  node, 
  onClose 
}) => {
  const [activeTab, setActiveTab] = useState('inventory');

  // Reset active tab when node changes
  useEffect(() => {
    if (node) {
      setActiveTab('inventory');
    }
  }, [node]);

  if (!node) {
    return (
      <Card className="w-full h-full flex items-center justify-center">
        <CardContent>
          <div className="text-center text-muted-foreground">
            <Monitor className="mx-auto h-12 w-12 mb-4" />
            <p>Select a device to view details</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasResources = node.metadata?.resources;
  const hasPlatformInfo = node.metadata?.platform || node.metadata?.model || node.metadata?.version;
  const hasAssociatedDatasets = node.metadata?.associatedDatasets?.length > 0;
  const hasDriverInfo = node.metadata?.driverInfo && Object.keys(node.metadata.driverInfo).length > 0;

  return (
    <Card className="w-full h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              <CardTitle className="text-lg">{node.name}</CardTitle>
            </div>
            <Badge variant={node.status?.badge?.variant as any || 'default'}>
              {node.status?.badge?.text || 'UNKNOWN'}
            </Badge>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
        <div className="text-sm text-muted-foreground">
          {node.type.charAt(0).toUpperCase() + node.type.slice(1)} • {node.protocol || 'Unknown Protocol'}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mx-6">
            <TabsTrigger value="inventory" className="flex items-center gap-1 text-xs sm:text-sm">
              <Info className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Inventory</span>
              <span className="sm:hidden">Info</span>
            </TabsTrigger>
            <TabsTrigger 
              value="resources" 
              disabled={!hasResources}
              className="flex items-center gap-1 text-xs sm:text-sm"
            >
              <Activity className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Resources</span>
              <span className="sm:hidden">Res</span>
            </TabsTrigger>
            <TabsTrigger 
              value="platform" 
              disabled={!hasPlatformInfo}
              className="flex items-center gap-1 text-xs sm:text-sm"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Platform</span>
              <span className="sm:hidden">Plat</span>
            </TabsTrigger>
            <TabsTrigger 
              value="drivers" 
              disabled={!hasDriverInfo}
              className="flex items-center gap-1 text-xs sm:text-sm"
            >
              <Network className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Drivers</span>
              <span className="sm:hidden">Drv</span>
            </TabsTrigger>
            <TabsTrigger 
              value="datasets" 
              disabled={!hasAssociatedDatasets}
              className="flex items-center gap-1 text-xs sm:text-sm"
            >
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Files</span>
              <span className="sm:hidden">Files</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-4 px-3 sm:px-6 pb-6">
            <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-300px)]">
              <InventoryView node={node} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="resources" className="mt-4 px-3 sm:px-6 pb-6">
            <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-300px)]">
              <ResourcesView node={node} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="platform" className="mt-4 px-3 sm:px-6 pb-6">
            <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-300px)]">
              <PlatformView node={node} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="drivers" className="mt-4 px-3 sm:px-6 pb-6">
            <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-300px)]">
              <DriversView node={node} />
            </ScrollArea>
          </TabsContent>

          <TabsContent value="datasets" className="mt-4 px-3 sm:px-6 pb-6">
            <ScrollArea className="h-[calc(100vh-280px)] sm:h-[calc(100vh-300px)]">
              <DatasetsView node={node} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// Inventory View Component
const InventoryView: React.FC<{ node: NetworkNode }> = ({ node }) => {
  const inventoryFields: DataField[] = [
    { label: 'Device ID', value: node.id, icon: <Monitor className="h-4 w-4" /> },
    { label: 'Name', value: node.name, icon: <Info className="h-4 w-4" /> },
    { label: 'Type', value: node.type.charAt(0).toUpperCase() + node.type.slice(1), icon: <Settings className="h-4 w-4" /> },
    { label: 'Protocol', value: node.protocol, icon: <Network className="h-4 w-4" /> },
    { label: 'Address', value: node.address, icon: <Network className="h-4 w-4" /> },
    { label: 'Status', value: node.status?.status, icon: <Activity className="h-4 w-4" />, format: 'status' },
    { label: 'Model', value: node.metadata?.model, icon: <Monitor className="h-4 w-4" /> },
    { label: 'Vendor', value: node.metadata?.vendor, icon: <Info className="h-4 w-4" /> },
    { label: 'Version', value: node.metadata?.version, icon: <Settings className="h-4 w-4" /> },
    { label: 'Controller Type', value: node.metadata?.controllerType, icon: <Settings className="h-4 w-4" /> },
    { label: 'Children', value: node.children.length, icon: <Network className="h-4 w-4" />, format: 'number' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Device Information</h3>
        <MultiColumnDisplay fields={inventoryFields} />
      </div>

      {node.status?.details && node.status.details.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Status Details</h3>
          <Card className="p-4">
            <div className="space-y-2">
              {node.status.details.map((detail, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {node.children.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Child Devices</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
            {node.children.map((child, index) => (
              <Card key={child.id} className="p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{child.name}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {child.type} • {child.protocol}
                    </div>
                  </div>
                  <Badge variant={child.status?.badge?.variant as any || 'default'} className="text-xs flex-shrink-0">
                    {child.status?.badge?.text || 'UNKNOWN'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Resources View Component
const ResourcesView: React.FC<{ node: NetworkNode }> = ({ node }) => {
  const resources = node.metadata?.resources;

  if (!resources) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Activity className="mx-auto h-12 w-12 mb-4" />
        <p>No resource data available</p>
      </div>
    );
  }

  const performanceFields: DataField[] = [
    { label: 'CPU Usage', value: resources.cpuUsage, icon: <Cpu className="h-4 w-4" />, format: 'percentage' },
    { label: 'Memory Used', value: resources.memoryUsed, icon: <HardDrive className="h-4 w-4" />, format: 'memory' },
    { label: 'Memory Total', value: resources.memoryTotal, icon: <HardDrive className="h-4 w-4" />, format: 'memory' },
    { label: 'Heap Used', value: resources.heapUsed, icon: <Database className="h-4 w-4" />, format: 'memory' },
    { label: 'Heap Max', value: resources.heapMax, icon: <Database className="h-4 w-4" />, format: 'memory' },
    { label: 'Uptime', value: resources.uptime, icon: <Clock className="h-4 w-4" /> },
  ];

  const capacityFields: DataField[] = [
    { label: 'Device Count', value: resources.deviceCount, icon: <Monitor className="h-4 w-4" />, format: 'number' },
    { label: 'Point Count', value: resources.pointCount, icon: <Gauge className="h-4 w-4" />, format: 'number' },
    { label: 'History Count', value: resources.historyCount, icon: <Database className="h-4 w-4" />, format: 'number' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">System Performance</h3>
        <MultiColumnDisplay fields={performanceFields} />
      </div>

      <Separator />

      <div>
        <h3 className="text-lg font-semibold mb-3">Capacity Information</h3>
        <MultiColumnDisplay fields={capacityFields} />
      </div>

      {resources.rawData && Object.keys(resources.rawData).length > 10 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Additional Resources</h3>
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(resources.rawData)
                .filter(([key]) => !['cpu.usage', 'mem.used', 'mem.total', 'heap.used', 'heap.max', 'time.uptime', 'globalCapacity.devices', 'globalCapacity.points', 'globalCapacity.histories'].includes(key))
                .map(([key, value]) => (
                  <div key={key} className="space-y-1">
                    <div className="text-sm font-medium truncate">{key}</div>
                    <div className="text-sm text-muted-foreground truncate">
                      {formatValue(value, 'text')}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Platform View Component
const PlatformView: React.FC<{ node: NetworkNode }> = ({ node }) => {
  const platformFields: DataField[] = [
    { label: 'Platform', value: node.metadata?.platform, icon: <Settings className="h-4 w-4" /> },
    { label: 'Model', value: node.metadata?.model, icon: <Monitor className="h-4 w-4" /> },
    { label: 'Version', value: node.metadata?.version, icon: <Info className="h-4 w-4" /> },
    { label: 'Vendor', value: node.metadata?.vendor, icon: <Info className="h-4 w-4" /> },
    { label: 'Device ID', value: node.metadata?.deviceId, icon: <Monitor className="h-4 w-4" /> },
    { label: 'Controller Type', value: node.metadata?.controllerType, icon: <Settings className="h-4 w-4" /> },
    { label: 'Source Dataset', value: node.metadata?.sourceDataset, icon: <FileText className="h-4 w-4" /> },
    { label: 'Source Format', value: node.metadata?.sourceFormat, icon: <FileText className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Platform Details</h3>
        <MultiColumnDisplay fields={platformFields} />
      </div>

      {node.metadata?.rawData && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Raw Platform Data</h3>
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(node.metadata.rawData).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <div className="text-sm font-medium truncate">{key}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {formatValue(value, 'text')}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

// Drivers View Component
const DriversView: React.FC<{ node: NetworkNode }> = ({ node }) => {
  const driverInfo = node.metadata?.driverInfo || {};

  if (Object.keys(driverInfo).length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <Network className="mx-auto h-12 w-12 mb-4" />
        <p>No driver data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-3">Driver Information</h3>
      <div className="grid grid-cols-1 gap-6">
        {Object.entries(driverInfo).map(([driverType, info]) => (
          <Card key={driverType} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  <h4 className="font-semibold text-lg">
                    {driverType === 'BACnetExport' ? 'BACnet Devices' : 'N2 Network Devices'}
                  </h4>
                </div>
                <Badge variant="outline">{driverType}</Badge>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Source File:</span>
                  <div className="font-medium break-words">{info.filename}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Total Devices:</span>
                  <div className="font-medium">{info.deviceCount.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Online Devices:</span>
                  <div className="font-medium text-green-600">{info.deviceStats.online.toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Offline/Fault:</span>
                  <div className="font-medium text-red-600">{info.deviceStats.offline.toLocaleString()}</div>
                </div>
              </div>
              
              {info.deviceStats.alarm > 0 && (
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-600 font-medium">
                    {info.deviceStats.alarm.toLocaleString()} devices with alarms
                  </span>
                </div>
              )}
              
              {/* Device status breakdown */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="text-sm font-medium mb-2">Device Status Summary</div>
                <div className="flex gap-6 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Online: {info.deviceStats.online}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Offline: {info.deviceStats.offline}</span>
                  </div>
                  {info.deviceStats.alarm > 0 && (
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <span>Alarm: {info.deviceStats.alarm}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Datasets View Component
const DatasetsView: React.FC<{ node: NetworkNode }> = ({ node }) => {
  const datasets = node.metadata?.associatedDatasets || [];

  if (datasets.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        <FileText className="mx-auto h-12 w-12 mb-4" />
        <p>No associated datasets</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Associated Files</h3>
      <div className="grid grid-cols-1 gap-4">
        {datasets.map((dataset, index) => (
          <Card key={dataset.id || index} className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span className="font-medium">{dataset.filename}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Format:</span>
                    <div className="font-medium">{dataset.format}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Category:</span>
                    <div className="font-medium">{dataset.category}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Records:</span>
                    <div className="font-medium">{dataset.rowCount}</div>
                  </div>
                </div>
              </div>
              <Badge variant="outline">
                {dataset.format}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Multi-column display component for reducing vertical scrolling
const MultiColumnDisplay: React.FC<{ fields: DataField[] }> = ({ fields }) => {
  const visibleFields = fields.filter(field => field.value !== undefined && field.value !== null && field.value !== '');

  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleFields.map((field, index) => (
          <div key={index} className="flex items-start gap-3 min-h-[3rem]">
            {field.icon && (
              <div className="text-muted-foreground flex-shrink-0 mt-0.5">
                {field.icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-sm text-muted-foreground mb-1">{field.label}</div>
              <div className="font-medium text-sm leading-tight break-words">
                {formatValue(field.value, field.format)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

// Value formatting utility
const formatValue = (value: any, format?: DataField['format']): string => {
  if (value === undefined || value === null) return 'N/A';

  switch (format) {
    case 'percentage':
      if (typeof value === 'number') return `${value.toFixed(1)}%`;
      if (typeof value === 'string' && value.includes('%')) return value;
      return `${value}%`;
    
    case 'memory':
      if (typeof value === 'number') return `${value.toLocaleString()} MB`;
      return String(value);
    
    case 'number':
      if (typeof value === 'object' && value.current !== undefined) {
        return `${value.current.toLocaleString()}${value.limit ? ` / ${value.limit.toLocaleString()}` : ''}`;
      }
      if (typeof value === 'number') return value.toLocaleString();
      return String(value);
    
    case 'status':
      return String(value).toUpperCase();
    
    case 'timestamp':
      if (value instanceof Date) return value.toLocaleString();
      return String(value);
    
    default:
      return String(value);
  }
};

export default DeviceDetailsPanel;
