create or replace view public.technician_directory as
select id, employee_name as name, email, mobile_phone, is_technician
from public.ame_employees
where coalesce(is_technician, false) = true;