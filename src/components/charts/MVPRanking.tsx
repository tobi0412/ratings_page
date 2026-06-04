"use client";

import { TrophyIcon, PaperIcon, PoopIcon } from "@/components/Icons";

interface AwardEntry {
  player_id: string;
  username: string;
  count: number;
}

interface AwardRankingProps {
  entries: AwardEntry[];
  badgeText: string;
  badgeClass?: string;
  awardType?: "mvp" | "bigpaper" | "poop";
}

export default function AwardRanking({
  entries,
  badgeText,
  badgeClass = "badge-gold",
  awardType = "mvp",
}: AwardRankingProps) {
  if (entries.length === 0) {
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
          Sin ganadores registrados
        </p>
      </div>
    );
  }

  // Pre-calculate ranks based on count, supporting ties
  let currentRank = 1;
  const ranked = entries.map((entry, index) => {
    if (index > 0 && entry.count !== entries[index - 1].count) {
      currentRank = index + 1;
    }
    return {
      ...entry,
      rank: currentRank,
    };
  });

  return (
    <div className="card-sport">
      {ranked.map((entry, index) => (
        <div
          key={entry.player_id}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0.6rem 0.75rem",
            borderBottom:
              index < ranked.length - 1
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
              {entry.rank <= 3 ? (
                (() => {
                  let color = "";
                  if (entry.rank === 1) color = "#ffc93c"; // Gold
                  else if (entry.rank === 2) color = "#a0c4ac"; // Silver
                  else color = "#ff6e40"; // Bronze

                  if (awardType === "bigpaper") {
                    return <PaperIcon size={18} style={{ color }} />;
                  }
                  if (awardType === "poop") {
                    return <PoopIcon size={18} style={{ color }} />;
                  }
                  return <TrophyIcon size={18} style={{ color }} />;
                })()
              ) : (
                `#${entry.rank}`
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

          {/* Right: count badge */}
          <span className={badgeClass}>
            {entry.count} {badgeText}
          </span>
        </div>
      ))}
    </div>
  );
}
