"use client";

import { getActiveSessions } from "@/actions/sessions";
import { getPlayerVotes } from "@/actions/ratings";
import { getCurrentProfile } from "@/actions/auth";
import SessionStatus from "@/components/session/SessionStatus";
import VotingCard from "@/components/session/VotingCard";
import VotingProgress from "@/components/session/VotingProgress";
import { MatchSession, Profile, Rating } from "@/types";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [session, setSession] = useState<MatchSession | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [myVotes, setMyVotes] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

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

      const votesData = await getPlayerVotes(activeSession.id, profileData.id);
      setMyVotes(votesData);

      setPlayers([]);
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
        }}
      >
        <SessionStatus session={null} />
      </div>
    );
  }

  const votedCount = myVotes.length;
  const totalPlayers = players.length;

  return (
    <div
      style={{
        maxWidth: "1024px",
        margin: "0 auto",
        padding: "2rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
      }}
    >
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
          Evaluá el rendimiento de tus compañeros en este partido.
        </p>
      </div>

      <div className="animate-slide-up stagger-1">
        <SessionStatus session={session} />
      </div>

      <div className="animate-slide-up stagger-2">
        <VotingProgress totalPlayers={totalPlayers} votedCount={votedCount} />
      </div>

      {/* Players grid */}
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
            }}
          >
            {players.map((player) => (
              <VotingCard
                key={player.id}
                receiver={player}
                matchId={session.id}
                existingRating={myVotes.find(
                  (v) => v.receiver_id === player.id,
                )}
                onSuccess={() => {}}
              />
            ))}
          </div>
        </div>
      ) : (
        <div
          className="card-sport animate-slide-up stagger-3"
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🏟</div>
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
  );
}
