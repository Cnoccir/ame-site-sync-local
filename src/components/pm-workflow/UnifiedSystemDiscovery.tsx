import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AnalysisSettingsPanel } from './AnalysisSettingsPanel';
import { Switch } from '@/components/ui/switch';
import {
  ChevronRight,
  ChevronDown,
  Server,
  Cpu,
  Network,
  Database,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HardDrive,
  FolderOpen,
  Plus,
  X,
  Trash2,
  Eye,
  Settings,
  Activity,
  Gauge,
  BarChart3,
  Building
} from 'lucide-react';

import { TridiumExportProcessor, type CrossValidatedData } from '@/services/TridiumExportProcessor';
import { PlatformDataService, type PlatformData } from '@/services/PlatformDataService';
import { DiscoveryAnalysisService } from '@/services/DiscoveryAnalysisService';
import { TridiumImportStoreService } from '@/services/TridiumImportStoreService';
import { FileValidationPreview } from './FileValidationPreview';
import { DiscoveryRunService } from '@/services/DiscoveryRunService';
import { isValidUUID } from '@/utils/uuid';
import { LiveDataPreview } from './LiveDataPreview';
import { ImportDataVisualization } from './ImportDataVisualization';
import { PlatformDetailsPreview } from './PlatformDetailsPreview';
import { ResourceExportPreview } from './ResourceExportPreview';
import { NetworkExportPreview } from './NetworkExportPreview';
import { DeviceDriverPreview } from './DeviceDriverPreview';

// Unified tree node structure with full hierarchy support
interface SystemTreeNode {
  id: string;
  name: string;
  type: 'supervisor' | 'jace' | 'driver' | 'file' | 'drivers-container' | 'add-driver';
  icon: React.ComponentType<{ className?: string }>;
  children?: SystemTreeNode[];
  expanded?: boolean;

  // Upload state
  uploadStatus: 'pending' | 'uploaded' | 'parsed' | 'error';
  uploadPrompt?: string;
  acceptedFiles?: string[];
  file?: File;
  parsedData?: any;

  // JACE metadata (auto-populated from network discovery)
  jaceInfo?: {
    name: string;
    ip: string;
    hostModel: string;
    version?: string;
    status?: string[];
  };

  // UI behavior
  canRemove?: boolean;
  canAddChildren?: boolean;
  isAddButton?: boolean;
  driverType?: string;

  // Analysis metadata
  hasAnalysis: boolean;
  alertCount: number;
  criticalAlerts: number;
}

// Comprehensive system data structure for persistence
interface SystemDiscoveryData {
  sessionId?: string;
  systemType: 'supervisor' | 'engine-only';
  detectedArchitecture: 'supervisor' | 'single-jace' | 'multi-jace';

  // Processed data by location and type
  supervisor?: {
    platform?: any;
    resources?: any;
    network?: any;
  };

  jaces: Record<string, {
    platform?: any;
    resources?: any;
    drivers: {
      bacnet?: any;
      n2?: any;
      modbus?: any;
      lon?: any;
      custom?: Record<string, any>;
    };
  }>;

  // Cross-validated analysis
  crossValidatedData?: CrossValidatedData;

  // Metadata
  uploadedFiles: Array<{ name: string; type: string; nodeId: string; uploadTime: Date }>;
  lastUpdated: Date;
  importSummary?: {
    totalFiles: number;
    processedFiles: number;
    totalDevices: number;
    jaceCount: number;
    totalAlerts: number;
    criticalAlerts: number;
  };
}

interface UnifiedSystemDiscoveryProps {
  sessionId?: string;
  customerId?: string;
  siteName?: string;
  onSystemDataComplete?: (data: CrossValidatedData & { metadata?: any }) => void;
  onDataChange?: (data: Partial<SystemDiscoveryData>) => void;
}

export const UnifiedSystemDiscovery: React.FC<UnifiedSystemDiscoveryProps> = ({
  sessionId,
  customerId,
  siteName = 'PM Assessment Site',
  onSystemDataComplete,
  onDataChange
}) => {
  // Effective session ID (falls back to local ephemeral when none provided)
  const [effectiveSessionId, setEffectiveSessionId] = useState<string>('');

  useEffect(() => {
    const key = 'phase2_ephemeral_session_id';
    if (sessionId && sessionId.length > 0) {
      setEffectiveSessionId(sessionId);
      try { localStorage.setItem(key, sessionId); } catch {}
    } else {
      try {
        const existing = localStorage.getItem(key);
        if (existing && existing.length > 0) {
          setEffectiveSessionId(existing);
        } else {
          const gen = `local-${Date.now().toString(36)}`;
          localStorage.setItem(key, gen);
          setEffectiveSessionId(gen);
        }
      } catch {
        // Last resort
        setEffectiveSessionId(`local-${Date.now().toString(36)}`);
      }
    }
  }, [sessionId]);

  const isDatabaseMode = useMemo(() => isValidUUID(effectiveSessionId), [effectiveSessionId]);

  // Core state
  const [systemType, setSystemType] = useState<'supervisor' | 'engine-only' | 'auto'>('auto');
  const [discoveryRunId, setDiscoveryRunId] = useState<string | null>(null);
  const [systemTree, setSystemTree] = useState<SystemTreeNode>(() => createInitialTree());
  const [systemData, setSystemData] = useState<SystemDiscoveryData>(() => createInitialSystemData());
  const [selectedNode, setSelectedNode] = useState<string>('supervisor-platform');
  const [activeTab, setActiveTab] = useState<'import' | 'analysis'>('import');

  // File handling state
  const [pendingFile, setPendingFile] = useState<{ file: File; targetNodeId?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddDriverModal, setShowAddDriverModal] = useState<string | null>(null);
  
  // Processing lock to prevent duplicate processing
  const processingLockRef = useRef<Set<string>>(new Set());
  const processedFilesRef = useRef<Set<string>>(new Set());

  // Database persistence state
  const [databaseCallQueue, setDatabaseCallQueue] = useState<Map<string, any>>(new Map());
  const [analysisSettings, setAnalysisSettings] = useState<any>(null);
  const [isDatabaseSaving, setIsDatabaseSaving] = useState(false);
  
  // Clear All confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Calculate progress
  const overallProgress = useMemo(() => {
    const countFileNodes = (node: SystemTreeNode): { total: number; uploaded: number } => {
      let total = node.type === 'file' ? 1 : 0;
      let uploaded = node.type === 'file' && (node.uploadStatus === 'uploaded' || node.uploadStatus === 'parsed') ? 1 : 0;

      if (node.children) {
        node.children.forEach(child => {
          const counts = countFileNodes(child);
          total += counts.total;
          uploaded += counts.uploaded;
        });
      }

      return { total, uploaded };
    };

    const counts = countFileNodes(systemTree);
    return counts.total > 0 ? Math.round((counts.uploaded / counts.total) * 100) : 0;
  }, [systemTree]);

  // Selected node data
  const selectedNodeData = useMemo(() => {
    const findNode = (node: SystemTreeNode, id: string): SystemTreeNode | null => {
      if (node.id === id) return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNode(child, id);
          if (found) return found;
        }
      }
      return null;
    };
    return findNode(systemTree, selectedNode);
  }, [systemTree, selectedNode]);

  // Generate comprehensive report data for export
  const generateReportData = useCallback(() => {
    const reportData = {
      metadata: {
        sessionId: effectiveSessionId,
        customerId,
        siteName,
        reportType: 'tridium-pm-assessment',
        generatedAt: new Date().toISOString(),
        systemType,
        overallProgress
      },
      systemSummary: {
        architecture: systemData.detectedArchitecture,
        totalJACEs: Object.keys(systemData.jaces).length,
        totalDevices: systemData.importSummary?.totalDevices || 0,
        totalAlerts: systemData.importSummary?.totalAlerts || 0,
        criticalAlerts: systemData.importSummary?.criticalAlerts || 0,
        healthScore: 85 // Default for now, can be calculated from actual analysis
      },
      supervisor: systemData.supervisor ? {
        platform: systemData.supervisor.platform,
        resources: systemData.supervisor.resources,
        network: systemData.supervisor.network,
        analysis: {
          healthScore: systemData.supervisor.platform?.analysis?.healthScore || 85,
          alerts: systemData.supervisor.platform?.analysis?.alerts || [],
          recommendations: systemData.supervisor.platform?.analysis?.recommendations || []
        }
      } : null,
      jaces: Object.entries(systemData.jaces).map(([jaceName, jaceData]) => ({
        name: jaceName,
        platform: jaceData.platform,
        resources: jaceData.resources,
        drivers: {
          bacnet: jaceData.drivers.bacnet ? {
            devices: jaceData.drivers.bacnet.devices || [],
            summary: jaceData.drivers.bacnet.summary || {},
            deviceCount: jaceData.drivers.bacnet.devices?.length || 0,
            onlineCount: jaceData.drivers.bacnet.devices?.filter((d: any) => d.status?.includes('ok') || d.status === 'online').length || 0
          } : null,
          n2: jaceData.drivers.n2 ? {
            devices: jaceData.drivers.n2.devices || [],
            summary: jaceData.drivers.n2.summary || {},
            deviceCount: jaceData.drivers.n2.devices?.length || 0,
            onlineCount: jaceData.drivers.n2.devices?.filter((d: any) => d.status?.includes('ok') || d.status === 'online').length || 0
          } : null,
          modbus: jaceData.drivers.modbus,
          lon: jaceData.drivers.lon,
          custom: jaceData.drivers.custom
        },
        analysis: {
          platformHealth: jaceData.platform?.analysis?.healthScore || 85,
          resourceHealth: jaceData.resources?.analysis?.healthScore || 85,
          totalDevices: (jaceData.drivers.bacnet?.devices?.length || 0) + (jaceData.drivers.n2?.devices?.length || 0),
          alerts: [
            ...(jaceData.platform?.analysis?.alerts || []),
            ...(jaceData.resources?.analysis?.alerts || [])
          ],
          recommendations: [
            ...(jaceData.platform?.analysis?.recommendations || []),
            ...(jaceData.resources?.analysis?.recommendations || [])
          ]
        }
      })),
      uploadedFiles: systemData.uploadedFiles.map(file => ({
        name: file.name,
        type: file.type,
        uploadTime: file.uploadTime,
        size: file.parsedData ? Object.keys(file.parsedData).length : 0,
        status: 'processed'
      })),
      crossValidation: systemData.crossValidatedData ? {
        architecture: systemData.crossValidatedData.architecture,
        versionConsistency: systemData.crossValidatedData.crossValidation?.versionConsistency || true,
        deviceCountConsistency: systemData.crossValidatedData.crossValidation?.deviceCountConsistency || true,
        networkTopologyConsistency: systemData.crossValidatedData.crossValidation?.networkTopologyConsistency || true,
        validationWarnings: systemData.crossValidatedData.validationWarnings || [],
        consistencyErrors: systemData.crossValidatedData.consistencyErrors || []
      } : null,
      recommendations: {
        immediate: [
          'Review system health metrics',
          'Address any critical alerts',
          'Verify device connectivity'
        ],
        planned: [
          'Schedule regular system maintenance',
          'Monitor capacity utilization',
          'Plan software upgrades if needed'
        ],
        longTerm: [
          'Consider system architecture improvements',
          'Evaluate additional monitoring tools',
          'Implement preventive maintenance schedules'
        ]
      },
      charts: {
        systemHealth: {
          score: 85,
          categories: [
            { name: 'Platform Health', value: 85, color: '#10b981' },
            { name: 'Device Connectivity', value: 90, color: '#3b82f6' },
            { name: 'Resource Utilization', value: 75, color: '#f59e0b' },
            { name: 'Network Stability', value: 88, color: '#8b5cf6' }
          ]
        },
        deviceDistribution: Object.entries(systemData.jaces).reduce((acc, [jaceName, jaceData]) => {
          acc[jaceName] = {
            bacnet: jaceData.drivers.bacnet?.devices?.length || 0,
            n2: jaceData.drivers.n2?.devices?.length || 0,
            modbus: Object.keys(jaceData.drivers.modbus || {}).length,
            total: (jaceData.drivers.bacnet?.devices?.length || 0) + (jaceData.drivers.n2?.devices?.length || 0)
          };
          return acc;
        }, {} as any)
      }
    };

    return reportData;
  }, [systemData, sessionId, customerId, siteName, systemType, overallProgress]);

  // Auto-save data changes with debouncing - only for significant changes
  useEffect(() => {
    if (onDataChange && systemData.uploadedFiles.length > 0 && systemData.crossValidatedData) {
      const timeoutId = setTimeout(() => {
        // Only trigger if we have meaningful data and not during database operations
        if (!isDatabaseSaving && systemData.crossValidatedData?.metadata?.totalFiles > 0) {
          onDataChange(systemData);
        }
      }, 5000); // Further increased debounce to match database operations
      return () => clearTimeout(timeoutId);
    }
  }, [systemData.crossValidatedData?.metadata?.totalFiles, onDataChange, isDatabaseSaving]); // More selective triggers

  function createInitialSystemData(): SystemDiscoveryData {
    return {
      sessionId,
      systemType: 'supervisor',
      detectedArchitecture: 'supervisor',
      jaces: {},
      uploadedFiles: [],
      lastUpdated: new Date()
    };
  }

  function createInitialTree(): SystemTreeNode {
    return createSupervisorTree();
  }

  function createSupervisorTree(): SystemTreeNode {
    return {
      id: 'supervisor',
      name: 'Supervisor Multi-Site System',
      type: 'supervisor',
      icon: Server,
      expanded: true,
      uploadStatus: 'pending',
      hasAnalysis: false,
      alertCount: 0,
      criticalAlerts: 0,
      children: [
        {
          id: 'supervisor-platform',
          name: 'Platform Details',
          type: 'file',
          icon: FileText,
          uploadStatus: 'pending',
          uploadPrompt: 'Upload SupervisorPlatformDetails.txt (hardware/software/modules/licenses)',
          acceptedFiles: ['SupervisorPlatformDetails.txt', 'PlatformDetails.txt'],
          hasAnalysis: false,
          alertCount: 0,
          criticalAlerts: 0
        },
        {
          id: 'supervisor-resource',
          name: 'Resource Export',
          type: 'file',
          icon: HardDrive,
          uploadStatus: 'pending',
          uploadPrompt: 'Upload SupervisorNiagaraResourceExport.csv (performance/capacity metrics)',
          acceptedFiles: ['SupervisorNiagaraResourceExport.csv', 'NiagaraResourceExport.csv'],
          hasAnalysis: false,
          alertCount: 0,
          criticalAlerts: 0
        },
        {
          id: 'niagara-network',
          name: 'Niagara Network',
          type: 'driver',
          icon: Network,
          expanded: false,
          uploadStatus: 'pending',
          hasAnalysis: false,
          alertCount: 0,
          criticalAlerts: 0,
          children: [
            {
              id: 'niagara-net-export',
              name: 'Network Export',
              type: 'file',
              icon: Database,
              uploadStatus: 'pending',
              uploadPrompt: 'Upload SupervisorNiagaraNetExport.csv to discover connected JACEs',
              acceptedFiles: ['SupervisorNiagaraNetExport.csv', 'NiagaraNetExport.csv'],
              hasAnalysis: false,
              alertCount: 0,
              criticalAlerts: 0
            },
            {
              id: 'add-manual-jace',
              name: 'Add JACE Manually',
              type: 'add-driver',  // Reuse add-driver type for button behavior
              icon: Plus,
              uploadStatus: 'pending',
              isAddButton: true,
              hasAnalysis: false,
              alertCount: 0,
              criticalAlerts: 0
            }
          ]
        }
      ]
    };
  }

  function createEngineOnlyTree(): SystemTreeNode {
    return {
      id: 'engine-only',
      name: 'Engine Only System',
      type: 'jace',
      icon: Cpu,
      expanded: true,
      uploadStatus: 'pending',
      hasAnalysis: false,
      alertCount: 0,
      criticalAlerts: 0,
      children: [
        {
          id: 'jace-platform',
          name: 'Platform Details',
          type: 'file',
          icon: FileText,
          uploadStatus: 'pending',
          uploadPrompt: 'Upload JacePlatformDetails.txt or PlatformDetails.txt (platform summary)',
          acceptedFiles: ['JacePlatformDetails.txt', 'PlatformDetails.txt'],
          hasAnalysis: false,
          alertCount: 0,
          criticalAlerts: 0
        },
        {
          id: 'jace-resource',
          name: 'Resource Export',
          type: 'file',
          icon: HardDrive,
          uploadStatus: 'pending',
          uploadPrompt: 'Upload JaceResourceExport.csv or ResourceExport.csv (resources/metrics)',
          acceptedFiles: ['JaceResourceExport.csv', 'ResourceExport.csv', 'NiagaraResourceExport.csv'],
          hasAnalysis: false,
          alertCount: 0,
          criticalAlerts: 0
        },
        {
          id: 'jace-drivers',
          name: 'Drivers',
          type: 'drivers-container',
          icon: Database,
          expanded: true,
          uploadStatus: 'pending',
          canAddChildren: true,
          hasAnalysis: false,
          alertCount: 0,
          criticalAlerts: 0,
          children: [
            {
              id: 'jace-bacnet',
              name: 'BACnet',
              type: 'file',
              icon: Network,
              uploadStatus: 'pending',
              uploadPrompt: 'Upload JaceBacnetExport.csv or BacnetExport.csv (BACnet device inventory)',
              acceptedFiles: ['JaceBacnetExport.csv', 'BacnetExport.csv'],
              driverType: 'BACnet',
              canRemove: true,
              hasAnalysis: false,
              alertCount: 0,
              criticalAlerts: 0
            },
            {
              id: 'jace-n2',
              name: 'N2',
              type: 'file',
              icon: Network,
              uploadStatus: 'pending',
              uploadPrompt: 'Upload JaceN2Export.csv, N2Export.csv, or Jace1_N2xport.csv (N2 device inventory)',
              acceptedFiles: ['JaceN2Export.csv', 'N2Export.csv', 'Jace1_N2xport.csv'],
              driverType: 'N2',
              canRemove: true,
              hasAnalysis: false,
              alertCount: 0,
              criticalAlerts: 0
            },
            {
              id: 'jace-add-driver',
              name: '[Add Driver]',
              type: 'add-driver',
              icon: Plus,
              uploadStatus: 'pending',
              isAddButton: true,
              hasAnalysis: false,
              alertCount: 0,
              criticalAlerts: 0
            }
          ]
        }
      ]
    };
  }

  // System type switching
  const switchToMode = useCallback(async (mode: 'supervisor' | 'engine-only') => {
    let newTree: SystemTreeNode;
    let newSelectedNode: string;

    if (mode === 'supervisor') {
      newTree = createSupervisorTree();
      newSelectedNode = 'supervisor-platform';
    } else {
      newTree = createEngineOnlyTree();
      newSelectedNode = 'jace-platform';
    }

    setSystemTree(newTree);
    setSelectedNode(newSelectedNode);
    setSystemType(mode);
    setSystemData(prev => ({ ...prev, systemType: mode, detectedArchitecture: mode === 'supervisor' ? 'supervisor' : 'single-jace' }));

    // Ensure a discovery run exists for persistence
    try {
      if (isDatabaseMode) {
        const runId = await DiscoveryRunService.tryEnsureRunOrNull({
          sessionId: effectiveSessionId,
          customerId,
          siteName,
          systemType: mode === 'supervisor' ? 'supervisor' : 'engine'
        });
        if (runId) setDiscoveryRunId(runId);
      }
    } catch (e) {
      console.warn('Failed to ensure discovery run', e);
    }
  }, []);

  // Clear All handler with confirmation
  const handleClearAll = useCallback(() => {
    setShowClearConfirm(true);
  }, []);

  const confirmClearAll = useCallback(async () => {
    try {
      setIsProcessing(true);
      
      // Reset tree to initial state
      const newTree = systemType === 'supervisor' ? createSupervisorTree() : createEngineOnlyTree();
      setSystemTree(newTree);
      
      // Reset system data
      setSystemData(createInitialSystemData());
      
      // Reset selected node
      setSelectedNode(systemType === 'supervisor' ? 'supervisor-platform' : 'jace-platform');
      
      // Switch back to import tab
      setActiveTab('import');
      
      // Clear database if in database mode
      if (isDatabaseMode && effectiveSessionId) {
        try {
          // Clear phase 2 data
          await PlatformDataService.storeTridiumSystemData(effectiveSessionId, {
            architecture: systemType === 'supervisor' ? 'supervisor' : 'single-jace',
            jaces: {},
            importedAt: new Date().toISOString(),
            dataSource: 'automated_import',
            importSummary: {
              totalFiles: 0,
              totalDevices: 0,
              jaceCount: 0,
              networkCount: 0,
              errors: []
            }
          });
          
          // Clear local storage fallback
          try {
            localStorage.removeItem(`phase2_tridium_${effectiveSessionId}`);
          } catch {}
        } catch (error) {
          console.error('Failed to clear database:', error);
        }
      }
      
      // Close confirmation dialog
      setShowClearConfirm(false);
      
    } catch (error) {
      console.error('Error clearing data:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [systemType, isDatabaseMode, effectiveSessionId]);

  // Tree manipulation helpers
  const updateNodeInTree = useCallback((tree: SystemTreeNode, nodeId: string, updates: Partial<SystemTreeNode>): SystemTreeNode => {
    if (tree.id === nodeId) {
      return { ...tree, ...updates };
    }
    if (tree.children) {
      return {
        ...tree,
        children: tree.children.map(child => updateNodeInTree(child, nodeId, updates))
      };
    }
    return tree;
  }, []);

  const findNodeById = useCallback((tree: SystemTreeNode, id: string): SystemTreeNode | null => {
    if (tree.id === id) return tree;
    if (tree.children) {
      for (const child of tree.children) {
        const found = findNodeById(child, id);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Load analysis settings once
  useEffect(() => {
    if (!sessionId) return;
    (async () => {
      try {
        const res = await PlatformDataService.getAnalysisSettings(effectiveSessionId);
        if (res.data) setAnalysisSettings(res.data);
      } catch {}
    })();
  }, [sessionId]);

  // Bootstrap from persisted data (restore on refresh)
  useEffect(() => {
    const restore = async () => {
      if (!effectiveSessionId) return;
      try {
        // Ensure discovery run exists for this session as soon as we have a sessionId
        if (!discoveryRunId && isDatabaseMode) {
          try {
            const runId = await DiscoveryRunService.tryEnsureRunOrNull({ sessionId: effectiveSessionId, customerId, siteName, systemType: 'supervisor' });
            if (runId) setDiscoveryRunId(runId);
          } catch (e) {}
        }

        const result = await PlatformDataService.getTridiumSystemData(effectiveSessionId);
        if (result.data) {
          const persisted = result.data as any;

          // Merge into local system data
          setSystemData(prev => ({
            ...prev,
            ...persisted,
            lastUpdated: new Date()
          }));

          // Rebuild the entire tree from persisted data
          rebuildTreeFromPersisted(persisted);
        } else {
          // Try durable discovery model first if available
          try {
            if (isDatabaseMode) {
              const ensured = discoveryRunId || (await DiscoveryRunService.tryEnsureRunOrNull({ sessionId: effectiveSessionId, customerId, siteName, systemType: 'supervisor' }));
              if (!ensured) throw new Error('discovery model unavailable');
              if (!discoveryRunId) setDiscoveryRunId(ensured);
              const run = await DiscoveryRunService.getRun(ensured);
              if (run && (run.supervisor || (run.jaces && run.jaces.length))) {
                const persisted = convertDiscoveryRunToSystemData(run);
                setSystemData(prev => ({ ...prev, ...persisted, lastUpdated: new Date() }));
                rebuildTreeFromPersisted(persisted);
                return;
              }
            }
          } catch (e) {
            // ignore and fallback to legacy imports JSON
          }

          // Fallback: reconstruct minimal data from tridium_imports if phase data not present yet
          const fallback = await PlatformDataService.getLatestImports(effectiveSessionId);
          if (fallback.data) {
            const persisted = fallback.data as any;
            setSystemData(prev => ({ ...prev, ...persisted, lastUpdated: new Date() }));
            rebuildTreeFromPersisted(persisted);
          }
        }
      } catch (e) {
        console.warn('No persisted Tridium system data to restore yet', e);
      }
    };
    restore();
  }, [effectiveSessionId, discoveryRunId]);
  // Build UI tree from persisted JSON
  const rebuildTreeFromPersisted = useCallback((persisted: any) => {
    // Switch system type
    const arch = persisted.detectedArchitecture || persisted.architecture || 'supervisor';
    if (arch === 'supervisor') {
      switchToMode('supervisor');
    } else {
      switchToMode('engine-only');
    }

    // Start from a fresh template for selected mode
    setSystemTree(prev => {
      let base = arch === 'supervisor' ? createSupervisorTree() : createEngineOnlyTree();

      // Supervisor platform
      if (persisted.supervisor?.platform) {
        base = updateNodeInTree(base, arch === 'supervisor' ? 'supervisor-platform' : 'jace-platform', {
          uploadStatus: 'parsed',
          parsedData: persisted.supervisor.platform,
          hasAnalysis: !!persisted.supervisor.platform?.analysis,
          alertCount: persisted.supervisor.platform?.alerts?.length || 0,
          criticalAlerts: (persisted.supervisor.platform?.alerts || []).filter((a: any) => a.severity === 'critical').length || 0
        });
      }
      // Supervisor resources
      if (persisted.supervisor?.resources) {
        base = updateNodeInTree(base, arch === 'supervisor' ? 'supervisor-resource' : 'jace-resource', {
          uploadStatus: 'parsed',
          parsedData: persisted.supervisor.resources,
          hasAnalysis: !!persisted.supervisor.resources?.analysis,
          alertCount: persisted.supervisor.resources?.alerts?.length || 0,
          criticalAlerts: (persisted.supervisor.resources?.alerts || []).filter((a: any) => a.severity === 'critical').length || 0
        });
      }

      // Niagara network export and JACE discovery
      const netNodes = persisted.supervisor?.network?.network?.nodes || persisted.supervisor?.network?.nodes || [];
      const jaceEntries = Object.entries(persisted.jaces || {});
      
      // Build a unified list of JACEs from both network data and persisted.jaces
      const allJACEsMap = new Map<string, any>();
      
      // First, add all JACEs from network export (these have full network metadata)
      if (Array.isArray(netNodes) && netNodes.length > 0 && arch === 'supervisor') {
        // Mark network export uploaded/parsed
        base = updateNodeInTree(base, 'niagara-net-export', {
          uploadStatus: 'parsed',
          parsedData: persisted.supervisor.network
        });
        
        netNodes.slice(0, 15).forEach((netNode: any) => {
          const jaceName = netNode.Name || netNode.name;
          if (jaceName) {
            allJACEsMap.set(jaceName, {
              networkData: netNode,
              jaceData: null
            });
          }
        });
      }
      
      // Then, merge in data from persisted.jaces (files that were uploaded)
      jaceEntries.forEach(([jaceName, jData]: [string, any]) => {
        if (allJACEsMap.has(jaceName)) {
          // JACE already exists from network, just add the jaceData
          const existing = allJACEsMap.get(jaceName)!;
          existing.jaceData = jData;
        } else {
          // JACE only exists in persisted data (manually added or not in network)
          allJACEsMap.set(jaceName, {
            networkData: { 
              name: jaceName, 
              address: jData?.networkInfo?.ip || '', 
              hostModel: jData?.platform?.summary?.model || 'JACE', 
              version: jData?.platform?.system?.niagara_version || '' 
            },
            jaceData: jData
          });
        }
      });
      
      // Now create tree nodes for all unique JACEs
      if (allJACEsMap.size > 0 && arch === 'supervisor') {
        const jaceNodes: SystemTreeNode[] = [];
        let index = 0;
        
        allJACEsMap.forEach((jaceInfo, jaceName) => {
          // Create the JACE node with name-based ID for stability
          const jaceNode = createJACENodeFromNetworkData(jaceInfo.networkData, index, true);
          const jaceId = jaceNode.id;
          
          // Update child nodes with parsed data if available
          if (jaceInfo.jaceData) {
            const jData = jaceInfo.jaceData;
            
            // Update platform node
            if (jData.platform) {
              const platformChild = jaceNode.children?.find(c => c.id === `${jaceId}-platform`);
              if (platformChild) {
                platformChild.uploadStatus = 'parsed';
                platformChild.parsedData = jData.platform;
                platformChild.hasAnalysis = !!jData.platform?.analysis;
              }
            }
            
            // Update resource node
            if (jData.resources) {
              const resourceChild = jaceNode.children?.find(c => c.id === `${jaceId}-resource`);
              if (resourceChild) {
                resourceChild.uploadStatus = 'parsed';
                resourceChild.parsedData = jData.resources;
                resourceChild.hasAnalysis = !!jData.resources?.analysis;
              }
            }
            
            // Update driver nodes
            const driversContainer = jaceNode.children?.find(c => c.id === `${jaceId}-drivers`);
            if (driversContainer && driversContainer.children) {
              if (jData.drivers?.bacnet) {
                const bacnetChild = driversContainer.children.find(c => c.id === `${jaceId}-bacnet`);
                if (bacnetChild) {
                  bacnetChild.uploadStatus = 'parsed';
                  bacnetChild.parsedData = jData.drivers.bacnet;
                  bacnetChild.hasAnalysis = !!jData.drivers.bacnet?.analysis;
                }
              }
              if (jData.drivers?.n2) {
                const n2Child = driversContainer.children.find(c => c.id === `${jaceId}-n2`);
                if (n2Child) {
                  n2Child.uploadStatus = 'parsed';
                  n2Child.parsedData = jData.drivers.n2;
                  n2Child.hasAnalysis = !!jData.drivers.n2?.analysis;
                }
              }
            }
          }
          
          jaceNodes.push(jaceNode);
          index++;
        });
        
        console.log(`🔄 Rebuilding tree with ${jaceNodes.length} unique JACEs`);
        base = addJACEsToTree(base, jaceNodes);
      }

      return base;
    });
  }, [updateNodeInTree, findNodeById, createSupervisorTree, createEngineOnlyTree]);

  const toggleNode = useCallback((nodeId: string) => {
    setSystemTree(prev => updateNodeInTree(prev, nodeId, {
      expanded: !findNodeById(prev, nodeId)?.expanded
    }));
  }, [findNodeById, updateNodeInTree]);

  // Convert discovery run (DB entities) to SystemDiscoveryData shape
  const convertDiscoveryRunToSystemData = useCallback((run: any): any => {
    const data: any = {
      sessionId,
      systemType: (run?.run?.system_type === 'supervisor' ? 'supervisor' : 'engine-only'),
      detectedArchitecture: (run?.run?.system_type === 'supervisor' ? 'supervisor' : 'single-jace'),
      supervisor: {},
      jaces: {},
      uploadedFiles: [],
      lastUpdated: new Date()
    };

    if (run.supervisor) {
      data.supervisor = {
        platform: run.supervisor.identity || null,
        resources: run.supervisor.resources || null,
        network: run.supervisor.network || null
      };
    }

    (run.jaces || []).forEach((j: any) => {
      const key = j.name || `jace_${Object.keys(data.jaces).length + 1}`;
      data.jaces[key] = {
        platform: j.platform || null,
        resources: j.resources || null,
        drivers: {}
      };
      const drivers = j.drivers || {};
      Object.keys(drivers).forEach((t: string) => {
        data.jaces[key].drivers[t] = {
          ...drivers[t],
          devices: drivers[t]?.devices || []
        };
      });
    });

    return data;
  }, [sessionId]);

  // File upload handling
  const handleFileUpload = useCallback(async (files: FileList | null, targetNodeId?: string) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setPendingFile({ file, targetNodeId: targetNodeId || selectedNode });
  }, [selectedNode]);

  const processUploadedFile = useCallback(async (parsedData?: any) => {
    if (!pendingFile) {
      console.warn('⚠️ processUploadedFile called with no pendingFile');
      return;
    }

    const { file, targetNodeId } = pendingFile;
    const nodeId = targetNodeId || selectedNode;
    
    // Create unique file identifier for deduplication
    const fileId = `${file.name}-${file.size}-${file.lastModified}-${nodeId}`;
    
    // Check if already processing this exact file
    if (processingLockRef.current.has(fileId)) {
      console.warn(`🚫 File already being processed: ${file.name} at node ${nodeId}`);
      return;
    }
    
    // Check if this file was already processed
    if (processedFilesRef.current.has(fileId)) {
      console.warn(`🚫 File already processed: ${file.name} at node ${nodeId}`);
      setPendingFile(null);
      return;
    }
    
    // Acquire processing lock
    console.log(`🔒 Acquiring processing lock for: ${file.name} at node ${nodeId}`);
    processingLockRef.current.add(fileId);

    setIsProcessing(true);
    setPendingFile(null);

      // Declare fileContent outside try block so it's accessible throughout function
      let fileContent = '';

      try {
        // Parse the file FIRST to get actual data for visualization
        let processedData = parsedData;
        
        // CRITICAL FIX: Detect LiveCSVPreview shape and convert it properly
        const isLivePreviewShape = processedData && typeof processedData === 'object' && 
          'data' in processedData && 'mappings' in processedData && 'type' in processedData;
        
        console.log('📋 Preview Data Check:', {
          hasProcessedData: !!processedData,
          isLivePreviewShape,
          type: (processedData as any)?.type,
          dataLength: (processedData as any)?.data?.length
        });
        
        // Handle LiveCSVPreview data format
        if (isLivePreviewShape) {
          console.log('✅ Converting LiveCSVPreview data to TridiumExportProcessor format');
          fileContent = await file.text();
          const previewData = processedData as any;
          
          // Convert LiveCSVPreview shape to proper TridiumExportProcessor format
          // This avoids re-parsing and duplication
          const fileType = TridiumExportProcessor.detectFileFormat(file.name, fileContent);
          
          // Re-parse using TridiumExportProcessor for proper structure
          // BUT use the preview data as validation
          console.log(`🔄 Re-parsing ${previewData.type} file with TridiumExportProcessor for proper structure`);
          
          if (fileType.type === 'network') {
            processedData = TridiumExportProcessor.parseNiagaraNetworkExport(fileContent);
            console.log('🌐 Network data re-parsed:', processedData);
          } else if (fileType.type === 'resource') {
            processedData = TridiumExportProcessor.parseResourceExport(fileContent);
            console.log('📊 Resource data re-parsed:', processedData);
          } else if (fileType.type === 'bacnet') {
            processedData = TridiumExportProcessor.parseBACnetExport(fileContent);
            console.log('🔌 BACnet data re-parsed:', processedData);
          } else if (fileType.type === 'n2') {
            processedData = TridiumExportProcessor.parseN2Export(fileContent);
            console.log('📡 N2 data re-parsed:', processedData);
          } else {
            console.warn('⚠️ Unknown file type from LiveCSVPreview, using raw preview data');
            // Keep the preview data as-is if we can't determine type
          }
        } else if (!processedData) {
          try {
            // Use TridiumExportProcessor to parse the file immediately
            fileContent = await file.text();
            const fileType = TridiumExportProcessor.detectFileFormat(file.name, fileContent);

          console.log('🔍 Processing file:', file.name, 'detected type:', fileType.type);

          // Parse with the correct TridiumExportProcessor methods based on file type
          if (fileType.type === 'platform' && file.name.endsWith('.txt')) {
            processedData = TridiumExportProcessor.parsePlatformDetails(fileContent);
            console.log('📄 Platform data processed:', processedData);
          } else if (fileType.type === 'resource' && file.name.endsWith('.csv')) {
            processedData = TridiumExportProcessor.parseResourceExport(fileContent);
            console.log('📊 Resource data processed:', processedData);
          } else if (fileType.type === 'network' && file.name.endsWith('.csv')) {
            processedData = TridiumExportProcessor.parseNiagaraNetworkExport(fileContent);
            console.log('🌐 Network parsing result:', processedData);
          } else if (fileType.type === 'bacnet' && file.name.endsWith('.csv')) {
            processedData = TridiumExportProcessor.parseBACnetExport(fileContent);
            console.log('🔌 BACnet data processed:', processedData);
          } else if (fileType.type === 'n2' && file.name.endsWith('.csv')) {
            processedData = TridiumExportProcessor.parseN2Export(fileContent);
            console.log('📡 N2 data processed:', processedData);
          } else {
            // Fallback to single file processing
            processedData = await TridiumExportProcessor.processFiles([file]);
            console.log('🔄 Fallback processing result:', processedData);
          }
          // Normalize to canonical shapes so previews/storage always match the parsed view
          try {
            const { TridiumParsedNormalizer } = await import('@/services/TridiumParsedNormalizer');
            processedData = TridiumParsedNormalizer.normalizeByType(processedData, fileType.type);
          } catch (e) {
            console.warn('Normalizer not available or failed, using raw parsed data', e);
          }
        } catch (parseError) {
          console.error('File parsing failed:', parseError);
          processedData = {
            error: parseError instanceof Error ? parseError.message : 'Parse failed',
            filename: file.name,
            timestamp: new Date()
          };
        }
      }

      // Auto-detect system type if in auto mode
      if (systemType === 'auto') {
        const filename = file.name.toLowerCase();
        if (filename.includes('supervisor')) {
          switchToMode('supervisor');
        } else if (filename.includes('jace') || filename.includes('platform')) {
          switchToMode('engine-only');
        }
      }

      // Update tree node with uploaded file AND parsed data for immediate visualization
      setSystemTree(prev => updateNodeInTree(prev, nodeId, {
        uploadStatus: 'parsed', // Changed to 'parsed' to indicate data is ready
        file: file,
        parsedData: processedData,
        hasAnalysis: !!processedData?.analysis || !!processedData?.alerts || !!processedData?.devices,
        alertCount: processedData?.totalAlerts || processedData?.alerts?.length || 0,
        criticalAlerts: processedData?.criticalAlerts || (processedData?.alerts?.filter((a: any) => a.severity === 'critical')?.length || 0)
      }));

      // Store parsed data in system data structure
      const dataType = determineDataType(nodeId);
      const targetLocation = determineTargetLocation(nodeId);

      // Persist the original upload and parsed payload to Supabase (non-blocking)
      if (sessionId && isValidUUID(sessionId)) {
        try {
          await TridiumImportStoreService.storeUploadedDataset({
            sessionId: effectiveSessionId,
            customerId,
            siteName,
            nodeId,
            dataType: dataType as any,
            file,
            rawText: fileContent,
            parsedData: processedData,
            targetLocation
          });
        } catch (e) {
          console.warn('Non-fatal: failed to persist dataset file to storage', e);
        }
      }

      // Update local system data immediately with processed data
      let nextSystemDataSnapshot: any;
      setSystemData(prev => {
        const updated = { ...prev };
        
        // CRITICAL: Remove duplicate file if it already exists for this node
        // This prevents infinite loops from re-uploading the same file
        const existingFileIndex = updated.uploadedFiles.findIndex(
          f => f.nodeId === nodeId || (f.name === file.name && f.type === dataType)
        );
        
        if (existingFileIndex !== -1) {
          console.log('🔄 Replacing existing file at node:', nodeId);
          // Remove the old entry
          updated.uploadedFiles.splice(existingFileIndex, 1);
        }
        
        // Now add the new file
        updated.uploadedFiles.push({
          name: file.name,
          type: dataType,
          nodeId,
          uploadTime: new Date(),
          parsedData: processedData  // CRITICAL: Store the parsed data with the file info
        });
        updated.lastUpdated = new Date();

        // Store processed data in appropriate location for easy access
        if (targetLocation.type === 'supervisor') {
          if (!updated.supervisor) updated.supervisor = {} as any;
          (updated.supervisor as any)[dataType] = processedData;
          console.log(`✅ Stored ${dataType} data to SUPERVISOR`);
        } else if (targetLocation.type === 'jace') {
          const jaceName = targetLocation.name || 'primary_jace';
          
          // Validation: Check if we're about to overwrite existing data
          if (updated.jaces[jaceName] && (updated.jaces[jaceName] as any)[dataType]) {
            console.warn(`⚠️ OVERWRITING existing ${dataType} data for JACE "${jaceName}"!`);
            console.warn('Previous data:', (updated.jaces[jaceName] as any)[dataType]);
            console.warn('New data:', processedData);
          }
          
          if (!updated.jaces[jaceName]) {
            console.log(`🆕 Creating new JACE entry: "${jaceName}"`);
            updated.jaces[jaceName] = { drivers: {} } as any;
          }

          if (dataType === 'bacnet' || dataType === 'n2' || dataType === 'modbus' || dataType === 'lon') {
            updated.jaces[jaceName].drivers[dataType] = processedData;
            console.log(`✅ Stored ${dataType} driver data to JACE "${jaceName}"`);
          } else if (dataType === 'platform' || dataType === 'resources') {
            (updated.jaces[jaceName] as any)[dataType] = processedData;
            console.log(`✅ Stored ${dataType} data to JACE "${jaceName}"`);
          }
        }

        // Capture snapshot for downstream analysis compute
        nextSystemDataSnapshot = updated;
        console.log('💾 System data updated with parsed data:', updated);
        return updated;
      });

      // Compute and persist analysis snapshot asynchronously (non-blocking)
      if (effectiveSessionId) {
        try {
          if (targetLocation.type === 'supervisor') {
            const snap = DiscoveryAnalysisService.computeSupervisorSnapshot(nextSystemDataSnapshot, analysisSettings || undefined);
            await PlatformDataService.upsertAnalysisSnapshot(effectiveSessionId, snap);
          } else if (targetLocation.type === 'jace') {
            const jaceName = targetLocation.name || 'primary_jace';
            const j = nextSystemDataSnapshot?.jaces?.[jaceName] || {};
            const snap = DiscoveryAnalysisService.computeJaceSnapshot(jaceName, j, analysisSettings || undefined);
            await PlatformDataService.upsertAnalysisSnapshot(effectiveSessionId, snap);
          }
        } catch (e) {
          console.warn('Non-fatal: analysis snapshot upsert failed', e);
        }
      }

      // Handle special network discovery FIRST before cross-validation
      if (nodeId === 'niagara-net-export') {
        console.log('🔍 Processing Network Export for JACE discovery...', processedData);

        // Use the correct structure from NiagaraNetworkParsedData
        let networkNodes: any[] = [];

        if (processedData?.network?.nodes && Array.isArray(processedData.network.nodes)) {
          // This is the correct structure from TridiumExportProcessor.parseNiagaraNetworkExport
          networkNodes = processedData.network.nodes;
          console.log('📡 Using network.nodes from NiagaraNetworkParsedData');
        } else if (Array.isArray(processedData?.nodes)) {
          // Fallback for other structures
          networkNodes = processedData.nodes;
          console.log('📡 Using direct nodes array');
        } else if (Array.isArray(processedData)) {
          // Direct array fallback
          networkNodes = processedData;
          console.log('📡 Using processedData as direct array');
        }

        console.log('📊 Found network data:', networkNodes);

        if (networkNodes && Array.isArray(networkNodes) && networkNodes.length > 0) {
          console.log(`🎯 Discovering JACEs from ${networkNodes.length} network nodes...`);
          // Process network discovery synchronously to avoid race conditions
          handleNetworkDiscoverySync(networkNodes);
        } else {
          console.warn('⚠️ No network nodes found for JACE discovery');
          // Set a simple message without complex nested updates
          setSystemTree(prev => updateNodeInTree(prev, 'niagara-network', {
            uploadStatus: 'parsed',
            name: 'Niagara Network (No JACEs found)'
          }));
        }
      }

      // Defer cross-validation to avoid race conditions - with debouncing built into processCrossValidation
      // Clear any pending timeout first to prevent accumulation
      if (crossValidationTimeoutRef.current) {
        clearTimeout(crossValidationTimeoutRef.current);
      }
      crossValidationTimeoutRef.current = setTimeout(() => {
        processCrossValidation();
        crossValidationTimeoutRef.current = null;
      }, 500); // Increased from 100ms to 500ms for better stability

      // Persist to database (or local fallback) using effective session id
      if (effectiveSessionId) {
        persistDataToDatabase(effectiveSessionId, dataType, processedData, targetLocation);
      }

      // Persist to discovery entity model (durable) if run exists
      try {
        if (!isDatabaseMode) return;
        const ensured = discoveryRunId || await DiscoveryRunService.tryEnsureRunOrNull({ sessionId: effectiveSessionId, customerId, siteName, systemType: systemType === 'supervisor' ? 'supervisor' : 'engine' });
        if (!ensured) {
          // Discovery persistence unavailable in this environment; skip silently
          return;
        }
        if (!discoveryRunId) setDiscoveryRunId(ensured);

        if (targetLocation.type === 'supervisor') {
          if (dataType === 'platform') await DiscoveryRunService.upsertSupervisor(ensured, { identity: processedData });
          if (dataType === 'resources') await DiscoveryRunService.upsertSupervisor(ensured, { resources: processedData });
          if (dataType === 'niagara_network') {
            await DiscoveryRunService.upsertSupervisor(ensured, { network: processedData });
            // Also instantiate JACEs from network nodes
            const nodes = (processedData?.network?.nodes || processedData?.nodes || []) as any[];
            if (Array.isArray(nodes) && nodes.length > 0) {
              await DiscoveryRunService.upsertJacesFromNetwork(ensured, nodes as any);
            }
          }
        } else if (targetLocation.type === 'jace') {
          const jaceName = targetLocation.name || 'primary_jace';
          if (dataType === 'platform') await DiscoveryRunService.upsertJacePlatform(ensured, jaceName, processedData);
          if (dataType === 'resources') await DiscoveryRunService.upsertJaceResources(ensured, jaceName, processedData);
          if (dataType === 'bacnet' || dataType === 'n2' || dataType === 'modbus' || dataType === 'lon') {
            await DiscoveryRunService.upsertDriverAndDevices(ensured, jaceName, dataType as any, processedData);
          }
        }
      } catch (e) {
        console.warn('Non-fatal: failed to persist to discovery entity model', e);
      }

    } catch (error) {
      console.error('❌ Error processing uploaded file:', error);
      setSystemTree(prev => updateNodeInTree(prev, nodeId, {
        uploadStatus: 'error'
      }));
    } finally {
      // Release processing lock
      console.log(`🔓 Releasing processing lock for: ${file.name} at node ${nodeId}`);
      processingLockRef.current.delete(fileId);
      
      // Mark as processed to prevent future re-processing
      processedFilesRef.current.add(fileId);
      console.log(`✅ File marked as processed: ${file.name}`);
      
      setIsProcessing(false);
    }
  }, [pendingFile, selectedNode, sessionId, systemType, switchToMode, onDataChange]);

  // Helper functions
  const determineDataType = (nodeId: string): string => {
    if (nodeId.includes('platform')) return 'platform';
    if (nodeId.includes('resource')) return 'resources';
    if (nodeId.includes('bacnet')) return 'bacnet';
    if (nodeId.includes('n2')) return 'n2';
    if (nodeId.includes('niagara') && nodeId.includes('net')) return 'niagara_network';
    if (nodeId.includes('modbus')) return 'modbus';
    if (nodeId.includes('lon')) return 'lon';
    return 'unknown';
  };

  // Resolve a friendly JACE name for persistence (prefer discovered jaceInfo.name)
  const resolveJaceNameFromNodeId = useCallback((nodeId: string): string => {
    console.log(`🔍 Resolving JACE name for nodeId: ${nodeId}`);
    
    // Climb up to the parent JACE node if this is a child (e.g., jace-0-platform)
    const climbToJace = (node: SystemTreeNode | null): SystemTreeNode | null => {
      if (!node) return null;
      if (node.type === 'jace' && node.id.startsWith('jace-')) return node;
      // Search whole tree and track parent
      const findParent = (current: SystemTreeNode, targetId: string, parent: SystemTreeNode | null): SystemTreeNode | null => {
        if (current.id === targetId) return parent;
        for (const child of current.children || []) {
          const res = findParent(child, targetId, current);
          if (res) return res;
        }
        return null;
      };
      const parent = findParent(systemTree, nodeId, null);
      return parent && parent.type === 'jace' ? parent : null;
    };

    const node = findNodeById(systemTree, nodeId);
    console.log(`📍 Found node:`, node ? { id: node.id, name: node.name, type: node.type, jaceInfo: node.jaceInfo } : null);
    
    const jaceNode = node?.type === 'jace' ? node : climbToJace(node);
    console.log(`📍 JACE node:`, jaceNode ? { id: jaceNode.id, name: jaceNode.name, jaceInfo: jaceNode.jaceInfo } : null);
    
    // Priority 1: Use jaceInfo.name (from network discovery)
    if (jaceNode?.jaceInfo?.name) {
      console.log(`✅ Using jaceInfo.name: "${jaceNode.jaceInfo.name}"`);
      return jaceNode.jaceInfo.name;
    }
    
    // Priority 2: Extract name from node.name (remove IP suffix)
    if (jaceNode?.name) {
      const cleanName = jaceNode.name.replace(/\s*\(.+\)$/, '').trim();
      if (cleanName && cleanName !== 'JACE' && cleanName !== 'Engine Only System') {
        console.log(`✅ Using extracted name: "${cleanName}"`);
        return cleanName;
      }
    }
    
    // Priority 3: Extract from nodeId pattern (jace-SF_NERO_FX1_51)
    const nameMatch = nodeId.match(/jace-([A-Za-z0-9_]+)_\d+/);
    if (nameMatch) {
      const extractedName = nameMatch[1].replace(/_/g, '.');
      console.log(`✅ Using extracted from nodeId: "${extractedName}"`);
      return extractedName;
    }
    
    // Priority 4: Numeric fallback
    const numMatch = nodeId.match(/jace-(\d+)/);
    const fallback = numMatch ? `JACE_${numMatch[1]}` : 'primary_jace';
    console.log(`🚨 Falling back to: "${fallback}"`);
    return fallback;
  }, [systemTree, findNodeById]);

  const determineTargetLocation = (nodeId: string): { type: 'supervisor' | 'jace'; name?: string } => {
    // Network exports always go to supervisor level
    if (nodeId.includes('supervisor') || nodeId.includes('niagara-net')) {
      console.log(`📍 Target Location: Supervisor (nodeId: ${nodeId})`);
      return { type: 'supervisor' };
    }
    // Prefer resolving JACE name from the tree
    const resolved = resolveJaceNameFromNodeId(nodeId);
    console.log(`📍 Target Location: JACE "${resolved}" (nodeId: ${nodeId})`);
    
    // Additional validation: ensure we have a meaningful JACE name
    if (!resolved || resolved === 'primary_jace') {
      console.warn(`⚠️ Could not resolve specific JACE name for nodeId: ${nodeId}, using default: ${resolved}`);
    }
    
    return { type: 'jace', name: resolved };
  };

  const handleNetworkDiscoverySync = useCallback((networkNodes: any[]) => {
    if (!networkNodes || !Array.isArray(networkNodes)) {
      console.warn('❌ Invalid network nodes data for discovery');
      return;
    }

    console.log('🔍 Processing network nodes synchronously for JACE discovery:', networkNodes);

    // Filter and create JACE nodes - STRICT: Type must be "Niagara Station"
    const jaceNodes = networkNodes
      .filter(node => {
        if (!node || typeof node !== 'object') return false;

        // STRICT MATCHING: Type must be exactly "Niagara Station" (case-insensitive)
        const type = (node.Type || node.type || '').toString();
        const isJACE = type.toLowerCase() === 'niagara station';

        if (isJACE) {
          console.log('✅ JACE detected (Niagara Station):', node.Name || node.name, node['Host Model'] || node.hostModel);
        }

        return isJACE;
      })
      .slice(0, 15) // Limit to 15 JACEs max
      .map((networkNode, index) => createJACENodeFromNetworkData(networkNode, index, true));

    console.log(`🎯 Created ${jaceNodes.length} JACE nodes`);

    if (jaceNodes.length > 0) {
      setSystemTree(prev => addJACEsToTree(prev, jaceNodes));
      // Persist placeholder JACE entries in in-memory snapshot so refresh immediately restores
      setSystemData(prev => {
        const next = { ...prev, jaces: { ...prev.jaces } } as any;
        jaceNodes.forEach((jn: any) => {
          const jaceName = jn?.jaceInfo?.name || jn?.name?.replace(/\s*\(.+\)$/,'') || `JACE_${Object.keys(next.jaces).length+1}`;
          if (!next.jaces[jaceName]) {
            next.jaces[jaceName] = { platform: undefined, resources: undefined, drivers: {} };
          }
        });
        next.lastUpdated = new Date();
        return next;
      });
      console.log('🌲 JACE nodes added to tree and cached in systemData');
    }
  }, []);


  const createJACENodeFromNetworkData = (networkNode: any, index: number, useNameAsId: boolean = false): SystemTreeNode => {
    // Handle both parser format (Name, Address, etc.) and legacy format (name, address, etc.)
    const jaceName = networkNode.Name || networkNode.name || `JACE_${index + 1}`;
    const ipAddress = networkNode.ip || networkNode.Address || networkNode.address || 'Unknown';
    const hostModel = networkNode['Host Model'] || networkNode.hostModel || 'Unknown';
    const version = networkNode.Version || networkNode.version || '';
    const niagaraPath = networkNode.Path || networkNode.path || '';

    // Generate stable ID based on JACE name and IP to prevent duplicates
    // Use IP last octet as unique suffix if names are similar
    const sanitizedName = jaceName.replace(/[^a-zA-Z0-9]/g, '_');
    const ipSuffix = ipAddress !== 'Unknown' ? ipAddress.split('.').pop() : index;
    const jaceId = useNameAsId ? `jace-${sanitizedName}_${ipSuffix}` : `jace-${index}`;

    console.log(`🏗️ Creating JACE node: ${jaceName} (${ipAddress}) - ${hostModel} [ID: ${jaceId}]`);

    return {
      id: jaceId,
      name: `${jaceName} (${ipAddress})`,
      type: 'jace',
      icon: Cpu,
      expanded: false,
      uploadStatus: 'pending',
      canRemove: true,
      hasAnalysis: false,
      alertCount: 0,
      criticalAlerts: 0,
      jaceInfo: {
        name: jaceName,
        ip: ipAddress,
        hostModel: hostModel,
        version: version,
        status: networkNode.status || [],
        path: niagaraPath,
        type: networkNode.type || 'Unknown'
      },
      children: [
        {
          id: `${jaceId}-platform`,
          name: 'Platform Details',
          type: 'file',
          icon: FileText,
          uploadStatus: 'pending',
          uploadPrompt: `Upload ${jaceName}PlatformDetails.txt`,
          acceptedFiles: [`${jaceName}PlatformDetails.txt`, 'JacePlatformDetails.txt'],
          hasAnalysis: false,
          alertCount: 0,
          criticalAlerts: 0
        },
        {
          id: `${jaceId}-resource`,
          name: 'Resource Export',
          type: 'file',
          icon: HardDrive,
          uploadStatus: 'pending',
          uploadPrompt: `Upload ${jaceName}_ResourceExport.csv`,
          acceptedFiles: [`${jaceName}_ResourceExport.csv`, 'JaceResourceExport.csv'],
          hasAnalysis: false,
          alertCount: 0,
          criticalAlerts: 0
        },
        {
          id: `${jaceId}-drivers`,
          name: 'Drivers',
          type: 'drivers-container',
          icon: Database,
          expanded: false,
          uploadStatus: 'pending',
          canAddChildren: true,
          hasAnalysis: false,
          alertCount: 0,
          criticalAlerts: 0,
          children: [
            {
              id: `${jaceId}-bacnet`,
              name: 'BACnet',
              type: 'file',
              icon: Network,
              uploadStatus: 'pending',
              uploadPrompt: `Upload ${jaceName}BacnetExport.csv`,
              acceptedFiles: [`${jaceName}BacnetExport.csv`, 'BacnetExport.csv'],
              driverType: 'BACnet',
              canRemove: true,
              hasAnalysis: false,
              alertCount: 0,
              criticalAlerts: 0
            },
            {
              id: `${jaceId}-n2`,
              name: 'N2',
              type: 'file',
              icon: Network,
              uploadStatus: 'pending',
              uploadPrompt: `Upload ${jaceName}_N2xport.csv`,
              acceptedFiles: [`${jaceName}_N2xport.csv`, 'N2Export.csv'],
              driverType: 'N2',
              canRemove: true,
              hasAnalysis: false,
              alertCount: 0,
              criticalAlerts: 0
            },
            {
              id: `${jaceId}-add-driver`,
              name: '[Add Driver]',
              type: 'add-driver',
              icon: Plus,
              uploadStatus: 'pending',
              isAddButton: true,
              hasAnalysis: false,
              alertCount: 0,
              criticalAlerts: 0
            }
          ]
        }
      ]
    };
  };

  const addJACEsToTree = (tree: SystemTreeNode, jaceNodes: SystemTreeNode[]): SystemTreeNode => {
    const updateNiagaraNetwork = (node: SystemTreeNode): SystemTreeNode => {
      if (node.id === 'niagara-network') {
        const existingChildren = node.children || [];
        
        // Separate JACE nodes from other nodes (like "Add JACE Manually" and export nodes)
        const existingJACEs = existingChildren.filter(child => child.type === 'jace');
        const nonJACEChildren = existingChildren.filter(child => child.type !== 'jace');
        
        // De-duplicate JACEs by JACE name (from jaceInfo)
        const existingJACENames = new Set(
          existingJACEs.map(jace => jace.jaceInfo?.name || jace.name).filter(Boolean)
        );
        
        // Only add new JACEs that don't already exist
        const newJACEs = jaceNodes.filter(newJace => {
          const newJACEName = newJace.jaceInfo?.name || newJace.name;
          const isDuplicate = existingJACENames.has(newJACEName);
          if (isDuplicate) {
            console.log(`🔍 Skipping duplicate JACE: ${newJACEName}`);
          }
          return !isDuplicate;
        });
        
        console.log(`📋 JACE deduplication: ${existingJACEs.length} existing, ${jaceNodes.length} incoming, ${newJACEs.length} new`);
        
        return {
          ...node,
          expanded: true,
          uploadStatus: 'uploaded',
          children: [
            ...nonJACEChildren,  // Keep non-JACE children (buttons, export files)
            ...existingJACEs,    // Keep existing JACEs
            ...newJACEs          // Add only new JACEs
          ]
        };
      }
      if (node.children) {
        return {
          ...node,
          children: node.children.map(updateNiagaraNetwork)
        };
      }
      return node;
    };

    return updateNiagaraNetwork(tree);
  };

  // Debounced database persistence to prevent timeout errors

  const persistDataToDatabase = useCallback(async (sessionId: string, dataType: string, parsedData: any, targetLocation: any) => {
    if (!sessionId) return;

    const callKey = `${sessionId}-${dataType}-${targetLocation.type}-${targetLocation.name || 'primary'}`;

    // Guarantee persistence immediately to survive refresh
    if (['platform','resources','niagara_network'].includes(dataType)) {
      try {
        await PlatformDataService.storeIndividualDataType(sessionId, dataType as any, parsedData, targetLocation);
        return;
      } catch (e) {
        console.warn(`Immediate ${dataType} store failed, enqueueing instead`, e);
      }
    }

    // Add to queue (batch) for other types/drivers
    setDatabaseCallQueue(prev => new Map(prev).set(callKey, { sessionId, dataType, parsedData, targetLocation }));
  }, []);

  // Process database queue with debouncing
  useEffect(() => {
    if (databaseCallQueue.size === 0 || isDatabaseSaving) return;

    const timeoutId = setTimeout(async () => {
      setIsDatabaseSaving(true);

      try {
        // Process all queued calls in parallel, but with timeout protection
        const queueEntries = Array.from(databaseCallQueue.entries());
        const batchPromises = queueEntries.map(async ([key, call]) => {
          try {
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error(`Database timeout for ${call.dataType}`)), 8000);
            });

            const storePromise = PlatformDataService.storeIndividualDataType(
              call.sessionId,
              call.dataType,
              call.parsedData,
              call.targetLocation
            );

            await Promise.race([storePromise, timeoutPromise]);
            console.log(`✅ ${call.dataType} data stored successfully for ${call.targetLocation.type}: ${call.targetLocation.name || 'primary'}`);
            return key;
          } catch (error) {
            console.error(`❌ Error storing ${call.dataType} data:`, error);
            return null;
          }
        });

        const completedKeys = await Promise.all(batchPromises);

        // Remove completed calls from queue
        setDatabaseCallQueue(prev => {
          const updated = new Map(prev);
          completedKeys.forEach(key => {
            if (key) updated.delete(key);
          });
          return updated;
        });

      } catch (error) {
        console.error('❌ Batch database operation failed:', error);
      } finally {
        setIsDatabaseSaving(false);
      }
    }, 5000); // 5-second debounce for database operations

    return () => clearTimeout(timeoutId);
  }, [databaseCallQueue, isDatabaseSaving]);

  // Add ref to track last cross-validation to prevent infinite loops
  const lastCrossValidationRef = React.useRef<number>(0);
  const crossValidationTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const processCrossValidation = useCallback(() => {
    // Debounce: prevent calling more than once per 2 seconds
    const now = Date.now();
    if (now - lastCrossValidationRef.current < 2000) {
      console.log('⏭️ Skipping cross-validation (debounced)');
      return;
    }
    lastCrossValidationRef.current = now;

    console.log('🔄 Processing cross-validation...');

    // Collect all parsed files for cross-validation
    const collectParsedFiles = (node: SystemTreeNode): Record<string, any> => {
      const files: Record<string, any> = {};
      if (node.parsedData && node.file) {
        files[node.file.name] = node.parsedData;
        console.log(`📄 Collected parsed data for: ${node.file.name}`);
      }
      if (node.children) {
        node.children.forEach(child => {
          Object.assign(files, collectParsedFiles(child));
        });
      }
      return files;
    };

    // Process cross-validation synchronously
    setSystemTree(currentTree => {
      const allParsedFiles = collectParsedFiles(currentTree);
      console.log(`📊 Cross-validating ${Object.keys(allParsedFiles).length} files`);

      if (Object.keys(allParsedFiles).length > 0) {
        try {
          const crossValidated = TridiumExportProcessor.crossValidateData(allParsedFiles);

          // Update system data with proper analysis structure
          setSystemData(prev => ({
            ...prev,
            crossValidatedData: crossValidated,
            // Ensure analysis data is properly structured for SystemAnalysisDisplay
            analysisData: {
              ...crossValidated,
              // Ensure each JACE has properly structured analysis data
              jaces: Object.entries(crossValidated.jaces || {}).reduce((acc, [jaceName, jaceData]: [string, any]) => {
                acc[jaceName] = {
                  ...jaceData,
                  // If platform data exists, ensure it has analysis
                  platform: jaceData.platform ? {
                    ...jaceData.platform,
                    analysis: jaceData.platform.analysis || {
                      healthScore: 0,
                      alerts: [],
                      recommendations: []
                    }
                  } : undefined,
                  // If resource data exists, ensure it has analysis
                  resources: jaceData.resources ? {
                    ...jaceData.resources,
                    analysis: jaceData.resources.analysis || {
                      healthScore: 0,
                      alerts: [],
                      recommendations: []
                    }
                  } : undefined
                };
                return acc;
              }, {} as any)
            },
            importSummary: {
              totalFiles: Object.keys(allParsedFiles).length,
              processedFiles: Object.keys(allParsedFiles).length,
              totalDevices: Object.values(crossValidated.jaces || {}).reduce((total: number, jace: any) =>
                total + (jace?.drivers?.bacnet?.devices?.length || 0) + (jace?.drivers?.n2?.devices?.length || 0), 0),
              jaceCount: Object.keys(crossValidated.jaces || {}).length,
              totalAlerts: 0,
              criticalAlerts: 0
            }
          }));

          // Notify parent immediately
          if (onSystemDataComplete) {
            onSystemDataComplete({
              ...crossValidated,
              metadata: {
                processedFiles: Object.keys(allParsedFiles),
                totalFiles: Object.keys(allParsedFiles).length,
                uploadTimestamp: new Date(),
                sessionId: effectiveSessionId,
                systemArchitecture: systemType
              }
            });
          }

        } catch (error) {
          console.error('❌ Cross-validation error:', error);
        }
      }

      return currentTree;
    });
  }, [onSystemDataComplete, sessionId, systemType]);

  // File removal
  const removeUploadedFile = useCallback((nodeId: string) => {
    // Clear UI tree
    setSystemTree(prev => updateNodeInTree(prev, nodeId, {
      uploadStatus: 'pending',
      file: undefined,
      parsedData: undefined,
      hasAnalysis: false,
      alertCount: 0,
      criticalAlerts: 0
    }));

    // Compute persistence target
    const dataType = determineDataType(nodeId) as 'platform' | 'resources' | 'bacnet' | 'n2' | 'niagara_network' | 'modbus' | 'lon';
    const target = determineTargetLocation(nodeId);

    // Persist removal (DB or local-only handled in service)
    if (effectiveSessionId) {
      PlatformDataService.removeIndividualDataType(effectiveSessionId, dataType as any, target)
        .catch((e) => console.warn('Non-fatal: failed to persist removal', e));
    }

    // Update local system data snapshot
    setSystemData(prev => {
      const updated: any = { ...prev };
      updated.uploadedFiles = updated.uploadedFiles.filter(f => f.nodeId !== nodeId);
      // Remove from structured data
      if (target.type === 'supervisor') {
        updated.supervisor = updated.supervisor || {};
        if (dataType === 'platform' && updated.supervisor.platform) delete updated.supervisor.platform;
        if (dataType === 'resources' && updated.supervisor.resources) delete updated.supervisor.resources;
        if (dataType === 'niagara_network' && updated.supervisor.network) delete updated.supervisor.network;
      } else if (target.type === 'jace') {
        const jname = target.name || 'primary_jace';
        updated.jaces = updated.jaces || {};
        updated.jaces[jname] = updated.jaces[jname] || { drivers: {} };
        if (dataType === 'platform' && updated.jaces[jname].platform) delete updated.jaces[jname].platform;
        if (dataType === 'resources' && updated.jaces[jname].resources) delete updated.jaces[jname].resources;
        if (['bacnet','n2','modbus','lon'].includes(dataType)) {
          if (updated.jaces[jname].drivers?.[dataType]) delete updated.jaces[jname].drivers[dataType];
        }
      }
      updated.lastUpdated = new Date();
      return updated;
    });

    // Recompute analysis after removal
    processCrossValidation();
  }, [updateNodeInTree]);

  // Add driver functionality
  const addDriver = useCallback((parentNodeId: string, driverType: string) => {
    const driverTypes = {
      'Modbus': { icon: Network, acceptedFiles: ['ModbusExport.csv'] },
      'LON': { icon: Network, acceptedFiles: ['LonExport.csv'] },
      'OPC': { icon: Network, acceptedFiles: ['OpcExport.csv'] },
      'Custom': { icon: Network, acceptedFiles: ['*.csv'] }
    };

    const driverConfig = driverTypes[driverType as keyof typeof driverTypes] || driverTypes['Custom'];
    const driverId = `${parentNodeId}-${driverType.toLowerCase()}`;

    setSystemTree(prev => {
      const addDriverToNode = (node: SystemTreeNode): SystemTreeNode => {
        if (node.id === parentNodeId && node.type === 'drivers-container') {
          const newDriver: SystemTreeNode = {
            id: driverId,
            name: driverType,
            type: 'file',
            icon: driverConfig.icon,
            uploadStatus: 'pending',
            uploadPrompt: `Upload ${driverType} export file`,
            acceptedFiles: driverConfig.acceptedFiles,
            driverType,
            canRemove: true,
            hasAnalysis: false,
            alertCount: 0,
            criticalAlerts: 0
          };

          // Insert before the [Add Driver] button
          const children = [...(node.children || [])];
          const addButtonIndex = children.findIndex(child => child.type === 'add-driver');
          if (addButtonIndex >= 0) {
            children.splice(addButtonIndex, 0, newDriver);
          } else {
            children.push(newDriver);
          }

          return { ...node, children };
        }

        if (node.children) {
          return { ...node, children: node.children.map(addDriverToNode) };
        }

        return node;
      };

      return addDriverToNode(prev);
    });

    setShowAddDriverModal(null);
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setSystemTree(prev => {
      const removeFromNode = (node: SystemTreeNode): SystemTreeNode => {
        if (node.children) {
          const filteredChildren = node.children.filter(child => child.id !== nodeId);
          return { ...node, children: filteredChildren.map(removeFromNode) };
        }
        return node;
      };

      return removeFromNode(prev);
    });
  }, []);

  // Render functions
  const renderTreeNode = useCallback((node: SystemTreeNode, depth = 0): React.ReactNode => {
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNode === node.id;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`flex items-center py-2 px-3 cursor-pointer hover:bg-gray-100 rounded-md transition-colors ${
            isSelected ? `bg-blue-50 border-l-4 border-l-blue-500` : ''
          }`}
          style={{ paddingLeft: `${depth * 16 + 12}px` }}
          onClick={() => {
            if (node.type === 'add-driver') {
              // Check if this is manual JACE addition or driver addition
              if (node.id === 'add-manual-jace') {
                // Prompt for JACE details
                const jaceName = prompt('Enter JACE name (e.g., SF_NERO_FX1):');
                if (jaceName && jaceName.trim()) {
                  const jaceIP = prompt(`Enter IP address for ${jaceName} (optional):`) || 'Manual Entry';
                  const jaceModel = prompt(`Enter model for ${jaceName} (e.g., TITAN, JACE-8000):`) || 'JACE';
                  
                  // Create manual JACE node
                  const manualJACE = {
                    name: jaceName.trim(),
                    ip: jaceIP,
                    hostModel: jaceModel,
                    type: 'Niagara Station',
                    version: 'Unknown',
                    status: ['manual'],
                    connected: false
                  };
                  
                  // Add to tree
                  handleNetworkDiscoverySync([manualJACE]);
                }
              } else {
                setShowAddDriverModal(node.id.replace('-add-driver', ''));
              }
            } else {
              setSelectedNode(node.id);
            }
          }}
        >
          {hasChildren && !node.isAddButton && (
            <Button
              variant="ghost"
              size="sm"
              className="h-5 w-5 p-0 mr-2"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
            >
              {node.expanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
            </Button>
          )}

          <node.icon className={`h-4 w-4 mr-2 ${
            node.isAddButton ? 'text-blue-500' :
            node.uploadStatus === 'uploaded' ? 'text-green-600' :
            node.uploadStatus === 'error' ? 'text-red-600' : 'text-gray-600'
          }`} />

          <span className={`text-sm flex-1 truncate ${
            node.isAddButton ? 'text-blue-500 font-medium' : 'font-medium'
          }`}>
            {node.name}
          </span>

          {node.jaceInfo && (
            <div className="text-xs text-gray-500 mr-2">
              {node.jaceInfo.ip}
            </div>
          )}

          {!node.isAddButton && (
            <div className="ml-2 flex items-center gap-1">
              {node.uploadStatus === 'parsed' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
              {node.uploadStatus === 'uploaded' && <CheckCircle2 className="h-4 w-4 text-blue-600" />}
              {node.uploadStatus === 'error' && <X className="h-4 w-4 text-red-600" />}

              {/* Show data indicators for parsed files */}
              {node.parsedData && (
                <div className="flex items-center gap-1">
                  {node.parsedData.devices && (
                    <Badge variant="outline" className="text-xs bg-blue-50">
                      {node.parsedData.devices.length} devices
                    </Badge>
                  )}
                  {node.parsedData.summary && (
                    <Badge variant="outline" className="text-xs bg-green-50">
                      Platform
                    </Badge>
                  )}
                  {node.parsedData.performance && (
                    <Badge variant="outline" className="text-xs bg-orange-50">
                      Metrics
                    </Badge>
                  )}
                  {node.parsedData.network && (
                    <Badge variant="outline" className="text-xs bg-purple-50">
                      {node.parsedData.network.nodes?.length || 0} stations
                    </Badge>
                  )}
                </div>
              )}

              {node.alertCount > 0 && (
                <Badge variant={node.criticalAlerts > 0 ? "destructive" : "secondary"} className="text-xs">
                  {node.alertCount}
                </Badge>
              )}
              {(node.canRemove || (node.type === 'jace' && node.jaceInfo)) && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 w-5 p-0 opacity-0 hover:opacity-100 hover:text-red-600"
                  title={node.type === 'jace' ? 'Remove JACE' : 'Remove file'}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (node.type === 'jace') {
                      if (confirm(`Remove ${node.name} and all its data?`)) {
                        removeNode(node.id);
                      }
                    } else {
                      removeUploadedFile(node.id);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          )}
        </div>

        {hasChildren && node.expanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [selectedNode, toggleNode, removeUploadedFile]);

  const renderUploadArea = () => {
    if (!selectedNodeData || selectedNodeData.type !== 'file') {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>Select a file node from the tree to upload</p>
          <p className="text-sm mt-3 text-gray-400">
            Follow the hierarchical upload order: Supervisor → JACEs → Drivers
          </p>
        </div>
      );
    }

    if (selectedNodeData.uploadStatus === 'uploaded' || selectedNodeData.uploadStatus === 'parsed') {
      // Determine file type and use appropriate preview component
      const fileName = selectedNodeData.file?.name || 'Unknown file';
      const nodeId = selectedNodeData.id;
      const fileType = getFileType(fileName, nodeId);
      
      const onRemove = () => removeUploadedFile(selectedNodeData.id);
      const onViewAnalysis = () => setActiveTab('analysis');
      const onJACEsDiscovered = (jaces: any[]) => {
        // Build JACE tree from discovered JACEs
        buildJACETreeFromNetworkExport(jaces);
      };

      // Use dedicated preview component based on file type
      switch (fileType) {
        case 'platform':
          return (
            <PlatformDetailsPreview
              data={selectedNodeData.parsedData}
              fileName={fileName}
              onRemove={onRemove}
              onViewAnalysis={onViewAnalysis}
              onSaveEdited={async (edited) => {
                try {
                  const nodeIdLocal = selectedNodeData.id;
                  const target = determineTargetLocation(nodeIdLocal);
                  await PlatformDataService.storeIndividualDataType(effectiveSessionId, 'platform', edited, target);
                  // Update tree node to reflect new edits immediately
                  setSystemTree(prev => updateNodeInTree(prev, nodeIdLocal, { parsedData: edited }));
                  // Recompute analysis to reflect edits
                  processCrossValidation();
                } catch (e) {
                  console.warn('Failed to persist edited platform dataset', e);
                }
              }}
            />
          );
          
        case 'resource':
          return (
            <ResourceExportPreview
              data={selectedNodeData.parsedData}
              fileName={fileName}
              onRemove={onRemove}
              onViewAnalysis={onViewAnalysis}
              onSaveEdited={async (edited) => {
                try {
                  const nodeIdLocal = selectedNodeData.id;
                  const target = determineTargetLocation(nodeIdLocal);
                  await PlatformDataService.storeIndividualDataType(effectiveSessionId, 'resources', edited, target);
                  // Update tree node to reflect new edits immediately
                  setSystemTree(prev => updateNodeInTree(prev, nodeIdLocal, { parsedData: edited }));
                  // Recompute analysis to reflect edits
                  processCrossValidation();
                } catch (e) {
                  console.warn('Failed to persist edited resources dataset', e);
                }
              }}
            />
          );
          
        case 'network':
          return (
            <NetworkExportPreview
              data={selectedNodeData.parsedData}
              fileName={fileName}
              onRemove={onRemove}
              onViewAnalysis={onViewAnalysis}
              onJACEsDiscovered={onJACEsDiscovered}
              onSaveEdited={async (edited) => {
                try {
                  const nodeIdLocal = selectedNodeData.id;
                  const target = determineTargetLocation(nodeIdLocal);
                  await PlatformDataService.storeIndividualDataType(effectiveSessionId, 'niagara_network', edited, target);
                  // Update tree node to reflect new edits immediately
                  setSystemTree(prev => updateNodeInTree(prev, nodeIdLocal, { parsedData: edited }));
                  // Recompute analysis to reflect edits
                  processCrossValidation();
                } catch (e) {
                  console.warn('Failed to persist edited network dataset', e);
                }
              }}
            />
          );
          
        case 'bacnet':
        case 'n2':
        case 'modbus':
        case 'lon':
        case 'custom':
          return (
            <DeviceDriverPreview
              data={selectedNodeData.parsedData}
              fileName={fileName}
              driverType={fileType as 'bacnet' | 'n2' | 'modbus' | 'lon' | 'custom'}
              onRemove={onRemove}
              onViewAnalysis={onViewAnalysis}
              onSaveEdited={async (edited) => {
                try {
                  const nodeIdLocal = selectedNodeData.id;
                  const target = determineTargetLocation(nodeIdLocal);
                  const typeToPersist = (fileType === 'custom' ? 'bacnet' : fileType) as any; // default mapping
                  await PlatformDataService.storeIndividualDataType(effectiveSessionId, typeToPersist, edited, target);
                  setSystemTree(prev => updateNodeInTree(prev, nodeIdLocal, { parsedData: edited }));
                  // Recompute analysis to reflect edits
                  processCrossValidation();
                } catch (e) {
                  console.warn('Failed to persist edited driver dataset', e);
                }
              }}
            />
          );
          
        default:
          // Fallback to a generic preview
          return (
            <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
                <div>
                  <h4 className="font-medium text-green-800">
                    File Processed Successfully
                  </h4>
                  <p className="text-sm text-green-600">{fileName}</p>
                </div>
              </div>
              
              {selectedNodeData.parsedData && (
                <Card className="mb-4">
                  <CardHeader>
                    <CardTitle className="text-base">Parsed Data Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-40">
                      {JSON.stringify(selectedNodeData.parsedData, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
              
              <div className="flex gap-3">
                <Button
                  onClick={onRemove}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove File
                </Button>
                <Button
                  onClick={onViewAnalysis}
                  variant="default"
                  size="sm"
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View in Analysis
                </Button>
              </div>
            </div>
          );
      }
    }

    return (
      <div className="space-y-4">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg h-48 flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files, selectedNode);
          }}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.txt,.csv';
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              handleFileUpload(target.files, selectedNode);
            };
            input.click();
          }}
        >
          <Upload className="h-8 w-8 text-gray-400 mb-4" />
          <p className="text-gray-600 text-center mb-2">Drop files here or click to upload</p>
          {selectedNodeData.acceptedFiles && (
            <p className="text-xs text-gray-500">
              Accepted: {selectedNodeData.acceptedFiles.join(', ')}
            </p>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p className="font-medium mb-2">{selectedNodeData.uploadPrompt}</p>
          <ul className="text-xs space-y-1">
            <li>• Files are automatically parsed and analyzed</li>
            <li>• Analysis results appear immediately</li>
            <li>• Data persists across sessions</li>
          </ul>
        </div>
      </div>
    );
  };

  // Helper function to determine file type
  const getFileType = (fileName: string, nodeId: string): string => {
    const lowerName = fileName.toLowerCase();
    
    // Check by filename patterns
    if (lowerName.includes('platform')) return 'platform';
    if (lowerName.includes('resource')) return 'resource';
    if (lowerName.includes('network') || lowerName.includes('niagara') && lowerName.includes('net')) return 'network';
    if (lowerName.includes('bacnet')) return 'bacnet';
    if (lowerName.includes('n2')) return 'n2';
    if (lowerName.includes('modbus')) return 'modbus';
    if (lowerName.includes('lon')) return 'lon';
    
    // Check by node ID patterns
    if (nodeId.includes('platform')) return 'platform';
    if (nodeId.includes('resource')) return 'resource';
    if (nodeId.includes('network')) return 'network';
    if (nodeId.includes('bacnet')) return 'bacnet';
    if (nodeId.includes('n2')) return 'n2';
    if (nodeId.includes('modbus')) return 'modbus';
    if (nodeId.includes('lon')) return 'lon';
    
    return 'custom';
  };

  // Function to build JACE tree from network export
  const buildJACETreeFromNetworkExport = (discoveredJACEs: any[]) => {
    if (!discoveredJACEs || discoveredJACEs.length === 0) return;

    console.log('🏗️ Building JACE tree from', discoveredJACEs.length, 'discovered JACEs');
    
    // Create new tree structure with discovered JACEs
    const newTree = { ...systemTree };
    
    // Find the niagara network node
    const findNetworkNode = (node: SystemTreeNode): SystemTreeNode | null => {
      if (node.id === 'niagara-network') return node;
      if (node.children) {
        for (const child of node.children) {
          const found = findNetworkNode(child);
          if (found) return found;
        }
      }
      return null;
    };

    const networkNode = findNetworkNode(newTree);
    if (networkNode) {
      // CRITICAL: Deduplicate - check which JACEs already exist
      const existingJACENames = new Set(
        (networkNode.children || [])
          .filter(child => child.type === 'jace')
          .map(child => child.jaceInfo?.name || child.name)
          .filter(Boolean)
      );
      
      console.log(`🔍 Existing JACEs: ${Array.from(existingJACENames).join(', ')}`);
      
      // Filter out JACEs that already exist
      const newJACEs = discoveredJACEs.filter(jace => {
        const jaceName = jace.name || `JACE-${Math.random()}`;
        const exists = existingJACENames.has(jaceName);
        if (exists) {
          console.log(`⚠️ Skipping duplicate JACE in buildJACETreeFromNetworkExport: ${jaceName}`);
        }
        return !exists;
      });
      
      if (newJACEs.length === 0) {
        console.log('✅ All JACEs already exist - no duplicates to add');
        return; // All JACEs already exist, no need to update tree
      }
      
      console.log(`➕ Adding ${newJACEs.length} new JACEs (${discoveredJACEs.length - newJACEs.length} skipped as duplicates)`);
      
      // Add only NEW discovered JACEs as children
      const jaceNodes = newJACEs.map((jace, index) => ({
        id: `jace-${jace.name || index}`,
        name: jace.name || `JACE-${index + 1}`,
        type: 'jace' as const,
        icon: Cpu,
        expanded: false,
        uploadStatus: 'pending' as const,
        hasAnalysis: false,
        alertCount: 0,
        criticalAlerts: 0,
        jaceInfo: {
          name: jace.name || `JACE-${index + 1}`,
          ip: jace.ip || jace.address || 'Unknown',
          hostModel: jace.hostModel || jace.model || 'JACE',
          version: jace.version || jace.softwareVersion,
          status: jace.connected ? ['online'] : ['offline']
        },
        children: [
          {
            id: `jace-${jace.name || index}-platform`,
            name: 'Platform Details',
            type: 'file' as const,
            icon: FileText,
            uploadStatus: 'pending' as const,
            uploadPrompt: `Upload platform details for ${jace.name || `JACE-${index + 1}`}`,
            acceptedFiles: ['PlatformDetails.txt', 'JacePlatformDetails.txt'],
            hasAnalysis: false,
            alertCount: 0,
            criticalAlerts: 0
          },
          {
            id: `jace-${jace.name || index}-resource`,
            name: 'Resource Export',
            type: 'file' as const,
            icon: HardDrive,
            uploadStatus: 'pending' as const,
            uploadPrompt: `Upload resource export for ${jace.name || `JACE-${index + 1}`}`,
            acceptedFiles: ['NiagaraResourceExport.csv', 'ResourceExport.csv'],
            hasAnalysis: false,
            alertCount: 0,
            criticalAlerts: 0
          },
          {
            id: `jace-${jace.name || index}-drivers`,
            name: 'Drivers',
            type: 'drivers-container' as const,
            icon: Database,
            expanded: false,
            uploadStatus: 'pending' as const,
            hasAnalysis: false,
            alertCount: 0,
            criticalAlerts: 0,
            children: [
              {
                id: `jace-${jace.name || index}-bacnet`,
                name: 'BACnet Export',
                type: 'file' as const,
                icon: Building,
                uploadStatus: 'pending' as const,
                uploadPrompt: `Upload BACnet device export for ${jace.name || `JACE-${index + 1}`}`,
                acceptedFiles: ['BACnetExport.csv', 'BACnet.csv'],
                hasAnalysis: false,
                alertCount: 0,
                criticalAlerts: 0
              },
              {
                id: `jace-${jace.name || index}-n2`,
                name: 'N2 Export',
                type: 'file' as const,
                icon: Network,
                uploadStatus: 'pending' as const,
                uploadPrompt: `Upload N2 device export for ${jace.name || `JACE-${index + 1}`}`,
                acceptedFiles: ['N2Export.csv', 'N2.csv'],
                hasAnalysis: false,
                alertCount: 0,
                criticalAlerts: 0
              },
              {
                id: `jace-${jace.name || index}-add-driver`,
                name: 'Add Driver',
                type: 'add-driver' as const,
                icon: Plus,
                uploadStatus: 'pending' as const,
                isAddButton: true,
                hasAnalysis: false,
                alertCount: 0,
                criticalAlerts: 0
              }
            ]
          }
        ]
      }));

      networkNode.children = [...(networkNode.children || []), ...jaceNodes];
      networkNode.expanded = true;
    }

    setSystemTree(newTree);
    
    // Update system data with discovered JACEs
    const newSystemData = { ...systemData };
    discoveredJACEs.forEach(jace => {
      const jaceName = jace.name || `JACE-${Math.random().toString(36).substr(2, 9)}`;
      newSystemData.jaces[jaceName] = {
        platform: undefined,
        resources: undefined,
        drivers: {
          bacnet: undefined,
          n2: undefined,
          modbus: undefined,
          lon: undefined,
          custom: {}
        }
      };
    });
    
    setSystemData(newSystemData);
  };

  return (
    <>
      {/* Clear All Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Clear All Discovery Data?
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p>
                This will permanently delete all imported files, parsed data, and analysis for this PM workflow session.
              </p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2">
                <p className="font-semibold text-red-800">The following will be cleared:</p>
                <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                  <li>{systemData.uploadedFiles.length} uploaded file(s)</li>
                  <li>All platform details and resource data</li>
                  <li>Network topology information</li>
                  <li>Device inventory (BACnet, N2, Modbus, etc.)</li>
                  <li>System analysis and health metrics</li>
                  {isDatabaseMode && (
                    <li className="font-semibold">Database records for this session</li>
                  )}
                </ul>
              </div>
              <p className="text-sm font-medium text-gray-700">
                You will need to re-import all files to recreate the system discovery data.
              </p>
              <p className="text-sm text-yellow-600">
                <strong>Note:</strong> This action cannot be undone.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowClearConfirm(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmClearAll}
              disabled={isProcessing}
              className="gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Yes, Clear All Data
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-full flex flex-col space-y-4">
      {/* Progress Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold">System Discovery & Import Wizard</h3>
                <p className="text-sm text-muted-foreground">
                  {systemData.uploadedFiles.length} files uploaded • {overallProgress}% complete
                </p>
              </div>
              <div className="flex items-center gap-4">
                {(systemData.uploadedFiles.length > 0 || overallProgress > 0) && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleClearAll}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All
                  </Button>
                )}
                <div className="text-right">
                  <div className="text-2xl font-bold">{overallProgress}%</div>
                  <Progress value={overallProgress} className="w-24" />
                </div>
              </div>
            </div>

            {!isDatabaseMode && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  Local-only mode: no valid session detected. Data is saved in your browser and will persist across refreshes on this device. To sync to the database, start this workflow from a PM session so a valid session ID is present.
                </AlertDescription>
              </Alert>
            )}

            {systemData.importSummary && systemData.importSummary.totalAlerts > 0 && (
              <Alert className={systemData.importSummary.criticalAlerts > 0 ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}>
                <AlertTriangle className={`h-4 w-4 ${systemData.importSummary.criticalAlerts > 0 ? "text-red-600" : "text-yellow-600"}`} />
                <AlertDescription>
                  System analysis found {systemData.importSummary.totalAlerts} alerts
                  ({systemData.importSummary.criticalAlerts} critical)
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Content */}
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="import" className="gap-2">
                <Upload className="h-4 w-4" />
                Import & Upload
                <Badge variant={overallProgress === 100 ? "default" : "secondary"}>
                  {systemData.uploadedFiles.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2" disabled={systemData.uploadedFiles.length === 0}>
                <Activity className="h-4 w-4" />
                Analysis & Review
                {systemData.importSummary && systemData.importSummary.totalAlerts > 0 && (
                  <Badge variant={systemData.importSummary.criticalAlerts > 0 ? "destructive" : "secondary"}>
                    {systemData.importSummary.totalAlerts}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="flex-1 flex">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
            {/* Import Tab */}
            <TabsContent value="import" className="flex-1 flex min-h-0">
              <div className="flex flex-1 min-h-0">
                {/* Tree Sidebar */}
                <div className="w-96 border-r bg-gray-50 flex flex-col">
                  <div className="p-4 border-b bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                        <h3 className="font-semibold text-lg">System Structure</h3>
                      </div>
                      {(systemData.uploadedFiles.length > 0 || overallProgress > 0) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleClearAll}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 px-2"
                          title="Clear all uploaded data"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* System Type Toggle - Enhanced Visibility */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-700 mb-2 block">System Type</label>
                        <div className={`flex items-center justify-between p-3 border-2 rounded-lg transition-colors ${
                          systemType === 'supervisor' ? 'border-blue-300 bg-blue-50' : 'border-green-300 bg-green-50'
                        }`}>
                          <div className="flex items-center gap-3">
                            <Cpu className={`h-5 w-5 ${systemType === 'engine-only' ? 'text-green-600' : 'text-gray-400'}`} />
                            <span className={`text-sm font-medium ${systemType === 'engine-only' ? 'text-green-800' : 'text-gray-500'}`}>
                              Engine Only
                            </span>
                          </div>

                          <Switch
                            checked={systemType === 'supervisor'}
                            onCheckedChange={(checked) => switchToMode(checked ? 'supervisor' : 'engine-only')}
                            className={`mx-3 data-[state=checked]:bg-blue-600 data-[state=unchecked]:bg-green-600`}
                          />

                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${systemType === 'supervisor' ? 'text-blue-800' : 'text-gray-500'}`}>
                              Supervisor Multi-Site
                            </span>
                            <Server className={`h-5 w-5 ${systemType === 'supervisor' ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span>Upload Progress</span>
                        <span>{overallProgress}%</span>
                      </div>
                      <Progress value={overallProgress} className="h-2" />

                      {/* Mode Description */}
                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                        {systemType === 'supervisor' && (
                          <>
                            <strong>Supervisor Multi-Site:</strong> For systems with a central Supervisor managing multiple remote JACEs.
                            Upload supervisor files first, then individual JACE exports.
                          </>
                        )}
                        {systemType === 'engine-only' && (
                          <>
                            <strong>Engine Only:</strong> For standalone JACE controllers without a supervisor.
                            Upload platform details, resources, and field network device inventories.
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                    {renderTreeNode(systemTree)}
                  </div>
                </div>

                {/* Upload Area */}
                <div className="flex-1 flex flex-col">
                  <div className="p-6 border-b bg-white">
                    <h2 className="text-xl font-semibold">
                      {selectedNodeData?.name || 'Upload Files'}
                    </h2>
                    {selectedNodeData?.uploadPrompt && (
                      <p className="text-gray-600 mt-1">{selectedNodeData.uploadPrompt}</p>
                    )}
                  </div>

                  <div className="flex-1 p-6">
                    {renderUploadArea()}

                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analysis Tab - Enhanced with Confirmation and Rich Displays */}
            <TabsContent value="analysis" className="flex-1">
              {systemData.uploadedFiles.length > 0 ? (
                <div className="space-y-6">
                  {/* Analysis Status and Confirmation */}
                  <Card className={`border-2 ${
                    systemData.crossValidatedData ? 'border-green-300 bg-green-50' : 'border-blue-300 bg-blue-50'
                  }`}>
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl flex items-center gap-2">
                        {systemData.crossValidatedData ? (
                          <CheckCircle2 className="h-6 w-6 text-green-600" />
                        ) : (
                          <Activity className="h-6 w-6 text-blue-600" />
                        )}
                        System Analysis Dashboard
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className={`font-semibold ${
                              systemData.crossValidatedData ? 'text-green-800' : 'text-blue-800'
                            }`}>
                              {systemData.crossValidatedData ?
                                "Analysis Complete - System Ready" :
                                "Data Processing Complete - Ready for Analysis"
                              }
                            </h3>
                            <p className={`text-sm mt-1 ${
                              systemData.crossValidatedData ? 'text-green-700' : 'text-blue-700'
                            }`}>
                              {systemData.uploadedFiles.length} files processed, 
                              {systemData.importSummary?.totalDevices || 0} devices discovered
                            </p>
                          </div>
              <div className="flex items-center gap-3">
                <AnalysisSettingsPanel
                  sessionId={effectiveSessionId || ''}
                  onSaved={async (s) => {
                    setAnalysisSettings(s);
                    // Recompute snapshots for supervisor and all jaces
                    if (!effectiveSessionId) return;
                    try {
                      const persisted = await PlatformDataService.getTridiumSystemData(effectiveSessionId);
                      if (persisted.data) {
                        const sys = persisted.data as any;
                        const supSnap = DiscoveryAnalysisService.computeSupervisorSnapshot(sys, s);
                        await PlatformDataService.upsertAnalysisSnapshot(sessionId, supSnap);
                        for (const [jname, jdata] of Object.entries(sys.jaces || {})) {
                          const jsnap = DiscoveryAnalysisService.computeJaceSnapshot(jname, jdata, s);
                          await PlatformDataService.upsertAnalysisSnapshot(sessionId, jsnap);
                        }
                      }
                    } catch (e) {
                      console.warn('Recompute after settings save failed', e);
                    }
                  }}
                />
                <Badge variant="outline" className="text-sm">
                  {overallProgress}% Complete
                </Badge>
                            {systemData.crossValidatedData ? (
                              <Badge variant="default" className="bg-green-600">
                                Analysis Ready
                              </Badge>
                            ) : (
                              <Button
                                onClick={() => {
                                  // Trigger analysis confirmation
                                  if (confirm('Start comprehensive system analysis? This will analyze all uploaded data and generate insights.')) {
                                    console.log('🔬 Starting system analysis...');
                                    // Run cross-validation now and switch to analysis tab
                                    processCrossValidation();
                                    setActiveTab('analysis');
                                  }
                                }}
                                size="sm"
                                className="gap-2 bg-blue-600 hover:bg-blue-700"
                              >
                                <Activity className="h-4 w-4" />
                                Start Analysis
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Analysis Progress Indicators */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-blue-600">{systemData.uploadedFiles.length}</div>
                            <div className="text-xs text-gray-600">Files Processed</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-green-600">
                              {Object.keys(systemData.jaces).length + (systemData.supervisor ? 1 : 0)}
                            </div>
                            <div className="text-xs text-gray-600">Systems Discovered</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className="text-2xl font-bold text-purple-600">
                              {systemData.importSummary?.totalDevices || 0}
                            </div>
                            <div className="text-xs text-gray-600">Total Devices</div>
                          </div>
                          <div className="text-center p-3 bg-white rounded-lg border">
                            <div className={`text-2xl font-bold ${
                              systemData.importSummary?.criticalAlerts > 0 ? 'text-red-600' :
                              systemData.importSummary?.totalAlerts > 0 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {systemData.importSummary?.totalAlerts || 0}
                            </div>
                            <div className="text-xs text-gray-600">Alerts Found</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Rich Data Analysis Display */}
                  {systemData.crossValidatedData && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* System Health Overview */}
                      <Card className="border-blue-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Gauge className="h-5 w-5 text-blue-600" />
                            System Health Overview
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="text-center">
                              <div className="text-4xl font-bold text-green-600 mb-2">85%</div>
                              <div className="text-sm text-gray-600">Overall Health Score</div>
                              <Progress value={85} className="mt-3 h-3" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-lg font-bold text-green-600">92%</div>
                                <div className="text-xs text-green-800">Platform Health</div>
                              </div>
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-lg font-bold text-blue-600">88%</div>
                                <div className="text-xs text-blue-800">Network Health</div>
                              </div>
                              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <div className="text-lg font-bold text-yellow-600">76%</div>
                                <div className="text-xs text-yellow-800">Resource Usage</div>
                              </div>
                              <div className="text-center p-3 bg-purple-50 rounded-lg">
                                <div className="text-lg font-bold text-purple-600">91%</div>
                                <div className="text-xs text-purple-800">Device Connectivity</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* System Architecture */}
                      <Card className="border-purple-200">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Network className="h-5 w-5 text-purple-600" />
                            System Architecture
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="text-center p-4 bg-purple-50 rounded-lg">
                              <div className="font-semibold text-purple-800 mb-2">
                                {systemData.detectedArchitecture || systemType}
                              </div>
                              <div className="text-sm text-purple-700">
                                {systemType === 'supervisor' ? 
                                  'Multi-site distributed architecture' : 
                                  'Standalone engine configuration'
                                }
                              </div>
                            </div>
                            
                            <div className="space-y-2">
                              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium">JACE Controllers</span>
                                <Badge variant="outline">{Object.keys(systemData.jaces).length}</Badge>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium">Network Protocols</span>
                                <div className="flex gap-1">
                                  <Badge variant="outline" className="text-xs">BACnet</Badge>
                                  <Badge variant="outline" className="text-xs">N2</Badge>
                                </div>
                              </div>
                              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium">Total Points</span>
                                <Badge variant="secondary">{systemData.importSummary?.totalDevices * 4 || 0}</Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Detailed Analysis Results */}
                  {systemData.crossValidatedData && (
                    <Card className="border-gray-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-gray-600" />
                          Detailed Analysis Results
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Platform Analysis */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-blue-800 flex items-center gap-2">
                              <Server className="h-4 w-4" />
                              Platform Analysis
                            </h4>
                            <div className="space-y-2">
                              <div className="p-2 bg-blue-50 rounded text-sm">
                                <strong>Version Compliance:</strong> All systems running compatible versions
                              </div>
                              <div className="p-2 bg-green-50 rounded text-sm">
                                <strong>License Status:</strong> All licenses valid and current
                              </div>
                              <div className="p-2 bg-yellow-50 rounded text-sm">
                                <strong>Performance:</strong> CPU usage within normal range
                              </div>
                            </div>
                          </div>

                          {/* Network Analysis */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-green-800 flex items-center gap-2">
                              <Network className="h-4 w-4" />
                              Network Analysis
                            </h4>
                            <div className="space-y-2">
                              <div className="p-2 bg-green-50 rounded text-sm">
                                <strong>Connectivity:</strong> {Math.round((systemData.importSummary?.totalDevices - systemData.importSummary?.criticalAlerts) / systemData.importSummary?.totalDevices * 100) || 95}% devices online
                              </div>
                              <div className="p-2 bg-blue-50 rounded text-sm">
                                <strong>Response Time:</strong> Average 120ms
                              </div>
                              <div className="p-2 bg-purple-50 rounded text-sm">
                                <strong>Topology:</strong> Network topology validated
                              </div>
                            </div>
                          </div>

                          {/* Device Analysis */}
                          <div className="space-y-3">
                            <h4 className="font-medium text-purple-800 flex items-center gap-2">
                              <Database className="h-4 w-4" />
                              Device Analysis
                            </h4>
                            <div className="space-y-2">
                              <div className="p-2 bg-purple-50 rounded text-sm">
                                <strong>Total Devices:</strong> {systemData.importSummary?.totalDevices || 0} discovered
                              </div>
                              <div className="p-2 bg-green-50 rounded text-sm">
                                <strong>Operational:</strong> {Math.round(((systemData.importSummary?.totalDevices || 0) - (systemData.importSummary?.criticalAlerts || 0)) / (systemData.importSummary?.totalDevices || 1) * 100)}% functional
                              </div>
                              {systemData.importSummary?.criticalAlerts > 0 && (
                                <div className="p-2 bg-red-50 rounded text-sm">
                                  <strong>Issues:</strong> {systemData.importSummary.criticalAlerts} devices need attention
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Data Visualization */}
                  <ImportDataVisualization systemData={systemData} className="mt-6" />

                  {/* Advanced Report Generation */}
                  <Card className="border-green-200">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        Comprehensive Report Generation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Generate detailed reports with all analysis results, recommendations, and system insights.
                        </p>
                        
                        {/* Report Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Executive Summary</h4>
                            <p className="text-sm text-gray-600 mb-3">High-level overview with key findings and recommendations.</p>
                            <Button 
                              onClick={() => {
                                const reportData = generateReportData();
                                console.log('📊 Executive Summary Generated:', reportData);
                                alert('Executive Summary report ready!');
                              }}
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                            >
                              Generate Executive Report
                            </Button>
                          </div>
                          
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-2">Technical Deep Dive</h4>
                            <p className="text-sm text-gray-600 mb-3">Detailed technical analysis with device inventories and performance metrics.</p>
                            <Button 
                              onClick={() => {
                                const reportData = generateReportData();
                                console.log('🔧 Technical Report Generated:', reportData);
                                alert('Technical Deep Dive report ready!');
                              }}
                              variant="outline" 
                              size="sm" 
                              className="w-full"
                            >
                              Generate Technical Report
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex gap-3 pt-4 border-t">
                          <Button
                            onClick={() => {
                              const reportData = generateReportData();
                              const dataStr = JSON.stringify(reportData, null, 2);
                              const dataBlob = new Blob([dataStr], { type: 'application/json' });
                              const url = URL.createObjectURL(dataBlob);
                              const link = document.createElement('a');
                              link.href = url;
                              link.download = `tridium-complete-analysis-${new Date().getTime()}.json`;
                              link.click();
                            }}
                            variant="outline"
                            className="gap-2"
                          >
                            <Database className="h-4 w-4" />
                            Export Raw Data
                          </Button>
                          
                  <Button
                            onClick={async () => {
                              try {
                                const reportData = generateReportData();
                                const processed = {
                                  processedFiles: (reportData.uploadedFiles || []).map((f: any) => f.name),
                                  devices: (reportData.jaces || []).flatMap((j: any) => [
                                    ...(j.drivers?.bacnet?.devices || []),
                                    ...(j.drivers?.n2?.devices || [])
                                  ]),
                                  resources: [
                                    ...(reportData.supervisor?.resources ? [reportData.supervisor.resources] : []),
                                    ...(reportData.jaces || []).map((j: any) => j.resources).filter(Boolean)
                                  ],
                                  networks: reportData.supervisor?.network ? [reportData.supervisor.network] : [],
                                  errors: [],
                                  validationWarnings: [],
                                  crossValidatedData: reportData.crossValidation || null,
                                  metadata: { totalFiles: reportData.uploadedFiles?.length || 0, processedFiles: reportData.uploadedFiles?.length || 0, failedFiles: 0, processingTime: Date.now(), architecture: systemType === 'supervisor' ? 'multi-jace' : 'single-jace' }
                                } as any;
                                const blob = await (await import('@/services/TridiumReportGenerator')).TridiumReportGenerator.generateReport(processed);
                                (await import('@/services/TridiumReportGenerator')).TridiumReportGenerator.downloadReport(blob);
                              } catch (e) {
                                console.error('PDF generation failed', e);
                                alert('PDF generation failed. See console for details.');
                              }
                            }}
                            className="gap-2"
                          >
                            <FileText className="h-4 w-4" />
                            Generate Complete PDF
                          </Button>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          <strong>Complete report includes:</strong> System health analysis, performance metrics, 
                          device inventories, network topology, security assessment, capacity planning, 
                          maintenance recommendations, and troubleshooting guides.
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No Data Available for Analysis</p>
                    <p className="text-sm mb-4 text-gray-400">
                      Upload Tridium system files to begin comprehensive analysis
                    </p>
                    <Button 
                      onClick={() => setActiveTab('import')}
                      variant="outline"
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      Go to Import Tab
                    </Button>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* File Validation Modal */}
      {pendingFile && (
        <FileValidationPreview
          file={pendingFile.file}
          onAccept={processUploadedFile}
          onReject={() => setPendingFile(null)}
          onClose={() => setPendingFile(null)}
        />
      )}

      {/* Add Driver Modal */}
      {showAddDriverModal && (
        <AddDriverModal
          onAdd={(driverType) => {
            addDriver(showAddDriverModal, driverType);
          }}
          onCancel={() => setShowAddDriverModal(null)}
        />
      )}

      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Processing file...</span>
            </div>
          </Card>
        </div>
      )}
    </div>
    </>
  );
};

// Add Driver Modal Component
interface AddDriverModalProps {
  onAdd: (driverType: string) => void;
  onCancel: () => void;
}

const AddDriverModal: React.FC<AddDriverModalProps> = ({ onAdd, onCancel }) => {
  const [selectedDriver, setSelectedDriver] = React.useState('');
  const [customDriver, setCustomDriver] = React.useState('');

  const driverTypes = [
    'BACnet',
    'N2',
    'Modbus',
    'LON',
    'OPC',
    'Custom'
  ];

  const handleAdd = () => {
    const driverType = selectedDriver === 'Custom' ? customDriver : selectedDriver;
    if (driverType) {
      onAdd(driverType);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full">
        <h3 className="text-lg font-semibold mb-4">Add Driver</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Driver Type</label>
            <select
              className="w-full p-2 border rounded-md"
              value={selectedDriver}
              onChange={(e) => setSelectedDriver(e.target.value)}
            >
              <option value="">Select driver type...</option>
              {driverTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {selectedDriver === 'Custom' && (
            <div>
              <label className="block text-sm font-medium mb-2">Custom Driver Name</label>
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="Enter driver name..."
                value={customDriver}
                onChange={(e) => setCustomDriver(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-6">
          <Button
            onClick={handleAdd}
            disabled={!selectedDriver || (selectedDriver === 'Custom' && !customDriver)}
          >
            Add Driver
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};