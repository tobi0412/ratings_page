"use client";

import {
  getHistoricalStats,
  getAllPlayersStats,
  getTopMVPs,
} from "@/actions/stats";
import { getCurrentProfile } from "@/actions/auth";
import PersonalTab from "@/components/history/PersonalTab";
import TeamTab from "@/components/history/TeamTab";
import { ChartBarIcon } from "@/components/Icons";
import { HistoricalRating, MatchSession } from "@/types";
import { useEffect, useState } from "react";

type ActiveTab = "personal" | "team";

export default function HistoryPage() {
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [ratings, setRatings] = useState<HistoricalRating[]>([]);
  const [stats, setStats] = useState<{ [key: string]: any }>({});
  const [topMVPs, setTopMVPs] = useState<
    { player_id: string; username: string; total_mvps: number }[]
  >([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("personal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [histData, playerStats, mvpData, profile] = await Promise.all([
        getHistoricalStats(),
        getAllPlayersStats(),
        getTopMVPs(),
        getCurrentProfile(),
      ]);

      setSessions(histData.sessions);
      setRatings(histData.ratings);
      setStats(playerStats);
      setTopMVPs(mvpData);
      setCurrentUserId(profile?.id ?? null);
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
          style={{ padding: "3rem 2rem", textAlign: "center" }}
        >
          <ChartBarIcon size="3rem" style={{ color: "#3d6e50", marginBottom: "1rem" }} />
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

      {/* Tab toggle */}
      <div
        className="animate-slide-up stagger-1"
        style={{
          display: "flex",
          gap: "0.5rem",
          borderBottom: "1px solid #1c3828",
          paddingBottom: "0",
        }}
      >
        {(
          [
            { key: "personal", label: "Estadísticas Personales", mobileLabel: "Personales" },
            { key: "team", label: "Comparativas por Equipo", mobileLabel: "Equipo" },
          ] as { key: ActiveTab; label: string; mobileLabel: string }[]
        ).map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="text-[0.95rem] sm:text-[1.1rem] px-3 sm:px-5 py-2.5"
              style={{
                background: "transparent",
                border: "none",
                borderBottom: isActive
                  ? "2px solid #00e676"
                  : "2px solid transparent",
                cursor: "pointer",
                fontFamily: "'Bebas Neue', sans-serif",
                letterSpacing: "0.07em",
                color: isActive ? "#00e676" : "#3d6e50",
                transition: "all 0.15s ease",
                marginBottom: "-1px",
              }}
            >
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="inline sm:hidden">{tab.mobileLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="animate-slide-up stagger-2">
        {activeTab === "personal" ? (
          <PersonalTab
            sessions={sessions}
            ratings={ratings}
            stats={stats}
            currentUserId={currentUserId}
          />
        ) : (
          <TeamTab
            sessions={sessions}
            ratings={ratings}
            stats={stats}
            topMVPs={topMVPs}
          />
        )}
      </div>
    </div>
  );
}
