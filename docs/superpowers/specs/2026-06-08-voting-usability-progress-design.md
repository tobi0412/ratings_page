# Design Spec: Voting Usability and Progress Navigation (Sidebar & Stories Dock)

**Date**: 2026-06-08  
**Topic**: Responsive Navigation System (Web Sidebar & Mobile Stories Dock) for Voting Screen  

---

## 1. Goal Description

Improve the match voting usability by replacing the previous floating progress dock with a responsive, device-optimized navigation system:
1. **Web (Desktop)**: A fixed vertical sidebar capsule on the right side of the screen using the empty margin space. It tracks which player is currently in view using an `IntersectionObserver` and enables quick-jump navigation.
2. **Mobile (Tablet/Phone)**: A floating bottom stories dock containing a horizontal carousel of avatars. It auto-hides on scroll-down to keep inputs clear, and re-appears on scroll-up or vote events.
3. **Visual States**: Differentiates between rated, pending, and skipped ("No coincidí") players using distinct visual status borders/dots.
4. **Header Integration**: The top-of-page progress card remains as a static welcoming summary, while the sidebar/dock handles floating interactions.

---

## 2. Component Architecture

We will update [VotingProgress.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingProgress.tsx) to act as the single state listener and layout switcher.

### Prop Interface (Remains same):
```typescript
interface VotingProgressProps {
  players: Profile[];
  myVotes: Rating[];
  awardsComplete: boolean;
  teamRatingSaved: boolean;
}
```

### Inner Component Features:
1. **Intersection Observer**: Observes `#awards-section`, `#player-card-[id]`, and `#team-rating-section` and updates `activeSectionId`.
2. **Device Layout Switcher**:
   - Above `1200px` viewport: Hide bottom dock, render fixed vertical sidebar.
   - Below `1200px` viewport: Hide sidebar, render floating bottom horizontal stories carousel.
3. **Task Completion Helper**: `isCardCompleted(player)` determines normal or blank vote completion status.

---

## 3. UI/UX Design

### 3.1 🌐 Web Version: Sidebar Fijo Lateral
- **Positioning**: Fixed on the right (`position: fixed; right: 2rem; top: 50%; transform: translateY(-50%)`).
- **Structure**: Vertical capsule of player avatars and section icons (Awards at top, Team Rating at bottom).
- **Background**: Translucent dark green-black (`rgba(6, 13, 9, 0.6)`) with blur (`backdrop-filter: blur(16px)`) and a subtle glow border.
- **Scroll Tracking**: Active player capsule highlights with scale (`scale(1.1)`) and a turf-lime pulse shadow.
- **Hover Tooltips**: Native `title` tooltips for player names.

### 3.2 📱 Versión Mobile: Barra Flotante de Historias (Dock Inferior)
- **Positioning**: Fixed at the bottom center (`position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%)`). Capped at `480px` max-width.
- **Structure**: Horizontal flex carousel (`overflow-x: auto; scrollbar-width: none`).
- **Auto-Hide**: Translates off-screen (`translateY(120%)`) when scrolling down, transitions back on scroll-up or vote update.

### 3.3 Visual States

| State | Web Sidebar (Vertical) | Mobile Stories Dock (Horizontal) |
|---|---|---|
| **Voted & Saved** | Continuous turf-lime border (`2px solid #00e676`) + check (✓) badge | Solid turf-lime dot (`#00e676`) centered above avatar |
| **No coincidí (Blank) Saved** | Dashed turf-lime border (`2px dashed #00e676`) + eye (👁) badge | Small grey/red eye-colored dot above avatar |
| **Pending** | Muted border (`1px solid #1c3828`), opacity: 0.5 | Muted dark-grey dot (`#1c3828`) above avatar |

---

## 4. Interaction and Data Flow

1. **Observer Binding**:
   ```typescript
   useEffect(() => {
     const observer = new IntersectionObserver((entries) => {
       entries.forEach((entry) => {
         if (entry.isIntersecting) {
           setActiveSectionId(entry.target.id);
         }
       });
     }, { threshold: 0.5, rootMargin: "-10% 0px -40% 0px" }); // Adjusted offsets for optimal card detection
     
     // Observe awards, cards, and team sections...
     return () => observer.disconnect();
   }, [players]);
   ```
2. **Smooth Scrolling**: Clicking a badge triggers `document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" })`.

---

## 5. Verification Plan

### Manual Verification:
1. Verify the static welcome card displays at the top of the page.
2. **Desktop (>1200px)**:
   - Check that the vertical sidebar capsule is visible on the right.
   - Verify that scrolling down the page changes the active scaled avatar bubble in real-time.
   - Verify that saving a player as "Voted" adds the solid lime border and check badge (✓).
   - Verify that saving a player as "No coincidí" changes the border to dashed lime and adds the eye badge (👁).
   - Click avatars to ensure smooth scrolling.
3. **Mobile (<1200px)**:
   - Check that the sidebar hides and the bottom horizontal carousel appears.
   - Verify that the bottom dock slides down on scroll-down and slides back up on scroll-up or vote updates.
   - Verify that dots above the avatars change to green (voted) or red/grey (skipped) in sync with the state.
