"use client";

import { motion, useReducedMotion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import { Profile, Rating } from "@/types";
import { StarIcon, StadiumIcon, CheckIcon } from "@/components/Icons";

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

export default function VotingProgress({
  players,
  myVotes,
  awardsComplete,
  teamRatingSaved,
}: VotingProgressProps) {
  const totalPlayers = players.length;

  const isCardCompleted = (player: Profile) => {
    const vote = myVotes.find((v) => v.receiver_id === player.id);
    if (!vote) return false;
    if (vote.tecnica !== null) return true;
    if (!vote.is_mvp && !vote.is_bigpaper && !vote.is_poop) return true;
    return false;
  };

  const votedCount = players.filter(isCardCompleted).length;
  const totalSteps = totalPlayers + 2; // players + awards + team rating
  const completedSteps = votedCount + (awardsComplete ? 1 : 0) + (teamRatingSaved ? 1 : 0);
  const percentage = totalSteps > 0 ? Math.floor((completedSteps / totalSteps) * 100) : 0;
  
  const tasksCompletedCount = (votedCount === totalPlayers ? 1 : 0) + (awardsComplete ? 1 : 0) + (teamRatingSaved ? 1 : 0);
  const allTasksCompleted = tasksCompletedCount === 3;

  const shouldReduceMotion = useReducedMotion();
  const progressTransition = shouldReduceMotion
    ? { duration: 0 }
    : ({ type: "spring", stiffness: 100, damping: 20 } as const);

  // Scroll tracking to show floating actions
  const { scrollY } = useScroll();
  const [showStickyFills, setShowStickyFills] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    // Show sticky mini progress line and mobile pill on scroll
    if (latest > 180) {
      setShowStickyFills(true);
    } else {
      setShowStickyFills(false);
    }
  });
  const [dockVisible, setDockVisible] = useState(false);
  const lastScrollY = useRef(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 180) {
      setShowStickyFills(true);
      const diff = latest - lastScrollY.current;
      if (diff > 5) {
        setDockVisible(false);
      } else if (diff < -5) {
        setDockVisible(true);
      }
    } else {
      setShowStickyFills(false);
      setDockVisible(false);
    }
    lastScrollY.current = latest;
  });

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

  const getNextPendingElementId = () => {
    if (!awardsComplete) {
      return "awards-section";
    }
    
    const incompletePlayer = players.find(p => !isCardCompleted(p));
    if (incompletePlayer) {
      return `player-card-${incompletePlayer.id}`;
    }

    if (!teamRatingSaved) {
      return "team-rating-section";
    }

    return null;
  };

  const nextPendingId = getNextPendingElementId();
  let nextLabel = "Siguiente";
  if (nextPendingId === "awards-section") {
    nextLabel = "Premios";
  } else if (nextPendingId === "team-rating-section") {
    nextLabel = "Equipo";
  } else if (nextPendingId?.startsWith("player-card-")) {
    const pId = nextPendingId.replace("player-card-", "");
    const player = players.find(p => p.id === pId);
    nextLabel = player ? player.username.split(" ")[0] : "Jugador";
  }

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

          /* Keep wrapper relative so the card does not stick and crowd the screen */
          .sticky-progress-wrapper {
            position: relative;
            margin-bottom: 1.25rem;
          }
          @media (min-width: 768px) {
            .sticky-progress-wrapper {
              position: relative;
              margin-bottom: 1.5rem;
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

          .voting-dock-container {
            background: linear-gradient(135deg, rgba(11, 24, 16, 0.9) 0%, rgba(6, 13, 9, 0.95) 100%);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(0, 230, 118, 0.25);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 230, 118, 0.05);
            border-radius: 16px;
            padding: 0.75rem 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            overflow: hidden;
          }

          .dock-top-progress {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: #1c3828;
          }

          .dock-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            width: 100%;
          }

          .dock-stats {
            display: flex;
            flex-direction: column;
            flex-shrink: 0;
          }

          .dock-stats-num {
            font-family: 'Bebas Neue', sans-serif;
            font-size: 1.4rem;
            color: #00e676;
            line-height: 1;
          }

          .dock-stats-label {
            font-family: 'Barlow Condensed', sans-serif;
            font-size: 0.65rem;
            color: #3d6e50;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          .dock-scroll-area {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            overflow-x: auto;
            padding: 0.25rem 0;
            scrollbar-width: none;
            -ms-overflow-style: none;
            flex-grow: 1;
            justify-content: center;
          }
          .dock-scroll-area::-webkit-scrollbar {
            display: none;
          }

          .dock-badge {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Bebas Neue', sans-serif;
            font-size: 0.9rem;
            cursor: pointer;
            position: relative;
            flex-shrink: 0;
            transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }

          .dock-badge-pending {
            border: 1px solid #1c3828;
            background: rgba(0, 0, 0, 0.4);
            color: #3d6e50;
            opacity: 0.6;
          }
          .dock-badge-pending:hover {
            border-color: rgba(0, 230, 118, 0.4);
            color: #e4f0e8;
            opacity: 0.9;
            scale: 1.05;
          }

          .dock-badge-completed {
            border: 1.5px solid #00e676;
            background: rgba(0, 230, 118, 0.12);
            color: #00e676;
            box-shadow: 0 0 10px rgba(0, 230, 118, 0.15);
          }
          .dock-badge-completed:hover {
            scale: 1.05;
            box-shadow: 0 0 12px rgba(0, 230, 118, 0.3);
          }

          .dock-badge-checkmark {
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #00e676;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #060d09;
            border: 1px solid #060d09;
          }

          .dock-btn-next {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            padding: 0.5rem 0.75rem;
            background: #00e676;
            color: #040a06;
            border: none;
            border-radius: 8px;
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 700;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            cursor: pointer;
            transition: all 0.2s ease;
            flex-shrink: 0;
          }
          .dock-btn-next:hover {
            background: #1ded87;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 230, 118, 0.3);
          }
          .dock-btn-next:active {
            transform: translateY(0);
          }

          .dock-btn-complete {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.35rem;
            padding: 0.5rem 0.75rem;
            background: rgba(0, 230, 118, 0.15);
            color: #00e676;
            border: 1px solid rgba(0, 230, 118, 0.3);
            border-radius: 8px;
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 700;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            flex-shrink: 0;
          }

          @media (max-width: 640px) {
            .dock-stats {
              display: none;
            }
            .dock-btn-next, .dock-btn-complete {
              padding: 0.45rem 0.6rem;
              font-size: 0.7rem;
            }
            .dock-scroll-area {
              justify-content: flex-start;
            }
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
          {/* Left Edge Status strip */}
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
          {/* Left Edge Status strip */}
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
          {/* Left Edge Status strip */}
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

      {/* Floating Action & Navigation Dock */}
      <AnimatePresence>
        {showStickyFills && (
          <motion.div
            initial={{ y: 100, x: "-50%", opacity: 0 }}
            animate={{ 
              y: dockVisible ? 0 : 120, 
              opacity: dockVisible ? 1 : 0 
            }}
            exit={{ y: 100, x: "-50%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            style={{
              position: "fixed",
              bottom: "1.5rem",
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 1000,
              width: "calc(100% - 2.5rem)",
              maxWidth: "680px",
            }}
            className="voting-dock-container"
          >
            {/* Top Progress Line */}
            <div className="dock-top-progress">
              <motion.div
                animate={{ width: `${percentage}%` }}
                transition={progressTransition}
                className="progress-bar-fill"
                style={{
                  boxShadow: "0 0 10px rgba(0,230,118,0.5)",
                }}
              />
            </div>

            {/* Main Dock Content */}
            <div className="dock-content">
              
              {/* Stats */}
              <div className="dock-stats">
                <span className="dock-stats-num">{completedSteps} / {totalSteps}</span>
                <span className="dock-stats-label">Tareas</span>
              </div>

              {/* Horizontal Indicators / Quick-Jump badges */}
              <div className="dock-scroll-area">
                {/* Awards Badge */}
                <div
                  onClick={() => handleScrollTo("awards-section")}
                  title="Premios de la Sesión"
                  className={`dock-badge ${
                    awardsComplete 
                      ? "dock-badge-completed" 
                      : "dock-badge-pending"
                  }`}
                >
                  <StarIcon size={14} filled={awardsComplete} style={{ color: awardsComplete ? "#ffc93c" : undefined }} />
                  {awardsComplete && (
                    <div className="dock-badge-checkmark">
                      <CheckIcon size={8} strokeWidth={4} />
                    </div>
                  )}
                </div>

                {/* Player Badges */}
                {players.map((player) => {
                  const completed = isCardCompleted(player);
                  const initials = player.username ? player.username.substring(0, 2).toUpperCase() : "?";
                  return (
                    <div
                      key={player.id}
                      onClick={() => handleScrollTo(`player-card-${player.id}`)}
                      title={player.username}
                      className={`dock-badge ${
                        completed 
                          ? "dock-badge-completed" 
                          : "dock-badge-pending"
                      }`}
                    >
                      {initials}
                      {completed && (
                        <div className="dock-badge-checkmark">
                          <CheckIcon size={8} strokeWidth={4} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Team Rating Badge */}
                <div
                  onClick={() => handleScrollTo("team-rating-section")}
                  title="Rendimiento del Equipo"
                  className={`dock-badge ${
                    teamRatingSaved 
                      ? "dock-badge-completed" 
                      : "dock-badge-pending"
                  }`}
                >
                  <StadiumIcon size={14} style={{ color: teamRatingSaved ? "#00e676" : undefined }} />
                  {teamRatingSaved && (
                    <div className="dock-badge-checkmark">
                      <CheckIcon size={8} strokeWidth={4} />
                    </div>
                  )}
                </div>
              </div>

              {/* CTA Action button */}
              {allTasksCompleted ? (
                <div className="dock-btn-complete animate-pulse">
                  <CheckIcon size={12} strokeWidth={3} />
                  <span>Listo!</span>
                </div>
              ) : (
                nextPendingId && (
                  <button
                    onClick={() => handleScrollTo(nextPendingId)}
                    className="dock-btn-next"
                  >
                    <span>{nextLabel}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(90deg)" }}>
                      <path d="M5 12h14" />
                      <path d="m12 5 7 7-7 7" />
                    </svg>
                  </button>
                )
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
