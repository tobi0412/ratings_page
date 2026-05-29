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
