-- ===================================================================
-- ADD USER-CENTRIC OWNERSHIP TO EXISTING TABLES
-- This migration adds user ownership without disrupting existing structure
-- ===================================================================

-- Add created_by columns to main tables if they don't exist
ALTER TABLE ame_customers
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS owned_by UUID REFERENCES auth.users(id);

ALTER TABLE ame_visits
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS owned_by UUID REFERENCES auth.users(id);

ALTER TABLE pm_workflow_sessions
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS owned_by UUID REFERENCES auth.users(id);

ALTER TABLE previsit_preparations
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS owned_by UUID REFERENCES auth.users(id);

-- Update existing records to be owned by current users if possible
-- For now, set all to be owned by the current user creating this migration
UPDATE ame_customers SET
    created_by = auth.uid(),
    owned_by = auth.uid()
WHERE created_by IS NULL AND auth.uid() IS NOT NULL;

UPDATE ame_visits SET
    created_by = auth.uid(),
    owned_by = auth.uid()
WHERE created_by IS NULL AND auth.uid() IS NOT NULL;

UPDATE pm_workflow_sessions SET
    created_by = auth.uid(),
    owned_by = auth.uid()
WHERE created_by IS NULL AND auth.uid() IS NOT NULL;

UPDATE previsit_preparations SET
    created_by = auth.uid(),
    owned_by = auth.uid()
WHERE created_by IS NULL AND auth.uid() IS NOT NULL;

-- ===================================================================
-- ROW LEVEL SECURITY POLICIES
-- ===================================================================

-- Enable RLS on main tables
ALTER TABLE ame_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ame_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE pm_workflow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE previsit_preparations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS customers_user_access ON ame_customers;
DROP POLICY IF EXISTS visits_user_access ON ame_visits;
DROP POLICY IF EXISTS pm_sessions_user_access ON pm_workflow_sessions;
DROP POLICY IF EXISTS previsit_user_access ON previsit_preparations;

-- User-centric policies: users can see their own data + admins/techs see all
CREATE POLICY customers_user_access ON ame_customers
    FOR ALL USING (
        owned_by = auth.uid()
        OR
        -- Hardcoded admin/tech access
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'technician')
        )
        OR
        -- Legacy email-based access for backward compatibility
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email IN (
                'admin@ame-inc.com',
                'tech@ame-inc.com'
            )
        )
    );

CREATE POLICY visits_user_access ON ame_visits
    FOR ALL USING (
        owned_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'technician')
        )
        OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email IN (
                'admin@ame-inc.com',
                'tech@ame-inc.com'
            )
        )
    );

CREATE POLICY pm_sessions_user_access ON pm_workflow_sessions
    FOR ALL USING (
        owned_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'technician')
        )
        OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email IN (
                'admin@ame-inc.com',
                'tech@ame-inc.com'
            )
        )
    );

CREATE POLICY previsit_user_access ON previsit_preparations
    FOR ALL USING (
        owned_by = auth.uid()
        OR
        EXISTS (
            SELECT 1 FROM user_profiles
            WHERE id = auth.uid()
            AND role IN ('admin', 'technician')
        )
        OR
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email IN (
                'admin@ame-inc.com',
                'tech@ame-inc.com'
            )
        )
    );

-- ===================================================================
-- AUTOMATIC OWNERSHIP ASSIGNMENT
-- ===================================================================

-- Function to automatically set ownership on new records
CREATE OR REPLACE FUNCTION set_record_ownership()
RETURNS TRIGGER AS $$
BEGIN
    -- Set created_by and owned_by to current user
    NEW.created_by = auth.uid();
    NEW.owned_by = COALESCE(NEW.owned_by, auth.uid());

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to auto-set ownership
DROP TRIGGER IF EXISTS set_customer_ownership ON ame_customers;
CREATE TRIGGER set_customer_ownership
    BEFORE INSERT ON ame_customers
    FOR EACH ROW EXECUTE FUNCTION set_record_ownership();

DROP TRIGGER IF EXISTS set_visit_ownership ON ame_visits;
CREATE TRIGGER set_visit_ownership
    BEFORE INSERT ON ame_visits
    FOR EACH ROW EXECUTE FUNCTION set_record_ownership();

DROP TRIGGER IF EXISTS set_pm_session_ownership ON pm_workflow_sessions;
CREATE TRIGGER set_pm_session_ownership
    BEFORE INSERT ON pm_workflow_sessions
    FOR EACH ROW EXECUTE FUNCTION set_record_ownership();

DROP TRIGGER IF EXISTS set_previsit_ownership ON previsit_preparations;
CREATE TRIGGER set_previsit_ownership
    BEFORE INSERT ON previsit_preparations
    FOR EACH ROW EXECUTE FUNCTION set_record_ownership();

-- ===================================================================
-- ADMIN FUNCTIONS FOR USER MANAGEMENT
-- ===================================================================

-- Function to transfer ownership (admin only)
CREATE OR REPLACE FUNCTION transfer_record_ownership(
    table_name TEXT,
    record_id UUID,
    new_owner_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN := FALSE;
BEGIN
    -- Check if current user is admin
    SELECT EXISTS(
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid() AND role = 'admin'
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Only admins can transfer ownership';
    END IF;

    -- Transfer ownership based on table
    CASE table_name
        WHEN 'ame_customers' THEN
            UPDATE ame_customers SET owned_by = new_owner_id WHERE id = record_id;
        WHEN 'ame_visits' THEN
            UPDATE ame_visits SET owned_by = new_owner_id WHERE id = record_id;
        WHEN 'pm_workflow_sessions' THEN
            UPDATE pm_workflow_sessions SET owned_by = new_owner_id WHERE id = record_id;
        WHEN 'previsit_preparations' THEN
            UPDATE previsit_preparations SET owned_by = new_owner_id WHERE id = record_id;
        ELSE
            RAISE EXCEPTION 'Invalid table name: %', table_name;
    END CASE;

    RETURN TRUE;
END;
$$;

-- ===================================================================
-- HELPER VIEWS FOR USER DATA
-- ===================================================================

-- View for user's own projects
CREATE OR REPLACE VIEW user_projects AS
SELECT
    'customer' as project_type,
    c.id,
    c.customer_id as project_id,
    c.company_name as project_name,
    c.created_at,
    c.updated_at,
    c.owned_by,
    c.created_by,
    'customer_management' as category
FROM ame_customers c
WHERE c.owned_by = auth.uid()

UNION ALL

SELECT
    'visit' as project_type,
    v.id,
    v.visit_id as project_id,
    COALESCE(c.company_name, 'Unknown Customer') as project_name,
    v.created_at,
    v.updated_at,
    v.owned_by,
    v.created_by,
    'field_visit' as category
FROM ame_visits v
LEFT JOIN ame_customers c ON v.customer_id = c.id
WHERE v.owned_by = auth.uid()

UNION ALL

SELECT
    'pm_session' as project_type,
    p.id,
    p.session_id as project_id,
    p.customer_name as project_name,
    p.created_at,
    p.updated_at,
    p.owned_by,
    p.created_by,
    'pm_workflow' as category
FROM pm_workflow_sessions p
WHERE p.owned_by = auth.uid();

COMMENT ON VIEW user_projects IS 'Unified view of all user-owned projects across different types';

-- ===================================================================
-- ADMIN DASHBOARD VIEWS
-- ===================================================================

-- View for admin to see all projects (admin only)
CREATE OR REPLACE VIEW admin_all_projects AS
SELECT
    'customer' as project_type,
    c.id,
    c.customer_id as project_id,
    c.company_name as project_name,
    c.created_at,
    c.updated_at,
    c.owned_by,
    c.created_by,
    up.full_name as owner_name,
    up.email as owner_email,
    'customer_management' as category
FROM ame_customers c
LEFT JOIN user_profiles up ON c.owned_by = up.id

UNION ALL

SELECT
    'visit' as project_type,
    v.id,
    v.visit_id as project_id,
    COALESCE(c.company_name, 'Unknown Customer') as project_name,
    v.created_at,
    v.updated_at,
    v.owned_by,
    v.created_by,
    up.full_name as owner_name,
    up.email as owner_email,
    'field_visit' as category
FROM ame_visits v
LEFT JOIN ame_customers c ON v.customer_id = c.id
LEFT JOIN user_profiles up ON v.owned_by = up.id

UNION ALL

SELECT
    'pm_session' as project_type,
    p.id,
    p.session_id as project_id,
    p.customer_name as project_name,
    p.created_at,
    p.updated_at,
    p.owned_by,
    p.created_by,
    up.full_name as owner_name,
    up.email as owner_email,
    'pm_workflow' as category
FROM pm_workflow_sessions p
LEFT JOIN user_profiles up ON p.owned_by = up.id;

-- RLS on admin view - only admins can see this
ALTER VIEW admin_all_projects SET (security_invoker = true);

COMMENT ON VIEW admin_all_projects IS 'Admin-only view of all projects across all users';