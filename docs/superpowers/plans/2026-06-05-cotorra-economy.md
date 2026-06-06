# Cotorra Economy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the Cotorra Economy virtual currency (CC), betting market (/bets), shop (/shop), and profile cosmetic customizations, controlled by a feature flag.

**Architecture:** A satellite database structure containing wallets, transactions, bets, inventory, and equipped cosmetics, fully decoupled from the core application logic via a feature flag config.

**Tech Stack:** Next.js (App Router), Supabase JS Client, PostgreSQL, TailwindCSS, Framer Motion

---

### Task 1: Database Migration & RLS

**Files:**
- Create: `supabase/migrations/015_add_cotorra_economy.sql`
- Modify: `supabase/migrations/006_add_mystery_player.sql` (conceptually updated in 015)

- [ ] **Step 1: Write migration SQL**
  Create `supabase/migrations/015_add_cotorra_economy.sql` with the following content:

  ```sql
  -- 1. Create tables
  CREATE TABLE IF NOT EXISTS economy_wallets (
    player_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS economy_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    type VARCHAR NOT NULL CHECK (type IN ('reward_performance', 'reward_bonus', 'purchase', 'bet_place', 'bet_win', 'bet_refund')),
    match_id UUID REFERENCES match_sessions(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS economy_bets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES match_sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    bet_type VARCHAR NOT NULL CHECK (bet_type IN ('player_prop_over', 'player_prop_under', 'team_total_over', 'team_total_under')),
    target_player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    line_value NUMERIC(3, 1) NOT NULL,
    odds NUMERIC(4, 2) NOT NULL,
    amount INT NOT NULL CHECK (amount > 0),
    status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'refunded')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
  );

  CREATE TABLE IF NOT EXISTS economy_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    item_id VARCHAR NOT NULL,
    item_type VARCHAR NOT NULL CHECK (item_type IN ('tactical', 'avatar_border', 'field_design', 'profile_title')),
    match_id UUID REFERENCES match_sessions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_player_item_match UNIQUE(player_id, item_id, match_id)
  );

  CREATE TABLE IF NOT EXISTS economy_equipped (
    player_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    avatar_border VARCHAR,
    field_design VARCHAR,
    profile_title VARCHAR,
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  -- 2. Enable RLS
  ALTER TABLE economy_wallets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE economy_transactions ENABLE ROW LEVEL SECURITY;
  ALTER TABLE economy_bets ENABLE ROW LEVEL SECURITY;
  ALTER TABLE economy_inventory ENABLE ROW LEVEL SECURITY;
  ALTER TABLE economy_equipped ENABLE ROW LEVEL SECURITY;

  -- 3. RLS Policies
  -- Wallets
  CREATE POLICY "All authenticated read wallets" ON economy_wallets FOR SELECT TO authenticated USING (true);
  
  -- Transactions
  CREATE POLICY "Players read own transactions" ON economy_transactions FOR SELECT TO authenticated 
    USING (player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

  -- Bets
  CREATE POLICY "Players read own bets" ON economy_bets FOR SELECT TO authenticated 
    USING (player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));
  CREATE POLICY "Players insert own bets" ON economy_bets FOR INSERT TO authenticated 
    WITH CHECK (
      player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid())
      AND EXISTS (SELECT 1 FROM match_sessions WHERE id = match_id AND is_active = true)
    );

  -- Inventory
  CREATE POLICY "Players read own inventory" ON economy_inventory FOR SELECT TO authenticated 
    USING (player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));
  CREATE POLICY "Players insert own purchases" ON economy_inventory FOR INSERT TO authenticated 
    WITH CHECK (player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

  -- Equipped
  CREATE POLICY "All authenticated read equipped" ON economy_equipped FOR SELECT TO authenticated USING (true);
  CREATE POLICY "Players manage own equipped" ON economy_equipped FOR ALL TO authenticated 
    USING (player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()))
    WITH CHECK (player_id = (SELECT id FROM profiles WHERE auth_id = auth.uid()));

  -- 4. Update compute_historical_ratings to exclude players with Escudo de Anonimato
  CREATE OR REPLACE FUNCTION compute_historical_ratings(session_id UUID)
  RETURNS void AS $$
  DECLARE
    chosen_player_id UUID;
    total_participants INT;
    avg_team_val NUMERIC(3, 1);
  BEGIN
    SELECT COUNT(*) INTO total_participants FROM session_participants WHERE match_id = session_id;
    SELECT ROUND(COALESCE(AVG(rating), 0)::NUMERIC, 1) INTO avg_team_val FROM team_ratings WHERE match_id = session_id;

    UPDATE match_sessions SET team_rating = avg_team_val WHERE id = session_id;

    INSERT INTO historical_ratings (
      player_id, match_id,
      avg_tecnica, avg_fisico, avg_actitud, avg_vision_juego,
      avg_total, mvp_count, bigpaper_count, poop_count,
      team_rating
    )
    WITH player_votes AS (
      SELECT
        sp.player_id,
        COUNT(r.id) FILTER (WHERE r.is_mvp = true) AS mvp_votes,
        COUNT(r.id) FILTER (WHERE r.is_bigpaper = true) AS bigpaper_votes,
        COUNT(r.id) FILTER (WHERE r.is_poop = true) AS poop_votes
      FROM session_participants sp
      LEFT JOIN ratings r ON r.receiver_id = sp.player_id AND r.match_id = session_id
      WHERE sp.match_id = session_id
      GROUP BY sp.player_id
    ),
    max_votes_val AS (
      SELECT 
        MAX(mvp_votes) AS max_mvp,
        MAX(bigpaper_votes) AS max_bigpaper,
        MAX(poop_votes) AS max_poop
      FROM player_votes
    ),
    top_mvps AS (
      SELECT player_id FROM player_votes, max_votes_val WHERE mvp_votes = max_mvp AND mvp_votes > 0
    ),
    top_bigpapers AS (
      SELECT player_id FROM player_votes, max_votes_val WHERE bigpaper_votes = max_bigpaper AND bigpaper_votes > 0
    ),
    top_poops AS (
      SELECT player_id FROM player_votes, max_votes_val WHERE poop_votes = max_poop AND poop_votes > 0
    ),
    counts AS (
      SELECT 
        (SELECT COUNT(*) FROM top_mvps) AS mvp_cnt,
        (SELECT COUNT(*) FROM top_bigpapers) AS bigpaper_cnt,
        (SELECT COUNT(*) FROM top_poops) AS poop_cnt
    ),
    awards_assignments AS (
      SELECT
        pv.player_id,
        CASE WHEN (SELECT mvp_cnt FROM counts) IN (1, 2) AND pv.player_id IN (SELECT player_id FROM top_mvps) THEN 1 ELSE 0 END AS assigned_mvp,
        CASE WHEN ((SELECT max_bigpaper FROM max_votes_val) * 2 >= total_participants)
                  AND (SELECT bigpaper_cnt FROM counts) IN (1, 2)
                  AND pv.player_id IN (SELECT player_id FROM top_bigpapers) THEN 1 ELSE 0 END AS assigned_bigpaper,
        CASE WHEN ((SELECT max_poop FROM max_votes_val) * 2 >= total_participants)
                  AND (SELECT poop_cnt FROM counts) IN (1, 2)
                  AND pv.player_id IN (SELECT player_id FROM top_poops) THEN 1 ELSE 0 END AS assigned_poop
      FROM player_votes pv
    )
    SELECT
      p.id,
      session_id,
      ROUND(AVG(r.tecnica)::NUMERIC, 2),
      ROUND(AVG(r.fisico)::NUMERIC, 2),
      ROUND(AVG(r.actitud)::NUMERIC, 2),
      ROUND(AVG(r.vision_juego)::NUMERIC, 2),
      ROUND(AVG((r.tecnica + r.fisico + r.actitud + r.vision_juego)::NUMERIC / 4), 2),
      COALESCE(aa.assigned_mvp, 0),
      COALESCE(aa.assigned_bigpaper, 0),
      COALESCE(aa.assigned_poop, 0),
      avg_team_val
    FROM session_participants sp
    JOIN profiles p ON p.id = sp.player_id
    LEFT JOIN ratings r ON r.receiver_id = p.id AND r.match_id = session_id
    LEFT JOIN awards_assignments aa ON aa.player_id = p.id
    WHERE sp.match_id = session_id
    GROUP BY p.id, aa.assigned_mvp, aa.assigned_bigpaper, aa.assigned_poop
    ON CONFLICT (player_id, match_id) DO UPDATE SET
      avg_tecnica      = EXCLUDED.avg_tecnica,
      avg_fisico       = EXCLUDED.avg_fisico,
      avg_actitud      = EXCLUDED.avg_actitud,
      avg_vision_juego = EXCLUDED.avg_vision_juego,
      avg_total        = EXCLUDED.avg_total,
      mvp_count        = EXCLUDED.mvp_count,
      bigpaper_count   = EXCLUDED.bigpaper_count,
      poop_count       = EXCLUDED.poop_count,
      team_rating      = EXCLUDED.team_rating,
      computed_at      = NOW();

    -- Pick a random player who cast at least one rating, EXCLUDING players with Escudo de Anonimato active
    SELECT voter_id INTO chosen_player_id
    FROM ratings
    WHERE match_id = session_id
      AND voter_id NOT IN (
        SELECT player_id FROM economy_inventory
        WHERE match_id = session_id AND item_id = 'escudo_anonimato'
      )
    GROUP BY voter_id
    ORDER BY random()
    LIMIT 1;

    IF chosen_player_id IS NOT NULL THEN
      UPDATE match_sessions
      SET mystery_player_id = chosen_player_id
      WHERE id = session_id;
    END IF;
  END;
  $$ LANGUAGE plpgsql;
  ```

- [ ] **Step 2: Run migration command**
  Apply the migration using a local supabase script, or verify file syntax.
  Run: (Assume DB migrations are run via Supabase dashboard or CLI if available, otherwise stage/commit for manual execution).

- [ ] **Step 3: Commit migration**
  ```bash
  git add supabase/migrations/015_add_cotorra_economy.sql
  git commit -m "db: add economy satellite tables and RLS policies"
  ```

---

### Task 2: Feature Flag Setup

**Files:**
- Create: `src/config/features.ts`
- Create: `src/modules/economy/components/CurrencyFeatureToggle.tsx`

- [ ] **Step 1: Create features config**
  Create `src/config/features.ts`:
  ```typescript
  export const FEATURE_FLAGS = {
    IS_CURRENCY_ENABLED: process.env.NEXT_PUBLIC_ENABLE_CURRENCY === 'true',
  };
  ```

- [ ] **Step 2: Create toggle component**
  Create `src/modules/economy/components/CurrencyFeatureToggle.tsx`:
  ```typescript
  import React from "react";
  import { FEATURE_FLAGS } from "@/config/features";

  interface ToggleProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
  }

  export default function CurrencyFeatureToggle({ children, fallback = null }: ToggleProps) {
    if (!FEATURE_FLAGS.IS_CURRENCY_ENABLED) {
      return <>{fallback}</>;
    }
    return <>{children}</>;
  }
  ```

- [ ] **Step 3: Commit feature flag configuration**
  ```bash
  git add src/config/features.ts src/modules/economy/components/CurrencyFeatureToggle.tsx
  git commit -m "feat: add feature flag control and wrapper component"
  ```

---

### Task 3: Economy Utility & Server Functions (Odds & Rewards)

**Files:**
- Create: `src/modules/economy/utils/odds.ts`
- Create: `src/modules/economy/utils/rewards.ts`
- Create: `scripts/verify-formulas.ts`

- [ ] **Step 1: Write odds logic**
  Create `src/modules/economy/utils/odds.ts` with a 40% house edge:
  ```typescript
  export function calculateOdds(
    ratings: number[],
    historicalAverage: number,
    recentRatings: number[]
  ) {
    if (ratings.length < 3) {
      return { over: 1.20, under: 1.20 };
    }

    // Standard deviation
    const n = ratings.length;
    const mean = historicalAverage;
    const variance = ratings.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.max(Math.sqrt(variance), 0.8);

    // Recent form vs overall average
    const recentMean = recentRatings.length > 0 
      ? recentRatings.reduce((sum, val) => sum + val, 0) / recentRatings.length 
      : mean;

    const z = (recentMean - mean) / stdDev;

    // Over probability estimate
    const pOver = Math.max(0.15, Math.min(0.85, 0.5 + 0.1 * z));
    const pUnder = 1 - pOver;

    // 40% House Edge: Odds = 0.6 / Probability
    const oddsOver = Math.max(1.05, Math.min(3.00, Number((0.6 / pOver).toFixed(2))));
    const oddsUnder = Math.max(1.05, Math.min(3.00, Number((0.6 / pUnder).toFixed(2))));

    return { over: oddsOver, under: oddsUnder };
  }
  ```

- [ ] **Step 2: Write rewards logic**
  Create `src/modules/economy/utils/rewards.ts` to calculate coins and attendance streak:
  ```typescript
  export function calculateRewards(
    avgTotal: number,
    isMvp: boolean,
    isPoop: boolean,
    isBigpaper: boolean,
    streak: number
  ) {
    // 1. Performance Reward
    const ccPerformance = Math.floor(Math.pow(avgTotal, 2) * 10);

    // 2. Awards
    let ccAwards = 0;
    if (isMvp) ccAwards += 300;
    if (isPoop || isBigpaper) ccAwards -= 100;

    // 3. Attendance streak (capped at 250 CC)
    const ccStreak = Math.min(250, streak * 50);

    return {
      performance: ccPerformance,
      awards: ccAwards,
      streak: ccStreak,
      total: ccPerformance + ccAwards + ccStreak,
    };
  }
  ```

- [ ] **Step 3: Create validation script**
  Create `scripts/verify-formulas.ts` to execute mathematical tests:
  ```typescript
  import { calculateOdds } from "../src/modules/economy/utils/odds";
  import { calculateRewards } from "../src/modules/economy/utils/rewards";

  // Odds calculation tests
  const o1 = calculateOdds([7.0, 7.5, 8.0, 7.2], 7.425, [8.0, 7.8, 7.9]);
  console.log("Hot Player Odds (Expect Over odds lower than Under):", o1);
  
  const o2 = calculateOdds([7.0, 7.2], 7.1, [7.1]);
  console.log("No History Player Odds (Expect 1.20):", o2);

  // Rewards tests
  const r1 = calculateRewards(7.5, true, false, false, 3);
  console.log("MVP player with streak 3:", r1); // 562 + 300 + 150 = 1012

  if (Math.abs(r1.total - 1012) > 2) {
    console.error("Verification failed!");
    process.exit(1);
  }
  console.log("All formula validations PASSED.");
  ```

- [ ] **Step 4: Run validation script**
  Run: `npx ts-node scripts/verify-formulas.ts`
  Expected output: `All formula validations PASSED.`

- [ ] **Step 5: Commit utilities**
  ```bash
  git add src/modules/economy/utils/odds.ts src/modules/economy/utils/rewards.ts scripts/verify-formulas.ts
  git commit -m "feat: add odds and rewards calculation formulas"
  ```

---

### Task 4: Economy Server Actions (Wallets, Bets, Shop Services)

**Files:**
- Create: `src/modules/economy/services/db.ts`
- Create: `src/modules/economy/services/wallet.ts`
- Create: `src/modules/economy/services/bets.ts`
- Create: `src/modules/economy/services/shop.ts`
- Modify: `src/actions/sessions.ts`

- [ ] **Step 1: Write DB service wrapper**
  Create `src/modules/economy/services/db.ts` to expose client integrations:
  ```typescript
  import { createSupabaseServerClient } from "@/lib/supabase";

  export async function getPlayerWallet(playerId: string) {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase
      .from("economy_wallets")
      .select("*")
      .eq("player_id", playerId)
      .maybeSingle();

    if (!data) {
      // Create wallet if it doesn't exist
      const { data: newWallet } = await supabase
        .from("economy_wallets")
        .insert({ player_id: playerId, balance: 0 })
        .select()
        .single();
      return newWallet;
    }
    return data;
  }
  ```

- [ ] **Step 2: Write wallet server action**
  Create `src/modules/economy/services/wallet.ts`:
  ```typescript
  "use server";
  import { createSupabaseServerClient, supabaseAdmin } from "@/lib/supabase";
  import { getPlayerWallet } from "./db";

  export async function addCoins(playerId: string, amount: number, type: string, matchId?: string, description?: string) {
    const supabase = createSupabaseServerClient();
    const wallet = await getPlayerWallet(playerId);

    const newBalance = wallet.balance + amount;
    if (newBalance < 0) {
      return { error: "Saldo insuficiente" };
    }

    const { error: walletError } = await supabase
      .from("economy_wallets")
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq("player_id", playerId);

    if (walletError) return { error: walletError.message };

    await supabase.from("economy_transactions").insert({
      player_id: playerId,
      amount,
      type,
      match_id: matchId,
      description,
    });

    return { success: true, balance: newBalance };
  }
  ```

- [ ] **Step 3: Write bets server action**
  Create `src/modules/economy/services/bets.ts` with integrity validation:
  ```typescript
  "use server";
  import { createSupabaseServerClient } from "@/lib/supabase";
  import { getCurrentProfile } from "@/actions/auth";
  import { addCoins } from "./wallet";

  export async function placeBet(matchId: string, betType: string, targetPlayerId: string | null, lineValue: number, odds: number, amount: number) {
    const profile = await getCurrentProfile();
    if (!profile) return { error: "No autorizado" };

    const supabase = createSupabaseServerClient();
    
    // Check if match is already locked (ratings exist)
    const { count } = await supabase
      .from("ratings")
      .select("*", { count: "exact", head: true })
      .eq("match_id", matchId);
    
    const { count: teamCount } = await supabase
      .from("team_ratings")
      .select("*", { count: "exact", head: true })
      .eq("match_id", matchId);

    if ((count ?? 0) > 0 || (teamCount ?? 0) > 0) {
      return { error: "Las apuestas ya están cerradas para este partido" };
    }

    // Deduct coins
    const deductRes = await addCoins(profile.id, -amount, "bet_place", matchId, `Apuesta de ${amount} CC`);
    if (deductRes.error) return { error: deductRes.error };

    // Insert bet
    const { error: betError } = await supabase
      .from("economy_bets")
      .insert({
        match_id: matchId,
        player_id: profile.id,
        bet_type: betType,
        target_player_id: targetPlayerId,
        line_value: lineValue,
        odds,
        amount,
        status: "pending",
      });

    if (betError) {
      // Refund
      await addCoins(profile.id, amount, "bet_refund", matchId, "Reembolso por fallo en inserción de apuesta");
      return { error: betError.message };
    }

    return { success: true };
  }
  ```

- [ ] **Step 4: Write shop server action**
  Create `src/modules/economy/services/shop.ts` for items and equipping:
  ```typescript
  "use server";
  import { createSupabaseServerClient } from "@/lib/supabase";
  import { getCurrentProfile } from "@/actions/auth";
  import { addCoins } from "./wallet";

  export async function purchaseItem(itemId: string, itemType: string, cost: number, matchId?: string) {
    const profile = await getCurrentProfile();
    if (!profile) return { error: "No autorizado" };

    const supabase = createSupabaseServerClient();

    // Deduct coins
    const deductRes = await addCoins(profile.id, -cost, "purchase", matchId, `Compra de ${itemId}`);
    if (deductRes.error) return { error: deductRes.error };

    const { error } = await supabase
      .from("economy_inventory")
      .insert({
        player_id: profile.id,
        item_id: itemId,
        item_type: itemType,
        match_id: matchId || null,
      });

    if (error) {
      await addCoins(profile.id, cost, "bet_refund", matchId, `Reembolso por fallo en compra de ${itemId}`);
      return { error: error.message };
    }

    return { success: true };
  }

  export async function equipCosmetic(itemType: string, itemId: string | null) {
    const profile = await getCurrentProfile();
    if (!profile) return { error: "No autorizado" };

    const supabase = createSupabaseServerClient();
    
    const updateObj: Record<string, any> = {};
    if (itemType === "avatar_border") updateObj.avatar_border = itemId;
    if (itemType === "field_design") updateObj.field_design = itemId;
    if (itemType === "profile_title") updateObj.profile_title = itemId;

    const { error } = await supabase
      .from("economy_equipped")
      .upsert({
        player_id: profile.id,
        ...updateObj,
        updated_at: new Date().toISOString(),
      });

    if (error) return { error: error.message };
    return { success: true };
  }
  ```

- [ ] **Step 5: Integrate into closing session hook**
  Modify `src/actions/sessions.ts` around line 99:
  ```typescript
  // ... imports ...
  import { FEATURE_FLAGS } from "@/config/features";
  
  // inside closeSession(sessionId: string):
  // AFTER calling supabaseAdmin.rpc("compute_historical_ratings"):
  if (FEATURE_FLAGS.IS_CURRENCY_ENABLED) {
    // Dynamically calculate and distribute coins and resolve bets
    await mintCoinsAndResolveBets(sessionId);
  }
  ```

  And define the server function `mintCoinsAndResolveBets` inside a new helper:
  Create `src/modules/economy/services/settlement.ts` containing the code that computes streaks, rewards, resolves bets, and updates db rows.

- [ ] **Step 6: Commit server actions**
  ```bash
  git add src/modules/economy/services/
  git commit -m "feat: implement server actions for bets, shop, wallet, and settlement"
  ```

---

### Task 5: Wallet Indicator & Navbar Integration

**Files:**
- Create: `src/modules/economy/components/WalletIndicator.tsx`
- Modify: `src/components/layouts/Navbar.tsx`

- [ ] **Step 1: Create WalletIndicator**
  Create `src/modules/economy/components/WalletIndicator.tsx` using framer-motion:
  ```tsx
  "use client";
  import { useEffect, useState } from "react";
  import { createSupabaseServerClient } from "@/lib/supabase";
  import { FEATURE_FLAGS } from "@/config/features";
  
  export default function WalletIndicator({ playerId }: { playerId: string }) {
    const [balance, setBalance] = useState<number | null>(null);

    useEffect(() => {
      if (!FEATURE_FLAGS.IS_CURRENCY_ENABLED) return;
      // Fetch wallet balance
      // Subscribe to real-time wallet changes
    }, [playerId]);

    if (balance === null) return null;

    return (
      <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", color: "#ffd700", fontFamily: "'Bebas Neue', sans-serif" }}>
        <span>🪙</span>
        <span>{balance} CC</span>
      </div>
    );
  }
  ```

- [ ] **Step 2: Add to Navbar layout**
  Update `src/components/layouts/Navbar.tsx` to include `WalletIndicator` inside the user section when the flag is enabled.

- [ ] **Step 3: Commit UI components**
  ```bash
  git add src/modules/economy/components/WalletIndicator.tsx src/components/layouts/Navbar.tsx
  git commit -m "feat: add wallet indicator to the navigation bar"
  ```

---

### Task 6: Betting Page `/bets` & Integrity Filter

**Files:**
- Create: `src/app/bets/page.tsx`
- Modify: `src/components/session/VotingCard.tsx`

- [ ] **Step 1: Create betting page**
  Create `src/app/bets/page.tsx` to calculate odds, render the Over/Under forms, and list past/active bets.

- [ ] **Step 2: Add integrity check in VotingCard**
  Modify `src/components/session/VotingCard.tsx` to check if a bet exists on the player. If it does, show the overlay and block inputs.

- [ ] **Step 3: Commit betting module**
  ```bash
  git add src/app/bets/page.tsx src/components/session/VotingCard.tsx
  git commit -m "feat: implement bets dashboard and integrity checks"
  ```

---

### Task 7: Shop page `/shop` & Profile Cosmetics

**Files:**
- Create: `src/app/shop/page.tsx`
- Modify: `src/components/profile/FootballField.tsx`
- Modify: `src/components/profile/ProfileView.tsx`

- [ ] **Step 1: Create Shop grid**
  Create `src/app/shop/page.tsx` to handle inventory listings, purchase actions, and cosmetic equipping options.

- [ ] **Step 2: Apply cosmetics to FootballField**
  Update `src/components/profile/FootballField.tsx` to support custom styles/classes for Stadium, Potrero, and Synthetic designs.

- [ ] **Step 3: Apply titles and borders to profile**
  Update `src/components/profile/ProfileView.tsx` to fetch `economy_equipped` and wrap the avatar with custom borders/add the title prefix.

- [ ] **Step 4: Commit UI styling cosmetics**
  ```bash
  git add src/app/shop/page.tsx src/components/profile/FootballField.tsx src/components/profile/ProfileView.tsx
  git commit -m "feat: add shop grid and apply equipped cosmetics to profiles"
  ```

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-05-cotorra-economy.md`.

Please select your preferred execution method:
1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
