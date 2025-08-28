-- SimPro Data Population Migration (Updated)
-- Generated from processed CSV data on 2025-08-27
-- 
-- Statistics:
--   Total Customers: 698
--   Active Customers: 186  
--   Total Contracts: 534
--   Active Contracts: 219
--   Total Contract Value: $6,072,093.43
--   Service Tiers:
--     🏛️ GUARDIAN: 4 customers (≥$250K)
--     🔷 ASSURE: 8 customers (≥$100K) 
--     ⚡ CORE: 686 customers (< $100K)

-- Clear existing SimPro data (if any)
DELETE FROM simpro_customer_contracts;
DELETE FROM simpro_customers;

-- Reset sequences
SELECT setval(pg_get_serial_sequence('simpro_customers', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('simpro_customer_contracts', 'id'), 1, false);

-- Insert processed SimPro data from our generated migration file
-- Note: The actual INSERT statements are in the generated simpro_data_migration_20250827.sql file
-- Copy the contents of that file here for the actual data population

-- Placeholder comment: INSERT STATEMENTS GO HERE
-- To complete this migration:
-- 1. Copy the content from simpro_data_migration_20250827.sql
-- 2. Replace this comment with the actual INSERT statements
-- 3. Run the migration

-- Verify data integrity after insertion
DO $$
DECLARE
    customer_count INTEGER;
    contract_count INTEGER;
    active_customer_count INTEGER;
    active_contract_count INTEGER;
    total_value DECIMAL(12,2);
BEGIN
    SELECT COUNT(*) INTO customer_count FROM simpro_customers;
    SELECT COUNT(*) INTO contract_count FROM simpro_customer_contracts;
    SELECT COUNT(*) INTO active_customer_count FROM simpro_customers WHERE has_active_contracts = true;
    SELECT COUNT(*) INTO active_contract_count FROM simpro_customer_contracts WHERE contract_status = 'Active';
    SELECT COALESCE(SUM(total_contract_value), 0) INTO total_value FROM simpro_customers;
    
    RAISE NOTICE 'SimPro Data Migration Completed:';
    RAISE NOTICE '  Total Customers: %', customer_count;
    RAISE NOTICE '  Active Customers: %', active_customer_count;
    RAISE NOTICE '  Total Contracts: %', contract_count;
    RAISE NOTICE '  Active Contracts: %', active_contract_count;
    RAISE NOTICE '  Total Contract Value: $%', total_value;
    
    -- Validate expected counts
    IF customer_count != 698 THEN
        RAISE WARNING 'Expected 698 customers, got %', customer_count;
    END IF;
    
    IF contract_count != 534 THEN
        RAISE WARNING 'Expected 534 contracts, got %', contract_count;
    END IF;
END $$;

-- Update search vectors and metadata
UPDATE simpro_customers SET 
    updated_at = NOW(),
    search_vector = to_tsvector('english', 
        COALESCE(company_name, '') || ' ' ||
        COALESCE(simpro_customer_id, '') || ' ' ||
        COALESCE(email, '') || ' ' ||
        COALESCE(mailing_city, '') || ' ' ||
        COALESCE(mailing_state, '')
    );

-- Create summary view for reporting
DO $$
BEGIN
    -- Drop view if it exists
    DROP VIEW IF EXISTS simpro_customer_summary;
    
    -- Create summary view
    CREATE VIEW simpro_customer_summary AS
    SELECT 
        sc.id,
        sc.company_name,
        sc.service_tier,
        sc.has_active_contracts,
        sc.total_contract_value,
        sc.active_contract_count,
        COUNT(scc.id) as total_contracts,
        COALESCE(sc.email, sc.latest_contract_email) as contact_email,
        sc.mailing_city || ', ' || sc.mailing_state as location
    FROM simpro_customers sc
    LEFT JOIN simpro_customer_contracts scc ON sc.id = scc.customer_id
    GROUP BY sc.id, sc.company_name, sc.service_tier, sc.has_active_contracts, 
             sc.total_contract_value, sc.active_contract_count, sc.email, 
             sc.latest_contract_email, sc.mailing_city, sc.mailing_state;
END $$;

-- Grant necessary permissions
GRANT SELECT ON simpro_customers TO authenticated;
GRANT SELECT ON simpro_customer_contracts TO authenticated;
GRANT SELECT ON simpro_customer_summary TO authenticated;
