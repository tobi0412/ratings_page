"use client";

import { getActiveSessions } from "@/actions/sessions";
import { getPlayerVotes } from "@/actions/ratings";
import { getCurrentProfile } from "@/actions/auth";
import SessionStatus from "@/components/session/SessionStatus";
import VotingCard from "@/components/session/VotingCard";
import VotingProgress from "@/components/session/VotingProgress";
import { MatchSession, Profile, Rating } from "@/types";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const [session, setSession] = useState<MatchSession | null>(null);
  const [players, setPlayers] = useState<Profile[]>([]);
  const [myVotes, setMyVotes] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const profileData = await getCurrentProfile();
      const sessionsData = await getActiveSessions();

      if (!profileData || sessionsData.length === 0) {
        setLoading(false);
        return;
      }

      const activeSession = sessionsData[0];
      setSession(activeSession);

      // Get my votes for this session
      const votesData = await getPlayerVotes(activeSession.id, profileData.id);
      setMyVotes(votesData);

      // For now, set empty players array until team members can be fetched
      // TODO: Implement getTeamMembers action to fetch all team players
      setPlayers([]);

      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <SessionStatus session={null} />
      </div>
    );
  }

  const votedCount = myVotes.length;
  const totalPlayers = players.length;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <SessionStatus session={session} />
      <VotingProgress totalPlayers={totalPlayers} votedCount={votedCount} />

      <div>
        <h2 className="text-2xl font-bold mb-4">Votación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {players.map((player) => (
            <VotingCard
              key={player.id}
              receiver={player}
              matchId={session.id}
              existingRating={myVotes.find((v) => v.receiver_id === player.id)}
              onSuccess={() => {
                // Refresh votes
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
