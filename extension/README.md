# Naukrify (V0) — Chrome extension

AI-tailored CV summary and cover letter for India job hunters. Runs inside LinkedIn. BYOK Gemini.

## What it does (V0)

- On any LinkedIn job page, a "Tailor with AI" button appears bottom-right.
- Click it. A side panel opens.
- Reads the JD from the page, your master CV from local storage.
- Calls Gemini Flash with your free API key.
- Returns: a 100-140 word cover letter + a 60-90 word tailored CV summary.
- Runs each output through a voice-rules engine (banned vocabulary, em-dashes, reframe patterns, word count). Flags issues you can fix.
- Copy or download as .txt.

Zero cost to the user after install. The Gemini free tier (gemini-2.5-flash) allows hundreds of requests per day per user, far more than any single job hunter needs.

---

## Setup (3 minutes)

### 1. Get a free Gemini API key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with Google
3. Click "Create API key"
4. Copy the key (starts with `AIza...`)

### 2. Install the extension

1. Open Chrome and go to `chrome://extensions/`
2. Top right: toggle "Developer mode" ON
3. Click "Load unpacked"
4. Select this folder (the one containing `manifest.json`)
5. The Naukrify icon appears in your Chrome toolbar (might be hidden under the puzzle-piece menu; pin it for easy access)

### 3. Paste your settings

1. Click the Naukrify icon in the toolbar
2. Paste your Gemini API key
3. Paste your master CV (plain text, full thing)
4. Add name, phone, email
5. Optionally: voice notes (how you write, e.g. "no em-dashes, India context, cool tone, avoid leverage/holistic")
6. Click Save

### 4. Use it

1. Go to a LinkedIn job page (any `linkedin.com/jobs/view/...` URL)
2. Scroll the page so the JD is fully loaded
3. Click "Tailor with AI" (bottom right corner of the page)
4. Wait 5-10 seconds for Gemini to respond
5. Review the cover letter and CV summary
6. Copy or download

---

## File map

- `manifest.json` — Chrome extension manifest v3
- `content.js` — runs on LinkedIn pages. Injects button, opens panel, calls Gemini, runs voice filter
- `content.css` — styles for the injected button and panel
- `popup.html` / `popup.js` / `popup.css` — toolbar settings form

---

## V0 limitations (known, planned for V1)

- LinkedIn only. Naukri, Wellfound, Instahyre support arrives in V1.
- CV output is summary text only. Full PDF rebuild (with tilt variants) arrives in V1.
- No application tracker. Arrives in V1 (web companion + Supabase).
- No Gmail integration. Arrives in V2.
- DOM selectors for LinkedIn's JD container may break if LinkedIn changes layout. If the button shows but the panel says "could not read the job description", update the selector list in `extractJD()` inside `content.js`.

---

## How to tune the voice rules

The banned vocabulary and reframe patterns live at the top of `content.js`:

- `BANNED_VOCAB` — list of words the cover letter must not contain
- `REFRAME_REGEXES` — regex patterns that catch "It's not X, it's Y" constructions

Edit those arrays. Reload the extension at `chrome://extensions` after any change.

---

## V0 test checklist (run this on yourself first)

1. Open 5 different LinkedIn job posts (Mumbai, India hybrid, India remote).
2. Click "Tailor with AI" on each.
3. Check:
   - Does the JD get read correctly? (panel shows the company and role)
   - Does the cover letter come back in 100-140 words?
   - Does the voice filter flag any banned words or em-dashes?
   - Does the CV summary include specific numbers from your master CV?
4. Note any failures. The most common will be:
   - LinkedIn DOM change → JD extraction returns empty. Fix selectors.
   - Gemini hallucinates a number not in your CV. Tighten the prompt or add an explicit "use only numbers from the CV below" instruction.
   - Voice filter flags an output that actually reads fine. Either soften the filter or accept it as a warning.

---

## What's next (after V0 ships)

- Add Naukri, Wellfound, Instahyre support (just additional content_scripts entries and selectors)
- Add a Next.js + Supabase web companion for CV editing, history, billing
- Add Razorpay paywall (₹2,999 lifetime)
- Submit to Chrome Web Store
