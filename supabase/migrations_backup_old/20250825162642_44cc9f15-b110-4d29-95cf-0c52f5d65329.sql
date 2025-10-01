-- Add rich content support to SOPs
ALTER TABLE public.ame_sops_normalized 
ADD COLUMN IF NOT EXISTS rich_content TEXT,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General',
ADD COLUMN IF NOT EXISTS original_steps_html TEXT;

-- Update steps JSONB structure to support rich content with references
-- Update hyperlinks JSONB to support numbered reference mapping
-- The existing steps and hyperlinks columns will be enhanced to support:
-- steps: [{"step_number": 1, "content": "text", "references": [1,2]}, ...]
-- hyperlinks: [{"ref_number": 1, "url": "...", "title": "..."}, ...]

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sops_category ON public.ame_sops_normalized(category);
CREATE INDEX IF NOT EXISTS idx_sops_rich_content ON public.ame_sops_normalized USING gin(to_tsvector('english', rich_content));

-- Update existing SOPs to have default category
UPDATE public.ame_sops_normalized 
SET category = 'General' 
WHERE category IS NULL;