import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Prefer service role for bulk seeding if available; fall back to publishable/anon
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || (!SERVICE_ROLE_KEY && !ANON_KEY)) {
  console.error('Missing Supabase env: set VITE_SUPABASE_URL and a service role key (SUPABASE_SERVICE_ROLE_KEY or VITE_SUPABASE_SERVICE_ROLE_KEY), or anon key (VITE_SUPABASE_PUBLISHABLE_KEY).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY || ANON_KEY);

function parseCSV(csvText) {
  const lines = csvText.split('\n').filter(l => l.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = [];
    let cur = '';
    let inQuotes = false;
    const line = lines[i];
    for (let j = 0; j < line.length; j++) {
      const ch = line[j];
      if (ch === '"') inQuotes = !inQuotes;
      else if (ch === ',' && !inQuotes) { values.push(cur.trim()); cur = ''; }
      else cur += ch;
    }
    values.push(cur.trim());
    const obj = {};
    headers.forEach((h, idx) => obj[h] = values[idx] ?? null);
    rows.push(obj);
  }
  return rows;
}

function toSimproCustomer(row) {
  return {
    simpro_customer_id: row.simpro_customer_id,
    company_name: row.company_name,
    email: row.email || null,
    mailing_address: row.mailing_address || null,
    mailing_city: row.mailing_city || null,
    mailing_state: row.mailing_state || null,
    mailing_zip: row.mailing_zip || null,
    is_contract_customer: String(row.is_contract_customer).toLowerCase() === 'true',
    has_active_contracts: String(row.has_active_contracts).toLowerCase() === 'true',
    active_contract_count: row.active_contract_count ? parseInt(row.active_contract_count) : 0,
    total_contract_value: row.total_contract_value ? parseFloat(row.total_contract_value) : 0,
    service_tier: row.service_tier || 'CORE',
    latest_contract_email: row.latest_contract_email || null
  };
}

function toSimproContract(row, customerIdMap) {
  const custId = customerIdMap.get(row.matched_customer_id);
  if (!custId) return null;
  return {
    customer_id: custId,
    contract_name: row.contract_name,
    contract_number: row.contract_number || '',
    contract_value: row.contract_value ? parseFloat(row.contract_value) : 0,
    contract_status: row.contract_status || 'expired',
    start_date: row.start_date || null,
    end_date: row.end_date || null
  };
}

async function main() {
  console.log('🚀 Loading SimPro cleaned data into local database...');
  try {
    const customersCsv = path.join(__dirname, '..', 'docs', 'cleaned_data', 'cleaned_customers.csv');
    const contractsCsv = path.join(__dirname, '..', 'docs', 'cleaned_data', 'cleaned_contracts.csv');

    if (!fs.existsSync(customersCsv)) throw new Error(`Missing ${customersCsv}`);
    if (!fs.existsSync(contractsCsv)) throw new Error(`Missing ${contractsCsv}`);

    const customers = parseCSV(fs.readFileSync(customersCsv, 'utf8'));
    const contracts = parseCSV(fs.readFileSync(contractsCsv, 'utf8'));

    console.log(`Parsed ${customers.length} customers, ${contracts.length} contracts`);

    // Clear existing data (local dev only)
    console.log('🧹 Clearing existing simpro tables (local)...');
    await supabase.from('simpro_customer_contracts').delete().neq('id', '00000000-0000-0000-0000-000000000000').then(()=>{}).catch(()=>{});
    await supabase.from('simpro_customers').delete().neq('id', '00000000-0000-0000-0000-000000000000').then(()=>{}).catch(()=>{});

    // Insert customers in batches
    console.log('💾 Inserting customers...');
    const batchSize = 100;
    let inserted = 0;
    const customerIdMap = new Map();

    for (let i = 0; i < customers.length; i += batchSize) {
      const batch = customers.slice(i, i + batchSize).map(toSimproCustomer);
      const { data, error } = await supabase
        .from('simpro_customers')
        .insert(batch)
        .select('id, simpro_customer_id');
      if (error) throw error;
      data?.forEach(row => customerIdMap.set(row.simpro_customer_id, row.id));
      inserted += data?.length || 0;
      console.log(`  ✓ Inserted ${inserted}/${customers.length}`);
    }

    // Insert contracts in batches (only those with matched_customer_id in map)
    console.log('💾 Inserting contracts...');
    const filteredContracts = contracts.filter(c => customerIdMap.has(c.matched_customer_id));
    for (let i = 0; i < filteredContracts.length; i += batchSize) {
      const batch = filteredContracts.slice(i, i + batchSize)
        .map(row => toSimproContract(row, customerIdMap))
        .filter(Boolean);
      if (batch.length === 0) continue;
      const { error } = await supabase
        .from('simpro_customer_contracts')
        .insert(batch);
      if (error) throw error;
      console.log(`  ✓ Inserted ${Math.min(i + batch.length, filteredContracts.length)}/${filteredContracts.length}`);
    }

    console.log('✅ Local SimPro data load complete');
  } catch (e) {
    console.error('❌ Load failed:', e.message);
    process.exit(1);
  }
}

main();
