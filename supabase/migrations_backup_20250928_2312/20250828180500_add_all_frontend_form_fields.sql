-- Migration: Add ALL missing frontend form fields to ame_customers table
-- This ensures 100% alignment between frontend form and database schema

-- Enhanced Basic Information fields that are missing
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS site_nickname VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS system_architecture VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_bas_platform VARCHAR(100);

-- Primary Site Contact role field
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_contact_role VARCHAR(100);

-- Site Access & Logistics fields that are missing
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS access_procedure VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS parking_instructions TEXT;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS equipment_access_notes TEXT;

-- Safety & PPE Requirements fields that are missing
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS other_hazards_notes TEXT;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS safety_notes TEXT;

-- Secondary Contact fields (these will replace emergency_* fields eventually)
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_contact_name VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_contact_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_contact_email VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_contact_role VARCHAR(100);

-- Technician Assignment fields (complete set)
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_technician_id UUID;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_technician_name VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_technician_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_technician_email VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_id UUID;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_name VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_email VARCHAR(200);

-- System Access fields that might be missing (legacy compatibility)
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS pc_username VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS pc_password VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS different_platform_station_creds BOOLEAN DEFAULT false;

-- Enhanced credentials system fields
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS access_credentials JSONB;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS system_credentials JSONB;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS windows_credentials JSONB;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS service_credentials JSONB;

-- Administrative fields that are missing
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS account_manager_id UUID;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS account_manager_name VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS account_manager_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS account_manager_email VARCHAR(200);

-- Add foreign key constraints for technician and account manager IDs
-- (these will reference the profiles table if it exists)
DO $$
BEGIN
    -- Check if profiles table exists before adding foreign key constraints
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles' AND table_schema = 'public') THEN
        -- Add foreign key constraint for primary_technician_id if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_ame_customers_primary_technician' 
            AND table_name = 'ame_customers'
        ) THEN
            ALTER TABLE public.ame_customers 
            ADD CONSTRAINT fk_ame_customers_primary_technician 
            FOREIGN KEY (primary_technician_id) REFERENCES public.profiles(id);
        END IF;

        -- Add foreign key constraint for secondary_technician_id if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_ame_customers_secondary_technician' 
            AND table_name = 'ame_customers'
        ) THEN
            ALTER TABLE public.ame_customers 
            ADD CONSTRAINT fk_ame_customers_secondary_technician 
            FOREIGN KEY (secondary_technician_id) REFERENCES public.profiles(id);
        END IF;

        -- Add foreign key constraint for account_manager_id if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fk_ame_customers_account_manager' 
            AND table_name = 'ame_customers'
        ) THEN
            ALTER TABLE public.ame_customers 
            ADD CONSTRAINT fk_ame_customers_account_manager 
            FOREIGN KEY (account_manager_id) REFERENCES public.profiles(id);
        END IF;
    END IF;
END $$;

-- Create indexes for the new foreign key fields
CREATE INDEX IF NOT EXISTS idx_ame_customers_site_nickname ON public.ame_customers(site_nickname);
CREATE INDEX IF NOT EXISTS idx_ame_customers_primary_bas_platform ON public.ame_customers(primary_bas_platform);
CREATE INDEX IF NOT EXISTS idx_ame_customers_system_architecture ON public.ame_customers(system_architecture);
CREATE INDEX IF NOT EXISTS idx_ame_customers_primary_technician_id_new ON public.ame_customers(primary_technician_id);
CREATE INDEX IF NOT EXISTS idx_ame_customers_secondary_technician_id_new ON public.ame_customers(secondary_technician_id);
CREATE INDEX IF NOT EXISTS idx_ame_customers_account_manager_id_new ON public.ame_customers(account_manager_id);

-- Add comments to document the new fields
COMMENT ON COLUMN public.ame_customers.site_nickname IS 'Short nickname or alias for the site to help with searching and folder management';
COMMENT ON COLUMN public.ame_customers.system_architecture IS 'Server architecture type (e.g., Standalone, Distributed, etc.)';
COMMENT ON COLUMN public.ame_customers.primary_bas_platform IS 'Primary BAS platform (e.g., Tridium N4, JCI Metasys, etc.)';
COMMENT ON COLUMN public.ame_customers.access_procedure IS 'Detailed access procedure for technicians';
COMMENT ON COLUMN public.ame_customers.parking_instructions IS 'Parking and building access instructions';
COMMENT ON COLUMN public.ame_customers.equipment_access_notes IS 'Notes about accessing equipment on site';
COMMENT ON COLUMN public.ame_customers.other_hazards_notes IS 'Additional hazard notes not covered by standard categories';
COMMENT ON COLUMN public.ame_customers.safety_notes IS 'General safety notes and requirements';
COMMENT ON COLUMN public.ame_customers.primary_technician_id IS 'UUID of the primary assigned technician';
COMMENT ON COLUMN public.ame_customers.secondary_technician_id IS 'UUID of the secondary assigned technician';
COMMENT ON COLUMN public.ame_customers.account_manager_id IS 'UUID of the assigned account manager';
COMMENT ON COLUMN public.ame_customers.access_credentials IS 'JSON storage for remote access credentials';
COMMENT ON COLUMN public.ame_customers.system_credentials IS 'JSON storage for BMS system credentials';
COMMENT ON COLUMN public.ame_customers.windows_credentials IS 'JSON storage for Windows system credentials';
COMMENT ON COLUMN public.ame_customers.service_credentials IS 'JSON storage for service account credentials';

-- Update the RPC function to include ALL the new fields
DROP FUNCTION IF EXISTS public.create_customer_full(jsonb);

CREATE OR REPLACE FUNCTION public.create_customer_full(form jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    new_customer_id uuid;
    valid_columns text[];
    insert_data jsonb;
    key text;
    normalized_hazards text;
    vpn_config jsonb;
    remote_creds jsonb;
    cred jsonb;
BEGIN
    -- Generate UUID for the new customer
    new_customer_id := gen_random_uuid();
    
    -- Validate required fields
    IF form->>'customer_id' IS NULL OR form->>'customer_id' = '' THEN
        RAISE EXCEPTION 'Customer ID is required';
    END IF;
    
    IF form->>'company_name' IS NULL OR form->>'company_name' = '' THEN
        RAISE EXCEPTION 'Company name is required';
    END IF;
    
    IF form->>'site_name' IS NULL OR form->>'site_name' = '' THEN
        RAISE EXCEPTION 'Site name is required';
    END IF;

    -- Validate technician IDs exist in profiles table if provided
    IF form->>'primary_technician_id' IS NOT NULL AND form->>'primary_technician_id' != '' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (form->>'primary_technician_id')::uuid
        ) THEN
            RAISE EXCEPTION 'Selected primary technician is not a valid user' USING ERRCODE = '23503';
        END IF;
    END IF;
    
    IF form->>'secondary_technician_id' IS NOT NULL AND form->>'secondary_technician_id' != '' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (form->>'secondary_technician_id')::uuid
        ) THEN
            RAISE EXCEPTION 'Selected secondary technician is not a valid user' USING ERRCODE = '23503';
        END IF;
    END IF;

    IF form->>'account_manager_id' IS NOT NULL AND form->>'account_manager_id' != '' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (form->>'account_manager_id')::uuid
        ) THEN
            RAISE EXCEPTION 'Selected account manager is not a valid user' USING ERRCODE = '23503';
        END IF;
    END IF;

    -- Define ALL valid columns for ame_customers table (now complete with frontend fields)
    valid_columns := ARRAY[
        -- Core basic information
        'customer_id', 'company_name', 'site_name', 'site_nickname', 'site_address',
        'service_tier', 'system_type', 'contract_status', 'building_type',
        'system_architecture', 'primary_bas_platform',
        
        -- Primary contact information
        'primary_contact', 'contact_phone', 'contact_email', 'primary_contact_role',
        
        -- Site access & logistics
        'access_procedure', 'parking_instructions', 'equipment_access_notes',
        
        -- Safety & PPE requirements
        'site_hazards', 'other_hazards_notes', 'safety_notes',
        
        -- Secondary contact (replaces emergency_*)
        'secondary_contact_name', 'secondary_contact_phone', 'secondary_contact_email', 'secondary_contact_role',
        
        -- Technician assignment (complete set)
        'primary_technician_id', 'primary_technician_name', 'primary_technician_phone', 'primary_technician_email',
        'secondary_technician_id', 'secondary_technician_name', 'secondary_technician_phone', 'secondary_technician_email',
        
        -- Access & security
        'building_access_type', 'building_access_details', 'access_hours', 'safety_requirements',
        'ppe_required', 'badge_required', 'training_required',
        
        -- System access (complete set)
        'web_supervisor_url', 'workbench_username', 'workbench_password',
        'platform_username', 'platform_password', 'pc_username', 'pc_password',
        'bms_supervisor_ip', 'remote_access', 'remote_access_type',
        'vpn_required', 'vpn_details', 'different_platform_station_creds',
        
        -- Enhanced credentials (JSONB fields)
        'access_credentials', 'system_credentials', 'windows_credentials', 'service_credentials',
        
        -- Service information
        'technician_assigned', 'service_frequency', 'next_due', 'last_service', 'special_instructions',
        
        -- Administrative (complete set)
        'account_manager_id', 'account_manager_name', 'account_manager_phone', 'account_manager_email',
        'escalation_contact', 'escalation_phone',
        
        -- Google Drive integration
        'drive_folder_id', 'drive_folder_url',
        
        -- Legacy fields (maintain compatibility)
        'emergency_contact', 'emergency_phone', 'emergency_email',
        'security_contact', 'security_phone',
        'technical_contact', 'technical_phone', 'technical_email',
        'billing_contact', 'billing_phone', 'billing_email',
        'account_manager', 'region', 'district', 'territory',
        'contract_start_date', 'contract_end_date', 'payment_terms',
        'annual_contract_value', 'equipment_list', 'site_timezone', 'coordinates'
    ];

    -- Build insert data with only valid columns and add the generated UUID
    insert_data := jsonb_build_object('id', to_jsonb(new_customer_id));
    
    FOR key IN SELECT jsonb_object_keys(form) LOOP
        IF key = ANY(valid_columns) THEN
            -- Special handling for site_hazards array - convert to comma-separated string
            IF key = 'site_hazards' AND jsonb_typeof(form->key) = 'array' THEN
                normalized_hazards := array_to_string(
                    ARRAY(SELECT jsonb_array_elements_text(form->key)),
                    ', '
                );
                insert_data := insert_data || jsonb_build_object(key, normalized_hazards);
            -- Special handling for inet type (bms_supervisor_ip)
            ELSIF key = 'bms_supervisor_ip' AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::inet);
            -- Special handling for date fields
            ELSIF key IN ('next_due', 'last_service', 'contract_start_date', 'contract_end_date') 
                  AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::date);
            -- Special handling for UUID fields
            ELSIF key IN ('primary_technician_id', 'secondary_technician_id', 'account_manager_id') 
                  AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::uuid);
            -- Special handling for JSONB fields
            ELSIF key IN ('access_credentials', 'system_credentials', 'windows_credentials', 'service_credentials') 
                  AND form->key IS NOT NULL THEN
                insert_data := insert_data || jsonb_build_object(key, form->key);
            ELSE
                insert_data := insert_data || jsonb_build_object(key, form->key);
            END IF;
        END IF;
    END LOOP;

    -- Insert into ame_customers table with the generated UUID
    INSERT INTO public.ame_customers 
    SELECT * FROM jsonb_populate_record(null::public.ame_customers, insert_data);

    RETURN new_customer_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_customer_full(jsonb) TO authenticated;

-- Migration complete - all frontend form fields now exist in database
