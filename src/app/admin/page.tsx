"use client";

import {
  createSession,
  closeSession,
  getAllSessions,
  getActiveSessions,
  getSessionVotingProgress,
} from "@/actions/sessions";
import { getAllPlayers, approvePlayer, rejectPlayer, getApprovedPlayers } from "@/actions/players";
import { MatchSession, Profile } from "@/types";
import { useEffect, useState } from "react";
import { SoccerBallIcon, UsersIcon, HourglassIcon, CheckIcon, XIcon } from "@/components/Icons";

type Tab = "sesiones" | "jugadores";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("sesiones");

  // ── Sesiones state ────────────────────────────────────────────────────────
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [activeSession, setActiveSession] = useState<MatchSession | null>(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>([]);
  const [votingProgress, setVotingProgress] = useState<any[]>([]);

  // ── Jugadores state ───────────────────────────────────────────────────────
  const [players, setPlayers] = useState<Profile[]>([]);
  const [playersLoaded, setPlayersLoaded] = useState(false);
  const [approvedPlayers, setApprovedPlayers] = useState<Profile[]>([]);

  // ── Shared ────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessions();
    loadPlayers();
    loadApprovedPlayers();
  }, []);

  async function loadApprovedPlayers() {
    const data = await getApprovedPlayers();
    setApprovedPlayers(data);
  }

  async function loadSessions() {
    const [all, active] = await Promise.all([
      getAllSessions(),
      getActiveSessions(),
    ]);
    setSessions(all);
    
    const activeSess = active.length > 0 ? active[0] : null;
    setActiveSession(activeSess);

    if (activeSess) {
      const progressResult = await getSessionVotingProgress(activeSess.id);
      if (progressResult.success && progressResult.data) {
        setVotingProgress(progressResult.data);
      }
    } else {
      setVotingProgress([]);
    }
  }

  async function loadPlayers() {
    const data = await getAllPlayers();
    setPlayers(data);
    setPlayersLoaded(true);
  }

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === "jugadores" && !playersLoaded) {
      loadPlayers();
    }
  }

  // ── Session handlers ──────────────────────────────────────────────────────
  async function handleCreateSession() {
    if (!newSessionName.trim()) {
      alert("El nombre de la sesión no puede estar vacío");
      return;
    }
    if (selectedPlayerIds.length === 0) {
      alert("Seleccioná al menos un jugador para la sesión.");
      return;
    }
    setLoading(true);
    const result = await createSession(newSessionName, selectedPlayerIds);
    if (result.error) {
      alert("Error: " + result.error);
    } else {
      setNewSessionName("");
      setSelectedPlayerIds([]);
      await loadSessions();
    }
    setLoading(false);
  }

  async function handleCloseSession() {
    if (!activeSession) return;
    if (!confirm("¿Estás seguro de que querés cerrar esta sesión?")) return;
    setLoading(true);
    const result = await closeSession(activeSession.id);
    if (result.error) {
      alert("Error: " + result.error);
    } else {
      await loadSessions();
    }
    setLoading(false);
  }

  // ── Player handlers ───────────────────────────────────────────────────────
  async function handleApprove(playerId: string) {
    setLoading(true);
    const result = await approvePlayer(playerId);
    if (result.error) {
      alert("Error: " + result.error);
    } else {
      await Promise.all([loadPlayers(), loadApprovedPlayers()]);
    }
    setLoading(false);
  }

  async function handleReject(playerId: string) {
    setLoading(true);
    const result = await rejectPlayer(playerId);
    if (result.error) {
      alert("Error: " + result.error);
    } else {
      await Promise.all([loadPlayers(), loadApprovedPlayers()]);
    }
    setLoading(false);
  }

  const pending = players.filter((p) => p.status === "pending");
  const approved = players.filter((p) => p.status === "approved");
  const rejected = players.filter((p) => p.status === "rejected");

  return (
    <div
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "2rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.75rem",
      }}
    >
      {/* Header */}
      <div className="animate-slide-up">
        <h1
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "2.8rem",
            letterSpacing: "0.06em",
            color: "#e4f0e8",
            margin: "0 0 0.25rem",
            lineHeight: 1,
          }}
        >
          Panel de Admin
        </h1>
        <p
          style={{
            fontFamily: "'Barlow', sans-serif",
            fontSize: "0.9rem",
            color: "#3d6e50",
            margin: 0,
          }}
        >
          Gestioná las sesiones y los jugadores del equipo.
        </p>
      </div>

      {/* Tab bar */}
      <div
        className="animate-slide-up stagger-1"
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "0",
        }}
      >
        {(["sesiones", "jugadores"] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "1rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              padding: "0.6rem 1.5rem",
              border: "none",
              borderBottom:
                activeTab === tab
                  ? "2px solid var(--accent-lime)"
                  : "2px solid transparent",
              background: "transparent",
              color:
                activeTab === tab ? "var(--accent-lime)" : "var(--text-muted)",
              cursor: "pointer",
              transition: "color 0.2s ease, border-color 0.2s ease",
              marginBottom: "-1px",
            }}
          >
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem" }}>
              {tab === "sesiones" ? (
                <SoccerBallIcon size={16} style={{ color: activeTab === tab ? "var(--accent-lime)" : "var(--text-muted)" }} />
              ) : (
                <UsersIcon size={16} style={{ color: activeTab === tab ? "var(--accent-lime)" : "var(--text-muted)" }} />
              )}
              <span>{tab === "sesiones" ? "Sesiones" : "Jugadores"}</span>
            </div>
          </button>
        ))}
      </div>

      {/* ── TAB: SESIONES ────────────────────────────────────────────────── */}
      {activeTab === "sesiones" && (
        <>
          {/* Active session banner */}
          {activeSession && (
            <div
              className="card-sport-active animate-slide-up animate-glow-pulse stagger-1"
              style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: "1rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.85rem",
                  }}
                >
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: "#00e676",
                      boxShadow: "0 0 10px #00e676",
                      display: "inline-block",
                      flexShrink: 0,
                    }}
                  />
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
                        {activeSession.name}
                      </h2>
                      <span className="badge-active">Activa</span>
                    </div>
                    <p
                      style={{
                        fontFamily: "'Barlow', sans-serif",
                        fontSize: "0.8rem",
                        color: "#3d6e50",
                        margin: 0,
                      }}
                    >
                      Inicio:{" "}
                      {new Date(activeSession.created_at).toLocaleString(
                        "es-AR",
                      )}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseSession}
                  disabled={loading}
                  className="btn-danger"
                >
                  {loading ? "Cerrando..." : "Cerrar sesión"}
                </button>
              </div>

              {/* Progress Checklist section */}
              {votingProgress.length > 0 && (
                <div style={{ borderTop: "1px solid rgba(0,230,118,0.15)", paddingTop: "1.25rem" }}>
                  <h3
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1.2rem",
                      letterSpacing: "0.05em",
                      color: "#e4f0e8",
                      marginBottom: "0.75rem",
                    }}
                  >
                    Progreso de Votos ({votingProgress.filter(p => p.isCompleted).length} de {votingProgress.length} completados)
                  </h3>
                  
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                      gap: "0.75rem",
                    }}
                  >
                    {votingProgress.map((item) => {
                      let badgeColor = "#555";
                      let badgeBg = "rgba(255,255,255,0.05)";
                      let statusText = "Pendiente";
                      
                      if (item.isCompleted) {
                        badgeColor = "#00e676";
                        badgeBg = "rgba(0,230,118,0.12)";
                        statusText = "Completado";
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
                            {statusText} ({item.votesSubmitted}/{item.maxVotes})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Create new session */}
          <div
            className="card-sport animate-slide-up stagger-2"
            style={{ padding: "1.5rem" }}
          >
            <div className="section-heading">
              <h2
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.5rem",
                  letterSpacing: "0.05em",
                  color: "#e4f0e8",
                  margin: 0,
                }}
              >
                Nueva Sesión
              </h2>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div>
                <label className="label-sport" htmlFor="session-name">
                  Nombre de la sesión
                </label>
                <input
                  id="session-name"
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="Ej: Fecha 5, Amistoso vs Club X"
                  className="input-sport"
                  onKeyDown={(e) => e.key === "Enter" && handleCreateSession()}
                />
              </div>

              {/* Checkbox grid for selecting participants */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <label className="label-sport">Jugadores Participantes</label>
                  {approvedPlayers.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        const allSelected = approvedPlayers.every(p => selectedPlayerIds.includes(p.id));
                        setSelectedPlayerIds(allSelected ? [] : approvedPlayers.map(p => p.id));
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--accent-lime)",
                        fontSize: "0.75rem",
                        fontFamily: "'Barlow Condensed', sans-serif",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      {approvedPlayers.every(p => selectedPlayerIds.includes(p.id)) ? "Deseleccionar todos" : "Seleccionar todos"}
                    </button>
                  )}
                </div>
                
                {approvedPlayers.length === 0 ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.5rem 0" }}>
                    No hay jugadores aprobados disponibles.
                  </div>
                ) : (
                  <div
                    style={{
                      maxHeight: "160px",
                      overflowY: "auto",
                      border: "1px solid #1c3828",
                      borderRadius: "8px",
                      padding: "0.75rem",
                      background: "rgba(0,0,0,0.25)",
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                      gap: "0.5rem",
                    }}
                  >
                    {approvedPlayers.map((player) => {
                      const isChecked = selectedPlayerIds.includes(player.id);
                      return (
                        <label
                          key={player.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            cursor: "pointer",
                            padding: "0.25rem",
                            borderRadius: "4px",
                            transition: "background 0.2s ease",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setSelectedPlayerIds((prev) =>
                                isChecked
                                  ? prev.filter((id) => id !== player.id)
                                  : [...prev, player.id]
                              );
                            }}
                            style={{
                              accentColor: "var(--accent-lime)",
                              cursor: "pointer",
                            }}
                          />
                          <span
                            style={{
                              fontFamily: "'Barlow', sans-serif",
                              fontSize: "0.85rem",
                              color: isChecked ? "#e4f0e8" : "var(--text-muted)",
                              transition: "color 0.2s ease",
                            }}
                          >
                            {player.username}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>

              <button
                onClick={handleCreateSession}
                disabled={loading}
                className="btn-lime"
                style={{ width: "100%", marginTop: "0.5rem" }}
              >
                {loading ? "Creando..." : "Crear Sesión"}
              </button>
            </div>
          </div>

          {/* Sessions history */}
          <div
            className="card-sport animate-slide-up stagger-3"
            style={{ padding: "1.5rem" }}
          >
            <div className="section-heading">
              <h2
                style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: "1.5rem",
                  letterSpacing: "0.05em",
                  color: "#e4f0e8",
                  margin: 0,
                }}
              >
                Historial de Sesiones
              </h2>
            </div>

            {sessions.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "2.5rem 1rem",
                  color: "#3d6e50",
                  fontFamily: "'Barlow', sans-serif",
                  fontSize: "0.9rem",
                }}
              >
                No hay sesiones aún. ¡Creá la primera!
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {sessions.map((session, index) => (
                  <div
                    key={session.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.85rem 1rem",
                      borderRadius: "8px",
                      background:
                        index % 2 === 0 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.1)",
                      border: session.is_active
                        ? "1px solid rgba(0,230,118,0.2)"
                        : "1px solid transparent",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 600,
                          fontSize: "1rem",
                          color: "#e4f0e8",
                          margin: "0 0 0.2rem",
                          letterSpacing: "0.02em",
                        }}
                      >
                        {session.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Barlow', sans-serif",
                          fontSize: "0.78rem",
                          color: "#3d6e50",
                          margin: 0,
                        }}
                      >
                        {new Date(session.created_at).toLocaleString("es-AR")}
                        {session.closed_at &&
                          ` → ${new Date(session.closed_at).toLocaleString("es-AR")}`}
                      </p>
                    </div>
                    <span
                      className={
                        session.is_active ? "badge-active" : "badge-closed"
                      }
                    >
                      {session.is_active ? "Activa" : "Cerrada"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB: JUGADORES ───────────────────────────────────────────────── */}
      {activeTab === "jugadores" && (
        <div
          className="animate-slide-up"
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {!playersLoaded ? (
            <div
              style={{
                textAlign: "center",
                padding: "3rem 1rem",
                color: "#3d6e50",
                fontFamily: "'Barlow', sans-serif",
                fontSize: "0.9rem",
              }}
            >
              Cargando jugadores...
            </div>
          ) : (
            <>
              {/* Pendientes */}
              <PlayerSection
                title="Pendientes"
                icon={<HourglassIcon size={16} style={{ color: "#ffab40" }} />}
                players={pending}
                emptyMessage="No hay jugadores pendientes"
                loading={loading}
                primaryAction={{
                  label: "Aprobar",
                  loadingLabel: "Aprobando...",
                  className: "btn-lime",
                  onAction: handleApprove,
                }}
                secondaryAction={{
                  label: "Rechazar",
                  loadingLabel: "Rechazando...",
                  className: "btn-danger",
                  onAction: handleReject,
                }}
              />

              {/* Aprobados */}
              <PlayerSection
                title="Aprobados"
                icon={<CheckIcon size={16} style={{ color: "#00e676" }} />}
                players={approved}
                emptyMessage="No hay jugadores aprobados"
                loading={loading}
                primaryAction={{
                  label: "Revocar",
                  loadingLabel: "Revocando...",
                  className: "btn-amber",
                  onAction: handleReject,
                }}
              />

              {/* Rechazados */}
              <PlayerSection
                title="Rechazados"
                icon={<XIcon size={16} style={{ color: "#ff5252" }} />}
                players={rejected}
                emptyMessage="No hay jugadores rechazados"
                loading={loading}
                primaryAction={{
                  label: "Aprobar",
                  loadingLabel: "Aprobando...",
                  className: "btn-outline-lime",
                  onAction: handleApprove,
                }}
              />
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── PlayerSection sub-component ───────────────────────────────────────────────

interface PlayerAction {
  label: string;
  loadingLabel: string;
  className: string;
  onAction: (playerId: string) => Promise<void>;
}

interface PlayerSectionProps {
  title: string;
  icon: React.ReactNode;
  players: Profile[];
  emptyMessage: string;
  loading: boolean;
  primaryAction: PlayerAction;
  secondaryAction?: PlayerAction;
}

function PlayerSection({
  title,
  icon,
  players,
  emptyMessage,
  loading,
  primaryAction,
  secondaryAction,
}: PlayerSectionProps) {
  return (
    <div className="card-sport" style={{ padding: "1.5rem" }}>
      <div className="section-heading">
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.5rem",
            letterSpacing: "0.05em",
            color: "#e4f0e8",
            margin: 0,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          <span style={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>{icon}</span>
          {title}
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "0.85rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              letterSpacing: "0.08em",
              marginLeft: "0.25rem",
            }}
          >
            ({players.length})
          </span>
        </h2>
      </div>

      {players.length === 0 ? (
        <p
          style={{
            fontFamily: "'Barlow', sans-serif",
            fontSize: "0.88rem",
            color: "var(--text-muted)",
            margin: 0,
            padding: "0.5rem 0",
          }}
        >
          {emptyMessage}
        </p>
      ) : (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}
        >
          {players.map((player, index) => (
            <div
              key={player.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem",
                padding: "0.85rem 1rem",
                borderRadius: "8px",
                background:
                  index % 2 === 0 ? "rgba(0,0,0,0.2)" : "rgba(0,0,0,0.1)",
              }}
            >
              <div>
                <p
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "#e4f0e8",
                    margin: "0 0 0.2rem",
                    letterSpacing: "0.02em",
                  }}
                >
                  {player.username}
                </p>
                <p
                  style={{
                    fontFamily: "'Barlow', sans-serif",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  Registrado:{" "}
                  {new Date(player.created_at).toLocaleDateString("es-AR")}
                </p>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexShrink: 0 }}>
                {secondaryAction && (
                  <button
                    onClick={() => secondaryAction.onAction(player.id)}
                    disabled={loading}
                    className={secondaryAction.className}
                  >
                    {loading
                      ? secondaryAction.loadingLabel
                      : secondaryAction.label}
                  </button>
                )}
                <button
                  onClick={() => primaryAction.onAction(player.id)}
                  disabled={loading}
                  className={primaryAction.className}
                >
                  {loading ? primaryAction.loadingLabel : primaryAction.label}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
