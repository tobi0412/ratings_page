'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { HistoricalRating, MatchSession, Profile } from '@/types';

interface RatingEvolutionChartProps {
  sessions: MatchSession[];
  ratings: HistoricalRating[];
  players: Profile[];
}

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#10b981',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

export default function RatingEvolutionChart({
  sessions,
  ratings,
  players,
}: RatingEvolutionChartProps) {
  // Transform data for chart
  const chartData = sessions.map((session) => {
    const dataPoint: any = { name: session.name };

    players.forEach((player) => {
      const rating = ratings.find(
        (r) => r.player_id === player.id && r.match_id === session.id
      );
      dataPoint[player.id] = rating?.avg_total || 0;
    });

    return dataPoint;
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">Evolución de Ratings</h3>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 10]} />
          <Tooltip />
          <Legend />
          {players.map((player, index) => (
            <Line
              key={player.id}
              type="monotone"
              dataKey={player.id}
              stroke={COLORS[index % COLORS.length]}
              name={player.username}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
