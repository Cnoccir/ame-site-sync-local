#!/usr/bin/env node

/**
 * Apply Fixed Task/SOP Migration Directly
 * Executes the SQL directly using the service role
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcXdyYWJ1dWpqZ3F1YWt4cmt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjk0OTc0NiwiZXhwIjoyMDU4NTI1NzQ2fQ.x9s4h09XG5g8PxNEVmKH8UlWZZiHIJEgYhD2QEY7PxM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applyFixedMigration() {
    console.log('🔧 APPLYING FIXED TASK/SOP MIGRATION');
    console.log('===================================\n');

    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20250922000009_create_task_sop_tables_fixed.sql');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

        console.log('📄 Executing migration SQL...');

        // Split the SQL into individual statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        console.log(`Found ${statements.length} SQL statements to execute`);

        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';

            if (statement.includes('CREATE TABLE') ||
                statement.includes('CREATE INDEX') ||
                statement.includes('ALTER TABLE') ||
                statement.includes('DROP TABLE') ||
                statement.includes('GRANT') ||
                statement.includes('INSERT') ||
                statement.includes('COMMENT')) {

                console.log(`Executing statement ${i + 1}/${statements.length}...`);

                try {
                    const { error } = await supabase.rpc('exec_sql', {
                        sql_query: statement
                    });

                    if (error) {
                        console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
                        console.log(`SQL: ${statement.substring(0, 100)}...`);
                    } else {
                        console.log(`✅ Statement ${i + 1} executed successfully`);
                    }
                } catch (e) {
                    console.log(`❌ Statement ${i + 1} error: ${e.message}`);
                }
            }
        }

        // Try to verify the table was created by inserting sample data
        console.log('\n🔍 Verifying table creation...');

        const sampleTask = {
            record_type: 'task',
            task_id: 'C001',
            title: 'Platform & Station Backup',
            system_family: 'Niagara',
            phase: 'Prep',
            service_tiers: ['CORE'],
            frequency: 'Quarterly',
            audience_level: 2,
            initial_steps: 'Open Backup Utility in Workbench • Connect to Platform of Niagara host • Select running Station and click "Backup Station" • Name backup with format: [CustomerName]_[YYYY-MM-DD]_PMBackup',
            sop_refs: ['SOP_C001'],
            acceptance_criteria: 'Backup completes; .dist opens without error; copy stored off-device',
            artifacts: '.dist file attached; backup log entry',
            tools_required: 'Workbench, External storage drive, Cloud access',
            safety_tags: 'Ensure system stability during backup process. Verify backup storage security',
            reference_links: 'Tridium Niagara 4 Platform Guide (backup concepts) | JACE-8000 Backup & Restore Guide | JACE-9000 Backup & Restore Guide',
            version: 'v2.2',
            is_active: true
        };

        const { error: insertError } = await supabase
            .from('task_sop_library')
            .insert([sampleTask]);

        if (insertError) {
            console.log(`❌ Sample insert failed: ${insertError.message}`);
            console.log('The table may not have been created properly');
        } else {
            console.log('✅ Sample task inserted successfully');

            // Check count
            const { count } = await supabase
                .from('task_sop_library')
                .select('*', { count: 'exact', head: true });

            console.log(`📊 Total records in task_sop_library: ${count}`);
        }

        console.log('\n🎉 Fixed migration process completed!');
        console.log('If the table creation succeeded, run: node scripts/apply-task-sop-migration.js');

    } catch (error) {
        console.error('Migration failed:', error);
    }
}

applyFixedMigration();