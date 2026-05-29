'use client';

import { Profile } from '@/types';

interface PlayerStats {
  profile: Profile;
  avgTotal: number;
  avgTecnica: number;
  avgFisico: number;
  avgActitud: number;
  avgVision: number;
  mvpCount: number;
}

interface ComparisonTableProps {
  stats: { [key: string]: PlayerStats };
}

export default function ComparisonTable({ stats }: ComparisonTableProps) {
  const sortedPlayers = Object.values(stats).sort(
    (a, b) => b.avgTotal - a.avgTotal
  );

  return (
    <div className="bg-white rounded-lg shadow p-6 overflow-x-auto">
      <h3 className="text-xl font-bold mb-4">Comparativa de Equipo</h3>
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left py-2 px-2">Jugador</th>
            <th className="text-center py-2 px-2">Rating Promedio</th>
            <th className="text-center py-2 px-2">Técnica</th>
            <th className="text-center py-2 px-2">Físico</th>
            <th className="text-center py-2 px-2">Actitud</th>
            <th className="text-center py-2 px-2">Visión</th>
            <th className="text-center py-2 px-2">MVP Count</th>
          </tr>
        </thead>
        <tbody>
          {sortedPlayers.map((player, index) => (
            <tr key={player.profile.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="py-3 px-2 font-medium">{player.profile.username}</td>
              <td className="text-center py-3 px-2">
                {player.avgTotal.toFixed(1)}/10
              </td>
              <td className="text-center py-3 px-2">
                {player.avgTecnica.toFixed(1)}
              </td>
              <td className="text-center py-3 px-2">
                {player.avgFisico.toFixed(1)}
              </td>
              <td className="text-center py-3 px-2">
                {player.avgActitud.toFixed(1)}
              </td>
              <td className="text-center py-3 px-2">
                {player.avgVision.toFixed(1)}
              </td>
              <td className="text-center py-3 px-2">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  {player.mvpCount}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
