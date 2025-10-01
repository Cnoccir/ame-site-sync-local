-- Phase 1 normalized tables and customer detail normalization + reference tables
create extension if not exists pgcrypto;

-- =====================
-- Reference tables
-- =====================
create table if not exists public.ref_service_tiers (
  value text primary key
);

create table if not exists public.ref_access_methods (
  value text primary key
);

create table if not exists public.ref_ppe_options (
  value text primary key
);

create table if not exists public.ref_hazard_options (
  value text primary key
);

create table if not exists public.ref_contact_roles (
  value text primary key
);

create table if not exists public.ref_bas_platforms (
  value text primary key
);

create table if not exists public.ref_network_methods (
  value text primary key
);

insert into public.ref_service_tiers(value) values
  ('CORE'),('ASSURE'),('GUARDIAN') on conflict do nothing;

insert into public.ref_access_methods(value) values
  ('Key/Lock Box'),('Card/Badge'),('Security Guard'),('Tenant Escort'),('Property Manager'),('Code/Keypad'),('Remote Unlock'),('Front Desk'),('Pre-Scheduled'),('24/7 Access'),('Business Hours Only'),('Appointment Required'),('Multiple Methods'),('Variable/Seasonal'),('Other') on conflict do nothing;

insert into public.ref_ppe_options(value) values
  ('Safety Glasses'),('Gloves'),('Hard Hat'),('Hearing Protection'),('Steel Toe Boots'),('Hi-Vis Vest') on conflict do nothing;

insert into public.ref_hazard_options(value) values
  ('Electrical'),('Confined Space'),('Fall Risk'),('Chemical'),('Hot Surface'),('Other') on conflict do nothing;

insert into public.ref_contact_roles(value) values
  ('Primary Contact'),('Technical Contact'),('Billing Contact'),('Security'),('Emergency') on conflict do nothing;

insert into public.ref_bas_platforms(value) values
  ('Niagara'),('JCI'),('Honeywell'),('Schneider'),('Siemens'),('Delta'),('Mixed'),('Other') on conflict do nothing;

insert into public.ref_network_methods(value) values
  ('LAN'),('VLAN'),('VPN'),('Cellular'),('Wireless'),('Serial'),('Other') on conflict do nothing;

-- =====================
-- Customer normalization (master data)
-- =====================
create table if not exists public.customer_contacts (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.ame_customers(id) on delete cascade,
  name text,
  phone text,
  email text,
  role text references public.ref_contact_roles(value),
  is_primary boolean default false,
  is_emergency boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_customer_contacts_customer on public.customer_contacts(customer_id);

create table if not exists public.customer_access (
  customer_id uuid primary key references public.ame_customers(id) on delete cascade,
  access_method text references public.ref_access_methods(value),
  parking_instructions text,
  badge_required boolean,
  escort_required boolean,
  special_instructions text,
  best_arrival_time text,
  updated_at timestamptz default now()
);

create table if not exists public.customer_safety (
  customer_id uuid primary key references public.ame_customers(id) on delete cascade,
  required_ppe jsonb default '[]',
  known_hazards jsonb default '[]',
  safety_contact_name text,
  safety_contact_phone text,
  safety_notes text,
  updated_at timestamptz default now()
);

create table if not exists public.customer_team (
  customer_id uuid primary key references public.ame_customers(id) on delete cascade,
  primary_technician_id uuid,
  primary_technician_name text,
  primary_technician_phone text,
  primary_technician_email text,
  secondary_technician_id uuid,
  secondary_technician_name text,
  secondary_technician_phone text,
  secondary_technician_email text,
  account_manager_id uuid,
  account_manager_name text,
  account_manager_phone text,
  account_manager_email text,
  updated_at timestamptz default now()
);

create table if not exists public.customer_credentials (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.ame_customers(id) on delete cascade,
  credential_type text check (credential_type in ('bms','windows','service','remote_access','vpn')),
  vendor text,
  system_name text,
  credential_data jsonb not null,
  created_by uuid,
  last_verified timestamptz,
  expires_at timestamptz,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_customer_credentials_customer on public.customer_credentials(customer_id);

-- Ensure ame_customers has simpro linkage
alter table public.ame_customers add column if not exists simpro_customer_id text;

-- =====================
-- Phase 1 normalized snapshot per session
-- =====================
create table if not exists public.pm_phase1_customer (
  session_id uuid primary key references public.pm_workflow_sessions(id) on delete cascade,
  company_name text,
  site_name text,
  address text,
  service_tier text references public.ref_service_tiers(value),
  contract_number text,
  account_manager_id uuid,
  account_manager_name text,
  account_manager_phone text,
  account_manager_email text,
  simpro_customer_id text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pm_phase1_contacts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.pm_workflow_sessions(id) on delete cascade,
  name text,
  phone text,
  email text,
  role text references public.ref_contact_roles(value),
  is_primary boolean default false,
  is_emergency boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_pm1_contacts_session on public.pm_phase1_contacts(session_id);

create table if not exists public.pm_phase1_access (
  session_id uuid primary key references public.pm_workflow_sessions(id) on delete cascade,
  access_method text references public.ref_access_methods(value),
  parking_instructions text,
  badge_required boolean,
  escort_required boolean,
  special_instructions text,
  best_arrival_time text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pm_phase1_safety (
  session_id uuid primary key references public.pm_workflow_sessions(id) on delete cascade,
  required_ppe jsonb default '[]',
  known_hazards jsonb default '[]',
  safety_contact_name text,
  safety_contact_phone text,
  safety_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pm_phase1_team (
  session_id uuid primary key references public.pm_workflow_sessions(id) on delete cascade,
  primary_technician_id uuid,
  primary_technician_name text,
  primary_technician_phone text,
  primary_technician_email text,
  secondary_technician_id uuid,
  secondary_technician_name text,
  secondary_technician_phone text,
  secondary_technician_email text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
