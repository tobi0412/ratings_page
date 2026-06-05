# Mystery Vote Team Rating Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retrieve and display the team performance rating submitted by the mystery player inside the Mystery Vote reveal list, maintaining fully responsive styles.

**Architecture:** Extend the `revealMysteryVote` server action to query the `team_ratings` table for the match and voter. Update state, interfaces, and render a dedicated dynamic item in `MysteryVoteWidget` with custom sports-tier colors and text matching existing ratings thresholds.

**Tech Stack:** Next.js (App Router), Supabase (PostgreSQL), TypeScript, Vanilla CSS

---

### Task 1: Update Server Action

**Files:**
- Modify: `src/actions/sessions.ts`

- [ ] **Step 1: Modify `revealMysteryVote` action**
  Update `revealMysteryVote` in `src/actions/sessions.ts` to query the `team_ratings` table for the mystery player's rating in the session.
  
  Code replacement block:
  ```typescript
  // 3. Fetch votes cast by this mystery player
  const { data: votes, error: votesError } = await supabase
    .from("ratings")
    .select("*, receiver:profiles!ratings_receiver_id_fkey(*)")
    .eq("match_id", sessionId)
    .eq("voter_id", mysteryPlayerId);

  if (votesError) {
    return { error: votesError.message };
  }

  // 4. Fetch the team rating submitted by the mystery player
  const { data: teamRatingData, error: teamRatingError } = await supabase
    .from("team_ratings")
    .select("rating")
    .eq("match_id", sessionId)
    .eq("voter_id", mysteryPlayerId)
    .maybeSingle();

  return { 
    voter: voterProfile, 
    votes: votes || [],
    teamRating: teamRatingData ? Number(teamRatingData.rating) : null
  };
  ```

- [ ] **Step 2: Verify code compiling**
  Run typescript type checking to make sure everything compiles fine.
  Run command: `npx tsc --noEmit`
  Expected output: Compilation success (no errors).

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add src/actions/sessions.ts
  git commit -m "feat: fetch team rating in revealMysteryVote server action"
  ```

---

### Task 2: Update Component State and Interfaces in `MysteryVoteWidget`

**Files:**
- Modify: `src/components/session/MysteryVoteWidget.tsx`

- [ ] **Step 1: Add types and state for `teamRating`**
  Import `CotorraLogoIcon` and update `MysteryVoteWidget.tsx` to handle the `teamRating` returned by `revealMysteryVote`.
  
  Add `CotorraLogoIcon` import at the top:
  ```typescript
  import { StarIcon, SpyIcon, PaperIcon, PoopIcon, CotorraLogoIcon } from "@/components/Icons";
  ```
  
  Add `teamRating` to state hooks:
  ```typescript
  const [teamRating, setTeamRating] = useState<number | null>(null);
  ```

  Inside `handleReveal`:
  ```typescript
      if ("error" in result && result.error) {
        setError(result.error);
      } else if ("voter" in result && result.voter) {
        setVoter(result.voter);
        setVotes(result.votes as any[]);
        setTeamRating((result as any).teamRating ?? null);
  ```

- [ ] **Step 2: Verify TS compiles**
  Run: `npx tsc --noEmit`
  Expected output: Compilation success.

- [ ] **Step 3: Commit changes**
  Run:
  ```bash
  git add src/components/session/MysteryVoteWidget.tsx
  git commit -m "feat: add teamRating state to MysteryVoteWidget"
  ```

---

### Task 3: Render Team Rating Row in Mystery Vote List

**Files:**
- Modify: `src/components/session/MysteryVoteWidget.tsx`

- [ ] **Step 1: Implement getTeamRatingFeedback helper and render the special row**
  Create a feedback helper inside `MysteryVoteWidget.tsx` (or reuse one if available, but since it is self-contained let's write it in `MysteryVoteWidget.tsx` to match design spec) and render the special team rating row right above teammate ratings list.

  Add helper function right above the main `MysteryVoteWidget` export or inside:
  ```typescript
  function getTeamRatingFeedback(value: number) {
    if (value >= 9.0) {
      return { label: "SESIÓN DE ENSUEÑO", color: "#00e676" };
    }
    if (value >= 8.0) {
      return { label: "CLASE MUNDIAL", color: "#40c4ff" };
    }
    if (value >= 7.0) {
      return { label: "MUY BUENA SESIÓN", color: "#ffc93c" };
    }
    if (value >= 5.0) {
      return { label: "RENDIMIENTO REGULAR", color: "#ffab40" };
    }
    return { label: "SESIÓN PARA EL OLVIDO", color: "#ff5252" };
  }
  ```

  In the return layout, right after `<div style={{ display: "flex", flexDirection: "column", gap: "0.50rem" }}>`:
  ```tsx
          <div style={{ display: "flex", flexDirection: "column", gap: "0.50rem" }}>
            {teamRating !== null && (
              <div
                style={{
                  background: "linear-gradient(90deg, rgba(0, 230, 118, 0.08) 0%, rgba(0, 0, 0, 0.2) 100%)",
                  borderRadius: "8px",
                  border: `1px solid ${getTeamRatingFeedback(teamRating).color}33`,
                }}
                className="flex items-center justify-between p-3 sm:px-4 sm:py-3 gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "rgba(0, 230, 118, 0.15)",
                      border: "1px solid rgba(0, 230, 118, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <CotorraLogoIcon size="18px" />
                  </div>
                  <div className="flex flex-col">
                    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: "0.95rem", color: "#e4f0e8", lineHeight: 1.2 }}>
                      Rendimiento del Equipo
                    </span>
                    <span style={{ fontSize: "0.7rem", color: getTeamRatingFeedback(teamRating).color, fontWeight: 700, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                      {getTeamRatingFeedback(teamRating).label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#3d6e50] font-semibold hidden sm:inline-block uppercase tracking-wider">Valoración:</span>
                  <div
                    style={{
                      background: "#1c3828",
                      borderRadius: "6px",
                      padding: "0.2rem 0.6rem",
                      minWidth: "40px",
                      height: "30px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1rem",
                      fontWeight: 800,
                      color: getTeamRatingFeedback(teamRating).color,
                      border: `1px solid ${getTeamRatingFeedback(teamRating).color}44`,
                      fontFamily: "'Bebas Neue', sans-serif",
                    }}
                  >
                    {teamRating.toFixed(1)}
                  </div>
                </div>
              </div>
            )}
            {votes.map((vote) => (
  ```

- [ ] **Step 2: Run verification and build**
  Verify the type checking and make sure Next.js compiles without issue.
  Run: `npm run build`
  Expected output: Build success.

- [ ] **Step 3: Commit and push**
  Run:
  ```bash
  git add src/components/session/MysteryVoteWidget.tsx
  git commit -m "feat: render team performance rating row in MysteryVoteWidget"
  ```
