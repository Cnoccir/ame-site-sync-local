import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase configuration
const SUPABASE_URL = 'https://ncqwrabuujjgquakxrkw.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function loadSimProData() {
    console.log('🚀 Loading SimPro data to remote database...\n');
    
    try {
        // First, create the tables if they don't exist
        console.log('📋 Creating SimPro tables...');
        
        // Check if tables exist
        const { data: tables, error: tableError } = await supabase
            .from('simpro_customers')
            .select('id')
            .limit(1);
        
        if (tableError && tableError.code === '42P01') {
            // Table doesn't exist, create it
            console.log('Creating simpro_customers and simpro_customer_contracts tables...');
            
            const createTablesSQL = fs.readFileSync(
                path.join(__dirname, '..', 'supabase', 'migrations', '20250828051800_create_simpro_tables.sql'),
                'utf8'
            );
            
            // Execute via RPC if we have a function, or we'll do it differently
            console.log('Tables need to be created. Please run the migration first.');
            console.log('Run: npx supabase db push --db-url postgresql://postgres.ncqwrabuujjgquakxrkw:[YOUR_DB_PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres');
            return;
        }
        
        // Clear existing data
        console.log('🗑️ Clearing existing SimPro data...');
        
        const { error: deleteContractsError } = await supabase
            .from('simpro_customer_contracts')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            
        if (deleteContractsError && deleteContractsError.code !== '42P01') {
            console.error('Error clearing contracts:', deleteContractsError);
        }
        
        const { error: deleteCustomersError } = await supabase
            .from('simpro_customers')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
            
        if (deleteCustomersError && deleteCustomersError.code !== '42P01') {
            console.error('Error clearing customers:', deleteCustomersError);
        }
        
        // Load the cleaned data
        console.log('📖 Loading cleaned data files...');
        
        const customersData = fs.readFileSync(
            path.join(__dirname, '..', 'docs', 'cleaned_data', 'cleaned_customers.csv'),
            'utf8'
        );
        
        const contractsData = fs.readFileSync(
            path.join(__dirname, '..', 'docs', 'cleaned_data', 'cleaned_contracts.csv'),
            'utf8'
        );
        
        // Parse CSV data
        const parseCSV = (csvText) => {
            const lines = csvText.split('\n').filter(line => line.trim());
            const headers = lines[0].split(',').map(h => h.trim());
            const rows = [];
            
            for (let i = 1; i < lines.length; i++) {
                const values = [];
                let current = '';
                let inQuotes = false;
                
                for (let j = 0; j < lines[i].length; j++) {
                    const char = lines[i][j];
                    
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        values.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current.trim());
                
                const row = {};
                headers.forEach((header, index) => {
                    let value = values[index] || '';
                    // Convert string booleans to actual booleans
                    if (value === 'True' || value === 'true') value = true;
                    else if (value === 'False' || value === 'false') value = false;
                    // Convert numeric strings to numbers where needed
                    else if (header.includes('count') || header.includes('value')) {
                        const num = parseFloat(value);
                        if (!isNaN(num)) value = num;
                    }
                    row[header] = value;
                });
                
                if (Object.keys(row).length > 0) {
                    rows.push(row);
                }
            }
            
            return rows;
        };
        
        const customers = parseCSV(customersData);
        const contracts = parseCSV(contractsData);
        
        console.log(`📊 Loaded ${customers.length} customers and ${contracts.length} contracts`);
        
        // Filter to only customers with contracts
        const customersWithContracts = customers.filter(c => 
            contracts.some(contract => contract.matched_customer_id === c.simpro_customer_id)
        );
        
        console.log(`📊 ${customersWithContracts.length} customers have contracts`);
        
        // Insert customers in batches
        console.log('💾 Inserting customers...');
        const customerIdMap = new Map();
        
        for (let i = 0; i < customersWithContracts.length; i += 50) {
            const batch = customersWithContracts.slice(i, i + 50);
            const customersToInsert = batch.map(customer => ({
                simpro_customer_id: customer.simpro_customer_id,
                company_name: customer.company_name,
                email: customer.email || '',
                mailing_address: customer.mailing_address || '',
                mailing_city: customer.mailing_city || '',
                mailing_state: customer.mailing_state || '',
                mailing_zip: customer.mailing_zip || '',
                is_contract_customer: customer.is_contract_customer === true,
                has_active_contracts: customer.has_active_contracts === true,
                active_contract_count: parseInt(customer.active_contract_count) || 0,
                total_contract_value: parseFloat(customer.total_contract_value) || 0,
                service_tier: customer.service_tier || 'CORE'
            }));
            
            const { data, error } = await supabase
                .from('simpro_customers')
                .insert(customersToInsert)
                .select();
                
            if (error) {
                console.error(`Error inserting customers batch ${i/50 + 1}:`, error);
                continue;
            }
            
            // Store the mapping of simpro_customer_id to database id
            data.forEach(cust => {
                customerIdMap.set(cust.simpro_customer_id, cust.id);
            });
            
            console.log(`  ✅ Inserted batch ${i/50 + 1} (${data.length} customers)`);
        }
        
        // Insert contracts in batches
        console.log('💾 Inserting contracts...');
        const matchedContracts = contracts.filter(c => customerIdMap.has(c.matched_customer_id));
        
        for (let i = 0; i < matchedContracts.length; i += 50) {
            const batch = matchedContracts.slice(i, i + 50);
            const contractsToInsert = batch.map(contract => ({
                customer_id: customerIdMap.get(contract.matched_customer_id),
                contract_name: contract.contract_name,
                contract_number: contract.contract_number || '',
                contract_value: parseFloat(contract.contract_value) || 0,
                contract_status: contract.contract_status || 'expired',
                start_date: contract.start_date || null,
                end_date: contract.end_date || null
            }));
            
            const { data, error } = await supabase
                .from('simpro_customer_contracts')
                .insert(contractsToInsert)
                .select();
                
            if (error) {
                console.error(`Error inserting contracts batch ${i/50 + 1}:`, error);
                continue;
            }
            
            console.log(`  ✅ Inserted batch ${i/50 + 1} (${data.length} contracts)`);
        }
        
        // Get final statistics
        const { count: customerCount } = await supabase
            .from('simpro_customers')
            .select('*', { count: 'exact', head: true });
            
        const { count: contractCount } = await supabase
            .from('simpro_customer_contracts')
            .select('*', { count: 'exact', head: true });
        
        console.log('\n✅ SimPro data successfully loaded to remote database!');
        console.log(`📊 Final counts:`);
        console.log(`   - Customers: ${customerCount}`);
        console.log(`   - Contracts: ${contractCount}`);
        
    } catch (error) {
        console.error('❌ Error loading SimPro data:', error);
    }
}

// Run the loader
loadSimProData();
