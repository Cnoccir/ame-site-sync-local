-- ===================================================================
-- CREATE TASK AND SOP TABLES (FIXED)
-- Create proper structure for Task Library and SOP Library data
-- Fixed to work without user_profiles dependency
-- ===================================================================

-- Drop existing tables if they exist
DROP TABLE IF EXISTS task_sop_library CASCADE;

-- Create unified task_sop_library table
CREATE TABLE task_sop_library (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

    -- Identifiers
    task_id TEXT, -- For tasks (C001, C002, etc.)
    sop_id TEXT,  -- For SOPs (SOP_C001, etc.)
    record_type TEXT CHECK (record_type IN ('task', 'sop')) NOT NULL,

    -- Common fields
    title TEXT NOT NULL,
    system_family TEXT,
    vendor_flavor TEXT,
    phase TEXT,
    service_tiers TEXT[] DEFAULT ARRAY['CORE'],
    estimated_duration_min INTEGER,
    audience_level INTEGER,

    -- Task-specific fields
    frequency TEXT,
    initial_steps TEXT,
    sop_refs TEXT[],
    acceptance_criteria TEXT,
    artifacts TEXT,

    -- SOP-specific fields
    prerequisites TEXT,
    safety_tags TEXT,
    goal TEXT,
    ui_navigation TEXT,
    step_list_core TEXT,
    step_list_assure TEXT,
    step_list_guardian TEXT,
    verification_steps TEXT,
    rollback_steps TEXT,
    best_practices TEXT,

    -- Common metadata
    tools_required TEXT,
    reference_links TEXT,
    notes TEXT,
    owner TEXT,
    last_updated DATE,
    version TEXT,
    is_active BOOLEAN DEFAULT true,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_task_sop_library_task_id ON task_sop_library(task_id) WHERE task_id IS NOT NULL;
CREATE INDEX idx_task_sop_library_sop_id ON task_sop_library(sop_id) WHERE sop_id IS NOT NULL;
CREATE INDEX idx_task_sop_library_record_type ON task_sop_library(record_type);
CREATE INDEX idx_task_sop_library_system_family ON task_sop_library(system_family);
CREATE INDEX idx_task_sop_library_phase ON task_sop_library(phase);
CREATE INDEX idx_task_sop_library_service_tiers ON task_sop_library USING GIN(service_tiers);
CREATE INDEX idx_task_sop_library_active ON task_sop_library(is_active) WHERE is_active = true;

-- Disable RLS for now to make it publicly readable (reference data)
ALTER TABLE task_sop_library DISABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT SELECT ON task_sop_library TO anon, authenticated;
GRANT ALL ON task_sop_library TO service_role;

-- Insert sample CORE tasks based on the CSV data
INSERT INTO task_sop_library (
    record_type, task_id, title, system_family, phase, service_tiers,
    frequency, audience_level, initial_steps, sop_refs, acceptance_criteria,
    artifacts, tools_required, safety_tags, reference_links, version, is_active
) VALUES
    (
        'task', 'C001', 'Platform & Station Backup', 'Niagara', 'Prep', ARRAY['CORE'],
        'Quarterly', 2,
        'Open Backup Utility in Workbench • Connect to Platform of Niagara host • Select running Station and click "Backup Station" • Name backup with format: [CustomerName]_[YYYY-MM-DD]_PMBackup',
        ARRAY['SOP_C001'],
        'Backup completes; .dist opens without error; copy stored off-device',
        '.dist file attached; backup log entry',
        'Workbench, External storage drive, Cloud access',
        'Ensure system stability during backup process. Verify backup storage security',
        'Tridium Niagara 4 Platform Guide (backup concepts) | JACE-8000 Backup & Restore Guide | JACE-9000 Backup & Restore Guide',
        'v2.2', true
    ),
    (
        'task', 'C002', 'Performance Verification', 'Niagara', 'Health_Sweep', ARRAY['CORE'],
        'Monthly', 2,
        'Right-click Station and select Views → Station Summary • Check CPU Usage (should be <80% sustained) • Check Heap Memory (should be <75% after garbage collection) • Verify License Capacities not exceeded',
        ARRAY['SOP_C002'],
        'No unexpected high CPU/memory; no critical faults; comms nominal',
        null,
        'Workbench, System monitoring tools',
        'Monitor system performance impact during diagnostics',
        null,
        'v2.2', true
    ),
    (
        'task', 'C003', 'License Verification', 'Niagara', 'Health_Sweep', ARRAY['CORE'],
        'Quarterly', 2,
        'Navigate to License Manager • Check license status • Verify capacity usage • Document expiration dates',
        ARRAY['SOP_C003'],
        'All licenses valid; capacity within limits; no expiration warnings',
        'License status report',
        'Workbench, License Manager',
        'Verify license compliance',
        null,
        'v2.2', true
    ),
    (
        'task', 'C004', 'Device Health Check', 'Niagara', 'Health_Sweep', ARRAY['CORE'],
        'Monthly', 2,
        'Review device status • Check communication health • Verify device configuration • Document any issues',
        ARRAY['SOP_C004'],
        'All devices online; no communication errors; configurations verified',
        'Device health report',
        'Workbench, Device manager',
        'Monitor device performance',
        null,
        'v2.2', true
    );

-- Insert corresponding CORE SOPs
INSERT INTO task_sop_library (
    record_type, sop_id, title, system_family, phase, service_tiers,
    audience_level, prerequisites, safety_tags, goal, ui_navigation,
    step_list_core, version, is_active
) VALUES
    (
        'sop', 'SOP_C001', 'Platform & Station Backup', 'Niagara', 'Prep', ARRAY['CORE'],
        2,
        null,
        'Ensure system stability during backup process. Verify backup storage security',
        'Perform: Platform & Station Backup',
        'Platform → Platform Administration → Backup/Restore',
        '1. Open Backup Utility in Workbench
2. Connect to Platform of Niagara host
3. Select running Station and click "Backup Station"
4. Name backup with format: [CustomerName]_[YYYY-MM-DD]_PMBackup
5. Include History/Alarms if needed (check BackupService settings)
6. Click "Create" and monitor progress
7. Verify backup completed successfully
8. Copy backup to external drive and cloud storage',
        'v2.2', true
    ),
    (
        'sop', 'SOP_C002', 'Performance Verification', 'Niagara', 'Health_Sweep', ARRAY['CORE'],
        2,
        null,
        'Monitor system performance impact during diagnostics',
        'Perform: Performance Verification',
        'Station → Views → Station Summary',
        '1. Right-click Station and select Views → Station Summary
2. Check CPU Usage (should be <80% sustained)
3. Check Heap Memory (should be <75% after garbage collection)
4. Verify License Capacities not exceeded
5. Document any performance issues
6. Check for critical faults or alarms
7. Verify communication status is nominal',
        'v2.2', true
    ),
    (
        'sop', 'SOP_C003', 'License Verification', 'Niagara', 'Health_Sweep', ARRAY['CORE'],
        2,
        null,
        'Verify license compliance',
        'Perform: License Verification',
        'Platform → License Manager',
        '1. Navigate to License Manager
2. Check license status for all modules
3. Verify capacity usage vs. limits
4. Document expiration dates
5. Check for any license warnings
6. Verify all required licenses are active
7. Update license tracking spreadsheet',
        'v2.2', true
    ),
    (
        'sop', 'SOP_C004', 'Device Health Check', 'Niagara', 'Health_Sweep', ARRAY['CORE'],
        2,
        null,
        'Monitor device performance',
        'Perform: Device Health Check',
        'Station → Device Network → Device Manager',
        '1. Review device status in Device Manager
2. Check communication health for all devices
3. Verify device configuration settings
4. Document any offline or fault devices
5. Test communication to critical devices
6. Update device inventory if needed
7. Generate device health report',
        'v2.2', true
    );

-- Add comments
COMMENT ON TABLE task_sop_library IS 'Unified library for PM workflow tasks and standard operating procedures';
COMMENT ON COLUMN task_sop_library.record_type IS 'Distinguishes between task and sop records';
COMMENT ON COLUMN task_sop_library.task_id IS 'Task identifier (C001, C002, etc.) - only for task records';
COMMENT ON COLUMN task_sop_library.sop_id IS 'SOP identifier (SOP_C001, etc.) - only for sop records';
COMMENT ON COLUMN task_sop_library.service_tiers IS 'Array of applicable service tiers (CORE, ASSURE, GUARDIAN)';

-- Show results
SELECT
    record_type,
    COALESCE(task_id, sop_id) as identifier,
    title,
    system_family,
    phase,
    service_tiers
FROM task_sop_library
ORDER BY record_type, COALESCE(task_id, sop_id);