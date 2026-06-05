# Team Performance Ratings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow players to rate team performance (1 decimal precision, capped at `Average of other votes + 1.5`), and display progression graphs and player stats based on this team rating.

**Architecture:** We will create a `team_ratings` table to store individual team ratings, add a `team_rating` column to both `match_sessions` and `historical_ratings` for aggregates, update the SQL logic to calculate session-level team averages on closure, and build the frontend voting card and progression graphs.

**Tech Stack:** Next.js, Supabase (Postgres & RLS), Recharts, TypeScript.

---

### Task 1: Database Migration
Write the database migration to setup the schema, columns, RLS, and Postgres calculations.

**Files:**
* Create: [014_add_team_ratings.sql](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/supabase/migrations/014_add_team_ratings.sql)

- [ ] **Step 1: Create the SQL migration file**
  Create the file `supabase/migrations/014_add_team_ratings.sql` with the following content:
  ```sql
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

  -- Add team_rating column to match_sessions
  ALTER TABLE match_sessions ADD COLUMN IF NOT EXISTS team_rating NUMERIC(3, 1) DEFAULT NULL;

  -- Add team_rating column to historical_ratings
  ALTER TABLE historical_ratings ADD COLUMN IF NOT EXISTS team_rating NUMERIC(3, 1) DEFAULT NULL;

  -- Enable RLS
  ALTER TABLE team_ratings ENABLE ROW LEVEL SECURITY;

  -- RLS Policies
  CREATE POLICY "Players see own active team votes and all historical"
    ON team_ratings FOR SELECT
    USING (
      voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      OR EXISTS (SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = false)
    );

  CREATE POLICY "Players vote for team in active sessions"
    ON team_ratings FOR INSERT
    WITH CHECK (
      voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      AND EXISTS (SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true)
    );

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
        CASE WHEN (SELECT mvp_cnt FROM counts) IN (1, 2) AND pv.player_id IN (SELECT player_id FROM top_mvps) THEN 1 ELSE 0 END AS assigned_mvp,
        CASE WHEN ((SELECT max_bigpaper FROM max_votes_val) * 2 >= total_participants)
                  AND (SELECT bigpaper_cnt FROM counts) IN (1, 2)
                  AND pv.player_id IN (SELECT player_id FROM top_bigpapers) THEN 1 ELSE 0 END AS assigned_bigpaper,
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
  ```

- [ ] **Step 2: Run verification on database**
  Verify the migration is successfully created. Note: The database updates will be applied via the standard database lifecycle.

---

### Task 2: Type Definitions
Update the domain types to support the `team_rating` field.

**Files:**
* Modify: [index.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/types/index.ts)

- [ ] **Step 1: Add new fields to Typescript Interfaces**
  Update the following interfaces in `src/types/index.ts`:
  * Add `team_rating: number | null;` to `MatchSession`.
  * Add `team_rating: number | null;` to `HistoricalRating`.
  * Add `avgTeamRating: number;` to `PlayerStats`.

---

### Task 3: Backend Server Actions
Implement the actions to submit and retrieve team ratings.

**Files:**
* Modify: [ratings.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/ratings.ts)

- [ ] **Step 1: Implement Server Actions in ratings.ts**
  Add the following server actions to the end of `src/actions/ratings.ts`:
  ```typescript
  export async function submitTeamRating(input: { match_id: string; rating: number }) {
    const supabase = createSupabaseServerClient();
    const profile = await getCurrentProfile();

    if (!profile) {
      return { error: "Not authenticated" };
    }

    // 1. Verify session is active
    const { data: session, error: sError } = await supabase
      .from("match_sessions")
      .select("is_active")
      .eq("id", input.match_id)
      .single();

    if (sError || !session?.is_active) {
      return { error: "Voting is closed for this session" };
    }

    // 2. Option A validation: Verify player rated all other participants
    // Fetch all session participants excluding current voter
    const { data: participants } = await supabase
      .from("session_participants")
      .select("player_id")
      .eq("match_id", input.match_id)
      .neq("player_id", profile.id);

    // Fetch existing votes by this voter
    const { data: votes } = await supabase
      .from("ratings")
      .select("receiver_id, tecnica, fisico, actitud, vision_juego")
      .eq("match_id", input.match_id)
      .eq("voter_id", profile.id);

    const otherParticipantsIds = (participants || []).map((p) => p.player_id);
    const votesCast = votes || [];

    const hasVotedForAll = otherParticipantsIds.every((pid) =>
      votesCast.some((v) => v.receiver_id === pid)
    );

    if (!hasVotedForAll) {
      return { error: "Debe calificar a todos los jugadores antes de calificar al equipo." };
    }

    // 3. Averaging Limit validation (max = Average + 1.5)
    const ratedVotes = votesCast.filter(
      (v) => v.tecnica !== null && v.fisico !== null && v.actitud !== null && v.vision_juego !== null
    );

    if (ratedVotes.length > 0) {
      const totalRatingsSum = ratedVotes.reduce(
        (sum, v) => sum + (v.tecnica! + v.fisico! + v.actitud! + v.vision_juego!),
        0
      );
      const totalRatingsCount = ratedVotes.length * 4;
      const averageVotesToOthers = totalRatingsSum / totalRatingsCount;

      const maxAllowed = averageVotesToOthers + 1.5;
      if (input.rating > maxAllowed) {
        return {
          error: `El rating del equipo (${input.rating}) supera el límite permitido de (${maxAllowed.toFixed(1)}).`,
        };
      }
    }

    // 4. Save team rating
    const { data, error } = await supabase
      .from("team_ratings")
      .upsert(
        {
          match_id: input.match_id,
          voter_id: profile.id,
          rating: input.rating,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "match_id,voter_id" }
      )
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data, success: true };
  }

  export async function getTeamRating(matchId: string) {
    const supabase = createSupabaseServerClient();
    const profile = await getCurrentProfile();

    if (!profile) {
      return null;
    }

    const { data } = await supabase
      .from("team_ratings")
      .select("rating")
      .eq("match_id", matchId)
      .eq("voter_id", profile.id)
      .maybeSingle();

    return data ? (data.rating as number) : null;
  }
  ```

---

### Task 4: Stats Retrieval Updates
Modify stats server actions to aggregate and retrieve team ratings.

**Files:**
* Modify: [stats.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/stats.ts)

- [ ] **Step 1: Include team_rating in queries and calculate averages**
  Update `src/actions/stats.ts`:
  * In `getHistoricalStats`:
    * Update `match_sessions` query select: `.select("*, team_rating")`
    * Update `historical_ratings` query select: `.select("*, team_rating")`
  * In `getAllPlayersStats`:
    * Update `historical_ratings` select to include `team_rating`:
      ```typescript
      historical_ratings (
        avg_total,
        avg_tecnica,
        avg_fisico,
        avg_actitud,
        avg_vision_juego,
        mvp_count,
        bigpaper_count,
        poop_count,
        team_rating
      )
      ```
    * In `getAllPlayersStats` calculation loop, calculate the player's average team rating:
      ```typescript
      statsMap[profile.id] = {
        ...,
        avgTeamRating: avg("team_rating"),
      };
      ```

---

### Task 5: Frontend Voting UI Component
Create the frontend card component for rating team performance.

**Files:**
* Create: [TeamRatingCard.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/TeamRatingCard.tsx)

- [ ] **Step 1: Write TeamRatingCard component**
  Create the file `src/components/session/TeamRatingCard.tsx` with the complete component details defined in Task 5 of the spec doc.

---

### Task 6: Integrating Team Rating Card
Add the `TeamRatingCard` component to the dashboard.

**Files:**
* Modify: [page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/dashboard/page.tsx)

- [ ] **Step 1: Import and Render TeamRatingCard**
  In `src/app/dashboard/page.tsx`:
  * Import `TeamRatingCard`:
    ```typescript
    import TeamRatingCard from "@/components/session/TeamRatingCard";
    ```
  * Place `TeamRatingCard` in the render block right below the `SessionAwardsCard` block.

---

### Task 7: Team Tab Performance Progression Chart
Add the progression chart to the team history page.

**Files:**
* Modify: [TeamTab.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/history/TeamTab.tsx)

- [ ] **Step 1: Add progression chart to TeamTab**
  In `src/components/history/TeamTab.tsx`:
  * Prepare the team progression series data.
  * Render `StatLineChart` showing team ratings progression.

---

### Task 8: Personal Tab Team Card
Display the team performance average when this player was on the team.

**Files:**
* Modify: [PersonalTab.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/history/PersonalTab.tsx)

- [ ] **Step 1: Add Prom. Equipo card to statCards array**
  In `src/components/history/PersonalTab.tsx`:
  * Update `statCards` list mapping to append the new card.

---

## Verification Plan

### Automated Verification
* Run build to ensure no TypeScript compilation errors:
  `npm run build`

### Manual Verification
* Access active session and verify that the `TeamRatingCard` is locked until all player cards are rated.
* Verify slider limits cap at player votes average + 1.5.
* Save team rating and verify it stores in `team_ratings`.
* Close match session and check that the average is written to `match_sessions` and `historical_ratings`.
* Access history tabs to verify progression chart and personal stats average.
