"use client";

import { MatchSession } from "@/types";

interface SessionStatusProps {
  session: MatchSession | null;
}

export default function SessionStatus({ session }: SessionStatusProps) {
  if (!session) {
    return (
      <div
        style={{
          background: "rgba(255, 171, 64, 0.08)",
          border: "1px solid rgba(255, 171, 64, 0.3)",
          borderRadius: "10px",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
        }}
      >
        <span style={{ fontSize: "1.25rem" }}>⏳</span>
        <div>
          <p
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "0.8rem",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#ffab40",
              margin: 0,
            }}
          >
            Sin sesión activa
          </p>
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.85rem",
              color: "#3d6e50",
              margin: "0.15rem 0 0",
            }}
          >
            Esperá a que el admin abra una nueva sesión de votación.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card-sport-active animate-glow-pulse"
      style={{ padding: "1.25rem 1.5rem" }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ fontSize: "1.5rem" }}>⚽</span>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                marginBottom: "0.2rem",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.4rem",
                  letterSpacing: "0.05em",
                  color: "#e4f0e8",
                  margin: 0,
                }}
              >
                {session.name}
              </h2>
              <span className="badge-active">En curso</span>
            </div>
            <p
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: "0.8rem",
                color: "#3d6e50",
                margin: 0,
              }}
            >
              Inicio: {new Date(session.created_at).toLocaleString("es-AR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
