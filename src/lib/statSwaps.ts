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

// Scene ⇒ color, confirmed in-game: Drizzly is BLUE and Tranquil is GREEN
// (the wiki's summaries often assume the reverse).
export const SCENE_META: Record<RelicScene, { color: string; hex: string }> = {
  burning: { color: "Red", hex: "#a83b31" },
  tranquil: { color: "Green", hex: "#57804f" },
  drizzly: { color: "Blue", hex: "#3e6b9e" },
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

// ── In-game effect text ──────────────────────────────────────────────────
// A signboard swap relic reads like any other relic in-game: the stat-swap
// line ("[Recluse] Improved Intelligence & Faith, Reduced Mind") followed by
// its two flat attribute bonuses. All three are derived from the statline so
// the wording can't drift from the numbers.

/** The attribute behind each column — vigor drives HP, mind FP, endurance stamina. */
export const ATTRIBUTE_NAME: Record<SwapStatKey, string> = {
  hp: "Vigor", fp: "Mind", stm: "Endurance", str: "Strength",
  dex: "Dexterity", int: "Intelligence", fai: "Faith", arc: "Arcane",
};

/** Chart units per attribute point (hp = vigor ×20, fp = mind ×5, stm = endurance ×2). */
export const UNITS_PER_POINT: Partial<Record<SwapStatKey, number>> = { hp: 20, fp: 5, stm: 2 };

/** Chart units → attribute points, e.g. 60 HP → 3 vigor. */
export function attributePoints(key: SwapStatKey, units: number): number {
  return units / (UNITS_PER_POINT[key] ?? 1);
}

/**
 * The swap effect's own attribute changes, in attribute points, with the
 * relic's flat bonus taken back out — what the swap line alone does.
 */
export function swapDeltas(
  character: CharacterSwaps,
  swap: SwapOption,
): { key: SwapStatKey; points: number }[] {
  return SWAP_STAT_COLUMNS.map(({ key }) => ({
    key,
    points: attributePoints(key, swap.stats[key] - (swap.bonus[key] ?? 0) - character.base[key]),
  })).filter((d) => d.points !== 0);
}

/** "Vigor" · "Vigor & Strength" · "Vigor, Endurance & Dexterity" — the game's phrasing. */
function joinAttributes(names: string[]): string {
  if (names.length < 2) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/**
 * The stat swap worded the way the game words it — the same line the Deep of
 * Night catalogue carries for this swap, e.g.
 * "[Recluse] Improved Intelligence & Faith, Reduced Mind".
 */
export function swapEffectName(character: CharacterSwaps, swap: SwapOption): string {
  const deltas = swapDeltas(character, swap);
  const up = joinAttributes(deltas.filter((d) => d.points > 0).map((d) => ATTRIBUTE_NAME[d.key]));
  const down = joinAttributes(deltas.filter((d) => d.points < 0).map((d) => ATTRIBUTE_NAME[d.key]));
  return `[${character.name}] Improved ${up}, Reduced ${down}`;
}

/** The relic's flat bonus as effect lines, e.g. ["Intelligence +3", "Faith +3"]. */
export function swapBonusEffects(swap: SwapOption): string[] {
  return SWAP_STAT_COLUMNS.filter(({ key }) => swap.bonus[key]).map(
    ({ key }) => `${ATTRIBUTE_NAME[key]} +${attributePoints(key, swap.bonus[key] ?? 0)}`,
  );
}

/** Every line a signboard swap relic shows: the swap, then its bonus stats. */
export function swapRelicEffects(character: CharacterSwaps, swap: SwapOption): string[] {
  return [swapEffectName(character, swap), ...swapBonusEffects(swap)];
}
