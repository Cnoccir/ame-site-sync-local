-- Create service tier tasks table
CREATE TABLE IF NOT EXISTS service_tier_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_tier TEXT NOT NULL CHECK (service_tier IN ('CORE', 'ASSURE', 'GUARDIAN')),
  category TEXT NOT NULL,
  task_name TEXT NOT NULL,
  description TEXT,
  estimated_duration INTEGER NOT NULL DEFAULT 30, -- minutes
  is_required BOOLEAN DEFAULT true,
  prerequisites TEXT[],
  tools_required TEXT[],
  sop_content JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create visit tasks table
CREATE TABLE IF NOT EXISTS visit_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id TEXT NOT NULL,
  task_id UUID REFERENCES service_tier_tasks(id),
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  start_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  actual_duration INTEGER, -- minutes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create task procedures table (renamed from task_sops to avoid conflicts)
CREATE TABLE IF NOT EXISTS task_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES service_tier_tasks(id),
  procedure_title TEXT NOT NULL,
  procedure_category TEXT,
  procedure_steps JSONB NOT NULL DEFAULT '[]', -- array of step objects
  visual_guides JSONB DEFAULT '[]', -- images/videos
  additional_resources JSONB DEFAULT '[]', -- links/docs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for all tables
ALTER TABLE service_tier_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_procedures ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view all service tier tasks" ON service_tier_tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage service tier tasks" ON service_tier_tasks FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view visit tasks" ON visit_tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage visit tasks" ON visit_tasks FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view task procedures" ON task_procedures FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage task procedures" ON task_procedures FOR ALL USING (auth.uid() IS NOT NULL);

-- Insert sample data for CORE tier
INSERT INTO service_tier_tasks (service_tier, category, task_name, description, estimated_duration, prerequisites, tools_required, sort_order) VALUES
('CORE', 'System Maintenance', 'System Status Review', 'Review overall system health and operational status', 30, '{}', '{"System Monitor", "Status Panel"}', 1),
('CORE', 'System Maintenance', 'Basic Alarm Check', 'Check and acknowledge any active alarms', 20, '{}', '{"Alarm Interface", "Log Viewer"}', 2),
('CORE', 'Network Testing', 'Communication Verification', 'Verify all communication paths are functional', 45, '{"System Status Review"}', '{"Network Tester", "Communication Interface"}', 3),
('CORE', 'Data Management', 'System Backup', 'Perform routine system backup procedures', 30, '{}', '{"Backup Interface", "Storage Media"}', 4),
('CORE', 'Performance', 'Basic Performance Check', 'Monitor system performance metrics', 25, '{"System Status Review"}', '{"Performance Monitor", "Trend Viewer"}', 5),
('CORE', 'Safety', 'Safety System Test', 'Test critical safety systems and interlocks', 40, '{"System Status Review"}', '{"Safety Interface", "Test Equipment"}', 6);

-- Insert sample data for ASSURE tier (includes all CORE tasks plus additional)
INSERT INTO service_tier_tasks (service_tier, category, task_name, description, estimated_duration, prerequisites, tools_required, sort_order) VALUES
('ASSURE', 'System Maintenance', 'System Status Review', 'Review overall system health and operational status', 30, '{}', '{"System Monitor", "Status Panel"}', 1),
('ASSURE', 'System Maintenance', 'Basic Alarm Check', 'Check and acknowledge any active alarms', 20, '{}', '{"Alarm Interface", "Log Viewer"}', 2),
('ASSURE', 'Network Testing', 'Communication Verification', 'Verify all communication paths are functional', 45, '{"System Status Review"}', '{"Network Tester", "Communication Interface"}', 3),
('ASSURE', 'Data Management', 'System Backup', 'Perform routine system backup procedures', 30, '{}', '{"Backup Interface", "Storage Media"}', 4),
('ASSURE', 'Performance', 'Basic Performance Check', 'Monitor system performance metrics', 25, '{"System Status Review"}', '{"Performance Monitor", "Trend Viewer"}', 5),
('ASSURE', 'Safety', 'Safety System Test', 'Test critical safety systems and interlocks', 40, '{"System Status Review"}', '{"Safety Interface", "Test Equipment"}', 6),
('ASSURE', 'Analytics', 'Detailed Trending Analysis', 'Analyze historical trends and system patterns', 45, '{"Basic Performance Check"}', '{"Trend Analyzer", "Historical Data"}', 7),
('ASSURE', 'Calibration', 'Equipment Calibration Check', 'Verify and adjust equipment calibration', 60, '{"System Status Review"}', '{"Calibration Tools", "Reference Standards"}', 8),
('ASSURE', 'Diagnostics', 'Advanced Diagnostics', 'Run comprehensive system diagnostic tests', 50, '{"System Status Review", "Basic Performance Check"}', '{"Diagnostic Suite", "Test Interface"}', 9),
('ASSURE', 'Maintenance', 'Preventive Maintenance Tasks', 'Perform scheduled preventive maintenance activities', 90, '{"Safety System Test"}', '{"Maintenance Kit", "Cleaning Supplies", "Replacement Parts"}', 10);

-- Insert sample data for GUARDIAN tier (includes all ASSURE tasks plus premium)
INSERT INTO service_tier_tasks (service_tier, category, task_name, description, estimated_duration, prerequisites, tools_required, sort_order) VALUES
('GUARDIAN', 'System Maintenance', 'System Status Review', 'Review overall system health and operational status', 30, '{}', '{"System Monitor", "Status Panel"}', 1),
('GUARDIAN', 'System Maintenance', 'Basic Alarm Check', 'Check and acknowledge any active alarms', 20, '{}', '{"Alarm Interface", "Log Viewer"}', 2),
('GUARDIAN', 'Network Testing', 'Communication Verification', 'Verify all communication paths are functional', 45, '{"System Status Review"}', '{"Network Tester", "Communication Interface"}', 3),
('GUARDIAN', 'Data Management', 'System Backup', 'Perform routine system backup procedures', 30, '{}', '{"Backup Interface", "Storage Media"}', 4),
('GUARDIAN', 'Performance', 'Basic Performance Check', 'Monitor system performance metrics', 25, '{"System Status Review"}', '{"Performance Monitor", "Trend Viewer"}', 5),
('GUARDIAN', 'Safety', 'Safety System Test', 'Test critical safety systems and interlocks', 40, '{"System Status Review"}', '{"Safety Interface", "Test Equipment"}', 6),
('GUARDIAN', 'Analytics', 'Detailed Trending Analysis', 'Analyze historical trends and system patterns', 45, '{"Basic Performance Check"}', '{"Trend Analyzer", "Historical Data"}', 7),
('GUARDIAN', 'Calibration', 'Equipment Calibration Check', 'Verify and adjust equipment calibration', 60, '{"System Status Review"}', '{"Calibration Tools", "Reference Standards"}', 8),
('GUARDIAN', 'Diagnostics', 'Advanced Diagnostics', 'Run comprehensive system diagnostic tests', 50, '{"System Status Review", "Basic Performance Check"}', '{"Diagnostic Suite", "Test Interface"}', 9),
('GUARDIAN', 'Maintenance', 'Preventive Maintenance Tasks', 'Perform scheduled preventive maintenance activities', 90, '{"Safety System Test"}', '{"Maintenance Kit", "Cleaning Supplies", "Replacement Parts"}', 10),
('GUARDIAN', 'Optimization', 'Comprehensive System Optimization', 'Optimize system settings and configurations for peak performance', 120, '{"Advanced Diagnostics", "Detailed Trending Analysis"}', '{"Optimization Suite", "Configuration Tools", "Performance Analyzer"}', 11),
('GUARDIAN', 'Analytics', 'Energy Analysis Report', 'Generate comprehensive energy usage and efficiency report', 90, '{"Detailed Trending Analysis"}', '{"Energy Analyzer", "Report Generator", "Trend Tools"}', 12),
('GUARDIAN', 'Predictive', 'Predictive Maintenance Review', 'Review predictive maintenance indicators and recommendations', 75, '{"Equipment Calibration Check", "Advanced Diagnostics"}', '{"Predictive Tools", "AI Analyzer", "Condition Monitors"}', 13),
('GUARDIAN', 'Programming', 'Custom Programming Updates', 'Update and optimize custom programming and logic', 180, '{"Comprehensive System Optimization"}', '{"Programming Interface", "Logic Editor", "Compiler Tools", "Debug Interface"}', 14);

-- Insert sample procedure data
INSERT INTO task_procedures (task_id, procedure_title, procedure_category, procedure_steps, visual_guides, additional_resources) 
SELECT id, task_name || ' SOP', category, 
JSONB_BUILD_ARRAY(
  JSONB_BUILD_OBJECT('step', 1, 'title', 'Preparation', 'description', 'Gather required tools and review safety procedures', 'duration', 5),
  JSONB_BUILD_OBJECT('step', 2, 'title', 'Initial Check', 'description', 'Perform initial system status verification', 'duration', 10),
  JSONB_BUILD_OBJECT('step', 3, 'title', 'Main Procedure', 'description', 'Execute the main task procedure following established protocols', 'duration', estimated_duration - 15),
  JSONB_BUILD_OBJECT('step', 4, 'title', 'Verification', 'description', 'Verify task completion and document results', 'duration', 5)
),
JSONB_BUILD_ARRAY(
  JSONB_BUILD_OBJECT('type', 'image', 'title', 'System Interface', 'url', '/images/system-interface.png'),
  JSONB_BUILD_OBJECT('type', 'diagram', 'title', 'Workflow Diagram', 'url', '/images/workflow-diagram.png')
),
JSONB_BUILD_ARRAY(
  JSONB_BUILD_OBJECT('type', 'manual', 'title', 'System Manual', 'url', '/docs/system-manual.pdf'),
  JSONB_BUILD_OBJECT('type', 'reference', 'title', 'Safety Guidelines', 'url', '/docs/safety-guidelines.pdf')
)
FROM service_tier_tasks;

-- Add triggers for updated_at
CREATE OR REPLACE TRIGGER update_visit_tasks_updated_at 
BEFORE UPDATE ON visit_tasks 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_task_procedures_updated_at 
BEFORE UPDATE ON task_procedures 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();