-- Ensure all tables exist with proper structure for CSV data import

-- Update ame_customers table to match real customer data requirements
ALTER TABLE public.ame_customers 
ADD COLUMN IF NOT EXISTS region text,
ADD COLUMN IF NOT EXISTS district text,
ADD COLUMN IF NOT EXISTS territory text,
ADD COLUMN IF NOT EXISTS account_manager text,
ADD COLUMN IF NOT EXISTS technical_contact text,
ADD COLUMN IF NOT EXISTS technical_phone text,
ADD COLUMN IF NOT EXISTS technical_email text,
ADD COLUMN IF NOT EXISTS billing_contact text,
ADD COLUMN IF NOT EXISTS billing_phone text,
ADD COLUMN IF NOT EXISTS billing_email text,
ADD COLUMN IF NOT EXISTS contract_start_date date,
ADD COLUMN IF NOT EXISTS contract_end_date date,
ADD COLUMN IF NOT EXISTS service_frequency text,
ADD COLUMN IF NOT EXISTS equipment_list jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS special_instructions text,
ADD COLUMN IF NOT EXISTS site_timezone text,
ADD COLUMN IF NOT EXISTS coordinates point,
ADD COLUMN IF NOT EXISTS annual_contract_value numeric(10,2),
ADD COLUMN IF NOT EXISTS payment_terms text,
ADD COLUMN IF NOT EXISTS escalation_contact text,
ADD COLUMN IF NOT EXISTS escalation_phone text;

-- Update ame_tasks table for comprehensive task management
ALTER TABLE public.ame_tasks 
ADD COLUMN IF NOT EXISTS phase integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS task_order integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS is_mandatory boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS equipment_types text[],
ADD COLUMN IF NOT EXISTS estimated_time_minutes integer,
ADD COLUMN IF NOT EXISTS complexity_level text DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS certification_required text[],
ADD COLUMN IF NOT EXISTS quality_criteria jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS documentation_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS measurement_points jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS acceptable_ranges jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS parent_task_id uuid REFERENCES ame_tasks(id),
ADD COLUMN IF NOT EXISTS frequency text DEFAULT 'every_visit';

-- Update ame_tools table for complete inventory management
ALTER TABLE public.ame_tools 
ADD COLUMN IF NOT EXISTS part_number text,
ADD COLUMN IF NOT EXISTS manufacturer text,
ADD COLUMN IF NOT EXISTS model_number text,
ADD COLUMN IF NOT EXISTS current_stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS minimum_stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS maximum_stock integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS unit_cost numeric(8,2),
ADD COLUMN IF NOT EXISTS last_inventory_date date,
ADD COLUMN IF NOT EXISTS storage_location text,
ADD COLUMN IF NOT EXISTS calibration_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS calibration_frequency_months integer,
ADD COLUMN IF NOT EXISTS last_calibration_date date,
ADD COLUMN IF NOT EXISTS next_calibration_date date,
ADD COLUMN IF NOT EXISTS tool_status text DEFAULT 'active',
ADD COLUMN IF NOT EXISTS warranty_expiry date,
ADD COLUMN IF NOT EXISTS maintenance_schedule text,
ADD COLUMN IF NOT EXISTS replacement_cost numeric(8,2);

-- Update ame_sops table for complete procedure library
ALTER TABLE public.ame_sops 
ADD COLUMN IF NOT EXISTS revision_number text DEFAULT '1.0',
ADD COLUMN IF NOT EXISTS approval_date date,
ADD COLUMN IF NOT EXISTS approved_by text,
ADD COLUMN IF NOT EXISTS effective_date date,
ADD COLUMN IF NOT EXISTS review_date date,
ADD COLUMN IF NOT EXISTS compliance_standard text,
ADD COLUMN IF NOT EXISTS training_required boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS certification_level text,
ADD COLUMN IF NOT EXISTS risk_level text DEFAULT 'low',
ADD COLUMN IF NOT EXISTS environmental_conditions text,
ADD COLUMN IF NOT EXISTS frequency_of_use text,
ADD COLUMN IF NOT EXISTS document_path text,
ADD COLUMN IF NOT EXISTS video_url text,
ADD COLUMN IF NOT EXISTS related_sops uuid[],
ADD COLUMN IF NOT EXISTS prerequisites text[],
ADD COLUMN IF NOT EXISTS quality_checkpoints jsonb DEFAULT '[]'::jsonb;

-- Create visit progress tracking table
CREATE TABLE IF NOT EXISTS public.ame_visit_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES ame_visits(id) ON DELETE CASCADE,
  phase_number integer NOT NULL,
  task_id uuid REFERENCES ame_tasks(id),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  time_spent_minutes integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'failed')),
  completion_percentage integer DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
  technician_notes text,
  issues_found text,
  resolution_notes text,
  quality_check_passed boolean,
  requires_followup boolean DEFAULT false,
  followup_notes text,
  photos jsonb DEFAULT '[]'::jsonb,
  measurements jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(visit_id, phase_number, task_id)
);

-- Create equipment inventory table
CREATE TABLE IF NOT EXISTS public.ame_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_id text UNIQUE NOT NULL,
  equipment_name text NOT NULL,
  manufacturer text,
  model text,
  serial_number text,
  equipment_type text NOT NULL,
  category text,
  installation_date date,
  warranty_expiry date,
  last_service_date date,
  next_service_due date,
  service_interval_months integer,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'decommissioned')),
  location text,
  specifications jsonb DEFAULT '{}'::jsonb,
  maintenance_history jsonb DEFAULT '[]'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create customer equipment mapping
CREATE TABLE IF NOT EXISTS public.ame_customer_equipment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES ame_customers(id) ON DELETE CASCADE,
  equipment_id uuid NOT NULL REFERENCES ame_equipment(id) ON DELETE CASCADE,
  installation_date date,
  commissioning_date date,
  warranty_start date,
  warranty_end date,
  service_responsibility text DEFAULT 'full_service',
  special_notes text,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(customer_id, equipment_id)
);

-- Create service schedules table
CREATE TABLE IF NOT EXISTS public.ame_service_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES ame_customers(id) ON DELETE CASCADE,
  schedule_name text NOT NULL,
  frequency text NOT NULL,
  service_tier text NOT NULL,
  next_due_date date NOT NULL,
  last_completed_date date,
  tasks jsonb DEFAULT '[]'::jsonb,
  duration_estimate_hours numeric(4,2),
  technician_requirements text[],
  seasonal_adjustments jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create parts and consumables table
CREATE TABLE IF NOT EXISTS public.ame_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id text UNIQUE NOT NULL,
  part_name text NOT NULL,
  category text NOT NULL,
  subcategory text,
  manufacturer text,
  part_number text,
  description text,
  unit_of_measure text DEFAULT 'each',
  standard_cost numeric(8,2),
  current_stock integer DEFAULT 0,
  minimum_stock integer DEFAULT 0,
  maximum_stock integer DEFAULT 0,
  reorder_point integer DEFAULT 0,
  lead_time_days integer,
  supplier_info jsonb DEFAULT '{}'::jsonb,
  storage_requirements text,
  shelf_life_months integer,
  hazmat_classification text,
  is_consumable boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create technician profiles table
CREATE TABLE IF NOT EXISTS public.ame_technicians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  first_name text NOT NULL,
  last_name text NOT NULL,
  employee_id text,
  email text,
  phone text,
  hire_date date,
  employment_status text DEFAULT 'active',
  certifications text[],
  specializations text[],
  service_regions text[],
  max_concurrent_visits integer DEFAULT 3,
  travel_radius_miles integer DEFAULT 50,
  hourly_rate numeric(6,2),
  emergency_contact_name text,
  emergency_contact_phone text,
  vehicle_info jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.ame_visit_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ame_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ame_customer_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ame_service_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ame_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ame_technicians ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for authenticated access
CREATE POLICY "Authenticated users can manage visit progress" ON ame_visit_progress FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view visit progress" ON ame_visit_progress FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage equipment" ON ame_equipment FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view equipment" ON ame_equipment FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage customer equipment" ON ame_customer_equipment FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view customer equipment" ON ame_customer_equipment FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage service schedules" ON ame_service_schedules FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view service schedules" ON ame_service_schedules FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage parts" ON ame_parts FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view parts" ON ame_parts FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage technicians" ON ame_technicians FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "Users can view technicians" ON ame_technicians FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visit_progress_visit_id ON ame_visit_progress(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_progress_status ON ame_visit_progress(status);
CREATE INDEX IF NOT EXISTS idx_equipment_type ON ame_equipment(equipment_type);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON ame_equipment(status);
CREATE INDEX IF NOT EXISTS idx_customer_equipment_customer ON ame_customer_equipment(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_schedules_customer ON ame_service_schedules(customer_id);
CREATE INDEX IF NOT EXISTS idx_service_schedules_due_date ON ame_service_schedules(next_due_date);
CREATE INDEX IF NOT EXISTS idx_parts_category ON ame_parts(category);
CREATE INDEX IF NOT EXISTS idx_parts_stock_level ON ame_parts(current_stock, minimum_stock);
CREATE INDEX IF NOT EXISTS idx_technicians_status ON ame_technicians(employment_status);

-- Create trigger for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply update triggers to tables with updated_at columns
CREATE TRIGGER update_ame_visit_progress_updated_at BEFORE UPDATE ON ame_visit_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ame_equipment_updated_at BEFORE UPDATE ON ame_equipment FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ame_service_schedules_updated_at BEFORE UPDATE ON ame_service_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ame_parts_updated_at BEFORE UPDATE ON ame_parts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_ame_technicians_updated_at BEFORE UPDATE ON ame_technicians FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();