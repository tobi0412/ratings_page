# Design Spec: Player Voting Progress View & Collapsible Voting Cards

Show the session-wide voting progress list to players once they have completed their voting checklist, and collapse voted cards in the dashboard with an option to expand and modify votes.

## User Review Required

> [!NOTE]
> We will lift the restriction in `getSessionVotingProgress` to allow non-admin users to fetch progress data. This is secure because the database query only returns boolean completion status and does not leak actual scores or details of other players' votes.

## Proposed Changes

### Sessions Server Actions

#### [MODIFY] [sessions.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/sessions.ts)
- Modify `getSessionVotingProgress` to allow any participant of the session to fetch progress data.
- Check if the current user profile ID exists in `session_participants` for the requested session ID. If they are a participant (or an admin), permit access; otherwise, return an error.

### Dashboard Page

#### [MODIFY] [page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/dashboard/page.tsx)
- Load session-wide voting progress by calling `getSessionVotingProgress(activeSession.id)` inside the `load` effect.
- Track a new state variable `votingProgressList` to store this data.
- Determine if the user has completed their voting checklist:
  - `votedCount === totalPlayers`
  - `awardsComplete`
  - `teamRatingSaved`
- If completed:
  - Render a new section **"Progreso de Votos de la Sesión"** at the top of the content area. This card will display the same compact participant rows and completion status badges that the admin sees.
  - Wrap the rest of the page (Awards, Players Grid, Team Rating) in a collapsible section (e.g. accordion panel titled "Mis calificaciones") so they can be expanded to change ratings if desired.

### Voting Card Component

#### [MODIFY] [VotingCard.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingCard.tsx)
- If the card has a saved rating (`saved === true`), render a compact row layout.
- The compact row layout displays:
  - Avatar and username.
  - The saved average score pill.
  - A "Modificar" button or chevron icon.
- Introduce an internal state `isExpanded` (defaulting to `false` when `saved` is true).
- If `isExpanded` is toggled to `true`, expand the metric sliders (technica, fisico, actitud, vision_juego) and the save button below the compact header, allowing edits.

---

## Verification Plan

### Automated/Manual Verification
- Log in as a regular player participant.
- Vote on some but not all players. Verify that the player does not see the session progress list at the top.
- Complete all votes (players, awards, team rating).
- Verify that the Session Progress card appears at the top, showing the completion badges of other participants.
- Verify that the individual voting cards below collapse into compact rows.
- Click "Modificar" on a compact card, make changes to sliders, and click "Actualizar voto". Verify that the vote updates successfully and re-collapses.
