import React, { useState, useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  ColumnDef,
  FilterFn,
  SortingState,
  ColumnFiltersState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  ArrowUpDown,
  Filter,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Device interface for different driver types
export interface Device {
  id: string;
  name: string;
  type: string;
  status: 'online' | 'offline' | 'alarm' | 'fault';
  address: string;
  description?: string;
  lastSeen?: string;
  // BACnet specific
  deviceId?: number;
  vendorName?: string;
  modelName?: string;
  // N2 specific
  nodeAddress?: number;
  deviceType?: string;
  firmwareVersion?: string;
  // Modbus specific
  slaveId?: number;
  registerMap?: string;
  // Computed fields
  faulty?: boolean;
  daysSinceLastSeen?: number;
}

interface InventoryTableProps {
  title: string;
  driverType: 'BACnet' | 'N2' | 'Modbus' | 'LON' | 'OPC';
  devices: Device[];
  onUpdateDevice: (device: Device) => void;
  onAddDevice: (device: Omit<Device, 'id'>) => void;
  onRemoveDevice: (deviceId: string) => void;
  editable?: boolean;
}

// Global filter function
const globalFilter: FilterFn<Device> = (row, columnId, value) => {
  const search = value.toLowerCase();
  return (
    row.original.name.toLowerCase().includes(search) ||
    row.original.type.toLowerCase().includes(search) ||
    row.original.address.toLowerCase().includes(search) ||
    (row.original.description?.toLowerCase().includes(search) ?? false)
  );
};

export const InventoryTable: React.FC<InventoryTableProps> = ({
  title,
  driverType,
  devices,
  onUpdateDevice,
  onAddDevice,
  onRemoveDevice,
  editable = false,
}) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Device>>({});

  // Define columns based on driver type
  const columns = useMemo<ColumnDef<Device>[]>(() => {
    const baseColumns: ColumnDef<Device>[] = [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-8 p-0 font-semibold"
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        ),
        cell: ({ row, getValue }) => {
          const isEditing = editingRowId === row.original.id;
          return isEditing ? (
            <Input
              value={editingData.name ?? getValue<string>()}
              onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
              className="h-8"
            />
          ) : (
            <span className="font-medium">{getValue<string>()}</span>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row, getValue }) => {
          const status = getValue<string>();
          const isEditing = editingRowId === row.original.id;

          if (isEditing) {
            return (
              <Select
                value={editingData.status ?? status}
                onValueChange={(value) => setEditingData(prev => ({ ...prev, status: value as Device['status'] }))}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="alarm">Alarm</SelectItem>
                  <SelectItem value="fault">Fault</SelectItem>
                </SelectContent>
              </Select>
            );
          }

          return (
            <Badge
              variant={
                status === 'online' ? 'default' :
                status === 'offline' ? 'secondary' :
                status === 'alarm' ? 'destructive' : 'destructive'
              }
              className="flex items-center gap-1"
            >
              {status === 'online' && <CheckCircle className="h-3 w-3" />}
              {status === 'offline' && <XCircle className="h-3 w-3" />}
              {(status === 'alarm' || status === 'fault') && <AlertTriangle className="h-3 w-3" />}
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row, getValue }) => {
          const isEditing = editingRowId === row.original.id;
          return isEditing ? (
            <Input
              value={editingData.type ?? getValue<string>()}
              onChange={(e) => setEditingData(prev => ({ ...prev, type: e.target.value }))}
              className="h-8"
            />
          ) : (
            <span>{getValue<string>()}</span>
          );
        },
      },
      {
        accessorKey: 'address',
        header: 'Address',
        cell: ({ row, getValue }) => {
          const isEditing = editingRowId === row.original.id;
          return isEditing ? (
            <Input
              value={editingData.address ?? getValue<string>()}
              onChange={(e) => setEditingData(prev => ({ ...prev, address: e.target.value }))}
              className="h-8"
            />
          ) : (
            <span className="font-mono text-sm">{getValue<string>()}</span>
          );
        },
      },
    ];

    // Add driver-specific columns
    if (driverType === 'BACnet') {
      baseColumns.splice(3, 0, {
        accessorKey: 'deviceId',
        header: 'Device ID',
        cell: ({ row, getValue }) => {
          const isEditing = editingRowId === row.original.id;
          return isEditing ? (
            <Input
              type="number"
              value={editingData.deviceId ?? getValue<number>()}
              onChange={(e) => setEditingData(prev => ({ ...prev, deviceId: parseInt(e.target.value) }))}
              className="h-8"
            />
          ) : (
            <span className="font-mono text-sm">{getValue<number>()}</span>
          );
        },
      });
    }

    if (driverType === 'N2') {
      baseColumns.splice(3, 0, {
        accessorKey: 'nodeAddress',
        header: 'Node Address',
        cell: ({ row, getValue }) => {
          const isEditing = editingRowId === row.original.id;
          return isEditing ? (
            <Input
              type="number"
              value={editingData.nodeAddress ?? getValue<number>()}
              onChange={(e) => setEditingData(prev => ({ ...prev, nodeAddress: parseInt(e.target.value) }))}
              className="h-8"
            />
          ) : (
            <span className="font-mono text-sm">{getValue<number>()}</span>
          );
        },
      });
    }

    if (driverType === 'Modbus') {
      baseColumns.splice(3, 0, {
        accessorKey: 'slaveId',
        header: 'Slave ID',
        cell: ({ row, getValue }) => {
          const isEditing = editingRowId === row.original.id;
          return isEditing ? (
            <Input
              type="number"
              value={editingData.slaveId ?? getValue<number>()}
              onChange={(e) => setEditingData(prev => ({ ...prev, slaveId: parseInt(e.target.value) }))}
              className="h-8"
            />
          ) : (
            <span className="font-mono text-sm">{getValue<number>()}</span>
          );
        },
      });
    }

    // Add computed "Faulty?" column
    baseColumns.push({
      accessorKey: 'faulty',
      header: 'Faulty?',
      cell: ({ row }) => {
        const device = row.original;
        const isFaulty = device.status === 'fault' || device.status === 'alarm' ||
                        (device.daysSinceLastSeen && device.daysSinceLastSeen > 7);

        return (
          <Badge variant={isFaulty ? 'destructive' : 'outline'}>
            {isFaulty ? 'Yes' : 'No'}
          </Badge>
        );
      },
    });

    // Add actions column if editable
    if (editable) {
      baseColumns.push({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const isEditing = editingRowId === row.original.id;

          if (isEditing) {
            return (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => saveEdit(row.original)}
                  className="h-8 w-8 p-0"
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEdit}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            );
          }

          return (
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => startEdit(row.original)}
                className="h-8 w-8 p-0"
              >
                <Edit3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onRemoveDevice(row.original.id)}
                className="h-8 w-8 p-0 text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      });
    }

    return baseColumns;
  }, [driverType, editable, editingRowId, editingData, onRemoveDevice]);

  const startEdit = (device: Device) => {
    setEditingRowId(device.id);
    setEditingData(device);
  };

  const saveEdit = (originalDevice: Device) => {
    const updatedDevice = { ...originalDevice, ...editingData };
    onUpdateDevice(updatedDevice);
    setEditingRowId(null);
    setEditingData({});
  };

  const cancelEdit = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  const table = useReactTable({
    data: devices,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    globalFilterFn: globalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter: globalFilterValue,
    },
    onGlobalFilterChange: setGlobalFilterValue,
  });

  // Calculate summary statistics
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'online').length;
  const faultyDevices = devices.filter(d =>
    d.status === 'fault' || d.status === 'alarm' ||
    (d.daysSinceLastSeen && d.daysSinceLastSeen > 7)
  ).length;

  const handleAddDevice = () => {
    // Create a new device template based on driver type
    const newDevice: Omit<Device, 'id'> = {
      name: `New ${driverType} Device`,
      type: driverType,
      status: 'offline',
      address: '0.0.0.0',
      description: 'New device',
      ...(driverType === 'BACnet' && { deviceId: 0 }),
      ...(driverType === 'N2' && { nodeAddress: 0 }),
      ...(driverType === 'Modbus' && { slaveId: 1 }),
    };

    onAddDevice(newDevice);
  };

  return (
    <div className="space-y-4">
      {/* Header with title and controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {driverType}
          </Badge>
        </div>
        {editable && (
          <Button onClick={handleAddDevice} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Device
          </Button>
        )}
      </div>

      {/* Search and filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search devices..."
            value={globalFilterValue}
            onChange={(e) => setGlobalFilterValue(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select
          value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
          onValueChange={(value) =>
            table.getColumn('status')?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
            <SelectItem value="alarm">Alarm</SelectItem>
            <SelectItem value="fault">Fault</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b bg-muted/50">
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="h-12 px-4 text-left align-middle font-medium">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => {
                const device = row.original;
                const isFaulty = device.status === 'fault' || device.status === 'alarm' ||
                                (device.daysSinceLastSeen && device.daysSinceLastSeen > 7);

                return (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b transition-colors hover:bg-muted/50",
                      isFaulty && "bg-destructive/10 hover:bg-destructive/20",
                      editingRowId === device.id && "bg-blue-50 hover:bg-blue-100"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4 align-middle">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer with summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{totalDevices} devices total</span>
          <span className="text-green-600">{onlineDevices} online</span>
          <span className="text-red-600">{faultyDevices} faulty</span>
        </div>
        <div className="flex items-center gap-2">
          <span>
            Showing {table.getFilteredRowModel().rows.length} of {totalDevices} devices
          </span>
        </div>
      </div>
    </div>
  );
};