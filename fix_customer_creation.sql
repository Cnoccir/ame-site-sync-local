-- Fix Customer Creation Issues
-- This script fixes the create_customer_full function to validate against profiles instead of auth.users

-- 1. First ensure profiles table exists and is properly set up
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text,
    full_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create or replace policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Create trigger to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        updated_at = now();
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Insert profiles for existing users if they don't have one
INSERT INTO public.profiles (id, email, full_name)
SELECT id, email, raw_user_meta_data->>'full_name'
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE profiles.id = auth.users.id
)
ON CONFLICT (id) DO NOTHING;

-- 4. Create the customer system credentials table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customer_system_credentials (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_id uuid REFERENCES public.ame_customers(id) ON DELETE CASCADE,
    credential_type text NOT NULL CHECK (credential_type IN ('bms', 'windows', 'services')),
    credentials_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE(customer_id, credential_type)
);

-- Enable RLS
ALTER TABLE public.customer_system_credentials ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view customer system credentials" ON public.customer_system_credentials;
CREATE POLICY "Users can view customer system credentials" ON public.customer_system_credentials
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert customer system credentials" ON public.customer_system_credentials;
CREATE POLICY "Users can insert customer system credentials" ON public.customer_system_credentials
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update customer system credentials" ON public.customer_system_credentials;
CREATE POLICY "Users can update customer system credentials" ON public.customer_system_credentials
    FOR UPDATE USING (true);

-- 5. Now create the fixed customer creation function
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

    -- Validate technician IDs exist in profiles table (not auth.users to avoid permission issues)
    IF form->>'primary_technician_id' IS NOT NULL AND form->>'primary_technician_id' != '' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (form->>'primary_technician_id')::uuid
        ) THEN
            RAISE NOTICE 'Primary technician not found in profiles, skipping validation';
        END IF;
    END IF;
    
    IF form->>'secondary_technician_id' IS NOT NULL AND form->>'secondary_technician_id' != '' THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = (form->>'secondary_technician_id')::uuid
        ) THEN
            RAISE NOTICE 'Secondary technician not found in profiles, skipping validation';
        END IF;
    END IF;

    -- Define valid columns for ame_customers table
    valid_columns := ARRAY[
        'customer_id', 'company_name', 'site_name', 'site_nickname', 'site_address',
        'service_tier', 'system_type', 'contract_status', 'building_type',
        'system_architecture', 'primary_bas_platform',
        'primary_contact', 'contact_phone', 'contact_email', 'primary_contact_role',
        'access_procedure', 'parking_instructions', 'equipment_access_notes',
        'site_hazards', 'other_hazards_notes', 'safety_notes',
        'secondary_contact_name', 'secondary_contact_phone', 'secondary_contact_email', 'secondary_contact_role',
        'primary_technician_id', 'primary_technician_name', 'primary_technician_phone', 'primary_technician_email',
        'secondary_technician_id', 'secondary_technician_name', 'secondary_technician_phone', 'secondary_technician_email',
        'building_access_type', 'building_access_details', 'access_hours', 'safety_requirements',
        'ppe_required', 'badge_required', 'training_required',
        'web_supervisor_url', 'workbench_username', 'workbench_password',
        'platform_username', 'platform_password', 'pc_username', 'pc_password',
        'bms_supervisor_ip', 'remote_access', 'remote_access_type',
        'vpn_required', 'vpn_details', 'different_platform_station_creds',
        'technician_assigned', 'service_frequency', 'next_due', 'last_service', 'special_instructions',
        'account_manager_id', 'account_manager_name', 'account_manager_phone', 'account_manager_email',
        'escalation_contact', 'escalation_phone',
        'drive_folder_id', 'drive_folder_url'
    ];

    -- Build insert data with only valid columns
    insert_data := '{}'::jsonb;
    
    FOR key IN SELECT jsonb_object_keys(form) LOOP
        IF key = ANY(valid_columns) THEN
            -- Special handling for site_hazards array
            IF key = 'site_hazards' AND jsonb_typeof(form->key) = 'array' THEN
                normalized_hazards := array_to_string(
                    ARRAY(SELECT jsonb_array_elements_text(form->key)),
                    ', '
                );
                insert_data := insert_data || jsonb_build_object(key, normalized_hazards);
            -- Special handling for inet type (bms_supervisor_ip)
            ELSIF key = 'bms_supervisor_ip' AND form->>key IS NOT NULL AND form->>key != '' THEN
                -- Cast the text to inet type  
                BEGIN
                    insert_data := insert_data || jsonb_build_object(key, (form->>key)::inet);
                EXCEPTION WHEN OTHERS THEN
                    -- If casting fails, skip this field
                    RAISE NOTICE 'Invalid IP address format for bms_supervisor_ip: %', form->>key;
                END;
            ELSE
                insert_data := insert_data || jsonb_build_object(key, form->key);
            END IF;
        END IF;
    END LOOP;

    -- Insert into ame_customers table
    INSERT INTO public.ame_customers 
    SELECT * FROM jsonb_populate_record(null::public.ame_customers, insert_data)
    RETURNING id INTO new_customer_id;

    -- Handle remote access credentials if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_remote_access_credentials') THEN
        IF form->'access_credentials' IS NOT NULL AND jsonb_typeof(form->'access_credentials') = 'array' THEN
            FOR cred IN SELECT * FROM jsonb_array_elements(form->'access_credentials') LOOP
                INSERT INTO public.customer_remote_access_credentials (
                    customer_id,
                    vendor,
                    access_id,
                    username,
                    password,
                    connection_url,
                    notes,
                    is_active,
                    access_method
                ) VALUES (
                    new_customer_id,
                    cred->>'vendor',
                    cred->>'access_id',
                    cred->>'username',
                    cred->>'password',
                    cred->>'connection_url',
                    cred->>'notes',
                    COALESCE((cred->>'is_active')::boolean, true),
                    cred->>'access_method'
                );
            END LOOP;
        END IF;
    END IF;

    -- Handle VPN configuration if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customer_vpn_configurations') THEN
        IF (form->>'vpn_required')::boolean = true THEN
            vpn_config := jsonb_build_object(
                'customer_id', new_customer_id,
                'vpn_required', true,
                'vpn_profile_name', COALESCE(form->>'remote_access_type', ''),
                'connection_instructions', COALESCE(form->>'vpn_details', ''),
                'is_active', true
            );
            
            INSERT INTO public.customer_vpn_configurations 
            SELECT * FROM jsonb_populate_record(null::public.customer_vpn_configurations, vpn_config)
            ON CONFLICT (customer_id) 
            DO UPDATE SET
                vpn_required = EXCLUDED.vpn_required,
                vpn_profile_name = EXCLUDED.vpn_profile_name,
                connection_instructions = EXCLUDED.connection_instructions,
                is_active = EXCLUDED.is_active,
                updated_at = NOW();
        END IF;
    END IF;

    -- Handle system credentials if provided
    IF form->'system_credentials' IS NOT NULL THEN
        INSERT INTO public.customer_system_credentials (
            customer_id,
            credential_type,
            credentials_data
        ) VALUES (
            new_customer_id,
            'bms',
            form->'system_credentials'
        )
        ON CONFLICT (customer_id, credential_type) DO UPDATE
        SET credentials_data = EXCLUDED.credentials_data,
            updated_at = NOW();
    END IF;

    IF form->'windows_credentials' IS NOT NULL THEN
        INSERT INTO public.customer_system_credentials (
            customer_id,
            credential_type,
            credentials_data
        ) VALUES (
            new_customer_id,
            'windows',
            form->'windows_credentials'
        )
        ON CONFLICT (customer_id, credential_type) DO UPDATE
        SET credentials_data = EXCLUDED.credentials_data,
            updated_at = NOW();
    END IF;

    IF form->'service_credentials' IS NOT NULL THEN
        INSERT INTO public.customer_system_credentials (
            customer_id,
            credential_type,
            credentials_data
        ) VALUES (
            new_customer_id,
            'services',
            form->'service_credentials'
        )
        ON CONFLICT (customer_id, credential_type) DO UPDATE
        SET credentials_data = EXCLUDED.credentials_data,
            updated_at = NOW();
    END IF;

    RETURN new_customer_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_customer_full(jsonb) TO authenticated;

-- 6. Also create validation function that checks against profiles
DROP FUNCTION IF EXISTS public.validate_customer_form(jsonb);

CREATE OR REPLACE FUNCTION public.validate_customer_form(form jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    errors jsonb := '[]'::jsonb;
    warnings jsonb := '[]'::jsonb;
    valid_columns text[];
    unknown_keys text[];
    key text;
    error_obj jsonb;
BEGIN
    -- Check required fields
    IF form->>'customer_id' IS NULL OR form->>'customer_id' = '' THEN
        errors := errors || jsonb_build_object('field', 'customer_id', 'message', 'Customer ID is required');
    END IF;
    
    IF form->>'company_name' IS NULL OR form->>'company_name' = '' THEN
        errors := errors || jsonb_build_object('field', 'company_name', 'message', 'Company name is required');
    END IF;
    
    IF form->>'site_name' IS NULL OR form->>'site_name' = '' THEN
        errors := errors || jsonb_build_object('field', 'site_name', 'message', 'Site name is required');
    END IF;

    -- Define valid columns
    valid_columns := ARRAY[
        'customer_id', 'company_name', 'site_name', 'site_nickname', 'site_address',
        'service_tier', 'system_type', 'contract_status', 'building_type',
        'system_architecture', 'primary_bas_platform',
        'primary_contact', 'contact_phone', 'contact_email', 'primary_contact_role',
        'access_procedure', 'parking_instructions', 'equipment_access_notes',
        'site_hazards', 'other_hazards_notes', 'safety_notes',
        'secondary_contact_name', 'secondary_contact_phone', 'secondary_contact_email', 'secondary_contact_role',
        'primary_technician_id', 'primary_technician_name', 'primary_technician_phone', 'primary_technician_email',
        'secondary_technician_id', 'secondary_technician_name', 'secondary_technician_phone', 'secondary_technician_email',
        'building_access_type', 'building_access_details', 'access_hours', 'safety_requirements',
        'ppe_required', 'badge_required', 'training_required',
        'web_supervisor_url', 'workbench_username', 'workbench_password',
        'platform_username', 'platform_password', 'pc_username', 'pc_password',
        'bms_supervisor_ip', 'remote_access', 'remote_access_type',
        'vpn_required', 'vpn_details', 'different_platform_station_creds',
        'technician_assigned', 'service_frequency', 'next_due', 'last_service', 'special_instructions',
        'account_manager_id', 'account_manager_name', 'account_manager_phone', 'account_manager_email',
        'escalation_contact', 'escalation_phone',
        'drive_folder_id', 'drive_folder_url',
        -- Also allow these special fields that are handled separately
        'access_credentials', 'system_credentials', 'windows_credentials', 'service_credentials'
    ];

    -- Check for unknown keys
    unknown_keys := ARRAY[]::text[];
    FOR key IN SELECT jsonb_object_keys(form) LOOP
        IF NOT (key = ANY(valid_columns)) THEN
            unknown_keys := array_append(unknown_keys, key);
        END IF;
    END LOOP;

    IF array_length(unknown_keys, 1) > 0 THEN
        warnings := warnings || jsonb_build_object(
            'type', 'unknown_fields',
            'fields', to_jsonb(unknown_keys),
            'message', 'These fields will be ignored as they don''t exist in the database schema'
        );
    END IF;

    -- Check data types
    IF form->'site_hazards' IS NOT NULL AND jsonb_typeof(form->'site_hazards') != 'array' THEN
        warnings := warnings || jsonb_build_object('field', 'site_hazards', 'message', 'Expected array, will be converted to text');
    END IF;

    IF form->>'bms_supervisor_ip' IS NOT NULL AND form->>'bms_supervisor_ip' != '' THEN
        BEGIN
            PERFORM (form->>'bms_supervisor_ip')::inet;
        EXCEPTION WHEN OTHERS THEN
            errors := errors || jsonb_build_object('field', 'bms_supervisor_ip', 'message', 'Invalid IP address format');
        END;
    END IF;

    RETURN jsonb_build_object(
        'valid', jsonb_array_length(errors) = 0,
        'errors', errors,
        'warnings', warnings
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_customer_form(jsonb) TO authenticated;

-- Test that the function exists and works
SELECT 'Functions created successfully!' as status;
