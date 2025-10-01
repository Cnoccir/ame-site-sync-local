-- Dev-only anon policies to run without auth
-- Grant anon read where needed and write to sessions

-- ame_employees: allow anon read (to resolve default technician)
ALTER TABLE IF EXISTS public.ame_employees ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY anon_read ON public.ame_employees
  FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- customers: allow anon read for search/UI
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY anon_read ON public.customers
  FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- task_sop_library: allow anon read
ALTER TABLE IF EXISTS public.task_sop_library ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY anon_read ON public.task_sop_library
  FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- pm_workflow_sessions: allow anon select/insert/update for demo
ALTER TABLE IF EXISTS public.pm_workflow_sessions ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY anon_select ON public.pm_workflow_sessions
  FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_insert ON public.pm_workflow_sessions
  FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_update ON public.pm_workflow_sessions
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;