-- Create tool_categories table
CREATE TABLE IF NOT EXISTS public.ame_tool_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL,
  description TEXT,
  is_essential BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ame_tool_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all tool categories" 
ON public.ame_tool_categories FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage tool categories" 
ON public.ame_tool_categories FOR ALL
USING (auth.uid() IS NOT NULL);

-- Add category_id to existing ame_tools table if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ame_tools' AND column_name = 'category_id') THEN
        ALTER TABLE public.ame_tools ADD COLUMN category_id UUID REFERENCES public.ame_tool_categories(id);
    END IF;
END $$;

-- Add is_essential column to ame_tools if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ame_tools' AND column_name = 'is_essential') THEN
        ALTER TABLE public.ame_tools ADD COLUMN is_essential BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add is_required column to ame_tools if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ame_tools' AND column_name = 'is_required') THEN
        ALTER TABLE public.ame_tools ADD COLUMN is_required BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add is_safety column to ame_tools if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ame_tools' AND column_name = 'is_safety') THEN
        ALTER TABLE public.ame_tools ADD COLUMN is_safety BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Insert sample tool categories
INSERT INTO public.ame_tool_categories (category_name, description, is_essential) VALUES
('Safety Equipment', 'Personal protective equipment and safety tools', true),
('General Tools', 'Basic maintenance and inspection tools', true),
('Testing Equipment', 'Diagnostic and measurement instruments', false),
('Specialized Tools', 'Equipment specific tools and parts', false),
('Documentation', 'Forms, tablets, and recording equipment', true)
ON CONFLICT DO NOTHING;

-- Insert sample tools for each category
WITH category_ids AS (
  SELECT id, category_name FROM public.ame_tool_categories
)
INSERT INTO public.ame_tools (tool_name, category_id, is_essential, is_required, is_safety, safety_category)
SELECT 
  tool_data.tool_name,
  cat.id,
  tool_data.is_essential,
  tool_data.is_required,
  tool_data.is_safety,
  CASE WHEN tool_data.is_safety THEN 'high' ELSE 'low' END
FROM (
  VALUES 
    -- Safety Equipment (essential)
    ('Safety Glasses', 'Safety Equipment', true, true, true),
    ('Hard Hat', 'Safety Equipment', true, true, true),
    ('Safety Vest', 'Safety Equipment', true, true, true),
    ('Work Gloves', 'Safety Equipment', true, true, true),
    ('Steel Toe Boots', 'Safety Equipment', true, true, true),
    
    -- General Tools (essential)
    ('Screwdriver Set', 'General Tools', true, true, false),
    ('Adjustable Wrench', 'General Tools', true, true, false),
    ('Flashlight', 'General Tools', true, true, false),
    ('Tool Bag', 'General Tools', true, true, false),
    ('Inspection Mirror', 'General Tools', true, false, false),
    
    -- Testing Equipment
    ('Multimeter', 'Testing Equipment', false, false, false),
    ('Pressure Gauge', 'Testing Equipment', false, false, false),
    ('Temperature Gun', 'Testing Equipment', false, false, false),
    ('Oscilloscope', 'Testing Equipment', false, false, false),
    
    -- Specialized Tools  
    ('Torque Wrench', 'Specialized Tools', false, false, false),
    ('Wire Strippers', 'Specialized Tools', false, false, false),
    ('Crimping Tool', 'Specialized Tools', false, false, false),
    
    -- Documentation (essential)
    ('Tablet/Laptop', 'Documentation', true, true, false),
    ('Camera', 'Documentation', true, false, false),
    ('Service Forms', 'Documentation', true, true, false)
) AS tool_data(tool_name, category_name, is_essential, is_required, is_safety)
JOIN category_ids cat ON cat.category_name = tool_data.category_name
ON CONFLICT (tool_name) DO NOTHING;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_ame_tool_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ame_tool_categories_updated_at
    BEFORE UPDATE ON public.ame_tool_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_ame_tool_categories_updated_at();