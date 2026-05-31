# Session Voting Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce that a voter can only choose one MVP per session (with parent state syncing and DB constraint) and show voting progress checklist to the admin in the admin panel.

**Architecture:** 
1. Database partial unique index on `ratings(match_id, voter_id) WHERE is_mvp = true`.
2. Update Server Action `submitRating` to reset any existing MVP choice for that voter before upserting.
3. Sync state in `DashboardPage` and `VotingCard` to automatically uncheck other cards when one is selected.
4. Implement `getSessionVotingProgress` server action to calculate voter completion rates.
5. Add progress overview component and voter checklist under the active session banner in the admin panel.

**Tech Stack:** Next.js (App Router, Server Actions), Supabase (PostgreSQL), Vanilla CSS / Tailwind CSS.

---

### Task 1: Database Migration Setup

**Files:**
- Create: `supabase/migrations/007_add_unique_mvp_constraint.sql`

- [ ] **Step 1: Create the migration file**

Create `supabase/migrations/007_add_unique_mvp_constraint.sql` with the following content:

```sql
-- Migration 007: Add unique constraint for single MVP per voter/match

CREATE UNIQUE INDEX IF NOT EXISTS unique_voter_mvp_per_match 
ON ratings (match_id, voter_id) 
WHERE (is_mvp = true);
```

- [ ] **Step 2: Commit database migration**

```bash
git add supabase/migrations/007_add_unique_mvp_constraint.sql
git commit -m "db: add partial unique constraint for single mvp per match"
```

---

### Task 2: Server Action Update for MVP Reset

**Files:**
- Modify: `src/actions/ratings.ts`

- [ ] **Step 1: Modify `submitRating`**

Open `src/actions/ratings.ts` and modify the `submitRating` action around lines 7-41 to reset other MVP flags for the voter before upserting.

```typescript
export async function submitRating(input: RatingInput) {
  const supabase = createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: "Not authenticated" };
  }

  // 1. If this rating is marked as MVP, reset other MVP votes by this user in this match
  if (input.is_mvp) {
    const { error: resetError } = await supabase
      .from("ratings")
      .update({ is_mvp: false })
      .eq("match_id", input.match_id)
      .eq("voter_id", profile.id)
      .neq("receiver_id", input.receiver_id);

    if (resetError) {
      return { error: `Failed to reset previous MVP: ${resetError.message}` };
    }
  }

  // Atomic upsert — avoids the check-then-insert race condition
  // ON CONFLICT targets the unique constraint (match_id, voter_id, receiver_id)
  const { data, error } = await supabase
    .from("ratings")
    .upsert(
      {
        match_id: input.match_id,
        voter_id: profile.id,
        receiver_id: input.receiver_id,
        tecnica: input.tecnica,
        fisico: input.fisico,
        actitud: input.actitud,
        vision_juego: input.vision_juego,
        is_mvp: input.is_mvp,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,voter_id,receiver_id" },
    )
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, success: true };
}
```

- [ ] **Step 2: Commit changes**

```bash
git add src/actions/ratings.ts
git commit -m "feat: reset other MVP nominations in submitRating server action"
```

---

### Task 3: Client Syncing in Dashboard & Voting Card

**Files:**
- Modify: `src/app/dashboard/page.tsx`
- Modify: `src/components/session/VotingCard.tsx`

- [ ] **Step 1: Modify `src/app/dashboard/page.tsx`**

Update the `onSuccess` function inside the `players.map` rendering block (lines 251-261) to reset the `is_mvp` flag on other votes in the local state when one player is saved as MVP:

```typescript
                onSuccess={(newRating) => {
                  setMyVotes((prev) => {
                    let updated = prev;
                    if (newRating.is_mvp) {
                      updated = prev.map((v) =>
                        v.receiver_id !== newRating.receiver_id ? { ...v, is_mvp: false } : v
                      );
                    }
                    const exists = updated.some((v) => v.receiver_id === newRating.receiver_id);
                    if (exists) {
                      return updated.map((v) =>
                        v.receiver_id === newRating.receiver_id ? newRating : v
                      );
                    }
                    return [...updated, newRating];
                  });
                }}
```

- [ ] **Step 2: Modify `src/components/session/VotingCard.tsx`**

Add an import for `useEffect` if not present, and add a `useEffect` inside `VotingCard` to sync the local `isMvp` state with the parent's `existingRating?.is_mvp` prop.

Import:
```typescript
import { useState, useEffect } from "react";
```

Inside the `VotingCard` component, add the effect:
```typescript
  // Sync checkbox state when the parent rating changes (e.g., cleared by another card's MVP choice)
  useEffect(() => {
    setIsMvp(existingRating?.is_mvp || false);
  }, [existingRating?.is_mvp]);
```

- [ ] **Step 3: Commit changes**

```bash
git add src/app/dashboard/page.tsx src/components/session/VotingCard.tsx
git commit -m "feat: sync MVP selection across player cards in voting dashboard"
```

---

### Task 4: Admin Server Action for Voting Progress

**Files:**
- Modify: `src/actions/sessions.ts`

- [ ] **Step 1: Append `getSessionVotingProgress` action**

Open `src/actions/sessions.ts` and append the new server action to retrieve voting progress:

```typescript
export async function getSessionVotingProgress(sessionId: string) {
  const supabase = createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can view voting progress" };
  }

  // 1. Get all session participants
  const { data: participantsData, error: partError } = await supabase
    .from("session_participants")
    .select("player:profiles(*)")
    .eq("match_id", sessionId);

  if (partError || !participantsData) {
    return { error: partError?.message || "Failed to load participants" };
  }

  const participants = participantsData.map((d: any) => d.player).filter(Boolean) as Profile[];
  const totalParticipants = participants.length;

  // 2. Get ratings count grouped by voter_id for this match
  const { data: ratingsData, error: ratingsError } = await supabase
    .from("ratings")
    .select("voter_id")
    .eq("match_id", sessionId);

  if (ratingsError) {
    return { error: ratingsError.message };
  }

  const voteCounts: Record<string, number> = {};
  for (const rating of ratingsData || []) {
    voteCounts[rating.voter_id] = (voteCounts[rating.voter_id] || 0) + 1;
  }

  const progress = participants.map((player) => {
    const votesSubmitted = voteCounts[player.id] || 0;
    // A player votes for all other participants (total - 1)
    const maxVotes = Math.max(0, totalParticipants - 1);
    
    return {
      player,
      votesSubmitted,
      maxVotes,
      isCompleted: votesSubmitted >= maxVotes && maxVotes > 0,
      hasStarted: votesSubmitted > 0,
    };
  });

  return { data: progress, success: true };
}
```

- [ ] **Step 2: Commit changes**

```bash
git add src/actions/sessions.ts
git commit -m "feat: add getSessionVotingProgress server action for admins"
```

---

### Task 5: Admin UI Voting Checklist

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Import new action and add state**

Import `getSessionVotingProgress` in `src/app/admin/page.tsx`:
```typescript
import {
  createSession,
  closeSession,
  getAllSessions,
  getActiveSessions,
  getSessionVotingProgress, // <-- Add this
} from "@/actions/sessions";
```

Add state for progress in `AdminPage` component:
```typescript
  const [votingProgress, setVotingProgress] = useState<any[]>([]);
```

- [ ] **Step 2: Load voting progress in `loadSessions()`**

Modify `loadSessions()` to fetch progress when an active session is found:
```typescript
  async function loadSessions() {
    const [all, active] = await Promise.all([
      getAllSessions(),
      getActiveSessions(),
    ]);
    setSessions(all);
    
    const activeSess = active.length > 0 ? active[0] : null;
    setActiveSession(activeSess);

    if (activeSess) {
      const progressResult = await getSessionVotingProgress(activeSess.id);
      if (progressResult.success && progressResult.data) {
        setVotingProgress(progressResult.data);
      }
    } else {
      setVotingProgress([]);
    }
  }
```

- [ ] **Step 3: Render the Checklist under the Active Session**

Insert the progress list layout inside the active session banner card, right below the active session title (around line 282, inside the flex row or as a new section inside the banner):

Specifically, look at the Active Session banner container:
```tsx
          {activeSession && (
            <div
              className="card-sport-active animate-slide-up animate-glow-pulse stagger-1"
              style={{ padding: "1.5rem" }}
            >
...
```

Add a detailed checklist area right below the session header details. Update the active session banner component return block to be:

```tsx
          {/* Active session banner */}
          {activeSession && (
            <div
              className="card-sport-active animate-slide-up animate-glow-pulse stagger-1"
              style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                  }}
                >
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "#00e676",
                      boxShadow: "0 0 10px #00e676",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.6rem",
                        marginBottom: "0.2rem",
                      }}
                    >
                      <h2
                        style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: "1.4rem",
                          letterSpacing: "0.05em",
                          color: "#e4f0e8",
                          margin: 0,
                        }}
                      >
                        {activeSession.name}
                      </h2>
                      <span className="badge-active">Activa</span>
                    </div>
                    <p
                      style={{
                        fontFamily: "'Barlow', sans-serif",
                        fontSize: "0.8rem",
                        color: "#3d6e50",
                        margin: 0,
                      }}
                    >
                      Inicio:{" "}
                      {new Date(activeSession.created_at).toLocaleString(
                        "es-AR",
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseSession}
                  disabled={loading}
                  className="btn-danger"
                >
                  {loading ? "Cerrando..." : "Cerrar sesión"}
                </button>
              </div>

              {/* Progress Checklist section */}
              {votingProgress.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(0,230,118,0.15)", paddingTop: "1.25rem" }}>
                  <h3
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1.2rem",
                      letterSpacing: "0.05em",
                      color: "#e4f0e8",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Progreso de Votos ({votingProgress.filter(p => p.isCompleted).length} de {votingProgress.length} completados)
                  </h3>
                  
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    {votingProgress.map((item) => {
                      let badgeColor = "#555";
                      let badgeBg = "rgba(255,255,255,0.05)";
                      let statusText = "Pendiente";
                      
                      if (item.isCompleted) {
                        badgeColor = "#00e676";
                        badgeBg = "rgba(0,230,118,0.12)";
                        statusText = "Completado";
                      } else if (item.hasStarted) {
                        badgeColor = "#ffab40";
                        badgeBg = "rgba(255,171,64,0.12)";
                        statusText = "En Progreso";
                      }

                      return (
                        <div
                          key={item.player.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: "rgba(0,0,0,0.2)",
                            padding: "0.6rem 0.8rem",
                            borderRadius: "8px",
                            border: "1px solid rgba(0,0,0,0.3)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div
                              style={{
                                width: "28px",
                                height: "28px",
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.05)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontFamily: "'Bebas Neue', sans-serif",
                                fontSize: "0.85rem",
                                color: "#e4f0e8",
                                overflow: "hidden",
                              }}
                            >
                              {item.player.avatar_url ? (
                                <img
                                  src={item.player.avatar_url}
                                  alt={item.player.username}
                                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                (item.player.username?.[0]?.toUpperCase() ?? "?")
                              )}
                            </div>
                            <span
                              style={{
                                fontFamily: "'Barlow Condensed', sans-serif",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                color: "#e4f0e8",
                              }}
                            >
                              {item.player.username}
                            </span>
                          </div>

                          <span
                            style={{
                              fontFamily: "'Barlow Condensed', sans-serif",
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              color: badgeColor,
                              background: badgeBg,
                              border: `1px solid ${badgeColor}33`,
                              padding: "0.15rem 0.4rem",
                              borderRadius: "4px",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                            }}
                          >
                            {statusText} ({item.votesSubmitted}/{item.maxVotes})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
```

- [ ] **Step 4: Commit changes**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: show voting progress checklist in admin active session banner"
```
