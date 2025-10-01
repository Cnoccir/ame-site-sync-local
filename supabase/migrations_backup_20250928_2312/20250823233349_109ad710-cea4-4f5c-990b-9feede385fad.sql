-- Remove sample tool insertions from previous migration
-- The tools are already loaded from CSV import, so we'll use those instead

-- Update existing tools to link them to appropriate categories and set essential/required flags
UPDATE ame_tools 
SET category_id = (SELECT id FROM ame_tool_categories WHERE category_name = 'Safety Equipment' LIMIT 1),
    is_essential = true,
    is_required = true,
    is_safety = true
WHERE category IN ('PPE', 'Safety') OR safety_category = 'Required';

UPDATE ame_tools 
SET category_id = (SELECT id FROM ame_tool_categories WHERE category_name = 'General Tools' LIMIT 1),
    is_essential = true,
    is_required = true
WHERE category IN ('Computing', 'Connectivity', 'General') AND is_essential = false;

UPDATE ame_tools 
SET category_id = (SELECT id FROM ame_tool_categories WHERE category_name = 'Testing Equipment' LIMIT 1),
    is_essential = false,
    is_required = false
WHERE category IN ('Testing Equipment', 'Calibration', 'Measurement');

UPDATE ame_tools 
SET category_id = (SELECT id FROM ame_tool_categories WHERE category_name = 'Specialized Tools' LIMIT 1),
    is_essential = false,
    is_required = false
WHERE category NOT IN ('PPE', 'Safety', 'Computing', 'Connectivity', 'General', 'Testing Equipment', 'Calibration', 'Measurement') AND category_id IS NULL;

-- Set documentation tools
UPDATE ame_tools 
SET category_id = (SELECT id FROM ame_tool_categories WHERE category_name = 'Documentation' LIMIT 1),
    is_essential = true,
    is_required = true
WHERE tool_name ILIKE '%tablet%' OR tool_name ILIKE '%form%' OR tool_name ILIKE '%camera%' OR tool_name ILIKE '%documentation%';