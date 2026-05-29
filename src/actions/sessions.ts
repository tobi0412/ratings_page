"use server";

import { createSupabaseServerClient, supabaseAdmin } from "@/lib/supabase";
import { getCurrentProfile } from "./auth";
import { Profile } from "@/types";

export async function getActiveSessions() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("match_sessions")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function getAllSessions() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("match_sessions")
    .select("*")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function createSession(name: string, playerIds: string[]) {
  const supabase = createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can create sessions" };
  }

  if (!playerIds || playerIds.length === 0) {
    return { error: "Deberías seleccionar al menos un jugador para la sesión." };
  }

  // Close any active session
  await supabase
    .from("match_sessions")
    .update({ is_active: false, closed_at: new Date().toISOString() })
    .eq("is_active", true);

  const { data: sessionData, error: sessionError } = await supabase
    .from("match_sessions")
    .insert({
      name,
      created_by: profile.id,
      is_active: true,
    })
    .select()
    .single();

  if (sessionError) {
    return { error: sessionError.message };
  }

  // Insert participants
  const participants = playerIds.map((playerId) => ({
    match_id: sessionData.id,
    player_id: playerId,
  }));

  const { error: participantsError } = await supabase
    .from("session_participants")
    .insert(participants);

  if (participantsError) {
    // Cleanup match session if participants creation failed
    await supabase.from("match_sessions").delete().eq("id", sessionData.id);
    return { error: participantsError.message };
  }

  return { data: sessionData, success: true };
}

export async function closeSession(sessionId: string) {
  const supabase = createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can close sessions" };
  }

  const { data, error } = await supabase
    .from("match_sessions")
    .update({
      is_active: false,
      closed_at: new Date().toISOString(),
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Compute historical ratings
  await supabaseAdmin.rpc("compute_historical_ratings", {
    session_id: sessionId,
  });

  return { data, success: true };
}

export async function getSessionParticipants(sessionId: string): Promise<Profile[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("session_participants")
    .select("player:profiles(*)")
    .eq("match_id", sessionId);

  if (!data) return [];
  return data.map((d: any) => d.player).filter(Boolean) as Profile[];
}

export async function getLastClosedSessionStatus() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("match_sessions")
    .select("id, name, closed_at, mystery_player_id")
    .eq("is_active", false)
    .order("closed_at", { ascending: false })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }
  
  const session = data[0];
  return {
    id: session.id,
    name: session.name,
    closed_at: session.closed_at,
    hasMysteryPlayer: !!session.mystery_player_id,
  };
}

export async function revealMysteryVote(sessionId: string) {
  const supabase = createSupabaseServerClient();
  
  // 1. Fetch session to get mystery_player_id
  const { data: sessionData, error: sessionError } = await supabase
    .from("match_sessions")
    .select("mystery_player_id")
    .eq("id", sessionId)
    .single();

  if (sessionError || !sessionData?.mystery_player_id) {
    return { error: "No mystery player found for this session" };
  }

  const mysteryPlayerId = sessionData.mystery_player_id;

  // 2. Fetch voter profile
  const { data: voterProfile, error: profileError } = await supabase
    .from("profiles")
    .select("id, username, avatar_url")
    .eq("id", mysteryPlayerId)
    .single();

  if (profileError || !voterProfile) {
    return { error: "Voter profile not found" };
  }

  // 3. Fetch votes cast by this mystery player
  const { data: votes, error: votesError } = await supabase
    .from("ratings")
    .select("*, receiver:profiles!ratings_receiver_id_fkey(*)")
    .eq("match_id", sessionId)
    .eq("voter_id", mysteryPlayerId);

  if (votesError) {
    return { error: votesError.message };
  }

  return { voter: voterProfile, votes: votes || [] };
}
