-- Fix create_customer_full RPC function to include all missing fields
-- This addresses the disconnect between frontend form fields and backend storage

CREATE OR REPLACE FUNCTION create_customer_full(form jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_customer_id uuid;
    valid_columns text[];
    insert_data jsonb;
    key text;
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

    -- Define ALL columns in the ame_customers table (UPDATED WITH MISSING FIELDS)
    valid_columns := ARRAY[
        'customer_id', 'company_name', 'site_name', 'site_nickname', 'site_address',
        'service_tier', 'system_type', 'contract_status', 'building_type',
        'system_architecture', 'primary_bas_platform',
        'primary_contact', 'contact_phone', 'contact_email', 'primary_contact_role',
        'access_procedure', 'parking_instructions', 'equipment_access_notes',
        'building_access_type', 'building_access_details', 'access_hours', 
        'site_hazards', 'other_hazards_notes', 'safety_notes', 'safety_requirements',
        'ppe_required', 'badge_required', 'training_required',
        'secondary_contact_name', 'secondary_contact_phone', 'secondary_contact_email', 'secondary_contact_role',
        'emergency_contact', 'emergency_phone', 'emergency_email',
        'security_contact', 'security_phone',
        'primary_technician_id', 'primary_technician_name', 'primary_technician_phone', 'primary_technician_email',
        'secondary_technician_id', 'secondary_technician_name', 'secondary_technician_phone', 'secondary_technician_email',
        'technician_assigned',
        'web_supervisor_url', 'workbench_username', 'workbench_password',
        'platform_username', 'platform_password', 
        'pc_username', 'pc_password',
        'bms_supervisor_ip', 
        'remote_access', 'remote_access_type', 'vpn_required', 'vpn_details',
        'different_platform_station_creds',
        'service_frequency', 'next_due', 'last_service', 'special_instructions',
        'account_manager', 'account_manager_id', 'account_manager_name', 'account_manager_phone', 'account_manager_email',
        'escalation_contact', 'escalation_phone',
        'drive_folder_id', 'drive_folder_url'
    ];

    -- Build insert data with only valid columns and add the generated UUID
    insert_data := jsonb_build_object('id', to_jsonb(new_customer_id));
    
    FOR key IN SELECT jsonb_object_keys(form) LOOP
        IF key = ANY(valid_columns) THEN
            -- Special handling for inet type (bms_supervisor_ip)
            IF key = 'bms_supervisor_ip' AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::inet);
            -- Special handling for date fields
            ELSIF key IN ('next_due', 'last_service') AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::date);
            -- Special handling for UUID fields
            ELSIF key IN ('primary_technician_id', 'secondary_technician_id', 'account_manager_id') 
                  AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::uuid);
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

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION create_customer_full(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION create_customer_full(jsonb) TO service_role;

-- Comment the function
COMMENT ON FUNCTION create_customer_full(jsonb) IS 'Creates a new customer record with full field support including all form fields from NewCustomerWizard';
