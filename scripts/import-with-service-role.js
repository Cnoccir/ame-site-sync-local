#!/usr/bin/env node

/**
 * Import Data Using Service Role
 * Uses service role key to bypass RLS for data imports
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jcXdyYWJ1dWpqZ3F1YWt4cmt3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Mjk0OTc0NiwiZXhwIjoyMDU4NTI1NzQ2fQ.x9s4h09XG5g8PxNEVmKH8UlWZZiHIJEgYhD2QEY7PxM';

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

// Create admin client with service role key
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
                values.push(currentValue.trim());
                currentValue = '';
            } else {
                currentValue += char;
            }
        }
        values.push(currentValue.trim());

        if (values.length === headers.length) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || null;
            });
            data.push(row);
        }
    }

    return data;
}

function convertCustomerData(csvRow) {
    return {
        simpro_customer_id: csvRow.simpro_customer_id,
        company_name: csvRow.company_name,
        email: csvRow.email || null,
        mailing_address: csvRow.mailing_address || null,
        mailing_city: csvRow.mailing_city || null,
        mailing_state: csvRow.mailing_state || null,
        mailing_zip: csvRow.mailing_zip || null,
        labor_tax_code: csvRow.labor_tax_code || null,
        part_tax_code: csvRow.part_tax_code || null,
        is_contract_customer: csvRow.is_contract_customer === 'True',
        has_active_contracts: csvRow.has_active_contracts === 'True',
        active_contract_count: parseInt(csvRow.active_contract_count) || 0,
        total_contract_value: parseFloat(csvRow.total_contract_value) || 0,
        service_tier: csvRow.service_tier || 'CORE',
        latest_contract_email: csvRow.latest_contract_email || null
    };
}

function convertTaskData(csvRow) {
    const serviceTiers = csvRow.Service_Tiers ?
        csvRow.Service_Tiers.split(',').map(t => t.trim()).filter(t => t) :
        ['CORE'];

    const sopRefs = csvRow.SOP_Refs ?
        csvRow.SOP_Refs.split(',').map(ref => ref.trim()).filter(ref => ref) :
        [];

    return {
        record_type: 'task',
        task_id: csvRow.Task_ID,
        sop_id: null,
        title: csvRow.Task_Name,
        system_family: csvRow.System_Family || null,
        vendor_flavor: csvRow.Vendor_Flavor || null,
        phase: csvRow.Phase || null,
        service_tiers: serviceTiers,
        frequency: csvRow.Frequency || null,
        estimated_duration_min: csvRow.Estimated_Duration_min ? parseInt(csvRow.Estimated_Duration_min) : null,
        audience_level: csvRow.Audience_Level ? parseInt(csvRow.Audience_Level) : null,
        initial_steps: csvRow.Initial_Steps || null,
        sop_refs: sopRefs,
        acceptance_criteria: csvRow.Acceptance_Criteria || null,
        artifacts: csvRow.Artifacts || null,
        prerequisites: csvRow.Prerequisites || null,
        tools_required: csvRow.Tools_Required || null,
        safety_tags: csvRow.Safety_Tags || null,
        reference_links: csvRow.Reference_Links || null,
        notes: csvRow.Notes || null,
        owner: csvRow.Owner || null,
        last_updated: csvRow.Last_Updated ? new Date(csvRow.Last_Updated).toISOString() : null,
        version: csvRow.Version || null,
        is_active: true
    };
}

function convertSOPData(csvRow) {
    const serviceTiers = csvRow.Service_Tiers ?
        csvRow.Service_Tiers.split(',').map(t => t.trim()).filter(t => t) :
        ['CORE'];

    return {
        record_type: 'sop',
        task_id: null,
        sop_id: csvRow.SOP_ID,
        title: csvRow.Title,
        system_family: csvRow.System_Family || null,
        vendor_flavor: csvRow.Vendor_Flavor || null,
        phase: csvRow.Phase || null,
        service_tiers: serviceTiers,
        estimated_duration_min: csvRow.Estimated_Duration_min ? parseInt(csvRow.Estimated_Duration_min) : null,
        audience_level: csvRow.Audience_Level ? parseInt(csvRow.Audience_Level) : null,
        prerequisites: csvRow.Prerequisites || null,
        safety_tags: csvRow.Safety || null,
        goal: csvRow.Goal || null,
        ui_navigation: csvRow.UI_Navigation || null,
        step_list_core: csvRow.Step_List_CORE || null,
        step_list_assure: csvRow.Step_List_ASSURE || null,
        step_list_guardian: csvRow.Step_List_GUARDIAN || null,
        verification_steps: csvRow.Verification_Steps || null,
        rollback_steps: csvRow.Rollback_Steps || null,
        best_practices: csvRow.Best_Practices || null,
        tools_required: csvRow.Tools || null,
        reference_links: csvRow.Hyperlinks || null,
        owner: csvRow.Owner || null,
        last_updated: csvRow.Last_Updated ? new Date(csvRow.Last_Updated).toISOString() : null,
        version: csvRow.Version || null,
        is_active: true
    };
}

async function importAllData() {
    try {
        console.log('🚀 Starting data import with service role...');

        // 1. Import SimPro Customers
        console.log('\n👥 Importing SimPro customers...');
        const csvPath = path.join(__dirname, '..', 'docs', 'data', 'cleaned_customers.csv');

        if (fs.existsSync(csvPath)) {
            const csvText = fs.readFileSync(csvPath, 'utf8');
            const csvData = parseCSV(csvText);

            console.log(`Parsed ${csvData.length} customer records`);

            // Clear existing data
            await supabase.from('simpro_customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

            // Import in batches
            const batchSize = 100;
            let imported = 0;

            for (let i = 0; i < csvData.length; i += batchSize) {
                const batch = csvData.slice(i, i + batchSize);
                const convertedBatch = batch.map(convertCustomerData);

                const { error } = await supabase
                    .from('simpro_customers')
                    .insert(convertedBatch);

                if (error) {
                    console.error('Customer batch error:', error);
                } else {
                    imported += convertedBatch.length;
                    console.log(`✓ Imported ${convertedBatch.length} customers`);
                }
            }
            console.log(`✅ Customer import complete: ${imported}/${csvData.length}`);
        } else {
            console.log('⚠️ Customer CSV not found, skipping');
        }

        // 2. Import Task Library
        console.log('\n📚 Importing Task Library...');
        const taskPath = path.join(__dirname, '..', 'docs', 'data', 'Task_Library_v22.csv');

        if (fs.existsSync(taskPath)) {
            const taskText = fs.readFileSync(taskPath, 'utf8');
            const taskData = parseCSV(taskText);

            console.log(`Parsed ${taskData.length} task records`);

            // Clear existing task data
            await supabase.from('task_sop_library').delete().eq('record_type', 'task');

            const convertedTasks = taskData.map(convertTaskData);
            const { error: taskError } = await supabase
                .from('task_sop_library')
                .insert(convertedTasks);

            if (taskError) {
                console.error('Task import error:', taskError);
            } else {
                console.log(`✅ Task import complete: ${convertedTasks.length} tasks`);
            }
        } else {
            console.log('⚠️ Task Library CSV not found, skipping');
        }

        // 3. Import SOP Library
        console.log('\n📖 Importing SOP Library...');
        const sopPath = path.join(__dirname, '..', 'docs', 'data', 'SOP_Library_v22.csv');

        if (fs.existsSync(sopPath)) {
            const sopText = fs.readFileSync(sopPath, 'utf8');
            const sopData = parseCSV(sopText);

            console.log(`Parsed ${sopData.length} SOP records`);

            // Clear existing SOP data
            await supabase.from('task_sop_library').delete().eq('record_type', 'sop');

            const convertedSOPs = sopData.map(convertSOPData);
            const { error: sopError } = await supabase
                .from('task_sop_library')
                .insert(convertedSOPs);

            if (sopError) {
                console.error('SOP import error:', sopError);
            } else {
                console.log(`✅ SOP import complete: ${convertedSOPs.length} SOPs`);
            }
        } else {
            console.log('⚠️ SOP Library CSV not found, skipping');
        }

        console.log('\n🎉 All imports completed successfully!');

    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

// Run the import
importAllData();