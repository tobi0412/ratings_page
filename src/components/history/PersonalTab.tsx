"use client";

import { useState } from "react";
import Link from "next/link";
import { MatchSession, HistoricalRating, PlayerStats } from "@/types";
import StatLineChart from "@/components/charts/StatLineChart";
import { SessionComparisonsMap } from "@/lib/stats-comparison";
import { TargetIcon, DumbbellIcon, FlameIcon, BrainIcon, CalendarIcon, TrophyIcon, PaperIcon, PoopIcon } from "@/components/Icons";
import HorizontalFootballField from "@/components/profile/HorizontalFootballField";

interface PersonalTabProps {
  sessions: MatchSession[];
  ratings: HistoricalRating[];
  stats: { [playerId: string]: PlayerStats };
  currentUserId: string | null;
  comparisons?: SessionComparisonsMap;
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
  comparisons,
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
        // Only show Attendance if there are multiple sessions
        ...(totalSessions > 1
          ? [
              {
                label: "Asistencia",
                value: `${Math.floor(attendancePercentage)}%`,
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
        {
          label: "Papelones",
          value: String(selectedPlayer.bigpaperCount),
          color: "#ffab40",
          change: null,
        },
        {
          label: "Jugador Caca",
          value: String(selectedPlayer.poopCount),
          color: "#8d6e63",
          change: null,
        },
      ]
    : [];

  const renderPlayerSelector = () => (
    <div
      style={{
        overflowX: "auto",
        display: "flex",
        gap: "0.5rem",
        marginLeft: "-1.25rem",
        marginRight: "-1.25rem",
        paddingLeft: "1.25rem",
        paddingRight: "1.25rem",
        paddingBottom: "0.5rem",
        WebkitOverflowScrolling: "touch",
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

      {/* Profile Info Card */}
      {selectedPlayer?.profile && (
        <div
          className="card-sport animate-slide-up grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-5 items-center p-5 mt-1"
        >
          {/* Left Side: Avatar & Bio */}
          <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap w-full">
            {/* Avatar */}
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "var(--accent-lime-soft)",
                border: "1.5px solid rgba(0,230,118,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {selectedPlayer.profile.avatar_url ? (
                <img
                  src={selectedPlayer.profile.avatar_url}
                  alt={selectedPlayer.profile.username}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2rem", color: "var(--accent-lime)" }}>
                  {selectedPlayer.profile.username?.[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>

            {/* Username & Bio */}
            <div className="flex flex-col gap-1.5 w-full">
              <h3
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.8rem",
                  margin: 0,
                  color: "#e4f0e8",
                  letterSpacing: "0.05em",
                  lineHeight: "1",
                }}
              >
                {selectedPlayer.profile.username}
              </h3>
              <p
                style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  margin: 0,
                  lineHeight: "1.35",
                }}
              >
                {selectedPlayer.profile.bio || <span style={{ fontStyle: "italic", opacity: 0.6 }}>Sin biografía</span>}
              </p>
            </div>
          </div>

          {/* Middle: Horizontal Football Field Preview */}
          <div className="flex justify-center md:justify-self-center w-full md:w-auto">
            <HorizontalFootballField selectedPositions={selectedPlayer.profile.favorite_positions || []} />
          </div>

          {/* Right Side: Link Button */}
          <div className="flex justify-center md:justify-end w-full md:w-auto">
            <Link
              href={`/profile/${selectedPlayer.profile.id}`}
              className="btn-outline-lime w-full sm:w-auto text-center"
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.85rem",
                fontWeight: 700,
                padding: "0.4rem 1.25rem",
                borderRadius: "6px",
                letterSpacing: "0.05em",
                textDecoration: "none",
                display: "inline-block",
                lineHeight: "normal"
              }}
            >
              Ver Perfil Completo
            </Link>
          </div>
        </div>
      )}

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
            <TrophyIcon size={18} style={{ color: "#ffc93c" }} />
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
              ¡{selectedPlayer.profile.username} fue el MVP de esta sesión!
            </span>
          </div>
        </div>
      )}

      {/* Papelón Banner */}
      {sessions.length === 1 && selectedPlayer && selectedPlayer.bigpaperCount > 0 && (
        <div
          className="animate-slide-up"
          style={{
            background: "linear-gradient(135deg, rgba(255, 171, 64, 0.15) 0%, rgba(255, 110, 64, 0.05) 100%)",
            border: "1px solid #ffab40",
            borderRadius: "8px",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            boxShadow: "0 4px 20px rgba(255, 171, 64, 0.05)",
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
              background: "rgba(255, 171, 64, 0.2)",
              border: "1px solid #ffab40",
              color: "#ffab40",
              flexShrink: 0,
            }}
          >
            <PaperIcon size={18} style={{ color: "#ffab40" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.2rem",
                color: "#ffab40",
                letterSpacing: "0.05em",
                lineHeight: 1.1,
              }}
            >
              Papelón de la sesión
            </span>
            <span
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: "0.82rem",
                color: "#a0c4ac",
                marginTop: "0.1rem",
              }}
            >
              ¡{selectedPlayer.profile.username} fue el Papelón de esta sesión!
            </span>
          </div>
        </div>
      )}

      {/* Jugador Caca Banner */}
      {sessions.length === 1 && selectedPlayer && selectedPlayer.poopCount > 0 && (
        <div
          className="animate-slide-up"
          style={{
            background: "linear-gradient(135deg, rgba(141, 110, 99, 0.15) 0%, rgba(255, 110, 64, 0.05) 100%)",
            border: "1px solid #8d6e63",
            borderRadius: "8px",
            padding: "1rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            boxShadow: "0 4px 20px rgba(141, 110, 99, 0.05)",
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
              background: "rgba(141, 110, 99, 0.2)",
              border: "1px solid #8d6e63",
              color: "#8d6e63",
              flexShrink: 0,
            }}
          >
            <PoopIcon size={18} style={{ color: "#8d6e63" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.2rem",
                color: "#8d6e63",
                letterSpacing: "0.05em",
                lineHeight: 1.1,
              }}
            >
              Jugador Caca de la sesión
            </span>
            <span
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: "0.82rem",
                color: "#a0c4ac",
                marginTop: "0.1rem",
              }}
            >
              ¡{selectedPlayer.profile.username} se llevó el Jugador Caca de esta sesión!
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
                  change={playerComparison?.avgTotalChange}
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
              data={buildSeries(
                selectedPlayerId,
                "avg_tecnica",
                "#40c4ff",
                playerName,
              )}
              sessions={playerSessions}
              change={playerComparison?.avgTecnicaChange}
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
              change={playerComparison?.avgFisicoChange}
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
              change={playerComparison?.avgActitudChange}
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
              change={playerComparison?.avgVisionChange}
            />
          </div>
        </div>
      )}

      {/* 4. Resumen */}
      {selectedPlayer && selectedPlayer.sessionsCount > 0 && (
        <div>
          {sectionHeading("Resumen")}
          <div className="card-sport" style={{ padding: "0.75rem" }}>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-flow-col lg:auto-cols-fr gap-3">
              {statCards.map((card) => (
                <div
                  key={card.label}
                  style={{
                    padding: "1rem 0.5rem",
                    textAlign: "center",
                    background: "rgba(0, 0, 0, 0.2)",
                    border: "1px solid rgba(28, 56, 40, 0.4)",
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    minHeight: "75px"
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "0.68rem",
                      color: "#3d6e50",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: "0.3rem",
                      lineHeight: 1.1
                    }}
                  >
                    {card.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1.75rem",
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
