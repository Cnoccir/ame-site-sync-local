import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Download, CheckSquare, Database } from 'lucide-react';
import { DeviceInventoryService } from "@/services/deviceInventoryService";
import { useToast } from "@/hooks/use-toast";

interface Device {
  id: string;
  Name?: string;
  name?: string;
  Status?: string;
  status?: string;
  Type?: string;
  type?: string;
  Address?: string;
  address?: string;
  'Controller Type'?: string;
  'Device ID'?: string;
  Model?: string;
  Vendor?: string;
  isOnline?: boolean;
  isDown?: boolean;
  hasAlarm?: boolean;
  statusBadge?: string;
  sourceFile?: string;
  format?: string;
  [key: string]: any;
}

interface TridiumDataTableProps {
  devices: Device[];
  onSelectionChange: (selectedDevices: Device[]) => void;
}

export const TridiumDataTable: React.FC<TridiumDataTableProps> = ({
  devices,
  onSelectionChange
}) => {
  const { toast } = useToast();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter devices
  const filteredDevices = useMemo(() => {
    let filtered = devices.filter(device => {
      const deviceName = device.Name || device.name || '';
      const matchesSearch = deviceName.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'online' && device.isOnline) ||
        (statusFilter === 'offline' && device.isDown) ||
        (statusFilter === 'alarm' && device.hasAlarm);
        
      const deviceType = device.format || device.Type || device['Controller Type'] || '';
      const matchesType = typeFilter === 'all' || deviceType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort devices - problems first, then alphabetically
    filtered.sort((a, b) => {
      const priorityA = a.isDown ? 1 : a.hasAlarm ? 2 : 3;
      const priorityB = b.isDown ? 1 : b.hasAlarm ? 2 : 3;
      if (priorityA !== priorityB) return priorityA - priorityB;
      
      const nameA = (a.Name || a.name || '').toLowerCase();
      const nameB = (b.Name || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    return filtered;
  }, [devices, searchTerm, statusFilter, typeFilter]);

  // Quick selection functions
  const selectAll = () => {
    const allIds = new Set(filteredDevices.map(d => d.id));
    setSelectedIds(allIds);
    onSelectionChange(filteredDevices);
  };

  const selectNone = () => {
    setSelectedIds(new Set());
    onSelectionChange([]);
  };

  const selectCritical = () => {
    const criticalDevices = filteredDevices.filter(d => d.isDown || d.hasAlarm);
    const criticalIds = new Set(criticalDevices.map(d => d.id));
    setSelectedIds(criticalIds);
    onSelectionChange(criticalDevices);
  };

  const selectControllers = () => {
    const controllers = filteredDevices.filter(d => 
      (d['Controller Type'] && d['Controller Type'].match(/UNT|VMA|DX/i)) ||
      (d.Type && d.Type.toLowerCase().includes('controller')) ||
      (d.format === 'n2Export')
    );
    const controllerIds = new Set(controllers.map(d => d.id));
    setSelectedIds(controllerIds);
    onSelectionChange(controllers);
  };

  const handleDeviceSelection = (deviceId: string, checked: boolean) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(deviceId);
    } else {
      newSelectedIds.delete(deviceId);
    }
    setSelectedIds(newSelectedIds);
    
    const selectedDevices = filteredDevices.filter(d => newSelectedIds.has(d.id));
    onSelectionChange(selectedDevices);
  };

  const handleSaveToInventory = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select devices to save to inventory",
        variant: "destructive"
      });
      return;
    }

    try {
      // Convert selected devices to device records
      const selectedDevices = devices.filter(d => selectedIds.has(d.id));
      
      // Create a mock dataset for conversion
      const mockDataset = {
        id: 'temp',
        filename: selectedDevices[0]?.sourceFile || 'unknown',
        type: 'networkDevices' as const,
        columns: [],
        rows: selectedDevices.map(device => ({
          id: device.id,
          selected: true,
          data: device,
          parsedStatus: {
            status: (device.isOnline ? 'ok' : device.isDown ? 'down' : device.hasAlarm ? 'alarm' : 'unknown') as 'ok' | 'down' | 'alarm' | 'fault' | 'unknown',
            severity: 'normal' as const,
            details: [],
            badge: { text: '', variant: 'default' as const }
          }
        })),
        summary: {
          totalDevices: selectedDevices.length,
          statusBreakdown: { ok: 0, down: 0, alarm: 0, fault: 0, unknown: 0 },
          typeBreakdown: {},
          criticalFindings: [],
          recommendations: []
        },
        metadata: {
          totalRows: selectedDevices.length,
          parseErrors: [],
          uploadedAt: new Date(),
          fileSize: 0
        }
      };

      const deviceRecords = DeviceInventoryService.convertDatasetToDevices(mockDataset);
      const result = await DeviceInventoryService.saveDevices(deviceRecords);
      
      if (result.success) {
        toast({
          title: "Devices Saved",
          description: `${selectedIds.size} devices saved to inventory`
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (device: Device) => {
    if (device.isDown) {
      return <Badge variant="destructive">Offline</Badge>;
    }
    if (device.hasAlarm) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-300">Alarm</Badge>;
    }
    if (device.isOnline) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">Online</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  const getFormatName = (format: string) => {
    switch (format) {
      case 'n2Export': return 'N2 Network';
      case 'bacnetExport': return 'BACnet';
      case 'resourceExport': return 'Resources';
      case 'niagaraNetExport': return 'Niagara Network';
      default: return format;
    }
  };

  // Get unique device types for filter
  const deviceTypes = [...new Set(devices.map(d => 
    d.format || d.Type || d['Controller Type']
  ).filter(Boolean))];

  if (devices.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No device data available. Upload CSV files to analyze network inventory.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5" />
          Network Device Review
        </CardTitle>
        <CardDescription>
          {filteredDevices.length} of {devices.length} devices shown • {selectedIds.size} selected for report
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search device names..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online Only</SelectItem>
              <SelectItem value="offline">Offline Only</SelectItem>
              <SelectItem value="alarm">Has Alarms</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {deviceTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {getFormatName(type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Quick Selection Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Select All ({filteredDevices.length})
          </Button>
          <Button variant="outline" size="sm" onClick={selectNone}>
            Clear Selection
          </Button>
          <Button variant="outline" size="sm" onClick={selectCritical}>
            Critical Issues ({filteredDevices.filter(d => d.isDown || d.hasAlarm).length})
          </Button>
          <Button variant="outline" size="sm" onClick={selectControllers}>
            Controllers ({filteredDevices.filter(d => 
              (d['Controller Type'] && d['Controller Type'].match(/UNT|VMA|DX/i)) ||
              (d.Type && d.Type.toLowerCase().includes('controller')) ||
              d.format === 'n2Export'
            ).length})
          </Button>
          
          {selectedIds.size > 0 && (
            <Button variant="outline" size="sm" onClick={handleSaveToInventory}>
              <Database className="h-4 w-4 mr-2" />
              Save to Inventory ({selectedIds.size})
            </Button>
          )}
        </div>

        {/* Selection Summary */}
        {selectedIds.size > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <div className="text-sm font-medium text-primary mb-1">
              {selectedIds.size} devices selected for report inclusion
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-primary/70">
              <span>Offline: {filteredDevices.filter(d => selectedIds.has(d.id) && d.isDown).length}</span>
              <span>With Alarms: {filteredDevices.filter(d => selectedIds.has(d.id) && d.hasAlarm).length}</span>
              <span>Online: {filteredDevices.filter(d => selectedIds.has(d.id) && d.isOnline).length}</span>
            </div>
          </div>
        )}

        {/* Device Table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedIds.size === filteredDevices.length && filteredDevices.length > 0}
                    onCheckedChange={(checked) => checked ? selectAll() : selectNone()}
                  />
                </TableHead>
                <TableHead className="min-w-[200px]">Device Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type/Format</TableHead>
                <TableHead>Address/ID</TableHead>
                <TableHead>Source File</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDevices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No devices found matching current filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevices.map((device) => (
                  <TableRow key={device.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(device.id)}
                        onCheckedChange={(checked) => handleDeviceSelection(device.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {device.Name || device.name || `Device ${device.id}`}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(device)}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {device['Controller Type'] || device.Type || 'Unknown'}
                        </div>
                        {device.format && (
                          <Badge variant="outline" className="text-xs">
                            {getFormatName(device.format)}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {device.Address || device.address || device['Device ID'] || '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {device.sourceFile || 'Unknown'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};