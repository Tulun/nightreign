// ─────────────────────────────────────────────────────────────────────────
//  Recluse's Magic Cocktails reference.
//
//  Each cocktail is brewed from a 3-element recipe and grouped Unholy / Holy.
//  Recipe elements reuse the affinity icons under /public/icons/elements.
// ─────────────────────────────────────────────────────────────────────────

export type Element = "magic" | "fire" | "lightning" | "holy";
export type CocktailCategory = "unholy" | "holy";

/** Recipe-element icons (the affinity icons added earlier). */
export const ELEMENT_ICON: Record<Element, string> = {
  magic: "/icons/elements/magic-affinity.png",
  fire: "/icons/elements/fire-affinity.png",
  lightning: "/icons/elements/lightning-affinity.png",
  holy: "/icons/elements/holy-affinity.png",
};

/** Canonical affinity ordering — split-icon filenames are named in this order. */
export const AFFINITY_ORDER: Element[] = ["magic", "fire", "lightning", "holy"];

/**
 * Diagonal split-affinity icon for a pair of elements. Order-independent: the
 * pair is normalised to AFFINITY_ORDER so `splitIcon("fire","magic")` and
 * `splitIcon("magic","fire")` both resolve to /split/magic-fire.png.
 */
export function splitIcon(a: Element, b: Element): string {
  const [first, second] = [a, b].sort(
    (x, y) => AFFINITY_ORDER.indexOf(x) - AFFINITY_ORDER.indexOf(y),
  );
  return `/icons/elements/split/${first}-${second}.png`;
}

interface RecipeSlot {
  src: string;
  alt: string;
  /** True for the combined diagonal icon (gets the missing-file fallback). */
  split?: boolean;
}

/**
 * The three icons shown for a cocktail's recipe. Two-affinity brews flank a
 * split icon with their pure components (e.g. Magic · Magic/Fire · Fire);
 * single-affinity brews repeat the pure icon to fill the set of three;
 * three-affinity brews already have three distinct affinities.
 */
export function recipeSlots(recipe: Element[]): RecipeSlot[] {
  if (recipe.length === 2) {
    const [a, b] = recipe;
    return [
      { src: ELEMENT_ICON[a], alt: a },
      { src: splitIcon(a, b), alt: `${a}/${b}`, split: true },
      { src: ELEMENT_ICON[b], alt: b },
    ];
  }
  if (recipe.length === 1) {
    const [a] = recipe;
    return [a, a, a].map((el) => ({ src: ELEMENT_ICON[el], alt: el }));
  }
  return recipe.map((el) => ({ src: ELEMENT_ICON[el], alt: el }));
}

export interface Cocktail {
  /** Slug, e.g. "tracking-wisp". */
  id: string;
  name: string;
  category: CocktailCategory;
  /** The three input elements, in order. */
  recipe: Element[];
  /** Short effect note, e.g. "lasts ~10s". */
  note: string;
  /** Full effect description from the in-game/community text. */
  description: string;
  /** Optional icon under /public, e.g. "/icons/cocktails/molotov.png". */
  icon?: string;
}

export const COCKTAIL_CATEGORIES: { key: CocktailCategory; label: string }[] = [
  { key: "unholy", label: "Unholy" },
  { key: "holy", label: "Holy" },
];
