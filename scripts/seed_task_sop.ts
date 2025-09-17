import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

// This script seeds ame_tasks and ame_sops (and joins) from CSVs in docs/data
// Usage (PowerShell):
//   $env:SUPABASE_URL="https://YOUR.supabase.co"; $env:SUPABASE_SERVICE_ROLE="YOUR_SERVICE_ROLE"; npx ts-node scripts/seed_task_sop.ts

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE as string;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE env vars.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE, { auth: { persistSession: false } });

const DATA_DIR = path.resolve(process.cwd(), 'docs', 'data');
const TASK_CSV = path.join(DATA_DIR, 'Task_Library_v22.csv');
const SOP_CSV = path.join(DATA_DIR, 'SOP_Library_v22.csv');

function normalizePhase(val?: string): number {
  if (!val) return 3;
  const v = val.toLowerCase();
  if (v.includes('prep') || v.includes('pre')) return 1; // Phase 1
  if (v.includes('health')) return 2; // Phase 2
  if (v.includes('deep') || v.includes('maintenance') || v.includes('preventive')) return 3; // Phase 3
  if (v.includes('wrap') || v.includes('doc') || v.includes('report')) return 4; // Phase 4
  return 3;
}

function toArray(val?: string): string[] {
  if (!val) return [];
  return String(val).split(/[,;|]/).map(s => s.trim()).filter(Boolean);
}

async function seedSOPs() {
  const csv = fs.readFileSync(SOP_CSV, 'utf8');
  const parsed = Papa.parse(csv, { header: true });
  const rows = parsed.data as any[];
  const inserts = rows.filter(Boolean).map(r => ({
    sop_id: r.SOP_ID,
    sop_name: r.Title,
    category: r.System_Family || r.Vendor_Flavor || null,
    system_type: r.System_Family || null,
    description: r.Goal || r.Best_Practices || null,
    procedure_steps: toArray(r.Step_List_CORE).concat(toArray(r.Step_List_ASSURE)).concat(toArray(r.Step_List_GUARDIAN)),
    safety_requirements: toArray(r.Safety),
    tools_required: toArray(r.Tools),
    estimated_duration: r.Estimated_Duration_min ? Number(r.Estimated_Duration_min) : null,
    version: r.Version || null,
  }));

  for (const chunk of chunked(inserts, 500)) {
    const { error } = await supabase.from('ame_sops').upsert(chunk, { onConflict: 'sop_id' });
    if (error) throw error;
  }
  console.log(`Seeded SOPs: ${inserts.length}`);
}

async function seedTasks() {
  const csv = fs.readFileSync(TASK_CSV, 'utf8');
  const parsed = Papa.parse(csv, { header: true });
  const rows = parsed.data as any[];

  const inserts = rows.filter(Boolean).map(r => ({
    task_id: r.Task_ID,
    task_name: r.Task_Name,
    category: r.System_Family || r.Vendor_Flavor || r.Phase || 'General',
    duration: r.Estimated_Duration_min ? Number(r.Estimated_Duration_min) : null,
    navigation_path: r.Initial_Steps || null,
    sop_steps: r.Initial_Steps || null,
    tools_required: toArray(r.Tools_Required),
    quality_checks: r.Acceptance_Criteria || null,
    prerequisites: r.Prerequisites || null,
    skills_required: r.Audience_Level || null,
    safety_notes: r.Notes || null,
    service_tiers: toArray(r.Service_Tiers),
    phase: normalizePhase(r.Phase),
    task_order: 1,
    is_mandatory: true,
    version: r.Version || null,
  }));

  for (const chunk of chunked(inserts, 500)) {
    const { error } = await supabase.from('ame_tasks').upsert(chunk as any, { onConflict: 'task_id' });
    if (error) throw error;
  }
  console.log(`Seeded Tasks: ${inserts.length}`);

  // Link tasks to SOPs
  for (const row of rows) {
    const taskId = row.Task_ID;
    const sopRefs = toArray(row.SOP_Refs);
    for (const sop of sopRefs) {
      const { data: t } = await supabase.from('ame_tasks').select('id').eq('task_id', taskId).single();
      const { data: s } = await supabase.from('ame_sops').select('id').eq('sop_id', sop).maybeSingle();
      if (t?.id && s?.id) {
        await supabase.from('task_sops').upsert({ task_id: t.id, sop_id: s.id, relationship_type: 'primary' } as any);
      }
    }
  }
}

function chunked<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

(async () => {
  try {
    await seedSOPs();
    await seedTasks();
    console.log('Seeding complete.');
    process.exit(0);
  } catch (e: any) {
    console.error('Seeding failed:', e.message || e);
    process.exit(1);
  }
})();