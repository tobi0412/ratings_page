"use server";

import { createSupabaseServerClient } from "@/lib/supabase";
import { getCurrentProfile } from "./auth";
import { RatingInput } from "@/types";

export async function submitRating(input: RatingInput) {
  const supabase = createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: "Not authenticated" };
  }

  // Atomic upsert — avoids the check-then-insert race condition
  // ON CONFLICT targets the unique constraint (match_id, voter_id, receiver_id)
  const { data, error } = await supabase
    .from("ratings")
    .upsert(
      {
        match_id: input.match_id,
        voter_id: profile.id,
        receiver_id: input.receiver_id,
        tecnica: input.tecnica,
        fisico: input.fisico,
        actitud: input.actitud,
        vision_juego: input.vision_juego,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,voter_id,receiver_id" },
    )
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, success: true };
}

export async function submitSessionAwards(input: {
  match_id: string;
  mvp_id: string;
  bigpaper_id: string;
  poop_id: string;
}) {
  const supabase = createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: "Not authenticated" };
  }

  // 1. Reset all special flags for this voter in this match session
  const { error: resetError } = await supabase
    .from("ratings")
    .update({ is_mvp: false, is_bigpaper: false, is_poop: false })
    .eq("match_id", input.match_id)
    .eq("voter_id", profile.id);

  if (resetError) {
    return { error: `Failed to reset previous awards: ${resetError.message}` };
  }

  // Helper to upsert a rating row with an award flag set to true
  const saveAward = async (receiverId: string, awardField: "is_mvp" | "is_bigpaper" | "is_poop") => {
    if (!receiverId) return;

    // Check if a row already exists
    const { data: existing } = await supabase
      .from("ratings")
      .select("id, tecnica, fisico, actitud, vision_juego")
      .eq("match_id", input.match_id)
      .eq("voter_id", profile.id)
      .eq("receiver_id", receiverId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from("ratings")
        .update({ [awardField]: true })
        .eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("ratings")
        .insert({
          match_id: input.match_id,
          voter_id: profile.id,
          receiver_id: receiverId,
          tecnica: null,
          fisico: null,
          actitud: null,
          vision_juego: null,
          is_mvp: awardField === "is_mvp",
          is_bigpaper: awardField === "is_bigpaper",
          is_poop: awardField === "is_poop",
        });
      if (error) throw error;
    }
  };

  try {
    if (input.mvp_id) await saveAward(input.mvp_id, "is_mvp");
    if (input.bigpaper_id) await saveAward(input.bigpaper_id, "is_bigpaper");
    if (input.poop_id) await saveAward(input.poop_id, "is_poop");
    return { success: true };
  } catch (err: any) {
    return { error: err.message || "Failed to save awards" };
  }
}

export async function getPlayerVotes(matchId: string, voterId: string) {
  const supabase = createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!profile) {
    return [];
  }

  const { data } = await supabase
    .from("ratings")
    .select("*")
    .eq("match_id", matchId)
    .eq("voter_id", voterId);

  return data || [];
}

export async function getMatchRatings(matchId: string) {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("ratings")
    .select("*")
    .eq("match_id", matchId);

  return data || [];
}

