# Design Spec: Última sesión (Latest Session Results)

Implement a new page `/latest` ("Última sesión") that displays the detailed ratings, comparisons, and MVPs for the last completed session. The layout will mirror the `/history` tabbed structure but display data filtered and adapted for that single session only, triggering the single-value gauge/bar chart views.

## 1. Page Component: `/latest` (`src/app/latest/page.tsx`)

A new page at `src/app/latest/page.tsx` will:
* Retrieve the logged-in user profile via [getCurrentProfile](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/auth.ts) and redirect to `/auth/login` if not authenticated.
* Fetch all completed match sessions and historical ratings via [getHistoricalStats](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/stats.ts).
* If no completed sessions exist, redirect immediately to `/dashboard`.
* Select the latest completed session:
  ```typescript
  const latestSession = sessions[sessions.length - 1];
  ```
* Filter/transform datasets on the client side:
  * Filter `ratings` down to only rows matching `latestSession.id`.
  * Map player stats into a `{ [playerId: string]: PlayerStats }` dictionary for the latest session only.
  * Compile session-specific MVP lists based on the `mvp_count > 0` fields in the filtered ratings.
* Render the tab-based layout containing [PersonalTab](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/history/PersonalTab.tsx) and [TeamTab](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/history/TeamTab.tsx).
  * Page title: `Última sesión: {latestSession.name}`

## 2. Navigation Link: `Navbar` (`src/components/layouts/Navbar.tsx`)

Add a new navigation link pointing to `/latest` in the authenticated navbar block of [Navbar.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/layouts/Navbar.tsx):
```tsx
<NavLink href="/latest" active={isActive("/latest")}>
  Última sesión
</NavLink>
```
Ordered as:
1. **Última sesión** (`/latest`)
2. **Histórico** (`/history`)
3. **Votación** (`/dashboard`)

## 3. Verification Plan

### Automated/Build Verification
* Run `npm run build` to verify there are no compilation errors or routing issues.

### Manual Verification
* Navigate to `/latest` and verify that the page displays the name of the last completed session in the header.
* Verify that "Estadísticas Personales" renders gauge charts for each player.
* Verify that "Comparativas por Equipo" renders bar charts comparing the averages of all players for that session.
* Verify that clicking "Última sesión" in the Navbar properly highlights the link and routes correctly.
* Verify that if there are no historical sessions (test database clean), navigation to `/latest` redirects to `/dashboard`.
