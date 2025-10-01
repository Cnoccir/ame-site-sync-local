import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Network,
  Database,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Cpu,
  Server,
  BarChart3,
  PieChart,
  Download,
  Upload
} from 'lucide-react';
import type { EditableSystemData } from './TridiumDataManager';
import { InventoryTable, type Device as InventoryDevice } from './InventoryTable';

// Use the Device interface from InventoryTable
type Device = InventoryDevice & {
  network: string; // Legacy field for compatibility
  jaceId: string;
  jaceName: string;
  notes?: string;
  customFields?: Record<string, any>;
}

interface DeviceInventoryManagerProps {
  systemData: EditableSystemData;
  editMode: boolean;
  onDeviceUpdate: (deviceId: string, updates: Partial<Device>) => void;
  onDeviceAdd?: (jaceId: string, device: Omit<Device, 'id' | 'jaceId' | 'jaceName'>) => void;
  onDeviceRemove?: (deviceId: string) => void;
  onBulkUpdate?: (deviceIds: string[], updates: Partial<Device>) => void;
}

export const DeviceInventoryManager: React.FC<DeviceInventoryManagerProps> = ({
  systemData,
  editMode,
  onDeviceUpdate,
  onDeviceAdd,
  onDeviceRemove,
  onBulkUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterJace, setFilterJace] = useState<string>('all');
  const [filterNetwork, setFilterNetwork] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
  const [editingDevice, setEditingDevice] = useState<string | null>(null);
  const [newDevice, setNewDevice] = useState<Partial<Device> | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'hierarchy'>('table');

  // Convert system data to normalized device list
  const allDevices = useMemo((): Device[] => {
    const devices: Device[] = [];

    Object.entries(systemData.jaces || {}).forEach(([jaceId, jace]) => {
      const jaceName = jace.platform?.hostName || jaceId;

      // Extract devices from each driver type
      Object.entries(jace.drivers || {}).forEach(([driverType, driverData]) => {
        if (driverData?.devices) {
          driverData.devices.forEach((device: any, index: number) => {
            devices.push({
              id: `${jaceId}-${driverType}-${device.name || index}`,
              name: device.name || `Device_${index}`,
              type: device.type || driverType,
              status: (device.status as Device['status']) || 'offline',
              address: device.address || 'Unknown',
              description: device.description,
              lastSeen: device.lastSeen,
              // BACnet specific
              deviceId: device.deviceId ? parseInt(device.deviceId.toString()) : undefined,
              vendorName: device.vendor || 'Unknown',
              modelName: device.model || 'Unknown',
              // N2 specific
              nodeAddress: device.nodeAddress ? parseInt(device.nodeAddress.toString()) : undefined,
              deviceType: device.deviceType,
              firmwareVersion: device.firmware,
              // Modbus specific
              slaveId: device.slaveId ? parseInt(device.slaveId.toString()) : undefined,
              registerMap: device.registerMap,
              // Computed fields
              faulty: device.status === 'alarm' || device.status === 'fault',
              daysSinceLastSeen: device.lastSeen ?
                Math.floor((Date.now() - new Date(device.lastSeen).getTime()) / (1000 * 60 * 60 * 24)) : undefined,
              // Legacy fields for compatibility (including network)
              network: driverType.toUpperCase(), // BACnet, N2, etc.
              jaceId,
              jaceName,
              notes: device.notes,
              customFields: device.customFields
            });
          });
        }
      });
    });

    return devices;
  }, [systemData]);

  // Filter devices based on search and filter criteria
  const filteredDevices = useMemo(() => {
    return allDevices.filter(device => {
      const matchesSearch =
        device.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (device.vendorName && device.vendorName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (device.modelName && device.modelName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (device.address && device.address.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesJace = filterJace === 'all' || device.jaceId === filterJace;
      const matchesNetwork = filterNetwork === 'all' || device.network === filterNetwork;
      const matchesStatus = filterStatus === 'all' || device.status === filterStatus;

      return matchesSearch && matchesJace && matchesNetwork && matchesStatus;
    });
  }, [allDevices, searchTerm, filterJace, filterNetwork, filterStatus]);

  // Get unique values for filters
  const uniqueJaces = useMemo(() => {
    return [...new Set(allDevices.map(d => ({ id: d.jaceId, name: d.jaceName })))];
  }, [allDevices]);

  const uniqueNetworks = useMemo(() => {
    return [...new Set(allDevices.map(d => d.network))];
  }, [allDevices]);

  const deviceStats = useMemo(() => {
    return {
      total: allDevices.length,
      online: allDevices.filter(d => d.status === 'online').length,
      offline: allDevices.filter(d => d.status === 'offline').length,
      alarm: allDevices.filter(d => d.status === 'alarm').length,
      byNetwork: uniqueNetworks.reduce((acc, network) => {
        acc[network] = allDevices.filter(d => d.network === network).length;
        return acc;
      }, {} as Record<string, number>),
      byVendor: allDevices.reduce((acc, device) => {
        acc[device.vendor] = (acc[device.vendor] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }, [allDevices, uniqueNetworks]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-red-100 text-red-800';
      case 'alarm': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircle2;
      case 'offline': return AlertCircle;
      case 'alarm': return AlertTriangle;
      default: return AlertCircle;
    }
  };

  const getDriverTypeFromNetwork = (network: string): 'BACnet' | 'N2' | 'Modbus' | 'LON' | 'OPC' => {
    const networkLower = network.toLowerCase();
    if (networkLower.includes('bacnet')) return 'BACnet';
    if (networkLower.includes('n2')) return 'N2';
    if (networkLower.includes('modbus')) return 'Modbus';
    if (networkLower.includes('lon')) return 'LON';
    if (networkLower.includes('opc')) return 'OPC';
    return 'BACnet'; // Default fallback
  };

  const handleDeviceEdit = (device: Device) => {
    setEditingDevice(device.id);
  };

  const handleDeviceSave = (device: Device, updates: Partial<Device>) => {
    onDeviceUpdate(device.id, updates);
    setEditingDevice(null);
  };

  const handleBulkAction = (action: 'status' | 'vendor' | 'delete', value?: any) => {
    if (selectedDevices.size === 0) return;

    const deviceIds = Array.from(selectedDevices);

    if (action === 'delete' && onDeviceRemove) {
      deviceIds.forEach(id => onDeviceRemove(id));
      setSelectedDevices(new Set());
    } else if (action === 'status' && onBulkUpdate) {
      onBulkUpdate(deviceIds, { status: value });
      setSelectedDevices(new Set());
    }
  };

  const exportDevices = () => {
    const csv = [
      ['Name', 'Device ID', 'Network', 'Status', 'Vendor', 'Model', 'Firmware', 'Address', 'MAC Address', 'JACE', 'Last Seen'].join(','),
      ...filteredDevices.map(device => [
        device.name,
        device.deviceId || '',
        device.network,
        device.status,
        device.vendor,
        device.model,
        device.firmware || '',
        device.address || '',
        device.macAddress || '',
        device.jaceName,
        device.lastSeen || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `device-inventory-${Date.now()}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Device Inventory Management</h3>
          <p className="text-sm text-gray-600">
            View and manage {deviceStats.total} devices across {uniqueJaces.length} JACE controllers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportDevices}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          {editMode && onDeviceAdd && (
            <Button onClick={() => setNewDevice({})}>
              <Plus className="h-4 w-4 mr-2" />
              Add Device
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{deviceStats.total}</div>
            <div className="text-xs text-gray-600">Total Devices</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{deviceStats.online}</div>
            <div className="text-xs text-gray-600">Online</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{deviceStats.offline}</div>
            <div className="text-xs text-gray-600">Offline</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{deviceStats.alarm}</div>
            <div className="text-xs text-gray-600">Alarms</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64 relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search devices by name, vendor, model, or address..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={filterJace} onValueChange={setFilterJace}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by JACE" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All JACEs</SelectItem>
            {uniqueJaces.map(jace => (
              <SelectItem key={jace.id} value={jace.id}>{jace.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterNetwork} onValueChange={setFilterNetwork}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Network" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Networks</SelectItem>
            {uniqueNetworks.map(network => (
              <SelectItem key={network} value={network}>{network}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="alarm">Alarm</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1">
          <Button
            variant={viewMode === 'table' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            Table
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            Cards
          </Button>
          <Button
            variant={viewMode === 'hierarchy' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('hierarchy')}
          >
            Hierarchy
          </Button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedDevices.size > 0 && editMode && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>{selectedDevices.size} devices selected</span>
              <div className="flex gap-2">
                <Select onValueChange={(value) => handleBulkAction('status', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Set Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="offline">Offline</SelectItem>
                    <SelectItem value="alarm">Alarm</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleBulkAction('delete')}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDevices(new Set())}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Device Views */}
      <Tabs defaultValue="devices">
        <TabsList>
          <TabsTrigger value="devices">Device List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="networks">By Network</TabsTrigger>
        </TabsList>

        <TabsContent value="devices" className="space-y-4">
          {viewMode === 'table' && (
            <div className="space-y-6">
              {/* Group devices by driver type */}
              {Object.entries(
                filteredDevices.reduce((acc, device) => {
                  const driverType = getDriverTypeFromNetwork(device.network);
                  if (!acc[driverType]) acc[driverType] = [];
                  acc[driverType].push(device);
                  return acc;
                }, {} as Record<string, Device[]>)
              ).map(([driverType, devices]) => (
                <InventoryTable
                  key={driverType}
                  title={`${driverType} Devices`}
                  driverType={driverType as 'BACnet' | 'N2' | 'Modbus' | 'LON' | 'OPC'}
                  devices={devices}
                  onUpdateDevice={(device) => onDeviceUpdate(device.id, device)}
                  onAddDevice={(device) => {
                    const newDeviceWithJace = {
                      ...device,
                      jaceId: filteredDevices[0]?.jaceId || 'default',
                      jaceName: filteredDevices[0]?.jaceName || 'Default JACE'
                    };
                    onDeviceAdd?.(newDeviceWithJace.jaceId, newDeviceWithJace);
                  }}
                  onRemoveDevice={(deviceId) => onDeviceRemove?.(deviceId)}
                  editable={editMode}
                />
              ))}
            </div>
          )}

          {viewMode === 'cards' && (
            <DeviceCards
              devices={filteredDevices}
              editMode={editMode}
              onDeviceEdit={handleDeviceEdit}
              onDeviceUpdate={onDeviceUpdate}
            />
          )}

          {viewMode === 'hierarchy' && (
            <DeviceHierarchy
              devices={filteredDevices}
              jaces={uniqueJaces}
              editMode={editMode}
              onDeviceEdit={handleDeviceEdit}
            />
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <DeviceAnalytics deviceStats={deviceStats} devices={allDevices} />
        </TabsContent>

        <TabsContent value="networks">
          <NetworkView devices={filteredDevices} />
        </TabsContent>
      </Tabs>

      {/* Add New Device Modal */}
      {newDevice && (
        <NewDeviceModal
          device={newDevice}
          jaces={uniqueJaces}
          onSave={(device) => {
            if (onDeviceAdd) {
              onDeviceAdd(device.jaceId!, device);
            }
            setNewDevice(null);
          }}
          onCancel={() => setNewDevice(null)}
        />
      )}
    </div>
  );
};

// Note: DeviceTable component removed in favor of enhanced InventoryTable

// Device Cards Component - Placeholder
const DeviceCards: React.FC<{
  devices: Device[];
  editMode: boolean;
  onDeviceEdit: (device: Device) => void;
  onDeviceUpdate: (deviceId: string, updates: Partial<Device>) => void;
}> = ({ devices, editMode, onDeviceEdit, onDeviceUpdate }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {devices.map((device) => (
        <Card key={device.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium">{device.name}</h4>
              <Badge className={getStatusColor(device.status)}>
                {device.status}
              </Badge>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div>Network: {device.network}</div>
              <div>Vendor: {device.vendor}</div>
              <div>Model: {device.model}</div>
              <div>JACE: {device.jaceName}</div>
            </div>
            {editMode && (
              <Button
                size="sm"
                variant="outline"
                className="mt-3 w-full"
                onClick={() => onDeviceEdit(device)}
              >
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Device Hierarchy Component - Placeholder
const DeviceHierarchy: React.FC<{
  devices: Device[];
  jaces: Array<{ id: string; name: string }>;
  editMode: boolean;
  onDeviceEdit: (device: Device) => void;
}> = ({ devices, jaces, editMode, onDeviceEdit }) => {
  return (
    <div className="space-y-4">
      {jaces.map((jace) => {
        const jaceDevices = devices.filter(d => d.jaceId === jace.id);
        const networks = [...new Set(jaceDevices.map(d => d.network))];

        return (
          <Card key={jace.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                {jace.name}
                <Badge variant="outline">{jaceDevices.length} devices</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {networks.map((network) => {
                const networkDevices = jaceDevices.filter(d => d.network === network);
                return (
                  <div key={network} className="mb-4">
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      {network} Network
                      <Badge variant="secondary">{networkDevices.length}</Badge>
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {networkDevices.map((device) => (
                        <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium text-sm">{device.name}</div>
                            <div className="text-xs text-gray-600">{device.vendorName || device.type} {device.modelName || 'Unknown'}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(device.status)}>
                              {device.status}
                            </Badge>
                            {editMode && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={() => onDeviceEdit(device)}
                              >
                                <Edit3 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Device Analytics Component - Placeholder
const DeviceAnalytics: React.FC<{
  deviceStats: any;
  devices: Device[];
}> = ({ deviceStats, devices }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Status Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Online</span>
              <span>{deviceStats.online} ({Math.round((deviceStats.online / deviceStats.total) * 100)}%)</span>
            </div>
            <div className="flex justify-between">
              <span>Offline</span>
              <span>{deviceStats.offline} ({Math.round((deviceStats.offline / deviceStats.total) * 100)}%)</span>
            </div>
            <div className="flex justify-between">
              <span>Alarm</span>
              <span>{deviceStats.alarm} ({Math.round((deviceStats.alarm / deviceStats.total) * 100)}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Vendors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(deviceStats.byVendor)
              .sort(([,a], [,b]) => (b as number) - (a as number))
              .slice(0, 5)
              .map(([vendor, count]) => (
                <div key={vendor} className="flex justify-between">
                  <span>{vendor}</span>
                  <span>{count}</span>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Network View Component - Placeholder
const NetworkView: React.FC<{
  devices: Device[];
}> = ({ devices }) => {
  const networkStats = useMemo(() => {
    const networks = [...new Set(devices.map(d => d.network))];
    return networks.map(network => {
      const networkDevices = devices.filter(d => d.network === network);
      return {
        name: network,
        devices: networkDevices,
        total: networkDevices.length,
        online: networkDevices.filter(d => d.status === 'online').length,
        offline: networkDevices.filter(d => d.status === 'offline').length
      };
    });
  }, [devices]);

  return (
    <div className="space-y-4">
      {networkStats.map((network) => (
        <Card key={network.name}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                {network.name} Network
              </div>
              <Badge variant="outline">{network.total} devices</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{network.total}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{network.online}</div>
                <div className="text-xs text-gray-600">Online</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{network.offline}</div>
                <div className="text-xs text-gray-600">Offline</div>
              </div>
            </div>
            <div className="space-y-1">
              {network.devices.slice(0, 5).map((device) => (
                <div key={device.id} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm">{device.name}</span>
                  <Badge className={getStatusColor(device.status)}>
                    {device.status}
                  </Badge>
                </div>
              ))}
              {network.devices.length > 5 && (
                <div className="text-center text-sm text-gray-600">
                  ... and {network.devices.length - 5} more devices
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// New Device Modal Component - Placeholder
const NewDeviceModal: React.FC<{
  device: Partial<Device>;
  jaces: Array<{ id: string; name: string }>;
  onSave: (device: Partial<Device>) => void;
  onCancel: () => void;
}> = ({ device, jaces, onSave, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-96">
        <CardHeader>
          <CardTitle>Add New Device</CardTitle>
        </CardHeader>
        <CardContent>
          <p>New device form implementation...</p>
          <div className="flex gap-2 mt-4">
            <Button onClick={() => onSave(device)}>Save</Button>
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};