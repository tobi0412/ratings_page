"use client";

import { MedalIcon } from "@/components/Icons";

interface MVPEntry {
  player_id: string;
  username: string;
  total_mvps: number;
}

interface MVPRankingProps {
  topMVPs: MVPEntry[];
}

export default function MVPRanking({ topMVPs }: MVPRankingProps) {
  if (topMVPs.length === 0) {
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
          Sin MVPs registrados
        </p>
      </div>
    );
  }

  return (
    <div className="card-sport">
      {topMVPs.map((entry, index) => (
        <div
          key={entry.player_id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.6rem 0.75rem",
            borderBottom:
              index < topMVPs.length - 1
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
                color: "#3d6e50",
                minWidth: "28px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {index === 0 ? (
                <MedalIcon size={18} style={{ color: "#ffc93c" }} />
              ) : index === 1 ? (
                <MedalIcon size={18} style={{ color: "#a0c4ac" }} />
              ) : index === 2 ? (
                <MedalIcon size={18} style={{ color: "#ff6e40" }} />
              ) : (
                `#${index + 1}`
              )}
            </span>
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.1rem",
                color: "#e4f0e8",
                letterSpacing: "0.05em",
              }}
            >
              {entry.username}
            </span>
          </div>

          {/* Right: MVP count badge */}
          <span className="badge-gold">{entry.total_mvps} MVP</span>
        </div>
      ))}
    </div>
  );
}
