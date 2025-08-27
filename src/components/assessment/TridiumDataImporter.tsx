import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertTriangle, CheckCircle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TridiumCSVParser, TridiumParser } from '@/utils/tridiumParser';
import { TridiumDataset, TridiumAnalysisResult, TridiumDataTypes } from '@/types/tridium';
import { TridiumDataTable } from './TridiumDataTable';
import { TridiumSummaryGenerator } from './TridiumSummaryGenerator';
import { DeviceInventoryAggregator } from './DeviceInventoryAggregator';
import { SiteTree } from './SiteTree';
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
  const [selectedParserType, setSelectedParserType] = useState<string>('');
  const [jaceOnlyMode, setJaceOnlyMode] = useState<boolean>(false);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingUpload, setPendingUpload] = useState<{ nodeId: string | null; kind: 'platform' | 'resource' | 'driver' | null; driverHint?: 'N2Export' | 'BACnetExport' } | null>(null);
  const [showImporter, setShowImporter] = useState<boolean>(true);
  const [showDriverPicker, setShowDriverPicker] = useState<boolean>(false);

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
        
        // Use new parser with optional format hint
        const parseOptions = selectedParserType && selectedParserType !== '' 
          ? { userFormatHint: selectedParserType as any }
          : {};
          
        try {
          const result = await TridiumParser.parseFile(content, file.name, parseOptions);
          
          if (!result.success || !result.dataset) {
            throw new Error(`Parsing failed: ${result.errors.join('; ')}`);
          }
          
          const dataset = result.dataset;
          
          // Enforce Supervisor-first unless JACE-only mode is enabled
          const niagaraAlreadyPresent = datasets.some(ds => ds.format === 'NiagaraNetExport');
          if (!jaceOnlyMode && !niagaraAlreadyPresent && newDatasets.length === 0 && dataset.format !== 'NiagaraNetExport') {
            toast({
              title: 'Start with Supervisor Niagara Network export',
              description: 'Upload the Supervisor Niagara Network CSV first, or enable JACE-only mode.',
              variant: 'destructive'
            });
            continue;
          }
          
          if (result.warnings.length > 0) {
            logger.warn('Parser warnings', {
              filename: file.name,
              warnings: result.warnings
            });
          }
          
          logger.info('New parser successfully processed file', {
            filename: file.name,
            format: dataset.format,
            category: dataset.category,
            confidence: dataset.metadata.confidence,
            rows: dataset.rows.length
          });
          
          newDatasets.push(dataset);
          if ((!jaceOnlyMode && dataset.format === 'NiagaraNetExport') || (jaceOnlyMode && dataset.format === 'PlatformDetails')) {
            setShowImporter(false);
          }
          // Collapse importer after initial NiagaraNet (or JACE-only Platform Details)
          if ((!jaceOnlyMode && dataset.format === 'NiagaraNetExport') || (jaceOnlyMode && dataset.format === 'PlatformDetails')) {
            setShowImporter(false);
          }
        } catch (error) {
          // Fallback to legacy parser for backward compatibility
          logger.warn('New parser failed, falling back to legacy parser', {
            filename: file.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          let dataset = await TridiumCSVParser.parseFileContent(content, file.name);
          
          // Enforce Supervisor-first unless JACE-only mode is enabled
          const niagaraAlreadyPresentLegacy = datasets.some(ds => ds.format === 'NiagaraNetExport');
          if (!jaceOnlyMode && !niagaraAlreadyPresentLegacy && newDatasets.length === 0 && dataset.format !== 'NiagaraNetExport') {
            toast({
              title: 'Start with Supervisor Niagara Network export',
              description: 'Upload the Supervisor Niagara Network CSV first, or enable JACE-only mode.',
              variant: 'destructive'
            });
            continue;
          }
          
          // Apply manual parser type selection if specified
          if (selectedParserType && selectedParserType !== '') {
            dataset = {
              ...dataset,
              format: selectedParserType as any,
              category: getCategoryFromFormat(selectedParserType)
            };
            logger.info('Manual parser type applied to legacy result', {
              filename: file.name,
              selectedType: selectedParserType,
              finalFormat: dataset.format
            });
          }
          
          newDatasets.push(dataset);
        }
        
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

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    console.log('File selected:', files[0]?.name, 'Pending upload:', pendingUpload);
    setUploading(true);

    try {
      // If this is a node-initiated upload, parse with hint and associate
      if (pendingUpload && files.length > 0) {
        const file = files[0];
        const content = await file.text();
        let userFormatHint: any = undefined;
        if (pendingUpload.kind === 'platform') userFormatHint = 'PlatformDetails';
        if (pendingUpload.kind === 'resource') userFormatHint = 'ResourceExport';
        if (pendingUpload.kind === 'driver' && pendingUpload.driverHint) userFormatHint = pendingUpload.driverHint;

        console.log('Processing node upload with hint:', userFormatHint);

        try {
          const result = await TridiumParser.parseFile(content, file.name, userFormatHint ? { userFormatHint } : {});
          if (!result.success || !result.dataset) throw new Error(result.errors.join('; '));
          
          setDatasets(prev => {
            const newDatasets = [...prev, result.dataset!];
            console.log('Added dataset, total now:', newDatasets.length);
            return newDatasets;
          });

          // Persist association mapping AFTER dataset is added
          try {
            const { TridiumAssociationService } = await import('@/services/tridiumAssociationService');
            if (pendingUpload.nodeId) {
              console.log('Setting association:', result.dataset!.id, '→', pendingUpload.nodeId);
              TridiumAssociationService.setMapping(result.dataset!.id, pendingUpload.nodeId);
              
              // Delay the event dispatch to ensure datasets state is fully updated
              setTimeout(() => {
                console.log('Dispatching tridiumAssociationUpdate event after state update');
                window.dispatchEvent(new CustomEvent('tridiumAssociationUpdate', {
                  detail: { datasetId: result.dataset!.id, nodeId: pendingUpload.nodeId }
                }));
              }, 50);
            }
          } catch (err) {
            console.error('Failed to set association:', err);
            toast({
              title: 'Association Warning',
              description: 'File uploaded but association may not persist',
              variant: 'destructive'
            });
          }

          toast({ 
            title: 'File added successfully', 
            description: `${file.name} processed as ${result.dataset!.format}`,
            variant: 'default'
          });
        } catch (err) {
          console.error('Parse error:', err);
          toast({ 
            title: 'Upload failed', 
            description: err instanceof Error ? err.message : 'Parse failed', 
            variant: 'destructive' 
          });
        } finally {
          setPendingUpload(null);
          setShowDriverPicker(false);
        }
        return;
      }

      // Fallback: regular multi-file upload
      await handleFileUpload(files);
    } finally {
      setUploading(false);
      // Reset file input
      if (e.target) {
        e.target.value = '';
      }
    }
  }, [handleFileUpload, pendingUpload, toast, datasets]);

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
      'BACnetExport': 'BACnet Devices', 
      'BacnetExport': 'BACnet Devices',
      'ResourceExport': 'System Resources',
      'NiagaraNetExport': 'Niagara Stations',
      'PlatformDetails': 'Platform Information',
      'Unknown': 'Unknown Format'
    };
    return names[format] || 'Unknown Format';
  };

  const getCategoryFromFormat = (format: string) => {
    const categoryMap: Record<string, string> = {
      'N2Export': 'networkDevices',
      'BACnetExport': 'bacnetDevices',
      'BacnetExport': 'bacnetDevices', 
      'ResourceExport': 'resourceMetrics',
      'NiagaraNetExport': 'niagaraStations',
      'PlatformDetails': 'platformDetails'
    };
    return categoryMap[format] || 'unknown';
  };

  // Helper function to determine if dataset is a resource type
  const isResourceDataset = (dataset: any) => {
    return dataset.format === 'ResourceExport' || 
           dataset.category === 'systemMetrics' || 
           dataset.type === 'resourceMetrics';
  };

  // Helper function to determine if dataset is a network device type  
  const isNetworkDeviceDataset = (dataset: any) => {
    return dataset.format === 'N2Export' || 
           dataset.format === 'BACnetExport' ||
           dataset.format === 'BacnetExport' ||
           dataset.format === 'NiagaraNetExport' ||
           dataset.type === 'networkDevices' || 
           dataset.type === 'bacnetDevices' || 
           dataset.type === 'niagaraStations';
  };

  const getTypeFromFormat = (format: string): keyof TridiumDataTypes => {
    const typeMap: Record<string, keyof TridiumDataTypes> = {
      'N2Export': 'networkDevices',
      'BACnetExport': 'bacnetDevices',
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
      {/* Hidden file input - always present for upload functionality */}
      <input
        ref={uploadInputRef}
        type="file"
        accept=".csv,.xlsx,.txt"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload-hidden"
        disabled={uploading}
      />
      {/* File Upload Area */}
      {showImporter && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Tridium Station Tree Import
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
              {uploading ? 'Processing Files...' : 'Upload Tridium Export Files'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to browse. Start with Supervisor Niagara Network (.csv) or JACE Platform Details (.txt) to reconstruct the station tree.
            </p>
            
            {/* Advanced: Manual Parser Type Selection */}
            {showAdvanced && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-sm mb-2 text-blue-800">File Type (optional)</h4>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-blue-700">File Type:</label>
                <select 
                  className="text-xs border rounded px-3 py-1 bg-white"
                  value={selectedParserType}
                  onChange={(e) => setSelectedParserType(e.target.value)}
                >
                  <option value="">Auto-detect</option>
                  <option value="N2Export">N2 Network Export</option>
                  <option value="BACnetExport">BACnet Device Export</option>
                  <option value="ResourceExport">Resource Metrics/System Stats</option>
                  <option value="NiagaraNetExport">Niagara Network Export</option>
                  <option value="PlatformDetails">Platform Details</option>
                </select>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                Use this only if auto-detection fails.
              </p>
            </div>
            )}
            
            {/* Supervisor-first workflow (simplified) */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3 text-left flex items-center justify-between">
              <div className="text-sm text-amber-800">Start with Supervisor Niagara Network (.csv) or JACE Platform Details (.txt). For JACE-only sites, toggle JACE-only.</div>
              <Button type="button" variant={jaceOnlyMode ? 'default' : 'outline'} size="sm" onClick={() => setJaceOnlyMode(v => !v)}>
                {jaceOnlyMode ? 'JACE-only: ON' : 'JACE-only: OFF'}
              </Button>
            </div>

            {/* Advanced options toggle */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">Need to override auto-detection or view naming tips?</span>
              <button className="text-xs underline" onClick={() => setShowAdvanced(v => !v)}>{showAdvanced ? 'Hide advanced' : 'Show advanced'}</button>
            </div>
            
            {/* File Naming Guidelines (Advanced) */}
            {showAdvanced && (
            <div className="bg-muted/50 rounded-lg p-4 mb-4 text-left">
              <h4 className="font-medium text-sm mb-2">File Naming Guidelines (for auto-detection)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>• N2 Export: Contains "Controller Type", "Status", "Address" columns</div>
                <div>• BACnet Export: Contains "Device ID", "Vendor", "Type" columns</div>
                <div>• Resource Export: Contains exactly "Name" and "Value" columns</div>
                <div>• Niagara Export: Contains "Fox Port" or "Path" columns</div>
                <div>• Platform Details: .txt files with platform information</div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 italic">
                You can set the file type manually above if needed.
              </p>
            </div>
            )}
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Supported formats: Network Devices, BACnet Exports, Resource Metrics, Niagara Stations</p>
              <p>Accepted file types: .csv, .xlsx, .txt (Platform Details)</p>
            </div>
            <Button asChild className="mt-4" disabled={uploading}>
              <label htmlFor="file-upload-hidden" className="cursor-pointer">
                Choose Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>
      )}

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
                    
                    {(dataset.format === 'Unknown' || dataset.format === 'NetworkDevice') && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Fix Parser:</span>
                        <select 
                          className="text-xs border rounded px-2 py-1"
                          onChange={(e) => handleParserTypeChange(dataset.id, e.target.value)}
                          defaultValue=""
                        >
                          <option value="">Select Correct Type</option>
                          <option value="N2Export">N2 Network Export</option>
                          <option value="BACnetExport">BACnet Device Export</option>
                          <option value="ResourceExport">Resource Metrics/System Stats</option>
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

      {/* Site Tree View */}
      {datasets.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <div>
                <CardTitle>Site Hierarchy</CardTitle>
                <CardDescription>
                  Built from Supervisor Niagara Network and station/device datasets
                </CardDescription>
              </div>
              {!showImporter && (
                <Button size="sm" variant="outline" onClick={() => { setShowImporter(true); setTimeout(() => uploadInputRef.current?.click(), 0); }}>
                  + Add Files
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <SiteTree 
              datasets={datasets}
              onRequestUpload={(node, kind) => {
                console.log(`Upload requested for node ${node.name}, kind: ${kind}`);
                
                // Prepare file chooser with parser hint
                const input = uploadInputRef.current;
                if (!input) {
                  console.error('Upload input ref not found');
                  toast({
                    title: 'Upload Error',
                    description: 'File upload system not available',
                    variant: 'destructive'
                  });
                  return;
                }
                
                // Clear any existing pending upload first
                setPendingUpload(null);
                setShowDriverPicker(false);
                
                // Set up new pending upload
                const newPendingUpload = { nodeId: node.id, kind };
                setPendingUpload(newPendingUpload);
                console.log('Set pending upload:', newPendingUpload);
                
                // Set accept based on kind and trigger file dialog
                if (kind === 'platform') {
                  input.accept = '.txt';
                  input.multiple = false;
                  input.value = ''; // Reset file input
                  // Trigger click after a short delay to ensure state is set
                  setTimeout(() => {
                    console.log('Triggering platform file dialog');
                    input.click();
                  }, 100);
                } else if (kind === 'resource') {
                  input.accept = '.csv';
                  input.multiple = false;
                  input.value = ''; // Reset file input
                  // Trigger click after a short delay to ensure state is set
                  setTimeout(() => {
                    console.log('Triggering resource file dialog');
                    input.click();
                  }, 100);
                } else if (kind === 'driver') {
                  // Driver: ask for driver type selection first
                  console.log('Showing driver picker for node:', node.name);
                  console.log('Before setting showDriverPicker - current state:', showDriverPicker);
                  setShowDriverPicker(true);
                  console.log('After setting showDriverPicker to true');
                  
                  // Double-check state was set
                  setTimeout(() => {
                    console.log('Driver picker state check after timeout:', showDriverPicker);
                  }, 50);
                }
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Driver picker modal for node uploads */}
      {showDriverPicker && pendingUpload && pendingUpload.kind === 'driver' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Select Driver Export Type</h3>
            <p className="text-sm text-gray-600 mb-6">
              Choose the driver type you are uploading for node: <strong>{pendingUpload.nodeId}</strong>
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button 
                  className="flex-1" 
                  onClick={() => {
                    const input = uploadInputRef.current; 
                    if (!input) {
                      console.error('Input ref not found for N2 driver upload');
                      toast({
                        title: 'Upload Error',
                        description: 'File upload system not available',
                        variant: 'destructive'
                      });
                      return;
                    }
                    console.log('N2 Export selected for node:', pendingUpload?.nodeId);
                    setPendingUpload(prev => prev ? { ...prev, driverHint: 'N2Export' } : prev);
                    input.accept = '.csv'; 
                    input.multiple = false; 
                    input.value = ''; // Reset file input
                    setShowDriverPicker(false); // Hide picker after selection
                    setTimeout(() => {
                      console.log('Triggering N2 driver file dialog');
                      input.click();
                    }, 100);
                  }}
                >
                  🏢 N2 Export (.csv)
                </Button>
                
                <Button 
                  className="flex-1"
                  onClick={() => {
                    const input = uploadInputRef.current; 
                    if (!input) {
                      console.error('Input ref not found for BACnet driver upload');
                      toast({
                        title: 'Upload Error',
                        description: 'File upload system not available',
                        variant: 'destructive'
                      });
                      return;
                    }
                    console.log('BACnet Export selected for node:', pendingUpload?.nodeId);
                    setPendingUpload(prev => prev ? { ...prev, driverHint: 'BACnetExport' } : prev);
                    input.accept = '.csv'; 
                    input.multiple = false; 
                    input.value = ''; // Reset file input
                    setShowDriverPicker(false); // Hide picker after selection
                    setTimeout(() => {
                      console.log('Triggering BACnet driver file dialog');
                      input.click();
                    }, 100);
                  }}
                >
                  🔌 BACnet Export (.csv)
                </Button>
              </div>
              
              <div className="flex justify-end pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    console.log('Driver picker cancelled');
                    setShowDriverPicker(false);
                    setPendingUpload(null);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-File Aggregation - Only for Network Device files */}
      {datasets.filter(ds => isNetworkDeviceDataset(ds)).length > 0 && (
        <DeviceInventoryAggregator 
          datasets={datasets.filter(ds => isNetworkDeviceDataset(ds))}
          visitId={visitId}
          onAggregationComplete={(aggregationId, devices) => {
            console.log('Aggregation completed:', { aggregationId, deviceCount: devices.length });
          }}
        />
      )}
      
      {/* Resource Metrics Display - Only for resource files */}
      {datasets.filter(ds => isResourceDataset(ds)).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              System Resource Analysis
            </CardTitle>
            <CardDescription>
              Resource utilization and system metrics from Tridium exports
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {datasets.filter(ds => isResourceDataset(ds)).map(dataset => (
                <div key={dataset.id} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{dataset.filename}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Resource Items:</span>
                      <div className="font-semibold">{dataset.rows.length}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">File Size:</span>
                      <div className="font-semibold">{(dataset.metadata.fileSize / 1024).toFixed(1)} KB</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format:</span>
                      <div className="font-semibold">{getFormatDisplayName(dataset.format)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status:</span>
                      <div className="font-semibold text-green-600">Parsed Successfully</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Dataset Display - Network Devices Only */}
      {activeDatasetData && isNetworkDeviceDataset(activeDatasetData) && (
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
      
      {/* Resource Dataset Table Display */}
      {activeDatasetData && isResourceDataset(activeDatasetData) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Resource Metrics Detail View
            </CardTitle>
            <CardDescription>
              Detailed view of resource metrics from {activeDatasetData.filename}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-left">Resource Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Value</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Parsed Value</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDatasetData.rows.map((row, index) => (
                    <tr key={row.id} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="border border-gray-300 px-4 py-2 font-medium">
                        {row.data['Name'] || row.data['name'] || 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {row.data['Value'] || row.data['value'] || 'N/A'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-sm text-gray-600">
                        {row.parsedValue ? (
                          <div>
                            <div>Value: {row.parsedValue.value}</div>
                            {row.parsedValue.unit && <div>Unit: {row.parsedValue.unit}</div>}
                            {row.parsedValue.category && <div>Category: {row.parsedValue.category}</div>}
                          </div>
                        ) : (
                          'No parsed value'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4">
              <TridiumSummaryGenerator
                dataset={activeDatasetData}
                onSummaryGenerated={handleSummaryGenerated}
              />
            </div>
          </CardContent>
        </Card>
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