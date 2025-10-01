import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff,
  Search,
  Filter,
  Download,
  Eye,
  MoreHorizontal,
  Cpu,
  Database,
  Network as NetworkIcon,
  Activity
} from 'lucide-react';

interface DeviceInventoryTablesProps {
  systemData: {
    bacnetDevices?: any[];
    n2Devices?: any[];
    networkStations?: any[];
    platformData?: any;
    resourceData?: any;
  };
  onDeviceSelect?: (device: any, type: 'bacnet' | 'n2' | 'network') => void;
}

export const DeviceInventoryTables: React.FC<DeviceInventoryTablesProps> = ({
  systemData,
  onDeviceSelect
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [vendorFilter, setVendorFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Extract and process device data
  const bacnetDevices = systemData.bacnetDevices || [];
  const n2Devices = systemData.n2Devices || [];
  const networkStations = systemData.networkStations || [];

  // Filter and sort functions
  const filterAndSortDevices = (devices: any[], type: 'bacnet' | 'n2' | 'network') => {
    return devices
      .filter(device => {
        const searchMatch = device.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          device.vendor?.toLowerCase().includes(searchTerm.toLowerCase());

        const statusMatch = statusFilter === 'all' ||
          (statusFilter === 'healthy' && (device.status?.includes('ok') || device.status === 'ok')) ||
          (statusFilter === 'faulty' && (device.status?.includes('alarm') || device.status?.includes('fault'))) ||
          (statusFilter === 'offline' && (device.status?.includes('down') || device.status?.includes('offline')));

        const vendorMatch = vendorFilter === 'all' || device.vendor === vendorFilter;

        return searchMatch && statusMatch && vendorMatch;
      })
      .sort((a, b) => {
        const aVal = a[sortBy] || '';
        const bVal = b[sortBy] || '';
        const comparison = aVal.toString().localeCompare(bVal.toString());
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  };

  // Get unique vendors for filter
  const uniqueVendors = useMemo(() => {
    const vendors = new Set();
    bacnetDevices.forEach(device => device.vendor && vendors.add(device.vendor));
    return Array.from(vendors).sort();
  }, [bacnetDevices]);

  // Status indicators
  const getStatusBadge = (status: string | string[], type: 'bacnet' | 'n2' | 'network') => {
    const statusStr = Array.isArray(status) ? status.join(',') : status;

    if (statusStr.includes('ok') || statusStr === 'Connected') {
      return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
    }
    if (statusStr.includes('alarm') || statusStr.includes('fault')) {
      return <Badge className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Alarm</Badge>;
    }
    if (statusStr.includes('down') || statusStr.includes('offline') || statusStr === 'Not connected') {
      return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Offline</Badge>;
    }
    return <Badge variant="outline">{statusStr}</Badge>;
  };

  // Export functions
  const exportToCSV = (devices: any[], type: string) => {
    const headers = type === 'bacnet'
      ? ['Name', 'Device ID', 'Status', 'Vendor', 'Model', 'Firmware', 'Network', 'Health']
      : type === 'n2'
      ? ['Name', 'Address', 'Status', 'Controller Type']
      : ['Name', 'IP Address', 'Model', 'Version', 'Status', 'Connection'];

    const csvContent = [
      headers.join(','),
      ...devices.map(device => {
        if (type === 'bacnet') {
          return [
            device.name,
            device.id,
            Array.isArray(device.status) ? device.status.join(';') : device.status,
            device.vendor,
            device.model,
            device.firmwareRev,
            device.networkId,
            device.health
          ].join(',');
        } else if (type === 'n2') {
          return [
            device.name,
            device.address,
            Array.isArray(device.status) ? device.status.join(';') : device.status,
            device.type
          ].join(',');
        } else {
          return [
            device.name,
            device.ipAddress,
            device.model,
            device.version,
            device.status,
            device.connectionStatus
          ].join(',');
        }
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_devices_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search devices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="healthy">Healthy</SelectItem>
              <SelectItem value="faulty">Faulty</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
            </SelectContent>
          </Select>

          {uniqueVendors.length > 0 && (
            <Select value={vendorFilter} onValueChange={setVendorFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Vendor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {uniqueVendors.map(vendor => (
                  <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Device Tables */}
      <Tabs defaultValue="bacnet" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bacnet" className="gap-2">
            <Database className="w-4 h-4" />
            BACnet Devices ({bacnetDevices.length})
          </TabsTrigger>
          <TabsTrigger value="n2" className="gap-2">
            <Cpu className="w-4 h-4" />
            N2 Devices ({n2Devices.length})
          </TabsTrigger>
          <TabsTrigger value="network" className="gap-2">
            <NetworkIcon className="w-4 h-4" />
            Network Stations ({networkStations.length})
          </TabsTrigger>
        </TabsList>

        {/* BACnet Devices Table */}
        <TabsContent value="bacnet">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                BACnet Device Inventory
              </CardTitle>
              <Button
                onClick={() => exportToCSV(filterAndSortDevices(bacnetDevices, 'bacnet'), 'bacnet')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer"
                        onClick={() => {
                          setSortBy('name');
                          setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                        }}
                      >
                        Device Name
                      </TableHead>
                      <TableHead>Device ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Firmware</TableHead>
                      <TableHead>Network</TableHead>
                      <TableHead>Health</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterAndSortDevices(bacnetDevices, 'bacnet').map((device, index) => (
                      <TableRow key={device.id || index}>
                        <TableCell className="font-medium">{device.name}</TableCell>
                        <TableCell>{device.id}</TableCell>
                        <TableCell>{getStatusBadge(device.status, 'bacnet')}</TableCell>
                        <TableCell>{device.vendor}</TableCell>
                        <TableCell>{device.model}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-1 rounded">
                            {device.firmwareRev}
                          </code>
                        </TableCell>
                        <TableCell>{device.networkId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {device.health?.includes('Ok') ? (
                              <Activity className="w-3 h-3 text-green-500" />
                            ) : (
                              <AlertTriangle className="w-3 h-3 text-yellow-500" />
                            )}
                            <span className="text-xs">
                              {device.healthTimestamp
                                ? new Date(device.healthTimestamp).toLocaleDateString()
                                : 'Unknown'
                              }
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => onDeviceSelect?.(device, 'bacnet')}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* N2 Devices Table */}
        <TabsContent value="n2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Cpu className="w-5 h-5" />
                N2 Device Inventory
              </CardTitle>
              <Button
                onClick={() => exportToCSV(filterAndSortDevices(n2Devices, 'n2'), 'n2')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Device Name</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Controller Type</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterAndSortDevices(n2Devices, 'n2').map((device, index) => (
                      <TableRow key={device.address || index}>
                        <TableCell className="font-medium">{device.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-1 rounded">
                            {device.address}
                          </code>
                        </TableCell>
                        <TableCell>{getStatusBadge(device.status, 'n2')}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{device.type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeviceSelect?.(device, 'n2')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Stations Table */}
        <TabsContent value="network">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <NetworkIcon className="w-5 h-5" />
                Network Stations
              </CardTitle>
              <Button
                onClick={() => exportToCSV(filterAndSortDevices(networkStations, 'network'), 'network')}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Station Name</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Connection</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterAndSortDevices(networkStations, 'network').map((station, index) => (
                      <TableRow key={station.name || index}>
                        <TableCell className="font-medium">{station.name}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-1 rounded">
                            {station.ipAddress}
                          </code>
                        </TableCell>
                        <TableCell>{station.model}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 px-1 rounded">
                            {station.version}
                          </code>
                        </TableCell>
                        <TableCell>{getStatusBadge(station.status, 'network')}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {station.connectionStatus === 'Connected' ? (
                              <Wifi className="w-3 h-3 text-green-500" />
                            ) : (
                              <WifiOff className="w-3 h-3 text-red-500" />
                            )}
                            <span className="text-xs">{station.connectionStatus}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeviceSelect?.(station, 'network')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">BACnet Devices</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bacnetDevices.length}</div>
            <p className="text-xs text-muted-foreground">
              {bacnetDevices.filter(d => d.status?.includes?.('ok')).length} healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">N2 Devices</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{n2Devices.length}</div>
            <p className="text-xs text-muted-foreground">
              {n2Devices.filter(d => d.status?.includes?.('ok')).length} healthy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Stations</CardTitle>
            <NetworkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{networkStations.length}</div>
            <p className="text-xs text-muted-foreground">
              {networkStations.filter(s => s.connectionStatus === 'Connected').length} connected
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};