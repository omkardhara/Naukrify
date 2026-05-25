\# Naukrify

AI-tailored CV \+ cover letter tool for India job hunters. Sold as a Chrome  
extension plus a web companion. Launch price Rs 999 lifetime (soft launch);  
list price Rs 2,999 once validated. The user brings their own free Google  
Gemini API key, so there is zero ongoing LLM cost to them or to us.

\#\# Repo structure  
\- extension/  \-- the Chrome extension (V0, working). Vanilla JS, no build step.  
\- web/        \-- the Next.js \+ Supabase companion (V1, to build).

\#\# Hard product rules  
\- Zero ongoing cost to the user after purchase. LLM calls use the user's own  
  free Gemini key (BYOK). Never add a paid third-party service that the user  
  pays for monthly.  
\- The cover letter output runs through a voice-rules filter: banned vocabulary,  
  no em-dashes, no "It's not X, it's Y" reframes, 100-140 word count, minimum  
  2 specific numbers. See extension/content.js for the current rule list. Keep  
  this filter as the core differentiator.

\#\# V1 scope (build this)  
\- Next.js web app: Google login (Supabase Auth), master CV editor with variant  
  tilts, application tracker, Razorpay checkout (Rs 2,999 lifetime).  
\- PDF CV upload: extract text in-browser with pdf.js. For messy Canva/image  
  PDFs, fall back to reading the PDF with the user's own Gemini key. Keep a  
  paste-text fallback.  
\- The extension reads the user's CV from their account instead of local paste.

\#\# Voice and writing  
\- No em-dashes anywhere in UI copy or generated text.  
\- Default to Indian context (LPA salary, Naukri/Wellfound/Instahyre, notice  
  periods).

\#\# Tech choices (from the product plan)  
\- Extension: vanilla JS \+ CSS, no framework.  
\- Web: Next.js \+ Tailwind, Supabase (auth \+ Postgres \+ storage), Razorpay  
  for India \+ Stripe for international, Gemini Flash via BYOK.

\#\# Known gotchas (do not relearn the hard way)  
\- Gemini model name: use gemini-2.5-flash on the v1beta generateContent  
  endpoint. The older gemini-1.5-flash name was retired and returns 404\.  
\- gemini-2.5-flash is a THINKING model. By default its reasoning tokens eat  
  the output budget and the answer comes back truncated mid-sentence. For  
  formatted text (cover letters, CV summaries) turn thinking off:  
  generationConfig.thinkingConfig.thinkingBudget \= 0, and keep  
  maxOutputTokens generous (2048+). This bug already bit V0 once.

