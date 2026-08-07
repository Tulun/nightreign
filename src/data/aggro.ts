// Enemy targeting (aggro) mechanics, datamined from EnemyCommonParam via
// Smithbox. Source: "Insights on how enemy targeting (aggro) works" on
// r/Nightreign (credit to the ?ServerName? server), 2026-08:
// https://www.reddit.com/r/Nightreign/comments/1vdcroq/insights_on_how_enemy_targeting_aggro_works/

/** Aggro generated per hit by an attack's dmgLevel (its stagger tier). */
export type DmgLevelRow = {
  level: number;
  stagger: string;
  examples?: string;
  aggro: number;
};

export const dmgLevels: DmgLevelRow[] = [
  { level: 1, stagger: "Small stagger", examples: "Light weapons", aggro: 100 },
  { level: 2, stagger: "Medium stagger", examples: "Great weapons", aggro: 300 },
  { level: 3, stagger: "Large stagger", examples: "Ultra weapons, great weapon jumping R2s, guard shockwaves", aggro: 400 },
  { level: 4, stagger: "Big launch back", aggro: 1500 },
  { level: 5, stagger: "Push", aggro: 350 },
  { level: 6, stagger: "Pancake", aggro: 800 },
  { level: 7, stagger: "Launch back", aggro: 1000 },
  { level: 8, stagger: "Minimum stagger", aggro: 100 },
  { level: 9, stagger: "Air juggle", aggro: 1000 },
  { level: 10, stagger: "Huge launch back", examples: "Ultimates", aggro: 1800 },
  { level: 11, stagger: "Flailing arms", examples: "Wave of Gold", aggro: 1500 },
];

/** Flat additions/subtractions applied on top of generated aggro. */
export type FlatModifier = { name: string; amount: string; note?: string };

export const flatModifiers: FlatModifier[] = [
  {
    name: "Less Likely to be Targeted",
    amount: "−300 / −450 / −600",
    note: "Relic effect tiers (targetPriority).",
  },
  {
    name: "Draw Aggression on Guard",
    amount: "+350",
    note: "Per guard (targetPriority).",
  },
  {
    name: "Reviving a teammate (ReviveDmg)",
    amount: "+200, then +200 every 2s for 10s",
    note: "The tick refreshes with each instance of revive healing.",
  },
];

/** Flat aggro from simply being near the enemy. */
export const distanceAggro = [
  { range: "Within 10m", aggro: 150 },
  { range: "Within 20m", aggro: 60 },
  { range: "Within 30m", aggro: 30 },
];

/**
 * The longer an enemy stays on one target, the more aggro it takes from the
 * other two Nightfarers.
 */
export const offTargetMultipliers = [
  { after: "5s on the same target", multiplier: "2×" },
  { after: "11s on the same target", multiplier: "4×" },
  { after: "15s on the same target", multiplier: "10×" },
];

export const AGGRO_CREDIT =
  "Datamined from EnemyCommonParam (Smithbox). Findings by the ?ServerName? community, shared on r/Nightreign.";

export const AGGRO_SOURCE_URL =
  "https://www.reddit.com/r/Nightreign/comments/1vdcroq/insights_on_how_enemy_targeting_aggro_works/";
