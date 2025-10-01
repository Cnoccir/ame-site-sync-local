// NodeDetailsPanel component - shows details and upload interface for selected node
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  Server,
  Cpu,
  Network,
  Router,
  Settings,
  Eye,
  Download,
  Info,
  BarChart3,
  PieChart,
  Activity,
  HardDrive
} from 'lucide-react';
import { ProcessedTridiumData } from '@/services/TridiumExportProcessor';

// Use the global TreeNode type from TridiumSystemTreeWizard

interface NodeDetailsPanelProps {
  node?: TreeNode;
  onFileUpload: (files: FileList | File[]) => void;
  processing: boolean;
  processedData: ProcessedTridiumData | null;
  onGenerateReport?: () => void;
  onComplete?: () => void;
}

export const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({
  node,
  onFileUpload,
  processing,
  processedData,
  onGenerateReport,
  onComplete
}) => {

  const nodeIcon = useMemo(() => {
    if (!node) return <FileText className="h-5 w-5" />;
    return React.cloneElement(node.icon as React.ReactElement, { className: "h-5 w-5" });
  }, [node]);

  const acceptedFileTypes = useMemo(() => {
    if (!node?.acceptedFiles) return [];
    
    return node.acceptedFiles.map(category => {
      switch (category) {
        case 'supervisor-platform':
          return { name: 'Supervisor Platform Details', extension: '.txt', example: 'SupervisorPlatformDetails.txt' };
        case 'supervisor-resource':
          return { name: 'Supervisor Resource Export', extension: '.csv', example: 'SupervisorResourceExport.csv' };
        case 'supervisor-network':
          return { name: 'Niagara Network Export', extension: '.csv', example: 'SupervisorNiagaraNetExport.csv' };
        case 'jace-platform':
          return { name: 'JACE Platform Details', extension: '.txt', example: 'JacePlatformDetails.txt' };
        case 'jace-resource':
          return { name: 'JACE Resource Export', extension: '.csv', example: 'JaceResourceExport.csv' };
        case 'driver-bacnet':
          return { name: 'BACnet Device Export', extension: '.csv', example: 'JaceBACnetExport.csv' };
        case 'driver-n2':
          return { name: 'N2 Device Export', extension: '.csv', example: 'JaceN2Export.csv' };
        default:
          return { name: 'Unknown', extension: '.csv/.txt', example: 'file.csv' };
      }
    });
  }, [node]);

  const getStatusColor = (status: TreeNode['status']) => {
    switch (status) {
      case 'processed': return 'text-green-600 bg-green-50 border-green-200';
      case 'uploaded':
      case 'uploading': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'error': return 'text-red-600 bg-red-50 border-red-200';
      case 'empty':
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <h3 className="text-lg font-medium text-gray-600 mb-2">
        Select a Node to Begin
      </h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto">
        Choose a node from the system tree on the left to upload files or view details.
        Start with the Supervisor Platform to detect your system architecture.
      </p>
    </div>
  );

  const renderUploadInterface = () => (
    <div className="space-y-6">
      {/* Node Status Header */}
      <div className={`p-4 rounded-lg border ${getStatusColor(node!.status)}`}>
        <div className="flex items-center gap-3">
          {nodeIcon}
          <div className="flex-1">
            <h3 className="font-semibold">{node!.name}</h3>
            <p className="text-sm opacity-75">
              {node!.metadata?.description || 'Upload files for this node'}
            </p>
          </div>
          <Badge variant={node!.status === 'processed' ? 'default' : 'outline'}>
            {node!.status}
          </Badge>
        </div>

        {/* Node Metadata */}
        {node!.metadata && Object.keys(node!.metadata).length > 1 && (
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            {Object.entries(node!.metadata).map(([key, value]) => {
              if (key === 'description') return null;
              return (
                <div key={key} className="flex justify-between">
                  <span className="opacity-75">{key}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Upload className="h-4 w-4" />
            File Upload
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Accepted File Types */}
          {acceptedFileTypes.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Accepted File Types:</div>
              <div className="space-y-2">
                {acceptedFileTypes.map((fileType, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div>
                      <div className="font-medium">{fileType.name}</div>
                      <div className="text-xs text-muted-foreground">{fileType.example}</div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {fileType.extension}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Main Upload Zone */}
          <div
            className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:bg-blue-50 cursor-pointer transition-colors"
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFileUpload(e.dataTransfer.files);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.multiple = true;
              input.accept = '.csv,.txt';
              input.onchange = (event) => {
                const target = event.target as HTMLInputElement;
                if (target.files) {
                  onFileUpload(target.files);
                }
              };
              input.click();
            }}
          >
            <Upload className="h-8 w-8 mx-auto mb-3 text-blue-500" />
            <div className="text-lg font-medium text-blue-700 mb-2">
              Upload Files for {node!.name}
            </div>
            <div className="text-sm text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </div>
            <div className="flex items-center justify-center gap-2">
              <Badge variant="outline">CSV</Badge>
              <Badge variant="outline">TXT</Badge>
            </div>
          </div>

          {/* Current Files */}
          {node!.uploadedFiles.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-2">Uploaded Files:</div>
              <div className="space-y-2">
                {node!.uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 border rounded">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate" title={file.file.name}>
                        {file.file.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(file.file.size / 1024).toFixed(1)} KB • {file.category}
                      </div>
                    </div>
                    <Badge variant={file.status === 'processed' ? 'default' : 'outline'}>
                      {file.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {processing && (
            <Alert>
              <Activity className="h-4 w-4 animate-pulse" />
              <AlertDescription>
                Processing uploaded files...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Node-specific Guidance */}
      {node!.type === 'supervisor' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="text-sm font-medium mb-1">Supervisor Node Guidance:</div>
            <div className="text-xs space-y-1">
              <div>1. Upload PlatformDetails.txt for hardware/software info</div>
              <div>2. Upload ResourceExport.csv for performance metrics</div>
              <div>3. Upload NiagaraNetExport.csv to discover JACEs automatically</div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {node!.type === 'jace' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="text-sm font-medium mb-1">JACE Node Guidance:</div>
            <div className="text-xs space-y-1">
              <div>1. Upload JACE PlatformDetails.txt for configuration</div>
              <div>2. Upload JACE ResourceExport.csv for performance data</div>
              <div>3. Expand Field Networks node to upload driver exports</div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {node!.type === 'inventory' && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="text-sm font-medium mb-1">
              {node!.metadata?.driverType === 'bacnet' ? 'BACnet' : 'N2'} Network Guidance:
            </div>
            <div className="text-xs">
              Upload {node!.metadata?.driverType === 'bacnet' ? 'BACnet' : 'N2'} device export 
              to inventory field devices and check communication status
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );

  const renderDataSummary = () => {
    if (!processedData) return null;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">System Data Summary</h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onGenerateReport} className="gap-2">
              <Eye className="h-4 w-4" />
              Generate Report
            </Button>
            <Button onClick={onComplete} className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Complete Import
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="resources">Resources</TabsTrigger>
            <TabsTrigger value="devices">Devices</TabsTrigger>
            <TabsTrigger value="networks">Networks</TabsTrigger>
            <TabsTrigger value="platforms">Platforms</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {processedData.overview.map((item, idx) => (
                <Card key={idx}>
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold">{item.value}</div>
                    <div className="text-sm text-muted-foreground">{item.metric}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="resources" className="space-y-4">
            {processedData.resources.map((resource, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {resource.type === 'supervisor' ? (
                      <Server className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Cpu className="h-4 w-4 text-green-600" />
                    )}
                    {resource.source}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium">CPU Usage</div>
                      <div className="flex items-center gap-2">
                        <Progress value={resource.cpuUsage || 0} className="flex-1 h-2" />
                        <span>{resource.cpuUsage || 0}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Memory Usage</div>
                      <div className="flex items-center gap-2">
                        <Progress value={resource.memoryUsage || 0} className="flex-1 h-2" />
                        <span>{resource.memoryUsage || 0}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium">Device Count</div>
                      <div className="text-lg">{resource.deviceCount || 0}</div>
                    </div>
                    <div>
                      <div className="font-medium">Version</div>
                      <div className="text-xs">{resource.niagaraVersion || 'Unknown'}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="devices" className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-200">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-200 p-2 text-left text-xs font-medium">Device</th>
                    <th className="border border-gray-200 p-2 text-left text-xs font-medium">Network</th>
                    <th className="border border-gray-200 p-2 text-left text-xs font-medium">Status</th>
                    <th className="border border-gray-200 p-2 text-left text-xs font-medium">Vendor</th>
                    <th className="border border-gray-200 p-2 text-left text-xs font-medium">Model</th>
                  </tr>
                </thead>
                <tbody>
                  {processedData.devices.slice(0, 20).map((device, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2 text-xs">{device.name}</td>
                      <td className="border border-gray-200 p-2 text-xs">
                        <Badge variant="outline" className="text-xs">
                          {device.network}
                        </Badge>
                      </td>
                      <td className="border border-gray-200 p-2 text-xs">
                        <Badge variant={
                          device.status === 'online' ? 'default' :
                          device.status === 'offline' ? 'destructive' : 'secondary'
                        } className="text-xs">
                          {device.status}
                        </Badge>
                      </td>
                      <td className="border border-gray-200 p-2 text-xs">{device.vendor}</td>
                      <td className="border border-gray-200 p-2 text-xs">{device.model}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {processedData.devices.length > 20 && (
                <div className="text-xs text-muted-foreground text-center mt-2">
                  Showing first 20 of {processedData.devices.length} devices
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="networks" className="space-y-4">
            {processedData.networks.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Network className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No network data available. This typically indicates a single JACE system.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {processedData.networks.map((network, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <Cpu className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-medium text-sm">{network.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {network.address} • {network.hostModel} • {network.version}
                        </div>
                      </div>
                    </div>
                    <Badge variant={network.status === 'online' ? 'default' : 'destructive'}>
                      {network.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="platforms" className="space-y-4">
            {processedData.platforms.map((platform, idx) => (
              <Card key={idx}>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    {platform.type === 'supervisor' ? (
                      <Server className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Cpu className="h-4 w-4 text-green-600" />
                    )}
                    {platform.source}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {Object.entries(platform.summary).slice(0, 8).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-muted-foreground">{key}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  
                  {platform.modules.length > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Modules ({platform.modules.length})</div>
                      <div className="text-xs text-muted-foreground">
                        {platform.modules.slice(0, 3).map((module, i) => (
                          <div key={i}>{module}</div>
                        ))}
                        {platform.modules.length > 3 && (
                          <div>... and {platform.modules.length - 3} more</div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {!node && renderEmptyState()}
      {node && !processedData && renderUploadInterface()}
      {node && processedData && renderDataSummary()}
    </div>
  );
};

export default NodeDetailsPanel;
