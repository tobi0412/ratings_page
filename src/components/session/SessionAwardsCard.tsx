"use client";

import { submitSessionAwards } from "@/actions/ratings";
import { Profile, Rating } from "@/types";
import { useState, useEffect } from "react";
import { TrophyIcon, PaperIcon, PoopIcon, CheckIcon } from "@/components/Icons";
import PlayerAvatar from "@/components/profile/PlayerAvatar";


// Chevron indicator icon
function ChevronDownIcon({ size = 12, style = {} }) {
  return (
    <svg style={style} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

interface SessionAwardsCardProps {
  players: Profile[];
  matchId: string;
  initialVotes: Rating[];
  onAwardsChanged: (updatedVotes: Rating[]) => void;
}

export default function SessionAwardsCard({
  players,
  matchId,
  initialVotes,
  onAwardsChanged,
}: SessionAwardsCardProps) {
  const [mvpId, setMvpId] = useState("");
  const [bigpaperId, setBigpaperId] = useState("");
  const [poopId, setPoopId] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // UI state for dropdown menus
  const [openDropdown, setOpenDropdown] = useState<"mvp" | "bigpaper" | "poop" | null>(null);

  useEffect(() => {
    const mvp = initialVotes.find((v) => v.is_mvp)?.receiver_id || "";
    const bigpaper = initialVotes.find((v) => v.is_bigpaper)?.receiver_id || "";
    const poop = initialVotes.find((v) => v.is_poop)?.receiver_id || "";
    setMvpId(mvp);
    setBigpaperId(bigpaper);
    setPoopId(poop);
  }, [initialVotes]);

  // Click outside to close dropdown listener
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest(".custom-award-dropdown")) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleSave = async (updatedMvp: string, updatedBigpaper: string, updatedPoop: string) => {
    setLoading(true);
    setError("");
    setSaved(false);

    const res = await submitSessionAwards({
      match_id: matchId,
      mvp_id: updatedMvp,
      bigpaper_id: updatedBigpaper,
      poop_id: updatedPoop,
    });

    if (res.error) {
      setError(res.error);
    } else {
      setSaved(true);
      const updatedRatings: Rating[] = [];
      const uniqueReceivers = Array.from(new Set([updatedMvp, updatedBigpaper, updatedPoop]));
      uniqueReceivers.forEach((receiverId) => {
        if (!receiverId) return;
        updatedRatings.push({
          id: `temp-${receiverId}`,
          match_id: matchId,
          voter_id: "",
          receiver_id: receiverId,
          tecnica: null,
          fisico: null,
          actitud: null,
          vision_juego: null,
          is_mvp: receiverId === updatedMvp,
          is_bigpaper: receiverId === updatedBigpaper,
          is_poop: receiverId === updatedPoop,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      });
      onAwardsChanged(updatedRatings);
    }
    setLoading(false);
  };

  const renderDropdown = (
    awardType: "mvp" | "bigpaper" | "poop",
    label: string,
    color: string,
    icon: React.ReactNode,
    selectedId: string,
    setSelectedId: (id: string) => void
  ) => {
    const isOpen = openDropdown === awardType;
    const selectedPlayer = players.find((p) => p.id === selectedId);

    const toggleDropdown = (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpenDropdown(isOpen ? null : awardType);
    };

    const handleSelect = (playerId: string) => {
      setSelectedId(playerId);
      setOpenDropdown(null);
      
      const newMvp = awardType === "mvp" ? playerId : mvpId;
      const newBigpaper = awardType === "bigpaper" ? playerId : bigpaperId;
      const newPoop = awardType === "poop" ? playerId : poopId;
      handleSave(newMvp, newBigpaper, newPoop);
    };

    return (
      <div
        className="custom-award-dropdown w-full md:flex-1"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.45rem",
          position: "relative",
          zIndex: isOpen ? 50 : 1,
        }}
      >
        <label
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "0.8rem",
            color: color,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase"
          }}
        >
          {icon}
          {label}
        </label>
        
        {/* Dropdown Toggle Trigger Button */}
        <div
          onClick={toggleDropdown}
          style={{
            background: "rgba(0, 0, 0, 0.45)",
            border: `1px solid ${isOpen ? color : "var(--border-subtle)"}`,
            borderRadius: "8px",
            padding: "0.6rem 0.85rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
            transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            boxShadow: isOpen ? `0 0 12px ${color}20` : "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            {selectedPlayer ? (
              <>
                {/* Micro Avatar */}
                <PlayerAvatar
                  playerId={selectedPlayer.id}
                  avatarUrl={selectedPlayer.avatar_url}
                  username={selectedPlayer.username}
                  size={24}
                />
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: "0.95rem", color: "#e4f0e8" }}>
                  {selectedPlayer.username}
                </span>
              </>
            ) : (
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: "0.92rem", color: "var(--text-muted)", opacity: 0.8 }}>
                {awardType === "mvp" ? "Seleccionar jugador..." : "Ninguno (Opcional)"}
              </span>
            )}
          </div>
          <ChevronDownIcon
            style={{
              color: isOpen ? color : "var(--text-muted)",
              transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.25s ease, color 0.25s ease"
            }}
          />
        </div>

        {/* Dropdown Floating Options Menu */}
        {isOpen && (
          <div
            className="animate-slide-up"
            style={{
              position: "absolute",
              top: "105%",
              left: 0,
              right: 0,
              zIndex: 100,
              background: "var(--bg-card-hover)",
              border: `1px solid ${color}45`,
              borderRadius: "10px",
              boxShadow: `0 8px 30px rgba(0,0,0,0.6), 0 0 14px ${color}15`,
              maxHeight: "220px",
              overflowY: "auto",
              padding: "0.3rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.2rem",
            }}
          >
            {awardType !== "mvp" && (
              <div
                key="none"
                onClick={() => handleSelect("")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  padding: "0.5rem 0.65rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  background: selectedId === "" ? `${color}15` : "transparent",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = selectedId === "" ? `${color}25` : "rgba(0, 230, 118, 0.08)";
                  e.currentTarget.style.transform = "translateX(3px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = selectedId === "" ? `${color}15` : "transparent";
                  e.currentTarget.style.transform = "none";
                }}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    background: selectedId === "" ? `${color}25` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${selectedId === "" ? color : "rgba(255,255,255,0.1)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "0.75rem",
                    color: selectedId === "" ? color : "var(--text-muted)",
                    overflow: "hidden",
                    flexShrink: 0
                  }}
                >
                  ✖
                </div>
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    color: selectedId === "" ? color : "#e4f0e8"
                  }}
                >
                  Ninguno (Opcional)
                </span>
              </div>
            )}
            {players.map((p) => {
              const isSelected = p.id === selectedId;
              return (
                <div
                  key={p.id}
                  onClick={() => handleSelect(p.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.5rem 0.65rem",
                    borderRadius: "6px",
                    cursor: "pointer",
                    background: isSelected ? `${color}15` : "transparent",
                    transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isSelected ? `${color}25` : "rgba(0, 230, 118, 0.08)";
                    e.currentTarget.style.transform = "translateX(3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isSelected ? `${color}15` : "transparent";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <PlayerAvatar
                    playerId={p.id}
                    avatarUrl={p.avatar_url}
                    username={p.username}
                    size={24}
                  />
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.92rem",
                      color: isSelected ? color : "#e4f0e8"
                    }}
                  >
                    {p.username}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div
      className="card-sport animate-slide-up"
      style={{
        padding: "1.5rem",
        position: "relative",
        zIndex: 30,
        background: "linear-gradient(145deg, var(--bg-card) 0%, rgba(11, 24, 16, 0.7) 100%)",
        borderColor: saved ? "rgba(0, 230, 118, 0.35)" : undefined,
        transition: "border-color 0.3s ease, box-shadow 0.3s ease",
        overflow: "visible",
      }}
    >
      {/* Background diagonal stripe subtle texture */}
      <div
        className="stripe-texture"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.6,
          pointerEvents: "none",
          zIndex: 0
        }}
      />

      <div style={{ position: "relative", zIndex: 10 }}>
        <h2
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: "1.6rem",
            letterSpacing: "0.06em",
            color: "#e4f0e8",
            margin: "0 0 1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          🏆 Premios de la Sesión
        </h2>
        
        {/* Grid Container */}
        <div
          className="flex flex-col md:flex-row w-full"
          style={{
            gap: "1.25rem",
          }}
        >
          {/* MVP Select */}
          {renderDropdown(
            "mvp",
            "MVP de la sesión",
            "#ffc93c",
            <TrophyIcon size={13} style={{ color: "#ffc93c" }} />,
            mvpId,
            setMvpId
          )}

          {/* Bigpaper Select */}
          {renderDropdown(
            "bigpaper",
            "Papelón de la sesión",
            "#ffab40",
            <PaperIcon size={13} style={{ color: "#ffab40" }} />,
            bigpaperId,
            setBigpaperId
          )}

          {/* Poop Select */}
          {renderDropdown(
            "poop",
            "Jugador caca",
            "#8d6e63",
            <PoopIcon size={13} style={{ color: "#8d6e63" }} />,
            poopId,
            setPoopId
          )}
        </div>

        {error && (
          <div style={{ marginTop: "1rem", color: "#ff5252", fontSize: "0.85rem", fontFamily: "'Barlow', sans-serif" }}>
            {error}
          </div>
        )}

        {/* Footer info/status bar */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "1.1rem", height: "20px" }}>
          {loading && <span style={{ fontSize: "0.8rem", color: "var(--accent-lime)", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", textTransform: "uppercase" }}>Guardando premios...</span>}
          {saved && !loading && (
            <span style={{ fontSize: "0.8rem", color: "#00e676", display: "inline-flex", alignItems: "center", gap: "0.3rem", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 700 }}>
              <CheckIcon size={12} strokeWidth={3} />
              Premios guardados
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
