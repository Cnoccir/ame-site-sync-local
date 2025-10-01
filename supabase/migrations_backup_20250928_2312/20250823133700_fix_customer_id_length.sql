-- Fix customer_id column length in ame_customers table
-- The original migration created it as VARCHAR(10) but we need it to be longer
-- for the AME-YYYY-### format

-- Increase the length of customer_id column to accommodate AME-YYYY-### format
-- Only if the table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ame_customers') THEN
        ALTER TABLE ame_customers ALTER COLUMN customer_id TYPE VARCHAR(50);
    END IF;
END $$;
