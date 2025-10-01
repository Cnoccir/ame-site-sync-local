-- Migration: Create reference tables for enhanced customer form dropdown data
-- This migration creates the reference tables that the DropdownDataService expects

-- Building Types Reference Table
CREATE TABLE IF NOT EXISTS building_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Architectures Reference Table
CREATE TABLE IF NOT EXISTS system_architectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  architecture_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- BAS Platforms Reference Table
CREATE TABLE IF NOT EXISTS bas_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_name VARCHAR(100) NOT NULL,
  platform_category VARCHAR(50),
  manufacturer VARCHAR(100),
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contact Roles Reference Table
CREATE TABLE IF NOT EXISTS contact_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Access Methods Reference Table
CREATE TABLE IF NOT EXISTS access_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  method_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Service Frequencies Reference Table (for future use)
CREATE TABLE IF NOT EXISTS service_frequencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frequency_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_building_types_active_order ON building_types(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_system_architectures_active_order ON system_architectures(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_bas_platforms_active_order ON bas_platforms(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_contact_roles_active_order ON contact_roles(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_access_methods_active_order ON access_methods(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_service_frequencies_active_order ON service_frequencies(is_active, display_order);

-- Add unique constraint for BAS platforms by category and name
CREATE UNIQUE INDEX IF NOT EXISTS idx_bas_platforms_unique ON bas_platforms(platform_name, platform_category);

-- Enable RLS on all tables
ALTER TABLE building_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_architectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE bas_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_frequencies ENABLE ROW LEVEL SECURITY;

-- Create policies for reading (all authenticated users can read)
CREATE POLICY "Enable read access for all users" ON building_types
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON system_architectures
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON bas_platforms
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON contact_roles
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON access_methods
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON service_frequencies
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin policies for full access - simplified for now (will be enhanced after ame_technicians table is created)
CREATE POLICY "Enable all operations for admins" ON building_types
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable all operations for admins" ON system_architectures
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable all operations for admins" ON bas_platforms
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable all operations for admins" ON contact_roles
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable all operations for admins" ON access_methods
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Enable all operations for admins" ON service_frequencies
  FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
