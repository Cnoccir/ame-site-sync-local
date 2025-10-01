#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLEAN_DIR = path.join(__dirname, '..', 'docs', 'cleaned_data');
const OUT_DIR = path.join(__dirname, '..', 'docs', 'import_csv');

function ensureOutDir() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
}

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
  return parsed.data;
}

function writeCsv(filePath, rows, headers) {
  const csv = Papa.unparse({ fields: headers, data: rows.map(r => headers.map(h => r[h] ?? '')) });
  fs.writeFileSync(filePath, csv, 'utf8');
}

function normalizePlatform(val) {
  if (!val) return 'Other';
  const s = String(val).toLowerCase();
  if (s.includes('niagara') || s === 'n4' || s.includes('tridium')) return 'Niagara';
  if (s.includes('jci') || s.includes('johnson')) return 'JCI';
  if (s.includes('honeywell') || s.includes('webs')) return 'Honeywell';
  if (s.includes('schneider') || s.includes('ecostruxure')) return 'Schneider';
  if (s.includes('siemens') || s.includes('desigo')) return 'Siemens';
  if (s.includes('delta')) return 'Delta';
  if (s.includes('mixed')) return 'Mixed';
  return 'Other';
}

function joinAddress(a, c, s, z) {
  const parts = [];
  if (a) parts.push(a.trim());
  const cityStateZip = [c, s, z].filter(Boolean).join(', ').replace(/,\s*,/g, ',');
  if (cityStateZip) parts.push(cityStateZip);
  return parts.join(', ');
}

function toBool(v) {
  if (typeof v === 'boolean') return v;
  if (v == null) return '';
  const s = String(v).trim().toLowerCase();
  if (s === 'true' || s === 't' || s === '1' || s === 'yes' ) return 'true';
  if (s === 'false' || s === 'f' || s === '0' || s === 'no') return 'false';
  return '';
}

function toNum(v) {
  if (v == null || v === '') return '';
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : '';
}

function toJsonArrayFromDelimited(s) {
  if (!s) return '[]';
  const arr = String(s).split(/[,|;]/).map(x => x.trim()).filter(Boolean);
  return JSON.stringify(arr);
}

function toJsonArraySingleOrEmpty(s) {
  if (!s) return '[]';
  return JSON.stringify([String(s)]);
}

function buildCustomers() {
  const inFile = path.join(CLEAN_DIR, 'customers_rows.csv');
  if (!fs.existsSync(inFile)) return;
  const rows = readCsv(inFile);

  const out = [];
  for (const r of rows) {
    const simpro = r.legacy_customer_id || r.id || '';
    if (!simpro) continue;
    const siteAddress = joinAddress(r.mailing_address, r.mailing_city, r.mailing_state, r.mailing_zip);
    out.push({
      simpro_customer_id: String(simpro),
      company_name: r.company_name || '',
      site_name: r.site_nickname || r.company_name || '',
      service_tier: r.service_tier || 'CORE',
      site_address: siteAddress,
      bms_platform: normalizePlatform(r.system_platform),
      contract_status: r.contract_status || '',
      contract_number: r.contract_number || '',
      contract_value: toNum(r.total_contract_value),
      primary_contact: r.primary_contact_name || '',
      contact_phone: r.primary_contact_phone || '',
      contact_email: r.primary_contact_email || ''
    });
  }

  const headers = [
    'simpro_customer_id','company_name','site_name','service_tier','site_address','bms_platform',
    'contract_status','contract_number','contract_value','primary_contact','contact_phone','contact_email'
  ];
  writeCsv(path.join(OUT_DIR, 'import_ame_customers.csv'), out, headers);
}

function buildCustomerContacts() {
  const inFile = path.join(CLEAN_DIR, 'customers_rows.csv');
  if (!fs.existsSync(inFile)) return;
  const rows = readCsv(inFile);
  const out = [];
  for (const r of rows) {
    const simpro = r.legacy_customer_id || r.id || '';
    if (!simpro) continue;
    if (r.primary_contact_name || r.primary_contact_email || r.primary_contact_phone) {
      out.push({
        simpro_customer_id: String(simpro),
        name: r.primary_contact_name || '',
        phone: r.primary_contact_phone || '',
        email: r.primary_contact_email || '',
        role: 'Primary Contact',
        is_primary: 'true',
        is_emergency: 'false'
      });
    }
    if (r.secondary_contact_name || r.secondary_contact_email || r.secondary_contact_phone) {
      out.push({
        simpro_customer_id: String(simpro),
        name: r.secondary_contact_name || '',
        phone: r.secondary_contact_phone || '',
        email: r.secondary_contact_email || '',
        role: 'Technical Contact',
        is_primary: 'false',
        is_emergency: 'false'
      });
    }
  }
  const headers = ['simpro_customer_id','name','phone','email','role','is_primary','is_emergency'];
  writeCsv(path.join(OUT_DIR, 'import_customer_contacts.csv'), out, headers);
}

function buildCustomerAccess() {
  const inFile = path.join(CLEAN_DIR, 'customers_rows.csv');
  if (!fs.existsSync(inFile)) return;
  const rows = readCsv(inFile);
  const out = [];
  for (const r of rows) {
    const simpro = r.legacy_customer_id || r.id || '';
    if (!simpro) continue;
    out.push({
      simpro_customer_id: String(simpro),
      access_method: 'Other',
      parking_instructions: '',
      badge_required: 'false',
      escort_required: 'false',
      special_instructions: r.access_notes || r.special_instructions || '',
      best_arrival_time: r.best_arrival_time || r.best_arrival_times || ''
    });
  }
  const headers = ['simpro_customer_id','access_method','parking_instructions','badge_required','escort_required','special_instructions','best_arrival_time'];
  writeCsv(path.join(OUT_DIR, 'import_customer_access.csv'), out, headers);
}

function buildCustomerSafety() {
  const inFile = path.join(CLEAN_DIR, 'customers_rows.csv');
  if (!fs.existsSync(inFile)) return;
  const rows = readCsv(inFile);
  const out = [];
  for (const r of rows) {
    const simpro = r.legacy_customer_id || r.id || '';
    if (!simpro) continue;
    out.push({
      simpro_customer_id: String(simpro),
      required_ppe_json: '[]',
      known_hazards_json: r.site_hazards ? toJsonArraySingleOrEmpty(r.site_hazards) : '[]',
      safety_contact_name: '',
      safety_contact_phone: '',
      safety_notes: ''
    });
  }
  const headers = ['simpro_customer_id','required_ppe_json','known_hazards_json','safety_contact_name','safety_contact_phone','safety_notes'];
  writeCsv(path.join(OUT_DIR, 'import_customer_safety.csv'), out, headers);
}

function buildCustomerTeam() {
  const inFile = path.join(CLEAN_DIR, 'customers_rows.csv');
  if (!fs.existsSync(inFile)) return;
  const rows = readCsv(inFile);
  const out = [];
  for (const r of rows) {
    const simpro = r.legacy_customer_id || r.id || '';
    if (!simpro) continue;
    out.push({
      simpro_customer_id: String(simpro),
      primary_technician_email: '',
      secondary_technician_email: '',
      account_manager_email: r.latest_contract_email || ''
    });
  }
  const headers = ['simpro_customer_id','primary_technician_email','secondary_technician_email','account_manager_email'];
  writeCsv(path.join(OUT_DIR, 'import_customer_team.csv'), out, headers);
}

function buildTaskSopLibrary() {
  const tasksFile = path.join(CLEAN_DIR, 'tasks_rows.csv');
  const sopsFile  = path.join(CLEAN_DIR, 'sops_rows.csv');

  if (fs.existsSync(tasksFile)) {
    const rows = readCsv(tasksFile);
    const out = [];
    for (const r of rows) {
      out.push({
        record_type: 'task',
        task_id: r.task_id || '',
        sop_id: '',
        title: r.task_name || '',
        system_family: r.system_family || '',
        vendor_flavor: r.vendor_flavor || '',
        phase: r.phase || '',
        service_tiers: toJsonArrayFromDelimited(r.service_tiers),
        frequency: r.frequency || '',
        estimated_duration_min: r.estimated_duration_min || '',
        audience_level: r.audience_level || '',
        initial_steps: r.initial_steps || '',
        sop_refs: toJsonArrayFromDelimited(r.sop_refs),
        acceptance_criteria: r.acceptance_criteria || '',
        artifacts: r.artifacts || '',
        prerequisites: r.prerequisites || '',
        tools_required: r.tools_required || '',
        safety_tags: r.safety_tags || '',
        reference_links: r.reference_links || '',
        notes: r.notes || '',
        owner: r.owner || '',
        last_updated: r.last_updated || '',
        version: r.version || '',
        goal: '',
        ui_navigation: '',
        step_list_core: '',
        step_list_assure: '',
        step_list_guardian: '',
        verification_steps: '',
        rollback_steps: '',
        best_practices: '',
        is_active: 'true'
      });
    }
    const headers = ['record_type','task_id','sop_id','title','system_family','vendor_flavor','phase','service_tiers','frequency','estimated_duration_min','audience_level','initial_steps','sop_refs','acceptance_criteria','artifacts','prerequisites','tools_required','safety_tags','reference_links','notes','owner','last_updated','version','goal','ui_navigation','step_list_core','step_list_assure','step_list_guardian','verification_steps','rollback_steps','best_practices','is_active'];
    writeCsv(path.join(OUT_DIR, 'import_task_sop_library_tasks.csv'), out, headers);
  }

  if (fs.existsSync(sopsFile)) {
    const rows = readCsv(sopsFile);
    const out = [];
    for (const r of rows) {
      out.push({
        record_type: 'sop',
        task_id: r.task_id || '',
        sop_id: r.sop_id || '',
        title: r.title || '',
        system_family: r.system_family || '',
        vendor_flavor: r.vendor_flavor || '',
        phase: r.phase || '',
        service_tiers: '[]',
        frequency: '',
        estimated_duration_min: '',
        audience_level: '',
        initial_steps: '',
        sop_refs: '[]',
        acceptance_criteria: '',
        artifacts: '',
        prerequisites: '',
        tools_required: '',
        safety_tags: '',
        reference_links: r.reference_links || '',
        notes: '',
        owner: '',
        last_updated: '',
        version: '',
        goal: r.goal || '',
        ui_navigation: '',
        step_list_core: r.steps || '',
        step_list_assure: '',
        step_list_guardian: '',
        verification_steps: '',
        rollback_steps: '',
        best_practices: r.best_practices || '',
        is_active: 'true'
      });
    }
    const headers = ['record_type','task_id','sop_id','title','system_family','vendor_flavor','phase','service_tiers','frequency','estimated_duration_min','audience_level','initial_steps','sop_refs','acceptance_criteria','artifacts','prerequisites','tools_required','safety_tags','reference_links','notes','owner','last_updated','version','goal','ui_navigation','step_list_core','step_list_assure','step_list_guardian','verification_steps','rollback_steps','best_practices','is_active'];
    writeCsv(path.join(OUT_DIR, 'import_task_sop_library_sops.csv'), out, headers);
  }
}

function buildEmployees() {
  const inFile = path.join(CLEAN_DIR, 'ame_employees_rows.csv');
  if (!fs.existsSync(inFile)) return;
  const rows = readCsv(inFile);
  const out = [];
  for (const r of rows) {
    out.push({
      technician_id: r.technician_id || '',
      user_id: r.user_id || '',
      first_name: r.first_name || '',
      last_name: r.last_name || '',
      employee_id: r.employee_id || '',
      email: r.email || '',
      phone: r.phone || '',
      mobile_phone: r.mobile_phone || '',
      role: r.role || '',
      department: r.department || '',
      employment_status: r.employment_status || 'active',
      is_active: toBool(r.is_active) || 'true',
      is_technician: toBool(r.is_technician) || 'false',
      extension: r.extension || '',
      direct_line: r.direct_line || '',
      employee_name: r.employee_name || `${r.first_name || ''} ${r.last_name || ''}`.trim()
    });
  }
  const headers = ['technician_id','user_id','first_name','last_name','employee_id','email','phone','mobile_phone','role','department','employment_status','is_active','is_technician','extension','direct_line','employee_name'];
  writeCsv(path.join(OUT_DIR, 'import_ame_employees.csv'), out, headers);
}

function main() {
  ensureOutDir();
  buildCustomers();
  buildCustomerContacts();
  buildCustomerAccess();
  buildCustomerSafety();
  buildCustomerTeam();
  buildTaskSopLibrary();
  buildEmployees();
  console.log(`\n✅ Wrote import-ready CSV files to: ${OUT_DIR}`);
}

main();