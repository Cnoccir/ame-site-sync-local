-- Create activity logs table for tracking user actions
CREATE TABLE IF NOT EXISTS public.ame_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  entity_id UUID,
  entity_type TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ame_activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own activities"
ON public.ame_activity_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own activities"
ON public.ame_activity_logs FOR SELECT
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_activity_logs_user_created ON public.ame_activity_logs(user_id, created_at DESC);