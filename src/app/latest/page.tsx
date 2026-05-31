"use client";

import {
  getHistoricalStats,
  getAllPlayersStats,
} from "@/actions/stats";
import { getCurrentProfile } from "@/actions/auth";
import PersonalTab from "@/components/history/PersonalTab";
import TeamTab from "@/components/history/TeamTab";
import { HistoricalRating, MatchSession, PlayerStats } from "@/types";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type ActiveTab = "personal" | "team";

export default function LatestSessionPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [ratings, setRatings] = useState<HistoricalRating[]>([]);
  const [stats, setStats] = useState<{ [key: string]: PlayerStats }>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("personal");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [profile, histData, allStats] = await Promise.all([
        getCurrentProfile(),
        getHistoricalStats(),
        getAllPlayersStats(),
      ]);

      if (!profile) {
        router.replace("/auth/login");
        return;
      }

      if (!histData.sessions || histData.sessions.length === 0) {
        router.replace("/dashboard");
        return;
      }

      setSessions(histData.sessions);
      setRatings(histData.ratings);
      setStats(allStats);
      setCurrentUserId(profile.id);
      setLoading(false);
    }

    load();
  }, [router]);

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
          Cargando última sesión...
        </span>
      </div>
    );
  }

  const latestSession = sessions[sessions.length - 1];
  const latestRatings = ratings.filter((r) => r.match_id === latestSession.id);

  // Reconstruct player stats mapped strictly to the latest session rating results
  const latestStatsMap: { [playerId: string]: PlayerStats } = {};
  latestRatings.forEach((rating) => {
    const playerId = rating.player_id;
    const overallStat = stats[playerId];
    if (!overallStat) return;

    latestStatsMap[playerId] = {
      profile: overallStat.profile,
      avgTotal: rating.avg_total ?? 0,
      avgTecnica: rating.avg_tecnica ?? 0,
      avgFisico: rating.avg_fisico ?? 0,
      avgActitud: rating.avg_actitud ?? 0,
      avgVision: rating.avg_vision_juego ?? 0,
      mvpCount: rating.mvp_count ?? 0,
      sessionsCount: 1,
    };
  });

  // Compile latest session MVPs
  const latestTopMVPs = latestRatings
    .filter((r) => r.mvp_count > 0)
    .map((r) => ({
      player_id: r.player_id,
      username: stats[r.player_id]?.profile?.username || "Unknown",
      total_mvps: r.mvp_count,
    }))
    .sort((a, b) => b.total_mvps - a.total_mvps);

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
          Última sesión
        </h1>
        <p
          style={{
            fontFamily: "'Barlow', sans-serif",
            fontSize: "0.9rem",
            color: "#00e676",
            margin: 0,
          }}
        >
          Resultados de la sesión: {latestSession.name}
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
            { key: "team", label: "Comparativas por Equipo", mobileLabel: "Equipos" },
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
            sessions={[latestSession]}
            ratings={latestRatings}
            stats={latestStatsMap}
            currentUserId={currentUserId}
          />
        ) : (
          <TeamTab
            sessions={[latestSession]}
            ratings={latestRatings}
            stats={latestStatsMap}
            topMVPs={latestTopMVPs}
          />
        )}
      </div>
    </div>
  );
}
