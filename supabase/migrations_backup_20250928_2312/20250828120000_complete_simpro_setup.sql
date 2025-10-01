-- Complete SimPro Setup: Tables and Data
-- This migration creates the SimPro tables and loads all the data

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.simpro_customer_contracts CASCADE;
DROP TABLE IF EXISTS public.simpro_customers CASCADE;

-- Create simpro_customers table
CREATE TABLE public.simpro_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simpro_customer_id TEXT NOT NULL UNIQUE,
    company_name TEXT NOT NULL,
    email TEXT,
    mailing_address TEXT,
    mailing_city TEXT,
    mailing_state TEXT,
    mailing_zip TEXT,
    is_contract_customer BOOLEAN DEFAULT false,
    has_active_contracts BOOLEAN DEFAULT false,
    active_contract_count INTEGER DEFAULT 0,
    total_contract_value DECIMAL(10,2) DEFAULT 0.00,
    service_tier TEXT DEFAULT 'CORE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create simpro_customer_contracts table
CREATE TABLE public.simpro_customer_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES simpro_customers(id) ON DELETE CASCADE,
    contract_name TEXT NOT NULL,
    contract_number TEXT,
    contract_value DECIMAL(10,2) DEFAULT 0.00,
    contract_status TEXT CHECK (contract_status IN ('active', 'expired', 'pending')),
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_simpro_customers_company_name ON simpro_customers(company_name);
CREATE INDEX idx_simpro_customers_service_tier ON simpro_customers(service_tier);
CREATE INDEX idx_simpro_customers_has_active_contracts ON simpro_customers(has_active_contracts);
CREATE INDEX idx_simpro_contracts_customer_id ON simpro_customer_contracts(customer_id);
CREATE INDEX idx_simpro_contracts_status ON simpro_customer_contracts(contract_status);
CREATE INDEX idx_simpro_contracts_end_date ON simpro_customer_contracts(end_date);

-- Enable RLS
ALTER TABLE simpro_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE simpro_customer_contracts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to read simpro_customers" ON simpro_customers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to read simpro_customer_contracts" ON simpro_customer_contracts
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service role full access to simpro_customers" ON simpro_customers
    FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Allow service role full access to simpro_customer_contracts" ON simpro_customer_contracts
    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Now insert the data (abbreviated for testing - we'll use the API for full data)
-- Insert a few sample customers to verify the tables work
INSERT INTO simpro_customers (
    simpro_customer_id, company_name, email, mailing_address, mailing_city, 
    mailing_state, mailing_zip, is_contract_customer, has_active_contracts,
    active_contract_count, total_contract_value, service_tier
) VALUES 
    ('5', '10 SULLIVAN STREET CONDOMINIUM', '', 'C/O SOLSTICE RESIDENTIAL GROUP LLC', 'NEW YORK', 'NY', '10004', true, true, 1, 5407.0, 'CORE'),
    ('961', '125 W 125TH STREET OFFICE OWNER LLC', '', '111 FIFTH AVENUE, 9TH FLOOR', 'NEW YORK', 'NY', '10003', true, true, 1, 24175.0, 'CORE'),
    ('385', 'LINCOLN CENTER FOR THE PERFORMING ARTS', '', '70 LINCOLN CENTER PLAZA', 'NEW YORK', 'NY', '10023', true, true, 4, 297614.75, 'GUARDIAN'),
    ('580', 'SOMERSET COUNTY', '', 'BOARD OF COUNTY COMMISSIONERS COUNTY ADMIN', 'SOMERVILLE', 'NJ', '08876-1262', true, true, 2, 585360.00, 'GUARDIAN'),
    ('49', 'AME INC', 'danny@ame-inc.com', '1275 BLOOMFIELD AVE', 'FAIRFIELD', 'NJ', '7004', false, true, 1, 10500.0, 'CORE');

-- Add sample contracts for these customers
WITH customer_ids AS (
    SELECT id, simpro_customer_id FROM simpro_customers 
    WHERE simpro_customer_id IN ('5', '961', '385', '580', '49')
)
INSERT INTO simpro_customer_contracts (
    customer_id, contract_name, contract_number, contract_value, contract_status, start_date, end_date
)
SELECT 
    ci.id,
    contract_name,
    contract_number,
    contract_value,
    contract_status,
    start_date::date,
    end_date::date
FROM customer_ids ci
JOIN (VALUES
    ('5', '10 SULLIVAN STREET - MAINTENANCE', 'SUL-2025-001', 5407.0, 'active', '2025-01-01', '2025-12-31'),
    ('961', '125 W 125TH STREET - MAINTENANCE', '125W-2024-001', 24175.0, 'active', '2024-09-01', '2025-08-31'),
    ('385', 'LINCOLN CENTER - MAINTENANCE', 'PO4933', 243090.0, 'active', '2024-09-01', '2025-08-31'),
    ('385', 'DAVID GEFFEN HALL - MAINTENANCE', 'DGH-2024', 81546.0, 'expired', '2023-08-01', '2024-07-31'),
    ('580', 'SOMERSET - MAINTENANCE', 'CC-0010-23', 436320.0, 'active', '2023-09-01', '2026-08-31'),
    ('580', 'SOMERSET - MAINTENANCE', 'CC-0010-20', 149040.0, 'expired', '2020-09-01', '2023-08-31'),
    ('49', 'AME INC - TEST CONTRACT', 'AME-2025-001', 10500.0, 'active', '2025-01-01', '2025-12-31')
) AS contracts(simpro_id, contract_name, contract_number, contract_value, contract_status, start_date, end_date)
ON ci.simpro_customer_id = contracts.simpro_id;

-- Add table comments
COMMENT ON TABLE simpro_customers IS 'SimPro customer data with contract information';
COMMENT ON TABLE simpro_customer_contracts IS 'SimPro customer contracts linked to customers';
COMMENT ON COLUMN simpro_customers.service_tier IS 'Service tier: CORE (<100k), ASSURE (100k-250k), GUARDIAN (>250k)';

-- Verify the data was inserted
DO $$
DECLARE
    customer_count INTEGER;
    contract_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO customer_count FROM simpro_customers;
    SELECT COUNT(*) INTO contract_count FROM simpro_customer_contracts;
    
    RAISE NOTICE 'SimPro data loaded: % customers, % contracts', customer_count, contract_count;
END $$;
