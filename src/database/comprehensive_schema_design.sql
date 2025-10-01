-- ===================================================================
-- COMPREHENSIVE PM WORKFLOW DATABASE SCHEMA
-- Designed for proper relational structure with data integrity
-- ===================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================================================
-- CORE ENTITIES
-- ===================================================================

-- PM Workflow Sessions (Master table for each assessment)
CREATE TABLE pm_workflow_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    customer_id UUID NOT NULL,
    customer_name TEXT NOT NULL,
    service_tier TEXT CHECK (service_tier IN ('CORE', 'ASSURE', 'GUARDIAN')) NOT NULL,
    current_phase INTEGER CHECK (current_phase BETWEEN 1 AND 4) DEFAULT 1,
    start_time TIMESTAMPTZ DEFAULT NOW(),
    last_saved TIMESTAMPTZ DEFAULT NOW(),
    status TEXT CHECK (status IN ('Draft', 'In Progress', 'Completed', 'Cancelled')) DEFAULT 'Draft',
    technician_name TEXT NOT NULL,
    technician_id UUID,
    completion_time TIMESTAMPTZ,
    total_duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table (enhanced from existing)
CREATE TABLE customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_name TEXT NOT NULL,
    site_name TEXT,
    address TEXT,
    service_tier TEXT CHECK (service_tier IN ('CORE', 'ASSURE', 'GUARDIAN')),
    contract_number TEXT,
    account_manager TEXT,

    -- Enhanced fields
    bas_platform TEXT,
    system_architecture TEXT,
    primary_technician_id UUID,
    primary_technician_name TEXT,
    primary_technician_email TEXT,
    primary_technician_phone TEXT,
    secondary_technician_id UUID,
    secondary_technician_name TEXT,
    secondary_technician_email TEXT,
    secondary_technician_phone TEXT,

    -- Google Drive integration
    drive_folder_id TEXT,
    drive_folder_url TEXT,
    drive_folder_name TEXT,

    -- SimPro integration
    simpro_customer_id TEXT,

    -- Metadata
    created_by UUID,
    assigned_technician UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- PHASE 1: SITE INTELLIGENCE TABLES
-- ===================================================================

-- Site Contacts
CREATE TABLE site_contacts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES pm_workflow_sessions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    role TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_emergency BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Access Information
CREATE TABLE site_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES pm_workflow_sessions(id) ON DELETE CASCADE,
    access_method TEXT,
    parking_instructions TEXT,
    badge_required BOOLEAN DEFAULT FALSE,
    escort_required BOOLEAN DEFAULT FALSE,
    best_arrival_time TEXT,
    special_instructions TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Safety Information
CREATE TABLE site_safety (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES pm_workflow_sessions(id) ON DELETE CASCADE,
    required_ppe TEXT[], -- Array of PPE requirements
    known_hazards TEXT[], -- Array of hazards
    safety_contact TEXT,
    safety_phone TEXT,
    special_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Handoff Information
CREATE TABLE project_handoff (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES pm_workflow_sessions(id) ON DELETE CASCADE,
    has_submittals BOOLEAN DEFAULT FALSE,
    submittal_location TEXT,
    has_as_builts BOOLEAN DEFAULT FALSE,
    as_built_location TEXT,
    has_floor_plans BOOLEAN DEFAULT FALSE,
    floor_plan_location TEXT,
    has_soo BOOLEAN DEFAULT FALSE,
    soo_location TEXT,
    completeness_score INTEGER CHECK (completeness_score BETWEEN 1 AND 10),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- PHASE 2: SYSTEM DISCOVERY TABLES
-- ===================================================================

-- BMS System Information
CREATE TABLE bms_systems (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES pm_workflow_sessions(id) ON DELETE CASCADE,
    platform TEXT,
    software_version TEXT,
    supervisor_location TEXT,
    supervisor_ip INET,
    system_architecture TEXT,
    credentials_location TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Photos
CREATE TABLE system_photos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES pm_workflow_sessions(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    description TEXT,
    alt_text TEXT, -- For accessibility
    category TEXT CHECK (category IN ('Panel', 'Supervisor', 'Equipment', 'Issue', 'Screenshot', 'Other')) DEFAULT 'Other',
    file_path TEXT, -- Path to stored file
    file_size INTEGER,
    mime_type TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Manual Inventory Data
CREATE TABLE manual_inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES pm_workflow_sessions(id) ON DELETE CASCADE,
    device_count INTEGER DEFAULT 0,
    controller_count INTEGER DEFAULT 0,
    major_equipment TEXT[], -- Array of equipment names
    network_segments TEXT[], -- Array of network segment descriptions
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remote Access Credentials
CREATE TABLE remote_access_credentials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES pm_workflow_sessions(id) ON DELETE CASCADE,
    service_type TEXT NOT NULL, -- VPN, RDP, SSH, etc.
    host TEXT,
    port INTEGER,
    username TEXT,
    password_encrypted TEXT, -- Encrypted password
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    vpn_required BOOLEAN DEFAULT FALSE,
    vpn_config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Access Credentials
CREATE TABLE system_credentials (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES pm_workflow_sessions(id) ON DELETE CASCADE,
    credential_type TEXT CHECK (credential_type IN ('BMS', 'Windows', 'Service', 'Database', 'Other')),
    system_name TEXT,
    username TEXT,
    password_encrypted TEXT, -- Encrypted password
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_verified TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project Folders (Google Drive integration)
CREATE TABLE project_folders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES pm_workflow_sessions(id) ON DELETE CASCADE,
    folder_id TEXT NOT NULL, -- Google Drive folder ID
    folder_name TEXT NOT NULL,
    folder_url TEXT NOT NULL,
    folder_structure JSONB, -- Store subfolder structure
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- ENHANCED SYSTEM INVENTORY TABLES
-- ===================================================================

-- System Baselines (comprehensive system snapshots)
CREATE TABLE system_baselines (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES pm_workflow_sessions(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    site_name TEXT NOT NULL,
    baseline_date TIMESTAMPTZ NOT NULL,
    system_architecture TEXT CHECK (system_architecture IN ('single-jace', 'multi-jace', 'supervisor')),
    niagara_version TEXT,
    total_devices INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),

    -- JSON fields for flexible data storage
    resource_data JSONB, -- CPU, memory, heap, capacities
    device_inventory JSONB, -- Device counts and health statistics
    network_topology JSONB, -- Network structure and connections
    platform_details JSONB, -- Hardware specs, modules, licenses

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT system_baselines_unique_site_date UNIQUE (session_id, baseline_date)
);

-- BACnet Devices (detailed device inventory)
CREATE TABLE bacnet_devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    baseline_id UUID REFERENCES system_baselines(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    device_id INTEGER NOT NULL,
    status TEXT[],
    vendor TEXT,
    model TEXT,
    firmware_revision TEXT,
    health TEXT,
    health_timestamp TIMESTAMPTZ,
    network_id INTEGER,
    mac_address INTEGER,
    max_apdu INTEGER,
    enabled BOOLEAN DEFAULT TRUE,
    cov_enabled BOOLEAN DEFAULT FALSE,
    protocol_revision TEXT,
    app_sw_version TEXT,
    encoding TEXT,
    segmentation TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- N2 Devices (legacy N2 device inventory)
CREATE TABLE n2_devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    baseline_id UUID REFERENCES system_baselines(id) ON DELETE CASCADE,
    device_name TEXT NOT NULL,
    address INTEGER NOT NULL,
    status TEXT[],
    controller_type TEXT,
    raw_type TEXT, -- For unknown codes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Network Stations (Niagara network topology)
CREATE TABLE network_stations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    baseline_id UUID REFERENCES system_baselines(id) ON DELETE CASCADE,
    station_name TEXT NOT NULL,
    ip_address INET,
    fox_port INTEGER,
    host_model TEXT,
    version TEXT,
    status TEXT,
    connection_status TEXT,
    platform_status TEXT,
    credentials_store TEXT,
    secure_platform BOOLEAN DEFAULT FALSE,
    platform_port INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Details (hardware and software information)
CREATE TABLE platform_details (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    baseline_id UUID REFERENCES system_baselines(id) ON DELETE CASCADE,
    model TEXT,
    product TEXT,
    host_id TEXT,
    architecture TEXT,
    cpu_count INTEGER,
    ram_total_mb INTEGER,
    ram_free_mb INTEGER,
    storage_total_mb INTEGER,
    storage_free_mb INTEGER,
    daemon_version TEXT,
    daemon_port INTEGER,
    operating_system TEXT,
    java_version TEXT,
    modules JSONB, -- Array of modules with versions
    licenses JSONB, -- Array of licenses
    certificates JSONB, -- Array of certificates
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- RESOURCE UTILIZATION TRACKING
-- ===================================================================

-- Resource Metrics (system performance data)
CREATE TABLE resource_metrics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    baseline_id UUID REFERENCES system_baselines(id) ON DELETE CASCADE,
    measurement_time TIMESTAMPTZ DEFAULT NOW(),

    -- CPU and Memory
    cpu_usage_percent NUMERIC(5,2),
    memory_used_mb INTEGER,
    memory_total_mb INTEGER,
    heap_used_mb INTEGER,
    heap_max_mb INTEGER,
    heap_free_mb INTEGER,

    -- Capacity Utilization
    points_current INTEGER,
    points_limit INTEGER,
    points_percentage NUMERIC(5,2),
    devices_current INTEGER,
    devices_limit INTEGER,
    devices_percentage NUMERIC(5,2),
    networks_current INTEGER,
    histories_current INTEGER,
    links_current INTEGER,
    schedules_current INTEGER,

    -- Engine Performance
    engine_scan_usage_percent NUMERIC(5,2),
    engine_scan_recent_ms NUMERIC(10,3),
    engine_scan_peak_ms NUMERIC(10,3),
    engine_scan_lifetime_ms NUMERIC(10,3),

    -- File Descriptors
    fd_open INTEGER,
    fd_max INTEGER,

    -- System Uptime
    uptime_text TEXT,
    uptime_hours NUMERIC(10,2),

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- Session indexes
CREATE INDEX idx_pm_sessions_customer_id ON pm_workflow_sessions(customer_id);
CREATE INDEX idx_pm_sessions_technician_id ON pm_workflow_sessions(technician_id);
CREATE INDEX idx_pm_sessions_status ON pm_workflow_sessions(status);
CREATE INDEX idx_pm_sessions_start_time ON pm_workflow_sessions(start_time DESC);

-- Customer indexes
CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_customers_service_tier ON customers(service_tier);
CREATE INDEX idx_customers_primary_tech ON customers(primary_technician_id);

-- System baseline indexes
CREATE INDEX idx_baselines_session_id ON system_baselines(session_id);
CREATE INDEX idx_baselines_customer_id ON system_baselines(customer_id);
CREATE INDEX idx_baselines_date ON system_baselines(baseline_date DESC);
CREATE INDEX idx_baselines_health_score ON system_baselines(health_score);

-- Device inventory indexes
CREATE INDEX idx_bacnet_baseline_id ON bacnet_devices(baseline_id);
CREATE INDEX idx_bacnet_vendor ON bacnet_devices(vendor);
CREATE INDEX idx_bacnet_model ON bacnet_devices(model);
CREATE INDEX idx_n2_baseline_id ON n2_devices(baseline_id);
CREATE INDEX idx_network_baseline_id ON network_stations(baseline_id);

-- JSON indexes for flexible queries
CREATE INDEX idx_baselines_resource_data ON system_baselines USING GIN (resource_data);
CREATE INDEX idx_baselines_device_inventory ON system_baselines USING GIN (device_inventory);
CREATE INDEX idx_baselines_network_topology ON system_baselines USING GIN (network_topology);
CREATE INDEX idx_platform_modules ON platform_details USING GIN (modules);

-- ===================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ===================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at columns
CREATE TRIGGER update_pm_sessions_updated_at BEFORE UPDATE ON pm_workflow_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_access_updated_at BEFORE UPDATE ON site_access FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_site_safety_updated_at BEFORE UPDATE ON site_safety FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_handoff_updated_at BEFORE UPDATE ON project_handoff FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bms_systems_updated_at BEFORE UPDATE ON bms_systems FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_manual_inventory_updated_at BEFORE UPDATE ON manual_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_baselines_updated_at BEFORE UPDATE ON system_baselines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===================================================================

-- Enable RLS on all tables
ALTER TABLE pm_workflow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_safety ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_handoff ENABLE ROW LEVEL SECURITY;
ALTER TABLE bms_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE bacnet_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE n2_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_stations ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can access their own data)
CREATE POLICY pm_sessions_user_access ON pm_workflow_sessions
    FOR ALL USING (technician_id = auth.uid());

CREATE POLICY customers_user_access ON customers
    FOR ALL USING (created_by = auth.uid() OR assigned_technician = auth.uid());

-- Cascade policies for related tables
CREATE POLICY site_contacts_user_access ON site_contacts
    FOR ALL USING (
        session_id IN (SELECT id FROM pm_workflow_sessions WHERE technician_id = auth.uid())
    );

CREATE POLICY site_access_user_access ON site_access
    FOR ALL USING (
        session_id IN (SELECT id FROM pm_workflow_sessions WHERE technician_id = auth.uid())
    );

-- Add similar policies for all other tables...

-- ===================================================================
-- HELPER VIEWS FOR COMMON QUERIES
-- ===================================================================

-- Complete session overview
CREATE VIEW session_overview AS
SELECT
    s.id,
    s.customer_name,
    s.service_tier,
    s.current_phase,
    s.status,
    s.technician_name,
    s.start_time,
    s.last_saved,
    c.company_name,
    c.site_name,
    c.address,
    b.health_score as latest_health_score,
    COUNT(sp.id) as photo_count
FROM pm_workflow_sessions s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN system_baselines b ON s.id = b.session_id
LEFT JOIN system_photos sp ON s.id = sp.session_id
GROUP BY s.id, c.id, b.health_score;

-- Device inventory summary
CREATE VIEW device_inventory_summary AS
SELECT
    b.id as baseline_id,
    b.site_name,
    b.baseline_date,
    COUNT(bd.id) as bacnet_device_count,
    COUNT(nd.id) as n2_device_count,
    COUNT(ns.id) as network_station_count,
    b.total_devices,
    b.health_score
FROM system_baselines b
LEFT JOIN bacnet_devices bd ON b.id = bd.baseline_id
LEFT JOIN n2_devices nd ON b.id = nd.baseline_id
LEFT JOIN network_stations ns ON b.id = ns.baseline_id
GROUP BY b.id;

-- ===================================================================
-- COMMENTS FOR DOCUMENTATION
-- ===================================================================

COMMENT ON TABLE pm_workflow_sessions IS 'Master table for PM workflow assessment sessions';
COMMENT ON TABLE customers IS 'Enhanced customer information with technician assignments and integrations';
COMMENT ON TABLE system_baselines IS 'Comprehensive system snapshots for baseline analysis and reporting';
COMMENT ON TABLE bacnet_devices IS 'Detailed BACnet device inventory from Tridium exports';
COMMENT ON TABLE n2_devices IS 'Legacy N2 device inventory from Tridium exports';
COMMENT ON TABLE resource_metrics IS 'System performance and utilization metrics over time';
COMMENT ON COLUMN system_baselines.resource_data IS 'CPU, memory, heap usage, capacity utilization metrics (JSON)';
COMMENT ON COLUMN system_baselines.device_inventory IS 'Device counts, health stats, vendor/model breakdowns (JSON)';
COMMENT ON COLUMN system_baselines.network_topology IS 'Network structure, JACE stations, connection health (JSON)';
COMMENT ON COLUMN system_baselines.platform_details IS 'Hardware specs, modules, licenses, certificates (JSON)';

-- ===================================================================
-- SAMPLE QUERIES FOR REPORTS
-- ===================================================================

/*
-- Get complete assessment data for reporting
SELECT
    s.*,
    c.*,
    sa.*,
    ss.*,
    ph.*,
    bs.*,
    mi.*,
    sb.health_score,
    sb.total_devices,
    sb.resource_data,
    sb.device_inventory
FROM pm_workflow_sessions s
LEFT JOIN customers c ON s.customer_id = c.id
LEFT JOIN site_access sa ON s.id = sa.session_id
LEFT JOIN site_safety ss ON s.id = ss.session_id
LEFT JOIN project_handoff ph ON s.id = ph.session_id
LEFT JOIN bms_systems bs ON s.id = bs.session_id
LEFT JOIN manual_inventory mi ON s.id = mi.session_id
LEFT JOIN system_baselines sb ON s.id = sb.session_id
WHERE s.id = $1;

-- Get device health trends
SELECT
    baseline_date,
    health_score,
    device_inventory->>'health_percentage' as device_health,
    resource_data->>'cpu_usage' as cpu_usage,
    resource_data->>'memory_usage' as memory_usage
FROM system_baselines
WHERE customer_id = $1
ORDER BY baseline_date;

-- Get firmware version analysis
SELECT
    firmware_revision,
    vendor,
    model,
    COUNT(*) as device_count,
    ARRAY_AGG(device_name) as devices
FROM bacnet_devices bd
JOIN system_baselines sb ON bd.baseline_id = sb.id
WHERE sb.customer_id = $1
GROUP BY firmware_revision, vendor, model
ORDER BY device_count DESC;
*/