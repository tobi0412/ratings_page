-- Add is_bigpaper and is_poop columns to ratings table
ALTER TABLE ratings
  ADD COLUMN IF NOT EXISTS is_bigpaper BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_poop BOOLEAN DEFAULT false;

-- Add unique partial indexes to guarantee at most one recipient for each award type per voter per session
CREATE UNIQUE INDEX IF NOT EXISTS unique_voter_bigpaper_per_match 
ON ratings (match_id, voter_id) 
WHERE (is_bigpaper = true);

CREATE UNIQUE INDEX IF NOT EXISTS unique_voter_poop_per_match 
ON ratings (match_id, voter_id) 
WHERE (is_poop = true);

-- Add bigpaper_count and poop_count columns to historical_ratings table
ALTER TABLE historical_ratings
  ADD COLUMN IF NOT EXISTS bigpaper_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS poop_count INT DEFAULT 0;

-- Update compute_historical_ratings function to count bigpaper and poop votes and allocate counts to winners
CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
RETURNS void AS $$
DECLARE
  chosen_player_id UUID;
BEGIN
  -- First, calculate averages, MVP, Bigpaper, and Poop allocations and insert/upsert to historical_ratings
  INSERT INTO historical_ratings (
    player_id, match_id,
    avg_tecnica, avg_fisico, avg_actitud, avg_vision_juego,
    avg_total, mvp_count, bigpaper_count, poop_count
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
      CASE WHEN (SELECT mvp_cnt FROM counts) IN (1, 2) AND pv.player_id IN (SELECT player_id FROM top_mvps) THEN 1 ELSE 0 END AS assigned_mvp,
      CASE WHEN (SELECT bigpaper_cnt FROM counts) IN (1, 2) AND pv.player_id IN (SELECT player_id FROM top_bigpapers) THEN 1 ELSE 0 END AS assigned_bigpaper,
      CASE WHEN (SELECT poop_cnt FROM counts) IN (1, 2) AND pv.player_id IN (SELECT player_id FROM top_poops) THEN 1 ELSE 0 END AS assigned_poop
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
    COALESCE(aa.assigned_poop, 0)
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
