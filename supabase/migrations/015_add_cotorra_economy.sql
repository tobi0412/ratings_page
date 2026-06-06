-- Migration 015: Add cotorra economy satellite tables and update compute_historical_ratings

-- 1. Create tables
CREATE TABLE IF NOT EXISTS economy_wallets (
  player_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS economy_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type VARCHAR NOT NULL CHECK (type IN ('reward_performance', 'reward_bonus', 'purchase', 'bet_place', 'bet_win', 'bet_refund')),
  match_id UUID REFERENCES match_sessions(id) ON DELETE SET NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS economy_bets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bet_type VARCHAR NOT NULL CHECK (bet_type IN ('player_prop_over', 'player_prop_under', 'team_total_over', 'team_total_under')),
  target_player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  line_value NUMERIC(3, 1) NOT NULL,
  odds NUMERIC(4, 2) NOT NULL,
  amount INT NOT NULL CHECK (amount > 0),
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS economy_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  item_id VARCHAR NOT NULL,
  item_type VARCHAR NOT NULL CHECK (item_type IN ('tactical', 'avatar_border', 'field_design', 'profile_title')),
  match_id UUID REFERENCES match_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_player_item_match UNIQUE(player_id, item_id, match_id)
);

CREATE TABLE IF NOT EXISTS economy_equipped (
  player_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  avatar_border VARCHAR,
  field_design VARCHAR,
  profile_title VARCHAR,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE economy_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE economy_equipped ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Wallets
DROP POLICY IF EXISTS "All authenticated read wallets" ON economy_wallets;
CREATE POLICY "All authenticated read wallets" ON economy_wallets FOR SELECT TO authenticated USING (true);

-- Transactions
DROP POLICY IF EXISTS "Players read own transactions" ON economy_transactions;
CREATE POLICY "Players read own transactions" ON economy_transactions FOR SELECT TO authenticated 
  USING (player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- Bets
DROP POLICY IF EXISTS "Players read own bets" ON economy_bets;
CREATE POLICY "Players read own bets" ON economy_bets FOR SELECT TO authenticated 
  USING (player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Players insert own bets" ON economy_bets;
CREATE POLICY "Players insert own bets" ON economy_bets FOR INSERT TO authenticated 
  WITH CHECK (
    player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND EXISTS (SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true)
  );

-- Inventory
DROP POLICY IF EXISTS "Players read own inventory" ON economy_inventory;
CREATE POLICY "Players read own inventory" ON economy_inventory FOR SELECT TO authenticated 
  USING (player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

DROP POLICY IF EXISTS "Players insert own purchases" ON economy_inventory;
CREATE POLICY "Players insert own purchases" ON economy_inventory FOR INSERT TO authenticated 
  WITH CHECK (player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- Equipped
DROP POLICY IF EXISTS "All authenticated read equipped" ON economy_equipped;
CREATE POLICY "All authenticated read equipped" ON economy_equipped FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Players manage own equipped" ON economy_equipped;
CREATE POLICY "Players manage own equipped" ON economy_equipped FOR ALL TO authenticated 
  USING (player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
  WITH CHECK (player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

-- 4. Update compute_historical_ratings to exclude players with Escudo de Anonimato
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

  -- Pick a random player who cast at least one rating in this session, EXCLUDING those with an active Escudo de Anonimato
  SELECT voter_id INTO chosen_player_id
  FROM ratings
  WHERE match_id = session_id
    AND voter_id NOT IN (
      SELECT player_id FROM economy_inventory
      WHERE match_id = session_id AND item_id = 'escudo_anonimato'
    )
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
