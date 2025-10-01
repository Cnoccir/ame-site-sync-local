#!/usr/bin/env node

/**
 * Import Tasks, SOPs, and Employees
 * Uses the correct table names and structures
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

function parseEmployeeTable(markdownContent) {
    const lines = markdownContent.split('\n');
    const employees = [];

    let headerIndex = -1;
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('Employee') && lines[i].includes('Mobile') && lines[i].includes('Email')) {
            headerIndex = i;
            break;
        }
    }

    if (headerIndex === -1) return employees;

    for (let i = headerIndex + 2; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || !line.startsWith('|')) continue;

        const columns = line.split('|').map(col => col.trim()).filter(col => col);

        if (columns.length >= 5) {
            const employee = {
                name: columns[0].replace(/\*\*/g, ''),
                mobile: columns[1].replace(/\*\*/g, '').replace(/N\/A/i, ''),
                email: columns[2],
                extension: columns[3].replace(/\*\*/g, ''),
                directLine: columns[4].replace(/\*\*/g, '').replace(/\(\)/g, '').replace(/\(/g, '').replace(/\)/g, '')
            };

            employee.mobile = employee.mobile.replace(/[^\d-]/g, '') || null;
            employee.directLine = employee.directLine.replace(/[^\d-]/g, '') || null;
            employee.extension = employee.extension.replace(/[^\d,\s]/g, '') || null;

            if (employee.name && employee.name !== 'Employee') {
                employees.push(employee);
            }
        }
    }

    return employees;
}

async function importTasksAndSOPs() {
    try {
        console.log('📚 Importing to task_sop_library table...');

        // Get table structure first
        const { data: sampleRecord } = await supabase
            .from('task_sop_library')
            .select('*')
            .limit(1);

        console.log('Table structure exists, proceeding with imports...');

        // Import Task Library
        const taskPath = path.join(__dirname, '..', 'docs', 'data', 'Task_Library_v22.csv');
        if (fs.existsSync(taskPath)) {
            const taskText = fs.readFileSync(taskPath, 'utf8');
            const taskData = parseCSV(taskText);

            console.log(`Parsed ${taskData.length} task records`);

            if (taskData.length > 0) {
                // Convert tasks to match table structure
                const tasks = taskData.map((row, index) => {
                    const serviceTiers = row.Service_Tiers ?
                        row.Service_Tiers.split(',').map(t => t.trim()).filter(t => t) :
                        ['CORE'];

                    return {
                        title: row.Task_Name,
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
                        task_id: row.Task_ID,
                        initial_steps: row.Initial_Steps || null,
                        acceptance_criteria: row.Acceptance_Criteria || null,
                        artifacts: row.Artifacts || null,
                        frequency: row.Frequency || null,
                        reference_links: row.Reference_Links || null
                    };
                });

                const { error: taskError } = await supabase
                    .from('task_sop_library')
                    .insert(tasks);

                if (taskError) {
                    console.error('Task import error:', taskError);
                } else {
                    console.log(`✅ Imported ${tasks.length} tasks`);
                }
            }
        } else {
            console.log('⚠️ Task Library CSV not found');
        }

        // Import SOP Library
        const sopPath = path.join(__dirname, '..', 'docs', 'data', 'SOP_Library_v22.csv');
        if (fs.existsSync(sopPath)) {
            const sopText = fs.readFileSync(sopPath, 'utf8');
            const sopData = parseCSV(sopText);

            console.log(`Parsed ${sopData.length} SOP records`);

            if (sopData.length > 0) {
                const sops = sopData.map(row => {
                    const serviceTiers = row.Service_Tiers ?
                        row.Service_Tiers.split(',').map(t => t.trim()).filter(t => t) :
                        ['CORE'];

                    return {
                        title: row.Title,
                        system_family: row.System_Family || null,
                        vendor_flavor: row.Vendor_Flavor || null,
                        phase: row.Phase || null,
                        service_tiers: serviceTiers,
                        estimated_duration_min: row.Estimated_Duration_min ? parseInt(row.Estimated_Duration_min) : null,
                        audience_level: row.Audience_Level ? parseInt(row.Audience_Level) : null,
                        prerequisites: row.Prerequisites || null,
                        safety_tags: row.Safety || null,
                        tools_required: row.Tools || null,
                        notes: null,
                        owner: row.Owner || null,
                        version: row.Version || null,
                        is_active: true,
                        sop_id: row.SOP_ID,
                        goal: row.Goal || null,
                        ui_navigation: row.UI_Navigation || null,
                        step_list_core: row.Step_List_CORE || null,
                        step_list_assure: row.Step_List_ASSURE || null,
                        step_list_guardian: row.Step_List_GUARDIAN || null,
                        verification_steps: row.Verification_Steps || null,
                        rollback_steps: row.Rollback_Steps || null,
                        best_practices: row.Best_Practices || null,
                        reference_links: row.Hyperlinks || null
                    };
                });

                const { error: sopError } = await supabase
                    .from('task_sop_library')
                    .insert(sops);

                if (sopError) {
                    console.error('SOP import error:', sopError);
                } else {
                    console.log(`✅ Imported ${sops.length} SOPs`);
                }
            }
        } else {
            console.log('⚠️ SOP Library CSV not found');
        }

    } catch (error) {
        console.error('Task/SOP import failed:', error);
    }
}

async function importEmployees() {
    try {
        console.log('\n🧑‍💼 Importing employee directory...');

        const mdPath = path.join(__dirname, '..', 'docs', 'data', 'Phone-Company Directory (Updated 8.19.25).md');

        if (fs.existsSync(mdPath)) {
            const markdownContent = fs.readFileSync(mdPath, 'utf8');
            const employees = parseEmployeeTable(markdownContent);

            console.log(`Parsed ${employees.length} employee records`);

            if (employees.length > 0) {
                // Clear existing imported employees (keep manual ones)
                await supabase
                    .from('ame_employees')
                    .delete()
                    .like('technician_id', 'EMP%');

                const convertedEmployees = employees.map((employee, index) => {
                    const techId = `EMP${String(index + 1).padStart(4, '0')}`;
                    const name = employee.name.toLowerCase();
                    const likelyTechnician = name.includes('tech') ||
                                           name.includes('field') ||
                                           name.includes('service') ||
                                           name.includes('engineer') ||
                                           name.includes('maint');

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
                        is_active: true
                    };
                });

                const { error: empError } = await supabase
                    .from('ame_employees')
                    .insert(convertedEmployees);

                if (empError) {
                    console.error('Employee import error:', empError);
                } else {
                    console.log(`✅ Imported ${convertedEmployees.length} employees`);
                    console.log(`   Technicians identified: ${convertedEmployees.filter(e => e.is_technician).length}`);
                }
            }
        } else {
            console.log('⚠️ Employee directory not found');
        }

    } catch (error) {
        console.error('Employee import failed:', error);
    }
}

async function runAllImports() {
    console.log('🚀 Starting Task, SOP, and Employee imports...');

    await importTasksAndSOPs();
    await importEmployees();

    console.log('\n🎉 All imports completed!');
}

runAllImports();