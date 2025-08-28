-- Simple Folder Association Tables
-- Run this in your Supabase SQL editor

-- Table to cache Google Drive folder search results
CREATE TABLE IF NOT EXISTS customer_folder_search_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name TEXT NOT NULL,
    search_results JSONB NOT NULL,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_folder_search_cache_customer 
ON customer_folder_search_cache (customer_name);

CREATE INDEX IF NOT EXISTS idx_folder_search_cache_expires 
ON customer_folder_search_cache (expires_at);

-- Table to store folder associations between existing folders and new project folders
CREATE TABLE IF NOT EXISTS customer_folder_associations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES ame_customers(id) ON DELETE CASCADE,
    customer_name TEXT NOT NULL,
    existing_folder_id TEXT,
    existing_folder_name TEXT,
    existing_folder_url TEXT,
    new_project_folder_id TEXT,
    new_project_folder_url TEXT,
    association_type TEXT NOT NULL CHECK (association_type IN ('use_existing', 'create_new', 'link_both')),
    confidence_score DECIMAL(3,2) DEFAULT 0.0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for folder associations
CREATE INDEX IF NOT EXISTS idx_folder_associations_customer 
ON customer_folder_associations (customer_id);

CREATE INDEX IF NOT EXISTS idx_folder_associations_name 
ON customer_folder_associations (customer_name);

CREATE INDEX IF NOT EXISTS idx_folder_associations_existing 
ON customer_folder_associations (existing_folder_id);

-- RLS policies for folder search cache (if needed)
ALTER TABLE customer_folder_search_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own folder search cache" ON customer_folder_search_cache
    FOR ALL USING (true); -- For now, allow all access - can be restricted later

-- RLS policies for folder associations
ALTER TABLE customer_folder_associations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own folder associations" ON customer_folder_associations
    FOR ALL USING (true); -- For now, allow all access - can be restricted later

-- Function to automatically clean up expired cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_folder_cache()
RETURNS void
LANGUAGE sql
AS $$
    DELETE FROM customer_folder_search_cache 
    WHERE expires_at < now();
$$;

-- Optional: Create a scheduled job to run cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-folder-cache', '0 2 * * *', 'SELECT cleanup_expired_folder_cache();');
