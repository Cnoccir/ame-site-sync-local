-- SimPro Tables Creation Script
-- Created: 2025-08-27
-- Description: Creates the core SimPro customer and contract tables

-- ============================================================================
-- SIMPRO CUSTOMERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS simpro_customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simpro_customer_id VARCHAR(20) UNIQUE,
    company_name VARCHAR(500) NOT NULL,
    email VARCHAR(255),
    mailing_address VARCHAR(500),
    mailing_city VARCHAR(100),
    mailing_state VARCHAR(10),
    mailing_zip VARCHAR(20),
    labor_tax_code VARCHAR(100),
    part_tax_code VARCHAR(100),
    is_contract_customer BOOLEAN DEFAULT false,
    has_active_contracts BOOLEAN DEFAULT false,
    total_contract_value NUMERIC(12,2) DEFAULT 0,
    active_contract_count INTEGER DEFAULT 0,
    latest_contract_email VARCHAR(255),
    service_tier VARCHAR(20) DEFAULT 'CORE' CHECK (service_tier IN ('CORE', 'ASSURE', 'GUARDIAN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SIMPRO CUSTOMER CONTRACTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS simpro_customer_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES simpro_customers(id) ON DELETE CASCADE,
    contract_name VARCHAR(500) NOT NULL,
    contract_number VARCHAR(100),
    contract_value NUMERIC(12,2) DEFAULT 0,
    contract_status VARCHAR(20) DEFAULT 'Active' CHECK (contract_status IN ('Active', 'Expired', 'Pending', 'Cancelled')),
    start_date DATE,
    end_date DATE,
    contract_email VARCHAR(255),
    contract_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Customer indexes
CREATE INDEX IF NOT EXISTS idx_simpro_customers_simpro_id ON simpro_customers(simpro_customer_id);
CREATE INDEX IF NOT EXISTS idx_simpro_customers_company_name ON simpro_customers(company_name);
CREATE INDEX IF NOT EXISTS idx_simpro_customers_email ON simpro_customers(email);
CREATE INDEX IF NOT EXISTS idx_simpro_customers_service_tier ON simpro_customers(service_tier);
CREATE INDEX IF NOT EXISTS idx_simpro_customers_has_active ON simpro_customers(has_active_contracts);
CREATE INDEX IF NOT EXISTS idx_simpro_customers_is_contract ON simpro_customers(is_contract_customer);

-- Contract indexes
CREATE INDEX IF NOT EXISTS idx_simpro_contracts_customer_id ON simpro_customer_contracts(customer_id);
CREATE INDEX IF NOT EXISTS idx_simpro_contracts_contract_number ON simpro_customer_contracts(contract_number);
CREATE INDEX IF NOT EXISTS idx_simpro_contracts_status ON simpro_customer_contracts(contract_status);
CREATE INDEX IF NOT EXISTS idx_simpro_contracts_start_date ON simpro_customer_contracts(start_date);
CREATE INDEX IF NOT EXISTS idx_simpro_contracts_end_date ON simpro_customer_contracts(end_date);
CREATE INDEX IF NOT EXISTS idx_simpro_contracts_value ON simpro_customer_contracts(contract_value);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- ============================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for customers table
DROP TRIGGER IF EXISTS update_simpro_customers_updated_at ON simpro_customers;
CREATE TRIGGER update_simpro_customers_updated_at
    BEFORE UPDATE ON simpro_customers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for contracts table
DROP TRIGGER IF EXISTS update_simpro_contracts_updated_at ON simpro_customer_contracts;
CREATE TRIGGER update_simpro_contracts_updated_at
    BEFORE UPDATE ON simpro_customer_contracts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE simpro_customers IS 'Main customers table for SimPro integration containing customer master data';
COMMENT ON TABLE simpro_customer_contracts IS 'Customer contracts table linking to customers with contract details';

COMMENT ON COLUMN simpro_customers.service_tier IS 'Customer service tier: CORE (<$100K), ASSURE (≥$100K), GUARDIAN (≥$250K)';
COMMENT ON COLUMN simpro_customers.total_contract_value IS 'Total value of all contracts for this customer';
COMMENT ON COLUMN simpro_customers.active_contract_count IS 'Number of currently active contracts';

COMMENT ON COLUMN simpro_customer_contracts.contract_status IS 'Contract status: Active, Expired, Pending, or Cancelled';
COMMENT ON COLUMN simpro_customer_contracts.contract_value IS 'Total value of this individual contract';

-- ============================================================================
-- TABLE CREATION COMPLETION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'SimPro Tables Created Successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables Created:';
    RAISE NOTICE '  ✓ simpro_customers';
    RAISE NOTICE '  ✓ simpro_customer_contracts';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Indexes Created: 12 total';
    RAISE NOTICE 'Triggers Created: 2 total';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Schema ready for data population!';
    RAISE NOTICE 'Created at: %', NOW();
    RAISE NOTICE '========================================';
END $$;
