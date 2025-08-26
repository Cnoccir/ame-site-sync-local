-- Add missing columns to ame_tools_normalized table
ALTER TABLE ame_tools_normalized 
ADD COLUMN IF NOT EXISTS required_for_tasks JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS service_tiers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS system_types JSONB DEFAULT '[]'::jsonb;

-- Update existing tools and insert new comprehensive tool data
TRUNCATE TABLE ame_tools_normalized;

-- Insert the comprehensive tool data
INSERT INTO ame_tools_normalized (
  tool_id, tool_name, description, safety_category, calibration_required,
  vendor_link, request_method, alternative_tools, cost_estimate, 
  maintenance_notes, status, required_for_tasks, service_tiers, system_types
) VALUES 
-- Safety Tools
('TOOL_013', 'PPE Gear Bags (Blue/Orange)', 
 'PPE Gear Bags containing: hard hat; safety glasses; high-visibility vest; gloves; ear protection',
 'required', false, '', 'Safety Department - PPE Request Form SAF-001', '', 200, '', 'active',
 '["ALL_TASKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_014', 'Ladders & Safety Harnesses',
 'Ladders (of appropriate height) & certified safety harnesses for elevated work',
 'site_required', false, '', 'Safety Department - PPE Request Form SAF-001', '', 200, '', 'active',
 '["ALL_TASKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Calibration Tools
('TOOL_015', 'Pneumatic Service Kit',
 'Pneumatic Service Kit (gauge, tubing, fittings, aspirator bulb) for calibrating legacy pneumatic controls',
 'recommended', true, '', 'Calibration Lab - Precision Instrument Request CAL-001', '', 2000, '', 'active',
 '["SENSOR_CALIBRATION", "SYSTEM_VERIFICATION", "PERFORMANCE_TESTING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Electrical Tools
('TOOL_016', 'LED Headlamp',
 'LED headlamp for hands-free illumination',
 'recommended', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_017', 'Digital Multimeter',
 'Fluke 87V or ruggedized 87V MAX True-RMS multimeter',
 'recommended', true, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Measurement Tools
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

('TOOL_021', 'Digital Manometer',
 'Dwyer 475-1-FM digital manometer',
 'recommended', true, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 800, '', 'active',
 '["SENSOR_CALIBRATION", "SYSTEM_VERIFICATION", "PERFORMANCE_TESTING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Hand Tools
('TOOL_022', 'Assorted Insulated Hand-Tool Set',
 'Insulated screwdrivers, pliers, nut drivers, adjustable wrenches, hex keys, Torx bits',
 'recommended', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_023', 'Wire Stripper',
 'Klein Tools wire stripper for precise stripping',
 'recommended', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_024', 'Crimp Tool',
 'Thomas & Betts crimp tool for connector installation',
 'recommended', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_025', 'Electrical Tape',
 '3M Scotch 33+ electrical tape',
 'recommended', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_026', 'Wire Connectors',
 'Assorted wire nuts (e.g. blue)',
 'recommended', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_027', 'Torpedo Level',
 'Compact torpedo level for quick leveling checks',
 'recommended', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_028', 'Thermostat Service Wrench',
 'JC 5309 flexible wrench; T-4000-119 "Blue" thermostat tool',
 'recommended', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 500, '', 'active',
 '["HARDWARE_MAINTENANCE", "SENSOR_CALIBRATION", "WIRING_CHECKS"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Computing Tools
('TOOL_029', 'Laptop Computer',
 'Primary laptop with Ethernet, USB, and Wi-Fi interfaces',
 'optional', false, '', 'IT Department - Equipment Request Form IT-001', '', 3000, '', 'active',
 '["SYSTEM_ACCESS", "BACKUP", "CONFIGURATION"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Network Tools
('TOOL_030', 'Ethernet Cable Tester',
 'T3 Innovation TT550 Tri Tester Pro or Fluke LinkIQ',
 'optional', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 1000, '', 'active',
 '["NETWORK_VERIFICATION", "SYSTEM_ACCESS", "COMMUNICATION_TESTING"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_031', 'RJ-45 Crimp Tool',
 'Bomar/Ideal EZ-RJ45 crimper',
 'optional', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 1000, '', 'active',
 '["NETWORK_VERIFICATION", "SYSTEM_ACCESS", "COMMUNICATION_TESTING"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_032', 'EZ RJ-45 Connectors',
 'EZ RJ-45 connectors for quick terminations',
 'optional', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 1000, '', 'active',
 '["NETWORK_VERIFICATION", "SYSTEM_ACCESS", "COMMUNICATION_TESTING"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_033', 'Portable Network Switch',
 '4- or 5-port USB-powered mini switch',
 'optional', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 1000, '', 'active',
 '["NETWORK_VERIFICATION", "SYSTEM_ACCESS", "COMMUNICATION_TESTING"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_034', 'Portable Wi-Fi Router',
 'TP-Link AC750 mini router for ad-hoc networks',
 'optional', false, '', 'Tool Crib - Standard Equipment Request TCR-001', '', 1000, '', 'active',
 '["NETWORK_VERIFICATION", "SYSTEM_ACCESS", "COMMUNICATION_TESTING"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Storage & General Tools
('TOOL_035', 'USB Flash Drive',
 '32 GB+ rugged USB flash drive',
 'optional', false, '', 'General Supply - Standard Request Form GEN-001', '', 200, '', 'active',
 '["GENERAL_MAINTENANCE"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Niagara-Specific Tools
('TOOL_036', 'JCI Mobile Access Portal (MAP) Gateway',
 'TL-MAP1810-0Px gateway for mobile commissioning',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 1000, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_037', 'JCI Handheld VAV Balancing Tool',
 'NS-ATV7003-0 network sensor handheld tool',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 1000, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_038', 'Honeywell Connect Mobile (HCM) App',
 'Bluetooth commissioning app for Spyder Model 7 VAVs',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 500, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_039', 'LON Interface & Software',
 'LN-Builder, LN plug-ins, Tridium LON driver with USB LON adapter',
 'optional', false, '', 'IT Department - Equipment Request Form IT-001', '', 500, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_040', 'Serial Adapters',
 'USB-to-RS-232/485 adapters with terminal-emulator software',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 1000, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_041', 'Tridium Niagara Workbench',
 'Niagara Workbench N4 v4.10/4.11',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 2000, '', 'active',
 '["SYSTEM_ACCESS", "BACKUP", "CONFIGURATION"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_042', 'Honeywell Spyder Tool',
 'Niagara module for legacy Honeywell Spyder controllers',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 1000, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_043', 'Johnson Controls CCT/PCT',
 'Controller Configuration Tool and Programmable Controller Tool',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 1000, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_044', 'System Configuration Tool',
 'Niagara System Configuration Tool',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 1000, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_045', 'Application Loading Tool',
 'Niagara Application Loading Tool',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 500, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_046', 'Niagara Licensing Portals',
 'Online licensing and platform administration tools',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 2000, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_047', 'Platform/Administrator Tool',
 'Niagara platform and administrator management',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 1000, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

-- Documentation Tools
('TOOL_048', 'Microsoft Visio',
 'Diagramming tool for system design',
 'optional', false, '', 'General Supply - Standard Request Form GEN-001', '', 500, '', 'active',
 '["GENERAL_MAINTENANCE"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_049', 'Microsoft Office Suite',
 'Word, Excel, and PowerPoint for reporting',
 'optional', false, '', 'General Supply - Standard Request Form GEN-001', '', 500, '', 'active',
 '["GENERAL_MAINTENANCE"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_050', 'PDF Tools',
 'Adobe Reader and CutePDF for PDF handling',
 'optional', false, '', 'General Supply - Standard Request Form GEN-001', '', 500, '', 'active',
 '["GENERAL_MAINTENANCE"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Additional Computing Tools
('TOOL_051', 'VPN Client',
 'Cisco AnyConnect VPN client',
 'optional', false, '', 'IT Department - Equipment Request Form IT-001', '', 3000, '', 'active',
 '["SYSTEM_ACCESS", "BACKUP", "CONFIGURATION"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_052', 'Email & Collaboration Apps',
 'Outlook, Microsoft Teams, Slack',
 'optional', false, '', 'IT Department - Equipment Request Form IT-001', '', 500, '', 'active',
 '["SYSTEM_ACCESS", "BACKUP", "CONFIGURATION"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_053', 'Anti-virus Software',
 'Endpoint protection software',
 'optional', false, '', 'IT Department - Equipment Request Form IT-001', '', 500, '', 'active',
 '["SYSTEM_ACCESS", "BACKUP", "CONFIGURATION"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Advanced Tools (GUARDIAN only)
('TOOL_054', '7-Zip',
 'File compression and decompression utility',
 'optional', false, '', 'General Supply - Standard Request Form GEN-001', '', 2000, '', 'active',
 '["GENERAL_MAINTENANCE"]'::jsonb, '["GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_055', 'WinSCP',
 'SFTP/FTP file transfer client',
 'optional', false, '', 'General Supply - Standard Request Form GEN-001', '', 2000, '', 'active',
 '["GENERAL_MAINTENANCE"]'::jsonb, '["GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_056', 'FileZilla',
 'FTP file transfer client',
 'optional', false, '', 'General Supply - Standard Request Form GEN-001', '', 2000, '', 'active',
 '["GENERAL_MAINTENANCE"]'::jsonb, '["GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

('TOOL_057', 'Network Scanning Tools',
 'Advanced IP Scanner, ping utilities',
 'optional', false, '', 'General Supply - Standard Request Form GEN-001', '', 2000, '', 'active',
 '["GENERAL_MAINTENANCE"]'::jsonb, '["GUARDIAN"]'::jsonb, '["ALL"]'::jsonb),

-- Knowledge Base Tools
('TOOL_058', 'JCI Knowledge Exchange Portal & FSC Solutions DB',
 'JCI online knowledge portals',
 'optional', false, '', 'General Supply - Standard Request Form GEN-001', '', 500, '', 'active',
 '["GENERAL_MAINTENANCE"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_059', 'Honeywell & Niagara Support Knowledge Bases',
 'Honeywell technical support and Niagara Community Forums',
 'optional', false, '', 'General Supply - Standard Request Form GEN-001', '', 500, '', 'active',
 '["GENERAL_MAINTENANCE"]'::jsonb, '["CORE", "ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

-- Mobile Apps
('TOOL_060', 'FAN-410 Quick Reference App',
 'Mobile quick reference for FAN-410 installation',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 500, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb),

('TOOL_061', 'Vendor Mobile Apps',
 'JCI thermostat and Honeywell system mobile apps',
 'optional', false, '', 'Engineering Department - Software License Request ENG-001', '', 500, '', 'active',
 '["SYSTEM_CONFIGURATION", "SOFTWARE_UPDATES", "COMMISSIONING"]'::jsonb, '["ASSURE", "GUARDIAN"]'::jsonb, '["Niagara N4", "Niagara AX"]'::jsonb);

-- Update the getToolsByServiceTier function in ameService to use the new service_tiers column
CREATE OR REPLACE FUNCTION get_tools_by_service_tier(tier_name TEXT)
RETURNS TABLE (
  id UUID,
  tool_id TEXT,
  tool_name TEXT,
  description TEXT,
  safety_category TEXT,
  calibration_required BOOLEAN,
  vendor_link TEXT,
  request_method TEXT,
  alternative_tools TEXT,
  cost_estimate NUMERIC,
  maintenance_notes TEXT,
  status TEXT,
  required_for_tasks JSONB,
  service_tiers JSONB,
  system_types JSONB,
  created_at TIMESTAMPTZ,
  last_updated TIMESTAMPTZ
) AS $$
DECLARE
  inherited_tiers TEXT[];
BEGIN
  -- Get inherited tiers based on service tier hierarchy
  CASE tier_name
    WHEN 'CORE' THEN inherited_tiers := ARRAY['CORE'];
    WHEN 'ASSURE' THEN inherited_tiers := ARRAY['CORE', 'ASSURE'];
    WHEN 'GUARDIAN' THEN inherited_tiers := ARRAY['CORE', 'ASSURE', 'GUARDIAN'];
    ELSE inherited_tiers := ARRAY['CORE'];
  END CASE;

  RETURN QUERY
  SELECT t.id, t.tool_id, t.tool_name, t.description, t.safety_category,
         t.calibration_required, t.vendor_link, t.request_method, 
         t.alternative_tools, t.cost_estimate, t.maintenance_notes,
         t.status, t.required_for_tasks, t.service_tiers, t.system_types,
         t.created_at, t.last_updated
  FROM ame_tools_normalized t
  WHERE t.service_tiers ?| inherited_tiers
  ORDER BY t.tool_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;