-- Drop existing tables to rebuild with proper normalization
DROP TABLE IF EXISTS ame_tasks CASCADE;
DROP TABLE IF EXISTS ame_sops CASCADE; 
DROP TABLE IF EXISTS ame_tools CASCADE;

-- Create lookup tables first
CREATE TABLE service_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_code TEXT NOT NULL UNIQUE CHECK (tier_code IN ('CORE', 'ASSURE', 'GUARDIAN')),
  tier_name TEXT NOT NULL,
  description TEXT,
  monthly_frequency INTEGER DEFAULT 1,
  annual_frequency INTEGER DEFAULT 12,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE system_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type_code TEXT NOT NULL UNIQUE,
  type_name TEXT NOT NULL,
  manufacturer TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE task_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  phase INTEGER DEFAULT 1 CHECK (phase IN (1, 2, 3, 4)),
  estimated_duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tool_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  safety_level TEXT DEFAULT 'standard' CHECK (safety_level IN ('standard', 'caution', 'warning', 'danger')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Normalized main tables
CREATE TABLE ame_customers_normalized (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  site_name TEXT NOT NULL,
  site_address TEXT NOT NULL,
  service_tier_id UUID REFERENCES service_tiers(id),
  system_type_id UUID REFERENCES system_types(id),
  contract_status TEXT DEFAULT 'Active' CHECK (contract_status IN ('Active', 'Inactive', 'Pending', 'Cancelled')),
  building_type TEXT,
  
  -- Contact Information
  primary_contact TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  emergency_contact TEXT,
  emergency_phone TEXT,
  emergency_email TEXT,
  security_contact TEXT,
  security_phone TEXT,
  
  -- Access Information
  building_access_type TEXT,
  building_access_details TEXT,
  access_hours TEXT,
  ppe_required BOOLEAN DEFAULT true,
  badge_required BOOLEAN DEFAULT false,
  training_required BOOLEAN DEFAULT false,
  safety_requirements TEXT,
  site_hazards TEXT,
  
  -- System Information
  bms_supervisor_ip INET,
  web_supervisor_url TEXT,
  workbench_username TEXT,
  workbench_password TEXT,
  platform_username TEXT,
  platform_password TEXT,
  remote_access BOOLEAN DEFAULT false,
  remote_access_type TEXT,
  vpn_required BOOLEAN DEFAULT false,
  vpn_details TEXT,
  
  -- Service Information
  last_service DATE,
  next_due DATE,
  technician_assigned TEXT,
  drive_folder_id TEXT,
  drive_folder_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  updated_by UUID
);

CREATE TABLE ame_sops_normalized (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sop_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category_id UUID REFERENCES task_categories(id),
  goal TEXT,
  steps JSONB DEFAULT '[]',
  best_practices TEXT,
  tools_required JSONB DEFAULT '[]',
  hyperlinks JSONB DEFAULT '[]',
  estimated_duration_minutes INTEGER DEFAULT 30,
  version TEXT DEFAULT '1.0',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ame_tasks_normalized (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id TEXT NOT NULL UNIQUE,
  task_name TEXT NOT NULL,
  category_id UUID REFERENCES task_categories(id),
  duration_minutes INTEGER DEFAULT 30,
  navigation_path TEXT,
  sop_steps TEXT,
  sop_template_sheet TEXT,
  quality_checks TEXT,
  prerequisites TEXT,
  skills_required TEXT,
  safety_notes TEXT,
  phase INTEGER DEFAULT 1 CHECK (phase IN (1, 2, 3, 4)),
  task_order INTEGER DEFAULT 1,
  is_mandatory BOOLEAN DEFAULT true,
  version TEXT DEFAULT '1.0',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE ame_tools_normalized (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id TEXT NOT NULL UNIQUE,
  tool_name TEXT NOT NULL,
  category_id UUID REFERENCES tool_categories(id),
  description TEXT,
  safety_category TEXT DEFAULT 'standard',
  calibration_required BOOLEAN DEFAULT false,
  vendor_link TEXT,
  request_method TEXT,
  alternative_tools TEXT,
  cost_estimate NUMERIC(10,2),
  maintenance_notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'retired')),
  current_stock INTEGER DEFAULT 0,
  minimum_stock INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Junction tables for many-to-many relationships
CREATE TABLE task_service_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ame_tasks_normalized(id) ON DELETE CASCADE,
  service_tier_id UUID REFERENCES service_tiers(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, service_tier_id)
);

CREATE TABLE task_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ame_tasks_normalized(id) ON DELETE CASCADE,
  tool_id UUID REFERENCES ame_tools_normalized(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, tool_id)
);

CREATE TABLE tool_service_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES ame_tools_normalized(id) ON DELETE CASCADE,
  service_tier_id UUID REFERENCES service_tiers(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tool_id, service_tier_id)
);

CREATE TABLE tool_system_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id UUID REFERENCES ame_tools_normalized(id) ON DELETE CASCADE,
  system_type_id UUID REFERENCES system_types(id) ON DELETE CASCADE,
  compatibility_level TEXT DEFAULT 'full' CHECK (compatibility_level IN ('full', 'partial', 'limited')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tool_id, system_type_id)
);

CREATE TABLE task_sops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES ame_tasks_normalized(id) ON DELETE CASCADE,
  sop_id UUID REFERENCES ame_sops_normalized(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'primary' CHECK (relationship_type IN ('primary', 'reference', 'alternative')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, sop_id, relationship_type)
);

-- Insert lookup data
INSERT INTO service_tiers (tier_code, tier_name, description, monthly_frequency, annual_frequency) VALUES
('CORE', 'Core Service', 'Essential maintenance and monitoring services for critical building systems', 1, 12),
('ASSURE', 'Assured Service', 'Enhanced preventive maintenance with predictive analytics and optimization', 2, 24),
('GUARDIAN', 'Guardian Service', 'Comprehensive service with 24/7 monitoring, priority response, and advanced analytics', 4, 48);

INSERT INTO system_types (type_code, type_name, manufacturer, description) VALUES
('NIAGARA_N4', 'Niagara N4', 'Tridium', 'Niagara Framework N4 building automation system'),
('NIAGARA_AX', 'Niagara AX', 'Tridium', 'Niagara Framework AX building automation system'),
('METASYS', 'Johnson Metasys', 'Johnson Controls', 'Metasys building automation and energy management system'),
('BACNET', 'BACnet System', 'Various', 'BACnet protocol compatible building automation system'),
('MODBUS', 'Modbus System', 'Various', 'Modbus protocol compatible building automation system'),
('LONWORKS', 'LonWorks System', 'Echelon', 'LonWorks protocol based building automation system');

INSERT INTO task_categories (category_name, description, phase, estimated_duration_minutes) VALUES
('Pre-Visit Setup', 'Initial preparation and tool verification', 1, 15),
('System Assessment', 'Initial system evaluation and documentation', 2, 30),
('Preventive Maintenance', 'Scheduled maintenance activities', 3, 45),
('System Optimization', 'Performance tuning and optimization', 3, 60),
('Backup & Recovery', 'System backup and recovery procedures', 3, 30),
('Documentation', 'System documentation and reporting', 4, 20),
('Quality Assurance', 'Final testing and validation', 4, 25);

INSERT INTO tool_categories (category_name, description, safety_level) VALUES
('Diagnostic Tools', 'Electronic testing and diagnostic equipment', 'standard'),
('Safety Equipment', 'Personal protective equipment and safety tools', 'warning'),
('Hand Tools', 'Manual tools for mechanical work', 'standard'),
('Electrical Tools', 'Electrical testing and measurement tools', 'caution'),
('Network Tools', 'Network testing and diagnostic equipment', 'standard'),
('Software Tools', 'Software applications and utilities', 'standard'),
('Calibration Tools', 'Precision measurement and calibration equipment', 'caution');

-- Create indexes for performance
CREATE INDEX idx_customers_service_tier ON ame_customers_normalized(service_tier_id);
CREATE INDEX idx_customers_system_type ON ame_customers_normalized(system_type_id);
CREATE INDEX idx_customers_customer_id ON ame_customers_normalized(customer_id);
CREATE INDEX idx_tasks_category ON ame_tasks_normalized(category_id);
CREATE INDEX idx_tasks_task_id ON ame_tasks_normalized(task_id);
CREATE INDEX idx_tools_category ON ame_tools_normalized(category_id);
CREATE INDEX idx_tools_tool_id ON ame_tools_normalized(tool_id);
CREATE INDEX idx_sops_category ON ame_sops_normalized(category_id);
CREATE INDEX idx_sops_sop_id ON ame_sops_normalized(sop_id);

-- Junction table indexes
CREATE INDEX idx_task_service_tiers_task ON task_service_tiers(task_id);
CREATE INDEX idx_task_service_tiers_tier ON task_service_tiers(service_tier_id);
CREATE INDEX idx_task_tools_task ON task_tools(task_id);
CREATE INDEX idx_task_tools_tool ON task_tools(tool_id);
CREATE INDEX idx_tool_service_tiers_tool ON tool_service_tiers(tool_id);
CREATE INDEX idx_tool_service_tiers_tier ON tool_service_tiers(service_tier_id);

-- Add updated_at triggers
CREATE TRIGGER update_service_tiers_updated_at BEFORE UPDATE ON service_tiers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_types_updated_at BEFORE UPDATE ON system_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_normalized_updated_at BEFORE UPDATE ON ame_customers_normalized FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE service_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ame_customers_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE ame_sops_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE ame_tasks_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE ame_tools_normalized ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_service_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_service_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_system_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_sops ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all lookup tables" ON service_tiers FOR SELECT USING (true);
CREATE POLICY "Users can view all lookup tables" ON system_types FOR SELECT USING (true);
CREATE POLICY "Users can view all lookup tables" ON task_categories FOR SELECT USING (true);
CREATE POLICY "Users can view all lookup tables" ON tool_categories FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage customers" ON ame_customers_normalized FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view customers" ON ame_customers_normalized FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage SOPs" ON ame_sops_normalized FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view SOPs" ON ame_sops_normalized FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage tasks" ON ame_tasks_normalized FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view tasks" ON ame_tasks_normalized FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage tools" ON ame_tools_normalized FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view tools" ON ame_tools_normalized FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage relationships" ON task_service_tiers FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view relationships" ON task_service_tiers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage relationships" ON task_tools FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view relationships" ON task_tools FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage relationships" ON tool_service_tiers FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view relationships" ON tool_service_tiers FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage relationships" ON tool_system_types FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view relationships" ON tool_system_types FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage relationships" ON task_sops FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view relationships" ON task_sops FOR SELECT USING (true);