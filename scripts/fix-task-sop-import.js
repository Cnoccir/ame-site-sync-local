#!/usr/bin/env node

/**
 * Fix Task and SOP Import
 * Properly import the task and SOP data into the correct tables
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

function parseCSV(csvText) {
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = [];
        let currentValue = '';
        let inQuotes = false;

        for (let j = 0; j < lines[i].length; j++) {
            const char = lines[i][j];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(currentValue.trim().replace(/^"|"$/g, ''));
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim().replace(/^"|"$/g, ''));

        if (values.length === headers.length && values[0]) { // Skip empty rows
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || null;
            });
            data.push(row);
        }
    }

    return data;
}

async function getTableStructure(tableName) {
    try {
        const { data: sample } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);

        if (sample) {
            return Object.keys(sample[0] || {});
        }
        return [];
    } catch (error) {
        return null;
    }
}

async function importToCorrectTable() {
    console.log('🔧 FIXING TASK & SOP IMPORT');
    console.log('============================\n');

    try {
        // First, let's check which tables we can actually use
        console.log('📊 Checking available tables...');

        const availableTables = [];
        const tablesToCheck = ['task_sop_library', 'tasks', 'sops', 'task_library', 'sop_library'];

        for (const table of tablesToCheck) {
            const structure = await getTableStructure(table);
            if (structure) {
                console.log(`✅ ${table}: Available (${structure.length} columns)`);
                availableTables.push({ name: table, columns: structure });
            } else {
                console.log(`❌ ${table}: Not accessible`);
            }
        }

        // Use the most comprehensive table (likely task_sop_library)
        let targetTable = availableTables.find(t => t.name === 'task_sop_library');
        if (!targetTable && availableTables.length > 0) {
            targetTable = availableTables[0]; // Use first available
        }

        if (!targetTable) {
            console.log('❌ No suitable target table found. Creating data in task_sop_library...');
            // We'll proceed anyway and let the database handle it
            targetTable = { name: 'task_sop_library', columns: [] };
        }

        console.log(`🎯 Using table: ${targetTable.name}`);

        // Import Tasks
        console.log('\n📚 Importing Tasks...');
        const taskPath = path.join(__dirname, '..', 'docs', 'data', 'Task_Library_v22.csv');

        if (fs.existsSync(taskPath)) {
            const taskText = fs.readFileSync(taskPath, 'utf8');
            const taskData = parseCSV(taskText);

            console.log(`Parsed ${taskData.length} task records`);

            if (taskData.length > 0) {
                console.log('Sample task data:');
                const sampleTask = taskData[0];
                Object.keys(sampleTask).slice(0, 5).forEach(key => {
                    console.log(`  ${key}: ${sampleTask[key]}`);
                });

                // Clear existing task data
                console.log('Clearing existing task data...');
                await supabase
                    .from(targetTable.name)
                    .delete()
                    .not('task_id', 'is', null);

                // Convert tasks to database format
                const tasks = taskData.map(row => {
                    const serviceTiers = row.Service_Tiers ?
                        row.Service_Tiers.split(',').map(t => t.trim()).filter(t => t) :
                        ['CORE'];

                    const sopRefs = row.SOP_Refs ?
                        row.SOP_Refs.split(',').map(ref => ref.trim()).filter(ref => ref) :
                        [];

                    return {
                        // Required fields
                        task_id: row.Task_ID,
                        title: row.Task_Name,

                        // Common fields
                        system_family: row.System_Family || null,
                        vendor_flavor: row.Vendor_Flavor || null,
                        phase: row.Phase || null,
                        service_tiers: serviceTiers,
                        estimated_duration_min: row.Estimated_Duration_min ? parseInt(row.Estimated_Duration_min) : null,
                        audience_level: row.Audience_Level ? parseInt(row.Audience_Level) : null,
                        prerequisites: row.Prerequisites || null,
                        safety_tags: row.Safety_Tags || null,
                        tools_required: row.Tools_Required || null,
                        notes: row.Notes || null,
                        owner: row.Owner || null,
                        version: row.Version || null,
                        is_active: true,

                        // Task-specific fields
                        initial_steps: row.Initial_Steps || null,
                        sop_refs: sopRefs,
                        acceptance_criteria: row.Acceptance_Criteria || null,
                        artifacts: row.Artifacts || null,
                        frequency: row.Frequency || null,
                        reference_links: row.Reference_Links || null,
                        last_updated: row.Last_Updated ? new Date(row.Last_Updated).toISOString() : null
                    };
                });

                // Import in batches
                const batchSize = 50;
                let imported = 0;

                for (let i = 0; i < tasks.length; i += batchSize) {
                    const batch = tasks.slice(i, i + batchSize);

                    console.log(`Importing task batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(tasks.length/batchSize)}...`);

                    const { error } = await supabase
                        .from(targetTable.name)
                        .insert(batch);

                    if (error) {
                        console.error(`Task batch error:`, error);
                        // Try individual inserts to see which records fail
                        for (const task of batch) {
                            const { error: singleError } = await supabase
                                .from(targetTable.name)
                                .insert([task]);

                            if (singleError) {
                                console.error(`Failed to insert task ${task.task_id}:`, singleError.message);
                            } else {
                                imported++;
                            }
                        }
                    } else {
                        imported += batch.length;
                        console.log(`✅ Imported ${batch.length} tasks`);
                    }
                }

                console.log(`✅ Tasks complete: ${imported}/${tasks.length} imported`);
            }
        } else {
            console.log('❌ Task Library CSV not found');
        }

        // Import SOPs
        console.log('\n📖 Importing SOPs...');
        const sopPath = path.join(__dirname, '..', 'docs', 'data', 'SOP_Library_v22.csv');

        if (fs.existsSync(sopPath)) {
            const sopText = fs.readFileSync(sopPath, 'utf8');
            const sopData = parseCSV(sopText);

            console.log(`Parsed ${sopData.length} SOP records`);

            if (sopData.length > 0) {
                console.log('Sample SOP data:');
                const sampleSop = sopData[0];
                Object.keys(sampleSop).slice(0, 5).forEach(key => {
                    console.log(`  ${key}: ${sampleSop[key]}`);
                });

                // Clear existing SOP data
                console.log('Clearing existing SOP data...');
                await supabase
                    .from(targetTable.name)
                    .delete()
                    .not('sop_id', 'is', null);

                // Convert SOPs to database format
                const sops = sopData.map(row => {
                    const serviceTiers = row.Service_Tiers ?
                        row.Service_Tiers.split(',').map(t => t.trim()).filter(t => t) :
                        ['CORE'];

                    return {
                        // Required fields
                        sop_id: row.SOP_ID,
                        title: row.Title,

                        // Common fields
                        system_family: row.System_Family || null,
                        vendor_flavor: row.Vendor_Flavor || null,
                        phase: row.Phase || null,
                        service_tiers: serviceTiers,
                        estimated_duration_min: row.Estimated_Duration_min ? parseInt(row.Estimated_Duration_min) : null,
                        audience_level: row.Audience_Level ? parseInt(row.Audience_Level) : null,
                        prerequisites: row.Prerequisites || null,
                        safety_tags: row.Safety || null,
                        tools_required: row.Tools || null,
                        owner: row.Owner || null,
                        version: row.Version || null,
                        is_active: true,

                        // SOP-specific fields
                        goal: row.Goal || null,
                        ui_navigation: row.UI_Navigation || null,
                        step_list_core: row.Step_List_CORE || null,
                        step_list_assure: row.Step_List_ASSURE || null,
                        step_list_guardian: row.Step_List_GUARDIAN || null,
                        verification_steps: row.Verification_Steps || null,
                        rollback_steps: row.Rollback_Steps || null,
                        best_practices: row.Best_Practices || null,
                        reference_links: row.Hyperlinks || null,
                        last_updated: row.Last_Updated ? new Date(row.Last_Updated).toISOString() : null
                    };
                });

                // Import in batches
                const batchSize = 50;
                let imported = 0;

                for (let i = 0; i < sops.length; i += batchSize) {
                    const batch = sops.slice(i, i + batchSize);

                    console.log(`Importing SOP batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(sops.length/batchSize)}...`);

                    const { error } = await supabase
                        .from(targetTable.name)
                        .insert(batch);

                    if (error) {
                        console.error(`SOP batch error:`, error);
                        // Try individual inserts
                        for (const sop of batch) {
                            const { error: singleError } = await supabase
                                .from(targetTable.name)
                                .insert([sop]);

                            if (singleError) {
                                console.error(`Failed to insert SOP ${sop.sop_id}:`, singleError.message);
                            } else {
                                imported++;
                            }
                        }
                    } else {
                        imported += batch.length;
                        console.log(`✅ Imported ${batch.length} SOPs`);
                    }
                }

                console.log(`✅ SOPs complete: ${imported}/${sops.length} imported`);
            }
        } else {
            console.log('❌ SOP Library CSV not found');
        }

        // Final verification
        console.log('\n🔍 Final Verification...');
        const { count: finalCount } = await supabase
            .from(targetTable.name)
            .select('*', { count: 'exact', head: true });

        console.log(`✅ Total records in ${targetTable.name}: ${finalCount}`);

        console.log('\n🎉 Task & SOP import fix completed!');

    } catch (error) {
        console.error('Import fix failed:', error);
    }
}

importToCorrectTable();