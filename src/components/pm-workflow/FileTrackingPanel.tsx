import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  FileText,
  HardDrive,
  Network,
  Database,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Trash2,
  Upload,
  Search,
  Filter,
  ChevronRight,
  Server,
  Cpu,
  Clock
} from 'lucide-react';
import type { EditableSystemData } from './TridiumDataManager';

interface FileMapping {
  file: File;
  nodeId: string;
  nodePath: string[];
  status: 'uploaded' | 'processed' | 'error';
  lastModified: number;
  parseResults?: {
    recordsFound: number;
    dataExtracted: any;
    warnings: string[];
    errors: string[];
  };
  targetLocation: {
    jaceId?: string;
    jaceName?: string;
    networkType?: string;
    dataType: 'platform' | 'resource' | 'network' | 'bacnet' | 'n2';
  };
}

interface FileTrackingPanelProps {
  systemData: EditableSystemData;
  onFileRemove: (fileId: string) => void;
  onFileReplace: (fileId: string, newFile: File) => void;
  onReprocess: () => void;
}

export const FileTrackingPanel: React.FC<FileTrackingPanelProps> = ({
  systemData,
  onFileRemove,
  onFileReplace,
  onReprocess
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'processed' | 'error'>('all');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Generate file mappings from system data
  const fileMappings = useMemo((): FileMapping[] => {
    const mappings: FileMapping[] = [];

    // Map processed files to their locations in the system
    systemData.processedFiles.forEach((fileName, index) => {
      const fileId = `file-${index}`;
      const lower = fileName.toLowerCase();

      // Determine file type and target location
      let targetLocation: FileMapping['targetLocation'];
      let nodePath: string[] = [];

      if (lower.includes('supervisor') && lower.includes('platform')) {
        targetLocation = { dataType: 'platform' };
        nodePath = ['Supervisor', 'Platform Details'];
      } else if (lower.includes('supervisor') && lower.includes('resource')) {
        targetLocation = { dataType: 'resource' };
        nodePath = ['Supervisor', 'Resource Export'];
      } else if (lower.includes('supervisor') && lower.includes('niagara')) {
        targetLocation = { dataType: 'network' };
        nodePath = ['Supervisor', 'Niagara Network', 'Network Export'];
      } else if (lower.includes('platform')) {
        // JACE platform file
        const jaceId = Object.keys(systemData.jaces || {})[0];
        const jace = systemData.jaces?.[jaceId];
        targetLocation = {
          dataType: 'platform',
          jaceId,
          jaceName: jace?.platform?.hostName || 'JACE'
        };
        nodePath = [targetLocation.jaceName, 'Platform Details'];
      } else if (lower.includes('resource')) {
        // JACE resource file
        const jaceId = Object.keys(systemData.jaces || {})[0];
        const jace = systemData.jaces?.[jaceId];
        targetLocation = {
          dataType: 'resource',
          jaceId,
          jaceName: jace?.platform?.hostName || 'JACE'
        };
        nodePath = [targetLocation.jaceName, 'Resource Export'];
      } else if (lower.includes('bacnet')) {
        // BACnet device file
        const jaceId = Object.keys(systemData.jaces || {})[0];
        const jace = systemData.jaces?.[jaceId];
        targetLocation = {
          dataType: 'bacnet',
          jaceId,
          jaceName: jace?.platform?.hostName || 'JACE',
          networkType: 'BACnet'
        };
        nodePath = [targetLocation.jaceName, 'Drivers', 'BACnet Export'];
      } else if (lower.includes('n2')) {
        // N2 device file
        const jaceId = Object.keys(systemData.jaces || {})[0];
        const jace = systemData.jaces?.[jaceId];
        targetLocation = {
          dataType: 'n2',
          jaceId,
          jaceName: jace?.platform?.hostName || 'JACE',
          networkType: 'N2'
        };
        nodePath = [targetLocation.jaceName, 'Drivers', 'N2 Export'];
      } else {
        targetLocation = { dataType: 'platform' };
        nodePath = ['Unknown Location'];
      }

      // Generate parse results based on file type and system data
      let parseResults: FileMapping['parseResults'] | undefined;
      let status: FileMapping['status'] = 'processed';

      if (targetLocation.dataType === 'bacnet' || targetLocation.dataType === 'n2') {
        const jace = targetLocation.jaceId ? systemData.jaces?.[targetLocation.jaceId] : null;
        const devices = jace?.devices?.filter(d => d.network === targetLocation.networkType) || [];
        parseResults = {
          recordsFound: devices.length,
          dataExtracted: {
            devices: devices.length,
            online: devices.filter(d => d.status === 'online').length,
            offline: devices.filter(d => d.status === 'offline').length,
            vendors: [...new Set(devices.map(d => d.vendor))].length
          },
          warnings: devices.length === 0 ? ['No devices found in file'] : [],
          errors: []
        };
      } else if (targetLocation.dataType === 'platform') {
        const jace = targetLocation.jaceId ? systemData.jaces?.[targetLocation.jaceId] : systemData.supervisor;
        parseResults = {
          recordsFound: 1,
          dataExtracted: {
            hostName: jace?.platform?.hostName || 'Unknown',
            niagaraVersion: jace?.platform?.niagaraVersion || 'Unknown',
            modules: jace?.platform?.modules?.length || 0,
            licenses: jace?.platform?.licenses?.length || 0
          },
          warnings: [],
          errors: []
        };
      } else if (targetLocation.dataType === 'resource') {
        const jace = targetLocation.jaceId ? systemData.jaces?.[targetLocation.jaceId] : null;
        parseResults = {
          recordsFound: 1,
          dataExtracted: {
            cpuUsage: jace?.resources?.cpuUsage || 0,
            memoryUsage: jace?.resources?.memoryUsage || 0,
            diskUsage: jace?.resources?.diskUsage || 0,
            uptime: jace?.resources?.uptime || 'Unknown'
          },
          warnings: [],
          errors: []
        };
      }

      // Check for errors
      const hasErrors = systemData.errors.some(error => error.includes(fileName));
      if (hasErrors) {
        status = 'error';
        if (parseResults) {
          parseResults.errors = systemData.errors.filter(error => error.includes(fileName));
        }
      }

      mappings.push({
        file: new File([], fileName), // Placeholder file object
        nodeId: fileId,
        nodePath,
        status,
        lastModified: Date.now() - (index * 60000), // Simulate upload times
        parseResults,
        targetLocation
      });
    });

    return mappings;
  }, [systemData]);

  const filteredMappings = useMemo(() => {
    return fileMappings.filter(mapping => {
      const matchesSearch = mapping.file.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           mapping.nodePath.join(' ').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || mapping.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [fileMappings, searchTerm, filterStatus]);

  const getFileIcon = (dataType: string) => {
    switch (dataType) {
      case 'platform': return FileText;
      case 'resource': return HardDrive;
      case 'network': return Network;
      case 'bacnet':
      case 'n2': return Database;
      default: return FileText;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed': return 'text-green-600 bg-green-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'uploaded': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processed': return CheckCircle2;
      case 'error': return AlertTriangle;
      case 'uploaded': return Upload;
      default: return AlertCircle;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">File Tracking & Verification</h3>
          <p className="text-sm text-gray-600">
            Track uploaded files, their processing status, and system hierarchy placement
          </p>
        </div>
        <Button onClick={onReprocess} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Reprocess All
        </Button>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search files by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All ({fileMappings.length})
          </Button>
          <Button
            variant={filterStatus === 'processed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('processed')}
          >
            Processed ({fileMappings.filter(f => f.status === 'processed').length})
          </Button>
          <Button
            variant={filterStatus === 'error' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('error')}
          >
            Errors ({fileMappings.filter(f => f.status === 'error').length})
          </Button>
        </div>
      </div>

      {/* File List */}
      <div className="space-y-3">
        {filteredMappings.map((mapping) => {
          const FileIcon = getFileIcon(mapping.targetLocation.dataType);
          const StatusIcon = getStatusIcon(mapping.status);
          const isSelected = selectedFile === mapping.nodeId;

          return (
            <Card
              key={mapping.nodeId}
              className={`cursor-pointer transition-colors ${
                isSelected ? 'ring-2 ring-blue-500' : 'hover:bg-gray-50'
              }`}
              onClick={() => setSelectedFile(isSelected ? null : mapping.nodeId)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* File Icon and Basic Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <FileIcon className="h-5 w-5 text-gray-600" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{mapping.file.name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(mapping.lastModified).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs ${getStatusColor(mapping.status)}`}>
                      <StatusIcon className="h-3 w-3" />
                      {mapping.status}
                    </div>
                  </div>

                  {/* Location Path */}
                  <div className="flex items-center gap-1 text-sm text-gray-600 min-w-0">
                    {mapping.nodePath.map((segment, idx) => (
                      <React.Fragment key={idx}>
                        {idx > 0 && <ChevronRight className="h-3 w-3" />}
                        <span className="truncate">{segment}</span>
                      </React.Fragment>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Trigger file replace
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = '.txt,.csv';
                        input.onchange = (event) => {
                          const target = event.target as HTMLInputElement;
                          if (target.files?.[0]) {
                            onFileReplace(mapping.nodeId, target.files[0]);
                          }
                        };
                        input.click();
                      }}
                      title="Replace file"
                    >
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        onFileRemove(mapping.nodeId);
                      }}
                      title="Remove file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isSelected && mapping.parseResults && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {mapping.parseResults.recordsFound}
                        </div>
                        <div className="text-xs text-gray-600">Records Found</div>
                      </div>

                      {mapping.targetLocation.dataType === 'bacnet' || mapping.targetLocation.dataType === 'n2' ? (
                        <>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {mapping.parseResults.dataExtracted.online || 0}
                            </div>
                            <div className="text-xs text-gray-600">Online Devices</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">
                              {mapping.parseResults.dataExtracted.offline || 0}
                            </div>
                            <div className="text-xs text-gray-600">Offline Devices</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {mapping.parseResults.dataExtracted.vendors || 0}
                            </div>
                            <div className="text-xs text-gray-600">Vendors</div>
                          </div>
                        </>
                      ) : mapping.targetLocation.dataType === 'platform' ? (
                        <>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-800">
                              {mapping.parseResults.dataExtracted.niagaraVersion}
                            </div>
                            <div className="text-xs text-gray-600">Niagara Version</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                              {mapping.parseResults.dataExtracted.modules || 0}
                            </div>
                            <div className="text-xs text-gray-600">Modules</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                              {mapping.parseResults.dataExtracted.licenses || 0}
                            </div>
                            <div className="text-xs text-gray-600">Licenses</div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">
                              {mapping.parseResults.dataExtracted.cpuUsage || 0}%
                            </div>
                            <div className="text-xs text-gray-600">CPU Usage</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                              {mapping.parseResults.dataExtracted.memoryUsage || 0}%
                            </div>
                            <div className="text-xs text-gray-600">Memory Usage</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-medium text-gray-800">
                              {mapping.parseResults.dataExtracted.uptime || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-600">Uptime</div>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Warnings and Errors */}
                    {(mapping.parseResults.warnings.length > 0 || mapping.parseResults.errors.length > 0) && (
                      <div className="space-y-2">
                        {mapping.parseResults.warnings.map((warning, idx) => (
                          <Alert key={idx} className="border-amber-200">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-800">
                              {warning}
                            </AlertDescription>
                          </Alert>
                        ))}
                        {mapping.parseResults.errors.map((error, idx) => (
                          <Alert key={idx} className="border-red-200">
                            <AlertCircle className="h-4 w-4 text-red-600" />
                            <AlertDescription className="text-red-800">
                              {error}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}

                    {/* Target Location Details */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <h5 className="font-medium mb-2">Location in System Hierarchy</h5>
                      <div className="flex items-center gap-2 text-sm">
                        {mapping.targetLocation.jaceId ? (
                          <>
                            <Cpu className="h-4 w-4 text-gray-600" />
                            <span>{mapping.targetLocation.jaceName}</span>
                            <ChevronRight className="h-3 w-3 text-gray-400" />
                          </>
                        ) : (
                          <>
                            <Server className="h-4 w-4 text-gray-600" />
                            <span>Supervisor</span>
                            <ChevronRight className="h-3 w-3 text-gray-400" />
                          </>
                        )}
                        <FileIcon className="h-4 w-4 text-gray-600" />
                        <span className="capitalize">{mapping.targetLocation.dataType} Data</span>
                        {mapping.targetLocation.networkType && (
                          <>
                            <ChevronRight className="h-3 w-3 text-gray-400" />
                            <Network className="h-4 w-4 text-gray-600" />
                            <span>{mapping.targetLocation.networkType} Network</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Summary */}
      {filteredMappings.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-600">No files found</p>
          <p className="text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria' : 'Upload files to see them tracked here'}
          </p>
        </div>
      )}
    </div>
  );
};