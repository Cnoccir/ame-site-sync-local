// Enhanced Network Analysis Component - Restores sophisticated topology analysis
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Network,
  BarChart3,
  Database,
  Activity
} from 'lucide-react';
import { NetworkTopologyService } from '@/services/networkTopologyService';

interface FileUpload {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  type?: string;
  error?: string;
}

interface NetworkAnalysisProps {
  onAnalysisComplete?: (topology: any) => void;
}

export const NetworkAnalysis: React.FC<NetworkAnalysisProps> = ({ onAnalysisComplete }) => {
  const [uploads, setUploads] = useState<FileUpload[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [topology, setTopology] = useState<any>(null);
  const [dragActive, setDragActive] = useState(false);

  // Handle multiple file uploads
  const handleFiles = useCallback((files: FileList) => {
    const newUploads: FileUpload[] = Array.from(files).map(file => ({
      file,
      id: `${file.name}-${Date.now()}`,
      status: 'pending' as const,
      type: detectFileType(file.name)
    }));

    setUploads(prev => [...prev, ...newUploads]);
  }, []);

  // Detect file type from name  
  const detectFileType = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (lower.includes('resource')) return 'Resource Export';
    if (lower.includes('bacnet')) return 'BACnet Export'; 
    if (lower.includes('n2')) return 'N2 Export';
    if (lower.includes('platform')) return 'Platform Details';
    if (lower.includes('niagara') || lower.includes('net')) return 'Network Topology';
    return 'Tridium Export';
  };

  // Process all uploaded files using sophisticated NetworkTopologyService
  const processUploads = async () => {
    if (uploads.length === 0) return;

    setIsProcessing(true);
    const datasets: any[] = [];

    // Process each file
    for (const upload of uploads) {
      try {
        setUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, status: 'processing' } : u
        ));

        // Parse CSV file into dataset
        const dataset = await parseFileToDataset(upload.file);
        if (dataset) {
          datasets.push(dataset);
          
          setUploads(prev => prev.map(u => 
            u.id === upload.id ? { ...u, status: 'completed' } : u
          ));
        }
      } catch (error) {
        setUploads(prev => prev.map(u => 
          u.id === upload.id ? { 
            ...u, 
            status: 'error', 
            error: error instanceof Error ? error.message : 'Processing failed'
          } : u
        ));
      }
    }

    // Build sophisticated network topology
    if (datasets.length > 0) {
      try {
        const networkTopology = NetworkTopologyService.buildTopology(datasets);
        setTopology(networkTopology);
        onAnalysisComplete?.(networkTopology);
      } catch (error) {
        console.error('Failed to build network topology:', error);
      }
    }

    setIsProcessing(false);
  };

  // Parse CSV file into dataset format
  const parseFileToDataset = async (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csvText = e.target?.result as string;
          const lines = csvText.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          const rows = lines.slice(1)
            .filter(line => line.trim())
            .map((line, index) => {
              const values = line.split(',').map(v => v.trim());
              const data: Record<string, string> = {};
              headers.forEach((header, i) => {
                data[header] = values[i] || '';
              });
              return {
                id: `row-${index}`,
                data,
                parsedStatus: parseDeviceStatus(data)
              };
            });

          resolve({
            id: `dataset-${Date.now()}`,
            filename: file.name,
            format: detectDatasetFormat(file.name),
            category: 'device',
            rows,
            timestamp: new Date(),
            metadata: {
              fileSize: file.size,
              lastModified: new Date(file.lastModified)
            }
          });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const detectDatasetFormat = (filename: string): string => {
    const lower = filename.toLowerCase();
    if (lower.includes('niagara') || lower.includes('net')) return 'NiagaraNetExport';
    if (lower.includes('bacnet')) return 'BACnetExport';
    if (lower.includes('resource')) return 'ResourceExport';
    if (lower.includes('platform')) return 'PlatformDetails';
    return 'Unknown';
  };

  const parseDeviceStatus = (data: Record<string, string>) => {
    const statusText = data.Status || data.status || '';
    const health = statusText.toLowerCase();
    
    if (health.includes('ok') || health.includes('online')) {
      return { level: 'healthy', text: 'Online', color: 'green' };
    }
    if (health.includes('down') || health.includes('offline')) {
      return { level: 'offline', text: 'Offline', color: 'red' };
    }
    if (health.includes('alarm') || health.includes('fault')) {
      return { level: 'degraded', text: 'Alarm', color: 'yellow' };
    }
    return { level: 'unknown', text: 'Unknown', color: 'gray' };
  };

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <Activity className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4 text-gray-400" />;
    }
  };

  const completedUploads = uploads.filter(u => u.status === 'completed').length;
  const progress = uploads.length > 0 ? (completedUploads / uploads.length) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Network className="w-5 h-5 text-blue-600" />
            <span>Network Analysis - Multiple Tridium Exports</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Drag and Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDragEnter}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload Multiple Tridium Export Files
            </h3>
            <p className="text-gray-600 mb-4">
              ResourceExport, BACnetExport, N2Export, PlatformDetails, NiagaraNetExport
            </p>
            <input
              type="file"
              multiple
              accept=".csv,.txt"
              onChange={(e) => e.target.files && handleFiles(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="outline" className="cursor-pointer">
                Select Multiple Files
              </Button>
            </label>
          </div>

          {/* File List */}
          {uploads.length > 0 && (
            <div className="mt-6 space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Uploaded Files ({uploads.length})</h4>
                <Button 
                  onClick={processUploads}
                  disabled={isProcessing || uploads.every(u => u.status === 'completed')}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isProcessing ? 'Building Topology...' : 'Analyze Network'}
                </Button>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-gray-600">
                    Processing {completedUploads} of {uploads.length} files...
                  </p>
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploads.map((upload) => (
                  <div key={upload.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(upload.status)}
                      <div>
                        <p className="font-medium text-sm">{upload.file.name}</p>
                        <p className="text-xs text-gray-600">{upload.type}</p>
                      </div>
                    </div>
                    <Badge variant={
                      upload.status === 'completed' ? 'default' :
                      upload.status === 'error' ? 'destructive' : 'secondary'
                    }>
                      {upload.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Network Topology Results */}
      {topology && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-green-600" />
              <span>Network Topology Analysis</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{topology.totalDevices || 0}</div>
                <div className="text-sm text-gray-600">Total Devices</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{topology.healthSummary?.healthy || 0}</div>
                <div className="text-sm text-gray-600">Online</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{topology.healthSummary?.offline || 0}</div>
                <div className="text-sm text-gray-600">Offline</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{topology.healthSummary?.degraded || 0}</div>
                <div className="text-sm text-gray-600">Issues</div>
              </div>
            </div>

            {/* Protocol Breakdown */}
            {topology.protocolBreakdown && (
              <div className="mb-4">
                <h4 className="font-medium mb-2">Protocol Distribution</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(topology.protocolBreakdown).map(([protocol, count]) => (
                    <Badge key={protocol} variant="outline">
                      {protocol}: {count as number}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Alert>
              <Database className="h-4 w-4" />
              <AlertDescription>
                Sophisticated network topology analysis complete. Hierarchical device relationships mapped 
                with advanced health aggregation across {topology.totalDevices} devices.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
