"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FEATURE_FLAGS } from "@/config/features";
import { getActiveSessions, getSessionParticipants } from "@/actions/sessions";
import { getCurrentProfile } from "@/actions/auth";
import {
  CotorraCoinIcon,
  ShieldAnonIcon,
  InfiltrationIcon,
  FlameNeonIcon,
  StarsShimmerIcon,
  AxeBrokenIcon,
  MoonStarsIcon,
  ShovelFieldIcon,
  SoccerFieldIcon,
  BoneInjuryIcon,
  WizardHatIcon,
  LungsIcon,
  MVPCrownIcon,
  PaperIcon,
  PoopIcon,
  ShieldAlertIcon,
  CheckIcon
} from "@/components/Icons";
import {
  purchaseItem,
  equipCosmetic,
  getPlayerInventory,
  getEquippedCosmetics,
  infiltrateData,
} from "@/modules/economy/services/shop";
import { getWalletBalance } from "@/modules/economy/services/wallet";
import { supabaseClient } from "@/lib/supabaseClient";

const SHOP_ITEMS = {
  tactical: [
    {
      id: "escudo_anonimato",
      name: "Escudo de Anonimato",
      description: "Inmunidad total en la ruleta del MysteryVoteWidget para la sesión actual. Tu nombre se remueve del bombo.",
      cost: 1500,
      icon: <ShieldAnonIcon size="1.25rem" style={{ color: "#00e676" }} />,
    },
    {
      id: "infiltracion_datos",
      name: "Infiltración de Datos",
      description: "Revela de forma privada el voto completo y las calificaciones que un compañero te puso en la última sesión.",
      cost: 2500,
      icon: <InfiltrationIcon size="1.25rem" style={{ color: "#00e676" }} />,
    },
  ],
  borders: [
    { id: "border_neon", name: "Fuego Verde Neón", cost: 1200, styleClass: "border-neon", icon: <FlameNeonIcon size="1.25rem" style={{ color: "#00e676" }} /> },
    { id: "border_gold", name: "Oro MVP Shimmer", cost: 1800, styleClass: "border-gold", icon: <StarsShimmerIcon size="1.25rem" style={{ color: "#ffd700" }} /> },
    { id: "border_wood", name: "Madera Rota", cost: 600, styleClass: "border-wood", icon: <AxeBrokenIcon size="1.25rem" style={{ color: "#a1887f" }} /> },
  ],
  fields: [
    { id: "field_stadium", name: "Estadio Nocturno", cost: 1000, icon: <MoonStarsIcon size="1.25rem" style={{ color: "#81d4fa" }} /> },
    { id: "field_potrero", name: "Potrero de Tierra", cost: 800, icon: <ShovelFieldIcon size="1.25rem" style={{ color: "#ffb74d" }} /> },
    { id: "field_synthetic", name: "Fútbol 5 Sintético", cost: 1200, icon: <SoccerFieldIcon size="1.25rem" style={{ color: "#a5d6a7" }} /> },
  ],
  titles: [
    { id: "title_terminator", name: "Terminator de Tobillos", cost: 500, icon: <BoneInjuryIcon size="1.25rem" style={{ color: "#e0e0e0" }} /> },
    { id: "title_lyricist", name: "Lírico Incomprendido", cost: 500, icon: <WizardHatIcon size="1.25rem" style={{ color: "#b39ddb" }} /> },
    { id: "title_lung", name: "Cero Pulmón", cost: 400, icon: <LungsIcon size="1.25rem" style={{ color: "#80deea" }} /> },
  ],
};

export default function ShopPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [activeSession, setActiveSession] = useState<any>(null);
  
  // Owned and Equipped states
  const [ownedItems, setOwnedItems] = useState<string[]>([]);
  const [equipped, setEquipped] = useState<any>(null);
  
  // Teammates for Infiltration
  const [teammates, setTeammates] = useState<any[]>([]);
  
  // Interaction modals
  const [showInfiltrationModal, setShowInfiltrationModal] = useState(false);
  const [infiltrateTargetId, setInfiltrateTargetId] = useState("");
  const [infiltratedResult, setInfiltratedResult] = useState<any>(null);
  
  const [actionError, setActionError] = useState("");
  const [actionSuccess, setActionSuccess] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!FEATURE_FLAGS.IS_CURRENCY_ENABLED) {
      router.push("/dashboard");
      return;
    }

    async function loadShopData() {
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
        const participants = await getSessionParticipants(session.id);
        setTeammates(participants.filter((p) => p.id !== currentProfile.id));
      }

      // Fetch owned inventory & equipped items
      const inventory = await getPlayerInventory();
      setOwnedItems(inventory.map((i) => i.item_id));

      const equippedItems = await getEquippedCosmetics(currentProfile.id);
      setEquipped(equippedItems);

      setLoading(false);
    }

    loadShopData();

    let channel: any = null;
    if (profile?.id) {
      channel = supabaseClient
        .channel(`wallet-shop-page-${profile.id}`)
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
    }

    return () => {
      if (channel) {
        supabaseClient.removeChannel(channel);
      }
    };
  }, [router, profile?.id]);

  const handleBuy = async (itemId: string, itemType: any, cost: number) => {
    if (walletBalance < cost) {
      setActionError("Saldo de CC insuficiente.");
      return;
    }

    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    // If tactical and Escudo, it applies to the active match session
    const matchId = itemType === "tactical" && itemId === "escudo_anonimato" && activeSession 
      ? activeSession.id 
      : undefined;

    if (itemId === "escudo_anonimato" && !activeSession) {
      setActionError("Se necesita una sesión activa para comprar el Escudo de Anonimato.");
      setActionLoading(false);
      return;
    }

    const res = await purchaseItem(itemId, itemType, cost, matchId);
    
    if (res.error) {
      setActionError(res.error);
    } else {
      setActionSuccess("¡Compra realizada con éxito!");
      setWalletBalance((prev) => prev - cost);
      
      // Update owned items
      const inventory = await getPlayerInventory();
      setOwnedItems(inventory.map((i) => i.item_id));
    }
    setActionLoading(false);
  };

  const handleEquip = async (itemType: "avatar_border" | "field_design" | "profile_title", itemId: string | null) => {
    setActionLoading(true);
    setActionError("");
    setActionSuccess("");

    const res = await equipCosmetic(itemType, itemId);

    if (res.error) {
      setActionError(res.error);
    } else {
      setActionSuccess(itemId ? "¡Cosmético equipado!" : "¡Cosmético desequipado!");
      const equippedItems = await getEquippedCosmetics(profile.id);
      setEquipped(equippedItems);
    }
    setActionLoading(false);
  };

  const handleInfiltrateClick = () => {
    if (walletBalance < 2500) {
      setActionError("Saldo de CC insuficiente para comprar Infiltración de Datos (2500 CC).");
      return;
    }
    setInfiltrateTargetId("");
    setInfiltratedResult(null);
    setShowInfiltrationModal(true);
  };

  const executeInfiltration = async () => {
    if (!infiltrateTargetId) return;

    setActionLoading(true);
    setActionError("");

    const res = await infiltrateData(infiltrateTargetId);
    
    if (res.error) {
      setActionError(res.error);
      setShowInfiltrationModal(false);
    } else {
      setInfiltratedResult(res);
      setWalletBalance((prev) => prev - 2500);
      
      const inventory = await getPlayerInventory();
      setOwnedItems(inventory.map((i) => i.item_id));
    }
    setActionLoading(false);
  };

  const getMetricColor = (val: number) => {
    if (val >= 8) return "#00e676";
    if (val >= 5) return "#ffab40";
    return "#ff5252";
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
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.85rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#3d6e50" }}>
          Cargando tienda...
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }} className="animate-slide-up">
        <div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "2.8rem", letterSpacing: "0.06em", color: "#e4f0e8", margin: "0 0 0.25rem", lineHeight: 1 }}>
            El Mercado Negro
          </h1>
          <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.9rem", color: "#3d6e50", margin: 0 }}>
            Intercambiá tus Cotorra Coins ganadas en la cancha por consumibles tácticos y cosméticos.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "rgba(0, 230, 118, 0.08)", border: "1px solid rgba(0, 230, 118, 0.25)", padding: "0.6rem 1rem", borderRadius: "8px" }}>
          <CotorraCoinIcon size="1.6rem" />
          <div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.3rem", color: "#00e676", lineHeight: 1 }}>
              {walletBalance} CC
            </div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", color: "#00e676b0", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tu saldo actual
            </div>
          </div>
        </div>
      </div>

      {actionError && (
        <div style={{ background: "rgba(255,82,82,0.1)", border: "1px solid rgba(255,82,82,0.25)", color: "#ff5252", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontFamily: "'Barlow', sans-serif", display: "flex", alignItems: "center", gap: "0.5rem" }} className="animate-slide-up">
          <ShieldAlertIcon size={16} /> {actionError}
        </div>
      )}

      {actionSuccess && (
        <div style={{ background: "rgba(0,230,118,0.08)", border: "1px solid rgba(0,230,118,0.25)", color: "#00e676", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.85rem", fontFamily: "'Barlow', sans-serif", display: "flex", alignItems: "center", gap: "0.5rem" }} className="animate-slide-up">
          <CheckIcon size={16} /> {actionSuccess}
        </div>
      )}

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2" style={{ gap: "1.5rem" }}>
        
        {/* Tactical Items */}
        <div className="card-sport animate-slide-up stagger-1" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#00e676", borderBottom: "1px solid #1c3828", paddingBottom: "0.5rem", marginBottom: "1rem", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <ShieldAnonIcon size="1.3rem" /> Consumibles Tácticos
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {SHOP_ITEMS.tactical.map((item) => {
              const isEscudo = item.id === "escudo_anonimato";
              
              // For Escudo, check if already bought for this active session
              const hasBoughtEscudo = isEscudo && ownedItems.includes("escudo_anonimato") && activeSession;

              return (
                <div key={item.id} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                      <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", color: "#e4f0e8", margin: 0, letterSpacing: "0.02em" }}>
                        {item.name}
                      </h3>
                    </div>
                    <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.8rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>
                      {item.description}
                    </p>
                  </div>

                  <div style={{ textAlign: "right", display: "flex", flexDirection: "column", gap: "0.5rem", alignItems: "flex-end" }}>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.15rem", color: "#ffd700" }}>{item.cost} CC</span>
                    
                    {isEscudo ? (
                      hasBoughtEscudo ? (
                        <span style={{ fontSize: "0.75rem", color: "#00e676", background: "rgba(0,230,118,0.08)", padding: "0.25rem 0.5rem", borderRadius: "4px", border: "1px solid rgba(0,230,118,0.2)", textTransform: "uppercase", fontWeight: 700 }}>Activo</span>
                      ) : (
                        <button
                          onClick={() => handleBuy(item.id, "tactical", item.cost)}
                          disabled={actionLoading}
                          className="btn-lime"
                          style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                        >
                          Comprar
                        </button>
                      )
                    ) : (
                      <button
                        onClick={handleInfiltrateClick}
                        disabled={actionLoading}
                        className="btn-lime"
                        style={{ padding: "0.35rem 0.75rem", fontSize: "0.8rem" }}
                      >
                        Usar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Avatar Borders */}
        <div className="card-sport animate-slide-up stagger-2" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#e4f0e8", borderBottom: "1px solid #1c3828", paddingBottom: "0.5rem", marginBottom: "1rem", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <FlameNeonIcon size="1.3rem" style={{ color: "#00e676" }} /> Bordes de Avatar Animados
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {SHOP_ITEMS.borders.map((item) => {
              const isOwned = ownedItems.includes(item.id);
              const isEquipped = equipped?.avatar_border === item.id;

              return (
                <div key={item.id} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "0.85rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#e4f0e8" }}>{item.name}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {!isOwned && <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: "#ffd700" }}>{item.cost} CC</span>}
                    
                    {isOwned ? (
                      isEquipped ? (
                        <button
                          onClick={() => handleEquip("avatar_border", null)}
                          disabled={actionLoading}
                          className="btn-danger"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        >
                          Quitar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEquip("avatar_border", item.id)}
                          disabled={actionLoading}
                          className="btn-outline-lime"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        >
                          Equipar
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleBuy(item.id, "avatar_border", item.cost)}
                        disabled={actionLoading}
                        className="btn-lime"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      >
                        Comprar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Court Designs */}
        <div className="card-sport animate-slide-up stagger-3" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#e4f0e8", borderBottom: "1px solid #1c3828", paddingBottom: "0.5rem", marginBottom: "1rem", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <SoccerFieldIcon size="1.3rem" style={{ color: "#00e676" }} /> Diseños de Cancha Personalizados
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {SHOP_ITEMS.fields.map((item) => {
              const isOwned = ownedItems.includes(item.id);
              const isEquipped = equipped?.field_design === item.id;

              return (
                <div key={item.id} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "0.85rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", fontWeight: 700, color: "#e4f0e8" }}>{item.name}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {!isOwned && <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: "#ffd700" }}>{item.cost} CC</span>}
                    
                    {isOwned ? (
                      isEquipped ? (
                        <button
                          onClick={() => handleEquip("field_design", null)}
                          disabled={actionLoading}
                          className="btn-danger"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        >
                          Quitar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEquip("field_design", item.id)}
                          disabled={actionLoading}
                          className="btn-outline-lime"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        >
                          Equipar
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleBuy(item.id, "field_design", item.cost)}
                        disabled={actionLoading}
                        className="btn-lime"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      >
                        Comprar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Profile Titles */}
        <div className="card-sport animate-slide-up stagger-3" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.5rem", color: "#e4f0e8", borderBottom: "1px solid #1c3828", paddingBottom: "0.5rem", marginBottom: "1rem", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <BoneInjuryIcon size="1.3rem" style={{ color: "#00e676" }} /> Títulos de Perfil
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {SHOP_ITEMS.titles.map((item) => {
              const isOwned = ownedItems.includes(item.id);
              const isEquipped = equipped?.profile_title === item.id;

              return (
                <div key={item.id} style={{ background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "0.85rem 1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.05rem", fontWeight: 700, color: "#e4f0e8" }}>&quot;{item.name}&quot;</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    {!isOwned && <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.1rem", color: "#ffd700" }}>{item.cost} CC</span>}
                    
                    {isOwned ? (
                      isEquipped ? (
                        <button
                          onClick={() => handleEquip("profile_title", null)}
                          disabled={actionLoading}
                          className="btn-danger"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        >
                          Quitar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEquip("profile_title", item.id)}
                          disabled={actionLoading}
                          className="btn-outline-lime"
                          style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                        >
                          Equipar
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => handleBuy(item.id, "profile_title", item.cost)}
                        disabled={actionLoading}
                        className="btn-lime"
                        style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem" }}
                      >
                        Comprar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Select Teammate Modal for Infiltration */}
      {showInfiltrationModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "1rem" }} onClick={() => setShowInfiltrationModal(false)}>
          <div style={{ background: "rgba(6, 13, 9, 0.98)", border: "1px solid #ffd700", borderRadius: "12px", maxWidth: "480px", width: "100%", padding: "1.75rem", boxShadow: "0 10px 30px rgba(0,0,0,0.7)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#ffd700", margin: "0 0 0.5rem", letterSpacing: "0.04em" }}>
              Infiltración de Datos (2500 CC)
            </h3>
            <p style={{ fontFamily: "'Barlow', sans-serif", fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Seleccioná un compañero de la lista para revelar en tiempo real qué calificaciones te dio y su voto de MVP/Papelón en la última sesión terminada.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label className="label-sport" htmlFor="target-select">Seleccionar compañero</label>
                <select
                  id="target-select"
                  value={infiltrateTargetId}
                  onChange={(e) => setInfiltrateTargetId(e.target.value)}
                  className="input-sport"
                  style={{ width: "100%", background: "#060d09" }}
                >
                  <option value="">-- Elegir jugador --</option>
                  {teammates.map((t) => (
                    <option key={t.id} value={t.id}>{t.username}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
                <button
                  onClick={() => setShowInfiltrationModal(false)}
                  className="btn-danger"
                  style={{ flex: 1 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={executeInfiltration}
                  disabled={!infiltrateTargetId || actionLoading}
                  className="btn-lime"
                  style={{ flex: 2 }}
                >
                  {actionLoading ? "Cargando datos..." : "Ejecutar (2500 CC)"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Infiltration Results Modal */}
      {infiltratedResult && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: "1rem" }} onClick={() => setInfiltratedResult(null)}>
          <div style={{ background: "rgba(6, 13, 9, 0.98)", border: "1px solid #ffd700", borderRadius: "12px", maxWidth: "480px", width: "100%", padding: "1.75rem", boxShadow: "0 10px 30px rgba(0,0,0,0.7)" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.6rem", color: "#ffd700", margin: "0 0 0.5rem", letterSpacing: "0.04em" }}>
              Datos Filtrados de la Última Sesión
            </h3>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.85rem", color: "var(--accent-lime)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "1.25rem" }}>
              Sesión: {infiltratedResult.sessionName}
            </p>

            {infiltratedResult.rating ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                
                {/* Metrics list */}
                {([
                  { key: "tecnica", label: "Habilidad Técnica" },
                  { key: "fisico", label: "Esfuerzo Físico" },
                  { key: "actitud", label: "Actitud" },
                  { key: "vision_juego", label: "Toma de Decisiones" }
                ]).map((m) => {
                  const val = infiltratedResult.rating[m.key];
                  return (
                    <div key={m.key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.75rem", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "6px" }}>
                      <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase" }}>
                        {m.label}
                      </span>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "1.2rem", color: val !== null ? getMetricColor(val) : "var(--text-muted)" }}>
                        {val !== null ? val : "—"}
                      </span>
                    </div>
                  );
                })}

                {/* Awards summary */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginTop: "0.5rem" }}>
                  <div style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${infiltratedResult.rating.is_mvp ? '#ffd700' : 'var(--border-subtle)'}`, padding: "0.5rem", borderRadius: "6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", opacity: infiltratedResult.rating.is_mvp ? 1 : 0.45 }}>
                    <MVPCrownIcon size="1.2rem" style={{ color: "#ffd700" }} />
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: infiltratedResult.rating.is_mvp ? '#ffd700' : 'var(--text-muted)' }}>Votó MVP</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${infiltratedResult.rating.is_bigpaper ? '#ffab40' : 'var(--border-subtle)'}`, padding: "0.5rem", borderRadius: "6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", opacity: infiltratedResult.rating.is_bigpaper ? 1 : 0.45 }}>
                    <PaperIcon size="1.2rem" style={{ color: "#ffab40" }} />
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: infiltratedResult.rating.is_bigpaper ? '#ffab40' : 'var(--text-muted)' }}>Votó Papelón</div>
                  </div>
                  <div style={{ background: "rgba(0,0,0,0.25)", border: `1px solid ${infiltratedResult.rating.is_poop ? '#ff5252' : 'var(--border-subtle)'}`, padding: "0.5rem", borderRadius: "6px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "0.25rem", opacity: infiltratedResult.rating.is_poop ? 1 : 0.45 }}>
                    <PoopIcon size="1.2rem" style={{ color: "#ff5252" }} />
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", color: infiltratedResult.rating.is_poop ? '#ff5252' : 'var(--text-muted)' }}>Votó Caca</div>
                  </div>
                </div>

              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "2rem 1rem", background: "rgba(0,0,0,0.2)", border: "1px solid var(--border-subtle)", borderRadius: "8px", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                El jugador seleccionado no te calificó en esa sesión (voto en blanco).
              </div>
            )}

            <button
              onClick={() => setInfiltratedResult(null)}
              className="btn-lime"
              style={{ width: "100%", marginTop: "1.25rem" }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
