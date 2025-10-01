import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const url = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing env for Supabase');
  process.exit(1);
}

const supabase = createClient(url, key);

try {
  const { data: cnt, count, error: err1 } = await supabase
    .from('ame_employees')
    .select('id', { count: 'exact', head: true });
  if (err1) {
    console.error('Count error:', err1.message);
  } else {
    console.log('ame_employees count:', count);
  }

  const { data, error } = await supabase
    .from('ame_employees')
    .select('id, employee_name, email, is_active, is_technician')
    .order('employee_name')
    .limit(5);

  if (error) {
    console.error('Select error:', error.message);
  } else {
    console.log('First rows:', data);
  }
} catch (e) {
  console.error('Runtime error:', e.message);
  process.exit(1);
}