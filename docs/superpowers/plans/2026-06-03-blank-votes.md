# Blank Votes Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an option to leave the vote of a player blank, and exclude blank votes from player stats/averages.

**Architecture:** Database columns for metrics in `ratings` are changed to nullable. Frontend components handle the blank option, disable metrics/MVP when blank, and calculate averages by excluding null ratings.

**Tech Stack:** React 18, Next.js 14, Supabase (PostgreSQL), TypeScript.

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/009_allow_blank_votes.sql`

- [ ] **Step 1: Create SQL migration file**

Write the following to `supabase/migrations/009_allow_blank_votes.sql`:
```sql
-- Remove NOT NULL constraint on rating columns to allow blank votes
ALTER TABLE ratings
  ALTER COLUMN tecnica DROP NOT NULL,
  ALTER COLUMN fisico DROP NOT NULL,
  ALTER COLUMN actitud DROP NOT NULL,
  ALTER COLUMN vision_juego DROP NOT NULL;
```

- [ ] **Step 2: Commit**

Run:
```bash
git add supabase/migrations/009_allow_blank_votes.sql
git commit -m "migration: allow null metrics in ratings table for blank votes"
```

---

### Task 2: Update Shared Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Make metrics nullable in Rating and RatingInput interfaces**

Modify lines 21-33 and 48-56 of `src/types/index.ts`:
```typescript
export interface Rating {
  id: string;
  match_id: string;
  voter_id: string;
  receiver_id: string;
  tecnica: number | null;
  fisico: number | null;
  actitud: number | null;
  vision_juego: number | null;
  is_mvp: boolean;
  created_at: string;
  updated_at: string;
}

export interface RatingInput {
  match_id: string;
  receiver_id: string;
  tecnica: number | null;
  fisico: number | null;
  actitud: number | null;
  vision_juego: number | null;
  is_mvp: boolean;
}
```

- [ ] **Step 2: Commit**

Run:
```bash
git add src/types/index.ts
git commit -m "types: make ratings metrics nullable in Rating and RatingInput"
```

---

### Task 3: Update Stats Action

**Files:**
- Modify: `src/actions/stats.ts`

- [ ] **Step 1: Filter out null values in player average calculations**

Replace the `avg` helper in `getAllPlayersStats` (around line 70) in `src/actions/stats.ts`:
```typescript
    const avg = (key: keyof (typeof playerRatings)[0]) => {
      const validRatings = playerRatings.filter((r) => r[key] !== null);
      const countValid = validRatings.length;
      return countValid > 0
        ? validRatings.reduce((sum, r) => sum + (Number(r[key]) || 0), 0) / countValid
        : 0;
    };
```

- [ ] **Step 2: Commit**

Run:
```bash
git add src/actions/stats.ts
git commit -m "actions: exclude null ratings from average calculation in stats action"
```

---

### Task 4: Update Voting Card Component

**Files:**
- Modify: `src/components/session/VotingCard.tsx`

- [ ] **Step 1: Add isBlank state and checkbox toggler**

Modify state declarations, `useEffect`, `avgRating` calculation, `handleSubmit`, and UI layout in `src/components/session/VotingCard.tsx`:

Add state:
```typescript
  const [isBlank, setIsBlank] = useState(existingRating?.tecnica === null);
```

Sync state in `useEffect` (around lines 53-66):
```typescript
  useEffect(() => {
    if (existingRating) {
      setMetrics({
        tecnica: existingRating.tecnica ?? 5,
        fisico: existingRating.fisico ?? 5,
        actitud: existingRating.actitud ?? 5,
        vision_juego: existingRating.vision_juego ?? 5,
      });
      setIsMvp(existingRating.is_mvp);
      setIsBlank(existingRating.tecnica === null);
      setSaved(true);
    } else {
      setSaved(false);
      setIsBlank(false);
    }
  }, [existingRating]);
```

Update `avgRating` calculation (around line 91):
```typescript
  const avgRating =
    !isBlank &&
    metrics.tecnica !== null &&
    metrics.fisico !== null &&
    metrics.actitud !== null &&
    metrics.vision_juego !== null
      ? (metrics.tecnica +
          metrics.fisico +
          metrics.actitud +
          metrics.vision_juego) /
        4
      : null;
```

Update `handleSubmit` to send nulls if blank (around line 68):
```typescript
  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const result = await submitRating({
      match_id: matchId,
      receiver_id: receiver.id,
      tecnica: isBlank ? null : metrics.tecnica,
      fisico: isBlank ? null : metrics.fisico,
      actitud: isBlank ? null : metrics.actitud,
      vision_juego: isBlank ? null : metrics.vision_juego,
      is_mvp: isBlank ? false : isMvp,
    });

    if (result.error) {
      setError(result.error);
    } else {
      setSaved(true);
      onSuccess?.(result.data);
    }
    setLoading(false);
  };
```

Update render sections:
1. Render average pill:
```tsx
        <div
          style={{
            background: "rgba(0,0,0,0.3)",
            border: `1px solid ${avgRating !== null ? getRatingColor(avgRating) : "#3d6e50"}40`,
            borderRadius: "8px",
            padding: "0.3rem 0.6rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: "1.4rem",
              color: avgRating !== null ? getRatingColor(avgRating) : "#3d6e50",
              lineHeight: 1,
            }}
          >
            {avgRating !== null ? avgRating.toFixed(2) : "—"}
          </div>
          <div
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "0.6rem",
              color: "#3d6e50",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            Prom.
          </div>
        </div>
```

2. Add Checkbox Toggler (insert before the Sliders block):
```tsx
      {/* Toggle voto en blanco */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          cursor: "pointer",
          marginBottom: "1rem",
          padding: "0.6rem 0.75rem",
          borderRadius: "8px",
          background: isBlank ? "rgba(255,82,82,0.06)" : "rgba(0,0,0,0.15)",
          border: `1px solid ${isBlank ? "rgba(255,82,82,0.25)" : "#1c3828"}`,
          transition: "all 0.2s ease",
        }}
      >
        <input
          type="checkbox"
          checked={isBlank}
          onChange={(e) => {
            const checked = e.target.checked;
            setIsBlank(checked);
            if (checked) {
              setIsMvp(false);
            }
            setSaved(false);
          }}
          style={{
            accentColor: "#ff5252",
            cursor: "pointer",
          }}
        />
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 600,
            fontSize: "0.85rem",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: isBlank ? "#ff5252" : "#a0c4ac",
          }}
        >
          No jugué con este jugador
        </span>
      </label>
```

3. Disable and style sliders if `isBlank` is active:
```tsx
      {/* Metrics */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.85rem",
          marginBottom: "1rem",
          opacity: isBlank ? 0.35 : 1,
          pointerEvents: isBlank ? "none" : "auto",
          transition: "opacity 0.2s ease",
        }}
      >
        {(["tecnica", "fisico", "actitud", "vision_juego"] as const).map(
          (metric) => (
            <div key={metric}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.35rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.78rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "#3d6e50",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.4rem",
                  }}
                >
                  {METRIC_ICONS[metric]}
                  <span>{METRIC_LABELS[metric]}</span>
                </span>
                <span
                  style={{
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: "1.1rem",
                    color: isBlank ? "#3d6e50" : getRatingColor(metrics[metric]),
                    letterSpacing: "0.04em",
                    minWidth: "28px",
                    textAlign: "right",
                  }}
                >
                  {isBlank ? "—" : metrics[metric]}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={metrics[metric]}
                disabled={isBlank}
                onChange={(e) => {
                  setMetrics({
                    ...metrics,
                    [metric]: parseInt(e.target.value),
                  });
                  setSaved(false);
                }}
              />
            </div>
          ),
        )}
      </div>
```

4. Disable MVP checkbox if `isBlank`:
```tsx
      {/* MVP toggle */}
      <label
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.65rem",
          cursor: isBlank ? "not-allowed" : "pointer",
          marginBottom: "1rem",
          padding: "0.6rem 0.75rem",
          borderRadius: "8px",
          background: isMvp ? "rgba(255,201,60,0.1)" : "rgba(0,0,0,0.2)",
          border: `1px solid ${isMvp ? "rgba(255,201,60,0.35)" : "#1c3828"}`,
          transition: "all 0.2s ease",
          opacity: isBlank ? 0.35 : 1,
        }}
      >
        <input
          type="checkbox"
          id={`mvp-${receiver.id}`}
          checked={isMvp}
          disabled={isBlank}
          onChange={(e) => {
            if (isBlank) return;
            setIsMvp(e.target.checked);
            setSaved(false);
          }}
          style={{ display: "none" }}
        />
        <StarIcon
          size="1.1rem"
          filled={isMvp}
          style={{
            color: isMvp ? "#ffc93c" : "#3d6e50",
            transition: "all 0.2s ease",
          }}
        />
        <span
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700,
            fontSize: "0.8rem",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: isMvp ? "#ffc93c" : "#3d6e50",
            transition: "color 0.2s ease",
          }}
        >
          MVP de la sesión
        </span>
      </label>
```

- [ ] **Step 2: Commit**

Run:
```bash
git add src/components/session/VotingCard.tsx
git commit -m "components: add support for blank votes UI and toggling in VotingCard"
```

---

### Task 5: Update Mystery Vote Widget

**Files:**
- Modify: `src/components/session/MysteryVoteWidget.tsx`

- [ ] **Step 1: Update average calculation and metrics displays**

Modify calculations and render blocks in `src/components/session/MysteryVoteWidget.tsx`:

Replace `averageGiven` computation (around lines 101-107):
```typescript
  let totalSum = 0;
  let totalCount = 0;

  votes.forEach((vote) => {
    if (vote.tecnica !== null) { totalSum += vote.tecnica; totalCount++; }
    if (vote.fisico !== null) { totalSum += vote.fisico; totalCount++; }
    if (vote.actitud !== null) { totalSum += vote.actitud; totalCount++; }
    if (vote.vision_juego !== null) { totalSum += vote.vision_juego; totalCount++; }
  });

  const averageGiven = totalCount > 0 ? (totalSum / totalCount).toFixed(2) : "0.00";
```

Update cell displays to show `—` when null (around lines 315-402):
```tsx
                <div className="grid grid-cols-4 sm:flex gap-2 sm:gap-2 justify-between">
                  <div className="flex flex-col items-center bg-[rgba(28,56,40,0.15)] sm:bg-transparent p-1.5 sm:p-0 rounded border border-[rgba(28,56,40,0.2)] sm:border-0">
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center block sm:hidden">TÉC</span>
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center hidden sm:block whitespace-nowrap">Hab. Téc.</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "32px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vote.tecnica !== null ? vote.tecnica : "—"}
                    </span>
                  </div>
                  
                  <div className="flex flex-col items-center bg-[rgba(28,56,40,0.15)] sm:bg-transparent p-1.5 sm:p-0 rounded border border-[rgba(28,56,40,0.2)] sm:border-0">
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center block sm:hidden">FÍS</span>
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center hidden sm:block whitespace-nowrap">Esf. Fís.</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "32px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vote.fisico !== null ? vote.fisico : "—"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center bg-[rgba(28,56,40,0.15)] sm:bg-transparent p-1.5 sm:p-0 rounded border border-[rgba(28,56,40,0.2)] sm:border-0">
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center block sm:hidden">ACT</span>
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center hidden sm:block whitespace-nowrap">Actitud</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "32px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vote.actitud !== null ? vote.actitud : "—"}
                    </span>
                  </div>

                  <div className="flex flex-col items-center bg-[rgba(28,56,40,0.15)] sm:bg-transparent p-1.5 sm:p-0 rounded border border-[rgba(28,56,40,0.2)] sm:border-0">
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center block sm:hidden">DEC</span>
                    <span style={{ fontSize: "0.58rem", color: "#3d6e50", textTransform: "uppercase", fontWeight: 700 }} className="text-center hidden sm:block whitespace-nowrap">Toma Dec.</span>
                    <span
                      style={{
                        background: "#1c3828",
                        borderRadius: "4px",
                        width: "32px",
                        height: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--accent-lime)",
                        marginTop: "0.15rem",
                      }}
                    >
                      {vote.vision_juego !== null ? vote.vision_juego : "—"}
                    </span>
                  </div>
                </div>
```

- [ ] **Step 2: Commit**

Run:
```bash
git add src/components/session/MysteryVoteWidget.tsx
git commit -m "components: handle null ratings in MysteryVoteWidget averages and display"
```

---

### Task 6: Verification

- [ ] **Step 1: Run production build to verify compilation and typescript types**

Run:
```bash
npm run build
```
Expected: The build completes successfully without TypeScript or compile errors.
