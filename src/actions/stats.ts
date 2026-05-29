'use server';

import { createSupabaseServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';

export async function getHistoricalStats() {
  const supabase = createSupabaseServerClient(cookies());

  const { data: sessions } = await supabase
    .from('match_sessions')
    .select('*')
    .eq('is_active', false)
    .order('created_at', { ascending: true });

  const { data: historicalRatings } = await supabase
    .from('historical_ratings')
    .select('*')
    .order('computed_at', { ascending: true });

  return { sessions: sessions || [], ratings: historicalRatings || [] };
}

export async function getPlayerStats(playerId: string) {
  const supabase = createSupabaseServerClient(cookies());

  const { data } = await supabase
    .from('historical_ratings')
    .select('*')
    .eq('player_id', playerId)
    .order('computed_at', { ascending: true });

  return data || [];
}

export async function getAllPlayersStats() {
  const supabase = createSupabaseServerClient(cookies());

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'player');

  const { data: historicalRatings } = await supabase
    .from('historical_ratings')
    .select('*');

  const statsMap: { [key: string]: any } = {};

  profiles?.forEach((profile) => {
    const playerRatings = historicalRatings?.filter(
      (r) => r.player_id === profile.id
    ) || [];

    const avgTotal =
      playerRatings.length > 0
        ? playerRatings.reduce((sum, r) => sum + (r.avg_total || 0), 0) /
          playerRatings.length
        : 0;

    const avgTecnica =
      playerRatings.length > 0
        ? playerRatings.reduce((sum, r) => sum + (r.avg_tecnica || 0), 0) /
          playerRatings.length
        : 0;

    const avgFisico =
      playerRatings.length > 0
        ? playerRatings.reduce((sum, r) => sum + (r.avg_fisico || 0), 0) /
          playerRatings.length
        : 0;

    const avgActitud =
      playerRatings.length > 0
        ? playerRatings.reduce((sum, r) => sum + (r.avg_actitud || 0), 0) /
          playerRatings.length
        : 0;

    const avgVision =
      playerRatings.length > 0
        ? playerRatings.reduce((sum, r) => sum + (r.avg_vision_juego || 0), 0) /
          playerRatings.length
        : 0;

    const mvpCount = playerRatings.reduce((sum, r) => sum + r.mvp_count, 0);

    statsMap[profile.id] = {
      profile,
      avgTotal,
      avgTecnica,
      avgFisico,
      avgActitud,
      avgVision,
      mvpCount,
    };
  });

  return statsMap;
}

export async function getTopMVPs() {
  const supabase = createSupabaseServerClient(cookies());

  const { data } = await supabase
    .from('historical_ratings')
    .select('player_id, profiles!historical_ratings_player_id_fkey(username), mvp_count')
    .order('mvp_count', { ascending: false })
    .limit(3);

  return data || [];
}
