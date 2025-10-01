-- Add default UUID generation to ame_customers.id column if not exists
ALTER TABLE public.ame_customers 
ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Also update the RPC function to explicitly generate UUID if needed
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

    -- Validate technician IDs exist in profiles table (not auth.users to avoid permission issues)
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

    -- Define valid columns for ame_customers table (excluding 'id' since we generate it)
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

    -- Build insert data with only valid columns and add the generated UUID
    insert_data := jsonb_build_object('id', to_jsonb(new_customer_id));
    
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
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::inet);
            ELSE
                insert_data := insert_data || jsonb_build_object(key, form->key);
            END IF;
        END IF;
    END LOOP;

    -- Insert into ame_customers table with the generated UUID
    INSERT INTO public.ame_customers 
    SELECT * FROM jsonb_populate_record(null::public.ame_customers, insert_data);

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

    RETURN new_customer_id;
END;
$$;
