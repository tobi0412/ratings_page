# Design: Prevent Awards for Blank-Voted Players

This design ensures that players who are blank-voted (marked as "No coincidí en cancha") cannot receive awards (MVP, Big Paper, Poop) from that voter.

## Requirements & Behavior

1. **Clear Awards on Blank Vote**:
   - If a voter selects a player for an award (e.g. MVP) before rating them, a temporary rating row is created with `tecnica = null` and `is_mvp = true`.
   - If the voter subsequently clicks "No coincidí en cancha" (blank vote) for that player and saves, any awards previously assigned to that player by this voter must be cleared in the database and local state.

2. **Disable Selected Award Winners in Dropdowns**:
   - If a player has already been blank-voted (existing saved rating with `tecnica = null` and no awards), they must be disabled in the `SessionAwardsCard` dropdown menus with a `(No coincidió)` label and lower opacity.

3. **Backend Safeguards**:
   - `submitRating`: If a rating is updated to a blank vote (i.e. `tecnica` is `null`), explicitly reset `is_mvp`, `is_bigpaper`, and `is_poop` to `false` in the database.
   - `submitSessionAwards`: In the `saveAward` helper, if the player has an existing blank vote (i.e. `tecnica` is `null` and all awards are `false`), throw an error to prevent saving the award.

## Proposed Changes

### Backend Actions

#### [src/actions/ratings.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/ratings.ts)

- Update `submitRating` to explicitly reset `is_mvp`, `is_bigpaper`, and `is_poop` to `false` in the database when `tecnica === null` (blank vote).
- Update `submitSessionAwards` to query `is_mvp`, `is_bigpaper`, `is_poop` and throw an error if the recipient has a saved blank vote (where `tecnica` is `null` and all awards are `false`).

### Frontend UI

#### [src/app/dashboard/page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/dashboard/page.tsx)

- Update `onSuccess` of `VotingCard` to sync local state: if `newRating.tecnica === null`, set `is_mvp`, `is_bigpaper`, and `is_poop` to `false` for that rating in `myVotes` state.

#### [src/components/session/SessionAwardsCard.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/SessionAwardsCard.tsx)

- Update the options mapped in `renderDropdown`:
  - Calculate `isPlayerBlank` by checking if `initialVotes` has a matching receiver with `tecnica === null` and no awards.
  - If `isPlayerBlank` is `true`:
    - Disable click handler.
    - Set opacity to `0.4`.
    - Change cursor to `not-allowed`.
    - Render a `(No coincidió)` tag next to their name.
    - Skip hover styles.
