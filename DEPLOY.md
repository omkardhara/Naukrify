# Deploy Naukrify

## 1. Push to GitHub

```bash
# One-time: create a repo at github.com/new (name: naukrify, private or public)
git remote add origin https://github.com/YOUR-USERNAME/naukrify.git
git branch -M main
git push -u origin main
```

## 2. Run Supabase migrations

Go to your Supabase project > SQL Editor > New query. Run **each** migration file in order:

1. `supabase/migrations/001_profiles.sql`
2. `supabase/migrations/002_cv_variants.sql`
3. `supabase/migrations/003_payments.sql`
4. `supabase/migrations/004_coupons.sql`
5. `supabase/migrations/005_applications.sql`
6. `supabase/migrations/006_paid_expiry.sql`
7. `supabase/migrations/007_admin_and_notes.sql`

If any migration has already been run (e.g., earlier phases), skip it — all statements use `CREATE IF NOT EXISTS` / `ALTER TABLE IF NOT EXISTS` where possible.

## 3. Deploy to Vercel

1. Go to vercel.com > New Project > Import from GitHub > select `naukrify`
2. Set **Root Directory** to `web`
3. Framework: Next.js (auto-detected)
4. Add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL        = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = (from Supabase Settings > API > anon public)
RAZORPAY_KEY_ID                 = rzp_live_xxxx   (switch to live key for prod)
NEXT_PUBLIC_RAZORPAY_KEY_ID     = rzp_live_xxxx
RAZORPAY_KEY_SECRET             = (from Razorpay dashboard > Settings > API Keys)
```

5. Click Deploy.

## 4. Post-deploy checklist

- [ ] Add your Vercel domain to Supabase: Authentication > URL Configuration > Site URL + Redirect URLs (add both `https://your-vercel-url.vercel.app` and your custom domain)
- [ ] Switch Razorpay keys from `rzp_test_` to `rzp_live_` in Vercel env vars
- [ ] Test Google login on the deployed URL
- [ ] Test Razorpay payment flow with a test card
- [ ] Load the extension on Chrome (extension > Manage Extensions > Load unpacked > select `extension/` folder)
- [ ] Sync extension with your deployed dashboard token
- [ ] Test a generation on LinkedIn / Naukri / Wellfound / Instahyre

## 5. Custom domain (optional)

Vercel > your project > Settings > Domains > add `naukrify.com` (or your domain)
Then add an A record pointing to Vercel's IP at your registrar.

Update the web app's site URL in `web/app/layout.tsx` (the `metadataBase` and `openGraph.url` fields) to match your final domain.

## 6. Chrome Web Store submission (optional)

You'll need:
- Icons: 16x16, 48x48, 128x128 PNG (the extension currently has none — create simple ones)
- Screenshots: at least 1 at 1280x800 or 640x400
- Privacy policy URL: `https://your-domain.com/privacy`
- Detailed description of what the extension does and what permissions it uses

The extension reads the job page DOM (activeTab permission) and makes HTTPS requests to Gemini and Supabase. It does not access any page other than job pages.

## 7. Daily limit reset (Supabase cron)

Supabase now has pg_cron built in. To reset `daily_generations` at midnight IST (18:30 UTC):

In Supabase SQL Editor:
```sql
SELECT cron.schedule(
  'reset-daily-gens',
  '30 18 * * *',   -- 18:30 UTC = midnight IST
  $$
    UPDATE public.profiles
    SET daily_generations = 0,
        daily_reset_date  = CURRENT_DATE
    WHERE daily_reset_date < CURRENT_DATE;
  $$
);
```

This is optional — the `check_and_increment_usage()` RPC already handles per-request daily reset correctly. The cron just keeps the DB tidy.
