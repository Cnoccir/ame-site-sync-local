-- Enhanced Site Intelligence System Migration - Phase 2
-- Adds team context, access intelligence, and project status fields

-- Enhanced Team Context fields
ALTER TABLE public.ame_customers ADD COLUMN last_visit_by VARCHAR(100);
ALTER TABLE public.ame_customers ADD COLUMN last_visit_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.ame_customers ADD COLUMN site_experience VARCHAR(20) CHECK (site_experience IN ('first_time', 'familiar', 'expert'));
ALTER TABLE public.ame_customers ADD COLUMN handoff_notes TEXT;

-- Enhanced Access Intelligence fields
ALTER TABLE public.ame_customers ADD COLUMN best_arrival_times TEXT[]; -- Array of optimal time windows
ALTER TABLE public.ame_customers ADD COLUMN poc_name VARCHAR(100); -- Point of contact name
ALTER TABLE public.ame_customers ADD COLUMN poc_phone VARCHAR(20); -- Point of contact phone
ALTER TABLE public.ame_customers ADD COLUMN poc_available_hours VARCHAR(100); -- Availability schedule
ALTER TABLE public.ame_customers ADD COLUMN backup_contact VARCHAR(100); -- Secondary contact
ALTER TABLE public.ame_customers ADD COLUMN access_approach TEXT; -- Successful approach notes
ALTER TABLE public.ame_customers ADD COLUMN common_access_issues TEXT[]; -- Known access problems
ALTER TABLE public.ame_customers ADD COLUMN scheduling_notes TEXT; -- Coordination notes

-- Enhanced Project Status fields
ALTER TABLE public.ame_customers ADD COLUMN completion_status VARCHAR(20) 
  CHECK (completion_status IN ('Design', 'Construction', 'Commissioning', 'Operational', 'Warranty'));
ALTER TABLE public.ame_customers ADD COLUMN commissioning_notes TEXT;
ALTER TABLE public.ame_customers ADD COLUMN known_issues TEXT[]; -- Site-specific problems
ALTER TABLE public.ame_customers ADD COLUMN documentation_score INTEGER CHECK (documentation_score >= 0 AND documentation_score <= 100);
ALTER TABLE public.ame_customers ADD COLUMN original_team_contact_id UUID REFERENCES public.ame_employees(id); -- Reference to AME employee
ALTER TABLE public.ame_customers ADD COLUMN original_team_contact VARCHAR(100); -- Original installation team contact (legacy)
ALTER TABLE public.ame_customers ADD COLUMN original_team_role VARCHAR(50); -- Role of original team contact
ALTER TABLE public.ame_customers ADD COLUMN original_team_info TEXT; -- Contact information
ALTER TABLE public.ame_customers ADD COLUMN when_to_contact_original TEXT; -- Guidance on when to reach out

-- Add indexes for frequently queried fields
CREATE INDEX idx_ame_customers_site_experience ON public.ame_customers(site_experience);
CREATE INDEX idx_ame_customers_completion_status ON public.ame_customers(completion_status);
CREATE INDEX idx_ame_customers_last_visit_date ON public.ame_customers(last_visit_date);

-- Update sample data for the test customer (AME-2025-003)
UPDATE public.ame_customers 
SET 
  last_visit_by = 'Mike Johnson',
  last_visit_date = '2024-12-15 09:30:00'::timestamp with time zone,
  site_experience = 'familiar',
  handoff_notes = 'Boiler room access requires facilities escort. Main AHU controller had intermittent connectivity issues during last visit.',
  best_arrival_times = ARRAY['08:00-10:00', '13:00-15:00'],
  poc_name = 'Sarah Mitchell',
  poc_phone = '(555) 123-4567',
  poc_available_hours = 'Monday-Friday 7:00 AM - 4:00 PM',
  backup_contact = 'Tom Rodriguez - Facilities (555) 765-4321',
  access_approach = 'Call POC 15 minutes before arrival. Use main entrance and ask reception for facilities escort.',
  common_access_issues = ARRAY['Escort delays during shift changes', 'Badge system occasionally malfunctions'],
  scheduling_notes = 'Avoid Tuesdays (board meetings) and last Friday of month (maintenance shutdown)',
  completion_status = 'Operational',
  commissioning_notes = 'System commissioned Q2 2024. Minor TAB adjustments completed. All sequences tested and verified.',
  known_issues = ARRAY['AHU-3 damper actuator requires periodic calibration', 'Chiller plant BAS integration pending'],
  documentation_score = 85,
  original_team_contact = 'David Kim',
  original_team_role = 'Lead Controls Engineer',
  original_team_info = 'david.kim@amecontrols.com / (555) 987-6543',
  when_to_contact_original = 'Contact for complex sequence modifications or integration issues with existing DDC panels'
WHERE site_number = 'AME-2025-003';

-- Create helper function to get enhanced site intelligence data
CREATE OR REPLACE FUNCTION get_site_intelligence(customer_id_param UUID) 
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'siteIdentity', json_build_object(
      'nickname', site_nickname,
      'siteNumber', site_number,
      'legacyJobNumbers', last_job_numbers,
      'systemPlatform', system_platform,
      'serviceTier', service_tier
    ),
    'teamContext', json_build_object(
      'primaryTech', get_technician_name(primary_technician_id),
      'secondaryTech', get_technician_name(secondary_technician_id),
      'lastVisitBy', last_visit_by,
      'lastVisitDate', last_visit_date,
      'siteExperience', site_experience,
      'handoffNotes', handoff_notes
    ),
    'accessIntelligence', json_build_object(
      'bestArrivalTimes', best_arrival_times,
      'pocAvailability', json_build_object(
        'name', poc_name,
        'phone', poc_phone,
        'availableHours', poc_available_hours,
        'backupContact', backup_contact
      ),
      'accessPatterns', json_build_object(
        'successfulApproach', access_approach,
        'commonIssues', common_access_issues,
        'schedulingNotes', scheduling_notes
      )
    ),
    'projectStatus', json_build_object(
      'completionStatus', completion_status,
      'commissioningNotes', commissioning_notes,
      'knownIssues', known_issues,
      'documentationScore', documentation_score,
      'originalTeamContact', CASE 
        WHEN original_team_contact IS NOT NULL THEN json_build_object(
          'name', original_team_contact,
          'role', original_team_role,
          'contactInfo', original_team_info,
          'whenToContact', when_to_contact_original
        )
        ELSE NULL
      END
    )
  )
  INTO result
  FROM public.ame_customers
  WHERE id = customer_id_param;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION get_site_intelligence(UUID) IS 'Returns comprehensive site intelligence data in structured JSON format for the specified customer';
