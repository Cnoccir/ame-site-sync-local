-- Create discovery runs and related entities for persistent Tridium system discovery
-- This migration introduces a durable entity model and ties data to a discovery_run_id

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) discovery_runs
CREATE TABLE IF NOT EXISTS public.discovery_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  system_type text NOT NULL CHECK (system_type IN ('supervisor','engine')),
  session_id text, -- optional linkage to pm_workflow_sessions.id
  customer_id text, -- optional
  site_name text
);

-- 2) supervisors (one per discovery run)
CREATE TABLE IF NOT EXISTS public.supervisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_run_id uuid NOT NULL REFERENCES public.discovery_runs(id) ON DELETE CASCADE,
  identity jsonb,
  resources jsonb,
  network jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(discovery_run_id)
);

-- 3) jaces
CREATE TABLE IF NOT EXISTS public.jaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_run_id uuid NOT NULL REFERENCES public.discovery_runs(id) ON DELETE CASCADE,
  supervisor_id uuid REFERENCES public.supervisors(id) ON DELETE SET NULL,
  name text NOT NULL,
  address text,
  fox_port integer,
  host_model text,
  niagara_version text,
  network_info jsonb,
  platform jsonb,
  resources jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(discovery_run_id, name)
);

CREATE INDEX IF NOT EXISTS idx_jaces_discovery_run ON public.jaces(discovery_run_id);

-- 4) drivers
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jace_id uuid NOT NULL REFERENCES public.jaces(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('bacnet','n2','modbus','lon','custom')),
  summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_jace ON public.drivers(jace_id);

-- 5) devices
CREATE TABLE IF NOT EXISTS public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id uuid NOT NULL REFERENCES public.drivers(id) ON DELETE CASCADE,
  name text,
  device_id text,
  vendor text,
  status text,
  network_no integer,
  mac_addr text,
  ip_addr text,
  firmware text,
  caps jsonb,
  raw jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devices_driver ON public.devices(driver_id);

-- RLS: enable and create permissive dev policies (anon) similar to pm_workflow_sessions migration
ALTER TABLE IF EXISTS public.discovery_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.devices ENABLE ROW LEVEL SECURITY;

-- Dev-only anon policies (safe for local/dev; tighten in prod)
DO $$ BEGIN
  CREATE POLICY anon_select_discovery_runs ON public.discovery_runs FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_insert_discovery_runs ON public.discovery_runs FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_update_discovery_runs ON public.discovery_runs FOR UPDATE TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY anon_select_supervisors ON public.supervisors FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_insert_supervisors ON public.supervisors FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_update_supervisors ON public.supervisors FOR UPDATE TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY anon_select_jaces ON public.jaces FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_insert_jaces ON public.jaces FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_update_jaces ON public.jaces FOR UPDATE TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY anon_select_drivers ON public.drivers FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_insert_drivers ON public.drivers FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_update_drivers ON public.drivers FOR UPDATE TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY anon_select_devices ON public.devices FOR SELECT TO anon USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_insert_devices ON public.devices FOR INSERT TO anon WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY anon_update_devices ON public.devices FOR UPDATE TO anon USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
