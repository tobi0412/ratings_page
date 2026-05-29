"use client";

import { useState } from "react";
import { MatchSession, HistoricalRating, Profile } from "@/types";
import StatLineChart from "@/components/charts/StatLineChart";

interface PlayerStats {
  profile: Profile;
  avgTotal: number;
  avgTecnica: number;
  avgFisico: number;
  avgActitud: number;
  avgVision: number;
  mvpCount: number;
}

interface PersonalTabProps {
  sessions: MatchSession[];
  ratings: HistoricalRating[];
  stats: { [playerId: string]: PlayerStats };
  currentUserId: string | null;
}

const sectionHeading = (title: string) => (
  <h2
    style={{
      fontFamily: "'Bebas Neue', sans-serif",
      fontSize: "1.4rem",
      letterSpacing: "0.05em",
      color: "#e4f0e8",
      margin: "0 0 0.75rem",
    }}
  >
    {title}
  </h2>
);

export default function PersonalTab({
  sessions,
  ratings,
  stats,
  currentUserId,
}: PersonalTabProps) {
  const playerIds = Object.keys(stats);

  const sortedPlayerIds = [...playerIds].sort((a, b) => {
    if (a === currentUserId) return -1;
    if (b === currentUserId) return 1;
    return stats[b].avgTotal - stats[a].avgTotal;
  });

  const defaultPlayerId =
    currentUserId && stats[currentUserId]
      ? currentUserId
      : (sortedPlayerIds[0] ?? null);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(
    defaultPlayerId,
  );

  if (sortedPlayerIds.length === 0) {
    return (
      <div
        style={{
          padding: "3rem 1rem",
          textAlign: "center",
          color: "#3d6e50",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "1rem",
          letterSpacing: "0.06em",
        }}
      >
        Sin jugadores
      </div>
    );
  }

  const selectedPlayer = selectedPlayerId ? stats[selectedPlayerId] : null;
  const playerName = selectedPlayer?.profile?.username ?? "Jugador";

  const buildSeries = (
    playerId: string,
    statKey: keyof HistoricalRating,
    color: string,
    name: string,
  ) => [
    {
      playerId,
      playerName: name,
      color,
      values: ratings
        .filter((r) => r.player_id === playerId)
        .map((r) => ({
          sessionId: r.match_id,
          value: r[statKey] as number | null,
        })),
    },
  ];

  const statCards = selectedPlayer
    ? [
        {
          label: "Rating",
          value: selectedPlayer.avgTotal.toFixed(1),
          color: "#00e676",
        },
        {
          label: "Técnica",
          value: selectedPlayer.avgTecnica.toFixed(1),
          color: "#40c4ff",
        },
        {
          label: "Físico",
          value: selectedPlayer.avgFisico.toFixed(1),
          color: "#ff5252",
        },
        {
          label: "Actitud",
          value: selectedPlayer.avgActitud.toFixed(1),
          color: "#ffab40",
        },
        {
          label: "Visión",
          value: selectedPlayer.avgVision.toFixed(1),
          color: "#ea80fc",
        },
        {
          label: "MVPs",
          value: String(selectedPlayer.mvpCount),
          color: "#ffc93c",
        },
      ]
    : [];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Player selector */}
      <div
        style={{
          overflowX: "auto",
          display: "flex",
          gap: "0.5rem",
          paddingBottom: "0.25rem",
        }}
      >
        {sortedPlayerIds.map((id) => {
          const isActive = id === selectedPlayerId;
          return (
            <button
              key={id}
              onClick={() => setSelectedPlayerId(id)}
              style={{
                whiteSpace: "nowrap",
                padding: "0.35rem 0.85rem",
                borderRadius: "999px",
                cursor: "pointer",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 600,
                fontSize: "0.85rem",
                letterSpacing: "0.06em",
                background: isActive
                  ? "rgba(0,230,118,0.15)"
                  : "rgba(28,56,40,0.3)",
                border: isActive ? "1px solid #00e676" : "1px solid #1c3828",
                color: isActive ? "#00e676" : "#a0c4ac",
                transition: "all 0.15s ease",
              }}
            >
              {stats[id]?.profile?.username ?? id}
            </button>
          );
        })}
      </div>

      {/* 2. Rating General */}
      {selectedPlayerId && (
        <div>
          {sectionHeading("Rating General")}
          <StatLineChart
            label="Promedio General"
            data={buildSeries(
              selectedPlayerId,
              "avg_total",
              "#00e676",
              playerName,
            )}
            sessions={sessions}
          />
        </div>
      )}

      {/* 3. Stats por Categoría */}
      {selectedPlayerId && (
        <div>
          {sectionHeading("Stats por Categoría")}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "1rem",
            }}
          >
            <StatLineChart
              label="🎯 Técnica"
              data={buildSeries(
                selectedPlayerId,
                "avg_tecnica",
                "#40c4ff",
                playerName,
              )}
              sessions={sessions}
            />
            <StatLineChart
              label="💪 Físico"
              data={buildSeries(
                selectedPlayerId,
                "avg_fisico",
                "#ff5252",
                playerName,
              )}
              sessions={sessions}
            />
            <StatLineChart
              label="🔥 Actitud"
              data={buildSeries(
                selectedPlayerId,
                "avg_actitud",
                "#ffab40",
                playerName,
              )}
              sessions={sessions}
            />
            <StatLineChart
              label="👁 Visión"
              data={buildSeries(
                selectedPlayerId,
                "avg_vision_juego",
                "#ea80fc",
                playerName,
              )}
              sessions={sessions}
            />
          </div>
        </div>
      )}

      {/* 4. Resumen */}
      {selectedPlayer && (
        <div>
          {sectionHeading("Resumen")}
          <div className="card-sport">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 0 }}>
              {statCards.map((card, index) => (
                <div
                  key={card.label}
                  style={{
                    flex: "1 1 100px",
                    padding: "1rem",
                    textAlign: "center",
                    borderRight:
                      index < statCards.length - 1
                        ? "1px solid rgba(28,56,40,0.5)"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "0.7rem",
                      color: "#3d6e50",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      marginBottom: "0.25rem",
                    }}
                  >
                    {card.label}
                  </div>
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
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
