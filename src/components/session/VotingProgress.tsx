'use client';

interface VotingProgressProps {
  totalPlayers: number;
  votedCount: number;
}

export default function VotingProgress({
  totalPlayers,
  votedCount,
}: VotingProgressProps) {
  const percentage = Math.round((votedCount / totalPlayers) * 100);

  return (
    <div className="bg-blue-50 rounded-lg p-4 space-y-2">
      <div className="flex justify-between text-sm">
        <span className="font-medium">Progreso de Votación</span>
        <span>
          {votedCount} de {totalPlayers}
        </span>
      </div>
      <div className="w-full bg-gray-300 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-600">{percentage}% completado</p>
    </div>
  );
}
