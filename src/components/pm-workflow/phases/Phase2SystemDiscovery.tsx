import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Database, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Camera,
  Download,
  ArrowRight,
  Cpu,
  HardDrive,
  Network,
  Settings,
  Plus,
  Trash2,
  XCircle,
  Activity
} from 'lucide-react';
import { PhaseHeader, SectionCard } from '../shared';
import { logger } from '@/utils/logger';
import TridiumExportService from '@/services/tridium/TridiumExportService';
import { ProcessedTridiumExports, STATUS_COLORS } from '@/types/tridiumExport.types';

// Import types
import type { SystemDiscoveryData } from '@/types/pmWorkflow';

interface Phase2SystemDiscoveryProps {
  data: SystemDiscoveryData;
  onDataUpdate: (data: Partial<SystemDiscoveryData>) => void;
  onPhaseComplete: () => void;
}

export const Phase2SystemDiscovery: React.FC<Phase2SystemDiscoveryProps> = ({
  data,
  onDataUpdate,
  onPhaseComplete
}) => {
  const [activeTab, setActiveTab] = useState('bms');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingExports, setProcessingExports] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processingError, setProcessingError] = useState<string>('');
  const [parsedExportData, setParsedExportData] = useState<ProcessedTridiumExports | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const calculateProgress = (): number => {
    const sections = ['bms', 'discovery', 'photos'];
    const completed = sections.filter(section => validateSection(section)).length;
    return (completed / sections.length) * 100;
  };

  const validateSection = (section: string): boolean => {
    switch (section) {
      case 'bms':
        return !!(data.bmsSystem.platform && data.bmsSystem.supervisorLocation);
      case 'discovery':
        return data.tridiumExports.processed || data.manualInventory.totalDeviceCount > 0;
      case 'photos':
        return data.photos.length > 0;
      default:
        return false;
    }
  };

  const updateBMSSystem = (field: string, value: string) => {
    onDataUpdate({
      bmsSystem: { ...data.bmsSystem, [field]: value }
    });
  };

  const updateManualInventory = (field: string, value: any) => {
    onDataUpdate({
      manualInventory: { ...data.manualInventory, [field]: value }
    });
  };

  const addEquipment = () => {
    const equipment = prompt('Enter equipment name:');
    if (equipment?.trim()) {
      updateManualInventory('majorEquipment', [...data.manualInventory.majorEquipment, equipment.trim()]);
    }
  };

  const removeEquipment = (index: number) => {
    const updated = data.manualInventory.majorEquipment.filter((_, i) => i !== index);
    updateManualInventory('majorEquipment', updated);
  };

  const addNetworkSegment = () => {
    const segment = prompt('Enter network segment (e.g., MS/TP Bus 1):');
    if (segment?.trim()) {
      updateManualInventory('networkSegments', [...data.manualInventory.networkSegments, segment.trim()]);
    }
  };

  const removeNetworkSegment = (index: number) => {
    const updated = data.manualInventory.networkSegments.filter((_, i) => i !== index);
    updateManualInventory('networkSegments', updated);
  };

  // Real file processing functions
  const handleFileUpload = useCallback(async (files: File[]) => {
    if (files.length === 0) return;
    
    setProcessingExports(true);
    setUploadProgress(10);
    setProcessingError('');
    setUploadedFiles(files);
    
    try {
      logger.info(`Processing ${files.length} Tridium export files`);
      
      // Process files with TridiumExportService
      const processedData = await TridiumExportService.processMultipleExports(files);
      
      setUploadProgress(90);
      
      // Update component state
      setParsedExportData(processedData);
      
      // Update parent data
      onDataUpdate({
        tridiumExports: {
          ...data.tridiumExports,
          processed: true,
          uploadTime: new Date(),
          resourceExport: processedData.resourceData,
          bacnetExport: processedData.bacnetDevices,
          n2Export: processedData.n2Devices,
          summary: processedData.summary
        }
      });
      
      setUploadProgress(100);
      logger.info(`Successfully processed ${processedData.filesProcessed.length} files`);
      
    } catch (error) {
      logger.error('File processing error:', error);
      setProcessingError(error.message || 'Failed to process export files');
    } finally {
      setTimeout(() => {
        setProcessingExports(false);
        setUploadProgress(0);
      }, 1000);
    }
  }, [data.tridiumExports, onDataUpdate]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.name.toLowerCase().endsWith('.csv') || 
      file.name.toLowerCase().endsWith('.txt')
    );
    
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  const addPhoto = () => {
    // Simulate photo capture
    const newPhoto = {
      id: `photo-${Date.now()}`,
      filename: `equipment-${data.photos.length + 1}.jpg`,
      description: `Equipment Photo ${data.photos.length + 1}`,
      category: 'Equipment' as const,
      timestamp: new Date()
    };
    
    onDataUpdate({
      photos: [...data.photos, newPhoto]
    });
  };

  const updatePhoto = (photoId: string, field: string, value: string) => {
    const updatedPhotos = data.photos.map(photo => 
      photo.id === photoId ? { ...photo, [field]: value } : photo
    );
    onDataUpdate({ photos: updatedPhotos });
  };

  const removePhoto = (photoId: string) => {
    const updatedPhotos = data.photos.filter(photo => photo.id !== photoId);
    onDataUpdate({ photos: updatedPhotos });
  };

  const canCompletePhase = (): boolean => {
    return ['bms', 'discovery'].every(section => validateSection(section));
  };

  const handlePhaseComplete = () => {
    if (canCompletePhase()) {
      logger.info('Phase 2 System Discovery completed');
      onPhaseComplete();
    }
  };

  const progress = calculateProgress();

  return (
    <div className="h-full flex flex-col">
      <PhaseHeader
        phase={2}
        title="System Discovery & Inventory"
        description="Document the BMS platform and gather system information"
        progress={progress}
        requiredTasks={['BMS Overview', 'System Discovery', 'Equipment Photos']}
        completedTasks={['bms', 'discovery', 'photos'].filter(validateSection)}
        estimatedTime={30}
        actualTime={0}
      />

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="m-4 grid grid-cols-3">
            <TabsTrigger value="bms" className="gap-2">
              <Database className="h-4 w-4" />
              BMS Overview
              {validateSection('bms') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="discovery" className="gap-2">
              <Settings className="h-4 w-4" />
              Discovery
              {validateSection('discovery') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="photos" className="gap-2">
              <Camera className="h-4 w-4" />
              Photos ({data.photos.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* BMS Overview Tab */}
            <TabsContent value="bms" className="mt-0">
              <SectionCard
                title="Building Management System Information"
                description="Platform details and network configuration"
                icon={<Database className="h-4 w-4" />}
                required
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Primary Platform *</Label>
                      <Select 
                        value={data.bmsSystem.platform} 
                        onValueChange={(value) => updateBMSSystem('platform', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select BMS platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Niagara">Tridium Niagara</SelectItem>
                          <SelectItem value="JCI">Johnson Controls (Metasys)</SelectItem>
                          <SelectItem value="Honeywell">Honeywell (WEBs)</SelectItem>
                          <SelectItem value="Schneider">Schneider Electric (EcoStruxure)</SelectItem>
                          <SelectItem value="Siemens">Siemens (Desigo)</SelectItem>
                          <SelectItem value="Delta">Delta Controls</SelectItem>
                          <SelectItem value="Mixed">Mixed Systems</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Software Version</Label>
                      <Input
                        value={data.bmsSystem.softwareVersion}
                        onChange={(e) => updateBMSSystem('softwareVersion', e.target.value)}
                        placeholder="e.g., Niagara 4.11, Metasys 12.0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Supervisor Location *</Label>
                      <Input
                        value={data.bmsSystem.supervisorLocation}
                        onChange={(e) => updateBMSSystem('supervisorLocation', e.target.value)}
                        placeholder="e.g., IT Closet, 2nd Floor Server Room"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Supervisor IP/Hostname</Label>
                      <Input
                        value={data.bmsSystem.supervisorIP}
                        onChange={(e) => updateBMSSystem('supervisorIP', e.target.value)}
                        placeholder="192.168.1.100 or hostname"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Network Connection Method</Label>
                      <Select 
                        value={data.bmsSystem.networkMethod} 
                        onValueChange={(value) => updateBMSSystem('networkMethod', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="How do you connect?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LAN">Direct LAN Connection</SelectItem>
                          <SelectItem value="VLAN">Dedicated Controls VLAN</SelectItem>
                          <SelectItem value="VPN">VPN Access</SelectItem>
                          <SelectItem value="Cellular">Cellular Modem</SelectItem>
                          <SelectItem value="Wireless">Wireless Network</SelectItem>
                          <SelectItem value="Serial">Serial Connection</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Credentials Location</Label>
                      <Input
                        value={data.bmsSystem.credentialsLocation}
                        onChange={(e) => updateBMSSystem('credentialsLocation', e.target.value)}
                        placeholder="Password manager, documentation reference"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>System Notes</Label>
                    <Textarea
                      value={data.bmsSystem.notes}
                      onChange={(e) => updateBMSSystem('notes', e.target.value)}
                      placeholder="Any additional notes about the system configuration, network setup, or access considerations..."
                      rows={3}
                    />
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* System Discovery Tab */}
            <TabsContent value="discovery" className="mt-0">
              <div className="space-y-6">
                <SectionCard
                  title="Tridium Workbench Exports"
                  description="Upload and process system exports for automatic inventory"
                  icon={<Upload className="h-4 w-4" />}
                >
                  <div className="space-y-4">
                    {!data.tridiumExports.processed ? (
                      <div className="space-y-4">
                        {/* Drag and Drop Upload Area */}
                        <div 
                          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <div className="space-y-2">
                            <p className="text-lg font-medium">Upload Tridium Export Files</p>
                            <p className="text-sm text-muted-foreground">
                              Drag and drop CSV/TXT files here, or click to browse
                            </p>
                            <div className="text-xs text-muted-foreground space-y-1">
                              <div>📊 <strong>ResourceExport.csv</strong> - System performance metrics</div>
                              <div>🌐 <strong>BACnetExport.csv</strong> - Device inventory and status</div>
                              <div>🔌 <strong>N2Export.csv</strong> - Legacy N2 device data</div>
                              <div>📋 <strong>PlatformDetails.txt</strong> - Platform information</div>
                            </div>
                          </div>
                        </div>

                        {/* Hidden file input */}
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept=".csv,.txt"
                          onChange={handleFileInputChange}
                          className="hidden"
                        />

                        {/* Show uploaded files */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm">Uploaded Files:</h4>
                            <div className="grid gap-2">
                              {uploadedFiles.map((file, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-50 rounded p-2">
                                  <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-mono">{file.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      ({(file.size / 1024).toFixed(1)} KB)
                                    </span>
                                  </div>
                                  <Badge variant="outline" className="text-xs">
                                    {TridiumExportService.detectFileType(file.name)}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Processing status */}
                        {processingExports && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm flex items-center gap-2">
                                <Activity className="h-4 w-4 animate-spin" />
                                Processing exports...
                              </span>
                              <span className="text-sm">{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} />
                          </div>
                        )}

                        {/* Error display */}
                        {processingError && (
                          <Alert variant="destructive">
                            <XCircle className="h-4 w-4" />
                            <AlertDescription>
                              Error processing files: {processingError}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Alert>
                          <CheckCircle2 className="h-4 w-4" />
                          <AlertDescription>
                            Tridium exports processed successfully! System data extracted automatically.
                          </AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-4 text-center">
                              <Cpu className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                              <div className="text-2xl font-bold">
                                {parsedExportData?.resourceData?.cpuUsage?.toFixed(0) || '—'}
                                {parsedExportData?.resourceData?.cpuUsage ? '%' : ''}
                              </div>
                              <div className="text-sm text-muted-foreground">CPU Usage</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <HardDrive className="h-8 w-8 mx-auto mb-2 text-green-500" />
                              <div className="text-2xl font-bold">
                                {parsedExportData?.resourceData?.heapUsed 
                                  ? `${Math.round((parsedExportData.resourceData.heapUsed / parsedExportData.resourceData.heapMax) * 100)}%`
                                  : '—'
                                }
                              </div>
                              <div className="text-sm text-muted-foreground">Memory Usage</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <Network className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                              <div className="text-2xl font-bold">
                                {parsedExportData?.summary?.totalDevices || 
                                 parsedExportData?.resourceData?.deviceCount || '—'}
                              </div>
                              <div className="text-sm text-muted-foreground">Total Devices</div>
                            </CardContent>
                          </Card>
                          <Card>
                            <CardContent className="p-4 text-center">
                              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-orange-500" />
                              <div className="text-2xl font-bold">
                                {parsedExportData?.summary?.devicesWithAlarms || '—'}
                              </div>
                              <div className="text-sm text-muted-foreground">Active Alarms</div>
                            </CardContent>
                          </Card>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2 flex items-center justify-between">
                            Device Inventory 
                            {parsedExportData && (
                              <span className="text-sm text-muted-foreground font-normal">
                                {parsedExportData.summary.totalDevices} devices found
                              </span>
                            )}
                          </h4>
                          <div className="border rounded-lg overflow-hidden">
                            {parsedExportData && parsedExportData.bacnetDevices.length > 0 ? (
                              <>
                                <table className="w-full text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="text-left p-2">Device Name</th>
                                      <th className="text-left p-2">Type</th>
                                      <th className="text-left p-2">Status</th>
                                      <th className="text-left p-2">Vendor</th>
                                      <th className="text-left p-2">Model</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {parsedExportData.bacnetDevices.slice(0, 10).map((device, i) => (
                                      <tr key={i} className="border-t hover:bg-gray-50">
                                        <td className="p-2 font-mono text-xs">{device.name}</td>
                                        <td className="p-2">{device.type}</td>
                                        <td className="p-2">
                                          <Badge 
                                            variant={
                                              device.status === 'ok' ? 'default' : 
                                              device.status === 'unackedAlarm' ? 'secondary' : 'destructive'
                                            }
                                            className="text-xs"
                                          >
                                            {device.status === 'ok' ? 'Online' : 
                                             device.status === 'unackedAlarm' ? 'Alarm' : 
                                             device.status === 'down' ? 'Offline' : 'Fault'}
                                          </Badge>
                                        </td>
                                        <td className="p-2">{device.vendor}</td>
                                        <td className="p-2">{device.model}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {parsedExportData.bacnetDevices.length > 10 && (
                                  <div className="bg-gray-50 px-2 py-1 text-xs text-muted-foreground text-center">
                                    Showing first 10 of {parsedExportData.bacnetDevices.length} devices
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="p-4 text-center text-muted-foreground">
                                <Database className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                <div className="text-sm">
                                  Upload BACnet export CSV to view device inventory
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* System Health Summary */}
                        {parsedExportData && (
                          <div className="mt-4 space-y-4">
                            <h4 className="font-medium">System Health Summary</h4>
                            
                            {/* Health Score */}
                            <div className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium">Overall Health Score</span>
                                <span className="text-2xl font-bold text-green-600">
                                  {parsedExportData.summary.systemHealthScore}/100
                                </span>
                              </div>
                              <Progress 
                                value={parsedExportData.summary.systemHealthScore} 
                                className="h-2"
                              />
                            </div>

                            {/* Summary Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                              <div className="bg-green-50 rounded p-3 text-center">
                                <div className="text-lg font-bold text-green-600">
                                  {parsedExportData.summary.onlineDevices}
                                </div>
                                <div className="text-xs text-green-700">Online Devices</div>
                              </div>
                              <div className="bg-red-50 rounded p-3 text-center">
                                <div className="text-lg font-bold text-red-600">
                                  {parsedExportData.summary.offlineDevices}
                                </div>
                                <div className="text-xs text-red-700">Offline Devices</div>
                              </div>
                              <div className="bg-orange-50 rounded p-3 text-center">
                                <div className="text-lg font-bold text-orange-600">
                                  {parsedExportData.summary.devicesWithAlarms}
                                </div>
                                <div className="text-xs text-orange-700">Devices with Alarms</div>
                              </div>
                              <div className="bg-blue-50 rounded p-3 text-center">
                                <div className="text-lg font-bold text-blue-600">
                                  {parsedExportData.summary.primaryVendors.length}
                                </div>
                                <div className="text-xs text-blue-700">Vendors</div>
                              </div>
                            </div>

                            {/* Top Vendors */}
                            {parsedExportData.summary.primaryVendors.length > 0 && (
                              <div>
                                <h5 className="text-sm font-medium mb-2">Top Vendors</h5>
                                <div className="space-y-1">
                                  {parsedExportData.summary.primaryVendors.slice(0, 3).map((vendor, i) => (
                                    <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-1">
                                      <span>{vendor.vendor}</span>
                                      <Badge variant="outline" className="text-xs">
                                        {vendor.count} devices
                                      </Badge>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Processing Info */}
                            <div className="text-xs text-muted-foreground bg-gray-50 rounded p-2">
                              <div className="flex justify-between items-center">
                                <span>Files processed: {parsedExportData.filesProcessed.join(', ')}</span>
                                <span>Processed: {parsedExportData.uploadTime.toLocaleTimeString()}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </SectionCard>

                <SectionCard
                  title="Manual System Inventory"
                  description="Backup method if exports are unavailable"
                  icon={<FileText className="h-4 w-4" />}
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Total Device Count</Label>
                        <Input
                          type="number"
                          value={data.manualInventory.totalDeviceCount}
                          onChange={(e) => updateManualInventory('totalDeviceCount', parseInt(e.target.value) || 0)}
                          placeholder="Approximate number of devices"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Controller Types</Label>
                        <div className="flex flex-wrap gap-2">
                          {['JACE', 'VAV Controllers', 'AHU Controllers', 'Lighting Controllers', 'Meters'].map(type => (
                            <Button
                              key={type}
                              variant={data.manualInventory.controllerTypes.includes(type) ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                const current = data.manualInventory.controllerTypes;
                                const updated = current.includes(type)
                                  ? current.filter(t => t !== type)
                                  : [...current, type];
                                updateManualInventory('controllerTypes', updated);
                              }}
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Major Equipment</Label>
                        <Button variant="outline" size="sm" onClick={addEquipment} className="gap-1">
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {data.manualInventory.majorEquipment.map((equipment, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input value={equipment} readOnly />
                            <Button variant="ghost" size="sm" onClick={() => removeEquipment(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {data.manualInventory.majorEquipment.length === 0 && (
                          <p className="text-sm text-muted-foreground">No equipment added yet</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label>Network Segments</Label>
                        <Button variant="outline" size="sm" onClick={addNetworkSegment} className="gap-1">
                          <Plus className="h-3 w-3" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {data.manualInventory.networkSegments.map((segment, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input value={segment} readOnly />
                            <Button variant="ghost" size="sm" onClick={() => removeNetworkSegment(index)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {data.manualInventory.networkSegments.length === 0 && (
                          <p className="text-sm text-muted-foreground">No network segments added yet</p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Additional Notes</Label>
                      <Textarea
                        value={data.manualInventory.notes}
                        onChange={(e) => updateManualInventory('notes', e.target.value)}
                        placeholder="Any additional system details, observations, or notes..."
                        rows={3}
                      />
                    </div>
                  </div>
                </SectionCard>
              </div>
            </TabsContent>

            {/* Photos Tab */}
            <TabsContent value="photos" className="mt-0">
              <SectionCard
                title="Equipment & System Photos"
                description="Capture photos of key equipment and system components"
                icon={<Camera className="h-4 w-4" />}
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Document main panels, supervisor, and key equipment
                    </p>
                    <Button onClick={addPhoto} className="gap-2">
                      <Camera className="h-4 w-4" />
                      Add Photo
                    </Button>
                  </div>

                  {data.photos.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Camera className="h-12 w-12 mx-auto mb-4" />
                      <p>No photos added yet</p>
                      <p className="text-sm">Photos help document system configuration</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {data.photos.map(photo => (
                        <Card key={photo.id}>
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <Badge variant="outline">{photo.category}</Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removePhoto(photo.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="bg-gray-100 rounded-lg h-32 mb-3 flex items-center justify-center">
                              <Camera className="h-8 w-8 text-gray-400" />
                            </div>
                            
                            <div className="space-y-2">
                              <Input
                                value={photo.description}
                                onChange={(e) => updatePhoto(photo.id, 'description', e.target.value)}
                                placeholder="Photo description"
                                className="text-sm"
                              />
                              <p className="text-xs text-muted-foreground">
                                {photo.timestamp.toLocaleString()}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>
            </TabsContent>
          </div>

          {/* Phase Completion Footer */}
          <div className="border-t bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Progress: {Math.round(progress)}%</span>
                <span className="text-muted-foreground ml-2">
                  ({['bms', 'discovery', 'photos'].filter(validateSection).length} of 3 sections completed)
                </span>
              </div>
              <Button
                onClick={handlePhaseComplete}
                disabled={!canCompletePhase()}
                className="gap-2"
              >
                Complete System Discovery
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {!canCompletePhase() && (
              <Alert className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Complete BMS overview and system discovery to proceed to Service Activities.
                  {!validateSection('bms') && ' Fill in BMS platform and supervisor location.'}
                  {!validateSection('discovery') && ' Process Tridium exports or enter manual inventory.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};
