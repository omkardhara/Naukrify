# Naukrify: session handoff (V0 done, moving to V1)

Date: 21 May 2026. Purpose: carry context into a fresh chat and into Claude Code for the V1 build.

---

## Where things stand

V0 is a working Chrome extension, tested on real LinkedIn job pages across several roles (Saregama, Spotify, Laqshya, CAB Experiences, DoubleTick, Jio World Centre, Ventura). Both outputs generate, get checked by the voice filter, and now auto-clean before you see them. V0 is validated. The next move is V1, built in Claude Code.

All V0 code lives in `D:\Claude Cowork - Omkar\OUTPUTS\JOB-HUNT-APP\extension-v0\`.

---

## What V0 does

On any LinkedIn job page a "Tailor with AI" button appears bottom right. Click it, a side panel opens, it reads the job description from the page and your master CV from local storage, calls Gemini Flash with your own free API key, and returns a 100 to 140 word cover letter plus a 60 to 90 word tailored CV summary. Each output runs through a voice-rules engine (banned vocabulary, em-dash and en-dash check, reframe patterns, word count) and any failures get sent back to Gemini for a targeted rewrite. Zero ongoing cost to the user after install, because the user brings their own free Gemini key.

---

## What got fixed in this session

1. Dead model name. Switched `gemini-1.5-flash` to `gemini-2.5-flash` on the v1beta endpoint. The old name was retired and returned 404.

2. Truncated output. `gemini-2.5-flash` is a thinking model, and its reasoning tokens were eating the output budget, cutting answers off mid-sentence. Fixed with `thinkingConfig.thinkingBudget = 0` and `maxOutputTokens = 2048`.

3. Invented facts. The free model was claiming sectors and job titles the CV does not have (for example "3+ years in BFSI/fintech"). Added FACTS ONLY rules to both prompts. This reduces it but does not fully remove it. Still eyeball every number and sector claim before sending.

4. Banned words slipping past the filter. The matcher only caught the exact word, so "aligns" got through while "align" was banned. Changed to match the word plus its variants.

5. En-dashes not flagged. The filter only checked for em-dashes. LinkedIn role titles often carry en-dashes (for example "Manager – Strategic Partnership"). Now both are caught.

6. The big one: banned words were flagged but never fixed. The filter only warned you, then handed over the dirty text to clean by hand. Now when the filter trips, the extension automatically sends the text back to Gemini with a surgical instruction (strip these exact words, keep every fact and number and the structure), then re-checks. Up to 1 extra pass per output. When it fires, the green line reads "Voice rules passed (auto-cleaned)".

7. Prompt banned list synced to the full filter list. The prompt used to warn Gemini about 28 words while the filter banned about 90. Now both pull from the same list, so fewer outputs trip the filter in the first place.

8. CV summary now gets filtered too. It was not filtered at all before, which is why "Results-driven" and "fostering" sailed through. It now has its own correct word range of 55 to 100, separate from the cover letter's 80 to 160.

9. Rate-limit handling. The free tier caps at roughly 10 requests per minute, and the auto-clean loop fires several calls per click. `callGemini` now backs off and retries on a 429 or 503. The CV step is also wrapped so any failure shows a clear message in its own box instead of silently leaving it blank.

10. File recovery. During editing, `content.js` got truncated at line 350, which wiped the download handlers, the `downloadText` function, and the page-navigation watcher. That was the cause of the "only cover letter, no CV" bug. The file is restored and passes a syntax check.

---

## Known limits and watch list (carry these into V1)

- The free model still invents a fact now and then. The green tick means "no banned words", not "every fact is true". Read the numbers and sector claims before you send.
- An en-dash inside a LinkedIn role title will flag. The textareas are editable, so fix it inline.
- V0 is LinkedIn only. The DOM selectors in `extractJD()` can break if LinkedIn changes its layout. If extraction returns empty, that is the first place to look.
- Free tier is roughly a few hundred requests per day. The auto-clean loop adds calls, so heavy use burns through it faster.
- There is a leftover `content.js.bak` file in the extension folder. Safe to delete from File Explorer. Chrome only loads `content.js`.

---

## To continue in a fresh chat

Start the new Cowork chat by pointing me at the Cowork folder as usual, then paste this:

```
Continuing the Naukrify build. V0 is a validated Chrome extension in
OUTPUTS/JOB-HUNT-APP/extension-v0. Read OUTPUTS/JOB-HUNT-APP/SESSION-HANDOFF-V0-TO-V1.md
and OUTPUTS/JOB-HUNT-APP/PRODUCT-PLAN.md first. I want to move to V1 in Claude Code.
Walk me through the next step.
```

Keep using this chat (Cowork) for store copy, pricing, landing page, launch posts, and anything that touches my personal files. Move to Claude Code for the actual V1 code.

---

## Steps to V1 with Claude Code

The full beginner walkthrough is already written in `OUTPUTS/JOB-HUNT-APP/CLAUDE-CODE-STARTER.md`. It covers installing Node, installing Claude Code, and setting up the repo with a memory file. Follow that doc end to end. Here is the short version of the sequence so you know the shape of it.

1. Install Node.js (LTS) from nodejs.org. Confirm with `node --version`.

2. Install Claude Code: `npm install -g @anthropic-ai/claude-code`. Confirm with `claude --version`.

3. Make the product repo, separate from your Cowork files, to keep things clean:
   ```
   cd "D:\"
   mkdir naukrify
   cd naukrify
   git init
   mkdir extension
   mkdir web
   ```

4. Copy your tested V0 files into `D:\naukrify\extension`. Copy `PRODUCT-PLAN.md` and the `CLAUDE.md` (the starter doc has the full text to paste) into `D:\naukrify`.

5. Start Claude Code from inside the folder:
   ```
   cd "D:\naukrify"
   claude
   ```
   First run opens your browser to log in. Then hand it the first task (the starter doc has the exact message to paste).

### What V1 actually builds first

Do not try to build everything at once. The smallest useful first slice:

- A Next.js web app with Google login (Supabase Auth).
- A master CV editor that saves your CV to your account (Supabase), so the extension reads it from the account instead of local paste.

After that slice works, the rest of V1 follows: the application tracker, PDF CV upload (pdf.js in the browser, with a Gemini-key fallback for messy Canva PDFs), and the Razorpay paywall at 2,999 rupees lifetime. Tech stack is Next.js plus Tailwind, Supabase for auth and database and storage, Razorpay for India and Stripe for international, and Gemini Flash through the user's own key.

### Two gotchas to hand Claude Code on day one

Both are already written into the `CLAUDE.md` in the starter doc, but worth knowing:

- Use `gemini-2.5-flash` on the v1beta `generateContent` endpoint. The older `gemini-1.5-flash` name returns 404.
- `gemini-2.5-flash` is a thinking model. For formatted text, set `generationConfig.thinkingConfig.thinkingBudget = 0` and keep `maxOutputTokens` at 2048 or higher, or the answer comes back cut off mid-sentence.

The voice-rules filter is the core differentiator. Keep it. The banned vocabulary, the auto-clean rewrite loop, the FACTS ONLY prompt rules, and the word-count bounds all carry forward into V1. Port the logic from `extension-v0/content.js` rather than rebuilding it from scratch.
