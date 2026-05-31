"use client";

import { useState } from "react";
import { MatchSession, HistoricalRating, PlayerStats } from "@/types";
import StatLineChart from "@/components/charts/StatLineChart";
import { TargetIcon, DumbbellIcon, FlameIcon, BrainIcon, StarIcon, CalendarIcon } from "@/components/Icons";

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

  // Filter sessions to only those the selected player actually participated in
  const playerSessions = sessions.filter((s) =>
    ratings.some((r) => r.player_id === selectedPlayerId && r.match_id === s.id)
  );

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

  const totalSessions = sessions.length;
  const attendancePercentage = totalSessions > 0 && selectedPlayer
    ? (selectedPlayer.sessionsCount / totalSessions) * 100
    : 0;

  const statCards = selectedPlayer
    ? [
        {
          label: "Rating",
          value: selectedPlayer.avgTotal.toFixed(2),
          color: "#00e676",
        },
        {
          label: "Habilidad Técnica",
          value: selectedPlayer.avgTecnica.toFixed(2),
          color: "#40c4ff",
        },
        {
          label: "Esfuerzo Físico",
          value: selectedPlayer.avgFisico.toFixed(2),
          color: "#ff5252",
        },
        {
          label: "Actitud",
          value: selectedPlayer.avgActitud.toFixed(2),
          color: "#ffab40",
        },
        {
          label: "Toma de Decisiones",
          value: selectedPlayer.avgVision.toFixed(2),
          color: "#ea80fc",
        },
        // Only show Attendance if there are multiple sessions
        ...(totalSessions > 1
          ? [
              {
                label: "Asistencia",
                value: `${Math.floor(attendancePercentage)}% (${selectedPlayer.sessionsCount}/${totalSessions})`,
                color: "#a0c4ac",
              },
            ]
          : []),
        {
          label: "MVPs",
          value: String(selectedPlayer.mvpCount),
          color: "#ffc93c",
        },
      ]
    : [];

  const renderPlayerSelector = () => (
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
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* 1. Player selector */}
      {renderPlayerSelector()}

      {/* MVP Banner */}
      {sessions.length === 1 && selectedPlayer && selectedPlayer.mvpCount > 0 && (
        <div
          className="animate-slide-up"
          style={{
            background: "linear-gradient(135deg, rgba(255, 201, 60, 0.15) 0%, rgba(255, 110, 64, 0.05) 100%)",
            border: "1px solid #ffc93c",
            borderRadius: "8px",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            boxShadow: "0 4px 20px rgba(255, 201, 60, 0.05)",
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255, 201, 60, 0.2)",
              border: "1px solid #ffc93c",
              color: "#ffc93c",
              flexShrink: 0,
            }}
          >
            <StarIcon size={18} filled />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.2rem",
                color: "#ffc93c",
                letterSpacing: "0.05em",
                lineHeight: 1.1,
              }}
            >
              MVP de la sesión
            </span>
            <span
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: "0.82rem",
                color: "#a0c4ac",
                marginTop: "0.1rem",
              }}
            >
              ¡{selectedPlayer.profile.username} fue el jugador con más votos MVP en esta sesión!
            </span>
          </div>
        </div>
      )}

      {/* 2. Rating General & Asistencia Grid */}
      {selectedPlayerId && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              sessions.length > 1
                ? "repeat(auto-fit, minmax(300px, 1fr))"
                : "1fr",
            gap: "1.5rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            {sectionHeading("Rating General")}
            <div style={{ flex: 1 }}>
              {selectedPlayer && selectedPlayer.sessionsCount === 0 ? (
                <div
                  className="card-sport animate-slide-up"
                  style={{
                    padding: "1.5rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    minHeight: "260px",
                    textAlign: "center",
                  }}
                >
                  <CalendarIcon size="2.5rem" style={{ color: "#3d6e50", marginBottom: "0.75rem" }} />
                  <h3
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1.4rem",
                      color: "#e4f0e8",
                      margin: "0 0 0.5rem",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Sin sesiones
                  </h3>
                  <p
                    style={{
                      fontFamily: "'Barlow', sans-serif",
                      fontSize: "0.85rem",
                      color: "#3d6e50",
                      margin: 0,
                    }}
                  >
                    El jugador no participó de ninguna sesión.
                  </p>
                </div>
              ) : (
                <StatLineChart
                  label="Promedio General"
                  data={buildSeries(
                    selectedPlayerId,
                    "avg_total",
                    "#00e676",
                    playerName
                  )}
                  sessions={playerSessions}
                />
              )}
            </div>
          </div>

          {sessions.length > 1 && selectedPlayer && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {sectionHeading("Asistencia")}
              <div
                className="card-sport animate-slide-up"
                style={{
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  position: "relative",
                  overflow: "hidden",
                  height: "100%",
                  minHeight: "260px",
                  justifyContent: "center",
                }}
              >
                {/* Background glow texture */}
                <div
                  style={{
                    position: "absolute",
                    top: "-50px",
                    right: "-50px",
                    width: "150px",
                    height: "150px",
                    background:
                      "radial-gradient(circle, #a0c4ac1A 0%, transparent 70%)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                  }}
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "start",
                    width: "100%",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1.1rem",
                      color: "#3d6e50",
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      margin: 0,
                    }}
                  >
                    Asistencia General
                  </p>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      color:
                        attendancePercentage >= 90
                          ? "#00e676"
                          : attendancePercentage >= 70
                          ? "#ffab40"
                          : "#ff5252",
                      background: `rgba(${
                        attendancePercentage >= 90
                          ? "0,230,118"
                          : attendancePercentage >= 70
                          ? "255,171,64"
                          : "255,82,82"
                      }, 0.1)`,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "4px",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {attendancePercentage >= 90
                      ? "Excelente"
                      : attendancePercentage >= 70
                      ? "Buena"
                      : attendancePercentage >= 50
                      ? "Baja"
                      : "Vergüenza"}
                  </span>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                    marginTop: "0.5rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "baseline",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: "4.2rem",
                        color: "#a0c4ac",
                        lineHeight: 1,
                        textShadow: "0 0 20px rgba(160, 196, 172, 0.2)",
                      }}
                    >
                      {Math.floor(attendancePercentage)}%
                    </span>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "0.8rem",
                        color: "#3d6e50",
                        marginLeft: "0.2rem",
                        letterSpacing: "0.05em",
                      }}
                    >
                      DE SESIONES
                    </span>
                  </div>

                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "0.75rem",
                        color: "#a0c4ac",
                      }}
                    >
                      <span>Partidos Jugados</span>
                      <span>
                        {selectedPlayer.sessionsCount} / {totalSessions}
                      </span>
                    </div>

                    {/* Progress track */}
                    <div
                      style={{
                        height: "10px",
                        background: "#12261b",
                        borderRadius: "5px",
                        overflow: "hidden",
                        border: "1px solid rgba(28,56,40,0.5)",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${attendancePercentage}%`,
                          background:
                            "linear-gradient(90deg, rgba(160, 196, 172, 0.5), #a0c4ac)",
                          borderRadius: "5px",
                          boxShadow: "0 0 10px rgba(160, 196, 172, 0.5)",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. Stats por Categoría */}
      {selectedPlayerId && selectedPlayer && selectedPlayer.sessionsCount > 0 && (
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
              label={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <TargetIcon size={14} style={{ color: "#40c4ff" }} />
                  <span>Habilidad Técnica</span>
                </span>
              }
              data={buildSeries(
                selectedPlayerId,
                "avg_tecnica",
                "#40c4ff",
                playerName,
              )}
              sessions={playerSessions}
            />
            <StatLineChart
              label={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <DumbbellIcon size={14} style={{ color: "#ff5252" }} />
                  <span>Esfuerzo Físico</span>
                </span>
              }
              data={buildSeries(
                selectedPlayerId,
                "avg_fisico",
                "#ff5252",
                playerName,
              )}
              sessions={playerSessions}
            />
            <StatLineChart
              label={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <FlameIcon size={14} style={{ color: "#ffab40" }} />
                  <span>Actitud</span>
                </span>
              }
              data={buildSeries(
                selectedPlayerId,
                "avg_actitud",
                "#ffab40",
                playerName,
              )}
              sessions={playerSessions}
            />
            <StatLineChart
              label={
                <span style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
                  <BrainIcon size={14} style={{ color: "#ea80fc" }} />
                  <span>Toma de Decisiones</span>
                </span>
              }
              data={buildSeries(
                selectedPlayerId,
                "avg_vision_juego",
                "#ea80fc",
                playerName,
              )}
              sessions={playerSessions}
            />
          </div>
        </div>
      )}

      {/* 4. Resumen */}
      {selectedPlayer && selectedPlayer.sessionsCount > 0 && (
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
