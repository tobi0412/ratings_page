'use server';

import { createSupabaseServerClient } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { getCurrentProfile } from './auth';
import { RatingInput } from '@/types';

export async function submitRating(input: RatingInput) {
  const supabase = createSupabaseServerClient(cookies());
  const profile = await getCurrentProfile();

  if (!profile) {
    return { error: 'Not authenticated' };
  }

  // Check vote doesn't exist
  const { data: existing } = await supabase
    .from('ratings')
    .select('id')
    .eq('match_id', input.match_id)
    .eq('voter_id', profile.id)
    .eq('receiver_id', input.receiver_id)
    .single();

  if (existing) {
    // Update existing vote
    const { data, error } = await supabase
      .from('ratings')
      .update({
        tecnica: input.tecnica,
        fisico: input.fisico,
        actitud: input.actitud,
        vision_juego: input.vision_juego,
        is_mvp: input.is_mvp,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data, success: true };
  } else {
    // Insert new vote
    const { data, error } = await supabase
      .from('ratings')
      .insert({
        match_id: input.match_id,
        voter_id: profile.id,
        receiver_id: input.receiver_id,
        tecnica: input.tecnica,
        fisico: input.fisico,
        actitud: input.actitud,
        vision_juego: input.vision_juego,
        is_mvp: input.is_mvp,
      })
      .select()
      .single();

    if (error) {
      return { error: error.message };
    }

    return { data, success: true };
  }
}

export async function getPlayerVotes(matchId: string, voterId: string) {
  const supabase = createSupabaseServerClient(cookies());
  const profile = await getCurrentProfile();

  if (!profile) {
    return [];
  }

  const { data } = await supabase
    .from('ratings')
    .select('*')
    .eq('match_id', matchId)
    .eq('voter_id', voterId);

  return data || [];
}

export async function getMatchRatings(matchId: string) {
  const supabase = createSupabaseServerClient(cookies());
  const { data } = await supabase
    .from('ratings')
    .select('*')
    .eq('match_id', matchId);

  return data || [];
}
