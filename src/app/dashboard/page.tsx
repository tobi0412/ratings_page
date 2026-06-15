"use client";

import { getActiveSessions, getSessionParticipants, getSessionVotingProgress } from "@/actions/sessions";
import { getPlayerVotes, getTeamRating } from "@/actions/ratings";
import { getCurrentProfile } from "@/actions/auth";
import SessionStatus from "@/components/session/SessionStatus";
import VotingCard from "@/components/session/VotingCard";
import VotingProgress from "@/components/session/VotingProgress";
import SessionAwardsCard from "@/components/session/SessionAwardsCard";
import MysteryVoteWidget from "@/components/session/MysteryVoteWidget";
import TeamRatingCard from "@/components/session/TeamRatingCard";
import { BanIcon, StadiumIcon } from "@/components/Icons";
import { MatchSession, Profile, Rating } from "@/types";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [session, setSession] = useState<MatchSession | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [myVotes, setMyVotes] = useState<Rating[]>([]);
  const [isParticipant, setIsParticipant] = useState(true);
  const [teamRatingSaved, setTeamRatingSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [votingProgressList, setVotingProgressList] = useState<any[]>([]);
  const [showEditSection, setShowEditSection] = useState(false);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);

  const isCardCompleted = (player: Profile) => {
    const vote = myVotes.find((v) => v.receiver_id === player.id);
    if (!vote) return false;
    if (vote.tecnica !== null) return true; // Normal rated
    if (!vote.is_mvp && !vote.is_bigpaper && !vote.is_poop) return true; // Blank vote
    return false;
  };

  const awardsComplete = true;
  const votedCount = players.filter(isCardCompleted).length;
  const isAllVoted = votedCount === players.length && players.length > 0 && awardsComplete && teamRatingSaved;

  useEffect(() => {
    if (isAllVoted) {
      setHasSubmittedOnce(true);
    }
  }, [isAllVoted]);

  const fetchProgress = async (sessionId: string) => {
    const progressRes = await getSessionVotingProgress(sessionId);
    if (progressRes.success && progressRes.data) {
      setVotingProgressList(progressRes.data);
    }
  };

  useEffect(() => {
    async function load() {
      const profileData = await getCurrentProfile();
      const sessionsData = await getActiveSessions();

      if (!profileData || sessionsData.length === 0) {
        setLoading(false);
        return;
      }

      const activeSession = sessionsData[0];
      setSession(activeSession);

      const participants = await getSessionParticipants(activeSession.id);
      const participating = participants.some((p) => p.id === profileData.id);
      setIsParticipant(participating);

      if (participating) {
        const votesData = await getPlayerVotes(activeSession.id, profileData.id);
        setMyVotes(votesData);

        const savedTeamRating = await getTeamRating(activeSession.id);
        const hasTeamRating = savedTeamRating !== null;
        setTeamRatingSaved(hasTeamRating);

        // Exclude yourself from the voting list
        const filteredPlayers = participants.filter((p) => p.id !== profileData.id);
        setPlayers(filteredPlayers);

        // Compute if all voted on initial load to prevent layout flash
        const awardsDone = true;
        const completedCount = filteredPlayers.filter((player) => {
          const vote = votesData.find((v) => v.receiver_id === player.id);
          if (!vote) return false;
          if (vote.tecnica !== null) return true;
          if (!vote.is_mvp && !vote.is_bigpaper && !vote.is_poop) return true;
          return false;
        }).length;

        const allVotedInitial = completedCount === filteredPlayers.length && filteredPlayers.length > 0 && awardsDone && hasTeamRating;
        if (allVotedInitial) {
          setHasSubmittedOnce(true);
        }

        // Fetch session progress
        await fetchProgress(activeSession.id);
      }
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 60px)",
          gap: "1rem",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "40px",
            border: "2px solid #1c3828",
            borderTop: "2px solid #00e676",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "0.85rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#3d6e50",
          }}
        >
          Cargando...
        </span>
      </div>
    );
  }

  if (!session) {
    return (
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "2.5rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <SessionStatus session={null} />
        <MysteryVoteWidget />
      </div>
    );
  }

  if (!isParticipant) {
    return (
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          padding: "2.5rem 1.25rem",
          display: "flex",
          flexDirection: "column",
          gap: "1.5rem",
        }}
      >
        <div className="animate-slide-up">
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "2.6rem",
              letterSpacing: "0.06em",
              color: "#e4f0e8",
              margin: "0 0 0.25rem",
              lineHeight: 1,
            }}
          >
            Votación
          </h1>
        </div>

        <div className="animate-slide-up stagger-1">
          <SessionStatus session={session} />
        </div>

        <div
          className="card-sport animate-slide-up stagger-2"
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <BanIcon size="3rem" style={{ color: "#ff5252" }} />
          </div>
          <h3
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.6rem",
              color: "#e4f0e8",
              margin: "0 0 0.5rem",
              letterSpacing: "0.05em",
            }}
          >
            No participaste
          </h3>
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.9rem",
              color: "#3d6e50",
              margin: 0,
            }}
          >
            No participaste de la sesión, por lo que no podés votar.
          </p>
        </div>
      </div>
    );
  }



  const renderVotingFlow = () => {
    if (!session) return null;
    return (
      <>
        {/* Awards card */}
        <div
          className="animate-slide-up stagger-2"
          style={{ position: "relative", zIndex: 30 }}
          id="awards-section"
        >
          <SessionAwardsCard
            players={players}
            matchId={session.id}
            initialVotes={myVotes}
            onAwardsChanged={(updatedVotes) => {
              setMyVotes((prev) => {
                const cleaned = prev.map((v) => ({
                  ...v,
                  is_mvp: false,
                  is_bigpaper: false,
                  is_poop: false,
                }));

                const result = [...cleaned];
                updatedVotes.forEach((uv) => {
                  const idx = result.findIndex((v) => v.receiver_id === uv.receiver_id);
                  if (idx > -1) {
                    result[idx] = {
                      ...result[idx],
                      is_mvp: uv.is_mvp,
                      is_bigpaper: uv.is_bigpaper,
                      is_poop: uv.is_poop,
                    };
                  } else {
                    result.push(uv);
                  }
                });

                return result.filter(
                  (v) =>
                    v.tecnica !== null ||
                    v.is_mvp ||
                    v.is_bigpaper ||
                    v.is_poop
                );
              });
              fetchProgress(session.id);
            }}
          />
        </div>

        {/* Players grid */}
        <div id="players-section">
          {players.length > 0 ? (
            <div className="animate-slide-up stagger-3">
              <div className="section-heading">
                <h2
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.5rem",
                    letterSpacing: "0.06em",
                    color: "#e4f0e8",
                    margin: 0,
                  }}
                >
                  Jugadores
                </h2>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: "1rem",
                  alignItems: "start",
                }}
              >
                {players.map((player) => (
                  <VotingCard
                    key={player.id}
                    receiver={player}
                    matchId={session.id}
                    existingRating={myVotes.find((v) => v.receiver_id === player.id)}
                    onSuccess={(newRating, rollback) => {
                      setMyVotes((prev) => {
                        if (rollback) {
                          const original = myVotes.find((v) => v.receiver_id === player.id);
                          if (!original || original.id.startsWith("temp-")) {
                            return prev.filter((v) => v.receiver_id !== player.id);
                          }
                          return prev.map((v) =>
                            v.receiver_id === player.id ? original : v
                          );
                        }
                        const exists = prev.some((v) => v.receiver_id === newRating.receiver_id);
                        if (exists) {
                          return prev.map((v) =>
                            v.receiver_id === newRating.receiver_id
                              ? {
                                  ...newRating,
                                  is_mvp: v.is_mvp,
                                  is_bigpaper: v.is_bigpaper,
                                  is_poop: v.is_poop,
                                }
                              : v
                          );
                        }
                        return [...prev, newRating];
                      });
                      fetchProgress(session.id);
                    }}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div
              className="card-sport animate-slide-up stagger-3"
              style={{ padding: "3rem 2rem", textAlign: "center" }}
            >
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
                <StadiumIcon size="3rem" style={{ color: "#3d6e50" }} />
              </div>
              <h3
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.6rem",
                  color: "#e4f0e8",
                  margin: "0 0 0.5rem",
                  letterSpacing: "0.05em",
                }}
              >
                Sin jugadores aún
              </h3>
              <p
                style={{
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: "0.9rem",
                  color: "#3d6e50",
                  margin: 0,
                }}
              >
                Los jugadores aparecerán aquí cuando estén disponibles en la sesión.
              </p>
            </div>
          )}
        </div>

        {/* Team rating card */}
        <div
          className="animate-slide-up stagger-4"
          style={{ position: "relative", zIndex: 25 }}
          id="team-rating-section"
        >
          <TeamRatingCard
            matchId={session.id}
            players={players}
            myVotes={myVotes}
            initialSaved={teamRatingSaved}
            onTeamRatingSaved={(saved) => {
              setTeamRatingSaved(saved);
              fetchProgress(session.id);
            }}
          />
        </div>
      </>
    );
  };

  return (
    <div
      className="dashboard-mobile-wrapper"
      style={{
        maxWidth: "1280px",
        margin: "0 auto",
        padding: "2rem 1.25rem",
      }}
    >
      <style>{`
        @media (min-width: 1200px) {
          .dashboard-layout {
            grid-template-columns: 1fr 260px !important;
            align-items: start;
            gap: 2rem !important;
          }
          .dashboard-sidebar-col {
            position: sticky;
            top: 76px;
          }
          .dashboard-progress-inline {
            display: none !important;
          }
        }
        @media (max-width: 1199px) {
          .dashboard-sidebar-col {
            display: none !important;
          }
          .dashboard-mobile-wrapper {
            padding-bottom: 7rem !important;
          }
        }
      `}</style>

      {/* Two-column layout: main content + sticky sidebar on desktop */}
      <div
        className="dashboard-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "1.5rem",
        }}
      >
        {/* ── LEFT / MAIN COLUMN ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Page header */}
          <div className="animate-slide-up">
            <h1
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "2.6rem",
                letterSpacing: "0.06em",
                color: "#e4f0e8",
                margin: "0 0 0.25rem",
                lineHeight: 1,
              }}
            >
              Votación
            </h1>
            <p
              style={{
                fontFamily: "'Barlow', sans-serif",
                fontSize: "0.9rem",
                color: "#3d6e50",
                margin: 0,
              }}
            >
              Calificá el rendimiento de los jugadores en esta sesión.
            </p>
          </div>

          <div className="animate-slide-up stagger-1">
            <SessionStatus session={session} />
          </div>

          {/* Progress card – visible only on mobile/tablet; hidden on desktop */}
          <div className="animate-slide-up stagger-2 dashboard-progress-inline">
            <VotingProgress
              players={players}
              myVotes={myVotes}
              awardsComplete={awardsComplete}
              teamRatingSaved={teamRatingSaved}
            />
          </div>

          {/* Overall session progress (visible on top once completed) */}
          {isAllVoted && votingProgressList.length > 0 && (
            <div
              className="card-sport animate-slide-up stagger-1"
              style={{
                padding: "1.5rem",
                borderTop: "3px solid var(--accent-lime)",
              }}
            >
              <h3
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.4rem",
                  letterSpacing: "0.05em",
                  color: "#e4f0e8",
                  marginBottom: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>Progreso de Votos de la Sesión</span>
                <span style={{ fontSize: "1rem", color: "#00e676" }}>
                  {votingProgressList.filter((p) => p.isCompleted).length} de {votingProgressList.length} completados
                </span>
              </h3>
              
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {votingProgressList.map((item) => {
                  let badgeColor = "#555";
                  let badgeBg = "rgba(255,255,255,0.05)";
                  let statusText = "Pendiente";
                  
                  if (item.isCompleted) {
                    badgeColor = "#00e676";
                    badgeBg = "rgba(0,230,118,0.12)";
                    statusText = "Completado";
                  } else if (item.votesSubmitted >= item.maxVotes && item.awardsCompleted && !item.hasTeamRating) {
                    badgeColor = "#ffab40";
                    badgeBg = "rgba(255,171,64,0.12)";
                    statusText = "Falta Voto Equipo";
                  } else if (item.votesSubmitted >= item.maxVotes && !item.awardsCompleted) {
                    badgeColor = "#ff9100";
                    badgeBg = "rgba(255,145,0,0.12)";
                    statusText = "Faltan Premios";
                  } else if (item.hasStarted) {
                    badgeColor = "#ffab40";
                    badgeBg = "rgba(255,171,64,0.12)";
                    statusText = "En Progreso";
                  }

                  return (
                    <div
                      key={item.player.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "rgba(0,0,0,0.2)",
                        padding: "0.6rem 0.8rem",
                        borderRadius: "8px",
                        border: "1px solid rgba(0,0,0,0.3)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div
                          style={{
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.05)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'Bebas Neue', sans-serif",
                            fontSize: "0.85rem",
                            color: "#e4f0e8",
                            overflow: "hidden",
                          }}
                        >
                          {item.player.avatar_url ? (
                            <img
                              src={item.player.avatar_url}
                              alt={item.player.username}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            (item.player.username?.[0]?.toUpperCase() ?? "?")
                          )}
                        </div>
                        <span
                          style={{
                            fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 600,
                            fontSize: "0.9rem",
                            color: "#e4f0e8",
                          }}
                        >
                          {item.player.username}
                        </span>
                      </div>

                      <span
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 700,
                          fontSize: "0.7rem",
                          color: badgeColor,
                          background: badgeBg,
                          border: `1px solid ${badgeColor}33`,
                          padding: "0.15rem 0.4rem",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {statusText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Collapsible Accordion or normal voting cards */}
          {hasSubmittedOnce ? (
            <div className="animate-slide-up" style={{ marginTop: "1rem" }}>
              <button
                onClick={() => setShowEditSection(!showEditSection)}
                className="card-sport"
                style={{
                  width: "100%",
                  padding: "1rem 1.25rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(28, 56, 40, 0.15)",
                  border: "1px solid var(--border-subtle)",
                  cursor: "pointer",
                  textAlign: "left",
                  borderRadius: "8px",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.4rem",
                    letterSpacing: "0.05em",
                    color: "#e4f0e8",
                  }}
                >
                  {showEditSection ? "Ocultar mis calificaciones" : "Ver / Modificar mis calificaciones"}
                </span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    transform: showEditSection ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 250ms ease",
                  }}
                >
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </button>

              {showEditSection && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", marginTop: "1.5rem" }} className="animate-slide-up">
                  {renderVotingFlow()}
                </div>
              )}
            </div>
          ) : (
            renderVotingFlow()
          )}
        </div>

        {/* ── RIGHT COLUMN: sticky progress sidebar (desktop only) ── */}
        <div className="dashboard-sidebar-col">
          <VotingProgress
            players={players}
            myVotes={myVotes}
            awardsComplete={awardsComplete}
            teamRatingSaved={teamRatingSaved}
          />
        </div>
      </div>
    </div>
  );
}
