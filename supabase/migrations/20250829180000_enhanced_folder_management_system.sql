-- Enhanced Folder Management System Migration
-- This creates the complete infrastructure for intelligent folder detection and management

-- Create customer folder search cache table
CREATE TABLE IF NOT EXISTS customer_folder_search_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  search_results JSONB NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  search_duration_ms INTEGER,
  total_folders_found INTEGER DEFAULT 0,
  authentication_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for search cache performance
CREATE INDEX IF NOT EXISTS idx_customer_folder_search_cache_customer_name ON customer_folder_search_cache(customer_name);
CREATE INDEX IF NOT EXISTS idx_customer_folder_search_cache_expires_at ON customer_folder_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_customer_folder_search_cache_cached_at ON customer_folder_search_cache(cached_at);

-- Update customer_folder_associations to match our enhanced service needs
ALTER TABLE customer_folder_associations 
  DROP CONSTRAINT IF EXISTS customer_folder_associations_association_type_check,
  DROP CONSTRAINT IF EXISTS customer_folder_associations_folder_type_check;

-- Add new columns if they don't exist
DO $$
BEGIN
  -- Add customer_name column for easier querying
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_folder_associations' AND column_name = 'customer_name') THEN
    ALTER TABLE customer_folder_associations ADD COLUMN customer_name TEXT;
  END IF;
  
  -- Add new project folder columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_folder_associations' AND column_name = 'new_project_folder_id') THEN
    ALTER TABLE customer_folder_associations ADD COLUMN new_project_folder_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_folder_associations' AND column_name = 'new_project_folder_url') THEN
    ALTER TABLE customer_folder_associations ADD COLUMN new_project_folder_url TEXT;
  END IF;
  
  -- Add confidence score
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_folder_associations' AND column_name = 'confidence_score') THEN
    ALTER TABLE customer_folder_associations ADD COLUMN confidence_score DECIMAL(3,2) DEFAULT 0.5;
  END IF;
END $$;

-- Update constraints to match our enhanced service
ALTER TABLE customer_folder_associations 
  ADD CONSTRAINT customer_folder_associations_association_type_check 
  CHECK (association_type IN ('use_existing', 'create_new', 'link_both', 'reference_link', 'link', 'move', 'copy', 'archive', 'ignore'));

-- Make existing_folder fields nullable since we might create new without linking existing
ALTER TABLE customer_folder_associations 
  ALTER COLUMN existing_folder_id DROP NOT NULL,
  ALTER COLUMN existing_folder_name DROP NOT NULL,
  ALTER COLUMN existing_folder_url DROP NOT NULL;

-- Create enhanced project folder metadata table
CREATE TABLE IF NOT EXISTS enhanced_project_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  main_folder_id TEXT NOT NULL,
  main_folder_url TEXT NOT NULL,
  is_newly_created BOOLEAN DEFAULT true,
  associated_folders JSONB DEFAULT '[]'::jsonb,
  subfolders JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- Create indexes for enhanced project folders
CREATE INDEX IF NOT EXISTS idx_enhanced_project_folders_customer_id ON enhanced_project_folders(customer_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_project_folders_customer_name ON enhanced_project_folders(customer_name);
CREATE INDEX IF NOT EXISTS idx_enhanced_project_folders_main_folder_id ON enhanced_project_folders(main_folder_id);

-- Create project folder search index table for fast document retrieval
CREATE TABLE IF NOT EXISTS project_folder_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  folder_id TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  folder_path TEXT,
  folder_type TEXT NOT NULL, -- main, subfolder, associated, etc.
  association_type TEXT, -- main, reference, backup, archive
  parent_folder_id TEXT,
  file_count INTEGER DEFAULT 0,
  last_indexed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, folder_id)
);

-- Create indexes for search performance
CREATE INDEX IF NOT EXISTS idx_project_folder_search_index_customer_id ON project_folder_search_index(customer_id);
CREATE INDEX IF NOT EXISTS idx_project_folder_search_index_folder_type ON project_folder_search_index(folder_type);
CREATE INDEX IF NOT EXISTS idx_project_folder_search_index_association_type ON project_folder_search_index(association_type);
CREATE INDEX IF NOT EXISTS idx_project_folder_search_index_is_active ON project_folder_search_index(is_active);

-- Add triggers for updated_at columns
CREATE TRIGGER IF NOT EXISTS update_customer_folder_search_cache_updated_at
  BEFORE UPDATE ON customer_folder_search_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_enhanced_project_folders_updated_at
  BEFORE UPDATE ON enhanced_project_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER IF NOT EXISTS update_project_folder_search_index_updated_at
  BEFORE UPDATE ON project_folder_search_index
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create helpful views for folder management
CREATE OR REPLACE VIEW customer_folder_summary AS
SELECT 
  c.id as customer_id,
  c.company_name,
  c.site_name,
  c.drive_folder_id as legacy_folder_id,
  c.drive_folder_url as legacy_folder_url,
  epf.main_folder_id as enhanced_folder_id,
  epf.main_folder_url as enhanced_folder_url,
  epf.is_newly_created,
  COALESCE(jsonb_array_length(epf.associated_folders), 0) as associated_folder_count,
  epf.created_at as enhanced_setup_date,
  CASE 
    WHEN epf.id IS NOT NULL THEN 'enhanced'
    WHEN c.drive_folder_id IS NOT NULL THEN 'legacy'
    ELSE 'none'
  END as folder_setup_status
FROM ame_customers c
LEFT JOIN enhanced_project_folders epf ON c.id = epf.customer_id;

-- Create view for folder search performance
CREATE OR REPLACE VIEW folder_search_stats AS
SELECT 
  customer_name,
  COUNT(*) as search_count,
  AVG(search_duration_ms) as avg_search_time_ms,
  AVG(total_folders_found) as avg_folders_found,
  MAX(cached_at) as last_search,
  COUNT(CASE WHEN authentication_required THEN 1 END) as auth_required_count
FROM customer_folder_search_cache
WHERE cached_at >= NOW() - INTERVAL '7 days'
GROUP BY customer_name;

-- Add RLS policies for security
ALTER TABLE customer_folder_search_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_project_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_folder_search_index ENABLE ROW LEVEL SECURITY;

-- Create policies (assuming authenticated users can access their data)
CREATE POLICY IF NOT EXISTS "Users can view their folder search cache" ON customer_folder_search_cache
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can insert folder search cache" ON customer_folder_search_cache
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can update folder search cache" ON customer_folder_search_cache
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can delete expired folder search cache" ON customer_folder_search_cache
  FOR DELETE USING (auth.role() = 'authenticated' AND expires_at < NOW());

CREATE POLICY IF NOT EXISTS "Users can manage enhanced project folders" ON enhanced_project_folders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY IF NOT EXISTS "Users can manage project folder search index" ON project_folder_search_index
  FOR ALL USING (auth.role() = 'authenticated');

-- Add helpful functions
CREATE OR REPLACE FUNCTION cleanup_expired_folder_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM customer_folder_search_cache WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get customer folder statistics
CREATE OR REPLACE FUNCTION get_customer_folder_stats(customer_id_param TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'customer_id', customer_id_param,
    'has_enhanced_folder', EXISTS(SELECT 1 FROM enhanced_project_folders WHERE customer_id = customer_id_param),
    'associated_folder_count', COALESCE((
      SELECT jsonb_array_length(associated_folders) 
      FROM enhanced_project_folders 
      WHERE customer_id = customer_id_param
    ), 0),
    'indexed_folder_count', (
      SELECT COUNT(*) 
      FROM project_folder_search_index 
      WHERE customer_id = customer_id_param AND is_active = true
    ),
    'last_search_cached', (
      SELECT cached_at 
      FROM customer_folder_search_cache 
      WHERE customer_name = (SELECT company_name FROM ame_customers WHERE id = customer_id_param)
      ORDER BY cached_at DESC 
      LIMIT 1
    )
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE customer_folder_search_cache IS 'Caches Google Drive folder search results to improve performance and reduce API calls';
COMMENT ON TABLE enhanced_project_folders IS 'Stores enhanced project folder information with multi-folder association support';
COMMENT ON TABLE project_folder_search_index IS 'Search index for fast retrieval of documents across all associated project folders';

COMMENT ON COLUMN customer_folder_search_cache.search_results IS 'JSON array of folder search results with confidence scores and metadata';
COMMENT ON COLUMN enhanced_project_folders.associated_folders IS 'JSON array of associated folders with their types (main, reference, backup, etc.)';
COMMENT ON COLUMN enhanced_project_folders.metadata IS 'Additional metadata about folder creation strategy, search performance, etc.';
COMMENT ON COLUMN project_folder_search_index.folder_type IS 'Type of folder: main, subfolder, associated, legacy';
COMMENT ON COLUMN project_folder_search_index.association_type IS 'How folder is associated: main, reference, backup, archive';
