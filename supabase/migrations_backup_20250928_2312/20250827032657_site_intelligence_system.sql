-- Site Intelligence System Migration
-- Adds fields for persistent site numbers, nicknames, technician tracking, and platform info

-- Add Site Intelligence fields to ame_customers table
ALTER TABLE public.ame_customers ADD COLUMN site_nickname VARCHAR(50);
ALTER TABLE public.ame_customers ADD COLUMN site_number VARCHAR(20) UNIQUE;
ALTER TABLE public.ame_customers ADD COLUMN primary_technician_id UUID REFERENCES auth.users(id);
ALTER TABLE public.ame_customers ADD COLUMN secondary_technician_id UUID REFERENCES auth.users(id);
ALTER TABLE public.ame_customers ADD COLUMN last_job_numbers TEXT[]; -- Track changing job numbers
ALTER TABLE public.ame_customers ADD COLUMN system_platform VARCHAR(50); -- N4, FX, WEBs, etc.
ALTER TABLE public.ame_customers ADD COLUMN service_frequency VARCHAR(50); -- Monthly, Quarterly, etc.
ALTER TABLE public.ame_customers ADD COLUMN special_instructions TEXT;

-- Add indexes for better performance
CREATE INDEX idx_ame_customers_site_number ON public.ame_customers(site_number);
CREATE INDEX idx_ame_customers_site_nickname ON public.ame_customers(site_nickname);
CREATE INDEX idx_ame_customers_primary_technician ON public.ame_customers(primary_technician_id);
CREATE INDEX idx_ame_customers_secondary_technician ON public.ame_customers(secondary_technician_id);
CREATE INDEX idx_ame_customers_system_platform ON public.ame_customers(system_platform);

-- Create function to generate unique site numbers
CREATE OR REPLACE FUNCTION generate_site_number() RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    counter INTEGER;
    new_site_number TEXT;
BEGIN
    year_part := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Get the highest counter for this year
    SELECT COALESCE(MAX(CAST(SUBSTRING(site_number FROM 'AME-' || year_part || '-(\d+)') AS INTEGER)), 0) + 1
    INTO counter
    FROM public.ame_customers
    WHERE site_number LIKE 'AME-' || year_part || '-%';
    
    -- Format with leading zeros
    new_site_number := 'AME-' || year_part || '-' || LPAD(counter::TEXT, 3, '0');
    
    RETURN new_site_number;
END;
$$ LANGUAGE plpgsql;

-- Function to get technician name by ID
CREATE OR REPLACE FUNCTION get_technician_name(technician_id UUID) RETURNS TEXT AS $$
DECLARE
    technician_name TEXT;
BEGIN
    SELECT COALESCE(profiles.full_name, auth.users.email)
    INTO technician_name
    FROM auth.users
    LEFT JOIN public.profiles ON auth.users.id = public.profiles.id
    WHERE auth.users.id = technician_id;
    
    RETURN technician_name;
END;
$$ LANGUAGE plpgsql;

-- Update existing customers with auto-generated site numbers if they don't have them
UPDATE public.ame_customers 
SET site_number = generate_site_number()
WHERE site_number IS NULL;

-- Add constraint to ensure site_number format
ALTER TABLE public.ame_customers ADD CONSTRAINT check_site_number_format 
  CHECK (site_number ~ '^AME-\d{4}-\d{3}$');

-- Create trigger to auto-generate site numbers for new customers
CREATE OR REPLACE FUNCTION trigger_generate_site_number() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.site_number IS NULL THEN
        NEW.site_number := generate_site_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_generate_site_number
    BEFORE INSERT ON public.ame_customers
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_site_number();

-- Update the updated_at trigger to include new fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ame_customers_updated_at
    BEFORE UPDATE ON public.ame_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
