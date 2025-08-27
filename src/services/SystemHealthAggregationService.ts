import type { TridiumDataset, TridiumDataRow } from '@/types/tridium';
import type { 
  Site, Station, Device, StationMetrics, SiteHealthSummary, 
  StationHealthSummary, SystemAlert, DataIngestionJob 
} from '@/types/aggregation';
import { AggregationStorageService } from './AggregationStorageService';
import IntelligentAlertingService from './IntelligentAlertingService';

/**
 * SystemHealthAggregationService
 * 
 * Processes uploaded Tridium Niagara datasets and creates comprehensive 
 * health metrics, device summaries, and aggregated data for dashboards.
 * 
 * Key functions:
 * - Parse and organize data from multiple export formats
 * - Create hierarchical relationships (Site → Station → Device)  
 * - Generate health summaries and capacity metrics
 * - Detect alerts and anomalies
 * - Store aggregated data efficiently for fast dashboard queries
 */
export class SystemHealthAggregationService {

  // ============================================================================
  // Core Data Processing
  // ============================================================================

  /**
   * Process uploaded datasets and create comprehensive aggregated data
   */
  static async processUploadedDatasets(
    datasets: TridiumDataset[],
    siteId: string,
    visitId?: string
  ): Promise<DataIngestionJob> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const startTime = new Date().toISOString();

    const job: DataIngestionJob = {
      id: jobId,
      site_id: siteId,
      visit_id: visitId,
      job_type: 'manual_upload',
      status: 'processing',
      uploaded_files: datasets.map(d => ({
        filename: d.filename,
        file_type: this.getFileTypeFromFormat(d.format),
        format_detected: d.format,
        size_bytes: d.rows.length * 500, // Rough estimate
        processed: false
      })),
      stations_processed: 0,
      devices_processed: 0,
      metrics_processed: 0,
      errors: [],
      warnings: [],
      started_at: startTime,
      created_at: startTime
    };

    try {
      // Group datasets by station/source
      const stationGroups = this.groupDatasetsByStation(datasets);
      
      // Process each station group
      const processedData = {
        stations: [] as Station[],
        devices: [] as Device[],
        metrics: [] as StationMetrics[],
        alerts: [] as SystemAlert[]
      };

      for (const [stationName, stationDatasets] of stationGroups) {
        try {
          const stationData = await this.processStationDatasets(
            siteId, stationName, stationDatasets, visitId
          );
          
          processedData.stations.push(stationData.station);
          processedData.devices.push(...stationData.devices);
          if (stationData.metrics) {
            processedData.metrics.push(stationData.metrics);
          }
          processedData.alerts.push(...stationData.alerts);

          // Mark files as processed
          job.uploaded_files.forEach(file => {
            if (stationDatasets.some(ds => ds.filename === file.filename)) {
              file.processed = true;
            }
          });

        } catch (error) {
          job.errors.push(`Error processing station ${stationName}: ${error.message}`);
        }
      }

      // Store the processed data
      await this.storeProcessedData(processedData, siteId);

      // Generate health summaries
      const healthSummaries = await this.generateHealthSummaries(siteId, processedData);
      await this.storeHealthSummaries(healthSummaries);

      // Run intelligent alerting evaluation
      try {
        const intelligentAlerts = await IntelligentAlertingService.evaluateAlertsForSite(siteId);
        console.log(`Generated ${intelligentAlerts.length} intelligent alerts for site ${siteId}`);
      } catch (alertError) {
        console.error('Error in intelligent alerting:', alertError);
        job.warnings.push(`Intelligent alerting failed: ${alertError.message}`);
      }

      // Update job statistics
      job.stations_processed = processedData.stations.length;
      job.devices_processed = processedData.devices.length;
      job.metrics_processed = processedData.metrics.length;
      job.status = 'completed';
      job.completed_at = new Date().toISOString();
      job.processing_time_seconds = 
        Math.floor((new Date().getTime() - new Date(startTime).getTime()) / 1000);

      // Store the job record
      await this.storeIngestionJob(job);

      return job;

    } catch (error) {
      job.status = 'failed';
      job.errors.push(`Critical error: ${error.message}`);
      job.completed_at = new Date().toISOString();
      
      await this.storeIngestionJob(job);
      throw error;
    }
  }

  /**
   * Group datasets by their source station
   */
  private static groupDatasetsByStation(datasets: TridiumDataset[]): Map<string, TridiumDataset[]> {
    const groups = new Map<string, TridiumDataset[]>();

    for (const dataset of datasets) {
      let stationName = 'Unknown';

      // Extract station name from filename or data
      if (dataset.filename.includes('Supervisor')) {
        stationName = 'Supervisor';
      } else if (dataset.filename.includes('Jace')) {
        const match = dataset.filename.match(/Jace(\d+)/i);
        stationName = match ? `JACE${match[1]}` : 'JACE_Unknown';
      } else {
        // Try to extract from Niagara Network Export data
        if (dataset.format === 'NiagaraNetExport' && dataset.rows.length > 0) {
          stationName = 'Supervisor'; // Niagara Network exports come from Supervisor
        } else {
          // Use filename as fallback
          const baseName = dataset.filename.replace(/\.(csv|txt)$/i, '');
          stationName = baseName;
        }
      }

      if (!groups.has(stationName)) {
        groups.set(stationName, []);
      }
      groups.get(stationName)!.push(dataset);
    }

    return groups;
  }

  /**
   * Process all datasets for a single station
   */
  private static async processStationDatasets(
    siteId: string,
    stationName: string,
    datasets: TridiumDataset[],
    visitId?: string
  ) {
    const stationId = `${siteId}_${stationName}`;
    const timestamp = new Date().toISOString();

    // Initialize station record
    let station: Station = {
      id: stationId,
      site_id: siteId,
      name: stationName,
      station_type: this.determineStationType(stationName, datasets),
      client_connection: 'unknown',
      server_connection: 'unknown',
      platform_status: 'unknown',
      enabled: true,
      created_at: timestamp,
      updated_at: timestamp
    };

    const devices: Device[] = [];
    const alerts: SystemAlert[] = [];
    let stationMetrics: StationMetrics | null = null;

    // Process each dataset for this station
    for (const dataset of datasets) {
      switch (dataset.format) {
        case 'NiagaraNetExport':
          this.processNiagaraNetworkData(dataset, station, alerts);
          break;
          
        case 'ResourceExport':
          stationMetrics = this.processResourceData(dataset, station);
          break;
          
        case 'BACnetExport':
        case 'N2Export':
          const stationDevices = this.processDeviceData(dataset, station, alerts);
          devices.push(...stationDevices);
          break;
          
        case 'PlatformDetails':
          this.processPlatformData(dataset, station);
          break;
          
        default:
          console.warn(`Unknown format: ${dataset.format}`);
      }
    }

    // Generate alerts based on processed data
    const healthAlerts = this.generateStationHealthAlerts(station, devices, stationMetrics);
    alerts.push(...healthAlerts);

    return {
      station,
      devices,
      metrics: stationMetrics,
      alerts
    };
  }

  // ============================================================================  
  // Dataset Format Processors
  // ============================================================================

  /**
   * Process Niagara Network Export data (from Supervisor)
   */
  private static processNiagaraNetworkData(
    dataset: TridiumDataset, 
    baseStation: Station, 
    alerts: SystemAlert[]
  ): Station[] {
    const stations: Station[] = [];
    
    for (const row of dataset.rows) {
      const data = row.data;
      
      // Each row represents a station visible from the Supervisor
      const stationId = `${baseStation.site_id}_${data.Name}`;
      const station: Station = {
        id: stationId,
        site_id: baseStation.site_id,
        name: data.Name || 'Unknown',
        station_type: this.determineStationType(data.Name, []),
        
        // Network info
        ip_address: this.extractIPFromAddress(data.Address),
        fox_port: parseInt(data['Fox Port']) || undefined,
        platform_port: parseInt(data['Platform Port']) || undefined,
        
        // Hardware/Software
        host_model: data['Host Model'] || undefined,
        niagara_version: data.Version || undefined,
        host_model_version: data['Host Model Version'] || undefined,
        
        // Connection status
        client_connection: this.parseConnectionStatus(data['Client Conn']),
        server_connection: this.parseConnectionStatus(data['Server Conn']),
        platform_status: this.parsePlatformStatus(data['Platform Status']),
        
        enabled: data.Enabled === 'true',
        last_health_check: data.Health || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Generate alerts for connection issues
      if (station.platform_status === 'fault' || station.platform_status === 'down') {
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          site_id: baseStation.site_id,
          station_id: stationId,
          alert_type: 'critical',
          category: 'connectivity',
          title: `Station Platform Issue: ${station.name}`,
          description: `Platform status is ${station.platform_status}`,
          status: 'active',
          severity_score: 8,
          triggered_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }

      stations.push(station);
    }

    return stations;
  }

  /**
   * Process Resource Export data
   */
  private static processResourceData(dataset: TridiumDataset, station: Station): StationMetrics {
    const data = this.parseResourceExportData(dataset);
    
    const metrics: StationMetrics = {
      id: `metrics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      station_id: station.id,
      timestamp: new Date().toISOString(),
      
      // Performance metrics
      cpu_usage_percent: data.cpuUsage,
      memory_used_mb: data.memoryUsedMB,
      memory_total_mb: data.memoryTotalMB,
      heap_used_mb: data.heapUsedMB,
      heap_max_mb: data.heapMaxMB,
      
      // Capacity metrics  
      device_count: data.deviceCount,
      device_limit: data.deviceLimit,
      point_count: data.pointCount,
      point_limit: data.pointLimit,
      history_count: data.historyCount,
      network_count: data.networkCount,
      
      // Engine performance
      engine_scan_usage_percent: data.engineScanUsage,
      engine_scan_recent_ms: data.engineScanRecent,
      engine_scan_peak_ms: data.engineScanPeak,
      
      // System status
      uptime_hours: data.uptimeHours,
      file_descriptors_used: data.fdUsed,
      file_descriptors_max: data.fdMax,
      
      created_at: new Date().toISOString()
    };

    return metrics;
  }

  /**
   * Process device data (BACnet, N2, etc.)
   */
  private static processDeviceData(
    dataset: TridiumDataset, 
    station: Station, 
    alerts: SystemAlert[]
  ): Device[] {
    const devices: Device[] = [];

    for (const row of dataset.rows) {
      const device: Device = {
        id: `${station.id}_${row.id}`,
        station_id: station.id,
        
        // Device identity
        name: row.data.Name || `Device_${row.id}`,
        device_type: row.data['Controller Type'] || row.data.Type || 'Unknown',
        protocol: this.determineProtocol(dataset.format),
        
        // Addressing
        address: row.data.Address || row.data['Device ID'] || undefined,
        network_id: row.data.Netwk || row.data.Network || undefined,
        mac_address: row.data['MAC Addr'] || undefined,
        
        // Device details (mainly from BACnet)
        vendor: row.data.Vendor || undefined,
        model: row.data.Model || undefined,
        firmware_version: row.data['Firmware Rev'] || undefined,
        app_software_version: row.data['App SW Version'] || undefined,
        protocol_revision: row.data['Protocol Rev'] || undefined,
        
        // Status
        status: this.parseDeviceStatus(row.parsedStatus?.status || 'unknown'),
        status_flags: this.parseStatusFlags(row.data.Status),
        enabled: row.data.Enabled === 'true' || row.data.Enabled === true,
        last_contact: row.data.Health || undefined,
        
        parsed_values: row.parsedValues,
        raw_data: row.data,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Generate alerts for device issues
      if (device.status === 'down' || device.status === 'alarm') {
        alerts.push({
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          site_id: station.site_id,
          station_id: station.id,
          device_id: device.id,
          alert_type: device.status === 'down' ? 'critical' : 'warning',
          category: 'device_health',
          title: `Device ${device.status}: ${device.name}`,
          description: `${device.protocol.toUpperCase()} device is ${device.status}`,
          status: 'active',
          severity_score: device.status === 'down' ? 9 : 6,
          triggered_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }

      devices.push(device);
    }

    return devices;
  }

  /**
   * Process Platform Details data
   */
  private static processPlatformData(dataset: TridiumDataset, station: Station): void {
    // Platform details are typically in text format, need to parse key-value pairs
    for (const row of dataset.rows) {
      const text = Object.values(row.data).join(' ').toLowerCase();
      
      // Extract key platform information
      if (text.includes('model:')) {
        const match = text.match(/model:\s*([^\s\n]+)/);
        if (match) station.host_model = match[1];
      }
      
      if (text.includes('product:')) {
        const match = text.match(/product:\s*([^\s\n]+)/);
        if (match) station.product = match[1];
      }
      
      if (text.includes('operating system:')) {
        const match = text.match(/operating system:\s*([^\n]+)/);
        if (match) station.operating_system = match[1].trim();
      }
    }
  }

  // ============================================================================
  // Health Analysis & Alert Generation
  // ============================================================================

  /**
   * Generate health alerts based on station data
   */
  private static generateStationHealthAlerts(
    station: Station,
    devices: Device[],
    metrics: StationMetrics | null
  ): SystemAlert[] {
    const alerts: SystemAlert[] = [];

    if (metrics) {
      // CPU usage alerts
      if (metrics.cpu_usage_percent && metrics.cpu_usage_percent > 80) {
        alerts.push({
          id: `alert_${Date.now()}_cpu_${station.id}`,
          site_id: station.site_id,
          station_id: station.id,
          alert_type: metrics.cpu_usage_percent > 90 ? 'critical' : 'warning',
          category: 'performance',
          title: 'High CPU Usage',
          description: `CPU usage is ${metrics.cpu_usage_percent}%`,
          status: 'active',
          severity_score: Math.min(10, Math.floor(metrics.cpu_usage_percent / 10)),
          metric_name: 'cpu_usage_percent',
          threshold_value: 80,
          actual_value: metrics.cpu_usage_percent,
          triggered_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        });
      }

      // Memory usage alerts
      if (metrics.heap_used_mb && metrics.heap_max_mb) {
        const memoryPercent = (metrics.heap_used_mb / metrics.heap_max_mb) * 100;
        if (memoryPercent > 85) {
          alerts.push({
            id: `alert_${Date.now()}_memory_${station.id}`,
            site_id: station.site_id,
            station_id: station.id,
            alert_type: memoryPercent > 95 ? 'critical' : 'warning',
            category: 'performance',
            title: 'High Memory Usage',
            description: `Memory usage is ${memoryPercent.toFixed(1)}%`,
            status: 'active',
            severity_score: Math.min(10, Math.floor(memoryPercent / 10)),
            metric_name: 'memory_usage_percent',
            threshold_value: 85,
            actual_value: memoryPercent,
            triggered_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
        }
      }

      // Capacity alerts
      if (metrics.device_count && metrics.device_limit) {
        const devicePercent = (metrics.device_count / metrics.device_limit) * 100;
        if (devicePercent > 90) {
          alerts.push({
            id: `alert_${Date.now()}_capacity_${station.id}`,
            site_id: station.site_id,
            station_id: station.id,
            alert_type: 'warning',
            category: 'capacity',
            title: 'Device Capacity Warning',
            description: `Device usage is ${devicePercent.toFixed(1)}% of limit`,
            status: 'active',
            severity_score: 7,
            triggered_at: new Date().toISOString(),
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // Multiple devices down alert
    const downDevices = devices.filter(d => d.status === 'down');
    if (downDevices.length > 3) {
      alerts.push({
        id: `alert_${Date.now()}_multi_down_${station.id}`,
        site_id: station.site_id,
        station_id: station.id,
        alert_type: 'critical',
        category: 'device_health',
        title: 'Multiple Devices Down',
        description: `${downDevices.length} devices are down`,
        status: 'active',
        severity_score: 9,
        triggered_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      });
    }

    return alerts;
  }

  /**
   * Generate comprehensive health summaries
   */
  private static async generateHealthSummaries(
    siteId: string,
    data: { stations: Station[], devices: Device[], metrics: StationMetrics[] }
  ) {
    const timestamp = new Date().toISOString();

    // Generate site-level summary
    const siteHealthSummary: SiteHealthSummary = {
      id: `site_health_${siteId}_${Date.now()}`,
      site_id: siteId,
      timestamp,
      
      // Station summary
      total_stations: data.stations.length,
      stations_online: data.stations.filter(s => 
        s.client_connection === 'connected' || s.server_connection === 'connected').length,
      stations_offline: data.stations.filter(s => 
        s.client_connection === 'not_connected' && s.server_connection === 'not_connected').length,
      stations_with_issues: data.stations.filter(s => 
        s.platform_status === 'fault' || s.platform_status === 'down').length,
      
      // Device summary
      total_devices: data.devices.length,
      devices_ok: data.devices.filter(d => d.status === 'ok').length,
      devices_down: data.devices.filter(d => d.status === 'down').length,
      devices_alarm: data.devices.filter(d => d.status === 'alarm').length,
      devices_unacked_alarm: data.devices.filter(d => d.status === 'unacked_alarm').length,
      devices_unknown: data.devices.filter(d => d.status === 'unknown').length,
      
      // Protocol breakdown
      protocol_counts: this.calculateProtocolCounts(data.devices),
      
      // Capacity summary
      avg_cpu_usage: this.calculateAverageMetric(data.metrics, 'cpu_usage_percent'),
      max_cpu_usage: this.calculateMaxMetric(data.metrics, 'cpu_usage_percent'),
      avg_memory_usage: this.calculateAverageMemoryUsage(data.metrics),
      total_point_count: data.metrics.reduce((sum, m) => sum + (m.point_count || 0), 0),
      total_device_count: data.metrics.reduce((sum, m) => sum + (m.device_count || 0), 0),
      
      // Version compliance  
      niagara_versions: this.calculateVersionCounts(data.stations),
      outdated_stations: this.countOutdatedStations(data.stations),
      
      // Alerts (would be populated from alert generation)
      critical_alerts: [],
      warning_alerts: [],
      
      created_at: timestamp
    };

    // Generate station-level summaries
    const stationHealthSummaries: StationHealthSummary[] = data.stations.map(station => {
      const stationDevices = data.devices.filter(d => d.station_id === station.id);
      const stationMetric = data.metrics.find(m => m.station_id === station.id);

      return {
        id: `station_health_${station.id}_${Date.now()}`,
        station_id: station.id,
        timestamp,
        
        overall_health: this.calculateOverallHealth(station, stationDevices, stationMetric),
        connection_status: this.calculateConnectionStatus(station),
        
        total_devices: stationDevices.length,
        devices_by_status: this.groupDevicesByStatus(stationDevices),
        devices_by_protocol: this.calculateProtocolCounts(stationDevices),
        
        cpu_usage_percent: stationMetric?.cpu_usage_percent || 0,
        memory_usage_percent: this.calculateMemoryUsagePercent(stationMetric),
        capacity_utilization: this.calculateCapacityUtilization(stationMetric),
        
        device_utilization: this.calculateDeviceUtilization(stationMetric),
        point_utilization: this.calculatePointUtilization(stationMetric),
        
        uptime_hours: stationMetric?.uptime_hours || 0,
        restarts_this_month: 0, // Would need historical data
        
        active_alarms: stationDevices.filter(d => 
          d.status === 'alarm' || d.status === 'unacked_alarm').length,
        devices_down: stationDevices.filter(d => d.status === 'down').length,
        critical_issues: [],
        warnings: [],
        
        created_at: timestamp
      };
    });

    return { siteHealthSummary, stationHealthSummaries };
  }

  // ============================================================================
  // Helper Functions & Utilities
  // ============================================================================

  private static getFileTypeFromFormat(format: string): string {
    return format.includes('Details') ? 'TXT' : 'CSV';
  }

  private static determineStationType(name: string, datasets: TridiumDataset[]): Station['station_type'] {
    if (name.toLowerCase().includes('supervisor')) return 'supervisor';
    if (name.toLowerCase().includes('jace')) return 'jace';
    if (name.toLowerCase().includes('workstation')) return 'workstation';
    return 'jace'; // Default assumption
  }

  private static extractIPFromAddress(address: string): string | undefined {
    if (!address) return undefined;
    const match = address.match(/ip:([0-9.]+)/);
    return match ? match[1] : address.replace('ip:', '');
  }

  private static parseConnectionStatus(status: string): Station['client_connection'] {
    if (!status) return 'unknown';
    if (status.toLowerCase().includes('connected')) return 'connected';
    if (status.toLowerCase().includes('not connected')) return 'not_connected';
    return 'unknown';
  }

  private static parsePlatformStatus(status: string): Station['platform_status'] {
    if (!status) return 'unknown';
    const lower = status.toLowerCase();
    if (lower.includes('ok')) return 'ok';
    if (lower.includes('down')) return 'down';
    if (lower.includes('fault')) return 'fault';
    if (lower.includes('alarm')) return 'alarm';
    return 'unknown';
  }

  private static determineProtocol(format: string): Device['protocol'] {
    if (format.includes('BACnet')) return 'bacnet';
    if (format.includes('N2')) return 'n2';
    if (format.includes('Modbus')) return 'modbus';
    if (format.includes('Niagara')) return 'niagara';
    return 'other';
  }

  private static parseDeviceStatus(status: string): Device['status'] {
    if (!status) return 'unknown';
    const lower = status.toLowerCase();
    if (lower.includes('ok')) return 'ok';
    if (lower.includes('down')) return 'down';
    if (lower.includes('unacked')) return 'unacked_alarm';
    if (lower.includes('alarm')) return 'alarm';
    if (lower.includes('fault')) return 'fault';
    return 'unknown';
  }

  private static parseStatusFlags(status: string): string[] {
    if (!status) return [];
    // Remove braces and split by comma
    return status.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
  }

  private static parseResourceExportData(dataset: TridiumDataset) {
    const data: Record<string, any> = {};
    
    for (const row of dataset.rows) {
      const name = row.data.Name;
      const value = row.data.Value;
      
      if (name && value !== undefined) {
        data[name] = value;
      }
    }

    return {
      cpuUsage: this.parsePercentage(data['cpu.usage']),
      memoryUsedMB: this.parseMB(data['mem.used']),
      memoryTotalMB: this.parseMB(data['mem.total']),
      heapUsedMB: this.parseMB(data['heap.used']),
      heapMaxMB: this.parseMB(data['heap.max']),
      deviceCount: this.parseCapacityValue(data['globalCapacity.devices']),
      deviceLimit: this.parseCapacityLimit(data['globalCapacity.devices']),
      pointCount: this.parseCapacityValue(data['globalCapacity.points']),
      pointLimit: this.parseCapacityLimit(data['globalCapacity.points']),
      historyCount: this.parseCapacityValue(data['globalCapacity.histories']),
      networkCount: this.parseCapacityValue(data['globalCapacity.networks']),
      engineScanUsage: this.parsePercentage(data['engine.scan.usage']),
      engineScanRecent: this.parseMS(data['engine.scan.recent']),
      engineScanPeak: this.parseMS(data['engine.scan.peak']),
      uptimeHours: this.parseUptime(data['time.uptime']),
      fdUsed: parseInt(data['fd.open']) || undefined,
      fdMax: parseInt(data['fd.max']) || undefined
    };
  }

  private static parsePercentage(value: string): number | undefined {
    if (!value) return undefined;
    const match = value.toString().match(/(\d+(?:\.\d+)?)%?/);
    return match ? parseFloat(match[1]) : undefined;
  }

  private static parseMB(value: string): number | undefined {
    if (!value) return undefined;
    const match = value.toString().match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*MB/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : undefined;
  }

  private static parseMS(value: string): number | undefined {
    if (!value) return undefined;
    const match = value.toString().match(/(\d+(?:\.\d+)?)\s*ms/);
    return match ? parseFloat(match[1]) : undefined;
  }

  private static parseCapacityValue(value: string): number {
    if (!value) return 0;
    const match = value.toString().match(/(\d+(?:,\d+)*)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  private static parseCapacityLimit(value: string): number | undefined {
    if (!value) return undefined;
    const match = value.toString().match(/Limit:\s*(\d+(?:,\d+)*)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : undefined;
  }

  private static parseUptime(value: string): number | undefined {
    if (!value) return undefined;
    // Parse "31 days, 19 hours, 42 minutes" format
    let hours = 0;
    
    const dayMatch = value.match(/(\d+)\s*days?/);
    if (dayMatch) hours += parseInt(dayMatch[1]) * 24;
    
    const hourMatch = value.match(/(\d+)\s*hours?/);
    if (hourMatch) hours += parseInt(hourMatch[1]);
    
    const minuteMatch = value.match(/(\d+)\s*minutes?/);
    if (minuteMatch) hours += parseInt(minuteMatch[1]) / 60;
    
    return hours > 0 ? hours : undefined;
  }

  // Health calculation helpers
  private static calculateProtocolCounts(devices: Device[]): Record<string, number> {
    const counts: Record<string, number> = {};
    devices.forEach(device => {
      counts[device.protocol] = (counts[device.protocol] || 0) + 1;
    });
    return counts;
  }

  private static calculateAverageMetric(metrics: StationMetrics[], field: keyof StationMetrics): number {
    const values = metrics.map(m => m[field] as number).filter(v => v !== undefined);
    return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
  }

  private static calculateMaxMetric(metrics: StationMetrics[], field: keyof StationMetrics): number {
    const values = metrics.map(m => m[field] as number).filter(v => v !== undefined);
    return values.length > 0 ? Math.max(...values) : 0;
  }

  private static calculateAverageMemoryUsage(metrics: StationMetrics[]): number {
    let totalPercent = 0;
    let count = 0;
    
    metrics.forEach(m => {
      if (m.memory_used_mb && m.memory_total_mb) {
        totalPercent += (m.memory_used_mb / m.memory_total_mb) * 100;
        count++;
      }
    });
    
    return count > 0 ? totalPercent / count : 0;
  }

  private static calculateVersionCounts(stations: Station[]): Record<string, number> {
    const counts: Record<string, number> = {};
    stations.forEach(station => {
      if (station.niagara_version) {
        counts[station.niagara_version] = (counts[station.niagara_version] || 0) + 1;
      }
    });
    return counts;
  }

  private static countOutdatedStations(stations: Station[]): number {
    return stations.filter(station => {
      if (!station.niagara_version) return false;
      // Consider anything before 4.10 as outdated
      const version = station.niagara_version;
      return version.startsWith('3.') || 
             (version.startsWith('4.') && parseFloat(version.split('.')[1]) < 10);
    }).length;
  }

  private static calculateOverallHealth(
    station: Station, 
    devices: Device[], 
    metrics: StationMetrics | null
  ): StationHealthSummary['overall_health'] {
    let score = 100;
    
    // Connection issues
    if (station.platform_status === 'down' || station.platform_status === 'fault') {
      return 'critical';
    }
    
    if (station.client_connection === 'not_connected' && station.server_connection === 'not_connected') {
      return 'offline';
    }
    
    // Device issues
    const downDevices = devices.filter(d => d.status === 'down').length;
    const totalDevices = devices.length;
    
    if (totalDevices > 0) {
      const downPercent = (downDevices / totalDevices) * 100;
      if (downPercent > 50) return 'critical';
      if (downPercent > 20) score -= 30;
      if (downPercent > 5) score -= 15;
    }
    
    // Performance issues
    if (metrics) {
      if (metrics.cpu_usage_percent && metrics.cpu_usage_percent > 90) score -= 40;
      else if (metrics.cpu_usage_percent && metrics.cpu_usage_percent > 80) score -= 20;
      
      if (metrics.heap_used_mb && metrics.heap_max_mb) {
        const memPercent = (metrics.heap_used_mb / metrics.heap_max_mb) * 100;
        if (memPercent > 95) score -= 40;
        else if (memPercent > 85) score -= 20;
      }
    }
    
    if (score < 60) return 'critical';
    if (score < 80) return 'warning';
    return 'healthy';
  }

  private static calculateConnectionStatus(station: Station): StationHealthSummary['connection_status'] {
    const clientConnected = station.client_connection === 'connected';
    const serverConnected = station.server_connection === 'connected';
    
    if (clientConnected && serverConnected) return 'connected';
    if (clientConnected || serverConnected) return 'partial';
    return 'disconnected';
  }

  private static groupDevicesByStatus(devices: Device[]): Record<string, number> {
    const counts: Record<string, number> = {};
    devices.forEach(device => {
      counts[device.status] = (counts[device.status] || 0) + 1;
    });
    return counts;
  }

  private static calculateMemoryUsagePercent(metrics: StationMetrics | null): number {
    if (!metrics || !metrics.memory_used_mb || !metrics.memory_total_mb) return 0;
    return (metrics.memory_used_mb / metrics.memory_total_mb) * 100;
  }

  private static calculateCapacityUtilization(metrics: StationMetrics | null): number {
    if (!metrics) return 0;
    
    let totalUtilization = 0;
    let factors = 0;
    
    if (metrics.device_count && metrics.device_limit) {
      totalUtilization += (metrics.device_count / metrics.device_limit) * 100;
      factors++;
    }
    
    if (metrics.point_count && metrics.point_limit) {
      totalUtilization += (metrics.point_count / metrics.point_limit) * 100;
      factors++;
    }
    
    return factors > 0 ? totalUtilization / factors : 0;
  }

  private static calculateDeviceUtilization(metrics: StationMetrics | null): number {
    if (!metrics || !metrics.device_count || !metrics.device_limit) return 0;
    return (metrics.device_count / metrics.device_limit) * 100;
  }

  private static calculatePointUtilization(metrics: StationMetrics | null): number {
    if (!metrics || !metrics.point_count || !metrics.point_limit) return 0;
    return (metrics.point_count / metrics.point_limit) * 100;
  }

  // ============================================================================
  // Storage Operations
  // ============================================================================

  private static async storeProcessedData(
    data: { stations: Station[], devices: Device[], metrics: StationMetrics[], alerts: SystemAlert[] }, 
    siteId: string
  ): Promise<void> {
    // Store all processed data using AggregationStorageService
    if (data.stations.length > 0) {
      await AggregationStorageService.storeStations(data.stations);
    }
    
    if (data.devices.length > 0) {
      await AggregationStorageService.storeDevices(data.devices);
    }
    
    if (data.metrics.length > 0) {
      await AggregationStorageService.storeStationMetrics(data.metrics);
    }
    
    if (data.alerts.length > 0) {
      await AggregationStorageService.storeSystemAlerts(data.alerts);
    }
  }

  private static async storeHealthSummaries(
    summaries: { siteHealthSummary: SiteHealthSummary, stationHealthSummaries: StationHealthSummary[] }
  ): Promise<void> {
    await AggregationStorageService.storeHealthSummaries(
      summaries.siteHealthSummary,
      summaries.stationHealthSummaries
    );
  }

  private static async storeIngestionJob(job: DataIngestionJob): Promise<void> {
    await AggregationStorageService.storeIngestionJob(job);
  }
}
