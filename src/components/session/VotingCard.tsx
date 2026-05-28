"use client";

import { submitRating } from "@/actions/ratings";
import { Profile, Rating } from "@/types";
import { useState } from "react";

interface VotingCardProps {
  receiver: Profile;
  matchId: string;
  existingRating?: Rating;
  onSuccess?: () => void;
}

export default function VotingCard({
  receiver,
  matchId,
  existingRating,
  onSuccess,
}: VotingCardProps) {
  const [metrics, setMetrics] = useState({
    tecnica: existingRating?.tecnica || 5,
    fisico: existingRating?.fisico || 5,
    actitud: existingRating?.actitud || 5,
    vision_juego: existingRating?.vision_juego || 5,
  });
  const [isMvp, setIsMvp] = useState(existingRating?.is_mvp || false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const result = await submitRating({
      match_id: matchId,
      receiver_id: receiver.id,
      tecnica: metrics.tecnica,
      fisico: metrics.fisico,
      actitud: metrics.actitud,
      vision_juego: metrics.vision_juego,
      is_mvp: isMvp,
    });

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess?.();
    }
    setLoading(false);
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 space-y-4">
      <div className="flex items-center gap-3">
        {receiver.avatar_url && (
          <img
            src={receiver.avatar_url}
            alt={receiver.username}
            className="w-12 h-12 rounded-full"
          />
        )}
        <div>
          <h3 className="font-bold text-lg">{receiver.username}</h3>
        </div>
      </div>

      <div className="space-y-3">
        {(["tecnica", "fisico", "actitud", "vision_juego"] as const).map(
          (metric) => (
            <div key={metric}>
              <label className="text-sm font-medium capitalize block mb-1">
                {metric.replace("_", " ")}: {metrics[metric]}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={metrics[metric]}
                onChange={(e) =>
                  setMetrics({ ...metrics, [metric]: parseInt(e.target.value) })
                }
                className="w-full"
              />
            </div>
          ),
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={`mvp-${receiver.id}`}
          checked={isMvp}
          onChange={(e) => setIsMvp(e.target.checked)}
          className="w-4 h-4"
        />
        <label htmlFor={`mvp-${receiver.id}`} className="text-sm">
          MVP del partido
        </label>
      </div>

      {error && <div className="text-red-600 text-sm">{error}</div>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar Voto"}
      </button>
    </div>
  );
}
