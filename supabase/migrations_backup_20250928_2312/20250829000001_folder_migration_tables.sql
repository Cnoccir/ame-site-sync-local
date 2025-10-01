-- Add customer folder associations table
CREATE TABLE customer_folder_associations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  existing_folder_id TEXT NOT NULL,
  existing_folder_name TEXT NOT NULL,
  existing_folder_url TEXT NOT NULL,
  target_folder_id TEXT,
  target_folder_name TEXT,
  target_folder_url TEXT,
  association_type TEXT NOT NULL CHECK (association_type IN ('link', 'move', 'copy', 'archive', 'ignore')),
  folder_type TEXT NOT NULL CHECK (folder_type IN ('main', 'backups', 'project_docs', 'site_photos', 'maintenance', 'reports', 'correspondence', 'legacy')),
  confidence TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  user_confirmed BOOLEAN NOT NULL DEFAULT false,
  migration_status TEXT NOT NULL DEFAULT 'pending' CHECK (migration_status IN ('pending', 'in_progress', 'completed', 'failed')),
  notes TEXT,
  target_structure JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_id, existing_folder_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_customer_folder_associations_customer_id ON customer_folder_associations(customer_id);
CREATE INDEX idx_customer_folder_associations_migration_status ON customer_folder_associations(migration_status);
CREATE INDEX idx_customer_folder_associations_folder_type ON customer_folder_associations(folder_type);
CREATE INDEX idx_customer_folder_associations_confidence ON customer_folder_associations(confidence);

-- Add folder structure storage table to enhance the existing structure
CREATE TABLE customer_drive_folder_structure (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL UNIQUE,
  main_folder_id TEXT NOT NULL,
  main_folder_url TEXT NOT NULL,
  
  -- Standard subfolder structure
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
  
  -- Template and metadata
  template_id TEXT NOT NULL DEFAULT 'standard_project',
  template_version TEXT DEFAULT '1.0',
  migration_completed BOOLEAN DEFAULT false,
  migration_completed_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for customer lookup
CREATE INDEX idx_customer_drive_folder_structure_customer_id ON customer_drive_folder_structure(customer_id);

-- Add triggers to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_customer_folder_associations_updated_at
  BEFORE UPDATE ON customer_folder_associations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_drive_folder_structure_updated_at
  BEFORE UPDATE ON customer_drive_folder_structure
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add some helpful views for reporting
CREATE VIEW folder_migration_summary AS
SELECT 
  customer_id,
  COUNT(*) as total_folders,
  COUNT(CASE WHEN confidence = 'high' THEN 1 END) as high_confidence,
  COUNT(CASE WHEN confidence = 'medium' THEN 1 END) as medium_confidence,
  COUNT(CASE WHEN confidence = 'low' THEN 1 END) as low_confidence,
  COUNT(CASE WHEN user_confirmed = true THEN 1 END) as user_confirmed,
  COUNT(CASE WHEN migration_status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN migration_status = 'failed' THEN 1 END) as failed,
  MAX(updated_at) as last_updated
FROM customer_folder_associations
GROUP BY customer_id;

-- Add comments for documentation
COMMENT ON TABLE customer_folder_associations IS 'Tracks how existing Google Drive folders are associated with the new standardized folder structure during migration';
COMMENT ON TABLE customer_drive_folder_structure IS 'Stores the complete folder structure for each customer after migration';
COMMENT ON COLUMN customer_folder_associations.association_type IS 'How to handle this folder: link (use as-is), move (relocate files), copy (duplicate files), archive (preserve but not use), ignore (skip)';
COMMENT ON COLUMN customer_folder_associations.folder_type IS 'What type of folder this is in the standardized structure';
COMMENT ON COLUMN customer_folder_associations.confidence IS 'How confident the system is about the folder classification';
