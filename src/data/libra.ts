import type { LibraDeal } from "@/lib/libra";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  LIBRA DEALS
 * ─────────────────────────────────────────────────────────────────────────
 *  Compiled from community guides. Libra offers 3 random deals from this pool;
 *  you pick one or refuse. Verify wording/effects — some numbers aren't
 *  documented. (Per-character stat swaps are a separate relic feature.)
 */

export const LIBRA_CREDIT = "Deal data from community guides (game8, fextralife)";

export const libraDeals: LibraDeal[] = [
  // ── Resource ──────────────────────────────────────────────────────────
  { id: "more-runes", prompt: "I want more runes", category: "Resource",
    effect: "Grants the Symbol of Avarice — more runes & item discovery",
    cost: "Drains HP" },
  { id: "desire-flask", prompt: "I desire a flask", category: "Resource",
    effect: "Adds one healing flask charge",
    cost: "Lowers maximum HP" },
  { id: "many-levels", prompt: "I want to gain many levels", category: "Resource",
    effect: "Grants several levels",
    cost: "Lose one level each time you use a flask" },

  // ── Power ─────────────────────────────────────────────────────────────
  { id: "power-of-demon", prompt: "I want the power of a demon", category: "Power",
    effect: "Random combat bonuses at intervals",
    cost: "Builds up Madness" },
  { id: "hold-death-at-bay", prompt: "I want to hold death at bay", category: "Power",
    effect: "Fully restores HP when HP runs low",
    cost: "Lowers maximum HP" },
  { id: "powerful-weapon", prompt: "I desire a powerful weapon", category: "Power",
    effect: "Grants an Epic-tier weapon",
    cost: "Costs 2 character levels" },

  // ── Stat ──────────────────────────────────────────────────────────────
  { id: "eventual-greatness", prompt: "I wish for eventual greatness", category: "Stat",
    effect: "A large delayed power boost",
    cost: "Halves max HP, FP & Stamina until the end of the day" },
  { id: "great-strength", prompt: "I wish to have great strength", category: "Stat",
    effect: "Raises Strength", statSwap: true, cost: "Trades other stats away" },
  { id: "great-dexterity", prompt: "I wish to have great dexterity", category: "Stat",
    effect: "Raises Dexterity", statSwap: true, cost: "Trades other stats away" },
  { id: "expand-intellect", prompt: "I wish to expand my intellect", category: "Stat",
    effect: "Raises Intelligence", statSwap: true, cost: "Trades other stats away" },
  { id: "deep-faith", prompt: "I wish to have deep faith", category: "Stat",
    effect: "Raises Faith", statSwap: true, cost: "Trades other stats away" },
  { id: "great-arcane", prompt: "I wish to have great arcane", category: "Stat",
    effect: "Raises Arcane", statSwap: true, cost: "Trades other stats away" },
];
