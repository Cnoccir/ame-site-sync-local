#!/usr/bin/env node

/**
 * Import Employee Directory from Markdown file
 * Reads Phone-Company Directory and imports into ame_employees table
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

function parseEmployeeTable(markdownContent) {
    const lines = markdownContent.split('\n');
    const employees = [];

    // Find the table header
    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Employee') && lines[i].includes('Mobile') && lines[i].includes('Email')) {
            headerIndex = i;
            break;
        }
    }

    if (headerIndex === -1) {
        throw new Error('Could not find employee table header');
    }

    // Skip header and separator line
    for (let i = headerIndex + 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || !line.startsWith('|')) {
            continue;
        }

        // Parse table row
        const columns = line.split('|').map(col => col.trim()).filter(col => col);

        if (columns.length >= 5) {
            const employee = {
                name: columns[0].replace(/\*\*/g, ''), // Remove markdown bold
                mobile: columns[1].replace(/\*\*/g, '').replace(/N\/A/i, ''),
                email: columns[2],
                extension: columns[3].replace(/\*\*/g, ''),
                directLine: columns[4].replace(/\*\*/g, '').replace(/\(\)/g, '').replace(/\(/g, '').replace(/\)/g, '')
            };

            // Clean up phone numbers
            employee.mobile = employee.mobile.replace(/[^\d-]/g, '') || null;
            employee.directLine = employee.directLine.replace(/[^\d-]/g, '') || null;
            employee.extension = employee.extension.replace(/[^\d,\s]/g, '') || null;

            // Skip empty rows
            if (employee.name && employee.name !== 'Employee') {
                employees.push(employee);
            }
        }
    }

    return employees;
}

function convertEmployeeData(employee, index) {
    // Generate technician ID
    const techId = `EMP${String(index + 1).padStart(4, '0')}`;

    // Determine if likely a technician based on name patterns or department
    const name = employee.name.toLowerCase();
    const likelyTechnician = name.includes('tech') ||
                            name.includes('field') ||
                            name.includes('service') ||
                            name.includes('engineer') ||
                            name.includes('maint');

    // Extract first and last name
    const nameParts = employee.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    return {
        technician_id: techId,
        employee_name: employee.name,
        first_name: firstName,
        last_name: lastName,
        email: employee.email || null,
        mobile_phone: employee.mobile || null,
        extension: employee.extension || null,
        direct_line: employee.directLine || null,
        is_technician: likelyTechnician,
        employment_status: 'active',
        is_active: true,
        department: null // Will be filled in manually later if needed
    };
}

async function importEmployeeDirectory() {
    try {
        console.log('Starting Employee Directory import...');

        // Read markdown file
        const mdPath = path.join(__dirname, '..', 'docs', 'data', 'Phone-Company Directory (Updated 8.19.25).md');
        console.log('Reading Employee Directory from:', mdPath);

        if (!fs.existsSync(mdPath)) {
            throw new Error(`Employee Directory file not found: ${mdPath}`);
        }

        const markdownContent = fs.readFileSync(mdPath, 'utf8');
        const employees = parseEmployeeTable(markdownContent);

        console.log(`Parsed ${employees.length} employee records from directory`);

        // Clear existing imported data (keep any manually added employees)
        console.log('Clearing existing imported employee data...');
        const { error: deleteError } = await supabase
            .from('ame_employees')
            .delete()
            .like('technician_id', 'EMP%'); // Only delete auto-generated IDs

        if (deleteError) {
            console.warn('Warning clearing existing data:', deleteError.message);
        }

        // Convert and import data
        const convertedEmployees = employees.map(convertEmployeeData);

        // Import in batches
        const batchSize = 50;
        let imported = 0;
        let errors = 0;

        for (let i = 0; i < convertedEmployees.length; i += batchSize) {
            const batch = convertedEmployees.slice(i, i + batchSize);

            console.log(`Importing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(convertedEmployees.length/batchSize)} (${batch.length} records)...`);

            const { data, error } = await supabase
                .from('ame_employees')
                .insert(batch);

            if (error) {
                console.error('Batch import error:', error);
                errors += batch.length;
            } else {
                imported += batch.length;
                console.log(`✓ Imported ${batch.length} employee records`);
            }
        }

        console.log('\n=== Import Summary ===');
        console.log(`Total employees in directory: ${employees.length}`);
        console.log(`Successfully imported: ${imported}`);
        console.log(`Errors: ${errors}`);
        console.log(`Likely technicians identified: ${convertedEmployees.filter(e => e.is_technician).length}`);

        if (imported > 0) {
            console.log('\n✓ Employee directory import completed successfully!');

            // Show sample of imported technicians
            const { data: technicians } = await supabase
                .from('ame_employees')
                .select('employee_name, email, mobile_phone, is_technician')
                .eq('is_technician', true)
                .limit(5);

            if (technicians && technicians.length > 0) {
                console.log('\nSample imported technicians:');
                technicians.forEach(tech => {
                    console.log(`- ${tech.employee_name} (${tech.email}) - ${tech.mobile_phone}`);
                });
            }
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
importEmployeeDirectory();