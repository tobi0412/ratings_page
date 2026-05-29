'use client';

import { getHistoricalStats, getAllPlayersStats, getTopMVPs } from '@/actions/stats';
import RatingEvolutionChart from '@/components/charts/RatingEvolutionChart';
import ComparisonTable from '@/components/charts/ComparisonTable';
import { MatchSession, Profile } from '@/types';
import { useEffect, useState } from 'react';

interface PlayerStats {
  profile: Profile;
  avgTotal: number;
  avgTecnica: number;
  avgFisico: number;
  avgActitud: number;
  avgVision: number;
  mvpCount: number;
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState<MatchSession[]>([]);
  const [stats, setStats] = useState<{ [key: string]: PlayerStats }>({});
  const [topMVPs, setTopMVPs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [histData, playerStats, mvpData] = await Promise.all([
        getHistoricalStats(),
        getAllPlayersStats(),
        getTopMVPs(),
      ]);

      setSessions(histData.sessions);
      setStats(playerStats);
      setTopMVPs(mvpData);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
          <p className="text-yellow-800">
            No hay datos históricos aún. Completa las sesiones de votación para ver las estadísticas.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Histórico de Evaluaciones</h1>
        <p className="text-gray-600">
          Análisis de rendimiento del equipo a través de las sesiones de votación.
        </p>
      </div>

      <RatingEvolutionChart
        sessions={sessions}
        ratings={[]}
        players={Object.values(stats).map((s) => s.profile)}
      />

      <ComparisonTable stats={stats} />

      {topMVPs.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-bold mb-4">Top MVPs</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topMVPs.map((mvp, index) => (
              <div key={mvp.player_id} className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <div className="text-3xl font-bold text-yellow-600">#{index + 1}</div>
                <p className="font-bold text-lg mt-2">{mvp.profiles.username}</p>
                <p className="text-sm text-gray-600">{mvp.mvp_count} MVPs</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
