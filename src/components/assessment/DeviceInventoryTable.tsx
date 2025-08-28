import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Filter, 
  Eye, 
  EyeOff, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Network,
  Activity
} from 'lucide-react';
import { TridiumDataset, TridiumDataRow, CSVColumn } from '@/types/tridium';

interface DeviceInventoryTableProps {
  datasets: TridiumDataset[];
  onSelectionChange: (selectedRows: Set<string>, selectedColumns: Set<string>) => void;
}

interface TableState {
  searchTerm: string;
  statusFilter: string;
  typeFilter: string;
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  selectedRows: Set<string>;
  visibleColumns: Set<string>;
}

const quickFilters = {
  'critical-issues': {
    name: 'Critical Issues',
    description: 'Devices with down or alarm status',
    filter: (row: TridiumDataRow) => 
      row.parsedStatus?.status === 'down' || row.parsedStatus?.status === 'alarm'
  },
  'all-controllers': {
    name: 'All Controllers',
    description: 'UNT, VMA, DX controllers',
    filter: (row: TridiumDataRow) => {
      const type = row.data['Controller Type'] || row.data.Type || '';
      return /UNT|VMA|DX|Controller/i.test(type);
    }
  },
  'communication-errors': {
    name: 'Communication Errors',
    description: 'Devices with communication issues',
    filter: (row: TridiumDataRow) => 
      row.parsedStatus?.status === 'down' || 
      (row.data.Status && row.data.Status.includes('down'))
  },
  'capacity-warnings': {
    name: 'Capacity Warnings',
    description: 'Resources with high utilization',
    filter: (row: TridiumDataRow) => {
      if (row.parsedValues) {
        return Object.values(row.parsedValues).some(value => {
          if (value.type === 'percentage' && typeof value.value === 'number') {
            return value.value > 85;
          }
          return false;
        });
      }
      return false;
    }
  }
};

const columnPresets = {
  'executive-summary': {
    name: 'Executive Summary',
    columns: ['Name', 'Status', 'Type', 'Address']
  },
  'technical-details': {
    name: 'Technical Details',
    columns: ['Name', 'Address', 'Model', 'Host Model', 'Vendor', 'Fox Port', 'Version', 'Firmware Rev', 'Status']
  },
  'network-details': {
    name: 'Network Details',
    columns: ['Name', 'Fox Port', 'Host Model', 'Address', 'Version', 'Status']
  },
  'problem-focus': {
    name: 'Problem Focus',
    columns: ['Name', 'Status', 'Health', 'Last Contact']
  },
  'full-inventory': {
    name: 'Full Inventory',
    columns: 'all'
  }
};

export const DeviceInventoryTable: React.FC<DeviceInventoryTableProps> = ({
  datasets,
  onSelectionChange
}) => {
  const [activeDataset, setActiveDataset] = useState(0);
  const [tableState, setTableState] = useState<TableState>({
    searchTerm: '',
    statusFilter: 'all',
    typeFilter: 'all',
    sortColumn: '',
    sortDirection: 'asc',
    selectedRows: new Set(),
    visibleColumns: new Set()
  });

  const currentDataset = datasets[activeDataset];

  // Initialize visible columns
  React.useEffect(() => {
    if (currentDataset && tableState.visibleColumns.size === 0) {
      const priorityColumns = ['Name', 'Status', 'Type', 'Address', 'Controller Type', 'Fox Port', 'Host Model', 'Version'];
      const defaultColumns = new Set(
        currentDataset.columns
          .filter(col => priorityColumns.includes(col.key))
          .map(col => col.key)
      );
      setTableState(prev => ({ ...prev, visibleColumns: defaultColumns }));
    }
  }, [currentDataset]);

  // Get unique values for filters
  const filterOptions = useMemo(() => {
    if (!currentDataset) return { statuses: [], types: [] };

    const statuses = new Set<string>();
    const types = new Set<string>();

    currentDataset.rows.forEach(row => {
      if (row.parsedStatus?.badge.text) {
        statuses.add(row.parsedStatus.badge.text);
      }
      
      const type = row.data['Controller Type'] || row.data.Type || row.data['Device Type'];
      if (type) {
        types.add(type);
      }
    });

    return {
      statuses: Array.from(statuses),
      types: Array.from(types)
    };
  }, [currentDataset]);

  // Filter and sort rows
  const filteredRows = useMemo(() => {
    if (!currentDataset) return [];

    let filtered = currentDataset.rows.filter(row => {
      // Search filter
      if (tableState.searchTerm) {
        const searchLower = tableState.searchTerm.toLowerCase();
        const matchesSearch = Object.values(row.data).some(value => 
          String(value).toLowerCase().includes(searchLower)
        );
        if (!matchesSearch) return false;
      }

      // Status filter
      if (tableState.statusFilter !== 'all') {
        const rowStatus = row.parsedStatus?.badge.text;
        if (rowStatus !== tableState.statusFilter) return false;
      }

      // Type filter
      if (tableState.typeFilter !== 'all') {
        const rowType = row.data['Controller Type'] || row.data.Type || row.data['Device Type'];
        if (rowType !== tableState.typeFilter) return false;
      }

      return true;
    });

    // Sort
    if (tableState.sortColumn) {
      filtered.sort((a, b) => {
        let aVal = a.data[tableState.sortColumn] || '';
        let bVal = b.data[tableState.sortColumn] || '';

        // Special handling for status sorting (priority-based)
        if (tableState.sortColumn === 'Status' && a.parsedStatus && b.parsedStatus) {
          const priorityOrder = { critical: 0, down: 1, alarm: 2, warning: 3, ok: 4, success: 5 };
          aVal = priorityOrder[a.parsedStatus.status] || 999;
          bVal = priorityOrder[b.parsedStatus.status] || 999;
        }

        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return tableState.sortDirection === 'asc' 
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }

        return tableState.sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    return filtered;
  }, [currentDataset, tableState]);

  const handleSort = (columnKey: string) => {
    setTableState(prev => ({
      ...prev,
      sortColumn: columnKey,
      sortDirection: prev.sortColumn === columnKey && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRowSelect = (rowId: string, selected: boolean) => {
    const newSelected = new Set(tableState.selectedRows);
    if (selected) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setTableState(prev => ({ ...prev, selectedRows: newSelected }));
    onSelectionChange(newSelected, tableState.visibleColumns);
  };

  const handleSelectAll = (selected: boolean) => {
    const newSelected = selected 
      ? new Set(filteredRows.map(row => row.id))
      : new Set<string>();
    setTableState(prev => ({ ...prev, selectedRows: newSelected }));
    onSelectionChange(newSelected, tableState.visibleColumns);
  };

  const handleQuickFilter = (filterKey: string) => {
    const filter = quickFilters[filterKey];
    if (!filter || !currentDataset) return;

    const matchingRows = currentDataset.rows
      .filter(filter.filter)
      .map(row => row.id);
    
    setTableState(prev => ({ 
      ...prev, 
      selectedRows: new Set(matchingRows)
    }));
    onSelectionChange(new Set(matchingRows), tableState.visibleColumns);
  };

  const handleColumnPreset = (presetKey: string) => {
    const preset = columnPresets[presetKey];
    if (!preset || !currentDataset) return;

    const newColumns = preset.columns === 'all' 
      ? new Set(currentDataset.columns.map(col => col.key))
      : new Set(preset.columns.filter((col: string) => 
          currentDataset.columns.some(c => c.key === col)
        ) as string[]);

    setTableState(prev => ({ ...prev, visibleColumns: newColumns }));
    onSelectionChange(tableState.selectedRows, newColumns);
  };

  const handleColumnToggle = (columnKey: string, visible: boolean) => {
    const newColumns = new Set(tableState.visibleColumns);
    if (visible) {
      newColumns.add(columnKey);
    } else {
      newColumns.delete(columnKey);
    }
    setTableState(prev => ({ ...prev, visibleColumns: newColumns }));
    onSelectionChange(tableState.selectedRows, newColumns);
  };

  const renderStatusBadge = (row: TridiumDataRow) => {
    if (!row.parsedStatus) return null;

    const statusConfig = {
      ok: { variant: 'default' as const, icon: CheckCircle },
      success: { variant: 'default' as const, icon: CheckCircle },
      down: { variant: 'destructive' as const, icon: XCircle },
      alarm: { variant: 'secondary' as const, icon: AlertTriangle },
      warning: { variant: 'secondary' as const, icon: AlertTriangle },
      critical: { variant: 'destructive' as const, icon: XCircle }
    };

    const config = statusConfig[row.parsedStatus.status] || statusConfig.warning;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {row.parsedStatus.badge.text}
      </Badge>
    );
  };

  const renderCellValue = (row: TridiumDataRow, column: CSVColumn) => {
    const value = row.data[column.key];
    
    if (column.key === 'Status') {
      return renderStatusBadge(row);
    }

    if (row.parsedValues && row.parsedValues[column.key]) {
      const parsedValue = row.parsedValues[column.key];
      return (
        <span className={parsedValue.type === 'percentage' && typeof parsedValue.value === 'number' && parsedValue.value > 85 
          ? 'text-red-600 font-medium' : ''}>
          {parsedValue.formatted}
        </span>
      );
    }

    return String(value || '');
  };

  const getSortIcon = (columnKey: string) => {
    if (tableState.sortColumn !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return tableState.sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4" />
      : <ArrowDown className="w-4 h-4" />;
  };

  if (!datasets || datasets.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No device data available. Please upload CSV files first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dataset Tabs */}
      {datasets.length > 1 && (
        <Tabs value={activeDataset.toString()} onValueChange={(value) => setActiveDataset(parseInt(value))}>
          <TabsList>
            {datasets.map((dataset, index) => (
              <TabsTrigger key={index} value={index.toString()}>
                {dataset.filename} ({dataset.rows.length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Controls */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
            <Input
              placeholder="Search devices..."
              className="pl-10"
              value={tableState.searchTerm}
              onChange={(e) => setTableState(prev => ({ ...prev, searchTerm: e.target.value }))}
            />
          </div>
          
          <Select value={tableState.statusFilter} onValueChange={(value) => 
            setTableState(prev => ({ ...prev, statusFilter: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {filterOptions.statuses.map(status => (
                <SelectItem key={status} value={status}>{status}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={tableState.typeFilter} onValueChange={(value) => 
            setTableState(prev => ({ ...prev, typeFilter: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {filterOptions.types.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(true)}
            >
              Select All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll(false)}
            >
              Clear
            </Button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-sm font-medium mr-2">Quick Filters:</span>
          {Object.entries(quickFilters).map(([key, filter]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => handleQuickFilter(key)}
            >
              {filter.name}
            </Button>
          ))}
        </div>

        {/* Column Presets */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium mr-2">Column Views:</span>
          {Object.entries(columnPresets).map(([key, preset]) => (
            <Button
              key={key}
              variant="outline"
              size="sm"
              onClick={() => handleColumnPreset(key)}
            >
              {preset.name}
            </Button>
          ))}
        </div>
      </Card>

      {/* Data Table */}
      <Card>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {currentDataset.filename} - {(currentDataset as any).type}
            </h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                {filteredRows.length} of {currentDataset.rows.length} devices
              </span>
              <span>
                {tableState.selectedRows.size} selected
              </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={tableState.selectedRows.size === filteredRows.length && filteredRows.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {currentDataset.columns
                  .filter(col => tableState.visibleColumns.has(col.key))
                  .map(column => (
                    <TableHead
                      key={column.key}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort(column.key)}
                    >
                      <div className="flex items-center gap-2">
                        {column.label}
                        {getSortIcon(column.key)}
                      </div>
                    </TableHead>
                  ))}
                <TableHead className="w-12">
                  <Button variant="ghost" size="sm">
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.map(row => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Checkbox
                      checked={tableState.selectedRows.has(row.id)}
                      onCheckedChange={(checked) => handleRowSelect(row.id, checked as boolean)}
                    />
                  </TableCell>
                  {currentDataset.columns
                    .filter(col => tableState.visibleColumns.has(col.key))
                    .map(column => (
                      <TableCell key={column.key}>
                        {renderCellValue(row, column)}
                      </TableCell>
                    ))}
                  <TableCell>
                    <Button variant="ghost" size="sm">
                      <Activity className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredRows.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No devices match the current filters.</p>
          </div>
        )}
      </Card>

      {/* Column Visibility Controls */}
      <Card className="p-4">
        <h4 className="font-medium mb-3">Column Visibility</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {currentDataset.columns.map(column => (
            <div key={column.key} className="flex items-center gap-2">
              <Checkbox
                checked={tableState.visibleColumns.has(column.key)}
                onCheckedChange={(checked) => handleColumnToggle(column.key, checked as boolean)}
              />
              <span className="text-sm">{column.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Selection Summary */}
      {tableState.selectedRows.size > 0 && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">
              {tableState.selectedRows.size} devices selected for reporting
            </span>
          </div>
          <p className="text-sm text-blue-600 mt-1">
            Selected devices will be included in the network analysis summary.
          </p>
        </Card>
      )}
    </div>
  );
};