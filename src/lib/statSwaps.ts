// ─────────────────────────────────────────────────────────────────────────
//  Relic stat swaps — per-Nightfarer options that trade some stats for others.
//  Totals (HP/FP/Stamina) include the normal relic's bonus stats.
// ─────────────────────────────────────────────────────────────────────────

export type SwapStatKey = "hp" | "fp" | "stm" | "str" | "dex" | "int" | "fai" | "arc";

export type SwapStats = Record<SwapStatKey, number>;

export const SWAP_STAT_COLUMNS: { key: SwapStatKey; label: string }[] = [
  { key: "hp", label: "HP" },
  { key: "fp", label: "FP" },
  { key: "stm", label: "STM" },
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "int", label: "INT" },
  { key: "fai", label: "FTH" },
  { key: "arc", label: "ARC" },
];

/**
 * Scene looks for the signboard swap relics. The scene determines the relic's
 * color (and therefore which vessel slots accept it) and its icon.
 */
export type RelicScene = "burning" | "tranquil" | "drizzly" | "luminous";

export const SCENE_META: Record<RelicScene, { color: string; hex: string }> = {
  burning: { color: "Red", hex: "#a83b31" },
  tranquil: { color: "Blue", hex: "#3e6b9e" },
  drizzly: { color: "Green", hex: "#57804f" },
  luminous: { color: "Yellow", hex: "#c9a227" },
};

export interface SwapRelic {
  /** Scene look; null = in-game appearance not confirmed yet. */
  scene: RelicScene | null;
  /** Relic size; the known signboard swap relics are all Grand. */
  size?: "delicate" | "polished" | "grand";
}

/** Icon path under /public for a swap relic (generic Grand look when unknown). */
export function relicIcon(relic: SwapRelic): string {
  const size = relic.size ?? "grand";
  return `/icons/relics/${size}-${relic.scene ?? "tranquil"}-scene.png`;
}

export interface SwapOption {
  label: string;
  /** Stats WITH the swap relic equipped (as seen in-game). */
  stats: SwapStats;
  /**
   * The relic's flat bonus, in chart units (vigor→HP ×20, mind→FP ×5,
   * endurance→STM ×2; STR/DEX/INT/FTH/ARC direct). Subtracted to get the
   * relic-free default values.
   */
  bonus: Partial<SwapStats>;
  /** The signboard relic that carries this swap. */
  relic: SwapRelic;
}

export interface CharacterSwaps {
  name: string;
  /** The "Default" statline (relic-free). */
  base: SwapStats;
  /** Available swap options for this character. */
  swaps: SwapOption[];
}
