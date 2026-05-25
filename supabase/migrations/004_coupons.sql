-- ─────────────────────────────────────────────────────────────────────────────
-- Naukrify — Slice 3b: Coupon codes
-- Run in: Supabase dashboard > SQL Editor > New query > Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Coupon definitions
create table if not exists public.coupons (
  code         text primary key,           -- e.g. 'NAUKRIFY100'
  max_uses     integer     default 10,
  uses_so_far  integer     default 0,
  is_active    boolean     default true,
  created_at   timestamptz default now()
);

-- Who redeemed which coupon
create table if not exists public.coupon_redemptions (
  id           uuid primary key default gen_random_uuid(),
  coupon_code  text        not null references public.coupons (code),
  user_id      uuid        not null references public.profiles (id) on delete cascade,
  redeemed_at  timestamptz default now(),
  unique (user_id, coupon_code)             -- one redemption per user per code
);

-- RLS: read-only for authenticated users (writes happen via the RPC below)
alter table public.coupons            enable row level security;
alter table public.coupon_redemptions enable row level security;

create policy "Authenticated users can read coupons"
  on public.coupons for select
  to authenticated using (true);

create policy "Users can read their own redemptions"
  on public.coupon_redemptions for select
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: redeem_coupon
-- Validates, checks cap, marks user as paid — atomically.
-- Called directly from the browser via supabase.rpc().
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

  -- Look up coupon (case-insensitive)
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

  -- Already used by this user?
  select exists(
    select 1 from public.coupon_redemptions
     where user_id = uid
       and coupon_code = upper(trim(coupon_code_input))
  ) into already_redeemed;

  if already_redeemed then
    return jsonb_build_object('success', false, 'error', 'already_used');
  end if;

  -- All checks passed — apply atomically
  update public.coupons
     set uses_so_far = uses_so_far + 1
   where code = upper(trim(coupon_code_input));

  insert into public.coupon_redemptions (coupon_code, user_id)
  values (upper(trim(coupon_code_input)), uid);

  update public.profiles
     set is_paid = true, paid_at = now()
   where id = uid;

  return jsonb_build_object('success', true);
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed: the launch coupon (10 free users)
-- ─────────────────────────────────────────────────────────────────────────────
insert into public.coupons (code, max_uses)
values ('NAUKRIFY100', 10)
on conflict (code) do nothing;
