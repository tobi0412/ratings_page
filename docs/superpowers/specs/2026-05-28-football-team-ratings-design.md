# Football Team Ratings Application - Design Document

**Date:** 2026-05-28  
**Scope:** MVP with core voting + basic historical visualizations  
**Stack:** Next.js (App Router) + Supabase (PostgreSQL + Auth) + Tailwind CSS + Vercel

---

## 1. Executive Summary

A web application for managing and evaluating a football team's performance through peer voting. Admin creates voting sessions per match date, players rate each other across 5 dimensions (Técnica, Físico, Actitud, Visión de Juego, MVP), and historical data is transparently visible to all once sessions close. Single admin per team, email/password auth, Supabase RLS for security.

---

## 2. Data Model

### **profiles**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| auth_id | uuid, FK→auth.users | Link to Supabase Auth |
| username | text, UNIQUE | Player/Admin name |
| role | 'admin' \| 'player' | Single admin, multiple players |
| avatar_url | text, nullable | Profile picture |
| created_at | timestamp | |

### **match_sessions**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| name | text | "Fecha 5", "Amistoso vs X" |
| created_by | uuid, FK→profiles | Admin who created it |
| created_at | timestamp | |
| closed_at | timestamp, nullable | Null if open, set on close |
| is_active | boolean | true=open, false=closed |

**Constraint:** Only one `is_active = true` at a time (enforced via trigger or app logic).

### **ratings**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| match_id | uuid, FK→match_sessions | Which session |
| voter_id | uuid, FK→profiles | Who voted |
| receiver_id | uuid, FK→profiles | Who was rated |
| tecnica | int | 1-10 |
| fisico | int | 1-10 |
| actitud | int | 1-10 |
| vision_juego | int | 1-10 |
| is_mvp | boolean | Only one per session |
| created_at | timestamp | |
| updated_at | timestamp | |
| total_score | int | Computed: (tecnica+fisico+actitud+vision_juego)/4 |

**Constraints:**
- `voter_id ≠ receiver_id` (can't vote for self)
- `voter_id` + `receiver_id` + `match_id` → UNIQUE (one vote per pair per session)
- Editable while `match_sessions.is_active = true`

### **historical_ratings**
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| player_id | uuid, FK→profiles | Player being rated |
| match_id | uuid, FK→match_sessions | Session reference |
| avg_tecnica | float | Average of all tecnica votes |
| avg_fisico | float | Average of all fisico votes |
| avg_actitud | float | Average of all actitud votes |
| avg_vision_juego | float | Average of all vision_juego votes |
| avg_total | float | Average of all total_scores |
| mvp_count | int | Total MVPs across all sessions |
| computed_at | timestamp | When aggregation happened |

**Purpose:** Denormalized aggregate for fast queries on dashboard. Recomputed when session closes.

---

## 3. Row Level Security (RLS) Policies

### **profiles table**

**Policy: Read (Authenticated)**
```sql
CREATE POLICY "Authenticated users read profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');
```

**Policy: Insert (Self-registration - Admin approves later)**
```sql
CREATE POLICY "Users can insert own profile (pending approval)"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_id AND role = 'player');
```

**Policy: Update (Admin or self - limited fields)**
```sql
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id AND role = 'player'); -- Can't self-promote to admin
```

---

### **match_sessions table**

**Policy: Read (All authenticated)**
```sql
CREATE POLICY "All authenticated can read sessions"
  ON match_sessions FOR SELECT
  USING (auth.role() = 'authenticated');
```

**Policy: Insert (Admin only)**
```sql
CREATE POLICY "Only admin creates sessions"
  ON match_sessions FOR INSERT
  WITH CHECK (
    created_by = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND (SELECT role FROM profiles WHERE auth_id = auth.uid()) = 'admin'
  );
```

**Policy: Update (Admin only - close session)**
```sql
CREATE POLICY "Only admin closes sessions"
  ON match_sessions FOR UPDATE
  USING (
    created_by = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND (SELECT role FROM profiles WHERE auth_id = auth.uid()) = 'admin'
  );
```

---

### **ratings table**

**Policy: Insert (Own vote, not self, session active)**
```sql
CREATE POLICY "Players vote for others in active sessions"
  ON ratings FOR INSERT
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND voter_id != receiver_id
    AND (SELECT is_active FROM match_sessions WHERE id = match_id) = true
  );
```

**Policy: Update (Own vote, session active)**
```sql
CREATE POLICY "Players edit own votes while session open"
  ON ratings FOR UPDATE
  USING (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND (SELECT is_active FROM match_sessions WHERE id = match_id) = true
  )
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND (SELECT is_active FROM match_sessions WHERE id = match_id) = true
  );
```

**Policy: Select (Own active votes + all historical)**
```sql
CREATE POLICY "Players see own active votes and all historical"
  ON ratings FOR SELECT
  USING (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR (SELECT is_active FROM match_sessions WHERE id = match_id) = false
  );
```

---

### **historical_ratings table**

**Policy: Read (All authenticated)**
```sql
CREATE POLICY "All authenticated read historical ratings"
  ON historical_ratings FOR SELECT
  USING (auth.role() = 'authenticated');
```

---

## 4. Application Flow

### **Flow 1: Home/Landing Route**
```
User lands on /
  ↓
Check: IS session active AND player has pending votes?
  ├─ YES → Redirect to /dashboard (voting page)
  └─ NO → Render historical view
           ├─ Gráfico: Evolution (line chart)
           ├─ Tabla: Team comparison ranking
           └─ MVP history
```

### **Flow 2: Active Voting (Sesión Activa)**
```
Admin creates session via /admin
  ↓
Players see votation cards on /dashboard
  ├─ For each teammate: inputs for (técnica, físico, actitud, visión, MVP checkbox)
  ├─ Edit existing votes (until session closed)
  └─ Submit → Server Action "submitRating"
       ├─ RLS validates: auth.uid()=voter_id, voter_id≠receiver_id, is_active=true
       ├─ INSERT or UPDATE ratings
       └─ Show "Voto guardado"

When all votes cast → Auto-redirect to historical view
```

### **Flow 3: Session Closure (Admin)**
```
Admin clicks "Cerrar sesión" on /admin
  ↓
Server Action "closeSession"
  ├─ UPDATE match_sessions SET is_active=false, closed_at=NOW()
  ├─ Trigger/Action: Compute historical_ratings aggregates
  └─ Dispatch: All players auto-see updated historical dashboard
```

---

## 5. Folder Structure (Next.js App Router)

```
src/
├── app/
│   ├── layout.tsx                    # Root layout, auth check
│   ├── page.tsx                      # Home (conditional: voting or history)
│   ├── auth/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── dashboard/
│   │   └── page.tsx                  # Active voting interface
│   ├── history/
│   │   ├── page.tsx                  # Historical overview
│   │   └── player/[id]/page.tsx      # Individual player profile
│   └── admin/
│       ├── layout.tsx                # Protected by middleware
│       ├── page.tsx                  # Admin panel
│       ├── sessions/
│       │   └── new/page.tsx          # Create session
│       └── users/page.tsx            # Approve pending players
│
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── RegisterForm.tsx
│   ├── session/
│   │   ├── VotingCard.tsx            # Single player vote interface
│   │   ├── SessionStatus.tsx
│   │   └── VotingProgress.tsx
│   ├── charts/
│   │   ├── RatingEvolutionChart.tsx  # Line chart (Recharts)
│   │   └── ComparisonTable.tsx
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Input.tsx
│   └── layouts/
│       ├── Navbar.tsx
│       └── Footer.tsx
│
├── lib/
│   ├── supabase.ts                   # Client + Admin client
│   ├── auth.ts                       # Auth helpers
│   └── utils.ts                      # Shared utilities
│
├── actions/
│   ├── auth.ts                       # login, logout, register
│   ├── sessions.ts                   # createSession, closeSession
│   ├── ratings.ts                    # submitRating, updateRating
│   └── stats.ts                      # Queries for historical data
│
├── types/
│   └── index.ts                      # Shared TypeScript types
│
└── middleware.ts                     # Auth checks, redirects
```

---

## 6. Visualizations (MVP)

### **Historical View (Landing / /history)**

1. **Rating Evolution Chart**
   - Type: Line chart (Recharts)
   - X-axis: Match sessions (ordered by date)
   - Y-axis: Average rating (1-10)
   - Lines: One per player
   - Shows: How each player's average score evolved over sessions

2. **Team Comparison Table**
   - Columns: Player | Avg Rating | Técnica | Físico | Actitud | Visión | MVP Count
   - Rows: All players, sorted by average rating
   - Filters: (optional) By position, by session

3. **MVP Count Card**
   - Simple: "X was MVP Y times this season"
   - Shows: Top 3 MVP winners

### **Active Voting View (/dashboard)**

1. **Voting Cards Grid**
   - One card per teammate
   - Each card has:
     - Player name + avatar
     - 4 sliders/inputs (técnica, físico, actitud, visión_juego) 1-10
     - Checkbox "MVP de la sesión"
     - "Guardar" button
   - Show feedback: "Voto guardado"

2. **Progress Indicator**
   - "Has votado a X de Y compañeros"
   - Visual bar/circle

---

## 7. Key Business Logic

### **Constraints & Validations**
- One vote per (voter, receiver, session) tuple
- Voter ≠ Receiver (enforced by RLS)
- Metrics: 1-10 scale, integers
- MVP: Only one per session per player receiving votes (not enforced at DB, enforced at UI/action level)
- Session state: Only one active at a time

### **Session Lifecycle**
- **Created:** `is_active=true`, `closed_at=null`
- **Open:** Players vote, edits allowed
- **Closed:** `is_active=false`, `closed_at=NOW()`
- **Historical:** Visible to all, RLS grants full read access

### **Rating Aggregation**
- `total_score` = (técnica + físico + actitud + visión_juego) / 4
- Historical aggregates computed on session close (trigger or server action)
- MVP count is cumulative across all sessions

---

## 8. Technology Decisions

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| Frontend | Next.js App Router | Modern, SSR, server actions |
| Auth | Supabase Auth (email/pw) | Built-in, simple, Supabase-native |
| Database | PostgreSQL (Supabase) | Relational, RLS support, ACID |
| Server Functions | Next.js Server Actions | Type-safe, simpler than API routes |
| Styling | Tailwind CSS | Utility-first, rapid UI |
| Charts | Recharts | React-native, lightweight |
| Deploy | Vercel | Seamless Next.js integration |
| Security Model | Row Level Security (RLS) | Data isolation at DB level |

---

## 9. Scope Boundaries (MVP)

### **Included**
- Email/password authentication
- Single admin, multiple players
- Session creation & closure (manual + auto on new session)
- Vote capture (create/update) with validation
- Historical data aggregation
- Line chart (evolution) + comparison table
- MVP tracking
- Responsive UI

### **Not Included (Future)**
- Real-time vote updates (Supabase Realtime)
- Advanced analytics (heatmaps, predictions)
- Player positions/formations
- Multi-team support
- Social features (comments, reactions)
- Export/reports (CSV, PDF)

---

## 10. Success Criteria

✓ Admin can create/close voting sessions  
✓ Players can vote for teammates (not self)  
✓ Votes persist and are editable until session close  
✓ Historical data is visible and transparent post-close  
✓ Charts show evolution of player ratings  
✓ Comparison table ranks team members  
✓ RLS prevents unauthorized access  
✓ Deploy to Vercel, live and functional  

---

## 11. Implementation Plan Overview

1. **Setup:** Next.js project, Supabase connection, env vars
2. **Database:** Create tables + RLS policies
3. **Auth:** Login/register flows
4. **Admin Panel:** Session CRUD
5. **Voting Interface:** Voting cards + submission
6. **Historical Views:** Charts, tables, aggregations
7. **Testing & Polish:** Responsive design, error handling
8. **Deploy:** Vercel

---

## Open Questions / Notes

- None at this time; design is complete and approved.

