#!/usr/bin/env node

/**
 * Import SimPro Customer Data from CSV
 * Reads final_customer_database.csv and imports all 700+ customers
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
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

function convertCustomerData(csvRow) {
    return {
        legacy_customer_id: parseInt(csvRow.simpro_customer_id) || null,
        company_name: csvRow.company_name || '',
        site_nickname: csvRow.company_name || '',
        mailing_address: csvRow.mailing_address || null,
        mailing_city: csvRow.mailing_city || null,
        mailing_state: csvRow.mailing_state || null,
        mailing_zip: csvRow.mailing_zip || null,
        primary_contact_email: csvRow.email || csvRow.latest_contract_email || null,
        service_tier: csvRow.service_tier || 'CORE',
        has_active_contracts: csvRow.has_active_contracts === 'TRUE',
        total_contract_value: parseFloat(csvRow.total_contract_value) || 0,
        contract_number: csvRow.contract_number || null,
        contract_status: csvRow.contract_status || null,
        latest_contract_email: csvRow.latest_contract_email || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };
}

async function importCustomers() {
    try {
        console.log('Starting SimPro customer import...');

        // Read CSV file
        const csvPath = path.join(__dirname, '..', 'docs', 'cleaned_data', 'final_customer_database.csv');
        console.log('Reading CSV from:', csvPath);

        if (!fs.existsSync(csvPath)) {
            throw new Error(`CSV file not found: ${csvPath}`);
        }

        const csvText = fs.readFileSync(csvPath, 'utf8');
        const csvData = parseCSV(csvText);

        console.log(`Parsed ${csvData.length} customer records from CSV`);

        // Clear existing SimPro customers (keep manually created PM workflow customers)
        console.log('Clearing existing SimPro customer data...');
        const { error: deleteError } = await supabase
            .from('customers')
            .delete()
            .not('legacy_customer_id', 'is', null);

        if (deleteError) {
            console.warn('Warning clearing existing data:', deleteError.message);
        }

        // Import data in batches
        const batchSize = 50; // Smaller batches for better error handling
        let imported = 0;
        let errors = 0;

        for (let i = 0; i < csvData.length; i += batchSize) {
            const batch = csvData.slice(i, i + batchSize);
            const convertedBatch = batch.map(convertCustomerData).filter(customer =>
                customer.legacy_customer_id && customer.company_name
            );

            if (convertedBatch.length === 0) continue;

            console.log(`Importing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(csvData.length/batchSize)} (${convertedBatch.length} records)...`);

            try {
                const { data, error } = await supabase
                    .from('customers')
                    .upsert(convertedBatch, {
                        onConflict: 'legacy_customer_id',
                        ignoreDuplicates: false
                    });

                if (error) {
                    console.error('Batch import error:', error.message);
                    errors += convertedBatch.length;
                } else {
                    imported += convertedBatch.length;
                    console.log(`✓ Imported ${convertedBatch.length} records`);
                }
            } catch (err) {
                console.error('Batch exception:', err.message);
                errors += convertedBatch.length;
            }

            // Small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        console.log('\n=== Import Summary ===');
        console.log(`Total records in CSV: ${csvData.length}`);
        console.log(`Successfully imported: ${imported}`);
        console.log(`Errors: ${errors}`);

        // Verify final count
        const { count } = await supabase
            .from('customers')
            .select('*', { count: 'exact', head: true })
            .not('legacy_customer_id', 'is', null);

        console.log(`Total SimPro customers in database: ${count}`);

        if (imported > 0) {
            console.log('\n✓ SimPro customer import completed successfully!');
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
async function main() {
    await importCustomers();
}

main().catch(console.error);