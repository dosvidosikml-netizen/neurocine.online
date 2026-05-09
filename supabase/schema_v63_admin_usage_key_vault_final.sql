-- =========================================================
-- NeuroCine v63 — Admin + Usage + Key Vault Final Check
-- Safe additive migration. Run once after deploying v63.
-- Does not delete users, projects, keys or billing records.
-- =========================================================

-- 1) Usage events: make existing table robust for admin analytics.
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now()
);

alter table public.usage_events
  add column if not exists user_id uuid references auth.users(id) on delete set null;

alter table public.usage_events
  add column if not exists email text default '';

alter table public.usage_events
  add column if not exists plan text default '';

alter table public.usage_events
  add column if not exists role text default '';

alter table public.usage_events
  add column if not exists endpoint text default '';

alter table public.usage_events
  add column if not exists mode text default 'unknown';

alter table public.usage_events
  add column if not exists api_source text default 'none';

alter table public.usage_events
  add column if not exists model_used text default '';

alter table public.usage_events
  add column if not exists success boolean default true;

alter table public.usage_events
  add column if not exists error text default '';

alter table public.usage_events
  add column if not exists project_id uuid null;

alter table public.usage_events
  add column if not exists duration_ms integer null;

alter table public.usage_events
  add column if not exists metadata jsonb default '{}'::jsonb;

alter table public.usage_events
  add column if not exists created_at timestamptz default now();

create index if not exists idx_usage_events_user_created
  on public.usage_events(user_id, created_at desc);

create index if not exists idx_usage_events_email_created
  on public.usage_events(lower(email), created_at desc);

create index if not exists idx_usage_events_endpoint_created
  on public.usage_events(endpoint, created_at desc);

create index if not exists idx_usage_events_api_source_created
  on public.usage_events(api_source, created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "Users can view own usage events" on public.usage_events;
create policy "Users can view own usage events"
on public.usage_events for select
using (auth.uid() = user_id);

-- 2) Make sure Key Vault/profile columns exist.
alter table public.profiles
  add column if not exists api_keys_connected boolean default false;

alter table public.profiles
  add column if not exists api_key_status jsonb default '{}'::jsonb;

alter table public.profiles
  add column if not exists billing_status text default 'none';

alter table public.profiles
  add column if not exists billing_provider text default '';

alter table public.profiles
  add column if not exists pro_activated_at timestamptz null;

alter table public.profiles
  add column if not exists pro_expires_at timestamptz null;

-- 3) OWNER remains safe.
update public.profiles
set
  plan = 'admin',
  role = 'admin',
  default_mode = 'live',
  monthly_generation_limit = 999999,
  cloud_project_limit = 999999,
  billing_status = 'owner_bypass',
  billing_provider = 'platform',
  updated_at = now()
where lower(email) = lower('dosvidosikml@gmail.com');

-- 4) Verification output.
select email, plan, role, default_mode, api_keys_connected, billing_status, cloud_project_limit
from public.profiles
order by created_at desc;
