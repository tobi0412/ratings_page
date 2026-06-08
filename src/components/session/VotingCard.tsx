"use client";

import { submitRating } from "@/actions/ratings";
import { Profile, Rating } from "@/types";
import { useState, useEffect, useRef } from "react";
import { TargetIcon, DumbbellIcon, FlameIcon, BrainIcon, CheckIcon } from "@/components/Icons";

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
  const hasSavedRating = !!existingRating && (
    existingRating.tecnica !== null ||
    (!existingRating.is_mvp && !existingRating.is_bigpaper && !existingRating.is_poop)
  );

  const isBlankVote = !!existingRating &&
    existingRating.tecnica === null &&
    !existingRating.is_mvp &&
    !existingRating.is_bigpaper &&
    !existingRating.is_poop;

  const [metrics, setMetrics] = useState({
    tecnica: existingRating?.tecnica ?? 5,
    fisico: existingRating?.fisico ?? 5,
    actitud: existingRating?.actitud ?? 5,
    vision_juego: existingRating?.vision_juego ?? 5,
  });
  const [isBlank, setIsBlank] = useState(isBlankVote);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(hasSavedRating);

  // Keep track of the last rating values we synced to avoid overwriting unsaved changes
  const prevExistingRatingRef = useRef(existingRating);

  // Sync all states when the parent rating changes (e.g., loaded asynchronously or updated externally)
  useEffect(() => {
    // Helper to check if the database rating values actually changed
    const areRatingsEqual = (r1: Rating | undefined, r2: Rating | undefined) => {
      const t1 = r1?.tecnica ?? null;
      const f1 = r1?.fisico ?? null;
      const a1 = r1?.actitud ?? null;
      const v1 = r1?.vision_juego ?? null;

      const t2 = r2?.tecnica ?? null;
      const f2 = r2?.fisico ?? null;
      const a2 = r2?.actitud ?? null;
      const v2 = r2?.vision_juego ?? null;

      return t1 === t2 && f1 === f2 && a1 === a2 && v1 === v2;
    };

    const ratingValuesChanged = !areRatingsEqual(prevExistingRatingRef.current, existingRating);
    prevExistingRatingRef.current = existingRating;

    // Only update metrics and flags if the database rating values themselves actually changed
    if (ratingValuesChanged) {
      if (existingRating) {
        const hasSaved = existingRating.tecnica !== null || (
          !existingRating.is_mvp && !existingRating.is_bigpaper && !existingRating.is_poop
        );
        const isBlankV = existingRating.tecnica === null && (
          !existingRating.is_mvp && !existingRating.is_bigpaper && !existingRating.is_poop
        );

        setMetrics({
          tecnica: existingRating.tecnica ?? 5,
          fisico: existingRating.fisico ?? 5,
          actitud: existingRating.actitud ?? 5,
          vision_juego: existingRating.vision_juego ?? 5,
        });
        setIsBlank(isBlankV);
        setSaved(hasSaved);
      } else {
        setMetrics({
          tecnica: 5,
          fisico: 5,
          actitud: 5,
          vision_juego: 5,
        });
        setIsBlank(false);
        setSaved(false);
      }
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
      id={`player-card-${receiver.id}`}
      className="card-sport animate-slide-up"
      style={{
        padding: "1.25rem",
        borderColor: saved
          ? isBlank
            ? "rgba(61, 110, 80, 0.4)" // Muted border for saved blank vote
            : "rgba(0, 230, 118, 0.4)" // Lime border for normal saved rating
          : undefined,
        boxShadow: saved
          ? isBlank
            ? "0 0 24px rgba(255, 82, 82, 0.05)"
            : "0 0 24px rgba(0, 230, 118, 0.12)"
          : undefined,
        transition: "border-color 250ms cubic-bezier(0.23, 1, 0.32, 1), box-shadow 250ms cubic-bezier(0.23, 1, 0.32, 1)",
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

      {/* Toggle voto en blanco (Custom Switch) */}
      <div
        onClick={() => {
          const nextVal = !isBlank;
          setIsBlank(nextVal);
          setSaved(false);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          marginBottom: "1rem",
          padding: "0.65rem 0.85rem",
          borderRadius: "8px",
          background: isBlank ? "var(--accent-red-soft)" : "rgba(0, 0, 0, 0.25)",
          border: `1px solid ${isBlank ? "rgba(255, 82, 82, 0.35)" : "var(--border-subtle)"}`,
          transition: "background 250ms cubic-bezier(0.23, 1, 0.32, 1), border-color 250ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "0.82rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isBlank ? "var(--accent-red)" : "var(--text-muted)",
            transition: "color 250ms cubic-bezier(0.23, 1, 0.32, 1)",
          }}
        >
          No coincidí en cancha
        </span>
        <div
          style={{
            width: "36px",
            height: "20px",
            borderRadius: "10px",
            background: isBlank ? "var(--accent-red)" : "var(--bg-field)",
            border: `1px solid ${isBlank ? "var(--accent-red)" : "var(--border-subtle)"}`,
            position: "relative",
            transition: "background 250ms cubic-bezier(0.23, 1, 0.32, 1), border-color 250ms cubic-bezier(0.23, 1, 0.32, 1)",
            padding: "1px",
          }}
        >
          <div
            style={{
              width: "16px",
              height: "16px",
              borderRadius: "50%",
              background: isBlank ? "#060d09" : "var(--text-muted)",
              position: "absolute",
              left: "1px",
              transform: isBlank ? "translateX(16px)" : "translateX(0)",
              transition: "transform 250ms cubic-bezier(0.23, 1, 0.32, 1), background-color 250ms cubic-bezier(0.23, 1, 0.32, 1)",
            }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          marginBottom: "1rem",
          padding: isBlank ? "0.75rem" : "0",
          borderRadius: "8px",
          background: isBlank
            ? "repeating-linear-gradient(-45deg, rgba(255, 82, 82, 0.015), rgba(255, 82, 82, 0.015) 12px, transparent 12px, transparent 24px)"
            : undefined,
          opacity: isBlank ? 0.35 : 1,
          pointerEvents: isBlank ? "none" : "auto",
          transition: "opacity 200ms cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        {(["tecnica", "fisico", "actitud", "vision_juego"] as const).map(
          (metric) => {
            const metricValue = metrics[metric];
            const ratingColor = getRatingColor(metricValue);

            const glowSoft = ratingColor === "#00e676" 
              ? "rgba(0, 230, 118, 0.15)" 
              : ratingColor === "#ffab40" 
                ? "rgba(255, 171, 64, 0.15)" 
                : "rgba(255, 82, 82, 0.15)";
            const glowMedium = ratingColor === "#00e676" 
              ? "rgba(0, 230, 118, 0.55)" 
              : ratingColor === "#ffab40" 
                ? "rgba(255, 171, 64, 0.55)" 
                : "rgba(255, 82, 82, 0.55)";
            const glowHoverSoft = ratingColor === "#00e676" 
              ? "rgba(0, 230, 118, 0.18)" 
              : ratingColor === "#ffab40" 
                ? "rgba(255, 171, 64, 0.18)" 
                : "rgba(255, 82, 82, 0.18)";
            const glowHoverMedium = ratingColor === "#00e676" 
              ? "rgba(0, 230, 118, 0.75)" 
              : ratingColor === "#ffab40" 
                ? "rgba(255, 171, 64, 0.75)" 
                : "rgba(255, 82, 82, 0.75)";
            const glowActiveSoft = ratingColor === "#00e676" 
              ? "rgba(0, 230, 118, 0.2)" 
              : ratingColor === "#ffab40" 
                ? "rgba(255, 171, 64, 0.2)" 
                : "rgba(255, 82, 82, 0.2)";
            const glowActiveMedium = ratingColor === "#00e676" 
              ? "rgba(0, 230, 118, 0.6)" 
              : ratingColor === "#ffab40" 
                ? "rgba(255, 171, 64, 0.6)" 
                : "rgba(255, 82, 82, 0.6)";

            return (
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
                      color: "var(--text-muted)",
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
                      color: isBlank ? "var(--text-muted)" : ratingColor,
                      letterSpacing: "0.04em",
                      minWidth: "28px",
                      textAlign: "right",
                      transition: "color 150ms ease-out",
                    }}
                  >
                    {isBlank ? "—" : metricValue}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={metricValue}
                  disabled={isBlank}
                  onChange={(e) => {
                    setMetrics({
                      ...metrics,
                      [metric]: parseInt(e.target.value),
                    });
                    setSaved(false);
                  }}
                  style={{
                    ["--range-fill" as any]: `${((metricValue - 1) / 9) * 100}%`,
                    ["--range-fill-color" as any]: ratingColor,
                    ["--range-fill-glow-soft" as any]: glowSoft,
                    ["--range-fill-glow-medium" as any]: glowMedium,
                    ["--range-fill-glow-hover-soft" as any]: glowHoverSoft,
                    ["--range-fill-glow-hover-medium" as any]: glowHoverMedium,
                    ["--range-fill-glow-active-soft" as any]: glowActiveSoft,
                    ["--range-fill-glow-active-medium" as any]: glowActiveMedium,
                  }}
                />
              </div>
            );
          }
        )}
      </div>



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
        ) : hasSavedRating ? (
          "Actualizar voto"
        ) : (
          "Guardar voto"
        )}
      </button>
    </div>
  );
}
