import { createSupabaseServerClient } from "@/lib/supabase";
import { calculateRewards } from "../utils/rewards";

import { addCoins } from "./wallet";

export async function calculateStreakForPlayer(playerId: string, closedSessions: { id: string }[]): Promise<number> {
  const supabase = createSupabaseServerClient();
  let streak = 0;

  for (const session of closedSessions) {
    const { data: participant } = await supabase
      .from("session_participants")
      .select("id")
      .eq("match_id", session.id)
      .eq("player_id", playerId)
      .maybeSingle();

    if (participant) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function mintCoinsAndResolveBets(sessionId: string) {
  const supabase = createSupabaseServerClient();

  // 1. Fetch all closed sessions ordered by closed_at DESC (current session is first)
  const { data: closedSessions, error: sessionErr } = await supabase
    .from("match_sessions")
    .select("id")
    .eq("is_active", false)
    .order("closed_at", { ascending: false });

  if (sessionErr || !closedSessions || closedSessions.length === 0) {
    console.error("Error fetching closed sessions for streak calculation:", sessionErr);
    return;
  }

  // 2. Fetch session participants
  const { data: participants, error: partErr } = await supabase
    .from("session_participants")
    .select("player_id")
    .eq("match_id", sessionId);

  if (partErr || !participants) {
    console.error("Error fetching session participants:", partErr);
    return;
  }

  // 3. For each participant, calculate performance, awards, streak, and mint coins
  for (const p of participants) {
    const playerId = p.player_id;

    // Get ratings from historical_ratings for this session
    const { data: histRating } = await supabase
      .from("historical_ratings")
      .select("*")
      .eq("match_id", sessionId)
      .eq("player_id", playerId)
      .maybeSingle();

    if (!histRating) {
      console.warn(`No historical rating found for player ${playerId} in session ${sessionId}. Skipping mint.`);
      continue;
    }

    // Calculate streak (consecutive matches including the current closed session)
    const streak = await calculateStreakForPlayer(playerId, closedSessions);

    // Calculate payouts
    const rewards = calculateRewards(
      Number(histRating.avg_total || 0),
      Number(histRating.mvp_count || 0) > 0,
      Number(histRating.poop_count || 0) > 0,
      Number(histRating.bigpaper_count || 0) > 0,
      streak
    );

    // Credit coins to player wallet
    if (rewards.performance > 0) {
      await addCoins(playerId, rewards.performance, "reward_performance", sessionId, `Rendimiento de ${histRating.avg_total} en sesión`);
    }
    if (rewards.awards !== 0) {
      await addCoins(playerId, rewards.awards, "reward_performance", sessionId, rewards.awards > 0 ? "Premio MVP" : "Penalización por Premio Especial");
    }
    if (rewards.streak > 0) {
      await addCoins(playerId, rewards.streak, "reward_bonus", sessionId, `Bono de asistencia por racha x${streak}`);
    }
  }

  // 4. Resolve all pending bets for this session
  const { data: bets } = await supabase
    .from("economy_bets")
    .select("*")
    .eq("match_id", sessionId)
    .eq("status", "pending");

  if (!bets || bets.length === 0) return;

  for (const bet of bets) {
    let actualValue: number | null = null;

    if (bet.bet_type === "player_prop_over" || bet.bet_type === "player_prop_under") {
      // Fetch target player average
      const { data: targetRating } = await supabase
        .from("historical_ratings")
        .select("avg_total")
        .eq("match_id", sessionId)
        .eq("player_id", bet.target_player_id)
        .maybeSingle();
      
      actualValue = targetRating ? Number(targetRating.avg_total) : null;
    } else if (bet.bet_type === "team_total_over" || bet.bet_type === "team_total_under") {
      // Fetch team total rating
      const { data: sessionData } = await supabase
        .from("match_sessions")
        .select("team_rating")
        .eq("id", sessionId)
        .maybeSingle();

      actualValue = sessionData ? Number(sessionData.team_rating) : null;
    }

    // Determine status
    let status: "won" | "lost" | "refunded" = "lost";
    const line = Number(bet.line_value);

    if (actualValue === null) {
      status = "refunded";
    } else {
      const actual = Number(actualValue);
      if (bet.bet_type.endsWith("_over")) {
        if (actual > line) status = "won";
        else if (actual === line) status = "refunded";
      } else {
        if (actual < line) status = "won";
        else if (actual === line) status = "refunded";
      }
    }

    // Resolve
    if (status === "won") {
      const payout = Math.floor(bet.amount * Number(bet.odds));
      await addCoins(bet.player_id, payout, "bet_win", sessionId, `Ganancia de apuesta Over/Under (${bet.odds}x)`);
      
      await supabase
        .from("economy_bets")
        .update({ status: "won", resolved_at: new Date().toISOString() })
        .eq("id", bet.id);
    } else if (status === "refunded") {
      await addCoins(bet.player_id, bet.amount, "bet_refund", sessionId, "Reembolso de apuesta (Push/Empate)");
      
      await supabase
        .from("economy_bets")
        .update({ status: "refunded", resolved_at: new Date().toISOString() })
        .eq("id", bet.id);
    } else {
      await supabase
        .from("economy_bets")
        .update({ status: "lost", resolved_at: new Date().toISOString() })
        .eq("id", bet.id);
    }
  }
}
