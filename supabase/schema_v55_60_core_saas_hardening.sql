-- =========================================================
-- NeuroCine v55–v60 — Core SaaS Hardening
-- Safe additive migration. Run once after deploying the zip.
-- Does not delete users, projects or API keys.
-- =========================================================

-- Profiles: keep access fields present.
alter table public.profiles
  add column if not exists api_keys_connected boolean default false;

alter table public.profiles
  add column if not exists api_key_status jsonb default '{}'::jsonb;

alter table public.profiles
  add column if not exists pro_api_note text default '';

alter table public.profiles
  add column if not exists generations_used integer default 0;

alter table public.profiles
  add column if not exists cloud_projects_used integer default 0;

-- Projects: fields used by Cloud Project Manager + Production Pack Cloud Save.
alter table public.projects
  add column if not exists production_pack_cache jsonb default '{}'::jsonb;

alter table public.projects
  add column if not exists snapshot jsonb;

alter table public.projects
  add column if not exists data jsonb;

alter table public.projects
  add column if not exists topic text default '';

alter table public.projects
  add column if not exists title text default '';

create index if not exists idx_projects_user_updated
  on public.projects(user_id, updated_at desc);

create index if not exists idx_projects_user_created
  on public.projects(user_id, created_at desc);

-- Optional usage ledger for future analytics/admin panel.
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  endpoint text not null default '',
  mode text not null default 'unknown',
  api_source text not null default 'none',
  model_used text default '',
  success boolean default true,
  error text default '',
  project_id uuid null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_usage_events_user_created
  on public.usage_events(user_id, created_at desc);

create index if not exists idx_usage_events_endpoint_created
  on public.usage_events(endpoint, created_at desc);

alter table public.usage_events enable row level security;

drop policy if exists "Users can view own usage events" on public.usage_events;
create policy "Users can view own usage events"
on public.usage_events for select
using (auth.uid() = user_id);

-- Normalize owner and public users again, safely.
update public.profiles
set
  plan = 'admin',
  role = 'admin',
  default_mode = 'live',
  monthly_generation_limit = 999999,
  cloud_project_limit = 999999,
  updated_at = now()
where lower(email) = lower('dosvidosikml@gmail.com');

update public.profiles
set
  default_mode = case when plan = 'pro' then 'live' else 'demo' end,
  cloud_project_limit = case when plan = 'pro' then greatest(coalesce(cloud_project_limit, 100), 100) else coalesce(cloud_project_limit, 3) end,
  updated_at = now()
where lower(coalesce(email, '')) <> lower('dosvidosikml@gmail.com')
  and coalesce(role, 'user') <> 'admin';

select email, plan, role, default_mode, api_keys_connected, cloud_project_limit
from public.profiles
order by created_at desc;
