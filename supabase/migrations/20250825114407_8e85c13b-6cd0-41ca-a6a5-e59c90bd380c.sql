-- Create table for storing system access test results
CREATE TABLE IF NOT EXISTS public.system_access_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  visit_id UUID NOT NULL,
  supervisor_ip TEXT,
  supervisor_username TEXT,
  supervisor_password_hash TEXT,
  workbench_username TEXT,
  workbench_password_hash TEXT,
  platform_username TEXT,
  platform_password_hash TEXT,
  supervisor_test_result JSONB,
  workbench_test_result JSONB,
  platform_test_result JSONB,
  system_version TEXT,
  connection_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_access_tests ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users only
CREATE POLICY "Authenticated users can manage system access tests" 
ON public.system_access_tests 
FOR ALL
USING (auth.uid() IS NOT NULL);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_system_access_tests_updated_at
BEFORE UPDATE ON public.system_access_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to hash passwords securely
CREATE OR REPLACE FUNCTION public.hash_password(password_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple hash for demo - in production use proper encryption
  RETURN encode(digest(password_text || 'salt_key', 'sha256'), 'hex');
END;
$$;