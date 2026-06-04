# Mystery Reveal Component Design

Design for the new `MysteryReveal` component that displays a fake shuffle animation using Framer Motion when revealing the winner of a mysterious vote. The result persists in `localStorage` to avoid repeating the animation on page reload.

## User Review Required

- **Scope:** Create `src/components/session/MysteryReveal.tsx`.
- **Git Commits:** The user requested **not** to commit anything. Therefore, no Git commands (like `git add` or `git commit`) should be executed during or after implementation.

## Proposed Changes

### Component Design

#### [NEW] [MysteryReveal.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/MysteryReveal.tsx)
A client-side component accepting `winnerName`, `allPlayers`, and `sessionId`. It checks `localStorage` for the key `mystery_reveal_status_${sessionId}` on mount:
- If present, it shows the winner name in its highlighted final state immediately.
- If not present, it cycles through names from `allPlayers` for 3 seconds with a easing-out deceleration, then displays the `winnerName` and stores the reveal status in `localStorage`.

##### Props Interface:
```typescript
interface MysteryProps {
  winnerName: string;
  allPlayers: string[];
  sessionId: string;
}
```

##### Deceleration Shuffle logic:
- `shuffleList` is created by filtering out `winnerName` from `allPlayers`.
- Recursive `setTimeout` scheduling next frame index.
- Easing-out equation mapping time progress to delay: `delay = minDelay + (maxDelay - minDelay) * (progress * progress)`.

##### Animation Specs:
- AnimatePresence with vertical translation (`y` moving -15px to 15px) and blur (`blur(4px)` to `blur(0px)`).
- GPU-optimized properties only (`opacity` and `transform`/`translateY`).

##### Styling:
- Outer wrapper themed as `bg-zinc-950` sports card.
- Winner highlighted using `text-lime-500 font-black italic` with an intense green shadow glow.

## Verification Plan

### Manual Verification
- Render the component in a test page or dashboard.
- Verify first mount shows the shuffle animation for 3 seconds.
- Verify reload skips the animation and immediately shows the winner.
- Clear `localStorage` and verify animation plays again.
