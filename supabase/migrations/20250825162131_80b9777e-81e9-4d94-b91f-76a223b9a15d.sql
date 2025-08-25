-- Update ame_tasks_normalized table to handle rich task data format
ALTER TABLE ame_tasks_normalized 
ADD COLUMN IF NOT EXISTS service_tiers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS tools_required JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS sop_template_sheet TEXT,
ADD COLUMN IF NOT EXISTS quality_checks TEXT,
ADD COLUMN IF NOT EXISTS task_order INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS phase INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT true;

-- Create service tiers lookup table
CREATE TABLE IF NOT EXISTS ame_service_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  tier_code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  color TEXT NOT NULL,
  description TEXT,
  task_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert standard service tiers
INSERT INTO ame_service_tiers (tier_name, tier_code, display_name, color, description, task_count) VALUES
('CORE', 'CORE', 'Core Service', '#d9534f', 'Essential maintenance tasks and basic tools', 8),
('ASSURE', 'ASSURE', 'Assure Service', '#f0ad4e', 'Core plus advanced diagnostics and enhanced tools', 15),
('GUARDIAN', 'GUARDIAN', 'Guardian Service', '#28a745', 'Complete service package with all tasks and premium tools', 21)
ON CONFLICT (tier_code) DO NOTHING;

-- Create task categories lookup table  
CREATE TABLE IF NOT EXISTS ame_task_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  color TEXT DEFAULT '#6b7280',
  is_essential BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert common task categories
INSERT INTO ame_task_categories (category_name, description) VALUES
('System Backup', 'Backup and restore operations'),
('System Health', 'Performance monitoring and diagnostics'),
('Alarm Management', 'Alarm handling and resolution'),
('Control Optimization', 'Control loop and setpoint optimization'),
('System Maintenance', 'General system maintenance tasks'),
('Sensor Verification', 'Sensor calibration and verification'),
('Security', 'Security audits and management'),
('Documentation', 'Documentation updates and maintenance'),
('Network Health', 'Network diagnostics and monitoring'),
('Calibration', 'Equipment and sensor calibration'),
('Mechanical Testing', 'Valve and actuator testing'),
('Data Management', 'Database and history management'),
('Energy Management', 'Energy analysis and optimization'),
('Advanced Control', 'Advanced control system tuning'),
('Analytics', 'Analytics configuration and FDD'),
('Cybersecurity', 'Security assessment and hardening'),
('Network Optimization', 'Network performance optimization'),
('User Interface', 'Graphics and HMI enhancements'),
('Maintenance Planning', 'Preventive maintenance scheduling')
ON CONFLICT (category_name) DO NOTHING;

-- Add foreign key relationships
ALTER TABLE ame_tasks_normalized 
ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES ame_task_categories(id);

-- Enable RLS on new tables
ALTER TABLE ame_service_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ame_task_categories ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service tiers
CREATE POLICY "Users can view service tiers" 
ON ame_service_tiers FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage service tiers" 
ON ame_service_tiers FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for task categories  
CREATE POLICY "Users can view task categories" 
ON ame_task_categories FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage task categories" 
ON ame_task_categories FOR ALL 
USING (auth.uid() IS NOT NULL);

-- Add triggers for updated_at
CREATE TRIGGER update_ame_service_tiers_updated_at
  BEFORE UPDATE ON ame_service_tiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ame_task_categories_updated_at
  BEFORE UPDATE ON ame_task_categories  
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();