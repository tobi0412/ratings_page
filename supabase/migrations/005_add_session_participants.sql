-- 1. Create table session_participants
CREATE TABLE IF NOT EXISTS session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_match_player UNIQUE(match_id, player_id)
);

-- 2. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_session_participants_match ON session_participants(match_id);
CREATE INDEX IF NOT EXISTS idx_session_participants_player ON session_participants(player_id);

-- 3. Enable RLS and add policies
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "All authenticated read session participants" ON session_participants;
CREATE POLICY "All authenticated read session participants"
  ON session_participants FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admin manages session participants" ON session_participants;
CREATE POLICY "Only admin manages session participants"
  ON session_participants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );

-- 4. Restrict voting via ratings INSERT policy
DROP POLICY IF EXISTS "Players vote for others in active sessions" ON ratings;

CREATE POLICY "Players vote for others in active sessions"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = (SELECT auth.uid()))
    AND voter_id != receiver_id
    AND (SELECT status FROM profiles WHERE auth_id = (SELECT auth.uid())) = 'approved'
    AND EXISTS (
      SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true
    )
    -- Verify both voter and receiver are registered participants
    AND EXISTS (
      SELECT 1 FROM session_participants
      WHERE match_id = ratings.match_id AND player_id = ratings.voter_id
    )
    AND EXISTS (
      SELECT 1 FROM session_participants
      WHERE match_id = ratings.match_id AND player_id = ratings.receiver_id
    )
  );

-- 5. Update compute_historical_ratings function
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
  FROM session_participants sp
  JOIN profiles p ON p.id = sp.player_id
  LEFT JOIN ratings r ON r.receiver_id = p.id AND r.match_id = session_id
  WHERE sp.match_id = session_id
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
