-- Create task-service tier relationships based on task IDs
-- CORE tier tasks (C prefixed tasks)
INSERT INTO task_service_tiers (task_id, service_tier_id, is_required)
SELECT 
  t.id as task_id,
  st.id as service_tier_id,
  true as is_required
FROM ame_tasks_normalized t
CROSS JOIN service_tiers st
WHERE t.task_id LIKE 'C%' AND st.tier_code = 'CORE'
ON CONFLICT (task_id, service_tier_id) DO NOTHING;

-- CORE tasks also available for ASSURE and GUARDIAN
INSERT INTO task_service_tiers (task_id, service_tier_id, is_required)
SELECT 
  t.id as task_id,
  st.id as service_tier_id,
  true as is_required
FROM ame_tasks_normalized t
CROSS JOIN service_tiers st
WHERE t.task_id LIKE 'C%' AND st.tier_code IN ('ASSURE', 'GUARDIAN')
ON CONFLICT (task_id, service_tier_id) DO NOTHING;

-- ASSURE tier tasks (A prefixed tasks) - available for ASSURE and GUARDIAN
INSERT INTO task_service_tiers (task_id, service_tier_id, is_required)
SELECT 
  t.id as task_id,
  st.id as service_tier_id,
  true as is_required
FROM ame_tasks_normalized t
CROSS JOIN service_tiers st
WHERE t.task_id LIKE 'A%' AND st.tier_code IN ('ASSURE', 'GUARDIAN')
ON CONFLICT (task_id, service_tier_id) DO NOTHING;

-- GUARDIAN tier tasks (G prefixed tasks) - only for GUARDIAN
INSERT INTO task_service_tiers (task_id, service_tier_id, is_required)
SELECT 
  t.id as task_id,
  st.id as service_tier_id,
  true as is_required
FROM ame_tasks_normalized t
CROSS JOIN service_tiers st
WHERE t.task_id LIKE 'G%' AND st.tier_code = 'GUARDIAN'
ON CONFLICT (task_id, service_tier_id) DO NOTHING;