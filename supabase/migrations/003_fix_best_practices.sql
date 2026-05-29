-- =============================================================================
-- Migration 003: Apply Postgres/Supabase Best Practices
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TIMESTAMPTZ: Replace bare TIMESTAMP with timezone-aware type
--    (schema-data-types: always use timestamptz)
-- -----------------------------------------------------------------------------
ALTER TABLE profiles
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE match_sessions
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN closed_at  TYPE TIMESTAMPTZ USING closed_at  AT TIME ZONE 'UTC';

ALTER TABLE ratings
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

ALTER TABLE historical_ratings
  ALTER COLUMN computed_at TYPE TIMESTAMPTZ USING computed_at AT TIME ZONE 'UTC';

-- -----------------------------------------------------------------------------
-- 2. NUMERIC: Replace FLOAT with exact-precision type for computed averages
--    (schema-data-types: never use float for calculated/display values)
-- -----------------------------------------------------------------------------
ALTER TABLE historical_ratings
  ALTER COLUMN avg_tecnica      TYPE NUMERIC(5,2),
  ALTER COLUMN avg_fisico       TYPE NUMERIC(5,2),
  ALTER COLUMN avg_actitud      TYPE NUMERIC(5,2),
  ALTER COLUMN avg_vision_juego TYPE NUMERIC(5,2),
  ALTER COLUMN avg_total        TYPE NUMERIC(5,2);

-- -----------------------------------------------------------------------------
-- 3. Missing FK indexes
--    (schema-foreign-key-indexes: Postgres never auto-indexes FK columns)
-- -----------------------------------------------------------------------------
-- match_sessions.created_by → profiles(id): used in RLS EXISTS checks & JOINs
CREATE INDEX IF NOT EXISTS idx_match_sessions_created_by
  ON match_sessions (created_by);

-- historical_ratings.match_id → match_sessions(id): used in JOINs & stats queries
CREATE INDEX IF NOT EXISTS idx_historical_ratings_match_id
  ON historical_ratings (match_id);

-- -----------------------------------------------------------------------------
-- 4. RLS Policies: fix auth.role() and unwrapped auth.uid()
--
--    Problems in migration 002:
--      a) auth.role() is deprecated — use TO <role> in policy declaration instead
--      b) auth.uid() called without (SELECT ...) wrapper → evaluated per-row
--         Wrapping in (SELECT auth.uid()) lets the planner cache it once per query
--    (security-rls-performance)
-- -----------------------------------------------------------------------------

-- ---- profiles ----------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users read profiles"  ON profiles;
DROP POLICY IF EXISTS "Users insert own profile"           ON profiles;
DROP POLICY IF EXISTS "Users update own profile"           ON profiles;

-- SELECT: any authenticated user may read all profiles
CREATE POLICY "Authenticated users read profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: user may only create their own profile, role forced to 'player'
CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = auth_id
    AND role = 'player'
  );

-- UPDATE: user may only update their own profile; cannot self-promote to admin
CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (  (SELECT auth.uid()) = auth_id )
  WITH CHECK ( (SELECT auth.uid()) = auth_id AND role = 'player' );

-- ---- match_sessions ----------------------------------------------------------
DROP POLICY IF EXISTS "All authenticated read sessions" ON match_sessions;
DROP POLICY IF EXISTS "Only admin creates sessions"     ON match_sessions;
DROP POLICY IF EXISTS "Only admin closes sessions"      ON match_sessions;

CREATE POLICY "All authenticated read sessions"
  ON match_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admin creates sessions"
  ON match_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_id = (SELECT auth.uid())
        AND role = 'admin'
        AND id = created_by
    )
  );

CREATE POLICY "Only admin closes sessions"
  ON match_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_id = (SELECT auth.uid())
        AND role = 'admin'
        AND id = created_by
    )
  );

-- ---- ratings -----------------------------------------------------------------
DROP POLICY IF EXISTS "Players vote for others in active sessions"     ON ratings;
DROP POLICY IF EXISTS "Players edit own votes in active sessions"      ON ratings;
DROP POLICY IF EXISTS "Players see own active votes and all historical" ON ratings;

-- Shared sub-expression: resolve current user's profile id once per statement
-- Written as (SELECT id FROM profiles WHERE auth_id = (SELECT auth.uid()))
-- The inner (SELECT auth.uid()) is cached by the planner; the outer subquery
-- hits the indexed unique column profiles.auth_id.

CREATE POLICY "Players vote for others in active sessions"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = (SELECT auth.uid()))
    AND voter_id != receiver_id
    AND EXISTS (
      SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true
    )
  );

CREATE POLICY "Players edit own votes in active sessions"
  ON ratings FOR UPDATE
  TO authenticated
  USING (
    voter_id = (SELECT id FROM profiles WHERE auth_id = (SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true
    )
  )
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = (SELECT auth.uid()))
    AND EXISTS (
      SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true
    )
  );

CREATE POLICY "Players see own active votes and all historical"
  ON ratings FOR SELECT
  TO authenticated
  USING (
    voter_id = (SELECT id FROM profiles WHERE auth_id = (SELECT auth.uid()))
    OR EXISTS (
      SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = false
    )
  );

-- ---- historical_ratings ------------------------------------------------------
DROP POLICY IF EXISTS "All authenticated read historical" ON historical_ratings;

CREATE POLICY "All authenticated read historical"
  ON historical_ratings FOR SELECT
  TO authenticated
  USING (true);

-- -----------------------------------------------------------------------------
-- 5. Fix compute_historical_ratings: use NUMERIC casts to match column types
--    (avoids implicit FLOAT → NUMERIC coercions on every insert/update)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO historical_ratings (
    player_id, match_id,
    avg_tecnica, avg_fisico, avg_actitud, avg_vision_juego,
    avg_total, mvp_count
  )
  SELECT
    p.id,
    session_id,
    ROUND(AVG(r.tecnica)::NUMERIC, 2),
    ROUND(AVG(r.fisico)::NUMERIC, 2),
    ROUND(AVG(r.actitud)::NUMERIC, 2),
    ROUND(AVG(r.vision_juego)::NUMERIC, 2),
    ROUND(AVG((r.tecnica + r.fisico + r.actitud + r.vision_juego)::NUMERIC / 4), 2),
    COUNT(CASE WHEN r.is_mvp THEN 1 END)
  FROM profiles p
  LEFT JOIN ratings r ON r.receiver_id = p.id AND r.match_id = session_id
  GROUP BY p.id
  ON CONFLICT (player_id, match_id) DO UPDATE SET
    avg_tecnica      = EXCLUDED.avg_tecnica,
    avg_fisico       = EXCLUDED.avg_fisico,
    avg_actitud      = EXCLUDED.avg_actitud,
    avg_vision_juego = EXCLUDED.avg_vision_juego,
    avg_total        = EXCLUDED.avg_total,
    mvp_count        = EXCLUDED.mvp_count,
    computed_at      = NOW();
END;
$$ LANGUAGE plpgsql;
