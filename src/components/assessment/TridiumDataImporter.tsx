import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TridiumCSVParser } from '@/utils/tridiumParser';
import { TridiumDataset, TridiumAnalysisResult, TridiumDataTypes } from '@/types/tridium';
import { TridiumDataTable } from './TridiumDataTable';
import { TridiumSummaryGenerator } from './TridiumSummaryGenerator';
import { DeviceInventoryAggregator } from './DeviceInventoryAggregator';
import { logger } from '@/utils/logger';

interface TridiumDataImporterProps {
  onAnalysisComplete?: (result: TridiumAnalysisResult) => void;
  onDataSelected?: (summaryText: string) => void;
  visitId?: string;
}

export const TridiumDataImporter: React.FC<TridiumDataImporterProps> = ({
  onAnalysisComplete,
  onDataSelected,
  visitId
}) => {
  const { toast } = useToast();
  const [datasets, setDatasets] = useState<TridiumDataset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeDataset, setActiveDataset] = useState<string | null>(null);
  const [generatedSummary, setGeneratedSummary] = useState<string>('');

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return;
    
    setUploading(true);
    const newDatasets: TridiumDataset[] = [];
    
    try {
      for (const file of Array.from(files)) {
        const validExtensions = ['.csv', '.txt', '.xlsx', '.xls'];
        const hasValidExtension = validExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        );
        
        if (!hasValidExtension) {
          toast({
            title: "Invalid File Type",
            description: `${file.name} is not a supported file type`,
            variant: "destructive"
          });
          continue;
        }
        
        const content = await file.text();
        const dataset = TridiumCSVParser.parseFileContent(content, file.name);
        newDatasets.push(dataset);
        
        logger.info('Dataset parsed successfully', {
          filename: file.name,
          rows: dataset.rows.length,
          type: dataset.type,
          detectedFormat: dataset.format || dataset.metadata.detectedFormat || 'Unknown'
        });
      }
      
      setDatasets(prev => [...prev, ...newDatasets]);
      
      if (newDatasets.length > 0) {
        setActiveDataset(newDatasets[0].id);
        toast({
          title: "Files Imported Successfully",
          description: `Processed ${newDatasets.length} CSV file(s)`,
          variant: "default"
        });
      }
    } catch (error) {
      logger.error('File upload failed', { error });
      toast({
        title: "Import Failed", 
        description: error instanceof Error ? error.message : "Failed to process CSV files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [toast]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  }, [handleFileUpload]);

  const handleDatasetUpdate = useCallback((datasetId: string, updatedDataset: TridiumDataset) => {
    setDatasets(prev => prev.map(ds => ds.id === datasetId ? updatedDataset : ds));
  }, []);

  const handleSummaryGenerated = useCallback((summary: string) => {
    setGeneratedSummary(summary);
    onDataSelected?.(summary);
  }, [onDataSelected]);

  const handleParserTypeChange = useCallback((datasetId: string, parserType: string) => {
    const dataset = datasets.find(ds => ds.id === datasetId);
    if (!dataset) return;

    // Simple format update - just change the display format
    setDatasets(prev => prev.map(ds => ds.id === datasetId ? {
      ...ds,
      format: parserType,
      type: getTypeFromFormat(parserType)
    } : ds));
    
    toast({
      title: "Parser Type Updated",
      description: `File format changed to ${getFormatDisplayName(parserType)}`,
      variant: "default"
    });
  }, [datasets, toast]);

  const getFormatDisplayName = (format: string) => {
    const names: Record<string, string> = {
      'N2Export': 'N2 Network Devices',
      'BacnetExport': 'BACnet Devices', 
      'ResourceExport': 'System Resources',
      'NiagaraNetExport': 'Niagara Stations',
      'PlatformDetails': 'Platform Information',
      'Unknown': 'Unknown Format'
    };
    return names[format] || 'Unknown Format';
  };

  const getTypeFromFormat = (format: string): keyof TridiumDataTypes => {
    const typeMap: Record<string, keyof TridiumDataTypes> = {
      'N2Export': 'networkDevices',
      'BacnetExport': 'bacnetDevices',
      'ResourceExport': 'resourceMetrics',
      'NiagaraNetExport': 'niagaraStations',
      'PlatformDetails': 'platformDetails'
    };
    return typeMap[format] || 'unknown';
  };

  const handleExportResults = useCallback(() => {
    if (datasets.length === 0) return;
    
    const activeDS = datasets.find(ds => ds.id === activeDataset);
    if (!activeDS) return;

    const selectedRows = activeDS.rows.filter(row => row.selected);
    if (selectedRows.length === 0) {
      toast({
        title: "No Data Selected",
        description: "Please select some data rows to export",
        variant: "destructive"
      });
      return;
    }

    // Create CSV export
    const visibleColumns = activeDS.columns.filter(col => col.visible);
    const headers = visibleColumns.map(col => col.label).join(',');
    const rows = selectedRows.map(row => 
      visibleColumns.map(col => {
        const value = row.data[col.key];
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      }).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tridium-analysis-${activeDS.filename.replace('.csv', '')}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Data Exported",
      description: `Exported ${selectedRows.length} selected records`,
      variant: "default"
    });
  }, [datasets, activeDataset, toast]);

  const activeDatasetData = datasets.find(ds => ds.id === activeDataset);

  return (
    <div className="space-y-6">
      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Tridium System Data Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}
              ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {uploading ? 'Processing Files...' : 'Upload Network Export Files'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop CSV files here, or click to browse
            </p>
            
            {/* File Naming Guidelines */}
            <div className="bg-muted/50 rounded-lg p-4 mb-4 text-left">
              <h4 className="font-medium text-sm mb-2">📁 File Naming Guidelines (for auto-detection):</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>• N2 Export: Contains "Controller Type", "Status", "Address" columns</div>
                <div>• BACnet Export: Contains "Device ID", "Vendor", "Type" columns</div>
                <div>• Resource Export: Contains exactly "Name" and "Value" columns</div>
                <div>• Niagara Export: Contains "Fox Port" or "Path" columns</div>
                <div>• Platform Details: .txt files with platform information</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                💡 Don't worry about naming - you can manually select the parser type after upload
              </p>
            </div>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Supported formats: Network Devices, BACnet Exports, Resource Metrics, Niagara Stations</p>
              <p>Accepted file types: .csv, .xlsx, .txt (Platform Details)</p>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx,.txt"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={uploading}
            />
            <Button asChild className="mt-4" disabled={uploading}>
              <label htmlFor="file-upload" className="cursor-pointer">
                Choose Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dataset Tabs */}
      {datasets.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Imported Datasets</CardTitle>
              <div className="flex gap-2">
                <Button onClick={handleExportResults} variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export Selected
                </Button>
              </div>
            </div>
            <div className="space-y-3">
              {datasets.map(dataset => (
                <div key={dataset.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <Button
                      variant={activeDataset === dataset.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveDataset(dataset.id)}
                      className="flex items-center gap-2"
                    >
                      {dataset.metadata.parseErrors.length === 0 ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-3 h-3 text-yellow-500" />
                      )}
                      <span className="text-sm">{dataset.filename}</span>
                    </Button>
                    
                    {dataset.format === 'Unknown' && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Parser Type:</span>
                        <select 
                          className="text-xs border rounded px-2 py-1"
                          onChange={(e) => handleParserTypeChange(dataset.id, e.target.value)}
                          defaultValue=""
                        >
                          <option value="">Select Type</option>
                          <option value="N2Export">N2 Network Export</option>
                          <option value="BacnetExport">BACnet Device Export</option>
                          <option value="ResourceExport">Resource Metrics</option>
                          <option value="NiagaraNetExport">Niagara Network Export</option>
                          <option value="PlatformDetails">Platform Details</option>
                        </select>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="font-medium">
                      {getFormatDisplayName(dataset.format || dataset.metadata.detectedFormat || 'Unknown')}
                    </span>
                    <span>•</span>
                    <span>{dataset.rows.length} rows</span>
                    <span>•</span>
                    <span>{dataset.columns?.length || 0} columns</span>
                  </div>
                </div>
              ))}
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Multi-File Aggregation */}
      {datasets.length > 0 && (
        <DeviceInventoryAggregator 
          datasets={datasets}
          visitId={visitId}
          onAggregationComplete={(aggregationId, devices) => {
            console.log('Aggregation completed:', { aggregationId, deviceCount: devices.length });
          }}
        />
      )}

      {/* Active Dataset Display */}
      {activeDatasetData && (
        <>
          <TridiumDataTable
            devices={activeDatasetData.rows.map(row => ({ 
              id: row.id, 
              ...row.data,
              isOnline: row.parsedStatus?.status === 'ok',
              isDown: row.parsedStatus?.status === 'down',
              hasAlarm: row.parsedStatus?.status === 'alarm',
              sourceFile: activeDatasetData.filename,
              format: activeDatasetData.format || activeDatasetData.type
            }))}
            onSelectionChange={(selectedDevices) => {
              // Handle selection change if needed
            }}
          />
          
          <TridiumSummaryGenerator
            dataset={activeDatasetData}
            onSummaryGenerated={handleSummaryGenerated}
          />
        </>
      )}

      {/* Generated Summary Preview */}
      {generatedSummary && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Analysis Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
              {generatedSummary}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};