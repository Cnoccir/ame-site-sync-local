-- SQL queries to investigate database structure
-- Run these in your Supabase SQL Editor to understand which tables exist and are being used

-- 1. Check which AME customer tables exist
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_name LIKE '%ame_customer%' 
ORDER BY table_name;

-- 2. Check the structure of ame_customers table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ame_customers'
ORDER BY ordinal_position;

-- 3. Check the structure of ame_customers_normalized table (if it exists)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'ame_customers_normalized'
ORDER BY ordinal_position;

-- 4. Count records in each table
SELECT 
  'ame_customers' as table_name, 
  COUNT(*) as record_count 
FROM ame_customers
UNION ALL
SELECT 
  'ame_customers_normalized' as table_name, 
  COUNT(*) as record_count 
FROM ame_customers_normalized;

-- 5. Check if there are any views or functions that reference these tables
SELECT 
  routine_name,
  routine_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_definition LIKE '%ame_customer%';

-- 6. Check for any triggers on these tables
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers 
WHERE event_object_table LIKE '%ame_customer%';
