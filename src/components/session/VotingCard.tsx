"use client";

import { submitRating } from "@/actions/ratings";
import { Profile, Rating } from "@/types";
import { useState } from "react";

interface VotingCardProps {
  receiver: Profile;
  matchId: string;
  existingRating?: Rating;
  onSuccess?: () => void;
}

const METRIC_LABELS: Record<string, string> = {
  tecnica: "Técnica",
  fisico: "Físico",
  actitud: "Actitud",
  vision_juego: "Visión de Juego",
};

const METRIC_ICONS: Record<string, string> = {
  tecnica: "🎯",
  fisico: "💪",
  actitud: "🔥",
  vision_juego: "👁",
};

function getRatingColor(value: number) {
  if (value >= 8) return "#00e676";
  if (value >= 5) return "#ffab40";
  return "#ff5252";
}

export default function VotingCard({
  receiver,
  matchId,
  existingRating,
  onSuccess,
}: VotingCardProps) {
  const [metrics, setMetrics] = useState({
    tecnica: existingRating?.tecnica || 5,
    fisico: existingRating?.fisico || 5,
    actitud: existingRating?.actitud || 5,
    vision_juego: existingRating?.vision_juego || 5,
  });
  const [isMvp, setIsMvp] = useState(existingRating?.is_mvp || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const result = await submitRating({
      match_id: matchId,
      receiver_id: receiver.id,
      tecnica: metrics.tecnica,
      fisico: metrics.fisico,
      actitud: metrics.actitud,
      vision_juego: metrics.vision_juego,
      is_mvp: isMvp,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      onSuccess?.();
    }
    setLoading(false);
  };

  const avgRating =
    (metrics.tecnica +
      metrics.fisico +
      metrics.actitud +
      metrics.vision_juego) /
    4;

  return (
    <div
      className="card-sport animate-slide-up"
      style={{
        padding: "1.25rem",
        borderColor: saved ? "rgba(0,230,118,0.4)" : undefined,
        transition: "border-color 0.3s ease",
      }}
    >
      {/* Player header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "1.1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Avatar */}
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              background: "rgba(0,230,118,0.12)",
              border: "1px solid rgba(0,230,118,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.2rem",
              color: "#00e676",
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            {receiver.avatar_url ? (
              <img
                src={receiver.avatar_url}
                alt={receiver.username}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              (receiver.username?.[0]?.toUpperCase() ?? "?")
            )}
          </div>
          <div>
            <h3
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.2rem",
                letterSpacing: "0.04em",
                color: "#e4f0e8",
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {receiver.username}
            </h3>
            {saved && (
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "0.7rem",
                  color: "#00e676",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                }}
              >
                ✓ Guardado
              </span>
            )}
          </div>
        </div>

        {/* Avg rating pill */}
        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${getRatingColor(avgRating)}40`,
            borderRadius: "8px",
            padding: "0.3rem 0.6rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.4rem",
              color: getRatingColor(avgRating),
              lineHeight: 1,
            }}
          >
            {avgRating.toFixed(1)}
          </div>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "0.6rem",
              color: "#3d6e50",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Prom.
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          marginBottom: "1rem",
        }}
      >
        {(["tecnica", "fisico", "actitud", "vision_juego"] as const).map(
          (metric) => (
            <div key={metric}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.35rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#3d6e50",
                  }}
                >
                  {METRIC_ICONS[metric]} {METRIC_LABELS[metric]}
                </span>
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.1rem",
                    color: getRatingColor(metrics[metric]),
                    letterSpacing: "0.04em",
                    minWidth: "28px",
                    textAlign: "right",
                  }}
                >
                  {metrics[metric]}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={metrics[metric]}
                onChange={(e) =>
                  setMetrics({
                    ...metrics,
                    [metric]: parseInt(e.target.value),
                  })
                }
              />
            </div>
          ),
        )}
      </div>

      {/* MVP toggle */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          cursor: "pointer",
          marginBottom: "1rem",
          padding: "0.6rem 0.75rem",
          borderRadius: "8px",
          background: isMvp ? "rgba(255,201,60,0.1)" : "rgba(0,0,0,0.2)",
          border: `1px solid ${isMvp ? "rgba(255,201,60,0.35)" : "#1c3828"}`,
          transition: "all 0.2s ease",
        }}
      >
        <input
          type="checkbox"
          id={`mvp-${receiver.id}`}
          checked={isMvp}
          onChange={(e) => setIsMvp(e.target.checked)}
          style={{ display: "none" }}
        />
        <span style={{ fontSize: "1.1rem" }}>{isMvp ? "⭐" : "☆"}</span>
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "0.8rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: isMvp ? "#ffc93c" : "#3d6e50",
            transition: "color 0.2s ease",
          }}
        >
          MVP del partido
        </span>
      </label>

      {error && (
        <div
          style={{
            background: "rgba(255,82,82,0.1)",
            border: "1px solid rgba(255,82,82,0.3)",
            borderRadius: "6px",
            padding: "0.5rem 0.75rem",
            color: "#ff5252",
            fontSize: "0.82rem",
            fontFamily: "'Barlow', sans-serif",
            marginBottom: "0.75rem",
          }}
        >
          {error}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="btn-lime"
        style={{ width: "100%" }}
      >
        {loading
          ? "Guardando..."
          : saved
            ? "✓ Actualizar voto"
            : "Guardar voto"}
      </button>
    </div>
  );
}
