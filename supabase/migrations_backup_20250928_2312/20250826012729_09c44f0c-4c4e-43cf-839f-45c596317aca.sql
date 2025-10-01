-- First check if task_tools table exists, and if so, handle the foreign key constraint
DO $$ 
BEGIN
  -- Check if task_tools table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'task_tools') THEN
    -- Clear task_tools table first to avoid foreign key constraint issues
    TRUNCATE TABLE task_tools CASCADE;
  END IF;
END $$;

-- Add missing columns to ame_tools_normalized table
ALTER TABLE ame_tools_normalized 
ADD COLUMN IF NOT EXISTS required_for_tasks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS service_tiers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS system_types JSONB DEFAULT '[]'::jsonb;

-- Clear and repopulate the tools table with comprehensive data
TRUNCATE TABLE ame_tools_normalized CASCADE;

-- Insert the comprehensive tool data with proper service tier and task linkages
INSERT INTO ame_tools_normalized (
  tool_id, tool_name, description, safety_category, calibration_required,
  vendor_link, request_method, alternative_tools, cost_estimate, 
  maintenance_notes, status, required_for_tasks, service_tiers, system_types
) VALUES 
-- Safety Tools (All Tiers)
('TOOL_013', 'PPE Gear Bags (Blue/Orange)', 
 'PPE Gear Bags containing: hard hat; safety glasses; high-visibility vest; gloves; ear protection',
 'required', false, '', 'Safety Department - PPE Request Form SAF-001', '', 200, '', 'active',
 '["ALL_TASKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_014', 'Ladders & Safety Harnesses',
 'Ladders (of appropriate height) & certified safety harnesses for elevated work',
 'site_required', false, '', 'Safety Department - PPE Request Form SAF-001', '', 200, '', 'active',
 '["ALL_TASKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Electrical Tools (All Tiers)
('TOOL_016', 'LED Headlamp',
 'LED headlamp for hands-free illumination',
 'recommended', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_017', 'Digital Multimeter',
 'Fluke 87V or ruggedized 87V MAX True-RMS multimeter',
 'recommended', true, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_018', 'Temperature/Humidity Meter',
 'Fluke 971 Thermo-Hygrometer for temperature and humidity readings',
 'recommended', true, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 800, '', 'active',
 '["SENSOR_CALIBRATION", "SYSTEM_VERIFICATION", "PERFORMANCE_TESTING"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_019', 'Infrared Thermometer',
 'Raytek MiniTemp RAYMT4U or Fluke 62 MAX infrared thermometer',
 'recommended', true, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 800, '', 'active',
 '["SENSOR_CALIBRATION", "SYSTEM_VERIFICATION", "PERFORMANCE_TESTING"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_020', 'Clamp Meter',
 'Fluke 376 or 902 FC clamp meter',
 'recommended', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_022', 'Assorted Insulated Hand-Tool Set',
 'Insulated screwdrivers, pliers, nut drivers, adjustable wrenches, hex keys, Torx bits',
 'recommended', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_029', 'Laptop Computer',
 'Primary laptop with Ethernet, USB, and Wi-Fi interfaces',
 'optional', false, '', 'IT Department - Equipment Request Form IT-001', '', 3000, '', 'active',
 '["SYSTEM_ACCESS", "BACKUP", "CONFIGURATION"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Advanced Tools (ASSURE & GUARDIAN)
('TOOL_015', 'Pneumatic Service Kit',
 'Pneumatic Service Kit (gauge, tubing, fittings, aspirator bulb) for calibrating legacy pneumatic controls',
 'recommended', true, '', 'Calibration Lab - Precision Instrument Request CAL-001', '', 2000, '', 'active',
 '["SENSOR_CALIBRATION", "SYSTEM_VERIFICATION", "PERFORMANCE_TESTING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_021', 'Digital Manometer',
 'Dwyer 475-1-FM digital manometer',
 'recommended', true, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 800, '', 'active',
 '["SENSOR_CALIBRATION", "SYSTEM_VERIFICATION", "PERFORMANCE_TESTING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_041', 'Tridium Niagara Workbench',
 'Niagara Workbench N4 v4.10/4.11',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 2000, '', 'active',
 '["SYSTEM_ACCESS", "BACKUP", "CONFIGURATION"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

-- GUARDIAN Only Tools
('TOOL_054', '7-Zip',
 'File compression and decompression utility',
 'optional', false, '', 'General Supply - Standard Request Form GEN-001', '', 2000, '', 'active',
 '["GENERAL_MAINTENANCE"]'::jsonb, '["GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_055', 'WinSCP',
 'SFTP/FTP file transfer client',
 'optional', false, '', 'General Supply - Standard Request Form GEN-001', '', 2000, '', 'active',
 '["GENERAL_MAINTENANCE"]'::jsonb, '["GUARDIAN"]'::jsonb, '["ALL"]'::jsonb);