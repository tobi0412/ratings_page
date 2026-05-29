# Reveal Mystery Vote Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a "Reveal Mystery Vote" widget on the voting page when no session is active, showing the detailed ratings cast by a random player in the last session.

**Architecture:** Add a DB migration that selects a random voter at session closure and stores their ID in `match_sessions.mystery_player_id`. Create two secure server actions (one for checking status, one for retrieving votes). Create a client component `MysteryVoteWidget` and render it on the dashboard below `SessionStatus` when no active session is found.

**Tech Stack:** Next.js (App Router, Server Actions), Supabase (PostgreSQL), Vanilla CSS / Inline styles.

---

### Task 1: Database Migration Setup

**Files:**
- Create: `supabase/migrations/006_add_mystery_player.sql`

- [ ] **Step 1: Write the migration file**

Create the file `supabase/migrations/006_add_mystery_player.sql` with the following content:

```sql
-- Migration 006: Add mystery_player_id and update compute_historical_ratings

-- 1. Add mystery_player_id column to match_sessions
ALTER TABLE match_sessions
ADD COLUMN IF NOT EXISTS mystery_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- 2. Update compute_historical_ratings function to select a random voter
CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
RETURNS void AS $$
DECLARE
  chosen_player_id UUID;
BEGIN
  -- 2.1 First, run the existing aggregation logic to populate historical_ratings
  INSERT INTO historical_ratings (
    player_id, match_id,
    avg_tecnica, avg_fisico, avg_actitud, avg_vision_juego,
    avg_total, mvp_count
  )
  WITH player_votes AS (
    SELECT
      sp.player_id,
      COUNT(r.id) FILTER (WHERE r.is_mvp = true) AS votes
    FROM session_participants sp
    LEFT JOIN ratings r ON r.receiver_id = sp.player_id AND r.match_id = session_id
    WHERE sp.match_id = session_id
    GROUP BY sp.player_id
  ),
  max_votes_val AS (
    SELECT MAX(votes) AS max_votes FROM player_votes
  ),
  top_players AS (
    SELECT player_id, votes
    FROM player_votes, max_votes_val
    WHERE votes = max_votes AND votes > 0
  ),
  top_count AS (
    SELECT COUNT(*) AS cnt FROM top_players
  ),
  mvp_assignments AS (
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

  -- 2.2 Next, pick a random player who cast at least one rating in this session
  SELECT voter_id INTO chosen_player_id
  FROM ratings
  WHERE match_id = session_id
  GROUP BY voter_id
  ORDER BY random()
  LIMIT 1;

  -- 2.3 Save the chosen mystery player in the session record
  IF chosen_player_id IS NOT NULL THEN
    UPDATE match_sessions
    SET mystery_player_id = chosen_player_id
    WHERE id = session_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 3. Populate existing closed sessions with a random mystery voter if they had votes
DO $$
DECLARE
  sess RECORD;
  chosen_player_id UUID;
BEGIN
  FOR sess IN SELECT id FROM match_sessions WHERE is_active = false AND mystery_player_id IS NULL LOOP
    SELECT voter_id INTO chosen_player_id
    FROM ratings
    WHERE match_id = sess.id
    GROUP BY voter_id
    ORDER BY random()
    LIMIT 1;

    IF chosen_player_id IS NOT NULL THEN
      UPDATE match_sessions
      SET mystery_player_id = chosen_player_id
      WHERE id = sess.id;
    END IF;
  END LOOP;
END $$;
```

---

### Task 2: Server Actions implementation

**Files:**
- Modify: `src/actions/sessions.ts` (append actions at the end of the file)

- [ ] **Step 1: Append server actions to `src/actions/sessions.ts`**

Add the two server actions to the end of `src/actions/sessions.ts`:

```typescript
export async function getLastClosedSessionStatus() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("match_sessions")
    .select("id, name, closed_at, mystery_player_id")
    .eq("is_active", false)
    .order("closed_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }
  
  const session = data[0];
  return {
    id: session.id,
    name: session.name,
    closed_at: session.closed_at,
    hasMysteryPlayer: !!session.mystery_player_id,
  };
}

export async function revealMysteryVote(sessionId: string) {
  const supabase = createSupabaseServerClient();
  
  // 1. Fetch session to get mystery_player_id
  const { data: sessionData, error: sessionError } = await supabase
    .from("match_sessions")
    .select("mystery_player_id")
    .eq("id", sessionId)
    .single();

  if (sessionError || !sessionData?.mystery_player_id) {
    return { error: "No mystery player found for this session" };
  }

  const mysteryPlayerId = sessionData.mystery_player_id;

  // 2. Fetch voter profile
  const { data: voterProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", mysteryPlayerId)
    .single();

  if (profileError || !voterProfile) {
    return { error: "Voter profile not found" };
  }

  // 3. Fetch votes cast by this mystery player
  const { data: votes, error: votesError } = await supabase
    .from("ratings")
    .select("*, receiver:profiles(*)")
    .eq("match_id", sessionId)
    .eq("voter_id", mysteryPlayerId);

  if (votesError) {
    return { error: votesError.message };
  }

  return { voter: voterProfile, votes: votes || [] };
}
```

---

### Task 3: UI Component `MysteryVoteWidget`

**Files:**
- Create: `src/components/session/MysteryVoteWidget.tsx`

- [ ] **Step 1: Create the widget component**

Create the file `src/components/session/MysteryVoteWidget.tsx` with the following content:

```tsx
"use client";

import { useEffect, useState } from "react";
import { getLastClosedSessionStatus, revealMysteryVote } from "@/actions/sessions";
import { StarIcon } from "@/components/Icons";

interface SessionStatusData {
  id: string;
  name: string;
  closed_at: string;
  hasMysteryPlayer: boolean;
}

interface VoterProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface RatingVote {
  id: string;
  receiver_id: string;
  tecnica: number;
  fisico: number;
  actitud: number;
  vision_juego: number;
  is_mvp: boolean;
  receiver: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export default function MysteryVoteWidget() {
  const [session, setSession] = useState<SessionStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReveal, setLoadingReveal] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [voter, setVoter] = useState<VoterProfile | null>(null);
  const [votes, setVotes] = useState<RatingVote[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const data = await getLastClosedSessionStatus();
        setSession(data);
      } catch (err) {
        console.error("Error loading closed session status:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, []);

  async function handleReveal() {
    if (!session) return;
    setLoadingReveal(true);
    setError(null);
    try {
      const result = await revealMysteryVote(session.id);
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("voter" in result && "votes" in result) {
        setVoter(result.voter);
        setVotes(result.votes as any[]);
        setIsRevealed(true);
      }
    } catch (err) {
      setError("No se pudo revelar el voto misterioso. Intenta de nuevo.");
      console.error(err);
    } finally {
      setLoadingReveal(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: "1.5rem",
          background: "rgba(0, 0, 0, 0.2)",
          border: "1px dashed #1c3828",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.85rem", color: "#3d6e50" }}>Buscando votos misteriosos...</span>
      </div>
    );
  }

  if (!session || !session.hasMysteryPlayer) {
    return null;
  }

  return (
    <div
      className="card-sport"
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        border: "1px solid rgba(0, 230, 118, 0.15)",
        background: "linear-gradient(135deg, rgba(28, 56, 40, 0.4) 0%, rgba(10, 20, 15, 0.4) 100%)",
      }}
    >
      {!isRevealed ? (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <span style={{ fontSize: "2rem" }}>🕵️‍♂️</span>
          <h3
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.8rem",
              color: "#e4f0e8",
              margin: "0.5rem 0 0.25rem",
              letterSpacing: "0.05em",
            }}
          >
            Voto Misterioso
          </h3>
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.85rem",
              color: "#3d6e50",
              margin: "0 0 1.25rem",
            }}
          >
            Un jugador al azar de la sesión anterior (<strong>{session.name}</strong>) fue seleccionado. Revelá qué votó y a quién le puso MVP.
          </p>
          
          {error && (
            <p style={{ color: "#ff5252", fontSize: "0.8rem", margin: "0 0 1rem" }}>{error}</p>
          )}

          <button
            onClick={handleReveal}
            disabled={loadingReveal}
            className="btn-lime"
            style={{
              margin: "0 auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            {loadingReveal ? "Revelando..." : "Revelar Voto"}
          </button>
        </div>
      ) : (
        <div
          style={{
            animation: "fadeIn 0.4s ease-out forwards",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(0, 230, 118, 0.2)",
              paddingBottom: "0.75rem",
            }}
          >
            <div>
              <p
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  color: "var(--accent-lime)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  margin: 0,
                }}
              >
                Voto Revelado de la sesión {session.name}
              </p>
              <h3
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.6rem",
                  color: "#e4f0e8",
                  margin: "0.15rem 0 0",
                  letterSpacing: "0.03em",
                }}
              >
                @{voter?.username}
              </h3>
            </div>
            <button
              onClick={() => setIsRevealed(false)}
              style={{
                background: "none",
                border: "none",
                color: "#3d6e50",
                fontSize: "0.75rem",
                cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Ocultar
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.50rem" }}>
            {votes.map((vote) => (
              <div
                key={vote.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(0,0,0,0.2)",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: vote.is_mvp ? "1px solid rgba(255, 171, 64, 0.3)" : "1px solid transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "#e4f0e8",
                    }}
                  >
                    {vote.receiver.username}
                  </span>
                  {vote.is_mvp && (
                    <span
                      style={{
                        background: "rgba(255, 171, 64, 0.15)",
                        border: "1px solid rgba(255, 171, 64, 0.4)",
                        borderRadius: "4px",
                        padding: "0.1rem 0.4rem",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "#ffab40",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <StarIcon size="0.75rem" filled style={{ color: "#ffab40" }} />
                      MVP
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "0.6rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }}>Tec</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "26px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                      }}
                    >
                      {vote.tecnica}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "0.6rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }}>Fís</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "26px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                      }}
                    >
                      {vote.fisico}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "0.6rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }}>Act</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "26px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                      }}
                    >
                      {vote.actitud}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "0.6rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }}>Vis</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "26px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                      }}
                    >
                      {vote.vision_juego}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

---

### Task 4: Dashboard Integration

**Files:**
- Modify: `src/app/dashboard/page.tsx:87-99`

- [ ] **Step 1: Import and render the new widget**

First, import the new component in `src/app/dashboard/page.tsx`:

```tsx
import MysteryVoteWidget from "@/components/session/MysteryVoteWidget";
```

Update the inactive session rendering block (approx lines 87-99) to render both `SessionStatus` and the new `MysteryVoteWidget`:

```tsx
  if (!session) {
    return (
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "2.5rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <SessionStatus session={null} />
        <MysteryVoteWidget />
      </div>
    );
  }
```
