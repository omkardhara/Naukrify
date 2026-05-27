// sync.js
// Supabase helpers for the Naukrify extension.
// Depends on: lib/config.js loaded first (defines NAUKRIFY_CONFIG)

/**
 * Fetch the authenticated user's profile (CV, name, phone) from Supabase.
 * @param {string} accessToken
 * @returns {Promise<{master_cv: string, name: string, phone: string}>}
 */
async function syncCvFromAccount(accessToken) { // eslint-disable-line no-unused-vars
  const { supabaseUrl, supabaseAnonKey } = NAUKRIFY_CONFIG;

  if (!supabaseUrl || supabaseUrl.includes('YOUR-PROJECT')) {
    throw new Error(
      'Supabase URL not set. Edit extension/lib/config.js and reload the extension.'
    );
  }
  if (!accessToken || accessToken.length < 20) {
    throw new Error('Invalid token. Copy it from the Naukrify dashboard (Show token button).');
  }

  const res = await fetch(
    `${supabaseUrl}/rest/v1/profiles?select=master_cv,name,phone&limit=1`,
    {
      headers: {
        apikey:        supabaseAnonKey,
        Authorization: `Bearer ${accessToken}`,
        Accept:        'application/json',
      },
    }
  );

  if (res.status === 401) {
    throw new Error('Token expired. Copy a fresh token from the web app dashboard.');
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase error ${res.status}: ${body}`);
  }

  const rows = await res.json();
  if (!rows.length) {
    throw new Error('No profile found. Sign in at the web app and save your CV first.');
  }

  return rows[0]; // { master_cv, name, phone }
}

/**
 * Call the check_and_increment_usage RPC before each generation.
 * Returns a result object the caller acts on.
 *
 * Result shapes:
 *   { allowed: true,  is_paid: true }
 *   { allowed: true,  is_paid: false, total_remaining: N, daily_remaining: N }
 *   { allowed: false, reason: 'trial_exhausted' }
 *   { allowed: false, reason: 'daily_limit' }
 *   { allowed: false, reason: 'not_authenticated' }
 *   { allowed: false, reason: 'no_profile' }
 *
 * @param {string} accessToken
 * @returns {Promise<object>}
 */
/**
 * Log a completed generation as a new application row.
 * Fire-and-forget: caller should not await this in the critical path.
 *
 * @param {string} accessToken
 * @param {{ company: string, roleTitle: string, jobUrl: string, coverLetter: string, cvSummary: string, jd: string }} payload
 * @returns {Promise<void>}
 */
async function logApplication(accessToken, payload) { // eslint-disable-line no-unused-vars
  const { supabaseUrl, supabaseAnonKey } = NAUKRIFY_CONFIG;
  if (!accessToken || accessToken.length < 20) return; // not synced yet, skip silently

  // Extract user_id from the JWT — required by the RLS insert policy.
  let userId = null;
  try {
    const b64 = accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    userId = JSON.parse(atob(b64)).sub;
  } catch (_) { return; } // malformed token — skip silently
  if (!userId) return;

  const jobUrl = payload.jobUrl || null;

  // Check for an existing row with the same job URL so we update rather than duplicate.
  let existingId = null;
  if (jobUrl) {
    try {
      const checkRes = await fetch(
        `${supabaseUrl}/rest/v1/applications?user_id=eq.${encodeURIComponent(userId)}&job_url=eq.${encodeURIComponent(jobUrl)}&select=id&limit=1`,
        {
          headers: {
            apikey:        supabaseAnonKey,
            Authorization: `Bearer ${accessToken}`,
            Accept:        'application/json',
          },
        }
      );
      if (checkRes.ok) {
        const rows = await checkRes.json();
        if (rows && rows.length > 0) existingId = rows[0].id;
      }
    } catch (_) { /* swallow — fall through to INSERT */ }
  }

  const body = {
    company:      payload.company     || null,
    role_title:   payload.roleTitle   || null,
    job_url:      jobUrl,
    source:       payload.source      || 'linkedin',
    cover_letter: payload.coverLetter || null,
    cv_summary:   payload.cvSummary   || null,
    jd:           payload.jd          || null,
  };

  if (existingId) {
    // PATCH — update cover letter and CV on the existing row; preserve status
    await fetch(`${supabaseUrl}/rest/v1/applications?id=eq.${existingId}`, {
      method:  'PATCH',
      headers: {
        apikey:         supabaseAnonKey,
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer:         'return=minimal',
      },
      body: JSON.stringify(body),
    });
  } else {
    // INSERT new row
    await fetch(`${supabaseUrl}/rest/v1/applications`, {
      method:  'POST',
      headers: {
        apikey:         supabaseAnonKey,
        Authorization:  `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer:         'return=minimal',
      },
      body: JSON.stringify({ ...body, user_id: userId, status: 'drafted' }),
    });
  }
  // Errors are intentionally swallowed — logging must not block generation UX.
}

async function checkAndIncrementUsage(accessToken) { // eslint-disable-line no-unused-vars
  const { supabaseUrl, supabaseAnonKey } = NAUKRIFY_CONFIG;

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/check_and_increment_usage`, {
    method:  'POST',
    headers: {
      apikey:         supabaseAnonKey,
      Authorization:  `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept:         'application/json',
    },
    body: JSON.stringify({}),
  });

  if (res.status === 401) {
    // Surface a specific error so the caller can prompt re-sync
    const err = new Error('Token expired. Re-sync in the extension popup.');
    err.code = 'token_expired';
    throw err;
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Usage check failed (${res.status}): ${body}`);
  }

  return res.json();
}
