-- Migration: Ensure all customer form fields exist in ame_customers table
-- This migration adds any missing columns from the NewCustomerWizard form

-- Basic Information fields
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS customer_id VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS company_name VARCHAR(200) NOT NULL;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS site_name VARCHAR(200) NOT NULL;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS site_nickname VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS site_address TEXT NOT NULL;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS service_tier VARCHAR(20) DEFAULT 'CORE';
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS system_type VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS contract_status VARCHAR(20) DEFAULT 'Active';
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS building_type VARCHAR(100);

-- Enhanced Basic Information
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS system_architecture VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_bas_platform VARCHAR(100);

-- Contact Information
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_contact VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS contact_email VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_contact_role VARCHAR(100);

-- Site Access & Logistics
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS access_procedure VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS parking_instructions TEXT;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS equipment_access_notes TEXT;

-- Safety & PPE Requirements
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS site_hazards TEXT;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS other_hazards_notes TEXT;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS safety_notes TEXT;

-- Secondary Contact (Optional)
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_contact_name VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_contact_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_contact_email VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_contact_role VARCHAR(100);

-- Technician Assignment
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_technician_id UUID;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_technician_name VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_technician_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS primary_technician_email VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_id UUID;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_name VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS secondary_technician_email VARCHAR(200);

-- Access & Security
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS building_access_type VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS building_access_details TEXT;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS access_hours VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS safety_requirements TEXT;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS ppe_required BOOLEAN DEFAULT true;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS badge_required BOOLEAN DEFAULT false;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS training_required BOOLEAN DEFAULT false;

-- System Access - legacy fields for backward compatibility
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS web_supervisor_url VARCHAR(500);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS workbench_username VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS workbench_password VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS platform_username VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS platform_password VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS pc_username VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS pc_password VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS bms_supervisor_ip INET;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS remote_access BOOLEAN DEFAULT false;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS remote_access_type VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS vpn_required BOOLEAN DEFAULT false;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS vpn_details TEXT;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS different_platform_station_creds BOOLEAN DEFAULT false;

-- Service Information
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS technician_assigned VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS service_frequency VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS next_due DATE;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS last_service DATE;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS special_instructions TEXT;

-- Administrative
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS account_manager_id UUID;
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS account_manager_name VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS account_manager_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS account_manager_email VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS escalation_contact VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS escalation_phone VARCHAR(50);

-- Google Drive Integration
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS drive_folder_id VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS drive_folder_url VARCHAR(500);

-- Metadata fields
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Additional emergency contact fields
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS emergency_contact VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS emergency_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS emergency_email VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS security_contact VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS security_phone VARCHAR(50);

-- Technical contact fields
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS technical_contact VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS technical_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS technical_email VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS billing_contact VARCHAR(200);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS billing_phone VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN IF NOT EXISTS billing_email VARCHAR(200);

-- Add constraints for enum-like fields
ALTER TABLE public.ame_customers DROP CONSTRAINT IF EXISTS chk_service_tier;
ALTER TABLE public.ame_customers ADD CONSTRAINT chk_service_tier 
  CHECK (service_tier IN ('CORE', 'ASSURE', 'GUARDIAN'));

ALTER TABLE public.ame_customers DROP CONSTRAINT IF EXISTS chk_contract_status;
ALTER TABLE public.ame_customers ADD CONSTRAINT chk_contract_status 
  CHECK (contract_status IN ('Active', 'Inactive', 'Pending', 'Expired'));

-- Create indexes for commonly queried fields
CREATE INDEX IF NOT EXISTS idx_ame_customers_customer_id ON public.ame_customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_ame_customers_company_name ON public.ame_customers(company_name);
CREATE INDEX IF NOT EXISTS idx_ame_customers_site_nickname ON public.ame_customers(site_nickname);
CREATE INDEX IF NOT EXISTS idx_ame_customers_service_tier ON public.ame_customers(service_tier);
CREATE INDEX IF NOT EXISTS idx_ame_customers_contract_status ON public.ame_customers(contract_status);
CREATE INDEX IF NOT EXISTS idx_ame_customers_primary_technician_id ON public.ame_customers(primary_technician_id);
CREATE INDEX IF NOT EXISTS idx_ame_customers_secondary_technician_id ON public.ame_customers(secondary_technician_id);
CREATE INDEX IF NOT EXISTS idx_ame_customers_account_manager_id ON public.ame_customers(account_manager_id);

-- Add comments to document key fields
COMMENT ON COLUMN public.ame_customers.site_nickname IS 'Quick reference nickname for the site to help with searching';
COMMENT ON COLUMN public.ame_customers.primary_technician_id IS 'UUID reference to the primary assigned technician';
COMMENT ON COLUMN public.ame_customers.secondary_technician_id IS 'UUID reference to the secondary assigned technician';
COMMENT ON COLUMN public.ame_customers.bms_supervisor_ip IS 'IP address of the BMS supervisor/server';

-- Update the create_customer_full function to include site_nickname in valid columns
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

    -- Validate technician IDs exist in profiles table
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

    -- Define valid columns for ame_customers table (all the columns we just ensured exist)
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
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::inet);
            -- Special handling for date fields
            ELSIF key IN ('next_due', 'last_service') AND form->>key IS NOT NULL AND form->>key != '' THEN
                insert_data := insert_data || jsonb_build_object(key, (form->>key)::date);
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

    -- Handle system credentials if provided
    IF form->'system_credentials' IS NOT NULL OR form->'windows_credentials' IS NOT NULL OR form->'service_credentials' IS NOT NULL THEN
        -- Create table if it doesn't exist
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

        -- Create policies if they don't exist
        DO $$ BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view customer system credentials') THEN
                CREATE POLICY "Users can view customer system credentials" ON public.customer_system_credentials FOR SELECT USING (true);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert customer system credentials') THEN
                CREATE POLICY "Users can insert customer system credentials" ON public.customer_system_credentials FOR INSERT WITH CHECK (true);
            END IF;
            
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update customer system credentials') THEN
                CREATE POLICY "Users can update customer system credentials" ON public.customer_system_credentials FOR UPDATE USING (true);
            END IF;
        END $$;

        -- Insert credentials
        IF form->'system_credentials' IS NOT NULL THEN
            INSERT INTO public.customer_system_credentials (
                customer_id,
                credential_type,
                credentials_data
            ) VALUES (
                new_customer_id,
                'bms',
                form->'system_credentials'
            );
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
            );
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
            );
        END IF;
    END IF;

    RETURN new_customer_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_customer_full(jsonb) TO authenticated;
