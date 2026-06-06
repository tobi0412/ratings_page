"use server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getPlayerWallet } from "./db";

export async function addCoins(
  playerId: string,
  amount: number,
  type: "reward_performance" | "reward_bonus" | "purchase" | "bet_place" | "bet_win" | "bet_refund",
  matchId?: string,
  description?: string
) {
  const supabase = createSupabaseServerClient();
  const wallet = await getPlayerWallet(playerId);

  const newBalance = wallet.balance + amount;
  if (newBalance < 0) {
    return { error: "Saldo de Cotorra Coins (CC) insuficiente para realizar esta transacción." };
  }

  const { error: walletError } = await supabase
    .from("economy_wallets")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("player_id", playerId);

  if (walletError) return { error: walletError.message };

  const { error: transactionError } = await supabase
    .from("economy_transactions")
    .insert({
      player_id: playerId,
      amount,
      type,
      match_id: matchId || null,
      description: description || "",
    });

  if (transactionError) {
    // Rollback wallet update if transaction log fails
    await supabase
      .from("economy_wallets")
      .update({ balance: wallet.balance, updated_at: new Date().toISOString() })
      .eq("player_id", playerId);
    return { error: "Fallo al registrar la transacción en el historial." };
  }

  return { success: true, balance: newBalance };
}
