# Design Spec: Blank Votes Support for Players who Didn't Play Together

## Goal Description
In match sessions, some players may not play together (e.g., one left early and one arrived late). Currently, all voters are forced to rate all other participants on a scale of 1-10. This spec details the implementation of an option to leave a player's vote blank. Blank votes will be excluded from the player's overall averages.

---

## Database Migration
We will create `supabase/migrations/009_allow_blank_votes.sql` to modify the columns to be nullable.

```sql
-- Remove NOT NULL constraint on rating columns to allow blank votes
ALTER TABLE ratings
  ALTER COLUMN tecnica DROP NOT NULL,
  ALTER COLUMN fisico DROP NOT NULL,
  ALTER COLUMN actitud DROP NOT NULL,
  ALTER COLUMN vision_juego DROP NOT NULL;
```

---

## Proposed Changes

### Database & Server Logic

#### [NEW] [009_allow_blank_votes.sql](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/supabase/migrations/009_allow_blank_votes.sql)
- Remove `NOT NULL` constraints from `tecnica`, `fisico`, `actitud`, and `vision_juego` on the `ratings` table.

#### [MODIFY] [index.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/types/index.ts)
- Update `Rating` and `RatingInput` interface types to allow `number | null` for rating metric fields.

#### [MODIFY] [stats.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/stats.ts)
- Update `getAllPlayersStats` overall average computation to filter out `null` metrics per historical rating session.

### Frontend UI/UX

#### [MODIFY] [VotingCard.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingCard.tsx)
- Add a new state `isBlank` initialized to `true` if `existingRating.tecnica === null` or `false` otherwise.
- Add a checkbox above metrics allowing the voter to choose "No jugué con este jugador (voto en blanco)".
- If `isBlank` is checked:
  - Disable and lower the opacity of the sliders.
  - Disable and uncheck the MVP option.
  - Display "—" for the overall average and each metric rating.
  - Set rating inputs to `null` and `is_mvp` to `false` when submitting the rating.
- Sync `isBlank` state inside `useEffect` when `existingRating` updates.

#### [MODIFY] [MysteryVoteWidget.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/MysteryVoteWidget.tsx)
- Exclude `null` ratings from the sum and count when calculating the overall average of the mystery vote.
- Render "—" for metric cells that are `null`.

---

## Verification Plan

### Automated Tests
- Validate that NextJS compiles successfully: `npm run build`.

### Manual Verification
1. Run local development server: `npm run dev`.
2. Open active match session.
3. Select "No jugué con este jugador (voto en blanco)" on a player's card.
4. Verify the sliders and MVP checkbox are disabled.
5. Save the vote, verify it shows "Voto guardado" and sends `null` values in database payload.
6. Refresh the page to verify it loads correctly from the database as a blank vote.
7. Close the session, and verify that the player's averages in other panels ignore the blank vote.
