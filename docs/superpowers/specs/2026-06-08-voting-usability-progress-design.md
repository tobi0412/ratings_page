# Design Spec: Voting Usability and Progress Navigation Dock

**Date**: 2026-06-08  
**Topic**: Floating Glassmorphic Bottom Progress & Navigation Dock for Voting Screen

---

## 1. Goal Description

Improve the usability of the match voting flow by providing a persistent, interactive progress and navigation panel. Currently, as users scroll through the list of players to vote on, they lose context of their overall progress and which players/tasks remain. This feature introduces a floating bottom dock that tracks overall completion, highlights which specific tasks (awards, players, team rating) are pending, and allows quick-jumping (smooth-scrolling) to any task on the page.

---

## 2. Component Architecture

We will update [VotingProgress.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingProgress.tsx) to accept the list of players and the user's current votes, enabling it to track the exact rating status of each player.

### Proposed Prop Interface Updates:
```typescript
interface VotingProgressProps {
  players: Profile[];
  myVotes: Rating[];
  awardsComplete: boolean;
  teamRatingSaved: boolean;
  isCardCompleted: (player: Profile) => boolean;
}
```

### Component Structure:
* **Static Dashboard Progress Card**: Renders at the top of the viewport at rest.
* **Sticky/Floating Bottom Navigation Dock**: Renders fixed at the bottom of the viewport (`position: fixed; bottom: 1.5rem; left: 50%`) once the scroll position exceeds a threshold.

---

## 3. UI/UX Design

### The Floating Dock Layout:
* **Top Edge**: A 4px turf-lime (`#00e676`) progress bar matching the current total completion percentage.
* **Left Segment**: Text progress stats: `[Completed Steps] / [Total Steps] Tareas` (e.g. `6 / 12 Tareas`).
* **Center Segment**: A horizontally scrollable list of mini-badges:
  - **Awards Task**: A star icon. Lights up in gold (`#ffc93c`) when complete.
  - **Player Tasks**: Circular badges showing player initials (or avatar image if available).
    - If rated: Turf-lime border (`1.5px solid #00e676`) with a tiny checkmark badge.
    - If pending: Muted border (`1px solid #1c3828`) and `opacity: 0.5`.
  - **Team Rating Task**: A shield icon. Lights up in turf-lime (`#00e676`) when complete.
* **Right Segment**: A "Next Pending" button that autoscrolls the window to the first uncompleted task. When all tasks are complete, it transitions into a green success checkmark.

### Styling & Micro-Interactiveness (Emil Kowalski UI Polish)
* **Glassmorphic Surface**: Dark green-black base background (`rgba(6, 13, 9, 0.85)`) with a blur filter (`backdrop-filter: blur(12px)`) and a turf-lime glow border (`1px solid rgba(0, 230, 118, 0.2)`).
* **Hover Tooltips**: Hovering over a player circular badge displays a tooltip with their username.
* **Scroll-Direction Awareness (Auto-Hide)**:
  - When scrolling **down** (user is actively interacting/rating), the floating dock hides (`translateY(110%)`).
  - When scrolling **up** (user is reviewing/navigating) or when a vote is successfully saved, the dock slides **up** into view (`translateY(0)`).
* **Mobile Optimization**: Under mobile viewports, the dock layout collapses to hide text metrics and only show the horizontal icon navigation track to save screen real estate.

---

## 4. Interaction and Data Flow

1. **State Management**: [page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/dashboard/page.tsx) maintains the state of `myVotes` and `teamRatingSaved`. Any updates from [VotingCard.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingCard.tsx) or [TeamRatingCard.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/TeamRatingCard.tsx) immediately propagate back to the parent and flow into [VotingProgress.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingProgress.tsx), triggering real-time UI updates on the floating dock.
2. **Jump-to-Section**: Clicking any badge triggers a smooth scroll to the target element:
  - Awards: `#awards-section`
  - Players: `#player-card-[player.id]`
  - Team Rating: `#team-rating-section`
3. **"Next Pending" Resolution**:
  The button resolves target sections in the following order:
  - If `!awardsComplete` -> `#awards-section`
  - Else find first player `p` where `!isCardCompleted(p)` -> `#player-card-[p.id]`
  - Else if `!teamRatingSaved` -> `#team-rating-section`

---

## 5. Verification Plan

### Manual Verification:
1. Verify static welcome card displays correctly at the top of the dashboard.
2. Scroll down past 180px and verify that the glassmorphic floating bottom dock fades and slides into view.
3. Verify that scrolling down hides the dock, and scrolling up or saving a vote shows it.
4. Verify that each player has a corresponding badge in the center row.
5. Save a rating for a player and verify that their badge immediately updates with a turf-lime border and checkmark.
6. Click various badges and verify smooth-scrolling to the correct viewport position.
7. Click the "Next Pending" button and verify it correctly jumps to the next unrated section.
