-- Add missing columns to ame_customers table for proper form field mapping
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS site_nickname VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_contact_role VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS access_procedure VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS parking_instructions TEXT;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS equipment_access_notes TEXT;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS safety_notes TEXT;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS other_hazards_notes TEXT;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_contact_name VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_contact_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_contact_email VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_contact_role VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_technician_id UUID;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_technician_name VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_technician_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_technician_email VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_id UUID;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_name VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_email VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS account_manager_id UUID;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS account_manager_name VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS account_manager_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS account_manager_email VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_bas_platform VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS system_architecture VARCHAR(100);

-- Create indexes for searchable fields
CREATE INDEX IF NOT EXISTS idx_ame_customers_site_nickname ON public.ame_customers(site_nickname);
CREATE INDEX IF NOT EXISTS idx_ame_customers_primary_bas_platform ON public.ame_customers(primary_bas_platform);
CREATE INDEX IF NOT EXISTS idx_ame_customers_system_architecture ON public.ame_customers(system_architecture);

-- Update the create_customer_full function to handle all fields
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

    -- Define ALL columns in the customers table
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
        'primary_technician_id', 'primary_technician_name', 'primary_technician_phone', 'primary_technician_email',
        'secondary_technician_id', 'secondary_technician_name', 'secondary_technician_phone', 'secondary_technician_email',
        'technician_assigned',
        'web_supervisor_url', 'workbench_username', 'workbench_password',
        'platform_username', 'platform_password', 'bms_supervisor_ip', 
        'remote_access', 'remote_access_type', 'vpn_required', 'vpn_details',
        'service_frequency', 'next_due', 'last_service', 'special_instructions',
        'account_manager', 'account_manager_id', 'account_manager_name', 'account_manager_phone', 'account_manager_email',
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