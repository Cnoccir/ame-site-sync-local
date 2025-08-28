-- SimPro Data Population Migration
-- Generated automatically from CSV data
-- 2025-08-27T13:48:46.125Z

-- Statistics:
--   Customers: 0
--   Contracts: 0
--   Total Value: $0

-- Clear existing SimPro data (if any)
DELETE FROM simpro_customer_contracts;
DELETE FROM simpro_customers;

-- Insert SimPro Customers
INSERT INTO simpro_customers (
  id, simpro_customer_id, company_name, email, mailing_address, mailing_city, mailing_state, mailing_zip,
  labor_tax_code, part_tax_code, is_contract_customer, has_active_contracts, total_contract_value,
  active_contract_count, latest_contract_email, service_tier
) VALUES
;

-- Insert SimPro Customer Contracts
INSERT INTO simpro_customer_contracts (
  id, customer_id, contract_name, contract_number, contract_value, contract_status,
  start_date, end_date, contract_email, contract_notes
) VALUES
;

-- Update search vectors for all customers
UPDATE simpro_customers SET updated_at = NOW();

-- Verify data integrity
SELECT COUNT(*) as customer_count FROM simpro_customers;
SELECT COUNT(*) as contract_count FROM simpro_customer_contracts;
SELECT service_tier, COUNT(*) as count FROM simpro_customers GROUP BY service_tier;
