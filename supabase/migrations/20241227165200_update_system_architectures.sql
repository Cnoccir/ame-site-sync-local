-- Update system architectures to be more BMS-specific
-- Clear existing data and add new BMS-focused architecture options

DELETE FROM system_architectures;

INSERT INTO system_architectures (id, architecture_name, description, display_order, is_active) VALUES
('arch_engine_single', 'Engine Only (single site)', 'Single JACE/Engine serving one site without supervisor', 10, true),
('arch_engines_multi_no_sup', 'Multi-Engine (no supervisor)', 'Multiple JACEs/Engines without central supervisor', 20, true),
('arch_sup_plus_eng', 'Supervisor + Engines (on-prem)', 'On-premise supervisor with connected engines/JACEs', 30, true),
('arch_sup_direct_ip', 'Supervisor + Direct-IP DDCs (no engines)', 'Supervisor directly connected to IP controllers without engines', 40, true),
('arch_sup_hosted', 'Hosted/Cloud Supervisor (+/- engines)', 'Cloud-based or hosted supervisor with optional engines', 50, true),
('arch_overlay_gateway', 'Overlay/Integration Engine', 'Integration layer over existing legacy systems', 60, true),
('arch_legacy_standalone', 'Legacy Standalone/Proprietary', 'Older proprietary systems (Barber-Colman, Andover, etc.)', 70, true),
('arch_mixed_federated', 'Mixed / Federated Vendors', 'Multiple vendor systems integrated together', 80, true),
('arch_unknown', 'Unknown / To be Assessed', 'System architecture needs to be determined', 90, true);
