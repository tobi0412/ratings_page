"use client";

import { CalendarIcon } from "@/components/Icons";
import { PlayerStats } from "@/types";

interface AttendanceRankingProps {
  stats: { [key: string]: PlayerStats };
  totalSessionsCount: number;
}

export default function AttendanceRanking({
  stats,
  totalSessionsCount,
}: AttendanceRankingProps) {
  const sortedPlayers = Object.values(stats)
    .map((player) => {
      const percentage =
        totalSessionsCount > 0
          ? (player.sessionsCount / totalSessionsCount) * 100
          : 0;
      return {
        ...player,
        percentage,
      };
    })
    .sort(
      (a, b) => b.percentage - a.percentage || b.sessionsCount - a.sessionsCount
    );

  if (sortedPlayers.length === 0) {
    return (
      <div className="card-sport" style={{ padding: "1.25rem" }}>
        <p
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "0.9rem",
            color: "#3d6e50",
            textAlign: "center",
            margin: 0,
          }}
        >
          Sin asistencia registrada
        </p>
      </div>
    );
  }

  // Pre-calculate ranks based on percentage, supporting ties
  let currentRank = 1;
  const rankedPlayers = sortedPlayers.map((player, index) => {
    if (index > 0 && player.percentage !== sortedPlayers[index - 1].percentage) {
      currentRank = index + 1;
    }
    return {
      ...player,
      rank: currentRank,
    };
  });

  return (
    <div className="card-sport">
      {rankedPlayers.map((player, index) => (
        <div
          key={player.profile.id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.6rem 0.75rem",
            borderBottom:
              index < rankedPlayers.length - 1
                ? "1px solid rgba(28,56,40,0.5)"
                : "none",
          }}
        >
          {/* Left: rank + name */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1rem",
                color: player.rank === 1 ? "#00e676" : "#3d6e50",
                minWidth: "28px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              #{player.rank}
            </span>
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.1rem",
                color: "#e4f0e8",
                letterSpacing: "0.05em",
              }}
            >
              {player.profile.username}
            </span>
          </div>

          {/* Right: Attendance percentage badge */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <CalendarIcon size={14} style={{ color: "#a0c4ac" }} />
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontWeight: 600,
                fontSize: "0.9rem",
                color: "#a0c4ac",
              }}
            >
              {Math.floor(player.percentage)}% ({player.sessionsCount}/
              {totalSessionsCount})
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
