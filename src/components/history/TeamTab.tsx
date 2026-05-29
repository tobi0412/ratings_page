"use client";

import { MatchSession, HistoricalRating, Profile } from "@/types";
import StatLineChart from "@/components/charts/StatLineChart";
import MVPRanking from "@/components/charts/MVPRanking";
import ComparisonTable from "@/components/charts/ComparisonTable";

interface PlayerStats {
  profile: Profile;
  avgTotal: number;
  avgTecnica: number;
  avgFisico: number;
  avgActitud: number;
  avgVision: number;
  mvpCount: number;
}

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

export default function TeamTab({
  sessions,
  ratings,
  stats,
  topMVPs,
}: TeamTabProps) {
  const players = Object.values(stats);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* 1. Ranking MVPs */}
      <section>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.4rem",
            letterSpacing: "0.05em",
            color: "#e4f0e8",
            margin: "0 0 0.75rem",
          }}
        >
          Ranking MVPs
        </h2>
        <MVPRanking topMVPs={topMVPs} />
      </section>

      {/* 2. Dashboard General */}
      <section>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.4rem",
            letterSpacing: "0.05em",
            color: "#e4f0e8",
            margin: "0 0 0.75rem",
          }}
        >
          Evolución General
        </h2>
        <StatLineChart
          label="Rating General"
          sessions={sessions}
          data={buildAllPlayersSeries("avg_total")}
        />
      </section>

      {/* 3. Stats por Categoría */}
      <section>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.4rem",
            letterSpacing: "0.05em",
            color: "#e4f0e8",
            margin: "0 0 0.75rem",
          }}
        >
          Stats por Categoría
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1rem",
          }}
        >
          <StatLineChart
            label="🎯 Habilidad Técnica"
            sessions={sessions}
            data={buildAllPlayersSeries("avg_tecnica")}
          />
          <StatLineChart
            label="💪 Esfuerzo Físico"
            sessions={sessions}
            data={buildAllPlayersSeries("avg_fisico")}
          />
          <StatLineChart
            label="🔥 Actitud"
            sessions={sessions}
            data={buildAllPlayersSeries("avg_actitud")}
          />
          <StatLineChart
            label="🧠 Toma de Decisiones"
            sessions={sessions}
            data={buildAllPlayersSeries("avg_vision_juego")}
          />
        </div>
      </section>

      {/* 4. Comparativa del Equipo */}
      <section>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.4rem",
            letterSpacing: "0.05em",
            color: "#e4f0e8",
            margin: "0 0 0.75rem",
          }}
        >
          Comparativa del Equipo
        </h2>
        <ComparisonTable stats={stats} />
      </section>
    </div>
  );
}
