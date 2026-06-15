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

export async function submitTeamRating(input: { match_id: string; rating: number }) {
  const supabase = createSupabaseServerClient();
  
  // 1. Fetch profile and session active check concurrently
  const [profile, sessionRes] = await Promise.all([
    getCurrentProfile(),
    supabase
      .from("match_sessions")
      .select("is_active")
      .eq("id", input.match_id)
      .single()
  ]);

  if (!profile) {
    return { error: "Not authenticated" };
  }

  const { data: session, error: sError } = sessionRes;
  if (sError || !session?.is_active) {
    return { error: "Voting is closed for this session" };
  }

  // 2. Fetch participants and votes concurrently to verify player rated everyone
  const [participantsRes, votesRes] = await Promise.all([
    supabase
      .from("session_participants")
      .select("player_id")
      .eq("match_id", input.match_id)
      .neq("player_id", profile.id),
    supabase
      .from("ratings")
      .select("receiver_id, tecnica, fisico, actitud, vision_juego")
      .eq("match_id", input.match_id)
      .eq("voter_id", profile.id)
  ]);

  const { data: participants } = participantsRes;
  const { data: votes } = votesRes;

  const otherParticipantsIds = (participants || []).map((p) => p.player_id);
  const votesCast = votes || [];

  const hasVotedForAll = otherParticipantsIds.every((pid) =>
    votesCast.some((v) => v.receiver_id === pid)
  );

  if (!hasVotedForAll) {
    return { error: "Debe calificar a todos los jugadores antes de calificar al equipo." };
  }

  // 3. Averaging Limit validation (max = Average + 1.5)
  const ratedVotes = votesCast.filter(
    (v) => v.tecnica !== null && v.fisico !== null && v.actitud !== null && v.vision_juego !== null
  );

  if (ratedVotes.length > 0) {
    const totalRatingsSum = ratedVotes.reduce(
      (sum, v) => sum + (v.tecnica! + v.fisico! + v.actitud! + v.vision_juego!),
      0
    );
    const totalRatingsCount = ratedVotes.length * 4;
    const averageVotesToOthers = totalRatingsSum / totalRatingsCount;

    const maxAllowed = averageVotesToOthers + 1.5;
    // Round to 1 decimal to avoid floating point precision edge cases when validating
    const roundedInput = Math.round(input.rating * 10) / 10;
    const roundedMax = Math.round(maxAllowed * 10) / 10;
    
    if (roundedInput > roundedMax + 0.01) { // 0.01 tolerance for float math
      return {
        error: `El rating del equipo (${input.rating.toFixed(1)}) supera el límite permitido de (${roundedMax.toFixed(1)}).`,
      };
    }
  }

  // 4. Save team rating
  const { data, error } = await supabase
    .from("team_ratings")
    .upsert(
      {
        match_id: input.match_id,
        voter_id: profile.id,
        rating: input.rating,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "match_id,voter_id" }
    )
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, success: true };
}

export async function getTeamRating(matchId: string) {
  const supabase = createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!profile) {
    return null;
  }

  const { data } = await supabase
    .from("team_ratings")
    .select("rating")
    .eq("match_id", matchId)
    .eq("voter_id", profile.id)
    .maybeSingle();

  return data ? (data.rating as number) : null;
}

