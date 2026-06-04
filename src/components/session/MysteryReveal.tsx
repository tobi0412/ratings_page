"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";

interface MysteryProps {
  winnerName: string;
  allPlayers: string[];
  sessionId: string;
  currentUserId?: string;
  onComplete?: () => void;
}

export default function MysteryReveal({ winnerName, allPlayers, sessionId, currentUserId, onComplete }: MysteryProps) {
  const [isRevealed, setIsRevealed] = useState<boolean | null>(null);
  
  // Roulette State
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [highlightedPlayer, setHighlightedPlayer] = useState<string | null>(null);
  const [activeLoser, setActiveLoser] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const highlightedPlayerRef = useRef<string | null>(null);

  useEffect(() => {
    // Parent handles isAlreadyRevealed check, so on mount we always prepare to play animation
    setIsRevealed(false);
  }, []);

  useEffect(() => {
    if (isRevealed !== false) return;

    if (allPlayers.length <= 1) {
      setIsCompleted(true);
      const key = `mystery_reveal_status_${currentUserId || "guest"}_${sessionId}`;
      localStorage.setItem(key, "revealed");
      if (onComplete) onComplete();
      return;
    }

    let active = true;
    let currentEliminated = new Set<string>();

    const runRouletteLoop = async () => {
      while (active) {
        // Get list of currently active survivors
        const survivors = allPlayers.filter(p => !currentEliminated.has(p));

        if (survivors.length === 1) {
          // Only the winner remains
          setIsCompleted(true);
          setHighlightedPlayer(null);
          setActiveLoser(null);
          const key = `mystery_reveal_status_${currentUserId || "guest"}_${sessionId}`;
          localStorage.setItem(key, "revealed");
          
          // Wait 3.5 seconds to let the centering and growing animation play out
          await new Promise(r => setTimeout(r, 3500));

          if (onComplete) onComplete();
          break;
        }

        // Select a victim (must be a non-winner)
        const nonWinners = survivors.filter(p => p !== winnerName);
        const victim = nonWinners[Math.floor(Math.random() * nonWinners.length)];

        // Start cycling index
        const startIdx = highlightedPlayerRef.current ? survivors.indexOf(highlightedPlayerRef.current) : 0;
        const targetIdx = survivors.indexOf(victim);

        // Determine extra dramatic slow ticks at the end to make deceleration unpredictable.
        // If few survivors remain, we want a higher chance of longer, more tense overshooting.
        const rand = Math.random();
        let extraTicks = 0;
        if (survivors.length <= 4) {
          // When 2, 3, or 4 players remain, high chance of dramatic extra ticks (up to 3 steps)
          if (rand < 0.35) extraTicks = 1;
          else if (rand < 0.65) extraTicks = 2;
          else if (rand < 0.85) extraTicks = 3;
        } else {
          // When many players remain, lower chance of extra ticks (up to 2 steps)
          if (rand < 0.2) extraTicks = 1;
          else if (rand < 0.35) extraTicks = 2;
        }

        // Adjust target index for the fast quad-ease-out deceleration phase
        const baseTargetIdx = (targetIdx - extraTicks + survivors.length * 4) % survivors.length;
        
        // Ensure we make at least 4 rounds (or more if few survivors remain) to make the spin longer
        const rounds = Math.max(4, Math.floor(24 / survivors.length));
        const stepCount = (rounds * survivors.length) + ((baseTargetIdx - startIdx + survivors.length) % survivors.length);
        
        const minDelay = 45; // fast spin
        const maxDelay = 350; // slow stop

        // Cycle through players (fast ease-out deceleration phase)
        for (let s = 0; s <= stepCount; s++) {
          if (!active) return;
          const currentSurvivor = survivors[(startIdx + s) % survivors.length];
          setHighlightedPlayer(currentSurvivor);
          highlightedPlayerRef.current = currentSurvivor;
          
          // Quad ease-out delay formula
          const progress = s / stepCount;
          const delay = minDelay + (maxDelay - minDelay) * (progress * progress);
          await new Promise(r => setTimeout(r, delay));
        }

        // Dramatic extra slow ticks phase: slowly crawl forward step by step to the final victim
        if (extraTicks > 0) {
          for (let t = 1; t <= extraTicks; t++) {
            if (!active) return;
            const currentSurvivor = survivors[(baseTargetIdx + t) % survivors.length];
            setHighlightedPlayer(currentSurvivor);
            highlightedPlayerRef.current = currentSurvivor;
            
            // Increasingly slow and heavy tick-like delays
            const delay = 350 + (t * 180) + (Math.random() * 80);
            await new Promise(r => setTimeout(r, delay));
          }
        }

        if (!active) return;

        // Landed on victim: trigger elimination styling
        setHighlightedPlayer(null);
        highlightedPlayerRef.current = null;
        setActiveLoser(victim);
        await new Promise(r => setTimeout(r, 700)); // Show red elimination flash for 700ms
        
        if (!active) return;

        // Eliminate victim
        currentEliminated.add(victim);
        setEliminated(new Set(currentEliminated));
        setActiveLoser(null);

        // Pause briefly before starting the next spin
        await new Promise(r => setTimeout(r, 500));
      }
    };

    runRouletteLoop();

    return () => {
      active = false;
    };
  }, [isRevealed, allPlayers, winnerName, sessionId, currentUserId, onComplete]);

  // Avoid SSR hydration mismatch
  if (isRevealed === null) {
    return (
      <div className="w-full flex items-center justify-center p-8">
        <span className="text-sm font-semibold text-[#3d6e50] animate-pulse uppercase tracking-wider">Cargando sorteo...</span>
      </div>
    );
  }

  // Determine which players to display (if completed, only display the winner name card)
  const playersToRender = isCompleted ? [winnerName] : allPlayers;

  return (
    <div className="w-full flex flex-col items-center justify-center select-none py-2 animate-fade-in">
      <h3 className="font-sans text-xs font-bold tracking-widest text-[#3d6e50] uppercase mb-5">
        {isCompleted ? "JUGADOR SELECCIONADO" : "RULETA DE ELIMINACIÓN VOTO MISTERIOSO"}
      </h3>

      <motion.div
        layout
        className={isCompleted ? "flex justify-center items-center w-full min-h-[100px] mb-4" : "grid grid-cols-2 sm:grid-cols-3 gap-3 w-full max-w-xl mb-4"}
      >
        {playersToRender.map((player) => {
          const isEliminated = eliminated.has(player);
          const isHighlighted = highlightedPlayer === player;
          const isLoser = activeLoser === player;
          const isWinner = player === winnerName;
          
          let cardStyle = "bg-black/25 border-[#1c3828] text-[#e4f0e8] hover:border-[#1c3828]/60";
          
          if (isCompleted && isWinner) {
            cardStyle = "bg-[#00e676]/10 border-[#00e676] text-[#00e676] font-black italic rounded-xl px-12 py-4 text-center text-3xl shadow-[0_0_25px_rgba(0,230,118,0.3)]";
          } else if (isEliminated) {
            cardStyle = "bg-transparent border-transparent text-[#3d6e50]/40 opacity-15 scale-95 pointer-events-none";
          } else if (isLoser) {
            cardStyle = "bg-red-500/10 border-red-500/60 text-red-500 scale-95 opacity-50 line-through";
          } else if (isHighlighted) {
            cardStyle = "border-[var(--accent-gold)] text-[var(--accent-gold)] font-bold scale-105 shadow-[0_0_15px_rgba(255,201,60,0.25)] bg-[var(--accent-gold-soft)]";
          }

          return (
            <motion.div
              key={player}
              layout
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              className={isCompleted ? "flex justify-center" : "w-full"}
            >
              <motion.div
                animate={isCompleted && isWinner ? {
                  scale: [1.1, 1.16, 1.1],
                } : isHighlighted ? {
                  scale: [1, 1.08, 1],
                } : undefined}
                transition={isCompleted && isWinner ? {
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : isHighlighted ? {
                  duration: 0.4,
                  repeat: Infinity,
                  ease: "easeInOut"
                } : undefined}
                className={`border rounded-lg p-2.5 text-center text-xs font-semibold font-sans tracking-wide transition-colors duration-300 ${isCompleted ? "" : "w-full"} ${cardStyle}`}
                style={isCompleted && isWinner ? { textShadow: "0 0 15px rgba(0, 230, 118, 0.4)" } : undefined}
              >
                {player}
              </motion.div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
