export function calculateRewards(
  avgTotal: number,
  isMvp: boolean,
  isPoop: boolean,
  isBigpaper: boolean,
  streak: number
) {
  // 1. Performance Reward
  const ccPerformance = Math.floor(Math.pow(avgTotal, 2) * 10);

  // 2. Awards
  let ccAwards = 0;
  if (isMvp) ccAwards += 300;
  if (isPoop || isBigpaper) ccAwards -= 100;

  // 3. Attendance streak (capped at 250 CC)
  const ccStreak = Math.min(250, streak * 50);

  return {
    performance: ccPerformance,
    awards: ccAwards,
    streak: ccStreak,
    total: ccPerformance + ccAwards + ccStreak,
  };
}
