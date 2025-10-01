# System Discovery Database Schema

## Overview

The normalized system discovery schema provides efficient storage and querying of imported Niagara/Tridium system data. This replaces the previous JSONB-only approach in `phase_2_data` with proper relational tables while maintaining JSONB flexibility for metrics.

## Schema Architecture

### Core Tables

```
system_discoveries (Top-level import sessions)
├── network_topologies (Niagara network structure)
├── jaces (JACE controllers)
│   ├── jace_platforms (Hardware/software details)
│   ├── jace_resources (Metrics: CPU, heap, capacities, etc.)
│   └── field_devices (BACnet, N2, Modbus devices)
└── system_analysis_snapshots (Health scores, alerts)
```

## Table Descriptions

### 1. `system_discoveries`
**Purpose**: Top-level record of each system import/discovery session

**Key Fields**:
- `session_id` - Links to PM workflow session
- `customer_id` - Links to customer
- `architecture` - 'single-jace', 'supervisor', 'multi-jace'
- `total_jaces`, `total_devices`, `total_points` - Summary stats
- `import_errors`, `import_warnings` - Issues encountered

**Use Case**: Track all system imports for a customer across time

### 2. `jaces`
**Purpose**: Each JACE/controller discovered in the system

**Key Fields**:
- `jace_name` - Name from network export or manually assigned
- `jace_type` - 'supervisor', 'jace', 'titan'
- `is_supervisor` - Boolean flag
- `parent_supervisor_id` - Self-referencing for hierarchy
- `ip_address`, `mac_address` - Network identifiers

**Use Case**: Query all JACEs in a system, find supervisors, build network diagram

### 3. `jace_platforms`
**Purpose**: Hardware and software platform details for each JACE

**Key Fields**:
- `model` - JACE-8000, TITAN, etc.
- `daemon_version`, `niagara_runtime` - Software versions
- `cpu_count`, `ram_total_kb` - Hardware specs
- `platform_data` - Full JSONB with modules, licenses, certificates

**Use Case**: Hardware inventory, license auditing, version compliance checks

### 4. `jace_resources`
**Purpose**: Resource metrics and capacity data for each JACE

**Key Fields (Indexed)**:
- `cpu_usage_percent`, `heap_percent`, `memory_percent` - Performance metrics
- `points_used`, `points_limit`, `points_percent` - License capacity
- `devices_used`, `devices_limit`, `devices_percent` - Device capacity
- `health_score` - Computed overall health (0-100)
- `all_metrics` - **JSONB with ALL 30-50+ parsed metrics**

**Use Case**: 
- Find JACEs with high resource usage
- Track license utilization
- Generate health reports
- Access any metric from CSV exports

**Example Query**:
```sql
-- Find JACEs with critical heap usage
SELECT j.jace_name, jr.heap_percent, jr.heap_used_mb, jr.heap_max_mb
FROM jaces j
JOIN jace_resources jr ON jr.jace_id = j.id
WHERE jr.heap_percent > 90;

-- Get specific metric from all_metrics JSONB
SELECT 
  j.jace_name,
  (jr.all_metrics->'engine.scan.recent'->>'value') AS scan_time,
  (jr.all_metrics->'globalCapacity.histories'->>'value') AS history_capacity
FROM jaces j
JOIN jace_resources jr ON jr.jace_id = j.id;
```

### 5. `field_devices`
**Purpose**: All field devices (BACnet, N2, Modbus, etc.) in the system

**Key Fields**:
- `device_type` - 'bacnet', 'n2', 'modbus', 'lon'
- `vendor`, `model` - Device identification
- `device_id`, `instance_number` - Protocol-specific IDs
- `status`, `is_online`, `has_alarms` - Current state
- `point_count`, `analog_inputs`, `binary_inputs`, etc. - Point counts
- `device_data` - Full JSONB with all protocol-specific fields

**Use Case**:
- Generate device inventory reports
- Find offline or alarmed devices
- Count devices by vendor/model
- Protocol-specific analysis

**Example Query**:
```sql
-- Inventory by vendor
SELECT vendor, device_type, COUNT(*) as device_count
FROM field_devices
WHERE discovery_id = 'xxx'
GROUP BY vendor, device_type
ORDER BY device_count DESC;

-- Find devices with alarms
SELECT j.jace_name, fd.device_name, fd.vendor, fd.status
FROM field_devices fd
JOIN jaces j ON j.id = fd.jace_id
WHERE fd.has_alarms = TRUE;
```

## Built-In Views

### `site_inventory_rollup`
**Purpose**: Site-wide summary of all discovered systems

**Returns**:
- Total JACEs, supervisors, devices by protocol
- Aggregate capacity metrics (points, devices)
- Average resource utilization (CPU, heap, memory)
- Health scores
- Device vendors and JACE models

**Example Query**:
```sql
-- Get inventory for a customer
SELECT * FROM site_inventory_rollup
WHERE customer_id = 'xxx'
ORDER BY imported_at DESC;
```

### `jace_health_summary`
**Purpose**: Health dashboard for all JACEs

**Returns**:
- JACE name, model, versions
- Resource metrics percentages
- Health score and status ('Excellent', 'Good', 'Fair', 'Needs Attention')
- Alert and warning counts
- Device counts by protocol

**Example Query**:
```sql
-- Find JACEs needing attention
SELECT jace_name, health_status, health_score, alert_count
FROM jace_health_summary
WHERE health_status IN ('Fair', 'Needs Attention')
ORDER BY health_score ASC;
```

### `device_vendor_summary`
**Purpose**: Device inventory grouped by vendor and protocol

**Returns**:
- Vendor, device type, counts
- Online vs. offline counts
- Alarm counts
- Models list

**Example Query**:
```sql
-- Top vendors by device count
SELECT vendor, SUM(device_count) as total_devices
FROM device_vendor_summary
WHERE discovery_id = 'xxx'
GROUP BY vendor
ORDER BY total_devices DESC
LIMIT 10;
```

## Helper Functions

### `calculate_discovery_health(discovery_uuid)`
**Purpose**: Calculate overall system health metrics

**Returns**:
- `overall_health_score` - Average health across all JACEs
- `jaces_healthy` - Count with score >= 75
- `jaces_needs_attention` - Count with score < 75
- `critical_alerts` - Total critical alerts
- `warning_alerts` - Total warning alerts

**Example**:
```sql
SELECT * FROM calculate_discovery_health('discovery-uuid-here');
```

## Migration from phase_2_data

### Current Structure (JSONB)
```typescript
pm_workflow_sessions.phase_2_data = {
  tridiumSystemData: {
    architecture: 'supervisor',
    jaces: {
      'JACE1': { platform: {...}, resources: {...}, drivers: {...} },
      'JACE2': { platform: {...}, resources: {...}, drivers: {...} }
    },
    supervisor: { platform: {...}, resources: {...}, network: {...} }
  }
}
```

### New Structure (Normalized)
```sql
-- One discovery record
INSERT INTO system_discoveries (session_id, architecture, ...)

-- One JACE record per controller
INSERT INTO jaces (discovery_id, jace_name, ...)

-- Platform, resources, and devices for each JACE
INSERT INTO jace_platforms (jace_id, platform_data, ...)
INSERT INTO jace_resources (jace_id, all_metrics, ...)
INSERT INTO field_devices (jace_id, device_data, ...)
```

## Report-Ready Queries

### 1. Executive Summary
```sql
SELECT 
  c.company_name,
  sir.architecture,
  sir.total_jaces,
  sir.total_devices,
  sir.avg_health_score,
  sir.jaces_with_alerts,
  sir.avg_points_utilization || '%' as points_utilization,
  sir.device_vendors
FROM site_inventory_rollup sir
JOIN ame_customers c ON c.id = sir.customer_id
WHERE sir.discovery_id = 'xxx';
```

### 2. Capacity Planning Report
```sql
SELECT 
  j.jace_name,
  jr.points_used,
  jr.points_limit,
  jr.points_percent,
  jr.devices_used,
  jr.devices_limit,
  jr.devices_percent,
  CASE 
    WHEN jr.points_percent > 90 OR jr.devices_percent > 90 THEN 'Immediate Action Required'
    WHEN jr.points_percent > 75 OR jr.devices_percent > 75 THEN 'Plan Upgrade'
    ELSE 'Adequate Capacity'
  END as capacity_status
FROM jaces j
JOIN jace_resources jr ON jr.jace_id = j.id
WHERE j.discovery_id = 'xxx'
ORDER BY GREATEST(jr.points_percent, jr.devices_percent) DESC;
```

### 3. Device Inventory by Protocol
```sql
SELECT 
  fd.device_type as protocol,
  fd.vendor,
  COUNT(*) as device_count,
  COUNT(*) FILTER (WHERE fd.is_online) as online_count,
  COUNT(*) FILTER (WHERE fd.has_alarms) as alarm_count,
  SUM(fd.point_count) as total_points
FROM field_devices fd
WHERE fd.discovery_id = 'xxx'
GROUP BY ROLLUP(fd.device_type, fd.vendor)
ORDER BY fd.device_type, device_count DESC;
```

### 4. Health & Alerts Report
```sql
SELECT 
  jhs.jace_name,
  jhs.model,
  jhs.health_status,
  jhs.health_score,
  jhs.cpu_usage_percent,
  jhs.heap_percent,
  jhs.points_percent,
  jhs.alert_count,
  jhs.device_count
FROM jace_health_summary jhs
WHERE jhs.discovery_id = 'xxx'
ORDER BY jhs.health_score ASC;
```

### 5. License Audit
```sql
SELECT 
  jp.model,
  jp.niagara_runtime,
  COUNT(*) as jace_count,
  SUM(jr.points_used) as total_points_used,
  SUM(jr.points_limit) as total_points_licensed,
  SUM(jr.devices_used) as total_devices_used,
  SUM(jr.devices_limit) as total_devices_licensed
FROM jaces j
JOIN jace_platforms jp ON jp.jace_id = j.id
JOIN jace_resources jr ON jr.jace_id = j.id
WHERE j.discovery_id = 'xxx'
GROUP BY jp.model, jp.niagara_runtime;
```

## Performance Considerations

### Indexed Columns
- All foreign keys are indexed
- `jace_resources.health_score`, `.cpu_usage_percent`, `.heap_percent` - for threshold queries
- `field_devices.device_type`, `.vendor`, `.has_alarms` - for filtering
- GIN indexes on JSONB columns for full-text/path queries

### Optimized for:
- ✅ Filtering JACEs by resource thresholds
- ✅ Aggregating device counts by vendor/protocol
- ✅ Finding alarmed or offline devices
- ✅ Querying specific metrics from JSONB
- ✅ Joining across JACEs, devices, and resources

### Query Tips
1. Use the pre-built views for common reports
2. Filter on indexed columns first (health_score, device_type, etc.)
3. Use JSONB operators (`->`, `->>`, `@>`) for metric queries
4. Join on foreign keys for best performance

## Next Steps

1. **Data Service Layer**: Create TypeScript service to populate these tables from TridiumSystemData
2. **Inventory Component**: Build React component to display site_inventory_rollup
3. **Report Generator**: Use views to generate PDF/Excel reports
4. **Trend Analysis**: Store multiple snapshots over time for trending
5. **Alerting**: Create triggers for critical thresholds
