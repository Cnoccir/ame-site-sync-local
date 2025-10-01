-- Fix Discovery Persistence: Add missing tables and enhance existing ones
-- This migration adds the tridium_imports table and enhances discovery entities for proper persistence

-- 1. Create tridium_imports table for storing raw file uploads
CREATE TABLE IF NOT EXISTS public.tridium_imports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
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
  metadata jsonb,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tridium_imports_session ON public.tridium_imports(session_id);
CREATE INDEX IF NOT EXISTS idx_tridium_imports_type ON public.tridium_imports(dataset_type);
CREATE INDEX IF NOT EXISTS idx_tridium_imports_uploaded ON public.tridium_imports(uploaded_at);

-- 2. Add analysis_snapshots table for storing computed analysis
CREATE TABLE IF NOT EXISTS public.analysis_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('supervisor', 'jace')),
  ref_id uuid NOT NULL, -- references either supervisors.id or jaces.id
  discovery_run_id uuid REFERENCES public.discovery_runs(id) ON DELETE CASCADE,
  health_score integer CHECK (health_score >= 0 AND health_score <= 100),
  alerts jsonb,
  metrics jsonb,
  recommendations jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analysis_scope_ref ON public.analysis_snapshots(scope, ref_id);
CREATE INDEX IF NOT EXISTS idx_analysis_discovery_run ON public.analysis_snapshots(discovery_run_id);

-- 3. Add raw_files table for file tracking and deduplication
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

-- 4. Enhance discovery_runs table with additional metadata
ALTER TABLE public.discovery_runs 
  ADD COLUMN IF NOT EXISTS metadata jsonb,
  ADD COLUMN IF NOT EXISTS import_summary jsonb,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 5. Enhance supervisors table with analysis fields
ALTER TABLE public.supervisors
  ADD COLUMN IF NOT EXISTS platform jsonb,
  ADD COLUMN IF NOT EXISTS analysis jsonb,
  ADD COLUMN IF NOT EXISTS health_score integer CHECK (health_score >= 0 AND health_score <= 100);

-- 6. Enhance jaces table with analysis fields  
ALTER TABLE public.jaces
  ADD COLUMN IF NOT EXISTS analysis jsonb,
  ADD COLUMN IF NOT EXISTS health_score integer CHECK (health_score >= 0 AND health_score <= 100);

-- 7. Create storage bucket for tridium uploads if not exists
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('tridium-uploads', 'tridium-uploads', true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- 8. Add RLS policies for new tables
ALTER TABLE public.tridium_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_files ENABLE ROW LEVEL SECURITY;

-- Anon policies for development (tighten in production)
CREATE POLICY anon_all_tridium_imports ON public.tridium_imports TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_all_analysis_snapshots ON public.analysis_snapshots TO anon USING (true) WITH CHECK (true);
CREATE POLICY anon_all_raw_files ON public.raw_files TO anon USING (true) WITH CHECK (true);

-- 9. Create helper function to get or create discovery run with proper session linkage
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

-- 10. Create function to compute analysis for a JACE or Supervisor
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
  IF v_entity.platform IS NOT NULL THEN
    -- Memory checks
    IF (v_entity.platform->'memory'->>'used_pct')::numeric > 75 THEN
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
        IF ((v_entity.platform->'storage'->i->>'used_pct')::numeric) > 80 THEN
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
  IF v_entity.resources IS NOT NULL THEN
    -- Heap memory check
    IF (v_entity.resources->>'heap_used_pct')::numeric > 75 THEN
      v_alerts := array_append(v_alerts, jsonb_build_object(
        'severity', 'warning',
        'category', 'heap',
        'message', 'High heap usage: ' || (v_entity.resources->>'heap_used_pct') || '%'
      ));
      v_score := v_score - 10;
    END IF;
    
    -- Device/point license check
    IF (v_entity.resources->'devices'->>'used')::int > 
       ((v_entity.resources->'devices'->>'licensed')::int * 0.9) THEN
      v_alerts := array_append(v_alerts, jsonb_build_object(
        'severity', 'info',
        'category', 'license',
        'message', 'Device license usage above 90%: ' || 
                   (v_entity.resources->'devices'->>'used') || '/' ||
                   (v_entity.resources->'devices'->>'licensed')
      ));
      v_score := v_score - 5;
    END IF;
    
    -- Add resource metrics
    v_metrics := v_metrics || jsonb_build_object(
      'devices_used', v_entity.resources->'devices'->>'used',
      'devices_licensed', v_entity.resources->'devices'->>'licensed',
      'points_used', v_entity.resources->'points'->>'used',
      'points_licensed', v_entity.resources->'points'->>'licensed',
      'histories', v_entity.resources->>'histories',
      'heap_used_mb', v_entity.resources->>'heap_used_mb',
      'heap_max_mb', v_entity.resources->>'heap_max_mb'
    );
  END IF;
  
  RETURN jsonb_build_object(
    'health_score', v_score,
    'alerts', to_jsonb(v_alerts),
    'metrics', v_metrics,
    'analyzed_at', now()
  );
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.get_or_create_discovery_run TO anon;
GRANT EXECUTE ON FUNCTION public.compute_discovery_analysis TO anon;

-- Storage bucket policies for tridium-uploads
CREATE POLICY "Anon users can upload tridium files" ON storage.objects
  FOR INSERT TO anon
  WITH CHECK (bucket_id = 'tridium-uploads');

CREATE POLICY "Anon users can view tridium files" ON storage.objects
  FOR SELECT TO anon
  USING (bucket_id = 'tridium-uploads');

CREATE POLICY "Anon users can update tridium files" ON storage.objects
  FOR UPDATE TO anon
  USING (bucket_id = 'tridium-uploads')
  WITH CHECK (bucket_id = 'tridium-uploads');

CREATE POLICY "Anon users can delete tridium files" ON storage.objects
  FOR DELETE TO anon
  USING (bucket_id = 'tridium-uploads');