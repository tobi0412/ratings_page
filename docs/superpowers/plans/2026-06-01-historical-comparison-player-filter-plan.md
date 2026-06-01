# Historical Comparison Player Filter Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a player filtering panel at the top of the "Comparativas por Equipo" dashboard tab to show/hide lines of specific players in the historical line charts.

**Architecture:** Maintain a `selectedPlayerIds` array state in `TeamTab.tsx`. Generate all player series with consistent color assignments, then filter the series array down to the selected player IDs before passing it to the `StatLineChart` widgets.

**Tech Stack:** Next.js (React client component), Recharts, Tailwind CSS and Inline Styles.

---

### Task 1: Add Player Filter State and Logic to TeamTab

**Files:**
- Modify: `src/components/history/TeamTab.tsx`

- [ ] **Step 1: Add imports and state hook to TeamTab.tsx**
  Import `useState` and `useEffect` from `"react"`. Set up the state variables and quick select functions.
  Add the helper `hexToRgb` to format background colors of player pills.
  
  Replace the top of the file and the beginning of the `TeamTab` component to look like this:
  ```typescript
  "use client";

  import { useState, useEffect } from "react";
  import { MatchSession, HistoricalRating, PlayerStats } from "@/types";
  import StatLineChart from "@/components/charts/StatLineChart";
  import MVPRanking from "@/components/charts/MVPRanking";
  import ComparisonTable from "@/components/charts/ComparisonTable";
  import AttendanceRanking from "@/components/charts/AttendanceRanking";
  import { TargetIcon, DumbbellIcon, FlameIcon, BrainIcon } from "@/components/Icons";

  interface MVPEntry {
    player_id: string;
    username: string;
    total_mvps: number;
  }

  interface TeamTabProps {
    sessions: MatchSession[];
    ratings: HistoricalRating[];
    stats: { [playerId: string]: PlayerStats };
    topMVPs: MVPEntry[];
  }

  const PLAYER_COLORS = [
    "#00e676",
    "#ff5252",
    "#ffab40",
    "#40c4ff",
    "#ea80fc",
    "#69f0ae",
    "#ff6e40",
    "#ffd740",
  ];

  function hexToRgb(hex: string): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }
  ```

- [ ] **Step 2: Add selection state and toggle handlers inside TeamTab component**
  Add state and helper methods at the start of the `TeamTab` body:
  ```typescript
  export default function TeamTab({
    sessions,
    ratings,
    stats,
    topMVPs,
  }: TeamTabProps) {
    const players = Object.values(stats);
    const isSingleSession = sessions.length === 1;
    const mvpHeading = isSingleSession
      ? topMVPs.length > 1
        ? "MVPs"
        : "MVP"
      : "Ranking MVPs";

    const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(() =>
      Object.keys(stats)
    );

    // Keep state updated in case stats object changes
    useEffect(() => {
      setSelectedPlayerIds(Object.keys(stats));
    }, [stats]);

    const togglePlayer = (playerId: string) => {
      setSelectedPlayerIds((prev) =>
        prev.includes(playerId)
          ? prev.filter((id) => id !== playerId)
          : [...prev, playerId]
      );
    };

    const selectAll = () => {
      setSelectedPlayerIds(Object.keys(stats));
    };

    const selectNone = () => {
      setSelectedPlayerIds([]);
    };
  ```

- [ ] **Step 3: Modify series building logic to filter based on selection**
  Update `buildAllPlayersSeries` and add a new filtering function `buildFilteredPlayersSeries`:
  ```typescript
    const buildAllPlayersSeries = (statKey: keyof HistoricalRating) =>
      players.map((ps, index) => ({
        playerId: ps.profile.id,
        playerName: ps.profile.username,
        color: PLAYER_COLORS[index % PLAYER_COLORS.length],
        values: ratings
          .filter((r) => r.player_id === ps.profile.id)
          .map((r) => ({
            sessionId: r.match_id,
            value: r[statKey] as number | null,
          })),
      }));

    const buildFilteredPlayersSeries = (statKey: keyof HistoricalRating) => {
      return buildAllPlayersSeries(statKey).filter((series) =>
        selectedPlayerIds.includes(series.playerId)
      );
    };
  ```

- [ ] **Step 4: Update the return statement of TeamTab.tsx to include the Filter Pill selector UI**
  Add the player selector component JSX block right inside the parent div:
  ```typescript
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Player filter selector panel */}
        <div
          className="card-sport"
          style={{
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "0.5rem",
            }}
          >
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.1rem",
                color: "#3d6e50",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              Comparar Jugadores
            </span>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                onClick={selectAll}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#00e676",
                  cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(0, 230, 118, 0.2)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0, 230, 118, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Todos
              </button>
              <button
                onClick={selectNone}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#ff5252",
                  cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  border: "1px solid rgba(255, 82, 82, 0.2)",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 82, 82, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Ninguno
              </button>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "0.6rem",
            }}
          >
            {players.map((ps, index) => {
              const playerId = ps.profile.id;
              const isSelected = selectedPlayerIds.includes(playerId);
              const playerColor = PLAYER_COLORS[index % PLAYER_COLORS.length];
              return (
                <button
                  key={playerId}
                  onClick={() => togglePlayer(playerId)}
                  style={{
                    background: isSelected
                      ? `rgba(${hexToRgb(playerColor)}, 0.15)`
                      : "#12261b",
                    border: isSelected
                      ? `1px solid ${playerColor}`
                      : "1px solid #1c3828",
                    color: isSelected ? "#e4f0e8" : "#3d6e50",
                    padding: "0.4rem 0.85rem",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    letterSpacing: "0.02em",
                    transition: "all 0.2s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    boxShadow: isSelected
                      ? `0 0 10px ${playerColor}25`
                      : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.border = `1px solid ${playerColor}88`;
                      e.currentTarget.style.color = "#a0c4ac";
                    } else {
                      e.currentTarget.style.boxShadow = `0 0 12px ${playerColor}40`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.border = "1px solid #1c3828";
                      e.currentTarget.style.color = "#3d6e50";
                    } else {
                      e.currentTarget.style.boxShadow = `0 0 10px ${playerColor}25`;
                    }
                  }}
                >
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: playerColor,
                      display: "inline-block",
                      opacity: isSelected ? 1 : 0.4,
                      transition: "opacity 0.2s ease",
                    }}
                  />
                  {ps.profile.username}
                </button>
              );
            })}
          </div>
        </div>

        {/* MVP and Attendance sections in grid */}
  ```

- [ ] **Step 5: Replace data inputs of all StatLineChart instances with buildFilteredPlayersSeries**
  Modify all occurrences of `buildAllPlayersSeries` being passed to `StatLineChart` inside `TeamTab.tsx` with `buildFilteredPlayersSeries`.
  
  For "Evolución General":
  ```typescript
          <StatLineChart
            label="Rating General"
            sessions={sessions}
            data={buildFilteredPlayersSeries("avg_total")}
          />
  ```
  
  For "Stats por Categoría":
  ```typescript
            <StatLineChart
              label={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <TargetIcon size={14} style={{ color: "#40c4ff" }} />
                  <span>Habilidad Técnica</span>
                </span>
              }
              sessions={sessions}
              data={buildFilteredPlayersSeries("avg_tecnica")}
            />
            <StatLineChart
              label={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <DumbbellIcon size={14} style={{ color: "#ff5252" }} />
                  <span>Esfuerzo Físico</span>
                </span>
              }
              sessions={sessions}
              data={buildFilteredPlayersSeries("avg_fisico")}
            />
            <StatLineChart
              label={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <FlameIcon size={14} style={{ color: "#ffab40" }} />
                  <span>Actitud</span>
                </span>
              }
              sessions={sessions}
              data={buildFilteredPlayersSeries("avg_actitud")}
            />
            <StatLineChart
              label={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <BrainIcon size={14} style={{ color: "#ea80fc" }} />
                  <span>Toma de Decisiones</span>
                </span>
              }
              sessions={sessions}
              data={buildFilteredPlayersSeries("avg_vision_juego")}
            />
  ```

### Task 2: Verification

- [ ] **Step 1: Run the build command**
  Run: `npm run build` in the project root directory to ensure no Typescript or import compile errors are present.
  Expected: Clean build success.
