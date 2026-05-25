-- ─────────────────────────────────────────────────────────────────────────────
-- Naukrify — Slice 3 migration
-- Run in: Supabase dashboard > SQL Editor > New query > Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Add payment + usage tracking columns to profiles
alter table public.profiles
  add column if not exists is_paid           boolean      default false,
  add column if not exists paid_at           timestamptz,
  add column if not exists total_generations integer      default 0,
  add column if not exists daily_generations integer      default 0,
  add column if not exists daily_reset_date  date         default current_date;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: check_and_increment_usage
-- Called by the extension before each generation.
-- Uses auth.uid() — no user_id parameter (prevents spoofing).
-- Returns a JSON object the extension acts on.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.check_and_increment_usage()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  prof        public.profiles%rowtype;
  today       date := current_date;
  uid         uuid := auth.uid();
  total_cap   int  := 10;
  daily_cap   int  := 3;
begin
  if uid is null then
    return jsonb_build_object('allowed', false, 'reason', 'not_authenticated');
  end if;

  select * into prof from public.profiles where id = uid;

  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'no_profile');
  end if;

  -- Paid users: always allowed, just count total
  if prof.is_paid then
    update public.profiles
      set total_generations = total_generations + 1
      where id = uid;
    return jsonb_build_object('allowed', true, 'is_paid', true);
  end if;

  -- Reset daily counter if it's a new day
  if prof.daily_reset_date is null or prof.daily_reset_date < today then
    prof.daily_generations := 0;
    prof.daily_reset_date  := today;
  end if;

  -- Check total trial cap
  if prof.total_generations >= total_cap then
    return jsonb_build_object(
      'allowed', false,
      'reason',  'trial_exhausted',
      'total',   prof.total_generations
    );
  end if;

  -- Check daily cap
  if prof.daily_generations >= daily_cap then
    return jsonb_build_object(
      'allowed', false,
      'reason',  'daily_limit',
      'daily',   prof.daily_generations
    );
  end if;

  -- Allowed — increment and return remaining counts
  update public.profiles
    set
      total_generations = total_generations + 1,
      daily_generations = prof.daily_generations + 1,
      daily_reset_date  = today
    where id = uid;

  return jsonb_build_object(
    'allowed',         true,
    'is_paid',         false,
    'total_remaining', (total_cap - 1) - prof.total_generations,
    'daily_remaining', (daily_cap  - 1) - prof.daily_generations
  );
end;
$$;
