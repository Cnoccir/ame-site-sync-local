-- AME Maintenance System Tables

-- Customers table
CREATE TABLE public.ame_customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id VARCHAR(10) UNIQUE NOT NULL, -- Format: CUST_001
  company_name VARCHAR(100) NOT NULL,
  site_name VARCHAR(100) NOT NULL,
  site_address TEXT NOT NULL,
  service_tier VARCHAR(20) NOT NULL CHECK (service_tier IN ('CORE', 'ASSURE', 'GUARDIAN')),
  system_type VARCHAR(50) NOT NULL,
  contract_status VARCHAR(20) DEFAULT 'Active',
  building_type VARCHAR(50),
  
  -- Contact Information
  primary_contact VARCHAR(100) NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(100) NOT NULL,
  emergency_contact VARCHAR(100),
  emergency_phone VARCHAR(20),
  emergency_email VARCHAR(100),
  security_contact VARCHAR(100),
  security_phone VARCHAR(20),
  
  -- Access & Security
  building_access_type VARCHAR(50),
  building_access_details TEXT,
  access_hours VARCHAR(50),
  ppe_required BOOLEAN DEFAULT true,
  badge_required BOOLEAN DEFAULT false,
  training_required BOOLEAN DEFAULT false,
  safety_requirements TEXT,
  site_hazards TEXT,
  
  -- System Credentials (encrypted)
  bms_supervisor_ip INET,
  web_supervisor_url TEXT,
  workbench_username TEXT,
  workbench_password TEXT, -- Encrypted
  platform_username TEXT,
  platform_password TEXT, -- Encrypted
  
  -- Remote Access
  remote_access BOOLEAN DEFAULT false,
  remote_access_type VARCHAR(50),
  vpn_required BOOLEAN DEFAULT false,
  vpn_details TEXT,
  
  -- Service Tracking
  last_service DATE,
  next_due DATE,
  technician_assigned VARCHAR(100),
  
  -- Metadata
  drive_folder_id VARCHAR(100),
  drive_folder_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.ame_customers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Users can view all customers" ON public.ame_customers FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert customers" ON public.ame_customers FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update customers" ON public.ame_customers FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can delete customers" ON public.ame_customers FOR DELETE USING (auth.uid() IS NOT NULL);

-- Service Visits table
CREATE TABLE public.ame_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id VARCHAR(20) UNIQUE NOT NULL, -- Format: VIS_YYYYMMDD_001
  customer_id UUID REFERENCES public.ame_customers(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL,
  visit_status VARCHAR(20) DEFAULT 'Scheduled',
  completion_date TIMESTAMPTZ,
  
  -- Visit Phases
  phase_1_status VARCHAR(20) DEFAULT 'Pending',
  phase_1_completed_at TIMESTAMPTZ,
  phase_2_status VARCHAR(20) DEFAULT 'Pending',
  phase_2_completed_at TIMESTAMPTZ,
  phase_3_status VARCHAR(20) DEFAULT 'Pending',
  phase_3_completed_at TIMESTAMPTZ,
  phase_4_status VARCHAR(20) DEFAULT 'Pending',
  phase_4_completed_at TIMESTAMPTZ,
  
  -- Metadata
  technician_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ame_visits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visits
CREATE POLICY "Users can view all visits" ON public.ame_visits FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage visits" ON public.ame_visits FOR ALL USING (auth.uid() IS NOT NULL);

-- Tasks table
CREATE TABLE public.ame_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id VARCHAR(10) UNIQUE NOT NULL, -- Format: C001, A001, G001
  task_name VARCHAR(200) NOT NULL,
  service_tiers TEXT[], -- Array of applicable tiers
  category VARCHAR(50) NOT NULL,
  duration INTEGER, -- Duration in minutes
  navigation_path TEXT,
  sop_steps TEXT,
  tools_required TEXT[],
  quality_checks TEXT,
  prerequisites TEXT,
  skills_required TEXT,
  safety_notes TEXT,
  version VARCHAR(10) DEFAULT '1.0',
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ame_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view all tasks" ON public.ame_tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage tasks" ON public.ame_tasks FOR ALL USING (auth.uid() IS NOT NULL);

-- Visit Tasks (junction table)
CREATE TABLE public.ame_visit_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID REFERENCES public.ame_visits(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.ame_tasks(id),
  status VARCHAR(20) DEFAULT 'Pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  technician_notes TEXT,
  issues_found TEXT,
  resolution TEXT,
  time_spent INTEGER, -- Actual minutes spent
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ame_visit_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for visit tasks
CREATE POLICY "Users can view all visit tasks" ON public.ame_visit_tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage visit tasks" ON public.ame_visit_tasks FOR ALL USING (auth.uid() IS NOT NULL);

-- Tools table
CREATE TABLE public.ame_tools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_id VARCHAR(10) UNIQUE NOT NULL,
  tool_name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  safety_category VARCHAR(20),
  is_consumable BOOLEAN DEFAULT false,
  unit_of_measure VARCHAR(20),
  typical_quantity INTEGER,
  reorder_point INTEGER,
  supplier VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ame_tools ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tools
CREATE POLICY "Users can view all tools" ON public.ame_tools FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage tools" ON public.ame_tools FOR ALL USING (auth.uid() IS NOT NULL);

-- SOPs table
CREATE TABLE public.ame_sops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sop_id VARCHAR(10) UNIQUE NOT NULL,
  sop_name VARCHAR(200) NOT NULL,
  category VARCHAR(50),
  system_type VARCHAR(50),
  description TEXT,
  procedure_steps JSONB, -- Store as JSON array
  safety_requirements TEXT[],
  tools_required TEXT[],
  estimated_duration INTEGER,
  version VARCHAR(10),
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ame_sops ENABLE ROW LEVEL SECURITY;

-- RLS Policies for SOPs
CREATE POLICY "Users can view all SOPs" ON public.ame_sops FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage SOPs" ON public.ame_sops FOR ALL USING (auth.uid() IS NOT NULL);

-- Reports table
CREATE TABLE public.ame_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id VARCHAR(20) UNIQUE NOT NULL,
  visit_id UUID REFERENCES public.ame_visits(id),
  customer_id UUID REFERENCES public.ame_customers(id),
  report_type VARCHAR(50),
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  file_url TEXT,
  file_size INTEGER,
  metadata JSONB
);

-- Enable RLS
ALTER TABLE public.ame_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reports
CREATE POLICY "Users can view all reports" ON public.ame_reports FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage reports" ON public.ame_reports FOR ALL USING (auth.uid() IS NOT NULL);

-- Audit log
CREATE TABLE public.ame_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ame_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit logs
CREATE POLICY "Users can view audit logs" ON public.ame_audit_logs FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "System can insert audit logs" ON public.ame_audit_logs FOR INSERT WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_ame_customers_service_tier ON public.ame_customers(service_tier);
CREATE INDEX idx_ame_customers_contract_status ON public.ame_customers(contract_status);
CREATE INDEX idx_ame_customers_next_due ON public.ame_customers(next_due);
CREATE INDEX idx_ame_visits_customer_id ON public.ame_visits(customer_id);
CREATE INDEX idx_ame_visits_technician_id ON public.ame_visits(technician_id);
CREATE INDEX idx_ame_visit_tasks_visit_id ON public.ame_visit_tasks(visit_id);
CREATE INDEX idx_ame_visit_tasks_task_id ON public.ame_visit_tasks(task_id);