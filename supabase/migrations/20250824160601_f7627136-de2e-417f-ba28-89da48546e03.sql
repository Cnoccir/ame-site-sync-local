-- Add service tier support to existing tables
ALTER TABLE ame_tasks_normalized ADD COLUMN IF NOT EXISTS service_tiers JSONB DEFAULT '["CORE", "ASSURE", "GUARDIAN"]';
ALTER TABLE ame_tasks_normalized ADD COLUMN IF NOT EXISTS tier_level TEXT DEFAULT 'CORE';
ALTER TABLE ame_tasks_normalized ADD COLUMN IF NOT EXISTS tier_order INTEGER DEFAULT 1;

ALTER TABLE ame_tools_normalized ADD COLUMN IF NOT EXISTS service_tiers JSONB DEFAULT '["CORE", "ASSURE", "GUARDIAN"]';
ALTER TABLE ame_tools_normalized ADD COLUMN IF NOT EXISTS tool_category TEXT DEFAULT 'essential';

ALTER TABLE ame_sops_normalized ADD COLUMN IF NOT EXISTS service_tier_minimum TEXT DEFAULT 'CORE';

-- Create service tier lookup table with correct structure
CREATE TABLE IF NOT EXISTS service_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier_code TEXT NOT NULL UNIQUE,
  tier_name TEXT NOT NULL,
  tier_order INTEGER NOT NULL,
  color_hex TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert service tier definitions
INSERT INTO service_tiers (tier_code, tier_name, tier_order, color_hex, description) VALUES
('CORE', 'Core Service', 1, '#d9534f', 'Essential maintenance tasks and basic tools'),
('ASSURE', 'Assure Service', 2, '#f0ad4e', 'Core plus advanced diagnostics and enhanced tools'),
('GUARDIAN', 'Guardian Service', 3, '#28a745', 'Complete service package with all tasks and premium tools')
ON CONFLICT (tier_code) DO NOTHING;

-- Create customer service tier tracking
CREATE TABLE IF NOT EXISTS customer_service_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  service_tier TEXT NOT NULL CHECK (service_tier IN ('CORE', 'ASSURE', 'GUARDIAN')),
  effective_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for efficient tier-based queries
CREATE INDEX IF NOT EXISTS idx_tasks_service_tiers ON ame_tasks_normalized USING gin(service_tiers);
CREATE INDEX IF NOT EXISTS idx_tools_service_tiers ON ame_tools_normalized USING gin(service_tiers);
CREATE INDEX IF NOT EXISTS idx_customer_service_tier ON customer_service_tiers (customer_id, service_tier);
CREATE INDEX IF NOT EXISTS idx_service_tiers_order ON service_tiers (tier_order);

-- Function to get inherited tiers for a given tier
CREATE OR REPLACE FUNCTION get_inherited_tiers(input_tier TEXT)
RETURNS TEXT[] AS $$
BEGIN
  CASE input_tier
    WHEN 'CORE' THEN RETURN ARRAY['CORE'];
    WHEN 'ASSURE' THEN RETURN ARRAY['CORE', 'ASSURE'];
    WHEN 'GUARDIAN' THEN RETURN ARRAY['CORE', 'ASSURE', 'GUARDIAN'];
    ELSE RETURN ARRAY['CORE'];
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;