-- ─────────────────────────────────────────────────────────────────────────────
-- Naukrify — Slice 2 migration
-- Run in: Supabase dashboard > SQL Editor > New query > Run
-- ─────────────────────────────────────────────────────────────────────────────

-- CV variants — user-defined role tilts
create table if not exists public.cv_variants (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  name        text not null,       -- e.g. "Brand Manager roles", "D2C startups"
  tilt_notes  text,                -- free-text instructions to Gemini
  created_at  timestamptz default now()
);

alter table public.cv_variants enable row level security;

create policy "Users can view their own variants"
  on public.cv_variants for select
  using (auth.uid() = user_id);

create policy "Users can insert their own variants"
  on public.cv_variants for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own variants"
  on public.cv_variants for update
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own variants"
  on public.cv_variants for delete
  using (auth.uid() = user_id);
