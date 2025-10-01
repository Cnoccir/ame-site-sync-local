-- Link existing tech@ame-inc.com user to app tables without creating or modifying auth credentials
DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Only proceed if the user already exists in auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'tech@ame-inc.com' LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'tech@ame-inc.com not found in auth.users; skipping linkage. Use your existing auth screen to create the account or sign in first.';
    RETURN;
  END IF;

  -- Profiles
  INSERT INTO public.profiles(id, email, full_name)
  VALUES (v_user_id, 'tech@ame-inc.com', 'Tech User')
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, full_name = EXCLUDED.full_name, updated_at = now();

  -- User roles (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_roles'
  ) THEN
    INSERT INTO public.user_roles(user_id, role)
    VALUES (v_user_id, 'technician'::app_role)
    ON CONFLICT DO NOTHING;
  END IF;

  -- ame_employees link (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ame_employees'
  ) THEN
    INSERT INTO public.ame_employees(user_id, first_name, last_name, email, is_active, is_technician, employee_name)
    VALUES (v_user_id, 'Tech', 'User', 'tech@ame-inc.com', true, true, 'Tech User')
    ON CONFLICT (email) DO UPDATE SET user_id = EXCLUDED.user_id, is_active = true, is_technician = true, employee_name='Tech User', updated_at = now();
  END IF;
END$$;
