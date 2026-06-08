# Design Spec: Desktop Stepper Progress & Mobile Carousel Mask

## Overview
Redesign the voting progress indicator components on the dashboard to align with a more integrated, high-fidelity athletic sports dashboard theme.

## Core Features

### 1. Desktop Stepper Tracker (Big Screen)
- Replace the heavy, double-bordered box card with a borderless, transparent layout that blends natively into the sidebar.
- Layout tasks as a vertical stepper track:
  - A vertical line (`2px` thickness, color `#1c3828`) connects all steps.
  - Completed checkpoints are represented by a solid lime-green circle (`16px`) containing a white check icon.
  - Pending checkpoints are represented by a simple dim green circle border (`#1c3828`).
- Animate hover states with subtle micro-interactions (translation of `translateX(4px)` and color brightening).

### 2. Mobile Carousel Fade Mask
- Add a linear-gradient CSS mask to the horizontal scrolling `.mobile-dock-carousel` container to fade avatars out at the left and right edges.
- Use CSS properties `-webkit-mask-image` and `mask-image`.

## Technical Details
- File: [VotingProgress.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingProgress.tsx)
- Styling will be done using the inline `<style>` JSX block inside `VotingProgress.tsx`.
