"use server";

import { createSupabaseServerClient } from "@/lib/supabase";

export async function getHistoricalStats() {
  const supabase = createSupabaseServerClient();

  const { data: sessions } = await supabase
    .from("match_sessions")
    .select("*")
    .eq("is_active", false)
    .order("created_at", { ascending: true });

  const { data: historicalRatings } = await supabase
    .from("historical_ratings")
    .select("*")
    .order("computed_at", { ascending: true });

  return { sessions: sessions || [], ratings: historicalRatings || [] };
}

export async function getPlayerStats(playerId: string) {
  const supabase = createSupabaseServerClient();

  const { data } = await supabase
    .from("historical_ratings")
    .select("*")
    .eq("player_id", playerId)
    .order("computed_at", { ascending: true });

  return data || [];
}

export async function getAllPlayersStats() {
  const supabase = createSupabaseServerClient();

  // Single relational query: Supabase fetches profiles + their historical_ratings
  // in one round-trip using the FK relationship, avoiding loading all rows into JS
  const { data: profiles } = await supabase
    .from("profiles")
    .select(
      `
      id,
      username,
      avatar_url,
      role,
      auth_id,
      created_at,
      updated_at,
      historical_ratings (
        avg_total,
        avg_tecnica,
        avg_fisico,
        avg_actitud,
        avg_vision_juego,
        mvp_count
      )
    `,
    )
    .eq("role", "player");

  const statsMap: { [key: string]: any } = {};

  profiles?.forEach((profile) => {
    const playerRatings = profile.historical_ratings || [];
    const count = playerRatings.length;

    const avg = (key: keyof (typeof playerRatings)[0]) =>
      count > 0
        ? playerRatings.reduce((sum, r) => sum + (Number(r[key]) || 0), 0) /
          count
        : 0;

    const { historical_ratings, ...profileData } = profile;

    statsMap[profile.id] = {
      profile: profileData,
      avgTotal: avg("avg_total"),
      avgTecnica: avg("avg_tecnica"),
      avgFisico: avg("avg_fisico"),
      avgActitud: avg("avg_actitud"),
      avgVision: avg("avg_vision_juego"),
      mvpCount: playerRatings.reduce((sum, r) => sum + (r.mvp_count || 0), 0),
    };
  });

  return statsMap;
}

export async function getTopMVPs() {
  const supabase = createSupabaseServerClient();

  const { data } = await supabase
    .from("historical_ratings")
    .select(
      "player_id, profiles!historical_ratings_player_id_fkey(username), mvp_count",
    )
    .order("mvp_count", { ascending: false })
    .limit(3);

  return data || [];
}
