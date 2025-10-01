-- Minimal seed for development: tasks, sops, and one technician
-- Safe to run multiple times

-- Technician (app user linkage optional)
INSERT INTO public.ame_employees (id, first_name, last_name, email, is_active, is_technician, employee_name)
VALUES (
  gen_random_uuid(), 'Test', 'Technician', 'tech@example.com', true, true, 'Test Technician'
) ON CONFLICT DO NOTHING;

-- Task/SOP library minimal seed
-- Record type 'task'
INSERT INTO public.task_sop_library (
  id, record_type, task_id, title, system_family, vendor_flavor, phase, service_tiers,
  estimated_duration_min, audience_level, frequency, initial_steps, acceptance_criteria,
  tools_required, safety_tags, reference_links, owner, version, is_active
) VALUES
  (gen_random_uuid(), 'task', 'BMS-HEALTH-CHECK', 'BMS Health Check', 'BMS', 'Niagara', 'previsit', ARRAY['CORE'], 45, 1, 'quarterly', 'Verify connectivity; check alarms summary', 'All critical systems reachable', 'Laptop; VPN', 'gloves', 'https://example.com/bms-health', 'AME', 'v1', true),
  (gen_random_uuid(), 'task', 'TREND-EXPORT', 'Export and Review Trends', 'BMS', 'Niagara', 'visit', ARRAY['CORE','ASSURE'], 60, 2, 'monthly', 'Export 7-day trends; analyze anomalies', 'Report generated and attached', 'Laptop', 'glasses', 'https://example.com/trend-export', 'AME', 'v1', true)
ON CONFLICT DO NOTHING;

-- Record type 'sop'
INSERT INTO public.task_sop_library (
  id, record_type, sop_id, title, system_family, vendor_flavor, phase, service_tiers,
  step_list_core, verification_steps, rollback_steps, best_practices, owner, version, is_active
) VALUES
  (gen_random_uuid(), 'sop', 'SOP-N4-BACKUP', 'Niagara N4 Backup Procedure', 'BMS', 'Niagara', 'visit', ARRAY['CORE','ASSURE'],
   'Login to station; initiate backup; verify archive', 'Restore test completed', 'Retain previous backup', 'Label archives with date; retain for 30 days', 'AME', 'v1', true),
  (gen_random_uuid(), 'sop', 'SOP-TUNE-PI', 'PID Loop Tuning Guide', 'HVAC', 'Generic', 'visit', ARRAY['ASSURE','GUARDIAN'],
   'Identify loop; set initial parameters; test response', 'Loop stable within 5% overshoot', 'Revert to previous gains', 'Document gains and rationale', 'AME', 'v1', true)
ON CONFLICT DO NOTHING;