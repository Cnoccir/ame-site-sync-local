-- ===================================================================
-- IMPORT SIMPRO CUSTOMER DATA
-- Import cleaned customer data from CSV into simpro_customers table
-- ===================================================================

-- Clear existing data
TRUNCATE TABLE simpro_customers CASCADE;

-- Import SimPro customer data
-- Note: This will be populated by the script that reads the CSV file
-- The CSV structure is: simpro_customer_id,company_name,email,mailing_address,mailing_city,mailing_state,mailing_zip,labor_tax_code,part_tax_code,is_contract_customer,has_active_contracts,active_contract_count,total_contract_value,service_tier,latest_contract_email

-- Create a temporary function to import the data
CREATE OR REPLACE FUNCTION import_simpro_customers_from_csv()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    result_count INTEGER := 0;
BEGIN
    -- This function will be called by the import script
    -- For now, return a placeholder message
    RETURN 'Ready to import SimPro customers. Use the import script to populate data.';
END;
$$;

-- Add indexes for better performance during import
CREATE INDEX IF NOT EXISTS idx_simpro_customers_search_ready
ON simpro_customers USING GIN(search_vector)
WHERE search_vector IS NOT NULL;

-- Ensure search vector trigger is in place
DROP TRIGGER IF EXISTS update_simpro_customer_search_vector_trigger ON simpro_customers;
CREATE TRIGGER update_simpro_customer_search_vector_trigger
    BEFORE INSERT OR UPDATE ON simpro_customers
    FOR EACH ROW EXECUTE FUNCTION update_simpro_customer_search_vector();

COMMENT ON FUNCTION import_simpro_customers_from_csv() IS 'Placeholder function for CSV import process';