# Job Hunt App — Product Plan

**Status:** Draft 1, 20 May 2026
**Founder:** Omkar Dhareshwar
**Goal:** Turn the personal job-hunt engine into a sellable product. Solo build. Zero ongoing cost to the user once they buy.

---

## 1. Positioning

**The wedge:** Job hunt OS for India.

Every existing tool (Teal, Jobscan, Simplify, LazyApply, AIApply, Sonara) is built for the US market. They miss:

- Naukri, Hirect, Instahyre, Wellfound, Apna integration
- LPA salary logic (Indian recruiters post comp in lakhs, not USD)
- MBA hierarchy (Tier 1, Tier 2, ISB/IIM vs general)
- 60-90 day notice period dance
- WhatsApp-first recruiter behaviour
- Family pressure and risk tolerance (job switches are loaded)
- India-specific cover letter norms (often more formal than US)

You don't need to beat Teal globally. You need to be the obvious choice for any Indian job hunter switching roles in 2026.

**One-line pitch:**
"The AI co-pilot that handles your Indian job hunt end-to-end. Tailored CVs, cover letters in your voice, recruiter reply drafts, application tracker. One-time payment. No subscription."

**ICP (Ideal Customer):**

- Indian working professional, 5-15 years experience
- White-collar (marketing, product, sales, engineering, ops, consulting)
- Actively switching roles or open to opportunities
- Comfortable using AI tools (used ChatGPT/Claude at least casually)
- Willing to pay ₹2-4K once for outcomes
- Job hunt cycle: 3-6 months active

Starting niche: brand/marketing/sponsorship people in Mumbai/Bangalore/Delhi, 5-12 years exp. Your existing network. Validate there, expand to adjacent roles, then adjacent cities, then adjacent industries.

---

## 2. The free-cost-to-user solution

The constraint: once a user buys, no ongoing fee.

**The mechanism: BYOK (Bring Your Own Key) with Google Gemini's free tier.**

- User signs up at aistudio.google.com. Free. 5-minute setup.
- Google issues an API key on the spot.
- User pastes the key into the app once.
- Gemini Flash 1.5 free tier: 1,500 requests per day, 1M token context.
- A normal job hunter does 50-100 LLM calls per day (5-8 applications, each call = JD read, CV tailor, cover letter, reply drafts). Nowhere near the limit.

**Why this works:**

1. User pays you once, then has no recurring cost. Ever.
2. You never see or store their LLM bill.
3. Their key sits encrypted in their browser, never touches your servers.
4. Google's free tier is generous enough that 95%+ of users will never hit a cap.
5. If they do hit a cap (heavy users), they can upgrade to Gemini's paid tier directly with Google. Not your problem.

**Backup option for privacy nerds:** Ollama (local LLM on their machine). Free, private, slower, requires 8GB+ disk and decent RAM. Ship as a power-user toggle in v1, not v0.

---

## 3. Distribution: Chrome extension + light web companion

You leaned web SaaS. Hear me out on why Chrome extension wins for this product, and what a hybrid looks like.

### Why Chrome extension is the right primary surface

**Scraping problem.** A web SaaS that searches LinkedIn/Naukri jobs from a server gets blocked within hours. LinkedIn has aggressive anti-scraping. Naukri is slightly better. A paid scraping service (Bright Data, ScrapingBee) costs ₹15-30K/month minimum. That breaks the "no ongoing cost" promise.

A Chrome extension reads what's already on the user's screen. The browser is the authenticated session. No scraping, no blocking, no API fees. Legal too: extensions that enhance the user's own browsing don't violate ToS the way server-side scrapers do.

**Context win.** User is on LinkedIn looking at a job. They see a "Tailor CV & cover letter" button right there. No copy-paste, no tab-switch, no friction. Conversion to "uses the tool" is 5-10x higher than a web app where they have to leave the site.

**Onboarding friction.** Chrome Web Store install is 1 click. Pasting a Gemini key is 1 minute. Compare with a web app that needs LinkedIn OAuth, file upload, account creation, password.

### Why you still want a web companion (small one)

Some things don't belong in an extension popup:

- Master CV upload and editing (multi-variant)
- Application history and pipeline tracker
- Cover letter library
- Settings, billing receipt, account management
- Stripe checkout (Stripe + Chrome extensions is messy)

So: extension is the engine, web app is the cockpit. Both share a single user account (Supabase auth, free tier).

### Job board coverage (V0 to V1)

V0: LinkedIn Jobs only. Biggest audience, cleanest DOM.
V1: + Naukri, Wellfound, Instahyre
V2: + Hirect, Apna, company career pages

---

## 4. Pricing

**Launch pricing:**

- ₹2,999 lifetime (Indian credit card)
- $49 lifetime (international)

**Why one-time:**

- India hates subscriptions on tools under ₹5K
- "Lifetime" is a marketing magnet for early adopters
- Job hunters use the tool for 3-6 months. Subscription churn is brutal.
- You get cash upfront. Better for solo founder runway.

**Margin math:**

- LLM cost to you: ₹0 (BYOK)
- Server cost: ~₹500/user/year on Supabase free + Cloudflare Workers free tier (with paid burst)
- Payment processing: 2-3% (Razorpay) or 4% (Stripe)
- Net margin per user: ~₹2,700 (Indian) or ~$45 (international)

**At 1,000 users (year 1 target):** ₹27L revenue, ₹5L costs (server, marketing, tools), ₹22L net.

Switch to subscription later if retention proves you have ongoing utility (interview prep, salary negotiation, year-2 job switches).

---

## 5. MVP scope (V0, V1, V2)

### V0 — Ship in 2 weeks

The smallest thing that's useful. Chrome extension only. No web app yet.

- Loads on linkedin.com/jobs/view/*
- Adds a button "Tailor with AI" to the page
- Click opens a side panel
- Panel reads the JD from the page
- Calls user's Gemini key
- Outputs: 1-page tailored CV (text) + 130-word cover letter
- Stores: user's master CV, Gemini key, name + phone + email, last 20 outputs (in chrome.storage.local)
- "Copy to clipboard" + "Download as .docx" buttons

That's it. No tracker, no Gmail, no Naukri yet.

### V1 — Add the cockpit (6-8 weeks total)

- Web app at app.[brandname].com (or just .com/app)
- Login via Google OAuth (free, no email/password to manage)
- Master CV editor with 3-4 variant tilts (brand/marketing, sales, ops, tech)
- Application tracker (auto-logged when user clicks "Tailor" in extension)
- Cover letter library
- Stripe/Razorpay checkout
- Settings page: paste Gemini key, choose tone preset

### V2 — Job hunt OS (3-6 months total)

- Naukri + Wellfound + Instahyre extension support
- Gmail integration (read-only, recruiter inbox triage)
- Reply draft suggestions (drafted to Gmail, never auto-sent)
- LinkedIn connect suggestions (5 per session, India recruiter database)
- Salary benchmarking (scrape Glassdoor + Payscale + AmbitionBox via extension reads)
- Interview prep (ICP-specific question banks, India-flavoured)
- Daily/weekly briefing email

---

## 6. Technical spec

### Stack

| Layer | Choice | Why |
|---|---|---|
| Extension | Vanilla JS + Tailwind | Cursor/Claude Code can write this fast. No build complexity. |
| Web app | Next.js + Tailwind | Largest AI training data, fastest with Cursor |
| Auth | Supabase Auth | Free tier, Google OAuth one click |
| DB | Supabase Postgres | Free tier covers first 500 users |
| Storage | Supabase Storage | For CV PDFs, .docx files |
| Hosting | Vercel (web), Chrome Web Store (extension) | Both free at MVP scale |
| Payments | Razorpay (India) + Stripe (intl) | Razorpay handles UPI, cards, netbanking |
| LLM | Gemini Flash 1.5 (BYOK) | Free tier, generous limits |
| Analytics | Plausible or PostHog free tier | Privacy-first, India-friendly |

### Data model (V0 → V1)

```
users
  - id, email, name, created_at
  - master_cv_text (markdown)
  - gemini_api_key_encrypted
  - phone, linkedin_url
  - voice_profile_notes (free text)

cv_variants
  - id, user_id, name, tilt_description, content_md

applications
  - id, user_id, company, role_title, job_url, source (linkedin/naukri/etc)
  - cv_used_id, cover_letter_text
  - status (drafted/applied/replied/interview/rejected/offered)
  - created_at, applied_at, last_updated

cover_letters
  - id, user_id, application_id, content, word_count, voice_passed_bool

gemini_calls (for usage analytics, no content stored)
  - id, user_id, call_type, tokens_used, success_bool, ts
```

### Extension architecture (V0)

```
manifest.json              -- v3, permissions: storage, activeTab, scripting
background.js              -- service worker, listens for messages
content.js                 -- injected on LinkedIn job pages, adds the button
popup.html / popup.js      -- side panel UI: input, output, copy, download
lib/gemini.js              -- wraps Gemini REST API calls
lib/cv-builder.js          -- merges master CV + JD into tailored output
lib/cover-letter.js        -- applies voice rules, word count, banned vocab check
storage.js                 -- chrome.storage.local wrapper for key, history
```

### Voice rules engine (the differentiator)

Most job-hunt tools spit out generic AI slop. Yours has the anti-AI writing rules baked in.

Build a `voice-filter.js` that runs on every cover letter before showing it:

1. Banned vocabulary check (the list from `ANTI AI WRITING STYLE.md`)
2. Em-dash check
3. Negative parallelism / reframe pattern check
4. Word count (100-140 hard ceiling)
5. Specific number count (minimum 2)
6. Banned analogy setup check

If any fail, re-prompt Gemini with the specific failure noted, regenerate, recheck. Max 3 retries.

This is your moat. Anyone can call Gemini. Nobody else has a voice-rules engine tuned for "doesn't sound like AI slop."

### Repo structure

```
job-hunt-app/
├── extension/
│   ├── manifest.json
│   ├── background.js
│   ├── content.js
│   ├── popup.html
│   ├── popup.js
│   ├── lib/
│   └── styles.css
├── web/
│   ├── app/                (Next.js)
│   ├── components/
│   ├── lib/
│   └── public/
├── shared/
│   └── voice-rules.json    (shared between extension and web)
└── README.md
```

---

## 7. Build plan (solo, AI-coded, 8 weeks to V1)

Assume 10-15 hours per week. You're a coding beginner. Cursor or Claude Code does the heavy lifting.

**Week 1: V0 extension scaffold**
- Set up Cursor + Claude. Create the extension folder. Get "hello world" extension showing a button on a LinkedIn page.
- Wire up chrome.storage for the Gemini key.
- Build the popup UI (input: nothing, just a "Generate" button; output: textarea).

**Week 2: V0 generation flow**
- Extension reads job description from DOM.
- Calls Gemini with prompt: "Generate a cover letter for [JD] based on [user CV] following these rules: [voice rules]."
- Shows output, copy + download buttons.
- Ship as unpacked extension. Test on yourself for 1 week.

**Week 3: V0 polish + first 10 users**
- Voice rules engine (the filter loop).
- Onboarding screen: paste Gemini key, paste your CV.
- Submit to Chrome Web Store (review takes 3-7 days).
- Show to 10 friends who are job hunting. Free.

**Week 4: Web app skeleton**
- Next.js + Supabase auth.
- Login, profile page, CV editor.
- Sync extension storage with Supabase (key change: extension can now read user CV from server instead of chrome.storage).

**Week 5: Payments + paywall**
- Razorpay integration on web.
- Extension checks Supabase for paid status before generating.
- 7-day free trial built in.

**Week 6: Application tracker**
- Extension logs every "Tailor" click to Supabase.
- Web app shows the tracker (Kanban-style: drafted, applied, replied, interview, rejected, offered).

**Week 7: Beta with 20 paying users**
- Soft launch to your network. ₹999 early-bird (vs ₹2,999 list).
- Collect feedback, fix top 5 issues.

**Week 8: Public launch**
- Product Hunt India launch.
- LinkedIn post (your audience).
- Reach out to 20 India career creators for affiliate (₹500 per sale).

V2 starts in Week 9 based on what users actually ask for.

---

## 8. GTM (India-first)

### Channels in priority order

1. **Your LinkedIn audience.** You already have credibility. One launch post = first 50-100 sales if you nail the angle.
2. **WhatsApp groups for job hunters.** India has hundreds. Brand marketing groups, MBA alumni groups, BMS Live ex-colleague groups. Demo the tool, share a discount code.
3. **Career creators on LinkedIn (India).** Affiliate deal: ₹500 per sale. Names: Aishwarya Srinivasan (US-based but India audience), Sourabh Daga, Vaibhav Sisinty, Ankur Warikoo's network.
4. **Reddit (r/IndianWorkplace, r/developersIndia, r/IndianStartups).** Authentic founder posts work here, but only after you have 50+ users and screenshots.
5. **Product Hunt + Beta List + IndieHackers.** International audience for the $49 tier.

### Positioning copy (test these on landing page)

- "Job hunting in India shouldn't take 4 hours a day. We get it down to 30 minutes."
- "AI cover letters that don't sound like AI."
- "Built by someone switching jobs in Mumbai. Built for someone like you."

### Risks to call out

| Risk | Mitigation |
|---|---|
| LinkedIn changes DOM, extension breaks | Versioned CSS selectors, error reporting, fast patch cycle |
| Google removes Gemini free tier | Fallback to Groq/Cerebras free tier; allow Ollama local |
| Chrome Web Store rejects extension for "auto-applying" | Don't auto-apply. Tool generates content; user clicks "Apply" manually. Stay on the right side of TOS. |
| India market won't pay ₹2999 one-time | A/B test ₹999 + freemium. Worst case: ₹499 lifetime + ₹49/month for tracker |
| You burn out at week 5 | Pre-commit to 2 hours/day not 10. 8 weeks of steady > 2 weeks of sprint |

---

## 9. Name candidates

Pick one or suggest your own:

1. **ApplyKit** — clean, indie SaaS-naming, .com likely available
2. **Naukrify** — Naukri-adjacent, India-flavoured, instantly memorable in India
3. **Pichkari** — "spray gun" in Hindi, brand-marketing fun, distinct
4. **Dhandha** — "business" in Hindi, very Indian, slightly aggressive
5. **Tailor** — verb + noun, what the product does, .com likely taken
6. **Roleplay** — what you do before an interview, available domain

My pick: **Naukrify**. Indian, memorable, search-friendly, doesn't fight the Naukri brand (it suggests "Naukri but smarter").

---

## 10. What I need from you to keep going

1. **Pick a name** so I can name the repo and the brand.
2. **Confirm pricing** — ₹2,999 lifetime as launch price, OK?
3. **Confirm V0 scope** — LinkedIn only, CV + cover letter, no tracker. OK?
4. **Confirm BYOK Gemini path** — user signs up at Google AI Studio, pastes key. OK?

Once those four are locked, the next deliverable is:

- The V0 Chrome extension scaffold (manifest, content script, popup, Gemini wrapper, voice rules engine). Loadable in Chrome unpacked. You can test it on a LinkedIn job page within 30 minutes.

Say "go" and I scaffold the extension in the next turn.
