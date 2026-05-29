-- Migration 006: Add mystery_player_id and update compute_historical_ratings

-- 1. Add mystery_player_id column to match_sessions
ALTER TABLE match_sessions
ADD COLUMN IF NOT EXISTS mystery_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Update compute_historical_ratings function to select a random voter
CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
RETURNS void AS $$
DECLARE
  chosen_player_id UUID;
BEGIN
  -- 2.1 First, run the existing aggregation logic to populate historical_ratings
  INSERT INTO historical_ratings (
    player_id, match_id,
    avg_tecnica, avg_fisico, avg_actitud, avg_vision_juego,
    avg_total, mvp_count
  )
  WITH player_votes AS (
    SELECT
      sp.player_id,
      COUNT(r.id) FILTER (WHERE r.is_mvp = true) AS votes
    FROM session_participants sp
    LEFT JOIN ratings r ON r.receiver_id = sp.player_id AND r.match_id = session_id
    WHERE sp.match_id = session_id
    GROUP BY sp.player_id
  ),
  max_votes_val AS (
    SELECT MAX(votes) AS max_votes FROM player_votes
  ),
  top_players AS (
    SELECT player_id, votes
    FROM player_votes, max_votes_val
    WHERE votes = max_votes AND votes > 0
  ),
  top_count AS (
    SELECT COUNT(*) AS cnt FROM top_players
  ),
  mvp_assignments AS (
    SELECT
      pv.player_id,
      CASE
        WHEN tc.cnt IN (1, 2) AND pv.player_id IN (SELECT player_id FROM top_players) THEN 1
        ELSE 0
      END AS assigned_mvp
    FROM player_votes pv
    CROSS JOIN top_count tc
  )
  SELECT
    p.id,
    session_id,
    ROUND(AVG(r.tecnica)::NUMERIC, 2),
    ROUND(AVG(r.fisico)::NUMERIC, 2),
    ROUND(AVG(r.actitud)::NUMERIC, 2),
    ROUND(AVG(r.vision_juego)::NUMERIC, 2),
    ROUND(AVG((r.tecnica + r.fisico + r.actitud + r.vision_juego)::NUMERIC / 4), 2),
    COALESCE(ma.assigned_mvp, 0)
  FROM session_participants sp
  JOIN profiles p ON p.id = sp.player_id
  LEFT JOIN ratings r ON r.receiver_id = p.id AND r.match_id = session_id
  LEFT JOIN mvp_assignments ma ON ma.player_id = p.id
  WHERE sp.match_id = session_id
  GROUP BY p.id, ma.assigned_mvp
  ON CONFLICT (player_id, match_id) DO UPDATE SET
    avg_tecnica      = EXCLUDED.avg_tecnica,
    avg_fisico       = EXCLUDED.avg_fisico,
    avg_actitud      = EXCLUDED.avg_actitud,
    avg_vision_juego = EXCLUDED.avg_vision_juego,
    avg_total        = EXCLUDED.avg_total,
    mvp_count        = EXCLUDED.mvp_count,
    computed_at      = NOW();

  -- 2.2 Next, pick a random player who cast at least one rating in this session
  SELECT voter_id INTO chosen_player_id
  FROM ratings
  WHERE match_id = session_id
  GROUP BY voter_id
  ORDER BY random()
  LIMIT 1;

  -- 2.3 Save the chosen mystery player in the session record
  IF chosen_player_id IS NOT NULL THEN
    UPDATE match_sessions
    SET mystery_player_id = chosen_player_id
    WHERE id = session_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Populate existing closed sessions with a random mystery voter if they had votes
DO $$
DECLARE
  sess RECORD;
  chosen_player_id UUID;
BEGIN
  FOR sess IN SELECT id FROM match_sessions WHERE is_active = false AND mystery_player_id IS NULL LOOP
    SELECT voter_id INTO chosen_player_id
    FROM ratings
    WHERE match_id = sess.id
    GROUP BY voter_id
    ORDER BY random()
    LIMIT 1;

    IF chosen_player_id IS NOT NULL THEN
      UPDATE match_sessions
      SET mystery_player_id = chosen_player_id
      WHERE id = sess.id;
    END IF;
  END LOOP;
END $$;
