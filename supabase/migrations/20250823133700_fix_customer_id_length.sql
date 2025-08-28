-- Fix customer_id column length in ame_customers table
-- The original migration created it as VARCHAR(10) but we need it to be longer
-- for the AME-YYYY-### format

-- Increase the length of customer_id column to accommodate AME-YYYY-### format
ALTER TABLE ame_customers ALTER COLUMN customer_id TYPE VARCHAR(50);
