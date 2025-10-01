-- Check if visit_tasks table has RLS policies
SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'visit_tasks';

-- Create visit_tasks table if it doesn't exist with proper RLS
CREATE TABLE IF NOT EXISTS public.visit_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL REFERENCES public.ame_visits(id) ON DELETE CASCADE,
  task_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  start_time TIMESTAMP WITH TIME ZONE,
  completion_time TIMESTAMP WITH TIME ZONE,
  actual_duration INTEGER, -- in minutes
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(visit_id, task_id)
);

-- Enable RLS
ALTER TABLE public.visit_tasks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for visit_tasks
DROP POLICY IF EXISTS "Users can view visit tasks for their visits" ON public.visit_tasks;
DROP POLICY IF EXISTS "Users can insert visit tasks for their visits" ON public.visit_tasks;
DROP POLICY IF EXISTS "Users can update visit tasks for their visits" ON public.visit_tasks;
DROP POLICY IF EXISTS "Users can delete visit tasks for their visits" ON public.visit_tasks;

CREATE POLICY "Users can view visit tasks for their visits" 
ON public.visit_tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.ame_visits 
    WHERE id = visit_tasks.visit_id 
    AND technician_id = auth.uid()
  )
);

CREATE POLICY "Users can insert visit tasks for their visits" 
ON public.visit_tasks 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ame_visits 
    WHERE id = visit_tasks.visit_id 
    AND technician_id = auth.uid()
  )
);

CREATE POLICY "Users can update visit tasks for their visits" 
ON public.visit_tasks 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.ame_visits 
    WHERE id = visit_tasks.visit_id 
    AND technician_id = auth.uid()
  )
);

CREATE POLICY "Users can delete visit tasks for their visits" 
ON public.visit_tasks 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.ame_visits 
    WHERE id = visit_tasks.visit_id 
    AND technician_id = auth.uid()
  )
);

-- Add trigger for updating updated_at
DROP TRIGGER IF EXISTS update_visit_tasks_updated_at ON public.visit_tasks;
CREATE TRIGGER update_visit_tasks_updated_at
BEFORE UPDATE ON public.visit_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();