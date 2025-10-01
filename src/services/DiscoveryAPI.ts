/**
 * Unified Discovery API Service
 * Single source of truth for all discovery-related operations
 * Replaces scattered services and provides consistent persistence/retrieval
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { isValidUUID } from '@/utils/uuid';
import { TridiumExportProcessor } from './TridiumExportProcessor';
import { DiscoveryPersistence } from './DiscoveryPersistence';

export type SystemType = 'supervisor' | 'engine';
export type DatasetType = 'platform' | 'resources' | 'niagara_network' | 'bacnet' | 'n2' | 'modbus' | 'lon' | 'custom';
export type EntityType = 'supervisor' | 'jace' | 'driver';

// Parsed data shapes from the parsers
export interface ParsedPlatformData {
  identity?: {
    host_id?: string;
    serial?: string;
    model?: string;
    product?: string;
  };
  system?: {
    niagara_version?: string;
    runtime?: string;
    os?: string;
    arch?: string;
    cpu_count?: number;
  };
  memory?: {
    total_gb?: number;
    free_gb?: number;
    used_pct?: number;
  };
  storage?: Array<{
    mount?: string;
    total_gb?: number;
    free_gb?: number;
    used_pct?: number;
  }>;
  time?: {
    current?: string;
    start?: string;
    uptime_days?: number;
  };
  licenses?: any[];
  certificates?: any[];
  security?: any;
  modules?: any[];
}

export interface ParsedResourceData {
  devices?: {
    used?: number;
    licensed?: number;
  };
  points?: {
    used?: number;
    licensed?: number;
  };
  histories?: number;
  heap_used_mb?: number;
  heap_max_mb?: number;
  heap_used_pct?: number;
  engine_queues?: any;
  scan_times?: any;
  ru_breakdown?: any;
}

export interface ParsedNetworkData {
  network?: {
    nodes?: Array<{
      name?: string;
      address?: string;
      ip?: string;
      fox_port?: number;
      host_model?: string;
      version?: string;
      [key: string]: any;
    }>;
  };
}

export interface ParsedDriverData {
  devices?: any[];
  summary?: any;
  analysis?: any;
}

// Analysis result shape
export interface AnalysisResult {
  health_score: number;
  alerts: Array<{
    severity: 'critical' | 'warning' | 'info';
    category: string;
    message: string;
  }>;
  metrics: Record<string, any>;
  recommendations?: string[];
  analyzed_at?: string;
}

// Discovery run shape
export interface DiscoveryRun {
  id: string;
  session_id?: string;
  system_type: SystemType;
  customer_id?: string;
  site_name?: string;
  metadata?: any;
  import_summary?: {
    total_files: number;
    processed_files: number;
    total_devices: number;
    jace_count: number;
    total_alerts: number;
    critical_alerts: number;
  };
  created_at: string;
  updated_at?: string;
}

// Complete system tree data
export interface SystemTreeData {
  run: DiscoveryRun;
  supervisor?: {
    id: string;
    identity?: ParsedPlatformData['identity'];
    platform?: ParsedPlatformData;
    resources?: ParsedResourceData;
    network?: ParsedNetworkData;
    analysis?: AnalysisResult;
    health_score?: number;
  };
  jaces: Array<{
    id: string;
    name: string;
    address?: string;
    fox_port?: number;
    host_model?: string;
    niagara_version?: string;
    platform?: ParsedPlatformData;
    resources?: ParsedResourceData;
    analysis?: AnalysisResult;
    health_score?: number;
    drivers: {
      bacnet?: ParsedDriverData;
      n2?: ParsedDriverData;
      modbus?: ParsedDriverData;
      lon?: ParsedDriverData;
      [key: string]: ParsedDriverData | undefined;
    };
  }>;
}

export class DiscoveryAPI {
  
  /**
   * Get or create a discovery run for the session
   */
  static async ensureDiscoveryRun(params: {
    sessionId: string;
    systemType: SystemType;
    customerId?: string;
    siteName?: string;
  }): Promise<string | null> {
    try {
      // Skip DB operations for non-UUID sessions (local-only mode)
      if (!isValidUUID(params.sessionId)) {
        logger.info('Using local-only mode for non-UUID session');
        return `local-${Date.now()}`;
      }

      // Use the SQL function we created
      const { data, error } = await supabase
        .rpc('get_or_create_discovery_run', {
          p_session_id: params.sessionId,
          p_system_type: params.systemType,
          p_customer_id: params.customerId || null,
          p_site_name: params.siteName || null
        });

      if (error) throw error;
      return data as string;
    } catch (error) {
      logger.error('Failed to ensure discovery run:', error);
      return null;
    }
  }

  /**
   * Store a parsed file and update the appropriate entity
   */
  static async storeFileData(params: {
    discoveryRunId: string;
    datasetType: DatasetType;
    targetLocation: { type: 'supervisor' | 'jace'; name?: string };
    file: File;
    parsedData: any;
    rawText?: string;
  }): Promise<boolean> {
    try {
      // Skip for local runs
      if (!isValidUUID(params.discoveryRunId) && params.discoveryRunId.startsWith('local-')) {
        logger.info('Skipping DB storage for local run');
        return true;
      }

      // Use the new persistence service
      const result = await DiscoveryPersistence.storeFileData(params);
      return result.success;
    } catch (error) {
      logger.error('Failed to store file data:', error);
      return false;
    }
  }

  /**
   * Retrieve complete discovery tree for display
   */
  static async getDiscoveryTree(discoveryRunId: string): Promise<SystemTreeData | null> {
    try {
      // Skip for local runs
      if (!isValidUUID(discoveryRunId) && discoveryRunId.startsWith('local-')) {
        return null;
      }

      // Load data using new persistence layer
      const loadedData = await DiscoveryPersistence.loadDiscoveryData(discoveryRunId);
      if (!loadedData) {
        return null;
      }

      // Get run metadata
      const { data: run, error: runError } = await supabase
        .from('discovery_runs')
        .select('*')
        .eq('id', discoveryRunId)
        .single();

      if (runError || !run) {
        logger.error('Failed to fetch discovery run:', runError);
        return null;
      }

      // Transform loaded data into display format
      const displayData = DiscoveryPersistence.transformForDisplay(loadedData);

      // Build the tree structure
      const jaces = Object.entries(displayData.jaces).map(([name, jaceData]: [string, any]) => ({
        id: name, // Using name as temporary ID
        name,
        address: jaceData.platform?.network_address,
        platform: jaceData.platform?.platform_json,
        resources: jaceData.resources?.resource_json,
        drivers: this.groupDevicesByDriver(jaceData.devices || [])
      }));

      return {
        run: run as DiscoveryRun,
        supervisor: displayData.supervisor.platform ? {
          id: 'supervisor',
          platform: displayData.supervisor.platform?.platform_json,
          resources: displayData.supervisor.resources?.resource_json,
          identity: displayData.supervisor.platform?.platform_json?.platform_identity
        } : undefined,
        jaces
      };
    } catch (error) {
      logger.error('Failed to get discovery tree:', error);
      return null;
    }
  }

  /**
   * Group devices by driver type
   */
  private static groupDevicesByDriver(devices: any[]): Record<string, ParsedDriverData> {
    const grouped: Record<string, ParsedDriverData> = {};
    
    devices.forEach(device => {
      const driverType = device.driver_type;
      if (!grouped[driverType]) {
        grouped[driverType] = { devices: [] };
      }
      grouped[driverType].devices!.push(device.device_json);
    });
    
    return grouped;
  }

  /**
   * Compute and store analysis for an entity
   */
  static async computeAnalysis(params: {
    discoveryRunId: string;
    entityType: 'supervisor' | 'jace';
    entityId: string;
  }): Promise<AnalysisResult | null> {
    try {
      // Skip for local runs
      if (!isValidUUID(params.discoveryRunId)) {
        return this.computeAnalysisLocally(params);
      }

      // Use the SQL function to compute analysis
      const { data, error } = await supabase
        .rpc('compute_discovery_analysis', {
          p_entity_type: params.entityType,
          p_entity_id: params.entityId
        });

      if (error) throw error;
      
      const analysis = data as AnalysisResult;

      // Store the analysis snapshot
      await supabase
        .from('analysis_snapshots')
        .insert({
          scope: params.entityType,
          ref_id: params.entityId,
          discovery_run_id: params.discoveryRunId,
          health_score: analysis.health_score,
          alerts: analysis.alerts,
          metrics: analysis.metrics,
          recommendations: analysis.recommendations
        });

      // Update the entity with the analysis
      const table = params.entityType === 'supervisor' ? 'supervisors' : 'jaces';
      await supabase
        .from(table)
        .update({
          analysis,
          health_score: analysis.health_score,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.entityId);

      return analysis;
    } catch (error) {
      logger.error('Failed to compute analysis:', error);
      return null;
    }
  }

  /**
   * Parse a file using the appropriate parser
   */
  static async parseFile(file: File, datasetType: DatasetType): Promise<any> {
    try {
      const content = await file.text();
      
      switch (datasetType) {
        case 'platform':
          return TridiumExportProcessor.parsePlatformDetails(content);
        case 'resources':
          return TridiumExportProcessor.parseResourceExport(content);
        case 'niagara_network':
          return TridiumExportProcessor.parseNiagaraNetworkExport(content);
        case 'bacnet':
          return TridiumExportProcessor.parseBACnetExport(content);
        case 'n2':
          return TridiumExportProcessor.parseN2Export(content);
        default:
          logger.warn(`No parser for dataset type: ${datasetType}`);
          return { raw: content };
      }
    } catch (error) {
      logger.error('Failed to parse file:', error);
      throw error;
    }
  }

  /**
   * Persist edited dataset directly to the discovery run without requiring a file re-upload
   */
  static async saveEditedData(params: {
    discoveryRunId: string;
    datasetType: DatasetType;
    targetLocation: { type: 'supervisor' | 'jace'; name?: string };
    editedData: any;
  }): Promise<boolean> {
    try {
      // Local-only sessions: no DB writes, but succeed so UI flows work
      if (!isValidUUID(params.discoveryRunId) && params.discoveryRunId.startsWith('local-')) {
        logger.info('Skipping DB storage for local run (saveEditedData)');
        return true;
      }

      // Create a virtual file to use the same persistence flow
      const virtualFile = new File(
        [JSON.stringify(params.editedData, null, 2)],
        `edited-${params.datasetType}.json`,
        { type: 'application/json' }
      );

      const result = await DiscoveryPersistence.storeFileData({
        discoveryRunId: params.discoveryRunId,
        datasetType: params.datasetType,
        targetLocation: params.targetLocation,
        file: virtualFile,
        parsedData: params.editedData
      });

      return result.success;
    } catch (error) {
      logger.error('Failed to save edited data:', error);
      return false;
    }
  }

  // Private helper methods

  private static computeAnalysisLocally(params: {
    entityType: 'supervisor' | 'jace';
    entityId: string;
  }): AnalysisResult {
    // Basic local analysis for non-DB mode
    return {
      health_score: 85,
      alerts: [],
      metrics: {},
      analyzed_at: new Date().toISOString()
    };
  }
}