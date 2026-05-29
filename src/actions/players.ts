"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentProfile } from "./auth";
import { Profile } from "@/types";

export async function getAllPlayers(): Promise<Profile[]> {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return [];
  }

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("role", "player")
    .order("created_at", { ascending: true });

  return data || [];
}

export async function approvePlayer(
  playerId: string,
): Promise<{ error?: string }> {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return { error: "Solo el admin puede aprobar jugadores" };
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", playerId)
    .eq("role", "player");

  if (error) return { error: error.message };
  return {};
}

export async function rejectPlayer(
  playerId: string,
): Promise<{ error?: string }> {
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return { error: "Solo el admin puede rechazar jugadores" };
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ status: "rejected" })
    .eq("id", playerId)
    .eq("role", "player");

  if (error) return { error: error.message };
  return {};
}
