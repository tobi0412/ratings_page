export function calculateOdds(
  ratings: number[],
  historicalAverage: number,
  recentRatings: number[]
) {
  if (ratings.length < 5) {
    return { over: 1.20, under: 1.20 };
  }

  // Standard deviation
  const n = ratings.length;
  const mean = historicalAverage;
  const variance = ratings.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
  const stdDev = Math.max(Math.sqrt(variance), 0.8);

  // Recent form vs overall average
  const recentMean = recentRatings.length > 0 
    ? recentRatings.reduce((sum, val) => sum + val, 0) / recentRatings.length 
    : mean;

  const z = (recentMean - mean) / stdDev;

  // Over probability estimate
  const pOver = Math.max(0.15, Math.min(0.85, 0.5 + 0.1 * z));
  const pUnder = 1 - pOver;

  // 25% House Edge: Odds = 0.75 / Probability
  const oddsOver = Math.max(1.05, Math.min(3.00, Number((0.75 / pOver).toFixed(2))));
  const oddsUnder = Math.max(1.05, Math.min(3.00, Number((0.75 / pUnder).toFixed(2))));

  return { over: oddsOver, under: oddsUnder };
}
