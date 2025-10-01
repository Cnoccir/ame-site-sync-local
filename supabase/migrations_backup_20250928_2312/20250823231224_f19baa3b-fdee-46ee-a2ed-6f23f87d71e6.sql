-- Create tool_categories table
CREATE TABLE IF NOT EXISTS public.ame_tool_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_essential BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ame_tool_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for tool_categories
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

-- Add columns to ame_tools if not exists
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ame_tools' AND column_name = 'is_essential') THEN
        ALTER TABLE public.ame_tools ADD COLUMN is_essential BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ame_tools' AND column_name = 'is_required') THEN
        ALTER TABLE public.ame_tools ADD COLUMN is_required BOOLEAN DEFAULT false;
    END IF;
    
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
ON CONFLICT (category_name) DO NOTHING;