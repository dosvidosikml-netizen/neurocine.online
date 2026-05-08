-- =========================================================
-- NeuroCine v62–v63 — Studio UI + Production Pack Polish
-- Safe compatibility check. No destructive changes.
-- Run is optional; v62–v63 is mostly UI/client-side polish.
-- =========================================================

alter table public.projects
  add column if not exists production_pack_cache jsonb default '{}'::jsonb;

alter table public.projects
  add column if not exists snapshot jsonb;

alter table public.projects
  add column if not exists data jsonb;

alter table public.projects
  add column if not exists updated_at timestamptz default now();

select
  'v62_63_ready' as status,
  count(*) as projects_count
from public.projects;
