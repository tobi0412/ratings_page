# Design Spec: Player Session Comparison (% changes)

Implement a percentage change comparison on the Latest Session page (`/latest`) comparing each player's statistics in the last completed session against their own previous completed session they participated in. The percentage changes will be shown as visual indicators inside the "Resumen" cards.

## 1. Helper Function: `src/lib/stats-comparison.ts`

Create a utility module with a pure function to calculate percentage differences:
* **Function Signature:**
  ```typescript
  export interface PlayerSessionComparison {
    avgTotalChange: number | null;
    avgTecnicaChange: number | null;
    avgFisicoChange: number | null;
    avgActitudChange: number | null;
    avgVisionChange: number | null;
  }

  export type SessionComparisonsMap = {
    [playerId: string]: PlayerSessionComparison;
  };

  export function calculateSessionComparisons(
    ratings: HistoricalRating[]
  ): SessionComparisonsMap;
  ```
* **Logic:**
  1. Group ratings by `player_id`.
  2. For each player:
     * Sort their ratings by `computed_at` in ascending order.
     * The last rating is the latest rating ($R_{\text{latest}}$).
     * The second-to-last rating is the previous rating ($R_{\text{prev}}$).
     * If $R_{\text{prev}}$ does not exist, the comparison yields `null` for all metrics (meaning first session, no comparison).
     * For each metric, calculate the difference:
       $$\Delta\% = \frac{R_{\text{latest}} - R_{\text{prev}}}{R_{\text{prev}}} \times 100$$
     * Ensure division-by-zero is handled (if $R_{\text{prev}} = 0$, yield $0$ or `null`).

## 2. Integration: `/latest` (`src/app/latest/page.tsx`)

Update the page component to:
* Import `calculateSessionComparisons` from `@/lib/stats-comparison`.
* Calculate comparisons using the full historical ratings fetched from the database:
  ```typescript
  const comparisonsMap = calculateSessionComparisons(ratings);
  ```
* Pass `comparisonsMap` down to the `PersonalTab` component:
  ```typescript
  <PersonalTab
    sessions={[latestSession]}
    ratings={latestRatings}
    stats={latestStatsMap}
    currentUserId={currentUserId}
    comparisons={comparisonsMap}
  />
  ```

## 3. UI Component: `PersonalTab` (`src/components/history/PersonalTab.tsx`)

Update the tab component to:
* Support the optional `comparisons?: SessionComparisonsMap` prop.
* Extract the current selected player's comparisons:
  ```typescript
  const playerComparison = comparisons?.[selectedPlayerId ?? ""];
  ```
* Map these deltas into the `statCards` list:
  * Overall Rating: `playerComparison?.avgTotalChange`
  * Habilidad Técnica: `playerComparison?.avgTecnicaChange`
  * Esfuerzo Físico: `playerComparison?.avgFisicoChange`
  * Actitud: `playerComparison?.avgActitudChange`
  * Toma de Decisiones: `playerComparison?.avgVisionChange`
* Render a custom indicator badge below the metric value inside the card:
  * **Positive Delta (> 0):** Soft green badge (`rgba(0, 230, 118, 0.08)` background, `#00e676` text) with a up arrow `▲` and formatted percentage (e.g., `▲ +4.5%`).
  * **Negative Delta (< 0):** Soft red badge (`rgba(255, 82, 82, 0.08)` background, `#ff5252` text) with a down arrow `▼` and formatted percentage (e.g., `▼ -2.3%`).
  * **Zero Delta (=== 0):** Grey/green badge (`rgba(61, 110, 80, 0.08)` background, `#3d6e50` text) with `• 0.0%`.
  * **No previous rating (null/undefined):** Render nothing.

## 4. Verification Plan

### Automated / Build Verification
* Run compilation using `npm run build` to verify types, routes, and bundler configurations are correct.

### Manual Verification
* Access `/latest` and check the "Resumen" section for various players.
* Verify that players with multiple sessions show green, red, or grey percentage indicators depending on whether their performance improved, declined, or stayed the same relative to their previous game.
* Verify that a player with only one session in history displays no comparison badge.
