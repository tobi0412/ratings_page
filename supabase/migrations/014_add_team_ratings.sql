-- Migration 014: Add team ratings table and team rating columns to match_sessions and historical_ratings

-- Create team_ratings table
CREATE TABLE IF NOT EXISTS team_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating NUMERIC(3, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 10.0),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_match_voter UNIQUE (match_id, voter_id)
);

-- Add team_rating column to match_sessions if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'match_sessions' AND column_name = 'team_rating'
  ) THEN
    ALTER TABLE match_sessions ADD COLUMN team_rating NUMERIC(3, 1) DEFAULT NULL;
  END IF;
END $$;

-- Add team_rating column to historical_ratings if it does not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'historical_ratings' AND column_name = 'team_rating'
  ) THEN
    ALTER TABLE historical_ratings ADD COLUMN team_rating NUMERIC(3, 1) DEFAULT NULL;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE team_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Players see own active team votes and all historical" ON team_ratings;
CREATE POLICY "Players see own active team votes and all historical"
  ON team_ratings FOR SELECT
  USING (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = false)
  );

DROP POLICY IF EXISTS "Players vote for team in active sessions" ON team_ratings;
CREATE POLICY "Players vote for team in active sessions"
  ON team_ratings FOR INSERT
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND EXISTS (SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true)
  );

DROP POLICY IF EXISTS "Players edit own team votes in active sessions" ON team_ratings;
CREATE POLICY "Players edit own team votes in active sessions"
  ON team_ratings FOR UPDATE
  USING (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND EXISTS (SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true)
  )
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND EXISTS (SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true)
  );

-- Update compute_historical_ratings function
CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
RETURNS void AS $$
DECLARE
  chosen_player_id UUID;
  total_participants INT;
  avg_team_val NUMERIC(3, 1);
BEGIN
  -- Get the total number of participants in this session
  SELECT COUNT(*) INTO total_participants
  FROM session_participants
  WHERE match_id = session_id;

  -- Calculate the average team rating (1 decimal precision)
  SELECT ROUND(COALESCE(AVG(rating), 0)::NUMERIC, 1) INTO avg_team_val
  FROM team_ratings
  WHERE match_id = session_id;

  -- Update the match_sessions table
  UPDATE match_sessions
  SET team_rating = avg_team_val
  WHERE id = session_id;

  -- First, calculate averages, MVP, Bigpaper, and Poop allocations and insert/upsert to historical_ratings
  INSERT INTO historical_ratings (
    player_id, match_id,
    avg_tecnica, avg_fisico, avg_actitud, avg_vision_juego,
    avg_total, mvp_count, bigpaper_count, poop_count,
    team_rating
  )
  WITH player_votes AS (
    SELECT
      sp.player_id,
      COUNT(r.id) FILTER (WHERE r.is_mvp = true) AS mvp_votes,
      COUNT(r.id) FILTER (WHERE r.is_bigpaper = true) AS bigpaper_votes,
      COUNT(r.id) FILTER (WHERE r.is_poop = true) AS poop_votes
    FROM session_participants sp
    LEFT JOIN ratings r ON r.receiver_id = sp.player_id AND r.match_id = session_id
    WHERE sp.match_id = session_id
    GROUP BY sp.player_id
  ),
  max_votes_val AS (
    SELECT 
      MAX(mvp_votes) AS max_mvp,
      MAX(bigpaper_votes) AS max_bigpaper,
      MAX(poop_votes) AS max_poop
    FROM player_votes
  ),
  top_mvps AS (
    SELECT player_id FROM player_votes, max_votes_val WHERE mvp_votes = max_mvp AND mvp_votes > 0
  ),
  top_bigpapers AS (
    SELECT player_id FROM player_votes, max_votes_val WHERE bigpaper_votes = max_bigpaper AND bigpaper_votes > 0
  ),
  top_poops AS (
    SELECT player_id FROM player_votes, max_votes_val WHERE poop_votes = max_poop AND poop_votes > 0
  ),
  counts AS (
    SELECT 
      (SELECT COUNT(*) FROM top_mvps) AS mvp_cnt,
      (SELECT COUNT(*) FROM top_bigpapers) AS bigpaper_cnt,
      (SELECT COUNT(*) FROM top_poops) AS poop_cnt
  ),
  awards_assignments AS (
    SELECT
      pv.player_id,
      -- MVP is assigned as long as tied top players are 1 or 2
      CASE WHEN (SELECT mvp_cnt FROM counts) IN (1, 2) AND pv.player_id IN (SELECT player_id FROM top_mvps) THEN 1 ELSE 0 END AS assigned_mvp,
      -- Bigpaper (Papelón) is assigned if the top player has >= 50% of the votes (including other people/blank votes) AND top list counts IN (1, 2)
      CASE WHEN ((SELECT max_bigpaper FROM max_votes_val) * 2 >= total_participants)
                AND (SELECT bigpaper_cnt FROM counts) IN (1, 2)
                AND pv.player_id IN (SELECT player_id FROM top_bigpapers) THEN 1 ELSE 0 END AS assigned_bigpaper,
      -- Poop (Jugador Caca) is assigned if the top player has >= 50% of the votes (including other people/blank votes) AND top list counts IN (1, 2)
      CASE WHEN ((SELECT max_poop FROM max_votes_val) * 2 >= total_participants)
                AND (SELECT poop_cnt FROM counts) IN (1, 2)
                AND pv.player_id IN (SELECT player_id FROM top_poops) THEN 1 ELSE 0 END AS assigned_poop
    FROM player_votes pv
  )
  SELECT
    p.id,
    session_id,
    ROUND(AVG(r.tecnica)::NUMERIC, 2),
    ROUND(AVG(r.fisico)::NUMERIC, 2),
    ROUND(AVG(r.actitud)::NUMERIC, 2),
    ROUND(AVG(r.vision_juego)::NUMERIC, 2),
    ROUND(AVG((r.tecnica + r.fisico + r.actitud + r.vision_juego)::NUMERIC / 4), 2),
    COALESCE(aa.assigned_mvp, 0),
    COALESCE(aa.assigned_bigpaper, 0),
    COALESCE(aa.assigned_poop, 0),
    avg_team_val
  FROM session_participants sp
  JOIN profiles p ON p.id = sp.player_id
  LEFT JOIN ratings r ON r.receiver_id = p.id AND r.match_id = session_id
  LEFT JOIN awards_assignments aa ON aa.player_id = p.id
  WHERE sp.match_id = session_id
  GROUP BY p.id, aa.assigned_mvp, aa.assigned_bigpaper, aa.assigned_poop
  ON CONFLICT (player_id, match_id) DO UPDATE SET
    avg_tecnica      = EXCLUDED.avg_tecnica,
    avg_fisico       = EXCLUDED.avg_fisico,
    avg_actitud      = EXCLUDED.avg_actitud,
    avg_vision_juego = EXCLUDED.avg_vision_juego,
    avg_total        = EXCLUDED.avg_total,
    mvp_count        = EXCLUDED.mvp_count,
    bigpaper_count   = EXCLUDED.bigpaper_count,
    poop_count       = EXCLUDED.poop_count,
    team_rating      = EXCLUDED.team_rating,
    computed_at      = NOW();

  -- Pick a random player who cast at least one rating in this session
  SELECT voter_id INTO chosen_player_id
  FROM ratings
  WHERE match_id = session_id
  GROUP BY voter_id
  ORDER BY random()
  LIMIT 1;

  -- Save the chosen mystery player in the session record
  IF chosen_player_id IS NOT NULL THEN
    UPDATE match_sessions
    SET mystery_player_id = chosen_player_id
    WHERE id = session_id;
  END IF;
END;
$$ LANGUAGE plpgsql;
