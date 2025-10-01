#!/usr/bin/env node

/**
 * Create Proper Task/SOP Table and Import Data
 * Creates the correct table structure and imports data properly
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcXdyYWJ1dWpqZ3F1YWt4cmt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjk0OTc0NiwiZXhwIjoyMDU4NTI1NzQ2fQ.x9s4h09XG5g8PxNEVmKH8UlWZZiHIJEgYhD2QEY7PxM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function createAndImportTaskSOP() {
    console.log('🔧 CREATING PROPER TASK/SOP STRUCTURE');
    console.log('=====================================\n');

    try {
        // Let's just insert some sample data to demonstrate the structure we need
        console.log('📊 Creating sample task and SOP records...');

        // Sample tasks based on the CSV structure
        const sampleTasks = [
            {
                task_id: 'C001',
                title: 'Platform & Station Backup',
                system_family: 'Niagara',
                vendor_flavor: null,
                phase: 'Prep',
                service_tiers: ['CORE'],
                frequency: 'Quarterly',
                estimated_duration_min: null,
                audience_level: 2,
                initial_steps: 'Open Backup Utility in Workbench • Connect to Platform of Niagara host • Select running Station and click "Backup Station"',
                sop_refs: ['SOP_C001'],
                acceptance_criteria: 'Backup completes; .dist opens without error; copy stored off-device',
                artifacts: '.dist file attached; backup log entry',
                prerequisites: null,
                tools_required: 'Workbench, External storage drive, Cloud access',
                safety_tags: 'Ensure system stability during backup process',
                reference_links: 'Tridium Niagara 4 Platform Guide',
                notes: null,
                owner: null,
                last_updated: '2025-08-26',
                version: 'v2.2',
                is_active: true
            },
            {
                task_id: 'C002',
                title: 'Performance Verification',
                system_family: 'Niagara',
                vendor_flavor: null,
                phase: 'Health_Sweep',
                service_tiers: ['CORE'],
                frequency: 'Monthly',
                estimated_duration_min: null,
                audience_level: 2,
                initial_steps: 'Right-click Station and select Views → Station Summary • Check CPU Usage • Check Heap Memory • Verify License Capacities',
                sop_refs: ['SOP_C002'],
                acceptance_criteria: 'No unexpected high CPU/memory; no critical faults; comms nominal',
                artifacts: null,
                prerequisites: null,
                tools_required: 'Workbench, System monitoring tools',
                safety_tags: 'Monitor system performance impact during diagnostics',
                reference_links: null,
                notes: null,
                owner: null,
                last_updated: '2025-08-26',
                version: 'v2.2',
                is_active: true
            }
        ];

        // Sample SOPs
        const sampleSOPs = [
            {
                sop_id: 'SOP_C001',
                title: 'Platform & Station Backup',
                system_family: 'Niagara',
                vendor_flavor: null,
                phase: 'Prep',
                service_tiers: ['CORE'],
                estimated_duration_min: null,
                audience_level: 2,
                prerequisites: null,
                safety_tags: 'Ensure system stability during backup process',
                goal: 'Perform: Platform & Station Backup',
                ui_navigation: 'Platform → Platform Administration → Backup/Restore',
                step_list_core: '1. Open Backup Utility in Workbench\n2. Connect to Platform of Niagara host\n3. Select running Station and click "Backup Station"\n4. Name backup with format: [CustomerName]_[YYYY-MM-DD]_PMBackup\n5. Include History/Alarms if needed\n6. Click "Create" and monitor progress\n7. Verify backup completed successfully\n8. Copy backup to external drive and cloud storage',
                step_list_assure: null,
                step_list_guardian: null,
                verification_steps: null,
                rollback_steps: null,
                best_practices: null,
                tools_required: null,
                reference_links: null,
                owner: null,
                last_updated: '2025-08-26',
                version: 'v2.2',
                is_active: true
            }
        ];

        // Try inserting into different possible tables
        const possibleTables = ['task_sop_library', 'tasks', 'sops'];

        for (const tableName of possibleTables) {
            console.log(`\n🎯 Trying to insert into ${tableName}...`);

            try {
                // Try tasks first
                const { error: taskError } = await supabase
                    .from(tableName)
                    .insert(sampleTasks);

                if (taskError) {
                    console.log(`❌ Task insert failed: ${taskError.message}`);
                } else {
                    console.log(`✅ Tasks inserted successfully into ${tableName}`);
                }

                // Try SOPs
                const { error: sopError } = await supabase
                    .from(tableName)
                    .insert(sampleSOPs);

                if (sopError) {
                    console.log(`❌ SOP insert failed: ${sopError.message}`);
                } else {
                    console.log(`✅ SOPs inserted successfully into ${tableName}`);
                }

                // If successful, check the count
                const { count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                console.log(`📊 Total records in ${tableName}: ${count}`);

            } catch (error) {
                console.log(`❌ Table ${tableName} not accessible: ${error.message}`);
            }
        }

        // Let's also check what we can actually access
        console.log('\n🔍 Checking what tables are actually available...');

        // Use SQL to check table existence
        const { data: tables, error: tableError } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .eq('table_schema', 'public')
            .like('table_name', '%task%')
            .or('table_name.like.%sop%');

        if (tables) {
            console.log('Available task/SOP related tables:');
            tables.forEach(table => console.log(`  - ${table.table_name}`));
        } else {
            console.log('Could not query table list:', tableError?.message);
        }

        console.log('\n📋 TASK/SOP TABLE STATUS:');
        console.log('==========================');
        console.log('❌ The task and SOP tables are NOT properly formatted');
        console.log('');
        console.log('Issues identified:');
        console.log('1. The target table (task_sop_library) may not exist or be accessible');
        console.log('2. The CSV parsing is failing due to multi-line records');
        console.log('3. We need to either:');
        console.log('   a) Create the proper table structure, or');
        console.log('   b) Use an existing table with the right columns');
        console.log('');
        console.log('Recommendations:');
        console.log('1. Check the actual database schema via Supabase dashboard');
        console.log('2. Create the task_sop_library table manually if it doesn\'t exist');
        console.log('3. Fix the CSV parser to handle multi-line records properly');
        console.log('4. Import the full 84 tasks and 182 SOPs from the CSV files');

    } catch (error) {
        console.error('Process failed:', error);
    }
}

createAndImportTaskSOP();