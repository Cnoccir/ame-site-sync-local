-- Create previsit_preparations table
CREATE TABLE IF NOT EXISTS previsit_preparations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id UUID NOT NULL REFERENCES ame_customers(id) ON DELETE CASCADE,
    visit_id UUID REFERENCES ame_visits(id) ON DELETE CASCADE,
    
    -- Site Intelligence Data
    site_intelligence_data JSONB DEFAULT '{}',
    site_intelligence_complete BOOLEAN DEFAULT false,
    
    -- Contact & Access Data  
    contact_access_data JSONB DEFAULT '{}',
    contact_access_complete BOOLEAN DEFAULT false,
    
    -- Documentation Data
    documentation_data JSONB DEFAULT '{}',
    documentation_complete BOOLEAN DEFAULT false,
    
    -- Tool Preparation Data
    tool_preparation_data JSONB DEFAULT '{}',
    tool_preparation_complete BOOLEAN DEFAULT false,
    
    -- Checklist Data
    checklist_data JSONB DEFAULT '{}',
    checklist_complete BOOLEAN DEFAULT false,
    
    -- Overall Progress Tracking
    preparation_status TEXT DEFAULT 'pending' CHECK (preparation_status IN ('pending', 'in_progress', 'completed')),
    overall_progress INTEGER DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
    sections_completed INTEGER DEFAULT 0 CHECK (sections_completed >= 0 AND sections_completed <= 5),
    
    -- Session Management
    session_token UUID DEFAULT gen_random_uuid(),
    auto_save_data JSONB DEFAULT '{}',
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique preparation per customer/visit combination
    UNIQUE(customer_id, visit_id)
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_previsit_preparations_customer_id ON previsit_preparations(customer_id);
CREATE INDEX IF NOT EXISTS idx_previsit_preparations_visit_id ON previsit_preparations(visit_id);
CREATE INDEX IF NOT EXISTS idx_previsit_preparations_status ON previsit_preparations(preparation_status);
CREATE INDEX IF NOT EXISTS idx_previsit_preparations_last_activity ON previsit_preparations(last_activity);

-- Create tool selections table
CREATE TABLE IF NOT EXISTS previsit_tool_selections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    previsit_preparation_id UUID NOT NULL REFERENCES previsit_preparations(id) ON DELETE CASCADE,
    tool_id TEXT NOT NULL, -- Reference to tool catalog (could be UUID in future)
    tool_name TEXT NOT NULL,
    tool_category TEXT NOT NULL CHECK (tool_category IN ('standard', 'system_specific', 'spare_parts')),
    
    -- Selection details
    is_selected BOOLEAN DEFAULT false,
    quantity INTEGER DEFAULT 1 CHECK (quantity >= 0),
    selection_reason TEXT DEFAULT 'user_selected',
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique tool per preparation
    UNIQUE(previsit_preparation_id, tool_id)
);

-- Create index for tool selections
CREATE INDEX IF NOT EXISTS idx_previsit_tool_selections_prep_id ON previsit_tool_selections(previsit_preparation_id);
CREATE INDEX IF NOT EXISTS idx_previsit_tool_selections_tool_id ON previsit_tool_selections(tool_id);

-- Create trigger to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers
CREATE TRIGGER update_previsit_preparations_updated_at 
    BEFORE UPDATE ON previsit_preparations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_previsit_tool_selections_updated_at 
    BEFORE UPDATE ON previsit_tool_selections 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate preparation progress
CREATE OR REPLACE FUNCTION calculate_previsit_progress(preparation_id UUID)
RETURNS INTEGER AS $$
DECLARE
    completed_sections INTEGER := 0;
    progress_percentage INTEGER;
BEGIN
    SELECT 
        CASE WHEN site_intelligence_complete THEN 1 ELSE 0 END +
        CASE WHEN contact_access_complete THEN 1 ELSE 0 END +
        CASE WHEN documentation_complete THEN 1 ELSE 0 END +
        CASE WHEN tool_preparation_complete THEN 1 ELSE 0 END +
        CASE WHEN checklist_complete THEN 1 ELSE 0 END
    INTO completed_sections
    FROM previsit_preparations
    WHERE id = preparation_id;
    
    -- Calculate percentage (out of 5 sections)
    progress_percentage := ROUND((completed_sections::DECIMAL / 5) * 100);
    
    -- Update the record
    UPDATE previsit_preparations 
    SET 
        sections_completed = completed_sections,
        overall_progress = progress_percentage,
        preparation_status = CASE 
            WHEN progress_percentage = 100 THEN 'completed'
            WHEN progress_percentage > 0 THEN 'in_progress'
            ELSE 'pending'
        END,
        updated_at = NOW()
    WHERE id = preparation_id;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Create function to auto-save preparation data
CREATE OR REPLACE FUNCTION upsert_previsit_preparation(
    p_customer_id UUID,
    p_visit_id UUID DEFAULT NULL,
    p_section_data JSONB DEFAULT '{}',
    p_section_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    prep_id UUID;
    current_data JSONB;
BEGIN
    -- Try to get existing preparation
    SELECT id INTO prep_id
    FROM previsit_preparations
    WHERE customer_id = p_customer_id 
    AND (visit_id = p_visit_id OR (visit_id IS NULL AND p_visit_id IS NULL));
    
    -- If no preparation exists, create one
    IF prep_id IS NULL THEN
        INSERT INTO previsit_preparations (customer_id, visit_id, preparation_status)
        VALUES (p_customer_id, p_visit_id, 'in_progress')
        RETURNING id INTO prep_id;
    END IF;
    
    -- Update specific section if provided
    IF p_section_name IS NOT NULL AND p_section_data IS NOT NULL THEN
        CASE p_section_name
            WHEN 'siteIntelligence' THEN
                UPDATE previsit_preparations 
                SET site_intelligence_data = p_section_data,
                    last_activity = NOW()
                WHERE id = prep_id;
            WHEN 'contactAccess' THEN
                UPDATE previsit_preparations 
                SET contact_access_data = p_section_data,
                    last_activity = NOW()
                WHERE id = prep_id;
            WHEN 'documentation' THEN
                UPDATE previsit_preparations 
                SET documentation_data = p_section_data,
                    last_activity = NOW()
                WHERE id = prep_id;
            WHEN 'toolPreparation' THEN
                UPDATE previsit_preparations 
                SET tool_preparation_data = p_section_data,
                    last_activity = NOW()
                WHERE id = prep_id;
            WHEN 'checklist' THEN
                UPDATE previsit_preparations 
                SET checklist_data = p_section_data,
                    last_activity = NOW()
                WHERE id = prep_id;
        END CASE;
    END IF;
    
    -- Update last activity
    UPDATE previsit_preparations 
    SET last_activity = NOW()
    WHERE id = prep_id;
    
    RETURN prep_id;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) policies
ALTER TABLE previsit_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE previsit_tool_selections ENABLE ROW LEVEL SECURITY;

-- Create policies (adjust based on your auth setup)
CREATE POLICY "Users can view their own preparations" ON previsit_preparations
    FOR SELECT USING (true); -- Adjust based on your auth system

CREATE POLICY "Users can insert their own preparations" ON previsit_preparations
    FOR INSERT WITH CHECK (true); -- Adjust based on your auth system

CREATE POLICY "Users can update their own preparations" ON previsit_preparations
    FOR UPDATE USING (true); -- Adjust based on your auth system

-- Similar policies for tool selections
CREATE POLICY "Users can view tool selections" ON previsit_tool_selections
    FOR SELECT USING (true);

CREATE POLICY "Users can manage tool selections" ON previsit_tool_selections
    FOR ALL USING (true);

-- Grant necessary permissions
GRANT ALL ON previsit_preparations TO authenticated;
GRANT ALL ON previsit_tool_selections TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;
