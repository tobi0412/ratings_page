# Floating Voting Progress Dock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a responsive navigation system containing a fixed vertical sidebar (Web, >=1200px) and a bottom horizontal stories dock (Mobile, <1200px) to improve usability during the match voting flow.

**Architecture:** Update [VotingProgress.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingProgress.tsx) to implement an `IntersectionObserver` to track the active section in view. Update the component layout to render a static header progress card, a fixed desktop vertical sidebar capsule on the right side of the screen, and a floating horizontal carousel dock at the bottom of mobile screens.

**Tech Stack:** React, Next.js, Framer Motion, CSS.

---

### Task 1: Add Responsive Page Wrapper Layout in page.tsx

**Files:**
- Modify: `src/app/dashboard/page.tsx:182-380`

- [ ] **Step 1: Check and ensure page layout wraps contents correctly**
  Open [page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/dashboard/page.tsx) and ensure the container doesn't overflow or clip the right sidebar on wide viewports.
  
- [ ] **Step 2: Compile and run build checks**
  Run: `npm run build`
  Expected: Clean compilation with 0 errors.

- [ ] **Step 3: Commit current step**
  ```bash
  git add src/app/dashboard/page.tsx
  git commit -m "refactor: adjust dashboard page layout config for navigation sidebar compatibility"
  ```

---

### Task 2: Implement Responsive Sidebar and Mobile Stories Dock in VotingProgress.tsx

**Files:**
- Modify: `src/components/session/VotingProgress.tsx:1-775`

- [ ] **Step 1: Replace VotingProgress.tsx content with updated component including Intersection Observer, Web Sidebar, and Mobile Carousel**
  Update [VotingProgress.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingProgress.tsx) with the new structure.

  *Code Content:*
  ```tsx
  "use client";

  import { motion, useReducedMotion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
  import { useState, useEffect, useRef } from "react";
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

  export default function VotingProgress({
    players,
    myVotes,
    awardsComplete,
    teamRatingSaved,
  }: VotingProgressProps) {
    const totalPlayers = players.length;

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
              gap: 0.75rem;
              z-index: 100;
              background: rgba(6, 13, 9, 0.6);
              backdrop-filter: blur(16px);
              border: 1px solid rgba(0, 230, 118, 0.15);
              border-radius: 99px;
              padding: 1.25rem 0.65rem;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
              align-items: center;
              transition: border-color 0.3s ease;
            }
            .voting-sidebar:hover {
              border-color: rgba(0, 230, 118, 0.35);
            }
          }

          .sidebar-badge-item {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            background: rgba(0, 0, 0, 0.4);
            border: 1.5px solid #1c3828;
            color: #3d6e50;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            font-family: 'Bebas Neue', sans-serif;
            font-size: 1.1rem;
          }
          
          .sidebar-badge-item.is-active {
            transform: scale(1.15);
            box-shadow: 0 0 14px rgba(0, 230, 118, 0.35);
            border-color: #00e676;
            color: #e4f0e8;
          }

          .sidebar-badge-item:hover {
            transform: scale(1.1);
            border-color: rgba(0, 230, 118, 0.5);
            color: #e4f0e8;
          }

          .sidebar-badge-voted {
            border-color: #00e676;
            background: rgba(0, 230, 118, 0.08);
            color: #00e676;
          }

          .sidebar-badge-blank {
            border: 1.5px dashed rgba(0, 230, 118, 0.6);
            background: rgba(0, 230, 118, 0.03);
            color: rgba(0, 230, 118, 0.65);
          }

          .badge-overlay-icon {
            position: absolute;
            bottom: -3px;
            right: -3px;
            width: 14px;
            height: 14px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid #060d09;
          }

          .badge-overlay-voted {
            background: #00e676;
            color: #060d09;
          }

          .badge-overlay-blank {
            background: #3d6e50;
            color: #e4f0e8;
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
            background: linear-gradient(135deg, rgba(11, 24, 16, 0.92) 0%, rgba(6, 13, 9, 0.96) 100%);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(0, 230, 118, 0.25);
            border-radius: 20px;
            padding: 0.6rem 0.85rem;
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.8);
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
            padding: 0.4rem 0.1rem;
            scrollbar-width: none;
            -ms-overflow-style: none;
            width: 100%;
          }
          .mobile-dock-carousel::-webkit-scrollbar {
            display: none;
          }

          .mobile-badge-item {
            width: 38px;
            height: 38px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            background: rgba(0, 0, 0, 0.4);
            border: 1px solid #1c3828;
            color: #3d6e50;
            transition: all 0.25s ease;
            flex-shrink: 0;
            font-family: 'Bebas Neue', sans-serif;
            font-size: 1rem;
          }

          .mobile-badge-item.is-active {
            border-color: #00e676;
            transform: scale(1.1);
            box-shadow: 0 0 10px rgba(0, 230, 118, 0.25);
          }

          .mobile-badge-item:hover {
            border-color: rgba(0, 230, 118, 0.4);
          }

          .status-dot-above {
            position: absolute;
            top: -6px;
            left: 50%;
            transform: translateX(-50%);
            width: 6px;
            height: 6px;
            border-radius: 50%;
            transition: background-color 0.2s ease;
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
        <div className="voting-sidebar">
          {/* Awards Badge */}
          <div
            onClick={() => handleScrollTo("awards-section")}
            title="Premios de la Sesión"
            className={`sidebar-badge-item ${
              activeSectionId === "awards-section" ? "is-active" : ""
            } ${awardsComplete ? "sidebar-badge-voted" : ""}`}
          >
            <StarIcon size={16} filled={awardsComplete} style={{ color: awardsComplete ? "#ffc93c" : undefined }} />
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

            return (
              <div
                key={player.id}
                onClick={() => handleScrollTo(`player-card-${player.id}`)}
                title={player.username}
                className={`sidebar-badge-item ${isActive ? "is-active" : ""} ${
                  completed ? (isBlank ? "sidebar-badge-blank" : "sidebar-badge-voted") : ""
                }`}
              >
                {initials}
                {completed && (
                  isBlank ? (
                    <div className="badge-overlay-icon badge-overlay-blank" title="No coincidí en cancha">
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
            title="Rendimiento del Equipo"
            className={`sidebar-badge-item ${
              activeSectionId === "team-rating-section" ? "is-active" : ""
            } ${teamRatingSaved ? "sidebar-badge-voted" : ""}`}
          >
            <StadiumIcon size={16} style={{ color: teamRatingSaved ? "#00e676" : undefined }} />
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
                y: dockVisible ? 0 : 120, 
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
                  <div
                    className="status-dot-above"
                    style={{
                      background: awardsComplete ? "#ffc93c" : "#1c3828"
                    }}
                  />
                  <StarIcon size={14} filled={awardsComplete} style={{ color: awardsComplete ? "#ffc93c" : undefined }} />
                </div>

                {/* Players */}
                {players.map((player) => {
                  const completed = isCardCompleted(player);
                  const isBlank = isPlayerBlankVote(player);
                  const initials = player.username ? player.username.substring(0, 2).toUpperCase() : "?";
                  const isActive = activeSectionId === `player-card-${player.id}`;

                  let dotColor = "#1c3828"; // Pending
                  if (completed) {
                    dotColor = isBlank ? "#ff5252" : "#00e676"; // Red/Orange-ish for skipped, lime green for voted
                  }

                  return (
                    <div
                      key={player.id}
                      onClick={() => handleScrollTo(`player-card-${player.id}`)}
                      className={`mobile-badge-item ${isActive ? "is-active" : ""}`}
                    >
                      <div
                        className="status-dot-above"
                        style={{ background: dotColor }}
                      />
                      {initials}
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
                  <div
                    className="status-dot-above"
                    style={{
                      background: teamRatingSaved ? "#00e676" : "#1c3828"
                    }}
                  />
                  <StadiumIcon size={14} style={{ color: teamRatingSaved ? "#00e676" : undefined }} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  ```

- [ ] **Step 2: Compile and run build checks**
  Run: `npm run build`
  Expected: Clean compilation with 0 errors.

- [ ] **Step 3: Commit current step**
  ```bash
  git add src/components/session/VotingProgress.tsx
  git commit -m "feat: implement responsive navigation layout with web sidebar capsule and mobile stories dock"
  ```

---

### Task 3: Visual Polish & Scrolling Enhancements (Instagram Rings & Debounce Auto-Reveal)

**Files:**
- Modify: `src/components/session/VotingProgress.tsx`

- [ ] **Step 1: Implement Scroll-End Auto-Reveal logic in VotingProgress.tsx**
  Add a `scrollTimeoutRef` to track scrolling state. Update `useMotionValueEvent(scrollY, "change", ...)` to debounce and auto-reveal the bottom dock when scrolling stops (200ms duration).

- [ ] **Step 2: Update Mobile Stories Dock Badge Styles**
  Refactor the mobile badge items. Differentiate between:
  - Active: scaled up, highlighted with a high-contrast white ring border and active indicator dot under the avatar.
  - Voted: continuous lime-green gradient border ring.
  - Skipped ("No coincidí"): dashed red-orange border ring.
  - Pending: quiet dark-green border ring.

- [ ] **Step 3: Update Web Sidebar Visuals & Active Indicator**
  Upgrade desktop sidebar capsule border, background blur, and custom tooltips.

- [ ] **Step 4: Verify the build and run checks**
  Run: `npm run build`
  Expected: Clean compilation with 0 errors.

- [ ] **Step 5: Commit changes**
  ```bash
  git add src/components/session/VotingProgress.tsx
  git commit -m "style: visual polish for voting progress sidebar and stories dock with scroll auto-reveal"
  ```
