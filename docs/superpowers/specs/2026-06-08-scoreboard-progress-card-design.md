# Design Spec: Scoreboard Capsule Progress Card

## Overview
Redesign the voting progress card component on the match voting tab from a transparent borderless element to a structured, premium, opaque "Scoreboard Capsule" card. This card will align with the high-fidelity dark-green athletic sports theme of Cotorra Analytics, improving readability against the field grid and creating a solid visual hierarchy.

## Visual Design Details

### 1. Card Container & Background
* **Background**: Solid opaque `var(--bg-card)` (`#0b1810`) to hide underlying field grids and provide high contrast.
* **Borders**: 
  * Subtle structural borders on the sides and bottom: `1px solid var(--border-subtle)` (`#1c3828`).
  * A bright neon turf-lime accent strip at the top: `border-top: 3px solid var(--accent-lime)` (`#00e676`).
* **Corner Radius**: Tight athletic curves: `12px` border radius (`rounded.md`).
* **Elevation & Shadow**: An immersive dark-ambient scoreboard shadow: `box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6)`.
* **Hover State**: Subtle glow expansion on hover: `box-shadow: 0 12px 36px rgba(0, 230, 118, 0.05)`.
* **Internal Padding**: Structured spacing of `1.25rem 1.5rem` to avoid feeling cluttered.

### 2. Header Scoreboard Typography
* **Progress Label**: "PROGRESO" styled as a scoreboard label:
  * Font Family: `Barlow Condensed`, sans-serif
  * Weight: 700
  * Font Size: `0.75rem`
  * Letter Spacing: `0.15em`
  * Color: `var(--text-muted)` (`#3d6e50`)
  * Text Transform: `uppercase`
* **Scoreboard Stats**: 
  * Percentage display: e.g., `25%` using `Bebas Neue` (`fontSize: 1.8rem`, `color: var(--accent-lime)` (`#00e676`), `letterSpacing: 0.04em`, `lineHeight: 1`).
  * Tasks count fraction: e.g., `(3/12)` in `Barlow Condensed` (`fontSize: 0.85rem`, `color: var(--text-muted)` (`#3d6e50`)).

### 3. Progress Track & Stepper Checkpoints
* **Linear Track**: 
  * Height: `3px`
  * Track Background: `#1c3828`
  * Progress Fill: Turf-lime green (`#00e676`) with a bloom shadow: `box-shadow: 0 0 8px rgba(0, 230, 118, 0.4)`.
* **Vertical Stepper Track**:
  * Line Thickness: `2px`
  * Line Color: `#1c3828`
  * Step Bubble (`18px` width/height):
    * **Completed Checkpoint**: Solid turf-lime green background (`#00e676`), containing a dark-green checkmark icon.
    * **Active Checkpoint**: Transparent background, border of `2px solid var(--accent-lime)` (`#00e676`), with a soft glowing inner center.
    * **Pending Checkpoint**: Transparent background, border of `2px solid var(--border-subtle)` (`#1c3828`).

## Components & Architecture
- **Component**: [VotingProgress.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingProgress.tsx)
- The styles will be encapsulated directly inside the React component's `<style>` block to keep layout and interactive CSS local.

## Testing & Verification
- **Visual Audit**: Verify the card is opaque and hides the underlying field grid correctly.
- **Responsive Sizing**: Test rendering on mobile viewports (inline card) and desktop viewports (sidebar capsule).
- **Accessibility**: Ensure high contrast of all text labels against the card background.
