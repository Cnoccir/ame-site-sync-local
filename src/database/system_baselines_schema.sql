-- System Baselines Table for storing comprehensive system inventory and health data
CREATE TABLE IF NOT EXISTS system_baselines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    site_name TEXT NOT NULL,
    baseline_date TIMESTAMPTZ NOT NULL,
    system_architecture TEXT CHECK (system_architecture IN ('single-jace', 'multi-jace', 'supervisor')),
    niagara_version TEXT,
    total_devices INTEGER DEFAULT 0,
    total_points INTEGER DEFAULT 0,

    -- Resource utilization data (JSONB for flexible schema)
    resource_data JSONB,

    -- Device inventory summary (JSONB for flexible schema)
    device_inventory JSONB,

    -- Network topology information (JSONB for flexible schema)
    network_topology JSONB,

    -- Platform details (JSONB for flexible schema)
    platform_details JSONB,

    -- Overall health score (0-100)
    health_score INTEGER CHECK (health_score >= 0 AND health_score <= 100),

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes for efficient querying
    CONSTRAINT system_baselines_unique_site_date UNIQUE (customer_id, site_name, baseline_date)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_system_baselines_customer_id ON system_baselines(customer_id);
CREATE INDEX IF NOT EXISTS idx_system_baselines_site_name ON system_baselines(site_name);
CREATE INDEX IF NOT EXISTS idx_system_baselines_baseline_date ON system_baselines(baseline_date DESC);
CREATE INDEX IF NOT EXISTS idx_system_baselines_health_score ON system_baselines(health_score);
CREATE INDEX IF NOT EXISTS idx_system_baselines_architecture ON system_baselines(system_architecture);

-- Create GIN index for JSONB fields for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_system_baselines_resource_data ON system_baselines USING GIN (resource_data);
CREATE INDEX IF NOT EXISTS idx_system_baselines_device_inventory ON system_baselines USING GIN (device_inventory);
CREATE INDEX IF NOT EXISTS idx_system_baselines_network_topology ON system_baselines USING GIN (network_topology);
CREATE INDEX IF NOT EXISTS idx_system_baselines_platform_details ON system_baselines USING GIN (platform_details);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_system_baselines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER system_baselines_update_timestamp
    BEFORE UPDATE ON system_baselines
    FOR EACH ROW
    EXECUTE FUNCTION update_system_baselines_updated_at();

-- Row Level Security (RLS) policies
ALTER TABLE system_baselines ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access baselines for their customers
CREATE POLICY system_baselines_user_access ON system_baselines
    FOR ALL USING (
        customer_id IN (
            SELECT c.id FROM customers c
            WHERE c.created_by = auth.uid() OR c.assigned_technician = auth.uid()
        )
    );

-- Policy: Allow insert for authenticated users
CREATE POLICY system_baselines_insert ON system_baselines
    FOR INSERT WITH CHECK (
        customer_id IN (
            SELECT c.id FROM customers c
            WHERE c.created_by = auth.uid() OR c.assigned_technician = auth.uid()
        )
    );

-- Policy: Allow updates for baseline owners
CREATE POLICY system_baselines_update ON system_baselines
    FOR UPDATE USING (
        customer_id IN (
            SELECT c.id FROM customers c
            WHERE c.created_by = auth.uid() OR c.assigned_technician = auth.uid()
        )
    );

-- Add comments for documentation
COMMENT ON TABLE system_baselines IS 'Stores comprehensive system baselines for BMS/Tridium system assessments';
COMMENT ON COLUMN system_baselines.resource_data IS 'CPU, memory, heap usage, capacity utilization metrics';
COMMENT ON COLUMN system_baselines.device_inventory IS 'BACnet and N2 device counts, health statistics, vendor/model breakdowns';
COMMENT ON COLUMN system_baselines.network_topology IS 'JACE stations, network segments, connection health';
COMMENT ON COLUMN system_baselines.platform_details IS 'Hardware specs, modules, licenses, certificates';
COMMENT ON COLUMN system_baselines.health_score IS 'Overall system health score (0-100) calculated from all metrics';

-- Example queries for common use cases:

-- Get latest baseline for a customer site
-- SELECT * FROM system_baselines
-- WHERE customer_id = $1 AND site_name = $2
-- ORDER BY baseline_date DESC LIMIT 1;

-- Compare health scores over time
-- SELECT baseline_date, health_score, total_devices, total_points
-- FROM system_baselines
-- WHERE customer_id = $1 AND site_name = $2
-- ORDER BY baseline_date;

-- Find systems with low health scores
-- SELECT customer_id, site_name, health_score, baseline_date
-- FROM system_baselines
-- WHERE health_score < 75
-- ORDER BY health_score ASC;

-- Extract specific resource metrics
-- SELECT site_name,
--        resource_data->>'cpu_usage' as cpu_usage,
--        resource_data->>'memory_usage' as memory_usage,
--        resource_data->'capacity_utilization'->>'points' as points_utilization
-- FROM system_baselines
-- WHERE baseline_date >= NOW() - INTERVAL '30 days';