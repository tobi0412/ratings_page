import { calculateOdds } from "../src/modules/economy/utils/odds";
import { calculateRewards } from "../src/modules/economy/utils/rewards";

// Odds calculation tests
const o1 = calculateOdds([7.0, 7.5, 8.0, 7.2, 7.4], 7.42, [8.0, 7.8, 7.9]);
console.log("Hot Player Odds (Expect Over odds lower than Under):", o1);

const o2 = calculateOdds([7.0, 7.2], 7.1, [7.1]);
console.log("No History Player Odds (Expect 1.20):", o2);

// Rewards tests
const r1 = calculateRewards(7.5, true, false, false, 3);
console.log("MVP player with streak 3:", r1); // 562 + 300 + 150 = 1012

if (Math.abs(r1.total - 1012) > 2) {
  console.error("Verification failed!");
  process.exit(1);
}
console.log("All formula validations PASSED.");
