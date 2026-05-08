-- NeuroCine V44 — FULL Supabase schema
-- Safe to run multiple times. It DOES NOT delete user data.
-- Covers: profiles, projects, user_settings, usage_events, api_keys, triggers, RLS policies.

create extension if not exists "pgcrypto";

-- =========================
-- PROFILES
-- =========================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  plan text default 'free',
  role text default 'user',
  default_mode text default 'demo',
  monthly_generation_limit integer default 10,
  generations_used integer default 0,
  cloud_project_limit integer default 3,
  cloud_projects_used integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists plan text default 'free';
alter table public.profiles add column if not exists role text default 'user';
alter table public.profiles add column if not exists default_mode text default 'demo';
alter table public.profiles add column if not exists monthly_generation_limit integer default 10;
alter table public.profiles add column if not exists generations_used integer default 0;
alter table public.profiles add column if not exists cloud_project_limit integer default 3;
alter table public.profiles add column if not exists cloud_projects_used integer default 0;
alter table public.profiles add column if not exists created_at timestamptz default now();
alter table public.profiles add column if not exists updated_at timestamptz default now();

-- Normalize older rows without overwriting existing values.
update public.profiles set plan = coalesce(plan, 'free');
update public.profiles set role = coalesce(role, 'user');
update public.profiles set default_mode = coalesce(default_mode, 'demo');
update public.profiles set monthly_generation_limit = coalesce(monthly_generation_limit, 10);
update public.profiles set generations_used = coalesce(generations_used, 0);
update public.profiles set cloud_project_limit = coalesce(cloud_project_limit, 3);
update public.profiles set cloud_projects_used = coalesce(cloud_projects_used, 0);
update public.profiles set created_at = coalesce(created_at, now());
update public.profiles set updated_at = coalesce(updated_at, now());

-- =========================
-- PROJECTS
-- =========================
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text default 'NeuroCine Project',
  title text default 'NeuroCine Project',
  topic text,
  script text,
  duration integer default 60,
  aspect_ratio text default '9:16',
  project_type text default 'film',
  style_preset text default 'cinematic',
  tone text default 'cinematic documentary thriller',
  mode text default 'safe',
  target text default 'veo3',
  storyboard jsonb default null,
  settings jsonb not null default '{}'::jsonb,
  snapshot jsonb not null default '{}'::jsonb,
  data jsonb not null default '{}'::jsonb,
  production_pack_cache jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.projects add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.projects add column if not exists name text default 'NeuroCine Project';
alter table public.projects add column if not exists title text default 'NeuroCine Project';
alter table public.projects add column if not exists topic text;
alter table public.projects add column if not exists script text;
alter table public.projects add column if not exists duration integer default 60;
alter table public.projects add column if not exists aspect_ratio text default '9:16';
alter table public.projects add column if not exists project_type text default 'film';
alter table public.projects add column if not exists style_preset text default 'cinematic';
alter table public.projects add column if not exists tone text default 'cinematic documentary thriller';
alter table public.projects add column if not exists mode text default 'safe';
alter table public.projects add column if not exists target text default 'veo3';
alter table public.projects add column if not exists storyboard jsonb default null;
alter table public.projects add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists snapshot jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists data jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists production_pack_cache jsonb not null default '{}'::jsonb;
alter table public.projects add column if not exists created_at timestamptz default now();
alter table public.projects add column if not exists updated_at timestamptz default now();

create index if not exists projects_user_updated_idx on public.projects(user_id, updated_at desc);
create index if not exists projects_user_created_idx on public.projects(user_id, created_at desc);

-- =========================
-- USER SETTINGS
-- =========================
create table if not exists public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ui_lang text default 'ru',
  default_mode text default 'demo',
  default_aspect_ratio text default '9:16',
  default_video_target text default 'veo3',
  default_style_preset text default 'cinematic',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id)
);

alter table public.user_settings add column if not exists ui_lang text default 'ru';
alter table public.user_settings add column if not exists default_mode text default 'demo';
alter table public.user_settings add column if not exists default_aspect_ratio text default '9:16';
alter table public.user_settings add column if not exists default_video_target text default 'veo3';
alter table public.user_settings add column if not exists default_style_preset text default 'cinematic';
alter table public.user_settings add column if not exists settings jsonb not null default '{}'::jsonb;
alter table public.user_settings add column if not exists created_at timestamptz default now();
alter table public.user_settings add column if not exists updated_at timestamptz default now();

-- =========================
-- USAGE EVENTS
-- =========================
create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  event_type text,
  task_type text,
  provider text,
  model text,
  mode text default 'demo',
  cost_estimate numeric(10,4) default 0,
  payload jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.usage_events add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.usage_events add column if not exists project_id uuid references public.projects(id) on delete set null;
alter table public.usage_events add column if not exists event_type text;
alter table public.usage_events add column if not exists task_type text;
alter table public.usage_events add column if not exists provider text;
alter table public.usage_events add column if not exists model text;
alter table public.usage_events add column if not exists mode text default 'demo';
alter table public.usage_events add column if not exists cost_estimate numeric(10,4) default 0;
alter table public.usage_events add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.usage_events add column if not exists metadata jsonb not null default '{}'::jsonb;
alter table public.usage_events add column if not exists created_at timestamptz default now();

create index if not exists usage_events_user_date_idx on public.usage_events(user_id, created_at desc);

-- =========================
-- API KEYS PLACEHOLDER
-- =========================
create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text,
  label text,
  key_name text,
  encrypted_value text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.api_keys add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.api_keys add column if not exists provider text;
alter table public.api_keys add column if not exists label text;
alter table public.api_keys add column if not exists key_name text;
alter table public.api_keys add column if not exists encrypted_value text;
alter table public.api_keys add column if not exists is_active boolean default true;
alter table public.api_keys add column if not exists created_at timestamptz default now();
alter table public.api_keys add column if not exists updated_at timestamptz default now();

-- =========================
-- FUNCTIONS + TRIGGERS
-- =========================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    plan,
    role,
    default_mode,
    monthly_generation_limit,
    generations_used,
    cloud_project_limit,
    cloud_projects_used
  )
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'free',
    'user',
    'demo',
    10,
    0,
    3,
    0
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name),
    avatar_url = coalesce(nullif(excluded.avatar_url, ''), public.profiles.avatar_url),
    updated_at = now();

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

drop trigger if exists set_user_settings_updated_at on public.user_settings;
create trigger set_user_settings_updated_at
before update on public.user_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_api_keys_updated_at on public.api_keys;
create trigger set_api_keys_updated_at
before update on public.api_keys
for each row execute function public.set_updated_at();

-- =========================
-- RLS ENABLE
-- =========================
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.user_settings enable row level security;
alter table public.usage_events enable row level security;
alter table public.api_keys enable row level security;

-- =========================
-- POLICIES: PROFILES
-- =========================
drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles for select
using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- =========================
-- POLICIES: PROJECTS
-- =========================
drop policy if exists "Users can view own projects" on public.projects;
create policy "Users can view own projects"
on public.projects for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own projects" on public.projects;
create policy "Users can insert own projects"
on public.projects for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own projects" on public.projects;
create policy "Users can update own projects"
on public.projects for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own projects" on public.projects;
create policy "Users can delete own projects"
on public.projects for delete
using (auth.uid() = user_id);

-- =========================
-- POLICIES: USER SETTINGS
-- =========================
drop policy if exists "Users can view own settings" on public.user_settings;
create policy "Users can view own settings"
on public.user_settings for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own settings" on public.user_settings;
create policy "Users can insert own settings"
on public.user_settings for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own settings" on public.user_settings;
create policy "Users can update own settings"
on public.user_settings for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- =========================
-- POLICIES: USAGE EVENTS
-- =========================
drop policy if exists "Users can view own usage events" on public.usage_events;
create policy "Users can view own usage events"
on public.usage_events for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own usage events" on public.usage_events;
create policy "Users can insert own usage events"
on public.usage_events for insert
with check (auth.uid() = user_id);

-- =========================
-- POLICIES: API KEYS
-- =========================
drop policy if exists "Users can view own api keys" on public.api_keys;
create policy "Users can view own api keys"
on public.api_keys for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own api keys" on public.api_keys;
create policy "Users can insert own api keys"
on public.api_keys for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own api keys" on public.api_keys;
create policy "Users can update own api keys"
on public.api_keys for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own api keys" on public.api_keys;
create policy "Users can delete own api keys"
on public.api_keys for delete
using (auth.uid() = user_id);
