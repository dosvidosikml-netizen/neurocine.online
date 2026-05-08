-- =========================================================
-- NeuroCine v53 — PRO Own Keys model
-- Safe additive migration. Run once in Supabase SQL Editor.
-- =========================================================

alter table public.profiles
  add column if not exists api_keys_connected boolean default false;

alter table public.profiles
  add column if not exists api_key_status jsonb default '{}'::jsonb;

alter table public.profiles
  add column if not exists pro_api_note text default '';

-- Normalize public users: demo/free stay DEMO by default.
update public.profiles
set
  default_mode = 'demo',
  updated_at = now()
where coalesce(role, 'user') <> 'admin'
  and coalesce(plan, 'demo') <> 'admin'
  and lower(coalesce(email, '')) <> lower('dosvidosikml@gmail.com')
  and (default_mode is null or default_mode <> 'demo');

-- OWNER stays platform LIVE.
update public.profiles
set
  plan = 'admin',
  role = 'admin',
  default_mode = 'live',
  monthly_generation_limit = 999999,
  cloud_project_limit = 999999,
  updated_at = now()
where lower(email) = lower('dosvidosikml@gmail.com');

select email, plan, role, default_mode, api_keys_connected, cloud_project_limit
from public.profiles
order by created_at desc;
