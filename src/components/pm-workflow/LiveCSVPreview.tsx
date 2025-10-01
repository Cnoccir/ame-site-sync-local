import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Database,
  Settings,
  Eye,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Download,
  BarChart3
} from 'lucide-react';
import Papa from 'papaparse';
import { TridiumParser } from '@/utils/tridium/tridiumParser';
import { TridiumDatasetStore } from '@/services/tridiumDatasetStore';
import type { TridiumDataset } from '@/types/tridium';

interface LiveCSVPreviewProps {
  file: File;
  onDataReady: (data: any) => void;
  onCancel: () => void;
}

interface ColumnMapping {
  csvColumn: string;
  targetField: string;
  enabled: boolean;
  dataType: 'text' | 'number' | 'boolean' | 'date' | 'array';
  required: boolean;
}

interface ParsedCSVData {
  headers: string[];
  rows: string[][];
  totalRows: number;
  detectedType: 'n2' | 'bacnet' | 'resource' | 'platform' | 'network' | 'unknown';
}

export const LiveCSVPreview: React.FC<LiveCSVPreviewProps> = ({
  file,
  onDataReady,
  onCancel
}) => {
  const [csvData, setCsvData] = useState<ParsedCSVData | null>(null);
  const [columnMappings, setColumnMappings] = useState<ColumnMapping[]>([]);
  const [activeTab, setActiveTab] = useState('preview');
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [previewRows, setPreviewRows] = useState(20);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    parseCSVFile();
  }, [file]);

  const parseCSVFile = async () => {
    try {
      setIsLoading(true);
      const content = await file.text();

      // Clean content - remove BOM and normalize line endings
      let cleanContent = content.replace(/^\uFEFF/, ''); // Remove BOM
      cleanContent = cleanContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      const result = Papa.parse(cleanContent, {
        header: false,
        skipEmptyLines: true,
        transform: (value: string) => value.trim()
      });

      if (result.errors.length > 0) {
        console.warn('CSV parsing errors:', result.errors);
      }

      const rows = result.data as string[][];
      const headers = rows[0] || [];
      const dataRows = rows.slice(1);

      const parsedData: ParsedCSVData = {
        headers,
        rows: dataRows,
        totalRows: dataRows.length,
        detectedType: detectFileType(file.name, headers)
      };

      setCsvData(parsedData);
      generateColumnMappings(parsedData);
    } catch (error) {
      console.error('Error parsing CSV:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const detectFileType = (filename: string, headers: string[]): ParsedCSVData['detectedType'] => {
    const name = filename.toLowerCase();
    const headerStr = headers.join(',').toLowerCase();

    if (name.includes('n2') && headerStr.includes('name') && headerStr.includes('status') && headerStr.includes('address')) {
      return 'n2';
    }
    if (name.includes('bacnet') && headerStr.includes('device id') && headerStr.includes('vendor')) {
      return 'bacnet';
    }
    if (name.includes('resource') && headerStr.includes('name') && headerStr.includes('value')) {
      return 'resource';
    }
    if (name.includes('niagara') && name.includes('net') && headerStr.includes('path')) {
      return 'network';
    }
    if (name.includes('platform') && filename.endsWith('.txt')) {
      return 'platform';
    }
    return 'unknown';
  };

  const enhanceResourceBenchmarkingFields = (mappings: ColumnMapping[], data: ParsedCSVData) => {
    // Key benchmarking metrics that should be enabled by default
    const benchmarkingFields = [
      'cpu.usage',
      'heap.used',
      'heap.max',
      'heap.total',
      'globalCapacity.devices',
      'globalCapacity.points',
      'globalCapacity.networks',
      'engine.scan.usage',
      'engine.scan.peak',
      'fd.open',
      'fd.max'
    ];

    // Find the Name column mapping to check against metric names
    const nameMapping = mappings.find(m =>
      m.csvColumn.toLowerCase() === 'name' ||
      m.targetField === 'metricName'
    );

    if (nameMapping && data.rows.length > 0) {
      const nameColumnIndex = data.headers.findIndex(h =>
        h.toLowerCase() === nameMapping.csvColumn.toLowerCase()
      );

      if (nameColumnIndex >= 0) {
        // Check which benchmarking metrics are present in the data
        const presentMetrics = data.rows.map(row => row[nameColumnIndex]).filter(Boolean);

        // Add suggested target fields for common metrics
        mappings.forEach(mapping => {
          if (mapping.targetField === 'metricName') {
            // Enhance the name field with better description
            mapping.targetField = 'benchmarkMetricName';
          } else if (mapping.targetField === 'metricValue') {
            // Check if this row contains a key benchmarking metric
            mapping.targetField = 'benchmarkMetricValue';
            // Set better data type for numeric values
            const hasNumericValues = presentMetrics.some(metric =>
              benchmarkingFields.includes(metric)
            );
            if (hasNumericValues) {
              mapping.dataType = 'text'; // Keep as text due to mixed format (percentages, units, etc.)
            }
          }
        });
      }
    }

    // Add metadata about which metrics are important for benchmarking
    const valueMapping = mappings.find(m => m.targetField === 'benchmarkMetricValue');
    if (valueMapping) {
      valueMapping.required = true;
    }
  };

  const generateColumnMappings = (data: ParsedCSVData) => {
    const mappings: ColumnMapping[] = data.headers.map((header, index) => {
      const mapping = getDefaultMapping(header, data.detectedType);
      return {
        csvColumn: header,
        targetField: mapping.field,
        enabled: mapping.enabled,
        dataType: mapping.dataType,
        required: mapping.required
      };
    });

    // For resource files, add benchmarking field defaults
    if (data.detectedType === 'resource') {
      enhanceResourceBenchmarkingFields(mappings, data);
    }

    setColumnMappings(mappings);
  };

  const getDefaultMapping = (header: string, type: ParsedCSVData['detectedType']) => {
    const headerLower = header.toLowerCase();

    // Common mappings for all types
    if (headerLower.includes('name')) {
      return { field: 'name', enabled: true, dataType: 'text' as const, required: true };
    }
    if (headerLower.includes('status')) {
      return { field: 'status', enabled: true, dataType: 'array' as const, required: false };
    }

    // Type-specific mappings
    switch (type) {
      case 'n2':
        if (headerLower.includes('address')) {
          return { field: 'address', enabled: true, dataType: 'number' as const, required: true };
        }
        if (headerLower.includes('controller') || headerLower.includes('type')) {
          return { field: 'controllerType', enabled: true, dataType: 'text' as const, required: false };
        }
        break;

      case 'bacnet':
        if (headerLower.includes('device') && headerLower.includes('id')) {
          return { field: 'deviceId', enabled: true, dataType: 'text' as const, required: true };
        }
        if (headerLower.includes('vendor')) {
          return { field: 'vendor', enabled: true, dataType: 'text' as const, required: false };
        }
        if (headerLower.includes('model')) {
          return { field: 'model', enabled: true, dataType: 'text' as const, required: false };
        }
        if (headerLower.includes('health')) {
          return { field: 'health', enabled: true, dataType: 'text' as const, required: false };
        }
        break;

      case 'resource':
        if (headerLower.includes('name')) {
          return { field: 'metricName', enabled: true, dataType: 'text' as const, required: true };
        }
        if (headerLower.includes('value')) {
          return { field: 'metricValue', enabled: true, dataType: 'text' as const, required: true };
        }
        break;

      case 'network':
        if (headerLower.includes('path')) {
          return { field: 'path', enabled: true, dataType: 'text' as const, required: true };
        }
        if (headerLower.includes('address')) {
          return { field: 'address', enabled: true, dataType: 'text' as const, required: false };
        }
        if (headerLower.includes('ip')) {
          return { field: 'ip', enabled: true, dataType: 'text' as const, required: false };
        }
        break;
    }

    // Default mapping
    return {
      field: headerLower.replace(/[^a-z0-9]/g, '_'),
      enabled: false,
      dataType: 'text' as const,
      required: false
    };
  };

  const updateColumnMapping = (index: number, updates: Partial<ColumnMapping>) => {
    setColumnMappings(prev =>
      prev.map((mapping, i) =>
        i === index ? { ...mapping, ...updates } : mapping
      )
    );
  };

  const processData = () => {
    if (!csvData) return;

    const enabledMappings = columnMappings.filter(m => m.enabled);
    
    // CRITICAL FIX: Process ALL rows, not just preview rows
    // The preview limit should ONLY affect display, not import
    const processedRows = csvData.rows.map(row => {
      const processedRow: any = {};

      enabledMappings.forEach(mapping => {
        const columnIndex = csvData.headers.indexOf(mapping.csvColumn);
        if (columnIndex !== -1) {
          let value = row[columnIndex] || '';

          // Process based on data type
          switch (mapping.dataType) {
            case 'number':
              processedRow[mapping.targetField] = parseInt(value) || 0;
              break;
            case 'boolean':
              processedRow[mapping.targetField] = value.toLowerCase() === 'true';
              break;
            case 'array':
              // Handle status arrays like {ok}, {down,alarm}
              if (value.startsWith('{') && value.endsWith('}')) {
                const content = value.slice(1, -1);
                processedRow[mapping.targetField] = content.split(',').map(s => s.trim());
              } else if (value.includes('"') && (value.includes('{') || value.includes('}'))) {
                const match = value.match(/["{]([^}"]+)[}"]/);
                if (match) {
                  processedRow[mapping.targetField] = match[1].split(',').map(s => s.trim());
                } else {
                  processedRow[mapping.targetField] = [value];
                }
              } else {
                processedRow[mapping.targetField] = value ? [value] : [];
              }
              break;
            default:
              processedRow[mapping.targetField] = value;
          }
        }
      });

      return processedRow;
    });

    // Return complete data with ALL rows
    const result = {
      type: csvData.detectedType,
      totalRows: csvData.totalRows,
      processedRows: processedRows.length, // Actual count of processed rows
      data: processedRows, // ALL rows, not just preview
      headers: csvData.headers, // Include original headers
      rawRows: csvData.rows, // Include raw CSV data for reference
      mappings: enabledMappings,
      summary: generateSummary(processedRows, csvData.detectedType)
    };

    onDataReady(result);
  };

  const generateSummary = (data: any[], type: string) => {
    const summary: any = {
      total: data.length
    };

    switch (type) {
      case 'n2':
        summary.byStatus = {};
        summary.byType = {};
        data.forEach(row => {
          // Status summary
          if (row.status && Array.isArray(row.status)) {
            row.status.forEach((status: string) => {
              summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;
            });
          }
          // Type summary
          if (row.controllerType) {
            summary.byType[row.controllerType] = (summary.byType[row.controllerType] || 0) + 1;
          }
        });
        break;

      case 'bacnet':
        summary.byVendor = {};
        summary.byModel = {};
        data.forEach(row => {
          if (row.vendor) {
            summary.byVendor[row.vendor] = (summary.byVendor[row.vendor] || 0) + 1;
          }
          if (row.model) {
            summary.byModel[row.model] = (summary.byModel[row.model] || 0) + 1;
          }
        });
        break;

      case 'resource':
        summary.metrics = data.length;
        break;

      case 'network':
        summary.nodes = data.length;
        break;
    }

    return summary;
  };

  const getDataTypeIcon = (type: ParsedCSVData['detectedType']) => {
    switch (type) {
      case 'n2': return <Database className="h-4 w-4 text-blue-500" />;
      case 'bacnet': return <Database className="h-4 w-4 text-green-500" />;
      case 'resource': return <BarChart3 className="h-4 w-4 text-purple-500" />;
      case 'network': return <Database className="h-4 w-4 text-orange-500" />;
      default: return <Database className="h-4 w-4 text-gray-500" />;
    }
  };

  // Persist this file’s parsed dataset into the Imported Datasets store
  const persistToStore = async () => {
    try {
      const content = await file.text();
      const result = await TridiumParser.parseFile(content, file.name);
      if (result.success && result.dataset) {
        TridiumDatasetStore.add(result.dataset as TridiumDataset);
        alert('Saved to Imported Datasets. You can associate it to a node from the Stored Datasets panel.');
      } else {
        alert(result.errors?.join('\n') || 'Failed to persist dataset');
      }
    } catch (e: any) {
      alert(e?.message || 'Failed to persist dataset');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Parsing CSV file...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!csvData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to parse CSV file. Please check the file format.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Info Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getDataTypeIcon(csvData.detectedType)}
              <div>
                <CardTitle className="text-lg">{file.name}</CardTitle>
                <div className="text-sm text-gray-600">
                  <span>{csvData.totalRows} rows • {csvData.headers.length} columns • Detected as:</span>
                  <Badge variant="outline" className="ml-1">{csvData.detectedType.toUpperCase()}</Badge>
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button variant="outline" onClick={persistToStore} title="Persist this file into Imported Datasets">
                Persist to Imported
              </Button>
              <Button onClick={processData} disabled={!columnMappings.some(m => m.enabled)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Simplified Data Preview - Column Mapping & Summary removed per user request */}
      <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Live Data Preview</CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Show rows:</span>
                  <Select value={previewRows.toString()} onValueChange={(value) => setPreviewRows(parseInt(value))}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                        #
                      </th>
                      {csvData.headers.map((header, index) => {
                        const mapping = columnMappings[index];
                        return (
                          <th
                            key={index}
                            className={`px-3 py-2 text-left text-xs font-medium uppercase tracking-wider ${
                              mapping?.enabled ? 'bg-blue-50 text-blue-900' : 'bg-gray-50 text-gray-500'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className={mapping?.enabled ? 'font-semibold' : ''}>
                                {header}
                              </span>
                              {mapping?.enabled && (
                                <Badge variant="secondary" className="text-xs">
                                  {mapping.targetField}
                                </Badge>
                              )}
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {csvData.rows.slice(0, previewRows).map((row, rowIndex) => (
                      <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-3 py-2 text-xs text-gray-500 font-mono">
                          {rowIndex + 1}
                        </td>
                        {row.map((cell, cellIndex) => {
                          const mapping = columnMappings[cellIndex];
                          return (
                            <td
                              key={cellIndex}
                              className={`px-3 py-2 text-sm ${mapping?.enabled ? 'bg-blue-25' : ''}`}
                            >
                              <div className="max-w-32 truncate" title={cell}>
                                {editingRowIndex === rowIndex ? (
                                  <Input
                                    value={cell}
                                    onChange={(e) => {
                                      const newRows = [...csvData.rows];
                                      newRows[rowIndex][cellIndex] = e.target.value;
                                      setCsvData({ ...csvData, rows: newRows });
                                    }}
                                    className="h-6 text-xs"
                                  />
                                ) : (
                                  cell
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-gray-600 text-center">
                Showing {Math.min(previewRows, csvData.totalRows)} of {csvData.totalRows} total rows
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
};