import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Server, FileText, HardDrive, Network, Database, Plus, CheckCircle2, X } from 'lucide-react';
import { TridiumExportProcessor } from '@/services/TridiumExportProcessor';
import { PlatformDataService } from '@/services/PlatformDataService';
import { isValidUUID } from '@/utils/uuid';
import { PlatformDetailsPreview } from './PlatformDetailsPreview';
import { ResourceExportPreview } from './ResourceExportSuccessBanner';
import { NetworkExportPreview } from './NetworkExportPreview';
import { DeviceDriverPreview } from './DeviceDriverPreview';
import { FileValidationPreview } from './FileValidationPreview';

// Minimal system tree types
interface Node {
  id: string;
  name: string;
  type: 'supervisor' | 'jace' | 'file' | 'drivers' | 'add-driver';
  icon: React.ComponentType<{ className?: string }>;
  children?: Node[];
  uploadStatus: 'pending' | 'parsed' | 'error';
  acceptedFiles?: string[];
  uploadPrompt?: string;
  file?: File;
  parsedData?: any;
  driverType?: 'bacnet' | 'n2' | 'modbus' | 'lon' | 'custom';
  canRemove?: boolean;
}

export const DiscoveryFoundation: React.FC<{
  sessionId?: string;
  customerId?: string;
  siteName?: string;
}> = ({ sessionId, customerId, siteName }) => {
  // Effective session ID (local-only if not provided)
  const [effectiveSessionId, setEffectiveSessionId] = useState<string>('');
  useEffect(() => {
    const key = 'foundation_session_id';
    if (sessionId && sessionId.length > 0) {
      setEffectiveSessionId(sessionId);
      try { localStorage.setItem(key, sessionId); } catch {}
    } else {
      try {
        const existing = localStorage.getItem(key);
        if (existing) setEffectiveSessionId(existing);
        else {
          const gen = `local-${Date.now().toString(36)}`;
          localStorage.setItem(key, gen);
          setEffectiveSessionId(gen);
        }
      } catch {
        setEffectiveSessionId(`local-${Date.now().toString(36)}`);
      }
    }
  }, [sessionId]);

  const [tree, setTree] = useState<Node>(() => ({
    id: 'supervisor',
    name: 'Supervisor Multi-Site System',
    type: 'supervisor',
    icon: Server,
    uploadStatus: 'pending',
    children: [
      { id: 'supervisor-platform', name: 'Platform Details', type: 'file', icon: FileText, uploadStatus: 'pending', acceptedFiles: ['PlatformDetails.txt','SupervisorPlatformDetails.txt'], uploadPrompt: 'Upload Supervisor PlatformDetails.txt' },
      { id: 'supervisor-resource', name: 'Resource Export', type: 'file', icon: HardDrive, uploadStatus: 'pending', acceptedFiles: ['NiagaraResourceExport.csv','SupervisorNiagaraResourceExport.csv'], uploadPrompt: 'Upload ResourceExport.csv' },
      { id: 'niagara-network', name: 'Niagara Network', type: 'file', icon: Database, uploadStatus: 'pending', acceptedFiles: ['SupervisorNiagaraNetExport.csv','NiagaraNetExport.csv'], uploadPrompt: 'Upload NiagaraNetExport.csv' },
    ],
  }));
  const [selectedNodeId, setSelectedNodeId] = useState<string>('supervisor-platform');
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedFile, setStagedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const findNode = useCallback((node: Node, id: string): Node | null => {
    if (node.id === id) return node;
    for (const child of node.children || []) {
      const f = findNode(child, id);
      if (f) return f;
    }
    return null;
  }, []);

  const updateNode = useCallback((node: Node, id: string, updates: Partial<Node>): Node => {
    if (node.id === id) return { ...node, ...updates };
    return { ...node, children: (node.children || []).map((c) => updateNode(c, id, updates)) };
  }, []);

  const selectedNode = useMemo(() => findNode(tree, selectedNodeId), [tree, selectedNodeId, findNode]);

  const determineDataType = (nodeId: string): 'platform' | 'resources' | 'niagara_network' | 'bacnet' | 'n2' | 'modbus' | 'lon' | 'custom' => {
    if (nodeId.includes('platform')) return 'platform';
    if (nodeId.includes('resource')) return 'resources';
    if (nodeId.includes('network') || nodeId.includes('niagara')) return 'niagara_network';
    if (nodeId.includes('bacnet')) return 'bacnet';
    if (nodeId.includes('n2')) return 'n2';
    if (nodeId.includes('modbus')) return 'modbus';
    if (nodeId.includes('lon')) return 'lon';
    return 'custom';
  };

  const getTarget = (nodeId: string): { type: 'supervisor' | 'jace'; name?: string } => {
    if (nodeId.startsWith('supervisor') || nodeId.includes('niagara-net')) return { type: 'supervisor' };
    const m = nodeId.match(/jace-(\d+)/);
    return m ? { type: 'jace', name: `JACE_${m[1]}` } : { type: 'supervisor' };
  };

  const commitImport = useCallback(async (file: File, parsedData?: any) => {
    if (!selectedNode) return;
    setIsProcessing(true);
    try {
      let parsed = parsedData;
      let detectedType: any = 'unknown';
      if (!parsed) {
        const rawText = await file.text();
        const detected = TridiumExportProcessor.detectFileFormat(file.name, rawText);
        detectedType = detected.type;
        if (detected.type === 'platform') parsed = TridiumExportProcessor.parsePlatformDetails(rawText);
        else if (detected.type === 'resource') parsed = TridiumExportProcessor.parseResourceExport(rawText);
        else if (detected.type === 'network') parsed = TridiumExportProcessor.parseNiagaraNetworkExport(rawText);
        else if (detected.type === 'bacnet') parsed = TridiumExportProcessor.parseBACnetExport(rawText);
        else if (detected.type === 'n2') parsed = TridiumExportProcessor.parseN2Export(rawText);
        else parsed = (await TridiumExportProcessor.processFiles([file])) || {};
      }

      // Normalize incoming shapes so preview and persisted data always match
      // Per request: always use the exact preview payload as-is for ALL file types.
      // If there is no preview (parsed came from direct parse above), we also keep that as-is.
      // No normalization/unwrapping here.

      // Update UI with normalized data for fidelity and consistency
      setTree((prev) => updateNode(prev, selectedNode.id, { uploadStatus: 'parsed', file, parsedData: parsed }));
      const dataType = determineDataType(selectedNode.id);
      const target = getTarget(selectedNode.id);
      if (effectiveSessionId) await PlatformDataService.storeIndividualDataType(effectiveSessionId, dataType as any, parsed, target);

      // Network → add JACE children
      const previewRows: any[] = Array.isArray((parsed as any)?.data) ? (parsed as any).data : [];
      const datasetRows: any[] = Array.isArray((parsed as any)?.rows) ? (parsed as any).rows : [];
      const rowsAsNodes = datasetRows.map((r: any) => r?.data || r).filter(Boolean);
      const nodesFromAny: any[] = (parsed?.network?.nodes && Array.isArray(parsed.network.nodes))
        ? parsed.network.nodes
        : (previewRows.length > 0 ? previewRows : rowsAsNodes);

      const toNode = (n: any) => {
        // Normalize name/ip from common fields
        const name = n.name || n.Name || n.station || '';
        const ipFromAddr = (() => {
          const addr = n.address || n.Address || '';
          const m = typeof addr === 'string' ? addr.match(/ip:([\d.]+)/i) : null;
          return m ? m[1] : '';
        })();
        const ip = n.ip || ipFromAddr || '';
        const hostModel = n.hostModel || n['Host Model'] || n.model || 'JACE';
        const version = n.version || n.Version || '';
        return { name, ip, hostModel, version };
      };

      if ((detectedType === 'network' || dataType === 'niagara_network') && nodesFromAny.length > 0) {
        const jaces: Node[] = nodesFromAny.slice(0, 50).map((raw, idx) => {
          const m = toNode(raw);
          return {
            id: `jace-${idx}`,
            name: `${m.name || `JACE_${idx + 1}`} (${m.ip || raw.address || 'Unknown'})`,
            type: 'jace',
            icon: Server,
            uploadStatus: 'pending',
            children: [
              { id: `jace-${idx}-platform`, name: 'Platform Details', type: 'file', icon: FileText, uploadStatus: 'pending', acceptedFiles: ['PlatformDetails.txt','JacePlatformDetails.txt'], uploadPrompt: 'Upload JACE PlatformDetails.txt' },
              { id: `jace-${idx}-resource`, name: 'Resource Export', type: 'file', icon: HardDrive, uploadStatus: 'pending', acceptedFiles: ['NiagaraResourceExport.csv','JaceResourceExport.csv'], uploadPrompt: 'Upload JACE ResourceExport.csv' },
              { id: `jace-${idx}-bacnet`, name: 'BACnet Export', type: 'file', icon: Network, uploadStatus: 'pending', acceptedFiles: ['BacnetExport.csv','JaceBacnetExport.csv'], uploadPrompt: 'Upload BACnetExport.csv', driverType: 'bacnet' },
              { id: `jace-${idx}-n2`, name: 'N2 Export', type: 'file', icon: Network, uploadStatus: 'pending', acceptedFiles: ['N2Export.csv','JaceN2Export.csv'], uploadPrompt: 'Upload N2Export.csv', driverType: 'n2' }
            ]
          } as Node;
        });
        setTree((prev) => ({
          ...prev,
          children: [
            ...(prev.children || []),
            ...jaces
          ]
        }));
      }
    } finally {
      setIsProcessing(false);
      setStagedFile(null);
      setShowPreview(false);
    }
  }, [effectiveSessionId, selectedNode, updateNode]);

  const handleDrop = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0 || !selectedNode) return;
    setStagedFile(files[0]);
    setShowPreview(true);
  }, [selectedNode]);

  const removeFile = useCallback(async (nodeId: string) => {
    // Clear from UI
    setTree((prev) => updateNode(prev, nodeId, { uploadStatus: 'pending', file: undefined, parsedData: undefined }));
    // Persist removal
    try {
      const { PlatformDataService } = await import('@/services/PlatformDataService');
      const type = determineDataType(nodeId);
      const target = getTarget(nodeId);
      if (effectiveSessionId) await PlatformDataService.removeIndividualDataType(effectiveSessionId, type as any, target);
    } catch {}
  }, [effectiveSessionId, updateNode]);

  // Render helpers
  const renderNode = (node: Node, depth = 0): React.ReactNode => (
    <div key={node.id} className={`flex items-center px-2 py-1 ${selectedNodeId === node.id ? 'bg-blue-50' : ''}`} style={{ paddingLeft: depth * 14 }}>
      <node.icon className="h-4 w-4 mr-2 text-gray-600" />
      <button className="flex-1 text-left" onClick={() => setSelectedNodeId(node.id)}>{node.name}</button>
      {node.type === 'file' && node.uploadStatus === 'parsed' && (
        <Badge variant="outline" className="text-xs">Ready</Badge>
      )}
    </div>
  );

  const renderUploadPanel = () => {
    if (!selectedNode || selectedNode.type !== 'file') return (
      <div className="text-center text-gray-500 py-10">Select a file node to upload</div>
    );

    const fileName = selectedNode.file?.name || '';

    if (selectedNode.uploadStatus === 'parsed' && selectedNode.parsedData) {
      const onRemove = () => removeFile(selectedNode.id);
      const onSaveEdited = async (edited: any) => {
        const type = determineDataType(selectedNode.id);
        const target = getTarget(selectedNode.id);
        setTree((prev) => updateNode(prev, selectedNode.id, { parsedData: edited }));
        if (effectiveSessionId) await PlatformDataService.storeIndividualDataType(effectiveSessionId, type as any, edited, target);
      };

      switch (determineDataType(selectedNode.id)) {
        case 'platform':
          return <PlatformDetailsPreview data={selectedNode.parsedData} fileName={fileName} onRemove={onRemove} onSaveEdited={onSaveEdited} />;
        case 'resources':
          return <ResourceExportPreview data={selectedNode.parsedData} fileName={fileName} onRemove={onRemove} onSaveEdited={onSaveEdited} />;
        case 'niagara_network':
          return <NetworkExportPreview data={selectedNode.parsedData} fileName={fileName} onRemove={onRemove} onSaveEdited={onSaveEdited} onJACEsDiscovered={() => {}} />;
        case 'bacnet':
        case 'n2':
        case 'modbus':
        case 'lon':
          return <DeviceDriverPreview data={selectedNode.parsedData} fileName={fileName} driverType={determineDataType(selectedNode.id) as any} onRemove={onRemove} onSaveEdited={onSaveEdited} />;
        default:
          return (
            <Card><CardHeader><CardTitle>Parsed Data</CardTitle></CardHeader><CardContent><pre className="text-xs bg-gray-50 p-3 rounded max-h-96 overflow-auto">{JSON.stringify(selectedNode.parsedData, null, 2)}</pre></CardContent></Card>
          );
      }
    }

    return (
      <div className="space-y-3">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400"
          onDrop={(e) => { e.preventDefault(); handleDrop(e.dataTransfer.files); }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.csv,.txt'; input.onchange = (e) => handleDrop((e.target as HTMLInputElement).files); input.click(); }}
        >
          <Upload className="h-8 w-8 text-gray-400 mb-2" />
          <div>Drop files here or click to upload</div>
          {selectedNode.acceptedFiles && <div className="text-xs text-gray-500 mt-1">Accepted: {selectedNode.acceptedFiles.join(', ')}</div>}
        </div>
        <div className="text-xs text-gray-500">{selectedNode.uploadPrompt}</div>
      </div>
    );
  };

  // Progress calc
  const progress = useMemo(() => {
    const count = (n: Node): { total: number; done: number } => {
      let total = n.type === 'file' ? 1 : 0;
      let done = n.type === 'file' && n.uploadStatus === 'parsed' ? 1 : 0;
      (n.children || []).forEach((c) => { const r = count(c); total += r.total; done += r.done; });
      return { total, done };
    };
    const r = count(tree); return r.total ? Math.round((r.done / r.total) * 100) : 0;
  }, [tree]);

  return (
    <div className="h-full flex flex-col space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">System Discovery (Foundation Mode)</div>
              <div className="text-sm text-gray-600">Upload → Parse → Preview (exact object is stored)</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{progress}%</div>
              <Progress value={progress} className="w-28" />
            </div>
          </div>
          {!isValidUUID(effectiveSessionId) && (
            <Alert className="mt-3 border-yellow-200 bg-yellow-50"><AlertDescription>Local-only mode. Start from a PM session to persist in Supabase.</AlertDescription></Alert>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 flex min-h-0">
        <CardContent className="flex-1 flex min-h-0">
          <div className="w-80 border-r bg-gray-50 min-h-0 overflow-y-auto">
            <div className="p-2 font-medium text-sm">System Structure</div>
            <div className="pb-4">
              {renderNode(tree)}
              {(tree.children || []).map((c) => (
                <div key={c.id}>{renderNode(c, 1)}</div>
              ))}
            </div>
          </div>
          <div className="flex-1 p-6 min-h-0 overflow-y-auto">
            {isProcessing ? (
              <div className="text-center text-gray-500">Processing...</div>
            ) : (
              renderUploadPanel()
            )}
          </div>
        </CardContent>
      </Card>

      {/* Staged preview modal */}
      {showPreview && stagedFile && (
        <FileValidationPreview
          file={stagedFile}
          onAccept={(data) => commitImport(stagedFile, data)}
          onReject={() => { setStagedFile(null); setShowPreview(false); }}
          onClose={() => { setStagedFile(null); setShowPreview(false); }}
        />
      )}
    </div>
  );
};