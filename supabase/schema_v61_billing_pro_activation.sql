-- =========================================================
-- NeuroCine v61 — Payments / PRO activation foundation
-- Safe additive migration. Run once after deploying v61.
-- Does not delete users, projects, keys or existing profiles.
-- =========================================================

-- 1) Profile billing fields
alter table public.profiles
  add column if not exists billing_status text default 'none';

alter table public.profiles
  add column if not exists billing_provider text default '';

alter table public.profiles
  add column if not exists billing_customer_id text default '';

alter table public.profiles
  add column if not exists billing_subscription_id text default '';

alter table public.profiles
  add column if not exists pro_activated_at timestamptz null;

alter table public.profiles
  add column if not exists pro_expires_at timestamptz null;

-- 2) Billing event ledger
create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text default '',
  provider text default 'manual',
  provider_event_id text default '',
  event_type text not null default 'unknown',
  status text not null default 'pending',
  plan text not null default 'pro',
  amount numeric null,
  currency text default 'USD',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_billing_events_user_created
  on public.billing_events(user_id, created_at desc);

create index if not exists idx_billing_events_email_created
  on public.billing_events(lower(email), created_at desc);

create index if not exists idx_billing_events_provider_event
  on public.billing_events(provider, provider_event_id);

alter table public.billing_events enable row level security;

drop policy if exists "Users can view own billing events" on public.billing_events;
create policy "Users can view own billing events"
on public.billing_events for select
using (auth.uid() = user_id);

-- 3) Subscription table for future payment provider webhooks
create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text default '',
  provider text not null default 'manual',
  provider_customer_id text default '',
  provider_subscription_id text default '',
  status text not null default 'active',
  plan text not null default 'pro',
  activated_at timestamptz default now(),
  current_period_end timestamptz null,
  canceled_at timestamptz null,
  raw_payload jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(provider, provider_subscription_id)
);

create index if not exists idx_billing_subscriptions_user_status
  on public.billing_subscriptions(user_id, status);

alter table public.billing_subscriptions enable row level security;

drop policy if exists "Users can view own billing subscriptions" on public.billing_subscriptions;
create policy "Users can view own billing subscriptions"
on public.billing_subscriptions for select
using (auth.uid() = user_id);

-- 4) Owner stays OWNER; PRO/demo users keep their current plans.
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

update public.profiles
set
  billing_status = case
    when plan = 'pro' then coalesce(nullif(billing_status, ''), 'manual_pro')
    else coalesce(nullif(billing_status, ''), 'none')
  end,
  default_mode = case when plan = 'pro' then 'live' else 'demo' end,
  cloud_project_limit = case when plan = 'pro' then greatest(coalesce(cloud_project_limit, 100), 100) else coalesce(cloud_project_limit, 3) end,
  updated_at = now()
where lower(coalesce(email, '')) <> lower('dosvidosikml@gmail.com')
  and coalesce(role, 'user') <> 'admin';

-- 5) Verification
select email, plan, role, default_mode, billing_status, billing_provider, cloud_project_limit
from public.profiles
order by created_at desc;
