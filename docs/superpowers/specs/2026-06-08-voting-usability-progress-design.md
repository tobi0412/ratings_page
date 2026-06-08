# Design Spec: Voting Usability and Progress Navigation (Sidebar & Stories Dock)

**Date**: 2026-06-08  
**Topic**: Responsive Navigation System (Web Sidebar & Mobile Stories Dock) for Voting Screen  

---

## 1. Goal Description

Improve the match voting usability by replacing the previous floating progress dock with a responsive, device-optimized navigation system and introducing a high-end visual upgrade:
1. **Web (Desktop)**: A fixed vertical sidebar capsule on the right side of the screen using the empty margin space. It tracks which player is currently in view using an `IntersectionObserver` and enables quick-jump navigation.
2. **Mobile (Tablet/Phone)**: A floating bottom stories dock containing a horizontal carousel of avatars. It auto-hides during active scroll-down to keep inputs clear, and re-appears on scroll-up, vote events, or as soon as scrolling stops.
3. **Visual States**: Differentiates between rated, pending, and skipped ("No coincidí") players using high-fidelity Instagram-style status rings.
4. **Active Selection**: Differentiates the active item using scale and a high-contrast white ring border to prevent color confusion with completed items.

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
4. **Scroll-End Auto-Reveal**: Tracks page scroll events. When scrolling down, the mobile dock slides down and hides. When scrolling stops for more than **200ms** (handled via debounce timer), the dock slides back up into view automatically.

---

## 3. UI/UX Design

### 3.1 🌐 Web Version: Sidebar Fijo Lateral
- **Positioning**: Fixed on the right (`position: fixed; right: 2.5rem; top: 50%; transform: translateY(-50%)`).
- **Structure**: Vertical capsule of player avatars and section icons (Awards at top, Team Rating at bottom).
- **Background**: Translucent dark green-black (`rgba(6, 13, 9, 0.75)`) with blur (`backdrop-filter: blur(16px)`), a subtle border (`1px solid rgba(0, 230, 118, 0.2)`), and a micro-pattern diagonal stripe texture.
- **Scroll Tracking**: Active player capsule highlights with scale (`scale(1.15)`) and a turf-lime pulse shadow or smooth sliding capsule backlight (`layoutId="sidebarActiveBg"`).
- **Hover Tooltips**: Animated custom tooltips revealing name and precise status on hover.

### 3.2 📱 Versión Mobile: Barra Flotante de Historias (Dock Inferior)
- **Positioning**: Fixed at the bottom center (`position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%)`). Capped at `480px` max-width.
- **Structure**: Horizontal flex carousel (`overflow-x: auto; scrollbar-width: none`).
- **Auto-Hide / Auto-Reveal**: Hides on active scroll-down (`translateY(125%)`). Immediately slides back up on scroll-up, vote changes, or 200ms after scrolling stops.

### 3.3 Visual States (Instagram-Style Status Rings)

To prevent confusion between completed tasks and the currently active task:
- **Active Section (In View)**: Scaled up (`scale(1.25)`) and highlighted with a **glowing high-contrast white ring border** (`#e4f0e8`) or offset glow, plus a small active indicator dot under the avatar. No green is used on the active state unless it is also voted.
- **Voted & Saved**: The avatar ring turns into a **continuous turf-lime gradient** (from `#00e676` to `#0ff884`) and we overlay a mini checkmark badge (✓) on the bottom right.
- **No coincidí (Blank) Saved**: The avatar ring is **dashed amber-red** (`#ff5252`) and we overlay a mini spy/stealth icon (👁).
- **Pending**: The avatar ring remains a quiet, muted dark-green (`#1c3828`).

---

## 4. Interaction and Data Flow

1. **Scroll Listener & Debounce Timer**:
   ```typescript
   // Debounce timer for scroll-end detection
   const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

   useMotionValueEvent(scrollY, "change", (latest) => {
     if (latest > 180) {
       setShowStickyFills(true);
       const diff = latest - lastScrollY.current;
       
       // Hide on active scroll down
       if (diff > 5) {
         setDockVisible(false);
       } else if (diff < -5) {
         setDockVisible(true);
       }
       
       // Clear existing timer and start a new one to detect scroll-end
       if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
       scrollTimeoutRef.current = setTimeout(() => {
         setDockVisible(true); // Auto-reveal when scrolling stops
       }, 200);
     } else {
       setShowStickyFills(false);
       setDockVisible(false);
     }
     lastScrollY.current = latest;
   });
   ```
2. **Smooth Scrolling**: Clicking a badge triggers `document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "center" })`.

---

## 5. Verification Plan

### Manual Verification:
1. Verify the static welcome card displays at the top of the page.
2. **Desktop (>1200px)**:
   - Check that the vertical sidebar capsule is visible on the right.
   - Verify that scrolling down the page changes the active scaled avatar bubble in real-time.
   - Verify that saving a player as "Voted" adds the solid lime gradient border and check badge (✓).
   - Verify that saving a player as "No coincidí" changes the border to dashed red/orange and adds the eye badge (👁).
   - Click avatars to ensure smooth scrolling.
3. **Mobile (<1200px)**:
   - Check that the sidebar hides and the bottom horizontal carousel appears.
   - Verify that the bottom dock slides down on active scroll-down, and slides back up on scroll-up or vote updates.
   - Verify that **stopping scrolling for 200ms** automatically slides the bottom dock back up.
   - Verify that active item has a white border and scales up, while voted items have continuous lime-green borders, skipped items have dashed red-orange borders, and pending items have muted grey borders.
   - Confirm there is no visual confusion between the active item and completed items.
