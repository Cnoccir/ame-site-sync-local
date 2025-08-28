SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'ame_customers' 
AND column_name IN ('site_nickname', 'system_architecture', 'primary_bas_platform', 'customer_id', 'company_name') 
ORDER BY column_name;
