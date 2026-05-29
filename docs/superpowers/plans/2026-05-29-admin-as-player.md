# Admin User Acts as Player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow admin users to participate in matches, be voted for, vote, and have statistics tracked, while keeping them out of the player approval dashboard tab.

**Architecture:** Update `getApprovedPlayers` server action and `getAllPlayersStats` to fetch any approved profiles (admin or player role). In the frontend, separate the available match participants list from the user management approval list. Update the homepage redirection to redirect admins to the voting dashboard during active sessions.

**Tech Stack:** Next.js, React, Supabase

---

### Task 1: Update Server Actions

**Files:**
- Modify: [players.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/players.ts)
- Modify: [stats.ts](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/actions/stats.ts)

- [ ] **Step 1: Modify `getApprovedPlayers` in `players.ts`**
  Remove the `.eq("role", "player")` filter to return all approved profiles.
  ```typescript
  export async function getApprovedPlayers(): Promise<Profile[]> {
    const profile = await getCurrentProfile();

    if (!profile) {
      return [];
    }

    const { data } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("status", "approved")
      .order("created_at", { ascending: true });

    return data || [];
  }
  ```

- [ ] **Step 2: Modify `getAllPlayersStats` in `stats.ts`**
  Modify the profile fetch query to filter by `status = 'approved'` instead of `role = 'player'`.
  ```typescript
    const { data: profiles } = await supabase
      .from("profiles")
      .select(
        `
        id,
        username,
        avatar_url,
        role,
        auth_id,
        created_at,
        updated_at,
        historical_ratings (
          avg_total,
          avg_tecnica,
          avg_fisico,
          avg_actitud,
          avg_vision_juego,
          mvp_count
        )
      `,
      )
      .eq("status", "approved");
  ```

- [ ] **Step 3: Run project build to verify types**
  Run command: `npm run build`
  Expected: Builds successfully with no compilation errors.

- [ ] **Step 4: Commit**
  Run commands:
  ```bash
  git add src/actions/players.ts src/actions/stats.ts
  git commit -m "feat: allow admins in getApprovedPlayers and historical stats"
  ```

---

### Task 2: Update Homepage Redirect

**Files:**
- Modify: [page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/page.tsx)

- [ ] **Step 1: Update redirect logic in `HomePage`**
  Modify the redirect condition to allow both `'player'` and `'admin'` roles to go to `/dashboard` when there is an active session:
  ```typescript
    if (
      activeSessions.length > 0 &&
      (profile.role === "player" || profile.role === "admin") &&
      profile.status === "approved"
    ) {
      redirect("/dashboard");
    } else {
      redirect("/history");
    }
  ```

- [ ] **Step 2: Run build to verify types**
  Run command: `npm run build`
  Expected: Successful compilation.

- [ ] **Step 3: Commit**
  Run commands:
  ```bash
  git add src/app/page.tsx
  git commit -m "feat: redirect approved admins to dashboard on active sessions"
  ```

---

### Task 3: Update Admin Page Frontend

**Files:**
- Modify: [page.tsx](file:///c:/Users/tobia/Desktop/Ratings_Cotorra/src/app/admin/page.tsx)

- [ ] **Step 1: Import `getApprovedPlayers`**
  Modify imports at the top of the file:
  ```typescript
  import { getAllPlayers, approvePlayer, rejectPlayer, getApprovedPlayers } from "@/actions/players";
  ```

- [ ] **Step 2: Define `approvedPlayers` state**
  Add state and `loadApprovedPlayers` fetcher:
  ```typescript
    // ── Jugadores state ───────────────────────────────────────────────────────
    const [players, setPlayers] = useState<Profile[]>([]);
    const [playersLoaded, setPlayersLoaded] = useState(false);
    const [approvedPlayers, setApprovedPlayers] = useState<Profile[]>([]);
  ```

- [ ] **Step 3: Add `loadApprovedPlayers` and wire to `useEffect`**
  ```typescript
    useEffect(() => {
      loadSessions();
      loadPlayers();
      loadApprovedPlayers();
    }, []);

    async function loadApprovedPlayers() {
      const data = await getApprovedPlayers();
      setApprovedPlayers(data);
    }
  ```

- [ ] **Step 4: Update approval and rejection handlers to reload `approvedPlayers`**
  ```typescript
    async function handleApprove(playerId: string) {
      setLoading(true);
      const result = await approvePlayer(playerId);
      if (result.error) {
        alert("Error: " + result.error);
      } else {
        await Promise.all([loadPlayers(), loadApprovedPlayers()]);
      }
      setLoading(false);
    }

    async function handleReject(playerId: string) {
      setLoading(true);
      const result = await rejectPlayer(playerId);
      if (result.error) {
        alert("Error: " + result.error);
      } else {
        await Promise.all([loadPlayers(), loadApprovedPlayers()]);
      }
      setLoading(false);
    }
  ```

- [ ] **Step 5: Replace `approved` with `approvedPlayers` in session creation checklist**
  Find the "Jugadores Participantes" checklist block and replace `approved` references with `approvedPlayers`:
  ```typescript
                {/* Checkbox grid for selecting participants */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <label className="label-sport">Jugadores Participantes</label>
                    {approvedPlayers.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const allSelected = approvedPlayers.every(p => selectedPlayerIds.includes(p.id));
                          setSelectedPlayerIds(allSelected ? [] : approvedPlayers.map(p => p.id));
                        }}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent-lime)",
                          fontSize: "0.75rem",
                          fontFamily: "'Barlow Condensed', sans-serif",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {approvedPlayers.every(p => selectedPlayerIds.includes(p.id)) ? "Deseleccionar todos" : "Seleccionar todos"}
                      </button>
                    )}
                  </div>
                  
                  {approvedPlayers.length === 0 ? (
                    <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "0.5rem 0" }}>
                      No hay jugadores aprobados disponibles.
                    </div>
                  ) : (
                    <div
                      style={{
                        maxHeight: "160px",
                        overflowY: "auto",
                        border: "1px solid #1c3828",
                        borderRadius: "8px",
                        padding: "0.75rem",
                        background: "rgba(0,0,0,0.25)",
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                        gap: "0.5rem",
                      }}
                    >
                      {approvedPlayers.map((player) => {
                        const isChecked = selectedPlayerIds.includes(player.id);
                        return (
                          <label
                            key={player.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                              cursor: "pointer",
                              padding: "0.25rem",
                              borderRadius: "4px",
                              transition: "background 0.2s ease",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {
                                setSelectedPlayerIds((prev) =>
                                  isChecked
                                    ? prev.filter((id) => id !== player.id)
                                    : [...prev, player.id]
                                );
                              }}
                              style={{
                                accentColor: "var(--accent-lime)",
                                cursor: "pointer",
                              }}
                            />
                            <span
                              style={{
                                fontFamily: "'Barlow', sans-serif",
                                fontSize: "0.85rem",
                                color: isChecked ? "#e4f0e8" : "var(--text-muted)",
                                transition: "color 0.2s ease",
                              }}
                            >
                              {player.username}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
  ```

- [ ] **Step 6: Run build to verify compilation**
  Run command: `npm run build`
  Expected: Successful compilation without type errors.

- [ ] **Step 7: Commit**
  Run commands:
  ```bash
  git add src/app/admin/page.tsx
  git commit -m "feat: update session participants checklist to use approvedPlayers"
  ```
