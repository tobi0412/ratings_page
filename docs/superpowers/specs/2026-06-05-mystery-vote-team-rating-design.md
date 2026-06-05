# Design Document: Add Team Rating to Mystery Vote

**Date:** 2026-06-05  
**Topic:** Add the team performance rating to the mystery vote reveal widget while maintaining responsiveness.
**Stack:** Next.js (App Router) + Supabase (PostgreSQL) + Vanilla CSS

---

## 1. Executive Summary
Currently, the "Voto Misterioso" (Mystery Vote) widget on the player dashboard reveals the detailed ratings cast by a random player in the last session for their teammates. However, it does not reveal the **team performance rating** (rendimiento de equipo) that this player submitted. 

This design document outlines the changes needed to retrieve the team performance rating submitted by the mystery player from the `team_ratings` table, return it via the server action, and display it as a highlighted, premium row at the top of the revealed votes list. The design ensures visual consistency with the rest of the application and retains full responsiveness on all device sizes.

---

## 2. Proposed Changes

### 2.1 Server Action Modification
Modify the `revealMysteryVote` action in `src/actions/sessions.ts` to:
1. Fetch the team rating for the corresponding `sessionId` and `mystery_player_id` from the `team_ratings` table.
2. Return the rating value (or `null` if none was submitted) along with the player's profile and votes.

**Changes in `src/actions/sessions.ts`:**
```typescript
const { data: teamRatingData } = await supabase
  .from("team_ratings")
  .select("rating")
  .eq("match_id", sessionId)
  .eq("voter_id", mysteryPlayerId)
  .maybeSingle();

return { 
  voter: voterProfile, 
  votes: votes || [],
  teamRating: teamRatingData?.rating || null
};
```

### 2.2 Component Updates (`src/components/session/MysteryVoteWidget.tsx`)
1. Update state to include `teamRating`:
   ```typescript
   const [teamRating, setTeamRating] = useState<number | null>(null);
   ```
2. Save `teamRating` when `handleReveal` completes successfully:
   ```typescript
   setTeamRating(result.teamRating ?? null);
   ```
3. Add a helper function to get rating feedback styles and labels matching the existing thresholds in `TeamRatingCard.tsx`:
   * `>= 9.0`: `"SESIÓN DE ENSUEÑO"` (Color: `#00e676`)
   * `>= 8.0`: `"CLASE MUNDIAL"` (Color: `#40c4ff`)
   * `>= 7.0`: `"MUY BUENA SESIÓN"` (Color: `#ffc93c`)
   * `>= 5.0`: `"RENDIMIENTO REGULAR"` (Color: `#ffab40`)
   * `< 5.0`: `"SESIÓN PARA EL OLVIDO"` (Color: `#ff5252`)
4. Prepend a list item representing "Rendimiento del Equipo" right before mapping the teammate votes.
5. Render the row using the `CotorraLogoIcon` (from `src/components/Icons.tsx`) as its icon avatar.
6. Ensure responsive styling:
   * Flex layout with `flex-wrap` or appropriate flex directions for smaller viewports.
   * Hide verbose text (like `"Valoración:"`) on mobile viewports while keeping the core rating badge clean and legible.

---

## 3. UI/UX Specifications

### Visual Layout (Enfoque 1)
* **Icon:** The green poly-art logo icon (`CotorraLogoIcon`).
* **Title:** "Rendimiento del Equipo"
* **Subtitle:** The dynamic feedback label (e.g. "MUY BUENA SESIÓN") color-coded based on the score.
* **Rating Badge:** Placed on the right side, resembling the teammate score blocks but larger and with a bold accent color.
* **Responsive Behavior:** The container uses flex-box (`justify-between`) to keep the name and the badge aligned. The label hides the word "Valoración:" on small screens to conserve space.

---

## 4. Verification Plan

### Manual Verification
1. **Prepare test data:**
   * Ensure there is a closed session with submitted player ratings and a submitted team rating.
2. **Dashboard test:**
   * Go to `/dashboard` as a logged-in user when no session is active.
   * Click "Revelar Voto" on the Mystery Vote card.
   * Verify that the "Rendimiento del Equipo" row is displayed at the top of the revealed list.
   * Check that the color and label match the rating value.
3. **Responsiveness test:**
   * Open Developer Tools and resize the screen to mobile size (e.g. 375px width).
   * Confirm that the row does not overflow, is fully readable, and aligns correctly with the other vote cards.
