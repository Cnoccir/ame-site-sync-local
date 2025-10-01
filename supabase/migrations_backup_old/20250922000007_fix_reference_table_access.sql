-- ===================================================================
-- FIX REFERENCE TABLE ACCESS
-- Reference tables like simpro_customers should be publicly readable
-- ===================================================================

-- Disable RLS on reference tables that should be publicly accessible
ALTER TABLE simpro_customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE simpro_customer_contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_sop_library DISABLE ROW LEVEL SECURITY;
ALTER TABLE ame_employees DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on any other reference tables that should be public
DO $$
BEGIN
    -- Check if tables exist before disabling RLS
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ame_tool_catalog') THEN
        ALTER TABLE ame_tool_catalog DISABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'building_types') THEN
        ALTER TABLE building_types DISABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_architectures') THEN
        ALTER TABLE system_architectures DISABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bas_platforms') THEN
        ALTER TABLE bas_platforms DISABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'access_methods') THEN
        ALTER TABLE access_methods DISABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_roles') THEN
        ALTER TABLE contact_roles DISABLE ROW LEVEL SECURITY;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'service_frequencies') THEN
        ALTER TABLE service_frequencies DISABLE ROW LEVEL SECURITY;
    END IF;
END
$$;

-- Reference tables should be accessible to everyone for lookups
COMMENT ON TABLE simpro_customers IS 'Reference table - public read access for customer lookups';
COMMENT ON TABLE task_sop_library IS 'Reference table - public read access for task/SOP lookups';
COMMENT ON TABLE ame_employees IS 'Reference table - public read access for employee/technician lookups';