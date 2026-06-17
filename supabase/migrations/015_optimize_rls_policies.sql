-- Migration 015: Optimize RLS policies for team_ratings table and add missing indexes

-- Add index on voter_id for team_ratings to optimize lookup in RLS policies
CREATE INDEX IF NOT EXISTS idx_team_ratings_voter ON team_ratings(voter_id);

-- Re-create team_ratings select policy with wrapped auth.uid()
DROP POLICY IF EXISTS "Players see own active team votes and all historical" ON team_ratings;
CREATE POLICY "Players see own active team votes and all historical"
  ON team_ratings FOR SELECT
  TO authenticated
  USING (
    voter_id = (SELECT id FROM profiles WHERE auth_id = (SELECT auth.uid()))
    OR EXISTS (SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = false)
  );

-- Re-create team_ratings insert policy with wrapped auth.uid()
DROP POLICY IF EXISTS "Players vote for team in active sessions" ON team_ratings;
CREATE POLICY "Players vote for team in active sessions"
  ON team_ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = (SELECT auth.uid()))
    AND EXISTS (SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true)
  );

-- Re-create team_ratings update policy with wrapped auth.uid()
DROP POLICY IF EXISTS "Players edit own team votes in active sessions" ON team_ratings;
CREATE POLICY "Players edit own team votes in active sessions"
  ON team_ratings FOR UPDATE
  TO authenticated
  USING (
    voter_id = (SELECT id FROM profiles WHERE auth_id = (SELECT auth.uid()))
    AND EXISTS (SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true)
  )
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = (SELECT auth.uid()))
    AND EXISTS (SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true)
  );
