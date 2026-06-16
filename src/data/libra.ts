import type { ItemInfo, LibraDeal, LibraStatBlock, LibraStatRow } from "@/lib/libra";

/**
 * ─────────────────────────────────────────────────────────────────────────
 *  LIBRA DEALS
 * ─────────────────────────────────────────────────────────────────────────
 *  Libra offers 3 random deals from this pool; you pick one or refuse.
 *  (Per-character stat swaps are a separate relic feature.)
 */

export const LIBRA_CREDIT = "Deal data from community guides (game8, fextralife)";

export const libraDeals: LibraDeal[] = [
  // ── Resource ──────────────────────────────────────────────────────────
  { id: "more-runes", prompt: "I want more runes", category: "Resource",
    effect: "Grants the Symbol of Avarice — more runes & item discovery",
    cost: "Costs 10,000 runes" },
  { id: "desire-flask", prompt: "I desire a flask", category: "Resource",
    effect: "Adds a flask charge",
    cost: "Lose 10% max HP" },
  { id: "many-levels", prompt: "I want to gain many levels", category: "Resource",
    effect: "Gain 3 levels",
    cost: "Lose 1 level each time you drink from your flask" },

  // ── Power ─────────────────────────────────────────────────────────────
  { id: "power-of-demon", prompt: "I want the power of a demon", category: "Power",
    effect: "Grants an Eye that intermittently shoots enemies (small damage + Madness buildup), or occasionally grants +10% attack for 10s",
    cost: "Builds up Madness whenever the Eye appears" },
  { id: "hold-death-at-bay", prompt: "I want to hold death at bay", category: "Power",
    effect: "When HP drops to 20% or lower, instantly heal back to full — once per battle",
    cost: "Lose 20% max HP",
    note: "Won't trigger against damage that instantly kills you from above 20% HP." },
  { id: "resistance-to-ailments", prompt: "I want resistance to ailments", category: "Power",
    effect: "Increases all Resistances by +150",
    cost: "Lose 10% Stamina" },
  { id: "fight-at-full-strength", prompt: "I wish to fight at full strength", category: "Power",
    effect: "Start the fight with +25% HP and +10% damage for 60s",
    cost: "Libra also starts with its meditation buff active, plus a +10% damage negation buff for 100s" },
  { id: "powerful-weapon", prompt: "I desire a powerful weapon", category: "Power",
    effect: "Randomly grants one weapon from the pool below",
    cost: "Lose 2 levels",
    weapons: [
      "Vyke's War Spear",
      "Black Knife",
      "Erdtree Bow",
      "Frenzied Flame Seal",
      "Fingerprint Stone Shield",
      "Miquellan Knight's Sword",
      "Ordovis's Greatsword",
      "Halo Scythe",
    ],
    note: "Passive effects are determined randomly." },
  { id: "eventual-greatness", prompt: "I wish for eventual greatness", category: "Power",
    effect: "After a 120s debuff expires, permanently gain +20% HP, FP & Stamina",
    cost: "−30% HP, FP & Stamina for 120 seconds",
    note: "Both effects are voided the moment you're brought near-death." },

];

/** Hover info for items mentioned in deals (Symbol of Avarice + weapon pool). */
export const ITEM_INFO: Record<string, ItemInfo> = {
  "Symbol of Avarice": {
    type: "Talisman",
    notable: "Item Discovery +60 · More runes from enemies +20%",
    note: "Continuous HP loss −10.",
  },
  "Vyke's War Spear": {
    type: "Great Spear", skill: "Frenzyflame Thrust", scaling: "STR B / DEX C / FAI D",
    notable: "Phy 86 · Fire 57 · Crit 100", status: "Madness (70)",
  },
  "Black Knife": {
    type: "Dagger", skill: "Blade of Death", scaling: "STR E / DEX A / FAI D",
    notable: "Phy 46 · Holy 46 · Crit 110",
  },
  "Erdtree Bow": {
    type: "Bow", skill: "Mighty Shot", scaling: "STR E / DEX A / FAI D",
    notable: "Phy 46 · Holy 26", note: "Arrow damage scales with Faith.",
  },
  "Frenzied Flame Seal": {
    type: "Sacred Seal", skill: "The Flame of Frenzy / Catch Flame", scaling: "FAI B",
    notable: "Incant. scaling 223", status: "Madness (65)",
  },
  "Fingerprint Stone Shield": {
    type: "Greatshield", skill: "Shield Bash", scaling: "STR A / DEX D",
    notable: "Guard: Phy 100 · Boost 82", status: "Madness (56)",
  },
  "Miquellan Knight's Sword": {
    type: "Straight Sword", skill: "Sacred Blade", scaling: "STR C / DEX C / FAI C",
    notable: "Phy 49 · Holy 62 · Crit 100",
  },
  "Ordovis's Greatsword": {
    type: "Greatsword", skill: "Ordovis's Vortex", scaling: "STR B / DEX C / FAI C",
    notable: "Phy 67 · Holy 67 · Crit 100",
  },
  "Halo Scythe": {
    type: "Reaper", skill: "Miquella's Ring of Light", scaling: "STR D / DEX B / FAI D",
    notable: "Phy 65 · Holy 44", status: "Hemorrhage (38)",
  },
};

export const LIBRA_STAT_NOTE =
  "All at level 15. A stat-swap deal overwrites your statline with the matching block. Undertaker & Scholar VIG/MND/END are derived from their stat totals.";

// Attribute levels: Vigor / Mind / Endurance / Str / Dex / Int / Fai / Arc.
const b = (
  vig: number, mnd: number, end: number, str: number,
  dex: number, int: number, fai: number, arc: number,
): LibraStatBlock => ({ vig, mnd, end, str, dex, int, fai, arc });

/** The fixed statline each "I wish for great ___" deal sets you to. */
export const libraSwapTargets: LibraStatRow[] = [
  { label: "more STR", stats: b(47, 6, 23, 73, 9, 3, 3, 3) },
  { label: "more DEX", stats: b(43, 10, 23, 9, 72, 3, 3, 3) },
  { label: "more INT", stats: b(33, 28, 17, 9, 9, 55, 24, 3) },
  { label: "more FAI", stats: b(33, 28, 17, 9, 9, 24, 55, 3) },
  { label: "more ARC", stats: b(41, 26, 26, 39, 39, 30, 30, 35) },
];

/** Each Nightfarer's native level-15 attribute statline. */
export const libraNativeStats: LibraStatRow[] = [
  { label: "Wylder", stats: b(52, 19, 27, 50, 40, 15, 15, 10) },
  { label: "Guardian", stats: b(60, 14, 38, 39, 29, 10, 21, 10) },
  { label: "Ironeye", stats: b(37, 14, 28, 19, 57, 7, 13, 13) },
  { label: "Duchess", stats: b(39, 27, 18, 11, 41, 42, 27, 11) },
  { label: "Raider", stats: b(56, 10, 37, 68, 19, 3, 12, 10) },
  { label: "Revenant", stats: b(35, 31, 21, 21, 21, 30, 51, 12) },
  { label: "Recluse", stats: b(33, 30, 23, 12, 19, 51, 51, 10) },
  { label: "Executor", stats: b(46, 11, 27, 25, 63, 8, 6, 28) },
  { label: "Scholar", stats: b(41, 20, 25, 14, 18, 28, 15, 50), derived: true },
  { label: "Undertaker", stats: b(48, 14, 22, 50, 13, 5, 41, 10), derived: true },
];
