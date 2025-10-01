-- Approve/verify the pending user accounts
UPDATE auth.users 
SET email_confirmed_at = NOW(),
    updated_at = NOW()
WHERE email IN ('admin@ame-inc.com', 'tech@ame-inc.com')
  AND email_confirmed_at IS NULL;

-- Insert profiles for these users if they don't exist
INSERT INTO public.profiles (id, email, full_name)
SELECT 
  id,
  email,
  CASE 
    WHEN email = 'admin@ame-inc.com' THEN 'Admin User'
    WHEN email = 'tech@ame-inc.com' THEN 'Technician User'
  END as full_name
FROM auth.users 
WHERE email IN ('admin@ame-inc.com', 'tech@ame-inc.com')
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- Insert user roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
  u.id,
  CASE 
    WHEN u.email = 'admin@ame-inc.com' THEN 'admin'::app_role
    WHEN u.email = 'tech@ame-inc.com' THEN 'technician'::app_role
  END as role
FROM auth.users u
WHERE u.email IN ('admin@ame-inc.com', 'tech@ame-inc.com')
ON CONFLICT (user_id, role) DO NOTHING;