-- Migration: Seed data for dropdown reference tables
-- This migration populates the reference tables with curated dropdown options

-- Insert Building Types
INSERT INTO building_types (type_name, description, display_order) VALUES
  ('Office/Commercial', 'Office buildings, commercial spaces, corporate headquarters', 10),
  ('Healthcare/Hospital', 'Hospitals, medical centers, clinics, healthcare facilities', 20),
  ('Education/School', 'Schools, universities, educational institutions', 30),
  ('Industrial/Manufacturing', 'Manufacturing facilities, warehouses, industrial plants', 40),
  ('Retail', 'Shopping centers, retail stores, malls', 50),
  ('Government/Military', 'Government buildings, military facilities, public buildings', 60),
  ('Multi-Use/Mixed', 'Mixed-use developments, multi-tenant buildings', 70),
  ('Data Center', 'Data centers, server facilities, telecommunications', 80),
  ('Hospitality', 'Hotels, resorts, event centers', 90),
  ('Residential', 'Apartment complexes, condominiums, residential buildings', 100),
  ('Laboratory/Research', 'Research facilities, laboratories, clean rooms', 110),
  ('Other', 'Other building types not listed above', 999)
ON CONFLICT (type_name) DO NOTHING;

-- Insert System Architectures
INSERT INTO system_architectures (architecture_name, description, display_order) VALUES
  ('Centralized', 'Central BAS with all controllers connected to single supervisory system', 10),
  ('Distributed', 'Multiple controllers with distributed processing and local autonomy', 20),
  ('Hierarchical', 'Multi-level system with field controllers reporting to area controllers', 30),
  ('Peer-to-Peer', 'Controllers communicating directly with each other', 40),
  ('Hybrid', 'Combination of centralized and distributed architectures', 50),
  ('Standalone', 'Independent controllers with minimal integration', 60),
  ('Cloud-Based', 'Cloud-hosted supervisory system with remote controllers', 70),
  ('Legacy/Pneumatic', 'Older pneumatic or basic electronic systems', 80),
  ('Mixed/Multi-Vendor', 'Multiple different systems from various manufacturers', 90),
  ('Other', 'Other system architectures not listed above', 999)
ON CONFLICT (architecture_name) DO NOTHING;

-- Insert BAS Platforms (grouped by category)
INSERT INTO bas_platforms (platform_name, platform_category, manufacturer, description, display_order) VALUES
  -- Niagara N4 Category
  ('Niagara N4 (Tridium)', 'Niagara', 'Tridium', 'Tridium Niagara N4 framework and compatible systems', 10),
  ('Niagara N4 (Honeywell)', 'Niagara', 'Honeywell', 'Honeywell systems running on Niagara N4', 11),
  ('Niagara N4 (Distech)', 'Niagara', 'Distech', 'Distech Controls systems on Niagara N4', 12),
  ('Niagara N4 (Contemporary)', 'Niagara', 'Contemporary Controls', 'Contemporary Controls Niagara N4 systems', 13),
  ('Niagara N4 (Lynxspring)', 'Niagara', 'Lynxspring', 'Lynxspring Niagara N4 implementations', 14),
  
  -- Non-Niagara Category
  ('Johnson Metasys', 'Non-Niagara', 'Johnson Controls', 'Johnson Controls Metasys building automation', 20),
  ('Schneider EcoStruxure', 'Non-Niagara', 'Schneider Electric', 'Schneider Electric EcoStruxure BMS', 21),
  ('Siemens Desigo', 'Non-Niagara', 'Siemens', 'Siemens Desigo building automation platform', 22),
  ('Carrier i-Vu', 'Non-Niagara', 'Carrier', 'Carrier i-Vu building automation system', 23),
  ('Trane Tracer', 'Non-Niagara', 'Trane', 'Trane Tracer building management system', 24),
  ('Delta ORCAview', 'Non-Niagara', 'Delta Controls', 'Delta Controls ORCAview system', 25),
  
  -- Specialized/Legacy Category
  ('Honeywell WEBs', 'Legacy/Specialized', 'Honeywell', 'Honeywell WEBs (older generation)', 30),
  ('Johnson N30', 'Legacy/Specialized', 'Johnson Controls', 'Johnson N30/N2 legacy systems', 31),
  ('Automated Logic WebCTRL', 'Legacy/Specialized', 'Automated Logic', 'Automated Logic WebCTRL', 32),
  ('Reliable Controls', 'Legacy/Specialized', 'Reliable Controls', 'Reliable Controls MACH-System', 33),
  ('KMC Controls', 'Legacy/Specialized', 'KMC Controls', 'KMC FlexStat and BACtalk systems', 34),
  
  -- Open Protocol Category
  ('BACnet/IP Generic', 'Open Protocol', 'Various', 'Generic BACnet/IP compatible systems', 40),
  ('LonWorks Generic', 'Open Protocol', 'Various', 'Generic LonWorks compatible systems', 41),
  ('Modbus Generic', 'Open Protocol', 'Various', 'Generic Modbus compatible systems', 42),
  
  -- Mixed/Other Category
  ('Mixed Multi-Vendor', 'Mixed', 'Multiple', 'Multiple different platforms integrated together', 50),
  ('Custom Integration', 'Mixed', 'Various', 'Custom integrated solution with multiple protocols', 51),
  ('Unknown/TBD', 'Other', 'Unknown', 'Platform to be determined during site assessment', 99),
  ('Other', 'Other', 'Other', 'Other BAS platform not listed above', 999)
ON CONFLICT (platform_name, platform_category) DO NOTHING;

-- Insert Contact Roles
INSERT INTO contact_roles (role_name, description, display_order) VALUES
  ('Facility Manager', 'Primary facility operations and maintenance contact', 10),
  ('Building Engineer', 'Technical building systems expert', 20),
  ('Maintenance Supervisor', 'Supervisor of maintenance staff and operations', 30),
  ('Property Manager', 'Overall property management and tenant relations', 40),
  ('Operations Manager', 'Day-to-day building operations management', 50),
  ('Security Manager', 'Building security and access control', 60),
  ('IT Manager', 'Information technology and network systems', 70),
  ('Energy Manager', 'Energy efficiency and utility management', 80),
  ('Project Manager', 'Construction or renovation project management', 90),
  ('Chief Engineer', 'Senior engineering and technical oversight', 100),
  ('Admin/Reception', 'Administrative support and front desk', 110),
  ('Tenant Representative', 'Primary tenant contact for multi-tenant buildings', 120),
  ('Contractor/Vendor', 'External contractor or service provider', 130),
  ('Emergency Contact', 'After-hours or emergency situations only', 140),
  ('Other', 'Other role not specified above', 999)
ON CONFLICT (role_name) DO NOTHING;

-- Insert Access Methods
INSERT INTO access_methods (method_name, description, display_order) VALUES
  ('Key/Lock Box', 'Physical key or combination lock box on-site', 10),
  ('Card Access/Badge', 'Electronic key card or badge access', 20),
  ('Security Guard', 'Access through security personnel at front desk', 30),
  ('Tenant Escort', 'Accompanied by tenant representative or contact', 40),
  ('Property Manager', 'Access arranged through property management office', 50),
  ('Code/Keypad', 'Digital keypad entry with access code', 60),
  ('Remote Unlock', 'Remote electronic door unlock by contact', 70),
  ('Reception/Front Desk', 'Check-in through building reception', 80),
  ('Pre-Scheduled', 'Pre-arranged access with advance notice required', 90),
  ('24/7 Access', 'Unrestricted access available at any time', 100),
  ('Business Hours Only', 'Access limited to standard business hours', 110),
  ('Appointment Required', 'Must schedule appointment for site access', 120),
  ('Multiple Methods', 'Combination of multiple access methods', 130),
  ('Variable/Seasonal', 'Access method varies by time of year or conditions', 140),
  ('Other', 'Other access method not listed above', 999)
ON CONFLICT (method_name) DO NOTHING;

-- Insert Service Frequencies
INSERT INTO service_frequencies (frequency_name, description, display_order) VALUES
  ('Monthly', 'Service performed every month', 10),
  ('Bi-Monthly', 'Service performed every two months', 20),
  ('Quarterly', 'Service performed every three months (4 times per year)', 30),
  ('Semi-Annual', 'Service performed twice per year (every 6 months)', 40),
  ('Annual', 'Service performed once per year', 50),
  ('Bi-Annual', 'Service performed every two years', 60),
  ('On-Demand', 'Service performed as needed or requested', 70),
  ('Seasonal', 'Service performed based on seasonal requirements', 80),
  ('Project-Based', 'Service frequency varies based on project needs', 90),
  ('Emergency Only', 'Service only performed for emergency situations', 100),
  ('TBD', 'Service frequency to be determined', 999)
ON CONFLICT (frequency_name) DO NOTHING;

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers to automatically update the updated_at column
CREATE TRIGGER update_building_types_updated_at BEFORE UPDATE ON building_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_architectures_updated_at BEFORE UPDATE ON system_architectures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bas_platforms_updated_at BEFORE UPDATE ON bas_platforms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contact_roles_updated_at BEFORE UPDATE ON contact_roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_access_methods_updated_at BEFORE UPDATE ON access_methods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_service_frequencies_updated_at BEFORE UPDATE ON service_frequencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
