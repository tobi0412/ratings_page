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

  // If this rating is marked as MVP, reset other MVP votes by this user in this match
  if (input.is_mvp) {
    const { error: resetError } = await supabase
      .from("ratings")
      .update({ is_mvp: false })
      .eq("match_id", input.match_id)
      .eq("voter_id", profile.id)
      .neq("receiver_id", input.receiver_id);

    if (resetError) {
      return { error: `Failed to reset previous MVP: ${resetError.message}` };
    }
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
        is_mvp: input.is_mvp,
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
