"use server";

import { createSupabaseServerClient, supabaseAdmin } from "@/lib/supabase";
import { getCurrentProfile } from "./auth";
import { Profile } from "@/types";
import { FEATURE_FLAGS } from "@/config/features";
import { mintCoinsAndResolveBets } from "@/modules/economy/services/settlement";
import { addCoins } from "@/modules/economy/services/wallet";

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

  // Close any active session to enforce only one active session at a time
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

  // Process pending pre-session bets (match_id is null)
  if (FEATURE_FLAGS.IS_CURRENCY_ENABLED) {
    try {
      const { data: pendingBets, error: betsErr } = await supabaseAdmin
        .from("economy_bets")
        .select("*")
        .is("match_id", null)
        .eq("status", "pending");

      if (!betsErr && pendingBets && pendingBets.length > 0) {
        for (const bet of pendingBets) {
          if (bet.target_player_id) {
            // Player-specific prop bet: check if target player participated
            if (playerIds.includes(bet.target_player_id)) {
              await supabaseAdmin
                .from("economy_bets")
                .update({ match_id: sessionData.id })
                .eq("id", bet.id);
            } else {
              // Refund the user's coins
              await addCoins(
                bet.player_id,
                bet.amount,
                "bet_refund",
                sessionData.id,
                `Reembolso de apuesta: el jugador no participó en este partido`
              );
              // Mark bet as refunded and link it to the match
              await supabaseAdmin
                .from("economy_bets")
                .update({ match_id: sessionData.id, status: "refunded" })
                .eq("id", bet.id);
            }
          } else {
            // Team-wide bet: associate it directly
            await supabaseAdmin
              .from("economy_bets")
              .update({ match_id: sessionData.id })
              .eq("id", bet.id);
          }
        }
      }
    } catch (e) {
      console.error("Error processing pending bets on session creation:", e);
    }
  }

  return { data: sessionData, success: true };
}

export async function activateSession(sessionId: string) {
  const supabase = createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can activate sessions" };
  }

  // Close any active sessions to enforce the single active session rule
  await supabase
    .from("match_sessions")
    .update({ is_active: false, closed_at: new Date().toISOString() })
    .eq("is_active", true);

  const { data, error } = await supabase
    .from("match_sessions")
    .update({
      is_active: true,
    })
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  return { data, success: true };
}

export async function getUpcomingSession() {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("match_sessions")
    .select("*")
    .eq("is_active", false)
    .is("closed_at", null)
    .order("created_at", { ascending: false })
    .limit(1);
  return data && data.length > 0 ? data[0] : null;
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

  if (FEATURE_FLAGS.IS_CURRENCY_ENABLED) {
    try {
      await mintCoinsAndResolveBets(sessionId);
    } catch (e) {
      console.error("Error minting coins or resolving bets:", e);
    }
  }

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

  // 4. Fetch the team rating submitted by the mystery player
  const { data: teamRatingData } = await supabase
    .from("team_ratings")
    .select("rating")
    .eq("match_id", sessionId)
    .eq("voter_id", mysteryPlayerId)
    .maybeSingle();

  return { 
    voter: voterProfile, 
    votes: votes || [],
    teamRating: teamRatingData ? Number(teamRatingData.rating) : null
  };
}

export async function getSessionVotingProgress(sessionId: string) {
  const supabase = createSupabaseServerClient();
  const profile = await getCurrentProfile();

  if (!profile || profile.role !== "admin") {
    return { error: "Only admins can view voting progress", success: false };
  }

  // 1. Get all session participants
  const { data: participantsData, error: partError } = await supabase
    .from("session_participants")
    .select("player:profiles(*)")
    .eq("match_id", sessionId);

  if (partError || !participantsData) {
    return { error: partError?.message || "Failed to load participants", success: false };
  }

  const participants = participantsData.map((d: any) => d.player).filter(Boolean) as Profile[];
  const totalParticipants = participants.length;

  // 2. Get ratings data for this match to check both count and awards completeness
  const { data: ratingsData, error: ratingsError } = await supabaseAdmin
    .from("ratings")
    .select("voter_id, is_mvp, is_bigpaper, is_poop, tecnica")
    .eq("match_id", sessionId);

  if (ratingsError) {
    return { error: ratingsError.message, success: false };
  }

  // 3. Get team ratings for this match
  const { data: teamRatingsData, error: teamRatingsError } = await supabaseAdmin
    .from("team_ratings")
    .select("voter_id, rating")
    .eq("match_id", sessionId);

  if (teamRatingsError) {
    return { error: teamRatingsError.message, success: false };
  }

  const progress = participants.map((player) => {
    const voterRatings = (ratingsData || []).filter((r) => r.voter_id === player.id);
    
    // Count rows where the user actually rated the player (tecnica is not null)
    const votesSubmitted = voterRatings.filter((r) => r.tecnica !== null).length;
    
    // Check if the user selected each of the session awards
    const hasMvp = voterRatings.some((r) => r.is_mvp === true);
    const hasBigpaper = voterRatings.some((r) => r.is_bigpaper === true);
    const hasPoop = voterRatings.some((r) => r.is_poop === true);
    const awardsCompleted = hasMvp;

    // Check if team rating was submitted
    const hasTeamRating = (teamRatingsData || []).some((tr) => tr.voter_id === player.id);

    // A player votes for all other participants (total - 1)
    const maxVotes = Math.max(0, totalParticipants - 1);
    
    return {
      player,
      votesSubmitted,
      maxVotes,
      isCompleted: votesSubmitted >= maxVotes && maxVotes > 0 && awardsCompleted && hasTeamRating,
      hasStarted: votesSubmitted > 0 || hasMvp || hasBigpaper || hasPoop || hasTeamRating,
      awardsCompleted,
      hasMvp,
      hasBigpaper,
      hasPoop,
      hasTeamRating,
    };
  });

  return { data: progress, success: true };
}
