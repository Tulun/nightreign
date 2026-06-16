// ─────────────────────────────────────────────────────────────────────────
//  Libra, Creature of Night — deals + per-character stat swaps.
// ─────────────────────────────────────────────────────────────────────────

export type DealCategory = "Resource" | "Power" | "Stat";

export interface LibraDeal {
  id: string;
  /** The wording Libra offers, e.g. "I want more runes". */
  prompt: string;
  /** The upside it grants. */
  effect: string;
  /** The downside / price. */
  cost: string;
  category: DealCategory;
  /** True for deals that rewrite your statline (see the Stat Swap section). */
  statSwap?: boolean;
  /** Pool of possible weapons (for the weapon deal). */
  weapons?: string[];
  /** Extra clarifying note shown under the deal. */
  note?: string;
}

export const DEAL_CATEGORIES: DealCategory[] = ["Resource", "Power"];

/** Hover-card info for an item/weapon mentioned in a deal. */
export interface ItemInfo {
  type: string;
  skill?: string;
  scaling?: string;
  /** Notable attack/guard values. */
  notable?: string;
  status?: string;
  note?: string;
}

// ── Stat-swap deal result table ─────────────────────────────────────────
// A stat-swap deal overwrites your statline with a fixed block ("more X").
// HP/FP/END here are the Vigor/Mind/Endurance attribute levels.

export type LibraStatKey = "vig" | "mnd" | "end" | "str" | "dex" | "int" | "fai" | "arc";

export type LibraStatBlock = Record<LibraStatKey, number>;

export const LIBRA_STAT_COLUMNS: { key: LibraStatKey; label: string }[] = [
  { key: "vig", label: "VIG" },
  { key: "mnd", label: "MND" },
  { key: "end", label: "END" },
  { key: "str", label: "STR" },
  { key: "dex", label: "DEX" },
  { key: "int", label: "INT" },
  { key: "fai", label: "FAI" },
  { key: "arc", label: "ARC" },
];

export interface LibraStatRow {
  label: string;
  stats: LibraStatBlock;
  /** True for derived/estimated rows (footnoted in the UI). */
  derived?: boolean;
}
