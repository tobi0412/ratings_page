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

const TaskIndicator = ({ completed }: { completed: boolean }) => (
  <div
    style={{
      width: "16px",
      height: "16px",
      borderRadius: "50%",
      border: `1.5px solid ${completed ? "#00e676" : "#ff5252"}`,
      background: completed ? "rgba(0, 230, 118, 0.15)" : "transparent",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
      transition: "all 200ms cubic-bezier(0.23, 1, 0.32, 1)",
    }}
  >
    {completed ? (
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6L9 17l-5-5" />
      </svg>
    ) : (
      <div
        style={{
          width: "4px",
          height: "4px",
          borderRadius: "50%",
          background: "#ff5252",
        }}
      />
    )}
  </div>
);

const ChevronRightIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: "block" }}
  >
    <path d="m9 18 6-6-6-6" />
  </svg>
);

const buttonVariants = {
  initial: { scale: 1, y: 0 },
  hover: (completed: boolean) => ({
    scale: 1.01,
    y: -1,
    backgroundColor: completed ? "rgba(0, 230, 118, 0.02)" : "rgba(0, 230, 118, 0.06)",
    borderColor: completed ? "rgba(0, 230, 118, 0.15)" : "rgba(0, 230, 118, 0.35)",
    boxShadow: completed ? "0 2px 8px rgba(0,0,0,0.15)" : "0 4px 16px rgba(0, 0, 0, 0.25)",
  }),
  tap: { scale: 0.98 },
};

const arrowVariants = {
  initial: { opacity: 0, x: -4 },
  hover: { opacity: 1, x: 0 },
};

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
        .sticky-progress-card {
          background: linear-gradient(135deg, rgba(11, 24, 16, 0.85) 0%, rgba(6, 13, 9, 0.9) 100%);
          background-image: 
            repeating-linear-gradient(-45deg, transparent, transparent 14px, rgba(0, 230, 118, 0.008) 14px, rgba(0, 230, 118, 0.008) 28px),
            linear-gradient(135deg, rgba(11, 24, 16, 0.85) 0%, rgba(6, 13, 9, 0.9) 100%);
          border: 1px solid rgba(28, 56, 40, 0.7);
          border-top: 1px solid rgba(0, 230, 118, 0.25);
          border-radius: 12px;
          padding: 1.25rem 1.5rem;
          position: relative;
          transition: all 200ms cubic-bezier(0.23, 1, 0.32, 1);
        }

        @media (min-width: 768px) {
          .sticky-progress-card {
            border-radius: 16px;
            padding: 1.5rem 1.75rem;
          }
        }

        .task-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          margin-top: 1rem;
          width: 100%;
        }

        .progress-task-btn {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 0.65rem 0.9rem;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(28, 56, 40, 0.5);
          border-radius: 8px;
          cursor: pointer;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 0.8rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          position: relative;
          overflow: hidden;
          transition: all 200ms cubic-bezier(0.23, 1, 0.32, 1);
        }
        @media (min-width: 768px) {
          .progress-task-btn {
            padding: 0.75rem 1rem;
            border-radius: 10px;
            font-size: 0.85rem;
            background: rgba(0, 0, 0, 0.25);
          }
        }

        .task-arrow {
          display: inline-block;
          color: #00e676;
          margin-left: 0.5rem;
          flex-shrink: 0;
        }

        @keyframes progress-shimmer {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 200% 50%;
          }
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #00e676, #0ff884 50%, #00e676);
          background-size: 200% 100%;
          animation: progress-shimmer 2.5s linear infinite;
          border-radius: 3px;
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
            z-index: 100;
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
          width: calc(100% - 2.5rem);
          max-width: 480px;
          z-index: 100;
          display: flex;
          align-items: center;
          background: linear-gradient(135deg, rgba(11, 24, 16, 0.94) 0%, rgba(6, 13, 9, 0.98) 100%);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(28, 56, 40, 0.85);
          border-top: 1px solid rgba(0, 230, 118, 0.25);
          border-radius: 28px;
          padding: 0.65rem 0.9rem;
          box-shadow: 
            0 20px 50px rgba(0, 0, 0, 0.85),
            0 0 25px rgba(0, 230, 118, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.05);
        }

        @media (min-width: 1200px) {
          .mobile-stories-dock {
            display: none !important;
          }
        }

        .mobile-dock-carousel {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          overflow-x: auto;
          padding: 0.5rem 0.15rem;
          scrollbar-width: none;
          -ms-overflow-style: none;
          width: 100%;
        }
        .mobile-dock-carousel::-webkit-scrollbar {
          display: none;
        }

        .mobile-badge-item {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
          background: transparent;
          border: 2.5px solid transparent;
          transition: all 250ms cubic-bezier(0.23, 1, 0.32, 1);
          flex-shrink: 0;
        }

        .mobile-badge-item.is-active {
          transform: scale(1.22);
          border-color: #e4f0e8;
          box-shadow: 
            0 0 16px rgba(228, 240, 232, 0.45),
            0 8px 24px rgba(0, 0, 0, 0.5);
          z-index: 10;
        }

        .mobile-badge-inner {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #060d09;
          padding: 2.5px;
          border: 2px solid rgba(28, 56, 40, 0.85);
          transition: all 250ms ease;
        }

        .mobile-badge-inner.is-voted {
          border-color: #00e676;
          box-shadow: 0 0 8px rgba(0, 230, 118, 0.25);
        }

        .mobile-badge-inner.is-blank {
          border: 2px dashed #ff5252;
        }

        .mobile-badge-inner .badge-avatar-container {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          background: rgba(28, 56, 40, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .mobile-active-dot {
          position: absolute;
          bottom: -5px;
          left: 50%;
          transform: translateX(-50%);
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #e4f0e8;
          box-shadow: 0 0 6px #e4f0e8;
          pointer-events: none;
        }
      `}</style>
      
      {/* Header Info */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: "0.75rem",
        }}
      >
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "0.8rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#3d6e50",
          }}
        >
          Progreso de Votación
        </span>
        <div
          style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}
        >
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.6rem",
              color: "#00e676",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            {completedSteps}
          </span>
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "0.85rem",
              color: "#3d6e50",
            }}
          >
            / {totalSteps} tareas
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div
        style={{
          width: "100%",
          height: "6px",
          background: "#1c3828",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <motion.div
          animate={{ width: `${percentage}%` }}
          transition={progressTransition}
          className="progress-bar-fill"
          style={{
            boxShadow: "0 0 10px rgba(0,230,118,0.5)",
          }}
        />
      </div>

      <div className="task-list">
        <motion.button
          onClick={() => handleScrollTo("players-section")}
          variants={buttonVariants}
          custom={votedCount === totalPlayers}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          className="progress-task-btn"
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "3px",
              background: votedCount === totalPlayers ? "#00e676" : "#ff5252",
              opacity: votedCount === totalPlayers ? 0.6 : 0.4,
              transition: "background 200ms ease, opacity 200ms ease",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 5 }}>
            <TaskIndicator completed={votedCount === totalPlayers} />
            <span style={{ 
              color: votedCount === totalPlayers ? "#6ba883" : "#e4f0e8",
              transition: "color 200ms ease"
            }}>
              Calificar jugadores ({votedCount} / {totalPlayers})
            </span>
          </div>
          <motion.span variants={arrowVariants} className="task-arrow">
            <ChevronRightIcon />
          </motion.span>
        </motion.button>

        <motion.button
          onClick={() => handleScrollTo("awards-section")}
          variants={buttonVariants}
          custom={awardsComplete}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          className="progress-task-btn"
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "3px",
              background: awardsComplete ? "#00e676" : "#ff5252",
              opacity: awardsComplete ? 0.6 : 0.4,
              transition: "background 200ms ease, opacity 200ms ease",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 5 }}>
            <TaskIndicator completed={awardsComplete} />
            <span style={{ 
              color: awardsComplete ? "#6ba883" : "#e4f0e8",
              transition: "color 200ms ease"
            }}>
              Elegir los Premios de la Sesión
            </span>
          </div>
          <motion.span variants={arrowVariants} className="task-arrow">
            <ChevronRightIcon />
          </motion.span>
        </motion.button>

        <motion.button
          onClick={() => handleScrollTo("team-rating-section")}
          variants={buttonVariants}
          custom={teamRatingSaved}
          initial="initial"
          whileHover="hover"
          whileTap="tap"
          className="progress-task-btn"
        >
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "3px",
              background: teamRatingSaved ? "#00e676" : "#ff5252",
              opacity: teamRatingSaved ? 0.6 : 0.4,
              transition: "background 200ms ease, opacity 200ms ease",
            }}
          />

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 5 }}>
            <TaskIndicator completed={teamRatingSaved} />
            <span style={{ 
              color: teamRatingSaved ? "#6ba883" : "#e4f0e8",
              transition: "color 200ms ease"
            }}>
              Calificar el Rendimiento del Equipo
            </span>
          </div>
          <motion.span variants={arrowVariants} className="task-arrow">
            <ChevronRightIcon />
          </motion.span>
        </motion.button>
      </div>

      {/* --- WEB SIDEBAR CAPSULE --- */}
      {mounted && typeof document !== "undefined" && createPortal(
        <>
          <div className="voting-sidebar">
            {/* Awards Badge */}
            <div
              onClick={() => handleScrollTo("awards-section")}
              className={`sidebar-badge-item ${
                activeSectionId === "awards-section" ? "is-active" : ""
              } ${awardsComplete ? "sidebar-badge-voted" : ""}`}
            >
              {activeSectionId === "awards-section" && (
                <motion.div
                  layoutId="sidebarActiveBg"
                  className="sidebar-active-bg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="badge-avatar-container">
                <StarIcon size={16} filled={awardsComplete} style={{ color: awardsComplete ? "#ffc93c" : undefined }} />
              </div>
              
              {/* Custom Tooltip */}
              <div className="sidebar-tooltip">
                <span className="tooltip-name">Premios de la Sesión</span>
                <span className={`tooltip-status ${awardsComplete ? "status-voted" : "status-pending"}`}>
                  <span style={{ 
                    display: "inline-block", 
                    width: "5px", 
                    height: "5px", 
                    borderRadius: "50%", 
                    background: awardsComplete ? "#00e676" : "#3d6e50",
                    marginRight: "5px",
                    verticalAlign: "middle"
                  }} />
                  {awardsComplete ? "Completado" : "Pendiente"}
                </span>
              </div>

              {awardsComplete && (
                <div className="badge-overlay-icon badge-overlay-voted">
                  <CheckIcon size={8} strokeWidth={4} />
                </div>
              )}
            </div>

            {/* Player Avatars */}
            {players.map((player) => {
              const completed = isCardCompleted(player);
              const isBlank = isPlayerBlankVote(player);
              const initials = player.username ? player.username.substring(0, 2).toUpperCase() : "?";
              const isActive = activeSectionId === `player-card-${player.id}`;
              const avatarBg = getAvatarGradient(player.username || "");

              return (
                <div
                  key={player.id}
                  onClick={() => handleScrollTo(`player-card-${player.id}`)}
                  className={`sidebar-badge-item ${isActive ? "is-active" : ""} ${
                    completed ? (isBlank ? "sidebar-badge-blank" : "sidebar-badge-voted") : ""
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebarActiveBg"
                      className="sidebar-active-bg"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="badge-avatar-container" style={{ background: player.avatar_url ? undefined : avatarBg }}>
                    {player.avatar_url ? (
                      <img src={player.avatar_url} alt={player.username} className="badge-avatar-img" />
                    ) : (
                      <span className="badge-avatar-text">{initials}</span>
                    )}
                  </div>
                  
                  {/* Custom Tooltip */}
                  <div className="sidebar-tooltip">
                    <span className="tooltip-name">{player.username}</span>
                    <span className={`tooltip-status ${completed ? (isBlank ? "status-blank" : "status-voted") : "status-pending"}`}>
                      <span style={{ 
                        display: "inline-block", 
                        width: "5px", 
                        height: "5px", 
                        borderRadius: "50%", 
                        background: completed ? (isBlank ? "#ff5252" : "#00e676") : "#3d6e50",
                        marginRight: "5px",
                        verticalAlign: "middle"
                      }} />
                      {completed ? (isBlank ? "No coincidí" : "Votado") : "Pendiente"}
                    </span>
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
                </div>
              );
            })}

            {/* Team Rating Badge */}
            <div
              onClick={() => handleScrollTo("team-rating-section")}
              className={`sidebar-badge-item ${
                activeSectionId === "team-rating-section" ? "is-active" : ""
              } ${teamRatingSaved ? "sidebar-badge-voted" : ""}`}
            >
              {activeSectionId === "team-rating-section" && (
                <motion.div
                  layoutId="sidebarActiveBg"
                  className="sidebar-active-bg"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div className="badge-avatar-container">
                <StadiumIcon size={16} style={{ color: teamRatingSaved ? "#00e676" : undefined }} />
              </div>

              {/* Custom Tooltip */}
              <div className="sidebar-tooltip">
                <span className="tooltip-name">Rendimiento Equipo</span>
                <span className={`tooltip-status ${teamRatingSaved ? "status-voted" : "status-pending"}`}>
                  <span style={{ 
                    display: "inline-block", 
                    width: "5px", 
                    height: "5px", 
                    borderRadius: "50%", 
                    background: teamRatingSaved ? "#00e676" : "#3d6e50",
                    marginRight: "5px",
                    verticalAlign: "middle"
                  }} />
                  {teamRatingSaved ? "Completado" : "Pendiente"}
                </span>
              </div>

              {teamRatingSaved && (
                <div className="badge-overlay-icon badge-overlay-voted">
                  <CheckIcon size={8} strokeWidth={4} />
                </div>
              )}
            </div>
          </div>

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
