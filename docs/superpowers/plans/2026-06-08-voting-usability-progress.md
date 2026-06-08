# Floating Voting Progress Dock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a floating, glassmorphic progress and navigation dock at the bottom of the voting screen that tracks voting completion and allows quick-jumping to pending sections or players.

**Architecture:** Update [page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/dashboard/page.tsx) to pass player and vote state into [VotingProgress.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/components/session/VotingProgress.tsx). Enhance `VotingProgress.tsx` to handle scroll tracking, state synchronization, and display the bottom floating navigation bar with interactive quick-jump avatar circles.

**Tech Stack:** React, Next.js, Framer Motion, CSS.

---

### Task 1: Update page.tsx to Pass Votes and Players to VotingProgress

**Files:**
- Modify: `src/app/dashboard/page.tsx:234-243`

- [x] **Step 1: Modify page.tsx invocation of VotingProgress**
  Replace the old props with `players` and `myVotes`.
  
  *Code Diff:*
  ```diff
         <div className="animate-slide-up stagger-2">
           <VotingProgress
  -          totalPlayers={totalPlayers}
  -          votedCount={votedCount}
  +          players={players}
  +          myVotes={myVotes}
             awardsComplete={awardsComplete}
             teamRatingSaved={teamRatingSaved}
           />
  ```

- [x] **Step 2: Run build build checks to confirm compilation is clean (but with TypeScript error in VotingProgress expected)**
  Run: `npm run build`
  Expected: Lint/type checking fails on `VotingProgress` since props aren't updated there yet.

- [x] **Step 3: Commit current step**
  ```bash
  git add src/app/dashboard/page.tsx
  git commit -m "refactor: update VotingProgress props invocation in dashboard page"
  ```

---

### Task 2: Update VotingProgress.tsx Interface and Core Logic

**Files:**
- Modify: `src/components/session/VotingProgress.tsx:1-135`

- [x] **Step 1: Import Types, Icons, and Update Prop Interface**
  Add imports for `Profile`, `Rating`, `StarIcon`, `StadiumIcon`, `CheckIcon`, and update the `VotingProgressProps` interface. Implement the `isCardCompleted` checking logic inside the component.

  *Code Content:*
  ```typescript
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
  ```

- [x] **Step 2: Replace props destructuring and update existing progress metrics calculations**
  Update the main function signature and calculations inside `VotingProgress.tsx`:
  
  *Code Content:*
  ```typescript
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
  ```

- [x] **Step 3: Run build build checks to confirm no type issues in new props**
  Run: `npm run build`
  Expected: Clean build or only style issues if any elements were removed.

- [x] **Step 4: Commit current step**
  ```bash
  git add src/components/session/VotingProgress.tsx
  git commit -m "feat: update VotingProgress props interface and basic metrics logic"
  ```

---

### Task 3: Implement Dock Styling and Interactive Layout in VotingProgress.tsx

**Files:**
- Modify: `src/components/session/VotingProgress.tsx:136-532`

- [x] **Step 1: Add Dock and Navigation Styles to Component `<style>` block**
  Add the complete CSS rules for the floating progress dock, list scroll, quick-jump badges, tooltip, next buttons, and mobile overrides.

  *Code Content to append to `<style>`:*
  ```css
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
  ```

- [x] **Step 2: Add Logic for Scroll-Direction Tracking and Dock Auto-Hide**
  Implement scroll delta calculation and the side-effect to temporarily show the dock when votes updates are registered.
  
  *Code Content:*
  ```typescript
    const shouldReduceMotion = useReducedMotion();
    const progressTransition = shouldReduceMotion
      ? { duration: 0 }
      : ({ type: "spring", stiffness: 100, damping: 20 } as const);

    const { scrollY } = useScroll();
    const [showStickyFills, setShowStickyFills] = useState(false);
    const [dockVisible, setDockVisible] = useState(false);
    const lastScrollY = useRef(0);

    useMotionValueEvent(scrollY, "change", (latest) => {
      if (latest > 180) {
        setShowStickyFills(true);
        const diff = latest - lastScrollY.current;
        if (diff > 5) {
          setDockVisible(false); // hide on scroll down
        } else if (diff < -5) {
          setDockVisible(true); // show on scroll up
        }
      } else {
        setShowStickyFills(false);
        setDockVisible(false);
      }
      lastScrollY.current = latest;
    });

    // Auto-reveal dock briefly when a vote count increases
    const prevVotedCount = useRef(votedCount);
    useEffect(() => {
      if (votedCount !== prevVotedCount.current) {
        if (scrollY.get() > 180) {
          setDockVisible(true);
        }
        prevVotedCount.current = votedCount;
      }
    }, [votedCount, scrollY]);
  ```

- [x] **Step 3: Implement Scroll Helper and Next Pending Navigation Resolver**
  Write calculations for scrolling to different element IDs.
  
  *Code Content:*
  ```typescript
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
    let nextLabel = "";
    if (nextPendingId === "awards-section") {
      nextLabel = "Premios";
    } else if (nextPendingId === "team-rating-section") {
      nextLabel = "Equipo";
    } else if (nextPendingId?.startsWith("player-card-")) {
      const pId = nextPendingId.replace("player-card-", "");
      const player = players.find(p => p.id === pId);
      nextLabel = player ? player.username.split(" ")[0] : "Jugador";
    }
  ```

- [x] **Step 4: Render the Glassmorphic Dock UI**
  Replace the old sticky progress bar & mobile floating pill with the unified floating bottom dock.
  
  *Code Content (to replace return statements from line 445 onwards):*
  ```tsx
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
  ```

- [x] **Step 5: Run npm run build build compilation test**
  Run: `npm run build`
  Expected: Clean compilation with 0 errors.

- [x] **Step 6: Commit current step**
  ```bash
  git add src/components/session/VotingProgress.tsx
  git commit -m "feat: replace old sticky bar with full glassmorphic bottom navigation dock"
  ```
