-- ─────────────────────────────────────────────────────────────────────────────
-- Naukrify — Slice 5: 3-month paid plan
-- Run in: Supabase dashboard > SQL Editor > New query > Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Add paid_until so we can expire access after 3 months
alter table public.profiles
  add column if not exists paid_until timestamptz;

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: check_and_increment_usage (replaces the Slice 3 version)
-- Paid = paid_until is set AND still in the future
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

-- ─────────────────────────────────────────────────────────────────────────────
-- Update coupon redemption to also set paid_until
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.redeem_coupon(coupon_code_input text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  coup             public.coupons%rowtype;
  uid              uuid    := auth.uid();
  already_redeemed boolean := false;
begin
  if uid is null then
    return jsonb_build_object('success', false, 'error', 'not_authenticated');
  end if;

  select * into coup
    from public.coupons
   where code = upper(trim(coupon_code_input))
     and is_active = true;

  if not found then
    return jsonb_build_object('success', false, 'error', 'invalid_code');
  end if;

  if coup.uses_so_far >= coup.max_uses then
    return jsonb_build_object('success', false, 'error', 'limit_reached');
  end if;

  select exists(
    select 1 from public.coupon_redemptions
     where user_id = uid
       and coupon_code = upper(trim(coupon_code_input))
  ) into already_redeemed;

  if already_redeemed then
    return jsonb_build_object('success', false, 'error', 'already_used');
  end if;

  update public.coupons
     set uses_so_far = uses_so_far + 1
   where code = upper(trim(coupon_code_input));

  insert into public.coupon_redemptions (coupon_code, user_id)
  values (upper(trim(coupon_code_input)), uid);

  update public.profiles
     set is_paid    = true,
         paid_at    = now(),
         paid_until = now() + interval '3 months'
   where id = uid;

  return jsonb_build_object('success', true);
end;
$$;
