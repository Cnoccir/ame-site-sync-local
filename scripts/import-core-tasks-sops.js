#!/usr/bin/env node

/**
 * Import CORE Tasks and SOPs
 * Focus on importing just the CORE service tier tasks and SOPs (8 each)
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

// Better CSV parser that handles multi-line fields
function parseCSVAdvanced(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const records = [];
    let currentRecord = [];
    let inQuotes = false;
    let currentField = '';

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];

        for (let j = 0; j < line.length; j++) {
            const char = line[j];

            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                currentRecord.push(currentField.trim());
                currentField = '';
            } else {
                currentField += char;
            }
        }

        // If we're not in quotes, this line ends a record
        if (!inQuotes) {
            currentRecord.push(currentField.trim());

            // Only add if we have the right number of fields
            if (currentRecord.length === headers.length) {
                const record = {};
                headers.forEach((header, index) => {
                    record[header] = currentRecord[index] || null;
                });
                records.push(record);
            }

            currentRecord = [];
            currentField = '';
        } else {
            // Continue on next line
            currentField += '\n';
        }
    }

    return records;
}

// Simplified parser - extract records manually for CORE tasks
function extractCoreRecords(csvText, recordType) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    const coreRecords = [];
    let i = 1;

    while (i < lines.length && coreRecords.length < 8) {
        try {
            // Look for records that contain 'CORE' in the service tiers
            const line = lines[i];
            if (line.includes('CORE') && (line.startsWith('C0') || line.startsWith('SOP_C'))) {
                console.log(`Found CORE record: ${line.substring(0, 50)}...`);

                // Extract the key fields manually for CORE records
                const parts = line.split(',');
                if (parts.length >= 6) {
                    const record = {
                        id: parts[0]?.trim(),
                        title: parts[1]?.trim(),
                        system_family: parts[2]?.trim() || null,
                        vendor_flavor: parts[3]?.trim() || null,
                        phase: parts[4]?.trim() || null,
                        service_tiers: 'CORE',
                        record_type: recordType
                    };

                    coreRecords.push(record);
                }
            }
        } catch (error) {
            console.log(`Error parsing line ${i}: ${error.message}`);
        }
        i++;
    }

    return coreRecords;
}

async function findWorkingTable() {
    console.log('🔍 Finding a working table for task/SOP data...');

    // Try different possible table structures
    const candidateTables = [
        'ame_task_catalog',
        'ame_sop_catalog',
        'task_library',
        'sop_library',
        'tasks',
        'sops'
    ];

    for (const tableName of candidateTables) {
        try {
            console.log(`Testing table: ${tableName}`);

            // Try a simple select to see if table exists and is accessible
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (!error) {
                console.log(`✅ ${tableName} is accessible!`);

                // Try inserting a test record
                const testRecord = {
                    title: 'Test Task',
                    system_family: 'Test',
                    phase: 'Test',
                    service_tiers: ['CORE'],
                    is_active: true
                };

                const { error: insertError } = await supabase
                    .from(tableName)
                    .insert([testRecord]);

                if (!insertError) {
                    console.log(`✅ ${tableName} accepts inserts!`);

                    // Clean up test record
                    await supabase
                        .from(tableName)
                        .delete()
                        .eq('title', 'Test Task');

                    return tableName;
                } else {
                    console.log(`❌ ${tableName} insert failed: ${insertError.message}`);
                }
            } else {
                console.log(`❌ ${tableName} not accessible: ${error.message}`);
            }
        } catch (e) {
            console.log(`❌ ${tableName} error: ${e.message}`);
        }
    }

    return null;
}

async function importCoreTasksSOPs() {
    console.log('🎯 IMPORTING CORE TASKS & SOPs (8 each)');
    console.log('=======================================\n');

    try {
        // Find a working table
        const workingTable = await findWorkingTable();

        if (!workingTable) {
            console.log('❌ No accessible table found for task/SOP data');
            console.log('📋 Manual steps required:');
            console.log('1. Check Supabase dashboard for available tables');
            console.log('2. Verify table permissions and structure');
            console.log('3. Create task_sop_library table if needed');
            return;
        }

        console.log(`🎯 Using table: ${workingTable}\n`);

        // Read and parse Task Library for CORE tasks
        console.log('📚 Processing Task Library...');
        const taskPath = path.join(__dirname, '..', 'docs', 'data', 'Task_Library_v22.csv');

        if (fs.existsSync(taskPath)) {
            const taskCsv = fs.readFileSync(taskPath, 'utf8');
            const coreTaskLines = taskCsv.split('\n').filter(line =>
                line.includes('CORE') && line.startsWith('C0')
            );

            console.log(`Found ${coreTaskLines.length} CORE task lines`);

            // Extract first 8 CORE tasks manually
            const coreTasks = [];
            for (let i = 0; i < Math.min(8, coreTaskLines.length); i++) {
                const line = coreTaskLines[i];
                const parts = line.split(',');

                if (parts.length >= 6) {
                    const task = {
                        task_id: parts[0]?.trim(),
                        title: parts[1]?.trim().replace(/"/g, ''),
                        system_family: parts[2]?.trim() || null,
                        vendor_flavor: parts[3]?.trim() || null,
                        phase: parts[4]?.trim() || null,
                        service_tiers: ['CORE'],
                        frequency: parts[6]?.trim() || null,
                        audience_level: parts[8] ? parseInt(parts[8]) : null,
                        is_active: true,
                        record_type: 'task'
                    };

                    coreTasks.push(task);
                    console.log(`  ✓ ${task.task_id}: ${task.title}`);
                }
            }

            // Import CORE tasks
            if (coreTasks.length > 0) {
                console.log(`\nImporting ${coreTasks.length} CORE tasks...`);

                const { error: taskError } = await supabase
                    .from(workingTable)
                    .insert(coreTasks);

                if (taskError) {
                    console.log(`❌ Task import error: ${taskError.message}`);
                } else {
                    console.log(`✅ Successfully imported ${coreTasks.length} CORE tasks`);
                }
            }
        }

        // Read and parse SOP Library for CORE SOPs
        console.log('\n📖 Processing SOP Library...');
        const sopPath = path.join(__dirname, '..', 'docs', 'data', 'SOP_Library_v22.csv');

        if (fs.existsSync(sopPath)) {
            const sopCsv = fs.readFileSync(sopPath, 'utf8');
            const coreSOPLines = sopCsv.split('\n').filter(line =>
                line.includes('CORE') && line.startsWith('SOP_C')
            );

            console.log(`Found ${coreSOPLines.length} CORE SOP lines`);

            // Extract first 8 CORE SOPs manually
            const coreSOPs = [];
            for (let i = 0; i < Math.min(8, coreSOPLines.length); i++) {
                const line = coreSOPLines[i];
                const parts = line.split(',');

                if (parts.length >= 6) {
                    const sop = {
                        sop_id: parts[0]?.trim(),
                        title: parts[1]?.trim().replace(/"/g, ''),
                        system_family: parts[2]?.trim() || null,
                        vendor_flavor: parts[3]?.trim() || null,
                        phase: parts[4]?.trim() || null,
                        service_tiers: ['CORE'],
                        audience_level: parts[7] ? parseInt(parts[7]) : null,
                        is_active: true,
                        record_type: 'sop'
                    };

                    coreSOPs.push(sop);
                    console.log(`  ✓ ${sop.sop_id}: ${sop.title}`);
                }
            }

            // Import CORE SOPs
            if (coreSOPs.length > 0) {
                console.log(`\nImporting ${coreSOPs.length} CORE SOPs...`);

                const { error: sopError } = await supabase
                    .from(workingTable)
                    .insert(coreSOPs);

                if (sopError) {
                    console.log(`❌ SOP import error: ${sopError.message}`);
                } else {
                    console.log(`✅ Successfully imported ${coreSOPs.length} CORE SOPs`);
                }
            }
        }

        // Final verification
        console.log('\n🔍 Final Verification...');
        const { count: totalCount } = await supabase
            .from(workingTable)
            .select('*', { count: 'exact', head: true });

        const { count: taskCount } = await supabase
            .from(workingTable)
            .select('*', { count: 'exact', head: true })
            .eq('record_type', 'task');

        const { count: sopCount } = await supabase
            .from(workingTable)
            .select('*', { count: 'exact', head: true })
            .eq('record_type', 'sop');

        console.log(`📊 Import Results:`);
        console.log(`   Total records: ${totalCount}`);
        console.log(`   Tasks: ${taskCount}`);
        console.log(`   SOPs: ${sopCount}`);

        console.log('\n🎉 CORE task/SOP import completed!');

    } catch (error) {
        console.error('Import failed:', error);
    }
}

importCoreTasksSOPs();