-- Service tiers lookup
CREATE TABLE IF NOT EXISTS service_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_code TEXT UNIQUE NOT NULL, -- CORE, ASSURE, GUARDIAN
  tier_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task categories lookup  
CREATE TABLE IF NOT EXISTS task_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT UNIQUE NOT NULL,
  description TEXT,
  phase INTEGER DEFAULT 1,
  estimated_duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Task-Service Tier relationships (many-to-many)
CREATE TABLE IF NOT EXISTS task_service_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES ame_tasks_normalized(id) ON DELETE CASCADE,
  service_tier_id UUID REFERENCES service_tiers(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, service_tier_id)
);

-- Task-Tool relationships (many-to-many) - update existing table
ALTER TABLE task_tools DROP CONSTRAINT IF EXISTS task_tools_tool_id_fkey;
ALTER TABLE task_tools ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1;

-- System types lookup table
CREATE TABLE IF NOT EXISTS system_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type_code TEXT UNIQUE NOT NULL,
  type_name TEXT NOT NULL,
  manufacturer TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tool-System Type relationships (many-to-many)
CREATE TABLE IF NOT EXISTS tool_system_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID REFERENCES ame_tools_normalized(id) ON DELETE CASCADE,
  system_type_id UUID REFERENCES system_types(id) ON DELETE CASCADE,
  compatibility_level TEXT DEFAULT 'full',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tool_id, system_type_id)
);

-- Tool-Service Tier relationships (many-to-many)
CREATE TABLE IF NOT EXISTS tool_service_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id UUID REFERENCES ame_tools_normalized(id) ON DELETE CASCADE,
  service_tier_id UUID REFERENCES service_tiers(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tool_id, service_tier_id)
);

-- Task-SOP relationships (many-to-many)
CREATE TABLE IF NOT EXISTS task_sops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES ame_tasks_normalized(id) ON DELETE CASCADE,
  sop_id UUID REFERENCES ame_sops_normalized(id) ON DELETE CASCADE,
  relationship_type TEXT DEFAULT 'primary',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, sop_id)
);

-- Insert service tiers
INSERT INTO service_tiers (tier_code, tier_name, description) VALUES
  ('CORE', 'Core Service', 'Basic maintenance and monitoring'),
  ('ASSURE', 'Assure Service', 'Enhanced maintenance with diagnostics'), 
  ('GUARDIAN', 'Guardian Service', 'Premium service with advanced analytics')
ON CONFLICT (tier_code) DO NOTHING;

-- Insert task categories (extracted from CSV)
INSERT INTO task_categories (category_name, description) VALUES
  ('System Backup', 'Backup and recovery operations'),
  ('System Health', 'Health monitoring and diagnostics'),
  ('Alarm Management', 'Alarm handling and resolution'),
  ('Control Optimization', 'Control system optimization'),
  ('System Maintenance', 'General system maintenance'),
  ('Sensor Verification', 'Sensor testing and calibration'),
  ('Security', 'Security auditing and management'),
  ('Documentation', 'Documentation maintenance'),
  ('Network Health', 'Network diagnostics and health'),
  ('Calibration', 'Equipment calibration'),
  ('Mechanical Testing', 'Physical equipment testing'),
  ('Data Management', 'Database and data operations'),
  ('Energy Management', 'Energy analysis and optimization'),
  ('Advanced Control', 'Advanced control algorithms'),
  ('Analytics', 'Analytics configuration'),
  ('Cybersecurity', 'Cybersecurity assessment'),
  ('Network Optimization', 'Network performance optimization'),
  ('User Interface', 'HMI and interface management'),
  ('Maintenance Planning', 'Preventive maintenance planning')
ON CONFLICT (category_name) DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE service_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_service_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_system_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_service_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_sops ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_types ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all lookup tables" ON service_tiers FOR SELECT USING (true);
CREATE POLICY "Users can view all lookup tables" ON task_categories FOR SELECT USING (true);
CREATE POLICY "Users can view all lookup tables" ON system_types FOR SELECT USING (true);

CREATE POLICY "Users can view relationships" ON task_service_tiers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage relationships" ON task_service_tiers FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view relationships" ON tool_system_types FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage relationships" ON tool_system_types FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view relationships" ON tool_service_tiers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage relationships" ON tool_service_tiers FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view relationships" ON task_sops FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage relationships" ON task_sops FOR ALL USING (auth.uid() IS NOT NULL);

-- Add updated_at trigger to new tables
CREATE TRIGGER update_service_tiers_updated_at
  BEFORE UPDATE ON service_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_types_updated_at
  BEFORE UPDATE ON system_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();