# Reveal Mystery Vote - Design Document

**Date:** 2026-05-29  
**Scope:** Reveal a random voter's ratings in the last closed session, secure against cheating/inspections before action.  
**Stack:** Next.js (App Router) + Supabase (PostgreSQL) + Vanilla CSS

---

## 1. Executive Summary

When there is no active voting session, the voting dashboard (`/dashboard`) shows a "No active sessions" status banner. This feature adds a premium "Reveal Mystery Vote" widget directly underneath that status banner. 

The widget allows users to click a button to reveal the detailed ratings cast by a random participant in the last voting session. This player is chosen automatically at the database level when the session is closed and remains the same for all users. The UI is designed to prevent simple cheating (the player's identity and votes are fetched only upon clicking "Reveal").

---

## 2. Database Schema Changes

The database migration will add a column to store the selected mystery player's ID and update the session closure computation function.

### 2.1 Table Alteration: `match_sessions`
Add a column `mystery_player_id` that references the `profiles` table:
```sql
ALTER TABLE match_sessions
ADD COLUMN mystery_player_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
```

### 2.2 Update to `compute_historical_ratings` Function
Modify `compute_historical_ratings(session_id UUID)` in the database to automatically select a random player who has submitted at least one vote in the session and set it as `mystery_player_id` for the session:

```sql
CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
RETURNS void AS $$
DECLARE
  chosen_player_id UUID;
BEGIN
  -- 1. Run the existing historical aggregates logic (inserts into historical_ratings)
  -- [Existing CTEs and INSERT statement from 005_add_session_participants.sql]
  -- ...

  -- 2. Pick a random player who cast at least one rating in this session
  SELECT voter_id INTO chosen_player_id
  FROM ratings
  WHERE match_id = session_id
  GROUP BY voter_id
  ORDER BY random()
  LIMIT 1;

  -- 3. Save the chosen mystery player in the session record
  UPDATE match_sessions
  SET mystery_player_id = chosen_player_id
  WHERE id = session_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 3. Server Actions (API Layer)

To prevent cheating by inspecting network payloads or React state before clicking, we implement two distinct actions.

### 3.1 `getLastClosedSessionStatus()`
* **Purpose:** Fetch information about the most recent closed session and whether it contains a mystery player.
* **Query:**
  ```typescript
  const { data } = await supabase
    .from("match_sessions")
    .select("id, name, closed_at, mystery_player_id")
    .eq("is_active", false)
    .order("closed_at", { ascending: false })
    .limit(1)
    .single();
  ```
* **Response:** Returns `{ id, name, closed_at, hasMysteryPlayer: !!mystery_player_id }` or `null`. (Identity of the player remains secure).

### 3.2 `revealMysteryVote(sessionId: string)`
* **Purpose:** Retrieve the actual identity and votes of the mystery player for the requested session.
* **Security:** Runs under authentication. Resolves the `mystery_player_id` and queries the votes they submitted.
* **Query:**
  1. Fetch session `mystery_player_id` and check authorization.
  2. Join `ratings` and profiles to return the voter profile and the breakdown of ratings they submitted:
     ```typescript
     const { data: voterProfile } = await supabase
       .from("profiles")
       .select("id, username, avatar_url")
       .eq("id", mysteryPlayerId)
       .single();

     const { data: votes } = await supabase
       .from("ratings")
       .select("*, receiver:profiles(*)")
       .eq("match_id", sessionId)
       .eq("voter_id", mysteryPlayerId);
     ```
* **Response:** Returns `{ voter: voterProfile, votes }`.

---

## 4. Frontend & User Interface

### 4.1 Dashboard Layout Modification (`src/app/dashboard/page.tsx`)
When `session` is `null`, display the layout container with both `SessionStatus` and the new widget:
```tsx
if (!session) {
  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "2.5rem 1.25rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <SessionStatus session={null} />
      <MysteryVoteWidget />
    </div>
  );
}
```

### 4.2 Component Design: `MysteryVoteWidget`
* **Loading State:** Queries `getLastClosedSessionStatus()` inside a `useEffect`. Shows nothing (or a subtle loading skeleton) while fetching.
* **Unrevealed Card State:**
  * Dark theme sports card styling (`card-sport` class).
  * Big header with `Bebas Neue` font: `"VOTO MISTERIOSO"`.
  * Text explaining that a random player's votes are ready to be revealed for the last closed session.
  * A premium action button: `🕵️‍♂️ Revelar Voto`.
* **Revealed Card State:**
  * Animated transition container (fade-in + slide-down).
  * Voter header: `"Voto de @username"` with a custom icon/avatar.
  * A list of teammate rating items.
  * For each teammate:
    * Username/avatar.
    * Grid display of the 4 rated aspects: **Técnica**, **Físico**, **Actitud**, and **Visión de Juego** in pill-sized badges.
    * Golden star or cup badge if `is_mvp === true`: `🏆 MVP`.

---

## 5. Verification Plan

### Manual Verification Steps
1. **Closing active session:** As an admin on the `/admin` page, close the active session.
2. **Database Verification:** Check in the database (Supabase Studio) that:
   * The closed session's `mystery_player_id` is set to one of the voters.
   * `mystery_player_id` is NOT null (unless no one voted).
3. **User Dashboard Check:**
   * Log in as a player/admin.
   * Visit `/dashboard` (with no active session).
   * Confirm the "Voto Misterioso" card is visible below "Sin sesión activa".
   * Click "Revelar Voto" and confirm:
     * A loading state appears.
     * The card displays the voter's identity and detailed rating breakdown for each teammate.
     * The MVP vote is visually highlighted.
