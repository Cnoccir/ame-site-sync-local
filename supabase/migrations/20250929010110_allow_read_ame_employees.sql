-- Phase 1 Team Assignment: ensure ame_employees is readable in local/dev
-- Enable RLS and add permissive read policies for authenticated and anon (demo mode)

-- Enable RLS (safe if already enabled)
alter table if exists public.ame_employees enable row level security;

-- Grant select privileges to web roles (belt-and-suspenders; RLS still applies)
grant select on table public.ame_employees to anon, authenticated;

-- Create read policies if they don't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ame_employees'
      AND policyname = 'read_ame_employees_authenticated'
  ) THEN
    EXECUTE 'create policy read_ame_employees_authenticated on public.ame_employees for select to authenticated using (true);';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ame_employees'
      AND policyname = 'read_ame_employees_anon'
  ) THEN
    EXECUTE 'create policy read_ame_employees_anon on public.ame_employees for select to anon using (true);';
  END IF;
END
$$;