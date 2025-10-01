-- Migration: Google Drive Integration Support
-- This migration creates all necessary tables and functions for Google Drive integration

-- Create system settings table for Google Drive configuration
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(20) DEFAULT 'string', -- string, number, boolean, json
  is_encrypted BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create customer drive folders mapping table (supports both ame_customers and simpro_customers)
CREATE TABLE IF NOT EXISTS customer_drive_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID, -- Will reference either ame_customers(id) or simpro_customers(id)
  customer_type VARCHAR(20) DEFAULT 'ame' CHECK (customer_type IN ('ame', 'simpro')),
  folder_id VARCHAR(100) NOT NULL, -- Google Drive folder ID
  folder_name VARCHAR(255),
  folder_url TEXT,
  last_indexed TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT unique_customer_folder UNIQUE(customer_id, folder_id)
);

-- Create drive file index table for fast searching
CREATE TABLE IF NOT EXISTS drive_file_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id VARCHAR(100) UNIQUE NOT NULL, -- Google Drive file ID
  name TEXT NOT NULL,
  mime_type VARCHAR(100),
  created_time TIMESTAMP WITH TIME ZONE,
  modified_time TIMESTAMP WITH TIME ZONE,
  web_view_link TEXT,
  parent_folders TEXT[], -- Array of parent folder IDs
  file_size BIGINT,
  thumbnail_link TEXT,
  description TEXT,
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Full-text search index
  search_vector tsvector
);

-- Create SimPro customers reference table
CREATE TABLE IF NOT EXISTS simpro_customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simpro_customer_id VARCHAR(20) UNIQUE NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  mailing_address TEXT,
  mailing_city VARCHAR(100),
  mailing_state VARCHAR(10),
  mailing_zip VARCHAR(20),
  labor_tax_code VARCHAR(100),
  part_tax_code VARCHAR(100),
  is_contract_customer BOOLEAN DEFAULT FALSE,
  has_active_contracts BOOLEAN DEFAULT FALSE,
  total_contract_value DECIMAL(12,2) DEFAULT 0,
  active_contract_count INTEGER DEFAULT 0,
  latest_contract_email VARCHAR(255),
  service_tier VARCHAR(20) DEFAULT 'CORE' CHECK (service_tier IN ('CORE', 'ASSURE', 'GUARDIAN')),
  
  -- Google Drive integration
  drive_folder_id VARCHAR(100),
  drive_folder_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Search optimization
  search_vector tsvector
);

-- Create SimPro customer contracts table
CREATE TABLE IF NOT EXISTS simpro_customer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES simpro_customers(id) ON DELETE CASCADE,
  contract_name VARCHAR(255),
  contract_number VARCHAR(100),
  contract_value DECIMAL(12,2) DEFAULT 0,
  contract_status VARCHAR(20) DEFAULT 'Active' CHECK (contract_status IN ('Active', 'Expired')),
  start_date DATE,
  end_date DATE,
  contract_email VARCHAR(255),
  contract_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add drive folder fields to existing ame_customers table if they don't exist
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name='ame_customers') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='ame_customers' AND column_name='drive_folder_id') THEN
            ALTER TABLE ame_customers ADD COLUMN drive_folder_id VARCHAR(100);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_name='ame_customers' AND column_name='drive_folder_url') THEN
            ALTER TABLE ame_customers ADD COLUMN drive_folder_url TEXT;
        END IF;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_customer_drive_folders_customer_id ON customer_drive_folders(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_drive_folders_folder_id ON customer_drive_folders(folder_id);
CREATE INDEX IF NOT EXISTS idx_customer_drive_folders_active ON customer_drive_folders(is_active);
CREATE INDEX IF NOT EXISTS idx_drive_file_index_file_id ON drive_file_index(file_id);
CREATE INDEX IF NOT EXISTS idx_drive_file_index_name ON drive_file_index(name);
CREATE INDEX IF NOT EXISTS idx_drive_file_index_mime_type ON drive_file_index(mime_type);
CREATE INDEX IF NOT EXISTS idx_drive_file_index_modified ON drive_file_index(modified_time);
CREATE INDEX IF NOT EXISTS idx_drive_file_index_parents ON drive_file_index USING GIN(parent_folders);

-- Create indexes for SimPro tables
CREATE INDEX IF NOT EXISTS idx_simpro_customers_simpro_id ON simpro_customers(simpro_customer_id);
CREATE INDEX IF NOT EXISTS idx_simpro_customers_company_name ON simpro_customers(company_name);
CREATE INDEX IF NOT EXISTS idx_simpro_customers_service_tier ON simpro_customers(service_tier);
CREATE INDEX IF NOT EXISTS idx_simpro_customers_has_active_contracts ON simpro_customers(has_active_contracts);
CREATE INDEX IF NOT EXISTS idx_simpro_customers_total_value ON simpro_customers(total_contract_value);
CREATE INDEX IF NOT EXISTS idx_simpro_customer_contracts_customer_id ON simpro_customer_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_simpro_customer_contracts_status ON simpro_customer_contracts(contract_status);
CREATE INDEX IF NOT EXISTS idx_simpro_customer_contracts_number ON simpro_customer_contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_simpro_customer_contracts_value ON simpro_customer_contracts(contract_value);

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_drive_file_search ON drive_file_index USING GIN(search_vector);

-- Create function to update search vector
CREATE OR REPLACE FUNCTION update_drive_file_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.name, '') || ' ' ||
        COALESCE(NEW.description, '') || ' ' ||
        COALESCE(NEW.mime_type, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update search vector
DROP TRIGGER IF EXISTS trigger_update_drive_file_search_vector ON drive_file_index;
CREATE TRIGGER trigger_update_drive_file_search_vector
    BEFORE INSERT OR UPDATE ON drive_file_index
    FOR EACH ROW
    EXECUTE FUNCTION update_drive_file_search_vector();

-- Create function to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_system_settings_updated_at ON system_settings;
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customer_drive_folders_updated_at ON customer_drive_folders;
CREATE TRIGGER update_customer_drive_folders_updated_at 
    BEFORE UPDATE ON customer_drive_folders
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_drive_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_file_index ENABLE ROW LEVEL SECURITY;

-- System settings policies (admin only)
CREATE POLICY "Admin can read system settings" ON system_settings
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.role = 'admin'
        )
    );

CREATE POLICY "Admin can insert system settings" ON system_settings
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.role = 'admin'
        )
    );

CREATE POLICY "Admin can update system settings" ON system_settings
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.role = 'admin'
        )
    );

-- Customer drive folders policies
CREATE POLICY "Authenticated users can read customer drive folders" ON customer_drive_folders
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert customer drive folders" ON customer_drive_folders
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update customer drive folders" ON customer_drive_folders
    FOR UPDATE TO authenticated USING (true);

-- Drive file index policies
CREATE POLICY "Authenticated users can read drive file index" ON drive_file_index
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "System can insert drive file index" ON drive_file_index
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "System can update drive file index" ON drive_file_index
    FOR UPDATE TO authenticated USING (true);

-- Insert default Google Drive settings (encrypted values should be set via admin panel)
INSERT INTO system_settings (setting_key, description, is_encrypted) VALUES 
    ('google_drive_api_key', 'Google Drive API key for accessing Drive API', true),
    ('google_drive_client_id', 'OAuth client ID for Google Drive integration', false),
    ('google_drive_client_secret', 'OAuth client secret for Google Drive integration', true),
    ('google_drive_refresh_token', 'OAuth refresh token for Google Drive access', true)
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to search drive files with full-text search
CREATE OR REPLACE FUNCTION search_drive_files(
    search_query TEXT,
    folder_ids TEXT[] DEFAULT NULL,
    file_types TEXT[] DEFAULT NULL,
    year_filter INTEGER DEFAULT NULL,
    max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
    file_id VARCHAR(100),
    name TEXT,
    mime_type VARCHAR(100),
    created_time TIMESTAMP WITH TIME ZONE,
    modified_time TIMESTAMP WITH TIME ZONE,
    web_view_link TEXT,
    parent_folders TEXT[],
    file_size BIGINT,
    thumbnail_link TEXT,
    description TEXT,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dfi.file_id,
        dfi.name,
        dfi.mime_type,
        dfi.created_time,
        dfi.modified_time,
        dfi.web_view_link,
        dfi.parent_folders,
        dfi.file_size,
        dfi.thumbnail_link,
        dfi.description,
        ts_rank(dfi.search_vector, plainto_tsquery('english', search_query)) AS relevance_score
    FROM drive_file_index dfi
    WHERE 
        -- Text search
        (search_query IS NULL OR dfi.search_vector @@ plainto_tsquery('english', search_query))
        
        -- Folder filter
        AND (folder_ids IS NULL OR dfi.parent_folders && folder_ids)
        
        -- File type filter
        AND (file_types IS NULL OR dfi.mime_type = ANY(file_types))
        
        -- Year filter
        AND (year_filter IS NULL OR EXTRACT(YEAR FROM dfi.modified_time) >= year_filter)
    
    ORDER BY 
        CASE WHEN search_query IS NOT NULL THEN relevance_score END DESC,
        dfi.modified_time DESC
    
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get customer folder statistics
CREATE OR REPLACE FUNCTION get_customer_folder_stats(customer_uuid UUID)
RETURNS TABLE (
    folder_count INTEGER,
    total_files INTEGER,
    last_indexed TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(cdf.id)::INTEGER as folder_count,
        COALESCE(SUM(
            (SELECT COUNT(*)::INTEGER 
             FROM drive_file_index dfi 
             WHERE dfi.parent_folders && ARRAY[cdf.folder_id])
        ), 0) as total_files,
        MAX(cdf.last_indexed) as last_indexed
    FROM customer_drive_folders cdf
    WHERE cdf.customer_id = customer_uuid AND cdf.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to cleanup old indexed files (housekeeping)
CREATE OR REPLACE FUNCTION cleanup_old_indexed_files(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM drive_file_index
    WHERE indexed_at < NOW() - INTERVAL '1 day' * days_old
    AND file_id NOT IN (
        -- Keep files that are in active customer folders
        SELECT DISTINCT dfi.file_id
        FROM drive_file_index dfi
        JOIN customer_drive_folders cdf ON dfi.parent_folders && ARRAY[cdf.folder_id]
        WHERE cdf.is_active = true
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Add helpful comments
COMMENT ON TABLE system_settings IS 'System-wide configuration settings including Google Drive API credentials';
COMMENT ON TABLE customer_drive_folders IS 'Maps customers to their Google Drive folders for document access';
COMMENT ON TABLE drive_file_index IS 'Searchable index of files in Google Drive folders with full-text search capabilities';
COMMENT ON FUNCTION search_drive_files IS 'Full-text search function for Google Drive files with filtering options';
COMMENT ON FUNCTION get_customer_folder_stats IS 'Get statistics about customer folder mappings and file counts';
COMMENT ON FUNCTION cleanup_old_indexed_files IS 'Housekeeping function to remove old indexed files that are no longer relevant';

-- Enable RLS for SimPro tables
ALTER TABLE simpro_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE simpro_customer_contracts ENABLE ROW LEVEL SECURITY;

-- SimPro customers policies
CREATE POLICY "Authenticated users can read SimPro customers" ON simpro_customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert SimPro customers" ON simpro_customers
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update SimPro customers" ON simpro_customers
    FOR UPDATE TO authenticated USING (true);

-- SimPro contracts policies
CREATE POLICY "Authenticated users can read SimPro contracts" ON simpro_customer_contracts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert SimPro contracts" ON simpro_customer_contracts
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update SimPro contracts" ON simpro_customer_contracts
    FOR UPDATE TO authenticated USING (true);

-- Create full-text search indexes for SimPro customers
CREATE INDEX IF NOT EXISTS idx_simpro_customers_search ON simpro_customers USING GIN(search_vector);

-- Create function to update SimPro customer search vector
CREATE OR REPLACE FUNCTION update_simpro_customer_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', 
        COALESCE(NEW.company_name, '') || ' ' ||
        COALESCE(NEW.email, '') || ' ' ||
        COALESCE(NEW.mailing_address, '') || ' ' ||
        COALESCE(NEW.mailing_city, '') || ' ' ||
        COALESCE(NEW.mailing_state, '')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update SimPro customer search vector
DROP TRIGGER IF EXISTS trigger_update_simpro_customer_search_vector ON simpro_customers;
CREATE TRIGGER trigger_update_simpro_customer_search_vector
    BEFORE INSERT OR UPDATE ON simpro_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_simpro_customer_search_vector();

-- Create triggers for updated_at on SimPro tables
DROP TRIGGER IF EXISTS update_simpro_customers_updated_at ON simpro_customers;
CREATE TRIGGER update_simpro_customers_updated_at 
    BEFORE UPDATE ON simpro_customers
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_simpro_customer_contracts_updated_at ON simpro_customer_contracts;
CREATE TRIGGER update_simpro_customer_contracts_updated_at 
    BEFORE UPDATE ON simpro_customer_contracts
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to search SimPro customers
CREATE OR REPLACE FUNCTION search_simpro_customers(
    search_query TEXT,
    service_tier_filter TEXT DEFAULT NULL,
    has_contracts_filter BOOLEAN DEFAULT NULL,
    max_results INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    simpro_customer_id VARCHAR(20),
    company_name VARCHAR(255),
    email VARCHAR(255),
    mailing_address TEXT,
    mailing_city VARCHAR(100),
    mailing_state VARCHAR(10),
    service_tier VARCHAR(20),
    has_active_contracts BOOLEAN,
    total_contract_value DECIMAL(12,2),
    active_contract_count INTEGER,
    relevance_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sc.id,
        sc.simpro_customer_id,
        sc.company_name,
        sc.email,
        sc.mailing_address,
        sc.mailing_city,
        sc.mailing_state,
        sc.service_tier,
        sc.has_active_contracts,
        sc.total_contract_value,
        sc.active_contract_count,
        CASE WHEN search_query IS NOT NULL AND search_query != '' THEN 
            ts_rank(sc.search_vector, plainto_tsquery('english', search_query))
        ELSE 0.0 END AS relevance_score
    FROM simpro_customers sc
    WHERE 
        -- Text search
        (search_query IS NULL OR search_query = '' OR sc.search_vector @@ plainto_tsquery('english', search_query))
        
        -- Service tier filter
        AND (service_tier_filter IS NULL OR sc.service_tier = service_tier_filter)
        
        -- Contract status filter
        AND (has_contracts_filter IS NULL OR sc.has_active_contracts = has_contracts_filter)
    
    ORDER BY 
        CASE WHEN search_query IS NOT NULL AND search_query != '' THEN relevance_score END DESC,
        sc.total_contract_value DESC,
        sc.company_name ASC
    
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for SimPro tables
COMMENT ON TABLE simpro_customers IS 'Reference customer data from SimPro for quick-fill and search functionality';
COMMENT ON TABLE simpro_customer_contracts IS 'Contract details from SimPro linked to customers';
COMMENT ON FUNCTION search_simpro_customers IS 'Full-text search function for SimPro customers with filtering options';
