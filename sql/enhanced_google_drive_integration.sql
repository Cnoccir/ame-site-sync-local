-- Enhanced Google Drive Integration Tables
-- This migration adds comprehensive folder tracking and search capabilities

-- Table for storing detailed customer folder structure
CREATE TABLE IF NOT EXISTS customer_drive_folder_structure (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES ame_customers(id) ON DELETE CASCADE,
  
  -- Main project folder
  main_folder_id TEXT NOT NULL,
  main_folder_url TEXT NOT NULL,
  
  -- Structured subfolders
  backups_folder_id TEXT NOT NULL,
  backups_folder_url TEXT NOT NULL,
  project_docs_folder_id TEXT NOT NULL,
  project_docs_folder_url TEXT NOT NULL,
  site_photos_folder_id TEXT NOT NULL,
  site_photos_folder_url TEXT NOT NULL,
  maintenance_folder_id TEXT NOT NULL,
  maintenance_folder_url TEXT NOT NULL,
  reports_folder_id TEXT NOT NULL,
  reports_folder_url TEXT NOT NULL,
  correspondence_folder_id TEXT NOT NULL,
  correspondence_folder_url TEXT NOT NULL,
  
  -- Metadata
  parent_folder_id TEXT, -- The year folder this was created in
  folder_year INTEGER DEFAULT EXTRACT(year FROM CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(customer_id)
);

-- Table for caching folder search results
CREATE TABLE IF NOT EXISTS customer_folder_search_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name TEXT NOT NULL,
  search_results JSONB NOT NULL, -- Stores the full search result object
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  
  UNIQUE(customer_name)
);

-- Enhanced customer_drive_folders table (if not exists)
CREATE TABLE IF NOT EXISTS customer_drive_folders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID REFERENCES ame_customers(id) ON DELETE CASCADE,
  folder_id TEXT NOT NULL,
  folder_name TEXT NOT NULL,
  folder_url TEXT NOT NULL,
  folder_path TEXT, -- Full path in Drive
  
  -- Match information
  match_score DECIMAL(3,2) DEFAULT 0.0,
  match_type TEXT CHECK (match_type IN ('exact', 'fuzzy', 'contains', 'alias', 'partial')),
  confidence_level TEXT CHECK (confidence_level IN ('high', 'medium', 'low')),
  
  -- Metadata
  parent_folder_id TEXT,
  parent_folder_type TEXT, -- Which AME folder area this is in
  year_folder INTEGER,
  file_count INTEGER DEFAULT 0,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false, -- Mark the primary folder for this customer
  
  -- Timestamps
  last_indexed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(customer_id, folder_id)
);

-- Table for tracking Google Drive folder scanning activity
CREATE TABLE IF NOT EXISTS drive_folder_scan_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_type TEXT NOT NULL, -- 'customer_search', 'bulk_refresh', 'folder_creation'
  customer_id UUID REFERENCES ame_customers(id),
  customer_name TEXT,
  
  -- Scan details
  folders_scanned INTEGER DEFAULT 0,
  matches_found INTEGER DEFAULT 0,
  scan_duration_ms INTEGER,
  
  -- Results summary
  high_confidence_matches INTEGER DEFAULT 0,
  medium_confidence_matches INTEGER DEFAULT 0,
  low_confidence_matches INTEGER DEFAULT 0,
  
  -- Status
  status TEXT CHECK (status IN ('started', 'completed', 'failed', 'cancelled')),
  error_message TEXT,
  
  -- Timestamps
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_customer_drive_folders_customer_id ON customer_drive_folders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_drive_folders_folder_id ON customer_drive_folders(folder_id);
CREATE INDEX IF NOT EXISTS idx_customer_drive_folders_match_score ON customer_drive_folders(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_customer_drive_folders_confidence ON customer_drive_folders(confidence_level, match_score DESC);
CREATE INDEX IF NOT EXISTS idx_customer_drive_folders_active ON customer_drive_folders(is_active, is_primary);

CREATE INDEX IF NOT EXISTS idx_customer_folder_search_cache_expires ON customer_folder_search_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_customer_folder_search_cache_customer ON customer_folder_search_cache(customer_name);

CREATE INDEX IF NOT EXISTS idx_drive_folder_scan_log_customer ON drive_folder_scan_log(customer_id);
CREATE INDEX IF NOT EXISTS idx_drive_folder_scan_log_type_status ON drive_folder_scan_log(scan_type, status);
CREATE INDEX IF NOT EXISTS idx_drive_folder_scan_log_created ON drive_folder_scan_log(created_at DESC);

-- Add columns to ame_customers table if they don't exist
DO $$
BEGIN
  -- Check if columns exist and add them if they don't
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ame_customers' AND column_name = 'drive_folder_id') THEN
    ALTER TABLE ame_customers ADD COLUMN drive_folder_id TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ame_customers' AND column_name = 'drive_folder_url') THEN
    ALTER TABLE ame_customers ADD COLUMN drive_folder_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ame_customers' AND column_name = 'drive_folder_last_scanned') THEN
    ALTER TABLE ame_customers ADD COLUMN drive_folder_last_scanned TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'ame_customers' AND column_name = 'drive_auto_discovery_enabled') THEN
    ALTER TABLE ame_customers ADD COLUMN drive_auto_discovery_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Create a function to clean up expired search cache entries
CREATE OR REPLACE FUNCTION cleanup_expired_search_cache()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM customer_folder_search_cache
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get folder recommendations for a customer
CREATE OR REPLACE FUNCTION get_customer_folder_recommendations(
  p_customer_id UUID,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  folder_id TEXT,
  folder_name TEXT,
  folder_url TEXT,
  match_score DECIMAL,
  confidence_level TEXT,
  parent_folder_type TEXT,
  recommendation_rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cdf.folder_id,
    cdf.folder_name,
    cdf.folder_url,
    cdf.match_score,
    cdf.confidence_level,
    cdf.parent_folder_type,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE cdf.confidence_level 
          WHEN 'high' THEN 3 
          WHEN 'medium' THEN 2 
          ELSE 1 
        END DESC,
        cdf.match_score DESC,
        cdf.last_indexed DESC
    )::INTEGER as recommendation_rank
  FROM customer_drive_folders cdf
  WHERE cdf.customer_id = p_customer_id
    AND cdf.is_active = true
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create a function to log folder scanning activity
CREATE OR REPLACE FUNCTION log_drive_folder_scan(
  p_scan_type TEXT,
  p_customer_id UUID DEFAULT NULL,
  p_customer_name TEXT DEFAULT NULL,
  p_folders_scanned INTEGER DEFAULT 0,
  p_matches_found INTEGER DEFAULT 0,
  p_scan_duration_ms INTEGER DEFAULT NULL,
  p_high_confidence INTEGER DEFAULT 0,
  p_medium_confidence INTEGER DEFAULT 0,
  p_low_confidence INTEGER DEFAULT 0,
  p_status TEXT DEFAULT 'completed',
  p_error_message TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO drive_folder_scan_log (
    scan_type, customer_id, customer_name, folders_scanned, matches_found,
    scan_duration_ms, high_confidence_matches, medium_confidence_matches,
    low_confidence_matches, status, error_message, completed_at
  ) VALUES (
    p_scan_type, p_customer_id, p_customer_name, p_folders_scanned, p_matches_found,
    p_scan_duration_ms, p_high_confidence, p_medium_confidence, p_low_confidence,
    p_status, p_error_message, 
    CASE WHEN p_status IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE NULL END
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql;

-- Insert some example AME Drive folder mappings for reference
INSERT INTO customer_folder_search_cache (customer_name, search_results, expires_at)
VALUES (
  'example_ame_folders',
  '{
    "folders": {
      "SITE_BACKUPS": "0AA0zN0U9WLD6Uk9PVA",
      "ENGINEERING_MASTER": "0AHYT5lRT-50cUk9PVA",
      "ENGINEERING_2021": "1maB0Nq9V4l05p63DXU9YEIUQlGvjVI0g",
      "ENGINEERING_2022": "10uM5VcqEfBqDuHOi9of3Nj0gfGfxo2QU",
      "ENGINEERING_2023": "1UjzlUQaleGSedk39ZYxQCTAUhu9TLBrM",
      "ENGINEERING_2024": "1kh6bp8m80Lt-GyqBFY2fPMFmFZfhGyMy",
      "ENGINEERING_2025": "17t5MFAl1Hr0iZgWfYbu2TJ-WckFZt41K",
      "SERVICE_MAINTENANCE": "0AEG566vw75FqUk9PVA",
      "NEW_JOB_FOLDER": "1kHsxb9AAeeMtG3G_LjIAoR4UCPky6efU"
    },
    "urls": {
      "SITE_BACKUPS": "https://drive.google.com/drive/folders/0AA0zN0U9WLD6Uk9PVA",
      "ENGINEERING_MASTER": "https://drive.google.com/drive/folders/0AHYT5lRT-50cUk9PVA",
      "SERVICE_MAINTENANCE": "https://drive.google.com/drive/folders/0AEG566vw75FqUk9PVA",
      "NEW_JOB_FOLDER": "https://drive.google.com/drive/folders/1kHsxb9AAeeMtG3G_LjIAoR4UCPky6efU"
    },
    "description": "AME Inc. Google Drive folder structure reference"
  }',
  NOW() + INTERVAL '365 days' -- Cache for a year since these are reference folders
) ON CONFLICT (customer_name) DO NOTHING;

-- Create a view for easy access to customer folder information
CREATE OR REPLACE VIEW customer_drive_folder_summary AS
SELECT 
  c.id as customer_id,
  c.company_name,
  c.drive_folder_id,
  c.drive_folder_url,
  c.drive_folder_last_scanned,
  c.drive_auto_discovery_enabled,
  
  -- Structured folder info
  cfs.main_folder_id as structured_main_folder_id,
  cfs.main_folder_url as structured_main_folder_url,
  cfs.folder_year as structured_folder_year,
  cfs.created_at as structured_folder_created,
  
  -- Folder search stats
  COUNT(cdf.id) as total_discovered_folders,
  COUNT(CASE WHEN cdf.confidence_level = 'high' THEN 1 END) as high_confidence_folders,
  COUNT(CASE WHEN cdf.confidence_level = 'medium' THEN 1 END) as medium_confidence_folders,
  COUNT(CASE WHEN cdf.is_primary = true THEN 1 END) as primary_folders,
  
  -- Latest scan info
  MAX(cdf.last_indexed) as last_folder_scan,
  
  -- Recommendations
  (SELECT folder_name FROM customer_drive_folders 
   WHERE customer_id = c.id AND is_active = true 
   ORDER BY confidence_level DESC, match_score DESC, last_indexed DESC 
   LIMIT 1) as top_recommended_folder

FROM ame_customers c
LEFT JOIN customer_drive_folder_structure cfs ON c.id = cfs.customer_id
LEFT JOIN customer_drive_folders cdf ON c.id = cdf.customer_id AND cdf.is_active = true
GROUP BY 
  c.id, c.company_name, c.drive_folder_id, c.drive_folder_url, 
  c.drive_folder_last_scanned, c.drive_auto_discovery_enabled,
  cfs.main_folder_id, cfs.main_folder_url, cfs.folder_year, cfs.created_at;

-- Grant permissions (adjust as needed for your RLS policies)
-- These are example permissions - adjust based on your security requirements

-- Allow authenticated users to read their own customer folder data
-- ALTER TABLE customer_drive_folder_structure ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customer_drive_folders ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE customer_folder_search_cache ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE drive_folder_scan_log ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE customer_drive_folder_structure IS 'Stores detailed folder structure for customer project folders including all subfolders';
COMMENT ON TABLE customer_folder_search_cache IS 'Caches folder search results to improve performance of repeated searches';
COMMENT ON TABLE customer_drive_folders IS 'Tracks all discovered Google Drive folders that may be associated with customers';
COMMENT ON TABLE drive_folder_scan_log IS 'Logs all folder scanning activities for monitoring and debugging';

COMMENT ON FUNCTION cleanup_expired_search_cache() IS 'Removes expired entries from the search cache to keep it clean';
COMMENT ON FUNCTION get_customer_folder_recommendations(UUID, INTEGER) IS 'Returns ranked folder recommendations for a specific customer';
COMMENT ON FUNCTION log_drive_folder_scan(TEXT, UUID, TEXT, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, INTEGER, TEXT, TEXT) IS 'Logs folder scanning activities with comprehensive metrics';

-- Print completion message
DO $$
BEGIN
  RAISE NOTICE 'Enhanced Google Drive integration tables created successfully!';
  RAISE NOTICE 'Tables created: customer_drive_folder_structure, customer_folder_search_cache, customer_drive_folders, drive_folder_scan_log';
  RAISE NOTICE 'Functions created: cleanup_expired_search_cache, get_customer_folder_recommendations, log_drive_folder_scan';
  RAISE NOTICE 'View created: customer_drive_folder_summary';
END $$;
