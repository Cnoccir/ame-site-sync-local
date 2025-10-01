-- Create discovery persistence tables for Phase 2 Tridium discovery
-- This migration creates the necessary tables for persisting discovery data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Create discovery_runs table to track discovery sessions
CREATE TABLE IF NOT EXISTS public.discovery_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  system_type text NOT NULL CHECK (system_type IN ('supervisor','engine')),
  session_id text, -- links to ame_visit_sessions or similar
  customer_id text,
  site_name text,
  metadata jsonb DEFAULT '{}',
  import_summary jsonb DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_discovery_runs_session ON public.discovery_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_discovery_runs_customer ON public.discovery_runs(customer_id);

-- 2. Create tridium_imports table for raw file storage
CREATE TABLE IF NOT EXISTS public.tridium_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_run_id uuid REFERENCES public.discovery_runs(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  customer_id text,
  site_name text,
  node_id text NOT NULL,
  location_type text CHECK (location_type IN ('supervisor', 'jace')),
  location_name text,
  dataset_type text NOT NULL CHECK (dataset_type IN ('platform', 'resources', 'niagara_network', 'bacnet', 'n2', 'modbus', 'lon', 'custom')),
  original_filename text NOT NULL,
  storage_bucket text,
  storage_path text,
  raw_text text,
  parsed_json jsonb,
  metadata jsonb DEFAULT '{}',
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tridium_imports_discovery_run ON public.tridium_imports(discovery_run_id);
CREATE INDEX IF NOT EXISTS idx_tridium_imports_session ON public.tridium_imports(session_id);
CREATE INDEX IF NOT EXISTS idx_tridium_imports_type ON public.tridium_imports(dataset_type);

-- 3. Create supervisors table (one per discovery run)
CREATE TABLE IF NOT EXISTS public.supervisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_run_id uuid NOT NULL REFERENCES public.discovery_runs(id) ON DELETE CASCADE,
  identity jsonb DEFAULT '{}',
  platform jsonb DEFAULT '{}',
  resources jsonb DEFAULT '{}',
  network jsonb DEFAULT '{}',
  analysis jsonb DEFAULT '{}',
  health_score integer CHECK (health_score >= 0 AND health_score <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(discovery_run_id)
);

CREATE INDEX IF NOT EXISTS idx_supervisors_discovery_run ON public.supervisors(discovery_run_id);

-- 4. Create jaces table
CREATE TABLE IF NOT EXISTS public.jaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  discovery_run_id uuid NOT NULL REFERENCES public.discovery_runs(id) ON DELETE CASCADE,
  supervisor_id uuid REFERENCES public.supervisors(id) ON DELETE SET NULL,
  name text NOT NULL,
  address text,
  fox_port integer,
  host_model text,
  niagara_version text,
  network_info jsonb DEFAULT '{}',
  platform jsonb DEFAULT '{}',
  resources jsonb DEFAULT '{}',
  analysis jsonb DEFAULT '{}',
  health_score integer CHECK (health_score >= 0 AND health_score <= 100),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(discovery_run_id, name)
);

CREATE INDEX IF NOT EXISTS idx_jaces_discovery_run ON public.jaces(discovery_run_id);
CREATE INDEX IF NOT EXISTS idx_jaces_supervisor ON public.jaces(supervisor_id);

-- 5. Create drivers table
CREATE TABLE IF NOT EXISTS public.drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jace_id uuid NOT NULL REFERENCES public.jaces(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('bacnet','n2','modbus','lon','custom')),
  name text,
  summary jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drivers_jace ON public.drivers(jace_id);

-- 6. Create devices table
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
  caps jsonb DEFAULT '{}',
  raw jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devices_driver ON public.devices(driver_id);

-- 7. Create analysis_snapshots table
CREATE TABLE IF NOT EXISTS public.analysis_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('supervisor', 'jace')),
  ref_id uuid NOT NULL, -- references either supervisors.id or jaces.id
  discovery_run_id uuid REFERENCES public.discovery_runs(id) ON DELETE CASCADE,
  health_score integer CHECK (health_score >= 0 AND health_score <= 100),
  alerts jsonb DEFAULT '[]',
  metrics jsonb DEFAULT '{}',
  recommendations jsonb DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analysis_scope_ref ON public.analysis_snapshots(scope, ref_id);
CREATE INDEX IF NOT EXISTS idx_analysis_discovery_run ON public.analysis_snapshots(discovery_run_id);

-- 8. Create raw_files table for file tracking
CREATE TABLE IF NOT EXISTS public.raw_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type text NOT NULL CHECK (parent_type IN ('supervisor', 'jace', 'driver')),
  parent_id uuid NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('platform', 'resource', 'network', 'driver')),
  filename text NOT NULL,
  file_hash text,
  file_size bigint,
  content_text text,
  parsed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_raw_files_parent ON public.raw_files(parent_type, parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_raw_files_hash ON public.raw_files(parent_id, file_hash) WHERE file_hash IS NOT NULL;

-- 9. Enable RLS on all tables
ALTER TABLE public.discovery_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tridium_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_files ENABLE ROW LEVEL SECURITY;

-- 10. Create permissive policies for development
-- In production, these should be more restrictive
CREATE POLICY "Allow all operations on discovery_runs" ON public.discovery_runs
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on tridium_imports" ON public.tridium_imports
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on supervisors" ON public.supervisors
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on jaces" ON public.jaces
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on drivers" ON public.drivers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on devices" ON public.devices
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on analysis_snapshots" ON public.analysis_snapshots
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on raw_files" ON public.raw_files
  FOR ALL USING (true) WITH CHECK (true);

-- 11. Create helper function to get or create discovery run
CREATE OR REPLACE FUNCTION public.get_or_create_discovery_run(
  p_session_id text,
  p_system_type text DEFAULT 'supervisor',
  p_customer_id text DEFAULT NULL,
  p_site_name text DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_run_id uuid;
BEGIN
  -- Try to find existing run for this session
  SELECT id INTO v_run_id
  FROM public.discovery_runs
  WHERE session_id = p_session_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- Create new if not found
  IF v_run_id IS NULL THEN
    INSERT INTO public.discovery_runs (session_id, system_type, customer_id, site_name)
    VALUES (p_session_id, p_system_type, p_customer_id, p_site_name)
    RETURNING id INTO v_run_id;
  END IF;
  
  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to compute analysis for a JACE or Supervisor
CREATE OR REPLACE FUNCTION public.compute_discovery_analysis(
  p_entity_type text, -- 'supervisor' or 'jace'
  p_entity_id uuid
) RETURNS jsonb AS $$
DECLARE
  v_entity record;
  v_alerts jsonb[];
  v_score integer;
  v_metrics jsonb;
BEGIN
  -- Get entity data
  IF p_entity_type = 'supervisor' THEN
    SELECT * INTO v_entity FROM public.supervisors WHERE id = p_entity_id;
  ELSE
    SELECT * INTO v_entity FROM public.jaces WHERE id = p_entity_id;
  END IF;
  
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;
  
  -- Initialize
  v_alerts := ARRAY[]::jsonb[];
  v_score := 100;
  v_metrics := '{}'::jsonb;
  
  -- Extract metrics from platform data
  IF v_entity.platform IS NOT NULL AND v_entity.platform != '{}'::jsonb THEN
    -- Memory checks
    IF v_entity.platform->'memory'->>'used_pct' IS NOT NULL AND 
       (v_entity.platform->'memory'->>'used_pct')::numeric > 75 THEN
      v_alerts := array_append(v_alerts, jsonb_build_object(
        'severity', 'warning',
        'category', 'memory',
        'message', 'High memory usage: ' || (v_entity.platform->'memory'->>'used_pct') || '%'
      ));
      v_score := v_score - 10;
    END IF;
    
    -- Storage checks
    IF v_entity.platform->'storage' IS NOT NULL THEN
      FOR i IN 0..jsonb_array_length(v_entity.platform->'storage') - 1 LOOP
        IF v_entity.platform->'storage'->i->>'used_pct' IS NOT NULL AND
           ((v_entity.platform->'storage'->i->>'used_pct')::numeric) > 80 THEN
          v_alerts := array_append(v_alerts, jsonb_build_object(
            'severity', 'warning',
            'category', 'storage',
            'message', 'Low disk space on ' || (v_entity.platform->'storage'->i->>'mount') || ': ' || 
                      (v_entity.platform->'storage'->i->>'free_gb') || 'GB free'
          ));
          v_score := v_score - 5;
        END IF;
      END LOOP;
    END IF;
    
    -- Extract key metrics
    v_metrics := jsonb_build_object(
      'cpu_count', v_entity.platform->'system'->>'cpu_count',
      'memory_gb', v_entity.platform->'memory'->>'total_gb',
      'memory_used_pct', v_entity.platform->'memory'->>'used_pct',
      'niagara_version', v_entity.platform->'system'->>'niagara_version',
      'uptime_days', COALESCE((v_entity.platform->'time'->>'uptime_days')::int, 0)
    );
  END IF;
  
  -- Extract metrics from resources data
  IF v_entity.resources IS NOT NULL AND v_entity.resources != '{}'::jsonb THEN
    -- Heap memory check
    IF v_entity.resources->>'heap_used_pct' IS NOT NULL AND
       (v_entity.resources->>'heap_used_pct')::numeric > 75 THEN
      v_alerts := array_append(v_alerts, jsonb_build_object(
        'severity', 'warning',
        'category', 'heap',
        'message', 'High heap usage: ' || (v_entity.resources->>'heap_used_pct') || '%'
      ));
      v_score := v_score - 10;
    END IF;
    
    -- Add resources metrics
    v_metrics := v_metrics || jsonb_build_object(
      'heap_used_pct', v_entity.resources->>'heap_used_pct',
      'device_count', v_entity.resources->'devices'->>'used',
      'device_licensed', v_entity.resources->'devices'->>'licensed'
    );
  END IF;
  
  -- Ensure score doesn't go below 0
  IF v_score < 0 THEN
    v_score := 0;
  END IF;
  
  -- Return analysis result
  RETURN jsonb_build_object(
    'health_score', v_score,
    'alerts', to_jsonb(v_alerts),
    'metrics', v_metrics,
    'analyzed_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;