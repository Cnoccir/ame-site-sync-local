-- Create assessment_steps table
CREATE TABLE assessment_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES ame_visits(id),
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  start_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  form_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system_connections table
CREATE TABLE system_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES ame_visits(id),
  connection_type TEXT NOT NULL,
  ip_address TEXT,
  username TEXT,
  status TEXT DEFAULT 'not_tested' CHECK (status IN ('not_tested', 'testing', 'success', 'failed')),
  test_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create network_inventory table
CREATE TABLE network_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID REFERENCES ame_visits(id),
  analysis_data JSONB DEFAULT '{}',
  file_names TEXT[],
  total_stations INTEGER DEFAULT 0,
  protocols_found TEXT[],
  analysis_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE assessment_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE network_inventory ENABLE ROW LEVEL SECURITY;

-- Assessment steps policies
CREATE POLICY "Users can view assessment steps" ON assessment_steps FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage assessment steps" ON assessment_steps FOR ALL USING (auth.uid() IS NOT NULL);

-- System connections policies
CREATE POLICY "Users can view system connections" ON system_connections FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage system connections" ON system_connections FOR ALL USING (auth.uid() IS NOT NULL);

-- Network inventory policies
CREATE POLICY "Users can view network inventory" ON network_inventory FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage network inventory" ON network_inventory FOR ALL USING (auth.uid() IS NOT NULL);

-- Add triggers for updated_at
CREATE TRIGGER update_assessment_steps_updated_at
    BEFORE UPDATE ON assessment_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_assessment_steps_visit_id ON assessment_steps(visit_id);
CREATE INDEX idx_assessment_steps_step_number ON assessment_steps(visit_id, step_number);
CREATE INDEX idx_system_connections_visit_id ON system_connections(visit_id);
CREATE INDEX idx_network_inventory_visit_id ON network_inventory(visit_id);