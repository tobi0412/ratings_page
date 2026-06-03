"use server";

import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentProfile } from "./auth";
import { Profile } from "@/types";

export async function getApprovedPlayers(): Promise<Profile[]> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return [];
  }

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: true });

  return data || [];
}

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

const VALID_POSITIONS = new Set([
  "PO", "DFC", "DFD", "DFI", "MCD", "MC", "MCO", "MD", "MI", "ED", "EI", "DC"
]);

export async function updatePlayerProfile(
  bio: string | null,
  favorite_positions: string[] | null,
): Promise<{ error?: string }> {
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: "No autorizado" };
  }

  // Security & Validation Checks
  let sanitizedBio = null;
  if (bio !== null) {
    sanitizedBio = bio.trim();
    if (sanitizedBio.length > 150) {
      return { error: "La biografía no puede exceder los 150 caracteres" };
    }
  }

  let sanitizedPositions = null;
  if (favorite_positions !== null) {
    if (!Array.isArray(favorite_positions)) {
      return { error: "Formato de posiciones inválido" };
    }
    if (favorite_positions.length > 3) {
      return { error: "No puedes seleccionar más de 3 posiciones" };
    }
    // Validate each position
    for (const pos of favorite_positions) {
      if (!VALID_POSITIONS.has(pos)) {
        return { error: `Posición inválida detectada: ${pos}` };
      }
    }
    // Remove duplicates just in case
    sanitizedPositions = Array.from(new Set(favorite_positions));
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ 
      bio: sanitizedBio, 
      favorite_positions: sanitizedPositions 
    })
    .eq("id", profile.id);

  if (error) return { error: error.message };
  return {};
}

export async function getPlayerProfileById(
  playerId: string
): Promise<Profile | null> {
  const profile = await getCurrentProfile();
  if (!profile) return null;

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", playerId)
    .single();

  if (error) {
    console.error("Error fetching player profile by id:", error.message);
    return null;
  }

  return data;
}

