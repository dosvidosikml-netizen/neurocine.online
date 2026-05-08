-- =========================================================
-- NeuroCine v54 — Public UX + AI Key Vault + Access Guard
-- Run once in Supabase SQL Editor after deploying v54.
-- Safe additive migration. Does not delete users or projects.
-- =========================================================

-- 1) Profiles: fields used by PRO own-key access
alter table public.profiles
  add column if not exists api_keys_connected boolean default false;

alter table public.profiles
  add column if not exists api_key_status jsonb default '{}'::jsonb;

alter table public.profiles
  add column if not exists pro_api_note text default '';

-- 2) User API Key Vault. Stores encrypted keys only.
create table if not exists public.user_api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'openrouter',
  key_label text default 'OpenRouter',
  encrypted_key text not null,
  last4 text default '',
  is_active boolean default true,
  status jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, provider)
);

create index if not exists idx_user_api_keys_user_provider
  on public.user_api_keys(user_id, provider);

-- 3) RLS for API keys: user can manage only own encrypted records.
alter table public.user_api_keys enable row level security;

drop policy if exists "Users can view own user api keys" on public.user_api_keys;
create policy "Users can view own user api keys"
on public.user_api_keys for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own user api keys" on public.user_api_keys;
create policy "Users can insert own user api keys"
on public.user_api_keys for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own user api keys" on public.user_api_keys;
create policy "Users can update own user api keys"
on public.user_api_keys for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own user api keys" on public.user_api_keys;
create policy "Users can delete own user api keys"
on public.user_api_keys for delete
using (auth.uid() = user_id);

-- 4) Keep timestamps fresh.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_user_api_keys_updated_at on public.user_api_keys;
create trigger set_user_api_keys_updated_at
before update on public.user_api_keys
for each row execute function public.set_updated_at();

-- 5) IMPORTANT: protect billing/access columns from client-side self-upgrade.
-- Users may update profile cosmetic fields and api key status, but cannot turn themselves into PRO/ADMIN.
create or replace function public.protect_profile_access_fields()
returns trigger as $$
begin
  -- When an authenticated end-user writes their own profile through the public client,
  -- prevent client-side self-upgrade. SQL Editor/service role/admin migrations still work.
  if auth.uid() is not null then
    if tg_op = 'INSERT' and auth.uid() = new.id then
      new.plan = 'demo';
      new.role = 'user';
      new.default_mode = 'demo';
      new.monthly_generation_limit = coalesce(new.monthly_generation_limit, 10);
      new.generations_used = coalesce(new.generations_used, 0);
      new.cloud_project_limit = coalesce(new.cloud_project_limit, 3);
      new.cloud_projects_used = coalesce(new.cloud_projects_used, 0);
    elsif tg_op = 'UPDATE' and auth.uid() = old.id then
      new.plan = old.plan;
      new.role = old.role;
      new.default_mode = old.default_mode;
      new.monthly_generation_limit = old.monthly_generation_limit;
      new.generations_used = old.generations_used;
      new.cloud_project_limit = old.cloud_project_limit;
      new.cloud_projects_used = old.cloud_projects_used;
    end if;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists protect_profile_access_fields_v54 on public.profiles;
create trigger protect_profile_access_fields_v54
before insert or update on public.profiles
for each row execute function public.protect_profile_access_fields();

-- 6) Normalize current access model.
-- Owner stays internal full access.
update public.profiles
set
  plan = 'admin',
  role = 'admin',
  default_mode = 'live',
  monthly_generation_limit = 999999,
  cloud_project_limit = 999999,
  updated_at = now()
where lower(email) = lower('dosvidosikml@gmail.com');

-- Public users stay FREE/DEMO until you or payment webhook sets plan='pro'.
update public.profiles
set
  default_mode = 'demo',
  api_keys_connected = coalesce(api_keys_connected, false),
  api_key_status = coalesce(api_key_status, '{}'::jsonb),
  updated_at = now()
where coalesce(role, 'user') <> 'admin'
  and coalesce(plan, 'demo') <> 'admin'
  and lower(coalesce(email, '')) <> lower('dosvidosikml@gmail.com');

-- 7) Verification output.
select email, plan, role, default_mode, api_keys_connected, cloud_project_limit
from public.profiles
order by created_at desc;
