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

  let nextTaskLabel = "";
  if (votedCount < totalPlayers) {
    nextTaskLabel = "Jugadores";
  } else if (!awardsComplete) {
    nextTaskLabel = "Premios";
  } else if (!teamRatingSaved) {
    nextTaskLabel = "Equipo";
  }

  const scrollToNextTask = () => {
    let targetId = "";
    if (votedCount < totalPlayers) {
      targetId = "players-section";
    } else if (!awardsComplete) {
      targetId = "awards-section";
    } else if (!teamRatingSaved) {
      targetId = "team-rating-section";
    }

    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
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

          .mobile-floating-pill {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.5rem 1rem;
            background: rgba(11, 24, 16, 0.92);
            backdrop-filter: blur(12px);
            border: 1.5px solid rgba(0, 230, 118, 0.35);
            border-radius: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
            color: #e4f0e8;
            font-family: 'Barlow Condensed', sans-serif;
            font-weight: 700;
            font-size: 0.8rem;
            letter-spacing: 0.05em;
            text-transform: uppercase;
            cursor: pointer;
          }
          @media (min-width: 768px) {
            .mobile-floating-pill {
              display: none;
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
          onClick={() => {
            const el = document.getElementById("players-section");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
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
          onClick={() => {
            const el = document.getElementById("awards-section");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
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
          onClick={() => {
            const el = document.getElementById("team-rating-section");
            if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
          }}
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

      {/* Sticky 3px progress bar under the navbar on scroll */}
      <AnimatePresence>
        {showStickyFills && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={{
              position: "fixed",
              top: "60px",
              left: 0,
              right: 0,
              height: "3px",
              background: "#1c3828",
              zIndex: 90,
              overflow: "hidden",
            }}
          >
            <motion.div
              animate={{ width: `${percentage}%` }}
              transition={progressTransition}
              className="progress-bar-fill"
              style={{
                boxShadow: "0 0 8px rgba(0,230,118,0.5)",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Pill for Mobile on Scroll */}
      <AnimatePresence>
        {showStickyFills && (
          <motion.div
            initial={{ y: 100, x: "-50%", opacity: 0 }}
            animate={{ y: 0, x: "-50%", opacity: 1 }}
            exit={{ y: 100, x: "-50%", opacity: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={scrollToNextTask}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            style={{
              position: "fixed",
              bottom: "1.5rem",
              left: "50%",
              zIndex: 1000,
            }}
            className="mobile-floating-pill"
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  border: `1.5px solid ${allTasksCompleted ? "#00e676" : "#ffc93c"}`,
                  background: allTasksCompleted ? "rgba(0, 230, 118, 0.1)" : "rgba(255, 201, 60, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontFamily: "'Bebas Neue', sans-serif",
                  color: allTasksCompleted ? "#00e676" : "#ffc93c",
                  transition: "all 200ms ease",
                }}
              >
                {allTasksCompleted ? "✓" : `${tasksCompletedCount}`}
              </div>
              <span style={{ whiteSpace: "nowrap" }}>
                {allTasksCompleted 
                  ? "Votación Completa" 
                  : `Siguiente: ${nextTaskLabel}`}
              </span>
            </div>
            
            {!allTasksCompleted && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00e676" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ transform: "rotate(90deg)", marginLeft: "0.15rem", flexShrink: 0 }}>
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
