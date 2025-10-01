-- Make fields more flexible in ame_tasks table
ALTER TABLE public.ame_tasks 
ALTER COLUMN task_id TYPE character varying(255),
ALTER COLUMN task_name TYPE character varying(500),
ALTER COLUMN category TYPE character varying(100),
ALTER COLUMN version TYPE character varying(50),
ALTER COLUMN complexity_level TYPE character varying(100),
ALTER COLUMN frequency TYPE character varying(100);

-- Make fields more flexible in ame_sops table  
ALTER TABLE public.ame_sops
ALTER COLUMN sop_id TYPE character varying(255),
ALTER COLUMN sop_name TYPE character varying(500),
ALTER COLUMN category TYPE character varying(100),
ALTER COLUMN system_type TYPE character varying(100),
ALTER COLUMN version TYPE character varying(50),
ALTER COLUMN revision_number TYPE character varying(50),
ALTER COLUMN certification_level TYPE character varying(100),
ALTER COLUMN risk_level TYPE character varying(100),
ALTER COLUMN environmental_conditions TYPE character varying(500),
ALTER COLUMN frequency_of_use TYPE character varying(100);