-- Align public.customers to support import scripts and sample data
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='legacy_customer_id') THEN
    ALTER TABLE public.customers ADD COLUMN legacy_customer_id integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='mailing_address') THEN
    ALTER TABLE public.customers ADD COLUMN mailing_address text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='mailing_city') THEN
    ALTER TABLE public.customers ADD COLUMN mailing_city varchar;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='mailing_state') THEN
    ALTER TABLE public.customers ADD COLUMN mailing_state varchar;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='mailing_zip') THEN
    ALTER TABLE public.customers ADD COLUMN mailing_zip varchar;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='primary_contact_email') THEN
    ALTER TABLE public.customers ADD COLUMN primary_contact_email varchar;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='service_tier') THEN
    ALTER TABLE public.customers ADD COLUMN service_tier varchar DEFAULT 'CORE';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='has_active_contracts') THEN
    ALTER TABLE public.customers ADD COLUMN has_active_contracts boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='total_contract_value') THEN
    ALTER TABLE public.customers ADD COLUMN total_contract_value numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='site_nickname') THEN
    ALTER TABLE public.customers ADD COLUMN site_nickname varchar;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='contract_number') THEN
    ALTER TABLE public.customers ADD COLUMN contract_number varchar;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='contract_status') THEN
    ALTER TABLE public.customers ADD COLUMN contract_status varchar;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='latest_contract_email') THEN
    ALTER TABLE public.customers ADD COLUMN latest_contract_email varchar;
  END IF;
  -- Ensure created_at/updated_at columns exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='created_at') THEN
    ALTER TABLE public.customers ADD COLUMN created_at timestamptz DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='customers' AND column_name='updated_at') THEN
    ALTER TABLE public.customers ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END$$;