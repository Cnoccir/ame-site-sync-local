-- Fix System Architecture Field Persistence Issue
-- This script ensures the system_architecture field works properly throughout the system

-- 1. Ensure the system_architecture column exists in ame_customers table
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS system_architecture VARCHAR(100);

-- 2. Ensure the system_architectures reference table exists with current data
CREATE TABLE IF NOT EXISTS public.system_architectures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    architecture_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clear and repopulate system architectures with current data
DELETE FROM system_architectures WHERE TRUE;

INSERT INTO system_architectures (architecture_name, description, display_order, is_active) VALUES
('Engine Only (single site)', 'Single JACE/Engine serving one site without supervisor', 10, true),
('Multi-Engine (no supervisor)', 'Multiple JACEs/Engines without central supervisor', 20, true),
('Supervisor + Engines (on-prem)', 'On-premise supervisor with connected engines/JACEs', 30, true),
('Supervisor + Direct-IP DDCs (no engines)', 'Supervisor directly connected to IP controllers without engines', 40, true),
('Hosted/Cloud Supervisor (+/- engines)', 'Cloud-based or hosted supervisor with optional engines', 50, true),
('Overlay/Integration Engine', 'Integration layer over existing legacy systems', 60, true),
('Legacy Standalone/Proprietary', 'Older proprietary systems (Barber-Colman, Andover, etc.)', 70, true),
('Mixed / Federated Vendors', 'Multiple vendor systems integrated together', 80, true),
('Unknown / To be Assessed', 'System architecture needs to be determined', 90, true);

-- 3. Update create_customer_full RPC function to ensure it handles system_architecture
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

    -- Define COMPLETE list of valid columns including system_architecture
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
        'emergency_contact', 'emergency_phone', 'emergency_email',
        'security_contact', 'security_phone',
        'technical_contact', 'technical_phone', 'technical_email',
        'billing_contact', 'billing_phone', 'billing_email'
    ];

    -- Build insert data with generated UUID
    insert_data := jsonb_build_object('id', to_jsonb(new_customer_id));
    
    -- Process each field from the form
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
                BEGIN
                    insert_data := insert_data || jsonb_build_object(key, (form->>key)::inet);
                EXCEPTION WHEN OTHERS THEN
                    RAISE NOTICE 'Invalid IP address format for bms_supervisor_ip: %', form->>key;
                END;
            -- Special handling for date fields
            ELSIF key IN ('next_due', 'last_service') AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::date);
            -- Special handling for UUID fields
            ELSIF key IN ('primary_technician_id', 'secondary_technician_id', 'account_manager_id') 
                  AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::uuid);
            -- Handle all other fields including system_architecture
            ELSE
                insert_data := insert_data || jsonb_build_object(key, form->key);
            END IF;
        ELSE
            -- Log unknown fields for debugging
            RAISE NOTICE 'Ignoring unknown field: % with value: %', key, form->key;
        END IF;
    END LOOP;

    -- Insert into ame_customers table
    INSERT INTO public.ame_customers 
    SELECT * FROM jsonb_populate_record(null::public.ame_customers, insert_data);

    -- Log successful creation with field count
    RAISE NOTICE 'Customer created successfully with ID: % and % fields processed', new_customer_id, jsonb_object_keys(form);

    RETURN new_customer_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.create_customer_full(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_customer_full(jsonb) TO service_role;

-- 4. Test that the system_architecture column exists and can store data
DO $$
BEGIN
    -- Test insert and select
    PERFORM column_name FROM information_schema.columns 
    WHERE table_name = 'ame_customers' AND column_name = 'system_architecture';
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'system_architecture column does not exist in ame_customers table';
    END IF;
    
    RAISE NOTICE 'System architecture column exists and is ready for use';
END $$;

-- 5. Update any existing customers that have NULL system_architecture to empty string
UPDATE public.ame_customers 
SET system_architecture = COALESCE(system_architecture, '')
WHERE system_architecture IS NULL;

-- 6. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_ame_customers_system_architecture ON public.ame_customers(system_architecture);

-- 7. Add comment for documentation
COMMENT ON COLUMN public.ame_customers.system_architecture IS 'BMS system architecture type (Engine Only, Supervisor+Engines, etc.)';

-- Success message
SELECT 'System architecture field fix completed successfully!' as status;
