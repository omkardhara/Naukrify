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
8. `supabase/migrations/008_plan_expired_reason.sql`

If any migration has already been run (e.g., from earlier phases), skip it — all statements use `CREATE OR REPLACE` / `IF NOT EXISTS` where possible.

## 3. Deploy to Vercel

1. Go to vercel.com > New Project > Import from GitHub > select `naukrify`
2. Set **Root Directory** to `web`
3. Framework: Next.js (auto-detected)
4. Add these environment variables:

```
# Required
NEXT_PUBLIC_SUPABASE_URL        = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY   = (from Supabase Settings > API > anon public)
SUPABASE_SERVICE_ROLE_KEY       = (from Supabase Settings > API > service_role — keep secret)
RAZORPAY_KEY_ID                 = rzp_live_xxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID     = rzp_live_xxxx
RAZORPAY_KEY_SECRET             = (from Razorpay dashboard > Settings > API Keys)
NEXT_PUBLIC_SITE_URL            = https://naukrify.com   (or your Vercel URL)

# Optional — only needed for international Stripe payments
STRIPE_SECRET_KEY               = sk_live_xxxx
STRIPE_WEBHOOK_SECRET           = whsec_xxxx
STRIPE_PRICE_ID                 = price_xxxx   (leave blank to use inline ₹5.99 price)
```

5. Click Deploy.

## 4. Post-deploy checklist

- [ ] Add your Vercel domain to Supabase: Authentication > URL Configuration > Site URL + Redirect URLs
      (add both `https://your-vercel-url.vercel.app` and your custom domain if you have one)
- [ ] Switch Razorpay keys from `rzp_test_` to `rzp_live_` in Vercel env vars
- [ ] Test Google login on the deployed URL
- [ ] Test Razorpay payment flow with a real small amount or test card
- [ ] Load the extension on Chrome (chrome://extensions > Load unpacked > select `extension/` folder)
- [ ] Sync extension: open popup, paste token from Settings page, click Sync
- [ ] Test a generation on LinkedIn / Naukri / Wellfound / Instahyre / Hirect
- [ ] Test interview prep tab in dashboard
- [ ] Check admin panel at `/admin` with your account

## 5. Custom domain

Vercel > your project > Settings > Domains > add `naukrify.com` (or your domain).
Then add an A record pointing to Vercel's IP at your registrar.

Update `NEXT_PUBLIC_SITE_URL` in Vercel env vars to match your final domain.

## 6. Stripe webhook (international payments)

If you want Stripe payments (USD):

1. Create a product in Stripe Dashboard > Products > Create product
2. Set price to $5.99 USD one-time
3. Copy the Price ID into `STRIPE_PRICE_ID` (or leave blank for inline price)
4. In Stripe Dashboard > Webhooks > Add endpoint:
   - URL: `https://your-domain.com/api/stripe/webhook`
   - Events to listen: `checkout.session.completed`
5. Copy the Webhook Signing Secret into `STRIPE_WEBHOOK_SECRET`

## 7. Chrome Web Store submission

You'll need:
- Icons: 16×16, 48×48, 128×128 PNG (the extension currently has none — create a simple indigo "N" lettermark matching the web favicon)
- Screenshots: at least 1 at 1280×800 showing the extension panel on a job page
- Privacy policy URL: `https://your-domain.com/privacy`
- Description: explain the extension reads job page DOM and makes HTTPS calls to Gemini (user's key) and Supabase

Until the extension is on the Web Store, the landing page Chrome install link goes to a 404. Either:
- Set up a pre-registration page and update the link in `web/app/page.tsx`
- Submit the extension and update the link after approval

The Web Store review takes 3–7 business days.

## 8. Daily limit reset via Supabase cron (optional)

The `check_and_increment_usage()` RPC handles per-request daily resets correctly without any cron. The cron below is optional — it keeps the DB tidy:

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

## 9. Feature summary (what's built)

**Chrome extension:**
- 5 job boards: LinkedIn, Naukri, Wellfound, Instahyre, Hirect
- Tailored CV summary + 130-word cover letter per application
- Voice-rules filter (50+ banned words, em-dash, reframe patterns)
- Recruiter reply drafts (60–90 words, one clarifying question)
- Application auto-logging to tracker (deduplication on URL)
- Account sync via token from settings page

**Web app (Next.js):**
- Google login via Supabase Auth
- Master CV editor with PDF upload (pdf.js + Gemini fallback for image PDFs)
- Role tilts / variant editor (angles CV for different role types)
- Application tracker: status pipeline, notes, search/filter, CSV export, RTF download
- Interview prep: 12 tailored questions in 4 categories with answer frameworks
- Trial (10 free, 3/day) → paid (₹499 / 3 months)
- Razorpay (India INR) + Stripe (international USD)
- Coupon code redemption
- Admin dashboard (`/admin`) with user/revenue analytics
- Privacy policy + terms of service
- Favicon, OG image, sitemap, robots.txt
