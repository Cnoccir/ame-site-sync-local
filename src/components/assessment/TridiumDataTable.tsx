import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Search, Filter, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { TridiumDataset, TridiumDataRow, CSVColumn } from '@/types/tridium';

interface TridiumDataTableProps {
  dataset: TridiumDataset;
  onDatasetUpdate: (dataset: TridiumDataset) => void;
}

export const TridiumDataTable: React.FC<TridiumDataTableProps> = ({
  dataset,
  onDatasetUpdate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showColumnControls, setShowColumnControls] = useState(false);

  // Get unique status and type values for filters
  const { uniqueStatuses, uniqueTypes } = useMemo(() => {
    const statuses = new Set<string>();
    const types = new Set<string>();
    
    dataset.rows.forEach(row => {
      if (row.parsedStatus) {
        statuses.add(row.parsedStatus.status);
      }
      const type = row.data['Type'] || row.data['Controller Type'] || 'Unknown';
      types.add(type);
    });
    
    return {
      uniqueStatuses: Array.from(statuses),
      uniqueTypes: Array.from(types)
    };
  }, [dataset.rows]);

  // Filter and sort data
  const filteredAndSortedRows = useMemo(() => {
    let filtered = dataset.rows.filter(row => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matches = Object.values(row.data).some(value => 
          String(value).toLowerCase().includes(searchLower)
        );
        if (!matches) return false;
      }
      
      // Status filter
      if (statusFilter !== 'all' && row.parsedStatus) {
        if (row.parsedStatus.status !== statusFilter) return false;
      }
      
      // Type filter
      if (typeFilter !== 'all') {
        const rowType = row.data['Type'] || row.data['Controller Type'] || 'Unknown';
        if (rowType !== typeFilter) return false;
      }
      
      return true;
    });

    // Sort data
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a.data[sortColumn];
        const bVal = b.data[sortColumn];
        
        // Handle different data types
        let comparison = 0;
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          comparison = aVal - bVal;
        } else {
          comparison = String(aVal).localeCompare(String(bVal));
        }
        
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return filtered;
  }, [dataset.rows, searchTerm, statusFilter, typeFilter, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handleRowSelect = (rowId: string, selected: boolean) => {
    const updatedDataset = {
      ...dataset,
      rows: dataset.rows.map(row => 
        row.id === rowId ? { ...row, selected } : row
      )
    };
    onDatasetUpdate(updatedDataset);
  };

  const handleSelectAll = (selected: boolean) => {
    const visibleRowIds = new Set(filteredAndSortedRows.map(row => row.id));
    const updatedDataset = {
      ...dataset,
      rows: dataset.rows.map(row => 
        visibleRowIds.has(row.id) ? { ...row, selected } : row
      )
    };
    onDatasetUpdate(updatedDataset);
  };

  const handleColumnVisibilityToggle = (columnKey: string, visible: boolean) => {
    const updatedDataset = {
      ...dataset,
      columns: dataset.columns.map(col => 
        col.key === columnKey ? { ...col, visible } : col
      )
    };
    onDatasetUpdate(updatedDataset);
  };

  const handleBulkStatusSelect = (status: string) => {
    const targetRows = filteredAndSortedRows.filter(row => 
      row.parsedStatus?.status === status
    );
    
    const targetRowIds = new Set(targetRows.map(row => row.id));
    const updatedDataset = {
      ...dataset,
      rows: dataset.rows.map(row => 
        targetRowIds.has(row.id) ? { ...row, selected: true } : row
      )
    };
    onDatasetUpdate(updatedDataset);
  };

  const selectedCount = dataset.rows.filter(row => row.selected).length;
  const visibleSelectedCount = filteredAndSortedRows.filter(row => row.selected).length;
  const visibleColumns = dataset.columns.filter(col => col.visible);

  const renderStatusBadge = (row: TridiumDataRow) => {
    if (!row.parsedStatus) return null;
    
    const variant = row.parsedStatus.badge.variant === 'warning' ? 'secondary' : 
                   row.parsedStatus.badge.variant === 'success' ? 'default' : 
                   row.parsedStatus.badge.variant;
    
    return (
      <Badge variant={variant}>
        {row.parsedStatus.badge.text}
      </Badge>
    );
  };

  const renderValue = (row: TridiumDataRow, column: CSVColumn) => {
    const value = row.data[column.key];
    
    if (column.type === 'status') {
      return renderStatusBadge(row);
    }
    
    if (column.type === 'value' && row.parsedValues?.[column.key]) {
      const parsedValue = row.parsedValues[column.key];
      return (
        <span title={parsedValue.formatted}>
          {parsedValue.formatted}
        </span>
      );
    }
    
    if (column.type === 'date' && value instanceof Date) {
      return value.toLocaleDateString();
    }
    
    return String(value || '');
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {dataset.filename}
            <Badge variant="outline">{dataset.type}</Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedCount} of {dataset.rows.length} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowColumnControls(!showColumnControls)}
            >
              {showColumnControls ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              Columns
            </Button>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="flex gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {uniqueStatuses.map(status => (
                <SelectItem key={status} value={status}>
                  {status.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Type filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk Selection Controls */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelectAll(true)}
          >
            Select All Visible ({filteredAndSortedRows.length})
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSelectAll(false)}
          >
            Clear Selection
          </Button>
          {uniqueStatuses.map(status => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => handleBulkStatusSelect(status)}
            >
              Select All {status.toUpperCase()}
            </Button>
          ))}
        </div>

        {/* Column Visibility Controls */}
        {showColumnControls && (
          <Card className="p-4">
            <h4 className="font-medium mb-3">Column Visibility</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {dataset.columns.map(column => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Switch
                    checked={column.visible}
                    onCheckedChange={(checked) => handleColumnVisibilityToggle(column.key, checked)}
                  />
                  <label className="text-sm">{column.label}</label>
                </div>
              ))}
            </div>
          </Card>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={visibleSelectedCount === filteredAndSortedRows.length && filteredAndSortedRows.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                {visibleColumns.map(column => (
                  <TableHead 
                    key={column.key}
                    className={column.sortable ? "cursor-pointer hover:bg-muted/50" : ""}
                    onClick={column.sortable ? () => handleSort(column.key) : undefined}
                    style={{ width: column.width }}
                  >
                    <div className="flex items-center gap-2">
                      {column.label}
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp 
                            className={`w-3 h-3 ${
                              sortColumn === column.key && sortDirection === 'asc' 
                                ? 'text-primary' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                          <ChevronDown 
                            className={`w-3 h-3 -mt-1 ${
                              sortColumn === column.key && sortDirection === 'desc' 
                                ? 'text-primary' 
                                : 'text-muted-foreground'
                            }`} 
                          />
                        </div>
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedRows.map(row => (
                <TableRow key={row.id} className={row.selected ? "bg-muted/30" : ""}>
                  <TableCell>
                    <Checkbox
                      checked={row.selected}
                      onCheckedChange={(checked) => handleRowSelect(row.id, checked as boolean)}
                    />
                  </TableCell>
                  {visibleColumns.map(column => (
                    <TableCell key={column.key}>
                      {renderValue(row, column)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
          <span>
            Showing {filteredAndSortedRows.length} of {dataset.rows.length} records
          </span>
          <span>
            {visibleSelectedCount} selected in current view
          </span>
        </div>
      </CardContent>
    </Card>
  );
};