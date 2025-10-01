-- Basic schema for local development
-- This creates the essential tables needed for the app to function

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
    display_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
    id text PRIMARY KEY,
    name text NOT NULL,
    address text,
    city text,
    state text,
    zip text,
    phone text,
    email text,
    service_tier text DEFAULT 'CORE',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create PM workflow sessions table
CREATE TABLE IF NOT EXISTS public.pm_workflow_sessions (
    id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
    customer_id text,
    site_name text,
    customer_name text,
    technician_name text,
    user_id text,
    status text DEFAULT 'Draft',
    phase integer DEFAULT 1,
    phase_data jsonb DEFAULT '{}'::jsonb,
    service_tier text DEFAULT 'CORE',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create PM workflow photos table
CREATE TABLE IF NOT EXISTS public.pm_workflow_photos (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id text NOT NULL REFERENCES public.pm_workflow_sessions(id) ON DELETE CASCADE,
    phase integer NOT NULL,
    photo_url text NOT NULL,
    photo_name text NOT NULL,
    caption text,
    file_size integer,
    mime_type text,
    upload_status text DEFAULT 'uploading',
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create basic RLS policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_workflow_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pm_workflow_photos ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (we'll tighten this later)
CREATE POLICY "Allow all for authenticated users" ON public.profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.pm_workflow_sessions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON public.pm_workflow_photos FOR ALL TO authenticated USING (true);

-- Create storage bucket for PM workflow photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('pm-workflow-photos', 'pm-workflow-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow all operations on storage bucket
CREATE POLICY "Allow all operations on pm-workflow-photos" ON storage.objects FOR ALL TO authenticated USING (bucket_id = 'pm-workflow-photos');

-- Insert some sample data for development
INSERT INTO public.customers (id, name, address, city, state, zip, phone, email, service_tier)
VALUES
    ('AME001', 'Demo Customer Corp', '123 Business Ave', 'Demo City', 'TX', '75001', '555-0123', 'contact@democorp.com', 'CORE'),
    ('AME002', 'Sample Industries', '456 Industrial Blvd', 'Sample City', 'TX', '75002', '555-0456', 'info@sampleind.com', 'ASSURE')
ON CONFLICT (id) DO NOTHING;

-- Insert sample PM workflow sessions
INSERT INTO public.pm_workflow_sessions (id, customer_id, site_name, customer_name, technician_name, user_id, status, phase, service_tier)
VALUES
    ('demo-session-1', 'AME001', 'Demo Site Building A', 'Demo Customer Corp', 'Demo Technician', 'dev-tech-user', 'In Progress', 2, 'CORE'),
    ('demo-session-2', 'AME002', 'Sample Facility', 'Sample Industries', 'Demo Technician', 'dev-tech-user', 'Completed', 4, 'ASSURE')
ON CONFLICT (id) DO NOTHING;