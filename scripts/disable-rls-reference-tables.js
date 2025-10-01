#!/usr/bin/env node

/**
 * Disable RLS on Reference Tables
 * Reference tables like simpro_customers should be publicly readable
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function disableRLS() {
    try {
        console.log('🔧 Disabling RLS on reference tables...');

        // Note: We can't directly ALTER TABLE via the client, but we can try using RPC
        // Let's create a function to disable RLS
        const sqlCommands = [
            'ALTER TABLE simpro_customers DISABLE ROW LEVEL SECURITY;',
            'ALTER TABLE simpro_customer_contracts DISABLE ROW LEVEL SECURITY;',
            'ALTER TABLE task_sop_library DISABLE ROW LEVEL SECURITY;',
            'ALTER TABLE ame_employees DISABLE ROW LEVEL SECURITY;'
        ];

        for (const sql of sqlCommands) {
            console.log(`Executing: ${sql}`);
            try {
                // We'll need to execute this through the Supabase dashboard or a direct connection
                // For now, let's just log what needs to be done
                console.log(`✓ Prepared: ${sql}`);
            } catch (error) {
                console.error(`✗ Failed: ${sql}`, error.message);
            }
        }

        console.log('\n📋 Manual Steps Required:');
        console.log('Since we cannot execute DDL through the client, please run these commands in the Supabase SQL editor:');
        console.log('');
        sqlCommands.forEach(sql => console.log(sql));
        console.log('');
        console.log('This will allow reference tables to be accessed without authentication.');

        return true;
    } catch (error) {
        console.error('Failed to disable RLS:', error);
        return false;
    }
}

// Run the function
disableRLS();