# Player Session Comparison (% changes) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a percentage change comparison on the Latest Session page (`/latest`) comparing each player's statistics in the last completed session against their own previous completed session they participated in.

**Architecture:** Create a shared stats comparison utility inside `src/lib/stats-comparison.ts`. Fetch and calculate player comparisons in `/latest/page.tsx` and pass them to the `PersonalTab` component which will render clean, green/red trend badges inside the "Resumen" cards.

**Tech Stack:** Next.js, React, Tailwind CSS

---

### Task 1: Stats Comparison Utility

**Files:**
- Create: `src/lib/stats-comparison.ts`
- Test: `src/lib/stats-comparison.test.ts`

- [ ] **Step 1: Write the failing test**
  Create `src/lib/stats-comparison.test.ts`:
  ```typescript
  import { calculateSessionComparisons } from "./stats-comparison";
  import { HistoricalRating } from "../types";

  const mockRatings: HistoricalRating[] = [
    {
      id: "r1",
      player_id: "player1",
      match_id: "match1",
      avg_total: 6.0,
      avg_tecnica: 5.0,
      avg_fisico: 7.0,
      avg_actitud: 6.0,
      avg_vision_juego: 6.0,
      mvp_count: 0,
      computed_at: "2026-06-01T20:00:00Z",
    },
    {
      id: "r2",
      player_id: "player1",
      match_id: "match2",
      avg_total: 7.5,
      avg_tecnica: 6.0,
      avg_fisico: 8.0,
      avg_actitud: 8.0,
      avg_vision_juego: 8.0,
      mvp_count: 1,
      computed_at: "2026-06-02T20:00:00Z",
    },
    {
      id: "r3",
      player_id: "player2",
      match_id: "match2",
      avg_total: 8.0,
      avg_tecnica: 8.0,
      avg_fisico: 8.0,
      avg_actitud: 8.0,
      avg_vision_juego: 8.0,
      mvp_count: 0,
      computed_at: "2026-06-02T20:00:00Z",
    },
  ];

  console.log("Running stats-comparison tests...");

  const result = calculateSessionComparisons(mockRatings);

  const p1 = result["player1"];
  if (!p1) throw new Error("player1 comparison missing");
  if (p1.avgTotalChange !== 25.0) throw new Error(`avgTotalChange expected 25.0, got ${p1.avgTotalChange}`);
  if (p1.avgTecnicaChange !== 20.0) throw new Error(`avgTecnicaChange expected 20.0, got ${p1.avgTecnicaChange}`);
  if (Math.abs((p1.avgFisicoChange ?? 0) - 14.28) > 0.01) {
    throw new Error(`avgFisicoChange expected ~14.28, got ${p1.avgFisicoChange}`);
  }

  const p2 = result["player2"];
  if (!p2) throw new Error("player2 comparison missing");
  if (p2.avgTotalChange !== null) throw new Error("player2 avgTotalChange should be null");

  console.log("All tests passed successfully!");
  ```

- [ ] **Step 2: Run test to verify it fails**
  Run: `npx -y tsx src/lib/stats-comparison.test.ts`
  Expected: FAIL with module loading error or "calculateSessionComparisons is not a function" because the utility file does not exist yet.

- [ ] **Step 3: Implement stats-comparison logic**
  Create `src/lib/stats-comparison.ts`:
  ```typescript
  import { HistoricalRating } from "@/types";

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
  ): SessionComparisonsMap {
    const playerRatingsMap: { [playerId: string]: HistoricalRating[] } = {};

    // Group ratings by player
    ratings.forEach((r) => {
      if (!playerRatingsMap[r.player_id]) {
        playerRatingsMap[r.player_id] = [];
      }
      playerRatingsMap[r.player_id].push(r);
    });

    const comparisons: SessionComparisonsMap = {};

    Object.entries(playerRatingsMap).forEach(([playerId, playerRatings]) => {
      // Sort in chronological order (oldest first)
      const sorted = [...playerRatings].sort(
        (a, b) => new Date(a.computed_at).getTime() - new Date(b.computed_at).getTime()
      );

      if (sorted.length < 2) {
        // Less than 2 ratings means no comparison is possible
        comparisons[playerId] = {
          avgTotalChange: null,
          avgTecnicaChange: null,
          avgFisicoChange: null,
          avgActitudChange: null,
          avgVisionChange: null,
        };
        return;
      }

      const latest = sorted[sorted.length - 1];
      const prev = sorted[sorted.length - 2];

      const getPctChange = (latestVal: number | null, prevVal: number | null): number | null => {
        if (latestVal === null || prevVal === null || prevVal === 0) {
          return null;
        }
        return ((latestVal - prevVal) / prevVal) * 100;
      };

      comparisons[playerId] = {
        avgTotalChange: getPctChange(latest.avg_total, prev.avg_total),
        avgTecnicaChange: getPctChange(latest.avg_tecnica, prev.avg_tecnica),
        avgFisicoChange: getPctChange(latest.avg_fisico, prev.avg_fisico),
        avgActitudChange: getPctChange(latest.avg_actitud, prev.avg_actitud),
        avgVisionChange: getPctChange(latest.avg_vision_juego, prev.avg_vision_juego),
      };
    });

    return comparisons;
  }
  ```

- [ ] **Step 4: Run test to verify it passes**
  Run: `npx -y tsx src/lib/stats-comparison.test.ts`
  Expected: PASS showing "All tests passed successfully!"

- [ ] **Step 5: Clean up test file & commit**
  Run: `rm src/lib/stats-comparison.test.ts` (or delete manually)
  Run:
  ```bash
  git add src/lib/stats-comparison.ts
  git commit -m "feat: add calculateSessionComparisons utility"
  ```

---

### Task 2: Page Component Integration

**Files:**
- Modify: `src/app/latest/page.tsx`

- [ ] **Step 1: Update page component imports and page logic**
  Open `src/app/latest/page.tsx` and import `calculateSessionComparisons`:
  ```typescript
  import { calculateSessionComparisons } from "@/lib/stats-comparison";
  ```
  And inside the `load()` function, after `getHistoricalStats()` data is fetched, call the comparison calculator and store it in state:
  Add state for comparisons at the top of `LatestSessionPage`:
  ```typescript
  const [comparisons, setComparisons] = useState<{ [playerId: string]: any }>({});
  ```
  Set state in `load()`:
  ```typescript
  setComparisons(calculateSessionComparisons(histData.ratings));
  ```
  Pass the state to `PersonalTab`:
  ```tsx
  <PersonalTab
    sessions={[latestSession]}
    ratings={latestRatings}
    stats={latestStatsMap}
    currentUserId={currentUserId}
    comparisons={comparisons}
  />
  ```

- [ ] **Step 2: Commit changes**
  Run:
  ```bash
  git add src/app/latest/page.tsx
  git commit -m "feat: integrate session comparisons calculation into latest session page"
  ```

---

### Task 3: Render Comparison Badges in PersonalTab

**Files:**
- Modify: `src/components/history/PersonalTab.tsx`

- [ ] **Step 1: Add comparisons prop type and map cards**
  Add the `SessionComparisonsMap` and update the `PersonalTabProps` interface:
  ```typescript
  import { SessionComparisonsMap } from "@/lib/stats-comparison";

  interface PersonalTabProps {
    sessions: MatchSession[];
    ratings: HistoricalRating[];
    stats: { [playerId: string]: PlayerStats };
    currentUserId: string | null;
    comparisons?: SessionComparisonsMap;
  }
  ```
  Update the `statCards` list mapping to map `change`:
  ```typescript
    const playerComparison = comparisons?.[selectedPlayerId ?? ""];
    const statCards = selectedPlayer
      ? [
          {
            label: "Rating",
            value: selectedPlayer.avgTotal.toFixed(2),
            color: "#00e676",
            change: playerComparison?.avgTotalChange ?? null,
          },
          {
            label: "Habilidad Técnica",
            value: selectedPlayer.avgTecnica.toFixed(2),
            color: "#40c4ff",
            change: playerComparison?.avgTecnicaChange ?? null,
          },
          {
            label: "Esfuerzo Físico",
            value: selectedPlayer.avgFisico.toFixed(2),
            color: "#ff5252",
            change: playerComparison?.avgFisicoChange ?? null,
          },
          {
            label: "Actitud",
            value: selectedPlayer.avgActitud.toFixed(2),
            color: "#ffab40",
            change: playerComparison?.avgActitudChange ?? null,
          },
          {
            label: "Toma de Decisiones",
            value: selectedPlayer.avgVision.toFixed(2),
            color: "#ea80fc",
            change: playerComparison?.avgVisionChange ?? null,
          },
          ...(totalSessions > 1
            ? [
                {
                  label: "Asistencia",
                  value: `${Math.floor(attendancePercentage)}% (${selectedPlayer.sessionsCount}/${totalSessions})`,
                  color: "#a0c4ac",
                  change: null,
                },
              ]
            : []),
          {
            label: "MVPs",
            value: String(selectedPlayer.mvpCount),
            color: "#ffc93c",
            change: null,
          },
        ]
      : [];
  ```

- [ ] **Step 2: Render comparison badge in Resumen card**
  Inside the card renderer of the `Resumen` section (around lines 570-620 in `PersonalTab.tsx`):
  ```tsx
                    <div
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "1.8rem",
                        color: card.color,
                        lineHeight: 1,
                      }}
                    >
                      {card.value}
                    </div>
                    {card.change !== undefined && card.change !== null && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.2rem",
                          fontSize: "0.75rem",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 700,
                          color: card.change > 0 ? "#00e676" : card.change < 0 ? "#ff5252" : "#3d6e50",
                          marginTop: "0.4rem",
                          background: card.change > 0 ? "rgba(0, 230, 118, 0.08)" : card.change < 0 ? "rgba(255, 82, 82, 0.08)" : "rgba(61, 110, 80, 0.08)",
                          padding: "0.1rem 0.35rem",
                          borderRadius: "4px",
                        }}
                      >
                        <span>{card.change > 0 ? "▲" : card.change < 0 ? "▼" : "•"}</span>
                        <span>{card.change > 0 ? "+" : ""}{card.change.toFixed(1)}%</span>
                      </div>
                    )}
  ```

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add src/components/history/PersonalTab.tsx
  git commit -m "feat: render percentage change indicators in player summary card"
  ```

---

### Task 4: Compilation and Verification

- [ ] **Step 1: Run Next.js build to verify code correctness**
  Run: `npm run build`
  Expected: Builds without TypeScript errors or build failures.
