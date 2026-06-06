"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FEATURE_FLAGS } from "@/config/features";
import { getActiveSessions, getSessionParticipants } from "@/actions/sessions";
import { getCurrentProfile } from "@/actions/auth";
import { getPlayerBets, placeBet } from "@/modules/economy/services/bets";
import { getWalletBalance } from "@/modules/economy/services/wallet";
import { calculateOdds } from "@/modules/economy/utils/odds";
import { supabaseClient } from "@/lib/supabase";
import { CoinsIcon, HourglassIcon, CheckIcon, XIcon, ShieldAlertIcon } from "@/components/Icons";

export default function BetsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [activeSession, setActiveSession] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  
  // Betting markets
  const [playerMarkets, setPlayerMarkets] = useState<any[]>([]);
  const [teamMarket, setTeamMarket] = useState<any>(null);
  
  // Placed bets
  const [myBets, setMyBets] = useState<any[]>([]);
  
  // Modal/bet slip state
  const [selectedBet, setSelectedBet] = useState<any>(null);
  const [betAmount, setBetAmount] = useState<string>("100");
  const [betting, setBetting] = useState(false);
  const [betError, setBetError] = useState("");
  const [betSuccess, setBetSuccess] = useState(false);

  useEffect(() => {
    if (!FEATURE_FLAGS.IS_CURRENCY_ENABLED) {
      router.push("/dashboard");
      return;
    }

    async function loadBetsData() {
      const currentProfile = await getCurrentProfile();
      if (!currentProfile) {
        setLoading(false);
        return;
      }
      setProfile(currentProfile);

      // Fetch wallet balance
      const walletRes = await getWalletBalance(currentProfile.id);
      setWalletBalance(walletRes.balance);

      // Fetch active session
      const sessions = await getActiveSessions();
      const session = sessions.length > 0 ? sessions[0] : null;
      setActiveSession(session);

      if (session) {
        // Fetch participants for this session
        const participants = await getSessionParticipants(session.id);
        const otherParticipants = participants.filter((p) => p.id !== currentProfile.id);

        // Fetch betting history for the user
        const pastBets = await getPlayerBets(session.id);
        setMyBets(pastBets);

        // Load odds and stats for each participant
        const markets: any[] = [];
        for (const p of otherParticipants) {
          // Get historical ratings
          const { data: ratingsData } = await supabaseClient
            .from("historical_ratings")
            .select("avg_total")
            .eq("player_id", p.id);

          const allRatings = ratingsData ? ratingsData.map((r: any) => Number(r.avg_total)).filter(Boolean) : [];
          
          // Historical average
          const avgHistorical = allRatings.length > 0 
            ? Number((allRatings.reduce((sum, val) => sum + val, 0) / allRatings.length).toFixed(2))
            : 7.0;

          // Recent ratings (last 3)
          const { data: recentData } = await supabaseClient
            .from("historical_ratings")
            .select("avg_total")
            .eq("player_id", p.id)
            .order("computed_at", { ascending: false })
            .limit(3);
          const recentRatings = recentData ? recentData.map((r: any) => Number(r.avg_total)).filter(Boolean) : [];

          // Compute odds
          const odds = calculateOdds(allRatings, avgHistorical, recentRatings);

          // Check if already bet on this player
          const hasBetOnPlayer = pastBets.some((b) => b.target_player_id === p.id);

          markets.push({
            player: p,
            lineValue: avgHistorical,
            odds,
            hasBet: hasBetOnPlayer,
          });
        }
        setPlayerMarkets(markets);

        // Calculate Team Total baseline
        const { data: sessionsTeamData } = await supabaseClient
          .from("match_sessions")
          .select("team_rating")
          .eq("is_active", false)
          .not("team_rating", "is", null);

        const allTeamRatings = sessionsTeamData ? sessionsTeamData.map((s: any) => Number(s.team_rating)).filter(Boolean) : [];
        const avgTeamHist = allTeamRatings.length > 0
          ? Number((allTeamRatings.reduce((sum, val) => sum + val, 0) / allTeamRatings.length).toFixed(2))
          : 6.5;

        const teamOdds = calculateOdds(allTeamRatings, avgTeamHist, allTeamRatings.slice(-3));
        const hasBetOnTeam = pastBets.some((b) => b.bet_type.startsWith("team_"));

        setTeamMarket({
          lineValue: avgTeamHist,
          odds: teamOdds,
          hasBet: hasBetOnTeam,
        });
      }

      setLoading(false);
    }

    loadBetsData();

    // Subscribe to wallet changes to keep balance updated
    if (profile) {
      const channel = supabaseClient
        .channel(`wallet-bets-page-${profile.id}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "economy_wallets",
            filter: `player_id=eq.${profile.id}`,
          },
          (payload: any) => {
            if (payload.new && typeof payload.new.balance === "number") {
              setWalletBalance(payload.new.balance);
            }
          }
        )
        .subscribe();

      return () => {
        supabaseClient.removeChannel(channel);
      };
    }
  }, [router, profile?.id]);

  const handleOpenBetSlip = (market: any, type: "over" | "under", isTeam: boolean = false) => {
    setSelectedBet({
      isTeam,
      name: isTeam ? "Rendimiento Colectivo" : market.player.username,
      targetPlayerId: isTeam ? null : market.player.id,
      betType: isTeam ? `team_total_${type}` : `player_prop_${type}`,
      lineValue: market.lineValue,
      odds: type === "over" ? market.odds.over : market.odds.under,
      typeLabel: type === "over" ? "MÁS DE" : "MENOS DE",
    });
    setBetError("");
    setBetSuccess(false);
  };

  const handlePlaceBet = async () => {
    if (!activeSession || !selectedBet) return;
    
    const amount = parseInt(betAmount);
    if (isNaN(amount) || amount <= 0) {
      setBetError("Ingresá un monto válido.");
      return;
    }

    if (amount > walletBalance) {
      setBetError("Saldo insuficiente en tu billetera.");
      return;
    }

    setBetting(true);
    setBetError("");

    const res = await placeBet(
      activeSession.id,
      selectedBet.betType,
      selectedBet.targetPlayerId,
      selectedBet.lineValue,
      selectedBet.odds,
      amount
    );

    if (res.error) {
      setBetError(res.error);
    } else {
      setBetSuccess(true);
      setWalletBalance((prev) => prev - amount);
      
      // Update local states
      if (selectedBet.isTeam) {
        setTeamMarket((prev: any) => ({ ...prev, hasBet: true }));
      } else {
        setPlayerMarkets((prev) =>
          prev.map((pm) =>
            pm.player.id === selectedBet.targetPlayerId ? { ...pm, hasBet: true } : pm
          )
        );
      }

      // Reload player bets
      const pastBets = await getPlayerBets(activeSession.id);
      setMyBets(pastBets);

      setTimeout(() => {
        setSelectedBet(null);
        setBetSuccess(false);
      }, 1500);
    }
    setBetting(false);
  };

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
          Cargando mercados...
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: "1024px",
        margin: "0 auto",
        padding: "2rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.75rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
        }}
        className="animate-slide-up"
      >
        <div>
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
            Mercado de Apuestas
          </h1>
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.9rem",
              color: "#3d6e50",
              margin: 0,
            }}
          >
            Especulá sobre el rendimiento de tus compañeros de forma segura y ética.
          </p>
        </div>

        {/* User wallet indicator box */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "rgba(255, 215, 0, 0.08)",
            border: "1px solid rgba(255, 215, 0, 0.25)",
            padding: "0.6rem 1rem",
            borderRadius: "8px",
          }}
        >
          <span style={{ fontSize: "1.3rem" }}>🪙</span>
          <div>
            <div
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.3rem",
                color: "#ffd700",
                lineHeight: 1,
              }}
            >
              {walletBalance} CC
            </div>
            <div
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.65rem",
                color: "#ffd700b0",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Tu saldo actual
            </div>
          </div>
        </div>
      </div>

      {!activeSession ? (
        <div
          className="card-sport animate-slide-up stagger-1"
          style={{
            padding: "3rem 2rem",
            textAlign: "center",
          }}
        >
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "1rem" }}>
            <CoinsIcon size="3.5rem" style={{ color: "#3d6e50" }} />
          </div>
          <h3
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.7rem",
              color: "#e4f0e8",
              margin: "0 0 0.5rem",
              letterSpacing: "0.05em",
            }}
          >
            Mercado Cerrado
          </h3>
          <p
            style={{
              fontFamily: "'Barlow', sans-serif",
              fontSize: "0.9rem",
              color: "#3d6e50",
              margin: 0,
            }}
          >
            No hay una sesión activa en este momento. Las apuestas abren automáticamente cuando el administrador inicia una nueva sesión y se cierran al comenzar el partido.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr", lg: "2fr 1fr", gap: "1.5rem" }} className="grid lg:grid-cols-3">
          {/* Markets List */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }} className="lg:col-span-2">
            
            {/* Integrity Warning */}
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                background: "rgba(255, 82, 82, 0.08)",
                border: "1px solid rgba(255, 82, 82, 0.25)",
                padding: "0.85rem 1rem",
                borderRadius: "8px",
              }}
              className="animate-slide-up stagger-1"
            >
              <ShieldAlertIcon size={20} style={{ color: "#ff5252", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <h4 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.05rem", color: "#ff5252", margin: "0 0 0.15rem", letterSpacing: "0.04em" }}>
                  Regla de Integridad Importante
                </h4>
                <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: "#ff5252b0", margin: 0 }}>
                  Apostar en el rendimiento de un compañero bloquea de forma irreversible tu capacidad para calificarlo en esta sesión. Su voto de tu parte se calculará como el promedio de los votos del resto del grupo para evitar amaños.
                </p>
              </div>
            </div>

            {/* Team Market Section */}
            {teamMarket && (
              <div
                className="card-sport-active animate-slide-up stagger-1"
                style={{ padding: "1.25rem" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.35rem", letterSpacing: "0.04em", color: "#e4f0e8", margin: 0 }}>
                    Rendimiento Colectivo (Team Total)
                  </h3>
                  <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.7rem", color: "#00e676", border: "1px solid rgba(0,230,118,0.3)", padding: "0.15rem 0.4rem", borderRadius: "4px", textTransform: "uppercase" }}>
                    Línea base: {teamMarket.lineValue}
                  </span>
                </div>
                
                {teamMarket.hasBet ? (
                  <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.5rem 0" }}>
                    Ya has realizado una apuesta sobre el rendimiento del equipo en esta sesión.
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <button
                      onClick={() => handleOpenBetSlip(teamMarket, "over", true)}
                      className="btn-outline-lime"
                      style={{ padding: "0.75rem 0.5rem" }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                        <span style={{ fontSize: "0.75rem", opacity: 0.75 }}>MÁS DE {teamMarket.lineValue}</span>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem" }}>{teamMarket.odds.over}x</span>
                      </div>
                    </button>
                    <button
                      onClick={() => handleOpenBetSlip(teamMarket, "under", true)}
                      className="btn-outline-lime"
                      style={{ padding: "0.75rem 0.5rem" }}
                    >
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.1rem" }}>
                        <span style={{ fontSize: "0.75rem", opacity: 0.75 }}>MENOS DE {teamMarket.lineValue}</span>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem" }}>{teamMarket.odds.under}x</span>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Players Prop Section */}
            <div className="animate-slide-up stagger-2">
              <div className="section-heading" style={{ marginBottom: "0.75rem" }}>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#e4f0e8", margin: 0, letterSpacing: "0.05em" }}>
                  Rendimiento Individual (Player Props)
                </h2>
              </div>

              {playerMarkets.length === 0 ? (
                <div className="card-sport" style={{ padding: "2rem", textAlign: "center", color: "#3d6e50" }}>
                  No hay otros participantes disponibles en esta sesión.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {playerMarkets.map((market) => (
                    <div
                      key={market.player.id}
                      className="card-sport"
                      style={{
                        padding: "1rem 1.25rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                        gap: "1rem",
                      }}
                    >
                      {/* Player Profile info */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div
                          style={{
                            width: "36px",
                            height: "36px",
                            borderRadius: "50%",
                            background: "rgba(0, 230, 118, 0.12)",
                            border: "1px solid rgba(0, 230, 118, 0.25)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontFamily: "'Bebas Neue', sans-serif",
                            color: "#00e676",
                            overflow: "hidden",
                          }}
                        >
                          {market.player.avatar_url ? (
                            <img
                              src={market.player.avatar_url}
                              alt={market.player.username}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            market.player.username[0].toUpperCase()
                          )}
                        </div>
                        <div>
                          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.15rem", color: "#e4f0e8" }}>
                            {market.player.username}
                          </div>
                          <div style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.75rem", color: "#3d6e50" }}>
                            Línea: {market.lineValue} promedio hist.
                          </div>
                        </div>
                      </div>

                      {/* Odds Over/Under Buttons */}
                      {market.hasBet ? (
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.8rem", color: "#ffd700", background: "rgba(255, 215, 0, 0.08)", padding: "0.3rem 0.75rem", borderRadius: "6px", border: "1px solid rgba(255, 215, 0, 0.2)", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                          🔒 Apostado
                        </div>
                      ) : (
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                          <button
                            onClick={() => handleOpenBetSlip(market, "over")}
                            className="btn-outline-lime"
                            style={{ padding: "0.35rem 0.75rem" }}
                          >
                            <span style={{ fontSize: "0.7rem", display: "block", opacity: 0.8 }}>MÁS ({market.lineValue})</span>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem" }}>{market.odds.over}x</span>
                          </button>
                          <button
                            onClick={() => handleOpenBetSlip(market, "under")}
                            className="btn-outline-lime"
                            style={{ padding: "0.35rem 0.75rem" }}
                          >
                            <span style={{ fontSize: "0.7rem", display: "block", opacity: 0.8 }}>MENOS ({market.lineValue})</span>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "0.95rem" }}>{market.odds.under}x</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Bet Slip (Dynamic overlay/sidebar) & Active Bets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            
            {/* Bet Slip Modal (Inline) */}
            {selectedBet && (
              <div
                className="card-sport animate-slide-up"
                style={{
                  borderColor: "rgba(255, 215, 0, 0.35)",
                  boxShadow: "0 0 16px rgba(255, 215, 0, 0.08)",
                  padding: "1.25rem",
                  position: "relative",
                }}
              >
                <button
                  onClick={() => setSelectedBet(null)}
                  style={{
                    position: "absolute",
                    top: "0.5rem",
                    right: "0.5rem",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: "1rem",
                  }}
                >
                  ✕
                </button>
                <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.25rem", color: "#ffd700", margin: "0 0 0.75rem", letterSpacing: "0.04em" }}>
                  Boleto de Apuesta
                </h3>
                
                {betSuccess ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "1.5rem 0", color: "#00e676" }}>
                    <CheckIcon size={32} />
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, textTransform: "uppercase" }}>¡Apuesta Realizada!</span>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.75rem", color: "var(--text-muted)", textTransform: "uppercase" }}>
                        Selección
                      </div>
                      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", color: "#e4f0e8" }}>
                        {selectedBet.name}
                      </div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.85rem", color: "var(--accent-lime)", fontWeight: 700, letterSpacing: "0.04em" }}>
                        {selectedBet.typeLabel} {selectedBet.lineValue} @ {selectedBet.odds}x
                      </div>
                    </div>

                    <div>
                      <label className="label-sport" htmlFor="bet-amt">Monto a apostar (CC)</label>
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <input
                          id="bet-amt"
                          type="number"
                          value={betAmount}
                          onChange={(e) => setBetAmount(e.target.value)}
                          className="input-sport"
                          style={{ flex: 1 }}
                        />
                        <button
                          onClick={() => setBetAmount(walletBalance.toString())}
                          className="btn-outline-lime"
                          style={{ padding: "0.5rem", fontSize: "0.75rem" }}
                        >
                          MAX
                        </button>
                      </div>
                      
                      {/* Quick buttons */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.25rem", marginTop: "0.35rem" }}>
                        {["50", "100", "250", "500"].map((amt) => (
                          <button
                            key={amt}
                            onClick={() => setBetAmount(amt)}
                            style={{
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--text-muted)",
                              fontSize: "0.7rem",
                              padding: "0.2rem 0",
                              borderRadius: "4px",
                              cursor: "pointer",
                            }}
                          >
                            {amt}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.5rem", marginTop: "0.25rem" }}>
                      <span style={{ color: "var(--text-muted)" }}>Retorno Estimado:</span>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: "#00e676" }}>
                        {isNaN(parseInt(betAmount)) ? "0" : Math.floor(parseInt(betAmount) * selectedBet.odds)} CC
                      </span>
                    </div>

                    {betError && (
                      <div style={{ background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.25)", color: "#ff5252", fontSize: "0.75rem", padding: "0.5rem", borderRadius: "4px" }}>
                        {betError}
                      </div>
                    )}

                    <button
                      onClick={handlePlaceBet}
                      disabled={betting}
                      className="btn-lime"
                      style={{ width: "100%" }}
                    >
                      {betting ? "Procesando..." : "Realizar Apuesta"}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Placed Bets Panel */}
            <div
              className="card-sport animate-slide-up stagger-3"
              style={{ padding: "1.25rem" }}
            >
              <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.35rem", letterSpacing: "0.04em", color: "#e4f0e8", margin: "0 0 0.75rem" }}>
                Tus Apuestas de la Fecha
              </h3>
              
              {myBets.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 1rem", color: "#3d6e50", fontSize: "0.85rem", fontFamily: "'Barlow', sans-serif" }}>
                  Aún no realizaste apuestas en esta fecha.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {myBets.map((bet) => {
                    let statusColor = "#ffd700";
                    let statusLabel = "Pendiente";
                    
                    if (bet.status === "won") {
                      statusColor = "#00e676";
                      statusLabel = "Ganada";
                    } else if (bet.status === "lost") {
                      statusColor = "#ff5252";
                      statusLabel = "Perdida";
                    } else if (bet.status === "refunded") {
                      statusColor = "#7aaa8a";
                      statusLabel = "Empate (Push)";
                    }

                    const isProp = bet.bet_type.startsWith("player_prop");
                    const isOver = bet.bet_type.endsWith("_over");

                    return (
                      <div
                        key={bet.id}
                        style={{
                          background: "rgba(0,0,0,0.25)",
                          border: "1px solid var(--border-subtle)",
                          padding: "0.6rem 0.8rem",
                          borderRadius: "6px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.85rem", fontWeight: 700, color: "#e4f0e8" }}>
                            {isProp ? bet.target_player?.username : "Rendimiento Colectivo"}
                          </div>
                          <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                            {isOver ? "Más de" : "Menos de"} {bet.line_value} @ {bet.odds}x
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.05rem", color: "#e4f0e8" }}>
                            {bet.amount} CC
                          </div>
                          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.6rem", fontWeight: 700, color: statusColor, textTransform: "uppercase", letterSpacing: "0.03em" }}>
                            {statusLabel}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
