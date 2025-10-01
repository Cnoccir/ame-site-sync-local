-- Migration: Add missing contract fields and primary_contact_name; update RPC to persist them
-- Date: 2025-08-28

BEGIN;

-- 1) Add new columns to ame_customers
ALTER TABLE public.ame_customers
  ADD COLUMN IF NOT EXISTS primary_contact_name VARCHAR(200),
  ADD COLUMN IF NOT EXISTS contract_number VARCHAR(100),
  ADD COLUMN IF NOT EXISTS contract_value NUMERIC,
  ADD COLUMN IF NOT EXISTS contract_name VARCHAR(200);

-- 2) Update RPC to include new fields
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

    -- Define valid columns (superset of frontend fields)
    valid_columns := ARRAY[
        'customer_id','company_name','site_name','site_nickname','site_address',
        'service_tier','system_type','contract_status','building_type',
        'system_architecture','primary_bas_platform',
        'primary_contact','primary_contact_name','contact_phone','contact_email','primary_contact_role',
        'access_procedure','parking_instructions','equipment_access_notes',
        'site_hazards','other_hazards_notes','safety_notes',
        'secondary_contact_name','secondary_contact_phone','secondary_contact_email','secondary_contact_role',
        'primary_technician_id','primary_technician_name','primary_technician_phone','primary_technician_email',
        'secondary_technician_id','secondary_technician_name','secondary_technician_phone','secondary_technician_email',
        'building_access_type','building_access_details','access_hours','safety_requirements',
        'ppe_required','badge_required','training_required',
        'web_supervisor_url','workbench_username','workbench_password',
        'platform_username','platform_password','pc_username','pc_password',
        'bms_supervisor_ip','remote_access','remote_access_type','vpn_required','vpn_details','different_platform_station_creds',
        'access_credentials','system_credentials','windows_credentials','service_credentials',
        'technician_assigned','service_frequency','next_due','last_service','special_instructions',
        'account_manager_id','account_manager_name','account_manager_phone','account_manager_email',
        'escalation_contact','escalation_phone',
        'drive_folder_id','drive_folder_url',
        'emergency_contact','emergency_phone','emergency_email',
        'contract_start_date','contract_end_date',
        'contract_number','contract_value','contract_name'
    ];

    -- Build insert data with only valid columns and add the generated UUID
    insert_data := jsonb_build_object('id', to_jsonb(new_customer_id));

    FOR key IN SELECT jsonb_object_keys(form) LOOP
        IF key = ANY(valid_columns) THEN
            IF key = 'site_hazards' AND jsonb_typeof(form->key) = 'array' THEN
                normalized_hazards := array_to_string(
                    ARRAY(SELECT jsonb_array_elements_text(form->key)), ', '
                );
                insert_data := insert_data || jsonb_build_object(key, normalized_hazards);
            ELSIF key = 'bms_supervisor_ip' AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::inet);
            ELSIF key IN ('next_due','last_service','contract_start_date','contract_end_date') AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::date);
            ELSIF key IN ('primary_technician_id','secondary_technician_id','account_manager_id') AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::uuid);
            ELSIF key IN ('access_credentials','system_credentials','windows_credentials','service_credentials') AND form->key IS NOT NULL THEN
                insert_data := insert_data || jsonb_build_object(key, form->key);
            ELSIF key = 'contract_value' AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::numeric);
            ELSE
                insert_data := insert_data || jsonb_build_object(key, form->key);
            END IF;
        END IF;
    END LOOP;

    -- Insert into ame_customers
    INSERT INTO public.ame_customers 
    SELECT * FROM jsonb_populate_record(NULL::public.ame_customers, insert_data);

    RETURN new_customer_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_customer_full(jsonb) TO authenticated;

COMMIT;

