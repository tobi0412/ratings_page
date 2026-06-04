"use client";

interface VotingProgressProps {
  totalPlayers: number;
  votedCount: number;
  awardsComplete: boolean;
}

export default function VotingProgress({
  totalPlayers,
  votedCount,
  awardsComplete,
}: VotingProgressProps) {
  const totalSteps = totalPlayers + 1; // players + awards
  const completedSteps = votedCount + (awardsComplete ? 1 : 0);
  const percentage = totalSteps > 0 ? Math.floor((completedSteps / totalSteps) * 100) : 0;

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
            {completedSteps}
          </span>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "0.85rem",
              color: "#3d6e50",
            }}
          >
            / {totalSteps} tareas
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

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.4rem",
          marginTop: "0.85rem",
          fontFamily: "'Barlow Condensed', sans-serif",
          fontSize: "0.82rem",
          color: "#3d6e50",
          letterSpacing: "0.04em",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              color: votedCount === totalPlayers ? "#00e676" : "#ff5252",
              fontWeight: 700,
            }}
          >
            {votedCount === totalPlayers ? "✓" : "○"}
          </span>
          <span style={{ color: votedCount === totalPlayers ? "#e4f0e8" : undefined }}>
            Calificar jugadores ({votedCount} / {totalPlayers})
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              color: awardsComplete ? "#00e676" : "#ff5252",
              fontWeight: 700,
            }}
          >
            {awardsComplete ? "✓" : "○"}
          </span>
          <span style={{ color: awardsComplete ? "#e4f0e8" : undefined }}>
            Elegir los Premios de la Sesión
          </span>
        </div>
      </div>
    </div>
  );
}
