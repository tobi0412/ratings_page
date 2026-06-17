# Player Voting Progress View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow players to view the session-wide voting progress at the top of the page once they have completed their voting checklist, and collapse the voting inputs below with an extendable option to edit them.

**Architecture:** 
1. Allow non-admin session participants to access the `getSessionVotingProgress` action by validating their participant status in the database.
2. In the dashboard page, load and sync this progress list.
3. If the user's checklist is complete, render the progress checklist card at the top, and wrap the voting controls below in a collapsible accordion container.
4. Modify `VotingCard` to support collapsible sliders with an expand toggle button once ratings are saved.

**Tech Stack:** Next.js, React, Supabase, Framer Motion

---

### Task 1: Enable Participant Access to Voting Progress

**Files:**
- Modify: [sessions.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/sessions.ts)

- [ ] **Step 1: Update `getSessionVotingProgress` permission logic**
  Change the access check to allow admins OR players who are registered participants of that session to access the progress checklist.

  Modify [sessions.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/sessions.ts) near line 197:
  ```typescript
  // Allow if admin or participant of the session
  if (!profile) {
    return { error: "Not authenticated", success: false };
  }

  if (profile.role !== "admin") {
    const { data: participation, error: pError } = await supabase
      .from("session_participants")
      .select("id")
      .eq("match_id", sessionId)
      .eq("player_id", profile.id)
      .maybeSingle();

    if (pError || !participation) {
      return { error: "Only admins or session participants can view voting progress", success: false };
    }
  }
  ```

- [ ] **Step 2: Run build/typecheck to verify no typescript compile errors**
  Run: `npx tsc --noEmit`
  Expected: No typescript compiler errors.

---

### Task 3: Implement Compact Collapsible Layout in `VotingCard`

**Files:**
- Modify: [VotingCard.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingCard.tsx)

- [ ] **Step 1: Add `isExpanded` state and update layout**
  Add state `const [isExpanded, setIsExpanded] = useState(false);` in `VotingCard.tsx`.
  If `saved` is true, display a compact row (Avatar, Name, Voted Badge, Average rating pill, and "Modificar" button/icon).
  If `isExpanded` is true or `saved` is false, render the sliders and the save button.

  Modify [VotingCard.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingCard.tsx):
  - Wrap the main sliders and blank-vote toggle in a container that is hidden when `saved` is true and `isExpanded` is false.
  - Render an "Editar" button or chevron to toggle `isExpanded` when `saved` is true.

- [ ] **Step 2: Verify component renders correctly**
  Verify the layout fits standard padding and has micro-animations or smooth height transitions if possible.

---

### Task 4: Render Progress Checklist & Collapsible Voting Section in Dashboard

**Files:**
- Modify: [page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/dashboard/page.tsx)

- [ ] **Step 1: Add state for overall session progress**
  Define `votingProgressList` state and a helper function `fetchProgress` in `dashboard/page.tsx` to fetch voting progress.
  Fetch this initially when the session is loaded.

- [ ] **Step 2: Sync progress state on vote events**
  Call `fetchProgress(session.id)` on card vote success, awards saved, or team rating saved.

- [ ] **Step 3: Define checklist completion rule**
  ```typescript
  const isCardCompleted = (player: Profile) => {
    const vote = myVotes.find((v) => v.receiver_id === player.id);
    if (!vote) return false;
    if (vote.tecnica !== null) return true;
    if (!vote.is_mvp && !vote.is_bigpaper && !vote.is_poop) return true;
    return false;
  };

  const votedCount = players.filter(isCardCompleted).length;
  const isAllVoted = votedCount === players.length && awardsComplete && teamRatingSaved;
  ```

- [ ] **Step 4: Render progress card at the top when `isAllVoted` is true**
  If `isAllVoted` is true, render the Session Progress checklist (showing other players' completion status badges) at the top of the voting section.

- [ ] **Step 5: Render voting controls in a collapsible accordion**
  Wrap the Awards card, Players grid, and Team Rating card in a collapsible/extendable panel (e.g. "Modificar mis votos" toggle) when `isAllVoted` is true.

---

### Task 5: Manual Verification

- [ ] **Step 1: Verify local application behavior**
  - Open the local dev URL.
  - Check that normal voting works as before.
  - Complete the checklist.
  - Verify progress checklist is visible on top and voting controls are collapsed under an expandable panel.
  - Test expanding a voted player card and updating a slider value.
