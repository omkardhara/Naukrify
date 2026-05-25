# Deploy Naukrify

## 1. Push to GitHub

```
# One-time: create a repo at github.com/new (name: naukrify, private)
git remote add origin https://github.com/YOUR-USERNAME/naukrify.git
git branch -M main
git push -u origin main
```

## 2. Deploy to Vercel

1. Go to vercel.com > New Project > Import from GitHub > select `naukrify`
2. Set **Root Directory** to `web`
3. Framework: Next.js (auto-detected)
4. Add these environment variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL        = https://upznqkpvikhcrgevkmgc.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY   = (from Supabase Settings > API)
   RAZORPAY_KEY_ID                 = rzp_live_xxxx   (switch to live key for prod)
   NEXT_PUBLIC_RAZORPAY_KEY_ID     = rzp_live_xxxx
   RAZORPAY_KEY_SECRET             = (from Razorpay dashboard)
   ```
5. Click Deploy.

## 3. Post-deploy

- Add your Vercel domain to Supabase: Authentication > URL Configuration > Site URL + Redirect URLs
- Switch Razorpay keys from `rzp_test_` to `rzp_live_` in Vercel env vars
- Run migration 006 in Supabase SQL Editor if not done yet

## 4. Custom domain (optional)

Vercel > your project > Settings > Domains > add naukrify.com (or whatever you registered)
Then add an A record pointing to Vercel's IP at your registrar.
