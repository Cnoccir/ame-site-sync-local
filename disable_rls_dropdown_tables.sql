-- Alternative fix: Temporarily disable RLS on dropdown reference tables
-- This is a quick fix to get the dropdowns working while we troubleshoot authentication

-- Disable RLS on all dropdown tables
ALTER TABLE building_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE system_architectures DISABLE ROW LEVEL SECURITY;
ALTER TABLE bas_platforms DISABLE ROW LEVEL SECURITY;
ALTER TABLE contact_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE access_methods DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_frequencies DISABLE ROW LEVEL SECURITY;

-- Test that we can now read from all tables
SELECT 'building_types' as table_name, COUNT(*) as count FROM building_types
UNION ALL
SELECT 'system_architectures' as table_name, COUNT(*) as count FROM system_architectures
UNION ALL
SELECT 'bas_platforms' as table_name, COUNT(*) as count FROM bas_platforms
UNION ALL
SELECT 'contact_roles' as table_name, COUNT(*) as count FROM contact_roles
UNION ALL
SELECT 'access_methods' as table_name, COUNT(*) as count FROM access_methods
UNION ALL
SELECT 'service_frequencies' as table_name, COUNT(*) as count FROM service_frequencies;
