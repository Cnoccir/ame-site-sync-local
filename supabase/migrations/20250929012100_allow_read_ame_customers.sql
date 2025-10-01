-- Allow read of ame_customers in local/dev (demo mode)
alter table if exists public.ame_customers enable row level security;

grant select on table public.ame_customers to anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ame_customers'
      AND policyname = 'read_ame_customers_authenticated'
  ) THEN
    EXECUTE 'create policy read_ame_customers_authenticated on public.ame_customers for select to authenticated using (true);';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ame_customers'
      AND policyname = 'read_ame_customers_anon'
  ) THEN
    EXECUTE 'create policy read_ame_customers_anon on public.ame_customers for select to anon using (true);';
  END IF;
END
$$;