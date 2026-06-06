"use server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/actions/auth";
import { addCoins } from "./wallet";

export async function placeBet(
  betType: "player_prop_over" | "player_prop_under" | "team_total_over" | "team_total_under",
  targetPlayerId: string | null,
  lineValue: number,
  odds: number,
  amount: number
) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "No autorizado" };

  const supabase = createSupabaseServerClient();
  
  // Verify that there is no active voting session
  const { data: activeSessions, error: activeErr } = await supabase
    .from("match_sessions")
    .select("id")
    .eq("is_active", true);

  if (activeErr) {
    return { error: "Error al verificar el estado de la sesión." };
  }

  if (activeSessions && activeSessions.length > 0) {
    return { error: "No se puede apostar mientras haya una sesión de votación activa." };
  }

  // Deduct coins
  const deductRes = await addCoins(
    profile.id,
    -amount,
    "bet_place",
    undefined,
    `Apuesta de ${amount} CC`
  );
  if (deductRes.error) return { error: deductRes.error };

  // Insert bet with match_id: null (pending pre-session bet)
  const { error: betError } = await supabase
    .from("economy_bets")
    .insert({
      match_id: null,
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
    await addCoins(
      profile.id,
      amount,
      "bet_refund",
      undefined,
      "Reembolso por fallo en inserción de apuesta"
    );
    return { error: betError.message };
  }

  return { success: true };
}

export async function getPlayerBets(matchId?: string) {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = createSupabaseServerClient();
  let query = supabase
    .from("economy_bets")
    .select("*, target_player:profiles!economy_bets_target_player_id_fkey(*)")
    .eq("player_id", profile.id)
    .order("created_at", { ascending: false });

  if (matchId) {
    query = query.eq("match_id", matchId);
  }

  const { data } = await query;
  return data || [];
}

export async function getVoterLockedTargets(matchId: string, voterId: string): Promise<string[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("economy_bets")
    .select("target_player_id")
    .eq("match_id", matchId)
    .eq("player_id", voterId)
    .not("target_player_id", "is", null);
  
  if (!data) return [];
  return data.map((d: any) => d.target_player_id).filter(Boolean) as string[];
}
