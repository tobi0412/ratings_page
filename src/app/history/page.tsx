"use client";

import {
  getHistoricalStats,
  getAllPlayersStats,
  getTopMVPs,
} from "@/actions/stats";
import RatingEvolutionChart from "@/components/charts/RatingEvolutionChart";
import ComparisonTable from "@/components/charts/ComparisonTable";
import { MatchSession, Profile } from "@/types";
import { useEffect, useState } from "react";

interface PlayerStats {
  profile: Profile;
  avgTotal: number;
  avgTecnica: number;
  avgFisico: number;
  avgActitud: number;
  avgVision: number;
  mvpCount: number;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [stats, setStats] = useState<{ [key: string]: PlayerStats }>({});
  const [topMVPs, setTopMVPs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [histData, playerStats, mvpData] = await Promise.all([
        getHistoricalStats(),
        getAllPlayersStats(),
        getTopMVPs(),
      ]);

      setSessions(histData.sessions);
      setStats(playerStats);
      setTopMVPs(mvpData);
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
          Cargando estadísticas...
        </span>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div
        style={{
          maxWidth: "1024px",
          margin: "0 auto",
          padding: "3rem 1.25rem",
        }}
      >
        <div style={{ marginBottom: "2rem" }} className="animate-slide-up">
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "3rem",
              letterSpacing: "0.06em",
              color: "#e4f0e8",
              margin: "0 0 0.25rem",
              lineHeight: 1,
            }}
          >
            Histórico
          </h1>
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.9rem",
              color: "#3d6e50",
              margin: 0,
            }}
          >
            Análisis de rendimiento a través del tiempo.
          </p>
        </div>

        <div
          className="card-sport animate-slide-up stagger-1"
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
          <h3
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.6rem",
              color: "#e4f0e8",
              margin: "0 0 0.5rem",
              letterSpacing: "0.05em",
            }}
          >
            Sin datos aún
          </h3>
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.9rem",
              color: "#3d6e50",
              margin: 0,
            }}
          >
            Completá sesiones de votación para ver las estadísticas históricas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1200px",
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
            fontSize: "3rem",
            letterSpacing: "0.06em",
            color: "#e4f0e8",
            margin: "0 0 0.25rem",
            lineHeight: 1,
          }}
        >
          Histórico
        </h1>
        <p
          style={{
            fontFamily: "'Barlow', sans-serif",
            fontSize: "0.9rem",
            color: "#3d6e50",
            margin: 0,
          }}
        >
          Análisis de rendimiento del equipo a través de las sesiones de
          votación.
        </p>
      </div>

      {/* MVP Podium */}
      {topMVPs.length > 0 && (
        <div className="animate-slide-up stagger-1">
          <div className="section-heading">
            <h2
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.6rem",
                letterSpacing: "0.05em",
                color: "#e4f0e8",
                margin: 0,
              }}
            >
              Top MVPs
            </h2>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {topMVPs.map((mvp, index) => {
              const medals = ["🥇", "🥈", "🥉"];
              const isTop3 = index < 3;
              return (
                <div
                  key={mvp.player_id}
                  className={index === 0 ? "card-sport-gold" : "card-sport"}
                  style={{ padding: "1.25rem", textAlign: "center" }}
                >
                  <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
                    {isTop3 ? medals[index] : `#${index + 1}`}
                  </div>
                  <p
                    style={{
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "1.2rem",
                      letterSpacing: "0.05em",
                      color: index === 0 ? "#ffc93c" : "#e4f0e8",
                      margin: "0 0 0.25rem",
                    }}
                  >
                    {mvp.profiles.username}
                  </p>
                  <span className={index === 0 ? "badge-gold" : "badge-closed"}>
                    {mvp.mvp_count} MVPs
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="animate-slide-up stagger-2">
        <div className="section-heading">
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.6rem",
              letterSpacing: "0.05em",
              color: "#e4f0e8",
              margin: 0,
            }}
          >
            Evolución de Ratings
          </h2>
        </div>
        <RatingEvolutionChart
          sessions={sessions}
          ratings={[]}
          players={Object.values(stats).map((s) => s.profile)}
        />
      </div>

      {/* Table */}
      <div className="animate-slide-up stagger-3">
        <div className="section-heading">
          <h2
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.6rem",
              letterSpacing: "0.05em",
              color: "#e4f0e8",
              margin: 0,
            }}
          >
            Comparativa del Equipo
          </h2>
        </div>
        <ComparisonTable stats={stats} />
      </div>
    </div>
  );
}
