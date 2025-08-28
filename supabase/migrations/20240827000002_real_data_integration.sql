-- Migration: Real Data Integration & Enhanced CRUD Operations
-- This migration creates the enhanced customer and contract tables with proper relationships

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS customer_contracts CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- Create enhanced customers table
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- From CSV data
  legacy_customer_id INTEGER UNIQUE,
  company_name VARCHAR(255) NOT NULL,
  site_nickname VARCHAR(100),
  site_number VARCHAR(20) UNIQUE,
  
  -- Address information
  mailing_address TEXT,
  mailing_city VARCHAR(100),
  mailing_state VARCHAR(10),
  mailing_zip VARCHAR(20),
  
  -- Contact information
  primary_contact_email VARCHAR(255),
  primary_contact_name VARCHAR(100),
  primary_contact_phone VARCHAR(50),
  secondary_contact_email VARCHAR(255),
  secondary_contact_name VARCHAR(100),
  secondary_contact_phone VARCHAR(50),
  
  -- Service information  
  service_tier VARCHAR(20) DEFAULT 'CORE',
  system_platform VARCHAR(50),
  has_active_contracts BOOLEAN DEFAULT FALSE,
  total_contract_value DECIMAL(12,2) DEFAULT 0,
  
  -- Site intelligence
  primary_technician_id UUID REFERENCES auth.users(id),
  secondary_technician_id UUID REFERENCES auth.users(id),
  best_arrival_time VARCHAR(100),
  access_notes TEXT,
  site_hazards TEXT,
  special_instructions TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create customer contracts table
CREATE TABLE customer_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  
  -- From CSV data
  contract_name VARCHAR(255),
  contract_number VARCHAR(100),
  contract_value DECIMAL(12,2),
  contract_status VARCHAR(50),
  start_date DATE,
  end_date DATE,
  contract_email VARCHAR(255),
  contract_notes TEXT,
  
  -- Additional fields
  billing_frequency VARCHAR(50), -- Monthly, Quarterly, Annual
  service_hours_included INTEGER,
  emergency_coverage BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_customers_legacy_id ON customers(legacy_customer_id);
CREATE INDEX idx_customers_company_name ON customers(company_name);
CREATE INDEX idx_customers_site_number ON customers(site_number);
CREATE INDEX idx_customers_service_tier ON customers(service_tier);
CREATE INDEX idx_customers_has_active_contracts ON customers(has_active_contracts);
CREATE INDEX idx_contracts_customer_id ON customer_contracts(customer_id);
CREATE INDEX idx_contracts_status ON customer_contracts(contract_status);
CREATE INDEX idx_contracts_number ON customer_contracts(contract_number);

-- Create full-text search indexes
CREATE INDEX idx_customers_company_name_gin ON customers USING GIN(to_tsvector('english', company_name));
CREATE INDEX idx_customers_site_nickname_gin ON customers USING GIN(to_tsvector('english', site_nickname));

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update the updated_at column
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically update contract totals when contracts change
CREATE OR REPLACE FUNCTION update_customer_contract_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the customer's total contract value and active status
    UPDATE customers 
    SET 
        total_contract_value = (
            SELECT COALESCE(SUM(contract_value), 0)
            FROM customer_contracts 
            WHERE customer_id = COALESCE(NEW.customer_id, OLD.customer_id) 
            AND contract_status = 'Active'
        ),
        has_active_contracts = (
            SELECT COUNT(*) > 0
            FROM customer_contracts 
            WHERE customer_id = COALESCE(NEW.customer_id, OLD.customer_id) 
            AND contract_status = 'Active'
        )
    WHERE id = COALESCE(NEW.customer_id, OLD.customer_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Create triggers to automatically update contract totals
CREATE TRIGGER update_contract_totals_insert 
    AFTER INSERT ON customer_contracts
    FOR EACH ROW EXECUTE FUNCTION update_customer_contract_totals();

CREATE TRIGGER update_contract_totals_update 
    AFTER UPDATE ON customer_contracts
    FOR EACH ROW EXECUTE FUNCTION update_customer_contract_totals();

CREATE TRIGGER update_contract_totals_delete 
    AFTER DELETE ON customer_contracts
    FOR EACH ROW EXECUTE FUNCTION update_customer_contract_totals();

-- Create RLS policies for security
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_contracts ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all customer data
CREATE POLICY "Allow authenticated users to read customers" ON customers
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to read all contract data
CREATE POLICY "Allow authenticated users to read contracts" ON customer_contracts
    FOR SELECT TO authenticated USING (true);

-- Allow authenticated users to insert customer data
CREATE POLICY "Allow authenticated users to insert customers" ON customers
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to insert contract data
CREATE POLICY "Allow authenticated users to insert contracts" ON customer_contracts
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated users to update customer data
CREATE POLICY "Allow authenticated users to update customers" ON customers
    FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to update contract data
CREATE POLICY "Allow authenticated users to update contracts" ON customer_contracts
    FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to delete customer data
CREATE POLICY "Allow authenticated users to delete customers" ON customers
    FOR DELETE TO authenticated USING (true);

-- Allow authenticated users to delete contract data
CREATE POLICY "Allow authenticated users to delete contracts" ON customer_contracts
    FOR DELETE TO authenticated USING (true);

-- Create a view for easy customer data with contract summaries
CREATE VIEW customer_overview AS
SELECT 
    c.*,
    COUNT(cc.id) as total_contracts,
    COUNT(CASE WHEN cc.contract_status = 'Active' THEN 1 END) as active_contracts,
    COALESCE(SUM(CASE WHEN cc.contract_status = 'Active' THEN cc.contract_value END), 0) as calculated_contract_value
FROM customers c
LEFT JOIN customer_contracts cc ON c.id = cc.customer_id
GROUP BY c.id, c.legacy_customer_id, c.company_name, c.site_nickname, c.site_number, 
         c.mailing_address, c.mailing_city, c.mailing_state, c.mailing_zip,
         c.primary_contact_email, c.primary_contact_name, c.primary_contact_phone,
         c.secondary_contact_email, c.secondary_contact_name, c.secondary_contact_phone,
         c.service_tier, c.system_platform, c.has_active_contracts, c.total_contract_value,
         c.primary_technician_id, c.secondary_technician_id, c.best_arrival_time,
         c.access_notes, c.site_hazards, c.special_instructions,
         c.created_at, c.updated_at, c.created_by, c.updated_by;

-- Grant access to the view
GRANT SELECT ON customer_overview TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE customers IS 'Enhanced customer data with site intelligence and contract information';
COMMENT ON TABLE customer_contracts IS 'Contract details linked to customers with automatic total calculations';
COMMENT ON COLUMN customers.legacy_customer_id IS 'Original customer ID from CSV import for reference';
COMMENT ON COLUMN customers.site_number IS 'Unique site identifier in format SITE-XXXX';
COMMENT ON COLUMN customers.service_tier IS 'Automatically determined service level: CORE, ASSURE, or GUARDIAN';
COMMENT ON COLUMN customers.total_contract_value IS 'Automatically calculated total value of active contracts';
COMMENT ON COLUMN customers.has_active_contracts IS 'Automatically updated flag indicating if customer has active contracts';
