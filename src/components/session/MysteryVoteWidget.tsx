"use client";

import { useEffect, useState } from "react";
import { getLastClosedSessionStatus, revealMysteryVote, getSessionParticipants } from "@/actions/sessions";
import { getCurrentProfile } from "@/actions/auth";
import { StarIcon, SpyIcon, PaperIcon, PoopIcon, CotorraLogoIcon } from "@/components/Icons";
import MysteryReveal from "./MysteryReveal";
import PlayerAvatar from "@/components/profile/PlayerAvatar";

interface SessionStatusData {
  id: string;
  name: string;
  closed_at: string;
  hasMysteryPlayer: boolean;
}

interface VoterProfile {
  id: string;
  username: string;
  avatar_url: string | null;
}

interface RatingVote {
  id: string;
  receiver_id: string;
  tecnica: number | null;
  fisico: number | null;
  actitud: number | null;
  vision_juego: number | null;
  is_mvp: boolean;
  is_bigpaper?: boolean;
  is_poop?: boolean;
  receiver: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

function getTeamRatingFeedback(value: number) {
  if (value >= 9.0) {
    return { label: "IMPECABLE", desc: "Una fiesta total de Cotorra.", color: "#00e676" };
  }
  if (value >= 8.0) {
    return { label: "CLASE MUNDIAL", desc: "Un nivel altísimo de todos.", color: "#40c4ff" };
  }
  if (value >= 7.0) {
    return { label: "VUELAN ALTO", desc: "Cotorra manejó la cancha.", color: "#ffc93c" };
  }
  if (value >= 6.0) {
    return { label: "BIEN", desc: "Mostraron ráfagas de buen fútbol.", color: "#ffab40" };
  }
  if (value >= 5.0) {
    return { label: "ACEPTABLE", desc: "Apenas lo justo.", color: "#a0c4ac" };
  }
  if (value >= 4.0) {
    return { label: "REGULAR", desc: "Rendimiento mediocre y con muchas dudas.", color: "#ffa726" };
  }
  if (value >= 3.0) {
    return { label: "ZAFANDO", desc: "Muy lejos del nivel esperado.", color: "#ff7043" };
  }
  if (value >= 2.0) {
    return { label: "FLOJO", desc: "Se equivocaron en lo más fácil.", color: "#ff5252" };
  }
  if (value > 1.0) {
    return { label: "AL HORNO", desc: "Sin ideas ni actitud.", color: "#d32f2f" };
  }
  return { label: "PAPELÓN", desc: "Caminaron la cancha.", color: "#b71c1c" };
}

export default function MysteryVoteWidget() {
  const [session, setSession] = useState<SessionStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReveal, setLoadingReveal] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [voter, setVoter] = useState<VoterProfile | null>(null);
  const [votes, setVotes] = useState<RatingVote[]>([]);
  const [teamRating, setTeamRating] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<VoterProfile[]>([]);
  const [isAnimatingReveal, setIsAnimatingReveal] = useState(false);
  const [currentUser, setCurrentUser] = useState<VoterProfile | null>(null);
  const [hasSeenAnimation, setHasSeenAnimation] = useState(false);

  useEffect(() => {
    async function loadStatus() {
      try {
        const [data, profile] = await Promise.all([
          getLastClosedSessionStatus(),
          getCurrentProfile()
        ]);
        setSession(data);
        setCurrentUser(profile as any);
        if (data) {
          // Fetch participants for the shuffle animation list
          const parts = await getSessionParticipants(data.id);
          setParticipants(parts as any[]);

          // Check if already revealed in localStorage for this user to customize button
          const key = `mystery_reveal_status_${profile?.id || "guest"}_${data.id}`;
          const isAlreadyRevealed = localStorage.getItem(key) === "revealed";
          setHasSeenAnimation(isAlreadyRevealed);
        }
      } catch (err) {
        console.error("Error loading closed session status:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, []);

  async function handleReveal() {
    if (!session) return;
    setLoadingReveal(true);
    setError(null);
    try {
      const result = await revealMysteryVote(session.id);
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("voter" in result && result.voter) {
        setVoter(result.voter);
        setVotes(result.votes as any[]);
        setTeamRating((result as any).teamRating ?? null);
        
        const key = `mystery_reveal_status_${currentUser?.id || "guest"}_${session.id}`;
        const isAlreadyRevealed = localStorage.getItem(key) === "revealed";

        if (!isAlreadyRevealed) {
          setIsAnimatingReveal(true);
        } else {
          setIsRevealed(true);
        }
      }
    } catch (err) {
      setError("No se pudo revelar el voto misterioso. Intenta de nuevo.");
      console.error(err);
    } finally {
      setLoadingReveal(false);
    }
  }

  if (loading) {
    return (
      <div
        style={{
          padding: "1.5rem",
          background: "rgba(0, 0, 0, 0.2)",
          border: "1px dashed #1c3828",
          borderRadius: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: "0.85rem", color: "#3d6e50" }}>Buscando votos misteriosos...</span>
      </div>
    );
  }

  if (!session || !session.hasMysteryPlayer) {
    return null;
  }

  let totalSum = 0;
  let totalCount = 0;

  votes.forEach((vote) => {
    if (vote.tecnica !== null) { totalSum += vote.tecnica; totalCount++; }
    if (vote.fisico !== null) { totalSum += vote.fisico; totalCount++; }
    if (vote.actitud !== null) { totalSum += vote.actitud; totalCount++; }
    if (vote.vision_juego !== null) { totalSum += vote.vision_juego; totalCount++; }
  });

  const averageGiven = totalCount > 0 ? (totalSum / totalCount).toFixed(2) : "0.00";

  return (
    <div
      className="card-sport animate-slide-up"
      style={{
        padding: "1.5rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        border: "1px solid rgba(0, 230, 118, 0.15)",
        background: "linear-gradient(135deg, rgba(28, 56, 40, 0.4) 0%, rgba(10, 20, 15, 0.4) 100%)",
      }}
    >
      {isAnimatingReveal && voter ? (
        <MysteryReveal
          winnerName={voter.username}
          allPlayers={participants.map((p) => p.username)}
          sessionId={session.id}
          currentUserId={currentUser?.id}
          onComplete={() => {
            setIsRevealed(true);
            setIsAnimatingReveal(false);
            setHasSeenAnimation(true);
          }}
        />
      ) : !isRevealed ? (
        <div style={{ textAlign: "center", padding: "1rem 0" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.5rem" }}>
            <SpyIcon size="2.5rem" style={{ color: "var(--accent-lime)" }} />
          </div>
          <h3
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.8rem",
              color: "#e4f0e8",
              margin: "0.5rem 0 0.25rem",
              letterSpacing: "0.05em",
            }}
          >
            Voto Misterioso
          </h3>
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.85rem",
              color: "#3d6e50",
              margin: "0 0 1.25rem",
            }}
          >
            Un jugador al azar de la sesión anterior (<strong>{session.name}</strong>) fue seleccionado. Revelá qué votó y a quién le puso MVP.
          </p>
          
          {error && (
            <p style={{ color: "#ff5252", fontSize: "0.8rem", margin: "0 0 1rem" }}>{error}</p>
          )}

          <button
            onClick={handleReveal}
            disabled={loadingReveal}
            className="btn-lime"
            style={{
              margin: "0 auto",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              cursor: "pointer",
            }}
          >
            {loadingReveal ? (
              hasSeenAnimation ? "Cargando..." : "Revelando..."
            ) : hasSeenAnimation ? (
              "Ver Votos"
            ) : (
              "Revelar Voto"
            )}
          </button>
        </div>
      ) : (
        <div
          style={{
            animation: "fadeIn 0.4s ease-out forwards",
            display: "flex",
            flexDirection: "column",
            gap: "1.25rem",
          }}
        >
          <style>{`
            @keyframes fadeIn {
              from { opacity: 0; transform: translateY(10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          
          <div
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(0,230,118,0.2)] pb-3"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between sm:justify-start gap-2">
                <p
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "var(--accent-lime)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    margin: 0,
                  }}
                  className="truncate"
                >
                  Voto Revelado: {session.name}
                </p>
                <div className="sm:hidden flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setIsRevealed(false);
                      setIsAnimatingReveal(true);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--accent-lime)",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                    className="hover:text-white transition-colors"
                  >
                    Animar
                  </button>
                  <span style={{ color: "#1c3828" }}>|</span>
                  <button
                    onClick={() => setIsRevealed(false)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#3d6e50",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 700,
                      textTransform: "uppercase",
                    }}
                    className="hover:text-red-400 transition-colors"
                  >
                    Ocultar
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {voter && (
                  <PlayerAvatar
                    playerId={voter.id}
                    avatarUrl={voter.avatar_url}
                    username={voter.username}
                    size={28}
                  />
                )}
                <h3
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.6rem",
                    color: "#e4f0e8",
                    margin: 0,
                    letterSpacing: "0.03em",
                  }}
                  className="leading-none"
                >
                  @{voter?.username}
                </h3>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    color: "var(--accent-lime)",
                    background: "rgba(0, 230, 118, 0.1)",
                    border: "1px solid rgba(0, 230, 118, 0.2)",
                    padding: "0.15rem 0.5rem",
                    borderRadius: "4px",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                  className="whitespace-nowrap"
                >
                  Prom. votos: {averageGiven}
                </span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => {
                  setIsRevealed(false);
                  setIsAnimatingReveal(true);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent-lime)",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
                className="hover:text-white transition-colors"
              >
                Ver Animación
              </button>
              <span style={{ color: "#1c3828" }}>|</span>
              <button
                onClick={() => setIsRevealed(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#3d6e50",
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
                className="hover:text-red-400 transition-colors"
              >
                Ocultar
              </button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.50rem" }}>
            {teamRating !== null && (
              <div
                style={{
                  background: "linear-gradient(90deg, rgba(0, 230, 118, 0.08) 0%, rgba(0, 0, 0, 0.2) 100%)",
                  borderRadius: "8px",
                  border: `1px solid ${getTeamRatingFeedback(teamRating).color}33`,
                }}
                className="flex items-center justify-between p-3 sm:px-4 sm:py-3 gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "rgba(0, 230, 118, 0.15)",
                      border: "1px solid rgba(0, 230, 118, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CotorraLogoIcon size="18px" />
                  </div>
                  <div className="flex flex-col">
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#e4f0e8", lineHeight: 1.2 }}>
                      Rendimiento del Equipo
                    </span>
                    <span style={{ fontSize: "0.7rem", color: getTeamRatingFeedback(teamRating).color, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", lineHeight: 1.2 }}>
                      {getTeamRatingFeedback(teamRating).label}
                    </span>
                    <span style={{ fontSize: "0.68rem", color: "#a0c4ac", fontFamily: "'Barlow', sans-serif", marginTop: "0.1rem", lineHeight: 1.1 }}>
                      {getTeamRatingFeedback(teamRating).desc}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#3d6e50] font-semibold hidden sm:inline-block uppercase tracking-wider">Valoración:</span>
                  <div
                    style={{
                      background: "#1c3828",
                      borderRadius: "6px",
                      padding: "0.2rem 0.6rem",
                      minWidth: "40px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: getTeamRatingFeedback(teamRating).color,
                      border: `1px solid ${getTeamRatingFeedback(teamRating).color}44`,
                      fontFamily: "'Bebas Neue', sans-serif",
                    }}
                  >
                    {teamRating.toFixed(1)}
                  </div>
                </div>
              </div>
            )}
            {votes.map((vote) => (
              <div
                key={vote.id}
                style={{
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: "8px",
                  border: vote.is_mvp
                    ? "1px solid rgba(255, 171, 64, 0.3)"
                    : vote.is_bigpaper
                    ? "1px solid rgba(255, 171, 64, 0.2)"
                    : vote.is_poop
                    ? "1px solid rgba(141, 110, 99, 0.3)"
                    : "1px solid transparent",
                }}
                className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:px-4 sm:py-3 gap-3"
              >
                <div className="flex items-center gap-2">
                  {vote.receiver && (
                    <PlayerAvatar
                      playerId={vote.receiver.id}
                      avatarUrl={vote.receiver.avatar_url}
                      username={vote.receiver.username}
                      size={24}
                    />
                  )}
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.95rem",
                      color: "#e4f0e8",
                    }}
                  >
                    {vote.receiver?.username || "Jugador"}
                  </span>
                  {vote.is_mvp && (
                    <span
                      title="MVP"
                      style={{
                        background: "rgba(255, 171, 64, 0.15)",
                        border: "1px solid rgba(255, 171, 64, 0.4)",
                        borderRadius: "50%",
                        width: "22px",
                        height: "22px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 8px rgba(255, 171, 64, 0.2)",
                        transition: "all 0.2s ease",
                      }}
                      className="hover:scale-110"
                    >
                      <StarIcon size="0.75rem" filled style={{ color: "#ffab40" }} />
                    </span>
                  )}
                  {vote.is_bigpaper && (
                    <span
                      title="Papelón"
                      style={{
                        background: "rgba(255, 171, 64, 0.12)",
                        border: "1px solid rgba(255, 171, 64, 0.3)",
                        borderRadius: "50%",
                        width: "22px",
                        height: "22px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 8px rgba(255, 171, 64, 0.15)",
                        transition: "all 0.2s ease",
                      }}
                      className="hover:scale-110"
                    >
                      <PaperIcon size="0.75rem" style={{ color: "#ffa726" }} />
                    </span>
                  )}
                  {vote.is_poop && (
                    <span
                      title="Jugador Caca"
                      style={{
                        background: "rgba(141, 110, 99, 0.12)",
                        border: "1px solid rgba(141, 110, 99, 0.3)",
                        borderRadius: "50%",
                        width: "22px",
                        height: "22px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 0 8px rgba(141, 110, 99, 0.15)",
                        transition: "all 0.2s ease",
                      }}
                      className="hover:scale-110"
                    >
                      <PoopIcon size="0.75rem" style={{ color: "#8d6e63" }} />
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 sm:flex gap-2 sm:gap-2 justify-between">
                  <div className="flex flex-col items-center bg-[rgba(28,56,40,0.15)] sm:bg-transparent p-1.5 sm:p-0 rounded border border-[rgba(28,56,40,0.2)] sm:border-0">
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center block sm:hidden">TÉC</span>
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center hidden sm:block whitespace-nowrap">Hab. Téc.</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "32px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vote.tecnica !== null ? vote.tecnica : "—"}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center bg-[rgba(28,56,40,0.15)] sm:bg-transparent p-1.5 sm:p-0 rounded border border-[rgba(28,56,40,0.2)] sm:border-0">
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center block sm:hidden">FÍS</span>
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center hidden sm:block whitespace-nowrap">Esf. Fís.</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "32px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vote.fisico !== null ? vote.fisico : "—"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center bg-[rgba(28,56,40,0.15)] sm:bg-transparent p-1.5 sm:p-0 rounded border border-[rgba(28,56,40,0.2)] sm:border-0">
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center block sm:hidden">ACT</span>
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center hidden sm:block whitespace-nowrap">Actitud</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "32px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vote.actitud !== null ? vote.actitud : "—"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center bg-[rgba(28,56,40,0.15)] sm:bg-transparent p-1.5 sm:p-0 rounded border border-[rgba(28,56,40,0.2)] sm:border-0">
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center block sm:hidden">DEC</span>
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center hidden sm:block whitespace-nowrap">Toma Dec.</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "32px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vote.vision_juego !== null ? vote.vision_juego : "—"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
