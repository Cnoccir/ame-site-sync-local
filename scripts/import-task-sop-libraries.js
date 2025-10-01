#!/usr/bin/env node

/**
 * Import Task and SOP Libraries from CSV files
 * Reads Task_Library_v22.csv and SOP_Library_v22.csv and imports into task_sop_library table
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
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

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

function convertTaskData(csvRow) {
    // Parse service tiers from comma-separated string to array
    const serviceTiers = csvRow.Service_Tiers ?
        csvRow.Service_Tiers.split(',').map(t => t.trim()).filter(t => t) :
        ['CORE'];

    // Parse SOP references
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
    // Parse service tiers from comma-separated string to array
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

async function importTaskLibrary() {
    try {
        console.log('Importing Task Library...');

        const csvPath = path.join(__dirname, '..', 'docs', 'data', 'Task_Library_v22.csv');
        console.log('Reading Task Library CSV from:', csvPath);

        if (!fs.existsSync(csvPath)) {
            throw new Error(`Task Library CSV file not found: ${csvPath}`);
        }

        const csvText = fs.readFileSync(csvPath, 'utf8');
        const csvData = parseCSV(csvText);

        console.log(`Parsed ${csvData.length} task records from CSV`);

        // Convert and import data in batches
        const batchSize = 50;
        let imported = 0;
        let errors = 0;

        for (let i = 0; i < csvData.length; i += batchSize) {
            const batch = csvData.slice(i, i + batchSize);
            const convertedBatch = batch.map(convertTaskData);

            console.log(`Importing task batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(csvData.length/batchSize)} (${convertedBatch.length} records)...`);

            const { data, error } = await supabase
                .from('task_sop_library')
                .insert(convertedBatch);

            if (error) {
                console.error('Task batch import error:', error);
                errors += convertedBatch.length;
            } else {
                imported += convertedBatch.length;
                console.log(`✓ Imported ${convertedBatch.length} task records`);
            }
        }

        return { imported, errors, total: csvData.length };
    } catch (error) {
        console.error('Task library import failed:', error);
        return { imported: 0, errors: 0, total: 0, error };
    }
}

async function importSOPLibrary() {
    try {
        console.log('\nImporting SOP Library...');

        const csvPath = path.join(__dirname, '..', 'docs', 'data', 'SOP_Library_v22.csv');
        console.log('Reading SOP Library CSV from:', csvPath);

        if (!fs.existsSync(csvPath)) {
            throw new Error(`SOP Library CSV file not found: ${csvPath}`);
        }

        const csvText = fs.readFileSync(csvPath, 'utf8');
        const csvData = parseCSV(csvText);

        console.log(`Parsed ${csvData.length} SOP records from CSV`);

        // Convert and import data in batches
        const batchSize = 50;
        let imported = 0;
        let errors = 0;

        for (let i = 0; i < csvData.length; i += batchSize) {
            const batch = csvData.slice(i, i + batchSize);
            const convertedBatch = batch.map(convertSOPData);

            console.log(`Importing SOP batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(csvData.length/batchSize)} (${convertedBatch.length} records)...`);

            const { data, error } = await supabase
                .from('task_sop_library')
                .insert(convertedBatch);

            if (error) {
                console.error('SOP batch import error:', error);
                errors += convertedBatch.length;
            } else {
                imported += convertedBatch.length;
                console.log(`✓ Imported ${convertedBatch.length} SOP records`);
            }
        }

        return { imported, errors, total: csvData.length };
    } catch (error) {
        console.error('SOP library import failed:', error);
        return { imported: 0, errors: 0, total: 0, error };
    }
}

async function importLibraries() {
    try {
        console.log('Starting Task and SOP Library import...');

        // Clear existing data
        console.log('Clearing existing task/SOP library data...');
        const { error: deleteError } = await supabase
            .from('task_sop_library')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

        if (deleteError) {
            console.warn('Warning clearing existing data:', deleteError.message);
        }

        // Import both libraries
        const taskResults = await importTaskLibrary();
        const sopResults = await importSOPLibrary();

        console.log('\n=== Import Summary ===');
        console.log(`Task Library - Total: ${taskResults.total}, Imported: ${taskResults.imported}, Errors: ${taskResults.errors}`);
        console.log(`SOP Library - Total: ${sopResults.total}, Imported: ${sopResults.imported}, Errors: ${sopResults.errors}`);
        console.log(`\nOverall - Imported: ${taskResults.imported + sopResults.imported}, Errors: ${taskResults.errors + sopResults.errors}`);

        if (taskResults.imported > 0 || sopResults.imported > 0) {
            console.log('\n✓ Task and SOP library import completed!');
        } else {
            console.log('\n✗ Import failed - no records were imported');
            process.exit(1);
        }

    } catch (error) {
        console.error('Import failed:', error);
        process.exit(1);
    }
}

// Run the import
importLibraries();