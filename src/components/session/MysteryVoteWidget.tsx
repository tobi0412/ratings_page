"use client";

import { useEffect, useState } from "react";
import { getLastClosedSessionStatus, revealMysteryVote } from "@/actions/sessions";
import { StarIcon, SpyIcon } from "@/components/Icons";

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
  tecnica: number;
  fisico: number;
  actitud: number;
  vision_juego: number;
  is_mvp: boolean;
  receiver: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export default function MysteryVoteWidget() {
  const [session, setSession] = useState<SessionStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReveal, setLoadingReveal] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [voter, setVoter] = useState<VoterProfile | null>(null);
  const [votes, setVotes] = useState<RatingVote[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStatus() {
      try {
        const data = await getLastClosedSessionStatus();
        setSession(data);
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
        setIsRevealed(true);
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

  const totalSum = votes.reduce(
    (acc, vote) =>
      acc + vote.tecnica + vote.fisico + vote.actitud + vote.vision_juego,
    0,
  );
  const totalCount = votes.length * 4;
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
      {!isRevealed ? (
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
            {loadingReveal ? "Revelando..." : "Revelar Voto"}
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
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(0, 230, 118, 0.2)",
              paddingBottom: "0.75rem",
            }}
          >
            <div>
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
              >
                Voto Revelado de la sesión {session.name}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h3
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.6rem",
                    color: "#e4f0e8",
                    margin: "0.15rem 0 0",
                    letterSpacing: "0.03em",
                  }}
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
                    marginTop: "0.15rem",
                  }}
                >
                  Promedio de votos totales: {averageGiven}
                </span>
              </div>
            </div>
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
            >
              Ocultar
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.50rem" }}>
            {votes.map((vote) => (
              <div
                key={vote.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(0,0,0,0.2)",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: vote.is_mvp ? "1px solid rgba(255, 171, 64, 0.3)" : "1px solid transparent",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
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
                      style={{
                        background: "rgba(255, 171, 64, 0.15)",
                        border: "1px solid rgba(255, 171, 64, 0.4)",
                        borderRadius: "4px",
                        padding: "0.1rem 0.4rem",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "#ffab40",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <StarIcon size="0.75rem" filled style={{ color: "#ffab40" }} />
                      MVP
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700, whiteSpace: "nowrap" }}>Hab. Téc.</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "30px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vote.tecnica}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700, whiteSpace: "nowrap" }}>Esf. Fís.</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "30px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vote.fisico}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700, whiteSpace: "nowrap" }}>Actitud</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "30px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vote.actitud}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700, whiteSpace: "nowrap" }}>Toma Dec.</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "30px",
                        height: "22px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vote.vision_juego}
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
