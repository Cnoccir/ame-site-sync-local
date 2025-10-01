-- ===================================================================
-- DROP ALL EXISTING TABLES TO START FRESH
-- ===================================================================

-- Drop views first to avoid dependency issues
DROP VIEW IF EXISTS customer_overview CASCADE;

-- Drop all existing tables
DROP TABLE IF EXISTS ame_visit_sessions CASCADE;
DROP TABLE IF EXISTS customer_contracts CASCADE;
DROP TABLE IF EXISTS customer_drive_folders CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS drive_file_index CASCADE;
DROP TABLE IF EXISTS simpro_customer_contracts CASCADE;
DROP TABLE IF EXISTS simpro_customers CASCADE;

-- Drop reference tables
DROP TABLE IF EXISTS access_methods CASCADE;
DROP TABLE IF EXISTS bas_platforms CASCADE;
DROP TABLE IF EXISTS building_types CASCADE;
DROP TABLE IF EXISTS contact_roles CASCADE;
DROP TABLE IF EXISTS service_frequencies CASCADE;
DROP TABLE IF EXISTS system_architectures CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS cleanup_expired_visits() CASCADE;
DROP FUNCTION IF EXISTS cleanup_old_indexed_files(integer) CASCADE;
DROP FUNCTION IF EXISTS generate_visit_id() CASCADE;
DROP FUNCTION IF EXISTS get_customer_folder_stats(uuid) CASCADE;
DROP FUNCTION IF EXISTS search_drive_files(text, text[], text[], integer, integer) CASCADE;
DROP FUNCTION IF EXISTS search_simpro_customers(text, text, boolean, integer) CASCADE;
DROP FUNCTION IF EXISTS update_customer_contract_totals() CASCADE;
DROP FUNCTION IF EXISTS update_drive_file_search_vector() CASCADE;
DROP FUNCTION IF EXISTS update_simpro_customer_search_vector() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_visit_last_activity() CASCADE;

-- Drop any remaining sequences or types
DROP SEQUENCE IF EXISTS customer_sequence CASCADE;

-- Clean slate for new schema