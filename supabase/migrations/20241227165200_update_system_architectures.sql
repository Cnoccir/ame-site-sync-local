-- Update system architectures to be more BMS-specific
-- Clear existing data and add new BMS-focused architecture options

DELETE FROM system_architectures;

INSERT INTO system_architectures (architecture_name, description, display_order, is_active) VALUES
('Engine Only (single site)', 'Single JACE/Engine serving one site without supervisor', 10, true),
('Multi-Engine (no supervisor)', 'Multiple JACEs/Engines without central supervisor', 20, true),
('Supervisor + Engines (on-prem)', 'On-premise supervisor with connected engines/JACEs', 30, true),
('Supervisor + Direct-IP DDCs (no engines)', 'Supervisor directly connected to IP controllers without engines', 40, true),
('Hosted/Cloud Supervisor (+/- engines)', 'Cloud-based or hosted supervisor with optional engines', 50, true),
('Overlay/Integration Engine', 'Integration layer over existing legacy systems', 60, true),
('Legacy Standalone/Proprietary', 'Older proprietary systems (Barber-Colman, Andover, etc.)', 70, true),
('Mixed / Federated Vendors', 'Multiple vendor systems integrated together', 80, true),
('Unknown / To be Assessed', 'System architecture needs to be determined', 90, true);
