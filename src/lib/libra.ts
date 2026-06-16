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
}

export const DEAL_CATEGORIES: DealCategory[] = ["Resource", "Power", "Stat"];
