import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CheckCircle2,
  AlertTriangle,
  X,
  Eye,
  FileText,
  Database,
  Network,
  HardDrive,
  Cpu,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { TridiumExportProcessor } from '@/services/TridiumExportProcessor';
import { LiveCSVPreview } from './LiveCSVPreview';
import { PlatformTextPreview } from './PlatformTextPreview';

interface FileValidationPreviewProps {
  file: File;
  onAccept: (data?: any) => void;
  onReject: () => void;
  onClose: () => void;
}

interface ValidationResult {
  type: 'n2' | 'bacnet' | 'resource' | 'platform' | 'network' | 'unknown';
  confidence: number;
  warnings: string[];
  preview: any;
  parsedData?: any; // Add actual parsed data
}

export const FileValidationPreview: React.FC<FileValidationPreviewProps> = ({
  file,
  onAccept,
  onReject,
  onClose
}) => {
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(false);
  const [showPlatformPreview, setShowPlatformPreview] = useState(false);
  const [parsedData, setParsedData] = useState<any>(null);

  useEffect(() => {
    async function validateFile() {
      try {
        setIsLoading(true);
        const fileContent = await file.text();
        setContent(fileContent);

        const result = TridiumExportProcessor.detectFileFormat(file.name, fileContent);
        setValidationResult(result);

        // For CSV files, show live preview automatically if confidence is high
        if (file.name.endsWith('.csv') && result.confidence >= 60) {
          setShowLivePreview(true);
        }

        // For platform text files, show platform preview automatically if confidence is high
        if (result.type === 'platform' && !file.name.endsWith('.csv') && result.confidence >= 60) {
          setShowPlatformPreview(true);
        }
      } catch (error) {
        console.error('File validation error:', error);
        setValidationResult({
          type: 'unknown',
          confidence: 0,
          warnings: [`Failed to read file: ${error instanceof Error ? error.message : 'Unknown error'}`],
          preview: null
        });
      } finally {
        setIsLoading(false);
      }
    }

    validateFile();
  }, [file]);

  // Parse file using TridiumExportProcessor
  const parseFileWithEnhancedAnalysis = async () => {
    try {
      if (!validationResult) return null;

      const fileContent = await file.text();

      // Use TridiumExportProcessor for all file types
      switch (validationResult.type) {
        case 'n2':
          return TridiumExportProcessor.parseN2Export(fileContent);
        case 'bacnet':
          return TridiumExportProcessor.parseBACnetExport(fileContent);
        case 'resource':
          return TridiumExportProcessor.parseResourceExport(fileContent);
        case 'platform':
          return TridiumExportProcessor.parsePlatformDetails(fileContent);
        case 'network':
          return TridiumExportProcessor.parseNiagaraNetworkExport(fileContent);
        default:
          return null;
      }
    } catch (error) {
      console.error('Parsing failed:', error);
      return null;
    }
  };

  const getFileTypeIcon = (type: string) => {
    switch (type) {
      case 'n2': return <Network className="h-5 w-5" />;
      case 'bacnet': return <Database className="h-5 w-5" />;
      case 'resource': return <HardDrive className="h-5 w-5" />;
      case 'platform': return <Cpu className="h-5 w-5" />;
      case 'network': return <Network className="h-5 w-5" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  const getFileTypeLabel = (type: string) => {
    switch (type) {
      case 'n2': return 'N2 Export';
      case 'bacnet': return 'BACnet Export';
      case 'resource': return 'Resource Export';
      case 'platform': return 'Platform Details';
      case 'network': return 'Network Export';
      default: return 'Unknown Format';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const renderParsedDataPreview = (parsedData: any, type: string) => {
    if (!parsedData) return null;

    switch (type) {
      case 'n2':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-sm mb-2">Summary Statistics:</h5>
                <div className="space-y-1 text-sm">
                  <div>Total Devices: <Badge variant="outline">{parsedData.summary.total}</Badge></div>
                  <div>OK: <Badge className="bg-green-100 text-green-800">{parsedData.summary.ok}</Badge></div>
                  <div>Faulty: <Badge className="bg-red-100 text-red-800">{parsedData.summary.faulty}</Badge></div>
                  <div>Down: <Badge className="bg-orange-100 text-orange-800">{parsedData.summary.down}</Badge></div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-sm mb-2">Device Types:</h5>
                <div className="space-y-1 text-sm">
                  {Object.entries(parsedData.summary.byType).slice(0, 5).map(([type, count]) => (
                    <div key={type}>{type}: <Badge variant="outline">{count as number}</Badge></div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-sm mb-2">Sample Parsed Devices:</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left border">Name</th>
                      <th className="p-2 text-left border">Status</th>
                      <th className="p-2 text-left border">Address</th>
                      <th className="p-2 text-left border">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.devices.slice(0, 5).map((device: any, idx: number) => (
                      <tr key={idx} className="border">
                        <td className="p-2 border font-mono">{device.name}</td>
                        <td className="p-2 border">
                          {device.status.map((s: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs mr-1">
                              {s}
                            </Badge>
                          ))}
                        </td>
                        <td className="p-2 border">{device.address}</td>
                        <td className="p-2 border">{device.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'bacnet':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-sm mb-2">Summary Statistics:</h5>
                <div className="space-y-1 text-sm">
                  <div>Total Devices: <Badge variant="outline">{parsedData.summary.total}</Badge></div>
                  <div>Healthy: <Badge className="bg-green-100 text-green-800">{parsedData.summary.healthyPercentage}%</Badge></div>
                  <div>Unacked Alarms: <Badge className="bg-yellow-100 text-yellow-800">{parsedData.summary.unackedAlarm}</Badge></div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-sm mb-2">Vendors:</h5>
                <div className="space-y-1 text-sm">
                  {Object.entries(parsedData.summary.byVendor).slice(0, 5).map(([vendor, count]) => (
                    <div key={vendor}>{vendor}: <Badge variant="outline">{count as number}</Badge></div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-sm mb-2">Sample Parsed Devices:</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left border">Name</th>
                      <th className="p-2 text-left border">Device ID</th>
                      <th className="p-2 text-left border">Vendor</th>
                      <th className="p-2 text-left border">Model</th>
                      <th className="p-2 text-left border">Health</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.devices.slice(0, 5).map((device: any, idx: number) => (
                      <tr key={idx} className="border">
                        <td className="p-2 border font-mono">{device.name}</td>
                        <td className="p-2 border">{device.id}</td>
                        <td className="p-2 border">
                          <Badge variant="outline">{device.vendor}</Badge>
                        </td>
                        <td className="p-2 border">{device.model}</td>
                        <td className="p-2 border text-xs">{device.health}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'resource':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <h5 className="font-medium text-sm mb-2">CPU & Memory:</h5>
                <div className="space-y-1 text-sm">
                  <div>CPU Usage: <Badge variant="outline">{parsedData.metrics.cpu.usage}%</Badge></div>
                  <div>Heap Used: <Badge variant="outline">{parsedData.metrics.heap.used} MB</Badge></div>
                  <div>Memory Used: <Badge variant="outline">{parsedData.metrics.memory.used} MB</Badge></div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-sm mb-2">Capacities:</h5>
                <div className="space-y-1 text-sm">
                  <div>Points: <Badge variant="outline">{parsedData.metrics.capacities.points.current}/{parsedData.metrics.capacities.points.limit}</Badge></div>
                  <div>Devices: <Badge variant="outline">{parsedData.metrics.capacities.devices.current}/{parsedData.metrics.capacities.devices.limit}</Badge></div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-sm mb-2">System Info:</h5>
                <div className="space-y-1 text-sm">
                  <div>Uptime: <Badge variant="outline">{parsedData.metrics.uptime}</Badge></div>
                  <div>Niagara: <Badge variant="outline">{parsedData.metrics.versions.niagara}</Badge></div>
                </div>
              </div>
            </div>
            {parsedData.warnings.length > 0 && (
              <div>
                <h5 className="font-medium text-sm mb-2">Performance Warnings:</h5>
                <div className="space-y-1">
                  {parsedData.warnings.map((warning: any, idx: number) => (
                    <Badge key={idx} className="bg-yellow-100 text-yellow-800 mr-2 mb-1">
                      {typeof warning === 'string' ? warning : (warning?.message || JSON.stringify(warning))}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      case 'platform':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-sm mb-2">Platform Summary:</h5>
                <div className="space-y-1 text-sm">
                  <div>Model: <Badge variant="outline">{parsedData.summary.model}</Badge></div>
                  <div>Product: <Badge variant="outline">{parsedData.summary.product}</Badge></div>
                  <div>Niagara: <Badge variant="outline">{parsedData.summary.daemonVersion}</Badge></div>
                  <div>CPUs: <Badge variant="outline">{parsedData.summary.cpuCount}</Badge></div>
                  <div>RAM: <Badge variant="outline">{parsedData.summary.ramTotal} KB</Badge></div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-sm mb-2">Components Found:</h5>
                <div className="space-y-1 text-sm">
                  <div>Modules: <Badge variant="outline">{parsedData.modules.length}</Badge></div>
                  <div>Licenses: <Badge variant="outline">{parsedData.licenses.length}</Badge></div>
                  <div>Applications: <Badge variant="outline">{parsedData.applications.length}</Badge></div>
                  <div>Filesystems: <Badge variant="outline">{parsedData.filesystems.length}</Badge></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'network':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-sm mb-2">Network Summary:</h5>
                <div className="space-y-1 text-sm">
                  <div>Total Nodes: <Badge variant="outline">{parsedData.summary.total}</Badge></div>
                  <div>Connected: <Badge className="bg-green-100 text-green-800">{parsedData.summary.connected}</Badge></div>
                  <div>Disconnected: <Badge className="bg-red-100 text-red-800">{parsedData.summary.disconnected}</Badge></div>
                  <div>With Alarms: <Badge className="bg-yellow-100 text-yellow-800">{parsedData.summary.withAlarms}</Badge></div>
                </div>
              </div>
              <div>
                <h5 className="font-medium text-sm mb-2">Host Models:</h5>
                <div className="space-y-1 text-sm">
                  {Object.entries(parsedData.summary.byModel).slice(0, 5).map(([model, count]) => (
                    <div key={model}>{model}: <Badge variant="outline">{count as number}</Badge></div>
                  ))}
                </div>
              </div>
            </div>
            <div>
              <h5 className="font-medium text-sm mb-2">Sample Network Nodes:</h5>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-2 text-left border">Name</th>
                      <th className="p-2 text-left border">IP</th>
                      <th className="p-2 text-left border">Model</th>
                      <th className="p-2 text-left border">Version</th>
                      <th className="p-2 text-left border">Connected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.network.nodes.slice(0, 5).map((node: any, idx: number) => (
                      <tr key={idx} className="border">
                        <td className="p-2 border font-mono">{node.name}</td>
                        <td className="p-2 border">{node.ip}</td>
                        <td className="p-2 border">{node.hostModel}</td>
                        <td className="p-2 border">{node.version}</td>
                        <td className="p-2 border">
                          <Badge className={node.connected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {node.connected ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderPreviewData = (preview: any, type: string) => {
    if (!preview) return null;

    switch (type) {
      case 'n2':
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Sample Devices:</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Name</th>
                    <th className="text-left p-1">Status</th>
                    <th className="text-left p-1">Address</th>
                    <th className="text-left p-1">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1, 6).map((row: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="p-1 font-mono">{row.name}</td>
                      <td className="p-1">
                        <Badge variant="outline" className="text-xs">
                          {row.status}
                        </Badge>
                      </td>
                      <td className="p-1">{row.address}</td>
                      <td className="p-1">{row.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'bacnet':
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Sample Devices:</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Name</th>
                    <th className="text-left p-1">Device ID</th>
                    <th className="text-left p-1">Status</th>
                    <th className="text-left p-1">Vendor</th>
                    <th className="text-left p-1">Health</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1, 6).map((row: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="p-1 font-mono">{row.name}</td>
                      <td className="p-1">{row.deviceId}</td>
                      <td className="p-1">
                        <Badge variant="outline" className="text-xs">
                          {row.status}
                        </Badge>
                      </td>
                      <td className="p-1">{row.vendor}</td>
                      <td className="p-1 text-xs">{row.health}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'resource':
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Sample Metrics:</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Metric</th>
                    <th className="text-left p-1">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1, 8).map((row: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="p-1 font-mono text-xs">{row.name}</td>
                      <td className="p-1">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      case 'platform':
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">File Structure:</h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <Badge variant={preview.hasPlatformSummary ? 'default' : 'secondary'} className="text-xs">
                  {preview.hasPlatformSummary ? '✓' : '✗'} Platform Summary
                </Badge>
              </div>
              <div>
                <Badge variant={preview.hasHostId ? 'default' : 'secondary'} className="text-xs">
                  {preview.hasHostId ? '✓' : '✗'} Host ID
                </Badge>
              </div>
              <div>
                <Badge variant={preview.hasNiagaraRuntime ? 'default' : 'secondary'} className="text-xs">
                  {preview.hasNiagaraRuntime ? '✓' : '✗'} Niagara Runtime
                </Badge>
              </div>
              <div>
                <Badge variant={preview.hasTlsSupport ? 'default' : 'secondary'} className="text-xs">
                  {preview.hasTlsSupport ? '✓' : '✗'} TLS Config
                </Badge>
              </div>
              <div>
                <Badge variant={preview.hasSystemPaths ? 'default' : 'secondary'} className="text-xs">
                  {preview.hasSystemPaths ? '✓' : '✗'} System Paths
                </Badge>
              </div>
              <div>
                <Badge variant={preview.hasModulesSection ? 'default' : 'secondary'} className="text-xs">
                  {preview.hasModulesSection ? '✓' : '✗'} Modules
                </Badge>
              </div>
              <div>
                <Badge variant={preview.hasFilesystemInfo ? 'default' : 'secondary'} className="text-xs">
                  {preview.hasFilesystemInfo ? '✓' : '✗'} Filesystem
                </Badge>
              </div>
              <div>
                <span className="text-sm">Lines: {preview.lineCount}</span>
              </div>
            </div>
          </div>
        );

      case 'network':
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Sample Network Nodes:</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-1">Path</th>
                    <th className="text-left p-1">Name</th>
                    <th className="text-left p-1">Address</th>
                    <th className="text-left p-1">Host Model</th>
                    <th className="text-left p-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(1, 6).map((row: any, idx: number) => (
                    <tr key={idx} className="border-b">
                      <td className="p-1 font-mono text-xs">{row.path}</td>
                      <td className="p-1">{row.name}</td>
                      <td className="p-1">{row.address}</td>
                      <td className="p-1">{row.hostModel}</td>
                      <td className="p-1">
                        <Badge variant="outline" className="text-xs">
                          {row.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Raw Content Preview:</h4>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-x-auto">
              {content.split('\n').slice(0, 10).join('\n')}
            </pre>
          </div>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-96">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Validating file...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show live CSV preview if requested
  if (showLivePreview && validationResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-7xl max-h-[95vh] overflow-y-auto bg-white rounded-lg">
          <div className="p-4">
            <LiveCSVPreview
              file={file}
              onDataReady={(data) => {
                setParsedData(data);
                onAccept(data);
              }}
              onCancel={() => {
                setShowLivePreview(false);
                onReject();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Show platform text preview if requested
  if (showPlatformPreview && validationResult) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-7xl max-h-[95vh] overflow-y-auto bg-white rounded-lg">
          <div className="p-4">
            <PlatformTextPreview
              file={file}
              onDataReady={(data) => {
                setParsedData(data);
                onAccept(data);
              }}
              onCancel={() => {
                setShowPlatformPreview(false);
                onReject();
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {validationResult && getFileTypeIcon(validationResult.type)}
              <div>
                <CardTitle className="text-lg">File Validation Preview</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{file.name}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {validationResult && (
            <>
              {/* Detection Results */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="text-sm">
                      {getFileTypeLabel(validationResult.type)}
                    </Badge>
                    <Badge
                      className={`text-sm ${getConfidenceColor(validationResult.confidence)}`}
                    >
                      {validationResult.confidence}% confidence
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </div>
                </div>

                {/* Warnings */}
                {validationResult.warnings.length > 0 && (
                  <Alert className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription>
                      <div className="space-y-1">
                        <p className="font-medium text-yellow-800">Validation Warnings:</p>
                        <ul className="list-disc list-inside text-sm text-yellow-700">
                          {validationResult.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Success indicator */}
                {validationResult.confidence >= 80 && validationResult.warnings.length === 0 && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      File format detected successfully with high confidence!
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Data Preview */}
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm">Data Preview</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? (
                      <>
                        <ChevronDown className="h-4 w-4 mr-1" />
                        Hide Preview
                      </>
                    ) : (
                      <>
                        <ChevronRight className="h-4 w-4 mr-1" />
                        Show Preview
                      </>
                    )}
                  </Button>
                </div>

                {showPreview && (
                  <div className="border-t pt-4">
                    <Tabs defaultValue={validationResult.parsedData ? "parsed" : "raw"} className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        {validationResult.parsedData && (
                          <TabsTrigger value="parsed">📊 Parsed Data Structure</TabsTrigger>
                        )}
                        <TabsTrigger value="raw">📋 Raw File Preview</TabsTrigger>
                      </TabsList>

                      {validationResult.parsedData && (
                        <TabsContent value="parsed" className="mt-4">
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h4 className="font-medium text-blue-900 mb-2">
                              📈 This is how your data will be imported and processed:
                            </h4>
                            <p className="text-sm text-blue-700">
                              The system has successfully parsed your file and extracted structured data.
                              Review the statistics, device counts, and sample data below to verify accuracy.
                            </p>
                          </div>
                          {renderParsedDataPreview(validationResult.parsedData, validationResult.type)}
                        </TabsContent>
                      )}

                      <TabsContent value="raw" className="mt-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                          <h4 className="font-medium text-gray-900 mb-2">
                            📄 Raw file content preview:
                          </h4>
                          <p className="text-sm text-gray-600">
                            This shows the first few rows of your original file as detected by the system.
                          </p>
                        </div>
                        {renderPreviewData(validationResult.preview, validationResult.type)}
                      </TabsContent>
                    </Tabs>
                  </div>
                )}
              </div>

              {/* Recommendations */}
              {validationResult.confidence < 80 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-medium">Recommendations:</p>
                      <ul className="list-disc list-inside text-sm">
                        <li>Verify the file format matches the expected Tridium export type</li>
                        <li>Check if the file was exported correctly from the Niagara system</li>
                        <li>Ensure the file is not truncated or corrupted</li>
                        {validationResult.type === 'unknown' && (
                          <li>Try renaming the file to include the export type (e.g., "_N2Export.csv")</li>
                        )}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onReject}>
              <X className="h-4 w-4 mr-2" />
              Reject File
            </Button>

            {/* Primary Accept Button - goes through proper preview flow */}
            {validationResult && validationResult.confidence >= 60 && (
              <>
                {file.name.endsWith('.csv') ? (
                  <Button onClick={() => setShowLivePreview(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview & Import Data
                  </Button>
                ) : validationResult.type === 'platform' ? (
                  <Button onClick={() => setShowPlatformPreview(true)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Preview & Import Platform Data
                  </Button>
                ) : (
                  <Button
                    onClick={async () => {
                      const parsedData = await parseFileWithEnhancedAnalysis();
                      onAccept(parsedData);
                    }}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                )}
              </>
            )}

            {/* Quick Accept for low confidence or emergency */}
            {validationResult && validationResult.confidence < 60 && validationResult.confidence >= 20 && (
              <Button
                variant="outline"
                onClick={async () => {
                  const parsedData = await parseFileWithEnhancedAnalysis();
                  onAccept(parsedData);
                }}
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Force Import (Low Confidence)
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};