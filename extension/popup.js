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

// ── Any-site generator ────────────────────────────────────────────────────────
document.getElementById('any-generate').addEventListener('click', async () => {
  const jd     = document.getElementById('any-jd').value.trim();
  const status = document.getElementById('any-status');
  const btn    = document.getElementById('any-generate');

  if (jd.length < 50) { status.textContent = 'Paste a job description first (at least 50 characters).'; return; }

  chrome.storage.local.get(['geminiKey', 'masterCv'], async (data) => {
    const apiKey = data.geminiKey || '';
    const cv     = data.masterCv  || '';

    if (!apiKey) { status.textContent = 'Enter your Gemini API key above and save first.'; return; }
    if (!cv || cv.length < 50) { status.textContent = 'No CV found. Sync your account or paste your CV above and save.'; return; }

    btn.disabled      = true;
    btn.textContent   = 'Generating...';
    status.textContent = '';
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
            generationConfig: { thinkingConfig: { thinkingBudget: 0 }, maxOutputTokens: 2048 },
          }),
        }
      );
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Gemini error ${res.status}`);
      }
      const data2  = await res.json();
      const raw    = data2.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const clean  = raw.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
      const parsed = JSON.parse(clean);

      document.getElementById('any-summary').textContent = parsed.summary    || '';
      document.getElementById('any-cl').textContent      = parsed.coverLetter || '';
      document.getElementById('any-results').style.display = 'block';
      status.textContent = '';
    } catch (e) {
      status.textContent = e instanceof SyntaxError ? 'Could not parse response. Try again.' : e.message;
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Generate CV summary + cover letter';
    }
  });
});

document.getElementById('any-results').addEventListener('click', (e) => {
  const btn = e.target.closest('.copy-btn');
  if (!btn) return;
  const text = document.getElementById(btn.dataset.target)?.textContent || '';
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1500);
  });
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
