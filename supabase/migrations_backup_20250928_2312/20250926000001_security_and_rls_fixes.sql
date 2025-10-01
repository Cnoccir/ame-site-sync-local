-- Enable RLS on public tables and add permissive policies for authenticated users (dev-only)
-- Also move pg_trgm out of public schema if present.

-- Move pg_trgm to extensions schema if installed in public
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension e
    JOIN pg_namespace n ON n.oid = e.extnamespace
    WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
  ) THEN
    EXECUTE 'ALTER EXTENSION pg_trgm SET SCHEMA extensions';
  END IF;
END$$;

-- Helper to enable RLS and add permissive policies (idempotent)
CREATE OR REPLACE FUNCTION public.__enable_rls_permissive(_tbl regclass)
RETURNS void
LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', _tbl);
  BEGIN
    EXECUTE format('CREATE POLICY authenticated_full_access ON %s FOR ALL TO authenticated USING (true) WITH CHECK (true)', _tbl);
  EXCEPTION WHEN duplicate_object THEN
    -- ignore
  END;
END;
$$;

-- List of public tables to protect (based on advisor output)
DO $$
DECLARE
  t regclass;
  tables text[] := ARRAY[
    'public.tasks',
    'public.sops',
    'public.customer_contacts',
    'public.customer_credentials',
    'public.pm_tasks',
    'public.pm_issues',
    'public.pm_recommendations',
    'public.pm_photos',
    'public.pm_reports',
    'public.pm_report_deliveries',
    'public.task_sop_library',
    'public.users'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    BEGIN
      PERFORM public.__enable_rls_permissive(t);
    EXCEPTION WHEN undefined_table THEN
      -- Table may not exist in local; skip
      NULL;
    END;
  END LOOP;
END$$;

-- Cleanup helper
DROP FUNCTION IF EXISTS public.__enable_rls_permissive(regclass);