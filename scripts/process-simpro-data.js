#!/usr/bin/env node

/**
 * SimPro Data Processing Script
 * 
 * This script processes the raw SimPro CSV files and generates:
 * 1. Cleaned and consolidated customer data
 * 2. Contract data linked to customers
 * 3. SQL INSERT statements ready for Supabase
 * 
 * Usage: node scripts/process-simpro-data.js
 */

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const INPUT_DIR = path.join(__dirname, '..', 'docs', 'data');
const OUTPUT_DIR = path.join(__dirname, '..', 'supabase', 'migrations');
const CUSTOMERS_CSV = path.join(INPUT_DIR, 'customers.csv');
const CONTRACTS_CSV = path.join(INPUT_DIR, 'Customer_Contracts_Report_reportTable.csv');
const OUTPUT_SQL = path.join(OUTPUT_DIR, '20240827_simpro_data_population.sql');

// Helper function to escape SQL strings
function escapeSQLString(str) {
    if (!str) return '';
    return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

// Helper function to parse CSV
function parseCSV(content) {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    if (lines.length === 0) return [];
    
    const headers = parseCSVLine(lines[0]);
    const rows = [];
    
    for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length > 0) {
            const row = {};
            headers.forEach((header, index) => {
                row[header] = values[index] || '';
            });
            rows.push(row);
        }
    }
    
    return rows;
}

// Helper function to parse a single CSV line (handles quoted values)
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                // Escaped quote
                current += '"';
                i++; // Skip next quote
            } else {
                // Toggle quote state
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // End of field
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    // Add final field
    result.push(current.trim());
    
    return result;
}

// Helper function to clean email
function cleanEmail(email) {
    if (!email) return '';
    return email.trim().toLowerCase();
}

// Helper function to clean address
function cleanAddress(address) {
    if (!address) return '';
    return address.replace(/\n/g, ', ').replace(/\r/g, '').trim();
}

// Helper function to parse contract value
function parseContractValue(value) {
    if (!value) return 0;
    const cleaned = value.replace(/[$,]/g, '');
    return parseFloat(cleaned) || 0;
}

// Helper function to parse date
function parseDate(dateString) {
    if (!dateString) return null;
    try {
        const date = new Date(dateString);
        return date.toISOString().split('T')[0];
    } catch {
        return null;
    }
}

// Helper function to determine service tier
function determineServiceTier(contractValue) {
    if (contractValue >= 250000) return 'GUARDIAN';
    if (contractValue >= 100000) return 'ASSURE';
    return 'CORE';
}

// Main processing function
function processSimProData() {
    console.log('🚀 Starting SimPro data processing...');
    
    // Read CSV files
    console.log('📖 Reading CSV files...');
    const customersContent = fs.readFileSync(CUSTOMERS_CSV, 'utf8');
    const contractsContent = fs.readFileSync(CONTRACTS_CSV, 'utf8');
    
    // Parse CSV data
    console.log('🔍 Parsing customer data...');
    const rawCustomers = parseCSV(customersContent);
    console.log(`Found ${rawCustomers.length} raw customer records`);
    
    console.log('🔍 Parsing contract data...');
    const rawContracts = parseCSV(contractsContent);
    console.log(`Found ${rawContracts.length} raw contract records`);
    
    // Process customers
    console.log('🧹 Cleaning customer data...');
    const customerMap = new Map();
    
    rawCustomers.forEach(raw => {
        // Skip rows without essential data
        if (!raw.Customer || !raw['Customer ID']) {
            return;
        }
        
        const customerId = raw['Customer ID'].toString().trim();
        const companyName = raw.Customer.trim();
        
        // Create or get existing customer
        if (!customerMap.has(customerId)) {
            customerMap.set(customerId, {
                id: uuidv4(),
                simpro_customer_id: customerId,
                company_name: companyName,
                email: cleanEmail(raw.Email),
                mailing_address: cleanAddress(raw['Mailing Address']),
                mailing_city: raw['Mailing City']?.trim() || '',
                mailing_state: raw['Mailing State']?.trim() || '',
                mailing_zip: raw['Mailing ZIP Code']?.trim() || '',
                labor_tax_code: raw['Labor Tax Code']?.trim() || '',
                part_tax_code: raw['Part Tax Code']?.trim() || '',
                is_contract_customer: raw['Contract Customer']?.trim().toLowerCase() === 'yes',
                has_active_contracts: false,
                total_contract_value: 0,
                active_contract_count: 0,
                latest_contract_email: '',
                service_tier: 'CORE',
                contracts: []
            });
        }
    });
    
    const customers = Array.from(customerMap.values());
    console.log(`Processed ${customers.length} unique customers`);
    
    // Process contracts
    console.log('🧹 Cleaning contract data...');
    const contracts = [];
    const customerByName = new Map();
    
    // Create lookup map by company name (with fuzzy matching)
    customers.forEach(customer => {
        // Add multiple variations of the name for better matching
        const name = customer.company_name.toUpperCase();
        customerByName.set(name, customer);
        
        // Also add without common suffixes/prefixes
        const cleaned = name
            .replace(/\b(LLC|INC|CORP|CORPORATION|COMPANY|CO|L\.?L\.?C\.?|INC\.?)\b/g, '')
            .replace(/[.,\-\(\)]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
        if (cleaned !== name) {
            customerByName.set(cleaned, customer);
        }
    });
    
    console.log('🔗 Linking contracts to customers...');
    let matchedContracts = 0;
    let unmatchedContracts = 0;
    
    rawContracts.forEach(raw => {
        // Skip header rows and invalid data
        if (!raw.Customer || raw.Customer.includes('Selected Criteria') || !raw['Contract Name']) {
            return;
        }
        
        const rawCustomerName = raw.Customer.trim().toUpperCase();
        
        // Try different matching strategies
        let customer = customerByName.get(rawCustomerName);
        
        // If no direct match, try cleaned version
        if (!customer) {
            const cleanedContractName = rawCustomerName
                .replace(/\b(LLC|INC|CORP|CORPORATION|COMPANY|CO|L\.?L\.?C\.?|INC\.?)\b/g, '')
                .replace(/[.,\-\(\)]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
            customer = customerByName.get(cleanedContractName);
        }
        
        // If still no match, try partial matching
        if (!customer) {
            const cleanedContractName = rawCustomerName
                .replace(/\b(LLC|INC|CORP|CORPORATION|COMPANY|CO|L\.?L\.?C\.?|INC\.?)\b/g, '')
                .replace(/[.,\-\(\)]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim();
                
            for (const [customerName, customerObj] of customerByName) {
                if (customerName.includes(cleanedContractName) || cleanedContractName.includes(customerName)) {
                    if (Math.abs(customerName.length - cleanedContractName.length) < 10) {
                        customer = customerObj;
                        break;
                    }
                }
            }
        }
        
        if (customer) {
            matchedContracts++;
        } else {
            unmatchedContracts++;
            // Log first few unmatched contracts for debugging
            if (unmatchedContracts <= 5) {
                console.log(`   ⚠️  Unmatched contract: "${rawCustomerName}"`);
            }
        }
        
        if (customer) {
            matchedContracts++;
            const contract = {
                id: uuidv4(),
                customer_id: customer.id,
                contract_name: raw['Contract Name'].trim(),
                contract_number: raw['Contract No.']?.trim() || '',
                contract_value: parseContractValue(raw.Value),
                contract_status: raw.Status?.trim() === 'Active' ? 'Active' : 'Expired',
                start_date: parseDate(raw['Start Date']),
                end_date: parseDate(raw['End Date']),
                contract_email: cleanEmail(raw.Email),
                contract_notes: raw.Notes?.trim() || ''
            };
            
            contracts.push(contract);
            customer.contracts.push(contract);
            
            // Update customer statistics
            if (contract.contract_status === 'Active') {
                customer.has_active_contracts = true;
                customer.active_contract_count += 1;
                customer.total_contract_value += contract.contract_value;
                
                if (contract.contract_email) {
                    customer.latest_contract_email = contract.contract_email;
                }
            }
        }
    });
    
    // Update service tiers
    customers.forEach(customer => {
        customer.service_tier = determineServiceTier(customer.total_contract_value);
    });
    
    console.log(`Processed ${contracts.length} contracts`);
    
    // Filter to customers with contracts only
    const customersWithContracts = customers.filter(c => c.contracts.length > 0);
    console.log(`${customersWithContracts.length} customers have contracts`);
    
    // Generate statistics
    const stats = {
        totalCustomers: customersWithContracts.length,
        activeCustomers: customersWithContracts.filter(c => c.has_active_contracts).length,
        totalContracts: contracts.length,
        activeContracts: contracts.filter(c => c.contract_status === 'Active').length,
        totalContractValue: customersWithContracts.reduce((sum, c) => sum + c.total_contract_value, 0),
        serviceTiers: {
            CORE: 0,
            ASSURE: 0,
            GUARDIAN: 0
        }
    };
    
    customersWithContracts.forEach(customer => {
        stats.serviceTiers[customer.service_tier]++;
    });
    
    console.log('\n📊 Processing Statistics:');
    console.log(`  Total Customers: ${stats.totalCustomers}`);
    console.log(`  Active Customers: ${stats.activeCustomers}`);
    console.log(`  Total Contracts: ${stats.totalContracts}`);
    console.log(`  Active Contracts: ${stats.activeContracts}`);
    console.log(`  Total Contract Value: $${stats.totalContractValue.toLocaleString()}`);
    console.log(`  Service Tiers:`);
    console.log(`    CORE: ${stats.serviceTiers.CORE}`);
    console.log(`    ASSURE: ${stats.serviceTiers.ASSURE}`);
    console.log(`    GUARDIAN: ${stats.serviceTiers.GUARDIAN}`);
    
    // Generate SQL
    console.log('\n📝 Generating SQL...');
    let sql = '';
    
    // Header
    sql += '-- SimPro Data Population Migration\n';
    sql += '-- Generated automatically from CSV data\n';
    sql += `-- ${new Date().toISOString()}\n\n`;
    sql += `-- Statistics:\n`;
    sql += `--   Customers: ${stats.totalCustomers}\n`;
    sql += `--   Contracts: ${stats.totalContracts}\n`;
    sql += `--   Total Value: $${stats.totalContractValue.toLocaleString()}\n\n`;
    
    // Clear existing data
    sql += '-- Clear existing SimPro data (if any)\n';
    sql += 'DELETE FROM simpro_customer_contracts;\n';
    sql += 'DELETE FROM simpro_customers;\n\n';
    
    // Insert customers
    sql += '-- Insert SimPro Customers\n';
    sql += 'INSERT INTO simpro_customers (\n';
    sql += '  id, simpro_customer_id, company_name, email, mailing_address, mailing_city, mailing_state, mailing_zip,\n';
    sql += '  labor_tax_code, part_tax_code, is_contract_customer, has_active_contracts, total_contract_value,\n';
    sql += '  active_contract_count, latest_contract_email, service_tier\n';
    sql += ') VALUES\n';
    
    const customerValues = customersWithContracts.map(customer => {
        return `('${customer.id}', '${escapeSQLString(customer.simpro_customer_id)}', '${escapeSQLString(customer.company_name)}', '${customer.email}', '${escapeSQLString(customer.mailing_address)}', '${customer.mailing_city}', '${customer.mailing_state}', '${customer.mailing_zip}', '${customer.labor_tax_code}', '${customer.part_tax_code}', ${customer.is_contract_customer}, ${customer.has_active_contracts}, ${customer.total_contract_value}, ${customer.active_contract_count}, '${customer.latest_contract_email}', '${customer.service_tier}')`;
    }).join(',\n');
    
    sql += customerValues + ';\n\n';
    
    // Insert contracts
    sql += '-- Insert SimPro Customer Contracts\n';
    sql += 'INSERT INTO simpro_customer_contracts (\n';
    sql += '  id, customer_id, contract_name, contract_number, contract_value, contract_status,\n';
    sql += '  start_date, end_date, contract_email, contract_notes\n';
    sql += ') VALUES\n';
    
    const contractValues = contracts.map(contract => {
        const startDate = contract.start_date ? `'${contract.start_date}'` : 'NULL';
        const endDate = contract.end_date ? `'${contract.end_date}'` : 'NULL';
        return `('${contract.id}', '${contract.customer_id}', '${escapeSQLString(contract.contract_name)}', '${contract.contract_number}', ${contract.contract_value}, '${contract.contract_status}', ${startDate}, ${endDate}, '${contract.contract_email}', '${escapeSQLString(contract.contract_notes)}')`;
    }).join(',\n');
    
    sql += contractValues + ';\n\n';
    
    // Update statistics
    sql += '-- Update search vectors for all customers\n';
    sql += 'UPDATE simpro_customers SET updated_at = NOW();\n\n';
    
    sql += '-- Verify data integrity\n';
    sql += 'SELECT COUNT(*) as customer_count FROM simpro_customers;\n';
    sql += 'SELECT COUNT(*) as contract_count FROM simpro_customer_contracts;\n';
    sql += 'SELECT service_tier, COUNT(*) as count FROM simpro_customers GROUP BY service_tier;\n';
    
    // Write SQL file
    console.log('💾 Writing SQL file...');
    fs.writeFileSync(OUTPUT_SQL, sql, 'utf8');
    
    console.log(`✅ Successfully generated: ${OUTPUT_SQL}`);
    console.log(`📏 Generated SQL file size: ${(fs.statSync(OUTPUT_SQL).size / 1024).toFixed(2)} KB`);
    
    return {
        customers: customersWithContracts,
        contracts,
        stats,
        sqlFile: OUTPUT_SQL
    };
}

// Run the script immediately
try {
    const result = processSimProData();
    console.log('\n🎉 SimPro data processing completed successfully!');
    console.log(`\nNext steps:`);
    console.log(`1. Review the generated SQL file: ${result.sqlFile}`);
    console.log(`2. Run the migration: supabase db push`);
    console.log(`3. Verify data in Supabase dashboard`);
} catch (error) {
    console.error('❌ Error processing SimPro data:', error);
    process.exit(1);
}

export { processSimProData };
