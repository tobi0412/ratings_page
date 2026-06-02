import { HistoricalRating } from "@/types";

export interface PlayerSessionComparison {
  avgTotalChange: number | null;
  avgTecnicaChange: number | null;
  avgFisicoChange: number | null;
  avgActitudChange: number | null;
  avgVisionChange: number | null;
}

export type SessionComparisonsMap = {
  [playerId: string]: PlayerSessionComparison;
};

export function calculateSessionComparisons(
  ratings: HistoricalRating[]
): SessionComparisonsMap {
  const playerRatingsMap: { [playerId: string]: HistoricalRating[] } = {};

  // Group ratings by player
  ratings.forEach((r) => {
    if (!playerRatingsMap[r.player_id]) {
      playerRatingsMap[r.player_id] = [];
    }
    playerRatingsMap[r.player_id].push(r);
  });

  const comparisons: SessionComparisonsMap = {};

  Object.entries(playerRatingsMap).forEach(([playerId, playerRatings]) => {
    // Sort in chronological order (oldest first)
    const sorted = [...playerRatings].sort(
      (a, b) => new Date(a.computed_at).getTime() - new Date(b.computed_at).getTime()
    );

    if (sorted.length < 2) {
      // Less than 2 ratings means no comparison is possible
      comparisons[playerId] = {
        avgTotalChange: null,
        avgTecnicaChange: null,
        avgFisicoChange: null,
        avgActitudChange: null,
        avgVisionChange: null,
      };
      return;
    }

    const latest = sorted[sorted.length - 1];
    const prev = sorted[sorted.length - 2];

    const getPctChange = (latestVal: number | null, prevVal: number | null): number | null => {
      if (latestVal === null || prevVal === null || prevVal === 0) {
        return null;
      }
      return ((latestVal - prevVal) / prevVal) * 100;
    };

    comparisons[playerId] = {
      avgTotalChange: getPctChange(latest.avg_total, prev.avg_total),
      avgTecnicaChange: getPctChange(latest.avg_tecnica, prev.avg_tecnica),
      avgFisicoChange: getPctChange(latest.avg_fisico, prev.avg_fisico),
      avgActitudChange: getPctChange(latest.avg_actitud, prev.avg_actitud),
      avgVisionChange: getPctChange(latest.avg_vision_juego, prev.avg_vision_juego),
    };
  });

  return comparisons;
}
