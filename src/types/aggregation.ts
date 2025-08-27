/**
 * Comprehensive data aggregation types for Tridium Niagara system health monitoring
 * 
 * This schema supports hierarchical aggregation:
 * Site/Supervisor → JACEs/Stations → Devices → Metrics over time
 */

// ============================================================================
// Core Entity Types
// ============================================================================

export interface Site {
  id: string;
  name: string;
  supervisor_station?: string; // The main supervisor station name
  location?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Station {
  id: string;
  site_id: string;
  name: string; // Station name from Niagara Network Export
  station_type: 'supervisor' | 'jace' | 'workstation';
  
  // Network Information
  ip_address?: string;
  fox_port?: number;
  platform_port?: number;
  
  // Hardware/Software Details  
  host_model?: string; // e.g. "TITAN", "JVLN", "NPM6E"
  product?: string; // e.g. "JACE-8000"
  niagara_version?: string; // e.g. "4.12.1.16"
  host_model_version?: string;
  operating_system?: string;
  
  // Connection Status
  client_connection: 'connected' | 'not_connected' | 'unknown';
  server_connection: 'connected' | 'not_connected' | 'unknown';
  platform_status: 'ok' | 'down' | 'fault' | 'alarm' | 'unknown';
  
  // Metadata
  enabled: boolean;
  last_health_check?: string;
  created_at: string;
  updated_at: string;
}

export interface Device {
  id: string;
  station_id: string;
  
  // Device Identity
  name: string;
  device_type: string; // Protocol-specific type (VMA, UNT, DX, etc.)
  protocol: 'bacnet' | 'n2' | 'modbus' | 'niagara' | 'other';
  
  // Protocol-specific addressing
  address?: string; // N2 address, BACnet device ID, etc.
  network_id?: string; // BACnet network, N2 trunk, etc.
  mac_address?: string;
  
  // Device Details (primarily from BACnet)
  vendor?: string;
  model?: string;
  firmware_version?: string;
  app_software_version?: string;
  protocol_revision?: string;
  
  // Current Status
  status: 'ok' | 'down' | 'alarm' | 'unacked_alarm' | 'fault' | 'unknown';
  status_flags: string[]; // Raw status flags like ["down", "alarm"]
  enabled: boolean;
  last_contact?: string;
  
  // Parsed from raw_data if available
  parsed_values?: Record<string, any>;
  raw_data: Record<string, any>; // Original CSV row data
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Time-Series Metrics Types
// ============================================================================

export interface StationMetrics {
  id: string;
  station_id: string;
  timestamp: string;
  
  // Performance Metrics
  cpu_usage_percent?: number;
  memory_used_mb?: number;
  memory_total_mb?: number;
  heap_used_mb?: number;
  heap_max_mb?: number;
  
  // Capacity Metrics
  device_count: number;
  device_limit?: number;
  point_count: number;
  point_limit?: number;
  history_count?: number;
  network_count?: number;
  
  // Engine Performance
  engine_scan_usage_percent?: number;
  engine_scan_recent_ms?: number;
  engine_scan_peak_ms?: number;
  engine_queue_actions?: number;
  engine_queue_actions_peak?: number;
  
  // System Status
  uptime_hours?: number;
  file_descriptors_used?: number;
  file_descriptors_max?: number;
  
  // Resource Units (kRU)
  resource_total_kru?: number;
  resource_limit_kru?: number;
  
  created_at: string;
}

export interface DeviceStatusHistory {
  id: string;
  device_id: string;
  timestamp: string;
  status: string;
  status_flags: string[];
  duration_seconds?: number; // How long the device was in this status
  created_at: string;
}

// ============================================================================
// Aggregated Summary Types (for fast dashboard queries)
// ============================================================================

export interface SiteHealthSummary {
  id: string;
  site_id: string;
  timestamp: string; // When this summary was calculated
  
  // Station Summary
  total_stations: number;
  stations_online: number;
  stations_offline: number;
  stations_with_issues: number;
  
  // Device Summary  
  total_devices: number;
  devices_ok: number;
  devices_down: number;
  devices_alarm: number;
  devices_unacked_alarm: number;
  devices_unknown: number;
  
  // Protocol Breakdown
  protocol_counts: Record<string, number>; // {"bacnet": 45, "n2": 23, ...}
  
  // Capacity Summary
  avg_cpu_usage: number;
  max_cpu_usage: number;
  avg_memory_usage: number;
  total_point_count: number;
  total_device_count: number;
  
  // Version Compliance
  niagara_versions: Record<string, number>; // {"4.12.1.16": 6, "3.7.106.10": 1}
  outdated_stations: number; // Stations running old versions
  
  // Alerts/Issues
  critical_alerts: string[]; // List of critical issues found
  warning_alerts: string[]; // List of warnings
  
  created_at: string;
}

export interface StationHealthSummary {
  id: string;
  station_id: string;
  timestamp: string;
  
  // Current Status
  overall_health: 'healthy' | 'warning' | 'critical' | 'offline';
  connection_status: 'connected' | 'partial' | 'disconnected';
  
  // Device Summary for this Station
  total_devices: number;
  devices_by_status: Record<string, number>;
  devices_by_protocol: Record<string, number>;
  
  // Performance Summary
  cpu_usage_percent: number;
  memory_usage_percent: number;
  capacity_utilization: number; // Overall utilization score 0-100
  
  // Capacity Details
  device_utilization: number; // devices used / device limit * 100
  point_utilization: number; // points used / point limit * 100
  
  // Uptime/Reliability
  uptime_hours: number;
  last_restart?: string;
  restarts_this_month: number;
  
  // Issues
  active_alarms: number;
  devices_down: number;
  critical_issues: string[];
  warnings: string[];
  
  created_at: string;
}

// ============================================================================
// Analytics and Trending Types  
// ============================================================================

export interface SystemTrend {
  id: string;
  metric_type: string; // 'device_count', 'cpu_usage', 'memory_usage', etc.
  entity_type: 'site' | 'station' | 'device';
  entity_id: string;
  
  // Trend Analysis
  period: 'hour' | 'day' | 'week' | 'month';
  start_date: string;
  end_date: string;
  
  // Statistical Summary
  min_value: number;
  max_value: number;
  avg_value: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  trend_strength: number; // 0-1, how strong the trend is
  
  // Data Points (for charting)
  data_points: Array<{
    timestamp: string;
    value: number;
  }>;
  
  created_at: string;
}

// ============================================================================
// Alert and Event Types
// ============================================================================

export interface SystemAlert {
  id: string;
  site_id?: string;
  station_id?: string;
  device_id?: string;
  
  alert_type: 'critical' | 'warning' | 'info';
  category: 'performance' | 'capacity' | 'connectivity' | 'version' | 'device_health';
  
  title: string;
  description: string;
  
  // Alert State
  status: 'active' | 'acknowledged' | 'resolved' | 'suppressed';
  severity_score: number; // 1-10 scale
  
  // Trigger Information
  metric_name?: string;
  threshold_value?: number;
  actual_value?: number;
  
  // Lifecycle
  triggered_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  created_at: string;
}

// ============================================================================
// Configuration and Threshold Types
// ============================================================================

export interface AlertThreshold {
  id: string;
  name: string;
  metric_type: string;
  entity_type: 'site' | 'station' | 'device';
  
  // Threshold Definition
  warning_threshold?: number;
  critical_threshold?: number;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  
  // Conditions
  duration_minutes: number; // How long condition must persist
  enabled: boolean;
  
  // Notification
  notify_email: boolean;
  notify_dashboard: boolean;
  suppress_similar_minutes: number; // Prevent spam
  
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Data Import/Export Types
// ============================================================================

export interface DataIngestionJob {
  id: string;
  site_id: string;
  visit_id?: string;
  
  // Job Details
  job_type: 'manual_upload' | 'scheduled_sync' | 'api_import';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  // File Information
  uploaded_files: Array<{
    filename: string;
    file_type: string; // CSV, TXT
    format_detected: string; // N2Export, BACnetExport, etc.
    size_bytes: number;
    processed: boolean;
  }>;
  
  // Processing Results
  stations_processed: number;
  devices_processed: number;
  metrics_processed: number;
  errors: string[];
  warnings: string[];
  
  // Timing
  started_at: string;
  completed_at?: string;
  processing_time_seconds?: number;
  
  created_at: string;
}

// ============================================================================
// Query Helper Types
// ============================================================================

export interface HealthDashboardQuery {
  site_ids?: string[];
  station_ids?: string[];
  time_range: {
    start: string;
    end: string;
  };
  metrics: string[];
  group_by?: 'site' | 'station' | 'protocol' | 'device_type';
  include_trends?: boolean;
  include_alerts?: boolean;
}

export interface CapacityPlanningQuery {
  entity_type: 'site' | 'station';
  entity_ids: string[];
  forecast_days: number;
  metrics: string[];
  confidence_level: number; // 0.8, 0.9, 0.95
}

// ============================================================================
// Export Data Models (for creating the actual database schema)
// ============================================================================

export const DATABASE_SCHEMA = {
  sites: 'sites',
  stations: 'stations', 
  devices: 'devices',
  station_metrics: 'station_metrics',
  device_status_history: 'device_status_history',
  site_health_summaries: 'site_health_summaries',
  station_health_summaries: 'station_health_summaries',
  system_trends: 'system_trends',
  system_alerts: 'system_alerts',
  alert_thresholds: 'alert_thresholds',
  data_ingestion_jobs: 'data_ingestion_jobs'
} as const;

export type DatabaseTable = typeof DATABASE_SCHEMA[keyof typeof DATABASE_SCHEMA];
