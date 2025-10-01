import { supabase } from '@/integrations/supabase/client';
import { logger } from '../utils/logger';
import { isValidUUID } from '@/utils/uuid';
import type {
  N2ParsedData,
  BACnetParsedData,
  ResourceParsedData,
  PlatformParsedData,
  NiagaraNetworkParsedData,
  CrossValidatedData
} from '@/services/TridiumExportProcessor';

export interface PlatformSummaryData {
  daemonVersion: string;
  daemonHttpPort: string;
  hostId: string;
  hostIdStatus: string;
  niagaraRuntime: string;
  architecture: string;
  cpuCount: number;
  model: string;
  product: string;
  enabledRuntimeProfiles: string[];
  operatingSystem: string;
  javaVirtualMachine: string;
  niagaraStationsEnabled: string;
  platformTlsSupport: string;
  port: string;
  certificate: string;
  protocol: string;
  systemHome: string;
  userHome: string;
  ramTotal?: string;
  ramFree?: string;
  ipAddress?: string;
}

export interface PlatformData {
  summary: PlatformSummaryData;
  modules: Array<{
    name: string;
    vendor: string;
    version: string;
    profiles: string[];
  }>;
  licenses: Array<{
    name: string;
    vendor: string;
    expires: string;
  }>;
  filesystems: Array<{
    path: string;
    free: string;
    total: string;
    files: number;
    maxFiles: number;
  }>;
  applications: Array<{
    name: string;
    vendor: string;
    version: string;
  }>;
}

// Extended interfaces for comprehensive Tridium data storage
export interface TridiumSystemData {
  architecture: 'single-jace' | 'multi-jace' | 'supervisor';
  systemTree?: any; // Complete system tree structure

  // Supervisor-level data
  supervisor?: {
    platform?: PlatformParsedData;
    resources?: ResourceParsedData;
    network?: NiagaraNetworkParsedData;
  };

  // JACE-level data (keyed by JACE name/ID)
  jaces: Record<string, {
    platform?: PlatformParsedData;
    resources?: ResourceParsedData;
    drivers: {
      bacnet?: BACnetParsedData;
      n2?: N2ParsedData;
      modbus?: any;
      lon?: any;
      [driverType: string]: any;
    };
    networkInfo?: any;
  }>;

  // Metadata
  importedAt: string;
  dataSource: 'automated_import' | 'manual_entry';
  importSummary: {
    totalFiles: number;
    totalDevices: number;
    jaceCount: number;
    networkCount: number;
    errors: string[];
  };
}

export class PlatformDataService {
  // Local fallback keys
  private static localKey(sessionId: string) { return `phase2_tridium_${sessionId}`; }
  private static localSettingsKey(sessionId: string) { return `phase2_analysis_settings_${sessionId}`; }

  private static writeLocal(sessionId: string, data: any) {
    try { localStorage.setItem(this.localKey(sessionId), JSON.stringify(data)); } catch {}
  }
  private static readLocal(sessionId: string): any | null {
    try {
      const raw = localStorage.getItem(this.localKey(sessionId));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private static writeLocalSettings(sessionId: string, settings: any) {
    try { localStorage.setItem(this.localSettingsKey(sessionId), JSON.stringify(settings)); } catch {}
  }
  private static readLocalSettings(sessionId: string): any | null {
    try {
      const raw = localStorage.getItem(this.localSettingsKey(sessionId));
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  /**
   * Store comprehensive Tridium system data for a PM workflow session
   */
  static async storeTridiumSystemData(sessionId: string, systemData: TridiumSystemData): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Storing complete Tridium system data for session:', sessionId);

      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Database timeout after 10 seconds')), 10000);
      });

      const storeDataPromise = (async () => {
        // If sessionId is not a UUID, operate in local-only mode
        if (!isValidUUID(sessionId)) {
          const updatedPhase2Data = {
            tridiumSystemData: {
              ...systemData,
              lastUpdated: new Date().toISOString()
            }
          } as any;
          try { PlatformDataService.writeLocal(sessionId, updatedPhase2Data); } catch {}
          return { success: true };
        }
        // Get existing phase 2 data
        const { data: phase2Data, error: phase2Error } = await supabase
          .from('pm_workflow_sessions')
          .select('phase_2_data')
          .eq('id', sessionId)
          .single();

        if (phase2Error) {
          logger.error('Error fetching existing phase 2 data:', phase2Error);
          return { success: false, error: phase2Error.message };
        }

        // Merge with existing phase 2 data
        const currentPhase2Data = phase_2_data_safe(phase2Data?.phase_2_data);
        const updatedPhase2Data = {
          ...currentPhase2Data,
          tridiumSystemData: {
            ...systemData,
            lastUpdated: new Date().toISOString()
          }
        };

        // Always write a local fallback first so refresh survives even if DB fails
        try { PlatformDataService.writeLocal(sessionId, updatedPhase2Data); } catch {}

        // Update the session
        const { error: updateError } = await supabase
          .from('pm_workflow_sessions')
          .update({
            phase_2_data: updatedPhase2Data,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (updateError) {
          logger.error('Error updating session with Tridium system data:', updateError);
          // Fallback already written locally; still report success so UX can proceed
          return { success: true, error: updateError.message } as any;
        }

        logger.info('Tridium system data stored successfully');
        return { success: true };
      })();

      const result = await Promise.race([storeDataPromise, timeoutPromise]);
      return result;

    } catch (error) {
      logger.error('Error in storeTridiumSystemData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error storing Tridium system data'
      };
    }
  }

  /**
   * Merge a computed analysis snapshot into the session's persisted Phase 2 data
   */
  static async upsertAnalysisSnapshot(sessionId: string, snapshot: {
    scope: 'supervisor' | 'jace';
    refId: string; // 'supervisor' or jace name/key
    score: number;
    alerts: any[];
    metrics: Record<string, any>;
    created_at?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Local-only mode support
      if (!isValidUUID(sessionId)) {
        const current = this.readLocal(sessionId) || {};
        const list = Array.isArray(current.analysisSnapshots) ? current.analysisSnapshots : [];
        const ts = snapshot.created_at || new Date().toISOString();
        const filtered = list.filter((s: any) => !(s.scope === snapshot.scope && s.refId === snapshot.refId));
        const updated = { ...current, analysisSnapshots: [...filtered, { ...snapshot, created_at: ts }] };
        this.writeLocal(sessionId, updated);
        return { success: true };
      }
      const { data: phase2Data, error: phase2Error } = await supabase
        .from('pm_workflow_sessions')
        .select('phase_2_data')
        .eq('id', sessionId)
        .single();

      if (phase2Error) {
        return { success: false, error: phase2Error.message };
      }

      const current = phase_2_data_safe(phase2Data?.phase_2_data);
      const list = Array.isArray(current.analysisSnapshots) ? current.analysisSnapshots : [];
      const ts = snapshot.created_at || new Date().toISOString();
      const filtered = list.filter((s: any) => !(s.scope === snapshot.scope && s.refId === snapshot.refId));
      const updated = {
        ...current,
        analysisSnapshots: [...filtered, { ...snapshot, created_at: ts }]
      };

      const { error: updateError } = await supabase
        .from('pm_workflow_sessions')
        .update({
          phase_2_data: updated,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) return { success: false, error: updateError.message };
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  /**
   * Store individual data types (platform, resources, drivers, etc.)
   */
  static async storeIndividualDataType(
    sessionId: string,
    dataType: 'platform' | 'resources' | 'bacnet' | 'n2' | 'niagara_network' | 'modbus' | 'lon',
    data: any,
    targetLocation?: { type: 'supervisor' | 'jace'; name?: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info(`Storing ${dataType} data for session:`, sessionId);

      // Get current system data
      const currentResult = await this.getTridiumSystemData(sessionId);
      let systemData: TridiumSystemData;

      if (currentResult.error || !currentResult.data) {
        // Initialize new system data structure
        systemData = {
          architecture: targetLocation?.type === 'supervisor' ? 'supervisor' : 'single-jace',
          jaces: {},
          importedAt: new Date().toISOString(),
          dataSource: 'automated_import',
          importSummary: {
            totalFiles: 1,
            totalDevices: 0,
            jaceCount: 0,
            networkCount: 0,
            errors: []
          }
        };
      } else {
        systemData = currentResult.data;
      }

      // Store data in appropriate location
      if (targetLocation?.type === 'supervisor' || dataType === 'niagara_network') {
        // Network data always goes to supervisor level
        if (!systemData.supervisor) systemData.supervisor = {};

        switch (dataType) {
          case 'platform':
            systemData.supervisor.platform = data as PlatformParsedData;
            break;
          case 'resources':
            systemData.supervisor.resources = data as ResourceParsedData;
            break;
          case 'niagara_network':
            systemData.supervisor.network = data as NiagaraNetworkParsedData;
            break;
        }
      } else {
        // Store in JACE data
        const jaceName = targetLocation?.name || 'primary_jace';
        if (!systemData.jaces) systemData.jaces = {};
        if (!systemData.jaces[jaceName]) {
          systemData.jaces[jaceName] = {
            drivers: {}
          };
        }

        switch (dataType) {
          case 'platform':
            systemData.jaces[jaceName].platform = data as PlatformParsedData;
            break;
          case 'resources':
            systemData.jaces[jaceName].resources = data as ResourceParsedData;
            break;
          case 'bacnet':
            systemData.jaces[jaceName].drivers.bacnet = data as BACnetParsedData;
            break;
          case 'n2':
            systemData.jaces[jaceName].drivers.n2 = data as N2ParsedData;
            break;
          case 'modbus':
            systemData.jaces[jaceName].drivers.modbus = data;
            break;
          case 'lon':
            systemData.jaces[jaceName].drivers.lon = data;
            break;
        }
      }

      // Update summary counts
      systemData.importSummary.totalDevices = this.calculateTotalDevices(systemData);
      systemData.importSummary.jaceCount = Object.keys(systemData.jaces).length;

      // Store the updated system data
      return await this.storeTridiumSystemData(sessionId, systemData);

    } catch (error) {
      logger.error(`Error storing ${dataType} data:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : `Unknown error storing ${dataType} data`
      };
    }
  }

  /** Remove individual data type from the stored Tridium system data */
  static async removeIndividualDataType(
    sessionId: string,
    dataType: 'platform' | 'resources' | 'bacnet' | 'n2' | 'niagara_network' | 'modbus' | 'lon',
    targetLocation?: { type: 'supervisor' | 'jace'; name?: string }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Load current data (supports local-only mode too)
      const current = await this.getTridiumSystemData(sessionId);
      const systemData: TridiumSystemData = current.data || {
        architecture: targetLocation?.type === 'supervisor' ? 'supervisor' : 'single-jace',
        jaces: {},
        importedAt: new Date().toISOString(),
        dataSource: 'automated_import',
        importSummary: { totalFiles: 0, totalDevices: 0, jaceCount: 0, networkCount: 0, errors: [] }
      } as any;

      if (targetLocation?.type === 'supervisor' || dataType === 'niagara_network') {
        systemData.supervisor = systemData.supervisor || {} as any;
        switch (dataType) {
          case 'platform':
            if (systemData.supervisor.platform) delete (systemData.supervisor as any).platform;
            break;
          case 'resources':
            if (systemData.supervisor.resources) delete (systemData.supervisor as any).resources;
            break;
          case 'niagara_network':
            if (systemData.supervisor.network) delete (systemData.supervisor as any).network;
            break;
        }
      } else {
        const jaceName = targetLocation?.name || 'primary_jace';
        if (systemData.jaces?.[jaceName]) {
          switch (dataType) {
            case 'platform':
              if (systemData.jaces[jaceName].platform) delete (systemData.jaces[jaceName] as any).platform;
              break;
            case 'resources':
              if (systemData.jaces[jaceName].resources) delete (systemData.jaces[jaceName] as any).resources;
              break;
            case 'bacnet':
            case 'n2':
            case 'modbus':
            case 'lon':
              if (systemData.jaces[jaceName].drivers?.[dataType]) delete (systemData.jaces[jaceName].drivers as any)[dataType];
              break;
          }
          // If this JACE has no data left, keep the key but minimize
          systemData.jaces[jaceName] = systemData.jaces[jaceName] || { drivers: {} } as any;
        }
      }

      // Recompute summary
      systemData.importSummary.totalDevices = this.calculateTotalDevices(systemData);
      systemData.importSummary.jaceCount = Object.keys(systemData.jaces || {}).length;

      // Persist the updated structure (handles local-only mode internally)
      return await this.storeTridiumSystemData(sessionId, systemData);
    } catch (error) {
      logger.error(`Error removing ${dataType} data:`, error);
      return { success: false, error: error instanceof Error ? error.message : `Unknown error removing ${dataType} data` };
    }
  }

  /**
   * Calculate total devices across all JACEs and drivers
   */
  private static calculateTotalDevices(systemData: TridiumSystemData): number {
    let total = 0;

    Object.values(systemData.jaces).forEach(jace => {
      if (jace.drivers.bacnet?.devices) {
        total += jace.drivers.bacnet.devices.length;
      }
      if (jace.drivers.n2?.devices) {
        total += jace.drivers.n2.devices.length;
      }
      // Add other driver types as needed
    });

    return total;
  }

  /**
   * Get complete Tridium system data for a session
   */
  static async getTridiumSystemData(sessionId: string): Promise<{ data?: TridiumSystemData & { analysisSettings?: any }; error?: string }> {
    try {
      // In local-only mode, avoid DB and return local data if present
      if (!isValidUUID(sessionId)) {
        const local = this.readLocal(sessionId);
        if (local?.tridiumSystemData || local) {
          return { data: (local.tridiumSystemData ? local.tridiumSystemData : local) } as any;
        }
        return { error: 'No Tridium system data found for this session (local-only mode)' };
      }
      const { data, error } = await supabase
        .from('pm_workflow_sessions')
        .select('phase_2_data')
        .eq('id', sessionId)
        .single();

      if (error) {
        logger.error('Error fetching Tridium system data:', error);
        // Try local fallback
        if (sessionId) {
          const local = this.readLocal(sessionId);
          if (local?.tridiumSystemData || local) {
            return { data: (local.tridiumSystemData ? local.tridiumSystemData : local) } as any;
          }
        }
        return { error: error.message };
      }

      const systemData = data?.phase_2_data?.tridiumSystemData;
      if (!systemData) {
        // Try local fallback
        if (sessionId) {
          const local = this.readLocal(sessionId);
          if (local?.tridiumSystemData || local) {
            return { data: (local.tridiumSystemData ? local.tridiumSystemData : local) } as any;
          }
        }
        return { error: 'No Tridium system data found for this session' };
      }

      return { data: systemData };

    } catch (error) {
      logger.error('Error in getTridiumSystemData:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error retrieving Tridium system data'
      };
    }
  }

  /** Analysis settings (per session) */
  static async getAnalysisSettings(sessionId: string): Promise<{ data?: any; error?: string }> {
    try {
      if (!isValidUUID(sessionId)) {
        const local = this.readLocalSettings(sessionId);
        if (local) return { data: local };
        return { data: null };
      }
      const { data, error } = await supabase
        .from('pm_workflow_sessions')
        .select('phase_2_data')
        .eq('id', sessionId)
        .single();
      if (error) {
        // Fallback to local settings
        const local = this.readLocalSettings(sessionId);
        if (local) return { data: local };
        return { error: error.message };
      }
      return { data: data?.phase_2_data?.analysisSettings || this.readLocalSettings(sessionId) || null };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  static async saveAnalysisSettings(sessionId: string, settings: any): Promise<{ success: boolean; error?: string }> {
    try {
      if (!isValidUUID(sessionId)) {
        this.writeLocalSettings(sessionId, settings);
        return { success: true };
      }
      const { data, error } = await supabase
        .from('pm_workflow_sessions')
        .select('phase_2_data')
        .eq('id', sessionId)
        .single();
      if (error) {
        // Still persist locally
        this.writeLocalSettings(sessionId, settings);
        return { success: true, error: error.message };
      }
      const current = data?.phase_2_data || {};
      const updated = { ...current, analysisSettings: settings, updatedAt: new Date().toISOString() };
      // Write local first
      this.writeLocalSettings(sessionId, settings);
      const { error: upErr } = await supabase
        .from('pm_workflow_sessions')
        .update({ phase_2_data: updated, updated_at: new Date().toISOString() })
        .eq('id', sessionId);
      if (upErr) return { success: true, error: upErr.message };
      return { success: true };
    } catch (e) {
      return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }

  /**
   * Fallback: read tridium_imports and reconstruct minimal system data for restore
   */
  static async getLatestImports(sessionId: string): Promise<{ data?: Partial<TridiumSystemData>; error?: string }> {
    try {
      if (!isValidUUID(sessionId)) {
        const local = this.readLocal(sessionId);
        if (local?.tridiumSystemData || local) {
          return { data: (local.tridiumSystemData ? local.tridiumSystemData : local) } as any;
        }
        return { data: {} };
      }
      const { data, error } = await supabase
        .from('tridium_imports')
        .select('dataset_type, location_type, location_name, parsed_json, uploaded_at')
        .eq('session_id', sessionId)
        .order('uploaded_at', { ascending: false })
        .limit(200);

      if (error) return { error: error.message };
      if (!data || data.length === 0) return { data: {} };

      const system: Partial<TridiumSystemData> = {
        architecture: 'supervisor',
        jaces: {},
        importedAt: new Date().toISOString(),
        dataSource: 'automated_import',
        importSummary: { totalFiles: data.length, totalDevices: 0, jaceCount: 0, networkCount: 0, errors: [] }
      } as any;

      data.forEach((row: any) => {
        if (row.location_type === 'supervisor') {
          (system as any).supervisor = (system as any).supervisor || {};
          if (row.dataset_type === 'platform') (system as any).supervisor.platform = row.parsed_json;
          if (row.dataset_type === 'resources') (system as any).supervisor.resources = row.parsed_json;
          if (row.dataset_type === 'niagara_network') (system as any).supervisor.network = row.parsed_json;
        } else if (row.location_type === 'jace') {
          const jname = row.location_name || 'primary_jace';
          (system as any).jaces[jname] = (system as any).jaces[jname] || { drivers: {} };
          if (row.dataset_type === 'platform') (system as any).jaces[jname].platform = row.parsed_json;
          if (row.dataset_type === 'resources') (system as any).jaces[jname].resources = row.parsed_json;
          if (['bacnet','n2','modbus','lon'].includes(row.dataset_type)) (system as any).jaces[jname].drivers[row.dataset_type] = row.parsed_json;
        }
      });

      return { data: system };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Unknown error reading imports' };
    }
  }

  /**
   * Store platform data for a PM workflow session (legacy method, now calls storeIndividualDataType)
   */
  static async storePlatformData(sessionId: string, platformData: PlatformData): Promise<{ success: boolean; error?: string }> {
    try {
      logger.info('Storing platform data for session:', sessionId);

      // Store in phase 2 system discovery table
      const { data: phase2Data, error: phase2Error } = await supabase
        .from('pm_workflow_sessions')
        .select('phase_2_data')
        .eq('id', sessionId)
        .single();

      if (phase2Error) {
        logger.error('Error fetching existing phase 2 data:', phase2Error);
        return { success: false, error: phase2Error.message };
      }

      // Merge platform data with existing phase 2 data
      const currentPhase2Data = phase2Data?.phase_2_data || {};
      const updatedPhase2Data = {
        ...currentPhase2Data,
        platformDetails: {
          summary: platformData.summary,
          modules: platformData.modules,
          licenses: platformData.licenses,
          filesystems: platformData.filesystems,
          applications: platformData.applications,
          importedAt: new Date().toISOString(),
          dataSource: 'platform_export_file'
        }
      };

      // Update the session with platform data
      const { error: updateError } = await supabase
        .from('pm_workflow_sessions')
        .update({
          phase_2_data: updatedPhase2Data,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) {
        logger.error('Error updating session with platform data:', updateError);
        return { success: false, error: updateError.message };
      }

      // Store benchmarking metrics separately for trending
      if (platformData.summary) {
        await this.storePlatformBenchmarks(sessionId, platformData.summary);
      }

      logger.info('Platform data stored successfully');
      return { success: true };

    } catch (error) {
      logger.error('Error in storePlatformData:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error storing platform data'
      };
    }
  }

  /**
   * Store platform benchmarking metrics for historical comparison
   */
  private static async storePlatformBenchmarks(sessionId: string, summary: PlatformSummaryData): Promise<void> {
    try {
      // Get customer ID from session
      const { data: sessionData, error: sessionError } = await supabase
        .from('pm_workflow_sessions')
        .select('customer_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData?.customer_id) {
        logger.warn('Could not get customer ID for benchmarking:', sessionError);
        return;
      }

      // Create benchmark record with key metrics
      const benchmarkData = {
        customer_id: sessionData.customer_id,
        session_id: sessionId,
        platform_model: summary.model,
        platform_product: summary.product,
        niagara_version: summary.daemonVersion,
        architecture: summary.architecture,
        cpu_count: summary.cpuCount,
        host_id_status: summary.hostIdStatus,
        tls_support: summary.platformTlsSupport,
        runtime_profiles: summary.enabledRuntimeProfiles,
        operating_system: summary.operatingSystem,
        java_version: summary.javaVirtualMachine,
        recorded_at: new Date().toISOString()
      };

      // Note: This would require creating a platform_benchmarks table
      // For now, we'll store in the session data and can migrate later
      logger.info('Platform benchmark data prepared:', benchmarkData);

    } catch (error) {
      logger.error('Error storing platform benchmarks:', error);
    }
  }

  /**
   * Retrieve platform data for a session
   */
  static async getPlatformData(sessionId: string): Promise<{ data?: PlatformData; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('pm_workflow_sessions')
        .select('phase_2_data')
        .eq('id', sessionId)
        .single();

      if (error) {
        logger.error('Error fetching platform data:', error);
        return { error: error.message };
      }

      const platformData = data?.phase_2_data?.platformDetails;
      if (!platformData) {
        return { error: 'No platform data found for this session' };
      }

      return { data: platformData };

    } catch (error) {
      logger.error('Error in getPlatformData:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error retrieving platform data'
      };
    }
  }

  /**
   * Get platform data for multiple sessions (for trending/comparison)
   */
  static async getPlatformHistory(customerId: string, limit: number = 10): Promise<{ data?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('pm_workflow_sessions')
        .select(`
          id,
          started_at,
          phase_2_data,
          primary_technician_name
        `)
        .eq('customer_id', customerId)
        .not('phase_2_data->platformDetails', 'is', null)
        .order('started_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching platform history:', error);
        return { error: error.message };
      }

      const platformHistory = data?.map(session => ({
        sessionId: session.id,
        visitDate: session.started_at,
        technician: session.primary_technician_name,
        platformData: session.phase_2_data?.platformDetails
      })) || [];

      return { data: platformHistory };

    } catch (error) {
      logger.error('Error in getPlatformHistory:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error retrieving platform history'
      };
    }
  }

  /**
   * Compare current platform data with historical baseline
   */
  static async comparePlatformData(sessionId: string): Promise<{ comparison?: any; error?: string }> {
    try {
      // Get current session platform data
      const currentResult = await this.getPlatformData(sessionId);
      if (currentResult.error || !currentResult.data) {
        return { error: 'Current platform data not found' };
      }

      // Get customer ID
      const { data: sessionData, error: sessionError } = await supabase
        .from('pm_workflow_sessions')
        .select('customer_id')
        .eq('id', sessionId)
        .single();

      if (sessionError || !sessionData?.customer_id) {
        return { error: 'Could not get customer information' };
      }

      // Get historical data
      const historyResult = await this.getPlatformHistory(sessionData.customer_id, 5);
      if (historyResult.error || !historyResult.data) {
        return { error: 'No historical data available for comparison' };
      }

      // Perform comparison
      const currentSummary = currentResult.data.summary;
      const previousVisits = historyResult.data.filter(visit => visit.sessionId !== sessionId);

      const comparison = {
        current: {
          niagaraVersion: currentSummary.daemonVersion,
          cpuCount: currentSummary.cpuCount,
          architecture: currentSummary.architecture,
          tlsSupport: currentSummary.platformTlsSupport,
          runtimeProfiles: currentSummary.enabledRuntimeProfiles
        },
        changes: {
          versionChanged: false,
          hardwareChanged: false,
          tlsChanged: false,
          profilesChanged: false
        },
        previousVisits: previousVisits.length
      };

      // Check for changes if there's historical data
      if (previousVisits.length > 0) {
        const lastVisit = previousVisits[0].platformData.summary;

        comparison.changes.versionChanged = currentSummary.daemonVersion !== lastVisit.daemonVersion;
        comparison.changes.hardwareChanged =
          currentSummary.cpuCount !== lastVisit.cpuCount ||
          currentSummary.architecture !== lastVisit.architecture;
        comparison.changes.tlsChanged = currentSummary.platformTlsSupport !== lastVisit.platformTlsSupport;
        comparison.changes.profilesChanged =
          JSON.stringify(currentSummary.enabledRuntimeProfiles) !==
          JSON.stringify(lastVisit.enabledRuntimeProfiles);
      }

      return { comparison };

    } catch (error) {
      logger.error('Error in comparePlatformData:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error comparing platform data'
      };
    }
  }
}

function phase_2_data_safe(v: any) {
  if (!v || typeof v !== 'object') return {} as any;
  return v;
}
