"use client";

import { useState, useEffect } from "react";
import { MatchSession, HistoricalRating, PlayerStats } from "@/types";
import StatLineChart from "@/components/charts/StatLineChart";
import AwardRanking from "@/components/charts/MVPRanking";
import ComparisonTable from "@/components/charts/ComparisonTable";
import AttendanceRanking from "@/components/charts/AttendanceRanking";
import { TargetIcon, DumbbellIcon, FlameIcon, BrainIcon } from "@/components/Icons";



interface TeamTabProps {
  sessions: MatchSession[];
  ratings: HistoricalRating[];
  stats: { [playerId: string]: PlayerStats };
  topMVPs: any;
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

export default function TeamTab({
  sessions,
  ratings,
  stats,
  topMVPs,
}: TeamTabProps) {
  const players = Object.values(stats);
  void topMVPs;
  const isSingleSession = sessions.length === 1;

  const teamProgressionSeries = [
    {
      playerId: "team-progression",
      playerName: "Rendimiento del Equipo",
      color: "#00e676",
      values: sessions
        .filter((s) => s.team_rating !== null)
        .map((s) => ({
          sessionId: s.id,
          value: Number(s.team_rating),
        })),
    },
  ];
  const hasTeamRatings = teamProgressionSeries[0].values.length > 0;

  // Compute awards rankings directly from stats
  const computedMVPs = Object.values(stats)
    .filter((ps) => ps.mvpCount > 0)
    .map((ps) => ({
      player_id: ps.profile.id,
      username: ps.profile.username,
      count: ps.mvpCount,
    }))
    .sort((a, b) => b.count - a.count);

  const computedBigpapers = Object.values(stats)
    .filter((ps) => ps.bigpaperCount > 0)
    .map((ps) => ({
      player_id: ps.profile.id,
      username: ps.profile.username,
      count: ps.bigpaperCount,
    }))
    .sort((a, b) => b.count - a.count);

  const computedPoops = Object.values(stats)
    .filter((ps) => ps.poopCount > 0)
    .map((ps) => ({
      player_id: ps.profile.id,
      username: ps.profile.username,
      count: ps.poopCount,
    }))
    .sort((a, b) => b.count - a.count);

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
                transition: "background-color 160ms cubic-bezier(0.23, 1, 0.32, 1)",
              }}
              onMouseEnter={(e) => {
                if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                  e.currentTarget.style.background = "rgba(0, 230, 118, 0.1)";
                }
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
                transition: "background-color 160ms cubic-bezier(0.23, 1, 0.32, 1)",
              }}
              onMouseEnter={(e) => {
                if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                  e.currentTarget.style.background = "rgba(255, 82, 82, 0.1)";
                }
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
                  transition: "background-color 160ms cubic-bezier(0.23, 1, 0.32, 1), border-color 160ms cubic-bezier(0.23, 1, 0.32, 1), color 160ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 160ms cubic-bezier(0.23, 1, 0.32, 1), transform 160ms cubic-bezier(0.23, 1, 0.32, 1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  boxShadow: isSelected
                    ? `0 0 10px ${playerColor}25`
                    : "none",
                }}
                onMouseEnter={(e) => {
                  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                    if (!isSelected) {
                      e.currentTarget.style.border = `1px solid ${playerColor}88`;
                      e.currentTarget.style.color = "#a0c4ac";
                    } else {
                      e.currentTarget.style.boxShadow = `0 0 12px ${playerColor}40`;
                    }
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
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.96)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "none";
                }}
                onTouchStart={(e) => {
                  e.currentTarget.style.transform = "scale(0.96)";
                }}
                onTouchEnd={(e) => {
                  e.currentTarget.style.transform = "none";
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

      {/* Team Performance Widget (Single Session View only) */}
      {isSingleSession && sessions[0] && sessions[0].team_rating !== null && (
        <div className="animate-slide-up">
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.6rem",
              letterSpacing: "0.05em",
              color: "#e4f0e8",
              margin: "0 0 0.75rem",
            }}
          >
            Rendimiento General de la Sesión
          </h2>
          <div
            className="card-sport"
            style={{
              padding: "1.75rem",
              background: "linear-gradient(135deg, rgba(0, 230, 118, 0.05) 0%, rgba(28, 56, 40, 0.2) 100%)",
              border: "1px solid rgba(0, 230, 118, 0.2)",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.4rem",
                  color: "#00e676",
                  letterSpacing: "0.08em",
                  lineHeight: 1.1,
                }}
              >
                RENDIMIENTO DEL EQUIPO
              </span>
            </div>

            {/* Prominent Score Visual */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                background: "rgba(0, 0, 0, 0.3)",
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                border: "1px solid rgba(28, 56, 40, 0.5)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "3.5rem",
                    color: "#00e676",
                    lineHeight: 1,
                    textShadow: "0 0 15px rgba(0, 230, 118, 0.3)",
                  }}
                >
                  {Number(sessions[0].team_rating).toFixed(1)}
                </span>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* MVP and Attendance sections in grid */}
      <div>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.6rem",
            letterSpacing: "0.05em",
            color: "#e4f0e8",
            margin: "0 0 1rem",
          }}
        >
          {isSingleSession ? "Premios de la Sesión" : "Rankings de Premios"}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            gap: "1.5rem",
            marginBottom: "1.5rem",
          }}
        >
          <section>
            <h3
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.3rem",
                letterSpacing: "0.05em",
                color: "#ffc93c",
                margin: "0 0 0.5rem",
              }}
            >
              {isSingleSession ? "MVP de la sesión" : "Ranking MVPs"}
            </h3>
            <AwardRanking entries={computedMVPs} badgeText="MVP" badgeClass="badge-gold" awardType="mvp" />
          </section>

          <section>
            <h3
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.3rem",
                letterSpacing: "0.05em",
                color: "#ffab40",
                margin: "0 0 0.5rem",
              }}
            >
              {isSingleSession ? "Papelón de la sesión" : "Ranking Papelón"}
            </h3>
            <AwardRanking entries={computedBigpapers} badgeText={isSingleSession ? "Papelón" : "Papelones"} badgeClass="badge-amber" awardType="bigpaper" />
          </section>

          <section>
            <h3
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.3rem",
                letterSpacing: "0.05em",
                color: "#8d6e63",
                margin: "0 0 0.5rem",
              }}
            >
              {isSingleSession ? "Jugador caca" : "Ranking Jugador Caca"}
            </h3>
            <AwardRanking entries={computedPoops} badgeText={isSingleSession ? "Caca" : "Cacas"} badgeClass="badge-brown" awardType="poop" />
          </section>
        </div>
      </div>

      {!isSingleSession && (
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
            Asistencia
          </h2>
          <AttendanceRanking stats={stats} sessions={sessions} />
        </section>
      )}

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
          data={buildFilteredPlayersSeries("avg_total")}
        />
      </section>

      {/* 2.5 Progresión del Equipo */}
      {!isSingleSession && hasTeamRatings && (
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
            Progresión del Equipo
          </h2>
          <StatLineChart
            label="Calificación Histórica del Equipo"
            sessions={sessions.filter((s) => s.team_rating !== null)}
            data={teamProgressionSeries}
          />
        </section>
      )}

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
          className="grid grid-cols-1 md:grid-cols-2"
          style={{
            gap: "1rem",
          }}
        >
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
        <ComparisonTable stats={stats} sessions={sessions} />
      </section>
    </div>
  );
}
