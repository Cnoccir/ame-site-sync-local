import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import type { TridiumDataset, TridiumDataRow } from '@/types/tridium';
import type { PlatformDetailsOutput } from '@/utils/tridium/parsers/platformDetailsParser';
import type { ResourceExportOutput } from '@/utils/tridium/parsers/resourceExportParser';

export interface SystemBaselineData {
  projectId: string;
  customerId?: string;
  siteName: string;
  systemArchitecture?: 'single-jace' | 'multi-jace' | 'supervisor';
  niagaraVersion?: string;
  totalDevices?: number;
  totalPoints?: number;
  healthScore?: number;
  resourceData?: any;
  deviceInventory?: any;
  networkTopology?: any;
  platformDetails?: any;
  alertSummary?: any;
  parsedBy: string;
  parsingErrors?: string[];
  dataConfidence?: number;
}

export interface DeviceData {
  deviceName: string;
  status?: string[];
  isOnline?: boolean;
  isHealthy?: boolean;
  location?: string;
  zone?: string;
  lastSeen?: Date;
}

export interface BACnetDeviceData extends DeviceData {
  deviceId: number;
  objectInstance?: number;
  objectType?: string;
  vendor?: string;
  model?: string;
  description?: string;
  firmwareRevision?: string;
  protocolRevision?: string;
  networkId?: number;
  macAddress?: number;
  maxApdu?: number;
  enabled?: boolean;
  covEnabled?: boolean;
  health?: string;
  healthTimestamp?: Date;
}

export interface N2DeviceData extends DeviceData {
  address: number;
  controllerType: string;
  rawType?: string;
  network?: string;
  statusText?: string;
}

export interface ModbusDeviceData extends DeviceData {
  slaveAddress?: number;
  registerAddress?: number;
  registerCount?: number;
  functionCode?: number;
  dataType?: string;
  description?: string;
  unitOfMeasure?: string;
  scalingFactor?: number;
  isActive?: boolean;
  lastRead?: Date;
}

export interface NetworkStationData {
  stationName: string;
  ipAddress?: string;
  foxPort?: number;
  hostModel?: string;
  niagaraVersion?: string;
  platformVersion?: string;
  connectionStatus?: string;
  platformStatus?: string;
  overallStatus?: string;
  securePlatform?: boolean;
  platformPort?: number;
  credentialsStore?: string;
  isOnline?: boolean;
  isReachable?: boolean;
  lastPing?: Date;
}

export interface AlertData {
  alertType: 'resource' | 'device' | 'security' | 'network';
  metricName: string;
  severity: 'info' | 'warning' | 'critical';
  currentValue?: string;
  thresholdValue?: string;
  thresholdOperator?: string;
  title: string;
  description: string;
  recommendation?: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  isActive?: boolean;
}

export interface ExportFileData {
  filename: string;
  fileType: string;
  fileSize?: number;
  fileHash?: string;
  parseStatus: 'success' | 'failed' | 'warning';
  parseErrors?: string[];
  parseWarnings?: string[];
  processingTimeMs?: number;
  rowsParsed?: number;
  rowsFailed?: number;
  dataConfidence?: number;
  rawContent?: string;
  parsedData?: any;
  uploadedBy: string;
}

export class TridiumDatabaseService {
  /**
   * Create a new system baseline entry
   */
  async createSystemBaseline(data: SystemBaselineData): Promise<string | null> {
    try {
      const { data: baseline, error } = await supabase
        .from('system_baselines')
        .insert({
          project_id: data.projectId,
          customer_id: data.customerId,
          site_name: data.siteName,
          system_architecture: data.systemArchitecture,
          niagara_version: data.niagaraVersion,
          total_devices: data.totalDevices || 0,
          total_points: data.totalPoints || 0,
          health_score: data.healthScore,
          resource_data: data.resourceData || {},
          device_inventory: data.deviceInventory || {},
          network_topology: data.networkTopology || {},
          platform_details: data.platformDetails || {},
          alert_summary: data.alertSummary || {},
          parsed_by: data.parsedBy,
          parsing_errors: data.parsingErrors || [],
          data_confidence: data.dataConfidence || 100
        })
        .select('id')
        .single();

      if (error) {
        logger.error('Failed to create system baseline', { error });
        return null;
      }

      logger.info('System baseline created successfully', { baselineId: baseline.id });
      return baseline.id;
    } catch (error) {
      logger.error('Error creating system baseline', { error });
      return null;
    }
  }

  /**
   * Save platform details to database
   */
  async savePlatformDetails(baselineId: string, platformData: PlatformDetailsOutput): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('platform_details')
        .insert({
          baseline_id: baselineId,
          model: platformData.platform_identity.model,
          product: platformData.platform_identity.product,
          host_id: platformData.platform_identity.host_id,
          architecture: platformData.platform_identity.architecture,
          cpu_count: platformData.hardware.cpu_count,
          ram_total_mb: platformData.memory.ram_total_mb,
          ram_free_mb: platformData.memory.ram_free_mb,
          ram_usage_percent: platformData.memory.ram_usage_percent,
          storage_total_mb: platformData.storage.total_mb,
          storage_free_mb: platformData.storage.free_mb,
          storage_usage_percent: platformData.storage.usage_percent,
          daemon_version: platformData.system.daemon_version,
          daemon_port: platformData.system.daemon_port,
          operating_system: platformData.system.operating_system,
          java_version: platformData.system.java_version,
          niagara_version: platformData.system.niagara_version,
          modules: platformData.modules || [],
          licenses: platformData.licenses || [],
          certificates: platformData.certificates || [],
          tls_enabled: platformData.security.tls_enabled,
          security_score: platformData.security.security_score
        });

      if (error) {
        logger.error('Failed to save platform details', { baselineId, error });
        return false;
      }

      logger.info('Platform details saved successfully', { baselineId });
      return true;
    } catch (error) {
      logger.error('Error saving platform details', { baselineId, error });
      return false;
    }
  }

  /**
   * Save resource utilization to database
   */
  async saveResourceUtilization(baselineId: string, resourceData: ResourceExportOutput): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resource_utilization')
        .insert({
          baseline_id: baselineId,
          components_total: resourceData.resources.components,
          components_enabled: resourceData.resources.enabled_components,
          components_disabled: resourceData.resources.disabled_components,
          devices_total: resourceData.resources.devices,
          devices_online: resourceData.resources.devices_online,
          devices_offline: resourceData.resources.devices_offline,
          devices_unknown: resourceData.resources.devices_unknown,
          points_total: resourceData.resources.points,
          histories_total: resourceData.resources.histories,
          heap_used_mb: resourceData.resources.heap.used_mb,
          heap_total_mb: resourceData.resources.heap.total_mb,
          heap_percent_used: resourceData.resources.heap.percent_used,
          uptime_hours: resourceData.resources.time.uptime_hours,
          uptime_text: resourceData.resources.time.uptime,
          engine_stats: resourceData.resources.engine_stats || {}
        });

      if (error) {
        logger.error('Failed to save resource utilization', { baselineId, error });
        return false;
      }

      logger.info('Resource utilization saved successfully', { baselineId });
      return true;
    } catch (error) {
      logger.error('Error saving resource utilization', { baselineId, error });
      return false;
    }
  }

  /**
   * Save BACnet devices to database
   */
  async saveBACnetDevices(baselineId: string, devices: BACnetDeviceData[]): Promise<boolean> {
    try {
      const deviceRecords = devices.map(device => ({
        baseline_id: baselineId,
        device_name: device.deviceName,
        device_id: device.deviceId,
        object_instance: device.objectInstance,
        object_type: device.objectType,
        vendor: device.vendor,
        model: device.model,
        description: device.description,
        firmware_revision: device.firmwareRevision,
        protocol_revision: device.protocolRevision,
        network_id: device.networkId,
        mac_address: device.macAddress,
        max_apdu: device.maxApdu,
        status: device.status || [],
        health: device.health,
        health_timestamp: device.healthTimestamp,
        enabled: device.enabled,
        cov_enabled: device.covEnabled,
        location: device.location,
        zone: device.zone,
        building_reference: device.zone // Using zone as building reference for now
      }));

      const { error } = await supabase
        .from('bacnet_devices')
        .insert(deviceRecords);

      if (error) {
        logger.error('Failed to save BACnet devices', { baselineId, deviceCount: devices.length, error });
        return false;
      }

      logger.info('BACnet devices saved successfully', { baselineId, deviceCount: devices.length });
      return true;
    } catch (error) {
      logger.error('Error saving BACnet devices', { baselineId, error });
      return false;
    }
  }

  /**
   * Save N2 devices to database
   */
  async saveN2Devices(baselineId: string, devices: N2DeviceData[]): Promise<boolean> {
    try {
      const deviceRecords = devices.map(device => ({
        baseline_id: baselineId,
        device_name: device.deviceName,
        address: device.address,
        controller_type: device.controllerType,
        raw_type: device.rawType,
        status: device.status || [],
        status_text: device.statusText,
        network: device.network,
        zone: device.zone,
        location: device.location,
        is_online: device.isOnline,
        is_healthy: device.isHealthy,
        last_seen: device.lastSeen
      }));

      const { error } = await supabase
        .from('n2_devices')
        .insert(deviceRecords);

      if (error) {
        logger.error('Failed to save N2 devices', { baselineId, deviceCount: devices.length, error });
        return false;
      }

      logger.info('N2 devices saved successfully', { baselineId, deviceCount: devices.length });
      return true;
    } catch (error) {
      logger.error('Error saving N2 devices', { baselineId, error });
      return false;
    }
  }

  /**
   * Save Modbus devices to database
   */
  async saveModbusDevices(baselineId: string, devices: ModbusDeviceData[]): Promise<boolean> {
    try {
      const deviceRecords = devices.map(device => ({
        baseline_id: baselineId,
        device_name: device.deviceName,
        slave_address: device.slaveAddress,
        register_address: device.registerAddress,
        register_count: device.registerCount,
        function_code: device.functionCode,
        data_type: device.dataType,
        description: device.description,
        unit_of_measure: device.unitOfMeasure,
        scaling_factor: device.scalingFactor,
        status: device.status?.[0] || 'unknown',
        is_active: device.isActive,
        last_read: device.lastRead
      }));

      const { error } = await supabase
        .from('modbus_devices')
        .insert(deviceRecords);

      if (error) {
        logger.error('Failed to save Modbus devices', { baselineId, deviceCount: devices.length, error });
        return false;
      }

      logger.info('Modbus devices saved successfully', { baselineId, deviceCount: devices.length });
      return true;
    } catch (error) {
      logger.error('Error saving Modbus devices', { baselineId, error });
      return false;
    }
  }

  /**
   * Save network stations to database
   */
  async saveNetworkStations(baselineId: string, stations: NetworkStationData[]): Promise<boolean> {
    try {
      const stationRecords = stations.map(station => ({
        baseline_id: baselineId,
        station_name: station.stationName,
        ip_address: station.ipAddress,
        fox_port: station.foxPort,
        host_model: station.hostModel,
        niagara_version: station.niagaraVersion,
        platform_version: station.platformVersion,
        connection_status: station.connectionStatus,
        platform_status: station.platformStatus,
        overall_status: station.overallStatus,
        secure_platform: station.securePlatform,
        platform_port: station.platformPort,
        credentials_store: station.credentialsStore,
        is_online: station.isOnline,
        is_reachable: station.isReachable,
        last_ping: station.lastPing
      }));

      const { error } = await supabase
        .from('network_stations')
        .insert(stationRecords);

      if (error) {
        logger.error('Failed to save network stations', { baselineId, stationCount: stations.length, error });
        return false;
      }

      logger.info('Network stations saved successfully', { baselineId, stationCount: stations.length });
      return true;
    } catch (error) {
      logger.error('Error saving network stations', { baselineId, error });
      return false;
    }
  }

  /**
   * Save system alerts to database
   */
  async saveSystemAlerts(baselineId: string, alerts: AlertData[]): Promise<boolean> {
    try {
      const alertRecords = alerts.map(alert => ({
        baseline_id: baselineId,
        alert_type: alert.alertType,
        metric_name: alert.metricName,
        severity: alert.severity,
        current_value: alert.currentValue,
        threshold_value: alert.thresholdValue,
        threshold_operator: alert.thresholdOperator,
        title: alert.title,
        description: alert.description,
        recommendation: alert.recommendation,
        entity_type: alert.entityType,
        entity_id: alert.entityId,
        entity_name: alert.entityName,
        is_active: alert.isActive !== false // Default to true if not specified
      }));

      const { error } = await supabase
        .from('system_alerts')
        .insert(alertRecords);

      if (error) {
        logger.error('Failed to save system alerts', { baselineId, alertCount: alerts.length, error });
        return false;
      }

      logger.info('System alerts saved successfully', { baselineId, alertCount: alerts.length });
      return true;
    } catch (error) {
      logger.error('Error saving system alerts', { baselineId, error });
      return false;
    }
  }

  /**
   * Save export file metadata to database
   */
  async saveExportFile(baselineId: string, fileData: ExportFileData): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tridium_export_files')
        .insert({
          baseline_id: baselineId,
          filename: fileData.filename,
          file_type: fileData.fileType,
          file_size: fileData.fileSize,
          file_hash: fileData.fileHash,
          parse_status: fileData.parseStatus,
          parse_errors: fileData.parseErrors || [],
          parse_warnings: fileData.parseWarnings || [],
          processing_time_ms: fileData.processingTimeMs,
          rows_parsed: fileData.rowsParsed || 0,
          rows_failed: fileData.rowsFailed || 0,
          data_confidence: fileData.dataConfidence || 100,
          raw_content: fileData.rawContent,
          parsed_data: fileData.parsedData || {},
          uploaded_by: fileData.uploadedBy
        });

      if (error) {
        logger.error('Failed to save export file metadata', { baselineId, filename: fileData.filename, error });
        return false;
      }

      logger.info('Export file metadata saved successfully', { baselineId, filename: fileData.filename });
      return true;
    } catch (error) {
      logger.error('Error saving export file metadata', { baselineId, error });
      return false;
    }
  }

  /**
   * Get system baseline by ID
   */
  async getSystemBaseline(baselineId: string) {
    try {
      const { data, error } = await supabase
        .from('system_baselines')
        .select(`
          *,
          platform_details(*),
          resource_utilization(*),
          bacnet_devices(*),
          n2_devices(*),
          modbus_devices(*),
          network_stations(*),
          system_alerts(*),
          tridium_export_files(*)
        `)
        .eq('id', baselineId)
        .single();

      if (error) {
        logger.error('Failed to get system baseline', { baselineId, error });
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error getting system baseline', { baselineId, error });
      return null;
    }
  }

  /**
   * Get system baselines for a project
   */
  async getSystemBaselinesForProject(projectId: string) {
    try {
      const { data, error } = await supabase
        .from('system_baselines')
        .select(`
          id,
          site_name,
          baseline_date,
          health_score,
          total_devices,
          total_points,
          niagara_version,
          system_architecture,
          data_confidence,
          created_at
        `)
        .eq('project_id', projectId)
        .order('baseline_date', { ascending: false });

      if (error) {
        logger.error('Failed to get system baselines for project', { projectId, error });
        return [];
      }

      return data;
    } catch (error) {
      logger.error('Error getting system baselines for project', { projectId, error });
      return [];
    }
  }

  /**
   * Delete system baseline and all related data
   */
  async deleteSystemBaseline(baselineId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('system_baselines')
        .delete()
        .eq('id', baselineId);

      if (error) {
        logger.error('Failed to delete system baseline', { baselineId, error });
        return false;
      }

      logger.info('System baseline deleted successfully', { baselineId });
      return true;
    } catch (error) {
      logger.error('Error deleting system baseline', { baselineId, error });
      return false;
    }
  }

  /**
   * Get reporting data for a system baseline
   */
  async getReportingData(baselineId: string) {
    try {
      // Get summary data
      const { data: baseline, error: baselineError } = await supabase
        .from('system_baselines')
        .select('*')
        .eq('id', baselineId)
        .single();

      if (baselineError) {
        logger.error('Failed to get baseline for reporting', { baselineId, error: baselineError });
        return null;
      }

      // Get device counts by type
      const [bacnetDevices, n2Devices, modbusDevices, networkStations, alerts] = await Promise.all([
        supabase.from('bacnet_devices').select('id, enabled, health').eq('baseline_id', baselineId),
        supabase.from('n2_devices').select('id, is_online, is_healthy').eq('baseline_id', baselineId),
        supabase.from('modbus_devices').select('id, is_active').eq('baseline_id', baselineId),
        supabase.from('network_stations').select('id, is_online, is_reachable').eq('baseline_id', baselineId),
        supabase.from('system_alerts').select('severity, is_active').eq('baseline_id', baselineId).eq('is_active', true)
      ]);

      const reportingData = {
        baseline,
        deviceCounts: {
          bacnet: {
            total: bacnetDevices.data?.length || 0,
            enabled: bacnetDevices.data?.filter(d => d.enabled).length || 0,
            healthy: bacnetDevices.data?.filter(d => d.health === 'healthy').length || 0
          },
          n2: {
            total: n2Devices.data?.length || 0,
            online: n2Devices.data?.filter(d => d.is_online).length || 0,
            healthy: n2Devices.data?.filter(d => d.is_healthy).length || 0
          },
          modbus: {
            total: modbusDevices.data?.length || 0,
            active: modbusDevices.data?.filter(d => d.is_active).length || 0
          },
          network: {
            total: networkStations.data?.length || 0,
            online: networkStations.data?.filter(d => d.is_online).length || 0,
            reachable: networkStations.data?.filter(d => d.is_reachable).length || 0
          }
        },
        alertCounts: {
          total: alerts.data?.length || 0,
          critical: alerts.data?.filter(a => a.severity === 'critical').length || 0,
          warning: alerts.data?.filter(a => a.severity === 'warning').length || 0,
          info: alerts.data?.filter(a => a.severity === 'info').length || 0
        }
      };

      return reportingData;
    } catch (error) {
      logger.error('Error getting reporting data', { baselineId, error });
      return null;
    }
  }
}

export const tridiumDatabaseService = new TridiumDatabaseService();