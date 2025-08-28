-- Fix RLS policies for dropdown reference tables
-- Run this in your Supabase SQL Editor to fix the authentication issues

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON building_types;
DROP POLICY IF EXISTS "Enable read access for all users" ON system_architectures;
DROP POLICY IF EXISTS "Enable read access for all users" ON bas_platforms;
DROP POLICY IF EXISTS "Enable read access for all users" ON contact_roles;
DROP POLICY IF EXISTS "Enable read access for all users" ON access_methods;
DROP POLICY IF EXISTS "Enable read access for all users" ON service_frequencies;

-- Create new policies that work with authenticated users
CREATE POLICY "Allow read access to authenticated users" ON building_types
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to authenticated users" ON system_architectures
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to authenticated users" ON bas_platforms
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to authenticated users" ON contact_roles
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to authenticated users" ON access_methods
  FOR SELECT USING (true);

CREATE POLICY "Allow read access to authenticated users" ON service_frequencies
  FOR SELECT USING (true);

-- Test queries to verify the tables are accessible
SELECT 'building_types' as table_name, COUNT(*) as count FROM building_types LIMIT 5;
SELECT 'system_architectures' as table_name, COUNT(*) as count FROM system_architectures LIMIT 5;
SELECT 'bas_platforms' as table_name, COUNT(*) as count FROM bas_platforms LIMIT 5;
SELECT 'contact_roles' as table_name, COUNT(*) as count FROM contact_roles LIMIT 5;
SELECT 'access_methods' as table_name, COUNT(*) as count FROM access_methods LIMIT 5;
SELECT 'service_frequencies' as table_name, COUNT(*) as count FROM service_frequencies LIMIT 5;
