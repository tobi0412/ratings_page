'use server';

import { createSupabaseServerClient } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { getCurrentProfile } from './auth';

export async function getActiveSessions() {
  const supabase = createSupabaseServerClient(cookies());
  const { data } = await supabase
    .from('match_sessions')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function getAllSessions() {
  const supabase = createSupabaseServerClient(cookies());
  const { data } = await supabase
    .from('match_sessions')
    .select('*')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function createSession(name: string) {
  const supabase = createSupabaseServerClient(cookies());
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Only admins can create sessions' };
  }

  // Close any active session
  await supabase
    .from('match_sessions')
    .update({ is_active: false, closed_at: new Date().toISOString() })
    .eq('is_active', true);

  const { data, error } = await supabase
    .from('match_sessions')
    .insert({
      name,
      created_by: profile.id,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, success: true };
}

export async function closeSession(sessionId: string) {
  const supabase = createSupabaseServerClient(cookies());
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== 'admin') {
    return { error: 'Only admins can close sessions' };
  }

  const { data, error } = await supabase
    .from('match_sessions')
    .update({
      is_active: false,
      closed_at: new Date().toISOString(),
    })
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  // Compute historical ratings
  await supabaseAdmin.rpc('compute_historical_ratings', { session_id: sessionId });

  return { data, success: true };
}

export async function getPendingApprovals() {
  const supabase = createSupabaseServerClient(cookies());
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== 'admin') {
    return [];
  }

  // In a real app, you'd track approval status. For MVP, assume all non-admin are pending.
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'player')
    .order('created_at', { ascending: false });

  return data || [];
}
