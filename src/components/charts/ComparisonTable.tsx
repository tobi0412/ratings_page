"use client";

import { PlayerStats } from "@/types";
import { TargetIcon, DumbbellIcon, FlameIcon, BrainIcon, StarIcon, MedalIcon, CalendarIcon } from "@/components/Icons";

interface ComparisonTableProps {
  stats: { [key: string]: PlayerStats };
  totalSessionsCount: number;
}

function ratingColor(val: number): string {
  if (val >= 8) return "#00e676";
  if (val >= 6) return "#ffab40";
  return "#ff5252";
}

const HEADERS = [
  { label: "Jugador", icon: null, align: "left" },
  { label: "Rating", icon: null, align: "center" },
  { label: "Hab. Técnica", icon: <TargetIcon size={14} style={{ color: "#40c4ff" }} />, align: "center" },
  { label: "Esf. Físico", icon: <DumbbellIcon size={14} style={{ color: "#ff5252" }} />, align: "center" },
  { label: "Actitud", icon: <FlameIcon size={14} style={{ color: "#ffab40" }} />, align: "center" },
  { label: "Toma de Decisiones", icon: <BrainIcon size={14} style={{ color: "#ea80fc" }} />, align: "center" },
  { label: "Asistencia", icon: <CalendarIcon size={14} style={{ color: "#a0c4ac" }} />, align: "center" },
  { label: "MVPs", icon: <StarIcon size={14} filled style={{ color: "#ffc93c" }} />, align: "center" },
];

export default function ComparisonTable({ stats, totalSessionsCount }: ComparisonTableProps) {
  const sortedPlayers = Object.values(stats).sort(
    (a, b) => b.avgTotal - a.avgTotal,
  );

  return (
    <div className="card-sport" style={{ overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "0.88rem",
        }}
      >
        <thead>
          <tr
            style={{
              borderBottom: "1px solid #1c3828",
            }}
          >
            {HEADERS.map((h) => (
              <th
                key={h.label}
                style={{
                  padding: "0.85rem 0.75rem",
                  textAlign: h.align as "left" | "center",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "#3d6e50",
                  whiteSpace: "nowrap",
                }}
              >
                <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", justifyContent: h.align === "center" ? "center" : "flex-start" }}>
                  {h.icon}
                  <span>{h.label}</span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => (
            <tr
              key={player.profile.id}
              style={{
                borderBottom: "1px solid rgba(28,56,40,0.5)",
                background:
                  index === 0
                    ? "rgba(255,201,60,0.04)"
                    : index % 2 === 0
                      ? "rgba(0,0,0,0.15)"
                      : "transparent",
                transition: "background 0.15s ease",
              }}
            >
              {/* Rank + Name */}
              <td style={{ padding: "0.85rem 0.75rem" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1rem",
                      color:
                        index === 0
                          ? "#ffc93c"
                          : index === 1
                            ? "#a0c4ac"
                            : "#3d6e50",
                      minWidth: "20px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {index === 0 ? (
                      <MedalIcon size={16} style={{ color: "#ffc93c" }} />
                    ) : index === 1 ? (
                      <MedalIcon size={16} style={{ color: "#a0c4ac" }} />
                    ) : index === 2 ? (
                      <MedalIcon size={16} style={{ color: "#ff6e40" }} />
                    ) : (
                      `#${index + 1}`
                    )}
                  </span>
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      background: "rgba(0,230,118,0.1)",
                      border: "1px solid rgba(0,230,118,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "0.85rem",
                      color: "#00e676",
                      flexShrink: 0,
                    }}
                  >
                    {player.profile.username?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "#e4f0e8",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {player.profile.username}
                  </span>
                </div>
              </td>

              {/* Overall rating - highlighted */}
              <td style={{ padding: "0.85rem 0.75rem", textAlign: "center" }}>
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.25rem",
                    color: ratingColor(player.avgTotal),
                    letterSpacing: "0.04em",
                  }}
                >
                  {player.avgTotal.toFixed(2)}
                </span>
              </td>

              {/* Metrics */}
              {[
                player.avgTecnica,
                player.avgFisico,
                player.avgActitud,
                player.avgVision,
              ].map((val, i) => (
                <td
                  key={i}
                  style={{ padding: "0.85rem 0.75rem", textAlign: "center" }}
                >
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.92rem",
                      color: ratingColor(val),
                    }}
                  >
                    {val.toFixed(2)}
                  </span>
                </td>
              ))}

              {/* Asistencia */}
              <td style={{ padding: "0.85rem 0.75rem", textAlign: "center" }}>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    color: "#a0c4ac",
                  }}
                >
                  {(() => {
                    const attendancePercentage = totalSessionsCount > 0
                      ? (player.sessionsCount / totalSessionsCount) * 100
                      : 0;
                    return `${Math.floor(attendancePercentage)}% (${player.sessionsCount}/${totalSessionsCount})`;
                  })()}
                </span>
              </td>

              {/* MVP count */}
              <td style={{ padding: "0.85rem 0.75rem", textAlign: "center" }}>
                {player.mvpCount > 0 ? (
                  <span className="badge-gold">{player.mvpCount}</span>
                ) : (
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: "0.85rem",
                      color: "#3d6e50",
                    }}
                  >
                    —
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
