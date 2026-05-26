-- 007_admin_and_notes.sql
-- Adds: application notes, admin analytics RPC

-- ── Application notes ────────────────────────────────────────────────────────

ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- ── Admin stats RPC ──────────────────────────────────────────────────────────

-- Only the founder's email can call this. Returns aggregate metrics.
CREATE OR REPLACE FUNCTION get_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_email TEXT;
BEGIN
  -- Resolve caller email from the JWT
  caller_email := auth.jwt() ->> 'email';

  IF caller_email IS DISTINCT FROM 'omkar.dhara@gmail.com' THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN (
    SELECT json_build_object(
      'total_users',         (SELECT COUNT(*) FROM profiles),
      'paid_users',          (SELECT COUNT(*) FROM profiles WHERE paid_until IS NOT NULL AND paid_until > now()),
      'trial_users',         (SELECT COUNT(*) FROM profiles WHERE (paid_until IS NULL OR paid_until <= now()) AND total_generations > 0),
      'total_generations',   (SELECT COALESCE(SUM(total_generations), 0) FROM profiles),
      'generations_today',   (SELECT COALESCE(SUM(daily_generations), 0) FROM profiles),
      'total_applications',  (SELECT COUNT(*) FROM applications),
      'apps_today',          (SELECT COUNT(*) FROM applications WHERE created_at::date = CURRENT_DATE),
      'apps_this_week',      (SELECT COUNT(*) FROM applications WHERE created_at >= now() - interval '7 days'),
      'status_breakdown',    (
        SELECT json_object_agg(status, cnt)
        FROM (
          SELECT status, COUNT(*) AS cnt FROM applications GROUP BY status
        ) s
      )
    )
  );
END;
$$;

-- Grant execute to authenticated users (the function itself enforces the email guard)
GRANT EXECUTE ON FUNCTION get_admin_stats() TO authenticated;
