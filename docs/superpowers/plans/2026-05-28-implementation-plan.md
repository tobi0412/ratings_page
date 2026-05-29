# Football Team cotorra analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete MVP web app for football team peer voting and rating with historical dashboards, deployed to Vercel.

**Architecture:** Monolithic Next.js + Supabase with server actions for all business logic. RLS policies enforce security at the DB layer. Responsive UI with Tailwind, charts via Recharts, data aggregation on session close.

**Tech Stack:** Next.js 14+ (App Router), Supabase (PostgreSQL + Auth), Tailwind CSS, Recharts, TypeScript, Vercel

---

## File Structure Overview

**Core directories:**
- `src/app/` — Next.js pages (auth, dashboard, history, admin)
- `src/components/` — Reusable React components (voting, charts, forms, UI)
- `src/lib/` — Supabase clients, auth helpers, utilities
- `src/actions/` — Server actions (auth, sessions, ratings, stats)
- `src/types/` — TypeScript type definitions
- `src/middleware.ts` — Auth middleware + redirects
- `supabase/migrations/` — SQL migrations (tables + RLS)

---

## Phase 1: Project Setup & Database

### Task 1: Initialize Next.js Project

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.env.local`
- Create: `next.config.js`

- [ ] **Step 1: Create Next.js project with TypeScript**

Run: `npm create next-app@latest . --typescript --tailwind --app --eslint --no-git`

Answer prompts:
- Use TypeScript? → **Yes**
- Use ESLint? → **Yes**
- Use App Router? → **Yes**
- Use Tailwind CSS? → **Yes**

- [ ] **Step 2: Install Supabase dependencies**

Run: `npm install @supabase/supabase-js @supabase/ssr recharts`

- [ ] **Step 3: Create .env.local**

Create file `C:\Users\tobia\Desktop\Ratings_Cotorra\.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

Note: Replace with actual Supabase credentials after project creation.

- [ ] **Step 4: Update next.config.js**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
};

module.exports = nextConfig;
```

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json .env.local next.config.js src/
git commit -m "Init: Next.js project with Tailwind and Supabase"
```

---

### Task 2: Create Supabase Tables & RLS Policies

**Files:**
- Create: `supabase/migrations/001_create_tables.sql`
- Create: `supabase/migrations/002_create_rls_policies.sql`

- [ ] **Step 1: Create migration file for tables**

Create `supabase/migrations/001_create_tables.sql`:
```sql
-- profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'player')) DEFAULT 'player',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- match_sessions
CREATE TABLE match_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  closed_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT only_one_active CHECK (
    NOT (is_active = true AND (
      SELECT COUNT(*) FROM match_sessions WHERE is_active = true AND id != match_sessions.id
    ) > 0)
  )
);

-- ratings
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
  voter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tecnica INT NOT NULL CHECK (tecnica >= 1 AND tecnica <= 10),
  fisico INT NOT NULL CHECK (fisico >= 1 AND fisico <= 10),
  actitud INT NOT NULL CHECK (actitud >= 1 AND actitud <= 10),
  vision_juego INT NOT NULL CHECK (vision_juego >= 1 AND vision_juego <= 10),
  is_mvp BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT voter_not_receiver CHECK (voter_id != receiver_id),
  UNIQUE(match_id, voter_id, receiver_id)
);

-- historical_ratings
CREATE TABLE historical_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
  avg_tecnica FLOAT,
  avg_fisico FLOAT,
  avg_actitud FLOAT,
  avg_vision_juego FLOAT,
  avg_total FLOAT,
  mvp_count INT DEFAULT 0,
  computed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(player_id, match_id)
);

-- Indexes for performance
CREATE INDEX idx_ratings_match ON ratings(match_id);
CREATE INDEX idx_ratings_voter ON ratings(voter_id);
CREATE INDEX idx_ratings_receiver ON ratings(receiver_id);
CREATE INDEX idx_match_sessions_active ON match_sessions(is_active);
CREATE INDEX idx_historical_player ON historical_ratings(player_id);
```

- [ ] **Step 2: Create migration file for RLS policies**

Create `supabase/migrations/002_create_rls_policies.sql`:
```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE historical_ratings ENABLE ROW LEVEL SECURITY;

-- profiles policies
CREATE POLICY "Authenticated users read profiles"
  ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_id AND role = 'player');

CREATE POLICY "Users update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_id)
  WITH CHECK (auth.uid() = auth_id AND role = 'player');

-- match_sessions policies
CREATE POLICY "All authenticated read sessions"
  ON match_sessions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admin creates sessions"
  ON match_sessions FOR INSERT
  WITH CHECK (
    created_by = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND (SELECT role FROM profiles WHERE auth_id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admin closes sessions"
  ON match_sessions FOR UPDATE
  USING (
    created_by = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND (SELECT role FROM profiles WHERE auth_id = auth.uid()) = 'admin'
  );

-- ratings policies
CREATE POLICY "Players vote for others in active sessions"
  ON ratings FOR INSERT
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND voter_id != receiver_id
    AND (SELECT is_active FROM match_sessions WHERE id = match_id) = true
  );

CREATE POLICY "Players edit own votes in active sessions"
  ON ratings FOR UPDATE
  USING (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND (SELECT is_active FROM match_sessions WHERE id = match_id) = true
  )
  WITH CHECK (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    AND (SELECT is_active FROM match_sessions WHERE id = match_id) = true
  );

CREATE POLICY "Players see own active votes and all historical"
  ON ratings FOR SELECT
  USING (
    voter_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
    OR (SELECT is_active FROM match_sessions WHERE id = match_id) = false
  );

-- historical_ratings policies
CREATE POLICY "All authenticated read historical"
  ON historical_ratings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Function to compute historical ratings
CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO historical_ratings (player_id, match_id, avg_tecnica, avg_fisico, avg_actitud, avg_vision_juego, avg_total, mvp_count)
  SELECT
    p.id,
    session_id,
    AVG(r.tecnica)::FLOAT,
    AVG(r.fisico)::FLOAT,
    AVG(r.actitud)::FLOAT,
    AVG(r.vision_juego)::FLOAT,
    AVG((r.tecnica + r.fisico + r.actitud + r.vision_juego)::FLOAT / 4)::FLOAT,
    COUNT(CASE WHEN r.is_mvp THEN 1 END)
  FROM profiles p
  LEFT JOIN ratings r ON r.receiver_id = p.id AND r.match_id = session_id
  GROUP BY p.id
  ON CONFLICT (player_id, match_id) DO UPDATE SET
    avg_tecnica = EXCLUDED.avg_tecnica,
    avg_fisico = EXCLUDED.avg_fisico,
    avg_actitud = EXCLUDED.avg_actitud,
    avg_vision_juego = EXCLUDED.avg_vision_juego,
    avg_total = EXCLUDED.avg_total,
    mvp_count = EXCLUDED.mvp_count,
    computed_at = NOW();
END;
$$ LANGUAGE plpgsql;
```

- [ ] **Step 3: Execute migrations in Supabase**

Go to Supabase console → SQL Editor → paste and run both migration files.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "db: create tables with RLS policies and helper function"
```

---

### Task 3: Set Up Supabase Client & Types

**Files:**
- Create: `src/lib/supabase.ts`
- Create: `src/types/index.ts`

- [ ] **Step 1: Create Supabase client**

Create `src/lib/supabase.ts`:
```typescript
import { createBrowserClient, createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseClient = createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const createSupabaseServerClient = (
  cookieStore: { get: (name: string) => { value: string } | undefined }
) => {
  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: any) {
        // SSR cookie setting handled by middleware
      },
      remove(name: string, options: any) {
        // SSR cookie removal handled by middleware
      },
    },
  });
};

export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
```

- [ ] **Step 2: Create TypeScript types**

Create `src/types/index.ts`:
```typescript
export interface Profile {
  id: string;
  auth_id: string;
  username: string;
  role: 'admin' | 'player';
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface MatchSession {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  closed_at: string | null;
  is_active: boolean;
}

export interface Rating {
  id: string;
  match_id: string;
  voter_id: string;
  receiver_id: string;
  tecnica: number;
  fisico: number;
  actitud: number;
  vision_juego: number;
  is_mvp: boolean;
  created_at: string;
  updated_at: string;
}

export interface HistoricalRating {
  id: string;
  player_id: string;
  match_id: string;
  avg_tecnica: number | null;
  avg_fisico: number | null;
  avg_actitud: number | null;
  avg_vision_juego: number | null;
  avg_total: number | null;
  mvp_count: number;
  computed_at: string;
}

export interface RatingInput {
  match_id: string;
  receiver_id: string;
  tecnica: number;
  fisico: number;
  actitud: number;
  vision_juego: number;
  is_mvp: boolean;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/supabase.ts src/types/index.ts
git commit -m "lib: add Supabase client and TypeScript types"
```

---

## Phase 2: Authentication

### Task 4: Auth Server Actions

**Files:**
- Create: `src/actions/auth.ts`

- [ ] **Step 1: Create auth actions**

Create `src/actions/auth.ts`:
```typescript
'use server';

import { createSupabaseServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function signUp(email: string, password: string, username: string) {
  const supabase = createSupabaseServerClient(cookies());

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: 'User not created' };
  }

  const { error: profileError } = await supabase.from('profiles').insert({
    auth_id: authData.user.id,
    username,
    role: 'player',
  });

  if (profileError) {
    return { error: profileError.message };
  }

  return { success: true };
}

export async function signIn(email: string, password: string) {
  const supabase = createSupabaseServerClient(cookies());

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect('/');
}

export async function signOut() {
  const supabase = createSupabaseServerClient(cookies());
  await supabase.auth.signOut();
  redirect('/auth/login');
}

export async function getCurrentUser() {
  const supabase = createSupabaseServerClient(cookies());
  const { data } = await supabase.auth.getUser();
  return data.user;
}

export async function getCurrentProfile() {
  const supabase = createSupabaseServerClient(cookies());
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_id', user.id)
    .single();

  return data;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/auth.ts
git commit -m "feat: add authentication server actions"
```

---

### Task 5: Auth Pages (Login & Register)

**Files:**
- Create: `src/app/auth/login/page.tsx`
- Create: `src/app/auth/register/page.tsx`
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/components/auth/RegisterForm.tsx`

- [ ] **Step 1: Create LoginForm component**

Create `src/components/auth/LoginForm.tsx`:
```typescript
'use client';

import { signIn } from '@/actions/auth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signIn(email, password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Signing in...' : 'Sign In'}
      </button>
    </form>
  );
}
```

- [ ] **Step 2: Create RegisterForm component**

Create `src/components/auth/RegisterForm.tsx`:
```typescript
'use client';

import { signUp } from '@/actions/auth';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await signUp(email, password, username);

    if (result.error) {
      setError(result.error);
    } else {
      alert('Registration successful! Your profile is pending admin approval.');
      router.push('/auth/login');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium mb-1">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
          required
        />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating account...' : 'Register'}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Create login page**

Create `src/app/auth/login/page.tsx`:
```typescript
import LoginForm from '@/components/auth/LoginForm';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">Sign In</h1>
        <LoginForm />
        <p className="text-center mt-4">
          Don't have an account?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create register page**

Create `src/app/auth/register/page.tsx`:
```typescript
import RegisterForm from '@/components/auth/RegisterForm';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center">Register</h1>
        <RegisterForm />
        <p className="text-center mt-4">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-blue-600 hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/ src/components/auth/
git commit -m "feat: add login and register pages with forms"
```

---

## Phase 3: Voting & Sessions

### Task 6: Session Server Actions

**Files:**
- Create: `src/actions/sessions.ts`

- [ ] **Step 1: Create session actions**

Create `src/actions/sessions.ts`:
```typescript
'use server';

import { createSupabaseServerClient } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { getCurrentProfile } from './auth';

export async function getActiveSessions() {
  const supabase = createSupabaseServerClient(cookies());
  const { data } = await supabase
    .from('match_sessions')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getAllSessions() {
  const supabase = createSupabaseServerClient(cookies());
  const { data } = await supabase
    .from('match_sessions')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function createSession(name: string) {
  const supabase = createSupabaseServerClient(cookies());
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Only admins can create sessions' };
  }

  // Close any active session
  await supabase
    .from('match_sessions')
    .update({ is_active: false, closed_at: new Date().toISOString() })
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('match_sessions')
    .insert({
      name,
      created_by: profile.id,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, success: true };
}

export async function closeSession(sessionId: string) {
  const supabase = createSupabaseServerClient(cookies());
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Only admins can close sessions' };
  }

  const { data, error } = await supabase
    .from('match_sessions')
    .update({
      is_active: false,
      closed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Compute historical ratings
  await supabaseAdmin.rpc('compute_historical_ratings', { session_id: sessionId });

  return { data, success: true };
}

export async function getPendingApprovals() {
  const supabase = createSupabaseServerClient(cookies());
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== 'admin') {
    return [];
  }

  // In a real app, you'd track approval status. For MVP, assume all non-admin are pending.
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'player')
    .order('created_at', { ascending: false });

  return data || [];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/sessions.ts
git commit -m "feat: add session management server actions"
```

---

### Task 7: cotorra analytics Server Actions

**Files:**
- Create: `src/actions/ratings.ts`

- [ ] **Step 1: Create rating actions**

Create `src/actions/ratings.ts`:
```typescript
'use server';

import { createSupabaseServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { getCurrentProfile } from './auth';
import { RatingInput } from '@/types';

export async function submitRating(input: RatingInput) {
  const supabase = createSupabaseServerClient(cookies());
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Not authenticated' };
  }

  // Check vote doesn't exist
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('match_id', input.match_id)
    .eq('voter_id', profile.id)
    .eq('receiver_id', input.receiver_id)
    .single();

  if (existing) {
    // Update existing vote
    const { data, error } = await supabase
      .from('ratings')
      .update({
        tecnica: input.tecnica,
        fisico: input.fisico,
        actitud: input.actitud,
        vision_juego: input.vision_juego,
        is_mvp: input.is_mvp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data, success: true };
  } else {
    // Insert new vote
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        match_id: input.match_id,
        voter_id: profile.id,
        receiver_id: input.receiver_id,
        tecnica: input.tecnica,
        fisico: input.fisico,
        actitud: input.actitud,
        vision_juego: input.vision_juego,
        is_mvp: input.is_mvp,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data, success: true };
  }
}

export async function getPlayerVotes(matchId: string, voterId: string) {
  const supabase = createSupabaseServerClient(cookies());
  const profile = await getCurrentProfile();

  if (!profile) {
    return [];
  }

  const { data } = await supabase
    .from('ratings')
    .select('*')
    .eq('match_id', matchId)
    .eq('voter_id', voterId);

  return data || [];
}

export async function getMatchRatings(matchId: string) {
  const supabase = createSupabaseServerClient(cookies());
  const { data } = await supabase
    .from('ratings')
    .select('*')
    .eq('match_id', matchId);

  return data || [];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/ratings.ts
git commit -m "feat: add rating submission and query server actions"
```

---

## Phase 4: Voting Interface

### Task 8: Voting Components

**Files:**
- Create: `src/components/session/VotingCard.tsx`
- Create: `src/components/session/VotingProgress.tsx`
- Create: `src/components/session/SessionStatus.tsx`

- [ ] **Step 1: Create VotingCard component**

Create `src/components/session/VotingCard.tsx`:
```typescript
'use client';

import { submitRating } from '@/actions/ratings';
import { Profile, Rating, RatingInput } from '@/types';
import { useState, useEffect } from 'react';

interface VotingCardProps {
  receiver: Profile;
  matchId: string;
  existingRating?: Rating;
  onSuccess?: () => void;
}

export default function VotingCard({
  receiver,
  matchId,
  existingRating,
  onSuccess,
}: VotingCardProps) {
  const [metrics, setMetrics] = useState({
    tecnica: existingRating?.tecnica || 5,
    fisico: existingRating?.fisico || 5,
    actitud: existingRating?.actitud || 5,
    vision_juego: existingRating?.vision_juego || 5,
  });
  const [isMvp, setIsMvp] = useState(existingRating?.is_mvp || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    const result = await submitRating({
      match_id: matchId,
      receiver_id: receiver.id,
      tecnica: metrics.tecnica,
      fisico: metrics.fisico,
      actitud: metrics.actitud,
      vision_juego: metrics.vision_juego,
      is_mvp: isMvp,
    });

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess?.();
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center gap-3">
        {receiver.avatar_url && (
          <img
            src={receiver.avatar_url}
            alt={receiver.username}
            className="w-12 h-12 rounded-full"
          />
        )}
        <div>
          <h3 className="font-bold text-lg">{receiver.username}</h3>
        </div>
      </div>

      <div className="space-y-3">
        {(
          ['tecnica', 'fisico', 'actitud', 'vision_juego'] as const
        ).map((metric) => (
          <div key={metric}>
            <label className="text-sm font-medium capitalize block mb-1">
              {metric.replace('_', ' ')}: {metrics[metric]}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={metrics[metric]}
              onChange={(e) =>
                setMetrics({ ...metrics, [metric]: parseInt(e.target.value) })
              }
              className="w-full"
            />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`mvp-${receiver.id}`}
          checked={isMvp}
          onChange={(e) => setIsMvp(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor={`mvp-${receiver.id}`} className="text-sm">
          MVP del partido
        </label>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Guardar Voto'}
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Create VotingProgress component**

Create `src/components/session/VotingProgress.tsx`:
```typescript
'use client';

interface VotingProgressProps {
  totalPlayers: number;
  votedCount: number;
}

export default function VotingProgress({
  totalPlayers,
  votedCount,
}: VotingProgressProps) {
  const percentage = Math.round((votedCount / totalPlayers) * 100);

  return (
    <div className="bg-blue-50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Progreso de Votación</span>
        <span>
          {votedCount} de {totalPlayers}
        </span>
      </div>
      <div className="w-full bg-gray-300 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-600">{percentage}% completado</p>
    </div>
  );
}
```

- [ ] **Step 3: Create SessionStatus component**

Create `src/components/session/SessionStatus.tsx`:
```typescript
'use client';

import { MatchSession } from '@/types';

interface SessionStatusProps {
  session: MatchSession | null;
}

export default function SessionStatus({ session }: SessionStatusProps) {
  if (!session) {
    return (
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <p className="text-sm text-yellow-800">
          No hay sesión activa. Espera a que el admin cree una.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
      <h2 className="font-bold text-lg text-green-900">Sesión Activa</h2>
      <p className="text-sm text-green-700">{session.name}</p>
      <p className="text-xs text-green-600 mt-1">
        Comenzó: {new Date(session.created_at).toLocaleString()}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/session/
git commit -m "feat: add voting interface components"
```

---

### Task 9: Dashboard Page (Active Voting)

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard page**

Create `src/app/dashboard/page.tsx`:
```typescript
'use client';

import { getActiveSessions } from '@/actions/sessions';
import { getMatchRatings, getPlayerVotes } from '@/actions/ratings';
import { getCurrentProfile } from '@/actions/auth';
import SessionStatus from '@/components/session/SessionStatus';
import VotingCard from '@/components/session/VotingCard';
import VotingProgress from '@/components/session/VotingProgress';
import { MatchSession, Profile, Rating } from '@/types';
import { useEffect, useState } from 'react';

export default function DashboardPage() {
  const [session, setSession] = useState<MatchSession | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [myVotes, setMyVotes] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [profileData, sessionsData, ratingsData, votesData] = await Promise.all([
        getCurrentProfile(),
        getActiveSessions(),
        getMatchRatings((await getActiveSessions())[0]?.id || ''),
        getPlayerVotes((await getActiveSessions())[0]?.id || '', ''),
      ]);

      setProfile(profileData);
      if (sessionsData.length > 0) {
        setSession(sessionsData[0]);
      }

      // Get all players except self
      const allRatings = ratingsData;
      const uniquePlayerIds = new Set<string>();
      allRatings.forEach((r) => {
        if (r.receiver_id !== profileData?.id) {
          uniquePlayerIds.add(r.receiver_id);
        }
      });

      setMyVotes(votesData);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <SessionStatus session={null} />
      </div>
    );
  }

  const votedCount = myVotes.length;
  const totalPlayers = players.length;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <SessionStatus session={session} />
      <VotingProgress totalPlayers={totalPlayers} votedCount={votedCount} />

      <div>
        <h2 className="text-2xl font-bold mb-4">Votación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.map((player) => (
            <VotingCard
              key={player.id}
              receiver={player}
              matchId={session.id}
              existingRating={myVotes.find((v) => v.receiver_id === player.id)}
              onSuccess={() => {
                // Refresh votes
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add active voting dashboard page"
```

---

## Phase 5: Statistics & Historical Views

### Task 10: Stats Server Actions

**Files:**
- Create: `src/actions/stats.ts`

- [ ] **Step 1: Create stats actions**

Create `src/actions/stats.ts`:
```typescript
'use server';

import { createSupabaseServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function getHistoricalStats() {
  const supabase = createSupabaseServerClient(cookies());

  const { data: sessions } = await supabase
    .from('match_sessions')
    .select('*')
    .eq('is_active', false)
    .order('created_at', { ascending: true });

  const { data: historicalRatings } = await supabase
    .from('historical_ratings')
    .select('*')
    .order('computed_at', { ascending: true });

  return { sessions: sessions || [], ratings: historicalRatings || [] };
}

export async function getPlayerStats(playerId: string) {
  const supabase = createSupabaseServerClient(cookies());

  const { data } = await supabase
    .from('historical_ratings')
    .select('*')
    .eq('player_id', playerId)
    .order('computed_at', { ascending: true });

  return data || [];
}

export async function getAllPlayersStats() {
  const supabase = createSupabaseServerClient(cookies());

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'player');

  const { data: historicalRatings } = await supabase
    .from('historical_ratings')
    .select('*');

  const statsMap: { [key: string]: any } = {};

  profiles?.forEach((profile) => {
    const playerRatings = historicalRatings?.filter(
      (r) => r.player_id === profile.id
    ) || [];

    const avgTotal =
      playerRatings.length > 0
        ? playerRatings.reduce((sum, r) => sum + (r.avg_total || 0), 0) /
          playerRatings.length
        : 0;

    const avgTecnica =
      playerRatings.length > 0
        ? playerRatings.reduce((sum, r) => sum + (r.avg_tecnica || 0), 0) /
          playerRatings.length
        : 0;

    const avgFisico =
      playerRatings.length > 0
        ? playerRatings.reduce((sum, r) => sum + (r.avg_fisico || 0), 0) /
          playerRatings.length
        : 0;

    const avgActitud =
      playerRatings.length > 0
        ? playerRatings.reduce((sum, r) => sum + (r.avg_actitud || 0), 0) /
          playerRatings.length
        : 0;

    const avgVision =
      playerRatings.length > 0
        ? playerRatings.reduce((sum, r) => sum + (r.avg_vision_juego || 0), 0) /
          playerRatings.length
        : 0;

    const mvpCount = playerRatings.reduce((sum, r) => sum + r.mvp_count, 0);

    statsMap[profile.id] = {
      profile,
      avgTotal,
      avgTecnica,
      avgFisico,
      avgActitud,
      avgVision,
      mvpCount,
    };
  });

  return statsMap;
}

export async function getTopMVPs() {
  const supabase = createSupabaseServerClient(cookies());

  const { data } = await supabase
    .from('historical_ratings')
    .select('player_id, profiles!historical_ratings_player_id_fkey(username), mvp_count')
    .order('mvp_count', { ascending: false })
    .limit(3);

  return data || [];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/actions/stats.ts
git commit -m "feat: add statistics and historical data server actions"
```

---

### Task 11: Chart Components

**Files:**
- Create: `src/components/charts/RatingEvolutionChart.tsx`
- Create: `src/components/charts/ComparisonTable.tsx`

- [ ] **Step 1: Create RatingEvolutionChart component**

Create `src/components/charts/RatingEvolutionChart.tsx`:
```typescript
'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { HistoricalRating, MatchSession, Profile } from '@/types';

interface RatingEvolutionChartProps {
  sessions: MatchSession[];
  ratings: HistoricalRating[];
  players: Profile[];
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

export default function RatingEvolutionChart({
  sessions,
  ratings,
  players,
}: RatingEvolutionChartProps) {
  // Transform data for chart
  const chartData = sessions.map((session) => {
    const dataPoint: any = { name: session.name };

    players.forEach((player) => {
      const rating = ratings.find(
        (r) => r.player_id === player.id && r.match_id === session.id
      );
      dataPoint[player.id] = rating?.avg_total || 0;
    });

    return dataPoint;
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Evolución de Ratings</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Legend />
          {players.map((player, index) => (
            <Line
              key={player.id}
              type="monotone"
              dataKey={player.id}
              stroke={COLORS[index % COLORS.length]}
              name={player.username}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
```

- [ ] **Step 2: Create ComparisonTable component**

Create `src/components/charts/ComparisonTable.tsx`:
```typescript
'use client';

import { Profile } from '@/types';

interface PlayerStats {
  profile: Profile;
  avgTotal: number;
  avgTecnica: number;
  avgFisico: number;
  avgActitud: number;
  avgVision: number;
  mvpCount: number;
}

interface ComparisonTableProps {
  stats: { [key: string]: PlayerStats };
}

export default function ComparisonTable({ stats }: ComparisonTableProps) {
  const sortedPlayers = Object.values(stats).sort(
    (a, b) => b.avgTotal - a.avgTotal
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
      <h3 className="text-xl font-bold mb-4">Comparativa de Equipo</h3>
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left py-2 px-2">Jugador</th>
            <th className="text-center py-2 px-2">Rating Promedio</th>
            <th className="text-center py-2 px-2">Técnica</th>
            <th className="text-center py-2 px-2">Físico</th>
            <th className="text-center py-2 px-2">Actitud</th>
            <th className="text-center py-2 px-2">Visión</th>
            <th className="text-center py-2 px-2">MVP Count</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => (
            <tr key={player.profile.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="py-3 px-2 font-medium">{player.profile.username}</td>
              <td className="text-center py-3 px-2">
                {player.avgTotal.toFixed(1)}/10
              </td>
              <td className="text-center py-3 px-2">
                {player.avgTecnica.toFixed(1)}
              </td>
              <td className="text-center py-3 px-2">
                {player.avgFisico.toFixed(1)}
              </td>
              <td className="text-center py-3 px-2">
                {player.avgActitud.toFixed(1)}
              </td>
              <td className="text-center py-3 px-2">
                {player.avgVision.toFixed(1)}
              </td>
              <td className="text-center py-3 px-2">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {player.mvpCount}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/charts/
git commit -m "feat: add historical charts and comparison table"
```

---

### Task 12: Historical View Page

**Files:**
- Create: `src/app/history/page.tsx`

- [ ] **Step 1: Create history page**

Create `src/app/history/page.tsx`:
```typescript
'use client';

import { getHistoricalStats, getAllPlayersStats, getTopMVPs } from '@/actions/stats';
import RatingEvolutionChart from '@/components/charts/RatingEvolutionChart';
import ComparisonTable from '@/components/charts/ComparisonTable';
import { MatchSession, Profile } from '@/types';
import { useEffect, useState } from 'react';

interface PlayerStats {
  profile: Profile;
  avgTotal: number;
  avgTecnica: number;
  avgFisico: number;
  avgActitud: number;
  avgVision: number;
  mvpCount: number;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [stats, setStats] = useState<{ [key: string]: PlayerStats }>({});
  const [topMVPs, setTopMVPs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [histData, playerStats, mvpData] = await Promise.all([
        getHistoricalStats(),
        getAllPlayersStats(),
        getTopMVPs(),
      ]);

      setSessions(histData.sessions);
      setStats(playerStats);
      setTopMVPs(mvpData);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <p className="text-yellow-800">
            No hay datos históricos aún. Completa las sesiones de votación para ver las estadísticas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Histórico de Evaluaciones</h1>
        <p className="text-gray-600">
          Análisis de rendimiento del equipo a través de las sesiones de votación.
        </p>
      </div>

      <RatingEvolutionChart
        sessions={sessions}
        ratings={[]}
        players={Object.values(stats).map((s) => s.profile)}
      />

      <ComparisonTable stats={stats} />

      {topMVPs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Top MVPs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topMVPs.map((mvp, index) => (
              <div key={mvp.player_id} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600">#{index + 1}</div>
                <p className="font-bold text-lg mt-2">{mvp.profiles.username}</p>
                <p className="text-sm text-gray-600">{mvp.mvp_count} MVPs</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/history/page.tsx
git commit -m "feat: add historical view with stats and MVP rankings"
```

---

## Phase 6: Admin Panel

### Task 13: Admin Pages

**Files:**
- Create: `src/app/admin/page.tsx`
- Create: `src/app/admin/layout.tsx`

- [ ] **Step 1: Create admin layout with protection**

Create `src/app/admin/layout.tsx`:
```typescript
import { getCurrentProfile } from '@/actions/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== 'admin') {
    redirect('/');
  }

  return <>{children}</>;
}
```

- [ ] **Step 2: Create admin page**

Create `src/app/admin/page.tsx`:
```typescript
'use client';

import {
  createSession,
  closeSession,
  getAllSessions,
  getActiveSessions,
} from '@/actions/sessions';
import { MatchSession } from '@/types';
import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [activeSession, setActiveSession] = useState<MatchSession | null>(null);
  const [newSessionName, setNewSessionName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  async function loadSessions() {
    const [all, active] = await Promise.all([
      getAllSessions(),
      getActiveSessions(),
    ]);
    setSessions(all);
    setActiveSession(active.length > 0 ? active[0] : null);
  }

  async function handleCreateSession() {
    if (!newSessionName.trim()) {
      alert('El nombre de la sesión no puede estar vacío');
      return;
    }

    setLoading(true);
    const result = await createSession(newSessionName);

    if (result.error) {
      alert('Error: ' + result.error);
    } else {
      setNewSessionName('');
      await loadSessions();
    }
    setLoading(false);
  }

  async function handleCloseSession() {
    if (!activeSession) return;

    if (!confirm('¿Estás seguro de que quieres cerrar esta sesión?')) {
      return;
    }

    setLoading(true);
    const result = await closeSession(activeSession.id);

    if (result.error) {
      alert('Error: ' + result.error);
    } else {
      await loadSessions();
    }
    setLoading(false);
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      <h1 className="text-3xl font-bold">Panel de Admin</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-bold">Crear Nueva Sesión</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
            placeholder="Ej: Fecha 5, Amistoso vs X"
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <button
            onClick={handleCreateSession}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            Crear
          </button>
        </div>
      </div>

      {activeSession && (
        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200 space-y-4">
          <h2 className="text-xl font-bold text-green-900">Sesión Activa</h2>
          <div>
            <p className="font-bold text-lg">{activeSession.name}</p>
            <p className="text-sm text-gray-600">
              Comenzó: {new Date(activeSession.created_at).toLocaleString()}
            </p>
          </div>
          <button
            onClick={handleCloseSession}
            disabled={loading}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            Cerrar Sesión
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-xl font-bold">Historial de Sesiones</h2>
        <div className="space-y-2">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="flex justify-between items-center p-3 bg-gray-50 rounded"
            >
              <div>
                <p className="font-medium">{session.name}</p>
                <p className="text-sm text-gray-600">
                  {new Date(session.created_at).toLocaleString()}
                </p>
                {session.closed_at && (
                  <p className="text-sm text-gray-600">
                    Cerrada: {new Date(session.closed_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <span
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    session.is_active
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {session.is_active ? 'Activa' : 'Cerrada'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/
git commit -m "feat: add admin panel for session management"
```

---

## Phase 7: Root Layout & Middleware

### Task 14: Root Layout & Navigation

**Files:**
- Create: `src/app/layout.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/components/layouts/Navbar.tsx`

- [ ] **Step 1: Create Navbar component**

Create `src/components/layouts/Navbar.tsx`:
```typescript
'use client';

import { signOut } from '@/actions/auth';
import { Profile } from '@/types';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NavbarProps {
  profile: Profile | null;
}

export default function Navbar({ profile }: NavbarProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <nav className="bg-gray-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-2xl font-bold">
          Cotorra Analytics
        </Link>

        <div className="flex gap-6 items-center">
          {profile ? (
            <>
              <Link href="/history" className="hover:text-gray-300">
                Histórico
              </Link>
              <Link href="/dashboard" className="hover:text-gray-300">
                Votación
              </Link>
              {profile.role === 'admin' && (
                <Link href="/admin" className="hover:text-gray-300 font-bold">
                  Admin
                </Link>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm">{profile.username}</span>
                <button
                  onClick={handleSignOut}
                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm"
                >
                  Sign Out
                </button>
              </div>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="hover:text-gray-300">
                Sign In
              </Link>
              <Link href="/auth/register" className="hover:text-gray-300">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
```

- [ ] **Step 2: Create root layout**

Create `src/app/layout.tsx`:
```typescript
import type { Metadata } from 'next';
import { getCurrentProfile } from '@/actions/auth';
import Navbar from '@/components/layouts/Navbar';
import './globals.css';

export const metadata: Metadata = {
  title: 'Cotorra Analytics',
  description: 'Peer evaluation system for football teams',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentProfile();

  return (
    <html lang="en">
      <body className="bg-gray-100">
        <Navbar profile={profile} />
        <main>{children}</main>
      </body>
    </html>
  );
}
```

- [ ] **Step 3: Create home page**

Create `src/app/page.tsx`:
```typescript
'use client';

import { getCurrentProfile } from '@/actions/auth';
import { getActiveSessions } from '@/actions/sessions';
import { useEffect, useState } from 'react';
import { redirect } from 'next/navigation';

export default function HomePage() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkRedirect() {
      const [profile, activeSessions] = await Promise.all([
        getCurrentProfile(),
        getActiveSessions(),
      ]);

      if (!profile) {
        redirect('/auth/login');
      }

      if (activeSessions.length > 0 && profile.role === 'player') {
        // Check if player has pending votes
        redirect('/dashboard');
      } else {
        redirect('/history');
      }
    }

    checkRedirect();
  }, []);

  return <div className="text-center py-8">Redirecting...</div>;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/layout.tsx src/app/page.tsx src/components/layouts/Navbar.tsx
git commit -m "feat: add root layout with navigation"
```

---

## Phase 8: Deployment & Final Setup

### Task 15: Environment & Deploy Configuration

**Files:**
- Create: `.env.example`
- Modify: `package.json`

- [ ] **Step 1: Create .env.example**

Create `C:\Users\tobia\Desktop\Ratings_Cotorra\.env.example`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

- [ ] **Step 2: Verify package.json scripts**

Ensure `package.json` has these scripts (should be default from create-next-app):
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  }
}
```

- [ ] **Step 3: Test build locally**

Run: `npm run build`

Expected: Build succeeds without errors.

- [ ] **Step 4: Commit**

```bash
git add .env.example package.json
git commit -m "config: add environment template and verify build setup"
```

---

## Summary

**Total Tasks:** 15  
**Deliverables:**
- ✅ Complete Next.js + Supabase MVP
- ✅ Authentication (login/register)
- ✅ Admin session management
- ✅ Peer voting interface
- ✅ Historical analytics & charts
- ✅ RLS security
- ✅ Responsive UI with Tailwind
- ✅ Ready for Vercel deployment

**Testing Approach:**
- Manual testing through UI flows
- Verify RLS policies via Supabase console
- Test build with `npm run build`

**Next Steps After Implementation:**
1. Get Supabase credentials from project
2. Populate `.env.local` with real credentials
3. Run `npm run dev` and test locally
4. Deploy to Vercel using `deploy-to-vercel` skill
