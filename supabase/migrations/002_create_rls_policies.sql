-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_ratings ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Authenticated users read profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_id AND role = 'player');

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id AND role = 'player');

-- match_sessions policies
CREATE POLICY "All authenticated read sessions"
  ON match_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admin creates sessions"
  ON match_sessions FOR INSERT
  WITH CHECK (
    created_by = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND (SELECT role FROM profiles WHERE auth_id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admin closes sessions"
  ON match_sessions FOR UPDATE
  USING (
    created_by = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND (SELECT role FROM profiles WHERE auth_id = auth.uid()) = 'admin'
  );

-- ratings policies
CREATE POLICY "Players vote for others in active sessions"
  ON ratings FOR INSERT
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND voter_id != receiver_id
    AND (SELECT is_active FROM match_sessions WHERE id = match_id) = true
  );

CREATE POLICY "Players edit own votes in active sessions"
  ON ratings FOR UPDATE
  USING (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND (SELECT is_active FROM match_sessions WHERE id = match_id) = true
  )
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND (SELECT is_active FROM match_sessions WHERE id = match_id) = true
  );

CREATE POLICY "Players see own active votes and all historical"
  ON ratings FOR SELECT
  USING (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR (SELECT is_active FROM match_sessions WHERE id = match_id) = false
  );

-- historical_ratings policies
CREATE POLICY "All authenticated read historical"
  ON historical_ratings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Function to compute historical ratings
CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO historical_ratings (player_id, match_id, avg_tecnica, avg_fisico, avg_actitud, avg_vision_juego, avg_total, mvp_count)
  SELECT
    p.id,
    session_id,
    AVG(r.tecnica)::FLOAT,
    AVG(r.fisico)::FLOAT,
    AVG(r.actitud)::FLOAT,
    AVG(r.vision_juego)::FLOAT,
    AVG((r.tecnica + r.fisico + r.actitud + r.vision_juego)::FLOAT / 4)::FLOAT,
    COUNT(CASE WHEN r.is_mvp THEN 1 END)
  FROM profiles p
  LEFT JOIN ratings r ON r.receiver_id = p.id AND r.match_id = session_id
  GROUP BY p.id
  ON CONFLICT (player_id, match_id) DO UPDATE SET
    avg_tecnica = EXCLUDED.avg_tecnica,
    avg_fisico = EXCLUDED.avg_fisico,
    avg_actitud = EXCLUDED.avg_actitud,
    avg_vision_juego = EXCLUDED.avg_vision_juego,
    avg_total = EXCLUDED.avg_total,
    mvp_count = EXCLUDED.mvp_count,
    computed_at = NOW();
END;
$$ LANGUAGE plpgsql;
