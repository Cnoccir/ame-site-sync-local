import { AggregationStorageService } from './AggregationStorageService';
import type { 
  Station, 
  StationHealthSummary, 
  SiteHealthSummary, 
  SystemAlert,
  Device 
} from '@/types/aggregation';

export interface AlertThreshold {
  id: string;
  name: string;
  description: string;
  metric_type: 'cpu' | 'memory' | 'disk' | 'device_health' | 'version_compliance' | 'capacity' | 'uptime';
  threshold_type: 'greater_than' | 'less_than' | 'equals' | 'percentage_down';
  warning_threshold: number;
  critical_threshold: number;
  enabled: boolean;
  scope: 'station' | 'site' | 'device';
  aggregation_window?: string; // e.g., '5m', '15m', '1h'
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  conditions: AlertCondition[];
  alert_type: 'critical' | 'warning' | 'info';
  severity_score: number;
  enabled: boolean;
  cooldown_minutes: number; // Prevent alert spam
  requires_acknowledgment: boolean;
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'in' | 'contains';
  value: number | string | string[];
  aggregation?: 'avg' | 'max' | 'min' | 'count' | 'sum';
  time_window?: string;
}

export interface AlertContext {
  station_id?: string;
  site_id: string;
  device_id?: string;
  metric_name: string;
  current_value: number | string;
  threshold_value: number | string;
  timestamp: Date;
  additional_data?: Record<string, any>;
}

class IntelligentAlertingService {
  private static instance: IntelligentAlertingService;
  private alertRules: AlertRule[] = [];
  private thresholds: AlertThreshold[] = [];
  private alertHistory: Map<string, Date> = new Map(); // For cooldown management

  private constructor() {
    this.initializeDefaultThresholds();
    this.initializeDefaultAlertRules();
  }

  static getInstance(): IntelligentAlertingService {
    if (!IntelligentAlertingService.instance) {
      IntelligentAlertingService.instance = new IntelligentAlertingService();
    }
    return IntelligentAlertingService.instance;
  }

  // Initialize default system thresholds
  private initializeDefaultThresholds(): void {
    this.thresholds = [
      {
        id: 'cpu_usage',
        name: 'CPU Usage',
        description: 'Monitor CPU utilization levels',
        metric_type: 'cpu',
        threshold_type: 'greater_than',
        warning_threshold: 70,
        critical_threshold: 90,
        enabled: true,
        scope: 'station'
      },
      {
        id: 'memory_usage',
        name: 'Memory Usage',
        description: 'Monitor memory utilization levels',
        metric_type: 'memory',
        threshold_type: 'greater_than',
        warning_threshold: 80,
        critical_threshold: 95,
        enabled: true,
        scope: 'station'
      },
      {
        id: 'device_health',
        name: 'Device Health',
        description: 'Monitor percentage of devices down',
        metric_type: 'device_health',
        threshold_type: 'percentage_down',
        warning_threshold: 5,
        critical_threshold: 15,
        enabled: true,
        scope: 'station'
      },
      {
        id: 'version_compliance',
        name: 'Version Compliance',
        description: 'Monitor outdated Niagara versions',
        metric_type: 'version_compliance',
        threshold_type: 'greater_than',
        warning_threshold: 1,
        critical_threshold: 5,
        enabled: true,
        scope: 'site'
      },
      {
        id: 'capacity_warning',
        name: 'Capacity Warning',
        description: 'Monitor system capacity limits',
        metric_type: 'capacity',
        threshold_type: 'greater_than',
        warning_threshold: 80,
        critical_threshold: 95,
        enabled: true,
        scope: 'station'
      },
      {
        id: 'uptime_monitoring',
        name: 'Uptime Monitoring',
        description: 'Monitor station uptime',
        metric_type: 'uptime',
        threshold_type: 'less_than',
        warning_threshold: 24, // Less than 24 hours
        critical_threshold: 1,  // Less than 1 hour
        enabled: true,
        scope: 'station'
      }
    ];
  }

  // Initialize default alert rules
  private initializeDefaultAlertRules(): void {
    this.alertRules = [
      {
        id: 'high_cpu_usage',
        name: 'High CPU Usage',
        description: 'Station CPU usage is critically high',
        conditions: [
          {
            metric: 'cpu_usage_percent',
            operator: 'gte',
            value: 90,
            aggregation: 'avg',
            time_window: '5m'
          }
        ],
        alert_type: 'critical',
        severity_score: 8,
        enabled: true,
        cooldown_minutes: 15,
        requires_acknowledgment: true
      },
      {
        id: 'high_memory_usage',
        name: 'High Memory Usage',
        description: 'Station memory usage is critically high',
        conditions: [
          {
            metric: 'memory_usage_percent',
            operator: 'gte',
            value: 95
          }
        ],
        alert_type: 'critical',
        severity_score: 7,
        enabled: true,
        cooldown_minutes: 15,
        requires_acknowledgment: true
      },
      {
        id: 'multiple_devices_down',
        name: 'Multiple Devices Down',
        description: 'Multiple devices are offline on a station',
        conditions: [
          {
            metric: 'devices_down',
            operator: 'gte',
            value: 5
          }
        ],
        alert_type: 'critical',
        severity_score: 9,
        enabled: true,
        cooldown_minutes: 10,
        requires_acknowledgment: true
      },
      {
        id: 'outdated_niagara_version',
        name: 'Outdated Niagara Version',
        description: 'Station running outdated Niagara version',
        conditions: [
          {
            metric: 'niagara_version',
            operator: 'contains',
            value: '3.'
          }
        ],
        alert_type: 'warning',
        severity_score: 4,
        enabled: true,
        cooldown_minutes: 1440, // 24 hours
        requires_acknowledgment: false
      },
      {
        id: 'station_offline',
        name: 'Station Offline',
        description: 'Station is not responding',
        conditions: [
          {
            metric: 'connection_status',
            operator: 'eq',
            value: 'disconnected'
          }
        ],
        alert_type: 'critical',
        severity_score: 10,
        enabled: true,
        cooldown_minutes: 5,
        requires_acknowledgment: true
      },
      {
        id: 'low_uptime',
        name: 'Low Uptime',
        description: 'Station has been recently restarted',
        conditions: [
          {
            metric: 'uptime_hours',
            operator: 'lt',
            value: 1
          }
        ],
        alert_type: 'info',
        severity_score: 3,
        enabled: true,
        cooldown_minutes: 60,
        requires_acknowledgment: false
      },
      {
        id: 'protocol_device_failures',
        name: 'Protocol Device Failures',
        description: 'High percentage of protocol devices failing',
        conditions: [
          {
            metric: 'device_failure_rate',
            operator: 'gte',
            value: 0.20 // 20% failure rate
          }
        ],
        alert_type: 'warning',
        severity_score: 6,
        enabled: true,
        cooldown_minutes: 30,
        requires_acknowledgment: false
      }
    ];
  }

  // Main method to evaluate all alerts for a site
  async evaluateAlertsForSite(siteId: string): Promise<SystemAlert[]> {
    try {
      const [
        siteHealthSummary,
        stationHealthSummaries,
        stations,
        devices
      ] = await Promise.all([
        AggregationStorageService.getLatestSiteHealthSummary(siteId),
        AggregationStorageService.getStationHealthSummariesBySite(siteId),
        AggregationStorageService.getStationsBySite(siteId),
        AggregationStorageService.getDevicesBySite(siteId)
      ]);

      const alerts: SystemAlert[] = [];

      if (!siteHealthSummary) {
        console.warn(`No site health summary found for site: ${siteId}`);
        return alerts;
      }

      // Evaluate site-level alerts
      const siteAlerts = await this.evaluateSiteAlerts(siteHealthSummary, siteId);
      alerts.push(...siteAlerts);

      // Evaluate station-level alerts
      for (const stationSummary of stationHealthSummaries) {
        const stationAlerts = await this.evaluateStationAlerts(stationSummary, stations, siteId);
        alerts.push(...stationAlerts);
      }

      // Evaluate device-level alerts if needed
      const deviceAlerts = await this.evaluateDeviceAlerts(devices, siteId);
      alerts.push(...deviceAlerts);

      // Store alerts in the storage service
      for (const alert of alerts) {
        await AggregationStorageService.storeSystemAlert(alert);
      }

      return alerts;
    } catch (error) {
      console.error('Error evaluating alerts:', error);
      return [];
    }
  }

  // Evaluate site-level alerts
  private async evaluateSiteAlerts(
    siteHealthSummary: SiteHealthSummary, 
    siteId: string
  ): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    // Check for outdated versions
    if (siteHealthSummary.outdated_stations > 0) {
      const threshold = this.thresholds.find(t => t.id === 'version_compliance');
      if (threshold && siteHealthSummary.outdated_stations >= threshold.warning_threshold) {
        const alertType = siteHealthSummary.outdated_stations >= threshold.critical_threshold 
          ? 'critical' : 'warning';
        
        const alert = this.createAlert({
          rule_id: 'outdated_niagara_version',
          title: 'Outdated Niagara Versions Detected',
          description: `${siteHealthSummary.outdated_stations} stations running outdated Niagara versions`,
          alert_type: alertType,
          severity_score: alertType === 'critical' ? 7 : 4,
          context: {
            site_id: siteId,
            metric_name: 'outdated_stations',
            current_value: siteHealthSummary.outdated_stations,
            threshold_value: threshold.warning_threshold,
            timestamp: new Date(),
            additional_data: { versions: siteHealthSummary.niagara_versions }
          }
        });

        alerts.push(alert);
      }
    }

    // Check for site-wide device failures
    const deviceFailureRate = siteHealthSummary.total_devices > 0 
      ? siteHealthSummary.devices_down / siteHealthSummary.total_devices 
      : 0;

    if (deviceFailureRate > 0.1) { // 10% failure rate
      const alert = this.createAlert({
        rule_id: 'site_device_failures',
        title: 'Site-wide Device Failures',
        description: `${(deviceFailureRate * 100).toFixed(1)}% of devices are down across the site`,
        alert_type: deviceFailureRate > 0.25 ? 'critical' : 'warning',
        severity_score: deviceFailureRate > 0.25 ? 9 : 6,
        context: {
          site_id: siteId,
          metric_name: 'device_failure_rate',
          current_value: deviceFailureRate,
          threshold_value: 0.1,
          timestamp: new Date(),
          additional_data: { 
            devices_down: siteHealthSummary.devices_down,
            total_devices: siteHealthSummary.total_devices
          }
        }
      });

      alerts.push(alert);
    }

    return alerts;
  }

  // Evaluate station-level alerts
  private async evaluateStationAlerts(
    stationSummary: StationHealthSummary,
    stations: Station[],
    siteId: string
  ): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];
    const station = stations.find(s => s.id === stationSummary.station_id);

    if (!station) return alerts;

    // CPU Usage Alert
    const cpuThreshold = this.thresholds.find(t => t.id === 'cpu_usage');
    if (cpuThreshold && stationSummary.cpu_usage_percent >= cpuThreshold.warning_threshold) {
      const alertType = stationSummary.cpu_usage_percent >= cpuThreshold.critical_threshold 
        ? 'critical' : 'warning';
      
      const ruleKey = `${stationSummary.station_id}_cpu_usage`;
      if (this.shouldCreateAlert(ruleKey, cpuThreshold.id)) {
        const alert = this.createAlert({
          rule_id: 'high_cpu_usage',
          title: 'High CPU Usage',
          description: `Station ${station.station_name} CPU usage at ${stationSummary.cpu_usage_percent.toFixed(1)}%`,
          alert_type: alertType,
          severity_score: alertType === 'critical' ? 8 : 5,
          context: {
            station_id: stationSummary.station_id,
            site_id: siteId,
            metric_name: 'cpu_usage_percent',
            current_value: stationSummary.cpu_usage_percent,
            threshold_value: cpuThreshold.warning_threshold,
            timestamp: new Date(),
            additional_data: { station_name: station.station_name }
          }
        });

        alerts.push(alert);
        this.recordAlert(ruleKey);
      }
    }

    // Memory Usage Alert
    const memoryThreshold = this.thresholds.find(t => t.id === 'memory_usage');
    if (memoryThreshold && stationSummary.memory_usage_percent >= memoryThreshold.warning_threshold) {
      const alertType = stationSummary.memory_usage_percent >= memoryThreshold.critical_threshold 
        ? 'critical' : 'warning';
      
      const ruleKey = `${stationSummary.station_id}_memory_usage`;
      if (this.shouldCreateAlert(ruleKey, memoryThreshold.id)) {
        const alert = this.createAlert({
          rule_id: 'high_memory_usage',
          title: 'High Memory Usage',
          description: `Station ${station.station_name} memory usage at ${stationSummary.memory_usage_percent.toFixed(1)}%`,
          alert_type: alertType,
          severity_score: alertType === 'critical' ? 7 : 4,
          context: {
            station_id: stationSummary.station_id,
            site_id: siteId,
            metric_name: 'memory_usage_percent',
            current_value: stationSummary.memory_usage_percent,
            threshold_value: memoryThreshold.warning_threshold,
            timestamp: new Date(),
            additional_data: { station_name: station.station_name }
          }
        });

        alerts.push(alert);
        this.recordAlert(ruleKey);
      }
    }

    // Devices Down Alert
    const deviceHealthThreshold = this.thresholds.find(t => t.id === 'device_health');
    if (deviceHealthThreshold && stationSummary.devices_down > 0) {
      const deviceFailurePercentage = (stationSummary.devices_down / stationSummary.total_devices) * 100;
      
      if (deviceFailurePercentage >= deviceHealthThreshold.warning_threshold) {
        const alertType = deviceFailurePercentage >= deviceHealthThreshold.critical_threshold 
          ? 'critical' : 'warning';
        
        const ruleKey = `${stationSummary.station_id}_devices_down`;
        if (this.shouldCreateAlert(ruleKey, deviceHealthThreshold.id)) {
          const alert = this.createAlert({
            rule_id: 'multiple_devices_down',
            title: 'Multiple Devices Down',
            description: `${stationSummary.devices_down} devices down on station ${station.station_name} (${deviceFailurePercentage.toFixed(1)}%)`,
            alert_type: alertType,
            severity_score: alertType === 'critical' ? 9 : 6,
            context: {
              station_id: stationSummary.station_id,
              site_id: siteId,
              metric_name: 'devices_down',
              current_value: stationSummary.devices_down,
              threshold_value: deviceHealthThreshold.warning_threshold,
              timestamp: new Date(),
              additional_data: { 
                station_name: station.station_name,
                device_failure_percentage: deviceFailurePercentage
              }
            }
          });

          alerts.push(alert);
          this.recordAlert(ruleKey);
        }
      }
    }

    // Connection Status Alert
    if (stationSummary.connection_status !== 'connected') {
      const ruleKey = `${stationSummary.station_id}_offline`;
      if (this.shouldCreateAlert(ruleKey, 'station_offline')) {
        const alert = this.createAlert({
          rule_id: 'station_offline',
          title: 'Station Offline',
          description: `Station ${station.station_name} is ${stationSummary.connection_status}`,
          alert_type: 'critical',
          severity_score: 10,
          context: {
            station_id: stationSummary.station_id,
            site_id: siteId,
            metric_name: 'connection_status',
            current_value: stationSummary.connection_status,
            threshold_value: 'connected',
            timestamp: new Date(),
            additional_data: { station_name: station.station_name }
          }
        });

        alerts.push(alert);
        this.recordAlert(ruleKey);
      }
    }

    // Low Uptime Alert
    const uptimeThreshold = this.thresholds.find(t => t.id === 'uptime_monitoring');
    if (uptimeThreshold && stationSummary.uptime_hours < uptimeThreshold.warning_threshold) {
      const alertType = stationSummary.uptime_hours < uptimeThreshold.critical_threshold 
        ? 'critical' : 'info';
      
      const ruleKey = `${stationSummary.station_id}_low_uptime`;
      if (this.shouldCreateAlert(ruleKey, uptimeThreshold.id)) {
        const alert = this.createAlert({
          rule_id: 'low_uptime',
          title: 'Station Recently Restarted',
          description: `Station ${station.station_name} uptime: ${stationSummary.uptime_hours.toFixed(1)} hours`,
          alert_type: alertType,
          severity_score: alertType === 'critical' ? 6 : 3,
          context: {
            station_id: stationSummary.station_id,
            site_id: siteId,
            metric_name: 'uptime_hours',
            current_value: stationSummary.uptime_hours,
            threshold_value: uptimeThreshold.warning_threshold,
            timestamp: new Date(),
            additional_data: { station_name: station.station_name }
          }
        });

        alerts.push(alert);
        this.recordAlert(ruleKey);
      }
    }

    return alerts;
  }

  // Evaluate device-level alerts
  private async evaluateDeviceAlerts(devices: Device[], siteId: string): Promise<SystemAlert[]> {
    const alerts: SystemAlert[] = [];

    // Group devices by protocol to detect protocol-wide issues
    const protocolGroups = devices.reduce((groups, device) => {
      const protocol = device.protocol || 'unknown';
      if (!groups[protocol]) {
        groups[protocol] = [];
      }
      groups[protocol].push(device);
      return groups;
    }, {} as Record<string, Device[]>);

    // Check for protocol-wide failures
    for (const [protocol, protocolDevices] of Object.entries(protocolGroups)) {
      const downDevices = protocolDevices.filter(d => d.status !== 'ok');
      const failureRate = downDevices.length / protocolDevices.length;

      if (failureRate > 0.5 && protocolDevices.length >= 5) { // 50% failure rate with at least 5 devices
        const ruleKey = `${siteId}_${protocol}_protocol_failure`;
        if (this.shouldCreateAlert(ruleKey, 'protocol_device_failures')) {
          const alert = this.createAlert({
            rule_id: 'protocol_device_failures',
            title: 'Protocol Device Failures',
            description: `${downDevices.length} out of ${protocolDevices.length} ${protocol.toUpperCase()} devices are failing`,
            alert_type: 'warning',
            severity_score: 6,
            context: {
              site_id: siteId,
              metric_name: 'device_failure_rate',
              current_value: failureRate,
              threshold_value: 0.2,
              timestamp: new Date(),
              additional_data: { 
                protocol,
                failed_devices: downDevices.length,
                total_devices: protocolDevices.length
              }
            }
          });

          alerts.push(alert);
          this.recordAlert(ruleKey);
        }
      }
    }

    return alerts;
  }

  // Helper method to create standardized alert
  private createAlert({
    rule_id,
    title,
    description,
    alert_type,
    severity_score,
    context
  }: {
    rule_id: string;
    title: string;
    description: string;
    alert_type: 'critical' | 'warning' | 'info';
    severity_score: number;
    context: AlertContext;
  }): SystemAlert {
    return {
      id: `${rule_id}_${context.station_id || context.site_id}_${Date.now()}`,
      rule_id,
      title,
      description,
      alert_type,
      severity_score,
      site_id: context.site_id,
      station_id: context.station_id,
      device_id: context.device_id,
      metric_name: context.metric_name,
      current_value: context.current_value,
      threshold_value: context.threshold_value,
      created_at: context.timestamp,
      acknowledged: false,
      resolved: false,
      metadata: context.additional_data || {}
    };
  }

  // Check if an alert should be created based on cooldown period
  private shouldCreateAlert(ruleKey: string, thresholdId: string): boolean {
    const lastAlert = this.alertHistory.get(ruleKey);
    const threshold = this.thresholds.find(t => t.id === thresholdId);
    const rule = this.alertRules.find(r => r.id === thresholdId);
    
    const cooldownMinutes = rule?.cooldown_minutes || 15;
    
    if (!lastAlert) return true;
    
    const timeSinceLastAlert = (Date.now() - lastAlert.getTime()) / (1000 * 60);
    return timeSinceLastAlert >= cooldownMinutes;
  }

  // Record when an alert was created for cooldown tracking
  private recordAlert(ruleKey: string): void {
    this.alertHistory.set(ruleKey, new Date());
  }

  // Public methods for managing thresholds and rules
  getThresholds(): AlertThreshold[] {
    return [...this.thresholds];
  }

  getAlertRules(): AlertRule[] {
    return [...this.alertRules];
  }

  updateThreshold(thresholdId: string, updates: Partial<AlertThreshold>): boolean {
    const index = this.thresholds.findIndex(t => t.id === thresholdId);
    if (index === -1) return false;
    
    this.thresholds[index] = { ...this.thresholds[index], ...updates };
    return true;
  }

  updateAlertRule(ruleId: string, updates: Partial<AlertRule>): boolean {
    const index = this.alertRules.findIndex(r => r.id === ruleId);
    if (index === -1) return false;
    
    this.alertRules[index] = { ...this.alertRules[index], ...updates };
    return true;
  }

  // Clear alert history (for testing or reset purposes)
  clearAlertHistory(): void {
    this.alertHistory.clear();
  }
}

export default IntelligentAlertingService.getInstance();
