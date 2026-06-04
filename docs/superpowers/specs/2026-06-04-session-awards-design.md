# Design Spec: Session Awards ("Papelón de la sesión" and "Jugador caca")

## Goal Description
We want to add two new session awards:
1. **"Papelón de la sesión"** (stored in DB as `is_bigpaper` and `bigpaper_count`): awarded to the player who made the biggest blunder or goof of the session.
2. **"Jugador caca"** (stored in DB as `is_poop` and `poop_count`): awarded to the worst-performing or most disappointing player of the session.

These awards function similarly to the MVP award:
* Only one player can be chosen by a voter for each award per session.
* A voter cannot vote for themselves.
* Choosing a player for all three awards (MVP, Papelón, and Jugador caca) is mandatory.
* On session close, awards are assigned to the player(s) with the most votes, supporting up to a 2-way tie. If 3 or more players are tied, no award is given for that session.
* We will move the MVP voting out of individual player cards into a centralized **"Premios de la Sesión"** widget.

---

## Database Migration
We will create `supabase/migrations/011_add_bigpaper_and_poop_awards.sql` to modify the database schema:

```sql
-- 1. Add columns to ratings table
ALTER TABLE ratings
  ADD COLUMN IF NOT EXISTS is_bigpaper BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_poop BOOLEAN DEFAULT false;

-- 2. Add unique partial indexes to guarantee one award type per voter per match session
CREATE UNIQUE INDEX IF NOT EXISTS unique_voter_bigpaper_per_match 
ON ratings (match_id, voter_id) 
WHERE (is_bigpaper = true);

CREATE UNIQUE INDEX IF NOT EXISTS unique_voter_poop_per_match 
ON ratings (match_id, voter_id) 
WHERE (is_poop = true);

-- 3. Add columns to historical_ratings table
ALTER TABLE historical_ratings
  ADD COLUMN IF NOT EXISTS bigpaper_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS poop_count INT DEFAULT 0;

-- 4. Update compute_historical_ratings function
CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
RETURNS void AS $$
DECLARE
  chosen_player_id UUID;
BEGIN
  -- First, run the aggregation logic to populate historical_ratings with metrics, MVP, Bigpaper, and Poop
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
```

---

## Proposed Changes

### Types & Backend Actions

#### [MODIFY] [index.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/types/index.ts)
* Add `is_bigpaper: boolean` and `is_poop: boolean` to the `Rating` and `RatingInput` interfaces.
* Add `bigpaper_count: number` and `poop_count: number` to `HistoricalRating`.
* Add `bigpaperCount: number` and `poopCount: number` to `PlayerStats`.

#### [MODIFY] [ratings.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/ratings.ts)
* Implement `submitSessionAwards({ matchId, mvpId, bigpaperId, poopId })`:
  1. Retrieve the voter's profile.
  2. Perform a transaction or sequential updates:
     * Clear all current `is_mvp`, `is_bigpaper`, and `is_poop` flags for this voter in this match session.
     * For each award, upsert/update a record in the `ratings` table for the selected player, setting the appropriate boolean to `true`.

#### [MODIFY] [stats.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/stats.ts)
* Update `getAllPlayersStats` to accumulate `bigpaper_count` and `poop_count` from historical ratings, and map them to the profile stats returned.
* Implement/update rankings query logic if needed.

---

### Voting UI & Flow

#### [MODIFY] [VotingCard.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingCard.tsx)
* Remove the MVP toggle section from the rating cards.

#### [NEW] [SessionAwardsCard.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/SessionAwardsCard.tsx)
* Create a dedicated awards card component.
* Include three dropdown selectors with custom styles matching the site's dark green sports aesthetics.
* Auto-save selections immediately when changed. Show visual indicators for saving progress.

#### [MODIFY] [VotingProgress.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingProgress.tsx)
* Update the progress calculation: Voting progress is complete only when all players are rated AND all three awards are selected.
* Render a checklist detailing both steps.

#### [MODIFY] [page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/dashboard/page.tsx)
* Integrate `SessionAwardsCard` at the top of the voting page.
* Bind the initial values from `myVotes`.

---

### Closed Session Results & Stats Display

#### [MODIFY] [AwardRanking.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/charts/MVPRanking.tsx) (Refactored/Renamed file or within same file)
* Generalize `MVPRanking` to `AwardRanking` so it can show MVPs, Papelones, and Poop lists with different badge colors and text.

#### [MODIFY] [TeamTab.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/history/TeamTab.tsx)
* In a single closed session: Render the MVP, Papelón, and Jugador Caca winners side-by-side.
* In historical stats (multiple sessions): Render three leaderboards side-by-side: Ranking MVPs, Ranking Papelón, and Ranking Jugador Caca.

#### [MODIFY] [PersonalTab.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/history/PersonalTab.tsx)
* Display "Papelones" and "Jugador Caca" counts in the profile stats grid.
* Add banner notifications for Papelón and Jugador Caca winners if they won them in the selected session.

---

## Verification Plan

### Automated Tests
* Build verification: `npm run build`

### Manual Verification
1. Run database migration in local Supabase or verify syntax.
2. Open active voting page:
   * Verify the "Session Awards" card is shown.
   * Verify dropdown lists contain all players except yourself.
   * Try selecting a player for MVP, Papelón, and Jugador Caca, verify it auto-saves and updates the progress checklist.
   * Verify that you cannot save player rating cards with MVP flags anymore.
3. Close the session:
   * Verify that `compute_historical_ratings` runs and computes counts.
   * Check the closed session results page: verify winners are displayed.
   * Check the historical ranking page: verify all three leaderboards are showing.
   * Check individual profile stats: verify the counts show correctly.
