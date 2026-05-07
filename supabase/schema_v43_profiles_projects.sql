-- NeuroCine V43 — profiles, roles, settings, cloud projects, usage, API keys
-- Safe to run multiple times in Supabase SQL Editor.

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'free' check (role in ('demo','free','pro','admin','byo_api')),
  plan text default 'free' check (plan in ('demo','free','pro','admin','byo_api')),
  default_mode text default 'demo' check (default_mode in ('demo','live')),
  monthly_generation_limit integer default 30,
  cloud_project_limit integer default 5,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.profiles add column if not exists role text default 'free';
alter table public.profiles add column if not exists plan text default 'free';
alter table public.profiles add column if not exists default_mode text default 'demo';
alter table public.profiles add column if not exists monthly_generation_limit integer default 30;
alter table public.profiles add column if not exists cloud_project_limit integer default 5;
alter table public.profiles add column if not exists updated_at timestamptz default timezone('utc'::text, now()) not null;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create table if not exists public.user_settings (
  user_id uuid references auth.users(id) on delete cascade primary key,
  ui_lang text default 'ru',
  default_mode text default 'demo',
  default_aspect_ratio text default '9:16',
  default_video_target text default 'veo3',
  default_style_preset text default 'cinematic',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.user_settings enable row level security;
drop policy if exists "user_settings_own" on public.user_settings;
create policy "user_settings_own" on public.user_settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.projects (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null default 'NeuroCine Project',
  topic text,
  duration integer default 60,
  aspect_ratio text default '9:16',
  style_preset text default 'cinematic',
  mode text default 'safe',
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists projects_user_updated_idx on public.projects(user_id, updated_at desc);
alter table public.projects enable row level security;
drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own" on public.projects for select using (auth.uid() = user_id);
drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own" on public.projects for insert with check (auth.uid() = user_id);
drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own" on public.projects for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own" on public.projects for delete using (auth.uid() = user_id);

create table if not exists public.usage_events (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  task_type text not null,
  provider text,
  model text,
  mode text default 'demo',
  cost_estimate numeric(10,4) default 0,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

create index if not exists usage_events_user_date_idx on public.usage_events(user_id, created_at desc);
alter table public.usage_events enable row level security;
drop policy if exists "usage_events_own" on public.usage_events;
create policy "usage_events_own" on public.usage_events for select using (auth.uid() = user_id);

create table if not exists public.api_keys (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  provider text not null,
  label text,
  encrypted_value text,
  is_active boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

alter table public.api_keys enable row level security;
drop policy if exists "api_keys_own" on public.api_keys;
create policy "api_keys_own" on public.api_keys for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role, plan)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
    'free',
    'free'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url,
    updated_at = timezone('utc'::text, now());

  insert into public.user_settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();
