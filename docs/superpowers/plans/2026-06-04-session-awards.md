# Session Awards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two new session awards, "Papelón de la sesión" (`is_bigpaper` / `bigpaper_count`) and "Jugador caca" (`is_poop` / `poop_count`), move MVP voting out of individual cards into a centralized "Premios de la Sesión" widget, enforce mandatory award voting, and display them in closed session results and all-time leaderboards.

**Architecture:** We will extend the `ratings` database table with two new boolean flags, create database unique partial index constraints to enforce one recipient per voter per match session, update the `compute_historical_ratings` SQL function to aggregate award counts with a 2-player tie-resolution logic, and update NextJS server actions and client components to select, save, and display the awards.

**Tech Stack:** NextJS (App Router), Supabase, React, TailwindCSS / CSS.

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/011_add_bigpaper_and_poop_awards.sql`

- [ ] **Step 1: Create migration file**
  Create `supabase/migrations/011_add_bigpaper_and_poop_awards.sql` with the following content:
  ```sql
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
  ```

- [ ] **Step 2: Save the file** (Verify file contents are written correctly, do not commit)

---

### Task 2: TypeScript Types Update

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Update Rating, RatingInput, HistoricalRating, and PlayerStats interfaces**
  Open `src/types/index.ts` and modify these types to include `is_bigpaper`, `is_poop`, `bigpaper_count`, `poop_count`, `bigpaperCount`, `poopCount`:
  ```typescript
  export interface Rating {
    id: string;
    match_id: string;
    voter_id: string;
    receiver_id: string;
    tecnica: number | null;
    fisico: number | null;
    actitud: number | null;
    vision_juego: number | null;
    is_mvp: boolean;
    is_bigpaper: boolean; // Added
    is_poop: boolean;     // Added
    created_at: string;
    updated_at: string;
  }

  export interface HistoricalRating {
    id: string;
    player_id: string;
    match_id: string;
    avg_tecnica: number | null;
    avg_fisico: number | null;
    avg_actitud: number | null;
    avg_vision_juego: number | null;
    avg_total: number | null;
    mvp_count: number;
    bigpaper_count: number; // Added
    poop_count: number;     // Added
    computed_at: string;
  }

  export interface RatingInput {
    match_id: string;
    receiver_id: string;
    tecnica: number | null;
    fisico: number | null;
    actitud: number | null;
    vision_juego: number | null;
    is_mvp: boolean;
    is_bigpaper?: boolean; // Added
    is_poop?: boolean;     // Added
  }

  export interface PlayerStats {
    profile: Profile;
    avgTotal: number;
    avgTecnica: number;
    avgFisico: number;
    avgActitud: number;
    avgVision: number;
    mvpCount: number;
    bigpaperCount: number; // Added
    poopCount: number;     // Added
    sessionsCount: number;
  }
  ```

---

### Task 3: Implement Backend Server Actions

**Files:**
- Modify: `src/actions/ratings.ts`
- Modify: `src/actions/stats.ts`

- [ ] **Step 1: Add submitSessionAwards to `src/actions/ratings.ts`**
  Add the `submitSessionAwards` action and import it. Also, update `submitRating` to default/unset `is_bigpaper` and `is_poop` to `false` when executing standard rating upsert so they are not reset unexpectedly.
  ```typescript
  export async function submitSessionAwards(input: {
    match_id: string;
    mvp_id: string;
    bigpaper_id: string;
    poop_id: string;
  }) {
    const supabase = createSupabaseServerClient();
    const profile = await getCurrentProfile();

    if (!profile) {
      return { error: "Not authenticated" };
    }

    // 1. Reset all special flags for this voter in this match session
    const { error: resetError } = await supabase
      .from("ratings")
      .update({ is_mvp: false, is_bigpaper: false, is_poop: false })
      .eq("match_id", input.match_id)
      .eq("voter_id", profile.id);

    if (resetError) {
      return { error: `Failed to reset previous awards: ${resetError.message}` };
    }

    // Helper to upsert a rating row with an award flag set to true
    const saveAward = async (receiverId: string, awardField: "is_mvp" | "is_bigpaper" | "is_poop") => {
      if (!receiverId) return;

      // Check if a row already exists
      const { data: existing } = await supabase
        .from("ratings")
        .select("id, tecnica, fisico, actitud, vision_juego")
        .eq("match_id", input.match_id)
        .eq("voter_id", profile.id)
        .eq("receiver_id", receiverId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("ratings")
          .update({ [awardField]: true })
          .eq("id", existing.id);
      } else {
        await supabase
          .from("ratings")
          .insert({
            match_id: input.match_id,
            voter_id: profile.id,
            receiver_id: receiverId,
            tecnica: null,
            fisico: null,
            actitud: null,
            vision_juego: null,
            [awardField]: true,
            is_mvp: awardField === "is_mvp",
            is_bigpaper: awardField === "is_bigpaper",
            is_poop: awardField === "is_poop",
          });
      }
    };

    try {
      await saveAward(input.mvp_id, "is_mvp");
      await saveAward(input.bigpaper_id, "is_bigpaper");
      await saveAward(input.poop_id, "is_poop");
      return { success: true };
    } catch (err: any) {
      return { error: err.message || "Failed to save awards" };
    }
  }
  ```

- [ ] **Step 2: Update `getAllPlayersStats` in `src/actions/stats.ts`**
  Modify the profile stats select string and mapper to retrieve and sum `bigpaper_count` and `poop_count`:
  ```typescript
  // In the query:
      historical_ratings (
        avg_total,
        avg_tecnica,
        avg_fisico,
        avg_actitud,
        avg_vision_juego,
        mvp_count,
        bigpaper_count,
        poop_count
      )
  ```
  And inside the `profiles?.forEach(...)` mapper:
  ```typescript
      statsMap[profile.id] = {
        profile: profileData,
        avgTotal: avg("avg_total"),
        avgTecnica: avg("avg_tecnica"),
        avgFisico: avg("avg_fisico"),
        avgActitud: avg("avg_actitud"),
        avgVision: avg("avg_vision_juego"),
        mvpCount: playerRatings.reduce((sum, r) => sum + (r.mvp_count || 0), 0),
        bigpaperCount: playerRatings.reduce((sum, r) => sum + (r.bigpaper_count || 0), 0),
        poopCount: playerRatings.reduce((sum, r) => sum + (r.poop_count || 0), 0),
        sessionsCount: playerRatings.length,
      };
  ```

---

### Task 4: Create Centralized Awards Selector UI

**Files:**
- Create: `src/components/session/SessionAwardsCard.tsx`

- [ ] **Step 1: Implement `SessionAwardsCard`**
  Create the component with three dropdown lists containing players. Auto-save selections instantly when they change.
  ```tsx
  "use client";

  import { submitSessionAwards } from "@/actions/ratings";
  import { Profile, Rating } from "@/types";
  import { useState, useEffect } from "react";
  import { StarIcon, CheckIcon } from "@/components/Icons";

  // Simple mask icon
  function MaskIcon({ size = 16, style = {} }) {
    return (
      <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a10 10 0 0 0-10 10c0 5.523 4.477 10 10 10s10-4.477 10-10A10 10 0 0 0 12 2z" />
        <path d="M8 14s1.5 2 4 2 4-2 4-2" />
        <line x1="9" y1="9" x2="9.01" y2="9" />
        <line x1="15" y1="9" x2="15.01" y2="9" />
      </svg>
    );
  }

  // Simple poop/frown icon
  function PoopIcon({ size = 16, style = {} }) {
    return (
      <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 16c0 3.3 2.7 6 6 6h6c3.3 0 6-2.7 6-6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3z" />
        <path d="M7 10c0-1.8 1.5-3 3.5-3 .7 0 1.2.2 1.5.5.3-.3.8-.5 1.5-.5 2 0 3.5 1.2 3.5 3" />
        <path d="M12 7V3" />
      </svg>
    );
  }

  interface SessionAwardsCardProps {
    players: Profile[];
    matchId: string;
    initialVotes: Rating[];
    onAwardsChanged: (updatedVotes: Rating[]) => void;
  }

  export default function SessionAwardsCard({
    players,
    matchId,
    initialVotes,
    onAwardsChanged,
  }: SessionAwardsCardProps) {
    const [mvpId, setMvpId] = useState("");
    const [bigpaperId, setBigpaperId] = useState("");
    const [poopId, setPoopId] = useState("");
    const [loading, setLoading] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
      const mvp = initialVotes.find((v) => v.is_mvp)?.receiver_id || "";
      const bigpaper = initialVotes.find((v) => v.is_bigpaper)?.receiver_id || "";
      const poop = initialVotes.find((v) => v.is_poop)?.receiver_id || "";
      setMvpId(mvp);
      setBigpaperId(bigpaper);
      setPoopId(poop);
    }, [initialVotes]);

    const handleSave = async (updatedMvp: string, updatedBigpaper: string, updatedPoop: string) => {
      setLoading(true);
      setError("");
      setSaved(false);

      const res = await submitSessionAwards({
        match_id: matchId,
        mvp_id: updatedMvp,
        bigpaper_id: updatedBigpaper,
        poop_id: updatedPoop,
      });

      if (res.error) {
        setError(res.error);
      } else {
        setSaved(true);
        // Create mock/partial updated ratings for local state to update the progress bar
        const updatedRatings: Rating[] = [];
        const uniqueReceivers = Array.from(new Set([updatedMvp, updatedBigpaper, updatedPoop]));
        uniqueReceivers.forEach((receiverId) => {
          if (!receiverId) return;
          updatedRatings.push({
            id: `temp-${receiverId}`,
            match_id: matchId,
            voter_id: "",
            receiver_id: receiverId,
            tecnica: null,
            fisico: null,
            actitud: null,
            vision_juego: null,
            is_mvp: receiverId === updatedMvp,
            is_bigpaper: receiverId === updatedBigpaper,
            is_poop: receiverId === updatedPoop,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        });
        onAwardsChanged(updatedRatings);
      }
      setLoading(false);
    };

    return (
      <div className="card-sport animate-slide-up" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", letterSpacing: "0.06em", color: "#e4f0e8", margin: "0 0 1rem" }}>
          Premios de la Sesión
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* MVP Select */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#ffc93c", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <StarIcon size={14} filled={true} style={{ color: "#ffc93c" }} />
              MVP DE LA SESIÓN
            </label>
            <select
              value={mvpId}
              onChange={(e) => {
                setMvpId(e.target.value);
                handleSave(e.target.value, bigpaperId, poopId);
              }}
              className="form-control"
              style={{ background: "#060d09", border: "1px solid #1c3828", color: "#e4f0e8", padding: "0.6rem", borderRadius: "6px", width: "100%", outline: "none" }}
            >
              <option value="">Seleccionar jugador...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.username}</option>
              ))}
            </select>
          </div>

          {/* Bigpaper Select */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#ffab40", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <MaskIcon size={14} style={{ color: "#ffab40" }} />
              PAPELÓN DE LA SESIÓN
            </label>
            <select
              value={bigpaperId}
              onChange={(e) => {
                setBigpaperId(e.target.value);
                handleSave(mvpId, e.target.value, poopId);
              }}
              className="form-control"
              style={{ background: "#060d09", border: "1px solid #1c3828", color: "#e4f0e8", padding: "0.6rem", borderRadius: "6px", width: "100%", outline: "none" }}
            >
              <option value="">Seleccionar jugador...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.username}</option>
              ))}
            </select>
          </div>

          {/* Poop Select */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <label style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.85rem", color: "#ffd740", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              <PoopIcon size={14} style={{ color: "#ffd740" }} />
              JUGADOR CACA
            </label>
            <select
              value={poopId}
              onChange={(e) => {
                setPoopId(e.target.value);
                handleSave(mvpId, bigpaperId, e.target.value);
              }}
              className="form-control"
              style={{ background: "#060d09", border: "1px solid #1c3828", color: "#e4f0e8", padding: "0.6rem", borderRadius: "6px", width: "100%", outline: "none" }}
            >
              <option value="">Seleccionar jugador...</option>
              {players.map((p) => (
                <option key={p.id} value={p.id}>{p.username}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div style={{ marginTop: "1rem", color: "#ff5252", fontSize: "0.85rem" }}>{error}</div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1rem", height: "20px" }}>
          {loading && <span style={{ fontSize: "0.8rem", color: "#3d6e50" }}>Guardando premios...</span>}
          {saved && !loading && (
            <span style={{ fontSize: "0.8rem", color: "#00e676", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
              <CheckIcon size={12} strokeWidth={3} />
              Premios guardados
            </span>
          )}
        </div>
      </div>
    );
  }
  ```

---

### Task 5: Refactor Player Rating Card UI

**Files:**
- Modify: `src/components/session/VotingCard.tsx`

- [ ] **Step 1: Remove MVP toggle block from VotingCard**
  Delete the MVP checkbox structure (lines 363-412) completely and clean up unused states/effects related to `isMvp` and `setIsMvp`. Make sure that when saving a card, it does NOT pass `is_mvp` anymore (or defaults it to `false`).

---

### Task 6: Update Dashboard Page and Voting Progress

**Files:**
- Modify: `src/components/session/VotingProgress.tsx`
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Update VotingProgress Component**
  Modify `VotingProgress.tsx` to display separate metrics for Player Ratings and Session Awards, showing checkboxes for both.
  ```tsx
  "use client";

  interface VotingProgressProps {
    totalPlayers: number;
    ratedCount: number;
    awardsComplete: boolean;
  }

  export default function VotingProgress({
    totalPlayers,
    ratedCount,
    awardsComplete,
  }: VotingProgressProps) {
    const totalSteps = totalPlayers + 1; // players + awards
    const completedSteps = ratedCount + (awardsComplete ? 1 : 0);
    const percentage = totalSteps > 0 ? Math.floor((completedSteps / totalSteps) * 100) : 0;

    return (
      <div className="card-sport" style={{ padding: "1.25rem 1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.75rem" }}>
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.8rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#3d6e50" }}>
            Progreso de Votación
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#00e676", letterSpacing: "0.04em", lineHeight: 1 }}>
              {completedSteps}
            </span>
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.85rem", color: "#3d6e50" }}>
              / {totalSteps} tareas
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", height: "6px", background: "#1c3828", borderRadius: "3px", overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${percentage}%`, background: "linear-gradient(90deg, #00e676, #1ded87)", borderRadius: "3px", transition: "width 0.5s ease", boxShadow: "0 0 10px rgba(0,230,118,0.5)" }} />
        </div>

        {/* Checklist */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem", marginTop: "0.75rem", fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.8rem", color: "#3d6e50" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ color: ratedCount === totalPlayers ? "#00e676" : "#ff5252" }}>
              {ratedCount === totalPlayers ? "✓" : "○"}
            </span>
            <span>Calificar a los compañeros ({ratedCount} / {totalPlayers})</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ color: awardsComplete ? "#00e676" : "#ff5252" }}>
              {awardsComplete ? "✓" : "○"}
            </span>
            <span>Elegir los Premios de la Sesión</span>
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Update `src/app/dashboard/page.tsx`**
  Import `SessionAwardsCard`. In `DashboardPage`, integrate the `SessionAwardsCard` at the top of the content. Bind the `onAwardsChanged` event to update `myVotes` state (making sure to merge or replace existing awards flags while keeping other ratings intact). Pass `ratedCount` (number of players with ratings saved) and `awardsComplete` (whether MVP, Bigpaper, and Poop are all selected) to `VotingProgress`.

---

### Task 7: Generalize MVPRanking to AwardRanking

**Files:**
- Modify: `src/components/charts/MVPRanking.tsx` (or refactor to a generic AwardRanking)

- [ ] **Step 1: Refactor component to generic Award ranking**
  We will generalize the component to support rendering any leaderboard. It will accept custom titles, badge classes, and award names:
  ```tsx
  "use client";

  import { MedalIcon } from "@/components/Icons";

  interface AwardEntry {
    player_id: string;
    username: string;
    count: number;
  }

  interface AwardRankingProps {
    entries: AwardEntry[];
    badgeText: string;
    badgeClass?: string;
  }

  export default function AwardRanking({ entries, badgeText, badgeClass = "badge-gold" }: AwardRankingProps) {
    if (entries.length === 0) {
      return (
        <div className="card-sport" style={{ padding: "1.25rem" }}>
          <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.9rem", color: "#3d6e50", textAlign: "center", margin: 0 }}>
            Sin registros
          </p>
        </div>
      );
    }

    let currentRank = 1;
    const ranked = entries.map((entry, index) => {
      if (index > 0 && entry.count !== entries[index - 1].count) {
        currentRank = index + 1;
      }
      return { ...entry, rank: currentRank };
    });

    return (
      <div className="card-sport">
        {ranked.map((entry, index) => (
          <div
            key={entry.player_id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.6rem 0.75rem",
              borderBottom: index < ranked.length - 1 ? "1px solid rgba(28,56,40,0.5)" : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1rem", color: "#3d6e50", minWidth: "28px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                {entry.rank === 1 ? (
                  <MedalIcon size={18} style={{ color: "#ffc93c" }} />
                ) : entry.rank === 2 ? (
                  <MedalIcon size={18} style={{ color: "#a0c4ac" }} />
                ) : entry.rank === 3 ? (
                  <MedalIcon size={18} style={{ color: "#ff6e40" }} />
                ) : (
                  `#${entry.rank}`
                )}
              </span>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: "#e4f0e8", letterSpacing: "0.05em" }}>
                {entry.username}
              </span>
            </div>
            <span className={badgeClass}>{entry.count} {badgeText}</span>
          </div>
        ))}
      </div>
    );
  }
  ```

---

### Task 8: Display Awards in Closed Session Results & Profile

**Files:**
- Modify: `src/app/latest/page.tsx`
- Modify: `src/components/history/TeamTab.tsx`
- Modify: `src/components/history/PersonalTab.tsx`

- [ ] **Step 1: Update `src/app/latest/page.tsx`**
  Modify it to compile and extract `latestTopBigpapers` and `latestTopPoops` from `latestRatings` (where `bigpaper_count > 0` and `poop_count > 0`), and pass them to `TeamTab`.

- [ ] **Step 2: Update `src/components/history/TeamTab.tsx`**
  1. Update single-session view: display three columns/winners side-by-side for MVP, Papelón de la sesión, and Jugador caca.
  2. Update multi-session (historical) view: display three separate leaderboards using `AwardRanking` for Ranking MVPs, Ranking Papelón, and Ranking Jugador Caca.

- [ ] **Step 3: Update `src/components/history/PersonalTab.tsx`**
  1. Add "Papelones" and "Jugador Caca" counts to the stats grid.
  2. Implement visual banner notifications at the top of the personal tab if the selected player won MVP, Papelón, or Jugador Caca in that session.
