-- Create enhanced visits table for proper visit tracking
CREATE TABLE IF NOT EXISTS public.ame_visit_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL,
  technician_id UUID NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  auto_save_data JSONB DEFAULT '{}',
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to existing ame_visits table for enhanced tracking (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ame_visits') THEN
        ALTER TABLE public.ame_visits 
        ADD COLUMN IF NOT EXISTS current_phase INTEGER DEFAULT 1,
        ADD COLUMN IF NOT EXISTS auto_save_data JSONB DEFAULT '{}',
        ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
        ADD COLUMN IF NOT EXISTS total_duration INTEGER DEFAULT 0,
        ADD COLUMN IF NOT EXISTS started_at TIMESTAMP WITH TIME ZONE,
        ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + INTERVAL '24 hours'),
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
        ADD COLUMN IF NOT EXISTS customer_satisfaction INTEGER,
        ADD COLUMN IF NOT EXISTS next_service_due DATE;
    END IF;
END $$;

-- Enable RLS on new table
ALTER TABLE public.ame_visit_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for visit sessions
CREATE POLICY "Technicians can manage their own visit sessions" 
ON public.ame_visit_sessions 
FOR ALL 
USING (auth.uid() = technician_id);

CREATE POLICY "Users can view visit sessions" 
ON public.ame_visit_sessions 
FOR SELECT 
USING (true);

-- Create function to clean up expired visits
CREATE OR REPLACE FUNCTION public.cleanup_expired_visits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark expired visits as abandoned (only if table exists)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ame_visits') THEN
    UPDATE public.ame_visits 
    SET 
      visit_status = 'Abandoned',
      is_active = false,
      updated_at = now()
    WHERE 
      expires_at < now() 
      AND visit_status NOT IN ('Completed', 'Abandoned');
  END IF;
    
  -- Deactivate expired sessions
  UPDATE public.ame_visit_sessions 
  SET 
    is_active = false,
    last_activity = now()
  WHERE 
    expires_at < now() 
    AND is_active = true;
END;
$$;

-- Create function to generate visit ID
CREATE OR REPLACE FUNCTION public.generate_visit_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_str TEXT;
  count_today INTEGER;
  new_visit_id TEXT;
BEGIN
  -- Get today's date in YYYYMMDD format
  today_str := to_char(now(), 'YYYYMMDD');
  
  -- Count existing visits for today
  SELECT COUNT(*) INTO count_today
  FROM public.ame_visits
  WHERE visit_id LIKE 'VIS_' || today_str || '_%';
  
  -- Generate new visit ID
  new_visit_id := 'VIS_' || today_str || '_' || LPAD((count_today + 1)::TEXT, 3, '0');
  
  RETURN new_visit_id;
END;
$$;

-- Create trigger to update last_activity on visits table
CREATE OR REPLACE FUNCTION public.update_visit_last_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.last_activity = now();
  RETURN NEW;
END;
$$;

-- Create trigger only if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ame_visits') THEN
        DROP TRIGGER IF EXISTS update_visits_last_activity ON public.ame_visits;
        CREATE TRIGGER update_visits_last_activity
          BEFORE UPDATE ON public.ame_visits
          FOR EACH ROW
          EXECUTE FUNCTION public.update_visit_last_activity();
    END IF;
END $$;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_visit_sessions_technician_active 
ON public.ame_visit_sessions(technician_id, is_active);

-- Create indexes only if table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ame_visits') THEN
        CREATE INDEX IF NOT EXISTS idx_visits_active_status 
        ON public.ame_visits(is_active, visit_status);
        
        CREATE INDEX IF NOT EXISTS idx_visits_customer_active 
        ON public.ame_visits(customer_id, is_active);
    END IF;
END $$;
