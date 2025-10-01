-- =====================================================
-- System Discovery Normalized Schema
-- =====================================================
-- Purpose: Store imported Niagara/Tridium system data in normalized tables
-- for efficient querying, reporting, and site-wide inventory analysis
--
-- Key Features:
-- - Normalized structure for JACEs, resources, platforms, and devices
-- - JSONB for flexible metric storage (all 30-50+ metrics preserved)
-- - Proper foreign keys for relationships
-- - Indexes for performance
-- - View for site-wide inventory rollup
-- =====================================================

-- =====================================================
-- 1. System Discoveries (Import Sessions)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.system_discoveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.pm_workflow_sessions(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES public.ame_customers(id) ON DELETE SET NULL,
  
  -- Discovery metadata
  discovery_name TEXT,
  architecture TEXT CHECK (architecture IN ('single-jace', 'supervisor', 'multi-jace', 'unknown')),
  data_source TEXT DEFAULT 'automated_import' CHECK (data_source IN ('automated_import', 'manual_entry', 'api_sync')),
  
  -- Summary stats
  total_files_imported INT DEFAULT 0,
  total_jaces INT DEFAULT 0,
  total_devices INT DEFAULT 0,
  total_points INT DEFAULT 0,
  
  -- Timestamps
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Import errors/warnings
  import_errors JSONB DEFAULT '[]',
  import_warnings JSONB DEFAULT '[]',
  
  -- Optional: store full raw import data as backup
  raw_import_data JSONB,
  
  CONSTRAINT unique_session_discovery UNIQUE(session_id)
);

-- =====================================================
-- 2. Network Topology (Niagara Networks)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.network_topologies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_id UUID NOT NULL REFERENCES public.system_discoveries(id) ON DELETE CASCADE,
  
  -- Network details
  network_name TEXT,
  description TEXT,
  supervisor_name TEXT,
  
  -- Network metrics
  total_nodes INT DEFAULT 0,
  total_devices INT DEFAULT 0,
  
  -- Full parsed network data (all nodes, etc.)
  network_data JSONB NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. JACEs (Controllers)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.jaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_id UUID NOT NULL REFERENCES public.system_discoveries(id) ON DELETE CASCADE,
  network_id UUID REFERENCES public.network_topologies(id) ON DELETE SET NULL,
  
  -- JACE identification
  jace_name TEXT NOT NULL,
  jace_type TEXT, -- 'supervisor', 'jace', 'titan', etc.
  station_name TEXT,
  ip_address TEXT,
  mac_address TEXT,
  
  -- JACE role in architecture
  is_supervisor BOOLEAN DEFAULT FALSE,
  parent_supervisor_id UUID REFERENCES public.jaces(id) ON DELETE SET NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_jace_per_discovery UNIQUE(discovery_id, jace_name)
);

-- =====================================================
-- 4. JACE Platform Data
-- =====================================================
CREATE TABLE IF NOT EXISTS public.jace_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jace_id UUID NOT NULL REFERENCES public.jaces(id) ON DELETE CASCADE,
  
  -- Platform summary
  daemon_version TEXT,
  model TEXT,
  product TEXT,
  host_id TEXT,
  architecture TEXT,
  cpu_count INT,
  ram_free_kb INT,
  ram_total_kb INT,
  
  -- Software versions
  os TEXT,
  java_version TEXT,
  niagara_runtime TEXT,
  
  -- Ports
  https_port INT,
  fox_port INT,
  
  -- Full platform data (modules, licenses, certificates, etc.)
  platform_data JSONB NOT NULL,
  
  -- Timestamps
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_jace_platform UNIQUE(jace_id)
);

-- =====================================================
-- 5. JACE Resource Metrics
-- =====================================================
CREATE TABLE IF NOT EXISTS public.jace_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jace_id UUID NOT NULL REFERENCES public.jaces(id) ON DELETE CASCADE,
  
  -- Key metrics (for quick queries)
  cpu_usage_percent NUMERIC(5,2),
  heap_used_mb NUMERIC(10,2),
  heap_max_mb NUMERIC(10,2),
  heap_percent NUMERIC(5,2),
  memory_used_mb NUMERIC(10,2),
  memory_total_mb NUMERIC(10,2),
  memory_percent NUMERIC(5,2),
  
  -- Capacity metrics
  components_count INT,
  points_used INT,
  points_limit INT,
  points_percent NUMERIC(5,2),
  devices_used INT,
  devices_limit INT,
  devices_percent NUMERIC(5,2),
  histories_count INT,
  
  -- System info
  uptime TEXT,
  niagara_version TEXT,
  java_version TEXT,
  os_version TEXT,
  
  -- ALL metrics stored as JSONB (30-50+ metrics preserved)
  all_metrics JSONB NOT NULL,
  
  -- Computed health/analysis
  health_score INT,
  alerts JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  
  -- Timestamps
  snapshot_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_jace_resources UNIQUE(jace_id)
);

-- =====================================================
-- 6. Field Devices (BACnet, N2, Modbus, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.field_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jace_id UUID NOT NULL REFERENCES public.jaces(id) ON DELETE CASCADE,
  discovery_id UUID NOT NULL REFERENCES public.system_discoveries(id) ON DELETE CASCADE,
  
  -- Device identification
  device_name TEXT NOT NULL,
  device_type TEXT, -- 'bacnet', 'n2', 'modbus', 'lon', etc.
  device_id TEXT,
  instance_number INT,
  
  -- Device details
  vendor TEXT,
  model TEXT,
  description TEXT,
  location TEXT,
  
  -- Network info
  network_name TEXT,
  network_number INT,
  address TEXT,
  mac_address TEXT,
  
  -- Status
  status TEXT,
  is_online BOOLEAN,
  has_alarms BOOLEAN DEFAULT FALSE,
  
  -- Point counts
  point_count INT DEFAULT 0,
  analog_inputs INT DEFAULT 0,
  analog_outputs INT DEFAULT 0,
  binary_inputs INT DEFAULT 0,
  binary_outputs INT DEFAULT 0,
  
  -- Full device data (protocol-specific fields, etc.)
  device_data JSONB NOT NULL,
  
  -- Timestamps
  last_seen_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_device_per_jace UNIQUE(jace_id, device_type, device_name)
);

-- =====================================================
-- 7. Analysis Snapshots (Health Scores, Alerts)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.system_analysis_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_id UUID NOT NULL REFERENCES public.system_discoveries(id) ON DELETE CASCADE,
  jace_id UUID REFERENCES public.jaces(id) ON DELETE CASCADE,
  
  -- Analysis scope
  scope TEXT NOT NULL CHECK (scope IN ('system', 'jace', 'device')),
  ref_id TEXT, -- Reference ID for the analyzed entity
  
  -- Analysis results
  health_score INT CHECK (health_score >= 0 AND health_score <= 100),
  alerts JSONB DEFAULT '[]',
  recommendations JSONB DEFAULT '[]',
  
  -- Detailed metrics
  metrics JSONB DEFAULT '{}',
  
  -- Timestamps
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- System Discoveries
CREATE INDEX IF NOT EXISTS idx_system_discoveries_customer ON public.system_discoveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_system_discoveries_session ON public.system_discoveries(session_id);
CREATE INDEX IF NOT EXISTS idx_system_discoveries_imported_at ON public.system_discoveries(imported_at DESC);

-- Network Topologies
CREATE INDEX IF NOT EXISTS idx_network_topologies_discovery ON public.network_topologies(discovery_id);

-- JACEs
CREATE INDEX IF NOT EXISTS idx_jaces_discovery ON public.jaces(discovery_id);
CREATE INDEX IF NOT EXISTS idx_jaces_network ON public.jaces(network_id);
CREATE INDEX IF NOT EXISTS idx_jaces_name ON public.jaces(jace_name);
CREATE INDEX IF NOT EXISTS idx_jaces_supervisor ON public.jaces(is_supervisor) WHERE is_supervisor = TRUE;

-- JACE Platforms
CREATE INDEX IF NOT EXISTS idx_jace_platforms_jace ON public.jace_platforms(jace_id);
CREATE INDEX IF NOT EXISTS idx_jace_platforms_model ON public.jace_platforms(model);

-- JACE Resources
CREATE INDEX IF NOT EXISTS idx_jace_resources_jace ON public.jace_resources(jace_id);
CREATE INDEX IF NOT EXISTS idx_jace_resources_health ON public.jace_resources(health_score);
CREATE INDEX IF NOT EXISTS idx_jace_resources_cpu ON public.jace_resources(cpu_usage_percent) WHERE cpu_usage_percent > 80;
CREATE INDEX IF NOT EXISTS idx_jace_resources_heap ON public.jace_resources(heap_percent) WHERE heap_percent > 75;
CREATE INDEX IF NOT EXISTS idx_jace_resources_metrics ON public.jace_resources USING GIN(all_metrics);

-- Field Devices
CREATE INDEX IF NOT EXISTS idx_field_devices_jace ON public.field_devices(jace_id);
CREATE INDEX IF NOT EXISTS idx_field_devices_discovery ON public.field_devices(discovery_id);
CREATE INDEX IF NOT EXISTS idx_field_devices_type ON public.field_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_field_devices_vendor ON public.field_devices(vendor);
CREATE INDEX IF NOT EXISTS idx_field_devices_status ON public.field_devices(status);
CREATE INDEX IF NOT EXISTS idx_field_devices_alarms ON public.field_devices(has_alarms) WHERE has_alarms = TRUE;
CREATE INDEX IF NOT EXISTS idx_field_devices_data ON public.field_devices USING GIN(device_data);

-- Analysis Snapshots
CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_discovery ON public.system_analysis_snapshots(discovery_id);
CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_jace ON public.system_analysis_snapshots(jace_id);
CREATE INDEX IF NOT EXISTS idx_analysis_snapshots_scope ON public.system_analysis_snapshots(scope);

-- =====================================================
-- VIEWS for Reporting
-- =====================================================

-- Site-Wide Inventory Rollup
CREATE OR REPLACE VIEW public.site_inventory_rollup AS
SELECT 
  sd.id AS discovery_id,
  sd.discovery_name,
  sd.customer_id,
  c.company_name AS customer_name,
  sd.architecture,
  sd.imported_at,
  
  -- JACE counts
  COUNT(DISTINCT j.id) AS total_jaces,
  COUNT(DISTINCT j.id) FILTER (WHERE j.is_supervisor) AS supervisor_count,
  
  -- Device counts by protocol
  COUNT(DISTINCT fd.id) AS total_devices,
  COUNT(DISTINCT fd.id) FILTER (WHERE fd.device_type = 'bacnet') AS bacnet_devices,
  COUNT(DISTINCT fd.id) FILTER (WHERE fd.device_type = 'n2') AS n2_devices,
  COUNT(DISTINCT fd.id) FILTER (WHERE fd.device_type = 'modbus') AS modbus_devices,
  
  -- Device status
  COUNT(DISTINCT fd.id) FILTER (WHERE fd.is_online = TRUE) AS online_devices,
  COUNT(DISTINCT fd.id) FILTER (WHERE fd.has_alarms = TRUE) AS devices_with_alarms,
  
  -- Point counts
  COALESCE(SUM(jr.points_used), 0) AS total_points_used,
  COALESCE(SUM(jr.points_limit), 0) AS total_points_licensed,
  
  -- Capacity metrics
  ROUND(AVG(jr.points_percent), 2) AS avg_points_utilization,
  ROUND(AVG(jr.devices_percent), 2) AS avg_device_utilization,
  
  -- Resource health
  ROUND(AVG(jr.cpu_usage_percent), 2) AS avg_cpu_usage,
  ROUND(AVG(jr.heap_percent), 2) AS avg_heap_usage,
  ROUND(AVG(jr.memory_percent), 2) AS avg_memory_usage,
  ROUND(AVG(jr.health_score), 0) AS avg_health_score,
  
  -- Alert counts
  COUNT(DISTINCT jr.id) FILTER (WHERE jsonb_array_length(jr.alerts) > 0) AS jaces_with_alerts,
  
  -- Platform summary
  string_agg(DISTINCT jp.model, ', ') AS jace_models,
  string_agg(DISTINCT fd.vendor, ', ') AS device_vendors

FROM public.system_discoveries sd
LEFT JOIN public.ame_customers c ON c.id = sd.customer_id
LEFT JOIN public.jaces j ON j.discovery_id = sd.id
LEFT JOIN public.jace_platforms jp ON jp.jace_id = j.id
LEFT JOIN public.jace_resources jr ON jr.jace_id = j.id
LEFT JOIN public.field_devices fd ON fd.discovery_id = sd.id

GROUP BY 
  sd.id, sd.discovery_name, sd.customer_id, c.company_name, 
  sd.architecture, sd.imported_at;

-- JACE Health Summary
CREATE OR REPLACE VIEW public.jace_health_summary AS
SELECT 
  j.id AS jace_id,
  j.jace_name,
  j.discovery_id,
  sd.discovery_name,
  j.is_supervisor,
  
  -- Platform info
  jp.model,
  jp.niagara_runtime,
  jp.daemon_version,
  
  -- Resource metrics
  jr.cpu_usage_percent,
  jr.heap_percent,
  jr.memory_percent,
  jr.points_percent,
  jr.devices_percent,
  jr.health_score,
  
  -- Alert counts
  jsonb_array_length(COALESCE(jr.alerts, '[]')) AS alert_count,
  jsonb_array_length(COALESCE(jr.warnings, '[]')) AS warning_count,
  
  -- Device counts
  COUNT(DISTINCT fd.id) AS device_count,
  COUNT(DISTINCT fd.id) FILTER (WHERE fd.device_type = 'bacnet') AS bacnet_count,
  COUNT(DISTINCT fd.id) FILTER (WHERE fd.device_type = 'n2') AS n2_count,
  
  -- Status
  CASE 
    WHEN jr.health_score >= 90 THEN 'Excellent'
    WHEN jr.health_score >= 75 THEN 'Good'
    WHEN jr.health_score >= 60 THEN 'Fair'
    ELSE 'Needs Attention'
  END AS health_status,
  
  jr.snapshot_at,
  j.created_at

FROM public.jaces j
LEFT JOIN public.system_discoveries sd ON sd.id = j.discovery_id
LEFT JOIN public.jace_platforms jp ON jp.jace_id = j.id
LEFT JOIN public.jace_resources jr ON jr.jace_id = j.id
LEFT JOIN public.field_devices fd ON fd.jace_id = j.id

GROUP BY 
  j.id, j.jace_name, j.discovery_id, sd.discovery_name, j.is_supervisor,
  jp.model, jp.niagara_runtime, jp.daemon_version,
  jr.cpu_usage_percent, jr.heap_percent, jr.memory_percent,
  jr.points_percent, jr.devices_percent, jr.health_score,
  jr.alerts, jr.warnings, jr.snapshot_at, j.created_at;

-- Device Vendor Summary
CREATE OR REPLACE VIEW public.device_vendor_summary AS
SELECT 
  fd.discovery_id,
  sd.discovery_name,
  fd.vendor,
  fd.device_type,
  COUNT(*) AS device_count,
  COUNT(*) FILTER (WHERE fd.is_online = TRUE) AS online_count,
  COUNT(*) FILTER (WHERE fd.has_alarms = TRUE) AS alarm_count,
  SUM(fd.point_count) AS total_points,
  string_agg(DISTINCT fd.model, ', ') AS models

FROM public.field_devices fd
LEFT JOIN public.system_discoveries sd ON sd.id = fd.discovery_id

GROUP BY 
  fd.discovery_id, sd.discovery_name, fd.vendor, fd.device_type

ORDER BY device_count DESC;

-- =====================================================
-- Row Level Security (RLS) Policies
-- =====================================================

ALTER TABLE public.system_discoveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.network_topologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jace_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jace_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.field_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_analysis_snapshots ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all discovery data
CREATE POLICY "Allow authenticated read access" ON public.system_discoveries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON public.network_topologies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON public.jaces FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON public.jace_platforms FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON public.jace_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON public.field_devices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow authenticated read access" ON public.system_analysis_snapshots FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert/update/delete their own data
CREATE POLICY "Allow authenticated write access" ON public.system_discoveries FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated write access" ON public.network_topologies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated write access" ON public.jaces FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated write access" ON public.jace_platforms FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated write access" ON public.jace_resources FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated write access" ON public.field_devices FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow authenticated write access" ON public.system_analysis_snapshots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to calculate system health from discovery
CREATE OR REPLACE FUNCTION public.calculate_discovery_health(discovery_uuid UUID)
RETURNS TABLE (
  overall_health_score INT,
  jaces_healthy INT,
  jaces_needs_attention INT,
  critical_alerts INT,
  warning_alerts INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(jr.health_score))::INT AS overall_health_score,
    COUNT(*) FILTER (WHERE jr.health_score >= 75)::INT AS jaces_healthy,
    COUNT(*) FILTER (WHERE jr.health_score < 75)::INT AS jaces_needs_attention,
    SUM(jsonb_array_length(
      jsonb_path_query_array(jr.alerts, '$[*] ? (@.severity == "critical")')
    ))::INT AS critical_alerts,
    SUM(jsonb_array_length(
      jsonb_path_query_array(jr.alerts, '$[*] ? (@.severity == "warning")')
    ))::INT AS warning_alerts
  FROM public.jaces j
  JOIN public.jace_resources jr ON jr.jace_id = j.id
  WHERE j.discovery_id = discovery_uuid;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON TABLE public.system_discoveries IS 'Top-level import sessions for Niagara/Tridium system discoveries';
COMMENT ON TABLE public.jaces IS 'JACE controllers discovered in system imports';
COMMENT ON TABLE public.jace_resources IS 'Resource metrics for JACEs - all 30-50+ metrics stored in all_metrics JSONB';
COMMENT ON TABLE public.field_devices IS 'Field devices (BACnet, N2, Modbus, etc.) connected to JACEs';
COMMENT ON VIEW public.site_inventory_rollup IS 'Site-wide inventory summary with device counts, capacity metrics, and health scores';
