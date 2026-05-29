# Design: Session Participants and Voting Restrictions

Allow admins to specify which players took part in a match session when creating it. Use this participant list to restrict who can vote on that session, and who can be voted for.

## Requirements

1. **Admin Session Creation**: When creating a session, the admin chooses from the approved players who participated in the match.
2. **Voting Restrictions**: 
   - Only players who participated in the match can vote on the session.
   - Players can only vote on other players who also participated in the match.
   - Non-participating players will see a friendly message on the dashboard indicating they cannot vote because they did not participate.
3. **Historical Ratings**: Aggregation of historical ratings is filtered to only calculate averages for players who participated in the match.

---

## Database Changes

We will create a new table `session_participants` and update the RLS policies and functions in a new migration: `005_add_session_participants.sql`.

### 1. New Table: `session_participants`
Junction table mapping match sessions to players who participated.

```sql
CREATE TABLE session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_match_player UNIQUE(match_id, player_id)
);

-- Indexes for joins and lookups
CREATE INDEX idx_session_participants_match ON session_participants(match_id);
CREATE INDEX idx_session_participants_player ON session_participants(player_id);
```

### 2. Row Level Security on `session_participants`
- **SELECT**: Any authenticated user can read who participated.
- **ALL (Insert/Delete)**: Only admins can manage participants.

```sql
ALTER TABLE session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated read session participants"
  ON session_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admin manages session participants"
  ON session_participants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE auth_id = (SELECT auth.uid()) AND role = 'admin'
    )
  );
```

### 3. Restrict Voting via `ratings` RLS Policies
Update the `ratings` insert and update policies to require that both `voter_id` and `receiver_id` are in `session_participants` for that match.

```sql
DROP POLICY IF EXISTS "Players vote for others in active sessions" ON ratings;

CREATE POLICY "Players vote for others in active sessions"
  ON ratings FOR INSERT
  TO authenticated
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = (SELECT auth.uid()))
    AND voter_id != receiver_id
    AND (SELECT status FROM profiles WHERE auth_id = (SELECT auth.uid())) = 'approved'
    AND EXISTS (
      SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true
    )
    -- Both voter and receiver must be participants of the match
    AND EXISTS (
      SELECT 1 FROM session_participants
      WHERE match_id = ratings.match_id AND player_id = ratings.voter_id
    )
    AND EXISTS (
      SELECT 1 FROM session_participants
      WHERE match_id = ratings.match_id AND player_id = ratings.receiver_id
    )
  );
```

### 4. Update `compute_historical_ratings` Function
Modify the query in the function so we only compute historical averages for players in `session_participants` for the given session.

```sql
CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO historical_ratings (
    player_id, match_id,
    avg_tecnica, avg_fisico, avg_actitud, avg_vision_juego,
    avg_total, mvp_count
  )
  SELECT
    p.id,
    session_id,
    ROUND(AVG(r.tecnica)::NUMERIC, 2),
    ROUND(AVG(r.fisico)::NUMERIC, 2),
    ROUND(AVG(r.actitud)::NUMERIC, 2),
    ROUND(AVG(r.vision_juego)::NUMERIC, 2),
    ROUND(AVG((r.tecnica + r.fisico + r.actitud + r.vision_juego)::NUMERIC / 4), 2),
    COUNT(CASE WHEN r.is_mvp THEN 1 END)
  FROM session_participants sp
  JOIN profiles p ON p.id = sp.player_id
  LEFT JOIN ratings r ON r.receiver_id = p.id AND r.match_id = session_id
  WHERE sp.match_id = session_id
  GROUP BY p.id
  ON CONFLICT (player_id, match_id) DO UPDATE SET
    avg_tecnica      = EXCLUDED.avg_tecnica,
    avg_fisico       = EXCLUDED.avg_fisico,
    avg_actitud      = EXCLUDED.avg_actitud,
    avg_vision_juego = EXCLUDED.avg_vision_juego,
    avg_total        = EXCLUDED.avg_total,
    mvp_count        = EXCLUDED.mvp_count,
    computed_at      = NOW();
END;
$$ LANGUAGE plpgsql;
```

---

## Server Actions

We will modify/add actions in `src/actions/sessions.ts`.

### 1. `createSession(name: string, playerIds: string[])`
Inserts a new match session and links the chosen players. Handles cleanup if participant insertion fails.

```typescript
export async function createSession(name: string, playerIds: string[]) {
  const supabase = createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can create sessions" };
  }

  if (!playerIds || playerIds.length === 0) {
    return { error: "Deberías seleccionar al menos un jugador para la sesión." };
  }

  // Close any active session
  await supabase
    .from("match_sessions")
    .update({ is_active: false, closed_at: new Date().toISOString() })
    .eq("is_active", true);

  // Insert match session
  const { data: sessionData, error: sessionError } = await supabase
    .from("match_sessions")
    .insert({
      name,
      created_by: profile.id,
      is_active: true,
    })
    .select()
    .single();

  if (sessionError) {
    return { error: sessionError.message };
  }

  // Insert participants
  const participants = playerIds.map((playerId) => ({
    match_id: sessionData.id,
    player_id: playerId,
  }));

  const { error: participantsError } = await supabase
    .from("session_participants")
    .insert(participants);

  if (participantsError) {
    // Cleanup
    await supabase.from("match_sessions").delete().eq("id", sessionData.id);
    return { error: participantsError.message };
  }

  return { data: sessionData, success: true };
}
```

### 2. `getSessionParticipants(sessionId: string)`
Fetches the participant profiles for a given session.

```typescript
export async function getSessionParticipants(sessionId: string): Promise<Profile[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("session_participants")
    .select("player:profiles(*)")
    .eq("match_id", sessionId);

  if (!data) return [];
  return data.map((d: any) => d.player).filter(Boolean) as Profile[];
}
```

---

## Frontend Changes

### 1. Admin Page (`src/app/admin/page.tsx`)
- Load all players in the initial `useEffect` so approved players are ready.
- Add `selectedPlayerIds` state (`string[]`).
- In the "Nueva Sesión" form, add a checklist UI for approved players.
- Include a "Seleccionar todos" helper button.
- Pass `selectedPlayerIds` to `createSession`.

### 2. Dashboard Page (`src/app/dashboard/page.tsx`)
- Call `getSessionParticipants(activeSession.id)` to load participants.
- Check if the current user is a participant.
- If not a participant: set `isParticipant` state to `false` and show the "No participaste en este partido" card instead of the voting grid.
- If a participant: filter the list of voting cards to display only other session participants.

---

## Verification Plan

### Automated Verification
- Verify database migrations apply correctly.
- Verify backend server build and type safety.

### Manual UI Flow Test
1. **Admin Creates Session**:
   - Go to Admin Panel -> Sesiones.
   - Fill session name, select a subset of approved players (e.g. Player A, Player B), and click "Crear".
   - Verify the session is created successfully.
2. **Dashboard Restricted Voting**:
   - Log in as Player A (who played):
     - Verify they see Player B as the only player they can vote on.
     - Verify they can successfully submit a vote.
   - Log in as Player C (who did not play):
     - Verify they see the message: "No participaste en este partido, por lo que no podés votar."
