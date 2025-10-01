-- ===================================================================
-- IMPORT EMPLOYEE DIRECTORY
-- Import employee data from Phone-Company Directory for tech quick search
-- ===================================================================

-- Clear existing data (keep existing employees if any)
-- We'll use UPSERT to update existing and add new

-- Create temporary function for importing employee directory
CREATE OR REPLACE FUNCTION import_employee_directory_from_md()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result_count INTEGER := 0;
BEGIN
    -- This function will be called by the import script to populate employee data
    -- Employee Directory MD structure: Employee | Mobile | Email | Extension | Direct Line

    RETURN 'Ready to import Employee Directory. Use the import script to populate data.';
END;
$$;

-- Ensure the ame_employees table has the correct structure for the directory data
-- Check if we need to add any missing columns for the directory
DO $$
BEGIN
    -- Add mobile phone column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ame_employees' AND column_name = 'mobile_phone') THEN
        ALTER TABLE ame_employees ADD COLUMN mobile_phone TEXT;
    END IF;

    -- Add extension column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ame_employees' AND column_name = 'extension') THEN
        ALTER TABLE ame_employees ADD COLUMN extension TEXT;
    END IF;

    -- Add direct_line column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ame_employees' AND column_name = 'direct_line') THEN
        ALTER TABLE ame_employees ADD COLUMN direct_line TEXT;
    END IF;

    -- Add is_technician flag if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ame_employees' AND column_name = 'is_technician') THEN
        ALTER TABLE ame_employees ADD COLUMN is_technician BOOLEAN DEFAULT FALSE;
    END IF;

    -- Add search capability
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ame_employees' AND column_name = 'search_vector') THEN
        ALTER TABLE ame_employees ADD COLUMN search_vector TSVECTOR;
    END IF;
END
$$;

-- Create search vector update function for employees
CREATE OR REPLACE FUNCTION update_employee_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.employee_name, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.mobile_phone, '') || ' ' ||
        COALESCE(NEW.extension, '') || ' ' ||
        COALESCE(NEW.direct_line, '') || ' ' ||
        COALESCE(NEW.department, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply search vector trigger
DROP TRIGGER IF EXISTS update_employee_search_vector_trigger ON ame_employees;
CREATE TRIGGER update_employee_search_vector_trigger
    BEFORE INSERT OR UPDATE ON ame_employees
    FOR EACH ROW EXECUTE FUNCTION update_employee_search_vector();

-- Create employee search function
CREATE OR REPLACE FUNCTION search_employees(
    search_query TEXT,
    technicians_only BOOLEAN DEFAULT FALSE,
    max_results INTEGER DEFAULT 20
)
RETURNS TABLE(
    id UUID,
    technician_id TEXT,
    employee_name TEXT,
    email TEXT,
    mobile_phone TEXT,
    extension TEXT,
    direct_line TEXT,
    department TEXT,
    is_technician BOOLEAN,
    relevance_score REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id,
        e.technician_id,
        e.employee_name,
        e.email,
        e.mobile_phone,
        e.extension,
        e.direct_line,
        e.department,
        e.is_technician,
        CASE WHEN search_query IS NOT NULL AND search_query != '' THEN
            ts_rank(e.search_vector, plainto_tsquery('english', search_query))
        ELSE 0.0 END AS relevance_score
    FROM ame_employees e
    WHERE
        e.is_active = TRUE
        AND (search_query IS NULL OR search_query = '' OR e.search_vector @@ plainto_tsquery('english', search_query))
        AND (technicians_only = FALSE OR e.is_technician = TRUE)
    ORDER BY
        CASE WHEN search_query IS NOT NULL AND search_query != '' THEN relevance_score END DESC,
        e.employee_name ASC
    LIMIT max_results;
END;
$$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ame_employees_search ON ame_employees USING GIN(search_vector) WHERE search_vector IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ame_employees_technician ON ame_employees(is_technician) WHERE is_technician = TRUE;
CREATE INDEX IF NOT EXISTS idx_ame_employees_active ON ame_employees(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_ame_employees_email ON ame_employees(email) WHERE email IS NOT NULL;

-- Create view for quick technician lookup
CREATE OR REPLACE VIEW technician_directory AS
SELECT
    id,
    technician_id,
    employee_name as name,
    email,
    mobile_phone,
    extension,
    direct_line,
    department,
    employment_status,
    is_active
FROM ame_employees
WHERE is_technician = TRUE AND is_active = TRUE
ORDER BY employee_name;

COMMENT ON VIEW technician_directory IS 'Quick lookup view for active technicians';
COMMENT ON FUNCTION import_employee_directory_from_md() IS 'Placeholder function for Employee Directory import process';
COMMENT ON FUNCTION search_employees(TEXT, BOOLEAN, INTEGER) IS 'Full-text search function for employees with optional technician filtering';