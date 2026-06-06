import { createSupabaseServerClient } from "@/lib/supabase";

export async function getPlayerWallet(playerId: string) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("economy_wallets")
    .select("*")
    .eq("player_id", playerId)
    .maybeSingle();

  if (!data) {
    // Create wallet if it doesn't exist (e.g. first-time player)
    const { data: newWallet } = await supabase
      .from("economy_wallets")
      .insert({ player_id: playerId, balance: 0 })
      .select()
      .single();
    return newWallet;
  }
  return data;
}
