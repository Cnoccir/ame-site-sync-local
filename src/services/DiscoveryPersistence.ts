/**
 * Discovery Persistence Service
 * Handles storing parsed Tridium data to Supabase
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { DatasetType } from './DiscoveryAPI';

export class DiscoveryPersistence {
  /**
   * Store file and parsed data to database
   */
  static async storeFileData(params: {
    discoveryRunId: string;
    datasetType: DatasetType;
    targetLocation: { type: 'supervisor' | 'jace'; name?: string };
    file: File;
    parsedData: any;
  }): Promise<{ success: boolean; fileId?: string; error?: string }> {
    try {
      const { discoveryRunId, datasetType, targetLocation, file, parsedData } = params;
      
      // 1. Store raw file record
      const { data: fileRecord, error: fileError } = await supabase
        .from('discovery_files')
        .insert({
          discovery_run_id: discoveryRunId,
          file_type: datasetType,
          entity_type: targetLocation.type,
          entity_name: targetLocation.name,
          filename: file.name,
          file_size: file.size,
          parse_status: 'success',
          parsed_data: parsedData
        })
        .select()
        .single();
      
      if (fileError) {
        logger.error('Failed to store file record:', fileError);
        return { success: false, error: fileError.message };
      }
      
      // 2. Denormalize into specific tables for easy querying
      if (datasetType === 'platform') {
        await this.storePlatformData(discoveryRunId, fileRecord.id, targetLocation, parsedData);
      } else if (datasetType === 'resources') {
        await this.storeResourceData(discoveryRunId, fileRecord.id, targetLocation, parsedData);
      } else if (['bacnet', 'n2', 'modbus', 'lon'].includes(datasetType)) {
        await this.storeDeviceData(discoveryRunId, fileRecord.id, targetLocation.name || 'unknown', datasetType, parsedData);
      }
      
      logger.info('File data stored successfully', { 
        fileId: fileRecord.id, 
        type: datasetType,
        entity: `${targetLocation.type}:${targetLocation.name || 'main'}`
      });
      
      return { success: true, fileId: fileRecord.id };
    } catch (error) {
      logger.error('Failed to store file data:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }
  
  /**
   * Store platform data
   */
  private static async storePlatformData(
    runId: string, 
    fileId: string, 
    location: { type: string; name?: string }, 
    data: any
  ) {
    try {
      await supabase.from('platform_data').insert({
        discovery_run_id: runId,
        file_id: fileId,
        entity_type: location.type,
        entity_name: location.name,
        host_id: data.platform_identity?.host_id,
        model: data.platform_identity?.model,
        product: data.platform_identity?.product,
        serial_number: data.platform_identity?.serial_number,
        niagara_version: data.system?.niagara_version,
        os_name: data.system?.os_name,
        cpu_count: data.system?.cpu_count,
        memory_total_gb: data.memory?.total_ram_gb,
        memory_free_gb: data.memory?.free_ram_gb,
        memory_used_percent: data.memory?.ram_usage_percent,
        platform_json: data
      });
      
      logger.info('Platform data stored', { entity: `${location.type}:${location.name || 'main'}` });
    } catch (error) {
      logger.error('Failed to store platform data:', error);
      throw error;
    }
  }
  
  /**
   * Store resource data
   */
  private static async storeResourceData(
    runId: string, 
    fileId: string, 
    location: { type: string; name?: string }, 
    data: any
  ) {
    try {
      await supabase.from('resource_data').insert({
        discovery_run_id: runId,
        file_id: fileId,
        entity_type: location.type,
        entity_name: location.name,
        devices_used: data.devices?.used || data.device_used,
        devices_licensed: data.devices?.licensed || data.device_licensed,
        points_used: data.points?.used || data.point_used,
        points_licensed: data.points?.licensed || data.point_licensed,
        heap_used_mb: data.heap?.used_mb,
        heap_max_mb: data.heap?.max_mb,
        heap_used_percent: data.heap?.used_percent,
        resource_json: data
      });
      
      logger.info('Resource data stored', { entity: `${location.type}:${location.name || 'main'}` });
    } catch (error) {
      logger.error('Failed to store resource data:', error);
      throw error;
    }
  }
  
  /**
   * Store device inventory data
   */
  private static async storeDeviceData(
    runId: string, 
    fileId: string, 
    jaceName: string, 
    driverType: string, 
    data: any
  ) {
    try {
      const devices = data.devices || [];
      
      if (devices.length === 0) {
        logger.info('No devices to store');
        return;
      }
      
      const deviceRecords = devices.map((device: any) => ({
        discovery_run_id: runId,
        file_id: fileId,
        jace_name: jaceName,
        driver_type: driverType,
        device_id: String(device.id || device.device_id || device.deviceId || ''),
        device_name: device.name || device.deviceName,
        vendor: device.vendor,
        model: device.model,
        status: Array.isArray(device.status) ? device.status.join(',') : device.status,
        network_address: device.network_address || device.address || device.networkAddress,
        mac_address: device.mac_address || device.macAddress,
        device_json: device
      }));
      
      await supabase.from('device_inventory').insert(deviceRecords);
      
      logger.info('Device data stored', { 
        jace: jaceName, 
        driver: driverType, 
        count: deviceRecords.length 
      });
    } catch (error) {
      logger.error('Failed to store device data:', error);
      throw error;
    }
  }
  
  /**
   * Load all data for a discovery run
   */
  static async loadDiscoveryData(discoveryRunId: string): Promise<{
    platformData: any[];
    resourceData: any[];
    deviceData: any[];
  } | null> {
    try {
      const [platformResult, resourceResult, deviceResult] = await Promise.all([
        supabase
          .from('platform_data')
          .select('*')
          .eq('discovery_run_id', discoveryRunId),
        supabase
          .from('resource_data')
          .select('*')
          .eq('discovery_run_id', discoveryRunId),
        supabase
          .from('device_inventory')
          .select('*')
          .eq('discovery_run_id', discoveryRunId)
      ]);
      
      if (platformResult.error) {
        logger.error('Failed to load platform data:', platformResult.error);
      }
      if (resourceResult.error) {
        logger.error('Failed to load resource data:', resourceResult.error);
      }
      if (deviceResult.error) {
        logger.error('Failed to load device data:', deviceResult.error);
      }
      
      return {
        platformData: platformResult.data || [],
        resourceData: resourceResult.data || [],
        deviceData: deviceResult.data || []
      };
    } catch (error) {
      logger.error('Failed to load discovery data:', error);
      return null;
    }
  }
  
  /**
   * Transform loaded data into display format
   */
  static transformForDisplay(loadedData: {
    platformData: any[];
    resourceData: any[];
    deviceData: any[];
  }): any {
    const { platformData, resourceData, deviceData } = loadedData;
    
    // Group by entity
    const supervisor = {
      platform: platformData.find(p => p.entity_type === 'supervisor'),
      resources: resourceData.find(r => r.entity_type === 'supervisor')
    };
    
    // Group JACEs
    const jaceNames = new Set([
      ...platformData.filter(p => p.entity_type === 'jace').map(p => p.entity_name),
      ...resourceData.filter(r => r.entity_type === 'jace').map(r => r.entity_name)
    ]);
    
    const jaces: Record<string, any> = {};
    jaceNames.forEach(name => {
      jaces[name] = {
        platform: platformData.find(p => p.entity_type === 'jace' && p.entity_name === name),
        resources: resourceData.find(r => r.entity_type === 'jace' && r.entity_name === name),
        devices: deviceData.filter(d => d.jace_name === name)
      };
    });
    
    return {
      supervisor,
      jaces
    };
  }
  
  /**
   * Get discovery run by session ID
   */
  static async getDiscoveryRunBySession(sessionId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('discovery_runs')
        .select('id')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) {
        logger.error('Failed to get discovery run:', error);
        return null;
      }
      
      return data?.id || null;
    } catch (error) {
      logger.error('Failed to get discovery run:', error);
      return null;
    }
  }
}