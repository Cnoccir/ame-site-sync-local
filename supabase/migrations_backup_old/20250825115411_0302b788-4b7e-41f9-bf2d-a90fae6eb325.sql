-- Add skipped_steps column to track which steps were skipped in visits
ALTER TABLE public.ame_visits 
ADD COLUMN IF NOT EXISTS skipped_steps INTEGER[] DEFAULT '{}';

-- Add comment to describe the new column
COMMENT ON COLUMN public.ame_visits.skipped_steps IS 'Array of step numbers that were skipped during this visit';