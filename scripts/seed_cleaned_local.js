import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || (!SERVICE_ROLE_KEY && !ANON_KEY)) {
  console.error('Missing Supabase env: set VITE_SUPABASE_URL and a service role key (SUPABASE_SERVICE_ROLE_KEY) or anon key.');
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

function parseTiers(val) {
  if (!val) return ['CORE'];
  return String(val).split(/[,|]/).map(s => s.trim()).filter(Boolean);
}

function toCustomer(row) {
  return {
    id: row.id || undefined,
    company_name: row.company_name || null,
    service_tier: row.service_tier || 'CORE',
    primary_contact: row.primary_contact_name || null,
    contact_phone: row.primary_contact_phone || null,
    contact_email: row.primary_contact_email || null,
  };
}

function toTask(row) {
  return {
    record_type: 'task',
    task_id: row.task_id,
    sop_id: null,
    title: row.task_name,
    system_family: row.system_family || null,
    vendor_flavor: row.vendor_flavor || null,
    phase: row.phase || null,
    service_tiers: parseTiers(row.service_tiers),
    frequency: row.frequency || null,
    estimated_duration_min: row.estimated_duration_min ? parseInt(row.estimated_duration_min) : null,
    audience_level: row.audience_level ? parseInt(row.audience_level) : null,
    initial_steps: row.initial_steps || null,
    sop_refs: row.sop_refs ? row.sop_refs.split(/[,|]/).map(s => s.trim()).filter(Boolean) : [],
    acceptance_criteria: row.acceptance_criteria || null,
    artifacts: row.artifacts || null,
    prerequisites: row.prerequisites || null,
    tools_required: row.tools_required || null,
    safety_tags: row.safety_tags || null,
    reference_links: row.reference_links || null,
    notes: row.notes || null,
    owner: row.owner || null,
    last_updated: row.last_updated ? new Date(row.last_updated).toISOString() : null,
    version: row.version || null,
    is_active: true,
  };
}

function toSop(row) {
  return {
    record_type: 'sop',
    sop_id: row.sop_id,
    task_id: row.task_id || null,
    title: row.title,
    goal: row.goal || null,
    system_family: row.system_family || null,
    vendor_flavor: row.vendor_flavor || null,
    phase: row.phase || null,
    service_tiers: parseTiers(row.service_tiers),
    estimated_duration_min: row.estimated_duration_min ? parseInt(row.estimated_duration_min) : null,
    audience_level: row.audience_level ? parseInt(row.audience_level) : null,
    prerequisites: row.prerequisites || null,
    safety_tags: row.safety_tags || null,
    tools_required: null,
    notes: null,
    owner: null,
    version: null,
    step_list_core: row.steps || null,
    reference_links: row.reference_links || null,
    is_active: true,
  };
}

function toEmployee(row) {
  return {
    id: row.id || undefined,
    technician_id: row.technician_id || null,
    user_id: row.user_id || null,
    first_name: row.first_name || null,
    last_name: row.last_name || null,
    employee_name: row.employee_name || null,
    email: row.email || null,
    mobile_phone: row.mobile_phone || null,
    role: row.role || null,
    department: row.department || null,
    is_active: String(row.is_active).toLowerCase() !== 'false',
    is_technician: String(row.is_technician).toLowerCase() === 'true',
    extension: row.extension || null,
    direct_line: row.direct_line || null,
    employment_status: row.employment_status || 'active',
  };
}

async function batchInsert(table, rows, selectCols) {
  const size = 200;
  for (let i = 0; i < rows.length; i += size) {
    const batch = rows.slice(i, i + size);
    const { error } = await supabase.from(table).insert(batch).select(selectCols || '*');
    if (error) throw error;
    console.log(`  ✓ Inserted ${Math.min(i + batch.length, rows.length)}/${rows.length} into ${table}`);
  }
}

async function main() {
  try {
    console.log('🚀 Seeding local database from cleaned_data...');

    const base = path.join(__dirname, '..', 'docs', 'cleaned_data');

    // Customers (skipped for now due to complex CSV quoting; seed via app or later script)
    const customersCsv = path.join(base, 'customers_rows.csv');
    if (fs.existsSync(customersCsv)) {
      const preview = fs.readFileSync(customersCsv, 'utf8').split('\n').slice(0,2).join('\n');
      console.log('👥 Customers CSV detected (skipping import in prototype). Preview:\n' + preview);
    } else {
      console.log('⚠️ customers_rows.csv not found');
    }

    // Tasks
    const tasksCsv = path.join(base, 'tasks_rows.csv');
    if (fs.existsSync(tasksCsv)) {
      const tasks = parseCSV(fs.readFileSync(tasksCsv, 'utf8')).map(toTask);
      console.log(`🛠️ Tasks: ${tasks.length}`);
      await supabase.from('task_sop_library').delete().eq('record_type', 'task');
      if (tasks.length) await batchInsert('task_sop_library', tasks);
    } else {
      console.log('⚠️ tasks_rows.csv not found');
    }

    // SOPs
    const sopsCsv = path.join(base, 'sops_rows.csv');
    if (fs.existsSync(sopsCsv)) {
      const sops = parseCSV(fs.readFileSync(sopsCsv, 'utf8')).map(toSop);
      console.log(`📘 SOPs: ${sops.length}`);
      await supabase.from('task_sop_library').delete().eq('record_type', 'sop');
      if (sops.length) await batchInsert('task_sop_library', sops);
    } else {
      console.log('⚠️ sops_rows.csv not found');
    }

    // Employees
    const empsCsv = path.join(base, 'ame_employees_rows.csv');
    if (fs.existsSync(empsCsv)) {
      const emps = parseCSV(fs.readFileSync(empsCsv, 'utf8')).map(toEmployee);
      console.log(`🧑‍💼 Employees: ${emps.length}`);
      // Keep manual ones; delete those with technician_id like EMP%
      await supabase.from('ame_employees').delete().like('technician_id', 'EMP%');
      if (emps.length) await batchInsert('ame_employees', emps);
    } else {
      console.log('⚠️ ame_employees_rows.csv not found');
    }

    console.log('✅ Seeding complete');
  } catch (e) {
    console.error('❌ Seeding failed:', e.message);
    process.exit(1);
  }
}

main();
