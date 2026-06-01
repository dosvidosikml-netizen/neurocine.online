-- =========================================================
-- NeuroCine v66 — Trailer Local Agent Queue
-- Safe additive migration. Run once in Supabase SQL editor.
-- Stores local render jobs created by the web UI and completed by
-- the NeuroCine Local Agent running on the user's PC.
-- =========================================================

create extension if not exists "pgcrypto";

create table if not exists public.trailer_local_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  agent_token text not null,
  project_name text default 'NeuroCine Trailer',
  part_index integer not null default 0,
  part_label text default '',
  provider text default 'comfyui',
  status text not null default 'queued',
  prompt text not null default '',
  negative_prompt text default '',
  payload jsonb not null default '{}'::jsonb,
  image_data text default '',
  error text default '',
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.trailer_local_jobs
  add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.trailer_local_jobs
  add column if not exists agent_token text not null default '';
alter table public.trailer_local_jobs
  add column if not exists project_name text default 'NeuroCine Trailer';
alter table public.trailer_local_jobs
  add column if not exists part_index integer not null default 0;
alter table public.trailer_local_jobs
  add column if not exists part_label text default '';
alter table public.trailer_local_jobs
  add column if not exists provider text default 'comfyui';
alter table public.trailer_local_jobs
  add column if not exists status text not null default 'queued';
alter table public.trailer_local_jobs
  add column if not exists prompt text not null default '';
alter table public.trailer_local_jobs
  add column if not exists negative_prompt text default '';
alter table public.trailer_local_jobs
  add column if not exists payload jsonb not null default '{}'::jsonb;
alter table public.trailer_local_jobs
  add column if not exists image_data text default '';
alter table public.trailer_local_jobs
  add column if not exists error text default '';
alter table public.trailer_local_jobs
  add column if not exists started_at timestamptz null;
alter table public.trailer_local_jobs
  add column if not exists completed_at timestamptz null;
alter table public.trailer_local_jobs
  add column if not exists created_at timestamptz default now();
alter table public.trailer_local_jobs
  add column if not exists updated_at timestamptz default now();

create index if not exists trailer_local_jobs_user_created_idx
  on public.trailer_local_jobs(user_id, created_at desc);

create index if not exists trailer_local_jobs_agent_status_idx
  on public.trailer_local_jobs(agent_token, status, created_at asc);

alter table public.trailer_local_jobs enable row level security;

drop policy if exists "Users can view own trailer local jobs" on public.trailer_local_jobs;
create policy "Users can view own trailer local jobs"
on public.trailer_local_jobs for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own trailer local jobs" on public.trailer_local_jobs;
create policy "Users can insert own trailer local jobs"
on public.trailer_local_jobs for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own trailer local jobs" on public.trailer_local_jobs;
create policy "Users can delete own trailer local jobs"
on public.trailer_local_jobs for delete
using (auth.uid() = user_id);
