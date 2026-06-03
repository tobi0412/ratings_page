# Player Profile Design

## Overview
A new profile feature that allows players to display their photo, a short description (bio), and select their favorite positions on an interactive football field. The editing experience happens in-place on the same page.

## Database (Supabase)
### `profiles` Table Changes
- **Add `bio` column**: `text` type, mapped to 150 characters max limit on the frontend.
- **Add `favorite_positions` column**: `text[]` (array of text) to store position IDs (e.g., `['ST', 'LW']`).

### Types (`src/types/index.ts`)
- Update `Profile` interface:
  ```typescript
  export interface Profile {
    // ... existing fields ...
    bio: string | null;
    favorite_positions: string[] | null;
  }
  ```

## UI Components

### 1. `ProfileView.tsx`
- **View Mode**: Displays the player's avatar, username, bio, and the read-only football field showing their favorite positions.
- **Edit Mode**:
  - Toggled via an "Editar Perfil" button.
  - Bio becomes a `<textarea>` with a character counter (Max 150).
  - Avatar gains an edit overlay to upload a new image via Supabase Storage.
  - Football field becomes interactive.

### 2. `FootballField.tsx`
- **Visuals**: A CSS/SVG based top-down view of a football pitch.
- **Positions**: Clickable circular indicators placed at standard tactical coordinates (GK, CB, LB, RB, CDM, CM, CAM, LM, RM, LW, RW, ST, etc.).
- **Logic**:
  - Accepts `isEditing` prop.
  - Accepts `selectedPositions` and `onChange` callback.
  - Enforces a **maximum of 3 selected positions**. If the user clicks a 4th unselected position, it should be ignored or show a toast notification.
  - Highlights selected positions dynamically (e.g., using the primary theme color).

## User Flow
1. User navigates to their profile page (`/profile`).
2. Clicks "Editar Perfil".
3. Edits bio, updates photo, and clicks on the field to choose up to 3 positions.
4. Clicks "Guardar".
5. App updates the Supabase `profiles` table and switches back to View Mode.

## Edge Cases & Error Handling
- **Image Upload**: Enforce max file size (e.g., 2MB) and valid formats (jpg, png).
- **Position Limit**: The UI explicitly prevents selecting more than 3 positions. The database could technically hold more, but the frontend will limit it.
- **Empty State**: If a user has no bio or positions, prompt them to "Editar Perfil para añadir tu biografía y posiciones".
