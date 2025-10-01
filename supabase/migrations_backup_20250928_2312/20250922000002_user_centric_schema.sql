-- ===================================================================
-- NEW USER-CENTRIC PM WORKFLOW SCHEMA
-- Designed with user-based project ownership and hardcoded admin/tech access
-- ===================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================================================
-- USER MANAGEMENT & AUTHENTICATION
-- ===================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT,
    role TEXT CHECK (role IN ('user', 'technician', 'admin')) DEFAULT 'user',
    company TEXT,
    phone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Employee directory for technician quick search
CREATE TABLE employees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    mobile TEXT,
    extension TEXT,
    direct_line TEXT,
    department TEXT,
    is_technician BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- CUSTOMER DATA
-- ===================================================================

-- SimPro customer reference data
CREATE TABLE simpro_customers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    simpro_customer_id TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    email TEXT,
    mailing_address TEXT,
    mailing_city TEXT,
    mailing_state TEXT,
    mailing_zip TEXT,
    labor_tax_code TEXT,
    part_tax_code TEXT,
    is_contract_customer BOOLEAN DEFAULT false,
    has_active_contracts BOOLEAN DEFAULT false,
    active_contract_count INTEGER DEFAULT 0,
    total_contract_value NUMERIC(12,2) DEFAULT 0,
    service_tier TEXT CHECK (service_tier IN ('CORE', 'ASSURE', 'GUARDIAN')) DEFAULT 'CORE',
    latest_contract_email TEXT,
    search_vector TSVECTOR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- PM WORKFLOW PROJECTS (User-owned)
-- ===================================================================

-- PM Workflow Projects - each user owns their projects
CREATE TABLE pm_projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_name TEXT NOT NULL,
    customer_id UUID REFERENCES simpro_customers(id),
    customer_name TEXT NOT NULL,
    service_tier TEXT CHECK (service_tier IN ('CORE', 'ASSURE', 'GUARDIAN')) NOT NULL,

    -- Project ownership
    created_by UUID REFERENCES auth.users(id) NOT NULL,
    assigned_technician UUID REFERENCES employees(id),

    -- Project status
    status TEXT CHECK (status IN ('Draft', 'In Progress', 'Completed', 'Cancelled')) DEFAULT 'Draft',
    current_phase INTEGER CHECK (current_phase BETWEEN 1 AND 4) DEFAULT 1,

    -- Timing
    start_time TIMESTAMPTZ DEFAULT NOW(),
    completion_time TIMESTAMPTZ,
    estimated_duration_hours NUMERIC(5,2),
    actual_duration_hours NUMERIC(5,2),

    -- Project data
    project_data JSONB DEFAULT '{}',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project phases data
CREATE TABLE project_phases (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES pm_projects(id) ON DELETE CASCADE,
    phase_number INTEGER CHECK (phase_number BETWEEN 1 AND 4),
    phase_name TEXT NOT NULL,
    phase_data JSONB DEFAULT '{}',
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(project_id, phase_number)
);

-- ===================================================================
-- TASK & SOP LIBRARIES
-- ===================================================================

-- Task Library (global reference data)
CREATE TABLE task_library (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    task_id TEXT UNIQUE NOT NULL, -- C001, A001, etc.
    task_name TEXT NOT NULL,
    system_family TEXT,
    vendor_flavor TEXT,
    phase TEXT,
    service_tiers TEXT[], -- ['CORE', 'ASSURE', 'GUARDIAN']
    frequency TEXT,
    estimated_duration_min INTEGER,
    audience_level INTEGER,
    initial_steps TEXT,
    sop_refs TEXT[],
    acceptance_criteria TEXT,
    artifacts TEXT,
    prerequisites TEXT,
    tools_required TEXT,
    safety_tags TEXT,
    reference_links TEXT,
    notes TEXT,
    owner TEXT,
    last_updated DATE,
    version TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOP Library (global reference data)
CREATE TABLE sop_library (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sop_id TEXT UNIQUE NOT NULL, -- SOP_C001, etc.
    title TEXT NOT NULL,
    system_family TEXT,
    vendor_flavor TEXT,
    phase TEXT,
    service_tiers TEXT[], -- ['CORE', 'ASSURE', 'GUARDIAN']
    estimated_duration_min INTEGER,
    audience_level INTEGER,
    prerequisites TEXT,
    safety TEXT,
    goal TEXT,
    ui_navigation TEXT,
    step_list_core TEXT,
    step_list_assure TEXT,
    step_list_guardian TEXT,
    verification_steps TEXT,
    rollback_steps TEXT,
    best_practices TEXT,
    tools TEXT,
    hyperlinks TEXT,
    owner TEXT,
    last_updated DATE,
    version TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project task instances (user's specific task executions)
CREATE TABLE project_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES pm_projects(id) ON DELETE CASCADE,
    task_library_id UUID REFERENCES task_library(id),
    task_name TEXT NOT NULL,
    phase_number INTEGER CHECK (phase_number BETWEEN 1 AND 4),
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')) DEFAULT 'pending',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    duration_minutes INTEGER,
    notes TEXT,
    artifacts JSONB DEFAULT '{}', -- Photos, files, etc.
    verification_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- FILE MANAGEMENT & PHOTOS
-- ===================================================================

-- Project files and photos
CREATE TABLE project_files (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES pm_projects(id) ON DELETE CASCADE,
    task_id UUID REFERENCES project_tasks(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    file_path TEXT,
    file_type TEXT, -- photo, document, export, etc.
    mime_type TEXT,
    file_size INTEGER,
    description TEXT,
    phase_number INTEGER,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===================================================================
-- SYSTEM REPORTS & EXPORTS
-- ===================================================================

-- Tridium system exports
CREATE TABLE system_exports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID REFERENCES pm_projects(id) ON DELETE CASCADE,
    export_type TEXT CHECK (export_type IN ('device_inventory', 'resource_utilization', 'system_baseline')),
    export_data JSONB NOT NULL,
    file_path TEXT,
    exported_at TIMESTAMPTZ DEFAULT NOW(),
    exported_by UUID REFERENCES auth.users(id)
);

-- ===================================================================
-- ACCESS CONTROL & PERMISSIONS
-- ===================================================================

-- RLS Policies for user-based access
ALTER TABLE pm_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_exports ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY user_projects_policy ON pm_projects
    FOR ALL USING (
        created_by = auth.uid()
        OR
        -- Hardcoded admin/tech access (replace with actual UUIDs)
        auth.uid() IN (
            SELECT id FROM auth.users WHERE email IN (
                'admin@ame-inc.com',
                'tech@ame-inc.com'
            )
        )
    );

-- Cascade policies for related tables
CREATE POLICY user_project_phases_policy ON project_phases
    FOR ALL USING (
        project_id IN (
            SELECT id FROM pm_projects WHERE
            created_by = auth.uid()
            OR auth.uid() IN (
                SELECT id FROM auth.users WHERE email IN (
                    'admin@ame-inc.com',
                    'tech@ame-inc.com'
                )
            )
        )
    );

CREATE POLICY user_project_tasks_policy ON project_tasks
    FOR ALL USING (
        project_id IN (
            SELECT id FROM pm_projects WHERE
            created_by = auth.uid()
            OR auth.uid() IN (
                SELECT id FROM auth.users WHERE email IN (
                    'admin@ame-inc.com',
                    'tech@ame-inc.com'
                )
            )
        )
    );

CREATE POLICY user_project_files_policy ON project_files
    FOR ALL USING (
        project_id IN (
            SELECT id FROM pm_projects WHERE
            created_by = auth.uid()
            OR auth.uid() IN (
                SELECT id FROM auth.users WHERE email IN (
                    'admin@ame-inc.com',
                    'tech@ame-inc.com'
                )
            )
        )
    );

CREATE POLICY user_system_exports_policy ON system_exports
    FOR ALL USING (
        project_id IN (
            SELECT id FROM pm_projects WHERE
            created_by = auth.uid()
            OR auth.uid() IN (
                SELECT id FROM auth.users WHERE email IN (
                    'admin@ame-inc.com',
                    'tech@ame-inc.com'
                )
            )
        )
    );

-- ===================================================================
-- INDEXES FOR PERFORMANCE
-- ===================================================================

-- User profile indexes
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_active ON user_profiles(is_active);

-- Employee indexes
CREATE INDEX idx_employees_technician ON employees(is_technician);
CREATE INDEX idx_employees_active ON employees(is_active);
CREATE INDEX idx_employees_email ON employees(email);

-- SimPro customer indexes
CREATE INDEX idx_simpro_customers_id ON simpro_customers(simpro_customer_id);
CREATE INDEX idx_simpro_customers_name ON simpro_customers(company_name);
CREATE INDEX idx_simpro_customers_service_tier ON simpro_customers(service_tier);
CREATE INDEX idx_simpro_customers_search ON simpro_customers USING GIN(search_vector);

-- Project indexes
CREATE INDEX idx_pm_projects_owner ON pm_projects(created_by);
CREATE INDEX idx_pm_projects_status ON pm_projects(status);
CREATE INDEX idx_pm_projects_customer ON pm_projects(customer_id);
CREATE INDEX idx_pm_projects_created_at ON pm_projects(created_at DESC);

-- Task library indexes
CREATE INDEX idx_task_library_id ON task_library(task_id);
CREATE INDEX idx_task_library_family ON task_library(system_family);
CREATE INDEX idx_task_library_phase ON task_library(phase);
CREATE INDEX idx_task_library_active ON task_library(is_active);

-- SOP library indexes
CREATE INDEX idx_sop_library_id ON sop_library(sop_id);
CREATE INDEX idx_sop_library_family ON sop_library(system_family);
CREATE INDEX idx_sop_library_active ON sop_library(is_active);

-- ===================================================================
-- TRIGGERS FOR AUTO-UPDATES
-- ===================================================================

-- Updated at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables with updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_simpro_customers_updated_at BEFORE UPDATE ON simpro_customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pm_projects_updated_at BEFORE UPDATE ON pm_projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_phases_updated_at BEFORE UPDATE ON project_phases FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_task_library_updated_at BEFORE UPDATE ON task_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sop_library_updated_at BEFORE UPDATE ON sop_library FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_tasks_updated_at BEFORE UPDATE ON project_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Search vector trigger for SimPro customers
CREATE OR REPLACE FUNCTION update_simpro_customer_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english',
        COALESCE(NEW.company_name, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.mailing_address, '') || ' ' ||
        COALESCE(NEW.mailing_city, '') || ' ' ||
        COALESCE(NEW.mailing_state, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_simpro_customer_search_vector_trigger
    BEFORE INSERT OR UPDATE ON simpro_customers
    FOR EACH ROW EXECUTE FUNCTION update_simpro_customer_search_vector();

-- ===================================================================
-- HELPER FUNCTIONS
-- ===================================================================

-- Search SimPro customers
CREATE OR REPLACE FUNCTION search_simpro_customers(
    search_query TEXT,
    service_tier_filter TEXT DEFAULT NULL,
    has_contracts_filter BOOLEAN DEFAULT NULL,
    max_results INTEGER DEFAULT 50
)
RETURNS TABLE(
    id UUID,
    simpro_customer_id TEXT,
    company_name TEXT,
    email TEXT,
    mailing_address TEXT,
    mailing_city TEXT,
    mailing_state TEXT,
    service_tier TEXT,
    has_active_contracts BOOLEAN,
    total_contract_value NUMERIC,
    active_contract_count INTEGER,
    relevance_score REAL
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        sc.id,
        sc.simpro_customer_id,
        sc.company_name,
        sc.email,
        sc.mailing_address,
        sc.mailing_city,
        sc.mailing_state,
        sc.service_tier,
        sc.has_active_contracts,
        sc.total_contract_value,
        sc.active_contract_count,
        CASE WHEN search_query IS NOT NULL AND search_query != '' THEN
            ts_rank(sc.search_vector, plainto_tsquery('english', search_query))
        ELSE 0.0 END AS relevance_score
    FROM simpro_customers sc
    WHERE
        (search_query IS NULL OR search_query = '' OR sc.search_vector @@ plainto_tsquery('english', search_query))
        AND (service_tier_filter IS NULL OR sc.service_tier = service_tier_filter)
        AND (has_contracts_filter IS NULL OR sc.has_active_contracts = has_contracts_filter)
    ORDER BY
        CASE WHEN search_query IS NOT NULL AND search_query != '' THEN relevance_score END DESC,
        sc.total_contract_value DESC,
        sc.company_name ASC
    LIMIT max_results;
END;
$$;