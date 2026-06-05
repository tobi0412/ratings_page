# Specification: Team Performance Ratings

Feature to allow players to rate the overall team performance in a match session, aggregate these votes, track historical averages of the team performance per player, and display historical team performance progression graphs.

## Background & Goals
* Allow players to rate how they think the team played.
* Display the team's historical performance progression graph.
* Calculate and display each player's historical team rating average (the average performance of the team when that player was present).

## Constraints & Requirements
1. **Precision**: 1 decimal precision (e.g. 7.3).
2. **Dependence on Player Votes**: A voter cannot vote for the team until they have rated all other players in the session (Option A).
3. **Limit Constraint**: A voter cannot rate the team more than 1.5 points higher than their average votes to other players.
4. **Precision & Capping in UI**: The team rating input is a slider (1.0 to 10.0, step 0.1) capped dynamically in the UI to `Average + 1.5` (Option A).

---

## Technical Design

### 1. Database Schema (`supabase/migrations/014_add_team_ratings.sql`)
We will define:

* **Table `team_ratings`**:
  ```sql
  CREATE TABLE team_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    rating NUMERIC(3, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 10.0),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_match_voter UNIQUE (match_id, voter_id)
  );
  ```

* **Table Modifications**:
  * `match_sessions`: Add column `team_rating` NUMERIC(3, 1) DEFAULT NULL.
  * `historical_ratings`: Add column `team_rating` NUMERIC(3, 1) DEFAULT NULL.

* **Row Level Security (RLS)**:
  * Enable RLS on `team_ratings`.
  * `SELECT`: Allow authenticated users to view if `voter_id = profile_id` OR the session `is_active` is false.
  * `INSERT`/`UPDATE`: Allow authenticated users if `voter_id = profile_id` and the session `is_active` is true.

* **Function `compute_historical_ratings`**:
  Update to calculate team rating average and insert/update them:
  ```sql
  -- Calculate average team rating
  DECLARE
    avg_team_val NUMERIC(3, 1);
  BEGIN
    SELECT ROUND(COALESCE(AVG(rating), 0)::NUMERIC, 1) INTO avg_team_val
    FROM team_ratings
    WHERE match_id = session_id;

    -- Store average on session
    UPDATE match_sessions
    SET team_rating = avg_team_val
    WHERE id = session_id;

    -- Include team_rating in historical_ratings insert
    INSERT INTO historical_ratings (
      player_id, match_id,
      avg_tecnica, avg_fisico, avg_actitud, avg_vision_juego,
      avg_total, mvp_count, bigpaper_count, poop_count,
      team_rating
    )
    ...
    SELECT
      p.id,
      session_id,
      ROUND(AVG(r.tecnica)::NUMERIC, 2),
      ...,
      avg_team_val
    ...
    ON CONFLICT (player_id, match_id) DO UPDATE SET
      ...,
      team_rating = EXCLUDED.team_rating,
      computed_at = NOW();
  END;
  ```

---

### 2. Backend Logic (`src/actions/ratings.ts`)
* **`submitTeamRating({ match_id, rating })`**:
  1. Retrieve current profile.
  2. Verify session is active.
  3. Validate completeness (voted for all other participants).
  4. Compute voter's average of ratings to others.
  5. Validate that `rating <= Average + 1.5`.
  6. Upsert into `team_ratings`.
* **`getTeamRating(matchId)`**:
  * Select voter's own row from `team_ratings` for the given active match.

---

### 3. Stat Calculation (`src/actions/stats.ts`)
* **`getHistoricalStats`**: Select `team_rating` from both tables.
* **`getAllPlayersStats`**: Include `team_rating` in historical ratings and average them into `avgTeamRating` for each profile's PlayerStats.

---

### 4. UI Components
* **`TeamRatingCard.tsx`**:
  * Displays warning locked state if voter hasn't rated all participants.
  * Displays active slider once unlocked, with `max={Math.min(10.0, Average + 1.5)}`, `step="0.1"`, and save button.
  * Dispatched inside `src/app/dashboard/page.tsx`.
* **`TeamTab.tsx`**:
  * Plots team progression graph under "Progresión del Equipo" utilizing `StatLineChart` with a single series of `session.team_rating`.
* **`PersonalTab.tsx`**:
  * Displays a card "Prom. Equipo (con él)" in the summary grid showing `avgTeamRating`.

---

## Verification Plan

### Automated Verification
* Verify database migration syntax and execute it locally.
* Test server actions via integration test script.

### Manual Verification
1. Vote for a few players in active session -> verify team card is locked.
2. Complete all player cards -> verify team card unlocks.
3. Verify team slider max limit is correctly capped at `Average + 1.5`.
4. Submit team rating -> verify it saves successfully in DB.
5. Close match session -> verify overall average team rating is stored on session and historical ratings.
6. Verify Team Tab displays progression chart.
7. Verify Personal Tab shows team average card.
