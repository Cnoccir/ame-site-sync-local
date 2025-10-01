#!/usr/bin/env node

/**
 * Check Table Structure
 * Find the correct table names for tasks/SOPs
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcXdyYWJ1dWpqZ3F1YWt4cmt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjk0OTc0NiwiZXhwIjoyMDU4NTI1NzQ2fQ.x9s4h09XG5g8PxNEVmKH8UlWZZiHIJEgYhD2QEY7PxM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTables() {
    try {
        console.log('🔍 Checking available tables...');

        // Check for task-related tables
        const tables = [
            'task_sop_library',
            'task_sops',
            'tasks',
            'sops',
            'task_library',
            'sop_library',
            'ame_task_catalog',
            'ame_sop_catalog'
        ];

        for (const tableName of tables) {
            try {
                const { data, error, count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (!error) {
                    console.log(`✅ Table '${tableName}' exists with ${count} records`);

                    // Get table structure
                    const { data: sample } = await supabase
                        .from(tableName)
                        .select('*')
                        .limit(1);

                    if (sample && sample.length > 0) {
                        console.log(`   Columns: ${Object.keys(sample[0]).join(', ')}`);
                    }
                } else {
                    console.log(`❌ Table '${tableName}' not found: ${error.message}`);
                }
            } catch (e) {
                console.log(`❌ Error checking '${tableName}': ${e.message}`);
            }
        }

        // Check employee table
        console.log('\n🧑‍💼 Checking employee tables...');
        const empTables = ['ame_employees', 'employees', 'technicians'];

        for (const tableName of empTables) {
            try {
                const { data, error, count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                if (!error) {
                    console.log(`✅ Table '${tableName}' exists with ${count} records`);
                } else {
                    console.log(`❌ Table '${tableName}' not found`);
                }
            } catch (e) {
                console.log(`❌ Error checking '${tableName}': ${e.message}`);
            }
        }

        // Verify SimPro customer import
        console.log('\n👥 Checking SimPro customers...');
        const { data: customers, count: custCount } = await supabase
            .from('simpro_customers')
            .select('*', { count: 'exact', head: true });

        console.log(`✅ simpro_customers: ${custCount} records imported`);

    } catch (error) {
        console.error('Check failed:', error);
    }
}

checkTables();