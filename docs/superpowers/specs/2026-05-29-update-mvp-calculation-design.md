# Design: Update MVP Calculation Flow

Change the MVP logic when a session is closed. Instead of storing the raw count of individual MVP votes per player in the `historical_ratings` table, we aggregate the votes to determine the winner(s) of the session MVP. The MVP is awarded according to these rules:
1. When a session is closed, sum the MVP votes (`is_mvp = true` in the `ratings` table) for each participant in that session.
2. If one player is the most voted and has more than 0 votes, they receive 1 MVP for that session.
3. If there is a tie between exactly 2 players (both having the maximum number of votes and > 0 votes), both players receive 1 MVP.
4. If there is a tie between 3 or more players, or if no MVP votes were cast at all, no one receives an MVP (all participants get 0 MVPs).

## Requirements

1. **Database Function Update**: Modify `compute_historical_ratings(session_id UUID)` to perform the conditional MVP assignment logic using PostgreSQL CTEs.
2. **Backward Compatibility**: Ensure that the `historical_ratings.mvp_count` column structure remains unchanged (it stores the integer MVP award for a player in a session, which is now either `1` or `0` instead of the raw vote count).
3. **No Codebase Commit**: Do not commit any changes to Git, leaving them unstaged for the user's review.

---

## Proposed Changes

### Database Migration

#### [MODIFY] [005_add_session_participants.sql](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/supabase/migrations/005_add_session_participants.sql)
Replace the existing definition of the `compute_historical_ratings` function with the updated SQL query using CTEs:

```sql
CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO historical_ratings (
    player_id, match_id,
    avg_tecnica, avg_fisico, avg_actitud, avg_vision_juego,
    avg_total, mvp_count
  )
  WITH player_votes AS (
    -- Count the MVP votes received by each participant in the session
    SELECT
      sp.player_id,
      COUNT(r.id) FILTER (WHERE r.is_mvp = true) AS votes
    FROM session_participants sp
    LEFT JOIN ratings r ON r.receiver_id = sp.player_id AND r.match_id = session_id
    WHERE sp.match_id = session_id
    GROUP BY sp.player_id
  ),
  max_votes_val AS (
    -- Find the maximum votes received by any player in this session
    SELECT MAX(votes) AS max_votes FROM player_votes
  ),
  top_players AS (
    -- Get the players who received the maximum votes (only if max_votes > 0)
    SELECT player_id, votes
    FROM player_votes, max_votes_val
    WHERE votes = max_votes AND votes > 0
  ),
  top_count AS (
    -- Count how many players share the top spot
    SELECT COUNT(*) AS cnt FROM top_players
  ),
  mvp_assignments AS (
    -- Determine the MVP count for each player in this session:
    -- If there's 1 or 2 top players, they get 1 MVP.
    -- If there's 3 or more (or 0 if no votes cast), they get 0.
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
END;
$$ LANGUAGE plpgsql;
```

---

## Verification Plan

### Automated Verification
* Ensure the project builds successfully by running `npm run build` or `npm run lint`.

### Manual Verification
1. **Apply the updated function** locally.
2. **Execute tests/scenarios**:
   * **Scenario A (Single Winner)**: Player A gets 2 votes, Player B gets 1 vote. Verify Player A has `mvp_count = 1` and Player B has `mvp_count = 0` in `historical_ratings`.
   * **Scenario B (2-Way Tie)**: Player A gets 2 votes, Player B gets 2 votes. Verify both have `mvp_count = 1` in `historical_ratings`.
   * **Scenario C (3-Way Tie)**: Player A gets 2 votes, Player B gets 2 votes, Player C gets 2 votes. Verify all have `mvp_count = 0` in `historical_ratings`.
   * **Scenario D (No MVP Votes Cast)**: No player receives any MVP votes. Verify all have `mvp_count = 0` in `historical_ratings`.
