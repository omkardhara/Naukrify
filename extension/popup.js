const FIELD_TO_ID = {
  geminiKey:     'key',
  masterCv:      'cv',
  voiceNotes:    'voice',
  name:          'name',
  phone:         'phone',
  email:         'email',
  supabaseToken: 'token',   // Slice 1: manual paste; replaced by OAuth in Slice 3
};
const FIELDS = Object.keys(FIELD_TO_ID);

// ── Load saved values on popup open ──────────────────────────────────────────
chrome.storage.local.get(
  [...FIELDS, 'selectedVariantId', 'selectedVariantTilt'],
  (data) => {
    for (const f of FIELDS) {
      const el = document.getElementById(FIELD_TO_ID[f]);
      if (el && data[f]) el.value = data[f];
    }
    // Load role tilts if a token is already saved
    if (data.supabaseToken) {
      loadAndPopulateVariants(data.supabaseToken, data.selectedVariantId);
    }
  }
);

// ── Save all fields ───────────────────────────────────────────────────────────
document.getElementById('save').addEventListener('click', () => {
  const out = {};
  for (const f of FIELDS) {
    const el = document.getElementById(FIELD_TO_ID[f]);
    out[f] = el ? el.value.trim() : '';
  }
  chrome.storage.local.set(out, () => {
    const s = document.getElementById('status');
    s.textContent = 'Saved.';
    setTimeout(() => { s.textContent = ''; }, 2000);
  });
});

// ── Role tilt selection ───────────────────────────────────────────────────────
document.getElementById('variant').addEventListener('change', function () {
  const opt = this.options[this.selectedIndex];
  chrome.storage.local.set({
    selectedVariantId:   opt.value,
    selectedVariantTilt: opt.dataset.tilt || '',
  });
});

// ── Sync from Supabase account (Slice 1 dev helper) ───────────────────────────
document.getElementById('sync').addEventListener('click', async () => {
  const syncStatus = document.getElementById('sync-status');
  const token = document.getElementById('token').value.trim();

  if (!token) { setSync('Paste your token first.', 'error'); return; }

  setSync('Syncing...', '');

  try {
    const profile = await syncCvFromAccount(token);

    if (profile.master_cv) document.getElementById('cv').value    = profile.master_cv;
    if (profile.name)      document.getElementById('name').value  = profile.name;
    if (profile.phone)     document.getElementById('phone').value = profile.phone;

    chrome.storage.local.set({
      supabaseToken: token,
      masterCv:      document.getElementById('cv').value,
      name:          document.getElementById('name').value,
      phone:         document.getElementById('phone').value,
    }, async () => {
      setSync('CV synced. Loading tilts...', 'ok');
      await loadAndPopulateVariants(token, null);
      setSync('Synced from account.', 'ok');
      setTimeout(() => setSync('', ''), 3000);
    });
  } catch (err) {
    setSync(err.message, 'error');
  }

  function setSync(msg, type) {
    syncStatus.textContent = msg;
    syncStatus.className   = type ? `sync-${type}` : '';
  }
});

// ── Variant helpers ───────────────────────────────────────────────────────────
async function loadAndPopulateVariants(token, selectedId) {
  const hint = document.getElementById('variant-hint');
  try {
    const variants = await fetchVariants(token);
    populateVariantDropdown(variants, selectedId);
    hint.textContent = variants.length
      ? variants.length + ' tilt' + (variants.length !== 1 ? 's' : '') + ' loaded.'
      : 'No tilts yet. Add them on the web app dashboard.';
  } catch (err) {
    hint.textContent = 'Could not load tilts: ' + err.message;
  }
}

async function fetchVariants(token) {
  const { supabaseUrl, supabaseAnonKey } = NAUKRIFY_CONFIG;
  const res = await fetch(
    `${supabaseUrl}/rest/v1/cv_variants?select=id,name,tilt_notes&order=created_at`,
    {
      headers: {
        apikey:        supabaseAnonKey,
        Authorization: `Bearer ${token}`,
        Accept:        'application/json',
      },
    }
  );
  if (!res.ok) throw new Error('Status ' + res.status);
  return res.json();
}

// ── Auto-extract JD from current tab (non-known sites) ───────────────────────
const KNOWN_SITES = [
  'linkedin.com','naukri.com','wellfound.com','instahyre.com','hirect.in',
  'greenhouse.io','lever.co','myworkdayjobs.com','foundit.in','cutshort.io',
  'darwinbox.in','iimjobs.com',
];

// Stores context captured from the current tab for use in logApplication
let anyTabCtx = { url: '', role: '', company: '', source: 'other' };

chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
  const tab = tabs[0];
  if (!tab || !tab.url) return;
  if (KNOWN_SITES.some((s) => tab.url.includes(s))) return; // content script handles these

  anyTabCtx.url = tab.url;

  const anyStatus = document.getElementById('any-status');
  anyStatus.textContent = 'Detecting job description...';

  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // ── JD extraction ──
        const jdSels = [
          '[data-automation-id="jobPostingDescription"]',
          '#job-description','#jobDescription',
          '[class*="job-description"]','[class*="jobDescription"]',
          '[class*="job-details"]','[class*="jobDetails"]',
          '[class*="job-content"]','[class*="position-description"]',
          '[data-testid*="description"]','[data-automation*="description"]',
          '.jd-content','.job-desc','.description-body',
          'main article','main',
        ];
        let jd = '';
        for (const sel of jdSels) {
          const el = document.querySelector(sel);
          if (el && el.innerText && el.innerText.trim().length > 150) {
            jd = el.innerText.trim().slice(0, 8000);
            break;
          }
        }

        // ── Role extraction ──
        const h1 = document.querySelector('h1');
        const role = h1 ? h1.innerText.trim().split('\n')[0] : '';

        // ── Company extraction — try multiple sources in priority order ──
        let company = '';

        // 1. OG / meta tags — most reliable
        company = document.querySelector('meta[property="og:site_name"]')?.content?.trim()
               || document.querySelector('meta[name="application-name"]')?.content?.trim()
               || '';

        // 2. Common company name selectors on career pages
        if (!company) {
          const companySels = [
            '[class*="company-name"]','[class*="companyName"]',
            '[class*="employer-name"]','[class*="org-name"]',
            '[data-automation*="company"]','[data-testid*="company"]',
            '.company','[itemprop="hiringOrganization"] [itemprop="name"]',
          ];
          for (const sel of companySels) {
            const el = document.querySelector(sel);
            if (el && el.innerText && el.innerText.trim().length > 1) {
              company = el.innerText.trim().split('\n')[0];
              break;
            }
          }
        }

        // 3. Hostname — strip common prefixes and use the domain name
        if (!company) {
          const host = location.hostname.replace(/^(www|careers|jobs|apply|hiring|talent|recruiting|work)\./i, '');
          const domainName = host.split('.')[0];
          if (domainName && domainName.length > 1) {
            company = domainName.charAt(0).toUpperCase() + domainName.slice(1);
          }
        }

        // 4. Page title — last segment after dash/pipe
        if (!company) {
          const titleParts = document.title.split(/\s[-|]\s/);
          if (titleParts.length > 1) company = titleParts[titleParts.length - 1].trim();
        }

        return { jd, role, company };
      },
    });
    const { jd = '', role = '', company = '' } = results?.[0]?.result || {};
    anyTabCtx.role    = role;
    anyTabCtx.company = company;
    if (jd.length > 150) {
      document.getElementById('any-jd').value = jd;
      anyStatus.textContent = 'Job description auto-detected. Edit if needed, then click Generate.';
    } else {
      anyStatus.textContent = 'Could not auto-detect. Paste the job description manually.';
    }
  } catch (_) {
    anyStatus.textContent = 'Could not read this page. Paste the job description manually.';
  }
});

// ── Any-site generator ────────────────────────────────────────────────────────
document.getElementById('any-generate').addEventListener('click', async () => {
  const jd     = document.getElementById('any-jd').value.trim();
  const status = document.getElementById('any-status');
  const btn    = document.getElementById('any-generate');

  if (jd.length < 50) { status.textContent = 'Paste a job description first (at least 50 characters).'; return; }

  // Read all needed keys in one call — avoids nested callbacks and timing issues
  chrome.storage.local.get(['geminiKey', 'masterCv', 'supabaseToken'], async (data) => {
    const apiKey = data.geminiKey     || '';
    const cv     = data.masterCv      || '';
    const token  = data.supabaseToken || '';

    if (!apiKey) { status.textContent = 'Enter your Gemini API key above and save first.'; return; }
    if (!cv || cv.length < 50) { status.textContent = 'No CV found. Sync your account or paste your CV above and save.'; return; }

    // If anyTabCtx.url wasn't captured (e.g. page blocked scripting), grab it now
    if (!anyTabCtx.url) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.url) anyTabCtx.url = tab.url;
      } catch (_) {}
    }

    btn.disabled       = true;
    btn.textContent    = 'Checking usage...';
    status.textContent = '';

    // Enforce usage limits — same gate as the content script
    if (token) {
      let usage;
      try {
        usage = await checkAndIncrementUsage(token);
      } catch (err) {
        if (err.code === 'token_expired') {
          status.textContent = 'Session expired. Re-sync your account token and try again.';
          btn.disabled = false; btn.textContent = 'Generate CV summary + cover letter'; return;
        }
        // Supabase unreachable — allow generation but warn
        console.warn('Usage check failed:', err.message);
      }
      if (usage && !usage.allowed) {
        const msgs = {
          trial_exhausted: 'Trial limit reached. Upgrade at naukrify.com/dashboard to continue.',
          daily_limit:     'Daily limit reached. Come back tomorrow for more generations.',
          plan_expired:    'Your plan expired. Renew at naukrify.com/dashboard.',
        };
        status.textContent = msgs[usage.reason] || 'Generation limit reached.';
        btn.disabled = false; btn.textContent = 'Generate CV summary + cover letter'; return;
      }
    }

    btn.textContent    = 'Generating...';
    document.getElementById('any-results').style.display = 'none';

    const prompt = `You are a professional CV and cover letter writer for India job seekers.

JOB DESCRIPTION:
${jd}

CANDIDATE CV:
${cv.slice(0, 4000)}

Generate two things:
1. CV SUMMARY: 3-4 lines (60-70 words) highlighting the most relevant experience for this role. Use specific numbers from the CV.
2. COVER LETTER: 120-140 words. First person, direct. Start with a specific achievement from the CV that matches the JD. No generic opener.

RULES: No em-dashes. No banned words (leverage, synergy, holistic, transformative, seamless, robust, paradigm, innovative, spearhead). India context. Never invent experience.

Return JSON only: {"summary": "...", "coverLetter": "..."}`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              thinkingConfig: { thinkingBudget: 0 },
              maxOutputTokens: 2048,
              responseMimeType: 'application/json',
            },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.error?.message || '';
        if (res.status === 429) throw new Error('Gemini rate limit hit. Wait a minute and try again.');
        if (res.status === 403) throw new Error('Gemini API key invalid or quota exceeded.');
        throw new Error(msg || `Gemini error ${res.status}`);
      }
      const data2  = await res.json();
      const raw    = data2.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const clean  = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(clean);

      const summary     = parsed.summary     || '';
      const coverLetter = parsed.coverLetter || '';
      document.getElementById('any-summary').textContent = summary;
      document.getElementById('any-cl').textContent      = coverLetter;
      document.getElementById('any-results').style.display = 'block';
      status.textContent = '';

      // Log to application tracker — awaited so it completes before popup can close
      if (token) {
        try {
          await logApplication(token, {
            company:     anyTabCtx.company,
            roleTitle:   anyTabCtx.role,
            jobUrl:      anyTabCtx.url,
            source:      'other',
            coverLetter: coverLetter,
            cvSummary:   summary,
            jd:          jd,
          });
        } catch (err) {
          console.warn('logApplication failed:', err);
        }
      }
    } catch (e) {
      status.textContent = e instanceof SyntaxError ? 'Could not parse response. Try again.' : e.message;
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Generate CV summary + cover letter';
    }
  });
});

function downloadRtf(text, filename) {
  let body = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i], code = text.charCodeAt(i);
    if      (c === '\\') body += '\\\\';
    else if (c === '{')  body += '\\{';
    else if (c === '}')  body += '\\}';
    else if (c === '\n') body += '\\par\n';
    else if (code > 127) body += '\\u' + code + '?';
    else                 body += c;
  }
  const rtf  = `{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Calibri;}}\n\\f0\\fs24 ${body}\n}`;
  const blob = new Blob([rtf], { type: 'application/rtf' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function slugify(s) {
  return (s || 'job').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
}

document.getElementById('any-results').addEventListener('click', (e) => {
  const text = document.getElementById(e.target.closest('[data-target]')?.dataset.target)?.textContent || '';
  if (!text) return;

  if (e.target.closest('.copy-btn')) {
    navigator.clipboard.writeText(text).then(() => {
      const btn = e.target.closest('.copy-btn');
      const orig = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => { btn.textContent = orig; }, 1500);
    });
  }

  if (e.target.closest('.rtf-btn')) {
    const suffix   = e.target.closest('.rtf-btn').dataset.suffix;
    const filename = `${slugify(anyTabCtx.company || 'company')}__${slugify(anyTabCtx.role || 'role')}__${suffix}.rtf`;
    downloadRtf(text, filename);
  }
});

function populateVariantDropdown(variants, selectedId) {
  const select = document.getElementById('variant');
  // Keep the first "No tilt" option, remove the rest
  while (select.options.length > 1) select.remove(1);
  for (const v of variants) {
    const opt = document.createElement('option');
    opt.value       = v.id;
    opt.textContent = v.name;
    opt.dataset.tilt = v.tilt_notes || '';
    if (v.id === selectedId) opt.selected = true;
    select.appendChild(opt);
  }
}
