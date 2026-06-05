# Design Spec: Make Awards Optional and Apply 50% Threshold Rule

## Goal Description
Currently, voters are forced to select a recipient for all three awards ("MVP", "Papelón", and "Jugador Caca") to complete their session voting. 
We want to:
1. Make "Papelón" (bigpaper) and "Jugador Caca" (poop) awards optional in the UI, adding a clear "Ninguno (Opcional)" option to the dropdown list. "MVP" remains mandatory.
2. If 50% or more of the total session participants do not assign the award to anyone (either by selecting "Ninguno" or not submitting their awards), the award is not given to anyone.

---

## Database Migration
We will create `supabase/migrations/013_make_awards_optional.sql` to update the `compute_historical_ratings` function.

```sql
-- Update compute_historical_ratings function to handle optional awards with a 50% threshold check on the winner
CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
RETURNS void AS $$
DECLARE
  chosen_player_id UUID;
  total_participants INT;
BEGIN
  -- Get the total number of participants in this session
  SELECT COUNT(*) INTO total_participants
  FROM session_participants
  WHERE match_id = session_id;

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

### Database & Server Logic

#### [NEW] [013_make_awards_optional.sql](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/supabase/migrations/013_make_awards_optional.sql)
- Implement updated `compute_historical_ratings` function with optional awards 50% threshold logic.

#### [MODIFY] [sessions.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/sessions.ts)
- Modify `getSessionVotingProgress` to only require MVP selected for `awardsCompleted` progress:
  ```typescript
  const awardsCompleted = hasMvp;
  ```

### Frontend UI/UX

#### [MODIFY] [SessionAwardsCard.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/SessionAwardsCard.tsx)
- Add a "Ninguno (Opcional)" option to the dropdown list for optional awards.
- Render "Ninguno (Opcional)" in trigger button placeholder if no selection is made.
- Passing `""` clears the corresponding flag in the database.

#### [MODIFY] [page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/dashboard/page.tsx)
- Update `awardsComplete` computation to only require MVP vote:
  ```typescript
  const awardsComplete = myVotes.some((v) => v.is_mvp);
  ```

---

## Verification Plan

### Automated Tests
- Validate that NextJS compiles successfully: `npm run build`.

### Manual Verification
1. Run local development server: `npm run dev`.
2. Open active match session.
3. Select an MVP, and leave Papelón and Jugador Caca as "Ninguno (Opcional)".
4. Check that the Voting Progress card marks the awards as completed.
5. In the dropdown for Papelón, choose a player and verify it saves. Then choose "Ninguno" and verify it clears.
6. Submit votes, and check the database ratings to verify only MVP is active.
7. Close the session. Verify that the 50% threshold works:
   - If Papelón/Jugador Caca votes are <= 50% of participants, verify that no one receives the award in `historical_ratings` table and history tabs.
   - If votes are > 50% of participants, verify that the winner receives the award normally.
