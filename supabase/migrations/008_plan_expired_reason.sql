-- ─────────────────────────────────────────────────────────────────────────────
-- Naukrify — Migration 008: plan_expired reason in check_and_increment_usage
-- Distinguishes between trial_exhausted (never paid) and plan_expired (paid, lapsed)
-- Run in: Supabase dashboard > SQL Editor > New query > Run
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
  is_active   bool;
  was_paid    bool;
begin
  if uid is null then
    return jsonb_build_object('allowed', false, 'reason', 'not_authenticated');
  end if;

  select * into prof from public.profiles where id = uid;

  if not found then
    return jsonb_build_object('allowed', false, 'reason', 'no_profile');
  end if;

  -- Paid check: paid_until is set and hasn't expired
  is_active := prof.paid_until is not null and prof.paid_until > now();
  -- Was ever paid (paid_until set, but now in the past)
  was_paid  := prof.paid_until is not null and prof.paid_until <= now();

  if is_active then
    update public.profiles
      set total_generations = total_generations + 1
      where id = uid;
    return jsonb_build_object(
      'allowed',     true,
      'is_paid',     true,
      'paid_until',  prof.paid_until
    );
  end if;

  -- Plan expired (was paid, now lapsed) — show renewal CTA, not trial message
  if was_paid then
    return jsonb_build_object(
      'allowed',    false,
      'reason',     'plan_expired',
      'paid_until', prof.paid_until
    );
  end if;

  -- Free trial path below ──────────────────────────────────────────────────────

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
