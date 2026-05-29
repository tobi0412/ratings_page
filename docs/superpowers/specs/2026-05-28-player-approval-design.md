# Player Approval Feature - Design Document

**Date:** 2026-05-28  
**Scope:** Admin approval workflow for player access  
**Status:** Approved

---

## 1. Summary

Players who register are held in a `pending` state and can only view historical data. The admin must explicitly approve them before they gain full access (voting). The admin can also reject or revoke approved players at any time.

---

## 2. Data Model Change

### **profiles — new column**

```sql
ALTER TABLE profiles
ADD COLUMN status TEXT NOT NULL
  CHECK (status IN ('pending', 'approved', 'rejected'))
  DEFAULT 'pending';
```

All new registrations default to `'pending'`. The migration also runs `UPDATE profiles SET status = 'approved' WHERE role = 'admin'` so the existing admin account is not locked out.

### **Status transitions**

| From | To | Triggered by |
|------|----|--------------|
| `pending` | `approved` | Admin approves |
| `pending` | `rejected` | Admin rejects |
| `approved` | `rejected` | Admin revokes |
| `rejected` | `approved` | Admin rehabilitates |

### **TypeScript type update**

```ts
export interface Profile {
  // existing fields...
  status: 'pending' | 'approved' | 'rejected';
}
```

---

## 3. RLS Policy Update

The existing `ratings` INSERT policy gains an additional condition to prevent non-approved players from voting at the database level:

```sql
-- Updated policy: Players vote for others in active sessions
CREATE POLICY "Players vote for others in active sessions"
  ON ratings FOR INSERT
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND voter_id != receiver_id
    AND (SELECT is_active FROM match_sessions WHERE id = match_id) = true
    AND (SELECT status FROM profiles WHERE auth_id = auth.uid()) = 'approved'
  );
```

---

## 4. Application Flow

### **Registration**
No code changes needed. The `DEFAULT 'pending'` on the `status` column ensures all new players start as pending automatically.

### **Home redirect logic (`/page.tsx`)**

```
Authenticated user lands on /
  ├─ status = 'approved' AND active session exists → /dashboard (can vote)
  ├─ status = 'approved' AND no active session    → /history
  ├─ status = 'pending'                           → /history (view only)
  └─ status = 'rejected'                          → /history (view only)
```

`pending` and `rejected` players always land on `/history`. They receive no special error page — they simply cannot access the voting dashboard. The distinction between `pending` and `rejected` is not surfaced to the player in this iteration.

### **Voting dashboard (`/dashboard`)**
No access-control code needed beyond the redirect above — the RLS policy acts as a second layer of enforcement.

---

## 5. Server Actions

New file: `src/actions/players.ts`

| Action | Description | Client used |
|--------|-------------|-------------|
| `getPlayersByStatus(status)` | Fetch players filtered by status | `supabaseAdmin` |
| `approvePlayer(playerId)` | Set `status = 'approved'` | `supabaseAdmin` |
| `rejectPlayer(playerId)` | Set `status = 'rejected'` | `supabaseAdmin` |

`supabaseAdmin` is used (already exists in `src/lib/supabase.ts`) to bypass RLS when the admin modifies other users' profiles.

All actions return `{ error?: string }` consistent with existing patterns in the codebase.

---

## 6. Admin UI

### **Tabs in `/admin/page.tsx`**

The existing admin page is refactored to have two tabs:

- **Sesiones** — current content, unchanged
- **Jugadores** — new player management section

Tab state is local React state (`useState`), no routing change needed.

### **"Jugadores" tab layout**

Three collapsible sub-sections, shown only when they contain players:

| Section | Icon | Players shown | Actions |
|---------|------|---------------|---------|
| Pendientes | ⏳ | `status = 'pending'` | Aprobar / Rechazar |
| Aprobados | ✅ | `status = 'approved'` | Revocar |
| Rechazados | ❌ | `status = 'rejected'` | Aprobar |

Each row displays: **username** + **fecha de registro** + action buttons.

Empty sections show a subtle *"No hay jugadores pendientes"* message.

### **Interaction pattern**
- Buttons show loading state (`"Aprobando..."`) while the action runs
- On success, the full player list re-fetches (same pattern as session management)
- On error, an alert is shown (same pattern as existing admin actions)

---

## 7. Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/004_add_player_status.sql` | New migration: `status` column + updated RLS |
| `src/types/index.ts` | Add `status` field to `Profile` interface |
| `src/actions/players.ts` | New: `getPlayersByStatus`, `approvePlayer`, `rejectPlayer` |
| `src/app/page.tsx` | Update redirect logic to check `status` |
| `src/app/admin/page.tsx` | Add tabs, implement Jugadores tab |

---

## 8. Out of Scope

- Email notifications to players on status change (future)
- Player-facing "pending approval" message (future)
- Admin ability to delete players entirely (future)
- Distinguishing pending vs rejected experience for the player (future)
