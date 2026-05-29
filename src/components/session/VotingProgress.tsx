"use client";

interface VotingProgressProps {
  totalPlayers: number;
  votedCount: number;
}

export default function VotingProgress({
  totalPlayers,
  votedCount,
}: VotingProgressProps) {
  const percentage =
    totalPlayers > 0 ? Math.floor((votedCount / totalPlayers) * 100) : 0;

  return (
    <div className="card-sport" style={{ padding: "1.25rem 1.5rem" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.75rem",
        }}
      >
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "0.8rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#3d6e50",
          }}
        >
          Progreso de Votación
        </span>
        <div
          style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}
        >
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.6rem",
              color: "#00e676",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            {votedCount}
          </span>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "0.85rem",
              color: "#3d6e50",
            }}
          >
            / {totalPlayers} votos
          </span>
        </div>
      </div>

      {/* Track */}
      <div
        style={{
          width: "100%",
          height: "6px",
          background: "#1c3828",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${percentage}%`,
            background: "linear-gradient(90deg, #00e676, #1ded87)",
            borderRadius: "3px",
            transition: "width 0.5s ease",
            boxShadow: "0 0 10px rgba(0,230,118,0.5)",
          }}
        />
      </div>

      <p
        style={{
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "0.75rem",
          color: "#3d6e50",
          margin: "0.5rem 0 0",
          letterSpacing: "0.06em",
        }}
      >
        {percentage}% completado
      </p>
    </div>
  );
}
