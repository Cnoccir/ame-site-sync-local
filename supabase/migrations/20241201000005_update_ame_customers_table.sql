-- Migration: Update ame_customers table for enhanced customer form fields
-- This migration adds all the missing columns to support the enhanced Customer interface

-- Add missing enhanced basic information fields
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS system_architecture VARCHAR(100);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS primary_bas_platform VARCHAR(100);

-- Add missing enhanced contact information fields
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS contact_name VARCHAR(200);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS contact_role VARCHAR(100);

-- Add missing enhanced access information fields
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS access_method VARCHAR(100);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS parking_instructions TEXT;
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS special_access_notes TEXT;

-- Add missing additional contact fields
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS technical_contact VARCHAR(200);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS technical_phone VARCHAR(50);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS technical_email VARCHAR(200);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS billing_contact VARCHAR(200);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS billing_phone VARCHAR(50);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS billing_email VARCHAR(200);

-- Add missing site intelligence system fields
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS site_nickname VARCHAR(100);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS site_number VARCHAR(50);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS primary_technician_id UUID REFERENCES ame_technicians(id);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_id UUID REFERENCES ame_technicians(id);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS primary_technician_name VARCHAR(200);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_name VARCHAR(200);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS last_job_numbers TEXT[]; -- Array of strings
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS system_platform VARCHAR(50);

-- Add enhanced team context fields
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS last_visit_by VARCHAR(200);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS last_visit_date VARCHAR(50); -- ISO date string
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS site_experience VARCHAR(20);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS handoff_notes TEXT;

-- Add enhanced access intelligence fields
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS best_arrival_times TEXT[]; -- Array of strings
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS poc_name VARCHAR(200);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS poc_phone VARCHAR(50);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS poc_available_hours VARCHAR(200);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS backup_contact VARCHAR(200);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS access_approach TEXT;
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS common_access_issues TEXT[]; -- Array of strings
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS scheduling_notes TEXT;

-- Add enhanced project status fields
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS completion_status VARCHAR(50);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS commissioning_notes TEXT;
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS known_issues TEXT[]; -- Array of strings
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS documentation_score INTEGER;
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS original_team_contact VARCHAR(200);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS original_team_role VARCHAR(100);
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS original_team_info TEXT;
ALTER TABLE ame_customers ADD COLUMN IF NOT EXISTS when_to_contact_original TEXT;

-- Add constraints for enum-like fields
ALTER TABLE ame_customers ADD CONSTRAINT IF NOT EXISTS chk_site_experience 
  CHECK (site_experience IN ('first_time', 'familiar', 'expert') OR site_experience IS NULL);

ALTER TABLE ame_customers ADD CONSTRAINT IF NOT EXISTS chk_completion_status 
  CHECK (completion_status IN ('Design', 'Construction', 'Commissioning', 'Operational', 'Warranty') OR completion_status IS NULL);

ALTER TABLE ame_customers ADD CONSTRAINT IF NOT EXISTS chk_system_platform 
  CHECK (system_platform IN ('N4', 'FX', 'WEBs', 'Mixed-ALC', 'EBI-Honeywell', 'Other') OR system_platform IS NULL);

ALTER TABLE ame_customers ADD CONSTRAINT IF NOT EXISTS chk_documentation_score 
  CHECK (documentation_score >= 0 AND documentation_score <= 100 OR documentation_score IS NULL);

-- Add indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_ame_customers_primary_technician_id ON ame_customers(primary_technician_id);
CREATE INDEX IF NOT EXISTS idx_ame_customers_secondary_technician_id ON ame_customers(secondary_technician_id);
CREATE INDEX IF NOT EXISTS idx_ame_customers_site_number ON ame_customers(site_number);
CREATE INDEX IF NOT EXISTS idx_ame_customers_system_platform ON ame_customers(system_platform);
CREATE INDEX IF NOT EXISTS idx_ame_customers_completion_status ON ame_customers(completion_status);

-- Add comments to document the new fields
COMMENT ON COLUMN ame_customers.system_architecture IS 'System architecture type (e.g., Centralized, Distributed, Hierarchical)';
COMMENT ON COLUMN ame_customers.primary_bas_platform IS 'Primary BAS platform/manufacturer (e.g., Niagara N4, Johnson Metasys)';
COMMENT ON COLUMN ame_customers.contact_name IS 'Name of primary contact person';
COMMENT ON COLUMN ame_customers.contact_role IS 'Role/title of primary contact person';
COMMENT ON COLUMN ame_customers.access_method IS 'Method for gaining site access (e.g., Key/Lock Box, Card Access)';
COMMENT ON COLUMN ame_customers.parking_instructions IS 'Instructions for where to park and site approach';
COMMENT ON COLUMN ame_customers.special_access_notes IS 'Special notes or considerations for site access';
COMMENT ON COLUMN ame_customers.site_nickname IS 'Quick reference nickname for the site';
COMMENT ON COLUMN ame_customers.site_number IS 'Unique persistent site identifier (e.g., AME-YYYY-###)';
COMMENT ON COLUMN ame_customers.primary_technician_id IS 'UUID of primary assigned technician';
COMMENT ON COLUMN ame_customers.secondary_technician_id IS 'UUID of secondary assigned technician';
COMMENT ON COLUMN ame_customers.primary_technician_name IS 'Name of primary technician (derived from lookup)';
COMMENT ON COLUMN ame_customers.secondary_technician_name IS 'Name of secondary technician (derived from lookup)';
COMMENT ON COLUMN ame_customers.last_job_numbers IS 'Array of historical job numbers for this site';
COMMENT ON COLUMN ame_customers.system_platform IS 'Primary BAS platform category (N4, FX, WEBs, etc.)';
COMMENT ON COLUMN ame_customers.site_experience IS 'Technician experience level with this site (first_time, familiar, expert)';
COMMENT ON COLUMN ame_customers.completion_status IS 'Project completion status (Design, Construction, Commissioning, etc.)';
COMMENT ON COLUMN ame_customers.documentation_score IS 'Documentation completeness score (0-100)';

-- Update the RLS policies if needed (they should already be in place from previous migrations)
