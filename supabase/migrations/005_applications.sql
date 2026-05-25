-- ─────────────────────────────────────────────────────────────────────────────
-- Naukrify — Slice 4: Application tracker
-- Run in: Supabase dashboard > SQL Editor > New query > Run
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.applications (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references public.profiles (id) on delete cascade,
  company      text,
  role_title   text,
  job_url      text,
  source       text        not null default 'linkedin',
  cover_letter text,
  cv_summary   text,
  status       text        not null default 'drafted'
                 check (status in ('drafted','applied','replied','interview','rejected','offered')),
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Row-level security — each user owns their rows
alter table public.applications enable row level security;

create policy "Users can view their own applications"
  on public.applications for select
  using (auth.uid() = user_id);

create policy "Users can insert their own applications"
  on public.applications for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own applications"
  on public.applications for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own applications"
  on public.applications for delete
  using (auth.uid() = user_id);

-- Index for the common dashboard query (user_id + created_at DESC)
create index if not exists applications_user_created
  on public.applications (user_id, created_at desc);

-- Auto-update updated_at on any row change
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute procedure public.set_updated_at();
