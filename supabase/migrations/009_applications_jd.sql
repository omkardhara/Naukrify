-- Naukrify — Migration 009: store raw JD on applications for interview prep
-- Run in: Supabase dashboard > SQL Editor > New query > Run

alter table public.applications
  add column if not exists jd text;
