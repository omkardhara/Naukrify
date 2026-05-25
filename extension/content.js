// Naukrify content script (V0)
// Injects a "Tailor with AI" button on LinkedIn job pages.
// On click, reads the JD, calls Gemini with the user's BYOK key,
// generates a cover letter + tailored CV summary, runs voice-rules filter.

(() => {
  'use strict';

  const BUTTON_ID = 'naukrify-fab';
  const PANEL_ID = 'naukrify-panel';

  // ===== Voice rules engine =====

  const BANNED_VOCAB = [
    'delve','realm','harness','unlock','tapestry','paradigm','cutting-edge','revolutionize',
    'intricate','intricacies','showcasing','crucial','pivotal','surpass','meticulously',
    'vibrant','unparalleled','underscore','leverage','synergy','innovative','game-changer',
    'testament','commendable','meticulous','boast','groundbreaking','align','foster',
    'showcase','enhance','holistic','garner','accentuate','pioneering','trailblazing',
    'unleash','versatile','transformative','redefine','seamless','optimize','scalable',
    'robust','breakthrough','empower','streamline','frictionless','elevate','adaptive',
    'effortless','data-driven','insightful','proactive','mission-critical','visionary',
    'disruptive','reimagine','unprecedented','intuitive','leading-edge','synergize',
    'democratize','accelerate','state-of-the-art','dynamic','immersive','predictive',
    'transparent','proprietary','integrated','plug-and-play','turnkey','future-proof',
    'supercharge','enduring','interplay','captivate','high-impact','results-driven',
    'fast-paced','unforgettable','rooted','spearhead','world-class','best-in-class'
  ];

  const REFRAME_REGEXES = [
    /it'?s not (just )?[\w\s']{2,40}, ?it'?s\s+/i,
    /not just [\w\s']{2,30}, ?but [\w\s']{2,30}/i,
    /less [\w\s']{2,20}, ?more [\w\s']{2,20}/i,
    /forget [\w\s']{2,30}, ?focus on [\w\s']{2,30}/i,
  ];

  function applyVoiceFilter(text, opts) {
    const minW = (opts && opts.minWords) || 80;
    const maxW = (opts && opts.maxWords) || 160;
    const flags = [];
    const lower = text.toLowerCase();
    const hits = [];
    for (const word of BANNED_VOCAB) {
      // Match word + common variants (align, aligns, aligning, aligned, alignment).
      const re = new RegExp('\\b' + word.replace(/-/g, '\\-') + '\\w*', 'i');
      if (re.test(lower)) hits.push(word);
    }
    if (hits.length) flags.push('banned vocab (' + hits.join(', ') + ')');
    if (/[—–―]/.test(text)) flags.push('em-dash / en-dash');
    for (const re of REFRAME_REGEXES) {
      if (re.test(text)) { flags.push('reframe pattern'); break; }
    }
    const wc = text.trim().split(/\s+/).length;
    if (wc > maxW) flags.push('too long (' + wc + ' words)');
    if (wc < minW) flags.push('too short (' + wc + ' words)');
    return { text, flags, wordCount: wc, passed: flags.length === 0 };
  }

  // ===== Prompts =====

  function coverLetterPrompt(jd, cv, voiceNotes, variantTilt) {
    const tiltBlock  = variantTilt  ? `\n\nROLE TILT — angle the letter specifically for this type of role:\n${variantTilt}` : '';
    const voiceBlock = voiceNotes   ? `\n\nVOICE NOTES (apply if relevant):\n${voiceNotes}` : '';
    return `You are writing a 100-140 word cover letter. Three short paragraphs.

JOB DESCRIPTION:
${jd}

CANDIDATE CV:
${cv}${tiltBlock}${voiceBlock}

RULES (treat as failure conditions):
1. 100-140 words total. Hard ceiling 160.
2. Three short paragraphs.
3. Para 1: why this company / role / now. Open with a CONCRETE fact: a specific achievement, number, or named thing from the JD or CV. NEVER open with a feeling or a generic hook. BANNED openers and phrases anywhere: "I am writing to express", "I am excited to apply", "I believe my background aligns", "deeply resonates", "resonates with", "I am particularly drawn to", "drawn to the role", "I am thrilled", "passionate about", "perfect fit", "caught my attention", "excites me".
4. Para 2: single most relevant achievement from the CV mapped to the JD's biggest need. Include at least 2 specific numbers.
5. Para 3: direct ask. e.g. "Open to a 20-min call this week" or "Happy to send a 2-page brief on the first 90 days". Cool, professional, not eager.
6. FACTS ONLY. Use only employers, numbers, sectors, and achievements that literally appear in the CV above. NEVER invent years of experience, a domain, or industry exposure the CV does not state. If the JD wants a sector the candidate lacks (e.g. fintech/BFSI), do NOT claim it. Map a transferable strength instead, honestly.

BANNED VOCABULARY (do not use any of these words OR their variants like aligns/aligning): ${BANNED_VOCAB.join(', ')}.

BANNED PATTERNS:
- No em-dashes. Use periods, commas, parentheses, colons.
- No "It's not X, it's Y" or "Not just X, but Y" reframes.
- No "Furthermore", "Additionally", "Moreover", "That said".
- No analogies unless the role is technical AND the analogy makes the idea easier.

Output ONLY the cover letter text. No greeting line, no signature, no preamble. Use natural sentence variation.`;
  }

  function cvFullPrompt(jd, cv, variantTilt) {
    const tiltBlock = variantTilt ? `\nROLE TILT — angle the CV specifically for this type of role: ${variantTilt}\n` : '';
    return `Produce a tailored 1-page CV for the job below. Use the candidate's CV as the only source of facts.

JOB:
${jd}

CANDIDATE CV:
${cv}
${tiltBlock}
OUTPUT FORMAT — use exactly this structure, plain text:

[Candidate full name]
[Phone] | [Email]

PROFESSIONAL SUMMARY
3-4 sentences. Open with the achievement most relevant to this JD. Include at least 2 specific numbers.

EXPERIENCE
[Company] | [Title] | [Dates]
- Most JD-relevant achievement with a number
- Second achievement with a number
- Third achievement if relevant

[Repeat for each role worth including. Cut roles not relevant to this JD.]

SKILLS
[Only skills relevant to this JD, comma-separated]

EDUCATION
[Degree] | [Institution] | [Year]

RULES:
- FACTS ONLY. Use only employers, titles, dates, achievements, and numbers that literally appear in the CV above. NEVER invent experience, domains, or job titles the CV does not state.
- Section headers must be ALL CAPS (PROFESSIONAL SUMMARY, EXPERIENCE, SKILLS, EDUCATION).
- Bullet points must start with "- ".
- No banned vocabulary (or variants): ${BANNED_VOCAB.join(', ')}.
- No em-dashes. Use periods, commas, parentheses.
- No "Furthermore", "Additionally", "Moreover".
- Target 400-550 words total.

Output ONLY the CV text. No preamble, no explanation.`;
  }

  // ===== Gemini API =====

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function callGemini(apiKey, prompt) {
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(apiKey);
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        // gemini-2.5-flash is a thinking model. Left on, its reasoning tokens
        // eat the output budget and the answer gets truncated mid-sentence.
        // We don't need reasoning for formatted text, so turn thinking off.
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    let res;
    // Free tier caps at ~10 requests/min. The auto-clean loop fires several
    // calls per click, so a 429 (rate limit) or 503 (overloaded) is expected
    // under bursts. Back off and retry twice before giving up.
    for (let attempt = 0; attempt < 3; attempt++) {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body
      });
      if (res.ok) break;
      if ((res.status === 429 || res.status === 503) && attempt < 2) {
        await sleep(6000 * (attempt + 1));
        continue;
      }
      const errText = await res.text();
      throw new Error('Gemini ' + res.status + ': ' + errText.slice(0, 250));
    }
    const json = await res.json();
    const text = json && json.candidates && json.candidates[0]
      && json.candidates[0].content && json.candidates[0].content.parts
      && json.candidates[0].content.parts[0] && json.candidates[0].content.parts[0].text;
    if (!text) throw new Error('Empty response from Gemini.');
    return text.trim();
  }

  // Targeted rewrite: hand the rejected text back to Gemini and ask it to strip
  // the offending words while keeping every fact, number, and the structure.
  function cleanupPrompt(text, flags, opts) {
    const minW = (opts && opts.minWords) || 80;
    const maxW = (opts && opts.maxWords) || 160;
    return `The text below was rejected by a style filter. Fix only the wording.

TEXT:
${text}

PROBLEMS FOUND: ${flags.join('; ')}

INSTRUCTIONS:
- Remove every banned word. Replace each with a plain, specific word a normal person would use in conversation. Do not swap one banned word for another.
- Full banned list (never use any of these or their variants): ${BANNED_VOCAB.join(', ')}.
- No em-dashes or en-dashes. Use periods, commas, or parentheses.
- No "It's not X, it's Y" or "Not just X, but Y" reframes.
- Keep the word count between ${minW} and ${maxW} words.
- Do NOT change any facts, employer names, numbers, job titles, sectors, or the paragraph structure. Only fix the wording.

Output ONLY the corrected text. No preamble, no explanation.`;
  }

  // Generate, filter, and auto-clean up to maxRetries times before showing the user.
  async function generateClean(apiKey, prompt, opts) {
    const maxRetries = (opts && opts.maxRetries) || 2;
    let raw = await callGemini(apiKey, prompt);
    let filt = applyVoiceFilter(raw, opts);
    let tries = 0;
    while (!filt.passed && tries < maxRetries) {
      raw = await callGemini(apiKey, cleanupPrompt(raw, filt.flags, opts));
      filt = applyVoiceFilter(raw, opts);
      tries++;
    }
    return { text: raw, filter: filt, tries };
  }

  // ===== DOM extraction =====

  function extractJD() {
    const sels = [
      '.jobs-description-content__text',
      '.jobs-box__html-content',
      '.jobs-description__content',
      '.jobs-description',
      '[class*="jobs-description"]',
    ];
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el && el.innerText && el.innerText.length > 100) return el.innerText.trim();
    }
    const main = document.querySelector('main');
    return main ? main.innerText.trim().slice(0, 8000) : '';
  }

  function extractCompanyAndRole() {
    const roleEl = document.querySelector('.job-details-jobs-unified-top-card__job-title, .jobs-unified-top-card__job-title, h1');
    const companyEl = document.querySelector(
      '.job-details-jobs-unified-top-card__company-name a, .jobs-unified-top-card__company-name, [class*="company-name"] a, [class*="company-name"]'
    );
    return {
      role: roleEl ? roleEl.innerText.trim().split('\n')[0] : '',
      company: companyEl ? companyEl.innerText.trim().split('\n')[0] : '',
    };
  }

  function slugify(s) {
    return (s || 'job').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ===== Button + panel =====

  function injectButton() {
    if (document.getElementById(BUTTON_ID)) return;
    if (!location.pathname.startsWith('/jobs/')) return;
    const btn = document.createElement('button');
    btn.id = BUTTON_ID;
    btn.className = 'naukrify-fab';
    btn.textContent = 'Tailor with AI';
    btn.addEventListener('click', openPanel);
    document.body.appendChild(btn);
  }

  function openPanel() {
    const existing = document.getElementById(PANEL_ID);
    if (existing) existing.remove();
    const meta = extractCompanyAndRole();
    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.className = 'naukrify-panel';
    panel.innerHTML = `
      <div class="naukrify-header">
        <span class="naukrify-title">Naukrify</span>
        <button class="naukrify-close" id="naukrify-close">&times;</button>
      </div>
      <div class="naukrify-meta">
        <div><b>${escapeHtml(meta.company || 'Unknown company')}</b></div>
        <div>${escapeHtml(meta.role || 'Unknown role')}</div>
      </div>
      <div class="naukrify-status" id="naukrify-status">Reading job description...</div>
      <div class="naukrify-section">
        <div class="naukrify-label">Cover letter</div>
        <textarea class="naukrify-output" id="naukrify-cl"></textarea>
        <div class="naukrify-issues" id="naukrify-cl-issues"></div>
        <div class="naukrify-actions">
          <button id="naukrify-cl-copy">Copy</button>
          <button id="naukrify-cl-download">Download</button>
          <button id="naukrify-cl-regen">Regenerate</button>
        </div>
      </div>
      <div class="naukrify-section">
        <div class="naukrify-label">Tailored CV (1 page)</div>
        <textarea class="naukrify-output" id="naukrify-cv"></textarea>
        <div class="naukrify-issues" id="naukrify-cv-issues"></div>
        <div class="naukrify-actions">
          <button id="naukrify-cv-copy">Copy</button>
          <button id="naukrify-cv-download">Download</button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    document.getElementById('naukrify-close').onclick = () => panel.remove();

    generate(meta);
  }

  function paintIssues(el, result) {
    if (!el) return;
    const f = result.filter;
    const cleaned = result.tries ? ' (auto-cleaned)' : '';
    if (f.passed) {
      el.textContent = '✓ ' + f.wordCount + ' words. Voice rules passed' + cleaned + '.';
      el.className = 'naukrify-issues passed';
    } else {
      el.textContent = '⚠ ' + f.wordCount + ' words' + cleaned + '. Flags: ' + f.flags.join('; ');
      el.className = 'naukrify-issues failed';
    }
  }

  async function generate(meta) {
    const status = document.getElementById('naukrify-status');
    try {
      const data = await chrome.storage.local.get(['geminiKey','masterCv','voiceNotes','selectedVariantTilt','supabaseToken']);
      if (!data.geminiKey) {
        status.textContent = 'Paste your Gemini API key in the toolbar popup first.';
        return;
      }
      if (!data.masterCv) {
        status.textContent = 'Paste your master CV in the toolbar popup first.';
        return;
      }
      const jd = extractJD();
      if (!jd || jd.length < 200) {
        status.textContent = 'Could not read the job description. Scroll the page so it loads, then click Regenerate.';
        return;
      }

      // ── Usage / paywall check ───────────────────────────────────────────
      if (data.supabaseToken) {
        try {
          const usage = await checkAndIncrementUsage(data.supabaseToken);
          if (!usage.allowed) {
            if (usage.reason === 'trial_exhausted') {
              status.innerHTML =
                '🔒 Free trial used up (10/10). ' +
                '<a href="' + NAUKRIFY_CONFIG.webAppUrl + '/dashboard" target="_blank" ' +
                'style="color:#4f46e5;text-decoration:underline">' +
                'Get full access — ₹499</a>';
              return;
            }
            if (usage.reason === 'daily_limit') {
              status.textContent = 'Daily limit reached (3/day on free trial). Resets at 1:30 PM IST tomorrow.';
              return;
            }
            // not_authenticated / no_profile — allow but warn
          } else if (!usage.is_paid && usage.total_remaining !== undefined) {
            status.textContent =
              'Generating... (' + usage.total_remaining +
              ' free generation' + (usage.total_remaining !== 1 ? 's' : '') + ' remaining after this)';
          }
        } catch (usageErr) {
          if (usageErr.code === 'token_expired') {
            status.textContent = 'Account token expired. Open the extension popup and click Sync with a fresh token.';
            return;
          }
          // Any other usage-check failure: don't block the user, just log it
          console.warn('Naukrify usage check failed:', usageErr.message);
        }
      }
      // ───────────────────────────────────────────────────────────────────

      status.textContent = 'Generating cover letter...';
      const clOpts = { minWords: 80, maxWords: 160, maxRetries: 1 };
      const clResult = await generateClean(data.geminiKey, coverLetterPrompt(jd, data.masterCv, data.voiceNotes, data.selectedVariantTilt), clOpts);
      document.getElementById('naukrify-cl').value = clResult.text;
      paintIssues(document.getElementById('naukrify-cl-issues'), clResult);

      // The CV is a separate API call. Isolate its errors so a failure here
      // (e.g. a rate limit) shows a clear message instead of silently leaving
      // the CV box empty behind an already-rendered cover letter.
      status.textContent = 'Tailoring CV summary...';
      const cvIssuesEl = document.getElementById('naukrify-cv-issues');
      try {
        const cvOpts = { minWords: 200, maxWords: 700, maxRetries: 1 };
        const cvResult = await generateClean(data.geminiKey, cvFullPrompt(jd, data.masterCv, data.selectedVariantTilt), cvOpts);
        document.getElementById('naukrify-cv').value = cvResult.text;
        paintIssues(cvIssuesEl, cvResult);
        status.textContent = 'Done. Review before sending.';
      } catch (cvErr) {
        if (cvIssuesEl) {
          cvIssuesEl.textContent = '⚠ CV summary failed: ' + (cvErr.message || String(cvErr)) + ' — click Regenerate.';
          cvIssuesEl.className = 'naukrify-issues failed';
        }
        status.textContent = 'Cover letter done. CV summary failed (see below).';
      }

      const clEl = document.getElementById('naukrify-cl');
      const cvEl = document.getElementById('naukrify-cv');
      const filenameBase = slugify(meta.company) + '__' + slugify(meta.role);

      // Log to the application tracker (fire-and-forget — never block the UX)
      if (data.supabaseToken) {
        logApplication(data.supabaseToken, {
          company:      meta.company,
          roleTitle:    meta.role,
          jobUrl:       window.location.href,
          coverLetter:  clEl.value,
          cvSummary:    cvEl.value,
        }).catch(() => {}); // swallow network errors
      }

      document.getElementById('naukrify-cl-copy').onclick = () => navigator.clipboard.writeText(clEl.value);
      document.getElementById('naukrify-cv-copy').onclick = () => navigator.clipboard.writeText(cvEl.value);
      document.getElementById('naukrify-cl-download').onclick = () => downloadRtf(clEl.value, filenameBase + '__cover-letter.rtf');
      document.getElementById('naukrify-cv-download').onclick = () => downloadRtf(cvEl.value, filenameBase + '__cv-summary.rtf');
      document.getElementById('naukrify-cl-regen').onclick = () => generate(meta);
    } catch (err) {
      status.textContent = 'Error: ' + (err.message || String(err));
    }
  }

  function downloadRtf(text, filename) {
    // RTF opens in Word, Google Docs, and Pages — no build step needed.
    function escRtf(s) {
      let out = '';
      for (let i = 0; i < s.length; i++) {
        const code = s.charCodeAt(i);
        if      (s[i] === '\\') out += '\\\\';
        else if (s[i] === '{')  out += '\\{';
        else if (s[i] === '}')  out += '\\}';
        else if (code > 127)    out += '\\u' + code + '?'; // Unicode escape — fixes â€" and similar
        else                    out += s[i];
      }
      return out;
    }

    const lines = text.split(/\r?\n/);
    let body = '';

    for (const line of lines) {
      const t = line.trim();
      if (!t) {
        body += '\\par\n';
      } else if (t === t.toUpperCase() && t.length > 3 && /^[A-Z][A-Z\s\/&]+$/.test(t)) {
        // ALL CAPS section header — bold, slightly larger
        body += `\\pard\\sb200\\sa80\\b\\fs24 ${escRtf(t)}\\b0\\fs22\\par\n`;
      } else if (/^- /.test(t)) {
        // Bullet point
        body += `\\pard\\fi-180\\li360 \\bullet  ${escRtf(t.slice(2))}\\par\n`;
      } else {
        // Normal text (name line, contact line, job header lines, etc.)
        body += `\\pard\\sa80 ${escRtf(t)}\\par\n`;
      }
    }

    const rtf = [
      '{\\rtf1\\ansi\\ansicpg1252\\uc1\\deff0',
      '{\\fonttbl{\\f0\\froman\\fcharset0 Calibri;}}',
      '\\f0\\fs22\\sa80',
      body,
      '}'
    ].join('\n');

    const blob = new Blob([rtf], { type: 'application/rtf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ===== SPA navigation watcher =====

  let lastUrl = location.href;
  const obs = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      const oldBtn = document.getElementById(BUTTON_ID);
      if (oldBtn) oldBtn.remove();
    }
    injectButton();
  });
  obs.observe(document.body, { childList: true, subtree: true });
  setTimeout(injectButton, 1500);
})();
