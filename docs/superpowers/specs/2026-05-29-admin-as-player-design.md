# Design: Admin User Acts as a Player

Allow admin users to also act as players in match sessions: participating, voting, being voted for, and having stats computed and displayed in the rankings/charts.

## Requirements

1. **Session Creation Participants Checklist**: Include the admin profile in the "Jugadores Participantes" selection checklist when creating a new session.
2. **Exclusion from Player Management**: The admin should not show up in the player approval/management lists ("Pendientes", "Aprobados", "Rechazados") under the "Jugadores" tab in the Admin Panel to prevent accidental actions.
3. **Voting and Dashboard**: If the admin is registered as a participant for an active session, they should see the voting grid (excluding themselves) and be able to vote and be voted for.
4. **Historical Statistics**: Include the admin in the team rankings, historical rating calculations, and charts if they have participated in closed sessions.
5. **Dashboard Redirection**: Redirect the admin to the `/dashboard` page upon entering the app if there is an active match session, similar to other players.

---

## Proposed Changes

### 1. Server Actions

#### [MODIFY] [players.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/players.ts)
Update `getApprovedPlayers` to fetch any approved profiles regardless of role (removing the `role = 'player'` restriction).
Keep `getAllPlayers()` filtering by `role = 'player'` so the admin panel's user management tab only exposes standard player accounts.

#### [MODIFY] [stats.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/stats.ts)
Update `getAllPlayersStats` to fetch all approved profiles instead of only those with `role = 'player'`. This ensures that admins who played have their stats computed and aggregated into the leaderboard.

---

### 2. Frontend Components & Pages

#### [MODIFY] [page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/page.tsx)
Modify the home page redirect check to route both `"player"` and `"admin"` roles to the `/dashboard` if an active session is running.

#### [MODIFY] [page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/admin/page.tsx)
* Import `getApprovedPlayers` from `@/actions/players`.
* Add an `approvedPlayers` state variable (`Profile[]`) to hold session participant candidates.
* Fetch `approvedPlayers` on mount and refresh it when approvals/rejections happen.
* Bind the "Nueva Sesión" participant checklist and helpers to `approvedPlayers` instead of `approved`.

---

## Verification Plan

### Automated Verification
* Verify types and compile checks using `npm run build` or similar.

### Manual Verification
1. **Admin Checklist Verification**:
   * Navigate to the Admin Panel (`/admin`) -> "Sesiones".
   * Under "Jugadores Participantes", verify that the admin's username is in the checklist.
2. **Session Creation**:
   * Create a new session, selecting the admin and at least one player.
3. **Dashboard Voting**:
   * Navigate to `/dashboard` as the admin.
   * Verify that the admin can see other participants in the list and can vote on them.
   * Log in as another participant player, navigate to `/dashboard`, and verify that the admin is listed as a selectable option to vote on.
4. **Leaderboard / Statistics**:
   * Complete the session.
   * Navigate to `/history` and verify that the admin is listed in the leaderboard and graphs if they participated in the session.
