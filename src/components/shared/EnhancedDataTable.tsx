import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ChevronDown, ChevronUp, Download } from 'lucide-react';

export interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'badge' | 'progress' | 'boolean';
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: any) => React.ReactNode;
  width?: string;
}

export interface EnhancedDataTableProps {
  data: any[];
  columns: TableColumn[];
  title?: string;
  description?: string;
  searchable?: boolean;
  selectable?: boolean;
  exportable?: boolean;
  onRowClick?: (row: any) => void;
  onExport?: (selectedRows: any[]) => void;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: (selectedRows: any[]) => void;
    variant?: 'default' | 'outline' | 'destructive';
  }>;
}

export const EnhancedDataTable: React.FC<EnhancedDataTableProps> = ({
  data,
  columns,
  title,
  description,
  searchable = true,
  selectable = false,
  exportable = false,
  onRowClick,
  onExport,
  actions = []
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  
  // Filter and sort data
  const processedData = useMemo(() => {
    let filtered = [...data];
    
    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(row =>
        columns.some(col => {
          const value = row[col.key];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }
    
    // Apply sorting
    if (sortColumn) {
      filtered.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        const modifier = sortDirection === 'asc' ? 1 : -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return (aVal - bVal) * modifier;
        }
        return String(aVal).localeCompare(String(bVal)) * modifier;
      });
    }
    
    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection, columns]);
  
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };
  
  const toggleRowSelection = (index: number) => {
    const newSelection = new Set(selectedRows);
    if (newSelection.has(index)) {
      newSelection.delete(index);
    } else {
      newSelection.add(index);
    }
    setSelectedRows(newSelection);
  };
  
  const toggleSelectAll = () => {
    if (selectedRows.size === processedData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(processedData.map((_, i) => i)));
    }
  };
  
  const handleExport = () => {
    const selected = processedData.filter((_, i) => selectedRows.has(i));
    onExport?.(selected.length > 0 ? selected : processedData);
  };
  
  const renderCell = (column: TableColumn, value: any, row: any) => {
    if (column.render) {
      return column.render(value, row);
    }
    
    switch (column.type) {
      case 'badge':
        return <Badge variant="outline">{value}</Badge>;
      case 'progress':
        return (
          <div className="flex items-center gap-2">
            <Progress value={value} className="w-24" />
            <span className="text-xs">{value}%</span>
          </div>
        );
      case 'boolean':
        return <Badge variant={value ? 'default' : 'secondary'}>{value ? 'Yes' : 'No'}</Badge>;
      case 'number':
        return <span className="font-mono">{value?.toLocaleString()}</span>;
      default:
        return value ?? '—';
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Header */}
      {(title || description) && (
        <div>
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      )}
      
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          {searchable && (
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {selectedRows.size > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedRows.size} selected
            </span>
          )}
          
          {actions.map((action, i) => (
            <Button
              key={i}
              variant={action.variant || 'outline'}
              size="sm"
              onClick={() => action.onClick(processedData.filter((_, i) => selectedRows.has(i)))}
              disabled={selectedRows.size === 0}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
          
          {exportable && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          )}
        </div>
      </div>
      
      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedRows.size === processedData.length && processedData.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
              )}
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.sortable ? 'cursor-pointer select-none' : ''}
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={{ width: column.width }}
                >
                  <div className="flex items-center gap-2">
                    {column.label}
                    {column.sortable && sortColumn === column.key && (
                      sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {processedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (selectable ? 1 : 0)} className="text-center text-muted-foreground h-32">
                  No data available
                </TableCell>
              </TableRow>
            ) : (
              processedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedRows.has(rowIndex)}
                        onCheckedChange={() => toggleRowSelection(rowIndex)}
                      />
                    </TableCell>
                  )}
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {renderCell(column, row[column.key], row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Footer */}
      {processedData.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Showing {processedData.length} of {data.length} rows</span>
        </div>
      )}
    </div>
  );
};