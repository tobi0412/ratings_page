# Mobile-Responsive Redesign of Mystery Vote Widget - Design Document

**Date:** 2026-06-01  
**Scope:** Improve visual aesthetics and prevent overlapping layout issues on mobile/small screens for the `MysteryVoteWidget` component.  
**Stack:** Next.js (App Router) + Tailwind CSS

---

## 1. Goal

On smaller devices (e.g. mobile viewports under 640px wide), the revealed state of the mystery vote widget is cramped and overlapping. Specifically, the "Ocultar" button, voter average rating badge, player names, and the four voting categories (Hab. Téc., Esf. Fís., Actitud, Toma Dec.) overlap or overflow their boundaries.

The goal is to implement a responsive layout using Tailwind CSS classes so that:
- The widget is completely readable and beautiful on small screens.
- Desktop views remain clean and wide.
- All styles harmonize with the existing green/sports dark theme.

---

## 2. Proposed UI/UX Adjustments

### 2.1 Header Refactoring
Currently, the header uses a strict horizontal flex container. We will change it to:
- **Mobile View (<640px):**
  - Line 1: Session name on the left (e.g., `Voto Revelado: Liga y Playoffs 30/5/26`), `Ocultar` button on the right.
  - Line 2: Voter username (e.g., `@MAMBITA`) and total average badge inline, wrapping naturally if needed.
- **Desktop/Tablet View (>=640px):**
  - Single horizontal row with title and details on the left, and the `Ocultar` button on the right.

### 2.2 Vote Breakdown Rows
Currently, each voted teammate has their username, MVP status, and 4 metric columns squeezed horizontally. We will change it to:
- **Mobile View (<640px):**
  - The row splits into a stacked layout (`flex-col`).
  - Top half: Teammate name and MVP badge (left-aligned).
  - Bottom half: A 4-column sub-grid (`grid grid-cols-4 gap-2`). Each column contains:
    - A shortened label: `TÉC`, `FÍS`, `ACT`, `DEC`.
    - A dark green capsule enclosing the score.
- **Desktop/Tablet View (>=640px):**
  - Keeps the original side-by-side layout with full-text metric labels (`Hab. Téc.`, `Esf. Fís.`, etc.).

---

## 3. Component File Changes

### 3.1 [MysteryVoteWidget.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/MysteryVoteWidget.tsx)
We will edit the component `MysteryVoteWidget`'s TSX output to apply these responsive layout changes.

---

## 4. Verification Plan

### Manual Verification
1. Open the application.
2. Ensure there is no active voting session, or mock it to trigger the "Sin sesión activa" state.
3. Click "Revelar Voto" to show the results.
4. Resize the window to mobile width (<640px) or inspect in mobile emulator mode:
   - Check that the header elements (`Voto Revelado`, `@username`, `Promedio...`, `Ocultar`) do not overlap.
   - Check that the voter list rows stack properly: player name on top, ratings capsules inline below.
   - Confirm labels `TÉC`, `FÍS`, `ACT`, `DEC` are visible and centered.
5. Resize back to desktop size:
   - Confirm the original horizontal layouts align properly.
