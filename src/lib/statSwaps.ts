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

export interface CharacterSwaps {
  name: string;
  /** The "Default" statline. */
  base: SwapStats;
  /** Available swap options for this character. */
  swaps: { label: string; stats: SwapStats }[];
}
