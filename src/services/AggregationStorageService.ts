import type {
  Site, Station, Device, StationMetrics, DeviceStatusHistory,
  SiteHealthSummary, StationHealthSummary, SystemAlert,
  AlertThreshold, DataIngestionJob, SystemTrend,
  HealthDashboardQuery, DATABASE_SCHEMA
} from '@/types/aggregation';

/**
 * AggregationStorageService
 * 
 * Handles storage and retrieval of aggregated Tridium Niagara data.
 * Currently uses localStorage with JSON serialization, but designed to be 
 * easily replaceable with a proper database (PostgreSQL, TimescaleDB, etc.)
 * 
 * Key features:
 * - Hierarchical data storage (Site → Station → Device)
 * - Time-series metrics storage
 * - Efficient querying with indexing simulation
 * - Health summary caching
 * - Alert management
 */
export class AggregationStorageService {
  
  // Storage keys for different data types
  private static readonly STORAGE_KEYS = {
    sites: 'aggregation_sites',
    stations: 'aggregation_stations',
    devices: 'aggregation_devices',
    station_metrics: 'aggregation_station_metrics',
    device_status_history: 'aggregation_device_status_history',
    site_health_summaries: 'aggregation_site_health_summaries',
    station_health_summaries: 'aggregation_station_health_summaries',
    system_alerts: 'aggregation_system_alerts',
    alert_thresholds: 'aggregation_alert_thresholds',
    data_ingestion_jobs: 'aggregation_ingestion_jobs',
    system_trends: 'aggregation_system_trends',
    indexes: 'aggregation_indexes' // For simulating database indexes
  };

  // ============================================================================
  // Core CRUD Operations
  // ============================================================================

  /**
   * Store or update a site record
   */
  static async storeSite(site: Site): Promise<void> {
    const sites = this.loadFromStorage<Site[]>(this.STORAGE_KEYS.sites) || [];
    const existingIndex = sites.findIndex(s => s.id === site.id);
    
    if (existingIndex >= 0) {
      sites[existingIndex] = { ...site, updated_at: new Date().toISOString() };
    } else {
      sites.push(site);
    }
    
    this.saveToStorage(this.STORAGE_KEYS.sites, sites);
    this.updateIndex('sites', site.id, site);
  }

  /**
   * Store or update station records (bulk operation)
   */
  static async storeStations(stations: Station[]): Promise<void> {
    const existingStations = this.loadFromStorage<Station[]>(this.STORAGE_KEYS.stations) || [];
    const stationMap = new Map(existingStations.map(s => [s.id, s]));
    
    // Update or add new stations
    stations.forEach(station => {
      stationMap.set(station.id, { ...station, updated_at: new Date().toISOString() });
    });
    
    const updatedStations = Array.from(stationMap.values());
    this.saveToStorage(this.STORAGE_KEYS.stations, updatedStations);
    
    // Update indexes
    stations.forEach(station => {
      this.updateIndex('stations', station.id, station);
      this.updateIndex('stations_by_site', `${station.site_id}_${station.id}`, station);
    });
  }

  /**
   * Store or update device records (bulk operation)
   */
  static async storeDevices(devices: Device[]): Promise<void> {
    const existingDevices = this.loadFromStorage<Device[]>(this.STORAGE_KEYS.devices) || [];
    const deviceMap = new Map(existingDevices.map(d => [d.id, d]));
    
    devices.forEach(device => {
      deviceMap.set(device.id, { ...device, updated_at: new Date().toISOString() });
    });
    
    const updatedDevices = Array.from(deviceMap.values());
    this.saveToStorage(this.STORAGE_KEYS.devices, updatedDevices);
    
    // Update indexes
    devices.forEach(device => {
      this.updateIndex('devices', device.id, device);
      this.updateIndex('devices_by_station', `${device.station_id}_${device.id}`, device);
      this.updateIndex('devices_by_protocol', `${device.protocol}_${device.id}`, device);
      this.updateIndex('devices_by_status', `${device.status}_${device.id}`, device);
    });
  }

  /**
   * Store station metrics (time-series data)
   */
  static async storeStationMetrics(metrics: StationMetrics[]): Promise<void> {
    const existingMetrics = this.loadFromStorage<StationMetrics[]>(this.STORAGE_KEYS.station_metrics) || [];
    
    // Add new metrics (time-series data is append-only)
    const updatedMetrics = [...existingMetrics, ...metrics];
    
    // Keep only last 1000 records per station to prevent storage bloat
    const groupedByStation = this.groupBy(updatedMetrics, 'station_id');
    const prunedMetrics: StationMetrics[] = [];
    
    Object.values(groupedByStation).forEach(stationMetrics => {
      const sorted = stationMetrics.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      prunedMetrics.push(...sorted.slice(0, 1000));
    });
    
    this.saveToStorage(this.STORAGE_KEYS.station_metrics, prunedMetrics);
    
    // Update indexes
    metrics.forEach(metric => {
      this.updateIndex('metrics_by_station', `${metric.station_id}_${metric.timestamp}`, metric);
    });
  }

  /**
   * Store device status history
   */
  static async storeDeviceStatusHistory(history: DeviceStatusHistory[]): Promise<void> {
    const existingHistory = this.loadFromStorage<DeviceStatusHistory[]>(this.STORAGE_KEYS.device_status_history) || [];
    const updatedHistory = [...existingHistory, ...history];
    
    // Keep only last 500 records per device
    const groupedByDevice = this.groupBy(updatedHistory, 'device_id');
    const prunedHistory: DeviceStatusHistory[] = [];
    
    Object.values(groupedByDevice).forEach(deviceHistory => {
      const sorted = deviceHistory.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      prunedHistory.push(...sorted.slice(0, 500));
    });
    
    this.saveToStorage(this.STORAGE_KEYS.device_status_history, prunedHistory);
  }

  /**
   * Store health summaries
   */
  static async storeHealthSummaries(
    siteHealthSummary: SiteHealthSummary,
    stationHealthSummaries: StationHealthSummary[]
  ): Promise<void> {
    // Store site health summary
    const siteHealthSummaries = this.loadFromStorage<SiteHealthSummary[]>(this.STORAGE_KEYS.site_health_summaries) || [];
    
    // Keep only last 100 summaries per site
    const filteredSiteSummaries = siteHealthSummaries
      .filter(s => s.site_id !== siteHealthSummary.site_id)
      .concat([siteHealthSummary])
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 100);
    
    this.saveToStorage(this.STORAGE_KEYS.site_health_summaries, filteredSiteSummaries);
    
    // Store station health summaries
    const existingStationSummaries = this.loadFromStorage<StationHealthSummary[]>(this.STORAGE_KEYS.station_health_summaries) || [];
    const stationSummaryMap = new Map(existingStationSummaries.map(s => [s.station_id, s]));
    
    stationHealthSummaries.forEach(summary => {
      stationSummaryMap.set(summary.station_id, summary);
    });
    
    // Keep only latest summary per station + last 50 historical summaries
    const updatedStationSummaries = Array.from(stationSummaryMap.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 200);
    
    this.saveToStorage(this.STORAGE_KEYS.station_health_summaries, updatedStationSummaries);
    
    // Update indexes
    this.updateIndex('site_health_by_site', siteHealthSummary.site_id, siteHealthSummary);
    stationHealthSummaries.forEach(summary => {
      this.updateIndex('station_health_by_station', summary.station_id, summary);
    });
  }

  /**
   * Store system alerts
   */
  static async storeSystemAlerts(alerts: SystemAlert[]): Promise<void> {
    const existingAlerts = this.loadFromStorage<SystemAlert[]>(this.STORAGE_KEYS.system_alerts) || [];
    const updatedAlerts = [...existingAlerts, ...alerts];
    
    // Keep only last 1000 alerts
    const prunedAlerts = updatedAlerts
      .sort((a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime())
      .slice(0, 1000);
    
    this.saveToStorage(this.STORAGE_KEYS.system_alerts, prunedAlerts);
    
    // Update indexes
    alerts.forEach(alert => {
      this.updateIndex('alerts_by_status', `${alert.status}_${alert.id}`, alert);
      if (alert.site_id) {
        this.updateIndex('alerts_by_site', `${alert.site_id}_${alert.id}`, alert);
      }
      if (alert.station_id) {
        this.updateIndex('alerts_by_station', `${alert.station_id}_${alert.id}`, alert);
      }
    });
  }

  /**
   * Store data ingestion job
   */
  static async storeIngestionJob(job: DataIngestionJob): Promise<void> {
    const jobs = this.loadFromStorage<DataIngestionJob[]>(this.STORAGE_KEYS.data_ingestion_jobs) || [];
    const existingIndex = jobs.findIndex(j => j.id === job.id);
    
    if (existingIndex >= 0) {
      jobs[existingIndex] = job;
    } else {
      jobs.push(job);
    }
    
    // Keep only last 100 jobs
    const prunedJobs = jobs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 100);
    
    this.saveToStorage(this.STORAGE_KEYS.data_ingestion_jobs, prunedJobs);
  }

  // ============================================================================
  // Query Operations
  // ============================================================================

  /**
   * Get all sites
   */
  static async getSites(): Promise<Site[]> {
    return this.loadFromStorage<Site[]>(this.STORAGE_KEYS.sites) || [];
  }

  /**
   * Get site by ID
   */
  static async getSiteById(siteId: string): Promise<Site | null> {
    const sites = await this.getSites();
    return sites.find(s => s.id === siteId) || null;
  }

  /**
   * Get stations by site ID
   */
  static async getStationsBySite(siteId: string): Promise<Station[]> {
    const stations = this.loadFromStorage<Station[]>(this.STORAGE_KEYS.stations) || [];
    return stations.filter(s => s.site_id === siteId);
  }

  /**
   * Get station by ID
   */
  static async getStationById(stationId: string): Promise<Station | null> {
    const stations = this.loadFromStorage<Station[]>(this.STORAGE_KEYS.stations) || [];
    return stations.find(s => s.id === stationId) || null;
  }

  /**
   * Get devices by station ID
   */
  static async getDevicesByStation(stationId: string): Promise<Device[]> {
    const devices = this.loadFromStorage<Device[]>(this.STORAGE_KEYS.devices) || [];
    return devices.filter(d => d.station_id === stationId);
  }

  /**
   * Get devices by site ID (across all stations)
   */
  static async getDevicesBySite(siteId: string): Promise<Device[]> {
    const stations = await this.getStationsBySite(siteId);
    const stationIds = stations.map(s => s.id);
    const devices = this.loadFromStorage<Device[]>(this.STORAGE_KEYS.devices) || [];
    
    return devices.filter(d => stationIds.includes(d.station_id));
  }

  /**
   * Get devices by status
   */
  static async getDevicesByStatus(status: Device['status']): Promise<Device[]> {
    const devices = this.loadFromStorage<Device[]>(this.STORAGE_KEYS.devices) || [];
    return devices.filter(d => d.status === status);
  }

  /**
   * Get latest station metrics for a station
   */
  static async getLatestStationMetrics(stationId: string): Promise<StationMetrics | null> {
    const metrics = this.loadFromStorage<StationMetrics[]>(this.STORAGE_KEYS.station_metrics) || [];
    const stationMetrics = metrics
      .filter(m => m.station_id === stationId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return stationMetrics[0] || null;
  }

  /**
   * Get station metrics within a time range
   */
  static async getStationMetricsInRange(
    stationId: string,
    startTime: string,
    endTime: string
  ): Promise<StationMetrics[]> {
    const metrics = this.loadFromStorage<StationMetrics[]>(this.STORAGE_KEYS.station_metrics) || [];
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    
    return metrics.filter(m => {
      if (m.station_id !== stationId) return false;
      const timestamp = new Date(m.timestamp).getTime();
      return timestamp >= start && timestamp <= end;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Get latest site health summary
   */
  static async getLatestSiteHealthSummary(siteId: string): Promise<SiteHealthSummary | null> {
    const summaries = this.loadFromStorage<SiteHealthSummary[]>(this.STORAGE_KEYS.site_health_summaries) || [];
    const siteSummaries = summaries
      .filter(s => s.site_id === siteId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return siteSummaries[0] || null;
  }

  /**
   * Get latest station health summaries for a site
   */
  static async getStationHealthSummariesBySite(siteId: string): Promise<StationHealthSummary[]> {
    const stations = await this.getStationsBySite(siteId);
    const stationIds = stations.map(s => s.id);
    const summaries = this.loadFromStorage<StationHealthSummary[]>(this.STORAGE_KEYS.station_health_summaries) || [];
    
    // Get latest summary for each station
    const latestSummaries = new Map<string, StationHealthSummary>();
    
    summaries
      .filter(s => stationIds.includes(s.station_id))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .forEach(summary => {
        if (!latestSummaries.has(summary.station_id)) {
          latestSummaries.set(summary.station_id, summary);
        }
      });
    
    return Array.from(latestSummaries.values());
  }

  /**
   * Get active system alerts
   */
  static async getActiveAlerts(siteId?: string, stationId?: string): Promise<SystemAlert[]> {
    const alerts = this.loadFromStorage<SystemAlert[]>(this.STORAGE_KEYS.system_alerts) || [];
    
    return alerts.filter(alert => {
      if (alert.status !== 'active') return false;
      if (siteId && alert.site_id !== siteId) return false;
      if (stationId && alert.station_id !== stationId) return false;
      return true;
    }).sort((a, b) => b.severity_score - a.severity_score);
  }

  /**
   * Get recent data ingestion jobs
   */
  static async getRecentIngestionJobs(limit: number = 10): Promise<DataIngestionJob[]> {
    const jobs = this.loadFromStorage<DataIngestionJob[]>(this.STORAGE_KEYS.data_ingestion_jobs) || [];
    return jobs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  // ============================================================================
  // Dashboard Query Operations
  // ============================================================================

  /**
   * Execute a comprehensive health dashboard query
   */
  static async executeHealthDashboardQuery(query: HealthDashboardQuery) {
    const result = {
      sites: [] as Site[],
      stations: [] as Station[],
      devices: [] as Device[],
      siteHealthSummaries: [] as SiteHealthSummary[],
      stationHealthSummaries: [] as StationHealthSummary[],
      alerts: [] as SystemAlert[],
      metrics: [] as StationMetrics[]
    };

    // Get base data
    if (query.site_ids) {
      for (const siteId of query.site_ids) {
        const site = await this.getSiteById(siteId);
        if (site) result.sites.push(site);
        
        const stations = await this.getStationsBySite(siteId);
        result.stations.push(...stations);
        
        const devices = await this.getDevicesBySite(siteId);
        result.devices.push(...devices);
        
        if (query.include_alerts) {
          const alerts = await this.getActiveAlerts(siteId);
          result.alerts.push(...alerts);
        }
      }
    }

    if (query.station_ids) {
      for (const stationId of query.station_ids) {
        const station = await this.getStationById(stationId);
        if (station) {
          result.stations.push(station);
          
          const devices = await this.getDevicesByStation(stationId);
          result.devices.push(...devices);
          
          if (query.include_alerts) {
            const alerts = await this.getActiveAlerts(undefined, stationId);
            result.alerts.push(...alerts);
          }
          
          // Get metrics if requested
          if (query.metrics.includes('station_metrics')) {
            const metrics = await this.getStationMetricsInRange(
              stationId,
              query.time_range.start,
              query.time_range.end
            );
            result.metrics.push(...metrics);
          }
        }
      }
    }

    // Get health summaries
    for (const site of result.sites) {
      const siteHealthSummary = await this.getLatestSiteHealthSummary(site.id);
      if (siteHealthSummary) result.siteHealthSummaries.push(siteHealthSummary);
      
      const stationHealthSummaries = await this.getStationHealthSummariesBySite(site.id);
      result.stationHealthSummaries.push(...stationHealthSummaries);
    }

    return result;
  }

  /**
   * Get aggregated statistics for a site
   */
  static async getSiteAggregatedStats(siteId: string) {
    const stations = await this.getStationsBySite(siteId);
    const devices = await this.getDevicesBySite(siteId);
    const alerts = await this.getActiveAlerts(siteId);
    
    // Protocol breakdown
    const protocolCounts: Record<string, number> = {};
    devices.forEach(device => {
      protocolCounts[device.protocol] = (protocolCounts[device.protocol] || 0) + 1;
    });
    
    // Status breakdown
    const deviceStatusCounts: Record<string, number> = {};
    devices.forEach(device => {
      deviceStatusCounts[device.status] = (deviceStatusCounts[device.status] || 0) + 1;
    });
    
    // Station status breakdown
    const stationStatusCounts = {
      online: stations.filter(s => s.client_connection === 'connected' || s.server_connection === 'connected').length,
      offline: stations.filter(s => s.client_connection === 'not_connected' && s.server_connection === 'not_connected').length,
      partial: stations.filter(s => 
        (s.client_connection === 'connected' && s.server_connection === 'not_connected') ||
        (s.client_connection === 'not_connected' && s.server_connection === 'connected')
      ).length
    };
    
    // Version breakdown
    const versionCounts: Record<string, number> = {};
    stations.forEach(station => {
      if (station.niagara_version) {
        versionCounts[station.niagara_version] = (versionCounts[station.niagara_version] || 0) + 1;
      }
    });
    
    // Alert severity breakdown
    const alertSeverityCounts: Record<string, number> = {};
    alerts.forEach(alert => {
      alertSeverityCounts[alert.alert_type] = (alertSeverityCounts[alert.alert_type] || 0) + 1;
    });

    return {
      totalStations: stations.length,
      totalDevices: devices.length,
      totalAlerts: alerts.length,
      protocolCounts,
      deviceStatusCounts,
      stationStatusCounts,
      versionCounts,
      alertSeverityCounts,
      lastUpdated: new Date().toISOString()
    };
  }

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Load data from localStorage with error handling
   */
  private static loadFromStorage<T>(key: string): T | null {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error loading data from storage key ${key}:`, error);
      return null;
    }
  }

  /**
   * Save data to localStorage with error handling
   */
  private static saveToStorage(key: string, data: any): void {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error saving data to storage key ${key}:`, error);
      // If localStorage is full, try to clear old data
      this.cleanupOldData();
    }
  }

  /**
   * Update index for efficient querying
   */
  private static updateIndex(indexName: string, key: string, data: any): void {
    try {
      const indexes = this.loadFromStorage<Record<string, Record<string, any>>>(this.STORAGE_KEYS.indexes) || {};
      
      if (!indexes[indexName]) {
        indexes[indexName] = {};
      }
      
      indexes[indexName][key] = {
        id: data.id,
        timestamp: data.timestamp || data.updated_at || data.created_at || new Date().toISOString()
      };
      
      this.saveToStorage(this.STORAGE_KEYS.indexes, indexes);
    } catch (error) {
      console.error(`Error updating index ${indexName}:`, error);
    }
  }

  /**
   * Group array by a property
   */
  private static groupBy<T>(array: T[], property: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const key = String(item[property]);
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Clean up old data to free storage space
   */
  private static cleanupOldData(): void {
    try {
      // Remove old metrics (keep only last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const metrics = this.loadFromStorage<StationMetrics[]>(this.STORAGE_KEYS.station_metrics) || [];
      const filteredMetrics = metrics.filter(m => 
        new Date(m.timestamp).getTime() > thirtyDaysAgo.getTime()
      );
      this.saveToStorage(this.STORAGE_KEYS.station_metrics, filteredMetrics);
      
      // Remove old alerts (keep only last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const alerts = this.loadFromStorage<SystemAlert[]>(this.STORAGE_KEYS.system_alerts) || [];
      const filteredAlerts = alerts.filter(a => 
        new Date(a.triggered_at).getTime() > sevenDaysAgo.getTime()
      );
      this.saveToStorage(this.STORAGE_KEYS.system_alerts, filteredAlerts);
      
      console.log('Cleaned up old aggregation data');
    } catch (error) {
      console.error('Error cleaning up old data:', error);
    }
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats() {
    const stats: Record<string, number> = {};
    
    Object.entries(this.STORAGE_KEYS).forEach(([name, key]) => {
      try {
        const data = localStorage.getItem(key);
        stats[name] = data ? JSON.stringify(data).length : 0;
      } catch {
        stats[name] = 0;
      }
    });
    
    const total = Object.values(stats).reduce((sum, size) => sum + size, 0);
    
    return {
      individual: stats,
      total,
      totalMB: (total / (1024 * 1024)).toFixed(2)
    };
  }

  /**
   * Clear all aggregation data (for testing/reset)
   */
  static async clearAllData(): Promise<void> {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // ============================================================================
  // Migration and Maintenance
  // ============================================================================

  /**
   * Initialize default alert thresholds
   */
  static async initializeDefaultThresholds(): Promise<void> {
    const existingThresholds = this.loadFromStorage<AlertThreshold[]>(this.STORAGE_KEYS.alert_thresholds) || [];
    
    if (existingThresholds.length === 0) {
      const defaultThresholds: AlertThreshold[] = [
        {
          id: 'cpu_warning',
          name: 'CPU Usage Warning',
          metric_type: 'cpu_usage_percent',
          entity_type: 'station',
          warning_threshold: 80,
          critical_threshold: 90,
          operator: '>',
          duration_minutes: 5,
          enabled: true,
          notify_email: false,
          notify_dashboard: true,
          suppress_similar_minutes: 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'memory_warning',
          name: 'Memory Usage Warning',
          metric_type: 'memory_usage_percent',
          entity_type: 'station',
          warning_threshold: 85,
          critical_threshold: 95,
          operator: '>',
          duration_minutes: 5,
          enabled: true,
          notify_email: false,
          notify_dashboard: true,
          suppress_similar_minutes: 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 'device_capacity_warning',
          name: 'Device Capacity Warning',
          metric_type: 'device_utilization',
          entity_type: 'station',
          warning_threshold: 90,
          operator: '>',
          duration_minutes: 0,
          enabled: true,
          notify_email: false,
          notify_dashboard: true,
          suppress_similar_minutes: 1440, // 24 hours
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      this.saveToStorage(this.STORAGE_KEYS.alert_thresholds, defaultThresholds);
    }
  }
}

// Initialize default thresholds on module load
AggregationStorageService.initializeDefaultThresholds();
