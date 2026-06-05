"use client";

import { submitTeamRating, getTeamRating } from "@/actions/ratings";
import { Profile, Rating } from "@/types";
import { useState, useEffect } from "react";
import { CheckIcon } from "@/components/Icons";

interface TeamRatingCardProps {
  matchId: string;
  players: Profile[];
  myVotes: Rating[];
}

function LockIcon({ size = 20, ...props }: { size?: number; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Custom SVGs retrieved via better-icons format to replace emojis
const TrophyIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M4 22h16" />
    <path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34" />
    <path d="M12 2a6 6 0 0 1 6 6v1a6 6 0 0 1-6 6a6 6 0 0 1-6-6V8a6 6 0 0 1 6-6z" />
  </svg>
);

const FlameIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0a5 5 0 0 1 1-3a1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
  </svg>
);

const ZapIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
  </svg>
);

const SwordsIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6m-3 3l4 4m-1 1l2-2M14.5 6.5L18 3h3v3l-3.5 3.5M5 14l4 4m-2-1l-3 3m-1-1l2 2" />
  </svg>
);

const AlertTriangleIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const LocalCheckIcon = ({ color }: { color: string }) => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export default function TeamRatingCard({
  matchId,
  players,
  myVotes,
}: TeamRatingCardProps) {
  const [teamRating, setTeamRating] = useState<number>(7.0);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [voterAverage, setVoterAverage] = useState<number>(0);
  const [maxCap, setMaxCap] = useState<number>(10.0);

  // Calculate completed players
  const completedPlayers = players.filter((p) => {
    const vote = myVotes.find((v) => v.receiver_id === p.id);
    return vote && (vote.tecnica !== null || (!vote.is_mvp && !vote.is_bigpaper && !vote.is_poop));
  });

  const votedCount = completedPlayers.length;
  const totalPlayers = players.length;
  const isUnlocked = votedCount === totalPlayers && totalPlayers > 0;
  
  const remainingPlayers = players.filter(
    (p) => !completedPlayers.some((cp) => cp.id === p.id)
  );

  // Calculate limit bounds and load saved rating
  useEffect(() => {
    async function loadSaved() {
      const savedRating = await getTeamRating(matchId);
      if (savedRating !== null) {
        setTeamRating(savedRating);
        setSaved(true);
      }
    }

    // Calculate voter average based on non-blank votes
    const ratedVotes = myVotes.filter(
      (v) =>
        v.tecnica !== null &&
        v.fisico !== null &&
        v.actitud !== null &&
        v.vision_juego !== null
    );

    if (ratedVotes.length > 0) {
      const sum = ratedVotes.reduce(
        (acc, v) => acc + (v.tecnica! + v.fisico! + v.actitud! + v.vision_juego!),
        0
      );
      const count = ratedVotes.length * 4;
      const avg = sum / count;
      setVoterAverage(avg);

      const cap = Math.min(10.0, avg + 1.5);
      setMaxCap(cap);

      // Clamp team rating to max cap if current value exceeds it
      setTeamRating((prev) => {
        if (prev > cap) {
          setSaved(false);
          return parseFloat(cap.toFixed(1));
        }
        return prev;
      });
    }

    if (isUnlocked) {
      loadSaved();
    }
  }, [matchId, isUnlocked, myVotes]);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    const result = await submitTeamRating({ match_id: matchId, rating: teamRating });

    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
    }
    setLoading(false);
  };

  const scrollToPlayer = (id: string) => {
    const el = document.getElementById(`player-card-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.classList.add("animate-glow-pulse");
      setTimeout(() => el.classList.remove("animate-glow-pulse"), 2500);
    }
  };

  // Get dynamic feedback text based on rating value
  const getRatingFeedback = (value: number) => {
    if (value >= 9.0) {
      return {
        label: "IMPECABLE",
        desc: "Una fiesta total de Cotorra.",
        color: "#00e676",
        icon: <TrophyIcon color="#00e676" />
      };
    }
    if (value >= 8.0) {
      return {
        label: "CLASE MUNDIAL",
        desc: "Un nivel altísimo de todos.",
        color: "#40c4ff",
        icon: <FlameIcon color="#40c4ff" />
      };
    }
    if (value >= 7.0) {
      return {
        label: "VUELAN ALTO",
        desc: "Cotorra manejó la cancha.",
        color: "#ffc93c",
        icon: <ZapIcon color="#ffc93c" />
      };
    }
    if (value >= 6.0) {
      return {
        label: "BIEN",
        desc: "Mostraron ráfagas de buen fútbol.",
        color: "#ffab40",
        icon: <SwordsIcon color="#ffab40" />
      };
    }
    if (value >= 5.0) {
      return {
        label: "ACEPTABLE",
        desc: "Apenas lo justo.",
        color: "#a0c4ac",
        icon: <LocalCheckIcon color="#a0c4ac" />
      };
    }
    if (value >= 4.0) {
      return {
        label: "REGULAR",
        desc: "Rendimiento mediocre y con muchas dudas.",
        color: "#ffa726",
        icon: <AlertTriangleIcon color="#ffa726" />
      };
    }
    if (value >= 3.0) {
      return {
        label: "ZAFANDO",
        desc: "Muy lejos del nivel esperado.",
        color: "#ff7043",
        icon: <AlertTriangleIcon color="#ff7043" />
      };
    }
    if (value >= 2.0) {
      return {
        label: "FLOJO",
        desc: "Se equivocaron en lo más fácil.",
        color: "#ff5252",
        icon: <AlertTriangleIcon color="#ff5252" />
      };
    }
    if (value > 1.0) {
      return {
        label: "AL HORNO",
        desc: "Sin ideas ni actitud.",
        color: "#d32f2f",
        icon: <AlertTriangleIcon color="#d32f2f" />
      };
    }
    return {
      label: "PAPELÓN",
      desc: "Caminaron la cancha.",
      color: "#b71c1c",
      icon: <AlertTriangleIcon color="#b71c1c" />
    };
  };

  const feedback = getRatingFeedback(teamRating);

  // LOCKED STATE (Progress details & remaining players circular avatars)
  if (!isUnlocked) {
    const progressPercent = totalPlayers > 0 ? (votedCount / totalPlayers) * 100 : 0;
    return (
      <div
        className="card-sport stripe-texture animate-slide-up"
        style={{
          padding: "2rem 1.5rem",
          background: "rgba(11, 24, 16, 0.5)",
          border: "1.5px dashed var(--border-subtle)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
          {/* Locked Icon Badge */}
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "rgba(61, 110, 80, 0.1)",
              border: "1.5px solid rgba(61, 110, 80, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--text-muted)",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            <LockIcon size={24} />
          </div>

          <div style={{ textAlign: "center" }}>
            <h4
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.6rem",
                color: "#e4f0e8",
                margin: "0 0 0.25rem",
                letterSpacing: "0.05em",
              }}
            >
              Evaluación de Sesión Bloqueada
            </h4>
            <p
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: "0.88rem",
                color: "var(--text-muted)",
                margin: "0 0 1.25rem",
                maxWidth: "430px",
                lineHeight: "1.4",
              }}
            >
              Para evaluar el rendimiento global de la sesión, primero debés registrar la calificación de todos los jugadores participantes ({votedCount}/{totalPlayers}).
            </p>
          </div>

          {/* Progress Bar */}
          <div style={{ width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "var(--text-muted)",
                letterSpacing: "0.05em",
              }}
            >
              <span>VALORACIONES COMPLETADAS</span>
              <span style={{ color: progressPercent === 100 ? "var(--accent-lime)" : "var(--text-muted)" }}>
                {votedCount} / {totalPlayers} ({Math.floor(progressPercent)}%)
              </span>
            </div>
            <div
              style={{
                height: "6px",
                background: "#060d09",
                borderRadius: "3px",
                overflow: "hidden",
                border: "1px solid rgba(28, 56, 40, 0.4)",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  background: "var(--accent-lime)",
                  borderRadius: "3px",
                  boxShadow: "0 0 8px var(--accent-lime)",
                  transition: "width 0.4s cubic-bezier(0.1, 0.8, 0.2, 1)",
                }}
              />
            </div>
          </div>

          {/* Remaining Players List */}
          {remainingPlayers.length > 0 && (
            <div style={{ marginTop: "1rem", width: "100%", textAlign: "center" }}>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  display: "block",
                  marginBottom: "0.6rem",
                }}
              >
                Hacé click para calificar a los que faltan:
              </span>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem",
                }}
              >
                {remainingPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => scrollToPlayer(player.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      padding: "0.25rem 0.55rem",
                      borderRadius: "20px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid var(--border-subtle)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--accent-lime)";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-subtle)";
                      e.currentTarget.style.transform = "none";
                    }}
                  >
                    {/* Tiny Avatar */}
                    <div
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "rgba(0,230,118,0.1)",
                        border: "1px solid rgba(0,230,118,0.2)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.6rem",
                        fontFamily: "'Bebas Neue', sans-serif",
                        color: "#00e676",
                        overflow: "hidden",
                      }}
                    >
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.username}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        (player.username?.[0]?.toUpperCase() ?? "?")
                      )}
                    </div>
                    <span
                      style={{
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontSize: "0.75rem",
                        color: "#a0c4ac",
                        fontWeight: 600,
                      }}
                    >
                      {player.username}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ACTIVE UNLOCKED STATE (Dynamic feedback panel & circular sports gauge)
  return (
    <div
      className="card-sport animate-slide-up"
      style={{
        padding: "1.75rem",
        borderColor: saved ? "rgba(0, 230, 118, 0.4)" : undefined,
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        position: "relative",
      }}
    >
      {/* Background glow behind gauge that matches rating score color */}
      <div
        style={{
          position: "absolute",
          top: "-60px",
          right: "-60px",
          width: "200px",
          height: "200px",
          background: `radial-gradient(circle, ${feedback.color}15 0%, transparent 70%)`,
          borderRadius: "50%",
          pointerEvents: "none",
          transition: "background 0.35s ease",
        }}
      />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "1.5rem",
        }}
        className="md:grid-cols-[1fr_200px]"
      >
        {/* Left Column: Form & Guide */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "1rem" }}>
          <div>
            <h3
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.6rem",
                letterSpacing: "0.04em",
                color: "#e4f0e8",
                margin: 0,
                lineHeight: "1.1",
              }}
            >
              Rendimiento de la Sesión
            </h3>
            <p
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                margin: "0.15rem 0 1rem",
              }}
            >
              Valoración del desempeño táctico colectivo en la sesión de hoy (1.0 a 10.0).
            </p>

            {/* Limit Info Banner */}
            <div
              style={{
                background: "rgba(0, 230, 118, 0.04)",
                border: "1px solid rgba(0, 230, 118, 0.15)",
                borderRadius: "8px",
                padding: "0.8rem 1rem",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              {/* Info Icon */}
              <div style={{ color: "var(--accent-lime)", display: "flex", alignItems: "center", flexShrink: 0, marginTop: "0.15rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
              </div>
              <p
                style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: "0.82rem",
                  color: "#e4f0e8",
                  margin: 0,
                  lineHeight: "1.45",
                }}
              >
                <strong>Regla de la sesión:</strong> El promedio de calificaciones que diste a tus compañeros es de <strong>{voterAverage.toFixed(1)}</strong>. Por lo tanto, tu voto colectivo tiene un tope máximo permitido de <strong>{maxCap.toFixed(1)}</strong> (+1.5 puntos).
              </p>
            </div>
          </div>

          {/* Rating Slider & Ticks */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.35rem" }}>
              <span
                style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Ajustar Calificación
              </span>
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.25rem",
                  color: feedback.color,
                  letterSpacing: "0.04em",
                  transition: "color 0.35s ease",
                }}
              >
                {teamRating.toFixed(1)}
              </span>
            </div>
            
            <div style={{ position: "relative", paddingBottom: "1.5rem" }}>
              <input
                type="range"
                min="1.0"
                max={maxCap}
                step="0.1"
                value={teamRating}
                onChange={(e) => {
                  setTeamRating(parseFloat(parseFloat(e.target.value).toFixed(1)));
                  setSaved(false);
                }}
                style={{
                  background: `linear-gradient(to right, ${feedback.color}dd 0%, ${feedback.color}aa ${
                    ((teamRating - 1.0) / (maxCap - 1.0)) * 100
                  }%, var(--border-subtle) ${((teamRating - 1.0) / (maxCap - 1.0)) * 100}%, var(--border-subtle) 100%)`,
                  height: "4px",
                  borderRadius: "2px",
                  transition: "background 0.1s ease",
                }}
              />
              
              {/* Slider Ticks */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  color: "var(--text-dim)",
                  marginTop: "0.3rem",
                  position: "absolute",
                  width: "100%",
                }}
              >
                <span>1.0 (PÉSIMO)</span>
                <span>5.0 (REGULAR)</span>
                <span style={{ color: maxCap >= 8.5 ? "var(--text-muted)" : "var(--text-dim)" }}>
                  {maxCap.toFixed(1)} (MÁX)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Radial Sports Gauge Panel */}
        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "10px",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            gap: "0.5rem",
            position: "relative",
            minHeight: "160px",
          }}
        >
          {/* Circular SVG Progress Ring */}
          <div style={{ position: "relative", width: "96px", height: "96px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="96" height="96" viewBox="0 0 96 96" style={{ transform: "rotate(-90deg)" }}>
              {/* Background circle track */}
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="6"
              />
              {/* Dynamic filled circle segment */}
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                stroke={feedback.color}
                strokeWidth="6"
                strokeDasharray="251.3"
                strokeDashoffset={251.3 - (teamRating / 10.0) * 251.3}
                strokeLinecap="round"
                style={{
                  transition: "stroke-dashoffset 0.35s cubic-bezier(0.1, 0.8, 0.2, 1), stroke 0.35s ease",
                }}
              />
            </svg>
            
            {/* Score Center Text */}
            <div
              style={{
                position: "absolute",
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "2.6rem",
                color: feedback.color,
                transition: "color 0.35s ease",
                lineHeight: "1",
                letterSpacing: "-0.02em",
                textShadow: `0 0 10px ${feedback.color}40`,
              }}
            >
              {teamRating.toFixed(1)}
            </div>
          </div>

          <div style={{ marginTop: "0.25rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.4rem",
                color: feedback.color,
                transition: "color 0.35s ease",
              }}
            >
              {feedback.icon}
              <span
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.05rem",
                  letterSpacing: "0.05em",
                  lineHeight: "1.2",
                }}
              >
                {feedback.label}
              </span>
            </div>
            {feedback.desc && (
              <p
                style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: "0.78rem",
                  color: "var(--text-muted)",
                  margin: "0.25rem 0 0",
                  lineHeight: "1.3",
                }}
              >
                {feedback.desc}
              </p>
            )}
          </div>
        </div>
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
            marginTop: "1.25rem",
          }}
        >
          {error}
        </div>
      )}

      {/* Button Row */}
      <div style={{ marginTop: "1.5rem" }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-lime"
          style={{
            width: "100%",
            boxShadow: saved ? "none" : undefined,
            background: saved ? "rgba(0, 230, 118, 0.08)" : undefined,
            border: saved ? "1.5px solid var(--accent-lime)" : undefined,
            color: saved ? "var(--accent-lime)" : undefined,
          }}
        >
          {loading ? (
            "Guardando..."
          ) : saved ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", justifyContent: "center" }}>
              <CheckIcon size={14} strokeWidth={3} />
              Valoración de sesión guardada
            </span>
          ) : (
            "Guardar valoración de sesión"
          )}
        </button>
      </div>
    </div>
  );
}
