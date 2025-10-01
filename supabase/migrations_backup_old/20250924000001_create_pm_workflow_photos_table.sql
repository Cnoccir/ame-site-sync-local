-- Create PM Workflow Photos table for storing photo metadata
CREATE TABLE IF NOT EXISTS pm_workflow_photos (
    id TEXT PRIMARY KEY,
    workflow_id TEXT NOT NULL,
    phase_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    description TEXT,
    alt_text TEXT,
    category TEXT CHECK (category IN ('Equipment', 'Screenshot', 'Other')) DEFAULT 'Other',
    url TEXT NOT NULL,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_pm_workflow_photos_workflow_id ON pm_workflow_photos(workflow_id);
CREATE INDEX IF NOT EXISTS idx_pm_workflow_photos_phase_id ON pm_workflow_photos(phase_id);
CREATE INDEX IF NOT EXISTS idx_pm_workflow_photos_category ON pm_workflow_photos(category);
CREATE INDEX IF NOT EXISTS idx_pm_workflow_photos_created_at ON pm_workflow_photos(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE pm_workflow_photos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can view all photos (for now - can be restricted later)
CREATE POLICY "Users can view pm workflow photos" ON pm_workflow_photos
    FOR SELECT USING (true);

-- Users can insert their own photos
CREATE POLICY "Users can insert pm workflow photos" ON pm_workflow_photos
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

-- Users can update their own photos
CREATE POLICY "Users can update own pm workflow photos" ON pm_workflow_photos
    FOR UPDATE USING (auth.uid() = uploaded_by);

-- Users can delete their own photos
CREATE POLICY "Users can delete own pm workflow photos" ON pm_workflow_photos
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Create storage bucket for PM photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'pm-photos',
    'pm-photos',
    true,
    10485760, -- 10MB limit
    '{"image/jpeg", "image/jpg", "image/png", "image/webp"}'
) ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for pm-photos bucket
-- Allow users to upload photos
CREATE POLICY "Users can upload pm photos" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'pm-photos'
        AND auth.role() = 'authenticated'
    );

-- Allow users to view photos
CREATE POLICY "Users can view pm photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'pm-photos');

-- Allow users to delete their own photos
CREATE POLICY "Users can delete own pm photos" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'pm-photos'
        AND auth.role() = 'authenticated'
    );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_pm_workflow_photos_updated_at
    BEFORE UPDATE ON pm_workflow_photos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();