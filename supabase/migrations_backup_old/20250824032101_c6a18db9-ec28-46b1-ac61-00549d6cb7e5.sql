-- Visit Issues Table
CREATE TABLE IF NOT EXISTS public.visit_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('Critical', 'High', 'Medium', 'Low')),
  description TEXT NOT NULL,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visit Recommendations Table  
CREATE TABLE IF NOT EXISTS public.visit_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id TEXT NOT NULL,
  recommendation_type TEXT NOT NULL,
  recommendation_text TEXT NOT NULL,
  priority TEXT DEFAULT 'Medium',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Feedback Table
CREATE TABLE IF NOT EXISTS public.customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  satisfaction_rating INTEGER CHECK (satisfaction_rating >= 1 AND satisfaction_rating <= 5),
  comments TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visit Reports Table
CREATE TABLE IF NOT EXISTS public.visit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id TEXT NOT NULL,
  report_data JSONB NOT NULL,
  report_url TEXT,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  technician_email TEXT NOT NULL
);

-- Enable RLS
ALTER TABLE public.visit_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visit_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can manage visit issues" ON public.visit_issues
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view visit issues" ON public.visit_issues
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage visit recommendations" ON public.visit_recommendations
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view visit recommendations" ON public.visit_recommendations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage customer feedback" ON public.customer_feedback
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view customer feedback" ON public.customer_feedback
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can manage visit reports" ON public.visit_reports
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view visit reports" ON public.visit_reports
  FOR SELECT USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_visit_issues_updated_at
  BEFORE UPDATE ON public.visit_issues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_visit_recommendations_updated_at
  BEFORE UPDATE ON public.visit_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_customer_feedback_updated_at
  BEFORE UPDATE ON public.customer_feedback
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();