#!/usr/bin/env node

/**
 * Check Task and SOP Table Structure
 * Detailed analysis of task/SOP related tables and their data
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcXdyYWJ1dWpqZ3F1YWt4cmt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjk0OTc0NiwiZXhwIjoyMDU4NTI1NzQ2fQ.x9s4h09XG5g8PxNEVmKH8UlWZZiHIJEgYhD2QEY7PxM';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkTaskSOPStructure() {
    console.log('🔍 TASK & SOP TABLE ANALYSIS');
    console.log('============================\n');

    try {
        // Check all task/SOP related tables
        const taskTables = [
            'task_sop_library',
            'task_sops',
            'tasks',
            'sops',
            'task_library',
            'sop_library'
        ];

        for (const tableName of taskTables) {
            console.log(`📊 TABLE: ${tableName}`);
            console.log('─'.repeat(50));

            try {
                // Get count
                const { count } = await supabase
                    .from(tableName)
                    .select('*', { count: 'exact', head: true });

                console.log(`Records: ${count || 0}`);

                // Get sample data to see structure
                const { data: sample } = await supabase
                    .from(tableName)
                    .select('*')
                    .limit(1);

                if (sample && sample.length > 0) {
                    console.log('Columns:');
                    Object.keys(sample[0]).forEach(col => {
                        const value = sample[0][col];
                        const type = typeof value;
                        const preview = value ? String(value).substring(0, 50) + (String(value).length > 50 ? '...' : '') : 'null';
                        console.log(`  ${col}: ${type} = ${preview}`);
                    });

                    // If this table has data, show a few more examples
                    if (count > 1) {
                        const { data: examples } = await supabase
                            .from(tableName)
                            .select('*')
                            .limit(3);

                        console.log('\nSample Records:');
                        examples?.forEach((record, index) => {
                            console.log(`  Record ${index + 1}:`);
                            if (record.title) console.log(`    Title: ${record.title}`);
                            if (record.task_id) console.log(`    Task ID: ${record.task_id}`);
                            if (record.sop_id) console.log(`    SOP ID: ${record.sop_id}`);
                            if (record.system_family) console.log(`    System: ${record.system_family}`);
                            if (record.phase) console.log(`    Phase: ${record.phase}`);
                            if (record.service_tiers) console.log(`    Service Tiers: ${JSON.stringify(record.service_tiers)}`);
                        });
                    }
                } else {
                    console.log('No sample data available - table is empty');
                }

            } catch (error) {
                console.log(`❌ Error accessing table: ${error.message}`);
            }

            console.log('\n');
        }

        // Check what data we should have from our CSV files
        console.log('📁 EXPECTED DATA FROM CSV FILES');
        console.log('================================');

        // Check Task Library CSV
        const fs = await import('fs');
        const path = await import('path');
        const { fileURLToPath } = await import('url');

        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        try {
            const taskCsvPath = path.join(__dirname, '..', 'docs', 'data', 'Task_Library_v22.csv');
            const sopCsvPath = path.join(__dirname, '..', 'docs', 'data', 'SOP_Library_v22.csv');

            if (fs.existsSync(taskCsvPath)) {
                const taskCsv = fs.readFileSync(taskCsvPath, 'utf8');
                const taskLines = taskCsv.split('\n').filter(line => line.trim());
                console.log(`Task Library CSV: ${taskLines.length - 1} records (excluding header)`);

                if (taskLines.length > 1) {
                    const headers = taskLines[0].split(',');
                    console.log('Task CSV Headers:', headers.slice(0, 10).join(', ') + '...');

                    // Show first task record
                    const firstTask = taskLines[1].split(',');
                    console.log('First Task Record:');
                    headers.slice(0, 5).forEach((header, index) => {
                        console.log(`  ${header}: ${firstTask[index] || 'empty'}`);
                    });
                }
            } else {
                console.log('❌ Task Library CSV not found');
            }

            if (fs.existsSync(sopCsvPath)) {
                const sopCsv = fs.readFileSync(sopCsvPath, 'utf8');
                const sopLines = sopCsv.split('\n').filter(line => line.trim());
                console.log(`\nSOP Library CSV: ${sopLines.length - 1} records (excluding header)`);

                if (sopLines.length > 1) {
                    const headers = sopLines[0].split(',');
                    console.log('SOP CSV Headers:', headers.slice(0, 10).join(', ') + '...');

                    // Show first SOP record
                    const firstSop = sopLines[1].split(',');
                    console.log('First SOP Record:');
                    headers.slice(0, 5).forEach((header, index) => {
                        console.log(`  ${header}: ${firstSop[index] || 'empty'}`);
                    });
                }
            } else {
                console.log('❌ SOP Library CSV not found');
            }

        } catch (error) {
            console.log('❌ Error reading CSV files:', error.message);
        }

        // Recommendations
        console.log('\n💡 RECOMMENDATIONS');
        console.log('==================');

        console.log('Based on the analysis:');
        console.log('1. The main table for tasks/SOPs appears to be one of the existing tables');
        console.log('2. We need to identify which table should receive the CSV data');
        console.log('3. The table structure needs to match the CSV column headers');
        console.log('4. We may need to create the correct table structure if missing');

    } catch (error) {
        console.error('Analysis failed:', error);
    }
}

checkTaskSOPStructure();