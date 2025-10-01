-- Fix all missing RPC functions, tables, and lookups for customer creation

-- Create ame_technicians table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ame_technicians (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    mobile_phone VARCHAR(50),
    email VARCHAR(255),
    extension VARCHAR(20),
    direct_line VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ame_employees table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ame_employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_name VARCHAR(255) NOT NULL,
    mobile_phone VARCHAR(50),
    email VARCHAR(255),
    extension VARCHAR(20),
    direct_line VARCHAR(50),
    role VARCHAR(100),
    is_technician BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on the tables
ALTER TABLE public.ame_technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ame_employees ENABLE ROW LEVEL SECURITY;

-- Create policies for reading the tables
CREATE POLICY "Allow authenticated users to read ame_technicians"
    ON public.ame_technicians FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated users to read ame_employees"
    ON public.ame_employees FOR SELECT
    TO authenticated
    USING (true);

-- Insert sample technicians data
INSERT INTO public.ame_technicians (employee_name, mobile_phone, email, extension, direct_line, is_active)
VALUES 
    ('John Smith', '555-0101', 'john.smith@ame-inc.com', '101', '555-1001', true),
    ('Jane Doe', '555-0102', 'jane.doe@ame-inc.com', '102', '555-1002', true),
    ('Bob Johnson', '555-0103', 'bob.johnson@ame-inc.com', '103', '555-1003', true),
    ('Alice Williams', '555-0104', 'alice.williams@ame-inc.com', '104', '555-1004', true),
    ('Charlie Brown', '555-0105', 'charlie.brown@ame-inc.com', '105', '555-1005', true)
ON CONFLICT (id) DO NOTHING;

-- Insert sample employees data including account managers
INSERT INTO public.ame_employees (employee_name, mobile_phone, email, extension, direct_line, role, is_technician, is_active)
VALUES 
    ('Sarah Manager', '555-0201', 'sarah.manager@ame-inc.com', '201', '555-2001', 'Account Manager', false, true),
    ('Tom Sales', '555-0202', 'tom.sales@ame-inc.com', '202', '555-2002', 'Sales Manager', false, true),
    ('Emily Account', '555-0203', 'emily.account@ame-inc.com', '203', '555-2003', 'Account Manager', false, true),
    ('John Smith', '555-0101', 'john.smith@ame-inc.com', '101', '555-1001', 'Technician', true, true),
    ('Jane Doe', '555-0102', 'jane.doe@ame-inc.com', '102', '555-1002', 'Technician', true, true)
ON CONFLICT (id) DO NOTHING;

-- Create function to search SimPro customers by name
CREATE OR REPLACE FUNCTION public.search_simpro_customers_by_name(search_name text)
RETURNS TABLE(
    id text,
    company_name text,
    mailing_address text,
    mailing_city text,
    mailing_state text,
    mailing_zip text,
    email text,
    service_tier text,
    similarity_score float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.simpro_customer_id::text as id,
        sc.company_name::text,
        COALESCE(sc.mailing_address, '')::text,
        COALESCE(sc.mailing_city, '')::text,
        COALESCE(sc.mailing_state, '')::text,
        COALESCE(sc.mailing_zip, '')::text,
        COALESCE(sc.email, '')::text,
        COALESCE(sc.service_tier, 'CORE')::text,
        similarity(sc.company_name, search_name) as similarity_score
    FROM public.simpro_customers sc
    WHERE sc.company_name IS NOT NULL
        AND (
            sc.company_name ILIKE '%' || search_name || '%'
            OR similarity(sc.company_name, search_name) > 0.2
        )
    ORDER BY similarity_score DESC, sc.company_name
    LIMIT 10;
END;
$$;

-- Create function to search SimPro customers across multiple fields
CREATE OR REPLACE FUNCTION public.search_simpro_customers_multi(search_text text)
RETURNS TABLE(
    id text,
    company_name text,
    mailing_address text,
    mailing_city text,
    mailing_state text,
    mailing_zip text,
    email text,
    service_tier text,
    similarity_score float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        sc.simpro_customer_id::text as id,
        sc.company_name::text,
        COALESCE(sc.mailing_address, '')::text,
        COALESCE(sc.mailing_city, '')::text,
        COALESCE(sc.mailing_state, '')::text,
        COALESCE(sc.mailing_zip, '')::text,
        COALESCE(sc.email, '')::text,
        COALESCE(sc.service_tier, 'CORE')::text,
        GREATEST(
            similarity(COALESCE(sc.company_name, ''), search_text),
            similarity(COALESCE(sc.mailing_address, ''), search_text),
            similarity(COALESCE(sc.mailing_city, ''), search_text)
        ) as similarity_score
    FROM public.simpro_customers sc
    WHERE sc.company_name IS NOT NULL
        AND (
            sc.company_name ILIKE '%' || search_text || '%'
            OR sc.mailing_address ILIKE '%' || search_text || '%'
            OR sc.mailing_city ILIKE '%' || search_text || '%'
            OR sc.email ILIKE '%' || search_text || '%'
        )
    ORDER BY similarity_score DESC, sc.company_name
    LIMIT 10;
END;
$$;

-- Create function to get SimPro customer autofill data
CREATE OR REPLACE FUNCTION public.get_simpro_customer_autofill(customer_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result jsonb;
    customer_data record;
    contract_stats record;
BEGIN
    -- Get customer data
    SELECT * INTO customer_data
    FROM public.simpro_customers
    WHERE simpro_customer_id::text = customer_id
    LIMIT 1;
    
    IF customer_data IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Get contract statistics
    SELECT 
        COUNT(*) as total_contracts,
        COUNT(*) FILTER (WHERE contract_status = 'Active') as active_contracts,
        SUM(contract_value) as total_value
    INTO contract_stats
    FROM public.simpro_customer_contracts
    WHERE customer_id = customer_data.simpro_customer_id;
    
    -- Build result JSON
    result := jsonb_build_object(
        'company_name', COALESCE(customer_data.company_name, ''),
        'email', COALESCE(customer_data.email, ''),
        'mailing_address', COALESCE(customer_data.mailing_address, ''),
        'mailing_city', COALESCE(customer_data.mailing_city, ''),
        'mailing_state', COALESCE(customer_data.mailing_state, ''),
        'mailing_zip', COALESCE(customer_data.mailing_zip, ''),
        'service_tier', COALESCE(customer_data.service_tier, 'CORE'),
        'labor_tax_code', customer_data.labor_tax_code,
        'part_tax_code', customer_data.part_tax_code,
        'is_contract_customer', COALESCE(contract_stats.total_contracts, 0) > 0,
        'has_active_contracts', COALESCE(contract_stats.active_contracts, 0) > 0,
        'total_contract_value', COALESCE(contract_stats.total_value, 0),
        'active_contract_count', COALESCE(contract_stats.active_contracts, 0),
        'latest_contract_email', COALESCE(customer_data.email, '')
    );
    
    RETURN result;
END;
$$;

-- Create function to search simpro customers (generic fallback)
CREATE OR REPLACE FUNCTION public.search_simpro_customers(search_text text)
RETURNS TABLE(
    id text,
    company_name text,
    mailing_address text,
    mailing_city text,
    mailing_state text,
    mailing_zip text,
    email text,
    service_tier text,
    similarity_score float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delegate to the multi-search function
    RETURN QUERY
    SELECT * FROM public.search_simpro_customers_multi(search_text);
END;
$$;

-- Create function to generate visit ID
CREATE OR REPLACE FUNCTION public.generate_visit_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id text;
    prefix text := 'VIS';
    current_date_str text;
    sequence_num integer;
BEGIN
    -- Get current date in YYYYMMDD format
    current_date_str := to_char(CURRENT_DATE, 'YYYYMMDD');
    
    -- Get the next sequence number for today
    SELECT COALESCE(MAX(
        CASE 
            WHEN visit_id LIKE prefix || '-' || current_date_str || '-%' THEN
                CAST(SPLIT_PART(visit_id, '-', 3) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 INTO sequence_num
    FROM public.ame_visits
    WHERE visit_id LIKE prefix || '-' || current_date_str || '-%';
    
    -- Format the ID
    new_id := prefix || '-' || current_date_str || '-' || LPAD(sequence_num::text, 4, '0');
    
    RETURN new_id;
END;
$$;

-- Create function to generate customer ID
CREATE OR REPLACE FUNCTION public.generate_customer_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id text;
    prefix text := 'AME';
    sequence_num integer;
BEGIN
    -- Get the next sequence number
    SELECT COALESCE(MAX(
        CASE 
            WHEN customer_id LIKE prefix || '-%' AND LENGTH(SPLIT_PART(customer_id, '-', 2)) <= 6 THEN
                CAST(SPLIT_PART(customer_id, '-', 2) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1 INTO sequence_num
    FROM public.ame_customers
    WHERE customer_id LIKE prefix || '-%';
    
    -- Format the ID
    new_id := prefix || '-' || LPAD(sequence_num::text, 6, '0');
    
    RETURN new_id;
END;
$$;

-- Grant execute permissions on all functions
GRANT EXECUTE ON FUNCTION public.search_simpro_customers_by_name(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_simpro_customers_multi(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_simpro_customer_autofill(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_simpro_customers(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_visit_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_customer_id() TO authenticated;

-- Add trigger to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ame_technicians_updated_at BEFORE UPDATE ON public.ame_technicians
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ame_employees_updated_at BEFORE UPDATE ON public.ame_employees
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
