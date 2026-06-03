"use client";

import { submitRating } from "@/actions/ratings";
import { Profile, Rating } from "@/types";
import { useState, useEffect } from "react";
import { TargetIcon, DumbbellIcon, FlameIcon, BrainIcon, StarIcon, CheckIcon } from "@/components/Icons";

interface VotingCardProps {
  receiver: Profile;
  matchId: string;
  existingRating?: Rating;
  onSuccess?: (rating: Rating) => void;
}

const METRIC_LABELS: Record<string, string> = {
  tecnica: "Habilidad Técnica",
  fisico: "Esfuerzo Físico",
  actitud: "Actitud",
  vision_juego: "Toma de Decisiones",
};

const METRIC_ICONS: Record<string, React.ReactNode> = {
  tecnica: <TargetIcon size={14} style={{ color: "#40c4ff" }} />,
  fisico: <DumbbellIcon size={14} style={{ color: "#ff5252" }} />,
  actitud: <FlameIcon size={14} style={{ color: "#ffab40" }} />,
  vision_juego: <BrainIcon size={14} style={{ color: "#ea80fc" }} />,
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
    tecnica: existingRating?.tecnica ?? 5,
    fisico: existingRating?.fisico ?? 5,
    actitud: existingRating?.actitud ?? 5,
    vision_juego: existingRating?.vision_juego ?? 5,
  });
  const [isMvp, setIsMvp] = useState(existingRating?.is_mvp || false);
  const [isBlank, setIsBlank] = useState(existingRating?.tecnica === null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(!!existingRating);

  // Sync all states when the parent rating changes (e.g., loaded asynchronously or updated externally)
  useEffect(() => {
    if (existingRating) {
      setMetrics({
        tecnica: existingRating.tecnica ?? 5,
        fisico: existingRating.fisico ?? 5,
        actitud: existingRating.actitud ?? 5,
        vision_juego: existingRating.vision_juego ?? 5,
      });
      setIsMvp(existingRating.is_mvp);
      setIsBlank(existingRating.tecnica === null);
      setSaved(true);
    } else {
      setSaved(false);
      setIsBlank(false);
    }
  }, [existingRating]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const result = await submitRating({
      match_id: matchId,
      receiver_id: receiver.id,
      tecnica: isBlank ? null : metrics.tecnica,
      fisico: isBlank ? null : metrics.fisico,
      actitud: isBlank ? null : metrics.actitud,
      vision_juego: isBlank ? null : metrics.vision_juego,
      is_mvp: isBlank ? false : isMvp,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      onSuccess?.(result.data);
    }
    setLoading(false);
  };

  const avgRating =
    !isBlank &&
    metrics.tecnica !== null &&
    metrics.fisico !== null &&
    metrics.actitud !== null &&
    metrics.vision_juego !== null
      ? (metrics.tecnica +
          metrics.fisico +
          metrics.actitud +
          metrics.vision_juego) /
        4
      : null;

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
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <CheckIcon size={10} strokeWidth={3} />
                Guardado
              </span>
            )}
          </div>
        </div>

        {/* Avg rating pill */}
        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${avgRating !== null ? getRatingColor(avgRating) : "#3d6e50"}40`,
            borderRadius: "8px",
            padding: "0.3rem 0.6rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.4rem",
              color: avgRating !== null ? getRatingColor(avgRating) : "#3d6e50",
              lineHeight: 1,
            }}
          >
            {avgRating !== null ? avgRating.toFixed(2) : "—"}
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

      {/* Toggle voto en blanco */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          cursor: "pointer",
          marginBottom: "1rem",
          padding: "0.6rem 0.75rem",
          borderRadius: "8px",
          background: isBlank ? "rgba(255,82,82,0.06)" : "rgba(0,0,0,0.15)",
          border: `1px solid ${isBlank ? "rgba(255,82,82,0.25)" : "#1c3828"}`,
          transition: "all 0.2s ease",
        }}
      >
        <input
          type="checkbox"
          checked={isBlank}
          onChange={(e) => {
            const checked = e.target.checked;
            setIsBlank(checked);
            if (checked) {
              setIsMvp(false);
            }
            setSaved(false);
          }}
          style={{
            accentColor: "#ff5252",
            cursor: "pointer",
          }}
        />
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            fontSize: "0.85rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isBlank ? "#ff5252" : "#a0c4ac",
          }}
        >
          No jugué con este jugador
        </span>
      </label>

      {/* Metrics */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          marginBottom: "1rem",
          opacity: isBlank ? 0.35 : 1,
          pointerEvents: isBlank ? "none" : "auto",
          transition: "opacity 0.2s ease",
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
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  {METRIC_ICONS[metric]}
                  <span>{METRIC_LABELS[metric]}</span>
                </span>
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.1rem",
                    color: isBlank ? "#3d6e50" : getRatingColor(metrics[metric]),
                    letterSpacing: "0.04em",
                    minWidth: "28px",
                    textAlign: "right",
                  }}
                >
                  {isBlank ? "—" : metrics[metric]}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={metrics[metric]}
                disabled={isBlank}
                onChange={(e) => {
                  setMetrics({
                    ...metrics,
                    [metric]: parseInt(e.target.value),
                  });
                  setSaved(false);
                }}
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
          cursor: isBlank ? "not-allowed" : "pointer",
          marginBottom: "1rem",
          padding: "0.6rem 0.75rem",
          borderRadius: "8px",
          background: isMvp ? "rgba(255,201,60,0.1)" : "rgba(0,0,0,0.2)",
          border: `1px solid ${isMvp ? "rgba(255,201,60,0.35)" : "#1c3828"}`,
          transition: "all 0.2s ease",
          opacity: isBlank ? 0.35 : 1,
        }}
      >
        <input
          type="checkbox"
          id={`mvp-${receiver.id}`}
          checked={isMvp}
          disabled={isBlank}
          onChange={(e) => {
            if (isBlank) return;
            setIsMvp(e.target.checked);
            setSaved(false);
          }}
          style={{ display: "none" }}
        />
        <StarIcon
          size="1.1rem"
          filled={isMvp}
          style={{
            color: isMvp ? "#ffc93c" : "#3d6e50",
            transition: "all 0.2s ease",
          }}
        />
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
          MVP de la sesión
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
        {loading ? (
          "Guardando..."
        ) : saved ? (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.35rem",
              justifyContent: "center",
            }}
          >
            <CheckIcon size={14} strokeWidth={3} />
            Voto guardado
          </span>
        ) : existingRating ? (
          "Actualizar voto"
        ) : (
          "Guardar voto"
        )}
      </button>
    </div>
  );
}
