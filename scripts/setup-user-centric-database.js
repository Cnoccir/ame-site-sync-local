#!/usr/bin/env node

/**
 * Master Setup Script for User-Centric Database
 * This script orchestrates the complete database setup:
 * 1. Apply migrations for user-centric access control
 * 2. Import all reference data (SimPro, Tasks, SOPs, Employees)
 * 3. Set up admin/tech permissions
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function runCommand(command, description) {
    console.log(`\n🔄 ${description}...`);
    console.log(`Running: ${command}`);

    try {
        const output = execSync(command, {
            cwd: path.join(__dirname, '..'),
            stdio: 'inherit',
            encoding: 'utf8'
        });
        console.log(`✅ ${description} completed successfully`);
        return true;
    } catch (error) {
        console.error(`❌ ${description} failed:`, error.message);
        return false;
    }
}

async function setupDatabase() {
    console.log('🚀 Starting User-Centric Database Setup');
    console.log('=====================================');

    let success = true;

    // Step 1: Apply migrations to remote database
    console.log('\n📊 STEP 1: Applying database migrations...');
    if (!runCommand('supabase db push', 'Apply migrations to remote database')) {
        success = false;
    }

    // Step 2: Import SimPro customer data
    console.log('\n👥 STEP 2: Importing SimPro customer data...');
    if (!runCommand('node scripts/import-simpro-customers.js', 'Import SimPro customer data')) {
        success = false;
    }

    // Step 3: Import Task and SOP libraries
    console.log('\n📚 STEP 3: Importing Task and SOP libraries...');
    if (!runCommand('node scripts/import-task-sop-libraries.js', 'Import Task and SOP libraries')) {
        success = false;
    }

    // Step 4: Import employee directory
    console.log('\n🧑‍💼 STEP 4: Importing employee directory...');
    if (!runCommand('node scripts/import-employee-directory.js', 'Import employee directory')) {
        success = false;
    }

    // Step 5: Verify setup
    console.log('\n🔍 STEP 5: Verifying setup...');
    if (!runCommand('node scripts/verify-database-setup.js', 'Verify database setup')) {
        success = false;
    }

    // Summary
    console.log('\n📋 SETUP SUMMARY');
    console.log('================');

    if (success) {
        console.log('✅ Database setup completed successfully!');
        console.log('\n🎉 Your application now has:');
        console.log('   • User-centric project ownership');
        console.log('   • Admin/technician hardcoded access');
        console.log('   • Complete SimPro customer reference data');
        console.log('   • Task Library v22 imported');
        console.log('   • SOP Library v22 imported');
        console.log('   • Employee directory for quick search');
        console.log('\n🔐 Access Control:');
        console.log('   • Regular users: See only their own projects');
        console.log('   • Admins & Techs: See all projects');
        console.log('   • Hardcoded admin emails: admin@ame-inc.com, tech@ame-inc.com');

        console.log('\n🚀 Next Steps:');
        console.log('   1. Test the application with different user roles');
        console.log('   2. Create user accounts and assign roles');
        console.log('   3. Verify project ownership is working correctly');
        console.log('   4. Check that reference data is accessible');

    } else {
        console.log('❌ Database setup encountered errors!');
        console.log('\n🔧 Troubleshooting:');
        console.log('   1. Check Supabase connection in .env file');
        console.log('   2. Verify migration files are valid');
        console.log('   3. Ensure CSV/MD data files exist in docs/data/');
        console.log('   4. Check console output above for specific errors');
        process.exit(1);
    }
}

// Run the setup
setupDatabase().catch(error => {
    console.error('Setup script failed:', error);
    process.exit(1);
});