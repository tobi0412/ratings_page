# Prevent Awards for Blank-Voted Players Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent voters from giving MVP, Big Paper (Papelón), or Poop (Caca) awards to players they have blank-voted ("No coincidí en cancha"), both at the database/server action layer and in the UI.

**Architecture:** Enforce the validation on the backend via server actions and on the frontend via state synchronization and disabling selection in the custom award dropdown component.

**Tech Stack:** Next.js Server Actions, Supabase client-side API, React, TailwindCSS

---

### Task 1: Update Server Action `submitRating`

**Files:**
- Modify: `src/actions/ratings.ts`

- [ ] **Step 1: Modify `submitRating` to clear awards if technique rating is null**

Update the `.upsert()` call in `submitRating` to conditionally append `is_mvp: false, is_bigpaper: false, is_poop: false` if `input.tecnica === null` (which signifies a blank vote).

```typescript
// Replace lines 17-33 in src/actions/ratings.ts
  const { data, error } = await supabase
    .from("ratings")
    .upsert(
      {
        match_id: input.match_id,
        voter_id: profile.id,
        receiver_id: input.receiver_id,
        tecnica: input.tecnica,
        fisico: input.fisico,
        actitud: input.actitud,
        vision_juego: input.vision_juego,
        // Reset special awards flags if this is a blank vote
        ...(input.tecnica === null ? { is_mvp: false, is_bigpaper: false, is_poop: false } : {}),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,voter_id,receiver_id" },
    )
    .select()
    .single();
```

- [ ] **Step 2: Commit Task 1**
```bash
git add src/actions/ratings.ts
git commit -m "feat: clear awards in submitRating if technique is null (blank vote)"
```

---

### Task 2: Update Server Action `submitSessionAwards`

**Files:**
- Modify: `src/actions/ratings.ts`

- [ ] **Step 1: Check if receiver is blank-voted in `submitSessionAwards`**

Modify `saveAward` helper in `submitSessionAwards` to query `is_mvp`, `is_bigpaper`, `is_poop`, and check if the receiver has an existing blank vote (defined by `tecnica === null` and all awards flags being `false`). If they are blank-voted, throw an Error.

```typescript
// Replace lines 67-102 in src/actions/ratings.ts
  const saveAward = async (receiverId: string, awardField: "is_mvp" | "is_bigpaper" | "is_poop") => {
    if (!receiverId) return;

    // Check if a row already exists
    const { data: existing } = await supabase
      .from("ratings")
      .select("id, tecnica, is_mvp, is_bigpaper, is_poop")
      .eq("match_id", input.match_id)
      .eq("voter_id", profile.id)
      .eq("receiver_id", receiverId)
      .maybeSingle();

    if (existing) {
      // If it exists and technique is null and no award is currently set, it represents a saved blank vote
      const isBlankVote = existing.tecnica === null && !existing.is_mvp && !existing.is_bigpaper && !existing.is_poop;
      if (isBlankVote) {
        throw new Error("No es posible otorgar un premio a un jugador con el que no coincidió.");
      }

      const { error } = await supabase
        .from("ratings")
        .update({ [awardField]: true })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("ratings")
        .insert({
          match_id: input.match_id,
          voter_id: profile.id,
          receiver_id: receiverId,
          tecnica: null,
          fisico: null,
          actitud: null,
          vision_juego: null,
          is_mvp: awardField === "is_mvp",
          is_bigpaper: awardField === "is_bigpaper",
          is_poop: awardField === "is_poop",
        });
      if (error) throw error;
    }
  };
```

- [ ] **Step 2: Commit Task 2**
```bash
git add src/actions/ratings.ts
git commit -m "feat: validate and reject award assignment to blank-voted players in submitSessionAwards"
```

---

### Task 3: Sync Frontend Local State in Dashboard Page

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Reset award flags in local `myVotes` state on blank vote**

Update the `onSuccess` callback of `VotingCard` inside `DashboardPage` to check if `newRating.tecnica === null`. If it is null, reset `is_mvp`, `is_bigpaper`, and `is_poop` to `false` for that receiver in the state.

```typescript
// Replace lines 323-335 in src/app/dashboard/page.tsx
                        const exists = prev.some((v) => v.receiver_id === newRating.receiver_id);
                        if (exists) {
                          return prev.map((v) =>
                            v.receiver_id === newRating.receiver_id
                              ? {
                                  ...newRating,
                                  is_mvp: newRating.tecnica === null ? false : v.is_mvp,
                                  is_bigpaper: newRating.tecnica === null ? false : v.is_bigpaper,
                                  is_poop: newRating.tecnica === null ? false : v.is_poop,
                                }
                              : v
                          );
                        }
```

- [ ] **Step 2: Commit Task 3**
```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: sync frontend awards state in dashboard page on blank vote"
```

---

### Task 4: Disable Selection of Blank-Voted Players in Awards Dropdown

**Files:**
- Modify: `src/components/session/SessionAwardsCard.tsx`

- [ ] **Step 1: Calculate blank vote status and disable blank-voted option**

In `SessionAwardsCard`, check if a player is blank-voted based on the `initialVotes` array (`tecnica === null && !is_mvp && !is_bigpaper && !is_poop`). Gray them out, show a `(No coincidió)` badge, disable hover styles, and block the click handler.

```typescript
// Replace lines 332-394 in src/components/session/SessionAwardsCard.tsx
            {players.map((p) => {
              const isSelected = p.id === selectedId;
              const isPlayerBlank = initialVotes.some(
                (v) => v.receiver_id === p.id && v.tecnica === null && !v.is_mvp && !v.is_bigpaper && !v.is_poop
              );

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    if (isPlayerBlank) return;
                    handleSelect(p.id);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.5rem 0.65rem",
                    borderRadius: "6px",
                    cursor: isPlayerBlank ? "not-allowed" : "pointer",
                    background: isSelected ? `${color}15` : "transparent",
                    opacity: isPlayerBlank ? 0.4 : 1,
                    transition: "background-color 160ms cubic-bezier(0.23, 1, 0.32, 1), transform 160ms cubic-bezier(0.23, 1, 0.32, 1)",
                  }}
                  onMouseEnter={(e) => {
                    if (isPlayerBlank) return;
                    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                      e.currentTarget.style.background = isSelected ? `${color}25` : "rgba(0, 230, 118, 0.08)";
                      e.currentTarget.style.transform = "translateX(3px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isPlayerBlank) return;
                    e.currentTarget.style.background = isSelected ? `${color}15` : "transparent";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  <div
                    style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: isSelected ? `${color}25` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${isSelected ? color : "rgba(255,255,255,0.1)"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Bebas Neue', sans-serif",
                      fontSize: "0.75rem",
                      color: isSelected ? color : "var(--text-muted)",
                      overflow: "hidden",
                      flexShrink: 0
                    }}
                  >
                    {p.avatar_url ? (
                      <img src={p.avatar_url} alt={p.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      p.username?.[0]?.toUpperCase() ?? "?"
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontWeight: 600,
                      fontSize: "0.92rem",
                      color: isSelected ? color : "#e4f0e8",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.4rem"
                    }}
                  >
                    <span>{p.username}</span>
                    {isPlayerBlank && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 700,
                          color: "var(--accent-red)",
                          background: "var(--accent-red-soft)",
                          border: "1px solid rgba(255, 82, 82, 0.2)",
                          padding: "0.1rem 0.35rem",
                          borderRadius: "4px",
                          textTransform: "uppercase",
                          letterSpacing: "0.03em"
                        }}
                      >
                        No coincidió
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
```

- [ ] **Step 2: Commit Task 4**
```bash
git add src/components/session/SessionAwardsCard.tsx
git commit -m "feat: disable selection of blank-voted players in dropdown with No coincidió label"
```
