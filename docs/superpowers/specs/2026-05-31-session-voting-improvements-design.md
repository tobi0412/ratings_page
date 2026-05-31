# Session Voting Improvements - Design Document

**Date:** 2026-05-31  
**Scope:** Enforce single MVP selection per voter and show voting progress details to the admin.  
**Stack:** Next.js (App Router) + Supabase (PostgreSQL) + Vanilla CSS

---

## 1. Executive Summary

This feature addresses two core usability improvements for the voting system:
1. **Single MVP Restriction:** A voter evaluating players in an active session can nominate at most one player as the MVP. Checking the MVP box on a player's card will automatically unselect the MVP status on any other player's card. This is enforced on both the client side and the database layer (via a partial unique index).
2. **Admin Voting Progress Tracking:** Admins will be able to see the voting status of all session participants in the Admin Panel. It displays a checklist of all participants showing who has completed voting (rated all other players), who has started but is in progress, and who has not yet voted.

---

## 2. Database Schema Changes

To guarantee data integrity and prevent multiple MVP nominations per voter/match, we will add a partial unique index.

### 2.1 Database Migration: `supabase/migrations/007_add_unique_mvp_constraint.sql`
A partial unique index allows us to index only the ratings where `is_mvp = true`, ensuring a voter can have at most one such rating per session:

```sql
-- Ensure that a voter can only nominate one player as MVP per match
CREATE UNIQUE INDEX unique_voter_mvp_per_match 
ON ratings (match_id, voter_id) 
WHERE (is_mvp = true);
```

---

## 3. Server Actions (API Layer)

We will update existing actions and add a new action to retrieve the progress checklist.

### 3.1 `submitRating(input: RatingInput)` in `src/actions/ratings.ts`
Before performing the atomic upsert, if the incoming rating is marked as MVP (`input.is_mvp = true`), we will reset `is_mvp` to `false` for all other ratings by the same voter in that session to prevent database constraint violations:

```typescript
// If the voter is marking this player as MVP, reset is_mvp for all other players in this match
if (input.is_mvp) {
  const { error: resetError } = await supabase
    .from("ratings")
    .update({ is_mvp: false })
    .eq("match_id", input.match_id)
    .eq("voter_id", profile.id)
    .neq("receiver_id", input.receiver_id);

  if (resetError) {
    return { error: `Failed to reset previous MVP nomination: ${resetError.message}` };
  }
}
```

### 3.2 `getSessionVotingProgress(sessionId: string)` in `src/actions/sessions.ts`
* **Purpose:** Query the list of participants and their voting progress in the given session.
* **Logic:**
  1. Fetch all session participants.
  2. Fetch all ratings submitted in the session (`voter_id` only).
  3. Compute each participant's votes submitted vs. maximum votes possible (total participants - 1).
* **Return Value:**
  ```typescript
  export interface ParticipantProgress {
    player: Profile;
    votesSubmitted: number;
    maxVotes: number;
    isCompleted: boolean;
    hasStarted: boolean;
  }
  ```

---

## 4. Frontend & User Interface

### 4.1 Voting Screen Sync (`src/app/dashboard/page.tsx` & `src/components/session/VotingCard.tsx`)
* **Dashboard Page (`page.tsx`):**
  When a player rates someone as MVP, the `onSuccess` callback updates `myVotes` state, resetting `is_mvp: false` for all other players:
  ```typescript
  onSuccess={(newRating) => {
    setMyVotes((prev) => {
      let updated = prev;
      if (newRating.is_mvp) {
        updated = prev.map((v) =>
          v.receiver_id !== newRating.receiver_id ? { ...v, is_mvp: false } : v
        );
      }
      // Upsert the new rating into state...
    });
  }}
  ```
* **Voting Card (`VotingCard.tsx`):**
  Add a `useEffect` to sync the state of the local `isMvp` variable with the parent's `existingRating?.is_mvp` prop. This ensures the checkbox reflects changes when another card is nominated:
  ```typescript
  useEffect(() => {
    setIsMvp(existingRating?.is_mvp ?? false);
  }, [existingRating?.is_mvp]);
  ```

### 4.2 Admin Progress Panel (`src/app/admin/page.tsx`)
In the admin screen, we will fetch the voting progress when loading the active session and display a custom sports-themed component under the Active Session banner:
* **Progress Summary:** A title showing total completion (e.g. `Votación: 3/8 Jugadores Completados`).
* **Participant Grid/List:**
  * Shows player avatars and names.
  * Badges for progress:
    * **Completado (X/X)** in green (if rated all teammates).
    * **En Progreso (Y/X)** in amber/orange (if rated some teammates).
    * **Pendiente (0/X)** in red/muted (if no ratings submitted).

---

## 5. Verification Plan

### 5.1 Manual Verification
1. **MVP Single Selection:**
   - Log in as a player participant.
   - On `/dashboard`, rate Player A and mark them as MVP. Save the vote.
   - On the same screen, rate Player B and mark them as MVP. Save the vote.
   - Verify that Player A's MVP checkmark is automatically cleared in the UI.
   - Reload the page and verify only Player B is marked as MVP in the database/UI.
2. **Database Constraint:**
   - Verify that trying to force-insert two records in `ratings` for the same `match_id` and `voter_id` with `is_mvp = true` throws a duplicate key violation.
3. **Admin Progress Checklist:**
   - Log in as an Admin.
   - Navigate to `/admin`.
   - Verify that under the Active Session, the progress list is displayed.
   - Cast a vote with a player account and check that their status changes from "Pendiente" to "En Progreso" in the admin dashboard.
   - Cast all votes with that player and check that their status changes to "Completado".
