"use client";

import { motion, useReducedMotion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Profile, Rating } from "@/types";
import { StarIcon, StadiumIcon, CheckIcon, SpyIcon } from "@/components/Icons";

interface VotingProgressProps {
  players: Profile[];
  myVotes: Rating[];
  awardsComplete: boolean;
  teamRatingSaved: boolean;
}


const getAvatarGradient = (username: string) => {
  if (!username) return "linear-gradient(135deg, #112018 0%, #1c3828 100%)";
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const gradients = [
    "linear-gradient(135deg, #163622 0%, #0c1d13 100%)", // Deep forest
    "linear-gradient(135deg, #1b4d3e 0%, #0d2921 100%)", // Emerald shadow
    "linear-gradient(135deg, #2a5c43 0%, #11281c 100%)", // Dark turf
    "linear-gradient(135deg, #1c3d31 0%, #0b1a14 100%)", // Mint darkness
    "linear-gradient(135deg, #204c39 0%, #0e241b 100%)", // Pitch green
  ];
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
};

export default function VotingProgress({
  players,
  myVotes,
  awardsComplete,
  teamRatingSaved,
}: VotingProgressProps) {
  const totalPlayers = players.length;
  const [mounted, setMounted] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Helper to evaluate completeness of a player's card
  const isCardCompleted = (player: Profile) => {
    const vote = myVotes.find((v) => v.receiver_id === player.id);
    if (!vote) return false;
    if (vote.tecnica !== null) return true; // Normal rated
    if (!vote.is_mvp && !vote.is_bigpaper && !vote.is_poop) return true; // Blank vote ("No coincidí")
    return false;
  };

  // Helper to check if a player was voted "No coincidí"
  const isPlayerBlankVote = (player: Profile) => {
    const vote = myVotes.find((v) => v.receiver_id === player.id);
    return !!vote && vote.tecnica === null && !vote.is_mvp && !vote.is_bigpaper && !vote.is_poop;
  };

  const votedCount = players.filter(isCardCompleted).length;
  const totalSteps = totalPlayers + 2; // players + awards + team rating
  const completedSteps = votedCount + (awardsComplete ? 1 : 0) + (teamRatingSaved ? 1 : 0);
  const percentage = totalSteps > 0 ? Math.floor((completedSteps / totalSteps) * 100) : 0;
  const shouldReduceMotion = useReducedMotion();
  const progressTransition = shouldReduceMotion
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 100, damping: 20 } as const);

  const { scrollY } = useScroll();
  const [showStickyFills, setShowStickyFills] = useState(false);
  const [dockVisible, setDockVisible] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const lastScrollY = useRef(0);

  // Intersection Observer to update active navigation bubble/badge
  useEffect(() => {
    if (players.length === 0) return;
    const targetIds = ["awards-section", ...players.map((p) => `player-card-${p.id}`), "team-rating-section"];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSectionId(entry.target.id);
          }
        });
      },
      { threshold: 0.4, rootMargin: "-10% 0px -30% 0px" }
    );

    targetIds.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [players]);

  // Handle show/hide logic on scroll for mobile stories dock
  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 180) {
      setShowStickyFills(true);
      const diff = latest - lastScrollY.current;
      if (diff > 5) {
        setDockVisible(false); // Hide on scroll down
      } else if (diff < -5) {
        setDockVisible(true); // Show on scroll up
      }

      // Clear existing timer and start a new one to detect scroll-end
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => {
        setDockVisible(true); // Auto-reveal when scrolling stops
      }, 200);
    } else {
      setShowStickyFills(false);
      setDockVisible(false);
    }
    lastScrollY.current = latest;
  });

  // Auto-reveal mobile dock briefly when a vote count increases
  const prevVotedCount = useRef(votedCount);
  useEffect(() => {
    if (votedCount !== prevVotedCount.current) {
      if (scrollY.get() > 180) {
        setDockVisible(true);
      }
      prevVotedCount.current = votedCount;
    }
  }, [votedCount, scrollY]);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  return (
    <div className="card-sport sticky-progress-card">
      <style>{`
        /* --- Card base --- */
        .sticky-progress-card {
          background: var(--bg-card) !important;
          border: 1px solid var(--border-subtle) !important;
          border-top: 3px solid var(--accent-lime) !important;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.6) !important;
          padding: 1.25rem 1.5rem !important;
          position: relative;
          border-radius: 12px;
          transition: all 250ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        .sticky-progress-card::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            135deg,
            rgba(0, 230, 118, 0.02) 0%,
            transparent 55%
          );
          pointer-events: none;
          border-radius: inherit;
        }
        .sticky-progress-card:hover {
          box-shadow: 0 12px 36px rgba(0, 230, 118, 0.05) !important;
          border-color: rgba(0, 230, 118, 0.25) !important;
        }

        /* --- Stepper track layout --- */
        .stepper-container {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
          position: relative;
          margin-top: 1.25rem;
          padding-left: 0.25rem;
        }
        .stepper-line {
          position: absolute;
          left: 8px; /* centers with 18px circle container */
          top: 9px;
          bottom: 9px;
          width: 2px;
          background: var(--border-subtle);
          z-index: 0;
        }
        .stepper-step {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          cursor: pointer;
          position: relative;
          z-index: 1;
        }
        .stepper-bubble {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-field);
          border: 2px solid var(--border-subtle);
          transition: all 250ms cubic-bezier(0.23, 1, 0.32, 1);
          flex-shrink: 0;
          z-index: 2;
        }
        .stepper-bubble.is-active {
          border-color: var(--accent-lime);
          background: rgba(0, 230, 118, 0.05);
          box-shadow: 
            0 0 12px rgba(0, 230, 118, 0.35),
            inset 0 0 4px rgba(0, 230, 118, 0.2);
        }
        .stepper-bubble.is-done {
          background: var(--accent-lime);
          border-color: var(--accent-lime);
          box-shadow: 0 0 10px rgba(0, 230, 118, 0.25);
        }
        .stepper-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: var(--text-muted);
          transition: all 200ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (hover: hover) and (pointer: fine) {
          .stepper-step:hover .stepper-label {
            color: var(--text-primary);
            transform: translateX(4px);
          }
        }
        .stepper-label.is-active {
          color: var(--text-primary);
        }
        .stepper-label.is-done {
          color: rgba(228, 240, 232, 0.45);
        }

        /* --- Desktop Sidebar Capsule --- */
        .voting-sidebar {
          display: none;
        }

        @media (min-width: 1200px) {
          .voting-sidebar {
            position: fixed;
            top: 50%;
            right: 2.5rem;
            transform: translateY(-50%);
            display: flex;
            flex-direction: column;
            gap: 0.8rem;
            z-index: 90;
            max-height: calc(100vh - 120px);
            overflow-y: auto;
            scrollbar-width: none;
            background: linear-gradient(180deg, rgba(11, 24, 16, 0.85) 0%, rgba(6, 13, 9, 0.9) 100%);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(0, 230, 118, 0.2);
            border-radius: 99px;
            padding: 1.5rem 0.75rem;
            box-shadow: 
              0 24px 60px rgba(0, 0, 0, 0.7),
              0 0 30px rgba(0, 230, 118, 0.03),
              inset 0 1px 0 rgba(255, 255, 255, 0.05);
            align-items: center;
            transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          }
          .voting-sidebar::-webkit-scrollbar {
            display: none;
          }
          .voting-sidebar:hover {
            border-color: rgba(0, 230, 118, 0.45);
            box-shadow: 
              0 24px 60px rgba(0, 0, 0, 0.8),
              0 0 40px rgba(0, 230, 118, 0.08);
          }
        }

        .sidebar-badge-item {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          background: rgba(0, 0, 0, 0.55);
          border: 2px solid rgba(28, 56, 40, 0.75);
          color: #3d6e50;
          transition: all 250ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        
        .sidebar-badge-item.is-active {
          border-color: transparent;
          color: #e4f0e8;
        }

        .sidebar-badge-item:hover {
          transform: scale(1.18);
          border-color: rgba(0, 230, 118, 0.6);
          color: #e4f0e8;
        }

        .sidebar-badge-voted {
          border-color: #00e676;
          background: rgba(0, 230, 118, 0.08);
          color: #00e676;
          box-shadow: 0 0 10px rgba(0, 230, 118, 0.15);
        }

        .sidebar-badge-blank {
          border: 2px dashed #ff5252;
          background: rgba(255, 82, 82, 0.03);
          color: #ff5252;
        }

        .sidebar-active-bg {
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          border: 2px solid #e4f0e8;
          box-shadow: 0 0 16px rgba(228, 240, 232, 0.45);
          z-index: 0;
          pointer-events: none;
        }

        .badge-avatar-container {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 230, 118, 0.05);
          z-index: 1;
          transition: all 250ms ease;
        }

        .badge-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .badge-avatar-text {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.1rem;
          color: #e4f0e8;
          transition: color 0.2s ease;
          letter-spacing: 0.02em;
        }
        .sidebar-badge-voted .badge-avatar-text {
          color: #00e676;
        }
        .sidebar-badge-blank .badge-avatar-text {
          color: #ff5252;
        }

        .badge-overlay-icon {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 15px;
          height: 15px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #060d09;
          z-index: 5;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }

        .badge-overlay-voted {
          background: #00e676;
          color: #060d09;
        }

        .badge-overlay-blank {
          background: #ff5252;
          color: #e4f0e8;
        }

        /* Tooltip */
        .sidebar-tooltip {
          position: absolute;
          right: 3.6rem;
          top: 50%;
          transform: translateY(-50%) scale(0.92);
          background: rgba(6, 13, 9, 0.98);
          border: 1px solid rgba(28, 56, 40, 0.9);
          border-left: 3px solid rgba(0, 230, 118, 0.55);
          border-radius: 8px;
          padding: 0.5rem 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
          pointer-events: none;
          opacity: 0;
          transition: all 200ms cubic-bezier(0.23, 1, 0.32, 1);
          transform-origin: right center;
          box-shadow: 0 12px 36px rgba(0,0,0,0.7);
          white-space: nowrap;
          z-index: 200;
        }
        .sidebar-badge-item:hover .sidebar-tooltip {
          opacity: 1;
          transform: translateY(-50%) scale(1);
        }
        .sidebar-badge-blank .sidebar-tooltip {
          border-left-color: #ff5252;
        }
        .sidebar-badge-voted .sidebar-tooltip {
          border-left-color: #00e676;
        }

        .tooltip-name {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.05rem;
          color: #e4f0e8;
          letter-spacing: 0.04em;
          line-height: 1.1;
        }

        .tooltip-status {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          display: flex;
          align-items: center;
        }
        .tooltip-status.status-voted {
          color: #00e676;
        }
        .tooltip-status.status-blank {
          color: #ff5252;
        }
        .tooltip-status.status-pending {
          color: #6ba883;
        }

        /* --- Mobile Stories Dock --- */
        .mobile-stories-dock {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: calc(100% - 2rem);
          max-width: 500px;
          z-index: 90;
          display: flex;
          align-items: center;
          overflow: visible;
          background: linear-gradient(160deg, rgba(9, 20, 13, 0.97) 0%, rgba(5, 11, 7, 0.99) 100%);
          backdrop-filter: blur(24px) saturate(160%);
          -webkit-backdrop-filter: blur(24px) saturate(160%);
          border: 1px solid rgba(28, 56, 40, 0.7);
          border-top: 1px solid rgba(0, 230, 118, 0.3);
          border-radius: 32px;
          padding: 0.5rem 1rem;
          box-shadow: 
            0 24px 64px rgba(0, 0, 0, 0.9),
            0 0 0 1px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255, 255, 255, 0.04),
            0 0 30px rgba(0, 230, 118, 0.04);
        }

        @media (min-width: 1200px) {
          .mobile-stories-dock {
            display: none !important;
          }
        }

        .mobile-dock-carousel {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          overflow-x: auto;
          overflow-y: visible;
          padding: 0.65rem 0.2rem;
          scrollbar-width: none;
          -ms-overflow-style: none;
          width: 100%;
          -webkit-mask-image: linear-gradient(to right, transparent 0%, #000 24px, #000 calc(100% - 24px), transparent 100%);
          mask-image: linear-gradient(to right, transparent 0%, #000 24px, #000 calc(100% - 24px), transparent 100%);
        }
        .mobile-dock-carousel::-webkit-scrollbar {
          display: none;
        }

        .mobile-badge-item {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          transition: all 250ms cubic-bezier(0.23, 1, 0.32, 1);
          flex-shrink: 0;
        }

        .mobile-badge-item.is-active .mobile-badge-inner {
          border-color: #ffffff;
          box-shadow:
            0 0 0 2.5px rgba(255, 255, 255, 0.2),
            0 0 18px rgba(255, 255, 255, 0.25),
            0 4px 16px rgba(0, 0, 0, 0.5);
        }

        .mobile-badge-inner {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(8, 18, 11, 0.95);
          border: 2px solid rgba(28, 56, 40, 0.7);
          transition: all 250ms ease;
          overflow: hidden;
        }

        .mobile-badge-inner.is-voted {
          border-color: rgba(0, 230, 118, 0.8);
          box-shadow: 
            0 0 0 1px rgba(0, 230, 118, 0.15),
            0 0 10px rgba(0, 230, 118, 0.2);
          background: rgba(0, 230, 118, 0.06);
        }

        .mobile-badge-inner.is-blank {
          border: 1.5px dashed rgba(255, 82, 82, 0.6);
          background: rgba(255, 82, 82, 0.04);
        }

        .mobile-badge-inner .badge-avatar-container {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mobile-active-dot {
          position: absolute;
          bottom: 2px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #ffffff;
          box-shadow: 0 0 6px rgba(255,255,255,0.8);
          pointer-events: none;
        }
      `}</style>
      
      {/* Header */}
      <div style={{ marginBottom: "1rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: "0.5rem",
          }}
        >
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontWeight: 700,
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#3d6e50",
            }}
          >
            Progreso
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
            <span
              style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: "1.8rem",
                color: "#00e676",
                letterSpacing: "0.04em",
                lineHeight: 1,
              }}
            >
              {percentage}%
            </span>
            <span
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "0.85rem",
                color: "#3d6e50",
              }}
            >
              ({completedSteps}/{totalSteps})
            </span>
          </div>
        </div>

        {/* Thin linear progress bar */}
        <div
          style={{
            width: "100%",
            height: "4px",
            background: "#1c3828",
            borderRadius: "2px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <motion.div
            animate={{ width: `${percentage}%` }}
            transition={progressTransition}
            style={{
              height: "100%",
              background: "#00e676",
              borderRadius: "2px",
              boxShadow: "0 0 8px rgba(0, 230, 118, 0.4)",
            }}
          />
        </div>
      </div>

      {/* Stepper Steps */}
      <div className="stepper-container">
        <div className="stepper-line" />
        
        {/* Step 1: Jugadores */}
        <div 
          onClick={() => handleScrollTo("players-section")}
          className="stepper-step"
        >
          <div className={`stepper-bubble ${votedCount === totalPlayers ? "is-done" : activeSectionId?.startsWith("player-card-") ? "is-active" : ""}`}>
            {votedCount === totalPlayers && (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#060d09" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>
          <span className={`stepper-label ${votedCount === totalPlayers ? "is-done" : activeSectionId?.startsWith("player-card-") ? "is-active" : ""}`}>
            Jugadores ({votedCount}/{totalPlayers})
          </span>
        </div>

        {/* Step 2: Premios */}
        <div 
          onClick={() => handleScrollTo("awards-section")}
          className="stepper-step"
        >
          <div className={`stepper-bubble ${awardsComplete ? "is-done" : activeSectionId === "awards-section" ? "is-active" : ""}`}>
            {awardsComplete && (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#060d09" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>
          <span className={`stepper-label ${awardsComplete ? "is-done" : activeSectionId === "awards-section" ? "is-active" : ""}`}>
            Premios
          </span>
        </div>

        {/* Step 3: Rendimiento de Equipo */}
        <div 
          onClick={() => handleScrollTo("team-rating-section")}
          className="stepper-step"
        >
          <div className={`stepper-bubble ${teamRatingSaved ? "is-done" : activeSectionId === "team-rating-section" ? "is-active" : ""}`}>
            {teamRatingSaved && (
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#060d09" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
          </div>
          <span className={`stepper-label ${teamRatingSaved ? "is-done" : activeSectionId === "team-rating-section" ? "is-active" : ""}`}>
            Equipo
          </span>
        </div>
      </div>

      {/* --- MOBILE STORIES DOCK (portal) --- */}
      {mounted && typeof document !== "undefined" && createPortal(
        <>

          {/* --- MOBILE STORIES DOCK --- */}
          <AnimatePresence>
            {showStickyFills && (
              <motion.div
                initial={{ y: 100, x: "-50%", opacity: 0 }}
                animate={{ 
                  y: dockVisible ? 0 : 125, 
                  x: "-50%",
                  opacity: dockVisible ? 1 : 0 
                }}
                exit={{ y: 100, x: "-50%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                className="mobile-stories-dock"
              >
                <div className="mobile-dock-carousel">
                  {/* Awards */}
                  <div
                    onClick={() => handleScrollTo("awards-section")}
                    className={`mobile-badge-item ${
                      activeSectionId === "awards-section" ? "is-active" : ""
                    }`}
                  >
                    <div className={`mobile-badge-inner ${awardsComplete ? "is-voted" : ""}`}>
                      <div className="badge-avatar-container">
                        <StarIcon size={14} filled={awardsComplete} style={{ color: awardsComplete ? "#ffc93c" : undefined }} />
                      </div>
                    </div>
                    {awardsComplete && (
                      <div className="badge-overlay-icon badge-overlay-voted">
                        <CheckIcon size={8} strokeWidth={4} />
                      </div>
                    )}
                    {activeSectionId === "awards-section" && <div className="mobile-active-dot" />}
                  </div>

                  {/* Players */}
                  {players.map((player) => {
                    const completed = isCardCompleted(player);
                    const isBlank = isPlayerBlankVote(player);
                    const initials = player.username ? player.username.substring(0, 2).toUpperCase() : "?";
                    const isActive = activeSectionId === `player-card-${player.id}`;
                    const avatarBg = getAvatarGradient(player.username || "");

                    let statusClass = "is-pending";
                    if (completed) {
                      statusClass = isBlank ? "is-blank" : "is-voted";
                    }

                    return (
                      <div
                        key={player.id}
                        onClick={() => handleScrollTo(`player-card-${player.id}`)}
                        className={`mobile-badge-item ${isActive ? "is-active" : ""}`}
                      >
                        <div className={`mobile-badge-inner ${statusClass}`}>
                          <div className="badge-avatar-container" style={{ background: player.avatar_url ? undefined : avatarBg }}>
                            {player.avatar_url ? (
                              <img src={player.avatar_url} alt={player.username} className="badge-avatar-img" />
                            ) : (
                              <span className="badge-avatar-text" style={{ fontSize: "0.95rem" }}>{initials}</span>
                            )}
                          </div>
                        </div>
                        {completed && (
                          isBlank ? (
                            <div className="badge-overlay-icon badge-overlay-blank">
                              <SpyIcon size={8} />
                            </div>
                          ) : (
                            <div className="badge-overlay-icon badge-overlay-voted">
                              <CheckIcon size={8} strokeWidth={4} />
                            </div>
                          )
                        )}
                        {isActive && <div className="mobile-active-dot" />}
                      </div>
                    );
                  })}

                  {/* Team Rating */}
                  <div
                    onClick={() => handleScrollTo("team-rating-section")}
                    className={`mobile-badge-item ${
                      activeSectionId === "team-rating-section" ? "is-active" : ""
                    }`}
                  >
                    <div className={`mobile-badge-inner ${teamRatingSaved ? "is-voted" : ""}`}>
                      <div className="badge-avatar-container">
                        <StadiumIcon size={14} style={{ color: teamRatingSaved ? "#00e676" : undefined }} />
                      </div>
                    </div>
                    {teamRatingSaved && (
                      <div className="badge-overlay-icon badge-overlay-voted">
                        <CheckIcon size={8} strokeWidth={4} />
                      </div>
                    )}
                    {activeSectionId === "team-rating-section" && <div className="mobile-active-dot" />}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>,
        document.body
      )}
    </div>
  );
}
