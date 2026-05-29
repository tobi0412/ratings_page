# Update MVP Calculation Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Modify the MVP calculation logic inside the database function `compute_historical_ratings` when a session is closed.
**Architecture:** Update the PL/pgSQL function using a series of PostgreSQL Common Table Expressions (CTEs) to determine the MVP winner(s) conditionally based on the total MVP votes cast, assigning `1` MVP for a single winner or a 2-way tie, and `0` otherwise.
**Tech Stack:** PostgreSQL (PL/pgSQL), Supabase.

---

### Task 1: Update SQL Migration for MVP Calculation

**Files:**
- Modify: `supabase/migrations/005_add_session_participants.sql:58-90`

- [ ] **Step 1: Replace function definition in `supabase/migrations/005_add_session_participants.sql`**
  Modify lines 58-90 of the migration file to use the new PL/pgSQL implementation.

  ```sql
  -- 5. Update compute_historical_ratings function
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

- [ ] **Step 2: Dry-run Next.js compile check**
  Run: `npm run build`
  Expected: Successful compilation without errors.

- [ ] **Step 3: Verification**
  Let the user review the unstaged modifications. (Do NOT commit any changes per user's instruction).
