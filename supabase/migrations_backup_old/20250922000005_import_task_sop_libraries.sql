-- ===================================================================
-- IMPORT TASK AND SOP LIBRARIES
-- Import Task Library v22 and SOP Library v22 data
-- ===================================================================

-- Clear existing data in the task_sop_library table
TRUNCATE TABLE task_sop_library CASCADE;

-- Create temporary functions for importing the data
CREATE OR REPLACE FUNCTION import_task_library_from_csv()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result_count INTEGER := 0;
BEGIN
    -- This function will be called by the import script to populate task data
    -- Task Library CSV structure: Task_ID,Task_Name,System_Family,Vendor_Flavor,Phase,Service_Tiers,Frequency,Estimated_Duration_min,Audience_Level,Initial_Steps,SOP_Refs,Acceptance_Criteria,Artifacts,Prerequisites,Tools_Required,Safety_Tags,Reference_Links,Notes,Owner,Last_Updated,Version

    RETURN 'Ready to import Task Library v22. Use the import script to populate data.';
END;
$$;

CREATE OR REPLACE FUNCTION import_sop_library_from_csv()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result_count INTEGER := 0;
BEGIN
    -- This function will be called by the import script to populate SOP data
    -- SOP Library CSV structure: SOP_ID,Title,System_Family,Vendor_Flavor,Phase,Service_Tiers,Estimated_Duration_min,Audience_Level,Prerequisites,Safety,Goal,UI_Navigation,Step_List_CORE,Step_List_ASSURE,Step_List_GUARDIAN,Verification_Steps,Rollback_Steps,Best_Practices,Tools,Hyperlinks,Owner,Last_Updated,Version

    RETURN 'Ready to import SOP Library v22. Use the import script to populate data.';
END;
$$;

-- Ensure the task_sop_library table has the correct structure for both tasks and SOPs
-- Check if we need to add any missing columns
DO $$
BEGIN
    -- Add task-specific columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'task_id') THEN
        ALTER TABLE task_sop_library ADD COLUMN task_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'sop_id') THEN
        ALTER TABLE task_sop_library ADD COLUMN sop_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'record_type') THEN
        ALTER TABLE task_sop_library ADD COLUMN record_type TEXT CHECK (record_type IN ('task', 'sop'));
    END IF;

    -- Add SOP-specific columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'ui_navigation') THEN
        ALTER TABLE task_sop_library ADD COLUMN ui_navigation TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'step_list_core') THEN
        ALTER TABLE task_sop_library ADD COLUMN step_list_core TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'step_list_assure') THEN
        ALTER TABLE task_sop_library ADD COLUMN step_list_assure TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'step_list_guardian') THEN
        ALTER TABLE task_sop_library ADD COLUMN step_list_guardian TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'verification_steps') THEN
        ALTER TABLE task_sop_library ADD COLUMN verification_steps TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'rollback_steps') THEN
        ALTER TABLE task_sop_library ADD COLUMN rollback_steps TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'best_practices') THEN
        ALTER TABLE task_sop_library ADD COLUMN best_practices TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'initial_steps') THEN
        ALTER TABLE task_sop_library ADD COLUMN initial_steps TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'acceptance_criteria') THEN
        ALTER TABLE task_sop_library ADD COLUMN acceptance_criteria TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'artifacts') THEN
        ALTER TABLE task_sop_library ADD COLUMN artifacts TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'frequency') THEN
        ALTER TABLE task_sop_library ADD COLUMN frequency TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'sop_refs') THEN
        ALTER TABLE task_sop_library ADD COLUMN sop_refs TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'task_sop_library' AND column_name = 'reference_links') THEN
        ALTER TABLE task_sop_library ADD COLUMN reference_links TEXT;
    END IF;
END
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_task_sop_library_task_id ON task_sop_library(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_sop_library_sop_id ON task_sop_library(sop_id) WHERE sop_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_sop_library_record_type ON task_sop_library(record_type);
CREATE INDEX IF NOT EXISTS idx_task_sop_library_system_family ON task_sop_library(system_family);
CREATE INDEX IF NOT EXISTS idx_task_sop_library_phase ON task_sop_library(phase);
CREATE INDEX IF NOT EXISTS idx_task_sop_library_service_tiers ON task_sop_library USING GIN(service_tiers) WHERE service_tiers IS NOT NULL;

COMMENT ON FUNCTION import_task_library_from_csv() IS 'Placeholder function for Task Library CSV import process';
COMMENT ON FUNCTION import_sop_library_from_csv() IS 'Placeholder function for SOP Library CSV import process';