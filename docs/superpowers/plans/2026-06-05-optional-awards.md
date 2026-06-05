# Optional Awards and 50% Threshold Rule Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the "Papelón" (bigpaper) and "Jugador Caca" (poop) awards optional, and if 50% or more of the session participants don't assign an award to anyone, it is not awarded.

**Architecture:** Create a SQL migration to update `compute_historical_ratings` with 50% threshold checks, modify progress logic to only require MVP selected to mark awards completed, and update UI to display and handle the "Ninguno" selection.

**Tech Stack:** Next.js, React, Supabase PostgreSQL, TypeScript.

---

### Task 1: Create Database Migration

**Files:**
- Create: `supabase/migrations/013_make_awards_optional.sql`

- [ ] **Step 1: Write database migration**
  Create the migration file to update the `compute_historical_ratings` function with the 50% threshold check.
  
  ```sql
  -- Create migration 013 to make awards optional and enforce 50% threshold
  CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
  RETURNS void AS $$
  DECLARE
    chosen_player_id UUID;
    total_participants INT;
    total_bigpaper_votes INT;
    total_poop_votes INT;
  BEGIN
    -- Get the total number of participants in this session
    SELECT COUNT(*) INTO total_participants
    FROM session_participants
    WHERE match_id = session_id;

    -- Calculate totals of cast votes for the optional awards
    SELECT 
      COUNT(id) FILTER (WHERE is_bigpaper = true),
      COUNT(id) FILTER (WHERE is_poop = true)
    INTO total_bigpaper_votes, total_poop_votes
    FROM ratings
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
        -- Bigpaper (Papelón) is assigned if votes cast > 50% of total session participants AND top list counts IN (1, 2)
        CASE WHEN (total_bigpaper_votes * 2 > total_participants)
                  AND (SELECT bigpaper_cnt FROM counts) IN (1, 2)
                  AND pv.player_id IN (SELECT player_id FROM top_bigpapers) THEN 1 ELSE 0 END AS assigned_bigpaper,
        -- Poop (Jugador Caca) is assigned if votes cast > 50% of total session participants AND top list counts IN (1, 2)
        CASE WHEN (total_poop_votes * 2 > total_participants)
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

- [ ] **Step 2: Commit Task 1**
  Run:
  ```bash
  git add supabase/migrations/013_make_awards_optional.sql
  git commit -m "migration: update compute_historical_ratings with 50 percent threshold checks for optional awards"
  ```

---

### Task 2: Update Server Voting Progress Action

**Files:**
- Modify: `src/actions/sessions.ts`

- [ ] **Step 1: Modify `getSessionVotingProgress` in `src/actions/sessions.ts`**
  Modify the `awardsCompleted` assignment logic to check if MVP is selected:
  ```typescript
      // In src/actions/sessions.ts around lines 220-222:
      const hasMvp = voterRatings.some((r) => r.is_mvp === true);
      const hasBigpaper = voterRatings.some((r) => r.is_bigpaper === true);
      const hasPoop = voterRatings.some((r) => r.is_poop === true);
      const awardsCompleted = hasMvp;
  ```

- [ ] **Step 2: Commit Task 2**
  Run:
  ```bash
  git add src/actions/sessions.ts
  git commit -m "feat: make bigpaper and poop awards optional in server voting progress completion check"
  ```

---

### Task 3: Update Client Voting Progress Calculation

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Modify `awardsComplete` logic in `src/app/dashboard/page.tsx`**
  Modify the definition of `awardsComplete` on client side:
  ```typescript
    // In src/app/dashboard/page.tsx around lines 186-189:
    const awardsComplete = myVotes.some((v) => v.is_mvp);
  ```

- [ ] **Step 2: Commit Task 3**
  Run:
  ```bash
  git add src/app/dashboard/page.tsx
  git commit -m "feat: update client awardsComplete logic to only check MVP"
  ```

---

### Task 4: Implement "Ninguno" Option in SessionAwardsCard Dropdowns

**Files:**
- Modify: `src/components/session/SessionAwardsCard.tsx`

- [ ] **Step 1: Update Dropdown Trigger label to display "Ninguno (Opcional)"**
  Replace lines 204-208 in `src/components/session/SessionAwardsCard.tsx` to handle optional types:
  ```typescript
              ) : (
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: "0.92rem", color: "var(--text-muted)", opacity: 0.8 }}>
                  {awardType === "mvp" ? "Seleccionar jugador..." : "Ninguno (Opcional)"}
                </span>
              )}
  ```

- [ ] **Step 2: Prepend the "Ninguno" option in the options menu**
  Inject a "Ninguno" item at the top of the option list in `SessionAwardsCard.tsx` when `awardType !== "mvp"`:
  ```typescript
            {awardType !== "mvp" && (
              <div
                key="none"
                onClick={() => handleSelect("")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.5rem 0.65rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: selectedId === "" ? `${color}15` : "transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = selectedId === "" ? `${color}25` : "rgba(0, 230, 118, 0.08)";
                  e.currentTarget.style.transform = "translateX(3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = selectedId === "" ? `${color}15` : "transparent";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: selectedId === "" ? `${color}25` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${selectedId === "" ? color : "rgba(255,255,255,0.1)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "0.75rem",
                    color: selectedId === "" ? color : "var(--text-muted)",
                    overflow: "hidden",
                    flexShrink: 0
                  }}
                >
                  ✖
                </div>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    color: selectedId === "" ? color : "#e4f0e8"
                  }}
                >
                  Ninguno (Opcional)
                </span>
              </div>
            )}
  ```

- [ ] **Step 3: Commit Task 4**
  Run:
  ```bash
  git add src/components/session/SessionAwardsCard.tsx
  git commit -m "feat: add explicit Ninguno option to optional awards dropdowns"
  ```

---

### Task 5: Build and Verify Changes

- [ ] **Step 1: Build Next.js application**
  Run: `npm run build`
  Expected: Builds successfully with no compilation errors.

- [ ] **Step 2: Commit Task 5**
  Run:
  ```bash
  git commit --allow-empty -m "build: verify compilation passes"
  ```
