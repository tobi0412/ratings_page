"use server";
import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "@/actions/auth";
import { addCoins } from "./wallet";

export async function purchaseItem(itemId: string, itemType: "tactical" | "avatar_border" | "field_design" | "profile_title", cost: number, matchId?: string) {
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
    // Refund
    await addCoins(profile.id, cost, "bet_refund", matchId, `Reembolso por fallo en compra de ${itemId}`);
    return { error: error.message };
  }

  return { success: true };
}

export async function equipCosmetic(itemType: "avatar_border" | "field_design" | "profile_title", itemId: string | null) {
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

export async function getPlayerInventory() {
  const profile = await getCurrentProfile();
  if (!profile) return [];

  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("economy_inventory")
    .select("*")
    .eq("player_id", profile.id);

  return data || [];
}

export async function getEquippedCosmetics(playerId: string) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("economy_equipped")
    .select("*")
    .eq("player_id", playerId)
    .maybeSingle();

  return data || null;
}

export async function infiltrateData(targetPlayerId: string) {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "No autorizado" };

  const cost = 2500;
  const supabase = createSupabaseServerClient();

  // 1. Get last closed session
  const { data: lastClosed, error: sessionError } = await supabase
    .from("match_sessions")
    .select("id, name")
    .eq("is_active", false)
    .order("closed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (sessionError || !lastClosed) {
    return { error: "No se encontró ninguna sesión cerrada recientemente." };
  }

  // 2. Perform the purchase (deduct 2500 CC)
  const purchaseRes = await purchaseItem("infiltracion_datos", "tactical", cost, lastClosed.id);
  if (purchaseRes.error) return { error: purchaseRes.error };

  // 3. Query the ratings targetPlayerId gave to profile.id in last closed session
  const { data: rating, error: ratingError } = await supabase
    .from("ratings")
    .select("*")
    .eq("match_id", lastClosed.id)
    .eq("voter_id", targetPlayerId)
    .eq("receiver_id", profile.id)
    .maybeSingle();

  if (ratingError) {
    return { error: "Error al recuperar las calificaciones filtradas: " + ratingError.message };
  }

  return {
    success: true,
    sessionName: lastClosed.name,
    rating: rating || null,
  };
}
