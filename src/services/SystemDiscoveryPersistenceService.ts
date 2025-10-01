/**
 * System Discovery Persistence Service
 * 
 * Handles saving imported Niagara/Tridium system data to the normalized database schema.
 * Ensures no data loss by storing everything in proper tables with JSONB flexibility.
 */

import { supabase } from '@/integrations/supabase/client';
import { TridiumSystemData } from './PlatformDataService';
import { logger } from '../utils/logger';

interface PersistenceResult {
  success: boolean;
  discoveryId?: string;
  error?: string;
  summary?: {
    jacesCreated: number;
    devicesCreated: number;
    resourcesStored: number;
  };
}

export class SystemDiscoveryPersistenceService {
  /**
   * Main entry point: Persist complete system discovery to normalized tables
   */
  static async persistSystemDiscovery(
    sessionId: string,
    customerId: string | null,
    systemData: TridiumSystemData,
    discoveryName?: string
  ): Promise<PersistenceResult> {
    logger.info('[SystemDiscoveryPersistence] Starting persistence for session:', sessionId);

    try {
      // Step 1: Create or update system_discoveries record
      const discovery = await this.upsertSystemDiscovery(
        sessionId,
        customerId,
        systemData,
        discoveryName
      );

      if (!discovery) {
        return { success: false, error: 'Failed to create system discovery record' };
      }

      const discoveryId = discovery.id;
      logger.info('[SystemDiscoveryPersistence] Discovery record created:', discoveryId);

      let jacesCreated = 0;
      let devicesCreated = 0;
      let resourcesStored = 0;

      // Step 2: Store network topology if available
      if (systemData.supervisor?.network) {
        await this.storeNetworkTopology(discoveryId, systemData.supervisor.network);
      }

      // Step 3: Process supervisor if exists
      if (systemData.supervisor && systemData.architecture === 'supervisor') {
        const supervisorJaceId = await this.processJACE(
          discoveryId,
          null, // No network_id for now
          'supervisor',
          systemData.supervisor,
          true // is_supervisor
        );

        if (supervisorJaceId) {
          jacesCreated++;
          if (systemData.supervisor.resources) resourcesStored++;
        }
      }

      // Step 4: Process all JACEs
      for (const [jaceName, jaceData] of Object.entries(systemData.jaces)) {
        const jaceId = await this.processJACE(
          discoveryId,
          null, // Network topology linking can be done later
          jaceName,
          jaceData,
          false
        );

        if (jaceId) {
          jacesCreated++;
          if (jaceData.resources) resourcesStored++;

          // Process drivers (field devices)
          const driverDeviceCount = await this.processDrivers(
            discoveryId,
            jaceId,
            jaceName,
            jaceData.drivers
          );
          devicesCreated += driverDeviceCount;
        }
      }

      // Step 5: Update discovery summary stats
      await this.updateDiscoverySummary(discoveryId, {
        totalJaces: jacesCreated,
        totalDevices: devicesCreated,
        totalPoints: this.calculateTotalPoints(systemData)
      });

      logger.info('[SystemDiscoveryPersistence] Persistence complete:', {
        discoveryId,
        jacesCreated,
        devicesCreated,
        resourcesStored
      });

      return {
        success: true,
        discoveryId,
        summary: {
          jacesCreated,
          devicesCreated,
          resourcesStored
        }
      };

    } catch (error) {
      logger.error('[SystemDiscoveryPersistence] Error persisting system discovery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during persistence'
      };
    }
  }

  /**
   * Create or update system_discoveries record
   */
  private static async upsertSystemDiscovery(
    sessionId: string,
    customerId: string | null,
    systemData: TridiumSystemData,
    discoveryName?: string
  ): Promise<any> {
    const discoveryData = {
      session_id: sessionId,
      customer_id: customerId,
      discovery_name: discoveryName || `Discovery ${new Date().toLocaleDateString()}`,
      architecture: systemData.architecture || 'unknown',
      data_source: systemData.dataSource || 'automated_import',
      total_files_imported: systemData.importSummary?.totalFiles || 0,
      import_errors: systemData.importSummary?.errors || [],
      import_warnings: [],
      imported_at: systemData.importedAt || new Date().toISOString(),
      raw_import_data: systemData // Store complete raw data as backup
    };

    // Try to find existing discovery for this session
    const { data: existing } = await supabase
      .from('system_discoveries')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('system_discoveries')
        .update(discoveryData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('system_discoveries')
        .insert(discoveryData)
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  /**
   * Store network topology data
   */
  private static async storeNetworkTopology(
    discoveryId: string,
    networkData: any
  ): Promise<void> {
    const topologyData = {
      discovery_id: discoveryId,
      network_name: networkData.network?.name || 'Network',
      description: networkData.network?.description || '',
      supervisor_name: networkData.network?.supervisor || '',
      total_nodes: networkData.network?.nodes?.length || 0,
      total_devices: networkData.summary?.totalDevices || 0,
      network_data: networkData // Full JSONB
    };

    // Upsert (replace if exists)
    const { error } = await supabase
      .from('network_topologies')
      .upsert(topologyData, {
        onConflict: 'discovery_id',
        ignoreDuplicates: false
      });

    if (error) {
      logger.error('[SystemDiscoveryPersistence] Error storing network topology:', error);
    }
  }

  /**
   * Process a single JACE: create record, store platform, resources, etc.
   */
  private static async processJACE(
    discoveryId: string,
    networkId: string | null,
    jaceName: string,
    jaceData: any,
    isSupervisor: boolean
  ): Promise<string | null> {
    try {
      // 1. Create/update JACE record
      const jaceRecord = {
        discovery_id: discoveryId,
        network_id: networkId,
        jace_name: jaceName,
        jace_type: isSupervisor ? 'supervisor' : (jaceData.networkInfo?.deviceType || 'jace'),
        station_name: jaceData.networkInfo?.stationName || jaceName,
        ip_address: jaceData.networkInfo?.ipAddress || null,
        mac_address: jaceData.networkInfo?.macAddress || null,
        is_supervisor: isSupervisor
      };

      const { data: jace, error: jaceError } = await supabase
        .from('jaces')
        .upsert(jaceRecord, {
          onConflict: 'discovery_id,jace_name',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (jaceError) throw jaceError;
      const jaceId = jace.id;

      // 2. Store platform data if available
      if (jaceData.platform) {
        await this.storeJacePlatform(jaceId, jaceData.platform);
      }

      // 3. Store resource metrics if available
      if (jaceData.resources) {
        await this.storeJaceResources(jaceId, jaceData.resources);
      }

      return jaceId;

    } catch (error) {
      logger.error(`[SystemDiscoveryPersistence] Error processing JACE ${jaceName}:`, error);
      return null;
    }
  }

  /**
   * Store JACE platform data
   */
  private static async storeJacePlatform(
    jaceId: string,
    platformData: any
  ): Promise<void> {
    const summary = platformData.summary || {};
    
    const platformRecord = {
      jace_id: jaceId,
      daemon_version: summary.daemonVersion || null,
      model: summary.model || null,
      product: summary.product || null,
      host_id: summary.hostId || null,
      architecture: summary.architecture || null,
      cpu_count: summary.cpuCount || null,
      ram_free_kb: summary.ramFree || null,
      ram_total_kb: summary.ramTotal || null,
      os: summary.os || null,
      java_version: summary.java || null,
      niagara_runtime: summary.niagaraRuntime || null,
      https_port: summary.httpsPort || null,
      fox_port: summary.foxPort || null,
      platform_data: platformData // Full JSONB with modules, licenses, etc.
    };

    const { error } = await supabase
      .from('jace_platforms')
      .upsert(platformRecord, {
        onConflict: 'jace_id',
        ignoreDuplicates: false
      });

    if (error) {
      logger.error('[SystemDiscoveryPersistence] Error storing platform data:', error);
    }
  }

  /**
   * Store JACE resource metrics (ALL metrics in allMetrics JSONB)
   */
  private static async storeJaceResources(
    jaceId: string,
    resourcesData: any
  ): Promise<void> {
    const metrics = resourcesData.metrics || {};
    const analysis = resourcesData.analysis || {};

    const resourceRecord = {
      jace_id: jaceId,
      
      // Key metrics (indexed for fast queries)
      cpu_usage_percent: metrics.cpu?.usage || null,
      heap_used_mb: metrics.heap?.used || null,
      heap_max_mb: metrics.heap?.max || null,
      heap_percent: metrics.heap?.max > 0 
        ? Math.round((metrics.heap.used / metrics.heap.max) * 100) 
        : null,
      memory_used_mb: metrics.memory?.used || null,
      memory_total_mb: metrics.memory?.total || null,
      memory_percent: metrics.memory?.total > 0
        ? Math.round((metrics.memory.used / metrics.memory.total) * 100)
        : null,
      
      // Capacity metrics
      components_count: metrics.capacities?.components || null,
      points_used: metrics.capacities?.points?.current || null,
      points_limit: metrics.capacities?.points?.limit || null,
      points_percent: metrics.capacities?.points?.percentage || null,
      devices_used: metrics.capacities?.devices?.current || null,
      devices_limit: metrics.capacities?.devices?.limit || null,
      devices_percent: metrics.capacities?.devices?.percentage || null,
      histories_count: metrics.capacities?.histories?.current || null,
      
      // System info
      uptime: metrics.uptime || null,
      niagara_version: metrics.versions?.niagara || null,
      java_version: metrics.versions?.java || null,
      os_version: metrics.versions?.os || null,
      
      // ALL metrics stored in JSONB (30-50+ metrics preserved!)
      all_metrics: resourcesData.allMetrics || {},
      
      // Health analysis
      health_score: analysis.healthScore || null,
      alerts: analysis.alerts || [],
      warnings: resourcesData.warnings || []
    };

    const { error } = await supabase
      .from('jace_resources')
      .upsert(resourceRecord, {
        onConflict: 'jace_id',
        ignoreDuplicates: false
      });

    if (error) {
      logger.error('[SystemDiscoveryPersistence] Error storing resource metrics:', error);
    }
  }

  /**
   * Process driver data and store field devices
   */
  private static async processDrivers(
    discoveryId: string,
    jaceId: string,
    jaceName: string,
    drivers: any
  ): Promise<number> {
    let deviceCount = 0;

    // Process BACnet devices
    if (drivers.bacnet?.devices) {
      for (const device of drivers.bacnet.devices) {
        const stored = await this.storeFieldDevice(
          discoveryId,
          jaceId,
          'bacnet',
          device
        );
        if (stored) deviceCount++;
      }
    }

    // Process N2 devices
    if (drivers.n2?.devices) {
      for (const device of drivers.n2.devices) {
        const stored = await this.storeFieldDevice(
          discoveryId,
          jaceId,
          'n2',
          device
        );
        if (stored) deviceCount++;
      }
    }

    // Process Modbus devices
    if (drivers.modbus?.devices) {
      for (const device of drivers.modbus.devices) {
        const stored = await this.storeFieldDevice(
          discoveryId,
          jaceId,
          'modbus',
          device
        );
        if (stored) deviceCount++;
      }
    }

    return deviceCount;
  }

  /**
   * Store individual field device
   */
  private static async storeFieldDevice(
    discoveryId: string,
    jaceId: string,
    deviceType: string,
    deviceData: any
  ): Promise<boolean> {
    try {
      const deviceRecord = {
        jace_id: jaceId,
        discovery_id: discoveryId,
        device_name: deviceData.name || deviceData.deviceName || 'Unknown',
        device_type: deviceType,
        device_id: deviceData.deviceId?.toString() || deviceData.id?.toString() || null,
        instance_number: deviceData.instance || deviceData.instanceNumber || null,
        
        // Device details
        vendor: deviceData.vendor || null,
        model: deviceData.model || deviceData.modelName || null,
        description: deviceData.description || null,
        location: deviceData.location || null,
        
        // Network info
        network_name: deviceData.network || deviceData.networkName || null,
        network_number: deviceData.networkNumber || null,
        address: deviceData.address || deviceData.deviceAddress || null,
        mac_address: deviceData.macAddress || null,
        
        // Status
        status: deviceData.status || null,
        is_online: deviceData.status?.includes('ok') || deviceData.online || null,
        has_alarms: deviceData.status?.includes('alarm') || deviceData.hasAlarms || false,
        
        // Point counts
        point_count: deviceData.pointCount || deviceData.points || 0,
        analog_inputs: deviceData.analogInputs || deviceData.ai || 0,
        analog_outputs: deviceData.analogOutputs || deviceData.ao || 0,
        binary_inputs: deviceData.binaryInputs || deviceData.bi || 0,
        binary_outputs: deviceData.binaryOutputs || deviceData.bo || 0,
        
        // Full device data (protocol-specific)
        device_data: deviceData,
        
        last_seen_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('field_devices')
        .upsert(deviceRecord, {
          onConflict: 'jace_id,device_type,device_name',
          ignoreDuplicates: false
        });

      if (error) {
        logger.error('[SystemDiscoveryPersistence] Error storing field device:', error);
        return false;
      }

      return true;

    } catch (error) {
      logger.error('[SystemDiscoveryPersistence] Error in storeFieldDevice:', error);
      return false;
    }
  }

  /**
   * Update discovery summary stats
   */
  private static async updateDiscoverySummary(
    discoveryId: string,
    summary: {
      totalJaces: number;
      totalDevices: number;
      totalPoints: number;
    }
  ): Promise<void> {
    const { error } = await supabase
      .from('system_discoveries')
      .update({
        total_jaces: summary.totalJaces,
        total_devices: summary.totalDevices,
        total_points: summary.totalPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', discoveryId);

    if (error) {
      logger.error('[SystemDiscoveryPersistence] Error updating discovery summary:', error);
    }
  }

  /**
   * Calculate total points across all JACEs
   */
  private static calculateTotalPoints(systemData: TridiumSystemData): number {
    let total = 0;

    // Count supervisor points
    if (systemData.supervisor?.resources?.metrics?.capacities?.points) {
      total += systemData.supervisor.resources.metrics.capacities.points.current || 0;
    }

    // Count JACE points
    Object.values(systemData.jaces).forEach(jace => {
      if (jace.resources?.metrics?.capacities?.points) {
        total += jace.resources.metrics.capacities.points.current || 0;
      }
    });

    return total;
  }

  /**
   * Get discovery by session ID
   */
  static async getDiscoveryBySession(sessionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('system_discoveries')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      logger.error('[SystemDiscoveryPersistence] Error fetching discovery:', error);
      return null;
    }

    return data;
  }

  /**
   * Get discovery with full details
   */
  static async getDiscoveryWithDetails(discoveryId: string): Promise<any> {
    const { data: discovery, error: discoveryError } = await supabase
      .from('system_discoveries')
      .select(`
        *,
        jaces:jaces(
          *,
          platform:jace_platforms(*),
          resources:jace_resources(*),
          devices:field_devices(count)
        )
      `)
      .eq('id', discoveryId)
      .single();

    if (discoveryError) {
      logger.error('[SystemDiscoveryPersistence] Error fetching discovery details:', discoveryError);
      return null;
    }

    return discovery;
  }
}
